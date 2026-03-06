// app/recipe/[id].tsx

import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  listNutrientCatalog,
  NutrientCatalogRow,
} from "../../src/db/nutrientsRepo";

import { getRecipeById } from "../../src/db/recipesRepo";
import { computeRecipeTotals } from "../../src/nutrition/computeTotals";

import type { NutrientVisibilityMap } from "../../src/prefs/nutrientPrefs";
import { isVisible, loadVisibility } from "../../src/prefs/nutrientPrefs";

import type { HydratedRecipe } from "../../src/types";

type VisibleNutrientRow = {
  key: string;
  name: string;
  unit: string;
  perServing: number;
  total: number;
};

// Displays a section of nutrients, either per serving or total, based on the mode prop.
const NutritionSection = ({
  title,
  rows,
  mode,
}: {
  title: string;
  rows: VisibleNutrientRow[];
  mode: "perServing" | "total";
}) => {
  return (
    <View
      style={{
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        gap: 8,
      }}
    >
      <Text style={{ fontWeight: "900", fontSize: 15 }}>{title}</Text>

      {rows.length === 0 ? (
        <Text style={{ opacity: 0.6 }}>No nutrient data available.</Text>
      ) : (
        rows.map((row, index) => {
          const value = mode === "perServing" ? row.perServing : row.total;

          return (
            <View
              key={`${mode}-${row.key}`}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 6,
                borderTopWidth: index === 0 ? 0 : 0.5,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  paddingRight: 12,
                  fontWeight: "600",
                }}
              >
                {row.name}
              </Text>

              <Text
                style={{
                  fontVariant: ["tabular-nums"],
                  textAlign: "right",
                  opacity: 0.85,
                }}
              >
                {value.toFixed(2)} {row.unit}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
};

// Main component for displaying recipe details, including ingredients and nutrition information.
const RecipeDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

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

  const visibleRows = useMemo<VisibleNutrientRow[]>(() => {
    if (!recipe || !visibility) return [];

    const { totals, perServing } = computeRecipeTotals(recipe);

    return catalog
      .filter(
        (n) =>
          isVisible(visibility, n.nutrient_key) &&
          (totals[n.nutrient_key] != null ||
            perServing[n.nutrient_key] != null),
      )
      .map((n) => ({
        key: n.nutrient_key,
        name: n.name,
        unit: n.unit,
        perServing: Number(perServing[n.nutrient_key] ?? 0),
        total: Number(totals[n.nutrient_key] ?? 0),
      }));
  }, [recipe, visibility, catalog]);

  if (!recipe || !visibility) {
    return (
      <View style={{ padding: 12 }}>
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, paddingBottom: insets.bottom }}
      edges={["bottom"]}
    >
      <FlatList
        data={recipe.ingredients}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 12, gap: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            {/* Recipe Header */}
            <View
              style={{
                borderWidth: 1,
                borderRadius: 16,
                padding: 14,
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 22, fontWeight: "900" }}>
                {recipe.title}
              </Text>

              <Text style={{ opacity: 0.7 }}>Servings: {recipe.servings}</Text>
              <Text style={{ opacity: 0.7 }}>
                Ingredients: {recipe.ingredients.length}
              </Text>
            </View>

            {/* Nutrition */}
            <View style={{ gap: 12 }}>
              <Text style={{ fontWeight: "900", fontSize: 16 }}>Nutrition</Text>

              <NutritionSection
                title="Per Serving"
                rows={visibleRows}
                mode="perServing"
              />

              <NutritionSection
                title="Whole Recipe"
                rows={visibleRows}
                mode="total"
              />
            </View>

            {/* Ingredients label */}
            <Text style={{ fontWeight: "900", fontSize: 16 }}>Ingredients</Text>
          </View>
        }
        renderItem={({ item }) => {
          const kcalPer100g = item.nutrientsPer100g?.["n_208"];
          const kcal =
            typeof kcalPer100g === "number"
              ? (kcalPer100g * Number(item.grams || 0)) / 100
              : null;

          return (
            <View
              style={{
                padding: 12,
                borderWidth: 1,
                borderRadius: 14,
                gap: 4,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontWeight: "800", fontSize: 15 }}>
                {item.description}
              </Text>

              <Text style={{ opacity: 0.7 }}>{item.grams} g</Text>

              {kcal != null && (
                <Text style={{ opacity: 0.8 }}>{kcal.toFixed(0)} kcal</Text>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          <View style={{ marginTop: 12, gap: 8 }}>
            <Text style={{ fontWeight: "900", fontSize: 16 }}>
              Cooking Steps
            </Text>

            {recipe.steps.length === 0 ? (
              <Text style={{ opacity: 0.6 }}>No steps yet.</Text>
            ) : (
              recipe.steps.map((step, index) => (
                <View
                  key={index}
                  style={{
                    borderWidth: 1,
                    borderRadius: 14,
                    padding: 12,
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontWeight: "800" }}>Step {index + 1}</Text>
                  <Text style={{ lineHeight: 20 }}>{step}</Text>
                </View>
              ))
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default RecipeDetail;
