import { StyleSheet, View, FlatList } from "react-native";
import { Card, Text, Avatar, FAB } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export default function Screen() {
  const [data, setData] = useState<SleepEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

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
  };

  const renderItem = ({ item }: { item: SleepEntry }) => (
    <Card style={styles.card} mode="contained">
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

      <FAB icon="plus" style={styles.fab} onPress={handleAddSleep} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
});
