// src/prefs/nutrientPrefs.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

export type NutrientVisibilityMap = Record<string, boolean>;
const KEY = "nutrient_visibility_v2";

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

export function isVisible(
  vis: NutrientVisibilityMap,
  nutrientKey: string,
): boolean {
  // default visible
  return vis[nutrientKey] ?? true;
}
