// src/types.ts

export type RecipeRow = {
  id: string;
  title: string;
  servings: number;
  steps_json: string;
  photo_uri: string | null;
  created_at: number;
  updated_at: number;
};

export type RecipeIngredientRow = {
  id: string;
  recipe_id: string;
  fdc_id: number;
  description: string;
  grams: number;
  created_at: number;
  updated_at: number;
};

export type NutrientsMap = Record<string, number>;

export type HydratedIngredient = RecipeIngredientRow & {
  nutrientsPer100g: NutrientsMap;
};

export type HydratedRecipe = Omit<RecipeRow, "steps_json"> & {
  steps: string[];
  ingredients: HydratedIngredient[];
};

export type FdcSearchFood = {
  fdcId: number;
  description: string;
  dataType?: string;
};

export type FdcSearchResponse = {
  foods: FdcSearchFood[];
};

export type FdcFoodDetails = {
  fdcId: number;
  description?: string;
  dataType?: string;
  foodNutrients?: Array<{
    amount?: number;
    nutrient?: { name?: string };
    nutrientName?: string;
  }>;
};
