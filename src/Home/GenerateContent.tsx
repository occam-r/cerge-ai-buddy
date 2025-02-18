import { memo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import colors from "../utils/colors";

const GenerateContent = ({
  isVisible,
  data,
  setAdditionalInfo,
  loading,
  generateContent,
}: {
  isVisible: boolean;
  data: string;
  setAdditionalInfo: (data: string) => void;
  loading: boolean;
  generateContent: () => void;
}) => {
  if (!isVisible) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.buttonText}>
        Additional information about section
      </Text>

      <TextInput
        value={data}
        onChangeText={setAdditionalInfo}
        style={styles.input}
        multiline
        editable={!loading}
        placeholder="Enter additional information..."
        placeholderTextColor="#999"
      />

      <Pressable
        onPress={generateContent}
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
          <Text style={styles.updateButtonText}>Generate Content</Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
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
    marginTop: 24,
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

export default memo(GenerateContent);
