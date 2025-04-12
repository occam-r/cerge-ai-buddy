import Button from "@components/Button";
import Icon from "@components/Icon";
import { SectionImage, Status } from "@lib/sectionImageType";
import {
  modificationInitialState,
  modificationReducer,
} from "@reducer/Modification";
import colors from "@utils/colors";
import * as ImagePicker from "expo-image-picker";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { CameraCapturedPicture } from "expo-camera";
import Sortable, {
  OrderChangeParams,
  SortableGridRenderItem,
} from "react-native-sortables";
import CameraScreen from "../components/CameraScreen";

interface CheckboxItemProps {
  isChecked: boolean;
  onToggle: () => void;
  label: string;
  iconChecked: string;
  iconUnchecked: string;
}

interface GridItemProps {
  item: SectionImage;
  hasShadowCorrection: boolean;
  isHeroImage: boolean;
  onToggleShadowCorrection: () => void;
  onToggleHeroImage: () => void;
  onDeleteImage: () => void;
}

interface ModificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SectionImage[];
  onSaved: (images: SectionImage[], shadow: boolean[], hero: boolean[]) => void;
  shadow: boolean[];
  hero: boolean[];
}

const CARD_HEIGHT = 200;
const COLUMNS = 2;

const CheckboxItem = memo(
  ({
    isChecked,
    onToggle,
    label,
    iconChecked,
    iconUnchecked,
  }: CheckboxItemProps) => (
    <TouchableOpacity onPress={onToggle} style={styles.checkbox}>
      <Icon
        type="MaterialIcons"
        name={isChecked ? iconChecked : iconUnchecked}
        size={24}
        color={colors.background}
      />
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  ),
);

const GridItem = memo(
  ({
    item,
    hasShadowCorrection,
    isHeroImage,
    onToggleShadowCorrection,
    onToggleHeroImage,
    onDeleteImage,
  }: GridItemProps) => {
    const imageSource = useMemo(
      () => ({
        uri:
          item.blob == ""
            ? item?.path
            : `data:${item.type};base64,${item.blob}`,
      }),
      [item.type, item.blob, item?.path],
    );

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors[item.status ?? "success"],
          },
        ]}
      >
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
  },
);

