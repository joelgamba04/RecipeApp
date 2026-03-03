// src/prefs/nutrientPrefs.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { NUTRIENTS } from "../nutrition/nutrientCatalog";

export type NutrientVisibilityMap = Record<string, boolean>;
const KEY = "nutrient_visibility_v1";

export async function loadVisibility(): Promise<NutrientVisibilityMap> {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw) return JSON.parse(raw) as NutrientVisibilityMap;

  const all: NutrientVisibilityMap = {};
  for (const n of NUTRIENTS) all[n.key] = true;
  return all;
}

export async function saveVisibility(
  map: NutrientVisibilityMap,
): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}
