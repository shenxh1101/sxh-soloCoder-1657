import type { Ingredient, Supplier, Dish, Purchase, Sale, InventoryCheck } from '@/types';
import { getNow, getToday } from './date';

export { getNow, getToday };

export const mockIngredients: Ingredient[] = [
  {
    id: 'ing_001',
    name: '毛肚',
    spec: '精品黑毛肚',
    unit: 'kg',
    stock: 15.5,
    costPrice: 65.0,
    alertThreshold: 10,
    category: '肉类',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-01 10:00:00',
  },
  {
    id: 'ing_002',
    name: '黄喉',
    spec: '鲜黄喉',
    unit: 'kg',
    stock: 8.2,
    costPrice: 45.0,
    alertThreshold: 5,
    category: '肉类',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-01 10:00:00',
  },
  {
    id: 'ing_003',
    name: '鸭肠',
    spec: '鲜鸭肠',
    unit: 'kg',
    stock: 12.0,
    costPrice: 38.0,
    alertThreshold: 8,
    category: '肉类',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-01 10:00:00',
  },
  {
    id: 'ing_004',
    name: '肥牛卷',
    spec: '澳洲肥牛',
    unit: 'kg',
    stock: 20.0,
    costPrice: 58.0,
    alertThreshold: 10,
    category: '肉类',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-01 10:00:00',
  },
  {
    id: 'ing_005',
    name: '羊肉卷',
    spec: '内蒙羊肉',
    unit: 'kg',
    stock: 18.5,
    costPrice: 62.0,
    alertThreshold: 8,
    category: '肉类',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-01 10:00:00',
  },
  {
    id: 'ing_006',
    name: '土豆',
    spec: '黄心土豆',
    unit: 'kg',
    stock: 25.0,
    costPrice: 3.5,
    alertThreshold: 15,
    category: '蔬菜',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-01 10:00:00',
  },
  {
    id: 'ing_007',
    name: '金针菇',
    spec: '白金针菇',
    unit: 'kg',
    stock: 6.0,
    costPrice: 8.0,
    alertThreshold: 4,
    category: '菌菇类',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-01 10:00:00',
  },
  {
    id: 'ing_008',
    name: '火锅底料',
    spec: '牛油底料',
    unit: '袋',
    stock: 30,
    costPrice: 25.0,
    alertThreshold: 20,
    category: '调料',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-01 10:00:00',
  },
  {
    id: 'ing_009',
    name: '蘸料',
    spec: '麻酱蘸料',
    unit: 'kg',
    stock: 10.0,
    costPrice: 12.0,
    alertThreshold: 5,
    category: '调料',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-01 10:00:00',
  },
  {
    id: 'ing_010',
    name: '生菜',
    spec: '有机生菜',
    unit: 'kg',
    stock: 3.5,
    costPrice: 6.5,
    alertThreshold: 5,
    category: '蔬菜',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-01 10:00:00',
  },
];

export const mockSuppliers: Supplier[] = [
  {
    id: 'sup_001',
    name: '鲜达肉类批发',
    contact: '张经理',
    phone: '13800138001',
    address: '成都市青白江农贸市场A区15号',
    supplyCategories: '肉类、禽肉、内脏',
    createTime: '2024-01-01 09:00:00',
  },
  {
    id: 'sup_002',
    name: '绿源蔬菜配送',
    contact: '李主管',
    phone: '13800138002',
    address: '成都市双流区蔬菜基地',
    supplyCategories: '蔬菜、菌菇、豆制品',
    createTime: '2024-01-01 09:00:00',
  },
  {
    id: 'sup_003',
    name: '川味调料商行',
    contact: '王老板',
    phone: '13800138003',
    address: '成都市五块石干货市场',
    supplyCategories: '调料、底料、干货',
    createTime: '2024-01-01 09:00:00',
  },
];

