import Button from "@components/Button";
import DropdownMenu from "@components/DropdownMenu";
import InputWithChip from "@components/InputWithChip";
import { ProcessMap } from "@lib/AppType";
import { Area, SensoryType } from "@lib/sectionDataType";
import { SectionImage } from "@lib/sectionImageType";
import { Section } from "@lib/sectionType";
import { Venue } from "@lib/venueType";
import { homeReducer, initialHomeState } from "@reducer/Home";
import {
  generateContent,
  getPrompts,
  getSection,
  getSectionData,
  getSectionImages,
  getVenues,
  renameSectionFolder,
  saveContent,
  updatePrompt,
  uploadImages,
} from "@utils/api";
import {
  CACHE_PATHS,
  handleCacheUpdate,
  readCache,
  writeCache,
} from "@utils/cache";
import { BATCH_SIZE, MAX_RETRIES, RETRY_DELAY_MS } from "@utils/constant";
import debounce from "lodash/debounce";
import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { StyleSheet, ToastAndroid } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Content from "./Content";
import GenerateContent from "./GenerateContent";
import ImageList from "./ImageList";
import ModificationModal from "./ModificationModal";
import Prompt from "./Prompt";

const Home = ({ isOnline }: { isOnline: boolean }) => {
  const [state, dispatch] = useReducer(homeReducer, initialHomeState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMounted = useRef(true);
  const activeRequests = useRef(new Map<string, AbortController>());

  useEffect(() => {
    return () => {
      isMounted.current = false;
      activeRequests.current.forEach((controller) => controller.abort());
      activeRequests.current.clear();
    };
  }, []);

  const {
    venue,
    section,
    venues,
    sections,
    sectionImages,
    sectionData,
    loading,
    prompt,
  } = state;

  const fetchData = useCallback(
    async <T,>({
      onlineFetch,
      cachePath,
      offlineCachePath,
      type,
      shouldFetchOnline,
      requestId,
    }: {
      onlineFetch: (signal?: AbortSignal) => Promise<T>;
      cachePath: string;
      offlineCachePath: string;
      type: "venues" | "sections" | "images" | "data";
      shouldFetchOnline: boolean;
      requestId: string;
    }) => {
      if (!isMounted.current) return;
      if (activeRequests.current.has(requestId)) {
        activeRequests.current.get(requestId)?.abort();
      }

      dispatch({ type: "SET_LOADING", payload: { [type]: true } });

      const controller = new AbortController();
      activeRequests.current.set(requestId, controller);

      try {
        let serverData: T = [] as T;
        if (shouldFetchOnline && isOnline) {
          serverData = await onlineFetch(controller.signal);
          if (controller.signal.aborted) {
            throw new Error("AbortError");
          }

          if (isMounted.current) {
            await writeCache(cachePath, serverData);
          }
        } else {
          const cached = await readCache<T>(cachePath);
          serverData = cached || ([] as T);
        }

        if (!isMounted.current || controller.signal.aborted) return;

        let offlineData: T = [] as T;
        if (offlineCachePath) {
          const offline = await readCache<T>(offlineCachePath);
          offlineData = offline || ([] as T);
        }

        if (!isMounted.current || controller.signal.aborted) return;

        if (Array.isArray(serverData) || Array.isArray(offlineData)) {
          switch (type) {
            case "venues":
              const venuesMergedData = [
                ...(Array.isArray(serverData) ? serverData : []),
                ...(Array.isArray(offlineData)
                  ? (offlineData as any[]).map((item: any) => ({
                    ...item,
                    isNew: false,
                  }))
                  : []),
              ];
              dispatch({
                type: "SET_VENUES",
                payload: venuesMergedData as Venue[],
              });
              break;
            case "sections":
              const sectionMergedData = new Map<string, Section>();

              if (Array.isArray(serverData)) {
                serverData.forEach((section) =>
                  sectionMergedData.set(section.value, section)
                );
              }

              if (Array.isArray(offlineData)) {
                offlineData.forEach((section) =>
                  sectionMergedData.set(section.value, { ...section, isNew: false })
                );
              }

              dispatch({
                type: "SET_SECTIONS",
                payload: Array.from(sectionMergedData.values()) as Section[],
              });
              break;
            case "images":
              const imagesMergedData = [
                ...(Array.isArray(serverData) ? serverData : []),
                ...(Array.isArray(offlineData)
                  ? (offlineData as any[]).map((item: any) => ({
                    ...item,
                    isNew: false,
                  }))
                  : []),
              ];
              dispatch({
                type: "SET_SECTION_IMAGES",
                payload: imagesMergedData as SectionImage[],
              });
              break;
            case "data":
              const dataMergedData = [
                {
                  ...(Array.isArray(serverData) ? serverData[0] : []),
                  ...(Array.isArray(offlineData) ? offlineData[0] : []),
                },
              ];
              dispatch({
                type: "SET_SECTION_DATA",
                payload: dataMergedData as Area[],
              });
              break;
          }
        }
      } catch (error) {
        if (!isMounted.current) return;
        console.error(`Failed to fetch ${type}:`, error);
        ToastAndroid.show(
          `Failed to load ${type}. Please try again.`,
          ToastAndroid.SHORT
        );
      } finally {
        if (isMounted.current) {
          dispatch({ type: "SET_LOADING", payload: { [type]: false } });
          activeRequests.current.delete(requestId);
        }
      }
    },
    [isOnline]
  );

  const fetchVenues = useCallback(() => {
    return fetchData<Venue[]>({
      onlineFetch: () => getVenues(),
      cachePath: CACHE_PATHS.VENUES,
      offlineCachePath: CACHE_PATHS.OFFLINE_VENUES,
      type: "venues",
      shouldFetchOnline: true,
      requestId: "venues",
    });
  }, [fetchData]);

  const fetchSection = useCallback(
    (id: string, status?: ProcessMap) => {
      return fetchData<Section[]>({
        onlineFetch: (signal) => getSection({ id }, signal),
        cachePath: CACHE_PATHS.SECTIONS(id),
        offlineCachePath: CACHE_PATHS.OFFLINE_SECTIONS(id),
        type: "sections",
        shouldFetchOnline: status !== "incomplete",
        requestId: `sections-${id}`,
      });
    },
    [fetchData]
  );

  const fetchSectionImage = useCallback(
    (
      venueId: string,
      sectionLabel: string,
      sectionValue: string,
      status?: ProcessMap
    ) => {
      return fetchData<SectionImage[]>({
        onlineFetch: (signal) =>
          getSectionImages({ venueId, sectionName: sectionLabel }, signal),
        cachePath: CACHE_PATHS.IMAGES(venueId, sectionValue),
        offlineCachePath: CACHE_PATHS.OFFLINE_IMAGES(venueId, sectionValue),
        type: "images",
        shouldFetchOnline: status !== "incomplete",
        requestId: `images-${venueId}-${sectionValue}`,
      });
    },
    [fetchData]
  );

  const fetchSectionData = useCallback(
    (
      venueId: string,
      sectionLabel: string,
      sectionValue: string,
      status?: ProcessMap
    ) => {
      return fetchData<Area[]>({
        onlineFetch: (signal) =>
          getSectionData({ venueId, sectionName: sectionLabel }, signal),
        cachePath: CACHE_PATHS.DATA(venueId, sectionValue),
        offlineCachePath: CACHE_PATHS.OFFLINE_DATA(venueId, sectionValue),
        type: "data",
        shouldFetchOnline: status !== "incomplete",
        requestId: `data-${venueId}-${sectionValue}`,
      });
    },
    [fetchData]
  );

  const fetchPrompt = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: { prompt: true } });

    const controller = new AbortController();
    activeRequests.current.set("prompt", controller);

    try {
      const response = await getPrompts(controller.signal);

      if (isMounted.current) {
        dispatch({ type: "SET_PROMPT", payload: response });
      }
    } catch (error) {
      if (isMounted.current) {
        console.error(`Failed to update prompt:`, error);
      }
    } finally {
      if (isMounted.current) {
        dispatch({ type: "SET_LOADING", payload: { prompt: false } });
        activeRequests.current.delete("prompt");
      }
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const selectVenueHandler = useCallback(
    (newVenue: Venue | null) => {
      activeRequests.current.forEach((c, key) => {
        if (
          key.startsWith("sections-") ||
          key.startsWith("images-") ||
          key.startsWith("data-")
        ) {
          c.abort();
        }
      });

      dispatch({ type: "SET_SELECTED_VENUE", payload: newVenue });
      dispatch({ type: "SET_SELECTED_SECTION", payload: null });
      dispatch({ type: "SET_SECTION_IMAGES", payload: [] });
      dispatch({ type: "SET_SECTION_DATA", payload: [] });

      if (!newVenue?.isNew && newVenue?.value) {
        fetchSection(newVenue.value, newVenue.status);
      } else if (newVenue?.isNew) {
        const newSection: Section = {
          value: `new-${Date.now()}`,
          label: "1",
          isNew: true,
          status: "incomplete",
        };
        dispatch({ type: "SET_SECTIONS", payload: [newSection] });
        dispatch({ type: "SET_SELECTED_SECTION", payload: newSection });
        handleCacheUpdate(CACHE_PATHS.OFFLINE_VENUES, [newVenue]);
      }
    },
    [fetchSection]
  );

  const selectSectionHandler = useCallback(
    (newSection: Section | null) => {
      dispatch({ type: "SET_SELECTED_SECTION", payload: newSection });
      dispatch({ type: "SET_SECTION_DATA", payload: [] });
      dispatch({ type: "SET_SECTION_IMAGES", payload: [] });

      if (
        venue?.value &&
        newSection?.label &&
        newSection?.value &&
        newSection.label.length >= 1
      ) {
        const venueId = venue.value;
        const sectionLabel = newSection.label;
        const sectionValue = newSection.value;

        fetchSectionImage(
          venueId,
          sectionLabel,
          sectionValue,
          newSection?.status
        );
        fetchSectionData(
          venueId,
          sectionLabel,
          sectionValue,
          newSection?.status
        );
      }
    },
    [venue?.value, fetchSectionImage, fetchSectionData]
  );

  const onVenueChange = useCallback((items: Venue[]) => {
    dispatch({ type: "SET_VENUES", payload: items });
  }, []);

  const onSectionChange = useCallback(
    debounce((sections: Section[], section?: Section) => {
      dispatch({ type: "SET_SECTIONS", payload: sections });
      if (section) {
        dispatch({ type: "SET_SELECTED_SECTION", payload: section });
        if (!section?.isNew && !section?.value.includes("new-")) {
          handleRenameFolder(section);
        }
      }
      if (venue?.value) {
        writeCache(CACHE_PATHS.OFFLINE_SECTIONS(venue.value), sections);
      }
    }, 500),
    [venue?.value]
  );

  const handleRenameFolder = useCallback(
    async (section?: Section) => {
      const controller = new AbortController();
      activeRequests.current.set("rename-folder", controller);

      try {
        const response = await renameSectionFolder(
          {
            newName: section?.label ?? "",
            folderId: section?.value ?? "",
            completedForm: JSON.stringify({
              areas: sectionData,
              venueName: venue?.value ?? "",
              prompt: prompt,
            }),
          },
          controller.signal
        );

        if (isMounted.current) {
          ToastAndroid.show(response, ToastAndroid.SHORT);
        }
      } catch (error) {
        if (isMounted.current) {
          console.error(`Failed to update folder name:`, error);
        }
      } finally {
        if (isMounted.current) {
          activeRequests.current.delete("save-content");
        }
      }
    },

    [venue, sectionData, prompt]
  );

  const handleModalToggle = useCallback(
    () => setIsModalOpen((prev) => !prev),
    []
  );

  const handlePromptUpdate = useCallback(
    async (newPrompt: string) => {
      if (newPrompt === prompt) {
        ToastAndroid.show(
          "Please change prompt before updating prompt",
          ToastAndroid.LONG
        );
        return;
      }

      dispatch({ type: "SET_LOADING", payload: { prompt: true } });

      const controller = new AbortController();
      activeRequests.current.set("update-prompt", controller);

      try {
        const response = await updatePrompt(prompt, controller.signal);

        if (isMounted.current) {
          ToastAndroid.show(response, ToastAndroid.SHORT);
          dispatch({ type: "SET_PROMPT", payload: newPrompt });
        }
      } catch (error) {
        if (isMounted.current) {
          console.error(`Failed to update prompt:`, error);
        }
      } finally {
        if (isMounted.current) {
          dispatch({ type: "SET_LOADING", payload: { prompt: false } });
          activeRequests.current.delete("update-prompt");
        }
      }
    },
    [prompt]
  );

  const setAdditionalInfo = useCallback(
    (additionalInfo: string) =>
      dispatch({
        type: "UPDATE_SECTION_DATA",
        payload: {
          key: "promptInput",
          value: additionalInfo,
        },
      }),
    []
  );

  const handleContentDelete = useCallback(
    (sensoryType: SensoryType, index: number) =>
      dispatch({ type: "DELETE_ITEM", payload: { sensoryType, index } }),
    []
  );

  const handleContentAdd = useCallback(
    (sensoryType: SensoryType) =>
      dispatch({ type: "ADD_ITEM", payload: sensoryType }),
    []
  );

  const handleContentUpdate = useCallback(
    (sensoryType: SensoryType, value: string, index: number) =>
      dispatch({ type: "UPDATE_ITEM", payload: { sensoryType, value, index } }),
    []
  );

  const handleUploadImages = useCallback(async () => {
    const pendingImages = sectionImages
      .map(({ path, type, status }, index) => ({ path, type, status, index }))
      .filter(({ status }) => status === "pending");

    if (pendingImages.length === 0) {
      ToastAndroid.show("No pending images to upload", ToastAndroid.SHORT);
      return;
    }

    dispatch({
      type: "UPDATE_SECTION_DATA",
      payload: { key: "sectionId", value: section?.value },
    });

    dispatch({ type: "SET_LOADING", payload: { uploadImage: true } });
    ToastAndroid.show(
      `Uploading ${pendingImages.length} images...`,
      ToastAndroid.SHORT
    );

    const controller = new AbortController();
    const requestId = `upload-${Date.now()}`;
    activeRequests.current.set(requestId, controller);

    try {
      let successCount = 0;
      for (let i = 0; i < pendingImages.length; i++) {
        const { path, type, index } = pendingImages[i];
        const success = await processImage(
          path,
          type,
          index,
          controller.signal
        );

        if (success) successCount++;

        if ((i + 1) % BATCH_SIZE === 0 || i === pendingImages.length - 1) {
          ToastAndroid.show(
            `Uploaded ${successCount} of ${pendingImages.length} images...`,
            ToastAndroid.SHORT
          );
        }
      }

      ToastAndroid.show("Image upload complete", ToastAndroid.SHORT);
    } catch (error) {
      console.error("Image upload error:", error);
    } finally {
      if (isMounted.current) {
        dispatch({ type: "SET_LOADING", payload: { uploadImage: false } });

        if (venue?.value && section?.label) {
          try {
            const offlineSectionPath = CACHE_PATHS.OFFLINE_SECTIONS(venue.value)
            const offlineImagePath = CACHE_PATHS.OFFLINE_IMAGES(
              venue.value,
              section.value
            );
            const offlineDataPath = CACHE_PATHS.OFFLINE_DATA(
              venue.value,
              section.value
            );

            const updatedSections: Section[] = [];
            const filteredSections: Section[] = [];
            sections?.forEach((s) => {
              if (s.label === section.label) {
                updatedSections.push({ ...s, status: "processed" });
              } else {
                updatedSections.push(s);
                filteredSections.push(s);
              }
            });
            dispatch({ type: "SET_SECTIONS", payload: updatedSections });
            writeCache(offlineSectionPath, filteredSections);
            writeCache(offlineDataPath, []);
            writeCache(offlineImagePath, []);
            console.info("Cleared offline cache after successful uploads");
          } catch (cacheError) {
            console.error("Error clearing offline cache:", cacheError);
          }
        }
        activeRequests.current.delete(requestId);
      }
    }
  }, [sectionImages, venue, section, sections]);

  const processImage = async (
    path: string,
    type: string,
    index: number,
    signal: AbortSignal
  ): Promise<boolean> => {
    if (!isMounted.current || signal.aborted) {
      return false;
    }

    dispatch({
      type: "UPDATE_IMAGE_STATUS",
      payload: { index, status: "uploading" },
    });

    let retries = 0;
    let success = false;
    let error;

    while (
      retries <= MAX_RETRIES &&
      !success &&
      !signal.aborted &&
      isMounted.current
    ) {
      try {
        const fileData = {
          uri: path,
          name: `${index + 1}.jpg`,
          type: type,
        };

        await uploadImages(
          {
            image: fileData,
            sectionName: section?.label ?? "",
            venueName: venue?.label ?? "",
            completedForm: {
              areas: sectionData,
              venueName: venue?.value ?? "",
              prompt: prompt,
            },
          },
          signal
        );

        if (isMounted.current && !signal.aborted) {
          dispatch({
            type: "UPDATE_IMAGE_STATUS",
            payload: { index, status: "success" },
          });
          success = true;
        }
      } catch (err) {
        error = err;
        retries++;

        if (isMounted.current && !signal.aborted) {
          if (retries > MAX_RETRIES) {
            console.error(
              `Failed to upload image ${index} after ${MAX_RETRIES} retries:`,
              error
            );
            dispatch({
              type: "UPDATE_IMAGE_STATUS",
              payload: { index, status: "failed" },
            });
          } else {
            const backoffDelay = Math.min(
              RETRY_DELAY_MS * Math.pow(2, retries - 1),
              30000
            );
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          }
        }
      }
    }

    return success;
  };

  const handleDescriptionUpdate = useCallback(
    (description: string) =>
      dispatch({
        type: "UPDATE_SECTION_DATA",
        payload: {
          key: "description",
          value: description,
        },
      }),
    []
  );

  const handleSaveImage = useCallback(
    async (images: SectionImage[], shadow: boolean[], hero: boolean[]) => {
      try {
        dispatch({ type: "SET_LOADING", payload: { saveImage: true } });
        const uniqueImages = images.filter(
          (newImage) =>
            !sectionImages.some(
              (existingImage) =>
                existingImage.id === newImage.id &&
                existingImage.status !== "pending"
            )
        );

        const newSectionData = [
          {
            ...sectionData[0],
            shadowCorrections: shadow,
            heroImages: hero,
          },
        ];

        dispatch({ type: "SET_SECTION_IMAGES", payload: images });
        dispatch({
          type: "UPDATE_SECTION_DATA",
          payload: {
            key: "shadowCorrections",
            value: shadow,
          },
        });
        dispatch({
          type: "UPDATE_SECTION_DATA",
          payload: {
            key: "heroImages",
            value: hero,
          },
        });
        if (venue?.value && section?.value && uniqueImages.length > 0) {
          await writeCache(
            CACHE_PATHS.OFFLINE_IMAGES(venue?.value, section?.value),
            uniqueImages
          );
          await writeCache(
            CACHE_PATHS.OFFLINE_DATA(venue?.value, section?.value),
            newSectionData
          );
        }
        ToastAndroid.show("Images saved successfully", ToastAndroid.SHORT);
      } catch (error) {
        console.error("Error in handleSaveImage:", error);
        ToastAndroid.show("Failed to save images", ToastAndroid.SHORT);
      } finally {
        dispatch({ type: "SET_LOADING", payload: { saveImage: false } });
      }
    },
    [sectionImages, sectionData, venue, section]
  );

  const handleGenerateContent = useCallback(async () => {
    if (sectionImages.length === 0) {
      ToastAndroid.show(
        "Please add images before generating content",
        ToastAndroid.LONG
      );
      return;
    }

    dispatch({ type: "SET_LOADING", payload: { content: true } });
    ToastAndroid.show("Generating content...", ToastAndroid.SHORT);

    const controller = new AbortController();
    activeRequests.current.set("generate-content", controller);

    try {
      const response = await generateContent(
        {
          files: sectionImages,
          userPrompt: sectionData[0]?.promptInput || "",
        },
        controller.signal
      );

      if (isMounted.current) {
        dispatch({
          type: "SET_SECTION_DATA",
          payload: [
            {
              ...sectionData[0],
              ...response,
            },
          ],
        });
        ToastAndroid.show("Content generated successfully", ToastAndroid.SHORT);
      }
    } catch (error) {
      if (isMounted.current) {
        console.error(`Failed to generate content:`, error);
        ToastAndroid.show(
          "Failed to generate content. Please try again.",
          ToastAndroid.LONG
        );
      }
    } finally {
      if (isMounted.current) {
        dispatch({ type: "SET_LOADING", payload: { content: false } });
        activeRequests.current.delete("generate-content");
      }
    }
  }, [sectionImages, sectionData, isOnline]);

  const handleSaveContent = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: { content: true } });

    const controller = new AbortController();
    activeRequests.current.set("save-content", controller);

    try {
      const response = await saveContent(
        {
          sectionName: section?.label ?? "",
          venueName: venue?.label ?? "",
          completedForm: JSON.stringify({
            areas: sectionData,
            venueName: venue?.value ?? "",
            prompt: prompt,
          }),
          promptInput: sectionData[0]?.promptInput ?? "",
          sensoryData: JSON.stringify(sectionData[0]),
        },
        controller.signal
      );

      if (isMounted.current) {
        ToastAndroid.show(response, ToastAndroid.SHORT);
      }
    } catch (error) {
      if (isMounted.current) {
        console.error(`Failed to update prompt:`, error);
      }
    } finally {
      if (isMounted.current) {
        dispatch({ type: "SET_LOADING", payload: { content: false } });
        activeRequests.current.delete("save-content");
      }
    }
  }, [section, venue, sectionData, prompt]);

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      contentContainerStyle={styles.container}
    >
      <DropdownMenu
        initialItem={venues}
        loading={loading.venues}
        onChange={onVenueChange}
        selectedItem={venue}
        setSelectedItem={selectVenueHandler}
      />
      <InputWithChip
        initialChips={sections}
        loading={loading.sections}
        onChange={onSectionChange}
        selectedChip={section}
        setSelectedChip={selectSectionHandler}
      />
      <ImageList data={sectionImages} loading={loading.images} />
      <Button
        onPress={handleModalToggle}
        title={"Add / Rearrange / Modify Images"}
        isLoading={loading.saveImage}
        shouldVisible={!!section?.value}
      />
      <Button
        onPress={handleUploadImages}
        title={"Upload Images"}
        isLoading={loading.uploadImage}
        isOnline={isOnline}
        shouldVisible={!!section?.value}
      />
      <GenerateContent
        isVisible={sectionImages.length > 0}
        data={sectionData[0]?.promptInput}
        setAdditionalInfo={setAdditionalInfo}
        generateContent={handleGenerateContent}
        loading={loading.content}
        isOnline={isOnline}
      />
      <Prompt
        data={prompt}
        getPrompt={fetchPrompt}
        loading={loading.prompt}
        updatePrompt={handlePromptUpdate}
        isOnline={isOnline}
      />
      <Content
        data={sectionData}
        loading={loading.data}
        onDelete={handleContentDelete}
        onAdd={handleContentAdd}
        onUpdate={handleContentUpdate}
        onDescriptionUpdate={handleDescriptionUpdate}
      />
      <Button
        onPress={handleSaveContent}
        title={"Save Content & Process Images"}
        isLoading={loading.content}
        isOnline={isOnline}
        shouldVisible={!!sectionData[0]?.description}
      />
      <ModificationModal
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        data={sectionImages}
        onSaved={handleSaveImage}
        shadow={sectionData[0]?.shadowCorrections ?? []}
        hero={sectionData[0]?.heroImages ?? []}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 66,
  },
});

export default React.memo(Home);
