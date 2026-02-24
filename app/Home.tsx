import AddTodo from "@/componeets/AddTodo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Avatar, Button, Card, FAB, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const TODOS_STORAGE_KEY = "todos_data";
const FINISHED_TODOS_COUNT_KEY = "todos_finished_count";
const POINTS_STORAGE_KEY = "user_points";
const TASK_COMPLETION_HISTORY_KEY = "todos_completed_history";
const POINTS_PER_TASK = 10;
const APP_LOGO = require("../assets/images/icon.png");

type Todo = {
  id: string;
  title: string;
  description: string;
};

const getLocalDayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const initialTodos: Todo[] = [
  {
    id: "1",
    title: "My name is Soumya",
    description: "Datyshdsljkhck fdsfghlsh L dffhdjlfhs kjdfskjdhfjk jbkjb",
  },
  {
    id: "2",
    title: "My name is Soumya",
    description: "Datyshdsljkhck fdsfghlsh L dffhdjlfhs kjdfskjdhfjk jbkjb",
  },
  {
    id: "3",
    title: "My name is Soumya",
    description: "Datyshdsljkhck fdsfghlsh L dffhdjlfhs kjdfskjdhfjk jbkjb",
  },
];
export default function Home() {
  const [addVisible, setAddVisible] = useState(false);
  const [data, setData] = useState<Todo[]>(initialTodos);
  const [hydrated, setHydrated] = useState(false);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const loadTodos = async () => {
      try {
        const storedTodos = await AsyncStorage.getItem(TODOS_STORAGE_KEY);
        if (storedTodos) {
          setData(JSON.parse(storedTodos));
        }
      } catch (error) {
        console.warn("Failed to load todos from storage:", error);
      } finally {
        setHydrated(true);
      }
    };

    loadTodos();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const saveTodos = async () => {
      try {
        await AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        console.warn("Failed to save todos to storage:", error);
      }
    };

    saveTodos();
  }, [data, hydrated]);

  useEffect(() => {
    const loadPoints = async () => {
      try {
        const raw = await AsyncStorage.getItem(POINTS_STORAGE_KEY);
        const parsed = Number(raw ?? "0");
        setPoints(Number.isFinite(parsed) ? parsed : 0);
      } catch (error) {
        console.warn("Failed to load points:", error);
      }
    };

    loadPoints();
  }, []);

  const [visible, setVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const openDeleteModal = (id: string) => {
    setSelectedId(id);
    setVisible(true);
  };

  const incrementStoredNumber = (
    key: string,
    amount: number,
    onUpdate?: (value: number) => void
  ) => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        const current = Number(raw ?? "0");
        const safeCurrent = Number.isFinite(current) ? current : 0;
        const nextValue = safeCurrent + amount;
        onUpdate?.(nextValue);
        return AsyncStorage.setItem(key, nextValue.toString());
      })
      .catch((error) => {
        console.warn(`Failed to update ${key}:`, error);
      });
  };

  const incrementTodayCompletionHistory = () => {
    const todayKey = getLocalDayKey(new Date());

    AsyncStorage.getItem(TASK_COMPLETION_HISTORY_KEY)
      .then((raw) => {
        const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
        const nextHistory = {
          ...parsed,
          [todayKey]: (parsed[todayKey] ?? 0) + 1,
        };
        return AsyncStorage.setItem(
          TASK_COMPLETION_HISTORY_KEY,
          JSON.stringify(nextHistory)
        );
      })
      .catch((error) => {
        console.warn("Failed to update completion history:", error);
      });
  };

  const handleDelete = () => {
    if (!selectedId) return;
    setData((prev) => {
      const nextData = prev.filter((item) => item.id !== selectedId);
      AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(nextData)).catch(
        (error) => {
          console.warn("Failed to save todos to storage:", error);
        }
      );
      return nextData;
    });
    setVisible(false);
  };
  const handleDone = () => {
    if (!selectedId) return;
    setData((prev) => {
      const nextData = prev.filter((item) => item.id !== selectedId);
      AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(nextData)).catch(
        (error) => {
          console.warn("Failed to save todos to storage:", error);
        }
      );
      return nextData;
    });
    incrementStoredNumber(FINISHED_TODOS_COUNT_KEY, 1);
    incrementStoredNumber(POINTS_STORAGE_KEY, POINTS_PER_TASK, setPoints);
    incrementTodayCompletionHistory();
    setVisible(false);
  };
  const handleAddTodo = (title: string, description: string) => {
    setData((prev) => {
      const nextTodo = {
        id: Date.now().toString(),
        title,
        description,
      };
      const nextData = [
        ...prev,
        nextTodo,
      ];
      AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(nextData)).catch(
        (error) => {
          console.warn("Failed to save todos to storage:", error);
        }
      );
      return nextData;
    });
  };

  const renderItem = ({ item }: { item: Todo }) => (
    <Card
      style={styles.todoCard}
      mode="contained"
      onPress={() => openDeleteModal(item.id)}
    >
      <View style={styles.row}>
        <Avatar.Text size={30} label={item.title[0]} style={styles.avatar} />

        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={styles.title}>
            {item.title}
          </Text>

          <Text variant="bodyMedium" style={styles.description}>
            {item.description}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AddTodo
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onAdd={handleAddTodo}
      />
      <FAB icon="plus" style={styles.fab} onPress={() => setAddVisible(true)} />

      <View style={styles.headerWrap}>
        <Image source={APP_LOGO} style={styles.logo} />
        <View>
          <Text style={styles.header}> クᴏᴜᴍʏᴀ Dashboard</Text>
          <Text style={styles.subHeader}>Track profile stats and daily tasks</Text>
          <Text style={styles.pointsText}>Points: {points}</Text>
        </View>
      </View>

      <View style={styles.createButtonWrap}>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => setAddVisible(true)}
          style={styles.createButton}
          contentStyle={styles.createButtonContent}
        >
          Create Todo
        </Button>
      </View>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <Text style={styles.sectionTitle}>Your Tasks</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to add your first task.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* DELETE MODAL */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Update or Delete Task</Text>

            <Text style={styles.modalText}>
              Are you sure you want to update or delete this task?
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
              <Pressable
                style={[styles.button, styles.done]}
                onPress={handleDone}
              >
                <Text style={styles.deleteText}>Finish</Text>
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
    backgroundColor: "#F4F6FB",
  },

  headerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#121826",
  },
  subHeader: {
    color: "#5B6473",
    marginTop: 2,
    marginLeft: 6
  },
  pointsText: {
    color: "#F59E0B",
    marginTop: 4,
    marginLeft: 6,
    fontWeight: "700",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  createButtonWrap: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  createButton: {
    borderRadius: 12,
    backgroundColor: "#111827",
    alignSelf: "flex-end",
    marginTop: 10
  },
  createButtonContent: {
    paddingBottom: 0,
    paddingVertical: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 6,
    marginBottom: 12,
    paddingLeft:3,
    paddingTop:4 
  },
  todoCard: {
    borderRadius: 18,
    marginBottom: 12,
    padding: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ECEFF5",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECEFF5",
    padding: 20,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  emptySubtitle: {
    marginTop: 4,
    color: "#6B7280",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },

  avatar: {
    marginTop: 2,
    backgroundColor: "#FF8446",
  },

  title: {
    fontWeight: "700",
    marginBottom: 4,
    color: "#111827",
  },

  description: {
    color: "#4B5563",
    lineHeight: 19,
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
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    color: "white",
    zIndex: 20,
    backgroundColor: "#111827",
    borderRadius: 40,
  },
});
