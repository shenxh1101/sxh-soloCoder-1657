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

export interface CostBreakdown {
  salesCost: number;
  purchaseAmount: number;
  inventoryDiff: number;
  totalActualCost: number;
  theoreticalCost: number;
  revenue: number;
  saleCount: number;
  purchaseCount: number;
  checkCount: number;
}

export interface GrossProfitReportItem {
  date: string;
  revenue: number;
  theoreticalCost: number;
  salesCost: number;
  purchaseAmount: number;
  inventoryDiff: number;
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

export interface DeviationDishItem {
  dishId: string;
  dishName: string;
  soldQuantity: number;
  theoreticalCost: number;
  actualCost: number;
  deviation: number;
  deviationRate: number;
}

export interface DeviationIngredientItem {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  theoreticalUsage: number;
  actualUsage: number;
  price: number;
  deviation: number;
  deviationAmount: number;
  reason: 'waste' | 'inventory' | 'bom' | 'other';
}

export interface DeviationDetail {
  date: string;
  periodDateRange: { start: string; end: string; displayName: string };
  dishes: DeviationDishItem[];
  ingredients: DeviationIngredientItem[];
}

export interface NegativeStockItem {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  currentStock: number;
  requiredStock: number;
  shortfall: number;
  affectedDishes: string[];
}

export interface StockCheckResult {
  hasNegativeStock: boolean;
  items: NegativeStockItem[];
}

export interface PriceChangeItem {
  id: string;
  name: string;
  firstPrice: number;
  lastPrice: number;
  changeRate: number;
}

export interface ConsumptionRankItem {
  id: string;
  name: string;
  consumption: number;
  amount: number;
  unit: string;
}

export interface GrossProfitRankItem {
  id: string;
  name: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  rate: number;
}

export interface OperationTrackerData {
  labels: string[];
  priceTrend: { name: string; data: number[] }[];
  topByConsumption: ConsumptionRankItem[];
  topByGrossProfit: GrossProfitRankItem[];
  priceChanges: PriceChangeItem[];
}

export type AlertType = 'negative_stock' | 'high_loss' | 'gp_drop' | 'high_deviation';

export interface AlertItem {
  type: AlertType;
  title: string;
  description: string;
  value?: string;
  level: 'warning' | 'danger';
  targetPath: string;
  targetLabel: string;
  queryParams?: Record<string, any>;
}

export interface ReportDataSources {
  sales: Sale[];
  purchases: Purchase[];
  inventoryChecks: InventoryCheck[];
  ingredients: Ingredient[];
  dishes: Dish[];
}

export interface DateRange {
  start: string;
  end: string;
}

export interface PeriodDateRange extends DateRange {
  displayName: string;
}

export interface DrillDishSaleItem {
  saleId: string;
  saleDate: string;
  quantity: number;
  revenue: number;
  theoreticalCost: number;
  actualCost: number;
  bomBreakdown: { ingredientId: string; ingredientName: string; quantity: number; unit: string; cost: number }[];
}

export interface DrillIngredientConsumptionItem {
  dishId: string;
  dishName: string;
  soldQuantity: number;
  consumedQuantity: number;
  unit: string;
  theoreticalCost: number;
}

export interface DrillPurchaseItem {
  purchaseId: string;
  purchaseDate: string;
  supplierName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

export interface DrillInventoryItem {
  checkId: string;
  checkDate: string;
  ingredientName?: string;
  systemStock: number;
  actualStock: number;
  diffQuantity: number;
  diffAmount: number;
  diffType: 'profit' | 'loss' | 'equal';
  unit: string;
}

export interface DrillDetail {
  targetId: string;
  targetName: string;
  targetType: 'dish' | 'ingredient';
  periodDateRange: { start: string; end: string; displayName: string };
  theoreticalCost: number;
  actualCost: number;
  deviation: number;
  deviationRate: number;
  dishSales?: DrillDishSaleItem[];
  dishInventories?: DrillInventoryItem[];
  ingredientConsumptions?: DrillIngredientConsumptionItem[];
  ingredientPurchases?: DrillPurchaseItem[];
  ingredientInventories?: DrillInventoryItem[];
}

export interface ReconciliationData {
  period: { start: string; end: string; days: number };
  salesTotal: {
    revenue: number;
    cost: number;
    grossProfit: number;
    grossProfitRate: number;
    saleCount: number;
  };
  grossProfitAnalysis: {
    revenue: number;
    theoreticalCost: number;
    actualCost: number;
    salesCost: number;
    purchaseAmount: number;
    inventoryDiff: number;
    grossProfit: number;
    grossProfitRate: number;
    deviationRate: number;
  };
  operationTracker: {
    revenue: number;
    cost: number;
    grossProfit: number;
    grossProfitRate: number;
    ingredientCount: number;
    dishCount: number;
  };
  differences: {
    sales_vs_gp_revenue: number;
    sales_vs_gp_cost: number;
    sales_vs_op_revenue: number;
    sales_vs_op_cost: number;
  };
}
