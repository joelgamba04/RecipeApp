// src/fdc/fdcClient.ts

import { getDb } from "../db/db";
import type { FdcFoodDetails, FdcSearchResponse } from "../types";

const BASE = "https://api.nal.usda.gov/fdc/v1";

const getApiKey = () => {
  const API_KEY = process.env.EXPO_PUBLIC_FDC_API_KEY;
  if (!API_KEY) throw new Error("Missing EXPO_PUBLIC_FDC_API_KEY");
  return API_KEY;
};

export const searchFoods = async (
  query: string,
): Promise<FdcSearchResponse> => {
  const api_key = getApiKey();
  console.log(`searchFoods: "${query}"...`);

  try {
    const res = await fetch(`${BASE}/foods/search?api_key=${api_key}`, {
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
  } catch (error) {
    console.error("Error searching foods:", error);
    throw error;
  }
};

export const getFoodDetailsCached = async (
  fdcId: number,
): Promise<FdcFoodDetails> => {
  const api_key = getApiKey();
  const db = await getDb();

  const cached = await db.getFirstAsync<{ json: string }>(
    `SELECT json FROM fdc_food_cache WHERE fdc_id = ?`,
    [fdcId],
  );

  if (cached?.json) return JSON.parse(cached.json) as FdcFoodDetails;

  const res = await fetch(`${BASE}/food/${fdcId}?api_key=${api_key}`);
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
};
