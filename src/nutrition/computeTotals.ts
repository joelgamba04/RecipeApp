// src/nutrition/computeTotals.ts

import type { HydratedRecipe, NutrientsMap } from "../types";

function addInto(target: NutrientsMap, source: NutrientsMap, factor: number) {
  for (const [k, v] of Object.entries(source || {})) {
    if (typeof v !== "number") continue;
    target[k] = (target[k] ?? 0) + v * factor;
  }
}

export function computeRecipeTotals(recipe: HydratedRecipe): {
  totals: NutrientsMap;
  perServing: NutrientsMap;
} {
  const totals: NutrientsMap = {};

  for (const ing of recipe.ingredients) {
    const grams = Number(ing.grams || 0);
    const factor = grams / 100; // nutrients are per 100g
    addInto(totals, ing.nutrientsPer100g ?? {}, factor);
  }

  const servings = Math.max(1, Number(recipe.servings || 1));
  const perServing: NutrientsMap = {};
  for (const [k, v] of Object.entries(totals)) {
    perServing[k] = v / servings;
  }

  return { totals, perServing };
}
