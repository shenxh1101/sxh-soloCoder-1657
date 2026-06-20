import dayjs from 'dayjs';
import type {
  Sale,
  Purchase,
  InventoryCheck,
  Ingredient,
  Dish,
  GrossProfitReportItem,
  DeviationDetail,
  DeviationDishItem,
  DeviationIngredientItem,
  StockCheckResult,
  NegativeStockItem,
} from '@/types';
import {
  calcGrossProfit,
  calcGrossProfitRate,
  calcDeviationRate,
  calcDishTheoreticalCost,
} from './calc';
import { formatDate } from './date';

interface ReportDataSources {
  sales: Sale[];
  purchases: Purchase[];
  inventoryChecks: InventoryCheck[];
  ingredients: Ingredient[];
  dishes: Dish[];
}

interface DateRange {
  start: string;
  end: string;
}

function getDateRange(type: 'day' | 'week' | 'month'): DateRange {
  const today = dayjs();
  let start: dayjs.Dayjs;
  let end: dayjs.Dayjs;

  switch (type) {
    case 'day':
      start = today.subtract(6, 'day');
      end = today;
      break;
    case 'week':
      start = today.subtract(3, 'week').startOf('week');
      end = today.endOf('week');
      break;
    case 'month':
      start = today.subtract(5, 'month').startOf('month');
      end = today.endOf('month');
      break;
  }

  return {
    start: start.format('YYYY-MM-DD'),
    end: end.format('YYYY-MM-DD'),
  };
}

function groupByDatePeriod(
  dates: string[],
  type: 'day' | 'week' | 'month'
): Map<string, string[]> {
  const groups = new Map<string, string[]>();

  dates.forEach((date) => {
    let key: string;
    switch (type) {
      case 'day':
        key = formatDate(date, 'MM-DD');
        break;
      case 'week': {
        const weekNum = dayjs(date).week();
        key = `第${weekNum}周`;
        break;
      }
      case 'month':
        key = formatDate(date, 'M月');
        break;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(date);
  });

  return groups;
}

function getDataByDateRange(
  data: { saleDate?: string; purchaseDate?: string; checkDate?: string }[],
  dateField: 'saleDate' | 'purchaseDate' | 'checkDate',
  start: string,
  end: string
): typeof data {
  return data.filter((item) => {
    const date = item[dateField];
    if (!date) return false;
    return dayjs(date).isBetween(start, end, 'day', '[]');
  });
}

export function generateGrossProfitReport(
  sources: ReportDataSources,
  type: 'day' | 'week' | 'month'
): GrossProfitReportItem[] {
  const { sales, purchases, inventoryChecks, ingredients, dishes } = sources;
  const range = getDateRange(type);

  const filteredSales = getDataByDateRange(sales, 'saleDate', range.start, range.end) as Sale[];
  const filteredPurchases = getDataByDateRange(purchases, 'purchaseDate', range.start, range.end) as Purchase[];
  const filteredChecks = getDataByDateRange(inventoryChecks, 'checkDate', range.start, range.end) as InventoryCheck[];

  const allDates = new Set<string>();
  filteredSales.forEach((s) => allDates.add(s.saleDate));
  filteredPurchases.forEach((p) => allDates.add(p.purchaseDate));
  filteredChecks.forEach((c) => allDates.add(c.checkDate));

  if (allDates.size === 0) {
    const today = dayjs();
    for (let i = 6; i >= 0; i--) {
      allDates.add(today.subtract(i, 'day').format('YYYY-MM-DD'));
    }
  }

  const groups = groupByDatePeriod(Array.from(allDates).sort(), type);
  const report: GrossProfitReportItem[] = [];

  const openingStockValue = ingredients.reduce((sum, ing) => sum + ing.stock * ing.costPrice, 0);

  groups.forEach((datesInPeriod, periodKey) => {
    const periodSales = filteredSales.filter((s) => datesInPeriod.includes(s.saleDate));
    const periodPurchases = filteredPurchases.filter((p) => datesInPeriod.includes(p.purchaseDate));
    const periodChecks = filteredChecks.filter((c) => datesInPeriod.includes(c.checkDate));

    const revenue = periodSales.reduce((sum, s) => sum + s.totalAmount, 0);

    const theoreticalCost = periodSales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, saleItem) => {
        const dish = dishes.find((d) => d.id === saleItem.dishId);
        if (dish) {
          const dishCost = calcDishTheoreticalCost(dish, ingredients);
          return itemSum + dishCost * saleItem.quantity;
        }
        return itemSum;
      }, 0);
    }, 0);

    const purchaseAmount = periodPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const profitAmount = periodChecks.reduce((sum, c) => sum + c.profitAmount, 0);
    const lossAmount = periodChecks.reduce((sum, c) => sum + c.lossAmount, 0);

    const periodStartIngredients = datesInPeriod.sort()[0];
    const periodEndIngredients = datesInPeriod.sort()[datesInPeriod.length - 1];
    const startStockValue = periodStartIngredients === range.start ? openingStockValue : openingStockValue * 0.8;
    const endStockValue = openingStockValue + purchaseAmount - theoreticalCost + profitAmount - lossAmount;

    const actualCost = startStockValue + purchaseAmount - endStockValue + lossAmount - profitAmount;

    const grossProfit = calcGrossProfit(revenue, actualCost);
    const grossProfitRate = calcGrossProfitRate(revenue, actualCost);
    const deviationRate = calcDeviationRate(theoreticalCost, actualCost);

    report.push({
      date: periodKey,
      revenue: Number(revenue.toFixed(2)),
      theoreticalCost: Number(theoreticalCost.toFixed(2)),
      actualCost: Number(actualCost.toFixed(2)),
      grossProfit,
      grossProfitRate,
      deviationRate,
    });
  });

  return report;
}

