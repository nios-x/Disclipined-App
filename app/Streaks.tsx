import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Avatar, Card, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const LEETCODE_PROFILE_URL =
  "https://alfa-leetcode-api.onrender.com/soumyajaiswal7708/profile";
const GITHUB_EVENTS_URL = "https://api.github.com/users/nios-x/events/public";
const GITHUB_PROFILE_URL = "https://api.github.com/users/nios-x";
const SLEEP_STORAGE_KEY = "sleep_logs";
const TASK_COMPLETION_HISTORY_KEY = "todos_completed_history";
const FINISHED_TODOS_COUNT_KEY = "todos_finished_count";
const POINTS_STORAGE_KEY = "user_points";
const CALENDAR_WEEKS = 16;

type StreakItem = {
  id: string;
  name: string;
  streak: string;
  note: string;
  avatar: string;
};

type StatItem = {
  id: string;
  platform: string;
  score: string;
  subtitle: string;
  avatar: string;
};

type LeetCodeProfile = {
  submissionCalendar?: Record<string, number>;
  totalSolved?: number;
  ranking?: number;
  recentSubmissions?: { statusDisplay: string }[];
};

type GitHubEvent = {
  created_at: string;
};

type GitHubProfile = {
  public_repos: number;
  followers: number;
  following: number;
  updated_at: string;
};

type SleepEntry = {
  id: string;
  timestamp?: number;
};

type TaskCompletionHistory = Record<string, number>;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const dayKey = (d: Date) => startOfDay(d).toISOString().slice(0, 10);

const localDayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildCalendarColumns = (weeks: number) => {
  const today = startOfDay(new Date());
  const rangeStart = new Date(today);
  rangeStart.setDate(today.getDate() - (weeks * 7 - 1));

  const alignedStart = new Date(rangeStart);
  alignedStart.setDate(rangeStart.getDate() - rangeStart.getDay());

  const days: Date[] = [];
  const cursor = new Date(alignedStart);
  while (cursor <= today) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  while (days.length % 7 !== 0) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const columns: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7));
  }

  return columns.slice(-weeks);
};

const getHeatColor = (count: number, isFuture: boolean) => {
  if (isFuture) return "transparent";
  if (count <= 0) return "#EBEDF0";
  if (count === 1) return "#9BE9A8";
  if (count <= 3) return "#40C463";
  return "#216E39";
};

const formatDate = (dateValue: string | number) =>
  new Date(dateValue).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

