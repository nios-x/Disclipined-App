import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";

type TabRoutes = "Home" | "Streaks" | "Sleep" | "Stats";

const icons: Record<TabRoutes, keyof typeof MaterialIcons.glyphMap> = {
  Home: "home",
  Streaks: "local-fire-department",
  Sleep: "bedtime",
  Stats: "analytics",
};

export default function Footer({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const routeName = route.name as TabRoutes;
          const iconName =
            icons[routeName] ?? ("circle" as keyof typeof MaterialIcons.glyphMap);

          const onPress = () => {
            if (!isFocused) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.item}>
              <MaterialIcons
                name={iconName}
                size={26}
                color={isFocused ? "#ff7363" : "#999"}
              />

              <Text
                style={[
                  styles.label,
                  { color: isFocused ? "#ff7d63" : "#999" },
                ]}
              >
                {route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },

  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingVertical: 12,
    justifyContent: "space-around",

    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 105,
    shadowOffset: { width: 0, height: 5 },
  },

  item: {
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    fontSize: 11,
    marginTop: 2,
  },

  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: "#6C63FF",
    marginTop: 4,
  },
});