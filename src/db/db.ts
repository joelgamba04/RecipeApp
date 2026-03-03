// src/db/db.ts

import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync("recipes.db");
  return dbPromise;
}

export async function initDb(): Promise<void> {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      servings INTEGER NOT NULL DEFAULT 1,
      steps_json TEXT NOT NULL DEFAULT '[]',
      photo_uri TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id TEXT PRIMARY KEY NOT NULL,
      recipe_id TEXT NOT NULL,
      fdc_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      grams REAL NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fdc_food_cache (
      fdc_id INTEGER PRIMARY KEY NOT NULL,
      description TEXT,
      data_type TEXT,
      json TEXT NOT NULL,
      cached_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ingredient_nutrients_snapshot (
      recipe_ingredient_id TEXT PRIMARY KEY NOT NULL,
      nutrients_per_100g_json TEXT NOT NULL,
      FOREIGN KEY (recipe_ingredient_id) REFERENCES recipe_ingredients(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes(title);
    CREATE INDEX IF NOT EXISTS idx_ingredients_recipe ON recipe_ingredients(recipe_id);
  `);
}
