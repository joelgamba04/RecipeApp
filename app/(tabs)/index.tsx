// app/(tabs)/index.tsx

import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { getRecipeById, listRecipes } from "../../src/db/recipesRepo";
import { computeRecipeTotals } from "../../src/nutrition/computeTotals";

type RecipeCardVM = {
  id: string;
  title: string;
  servings: number;
  kcalPerServing: number | null;
  photoUri?: string | null;
};

const PLACEHOLDER_URI = "https://placehold.co/256x256/png?text=Recipe"; // swap later for real photo_uri

const RecipesTab = () => {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [rows, setRows] = useState<RecipeCardVM[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const base = await listRecipes(q);

      // Compute calories per serving by hydrating each recipe.
      // OK for small lists; later we can optimize with a SQL aggregate.
      const vms = await Promise.all(
        base.map(async (r): Promise<RecipeCardVM> => {
          const hydrated = await getRecipeById(r.id);
          if (!hydrated) {
            return {
              id: r.id,
              title: r.title ?? "Untitled recipe",
              servings: r.servings ?? 1,
              kcalPerServing: null,
              photoUri: (r as any).photo_uri ?? null,
            };
          }

          const totals = computeRecipeTotals(hydrated);
          const kcal = totals.perServing["n_208"];
          return {
            id: hydrated.id,
            title: hydrated.title ?? "Untitled recipe",
            servings: hydrated.servings ?? 1,
            kcalPerServing: typeof kcal === "number" ? kcal : null,
            photoUri: hydrated.photo_uri ?? null,
          };
        }),
      );

      setRows(vms);
    } finally {
      setLoading(false);
    }
  }, [q]);

  // ✅ Refresh whenever this tab becomes active again (after adding/editing)
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  // ✅ Debounced search refresh
  useEffect(() => {
    const t = setTimeout(() => void refresh(), 250);
    return () => clearTimeout(t);
  }, [q, refresh]);

  const header = useMemo(() => {
    return (
      <View style={{ padding: 12, gap: 10 }}>
        <Text style={{ fontSize: 20, fontWeight: "900" }}>Recipes</Text>

        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search recipes…"
          style={{ borderWidth: 1, borderRadius: 12, padding: 10 }}
        />

        <Text style={{ opacity: 0.7 }}>
          {loading ? "Refreshing…" : `${rows.length} recipes`}
        </Text>
      </View>
    );
  }, [q, loading, rows.length]);

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.id}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: 24 }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/recipe/[id]" as any,
              params: { id: item.id },
            })
          }
          style={{
            marginHorizontal: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <View style={{ flexDirection: "row" }}>
            <Image
              source={{ uri: item.photoUri || PLACEHOLDER_URI }}
              style={{ width: 88, height: 88 }}
              resizeMode="cover"
            />

            <View style={{ flex: 1, padding: 12, gap: 4 }}>
              <Text
                style={{ fontSize: 16, fontWeight: "900" }}
                numberOfLines={1}
              >
                {item.title}
              </Text>

              <Text style={{ opacity: 0.7 }}>Servings: {item.servings}</Text>

              <Text style={{ opacity: 0.9, fontWeight: "700" }}>
                {item.kcalPerServing == null
                  ? "Calories/serving: —"
                  : `Calories/serving: ${Math.round(item.kcalPerServing)} kcal`}
              </Text>
            </View>
          </View>
        </Pressable>
      )}
      ListEmptyComponent={
        <View style={{ padding: 12 }}>
          <Text style={{ opacity: 0.7 }}>
            No recipes yet. Create one in the Create tab.
          </Text>
        </View>
      }
    />
  );
};;
export default RecipesTab;