export function generateDailyTrendData(
  sources: ReportDataSources
): { date: string; revenue: number; cost: number; grossProfit: number }[] {
  const { sales, ingredients, dishes } = sources;
  const today = dayjs();
  const data = [];

  for (let i = 6; i >= 0; i--) {
    const date = today.subtract(i, 'day').format('YYYY-MM-DD');
    const daySales = sales.filter((s) => s.saleDate === date);

    const revenue = daySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const cost = daySales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, saleItem) => {
        const dish = dishes.find((d) => d.id === saleItem.dishId);
        if (dish) {
          const dishCost = calcDishTheoreticalCost(dish, ingredients);
          return itemSum + dishCost * saleItem.quantity;
        }
        return itemSum;
      }, 0);
    }, 0);

    data.push({
      date: formatDate(date, 'MM-DD'),
      revenue: Number(revenue.toFixed(2)),
      cost: Number(cost.toFixed(2)),
      grossProfit: Number((revenue - cost).toFixed(2)),
    });
  }

  return data;
}

export function generateDeviationDetail(
  sources: ReportDataSources,
  date: string
): DeviationDetail {
  const { sales, ingredients, dishes, inventoryChecks } = sources;

  const daySales = sales.filter((s) => s.saleDate === date);
  const dayChecks = inventoryChecks.filter((c) => c.checkDate === date);

  const dishMap = new Map<string, DeviationDishItem>();
  const ingredientUsage = new Map<string, { theoretical: number; actual: number; dishes: string[] }>();

  daySales.forEach((sale) => {
    sale.items.forEach((saleItem) => {
      const dish = dishes.find((d) => d.id === saleItem.dishId);
      if (!dish) return;

      const theoreticalCost = calcDishTheoreticalCost(dish, ingredients);
      const actualCost = saleItem.cost;
      const deviation = actualCost - theoreticalCost * saleItem.quantity;

      if (!dishMap.has(dish.id)) {
        dishMap.set(dish.id, {
          dishId: dish.id,
          dishName: dish.name,
          soldQuantity: 0,
          theoreticalCost: 0,
          actualCost: 0,
          deviation: 0,
          deviationRate: 0,
        });
      }

      const entry = dishMap.get(dish.id)!;
      entry.soldQuantity += saleItem.quantity;
      entry.theoreticalCost += theoreticalCost * saleItem.quantity;
      entry.actualCost += actualCost;
      entry.deviation += deviation;

      dish.bomItems.forEach((bomItem) => {
        const usage = bomItem.dosage * saleItem.quantity;
        if (!ingredientUsage.has(bomItem.ingredientId)) {
          ingredientUsage.set(bomItem.ingredientId, { theoretical: 0, actual: 0, dishes: [] });
        }
        const usageEntry = ingredientUsage.get(bomItem.ingredientId)!;
        usageEntry.theoretical += usage;
        usageEntry.actual += usage;
        if (!usageEntry.dishes.includes(dish.name)) {
          usageEntry.dishes.push(dish.name);
        }
      });
    });
  });

  dayChecks.forEach((check) => {
    if (check.status !== 'completed') return;
    check.items.forEach((checkItem) => {
      if (!ingredientUsage.has(checkItem.ingredientId)) {
        ingredientUsage.set(checkItem.ingredientId, { theoretical: 0, actual: 0, dishes: [] });
      }
      const usageEntry = ingredientUsage.get(checkItem.ingredientId)!;
      usageEntry.actual -= checkItem.diffQuantity;
    });
  });

  const dishItems: DeviationDishItem[] = Array.from(dishMap.values()).map((d) => ({
    ...d,
    theoreticalCost: Number(d.theoreticalCost.toFixed(2)),
    actualCost: Number(d.actualCost.toFixed(2)),
    deviation: Number(d.deviation.toFixed(2)),
    deviationRate: Number(calcDeviationRate(d.theoreticalCost, d.actualCost)),
  }));

  const ingredientsList: DeviationIngredientItem[] = Array.from(ingredientUsage.entries())
    .map(([ingredientId, usage]) => {
      const ingredient = ingredients.find((i) => i.id === ingredientId);
      if (!ingredient) return null;

      const deviation = usage.actual - usage.theoretical;
      const deviationAmount = deviation * ingredient.costPrice;

      let reason: 'waste' | 'inventory' | 'bom' | 'other' = 'waste';
      const devRate = usage.theoretical > 0 ? Math.abs(deviation) / usage.theoretical : 0;
      if (devRate > 0.3) reason = 'bom';
      else if (devRate > 0.15) reason = 'waste';
      else if (Math.abs(deviation) < 0.5) reason = 'inventory';

      return {
        ingredientId,
        ingredientName: ingredient.name,
        unit: ingredient.unit,
        theoreticalUsage: Number(usage.theoretical.toFixed(2)),
        actualUsage: Number(usage.actual.toFixed(2)),
        price: ingredient.costPrice,
        deviation: Number(deviation.toFixed(2)),
        deviationAmount: Number(deviationAmount.toFixed(2)),
        reason,
      };
    })
    .filter(Boolean) as DeviationIngredientItem[];

  return { date, dishes: dishItems, ingredients: ingredientsList };
}

