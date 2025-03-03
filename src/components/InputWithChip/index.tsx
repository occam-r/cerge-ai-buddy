import { ProcessMap } from "@lib/AppType";
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
} from "react-native-reanimated";

export interface ChipType {
  value: string;
  label: string;
  isNew?: boolean;
  status?: ProcessMap;
}

interface InputWithChipProps {
  status?: ProcessMap;
  initialChips?: ChipType[];
  onChange?: (chips: ChipType[], chip?: ChipType) => void;
  loading?: boolean;
  selectedChip?: ChipType | null;
  setSelectedChip?: (chip: ChipType) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_CHIP_WIDTH = SCREEN_WIDTH * 0.6;
const CHIP_REGEX = /^\d+\.\s*/;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const InputWithChip = React.memo(
  ({
    initialChips = [],
    onChange,
    loading = false,
    selectedChip,
    setSelectedChip,
  }: InputWithChipProps) => {
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef<TextInput>(null);

    const chipsMap = useMemo(
      () => new Map(initialChips.map((chip) => [chip.value, chip])),
      [initialChips]
    );

    const handleAddChip = useCallback(() => {
      const newChipNumber = initialChips.length + 1;
      const newChip: ChipType = {
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
        const updatedChips = initialChips.map((chip) =>
          chip.value === selectedChip?.value
            ? {
                ...chip,
                label: chip.isNew ? text.replace(CHIP_REGEX, "") : text,
              }
            : chip
        );
        onChange?.(
          updatedChips,
          updatedChips.find((chip) => chip.value == selectedChip?.value)
        );
      },
      [initialChips, selectedChip, onChange]
    );

    const handleSelectChip = useCallback(
      (chip: ChipType) => {
        setSelectedChip?.(chip);
        const selected = chipsMap.get(chip.value);
        setInputValue((selected?.label ?? "").replace(CHIP_REGEX, ""));
      },
      [chipsMap, setSelectedChip]
    );

    const renderChip = useCallback(
      (item: ChipType) => {
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
                  colors[isSelected ? "primary" : item.status ?? "border"],
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
              style={[styles.chipText, isSelected && styles.selectedChipText]}
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
        <View style={styles.chipsContainer}>
          {initialChips.map(renderChip)}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddChip}
            accessibilityLabel="Add new chip"
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={inputValue}
          onChangeText={handleInputChange}
          placeholder="Enter section name..."
          placeholderTextColor="#999"
          accessibilityLabel="Section name input"
        />

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
    color: "#333",
    fontSize: 14,
  },
  selectedChipText: {
    color: "white",
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
  input: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 8,
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
});

export default InputWithChip;
