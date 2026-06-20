import { create } from 'zustand';
import type { Supplier } from '@/types';
import { getStorage, setStorage } from '@/utils/storage';
import { mockSuppliers, generateId } from '@/utils/mock';
import { getNow } from '@/utils/date';

interface SupplierState {
  suppliers: Supplier[];
  initialized: boolean;
  init: () => void;
  addSupplier: (data: Omit<Supplier, 'id' | 'createTime'>) => void;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  getSupplierById: (id: string) => Supplier | undefined;
}

const STORAGE_KEY = 'suppliers';

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  initialized: false,

  init: () => {
    const stored = getStorage<Supplier[]>(STORAGE_KEY, null);
    if (stored && stored.length > 0) {
      set({ suppliers: stored, initialized: true });
    } else {
      set({ suppliers: mockSuppliers, initialized: true });
      setStorage(STORAGE_KEY, mockSuppliers);
    }
  },

  addSupplier: (data) => {
    const newSupplier: Supplier = {
      ...data,
      id: generateId('sup'),
      createTime: getNow(),
    };
    const newList = [...get().suppliers, newSupplier];
    set({ suppliers: newList });
    setStorage(STORAGE_KEY, newList);
  },

  updateSupplier: (id, data) => {
    const newList = get().suppliers.map((item) =>
      item.id === id ? { ...item, ...data } : item
    );
    set({ suppliers: newList });
    setStorage(STORAGE_KEY, newList);
  },

  deleteSupplier: (id) => {
    const newList = get().suppliers.filter((item) => item.id !== id);
    set({ suppliers: newList });
    setStorage(STORAGE_KEY, newList);
  },

  getSupplierById: (id) => {
    return get().suppliers.find((item) => item.id === id);
  },
}));
