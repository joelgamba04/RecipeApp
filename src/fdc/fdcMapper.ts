// src/fdc/fdcMapper.ts

import type { FdcFoodDetails, NutrientsMap } from "../types";

export function extractNutrientsPer100g(food: FdcFoodDetails): NutrientsMap {
  const out: NutrientsMap = {};

  const nutrients = food.foodNutrients ?? [];

  const servingSize = Number((food as any).servingSize ?? NaN);
  const servingUnit = String((food as any).servingSizeUnit ?? "").toLowerCase();

  // If we can normalize using grams, do so.
  const canNormalize =
    Number.isFinite(servingSize) && servingSize > 0 && servingUnit === "g";

  for (const n of nutrients) {
    const amount = typeof n.amount === "number" ? n.amount : null;
    const nutrient = (n as any).nutrient;
    const name: string = nutrient?.name ?? n.nutrientName ?? "";
    const unit: string = nutrient?.unitName ?? "";

    if (!name || amount == null) continue;

    // Normalize (serving -> 100g) when possible
    const per100 = canNormalize ? (amount / servingSize) * 100 : amount;

    // Store everything by a stable key:
    // Prefer nutrient "number" if available, else fallback to name.
    const nutrientNumber: string | undefined = nutrient?.number;
    const key = nutrientNumber ? `n_${nutrientNumber}` : `name_${name}`;

    out[key] = per100;
  }

  return out;
}
