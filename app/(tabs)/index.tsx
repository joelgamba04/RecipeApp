import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { listRecipes } from "../../src/db/recipesRepo";
import type { RecipeRow } from "../../src/types";

const RecipesList = () => {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<RecipeRow[]>([]);

  const refresh = useCallback(async () => {
    const data = await listRecipes(q);
    setItems(data);
  }, [q]);

  // Refresh the list whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return (
    <SafeAreaView style={{ flex: 1, padding: 12 }} edges={["bottom"]}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search recipes…"
        style={{
          borderWidth: 1,
          borderRadius: 10,
          padding: 10,
          marginBottom: 12,
        }}
      />

      <FlatList
        data={items}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <Link
            href={{ pathname: "/recipe/[id]", params: { id: item.id } }}
            asChild
          >
            <Pressable
              style={{
                padding: 12,
                borderWidth: 1,
                borderRadius: 12,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700" }}>
                {item.title}
              </Text>
              <Text style={{ opacity: 0.7 }}>Servings: {item.servings}</Text>
            </Pressable>
          </Link>
        )}
      />
    </SafeAreaView>
  );
};;

export default RecipesList;
