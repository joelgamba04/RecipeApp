// app/recipe/[id].tsx

import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  listNutrientCatalog,
  NutrientCatalogRow,
} from "../../src/db/nutrientsRepo";

import { getRecipeById } from "../../src/db/recipesRepo";
import { computeRecipeTotals } from "../../src/nutrition/computeTotals";

import type { NutrientVisibilityMap } from "../../src/prefs/nutrientPrefs";
import { isVisible, loadVisibility } from "../../src/prefs/nutrientPrefs";

import type { HydratedRecipe } from "../../src/types";

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [recipe, setRecipe] = useState<HydratedRecipe | null>(null);
  const [visibility, setVisibility] = useState<NutrientVisibilityMap | null>(
    null,
  );
  const [catalog, setCatalog] = useState<NutrientCatalogRow[]>([]);

  useEffect(() => {
    (async () => {
      const r = await getRecipeById(String(id));
      setRecipe(r);
      setVisibility(await loadVisibility());
      setCatalog(await listNutrientCatalog(""));
    })();
  }, [id]);

  if (!recipe || !visibility) {
    return (
      <View style={{ padding: 12 }}>
        <Text>Loading…</Text>
      </View>
    );
  }

  const { totals, perServing } = computeRecipeTotals(recipe);

  const visibleCatalog = catalog.filter(
    (n) =>
      isVisible(visibility, n.nutrient_key) &&
      (totals[n.nutrient_key] != null || perServing[n.nutrient_key] != null),
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <FlatList
        data={recipe.ingredients}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 12, gap: 16 }}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: "900" }}>
              {recipe.title}
            </Text>

            <Text style={{ opacity: 0.7 }}>Servings: {recipe.servings}</Text>

            <Text style={{ fontWeight: "800" }}>Per serving</Text>

            {visibleCatalog.map((n) => (
              <Text key={"ps-" + n.nutrient_key}>
                {n.name}: {Number(perServing[n.nutrient_key] ?? 0).toFixed(2)}{" "}
                {n.unit}
              </Text>
            ))}

            <Text style={{ marginTop: 10, fontWeight: "800" }}>
              Total (whole recipe)
            </Text>

            {visibleCatalog.map((n) => (
              <Text key={"t-" + n.nutrient_key}>
                {n.name}: {Number(totals[n.nutrient_key] ?? 0).toFixed(2)}{" "}
                {n.unit}
              </Text>
            ))}

            <Text style={{ marginTop: 10, fontWeight: "800" }}>
              Ingredients
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={{
              padding: 10,
              borderWidth: 1,
              borderRadius: 12,
              marginBottom: 8,
            }}
          >
            <Text style={{ fontWeight: "800" }}>{item.description}</Text>
            <Text style={{ opacity: 0.7 }}>{item.grams} g</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
