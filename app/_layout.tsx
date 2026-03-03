import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { bootstrapDb } from "@/src/db/bootstrap";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    bootstrapDb()
      .then(() => setReady(true))
      .catch((e) => setErr(e?.message ?? String(e)));
  }, []);
  if (err) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ fontWeight: "700" }}>DB init failed</Text>
        <Text>{err}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Initializing…</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerTitleAlign: "center" }}>
        {/* Tabs group */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Details screen */}
        <Stack.Screen
          name="recipe/[id]"
          options={{ title: "Recipe Details" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
