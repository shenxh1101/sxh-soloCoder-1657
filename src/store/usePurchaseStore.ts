import { create } from 'zustand';
import type { Purchase, PurchaseItem } from '@/types';
import { getStorage, setStorage } from '@/utils/storage';
import { mockPurchases, generateId } from '@/utils/mock';
import { getNow } from '@/utils/date';
import { useIngredientStore } from './useIngredientStore';
import { calcWeightedAvgCost } from '@/utils/calc';

interface PurchaseState {
  purchases: Purchase[];
  initialized: boolean;
  init: () => void;
  createPurchase: (data: Omit<Purchase, 'id' | 'createTime' | 'totalAmount' | 'items'> & { items: Omit<PurchaseItem, 'id' | 'amount'>[] }) => void;
  getPurchaseById: (id: string) => Purchase | undefined;
  getPurchasesByDate: (date: string) => Purchase[];
  getTotalPurchaseAmountByDate: (date: string) => number;
}

const STORAGE_KEY = 'purchases';

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  purchases: [],
  initialized: false,

  init: () => {
    const stored = getStorage<Purchase[]>(STORAGE_KEY, null);
    if (stored && stored.length > 0) {
      set({ purchases: stored, initialized: true });
    } else {
      set({ purchases: mockPurchases, initialized: true });
      setStorage(STORAGE_KEY, mockPurchases);
    }
  },

  createPurchase: (data) => {
    const items: PurchaseItem[] = data.items.map((item) => ({
      ...item,
      id: generateId('pi'),
      amount: Number((item.quantity * item.unitPrice).toFixed(2)),
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    const newPurchase: Purchase = {
      id: generateId('pur'),
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      purchaseDate: data.purchaseDate,
      remark: data.remark,
      items,
      totalAmount: Number(totalAmount.toFixed(2)),
      createTime: getNow(),
    };

    const ingredientStore = useIngredientStore.getState();
    items.forEach((item) => {
      const ingredient = ingredientStore.getIngredientById(item.ingredientId);
      if (ingredient) {
        const newCost = calcWeightedAvgCost(
          ingredient.stock,
          ingredient.costPrice,
          item.quantity,
          item.unitPrice
        );
        ingredientStore.updateStock(item.ingredientId, item.quantity, newCost);
      }
    });

    const newList = [newPurchase, ...get().purchases];
    set({ purchases: newList });
    setStorage(STORAGE_KEY, newList);
  },

  getPurchaseById: (id) => {
    return get().purchases.find((item) => item.id === id);
  },

  getPurchasesByDate: (date) => {
    return get().purchases.filter((item) => item.purchaseDate === date);
  },

  getTotalPurchaseAmountByDate: (date) => {
    return get()
      .getPurchasesByDate(date)
      .reduce((sum, item) => sum + item.totalAmount, 0);
  },
}));
