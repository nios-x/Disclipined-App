import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { Avatar, Card, FAB, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const SLEEP_STORAGE_KEY = "sleep_logs";

type SleepEntry = {
  id: string;
  title: string;
  timestamp: number;
};

const formatDateTime = (date: Date) => {
  const day = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const time = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${day} at ${time}`;
};

export default function Sleep() {
  const [data, setData] = useState<SleepEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const loadSleepLogs = async () => {
      try {
        const stored = await AsyncStorage.getItem(SLEEP_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as {
            id: string;
            title?: string;
            timestamp?: number;
            description?: string;
          }[];

          const normalized: SleepEntry[] = parsed
            .map((entry) => ({
              id: entry.id,
              title: entry.title ?? "Sleep logged",
              timestamp:
                entry.timestamp ??
                (Number.isFinite(Number(entry.id))
                  ? Number(entry.id)
                  : Date.now()),
            }))
            .sort((a, b) => b.timestamp - a.timestamp);

          setData(normalized);
        }
      } catch (error) {
        console.warn("Failed to load sleep logs:", error);
      } finally {
        setHydrated(true);
      }
    };

    loadSleepLogs();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const saveSleepLogs = async () => {
      try {
        await AsyncStorage.setItem(SLEEP_STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        console.warn("Failed to save sleep logs:", error);
      }
    };

    saveSleepLogs();
  }, [data, hydrated]);

  const handleAddSleep = () => {
    const now = Date.now();
    const nextEntry: SleepEntry = {
      id: now.toString(),
      title: "Sleep logged",
      timestamp: now,
    };

    setData((prev) => {
      const nextData = [nextEntry, ...prev];
      AsyncStorage.setItem(SLEEP_STORAGE_KEY, JSON.stringify(nextData)).catch(
        (error) => {
          console.warn("Failed to persist sleep logs:", error);
        }
      );
      return nextData;
    });
    setAddVisible(false);
  };

  const openDeleteModal = (id: string) => {
    setSelectedId(id);
    setVisible(true);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    setData((prev) => prev.filter((item) => item.id !== selectedId));
    setVisible(false);
  };

  const renderItem = ({ item }: { item: SleepEntry }) => (
    <Card
      style={styles.card}
      mode="contained"
      onPress={() => openDeleteModal(item.id)}
    >
      <View style={styles.row}>
        <Avatar.Text size={30} label="Z" style={styles.avatar} />

        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={styles.title}>
            {item.title}
          </Text>

          <Text variant="bodyMedium" style={styles.description}>
            {formatDateTime(new Date(item.timestamp))}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Sleep</Text>
      <Text style={styles.subHeader}>Tap + to log current sleep time</Text>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No sleep logs yet. Tap + to add one.</Text>
        }
      />

      <FAB icon="plus" style={styles.fab} onPress={() => setAddVisible(true)} />

      <Modal
        visible={addVisible}
        transparent
        animationType="none"
        onRequestClose={() => setAddVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Log Sleep</Text>
            <Text style={styles.modalText}>
              Add a sleep log for the current time?
            </Text>
            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.cancel]}
                onPress={() => setAddVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.done]}
                onPress={handleAddSleep}
              >
                <Text style={styles.deleteText}>Log</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Delete Sleep Log</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete this sleep entry?
            </Text>
            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.cancel]}
                onPress={() => setVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.delete]}
                onPress={handleDelete}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16
  },

  header: {
    fontSize: 21,
    fontWeight: "700",
    marginTop: 12,
    marginLeft: 12,
    color: "#111",
  },
  subHeader: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    marginBottom: 12,
    marginLeft: 12,
  },

  card: {
    borderRadius: 20,
    marginBottom: 16,
    marginHorizontal: 0,
    padding: 16,
    backgroundColor: "#fff",

    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  row: {
    flexDirection: "row",
    gap: 14,
  },

  avatar: {
    marginTop: 5,
    backgroundColor: "#1f2937",
  },

  title: {
    fontWeight: "600",
    marginBottom: 4,
    color: "#111",
  },

  description: {
    color: "#666",
    lineHeight: 20,
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
    marginTop: 24,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 100,
    backgroundColor: "#ff8446",
    borderRadius: 40,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111",
  },
  modalText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  cancel: {
    backgroundColor: "#F1F1F1",
  },
  delete: {
    backgroundColor: "#FF4D4F",
  },
  done: {
    backgroundColor: "#F59E0B",
  },
  cancelText: {
    color: "#333",
    fontWeight: "600",
  },
  deleteText: {
    color: "#fff",
    fontWeight: "600",
  },
});
