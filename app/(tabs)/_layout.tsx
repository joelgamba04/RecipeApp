// app/(tabs)/_layout.tsx

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerTitleAlign: "center",
        tabBarShowLabel: true,
        tabBarIcon: ({ focused, color, size }) => {
          const icon = getTabIcon(route.name, focused);
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Recipes" }} />
      <Tabs.Screen name="create" options={{ title: "Create" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}

const getTabIcon = (name: string, focused: boolean) => {
  switch (name) {
    case "index":
      return focused ? "bookmark" : "bookmark-outline"; // Recipes
    case "create":
      return focused ? "add-circle" : "add-circle-outline"; // Create
    case "settings":
      return focused ? "settings" : "settings-outline"; // Settings
    default:
      return focused ? "ellipse" : "ellipse-outline";
  }
};