const ModificationModal = ({
  isOpen,
  onClose,
  data,
  onSaved,
  shadow,
  hero,
}: ModificationModalProps) => {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();
  const [state, dispatch] = useReducer(
    modificationReducer,
    modificationInitialState,
  );
  const [showCamera, setShowCamera] = useState(false);

  const { heroImages, orderChanged, sectionImages, shadowCorrections } = state;

  const initialData = useMemo(() => {
    const shadowObj: Record<string, boolean> = {};
    const heroObj: Record<string, boolean> = {};

    data.forEach((item, index) => {
      shadowObj[item.id] = shadow[index];
      heroObj[item.id] = hero[index];
    });

    return {
      sectionImages: data,
      shadowCorrections: shadowObj,
      heroImages: heroObj,
    };
  }, [data, shadow, hero]);

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
    [],
  );

  const renderItem: SortableGridRenderItem<SectionImage> = useCallback(
    ({ item }) => (
      <GridItem
        item={item}
        hasShadowCorrection={shadowCorrections[item.id]}
        isHeroImage={heroImages[item.id]}
        onToggleShadowCorrection={() => eventHandlers.toggleShadow(item.id)}
        onToggleHeroImage={() => eventHandlers.toggleHero(item.id)}
        onDeleteImage={() => eventHandlers.deleteImage(item.id)}
      />
    ),
    [shadowCorrections, heroImages, eventHandlers],
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
    try {
      if (orderChanged?.indexToKey) {
        const imageMap = new Map(sectionImages.map((item) => [item.id, item]));

        const newData: SectionImage[] = [];
        const newShadow: boolean[] = [];
        const newHero: boolean[] = [];

        for (const key of orderChanged.indexToKey) {
          const image = imageMap.get(key);
          if (image) {
            newData.push(image);
            newShadow.push(shadowCorrections[key] || false);
            newHero.push(heroImages[key] || false);
          }
        }

        onSaved(newData, newShadow, newHero);
      } else {
        const orderedShadowCorrections: boolean[] = [];
        const orderedHeroImages: boolean[] = [];

        sectionImages.forEach((image) => {
          orderedShadowCorrections.push(shadowCorrections[image.id] || false);
          orderedHeroImages.push(heroImages[image.id] || false);
        });

        onSaved(sectionImages, orderedShadowCorrections, orderedHeroImages);
      }

      handleOnClose();
    } catch (error) {
      console.error("Error saving modifications:", error);
      ToastAndroid.show("Failed to save changes", ToastAndroid.SHORT);
    }
  }, [
    orderChanged,
    sectionImages,
    shadowCorrections,
    heroImages,
    onSaved,
    handleOnClose,
  ]);

  const handleImagePick = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        ToastAndroid.show(`You did not select any image`, ToastAndroid.SHORT);
        return;
      }

      await processPickedImages(result.assets);
    } catch (error) {
      console.error("Error picking images:", error);
      ToastAndroid.show("Failed to process images", ToastAndroid.SHORT);
    }
  }, [sectionImages, shadowCorrections, heroImages]);

  const processPickedImages = useCallback(
    async (assets: ImagePicker.ImagePickerAsset[]) => {
      const timestamp = Date.now();

      const newImages = assets.map((asset, index) => ({
        name: asset.fileName || `Image-${index + 1}`,
        type: asset.mimeType || "image/jpeg",
        lastModified: timestamp,
        size: asset.fileSize || 0,
        id: `${timestamp}-${index}`,
        path: asset.uri,
        blob: asset.base64 ?? "",
        status: "pending" as Status,
      }));

      try {
        const imageSettings = newImages.reduce(
          (acc, img) => {
            acc[img.id] = false;
            return acc;
          },
          {} as Record<string, boolean>,
        );

        dispatch({
          type: "SET_MODAL_DATA",
          payload: {
            sectionImages: [...sectionImages, ...newImages],
            shadowCorrections: {
              ...shadowCorrections,
              ...imageSettings,
            },
            heroImages: {
              ...heroImages,
              ...imageSettings,
            },
          },
        });
        scrollableRef.current?.scrollToEnd({
          animated: true,
        });
      } catch (error) {
        console.error("Error processing images:", error);
        ToastAndroid.show("Failed to process images", ToastAndroid.SHORT);
      }
    },
    [sectionImages, shadowCorrections, heroImages],
  );

  const handleCameraSave = useCallback(
    async (images: Array<CameraCapturedPicture>) => {
      setShowCamera(false);
      await processPickedImages(images);
    },
    [processPickedImages],
  );

  const keyExtractor = useCallback((item: SectionImage) => item.id, []);

  if (showCamera) {
    return (
      <Modal
        visible={isOpen}
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <SafeAreaView style={styles.container}>
          <CameraScreen
            onClose={() => setShowCamera(false)}
            onFinish={handleCameraSave}
          />
        </SafeAreaView>
      </Modal>
    );
  }

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
              data={sectionImages}
              renderItem={renderItem}
              rowGap={10}
              keyExtractor={keyExtractor}
              scrollableRef={scrollableRef}
            />
          </Animated.ScrollView>
          <View style={styles.footer}>
            <View style={styles.footerButton}>
              <Button
                onPress={() => setShowCamera(true)}
                style={styles.cameraGallery}
                title="Take Photo"
                textStyle={styles.text}
                icon="camera"
              />
              <Button
                onPress={handleImagePick}
                style={styles.cameraGallery}
                title="Gallery"
                textStyle={styles.text}
                icon="image"
              />
            </View>
            <View style={styles.footerButton}>
              <Button
                title="Close"
                onPress={handleOnClose}
                style={styles.closeButton}
                textStyle={styles.closeText}
              />
              <Button
                title="Save"
                onPress={handleOnSaved}
                style={styles.saveButton}
                textStyle={styles.saveText}
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
    backgroundColor: colors.background,
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
    color: colors.background,
  },
  footerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    gap: 12,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    gap: 12,
  },
  saveButton: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: 0,
    marginBottom: 12,
  },
  closeButton: {
    flex: 1,
    backgroundColor: "#f1f3f5",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    marginTop: 0,
    marginBottom: 12,
  },
  saveText: {
    fontSize: 16,
    color: colors.background,
    fontWeight: "600",
  },
  closeText: {
    fontSize: 16,
    color: "#495057",
    fontWeight: "600",
  },
  cameraGallery: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
});

export default memo(ModificationModal);
