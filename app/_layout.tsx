import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: "Recipes" }} />
        <Tabs.Screen name="create" options={{ title: "Create" }} />
        <Tabs.Screen name="settings" options={{ title: "Settings" }} />
        <Tabs.Screen
          name="recipe/[id]"
          options={{ title: "Recipe Details", headerShown: true }}
        />
      </Tabs>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
