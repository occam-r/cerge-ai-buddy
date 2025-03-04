import Icon from "@components/Icon";
import { Venue } from "@lib/venueType";
import colors from "@utils/colors";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  ScrollView,
} from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DROPDOWN_MAX_HEIGHT = SCREEN_HEIGHT * 0.4;

type Props = {
  initialItem?: Venue[];
  loading?: boolean;
  onChange?: (items: Venue[]) => void;
  selectedItem: Venue | null;
  setSelectedItem: (item: Venue | null) => void;
  style?: ViewStyle;
};

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const DropdownMenu = React.memo(
  ({
    initialItem = [],
    loading,
    onChange,
    selectedItem,
    setSelectedItem,
    style,
  }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const scrollViewRef = useRef<ScrollView>(null);

    const dropdownHeight = useSharedValue(0);
    const dropdownOpacity = useSharedValue(0);
    const inputRef = useRef<TextInput>(null);

    const highlightText = (text: string, highlight: string) => {
      if (!highlight.trim()) return text;
      const parts = text.split(new RegExp(`(${highlight})`, "gi"));
      return parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Text key={i} style={styles.highlightedText}>
            {part}
          </Text>
        ) : (
          part
        )
      );
    };

    // Add new item if not exists
    const addNewItem = () => {
      if (
        searchText.trim() &&
        !initialItem?.some((item) => item.label === searchText)
      ) {
        const newItem: Venue = {
          label: searchText,
          value: searchText.toLowerCase().replace(/\s+/g, "-"),
          isNew: true,
          status: "incomplete",
        };
        const updatedChips = [
          {
            ...newItem,
            isNew: false,
          },
          ...initialItem,
        ];
        onChange?.(updatedChips);
        setSelectedItem(newItem);
      }
    };

    // Animation styles
    const dropdownAnimatedStyle = useAnimatedStyle(() => ({
      height: dropdownHeight.value,
      opacity: dropdownOpacity.value,
      transform: [
        {
          translateY: interpolate(
            dropdownHeight.value,
            [0, DROPDOWN_MAX_HEIGHT],
            [-10, 0],
            Extrapolation.CLAMP
          ),
        },
      ],
    }));

    // Open dropdown animation
    const openDropdown = () => {
      dropdownHeight.value = withTiming(DROPDOWN_MAX_HEIGHT, { duration: 300 });
      dropdownOpacity.value = withTiming(1, { duration: 200 });
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      setIsOpen(true);
    };

    // Toggle dropdown open/close
    const toggleButton = () => {
      if (!isOpen) {
        inputRef.current?.focus();
      } else {
        closeDropdown();
      }
    };

    // Clear input text
    const clearInput = () => {
      setSelectedItem(null);
      setSearchText("");
    };

    // Close dropdown animation
    const closeDropdown = () => {
      dropdownHeight.value = withTiming(0, { duration: 300 });
      dropdownOpacity.value = withTiming(0, { duration: 200 });
      setIsOpen(false);
      inputRef.current?.blur();
    };

    const hasExactMatch = initialItem?.some(
      (item) => item.label.toLowerCase() === searchText.toLowerCase()
    );

    // Tap gesture for closing dropdown
    const tapGesture = Gesture.Tap()
      .enabled(isOpen)
      .onStart(() => {
        runOnJS(closeDropdown)();
      });

    const getSortedItems = useCallback(() => {
      if (!searchText.trim()) return initialItem;

      return [...initialItem].sort((a, b) => {
        const aStartsWith = a.label.toLowerCase().startsWith(searchText.toLowerCase());
        const bStartsWith = b.label.toLowerCase().startsWith(searchText.toLowerCase());

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return 0;
      });
    }, [initialItem, searchText])

    return (
      <View style={[styles.container, style]}>
        {loading ? (
          <View style={styles.input}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <AnimatedTextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Select or type to add new"
              value={isOpen ? searchText : selectedItem?.label || ""}
              onChangeText={(text) => {
                setSearchText(text);
                if (selectedItem) setSelectedItem(null);
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
              }}
              onFocus={openDropdown}
            />
            {isOpen && (selectedItem || searchText) ? (
              <Pressable style={styles.clearButton} onPress={clearInput}>
                <Icon name="close-circle-outline" color={colors.primary} />
              </Pressable>
            ) : null}
            <Pressable style={styles.toggleButton} onPress={toggleButton}>
              <Icon
                name={isOpen ? "chevron-up" : "chevron-down"}
                color={colors.primary}
              />
            </Pressable>
          </View>
        )}

        <GestureDetector gesture={tapGesture}>
          <View>
            {/* Dropdown List */}
            <Animated.View style={[styles.dropdown, dropdownAnimatedStyle]}>
              <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="on-drag"
              >
                {!hasExactMatch && searchText.trim() && (
                  <TouchableOpacity
                    style={styles.item}
                    onPress={() => {
                      addNewItem();
                      closeDropdown();
                    }}
                  >
                    <Text style={styles.addText}>
                      New Venue: "{searchText}"
                    </Text>
                  </TouchableOpacity>
                )}
                {getSortedItems().map((item) => {
                  const isExactMatch =
                    item.label.toLowerCase() === searchText.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.item,
                        {
                          backgroundColor:
                            isExactMatch ? colors.primary : colors[item.status ?? "background"],
                        }

                      ]}
                      onPress={() => {
                        if (selectedItem?.value === item.value) {
                          closeDropdown();
                          return;
                        }
                        setSelectedItem(item);
                        setSearchText(item.label);
                        closeDropdown();
                      }}
                    >
                      <Text style={styles.itemText}>
                        {!isExactMatch
                          ? highlightText(item.label, searchText)
                          : item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </View>
        </GestureDetector>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    zIndex: 10,
  },
  inputContainer: {
    position: "relative",
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    paddingRight: 35,
  },
  clearButton: {
    position: "absolute",
    right: 50,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  toggleButton: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  clearText: {
    fontSize: 24,
    color: "#999",
    lineHeight: 24,
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: 8,
    marginTop: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  scrollView: {
    maxHeight: DROPDOWN_MAX_HEIGHT,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemText: {
    fontSize: 16,
    color: colors.text,
  },
  addText: {
    fontSize: 16,
    color: colors.primary,
    fontStyle: "italic",
  },
  highlightedText: {
    fontWeight: "bold",
    backgroundColor: "#fff3cd",
  },
  loadingContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default DropdownMenu;
