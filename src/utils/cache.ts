import * as FileSystem from "expo-file-system";

// Create a directory for our cache
const CACHE_DIR = `${FileSystem.documentDirectory}cache/`;

// Initialize cache directory
export const initializeCacheDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
};

// File paths for different cache types
export const CACHE_PATHS = {
  VENUES: `${CACHE_DIR}venues.json`,
  OFFLINE_VENUES: `${CACHE_DIR}offline_venues.json`,
  SECTIONS: (venueId: string) => `${CACHE_DIR}sections_${venueId}.json`,
  OFFLINE_SECTIONS: (venueId: string) =>
    `${CACHE_DIR}offline_sections_${venueId}.json`,
  IMAGES: (venueId: string, section: string) =>
    `${CACHE_DIR}images_${venueId}_${section}.json`,
  OFFLINE_IMAGES: (venueId: string, section: string) =>
    `${CACHE_DIR}offline_images_${venueId}_${section}.json`,
  DATA: (venueId: string, section: string) =>
    `${CACHE_DIR}data_${venueId}_${section}.json`,
  OFFLINE_DATA: (venueId: string, section: string) =>
    `${CACHE_DIR}offline_data_${venueId}_${section}.json`,
};

// Helper functions for reading and writing cache
export const readCache = async <T>(filePath: string): Promise<T | null> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists) return null;

    const content = await FileSystem.readAsStringAsync(filePath);
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Failed to read cache at ${filePath}:`, error);
    return null;
  }
};

// Helper functions for writing cache
export const writeCache = async <T>(
  filePath: string,
  data: T
): Promise<void> => {
  try {
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to write cache to ${filePath}:`, error);
  }
};

// Helper functions for update cache
export const handleCacheUpdate = async <T>(
  newItems: T[],
  offlineCachePath: string
) => {
  try {
    // Read existing offline cache
    const existingOffline = (await readCache<T[]>(offlineCachePath)) || [];

    // Filter out items that already exist in offline cache
    const uniqueNewItems = newItems.filter(
      (newItem) =>
        !existingOffline.some(
          (existingItem: any) => existingItem.value === (newItem as any).value
        )
    );

    // Update offline cache if there are new items
    if (uniqueNewItems.length > 0) {
      await writeCache(offlineCachePath, [
        ...existingOffline,
        ...uniqueNewItems,
      ]);
    }
  } catch (error) {
    console.error("Cache update failed:", error);
  }
};
