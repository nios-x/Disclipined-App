import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Linking, Pressable, StyleSheet, View } from "react-native";
import { Avatar, Card, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const LEETCODE_PROFILE_URL =
  "https://alfa-leetcode-api.onrender.com/soumyajaiswal7708";
const LEETCODE_STATS_URL =
  "https://alfa-leetcode-api.onrender.com/soumyajaiswal7708/profile";
const GITHUB_PROFILE_URL = "https://api.github.com/users/nios-x";
const SLEEP_STORAGE_KEY = "sleep_logs";
const FINISHED_TODOS_COUNT_KEY = "todos_finished_count";
const POINTS_STORAGE_KEY = "user_points";
const LEETCODE_STORAGE_KEY = "leetcode_profile";
const GITHUB_STORAGE_KEY = "github_profile";

type StatItem = {
  id: string;
  platform: string;
  score: string;
  subtitle: string;
  avatar: string;
};

type LeetCodeProfile = {
  username: string;
  name: string;
  avatar: string;
  ranking: number;
  reputation: number;
  gitHub: string | null;
  linkedIN: string | null;
  country: string | null;
  about: string | null;
};

type LeetCodeStats = {
  totalSolved: number;
  ranking: number;
  recentSubmissions?: { statusDisplay: string }[];
};

type GitHubProfile = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  blog: string | null;
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

export default function Stats() {
  const [profile, setProfile] = useState<LeetCodeProfile | null>(null);
  const [leetcode, setLeetcode] = useState<LeetCodeStats | null>(null);
  const [github, setGithub] = useState<GitHubProfile | null>(null);
  const [sleepLogs, setSleepLogs] = useState<SleepEntry[]>([]);
  const [finishedTodosCount, setFinishedTodosCount] = useState(0);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const cachedProfile = await AsyncStorage.getItem(LEETCODE_STORAGE_KEY);
        if (cachedProfile) {
          setProfile(JSON.parse(cachedProfile));
        }

        const response = await fetch(LEETCODE_PROFILE_URL);
        if (!response.ok) throw new Error("Failed to fetch profile");

        const latestProfile: LeetCodeProfile = await response.json();
        setProfile(latestProfile);
        await AsyncStorage.setItem(
          LEETCODE_STORAGE_KEY,
          JSON.stringify(latestProfile)
        );
      } catch (error) {
        console.warn("Failed to load LeetCode profile:", error);
      }
    };

    const loadLeetCode = async () => {
      try {
        const response = await fetch(LEETCODE_STATS_URL);
        if (!response.ok) throw new Error("Failed to fetch LeetCode");
        const payload: LeetCodeStats = await response.json();
        setLeetcode(payload);
      } catch (error) {
        console.warn("LeetCode stats fetch failed:", error);
      }
    };

    const loadGitHub = async () => {
      try {
        const cachedGithubProfile = await AsyncStorage.getItem(GITHUB_STORAGE_KEY);
        if (cachedGithubProfile) {
          setGithub(JSON.parse(cachedGithubProfile));
        }

        const response = await fetch(GITHUB_PROFILE_URL);
        if (!response.ok) throw new Error("Failed to fetch GitHub");
        const payload: GitHubProfile = await response.json();
        setGithub(payload);
        await AsyncStorage.setItem(GITHUB_STORAGE_KEY, JSON.stringify(payload));
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

    const loadFinishedTodos = async () => {
      try {
        const raw = await AsyncStorage.getItem(FINISHED_TODOS_COUNT_KEY);
        const parsed = Number(raw ?? "0");
        setFinishedTodosCount(Number.isFinite(parsed) ? parsed : 0);
      } catch (error) {
        console.warn("Finished todos stats load failed:", error);
      }
    };

    const loadPoints = async () => {
      try {
        const raw = await AsyncStorage.getItem(POINTS_STORAGE_KEY);
        const parsed = Number(raw ?? "0");
        setPoints(Number.isFinite(parsed) ? parsed : 0);
      } catch (error) {
        console.warn("Points stats load failed:", error);
      }
    };

    loadProfile();
    loadLeetCode();
    loadGitHub();
    loadSleepLogs();
    loadFinishedTodos();
    loadPoints();
  }, []);

  const openExternal = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  const stats = useMemo<StatItem[]>(() => {
    return [];
  }, []);

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
        ListHeaderComponent={
          <>
            {profile ? (
              <Card style={styles.profileCard} mode="contained">
                <View style={styles.row}>
                  <Avatar.Image
                    size={46}
                    source={{ uri: profile.avatar }}
                    style={styles.profileAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="titleMedium" style={styles.title}>
                      {profile.name}
                    </Text>
                    <Text variant="bodyMedium" style={styles.description}>
                      @{profile.username} | Rank #{profile.ranking}
                    </Text>
                  </View>
                </View>
                <Text style={styles.meta}>Country: {profile.country ?? "N/A"}</Text>
                <Text style={styles.meta}>Reputation: {profile.reputation}</Text>
                {profile.about ? <Text style={styles.meta}>About: {profile.about}</Text> : null}
                {profile.gitHub ? (
                  <Pressable onPress={() => openExternal(profile.gitHub as string)}>
                    <Text style={styles.link}>GitHub: {profile.gitHub}</Text>
                  </Pressable>
                ) : null}
                {profile.linkedIN ? (
                  <Pressable onPress={() => openExternal(profile.linkedIN as string)}>
                    <Text style={styles.link}>LinkedIn: {profile.linkedIN}</Text>
                  </Pressable>
                ) : null}
              </Card>
            ) : null}

            {github ? (
              <Card style={styles.profileCard} mode="contained">
                <View style={styles.row}>
                  <Avatar.Image
                    size={46}
                    source={{ uri: github.avatar_url }}
                    style={styles.profileAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="titleMedium" style={styles.title}>
                      {github.name ?? github.login}
                    </Text>
                    <Text variant="bodyMedium" style={styles.description}>
                      @{github.login}
                    </Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  Repos {github.public_repos} | Followers {github.followers} | Following{" "}
                  {github.following}
                </Text>
                {github.bio ? <Text style={styles.meta}>Bio: {github.bio}</Text> : null}
                {github.blog ? (
                  <Pressable onPress={() => openExternal(github.blog as string)}>
                    <Text style={styles.link}>Website: {github.blog}</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => openExternal(github.html_url)}>
                  <Text style={styles.link}>Profile: {github.html_url}</Text>
                </Pressable>
              </Card>
            ) : null}
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
  profileCard: {
    borderRadius: 18,
    marginBottom: 14,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECEFF5",
  },

  row: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },

  avatar: {
    marginTop: 5,
    backgroundColor: "#6C63FF",
  },
  profileAvatar: {
    backgroundColor: "#F3F3F3",
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
  meta: {
    color: "#374151",
    marginTop: 7,
    lineHeight: 19,
  },
  link: {
    color: "#2563EB",
    marginTop: 7,
  },
});
