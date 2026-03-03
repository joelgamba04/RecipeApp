// src/db/recipesRepo.ts

import type {
  HydratedRecipe,
  NutrientsMap,
  RecipeIngredientRow,
  RecipeRow,
} from "../types";
import { getDb } from "./db";

export async function listRecipes(search = ""): Promise<RecipeRow[]> {
  const db = await getDb();
  const q = search.trim();

  if (!q) {
    return db.getAllAsync<RecipeRow>(
      `SELECT * FROM recipes ORDER BY updated_at DESC`,
    );
  }

  return db.getAllAsync<RecipeRow>(
    `SELECT * FROM recipes WHERE title LIKE ? ORDER BY updated_at DESC`,
    [`%${q}%`],
  );
}

export async function getRecipeById(
  recipeId: string,
): Promise<HydratedRecipe | null> {
  const db = await getDb();

  const recipe = await db.getFirstAsync<RecipeRow>(
    `SELECT * FROM recipes WHERE id = ?`,
    [recipeId],
  );
  if (!recipe) return null;

  const ingredients = await db.getAllAsync<RecipeIngredientRow>(
    `SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY created_at ASC`,
    [recipeId],
  );

  const hydrated = ingredients.length
    ? await hydrateIngredientSnapshots(ingredients)
    : [];

  return {
    ...recipe,
    steps: safeJsonParse<string[]>(recipe.steps_json, []),
    ingredients: hydrated,
  };
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function hydrateIngredientSnapshots(
  ingredients: RecipeIngredientRow[],
): Promise<Array<RecipeIngredientRow & { nutrientsPer100g: NutrientsMap }>> {
  const db = await getDb();
  const placeholders = ingredients.map(() => "?").join(",");
  const ids = ingredients.map((i) => i.id);

  const snaps = await db.getAllAsync<{
    recipe_ingredient_id: string;
    nutrients_per_100g_json: string;
  }>(
    `SELECT recipe_ingredient_id, nutrients_per_100g_json
     FROM ingredient_nutrients_snapshot
     WHERE recipe_ingredient_id IN (${placeholders})`,
    ids,
  );

  const snapMap = new Map(
    snaps.map((s) => [s.recipe_ingredient_id, s.nutrients_per_100g_json]),
  );

  return ingredients.map((i) => ({
    ...i,
    nutrientsPer100g: safeJsonParse<NutrientsMap>(
      snapMap.get(i.id) ?? "{}",
      {},
    ),
  }));
}

export async function upsertRecipe(input: {
  id: string;
  title: string;
  servings: number;
  steps: string[];
  photo_uri?: string | null;
}): Promise<void> {
  const db = await getDb();
  const now = Date.now();

  await db.runAsync(
    `
    INSERT INTO recipes (id, title, servings, steps_json, photo_uri, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title,
      servings=excluded.servings,
      steps_json=excluded.steps_json,
      photo_uri=excluded.photo_uri,
      updated_at=excluded.updated_at
    `,
    [
      input.id,
      input.title,
      input.servings,
      JSON.stringify(input.steps ?? []),
      input.photo_uri ?? null,
      now,
      now,
    ],
  );
}

export async function addIngredient(input: {
  id: string;
  recipe_id: string;
  fdc_id: number;
  description: string;
  grams: number;
}): Promise<void> {
  const db = await getDb();
  const now = Date.now();

  await db.runAsync(
    `
    INSERT INTO recipe_ingredients (id, recipe_id, fdc_id, description, grams, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.id,
      input.recipe_id,
      input.fdc_id,
      input.description,
      input.grams,
      now,
      now,
    ],
  );
}

export async function upsertIngredientSnapshot(
  recipeIngredientId: string,
  nutrientsPer100g: NutrientsMap,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `
    INSERT INTO ingredient_nutrients_snapshot (recipe_ingredient_id, nutrients_per_100g_json)
    VALUES (?, ?)
    ON CONFLICT(recipe_ingredient_id) DO UPDATE SET
      nutrients_per_100g_json=excluded.nutrients_per_100g_json
    `,
    [recipeIngredientId, JSON.stringify(nutrientsPer100g ?? {})],
  );
}