const calculateStreak = (activeDayKeys: Set<string>) => {
  let streak = 0;
  const cursor = startOfDay(new Date());

  while (activeDayKeys.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

export default function Streaks() {
  const [githubDays, setGithubDays] = useState<Set<string>>(new Set());
  const [leetcodeDays, setLeetcodeDays] = useState<Set<string>>(new Set());
  const [sleepDays, setSleepDays] = useState<Set<string>>(new Set());
  const [sleepLogs, setSleepLogs] = useState<SleepEntry[]>([]);
  const [leetcodeStats, setLeetcodeStats] = useState<LeetCodeProfile | null>(null);
  const [githubProfile, setGithubProfile] = useState<GitHubProfile | null>(null);
  const [finishedTodosCount, setFinishedTodosCount] = useState(0);
  const [points, setPoints] = useState(0);
  const [taskCompletionHistory, setTaskCompletionHistory] =
    useState<TaskCompletionHistory>({});

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
        setLeetcodeStats(payload);
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
        setSleepLogs(logs);
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

    const loadGitHubProfile = async () => {
      try {
        const response = await fetch(GITHUB_PROFILE_URL);
        if (!response.ok) throw new Error("Failed to fetch GitHub profile");
        const payload: GitHubProfile = await response.json();
        setGithubProfile(payload);
      } catch (error) {
        console.warn("GitHub profile load failed:", error);
      }
    };

    const loadFinishedTodos = async () => {
      try {
        const raw = await AsyncStorage.getItem(FINISHED_TODOS_COUNT_KEY);
        const parsed = Number(raw ?? "0");
        setFinishedTodosCount(Number.isFinite(parsed) ? parsed : 0);
      } catch (error) {
        console.warn("Finished todos load failed:", error);
      }
    };

    const loadPoints = async () => {
      try {
        const raw = await AsyncStorage.getItem(POINTS_STORAGE_KEY);
        const parsed = Number(raw ?? "0");
        setPoints(Number.isFinite(parsed) ? parsed : 0);
      } catch (error) {
        console.warn("Points load failed:", error);
      }
    };

    const loadTaskCompletionHistory = async () => {
      try {
        const raw = await AsyncStorage.getItem(TASK_COMPLETION_HISTORY_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as TaskCompletionHistory;
        setTaskCompletionHistory(parsed);
      } catch (error) {
        console.warn("Task completion history load failed:", error);
      }
    };

    loadGitHubDays();
    loadGitHubProfile();
    loadLeetCodeDays();
    loadSleepDays();
    loadFinishedTodos();
    loadPoints();
    loadTaskCompletionHistory();
  }, []);

  const streaks = useMemo<StreakItem[]>(() => {
    const githubStreak = calculateStreak(githubDays);
    const leetcodeStreak = calculateStreak(leetcodeDays);
    const sleepStreak = calculateStreak(sleepDays);
    const taskDays = new Set(
      Object.entries(taskCompletionHistory)
        .filter(([, count]) => count > 0)
        .map(([date]) => date)
    );
    const taskStreak = calculateStreak(taskDays);

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
      {
        id: "tasks",
        name: "Tasks",
        streak: `${taskStreak} day streak`,
        note: "Based on completed todos",
        avatar: "T",
      },
    ];
  }, [githubDays, leetcodeDays, sleepDays, taskCompletionHistory]);

  const calendarColumns = useMemo(
    () => buildCalendarColumns(CALENDAR_WEEKS),
    []
  );

  const summaryStats = useMemo<StatItem[]>(() => {
    const lastSleep = sleepLogs[0];
    const lastSleepTs =
      lastSleep?.timestamp ??
      (lastSleep?.id && Number.isFinite(Number(lastSleep.id))
        ? Number(lastSleep.id)
        : null);

    const acceptedToday =
      leetcodeStats?.recentSubmissions?.filter(
        (entry) => entry.statusDisplay === "Accepted"
      ).length ?? 0;

    return []
  }, [finishedTodosCount, githubProfile, leetcodeStats, points, sleepLogs]);

  const renderSummaryItem = (item: StatItem) => (
    <Card key={item.id} style={styles.card} mode="contained">
      <View style={styles.row}>
        <Avatar.Text size={30} label={item.avatar} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={styles.title}>
            {item.platform}
          </Text>
          <Text variant="bodyMedium" style={styles.metric}>
            {item.score}
          </Text>
          <Text variant="bodySmall" style={styles.description}>
            {item.subtitle}
          </Text>
        </View>
      </View>
    </Card>
  );

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
        ListHeaderComponent={
          <>
            <Card style={styles.calendarCard} mode="contained">
              <Text style={styles.calendarTitle}>Task Completion Calendar</Text>
              <Text style={styles.calendarSubtitle}>
                Days with finished tasks in the last {CALENDAR_WEEKS} weeks
              </Text>
              <View style={styles.calendarGrid}>
                {calendarColumns.map((week, weekIndex) => (
                  <View key={`week-${weekIndex}`} style={styles.weekColumn}>
                    {week.map((date) => {
                      const key = localDayKey(date);
                      const count = taskCompletionHistory[key] ?? 0;
                      const isFuture = startOfDay(date) > startOfDay(new Date());

                      return (
                        <View
                          key={key}
                          style={[
                            styles.dayCell,
                            {
                              backgroundColor: getHeatColor(count, isFuture),
                              borderColor: isFuture ? "transparent" : "#D0D7DE",
                            },
                          ]}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
              <View style={styles.legendRow}>
                <Text style={styles.legendText}>Less</Text>
                <View style={[styles.dayCell, styles.legendCell, { backgroundColor: "#EBEDF0" }]} />
                <View style={[styles.dayCell, styles.legendCell, { backgroundColor: "#9BE9A8" }]} />
                <View style={[styles.dayCell, styles.legendCell, { backgroundColor: "#40C463" }]} />
                <View style={[styles.dayCell, styles.legendCell, { backgroundColor: "#216E39" }]} />
                <Text style={styles.legendText}>More</Text>
              </View>
            </Card>

            {summaryStats.map(renderSummaryItem)}
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding:16
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
  calendarCard: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ECEFF5",
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  calendarSubtitle: {
    marginTop: 4,
    marginBottom: 12,
    color: "#666",
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: "row",
    gap: 4,
    alignSelf: "flex-start",
  },
  weekColumn: {
    flexDirection: "column",
    gap: 4,
  },
  dayCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#D0D7DE",
  },
  legendRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendText: {
    fontSize: 11,
    color: "#666",
  },
  legendCell: {
    width: 9,
    height: 9,
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
