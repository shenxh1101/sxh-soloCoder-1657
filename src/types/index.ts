export interface Ingredient {
  id: string;
  name: string;
  spec: string;
  unit: string;
  stock: number;
  costPrice: number;
  alertThreshold: number;
  category: string;
  createTime: string;
  updateTime: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  supplyCategories: string;
  createTime: string;
}

export interface PurchaseItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  purchaseDate: string;
  remark: string;
  createTime: string;
}

export interface DishBomItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  dosage: number;
  unit: string;
}

export interface Dish {
  id: string;
  name: string;
  category: string;
  price: number;
  bomItems: DishBomItem[];
  createTime: string;
}

export interface SaleItem {
  id: string;
  dishId: string;
  dishName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  cost: number;
}

export interface Sale {
  id: string;
  saleDate: string;
  items: SaleItem[];
  totalAmount: number;
  totalCost: number;
  remark: string;
  createTime: string;
}

export type CheckStatus = 'draft' | 'completed';
export type DiffType = 'profit' | 'loss' | 'equal';

export interface InventoryCheckItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  unit: string;
  systemStock: number;
  actualStock: number;
  diffQuantity: number;
  diffAmount: number;
  diffType: DiffType;
}

export interface InventoryCheck {
  id: string;
  checkDate: string;
  items: InventoryCheckItem[];
  status: CheckStatus;
  profitAmount: number;
  lossAmount: number;
  remark: string;
  createTime: string;
}

export interface GrossProfitReportItem {
  date: string;
  revenue: number;
  theoreticalCost: number;
  actualCost: number;
  grossProfit: number;
  grossProfitRate: number;
  deviationRate: number;
}

export interface PurchaseSuggestionItem {
  ingredientId: string;
  ingredientName: string;
  spec: string;
  unit: string;
  currentStock: number;
  alertThreshold: number;
  suggestQuantity: number;
  estimatedCost: number;
}
