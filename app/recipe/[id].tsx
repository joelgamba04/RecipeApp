// app/recipe/[id].tsx

import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { getRecipeById } from "../../src/db/recipesRepo";
import { computeRecipeTotals } from "../../src/nutrition/computeTotals";
import { NUTRIENTS } from "../../src/nutrition/nutrientCatalog";
import type { NutrientVisibilityMap } from "../../src/prefs/nutrientPrefs";
import { loadVisibility } from "../../src/prefs/nutrientPrefs";
import type { HydratedRecipe } from "../../src/types";

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<HydratedRecipe | null>(null);
  const [visibility, setVisibility] = useState<NutrientVisibilityMap | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      const r = await getRecipeById(String(id));
      setRecipe(r);
      setVisibility(await loadVisibility());
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

  return (
    <View style={{ padding: 12, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "900" }}>{recipe.title}</Text>
      <Text style={{ opacity: 0.7 }}>Servings: {recipe.servings}</Text>

      <Text style={{ marginTop: 10, fontWeight: "800" }}>Per serving</Text>
      {NUTRIENTS.filter((n) => visibility[n.key]).map((n) => (
        <Text key={n.key}>
          {n.label}: {Number(perServing[n.key] ?? 0).toFixed(2)} {n.unit}
        </Text>
      ))}

      <Text style={{ marginTop: 10, fontWeight: "800" }}>
        Total (whole recipe)
      </Text>
      {NUTRIENTS.filter((n) => visibility[n.key]).map((n) => (
        <Text key={n.key}>
          {n.label}: {Number(totals[n.key] ?? 0).toFixed(2)} {n.unit}
        </Text>
      ))}

      <Text style={{ marginTop: 10, fontWeight: "800" }}>Ingredients</Text>
      <FlatList
        data={recipe.ingredients}
        keyExtractor={(i) => i.id}
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
    </View>
  );
}
