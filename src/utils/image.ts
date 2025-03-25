import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

export const compressImage = async (uri: string): Promise<string> => {
  // Create a manipulation context for the given image URI
  const context = ImageManipulator.manipulate(uri);

  // Chain a resize operation and then render the manipulated image
  context.resize({ width: 1024, height: 1024 });
  const manipulatedImage = await context.renderAsync();

  // Save the manipulated image with desired options
  const result = await manipulatedImage.saveAsync({
    compress: 0.7,
    format: SaveFormat.JPEG,
    base64: true,
  });

  if (!result.base64) {
    throw new Error("Failed to obtain base64 result from image manipulation.");
  }

  return result.base64;
};
