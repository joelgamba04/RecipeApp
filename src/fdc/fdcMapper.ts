// src/fdc/fdcMapper.ts

import { upsertNutrientCatalogRow } from "../db/nutrientsRepo";
import type { FdcFoodDetails, NutrientsMap } from "../types";

export async function extractNutrientsPer100gAndCatalog(
  food: FdcFoodDetails,
): Promise<NutrientsMap> {
  const out: NutrientsMap = {};

  const nutrients = food.foodNutrients ?? [];

  const servingSize = Number((food as any).servingSize ?? NaN);
  const servingUnit = String((food as any).servingSizeUnit ?? "").toLowerCase();

  const canNormalize =
    Number.isFinite(servingSize) && servingSize > 0 && servingUnit === "g";
  const factorTo100g = canNormalize ? 100 / servingSize : 1;

  // Upsert catalog rows (don’t block totals if catalog fails)
  const catalogPromises: Promise<void>[] = [];

  for (const n of nutrients) {
    const amount = typeof n.amount === "number" ? n.amount : null;
    const nutrient = (n as any).nutrient;

    const number: string | undefined = nutrient?.number;
    const name: string = nutrient?.name ?? (n as any).nutrientName ?? "";
    const unit: string = nutrient?.unitName ?? "";
    const rank: number | null =
      typeof nutrient?.rank === "number" ? nutrient.rank : null;

    if (!number || !name || !unit || amount == null) continue;

    const key = `n_${number}`;
    const per100 = amount * factorTo100g;

    out[key] = per100;

    catalogPromises.push(
      upsertNutrientCatalogRow({
        nutrientKey: key,
        nutrientNumber: number,
        name,
        unit,
        rank,
      }),
    );
  }

  // Run catalog upserts in background-ish (but still awaited for consistency)
  try {
    await Promise.all(catalogPromises);
  } catch {
    // Non-fatal: recipe can still compute totals from `out`.
  }

  return out;
}
