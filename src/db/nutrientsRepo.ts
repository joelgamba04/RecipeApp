// src/db/nutrientsRepo.ts

import { getDb } from "./db";

export type NutrientCatalogRow = {
  nutrient_key: string; // "n_208"
  nutrient_number: string | null; // "208"
  name: string;
  unit: string;
  rank: number | null;
  updated_at: number;
};

export async function upsertNutrientCatalogRow(input: {
  nutrientKey: string;
  nutrientNumber?: string | null;
  name: string;
  unit: string;
  rank?: number | null;
}): Promise<void> {
  const db = await getDb();
  const now = Date.now();

  await db.runAsync(
    `
    INSERT INTO nutrient_catalog (nutrient_key, nutrient_number, name, unit, rank, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(nutrient_key) DO UPDATE SET
      nutrient_number=excluded.nutrient_number,
      name=excluded.name,
      unit=excluded.unit,
      rank=excluded.rank,
      updated_at=excluded.updated_at
    `,
    [
      input.nutrientKey,
      input.nutrientNumber ?? null,
      input.name,
      input.unit,
      input.rank ?? null,
      now,
    ],
  );
}

export async function listNutrientCatalog(
  search = "",
): Promise<NutrientCatalogRow[]> {
  const db = await getDb();
  const q = search.trim();

  if (!q) {
    return db.getAllAsync<NutrientCatalogRow>(
      `SELECT * FROM nutrient_catalog ORDER BY rank ASC, name ASC`,
    );
  }

  return db.getAllAsync<NutrientCatalogRow>(
    `SELECT * FROM nutrient_catalog WHERE name LIKE ? ORDER BY rank ASC, name ASC`,
    [`%${q}%`],
  );
}
