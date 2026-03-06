// app/(tabs)/create.tsx
import * as Crypto from "expo-crypto";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  addIngredient,
  deleteIngredient,
  getRecipeById,
  updateIngredientGrams,
  upsertIngredientSnapshot,
  upsertRecipe,
} from "../../src/db/recipesRepo";

import { getFoodDetailsCached, searchFoods } from "../../src/fdc/fdcClient";
import { extractNutrientsPer100gAndCatalog } from "../../src/fdc/fdcMapper";

import { computeRecipeTotals } from "../../src/nutrition/computeTotals";
import { TOP_NUTRIENT_KEYS } from "../../src/nutrition/topNutrients";

import {
  listNutrientCatalog,
  type NutrientCatalogRow,
} from "../../src/db/nutrientsRepo";
import {
  loadVisibility,
  type NutrientVisibilityMap,
} from "../../src/prefs/nutrientPrefs";

import IngredientEditModal from "../../src/components/IngredientEditModal";
import IngredientSearchModal from "../../src/components/IngredientSearchModal";

import type {
  FdcSearchFood,
  HydratedRecipe,
  RecipeIngredientRow,
} from "../../src/types";

const CreateRecipe = () => {
  // New recipe draft id (local-first)
  const [recipeId] = useState(() => Crypto.randomUUID());

  // Recipe fields
  const [title, setTitle] = useState<string>("");
  const [servings, setServings] = useState<string>("1");

  // Data
  const [recipe, setRecipe] = useState<HydratedRecipe | null>(null);
  const [catalog, setCatalog] = useState<NutrientCatalogRow[]>([]);
  const [visibility, setVisibility] = useState<NutrientVisibilityMap>({});

  // Modal state
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingIngredient, setEditingIngredient] =
    useState<RecipeIngredientRow | null>(null);

  // Search modal state
  const [search, setSearch] = useState<string>("");
  const [results, setResults] = useState<FdcSearchFood[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Step management
  const [steps, setSteps] = useState<string[]>([]);
  const [newStep, setNewStep] = useState("");

  useEffect(() => {
    (async () => {
      setVisibility(await loadVisibility());
      setCatalog(await listNutrientCatalog(""));
      await refreshRecipe();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!searchModalVisible) return;

    const q = search.trim();

    if (q.length < 2) {
      setResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError(null);

        const json = await searchFoods(q);
        setResults(json.foods || []);
      } catch (e: any) {
        setSearchError(e?.message ?? "Search failed");
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [search, searchModalVisible]);

  const refreshRecipe = async () => {
    const r = await getRecipeById(recipeId);

    if (r) {
      setRecipe(r);
      setTitle(r.title ?? "");
      setServings(String(r.servings ?? 1));
      setSteps(r.steps ?? []);
    } else {
      setRecipe(null);
    }
  };

  const persistRecipe = async (next?: {
    title?: string;
    servings?: string;
    steps?: string[];
  }) => {
    await upsertRecipe({
      id: recipeId,
      title: (next?.title ?? title).trim() || "Untitled recipe",
      servings: Math.max(1, Number(next?.servings ?? servings) || 1),
      steps: next?.steps ?? steps,
      photo_uri: null,
    });

    await refreshRecipe();
  };

  const saveRecipe = async () => {
    await persistRecipe();
  };

  /**
   * Add ingredient immediately with 100g default, then user can tap to edit grams.
   * This matches Cronometer/MFP feel: fast add, edit in modal.
   */
  const addFoodAsIngredient = async (food: FdcSearchFood, grams = 100) => {
    await saveRecipe();

    const ingredientId = Crypto.randomUUID();

    await addIngredient({
      id: ingredientId,
      recipe_id: recipeId,
      fdc_id: food.fdcId,
      description: food.description,
      grams: Math.max(0, grams),
    });

    const details = await getFoodDetailsCached(food.fdcId);
    const nutrientsPer100g = await extractNutrientsPer100gAndCatalog(details);
    await upsertIngredientSnapshot(ingredientId, nutrientsPer100g);

    // nutrients catalog may expand
    setCatalog(await listNutrientCatalog(""));

    await refreshRecipe();

    // open edit modal right away (optional but nice)
    const updated = await getRecipeById(recipeId);
    const added =
      updated?.ingredients?.find((i) => i.id === ingredientId) ?? null;
    setEditingIngredient(added);
    setEditModalVisible(true);
  };

  const totals = useMemo(() => {
    if (!recipe) return null;
    return computeRecipeTotals(recipe);
  }, [recipe]);

  const topRows = useMemo(() => {
    if (!totals) return [];
    const map = new Map(catalog.map((c) => [c.nutrient_key, c]));

    return TOP_NUTRIENT_KEYS.map((k) => {
      const meta = map.get(k);
      if (!meta) return null;

      return {
        key: k,
        name: meta.name,
        unit: meta.unit,
        perServing: totals.perServing[k] ?? 0,
        total: totals.totals[k] ?? 0,
      };
    }).filter(Boolean) as Array<{
      key: string;
      name: string;
      unit: string;
      perServing: number;
      total: number;
    }>;
  }, [catalog, totals]);

  const ingredientCount = recipe?.ingredients?.length ?? 0;

  const addStep = async () => {
    const text = newStep.trim();
    if (!text) return;

    const nextSteps = [...steps, text];
    setSteps(nextSteps);
    setNewStep("");

    await persistRecipe({ steps: nextSteps });
  };

  const updateStep = async (index: number, value: string) => {
    const nextSteps = [...steps];
    nextSteps[index] = value;
    setSteps(nextSteps);

    await persistRecipe({ steps: nextSteps });
  };

  const deleteStep = async (index: number) => {
    const nextSteps = steps.filter((_, i) => i !== index);
    setSteps(nextSteps);

    await persistRecipe({ steps: nextSteps });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={{ padding: 12, paddingTop: 8, gap: 16 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* ---------- Header / Recipe info ---------- */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: "800" }}>Create Recipe</Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Recipe title"
            style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}
          />

          <TextInput
            value={servings}
            onChangeText={setServings}
            keyboardType="number-pad"
            placeholder="Servings"
            style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}
          />

          <Pressable
            onPress={() => void saveRecipe()}
            style={{ padding: 12, borderWidth: 1, borderRadius: 12 }}
          >
            <Text style={{ textAlign: "center", fontWeight: "700" }}>
              Save Recipe
            </Text>
          </Pressable>
        </View>

        {/* ---------- Nutrition summary ---------- */}
        {totals && (
          <View
            style={{ borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 }}
          >
            <Text style={{ fontWeight: "800" }}>Nutrition (per serving)</Text>
            {topRows.length ? (
              topRows.map((r) => (
                <Text key={r.key}>
                  {r.name}: {r.perServing.toFixed(2)} {r.unit}
                </Text>
              ))
            ) : (
              <Text style={{ opacity: 0.7 }}>
                Add ingredients to compute totals.
              </Text>
            )}

            <Text style={{ marginTop: 8, fontWeight: "800" }}>
              Total (whole recipe)
            </Text>
            {topRows.map((r) => (
              <Text key={`${r.key}-t`}>
                {r.name}: {r.total.toFixed(2)} {r.unit}
              </Text>
            ))}

            {/* Optional hint: more nutrients exist in Recipe Details + Settings */}
            {catalog.length > 0 && (
              <Text style={{ marginTop: 8, opacity: 0.6 }}>
                More nutrients are available and can be hidden/shown in
                Settings.
              </Text>
            )}
          </View>
        )}

        {/* ---------- Ingredients section ---------- */}
        <View style={{ gap: 8 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <Text style={{ fontWeight: "800", fontSize: 16 }}>
              Ingredients ({ingredientCount})
            </Text>
          </View>

          {ingredientCount ? (
            recipe!.ingredients.map((ing) => (
              <Pressable
                key={ing.id}
                onPress={() => {
                  setEditingIngredient(ing);
                  setEditModalVisible(true);
                }}
                style={{
                  padding: 12,
                  borderWidth: 1,
                  borderRadius: 12,
                  gap: 6,
                }}
              >
                <Text style={{ fontWeight: "700" }}>{ing.description}</Text>
                <Text style={{ opacity: 0.7 }}>{ing.grams} g</Text>

                {/* Optional: tiny preview using a couple nutrients if available */}
                {(() => {
                  // show Energy if present (n_208)
                  const kcal = ing.nutrientsPer100g?.["n_208"];
                  if (typeof kcal !== "number") return null;
                  const totalKcal = (kcal * (Number(ing.grams) || 0)) / 100;
                  return (
                    <Text style={{ opacity: 0.7 }}>
                      ~{totalKcal.toFixed(0)} kcal
                    </Text>
                  );
                })()}
              </Pressable>
            ))
          ) : (
            <Text style={{ opacity: 0.6 }}>No ingredients yet.</Text>
          )}

          <Pressable
            onPress={() => {
              setSearch("");
              setResults([]);
              setSearchError(null);
              setSearchLoading(false);
              setSearchModalVisible(true);
            }}
            style={{ padding: 12, borderWidth: 1, borderRadius: 12 }}
          >
            <Text style={{ textAlign: "center", fontWeight: "700" }}>
              + Add Ingredient
            </Text>
          </Pressable>
        </View>

        {/* ---------------- Cooking Steps ---------------- */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: "800", fontSize: 16 }}>Cooking Steps</Text>

          {steps.map((step, index) => (
            <View
              key={index}
              style={{
                borderWidth: 1,
                borderRadius: 12,
                padding: 10,
                gap: 6,
              }}
            >
              <Text style={{ fontWeight: "700" }}>Step {index + 1}</Text>

              <TextInput
                value={step}
                multiline
                onChangeText={(v) => {
                  void updateStep(index, v);
                }}
                style={{
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 8,
                  minHeight: 50,
                }}
              />

              <Pressable
                onPress={() => {
                  void deleteStep(index);
                }}
                style={{
                  padding: 8,
                  borderWidth: 1,
                  borderRadius: 8,
                  alignSelf: "flex-start",
                }}
              >
                <Text>Delete</Text>
              </Pressable>
            </View>
          ))}

          <TextInput
            value={newStep}
            onChangeText={setNewStep}
            placeholder="Add new step..."
            multiline
            style={{
              borderWidth: 1,
              borderRadius: 10,
              padding: 10,
              minHeight: 60,
            }}
          />

          <Pressable
            onPress={() => void addStep()}
            style={{
              padding: 12,
              borderWidth: 1,
              borderRadius: 12,
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: "700" }}>
              + Add Step
            </Text>
          </Pressable>
        </View>

        {/* ---------- Modals ---------- */}
        <IngredientSearchModal
          visible={searchModalVisible}
          results={results}
          search={search}
          setSearch={setSearch}
          loading={searchLoading}
          error={searchError}
          onSelect={(food) => {
            setSearchModalVisible(false);
            setResults([]);
            setSearch("");

            // Add immediately with default 100g, then open Edit modal
            void addFoodAsIngredient(food, 100);
          }}
          onClose={() => setSearchModalVisible(false)}
        />

        <IngredientEditModal
          visible={editModalVisible}
          ingredient={editingIngredient}
          onSave={async (g) => {
            if (!editingIngredient) return;
            await updateIngredientGrams(editingIngredient.id, Math.max(0, g));
            setEditModalVisible(false);
            setEditingIngredient(null);
            await refreshRecipe();
          }}
          onDelete={async () => {
            if (!editingIngredient) return;
            await deleteIngredient(editingIngredient.id);
            setEditModalVisible(false);
            setEditingIngredient(null);
            await refreshRecipe();
          }}
          onClose={() => {
            setEditModalVisible(false);
            setEditingIngredient(null);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateRecipe;
