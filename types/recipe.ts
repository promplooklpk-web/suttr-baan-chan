export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

export type StepPhotoMatch =
  | 'technique'
  | 'ingredient'
  | 'serving-example'
  | 'similar-recipe';

export type RecipePhoto = {
  path?: string;
  data?: string;
  mime?: 'image/jpeg' | 'image/png' | 'image/webp';
  credit?: string;
  source?: string;
  license?: string;
  licenseUrl?: string;
  match?: StepPhotoMatch;
};

export type RecipeIngredient = {
  name: string;
  amount?: number;
  unit?: string;
  note?: string;
};

export type RecipeStep = {
  text: string;
  timerSeconds?: number;
  photo?: RecipePhoto;
};

export type Recipe = {
  id: string;
  title: string;
  category?: string;
  tags?: string[];
  prepMinutes?: number;
  cookMinutes?: number;
  servings?: number;
  difficulty?: RecipeDifficulty;
  rating?: number;
  isFavorite?: boolean;
  notes?: string;
  /** Estimated calories per serving (often from seed data). */
  caloriesEstimate?: string;
  tips?: string[];
  sources?: string[];
  photoCredit?: string;
  photoSource?: string;
  photoLicense?: string;
  photo?: RecipePhoto;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  createdAt: string;
  updatedAt: string;
};

export type RecipeStore = {
  schemaVersion: 1;
  app: 'baan-chan-recipes';
  exportedAt: string;
  includesPhotos?: boolean;
  format?: 'recipe.json' | 'zip';
  /** Bundled seed pack version; bump when seed data changes. */
  seedVersion?: number;
  recipes: Recipe[];
};

export type RecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;