export const mockDishes: Dish[] = [
  {
    id: 'dish_001',
    name: '精品毛肚',
    category: '招牌菜',
    price: 38.0,
    bomItems: [
      { id: 'bom_001', ingredientId: 'ing_001', ingredientName: '毛肚', dosage: 0.2, unit: 'kg' },
    ],
    createTime: '2024-01-01 10:00:00',
  },
  {
    id: 'dish_002',
    name: '鲜鸭肠',
    category: '招牌菜',
    price: 28.0,
    bomItems: [
      { id: 'bom_002', ingredientId: 'ing_003', ingredientName: '鸭肠', dosage: 0.25, unit: 'kg' },
    ],
    createTime: '2024-01-01 10:00:00',
  },
  {
    id: 'dish_003',
    name: '澳洲肥牛',
    category: '肉类',
    price: 48.0,
    bomItems: [
      { id: 'bom_003', ingredientId: 'ing_004', ingredientName: '肥牛卷', dosage: 0.25, unit: 'kg' },
    ],
    createTime: '2024-01-01 10:00:00',
  },
  {
    id: 'dish_004',
    name: '内蒙羊肉',
    category: '肉类',
    price: 52.0,
    bomItems: [
      { id: 'bom_004', ingredientId: 'ing_005', ingredientName: '羊肉卷', dosage: 0.25, unit: 'kg' },
    ],
    createTime: '2024-01-01 10:00:00',
  },
  {
    id: 'dish_005',
    name: '黄喉',
    category: '招牌菜',
    price: 32.0,
    bomItems: [
      { id: 'bom_005', ingredientId: 'ing_002', ingredientName: '黄喉', dosage: 0.2, unit: 'kg' },
    ],
    createTime: '2024-01-01 10:00:00',
  },
  {
    id: 'dish_006',
    name: '土豆',
    category: '素菜',
    price: 8.0,
    bomItems: [
      { id: 'bom_006', ingredientId: 'ing_006', ingredientName: '土豆', dosage: 0.25, unit: 'kg' },
    ],
    createTime: '2024-01-01 10:00:00',
  },
  {
    id: 'dish_007',
    name: '金针菇',
    category: '素菜',
    price: 12.0,
    bomItems: [
      { id: 'bom_007', ingredientId: 'ing_007', ingredientName: '金针菇', dosage: 0.15, unit: 'kg' },
    ],
    createTime: '2024-01-01 10:00:00',
  },
  {
    id: 'dish_008',
    name: '鸳鸯锅底',
    category: '锅底',
    price: 58.0,
    bomItems: [
      { id: 'bom_008', ingredientId: 'ing_008', ingredientName: '火锅底料', dosage: 1, unit: '袋' },
    ],
    createTime: '2024-01-01 10:00:00',
  },
];

export const mockPurchases: Purchase[] = [
  {
    id: 'pur_001',
    supplierId: 'sup_001',
    supplierName: '鲜达肉类批发',
    purchaseDate: getToday(),
    remark: '日常补货',
    totalAmount: 1560.0,
    items: [
      { id: 'pi_001', ingredientId: 'ing_001', ingredientName: '毛肚', quantity: 10, unitPrice: 65.0, amount: 650.0 },
      { id: 'pi_002', ingredientId: 'ing_004', ingredientName: '肥牛卷', quantity: 10, unitPrice: 58.0, amount: 580.0 },
      { id: 'pi_003', ingredientId: 'ing_003', ingredientName: '鸭肠', quantity: 8.68, unitPrice: 38.0, amount: 330.0 },
    ],
    createTime: getNow(),
  },
];

export const mockSales: Sale[] = [
  {
    id: 'sale_001',
    saleDate: getToday(),
    remark: '今日营业',
    totalAmount: 2880.0,
    totalCost: 892.5,
    items: [
      { id: 'si_001', dishId: 'dish_001', dishName: '精品毛肚', quantity: 25, unitPrice: 38.0, amount: 950.0, cost: 325.0 },
      { id: 'si_002', dishId: 'dish_003', dishName: '澳洲肥牛', quantity: 20, unitPrice: 48.0, amount: 960.0, cost: 290.0 },
      { id: 'si_003', dishId: 'dish_004', dishName: '内蒙羊肉', quantity: 15, unitPrice: 52.0, amount: 780.0, cost: 232.5 },
      { id: 'si_004', dishId: 'dish_008', dishName: '鸳鸯锅底', quantity: 15, unitPrice: 58.0, amount: 870.0, cost: 375.0 },
    ],
    createTime: getNow(),
  },
];

export const mockInventoryChecks: InventoryCheck[] = [
  {
    id: 'check_001',
    checkDate: '2024-01-15',
    status: 'completed',
    profitAmount: 12.5,
    lossAmount: 45.0,
    remark: '月度盘点',
    items: [
      { id: 'ci_001', ingredientId: 'ing_001', ingredientName: '毛肚', unit: 'kg', systemStock: 15.0, actualStock: 14.5, diffQuantity: -0.5, diffAmount: -32.5, diffType: 'loss' },
      { id: 'ci_002', ingredientId: 'ing_006', ingredientName: '土豆', unit: 'kg', systemStock: 20.0, actualStock: 20.5, diffQuantity: 0.5, diffAmount: 1.75, diffType: 'profit' },
    ],
    createTime: '2024-01-15 18:00:00',
  },
];

export function generateId(prefix: string): string {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
}
