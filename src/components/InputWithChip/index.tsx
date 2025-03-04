import Button from "@components/Button";
import { Section } from "@lib/sectionType";
import colors from "@utils/colors";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface Props {
  initialChips?: Section[];
  onChange?: (chips: Section[], chip?: Section) => void;
  loading?: boolean;
  selectedChip?: Section | null;
  setSelectedChip?: (chip: Section) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_CHIP_WIDTH = SCREEN_WIDTH * 0.6;
const CHIP_REGEX = /^\d+\.\s*/;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const InputWithChip = React.memo(
  ({
    initialChips = [],
    onChange,
    loading = false,
    selectedChip,
    setSelectedChip,
  }: Props) => {
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef<TextInput>(null);

    const chipsMap = useMemo(
      () => new Map(initialChips.map((chip) => [chip.value, chip])),
      [initialChips]
    );

    const handleAddChip = useCallback(() => {
      const newChipNumber = initialChips.length + 1;
      const newChip: Section = {
        value: `new-${Date.now()}`,
        label: `${newChipNumber}`,
        isNew: true,
        status: "incomplete",
      };
      const updatedChips = [...initialChips, newChip];
      onChange?.(updatedChips);
      setSelectedChip?.(newChip);
      setInputValue("");
      inputRef.current?.focus();
    }, [initialChips, onChange, setSelectedChip]);

    const handleInputChange = useCallback(
      (text: string) => {
        setInputValue(text);
        if (!selectedChip?.value.includes("new-")) return;
        const updatedChips = initialChips.map((chip) =>
          chip.value === selectedChip?.value
            ? {
              ...chip,
              label: text,
            }
            : chip
        );
        onChange?.(
          updatedChips,
          updatedChips.find((chip) => chip.value === selectedChip?.value)
        );
      },
      [initialChips, selectedChip, onChange]
    );

    const handleUpdateName = useCallback(() => {
      const updatedChips = initialChips.map((chip) =>
        chip.value === selectedChip?.value
          ? {
            ...chip,
            label: inputValue.replace(CHIP_REGEX, ""),
          }
          : chip
      );
      onChange?.(
        updatedChips,
        updatedChips.find((chip) => chip.value === selectedChip?.value)
      );
    }, [inputValue, initialChips, onChange, selectedChip]);

    const handleSelectChip = useCallback(
      (chip: Section) => {
        setSelectedChip?.(chip);
        const selected = chipsMap.get(chip.value);
        setInputValue((selected?.label ?? "").replace(CHIP_REGEX, ""));
      },
      [chipsMap, setSelectedChip]
    );

    const inputAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: withSpring(1) }],
      };
    });

    const renderChip = useCallback(
      (item: Section) => {
        console.log("KKJJ", item.status);
        const isSelected = selectedChip?.value === item.value;

        return (
          <AnimatedTouchable
            key={item.value}
            entering={FadeIn}
            exiting={FadeOut}
            layout={LinearTransition.springify()}
            style={[
              styles.chip,
              {
                backgroundColor:
                  isSelected ? colors.primary : colors[item.status ?? "processed"],
              },
            ]}
            onPress={() => handleSelectChip(item)}
            accessibilityLabel={
              isSelected
                ? `Selected chip: ${item.label}`
                : `Chip: ${item.label}`
            }
          >
            <Text
              style={[
                styles.chipText,
                {
                  fontWeight: isSelected ? "600" : "500",
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.label || "New Section"}
            </Text>
          </AnimatedTouchable>
        );
      },
      [handleSelectChip, selectedChip]
    );

    if (loading)
      return (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      );

    return (
      <View style={styles.container} accessibilityRole="menu">
        <Animated.View
          style={styles.chipsContainer}
          layout={LinearTransition.springify()}
        >
          {initialChips.map(renderChip)}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddChip}
            accessibilityLabel="Add new chip"
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.inputContainer}>
          <AnimatedTextInput
            ref={inputRef}
            style={[styles.input, inputAnimatedStyle]}
            value={inputValue}
            onChangeText={handleInputChange}
            placeholder="Enter section name..."
            placeholderTextColor="#999"
            accessibilityLabel="Section name input"
            entering={FadeIn.duration(300)}
            layout={LinearTransition}
          />
          {inputValue !== selectedChip?.label &&
            !selectedChip?.value.includes("new-") && (
              <Button
                title={`Update\nSection Name`}
                textStyle={styles.updateButtonText}
                style={styles.updateButton}
                onPress={handleUpdateName}
              />
            )}
        </View>

        {!loading && !inputValue && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Text style={styles.infoText}>
              Start typing to create your first section
            </Text>
          </Animated.View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    zIndex: -1,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: MAX_CHIP_WIDTH,
    marginVertical: 4,
  },
  selectedChip: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "500",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 20,
    color: colors.primary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 8,
    flex: 1,
  },
  infoText: {
    color: "#666",
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  loading: {
    marginVertical: 20,
  },
  updateButtonText: {
    fontSize: 12,
    textAlign: "center",
  },
  updateButton: {
    paddingVertical: 8,
  },
});

export default InputWithChip;
