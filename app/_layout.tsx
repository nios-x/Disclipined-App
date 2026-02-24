import Footer from "@/componeets/Footer";
import { Fonts } from "@/constants/fonts";
import { Poppins_400Regular, Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import Constants from "expo-constants";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { router, Tabs } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { MD3LightTheme, PaperProvider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const TASK_REMINDER_TYPE = "task_every_2_hours";
const TODOS_STORAGE_KEY = "todos_data";
const EXPO_PUSH_TOKEN_KEY = "expo_push_token";

type Todo = {
  title?: string;
};

const getTaskTitles = (rawTodos: string | null) => {
  if (!rawTodos) return [] as string[];

  try {
    const parsed = JSON.parse(rawTodos) as Todo[];
    return parsed
      .map((item) => (item.title ?? "").trim())
      .filter(Boolean);
  } catch {
    return [] as string[];
  }
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const paperTheme = {
  ...MD3LightTheme,
  fonts: {
    ...MD3LightTheme.fonts,
    bodyLarge: {
      ...MD3LightTheme.fonts.bodyLarge,
      fontFamily: Fonts.regular,
    },
    bodyMedium: {
      ...MD3LightTheme.fonts.bodyMedium,
      fontFamily: Fonts.regular,
    },
    bodySmall: {
      ...MD3LightTheme.fonts.bodySmall,
      fontFamily: Fonts.regular,
    },
    headlineLarge: {
      ...MD3LightTheme.fonts.headlineLarge,
      fontFamily: Fonts.heading,
    },
    headlineMedium: {
      ...MD3LightTheme.fonts.headlineMedium,
      fontFamily: Fonts.heading,
    },
    headlineSmall: {
      ...MD3LightTheme.fonts.headlineSmall,
      fontFamily: Fonts.heading,
    },
    titleLarge: {
      ...MD3LightTheme.fonts.titleLarge,
      fontFamily: Fonts.heading,
    },
    titleMedium: {
      ...MD3LightTheme.fonts.titleMedium,
      fontFamily: Fonts.heading,
    },
    titleSmall: {
      ...MD3LightTheme.fonts.titleSmall,
      fontFamily: Fonts.heading,
    },
    labelLarge: {
      ...MD3LightTheme.fonts.labelLarge,
      fontFamily: Fonts.regular,
    },
    labelMedium: {
      ...MD3LightTheme.fonts.labelMedium,
      fontFamily: Fonts.regular,
    },
    labelSmall: {
      ...MD3LightTheme.fonts.labelSmall,
      fontFamily: Fonts.regular,
    },
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    let receivedSub: Notifications.EventSubscription | null = null;
    let responseSub: Notifications.EventSubscription | null = null;

    const redirectFromNotification = (notification: Notifications.Notification) => {
      const url = notification.request.content.data?.url;
      if (typeof url === "string" && url.length > 0) {
        router.push(url as never);
      }
    };

    const setupPushToken = async () => {
      if (Platform.OS === "web") return;

      try {
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

        if (!projectId) return;

        const token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;

        await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);
      } catch (error) {
        console.warn("Failed to get Expo push token:", error);
      }
    };

    const setupTaskReminders = async () => {
      if (Platform.OS === "web") return;

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("task-reminders", {
          name: "Task reminders",
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF8446",
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") return;

      await setupPushToken();

      const rawTodos = await AsyncStorage.getItem(TODOS_STORAGE_KEY);
      const taskTitles = getTaskTitles(rawTodos);
      const reminderTitle =
        taskTitles.length > 0 ? taskTitles[0] : "Check your remaining tasks";
      const reminderBody =
        taskTitles.length > 1
          ? `Next: ${taskTitles.slice(1, 3).join(", ")}${taskTitles.length > 3 ? "..." : ""}`
          : "Open the app and complete it now.";

      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const existingTaskReminders = scheduled.filter(
        (item) => item.content.data?.type === TASK_REMINDER_TYPE
      );

      await Promise.all(
        existingTaskReminders.map((item) =>
          Notifications.cancelScheduledNotificationAsync(item.identifier)
        )
      );

      await Notifications.scheduleNotificationAsync({
        content: {
          title: reminderTitle,
          body: reminderBody,
          data: { type: TASK_REMINDER_TYPE },
          sound: true,
        },
        trigger: {
          seconds: 2 * 60 * 60,
          repeats: true,
          channelId: "task-reminders",
        },
      });
    };

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse?.notification) {
      redirectFromNotification(lastResponse.notification);
    }

    receivedSub = Notifications.addNotificationReceivedListener(() => {
      // Reserved for in-app notification side effects.
    });

    responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      redirectFromNotification(response.notification);
    });

    setupTaskReminders().catch((error) => {
      console.warn("Failed to setup task reminders:", error);
    });

    return () => {
      receivedSub?.remove();
      responseSub?.remove();
    };
  }, []);

  if (!fontsLoaded) return null;

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={DefaultTheme}>
        <SafeAreaView style={{ flex: 1 }}>
          <Tabs
            screenOptions={{ headerShown: false }}
            tabBar={(props) => <Footer {...props} />}
          >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="streaks" />
            <Tabs.Screen name="sleep" />
            <Tabs.Screen name="stats" />
          </Tabs>
        </SafeAreaView>
      </ThemeProvider>
    </PaperProvider>
  );
}
