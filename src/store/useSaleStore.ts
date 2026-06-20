import { create } from 'zustand';
import type { Sale, SaleItem } from '@/types';
import { getStorage, setStorage } from '@/utils/storage';
import { mockSales, generateId } from '@/utils/mock';
import { getNow } from '@/utils/date';
import { useIngredientStore } from './useIngredientStore';
import { useDishStore } from './useDishStore';
import { calcDishTheoreticalCost } from '@/utils/calc';

interface SaleState {
  sales: Sale[];
  initialized: boolean;
  init: () => void;
  createSale: (data: Omit<Sale, 'id' | 'createTime' | 'totalAmount' | 'totalCost' | 'items'> & { items: Omit<SaleItem, 'id' | 'amount' | 'cost'>[] }) => void;
  getSaleById: (id: string) => Sale | undefined;
  getSalesByDate: (date: string) => Sale[];
  getTotalRevenueByDate: (date: string) => number;
  getTotalCostByDate: (date: string) => number;
}

const STORAGE_KEY = 'sales';

export const useSaleStore = create<SaleState>((set, get) => ({
  sales: [],
  initialized: false,

  init: () => {
    const stored = getStorage<Sale[]>(STORAGE_KEY, null);
    if (stored && stored.length > 0) {
      set({ sales: stored, initialized: true });
    } else {
      set({ sales: mockSales, initialized: true });
      setStorage(STORAGE_KEY, mockSales);
    }
  },

  createSale: (data) => {
    const ingredientStore = useIngredientStore.getState();
    const dishStore = useDishStore.getState();
    const ingredients = ingredientStore.ingredients;
    const dishes = dishStore.dishes;

    const items: SaleItem[] = data.items.map((item) => {
      const dish = dishes.find((d) => d.id === item.dishId);
      const cost = dish ? calcDishTheoreticalCost(dish, ingredients) * item.quantity : 0;
      return {
        ...item,
        id: generateId('si'),
        amount: Number((item.quantity * item.unitPrice).toFixed(2)),
        cost: Number(cost.toFixed(2)),
      };
    });

    items.forEach((item) => {
      const dish = dishes.find((d) => d.id === item.dishId);
      if (dish) {
        dish.bomItems.forEach((bomItem) => {
          const usage = bomItem.dosage * item.quantity;
          ingredientStore.updateStock(bomItem.ingredientId, -usage);
        });
      }
    });

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const totalCost = items.reduce((sum, item) => sum + item.cost, 0);

    const newSale: Sale = {
      id: generateId('sale'),
      saleDate: data.saleDate,
      remark: data.remark,
      items,
      totalAmount: Number(totalAmount.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      createTime: getNow(),
    };

    const newList = [newSale, ...get().sales];
    set({ sales: newList });
    setStorage(STORAGE_KEY, newList);
  },

  getSaleById: (id) => {
    return get().sales.find((item) => item.id === id);
  },

  getSalesByDate: (date) => {
    return get().sales.filter((item) => item.saleDate === date);
  },

  getTotalRevenueByDate: (date) => {
    return get()
      .getSalesByDate(date)
      .reduce((sum, item) => sum + item.totalAmount, 0);
  },

  getTotalCostByDate: (date) => {
    return get()
      .getSalesByDate(date)
      .reduce((sum, item) => sum + item.totalCost, 0);
  },
}));
