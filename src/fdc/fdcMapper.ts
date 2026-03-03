// src/fdc/fdcMapper.ts

import type { FdcFoodDetails, NutrientsMap } from "../types";

const NAME_TO_KEY: Array<{ match: RegExp; key: string }> = [
  { match: /energy/i, key: "calories" },
  { match: /protein/i, key: "protein" },
  { match: /(carbohydrate|carb)/i, key: "carbs" },
  { match: /(total lipid|total fat)/i, key: "fat" },
  { match: /fiber/i, key: "fiber" },
  { match: /(sugars|total sugar)/i, key: "sugars" },
  { match: /sodium/i, key: "sodium" },
  { match: /cholesterol/i, key: "cholesterol" },
  { match: /fatty acids, total saturated/i, key: "satFat" },
  { match: /fatty acids, total trans/i, key: "transFat" },
  { match: /calcium/i, key: "calcium" },
  { match: /^iron/i, key: "iron" },
  { match: /potassium/i, key: "potassium" },
  { match: /vitamin c/i, key: "vitaminC" },
];

export function extractNutrientsPer100g(food: FdcFoodDetails): NutrientsMap {
  const nutrients: NutrientsMap = {};
  const list = food.foodNutrients ?? [];

  for (const n of list) {
    const name = n?.nutrient?.name || n?.nutrientName || "";
    const amount = typeof n?.amount === "number" ? n.amount : null;
    if (!name || amount == null) continue;

    const map = NAME_TO_KEY.find((m) => m.match.test(name));
    if (!map) continue;

    nutrients[map.key] = amount;
  }

  return nutrients;
}
