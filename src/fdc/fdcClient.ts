// src/fdc/fdcClient.ts

import { getDb } from "../db/db";
import type { FdcFoodDetails, FdcSearchResponse } from "../types";

const BASE = "https://api.nal.usda.gov/fdc/v1";
const API_KEY = process.env.EXPO_PUBLIC_FDC_API_KEY;

const assertKey = () => {
  if (!API_KEY) throw new Error("Missing EXPO_PUBLIC_FDC_API_KEY");
};

export async function searchFoods(query: string): Promise<FdcSearchResponse> {
  assertKey();

  const res = await fetch(`${BASE}/foods/search?api_key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      pageSize: 15,
      pageNumber: 1,
    }),
  });

  if (!res.ok) throw new Error(`FDC search failed: ${res.status}`);
  return (await res.json()) as FdcSearchResponse;
}

export async function getFoodDetailsCached(
  fdcId: number,
): Promise<FdcFoodDetails> {
  assertKey();
  const db = await getDb();

  const cached = await db.getFirstAsync<{ json: string }>(
    `SELECT json FROM fdc_food_cache WHERE fdc_id = ?`,
    [fdcId],
  );

  if (cached?.json) return JSON.parse(cached.json) as FdcFoodDetails;

  const res = await fetch(`${BASE}/food/${fdcId}?api_key=${API_KEY}`);
  if (!res.ok) throw new Error(`FDC details failed: ${res.status}`);

  const json = (await res.json()) as FdcFoodDetails;

  await db.runAsync(
    `
    INSERT INTO fdc_food_cache (fdc_id, description, data_type, json, cached_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(fdc_id) DO UPDATE SET
      json=excluded.json,
      cached_at=excluded.cached_at
    `,
    [
      fdcId,
      json.description ?? null,
      (json as any).dataType ?? null,
      JSON.stringify(json),
      Date.now(),
    ],
  );

  return json;
}
