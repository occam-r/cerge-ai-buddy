import Button from "@components/Button";
import colors from "@utils/colors";
import {
  CameraCapturedPicture,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { saveToLibraryAsync, usePermissions } from "expo-media-library";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const WINDOW_HEIGHT = Dimensions.get("window").height;
const PHOTO_OPTIONS = {
  quality: 0.8,
  exif: true,
  skipProcessing: false,
};

interface Props {
  onFinish: (photos: CameraCapturedPicture[]) => void;
  onClose: () => void;
}

const CameraScreen = memo(({ onFinish, onClose }: Props) => {
  const cameraRef = useRef<CameraView>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] =
    usePermissions();
  const [capturedPhotos, setCapturedPhotos] = useState<CameraCapturedPicture[]>(
    [],
  );
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const requestPermissions = async () => {
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }

      if (!mediaLibraryPermission?.granted) {
        await requestMediaLibraryPermission();
      }
    };

    requestPermissions();
  }, []);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || isProcessing) return;

    setIsProcessing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync(PHOTO_OPTIONS);

      if (photo?.uri) {
        setCapturedPhotos((prev) => [...prev, photo]);

        if (mediaLibraryPermission?.granted) {
          saveToLibraryAsync(photo.uri);
        }
      }
    } catch (error) {
      console.error("Error taking picture:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, mediaLibraryPermission?.granted]);

  const handleFinish = useCallback(() => {
    onFinish(capturedPhotos);
  }, [capturedPhotos, onFinish]);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const renderThumbnail = useCallback<ListRenderItem<CameraCapturedPicture>>(
    ({ item }) => (
      <Image
        source={{ uri: item.uri }}
        style={styles.thumbnail}
        onError={(error) =>
          console.error("Image loading error:", error.nativeEvent.error)
        }
      />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (_: any, index: number) => `photo-${index}`,
    [],
  );

  if (!cameraPermission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!cameraPermission.granted || !mediaLibraryPermission?.granted) {
    const permissionText = !cameraPermission.granted
      ? "show the camera"
      : "save images to your library";

    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to {permissionText}.
        </Text>
        <Button
          onPress={openSettings}
          title="Grant permission"
          style={styles.saveButton}
          textStyle={styles.saveText}
        />
        <Button
          onPress={onClose}
          title="Close"
          style={styles.closeButton}
          textStyle={styles.closeText}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        responsiveOrientationWhenOrientationLocked
      />

      <View style={styles.controls}>
        <FlatList
          horizontal
          data={capturedPhotos}
          renderItem={renderThumbnail}
          keyExtractor={keyExtractor}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.previewList}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />

        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePicture}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          {isProcessing ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <View style={styles.innerCircle} />
          )}
        </TouchableOpacity>

        <Button
          title={`Ok  (${capturedPhotos.length})`}
          onPress={handleFinish}
          disabled={capturedPhotos.length === 0}
          style={styles.finishButton}
          textStyle={styles.saveText}
        />

        <Button
          title={"Close"}
          onPress={onClose}
          style={styles.closeButt}
          textStyle={styles.closeText}
        />
      </View>
    </View>
  );
});

export default CameraScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  controls: {
    height: WINDOW_HEIGHT * 0.24,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: "100%",
  },
  message: {
    textAlign: "center",
    paddingBottom: 20,
    fontSize: 16,
    paddingHorizontal: 20,
  },
  previewList: {
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    resizeMode: "cover",
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  captureButton: {
    alignSelf: "center",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.background,
    borderRadius: 50,
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  disabledButton: {
    opacity: 0.7,
    borderColor: "#cccccc",
  },
  innerCircle: {
    backgroundColor: colors.background,
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  finishButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
  },
  closeButton: {
    backgroundColor: "#f1f3f5",
    borderWidth: 1,
    borderColor: "#dee2e6",
    width: "90%",
  },
  closeButt: {
    position: "absolute",
    left: 20,
    bottom: 20,
    backgroundColor: "#f1f3f5",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  closeText: {
    fontSize: 16,
    color: "#495057",
    fontWeight: "600",
  },
  saveButton: {
    width: "90%",
  },
  saveText: {
    fontSize: 16,
    color: colors.background,
    fontWeight: "600",
  },
});
