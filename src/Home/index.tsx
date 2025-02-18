import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import DropdownMenu from "../components/DropdownMenu";
import InputWithChip from "../components/InputWithChip";
import { SectionData, SensoryType } from "../lib/sectionDataType";
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
} from "../utils/api";
import { CACHE_PATHS, readCache, writeCache } from "../utils/cache";
import colors from "../utils/colors";
import Content from "./Content";
import GenerateContent from "./GenerateContent";
import ImageList from "./ImageList";
import ModificationModal from "./ModificationModal";
import Prompt from "./Prompt";

const Home = ({ isOnline }: { isOnline: boolean }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const abortControllers = useRef<AbortController[]>([]);

  useEffect(() => {
    return () => {
      abortControllers.current.forEach((controller) => controller.abort());
    };
  }, []);

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
      type: "venues" | "sections" | "images" | "data" | "prompt";
    }) => {
      dispatch({ type: "SET_LOADING", payload: { [type]: true } });

      const controller = new AbortController();
      abortControllers.current.push(controller);

      try {
        let serverData: T = [] as unknown as T;
        if (isOnline) {
          serverData = await onlineFetch(controller.signal);
          await writeCache(cachePath, serverData);
        } else {
          const cached = await readCache<T>(cachePath);
          serverData = cached || ([] as unknown as T);
        }

        let offlineData: T = [] as unknown as T;
        if (offlineCachePath) {
          const offline = await readCache<T>(offlineCachePath);
          offlineData = offline || ([] as unknown as T);
        }

        if (
          Array.isArray(serverData) ||
          (offlineCachePath && Array.isArray(offlineData))
        ) {
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
                payload: mergedData as SectionData["areas"],
              });
              break;
          }
        } else if (type === "prompt") {
          dispatch({ type: "SET_PROMPT", payload: serverData as string });
        }
      } catch (error) {
        if (!(error instanceof Error && error.name === "AbortError")) {
          console.error(`Failed to fetch ${type}:`, error);
        }
      } finally {
        dispatch({ type: "SET_LOADING", payload: { [type]: false } });
        abortControllers.current = abortControllers.current.filter(
          (c) => c !== controller
        );
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
      return fetchData<SectionData["areas"]>({
        onlineFetch: (signal) =>
          getSectionData({ venueId, sectionName: sectionLabel }, signal),
        cachePath: CACHE_PATHS.DATA(venueId, sectionLabel),
        offlineCachePath: CACHE_PATHS.OFFLINE_DATA(venueId, sectionLabel),
        type: "data",
      });
    },
    [fetchData]
  );

  const fetchPrompt = useCallback(() => {
    return fetchData<string>({
      onlineFetch: (signal) => getPrompts(signal),
      cachePath: CACHE_PATHS.PROMPT,
      type: "prompt",
    });
  }, [fetchData]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const selectVenueHandler = useCallback(
    (venue: Venue | null) => {
      dispatch({ type: "SET_SELECTED_VENUE", payload: venue });
      dispatch({ type: "SET_SELECTED_SECTION", payload: null });
      dispatch({ type: "SET_SECTION_IMAGES", payload: [] });

      if (!venue?.isNew && venue?.value) {
        fetchSection(venue.value);
      } else if (venue?.isNew) {
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
    (section: Section | null) => {
      dispatch({ type: "SET_SELECTED_SECTION", payload: section });
      dispatch({ type: "SET_SECTION_IMAGES", payload: [] });
      if (!section?.isNew && state.venue?.value && section?.label) {
        const venueId = state.venue.value;
        const sectionLabel = section.label;

        Promise.all([
          fetchSectionImage(venueId, sectionLabel),
          fetchSectionData(venueId, sectionLabel),
        ]).catch(console.error);
      }
    },
    [state.venue, fetchSectionImage, fetchSectionData]
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
    (prompt: string) => dispatch({ type: "SET_PROMPT", payload: prompt }),
    []
  );
  const setAdditionalInfo = useCallback(
    (additionalInfo: string) =>
      dispatch({ type: "SET_ADDITIONAL_INFO", payload: additionalInfo }),
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

  const handleDescriptionUpdate = useCallback(
    (value: string) => dispatch({ type: "UPDATE_DESCRIPTION", payload: value }),
    []
  );

  const handleSaveImage = useCallback(
    (images: SectionImage[], shadow: boolean[], hero: boolean[]) => {
      dispatch({ type: "SET_SECTION_IMAGES", payload: images });
      dispatch({ type: "SET_SHADOW_CORRECTION", payload: shadow });
      dispatch({ type: "SET_HERO_IMAGE", payload: hero });
    },
    []
  );

  const handleGenerateContent = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: { content: true } });
    try {
      const controller = new AbortController();
      abortControllers.current.push(controller);

      const response = await generateContent({
        params: {
          files: state.sectionImages,
          userPrompt: state.additionalInfo,
        },
        signal: controller.signal,
      });

      dispatch({
        type: "SET_SECTION_DATA",
        payload: [response],
      });
    } catch (error) {
    } finally {
      dispatch({ type: "SET_LOADING", payload: { content: false } });
    }
  }, [state]);

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      contentContainerStyle={styles.container}
    >
      <DropdownMenu
        isOnline={isOnline}
        initialItem={state.venues}
        loading={state.loading.venues}
        onChange={onVenueChange}
        selectedItem={state.venue}
        setSelectedItem={selectVenueHandler}
      />
      <InputWithChip
        isOnline={isOnline}
        initialChips={state.sections}
        loading={state.loading.sections}
        onChange={onSectionChange}
        selectedChip={state.section}
        setSelectedChip={selectSectionHandler}
      />
      <ImageList data={state.sectionImages} loading={state.loading.images} />

      <Pressable
        onPress={handleModalToggle}
        style={({ pressed }: { pressed: boolean }) => [
          styles.updateButton,
          pressed && styles.pressedUpdateButton,
        ]}
        android_ripple={{ color: "#ffffff44" }}
      >
        <Text style={styles.updateButtonText}>
          Add / Rearrange / Modify Images
        </Text>
      </Pressable>
      <GenerateContent
        isVisible={state.sectionImages.length > 0}
        data={state.additionalInfo}
        setAdditionalInfo={setAdditionalInfo}
        generateContent={handleGenerateContent}
        loading={state.loading.content}
      />
      <Prompt
        data={state.prompt}
        getPrompt={fetchPrompt}
        setPrompt={handlePromptUpdate}
        loading={state.loading.prompt}
        updatePrompt={handlePromptUpdate}
      />
      <Content
        data={state.sectionData}
        loading={state.loading.data}
        onDelete={handleContentDelete}
        onAdd={handleContentAdd}
        onUpdate={handleContentUpdate}
        onDescriptionUpdate={handleDescriptionUpdate}
      />
      <ModificationModal
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        data={state.sectionImages}
        onSaved={handleSaveImage}
        shadowCorrections={state.sectionData[0]?.shadowCorrections ?? []}
        heroImages={state.sectionData[0]?.heroImages ?? []}
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
  updateButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pressedUpdateButton: {
    opacity: 0.8,
  },
  updateButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "500",
  },
});

export default React.memo(Home);
