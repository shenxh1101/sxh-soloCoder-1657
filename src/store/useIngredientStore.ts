import { create } from 'zustand';
import type { Ingredient } from '@/types';
import { getStorage, setStorage } from '@/utils/storage';
import { mockIngredients, generateId } from '@/utils/mock';
import { getNow } from '@/utils/date';

interface IngredientState {
  ingredients: Ingredient[];
  initialized: boolean;
  init: () => void;
  addIngredient: (data: Omit<Ingredient, 'id' | 'createTime' | 'updateTime'>) => void;
  updateIngredient: (id: string, data: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  getIngredientById: (id: string) => Ingredient | undefined;
  updateStock: (id: string, quantity: number, costPrice?: number) => void;
  getAlertIngredients: () => Ingredient[];
  getTotalStockValue: () => number;
}

const STORAGE_KEY = 'ingredients';

export const useIngredientStore = create<IngredientState>((set, get) => ({
  ingredients: [],
  initialized: false,

  init: () => {
    const stored = getStorage<Ingredient[]>(STORAGE_KEY, null);
    if (stored && stored.length > 0) {
      set({ ingredients: stored, initialized: true });
    } else {
      set({ ingredients: mockIngredients, initialized: true });
      setStorage(STORAGE_KEY, mockIngredients);
    }
  },

  addIngredient: (data) => {
    const now = getNow();
    const newIngredient: Ingredient = {
      ...data,
      id: generateId('ing'),
      createTime: now,
      updateTime: now,
    };
    const newList = [...get().ingredients, newIngredient];
    set({ ingredients: newList });
    setStorage(STORAGE_KEY, newList);
  },

  updateIngredient: (id, data) => {
    const now = getNow();
    const newList = get().ingredients.map((item) =>
      item.id === id ? { ...item, ...data, updateTime: now } : item
    );
    set({ ingredients: newList });
    setStorage(STORAGE_KEY, newList);
  },

  deleteIngredient: (id) => {
    const newList = get().ingredients.filter((item) => item.id !== id);
    set({ ingredients: newList });
    setStorage(STORAGE_KEY, newList);
  },

  getIngredientById: (id) => {
    return get().ingredients.find((item) => item.id === id);
  },

  updateStock: (id, quantity, costPrice) => {
    const ingredient = get().getIngredientById(id);
    if (!ingredient) return;

    const now = getNow();
    const newStock = Number((ingredient.stock + quantity).toFixed(2));
    const newCost = costPrice !== undefined ? costPrice : ingredient.costPrice;

    const newList = get().ingredients.map((item) =>
      item.id === id
        ? { ...item, stock: newStock, costPrice: newCost, updateTime: now }
        : item
    );
    set({ ingredients: newList });
    setStorage(STORAGE_KEY, newList);
  },

  getAlertIngredients: () => {
    return get().ingredients.filter((item) => item.stock < item.alertThreshold);
  },

  getTotalStockValue: () => {
    return get().ingredients.reduce((sum, item) => sum + item.stock * item.costPrice, 0);
  },
}));
