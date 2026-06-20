import type { Ingredient, Dish, SaleItem } from '@/types';

export function calcWeightedAvgCost(
  oldStock: number,
  oldCost: number,
  addQty: number,
  addPrice: number
): number {
  const totalStock = oldStock + addQty;
  if (totalStock === 0) return 0;
  const totalCost = oldStock * oldCost + addQty * addPrice;
  return Number((totalCost / totalStock).toFixed(2));
}

export function calcDishTheoreticalCost(
  dish: Dish,
  ingredients: Ingredient[]
): number {
  let cost = 0;
  for (const bomItem of dish.bomItems) {
    const ingredient = ingredients.find(i => i.id === bomItem.ingredientId);
    if (ingredient) {
      cost += bomItem.dosage * ingredient.costPrice;
    }
  }
  return Number(cost.toFixed(2));
}

export function calcSaleItemsTheoreticalCost(
  saleItems: SaleItem[],
  dishes: Dish[],
  ingredients: Ingredient[]
): number {
  let totalCost = 0;
  for (const saleItem of saleItems) {
    const dish = dishes.find(d => d.id === saleItem.dishId);
    if (dish) {
      const dishCost = calcDishTheoreticalCost(dish, ingredients);
      totalCost += dishCost * saleItem.quantity;
    }
  }
  return Number(totalCost.toFixed(2));
}

export function calcGrossProfit(revenue: number, cost: number): number {
  return Number((revenue - cost).toFixed(2));
}

export function calcGrossProfitRate(revenue: number, cost: number): number {
  if (revenue === 0) return 0;
  return Number(((revenue - cost) / revenue * 100).toFixed(2));
}

export function calcDeviationRate(theoretical: number, actual: number): number {
  if (theoretical === 0) return 0;
  return Number(((actual - theoretical) / theoretical * 100).toFixed(2));
}

export function calcSuggestPurchaseQty(currentStock: number, alertThreshold: number, multiplier = 2): number {
  if (currentStock >= alertThreshold) return 0;
  return Number((alertThreshold * multiplier - currentStock).toFixed(2));
}

export function formatMoney(value: number): string {
  return '¥' + value.toFixed(2);
}

export function formatPercent(value: number): string {
  return value.toFixed(2) + '%';
}
