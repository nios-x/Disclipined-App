import { StyleSheet, View, FlatList } from "react-native";
import { Card, Text, Avatar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LEETCODE_PROFILE_URL =
  "https://alfa-leetcode-api.onrender.com/soumyajaiswal7708/profile";
const GITHUB_EVENTS_URL = "https://api.github.com/users/nios-x/events/public";
const SLEEP_STORAGE_KEY = "sleep_logs";

type StreakItem = {
  id: string;
  name: string;
  streak: string;
  note: string;
  avatar: string;
};

type LeetCodeProfile = {
  submissionCalendar?: Record<string, number>;
};

type GitHubEvent = {
  created_at: string;
};

type SleepEntry = {
  id: string;
  timestamp?: number;
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const dayKey = (d: Date) => startOfDay(d).toISOString().slice(0, 10);

const calculateStreak = (activeDayKeys: Set<string>) => {
  let streak = 0;
  const cursor = startOfDay(new Date());

  while (activeDayKeys.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

export default function Screen() {
  const [githubDays, setGithubDays] = useState<Set<string>>(new Set());
  const [leetcodeDays, setLeetcodeDays] = useState<Set<string>>(new Set());
  const [sleepDays, setSleepDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadGitHubDays = async () => {
      try {
        const response = await fetch(GITHUB_EVENTS_URL);
        if (!response.ok) throw new Error("Failed to fetch GitHub events");
        const events: GitHubEvent[] = await response.json();
        const keys = new Set(events.map((e) => dayKey(new Date(e.created_at))));
        setGithubDays(keys);
      } catch (error) {
        console.warn("GitHub streak fetch failed:", error);
      }
    };

    const loadLeetCodeDays = async () => {
      try {
        const response = await fetch(LEETCODE_PROFILE_URL);
        if (!response.ok) throw new Error("Failed to fetch LeetCode profile");
        const payload: LeetCodeProfile = await response.json();
        const keys = new Set<string>();
        const calendar = payload.submissionCalendar ?? {};
        Object.entries(calendar).forEach(([unixSeconds, count]) => {
          if (count > 0) {
            keys.add(dayKey(new Date(Number(unixSeconds) * 1000)));
          }
        });
        setLeetcodeDays(keys);
      } catch (error) {
        console.warn("LeetCode streak fetch failed:", error);
      }
    };

    const loadSleepDays = async () => {
      try {
        const raw = await AsyncStorage.getItem(SLEEP_STORAGE_KEY);
        if (!raw) return;
        const logs = JSON.parse(raw) as SleepEntry[];
        const keys = new Set(
          logs
            .map((entry) => {
              const ts =
                entry.timestamp ??
                (Number.isFinite(Number(entry.id)) ? Number(entry.id) : null);
              return ts ? dayKey(new Date(ts)) : null;
            })
            .filter((value): value is string => Boolean(value))
        );
        setSleepDays(keys);
      } catch (error) {
        console.warn("Sleep streak load failed:", error);
      }
    };

    loadGitHubDays();
    loadLeetCodeDays();
    loadSleepDays();
  }, []);

  const streaks = useMemo<StreakItem[]>(() => {
    const githubStreak = calculateStreak(githubDays);
    const leetcodeStreak = calculateStreak(leetcodeDays);
    const sleepStreak = calculateStreak(sleepDays);

    return [
      {
        id: "github",
        name: "GitHub",
        streak: `${githubStreak} day streak`,
        note: "Based on recent public GitHub activity",
        avatar: "G",
      },
      {
        id: "leetcode",
        name: "LeetCode",
        streak: `${leetcodeStreak} day streak`,
        note: "Based on submission calendar entries",
        avatar: "L",
      },
      {
        id: "sleep",
        name: "Sleep",
        streak: `${sleepStreak} day streak`,
        note: "Based on logged sleep entries",
        avatar: "Z",
      },
    ];
  }, [githubDays, leetcodeDays, sleepDays]);

  const renderItem = ({ item }: { item: StreakItem }) => (
    <Card style={styles.card} mode="contained">
      <View style={styles.row}>
        <Avatar.Text size={30} label={item.avatar} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={styles.title}>
            {item.name}
          </Text>
          <Text variant="bodyMedium" style={styles.metric}>
            {item.streak}
          </Text>
          <Text variant="bodySmall" style={styles.description}>
            {item.note}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Streaks</Text>
      <Text style={styles.subHeader}>Daily consistency across key habits</Text>

      <FlatList
        data={streaks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
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
    backgroundColor: "#6C63FF",
  },

  title: {
    fontWeight: "600",
    marginBottom: 4,
    color: "#111",
  },
  metric: {
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 2,
  },

  description: {
    color: "#666",
    lineHeight: 20,
  },
});
