import {
  StyleSheet,
  View,
  FlatList,
  Modal,
  Pressable,
  Image,
  Linking,
} from "react-native";
import { Card, Text, Avatar, FAB } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AddTodo from "@/componeets/AddTodo";

const TODOS_STORAGE_KEY = "todos_data";
const LEETCODE_STORAGE_KEY = "leetcode_profile";
const GITHUB_STORAGE_KEY = "github_profile";
const LEETCODE_PROFILE_URL =
  "https://alfa-leetcode-api.onrender.com/soumyajaiswal7708";
const GITHUB_PROFILE_URL = "https://api.github.com/users/nios-x";
const APP_LOGO = require("../assets/images/icon.png");

type Todo = {
  id: string;
  title: string;
  description: string;
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
export default function Screen() {
  const [addVisible, setAddVisible] = useState(false);
  const [data, setData] = useState<Todo[]>(initialTodos);
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<LeetCodeProfile | null>(null);
  const [githubProfile, setGithubProfile] = useState<GitHubProfile | null>(null);

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
    const loadProfile = async () => {
      try {
        const cachedProfile = await AsyncStorage.getItem(LEETCODE_STORAGE_KEY);
        if (cachedProfile) {
          setProfile(JSON.parse(cachedProfile));
        }

        const response = await fetch(LEETCODE_PROFILE_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

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

    loadProfile();
  }, []);

  useEffect(() => {
    const loadGithubProfile = async () => {
      try {
        const cachedGithubProfile = await AsyncStorage.getItem(GITHUB_STORAGE_KEY);
        if (cachedGithubProfile) {
          setGithubProfile(JSON.parse(cachedGithubProfile));
        }

        const response = await fetch(GITHUB_PROFILE_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch GitHub profile");
        }

        const latestGithubProfile: GitHubProfile = await response.json();
        setGithubProfile(latestGithubProfile);
        await AsyncStorage.setItem(
          GITHUB_STORAGE_KEY,
          JSON.stringify(latestGithubProfile)
        );
      } catch (error) {
        console.warn("Failed to load GitHub profile:", error);
      }
    };

    loadGithubProfile();
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

  const [visible, setVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const openDeleteModal = (id: string) => {
    setSelectedId(id);
    setVisible(true);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    setData((prev) => prev.filter((item) => item.id !== selectedId));
    setVisible(false);
  };
  const handleDone = () => {
    if (!selectedId) return;
    setData((prev) => prev.filter((item) => item.id !== selectedId));
    setVisible(false);
  };
  const handleAddTodo = (title: string, description: string) => {
    setData((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        title,
        description,
      },
    ]);
  };

  const openExternal = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
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
          <Text style={styles.header}>Code Dashboard</Text>
          <Text style={styles.subHeader}>Track profile stats and daily tasks</Text>
        </View>
      </View>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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

            {githubProfile ? (
              <Card style={styles.profileCard} mode="contained">
                <View style={styles.row}>
                  <Avatar.Image
                    size={46}
                    source={{ uri: githubProfile.avatar_url }}
                    style={styles.profileAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="titleMedium" style={styles.title}>
                      {githubProfile.name ?? githubProfile.login}
                    </Text>
                    <Text variant="bodyMedium" style={styles.description}>
                      @{githubProfile.login}
                    </Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  Repos {githubProfile.public_repos} | Followers {githubProfile.followers} |
                  Following {githubProfile.following}
                </Text>
                {githubProfile.bio ? (
                  <Text style={styles.meta}>Bio: {githubProfile.bio}</Text>
                ) : null}
                {githubProfile.blog ? (
                  <Pressable onPress={() => openExternal(githubProfile.blog as string)}>
                    <Text style={styles.link}>Website: {githubProfile.blog}</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => openExternal(githubProfile.html_url)}>
                  <Text style={styles.link}>Profile: {githubProfile.html_url}</Text>
                </Pressable>
              </Card>
            ) : null}
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
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 6,
    marginBottom: 12,
  },
  profileCard: {
    borderRadius: 18,
    marginBottom: 14,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECEFF5",
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
  profileAvatar: {
    backgroundColor: "#F3F3F3",
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
  meta: {
    color: "#374151",
    marginTop: 7,
    lineHeight: 19,
  },
  link: {
    color: "#2563EB",
    marginTop: 7,
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
