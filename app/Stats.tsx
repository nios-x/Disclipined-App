import { StyleSheet, View, FlatList } from "react-native";
import { Card, Text, Avatar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LEETCODE_PROFILE_URL =
  "https://alfa-leetcode-api.onrender.com/soumyajaiswal7708/profile";
const GITHUB_PROFILE_URL = "https://api.github.com/users/nios-x";
const SLEEP_STORAGE_KEY = "sleep_logs";

type StatItem = {
  id: string;
  platform: string;
  score: string;
  subtitle: string;
  avatar: string;
};

type LeetCodeProfile = {
  totalSolved: number;
  ranking: number;
  recentSubmissions?: { statusDisplay: string }[];
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

const formatDate = (dateValue: string | number) =>
  new Date(dateValue).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

export default function Screen() {
  const [leetcode, setLeetcode] = useState<LeetCodeProfile | null>(null);
  const [github, setGithub] = useState<GitHubProfile | null>(null);
  const [sleepLogs, setSleepLogs] = useState<SleepEntry[]>([]);

  useEffect(() => {
    const loadLeetCode = async () => {
      try {
        const response = await fetch(LEETCODE_PROFILE_URL);
        if (!response.ok) throw new Error("Failed to fetch LeetCode");
        const payload: LeetCodeProfile = await response.json();
        setLeetcode(payload);
      } catch (error) {
        console.warn("LeetCode stats fetch failed:", error);
      }
    };

    const loadGitHub = async () => {
      try {
        const response = await fetch(GITHUB_PROFILE_URL);
        if (!response.ok) throw new Error("Failed to fetch GitHub");
        const payload: GitHubProfile = await response.json();
        setGithub(payload);
      } catch (error) {
        console.warn("GitHub stats fetch failed:", error);
      }
    };

    const loadSleepLogs = async () => {
      try {
        const raw = await AsyncStorage.getItem(SLEEP_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as SleepEntry[];
        setSleepLogs(parsed);
      } catch (error) {
        console.warn("Sleep stats load failed:", error);
      }
    };

    loadLeetCode();
    loadGitHub();
    loadSleepLogs();
  }, []);

  const stats = useMemo<StatItem[]>(() => {
    const lastSleep = sleepLogs[0];
    const lastSleepTs =
      lastSleep?.timestamp ??
      (lastSleep?.id && Number.isFinite(Number(lastSleep.id))
        ? Number(lastSleep.id)
        : null);

    const acceptedToday =
      leetcode?.recentSubmissions?.filter(
        (entry) => entry.statusDisplay === "Accepted"
      ).length ?? 0;

    return [
      {
        id: "github",
        platform: "GitHub",
        score: github ? `${github.public_repos} Public Repos` : "Loading...",
        subtitle: github
          ? `${github.followers} followers • ${github.following} following • updated ${formatDate(github.updated_at)}`
          : "Fetching GitHub stats",
        avatar: "G",
      },
      {
        id: "leetcode",
        platform: "LeetCode",
        score: leetcode ? `Solved ${leetcode.totalSolved}` : "Loading...",
        subtitle: leetcode
          ? `Rank #${leetcode.ranking} • ${acceptedToday} recent accepted`
          : "Fetching LeetCode stats",
        avatar: "L",
      },
      {
        id: "sleep",
        platform: "Sleep",
        score: `${sleepLogs.length} Logs`,
        subtitle: lastSleepTs
          ? `Last logged ${formatDate(lastSleepTs)}`
          : "No sleep logs yet",
        avatar: "Z",
      },
    ];
  }, [github, leetcode, sleepLogs]);

  const renderItem = ({ item }: { item: StatItem }) => (
    <Card style={styles.card} mode="contained">
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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Stats</Text>
      <Text style={styles.subHeader}>GitHub, LeetCode, and sleep overview</Text>
      <FlatList
        data={stats}
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
