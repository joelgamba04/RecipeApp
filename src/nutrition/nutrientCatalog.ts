// src/nutrition/nutrientCatalog.ts

export type NutrientDef = { key: string; label: string; unit: string };

export const NUTRIENTS: NutrientDef[] = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbohydrates", unit: "g" },
  { key: "fat", label: "Total Fat", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
  { key: "sugars", label: "Sugars", unit: "g" },
  { key: "sodium", label: "Sodium", unit: "mg" },
  { key: "cholesterol", label: "Cholesterol", unit: "mg" },
  { key: "satFat", label: "Saturated Fat", unit: "g" },
  { key: "transFat", label: "Trans Fat", unit: "g" },
  { key: "calcium", label: "Calcium", unit: "mg" },
  { key: "iron", label: "Iron", unit: "mg" },
  { key: "potassium", label: "Potassium", unit: "mg" },
  { key: "vitaminC", label: "Vitamin C", unit: "mg" },
];
