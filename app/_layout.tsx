import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "@/componeets/Footer";

import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { Poppins_600SemiBold } from "@expo-google-fonts/poppins";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Poppins_600SemiBold,
  });

  // ✅ IMPORTANT — wait until fonts load
  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={DefaultTheme}>
      <SafeAreaView style={{ flex: 1 }}>
        <Tabs
          screenOptions={{ headerShown: false }}
          tabBar={(props) => <Footer {...props} />}
        >
          <Tabs.Screen name="Home" />
          <Tabs.Screen name="Streaks" />
          <Tabs.Screen name="Sleep" />
          <Tabs.Screen name="Stats" />
        </Tabs>
      </SafeAreaView>
    </ThemeProvider>
  );
}
