import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

export const compressImage = async (uri: string): Promise<string> => {
  const manipulatedImage = await manipulateAsync(
    uri,
    [{ resize: { width: 1024, height: 1024 } }],
    {
      compress: 0.7,
      format: SaveFormat.JPEG,
      base64: true,
    }
  ).catch((error) => {
    console.error("Error compressing image:", error);
  });

  return manipulatedImage?.base64!;
};
