import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import Sortable, {
  OrderChangeParams,
  SortableGridRenderItem,
} from "react-native-sortables";
import { Icon } from "../components/Icon";
import { SectionImage } from "../lib/sectionImageType";
import {
  modificationInitialState,
  modificationReducer,
} from "../reducer/Modification";
import colors from "../utils/colors";

const CARD_HEIGHT = 200;
const COLUMNS = 2;

const ActionButton = memo(
  ({
    label,
    onPress,
    style,
    textStyle,
    icon,
    loading,
  }: {
    label: string;
    onPress: () => void;
    style: any;
    textStyle: any;
    icon?: string;
    loading?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [style, { opacity: pressed ? 0.6 : 1 }]}
      android_ripple={{ color: "#00000010" }}
    >
      {icon && <Icon type="Feather" name={icon} size={24} />}
      {loading ? (
        <ActivityIndicator color={"white"} />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </Pressable>
  )
);

const CheckboxItem = memo(
  ({
    isChecked,
    onToggle,
    label,
    iconChecked,
    iconUnchecked,
  }: {
    isChecked: boolean;
    onToggle: () => void;
    label: string;
    iconChecked: string;
    iconUnchecked: string;
  }) => (
    <TouchableOpacity onPress={onToggle} style={styles.checkbox}>
      <Icon
        type="MaterialIcons"
        name={isChecked ? iconChecked : iconUnchecked}
        size={24}
        color={colors.primary}
      />
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  )
);

const GridItem = memo(
  ({
    item,
    hasShadowCorrection,
    isHeroImage,
    onToggleShadowCorrection,
    onToggleHeroImage,
    onDeleteImage,
  }: {
    item: SectionImage;
    hasShadowCorrection: boolean;
    isHeroImage: boolean;
    onToggleShadowCorrection: () => void;
    onToggleHeroImage: () => void;
    onDeleteImage: () => void;
  }) => {
    const imageSource = useMemo(
      () => ({
        uri:
          item.blob == ""
            ? item?.path
            : `data:${item.type};base64,${item.blob}`,
      }),
      [item.type, item.blob, item?.path]
    );

    return (
      <View style={styles.card}>
        <Image
          style={styles.image}
          source={imageSource}
          resizeMode="cover"
          fadeDuration={300}
          accessibilityLabel={`Image ${item.id}`}
        />
        <Sortable.Pressable style={styles.deleteButton} onPress={onDeleteImage}>
          <Icon type="MaterialIcons" name="delete" size={24} color="#ff4444" />
        </Sortable.Pressable>
        <View style={styles.checkboxContainer}>
          <CheckboxItem
            isChecked={hasShadowCorrection}
            onToggle={onToggleShadowCorrection}
            label="Shadow Correction"
            iconChecked="check-box"
            iconUnchecked="check-box-outline-blank"
          />
          <CheckboxItem
            isChecked={isHeroImage}
            onToggle={onToggleHeroImage}
            label="Hero Image"
            iconChecked="radio-button-checked"
            iconUnchecked="radio-button-unchecked"
          />
        </View>
      </View>
    );
  }
);

const ModificationModal = ({
  isOpen,
  onClose,
  data,
  onSaved,
  shadowCorrections,
  heroImages,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: SectionImage[];
  onSaved: (images: SectionImage[], shadow: boolean[], hero: boolean[]) => void;
  shadowCorrections: boolean[];
  heroImages: boolean[];
}) => {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();
  const [state, dispatch] = useReducer(
    modificationReducer,
    modificationInitialState
  );

  const initialData = useMemo(
    () => ({
      sectionImages: data,
      shadowCorrections: data.reduce(
        (acc, _, i) => ({ ...acc, [data[i].id]: shadowCorrections[i] }),
        {}
      ),
      heroImages: data.reduce(
        (acc, _, i) => ({ ...acc, [data[i].id]: heroImages[i] }),
        {}
      ),
    }),
    [data, shadowCorrections, heroImages]
  );

  useEffect(() => {
    if (isOpen) {
      dispatch({ type: "SET_MODAL_DATA", payload: initialData });
    }
  }, [isOpen, initialData]);

  const eventHandlers = useMemo(
    () => ({
      toggleShadow: (id: string) =>
        dispatch({ type: "TOGGLE_SHADOW_CORRECTION", payload: id }),
      toggleHero: (id: string) =>
        dispatch({ type: "TOGGLE_HERO_IMAGE", payload: id }),
      deleteImage: (id: string) =>
        dispatch({ type: "DELETE_IMAGE", payload: id }),
    }),
    []
  );

  const renderItem: SortableGridRenderItem<SectionImage> = useCallback(
    ({ item }) => (
      <GridItem
        item={item}
        hasShadowCorrection={state.shadowCorrections[item.id]}
        isHeroImage={state.heroImages[item.id]}
        onToggleShadowCorrection={() => eventHandlers.toggleShadow(item.id)}
        onToggleHeroImage={() => eventHandlers.toggleHero(item.id)}
        onDeleteImage={() => eventHandlers.deleteImage(item.id)}
      />
    ),
    [
      state.sectionImages,
      state.shadowCorrections,
      state.heroImages,
      eventHandlers,
    ]
  );

  const handleOrderChange = useCallback((params: OrderChangeParams) => {
    dispatch({ type: "UPDATE_ORDER", payload: params });
  }, []);

  const handleOnClose = useCallback(() => {
    dispatch({
      type: "SET_MODAL_DATA",
      payload: {
        sectionImages: [],
        shadowCorrections: {},
        heroImages: {},
      },
    });
    onClose();
  }, [onClose]);

  const handleOnSaved = useCallback(() => {
    if (state.orderChanged) {
      const { indexToKey } = state.orderChanged;
      const newData = indexToKey
        .map((key) => state.sectionImages.find((item) => item.id === key))
        .filter((item): item is SectionImage => item !== undefined);
      const newShadow = indexToKey.map(
        (key) => state.shadowCorrections[key] || false
      );
      const newHero = indexToKey.map((key) => state.heroImages[key] || false);
      onSaved(newData, newShadow, newHero);
    } else {
      onSaved(
        state.sectionImages,
        Object.values(state.shadowCorrections),
        Object.values(state.heroImages)
      );
    }
    handleOnClose();
  }, [
    state.orderChanged,
    state.sectionImages,
    state.shadowCorrections,
    state.heroImages,
    onSaved,
    handleOnClose,
  ]);

  const handleImagePick = useCallback(
    async (type: "gallery" | "camera") => {
      try {
        dispatch({ type: "SET_LOADING", payload: { images: true } });

        const picker =
          type === "gallery"
            ? ImagePicker.launchImageLibraryAsync
            : ImagePicker.launchCameraAsync;

        const result = await picker({
          allowsMultipleSelection: type === "gallery",
          aspect: type === "gallery" ? [4, 3] : [16, 9],
          quality: 0.8,
        });

        if (result.canceled) {
          ToastAndroid.show(
            `You did not ${type === "gallery" ? "select" : "take"} any image`,
            ToastAndroid.SHORT
          );
          return;
        }

        const timestamp = Date.now();

        const newImages = result.assets.map((asset, index) => ({
          name: asset.fileName || `Image-${index + 1}`,
          type: asset.mimeType || "image/jpeg",
          lastModified: timestamp,
          size: asset.fileSize || 0,
          id: `${timestamp}-${index}`,
          path: asset.uri,
          blob: asset.base64 ?? "",
        }));

        if (type === "camera" && result.assets.length > 0) {
          Promise.all(
            result.assets.map((asset) =>
              MediaLibrary.saveToLibraryAsync(asset.uri)
            )
          ).catch((error) =>
            console.error("Failed to save images to library:", error)
          );
        }

        const { sectionImages, shadowCorrections, heroImages } = state;
        const imageIds = newImages.map((img) => img.id);

        dispatch({
          type: "SET_MODAL_DATA",
          payload: {
            sectionImages: [...sectionImages, ...newImages],
            shadowCorrections: {
              ...shadowCorrections,
              ...Object.fromEntries(imageIds.map((id) => [id, false])),
            },
            heroImages: {
              ...heroImages,
              ...Object.fromEntries(imageIds.map((id) => [id, false])),
            },
          },
        });
      } catch (error) {
        console.error("Error picking images:", error);
        ToastAndroid.show("Failed to process images", ToastAndroid.SHORT);
      } finally {
        dispatch({ type: "SET_LOADING", payload: { images: false } });
      }
    },
    [state]
  );

  const keyExtractor = useCallback((item: SectionImage) => item.id, []);

  return (
    <Modal
      visible={isOpen}
      statusBarTranslucent
      animationType="slide"
      onRequestClose={handleOnClose}
    >
      <SafeAreaView style={styles.container}>
        <GestureHandlerRootView style={styles.container}>
          <Animated.ScrollView
            ref={scrollableRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Sortable.Grid
              onOrderChange={handleOrderChange}
              columnGap={10}
              columns={COLUMNS}
              data={state.sectionImages}
              renderItem={renderItem}
              rowGap={10}
              keyExtractor={keyExtractor}
              scrollableRef={scrollableRef}
            />
          </Animated.ScrollView>
          <View style={styles.footer}>
            <View style={styles.footerButton}>
              <ActionButton
                onPress={() => handleImagePick("camera")}
                style={styles.cameraGallery}
                label="Take Photo"
                textStyle={styles.text}
                icon="camera"
              />
              <ActionButton
                onPress={() => handleImagePick("gallery")}
                style={styles.cameraGallery}
                label="Gallery"
                textStyle={styles.text}
                icon="image"
              />
            </View>
            <View style={styles.footerButton}>
              <ActionButton
                label="Close"
                onPress={handleOnClose}
                style={styles.closeButton}
                textStyle={styles.closeText}
              />
              <ActionButton
                label="Save"
                onPress={handleOnSaved}
                style={styles.saveButton}
                textStyle={styles.saveText}
                loading={state.loading.images}
              />
            </View>
          </View>
        </GestureHandlerRootView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    paddingBottom: 140,
    paddingHorizontal: 12,
  },
  card: {
    borderRadius: 12,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: CARD_HEIGHT,
  },
  deleteButton: {
    position: "absolute",
    right: 8,
    top: 8,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 4,
  },
  checkboxContainer: {
    justifyContent: "space-between",
    padding: 8,
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: "#495057",
  },
  footerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  saveButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 14,
  },
  closeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f3f5",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    padding: 14,
  },
  saveText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
  closeText: {
    fontSize: 16,
    color: "#495057",
    fontWeight: "600",
  },
  cameraGallery: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
    flexDirection: "row",
    borderColor: colors.primary
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginLeft: 20,
  },
});

export default memo(ModificationModal);