export function checkNegativeStock(
  saleItems: { dishId: string; quantity: number }[],
  dishes: Dish[],
  ingredients: Ingredient[]
): StockCheckResult {
  const ingredientRequirements = new Map<string, { required: number; dishes: string[] }>();

  saleItems.forEach((saleItem) => {
    const dish = dishes.find((d) => d.id === saleItem.dishId);
    if (!dish) return;

    dish.bomItems.forEach((bomItem) => {
      const required = bomItem.dosage * saleItem.quantity;
      if (!ingredientRequirements.has(bomItem.ingredientId)) {
        ingredientRequirements.set(bomItem.ingredientId, { required: 0, dishes: [] });
      }
      const entry = ingredientRequirements.get(bomItem.ingredientId)!;
      entry.required += required;
      if (!entry.dishes.includes(dish.name)) {
        entry.dishes.push(dish.name);
      }
    });
  });

  const items: NegativeStockItem[] = [];

  ingredientRequirements.forEach((req, ingredientId) => {
    const ingredient = ingredients.find((i) => i.id === ingredientId);
    if (!ingredient) return;

    if (ingredient.stock < req.required) {
      items.push({
        ingredientId,
        ingredientName: ingredient.name,
        unit: ingredient.unit,
        currentStock: ingredient.stock,
        requiredStock: req.required,
        shortfall: Number((req.required - ingredient.stock).toFixed(2)),
        affectedDishes: req.dishes,
      });
    }
  });

  return {
    hasNegativeStock: items.length > 0,
    items,
  };
}
