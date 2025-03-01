import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { StyleSheet, ToastAndroid } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Button from "../components/Button";
import DropdownMenu from "../components/DropdownMenu";
import InputWithChip from "../components/InputWithChip";
import { Area, SensoryType } from "../lib/sectionDataType";
import { SectionImage } from "../lib/sectionImageType";
import { Section } from "../lib/sectionType";
import { Venue } from "../lib/venueType";
import { initialState, reducer } from "../reducer";
import {
  generateContent,
  getPrompts,
  getSection,
  getSectionData,
  getSectionImages,
  getVenues,
  saveContent,
  updatePrompt,
  uploadImages,
} from "../utils/api";
import { CACHE_PATHS, readCache, writeCache } from "../utils/cache";
import Content from "./Content";
import GenerateContent from "./GenerateContent";
import ImageList from "./ImageList";
import ModificationModal from "./ModificationModal";
import Prompt from "./Prompt";

const BATCH_SIZE = 3;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

const Home = ({ isOnline }: { isOnline: boolean }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const abortControllers = useRef<AbortController[]>([]);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      abortControllers.current.forEach((controller) => controller.abort());
      abortControllers.current = [];
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
  } = useMemo(() => state, [state]);

  const fetchData = useCallback(
    async <T,>({
      onlineFetch,
      cachePath,
      offlineCachePath,
      type,
    }: {
      onlineFetch: (signal?: AbortSignal) => Promise<T>;
      cachePath: string;
      offlineCachePath?: string;
      type: "venues" | "sections" | "images" | "data";
    }) => {
      if (!isMounted.current) return;
      dispatch({ type: "SET_LOADING", payload: { [type]: true } });

      const controller = new AbortController();
      abortControllers.current.push(controller);

      try {
        let serverData: T = [] as T;
        if (isOnline) {
          serverData = await onlineFetch(controller.signal);
          await writeCache(cachePath, serverData);
        } else {
          const cached = await readCache<T>(cachePath);
          serverData = cached || ([] as T);
        }

        let offlineData: T = [] as T;
        if (offlineCachePath) {
          const offline = await readCache<T>(offlineCachePath);
          offlineData = offline || ([] as T);
        }
        if (!isMounted.current) return;

        if (Array.isArray(serverData) || Array.isArray(offlineData)) {
          const mergedData = [
            ...(Array.isArray(serverData) ? serverData : []),
            ...(Array.isArray(offlineData)
              ? (offlineData as any[]).map((item: any) => ({
                  ...item,
                  isOnline: false,
                }))
              : []),
          ];

          switch (type) {
            case "venues":
              dispatch({ type: "SET_VENUES", payload: mergedData as Venue[] });
              break;
            case "sections":
              dispatch({
                type: "SET_SECTIONS",
                payload: mergedData as Section[],
              });
              break;
            case "images":
              dispatch({
                type: "SET_SECTION_IMAGES",
                payload: mergedData as SectionImage[],
              });
              break;
            case "data":
              dispatch({
                type: "SET_SECTION_DATA",
                payload: mergedData as Area[],
              });
              break;
          }
        }
      } catch (error) {
        if (!isMounted.current) return;
        if (!(error instanceof Error && error.name === "AbortError")) {
          console.error(`Failed to fetch ${type}:`, error);
        }
      } finally {
        if (isMounted.current) {
          dispatch({ type: "SET_LOADING", payload: { [type]: false } });
          abortControllers.current = abortControllers.current.filter(
            (c) => c !== controller
          );
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
    });
  }, [fetchData]);

  const fetchSection = useCallback(
    (id: string) => {
      return fetchData<Section[]>({
        onlineFetch: (signal) => getSection({ id }, signal),
        cachePath: CACHE_PATHS.SECTIONS(id),
        offlineCachePath: CACHE_PATHS.OFFLINE_SECTIONS(id),
        type: "sections",
      });
    },
    [fetchData]
  );

  const fetchSectionImage = useCallback(
    (venueId: string, sectionLabel: string) => {
      return fetchData<SectionImage[]>({
        onlineFetch: (signal) =>
          getSectionImages({ venueId, sectionName: sectionLabel }, signal),
        cachePath: CACHE_PATHS.IMAGES(venueId, sectionLabel),
        offlineCachePath: CACHE_PATHS.OFFLINE_IMAGES(venueId, sectionLabel),
        type: "images",
      });
    },
    [fetchData]
  );

  const fetchSectionData = useCallback(
    (venueId: string, sectionLabel: string) => {
      return fetchData<Area[]>({
        onlineFetch: (signal) =>
          getSectionData({ venueId, sectionName: sectionLabel }, signal),
        cachePath: CACHE_PATHS.DATA(venueId, sectionLabel),
        offlineCachePath: CACHE_PATHS.OFFLINE_DATA(venueId, sectionLabel),
        type: "data",
      });
    },
    [fetchData]
  );

  const fetchPrompt = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: { prompt: true } });

    const controller = new AbortController();
    abortControllers.current.push(controller);

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
      dispatch({ type: "SET_LOADING", payload: { prompt: false } });
      if (isMounted.current) {
        const controllerIndex = abortControllers.current.indexOf(controller);
        if (controllerIndex !== -1) {
          abortControllers.current.splice(controllerIndex, 1);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const selectVenueHandler = useCallback(
    (newVenue: Venue | null) => {
      dispatch({ type: "SET_SELECTED_VENUE", payload: newVenue });
      dispatch({ type: "SET_SELECTED_SECTION", payload: null });
      dispatch({ type: "SET_SECTION_IMAGES", payload: [] });
      dispatch({ type: "SET_SECTION_DATA", payload: [] });

      if (!newVenue?.isNew && newVenue?.value) {
        fetchSection(newVenue.value);
      } else if (newVenue?.isNew) {
        const newSection: Section = {
          value: `new-${Date.now()}`,
          label: "1",
          isNew: true,
          isOnline: isOnline,
        };
        dispatch({ type: "SET_SECTIONS", payload: [newSection] });
        dispatch({ type: "SET_SELECTED_SECTION", payload: newSection });
      }
    },
    [fetchSection, isOnline]
  );

  const selectSectionHandler = useCallback(
    (newSection: Section | null) => {
      dispatch({ type: "SET_SELECTED_SECTION", payload: newSection });
      dispatch({ type: "SET_SECTION_DATA", payload: [] });
      dispatch({ type: "SET_SECTION_IMAGES", payload: [] });
      if (!newSection?.isNew && venue?.value && newSection?.label) {
        const venueId = venue.value;
        const sectionLabel = newSection.label;

        Promise.all([
          fetchSectionImage(venueId, sectionLabel),
          fetchSectionData(venueId, sectionLabel),
        ]).catch(console.error);
      }
    },
    [venue, fetchSectionImage, fetchSectionData]
  );

  const onVenueChange = useCallback((items: Venue[]) => {
    dispatch({ type: "SET_VENUES", payload: items });
  }, []);

  const onSectionChange = useCallback((sections: Section[]) => {
    dispatch({ type: "SET_SECTIONS", payload: sections });
  }, []);

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
      abortControllers.current.push(controller);

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
        dispatch({ type: "SET_LOADING", payload: { prompt: false } });
        if (isMounted.current) {
          const controllerIndex = abortControllers.current.indexOf(controller);
          if (controllerIndex !== -1) {
            abortControllers.current.splice(controllerIndex, 1);
          }
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
    if (!isOnline) {
      ToastAndroid.show(
        "Cannot upload images while offline. Please connect to the internet.",
        ToastAndroid.LONG
      );
      return;
    }

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
    abortControllers.current.push(controller);

    try {
      for (let i = 0; i < pendingImages.length; i += BATCH_SIZE) {
        const batch = pendingImages.slice(i, i + BATCH_SIZE);
        const results = await processBatch(batch, controller.signal);

        const successCount = results.filter((result) => result.success).length;
        if (i + BATCH_SIZE < pendingImages.length) {
          ToastAndroid.show(
            `Uploaded ${i + successCount} of ${pendingImages.length} images...`,
            ToastAndroid.SHORT
          );
        }
      }

      ToastAndroid.show("Image upload complete", ToastAndroid.SHORT);
    } catch (error) {
      console.error("Batch processing error:", error);
    } finally {
      if (isMounted.current) {
        dispatch({ type: "SET_LOADING", payload: { uploadImage: false } });
        const controllerIndex = abortControllers.current.indexOf(controller);
        if (controllerIndex !== -1) {
          abortControllers.current.splice(controllerIndex, 1);
        }
      }
    }
  }, [sectionImages, isOnline]);

  const processBatch = async (
    batch: { path: string; type: string; index: number }[],
    signal: AbortSignal
  ) => {
    return Promise.all(
      batch.map(async ({ path, type, index }) => {
        if (!isMounted.current || signal.aborted) {
          return { index, success: false };
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
              name: `${Date.now()}_${index}.jpg`,
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
                await new Promise((resolve) =>
                  setTimeout(resolve, RETRY_DELAY_MS * retries)
                );
              }
            }
          }
        }

        if (!success && isMounted.current && !signal.aborted) {
          console.error(`Failed to upload image ${index}:`, error);
        }

        return { index, success };
      })
    );
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
    (images: SectionImage[], shadow: boolean[], hero: boolean[]) => {
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
      ToastAndroid.show("Images saved successfully", ToastAndroid.SHORT);
    },
    []
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
    abortControllers.current.push(controller);

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
      }
    } finally {
      dispatch({ type: "SET_LOADING", payload: { content: false } });
      if (isMounted.current) {
        const controllerIndex = abortControllers.current.indexOf(controller);
        if (controllerIndex !== -1) {
          abortControllers.current.splice(controllerIndex, 1);
        }
      }
    }
  }, [sectionImages, sectionData, isOnline]);

  const handleSaveContent = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: { content: true } });

    const controller = new AbortController();
    abortControllers.current.push(controller);

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
      dispatch({ type: "SET_LOADING", payload: { content: false } });
      if (isMounted.current) {
        const controllerIndex = abortControllers.current.indexOf(controller);
        if (controllerIndex !== -1) {
          abortControllers.current.splice(controllerIndex, 1);
        }
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
        isOnline={isOnline}
        initialItem={venues}
        loading={loading.venues}
        onChange={onVenueChange}
        selectedItem={venue}
        setSelectedItem={selectVenueHandler}
      />
      <InputWithChip
        isOnline={isOnline}
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
        isOnline={isOnline}
      />
      <Button
        onPress={handleUploadImages}
        title={"Upload Images"}
        isLoading={loading.uploadImage}
        isOnline={isOnline}
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
      />
      <ModificationModal
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        data={sectionImages}
        onSaved={handleSaveImage}
        shadowCorrections={sectionData[0]?.shadowCorrections ?? []}
        heroImages={sectionData[0]?.heroImages ?? []}
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
