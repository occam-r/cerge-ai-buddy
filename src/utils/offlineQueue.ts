import AsyncStorage from "@react-native-async-storage/async-storage";

type QueueItem = {
  type: "CREATE_VENUE" | "UPDATE_SECTION" | "UPLOAD_IMAGE";
  data: any;
  timestamp: number;
};

const QUEUE_KEY = "offline_queue";

export const addToQueue = async (item: Omit<QueueItem, "timestamp">) => {
  const existing = await AsyncStorage.getItem(QUEUE_KEY);
  const queue = existing ? JSON.parse(existing) : [];
  queue.push({ ...item, timestamp: Date.now() });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const processQueue = async () => {
  const queueString = await AsyncStorage.getItem(QUEUE_KEY);
  if (!queueString) return;

  const queue: QueueItem[] = JSON.parse(queueString);

  for (const item of queue) {
    try {
      // Implement your API calls here based on item type
      await handleQueueItem(item);
      await removeFromQueue(item.timestamp);
    } catch (error) {
      console.error("Failed to process queue item:", item, error);
    }
  }
};

const handleQueueItem = async (item: QueueItem) => {
  // Implement your actual API calls here
  switch (item.type) {
    case "CREATE_VENUE":
    // return await createVenueAPI(item.data);
    case "UPDATE_SECTION":
    // return await updateSectionAPI(item.data);
    case "UPLOAD_IMAGE":
    // return await uploadImageAPI(item.data);
  }
};

const removeFromQueue = async (timestamp: number) => {
  const queueString = await AsyncStorage.getItem(QUEUE_KEY);
  if (!queueString) return;

  const queue: QueueItem[] = JSON.parse(queueString);
  const newQueue = queue.filter((item) => item.timestamp !== timestamp);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
};
