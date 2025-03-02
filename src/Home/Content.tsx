import Icon from "@components/Icon";
import { Area, SensoryType } from "@lib/sectionDataType";
import colors from "@utils/colors";
import icons from "assets/icons";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const Content = ({
  data,
  loading,
  onDelete,
  onAdd,
  onUpdate,
  onDescriptionUpdate,
}: {
  data: Area[];
  loading: boolean;
  onDelete: (sensoryType: SensoryType, index: number) => void;
  onAdd: (sensoryType: SensoryType) => void;
  onUpdate: (sensoryType: SensoryType, value: string, index: number) => void;
  onDescriptionUpdate: (value: string) => void;
}) => {
  const [description, setDescription] = useState(data[0]?.description || "");
  const [editing, setEditing] = useState(false);

  const descriptionEditHandler = useCallback(() => {
    if (editing) {
      onDescriptionUpdate(description);
    }
    setEditing((prev) => !prev);
  }, [editing, description, onDescriptionUpdate]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!data[0]?.description) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.descriptionContainer}>
        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput
          value={description || data[0]?.description}
          style={[styles.descriptionInput, editing && styles.activeInput]}
          onChangeText={setDescription}
          multiline
          editable={editing}
          placeholder="Enter area description..."
          placeholderTextColor="#999"
        />
        <Pressable
          onPress={descriptionEditHandler}
          style={({ pressed }) => [
            styles.editButton,
            pressed && styles.pressedButton,
          ]}
          hitSlop={10}
        >
          <Icon
            type="Feather"
            name={editing ? "save" : "edit"}
            size={16}
            color={colors.primary}
          />
          <Text style={styles.buttonText}>{editing ? "Save" : "Edit"}</Text>
        </Pressable>
      </View>

      {(["sounds", "smells", "feels", "sights"] as const).map((sensoryType) => (
        <View key={sensoryType} style={styles.sensoryContainer}>
          <View style={styles.sensoryHeader}>
            <Image source={icons[sensoryType]} style={styles.sensoryIcon} />
            <Text style={styles.sensoryTitle}>
              {sensoryType.charAt(0).toUpperCase() + sensoryType.slice(1)}
            </Text>
          </View>

          {data[0][sensoryType].map((item, index) => (
            <View key={`${sensoryType}-${index}`} style={styles.inputContainer}>
              <TextInput
                value={item.value}
                style={styles.input}
                onChangeText={(text) => onUpdate(sensoryType, text, index)}
                placeholder={`Add ${sensoryType}...`}
                placeholderTextColor="#999"
              />
              <Pressable
                onPress={() => onDelete(sensoryType, index)}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && styles.pressedButton,
                ]}
                hitSlop={10}
              >
                <Icon name="trash" size={16} color={colors.error} />
              </Pressable>
            </View>
          ))}

          <Pressable
            onPress={() => onAdd(sensoryType)}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressedButton,
            ]}
            hitSlop={10}
          >
            <Icon name="add" size={16} color={colors.primary} />
            <Text style={styles.buttonText}>Add New</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 100,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeInput: {
    borderColor: colors.primary,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  sensoryContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sensoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sensoryIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
    resizeMode: "contain",
  },
  sensoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    marginRight: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    right: 0,
    top: 0,
    padding: 6,
    borderRadius: 6,
  },
  buttonText: {
    marginLeft: 6,
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  pressedButton: {
    opacity: 0.6,
    backgroundColor: "#F0F0F0",
  },
  noData: {
    textAlign: "center",
    color: colors.text,
    fontSize: 16,
  },
  emptyContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyText: {
    color: colors.text,
    fontSize: 16,
    textAlign: "center",
  },
});

export default React.memo(Content);
