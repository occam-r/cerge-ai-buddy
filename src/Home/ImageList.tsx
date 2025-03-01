import { memo, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ListRenderItem,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SectionImage, Status } from "../lib/sectionImageType";
import colors from "../utils/colors";
import { Icon } from "../components/Icon";

const IMAGE_HEIGHT = 200;
const COLUMN_GAP = 12;

export const statusIconMap: Record<Status, string> = {
  pending: "🕒",
  uploading: "⬆️",
  success: "✅",
  failed: "❌",
};

const EmptyComponent = memo(() => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>No images available</Text>
  </View>
));

const LoadingComponent = memo(() => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator color={colors.primary} />
  </View>
));

const SeparatorComponent = memo(() => <View style={styles.separator} />);

const ImageItem = memo(({ item }: { item: SectionImage }) => {
  const imageSource = useMemo(
    () => ({
      uri:
        item.blob == "" ? item?.path : `data:${item.type};base64,${item.blob}`,
    }),
    [item.type, item.blob, item?.path]
  );

  return (
    <View style={styles.card}>
      <Image
        style={styles.image}
        source={imageSource}
        resizeMode="cover"
        fadeDuration={100}
      />
      <Text
        style={{
          ...styles.status,
          backgroundColor: colors[item.status ?? "success"],
        }}
      >
        {statusIconMap[item?.status ?? "success"]}
        {"  "}
        {item?.status ?? "success"}
      </Text>
    </View>
  );
});

const ImageList = ({
  data,
  loading,
}: {
  data: SectionImage[];
  loading: boolean;
}) => {
  const renderItem = useCallback<ListRenderItem<SectionImage>>(
    ({ item }) => <ImageItem item={item} />,
    []
  );

  const keyExtractor = useCallback((item: SectionImage) => item.id, []);

  const listProps = useMemo(
    () => ({
      initialNumToRender: 4,
      maxToRenderPerBatch: 4,
      windowSize: 5,
      scrollEnabled: false,
      removeClippedSubviews: true,
      nestedScrollEnabled: true,
      contentContainerStyle: styles.listContent,
    }),
    []
  );

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListEmptyComponent={EmptyComponent}
      ItemSeparatorComponent={SeparatorComponent}
      {...listProps}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 24,
  },
  card: {
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: "100%",
    height: IMAGE_HEIGHT,
  },
  loadingContainer: {
    height: IMAGE_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    height: IMAGE_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyText: {
    color: colors.text,
    fontSize: 16,
    textAlign: "center",
  },
  separator: {
    height: COLUMN_GAP,
  },
  status: {
    height: 30,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    verticalAlign: "middle",
    textTransform: "capitalize",
  },
});

export default memo(ImageList);
