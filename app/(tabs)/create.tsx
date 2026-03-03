// app/(tabs)/create.tsx

import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { v4 as uuidv4 } from "uuid";
import { initDb } from "../../src/db/db";
import {
  addIngredient,
  upsertIngredientSnapshot,
  upsertRecipe,
} from "../../src/db/recipesRepo";
import { getFoodDetailsCached, searchFoods } from "../../src/fdc/fdcClient";
import { extractNutrientsPer100g } from "../../src/fdc/fdcMapper";
import type { FdcSearchFood } from "../../src/types";

export default function CreateRecipe() {
  const [recipeId] = useState<string>(() => uuidv4());
  const [title, setTitle] = useState<string>("");
  const [servings, setServings] = useState<string>("1");

  const [search, setSearch] = useState<string>("");
  const [results, setResults] = useState<FdcSearchFood[]>([]);
  const [grams, setGrams] = useState<string>("100");
  const [picked, setPicked] = useState<FdcSearchFood | null>(null);

  useEffect(() => {
    void initDb();
  }, []);

  async function saveRecipe() {
    await upsertRecipe({
      id: recipeId,
      title: title.trim() || "Untitled recipe",
      servings: Number(servings) || 1,
      steps: [],
      photo_uri: null,
    });
  }

  async function doSearch() {
    const q = search.trim();
    if (q.length < 2) return;
    const json = await searchFoods(q);
    setResults(json.foods || []);
  }

  async function addPickedIngredient() {
    if (!picked) return;
    await saveRecipe();

    const ingredientId = uuidv4();
    await addIngredient({
      id: ingredientId,
      recipe_id: recipeId,
      fdc_id: picked.fdcId,
      description: picked.description,
      grams: Number(grams) || 0,
    });

    const details = await getFoodDetailsCached(picked.fdcId);
    const nutrientsPer100g = extractNutrientsPer100g(details);
    await upsertIngredientSnapshot(ingredientId, nutrientsPer100g);

    setPicked(null);
    setResults([]);
    setSearch("");
  }

  return (
    <View style={{ padding: 12, gap: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: "800" }}>New Recipe</Text>

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
        <Text style={{ fontWeight: "700", textAlign: "center" }}>
          Save Recipe
        </Text>
      </Pressable>

      <Text style={{ marginTop: 10, fontWeight: "700" }}>
        Add ingredient (FDC)
      </Text>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search food (e.g., chicken breast)"
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
        keyExtractor={(i) => String(i.fdcId)}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setPicked(item)}
            style={{
              padding: 10,
              borderWidth: 1,
              borderRadius: 12,
              marginBottom: 8,
              opacity: picked?.fdcId === item.fdcId ? 0.6 : 1,
            }}
          >
            <Text style={{ fontWeight: "700" }}>{item.description}</Text>
            <Text style={{ opacity: 0.7 }}>{item.dataType ?? ""}</Text>
          </Pressable>
        )}
      />

      {picked && (
        <View style={{ gap: 8, padding: 10, borderWidth: 1, borderRadius: 12 }}>
          <Text style={{ fontWeight: "700" }}>Selected:</Text>
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
            <Text style={{ fontWeight: "700", textAlign: "center" }}>
              Add Ingredient
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
