import { Fonts } from "@/constants/fonts";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Text, TextInput } from "react-native-paper";
type Props = {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, description: string) => void;
};

export default function AddTodo({ visible, onClose, onAdd }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(title, description);
    setTitle("");
    setDescription("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Add Todo</Text>

          <TextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            style={styles.input}
          />

          <View style={styles.actions}>
            <Pressable style={styles.cancel} onPress={onClose}>
              <Text>Cancel</Text>
            </Pressable>

            <Pressable style={styles.add} onPress={handleAdd}>
              <Text style={{ color: "#fff" }}>Create</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    fontFamily:"Inter_400Regular",
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  header: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    fontFamily:Fonts.heading,
  },
  input: {
    marginBottom: 12,
    
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  cancel: {
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  add: {
    padding: 10,
    backgroundColor: "#6C63FF",
    borderRadius: 8,
  },
});