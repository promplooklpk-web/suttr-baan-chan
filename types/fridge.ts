export type FridgePlace = 'chilled' | 'frozen' | 'dry';

export type FridgeItem = {
  id: string;
  name: string;
  ingredientId?: string;
  quantity: number;
  unit: string;
  place: FridgePlace;
  expiresAt?: string;
  note?: string;
  addedAt: string;
  updatedAt: string;
};

export type FridgeStore = {
  items: FridgeItem[];
  updatedAt: string;
};

export type FridgeStatusKind = 'expired' | 'expiring' | 'ok' | 'none';

export type FridgeStatus = {
  kind: FridgeStatusKind;
  daysLeft: number | null;
  label: string;
};

export type IngredientCatalogEntry = {
  id: string;
  name: string;
  recipeCount: number;
};

export type FridgeIngredientMatch = {
  ingredientName: string;
  requiredAmount?: number;
  requiredUnit?: string;
  have: boolean;
  availableAmount?: number;
  availableUnit?: string;
  expiredInFridge: boolean;
  expiringSoon: boolean;
};

export type RecipeFridgeMatch = {
  recipeId: string;
  percent: number;
  haveCount: number;
  totalCount: number;
  missing: string[];
  usesExpiring: boolean;
  details: FridgeIngredientMatch[];
};
