// app/(tabs)/create.tsx
import * as Crypto from "expo-crypto";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
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

import { SafeAreaView } from "react-native-safe-area-context";
import {
  listNutrientCatalog,
  NutrientCatalogRow,
} from "../../src/db/nutrientsRepo";
import {
  isVisible,
  loadVisibility,
  NutrientVisibilityMap,
} from "../../src/prefs/nutrientPrefs";

import type { FdcSearchFood, HydratedRecipe } from "../../src/types";

const toNumber = (input: string): number => {
  const n = Number(String(input).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

const CreateRecipe = () => {
  const [recipeId] = useState(() => Crypto.randomUUID());

  const [title, setTitle] = useState<string>("");
  const [servings, setServings] = useState<string>("1");

  const [search, setSearch] = useState<string>("");
  const [results, setResults] = useState<FdcSearchFood[]>([]);
  const [grams, setGrams] = useState<string>("100");
  const [picked, setPicked] = useState<FdcSearchFood | null>(null);

  const [recipe, setRecipe] = useState<HydratedRecipe | null>(null);
  const [catalog, setCatalog] = useState<NutrientCatalogRow[]>([]);
  const [visibility, setVisibility] = useState<NutrientVisibilityMap>({});

  const gramsSaveTimers = useRef<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      setVisibility(await loadVisibility());
      setCatalog(await listNutrientCatalog(""));
      await refreshRecipe(); // initial
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshRecipe = async () => {
    const r = await getRecipeById(recipeId);
    if (r) {
      setRecipe(r);
      // keep inputs in sync if you later support editing existing recipe
      setTitle(r.title ?? "");
      setServings(String(r.servings ?? 1));
    } else {
      setRecipe(null);
    }
  };

  const saveRecipe = async () => {
    await upsertRecipe({
      id: recipeId,
      title: title.trim() || "Untitled recipe",
      servings: Math.max(1, Number(servings) || 1),
      steps: recipe?.steps ?? [],
      photo_uri: null,
    });
    await refreshRecipe();
  };

  const doSearch = async () => {
    const q = search.trim();
    if (q.length < 2) return;
    const json = await searchFoods(q);
    setResults(json.foods || []);
  };

  const addPickedIngredient = async () => {
    if (!picked) return;

    await saveRecipe();

    const ingredientId = Crypto.randomUUID();
    await addIngredient({
      id: ingredientId,
      recipe_id: recipeId,
      fdc_id: picked.fdcId,
      description: picked.description,
      grams: Math.max(0, toNumber(grams)),
    });

    const details = await getFoodDetailsCached(picked.fdcId);
    const nutrientsPer100g = await extractNutrientsPer100gAndCatalog(details);
    await upsertIngredientSnapshot(ingredientId, nutrientsPer100g);

    // refresh catalog (new nutrients may have been discovered)
    setCatalog(await listNutrientCatalog(""));

    // reset picker
    setPicked(null);
    setResults([]);
    setSearch("");

    await refreshRecipe();
  };

  const onDeleteIngredient = async (ingredientId: string) => {
    await deleteIngredient(ingredientId);
    await refreshRecipe();
  };

  const onChangeIngredientGrams = (ingredientId: string, value: string) => {
    // Optimistic UI: update local state immediately
    setRecipe((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ingredients: prev.ingredients.map((i) =>
          i.id === ingredientId ? { ...i, grams: toNumber(value) } : i,
        ),
      };
    });

    // Debounced DB write
    if (gramsSaveTimers.current[ingredientId]) {
      clearTimeout(gramsSaveTimers.current[ingredientId]);
    }
    gramsSaveTimers.current[ingredientId] = setTimeout(async () => {
      await updateIngredientGrams(ingredientId, Math.max(0, toNumber(value)));
      await refreshRecipe();
    }, 350);
  };

  const totals = useMemo(() => {
    if (!recipe) return null;
    return computeRecipeTotals(recipe);
  }, [recipe]);

  const topRows = useMemo(() => {
    if (!totals) return [];
    // Show top nutrient keys if present in catalog
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

  const allVisibleRows = useMemo(() => {
    if (!totals) return [];
    // Only show nutrients that exist in totals AND are visible
    return catalog
      .filter(
        (n) =>
          isVisible(visibility, n.nutrient_key) &&
          totals.totals[n.nutrient_key] != null,
      )
      .map((n) => ({
        key: n.nutrient_key,
        name: n.name,
        unit: n.unit,
        perServing: totals.perServing[n.nutrient_key] ?? 0,
        total: totals.totals[n.nutrient_key] ?? 0,
      }));
  }, [catalog, totals, visibility]);

  return (
    <SafeAreaView style={{ paddingHorizontal: 12, gap: 10 }}>
      <ScrollView contentContainerStyle={{ padding: 12, gap: 16 }}>
        {/* ---------------- Recipe Info ---------------- */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: "800" }}>New Recipe</Text>

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
        </View>

        {/* ---------------- Nutrition Summary ---------------- */}
        {totals && (
          <View style={{ borderWidth: 1, borderRadius: 12, padding: 12 }}>
            <Text style={{ fontWeight: "800", marginBottom: 6 }}>
              Nutrition (per serving)
            </Text>

            {topRows.map((r) => (
              <Text key={r.key}>
                {r.name}: {r.perServing.toFixed(2)} {r.unit}
              </Text>
            ))}
          </View>
        )}

        {/* ---------------- Ingredients ---------------- */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: "800", fontSize: 16 }}>Ingredients</Text>

          {recipe?.ingredients?.length ? (
            recipe.ingredients.map((ing) => (
              <View
                key={ing.id}
                style={{
                  padding: 10,
                  borderWidth: 1,
                  borderRadius: 12,
                  gap: 6,
                }}
              >
                <Text style={{ fontWeight: "700" }}>{ing.description}</Text>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    defaultValue={String(ing.grams)}
                    keyboardType="decimal-pad"
                    onChangeText={(v) => onChangeIngredientGrams(ing.id, v)}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderRadius: 10,
                      padding: 8,
                    }}
                  />

                  <Pressable
                    onPress={() => void onDeleteIngredient(ing.id)}
                    style={{ padding: 10, borderWidth: 1, borderRadius: 10 }}
                  >
                    <Text>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ opacity: 0.6 }}>No ingredients yet</Text>
          )}
        </View>

        {/* ---------------- Ingredient Search ---------------- */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: "800", fontSize: 16 }}>
            Add Ingredient
          </Text>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search food (chicken breast)"
              style={{ flex: 1, borderWidth: 1, borderRadius: 10, padding: 10 }}
            />

            <Pressable
              onPress={() => void doSearch()}
              style={{ padding: 12, borderWidth: 1, borderRadius: 12 }}
            >
              <Text>Search</Text>
            </Pressable>
          </View>

          <FlatList
            data={results}
            scrollEnabled={false}
            keyExtractor={(i) => String(i.fdcId)}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setPicked(item)}
                style={{
                  padding: 10,
                  borderWidth: 1,
                  borderRadius: 12,
                  marginBottom: 8,
                  backgroundColor:
                    picked?.fdcId === item.fdcId ? "#e6f4ff" : "#fff",
                }}
              >
                <Text style={{ fontWeight: "700" }}>
                  {picked?.fdcId === item.fdcId ? "✓ " : ""}
                  {item.description}
                </Text>

                <Text style={{ opacity: 0.7 }}>{item.dataType ?? ""}</Text>
              </Pressable>
            )}
          />
        </View>

        {/* ---------------- Selected Ingredient ---------------- */}
        {picked && (
          <View
            style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 8 }}
          >
            <Text style={{ fontWeight: "800" }}>Selected Ingredient</Text>
            <Text>{picked.description}</Text>

            <TextInput
              value={grams}
              onChangeText={setGrams}
              keyboardType="decimal-pad"
              placeholder="Grams"
              style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}
            />

            <Pressable
              onPress={() => void addPickedIngredient()}
              style={{ padding: 12, borderWidth: 1, borderRadius: 12 }}
            >
              <Text style={{ textAlign: "center", fontWeight: "700" }}>
                Add Ingredient
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateRecipe;
