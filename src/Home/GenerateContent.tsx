import { memo } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Button from "../components/Button";
import colors from "../utils/colors";

const GenerateContent = ({
  isVisible,
  data,
  setAdditionalInfo,
  isOnline,
  loading,
  generateContent,
}: {
  isVisible: boolean;
  data?: string;
  setAdditionalInfo: (data: string) => void;
  isOnline?: boolean;
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
      <Button
        onPress={generateContent}
        title={"Generate Content"}
        isLoading={loading}
        isOnline={isOnline}
      />
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
});

export default memo(GenerateContent);
