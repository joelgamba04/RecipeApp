import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { initDb } from "../../src/db/db";
import { listRecipes } from "../../src/db/recipesRepo";
import type { RecipeRow } from "../../src/types";

export default function RecipesList() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<RecipeRow[]>([]);

  async function refresh(search = "") {
    await initDb();
    setItems(await listRecipes(search));
  }

  useEffect(() => {
    void refresh("");
  }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      void refresh(q);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <View style={{ padding: 12, gap: 10 }}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search recipes…"
        style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}
      />

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
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
    </View>
  );
}
