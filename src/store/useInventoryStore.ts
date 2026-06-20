import { create } from 'zustand';
import type { InventoryCheck, InventoryCheckItem } from '@/types';
import { getStorage, setStorage } from '@/utils/storage';
import { mockInventoryChecks, generateId } from '@/utils/mock';
import { getNow } from '@/utils/date';
import { useIngredientStore } from './useIngredientStore';

interface InventoryState {
  checks: InventoryCheck[];
  initialized: boolean;
  init: () => void;
  createCheck: (data: Omit<InventoryCheck, 'id' | 'createTime' | 'status' | 'profitAmount' | 'lossAmount' | 'items'> & { items: Omit<InventoryCheckItem, 'id' | 'diffQuantity' | 'diffAmount' | 'diffType'>[] }) => void;
  completeCheck: (id: string, actualStocks: { ingredientId: string; actualStock: number }[]) => void;
  getCheckById: (id: string) => InventoryCheck | undefined;
  getChecksByDate: (date: string) => InventoryCheck[];
}

const STORAGE_KEY = 'inventory_checks';

function calcDiff(systemStock: number, actualStock: number) {
  const diffQty = Number((actualStock - systemStock).toFixed(2));
  const diffAmount = 0;
  let diffType: 'profit' | 'loss' | 'equal' = 'equal';
  if (diffQty > 0) diffType = 'profit';
  else if (diffQty < 0) diffType = 'loss';
  return { diffQty, diffAmount, diffType };
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  checks: [],
  initialized: false,

  init: () => {
    const stored = getStorage<InventoryCheck[]>(STORAGE_KEY, null);
    if (stored && stored.length > 0) {
      set({ checks: stored, initialized: true });
    } else {
      set({ checks: mockInventoryChecks, initialized: true });
      setStorage(STORAGE_KEY, mockInventoryChecks);
    }
  },

  createCheck: (data) => {
    const ingredientStore = useIngredientStore.getState();

    const items: InventoryCheckItem[] = data.items.map((item) => {
      const ingredient = ingredientStore.getIngredientById(item.ingredientId);
      const systemStock = ingredient?.stock ?? 0;
      const unit = ingredient?.unit ?? '';
      const { diffQty, diffAmount, diffType } = calcDiff(systemStock, item.actualStock);
      return {
        ...item,
        id: generateId('ci'),
        unit,
        systemStock,
        diffQuantity: diffQty,
        diffAmount: diffAmount,
        diffType,
      };
    });

    const newCheck: InventoryCheck = {
      id: generateId('check'),
      checkDate: data.checkDate,
      remark: data.remark,
      items,
      status: 'draft',
      profitAmount: 0,
      lossAmount: 0,
      createTime: getNow(),
    };

    const newList = [newCheck, ...get().checks];
    set({ checks: newList });
    setStorage(STORAGE_KEY, newList);
  },

  completeCheck: (id, actualStocks) => {
    const ingredientStore = useIngredientStore.getState();
    const check = get().getCheckById(id);
    if (!check) return;

    let profitAmount = 0;
    let lossAmount = 0;

    const items: InventoryCheckItem[] = check.items.map((item) => {
      const actual = actualStocks.find((a) => a.ingredientId === item.ingredientId);
      const actualStock = actual?.actualStock ?? item.actualStock;
      const ingredient = ingredientStore.getIngredientById(item.ingredientId);
      const costPrice = ingredient?.costPrice ?? 0;

      const diffQty = Number((actualStock - item.systemStock).toFixed(2));
      const diffAmt = Number((diffQty * costPrice).toFixed(2));
      let diffType: 'profit' | 'loss' | 'equal' = 'equal';
      if (diffQty > 0) {
        diffType = 'profit';
        profitAmount += diffAmt;
      } else if (diffQty < 0) {
        diffType = 'loss';
        lossAmount += Math.abs(diffAmt);
      }

      return {
        ...item,
        actualStock,
        diffQuantity: diffQty,
        diffAmount: diffAmt,
        diffType,
      };
    });

    items.forEach((item) => {
      const ingredient = ingredientStore.getIngredientById(item.ingredientId);
      if (ingredient && item.diffQuantity !== 0) {
        ingredientStore.updateStock(item.ingredientId, item.diffQuantity);
      }
    });

    const newList = get().checks.map((c) =>
      c.id === id
        ? {
            ...c,
            items,
            status: 'completed' as const,
            profitAmount: Number(profitAmount.toFixed(2)),
            lossAmount: Number(lossAmount.toFixed(2)),
          }
        : c
    );

    set({ checks: newList });
    setStorage(STORAGE_KEY, newList);
  },

  getCheckById: (id) => {
    return get().checks.find((item) => item.id === id);
  },

  getChecksByDate: (date) => {
    return get().checks.filter((item) => item.checkDate === date);
  },
}));
