import { memo, useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Icon } from "../components/Icon";
import colors from "../utils/colors";

const Prompt = ({
  data,
  getPrompt,
  setPrompt,
  loading,
  updatePrompt,
}: {
  data: string;
  getPrompt: () => void;
  setPrompt: (data: string) => void;
  updatePrompt: (prompt: string) => void;
  loading: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    if (!expanded) {
      getPrompt();
    }
    setExpanded((prev) => !prev);
  }, [expanded, getPrompt]);

  const handleUpdate = useCallback(() => {
    updatePrompt(data || "");
    setExpanded(false);
  }, [data, updatePrompt]);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleToggle}
        style={({ pressed }: { pressed: boolean }) => [
          styles.promptButton,
          pressed && styles.pressedButton,
        ]}
        disabled={loading}
        android_ripple={{ color: "#36877F22" }}
      >
        <Text style={styles.buttonText}>Prompt</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Icon
            type="Feather"
            name={expanded ? "chevron-up" : "chevron-down"}
            color={colors.primary}
          />
        )}
      </Pressable>

      {expanded && (
        <TextInput
          value={data}
          onChangeText={setPrompt}
          style={styles.input}
          multiline
          editable={!loading}
          placeholder="Enter your prompt..."
          placeholderTextColor="#999"
        />
      )}

      {expanded && (
        <Pressable
          onPress={handleUpdate}
          style={({ pressed }: { pressed: boolean }) => [
            styles.updateButton,
            pressed && styles.pressedUpdateButton,
          ]}
          disabled={loading}
          android_ripple={{ color: "#ffffff44" }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.updateButtonText}>Update Prompt</Text>
          )}
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
    overflow: "hidden",
  },
  promptButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "space-between",
  },
  pressedButton: {
    backgroundColor: "#36877F11",
  },
  buttonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    fontSize: 14,
    textAlignVertical: "top",
    minHeight: 100,
    maxHeight: 300,
  },
  updateButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pressedUpdateButton: {
    opacity: 0.8,
  },
  updateButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "500",
  },
});

export default memo(Prompt);
