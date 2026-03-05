// src/prefs/nutrientPrefs.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

export type NutrientVisibilityMap = Record<string, boolean>;
const KEY = "nutrient_visibility_v2";

export const DEFAULT_VISIBLE_NUTRIENTS = [
  "n_208", // Calories
  "n_203", // Protein
  "n_205", // Carbohydrates
  "n_204", // Fat
];

export async function loadVisibility(): Promise<NutrientVisibilityMap> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as NutrientVisibilityMap;
  } catch {
    return {};
  }
}

export async function saveVisibility(
  map: NutrientVisibilityMap,
): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}

export function isVisible(map: NutrientVisibilityMap, nutrientKey: string) {
  if (map[nutrientKey] !== undefined) {
    return map[nutrientKey];
  }

  return DEFAULT_VISIBLE_NUTRIENTS.includes(nutrientKey);
}
