import { create } from 'zustand';
import type { Dish, DishBomItem } from '@/types';
import { getStorage, setStorage } from '@/utils/storage';
import { mockDishes, generateId } from '@/utils/mock';
import { getNow } from '@/utils/date';

interface DishState {
  dishes: Dish[];
  initialized: boolean;
  init: () => void;
  addDish: (data: Omit<Dish, 'id' | 'createTime' | 'bomItems'> & { bomItems: Omit<DishBomItem, 'id'>[] }) => void;
  updateDish: (id: string, data: Partial<Dish>) => void;
  deleteDish: (id: string) => void;
  getDishById: (id: string) => Dish | undefined;
  updateBom: (dishId: string, bomItems: Omit<DishBomItem, 'id'>[]) => void;
  getCategories: () => string[];
}

const STORAGE_KEY = 'dishes';

export const useDishStore = create<DishState>((set, get) => ({
  dishes: [],
  initialized: false,

  init: () => {
    const stored = getStorage<Dish[]>(STORAGE_KEY, null);
    if (stored && stored.length > 0) {
      set({ dishes: stored, initialized: true });
    } else {
      set({ dishes: mockDishes, initialized: true });
      setStorage(STORAGE_KEY, mockDishes);
    }
  },

  addDish: (data) => {
    const bomItems: DishBomItem[] = data.bomItems.map((item) => ({
      ...item,
      id: generateId('bom'),
    }));

    const newDish: Dish = {
      id: generateId('dish'),
      name: data.name,
      category: data.category,
      price: data.price,
      bomItems,
      createTime: getNow(),
    };

    const newList = [...get().dishes, newDish];
    set({ dishes: newList });
    setStorage(STORAGE_KEY, newList);
  },

  updateDish: (id, data) => {
    const newList = get().dishes.map((item) =>
      item.id === id ? { ...item, ...data } : item
    );
    set({ dishes: newList });
    setStorage(STORAGE_KEY, newList);
  },

  deleteDish: (id) => {
    const newList = get().dishes.filter((item) => item.id !== id);
    set({ dishes: newList });
    setStorage(STORAGE_KEY, newList);
  },

  getDishById: (id) => {
    return get().dishes.find((item) => item.id === id);
  },

  updateBom: (dishId, bomItems) => {
    const items: DishBomItem[] = bomItems.map((item) => ({
      ...item,
      id: generateId('bom'),
    }));

    const newList = get().dishes.map((dish) =>
      dish.id === dishId ? { ...dish, bomItems: items } : dish
    );
    set({ dishes: newList });
    setStorage(STORAGE_KEY, newList);
  },

  getCategories: () => {
    const categories = new Set(get().dishes.map((dish) => dish.category));
    return Array.from(categories);
  },
}));
