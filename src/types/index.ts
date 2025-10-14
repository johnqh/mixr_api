// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

// Equipment types
export type EquipmentSubcategory = 'essential' | 'glassware' | 'garnish' | 'advanced';

// Ingredient types
export type IngredientSubcategory = 'spirit' | 'wine' | 'other_alcohol' | 'fruit' | 'spice' | 'other';

// Recipe generation request
export interface GenerateRecipeRequest {
  equipment_ids: number[];
  ingredient_ids: number[];
  mood_id: number;
}
