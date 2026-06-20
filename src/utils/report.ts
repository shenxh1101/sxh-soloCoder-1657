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
  OperationTrackerData,
  AlertItem,
  CostBreakdown,
  DrillDetail,
  DrillDishSaleItem,
  DrillIngredientConsumptionItem,
  DrillPurchaseItem,
  DrillInventoryItem,
  ReportDataSources,
  DateRange,
  PeriodDateRange,
  ReconciliationData,
} from '@/types';
import {
  calcGrossProfit,
  calcGrossProfitRate,
  calcDeviationRate,
  calcDishTheoreticalCost,
} from './calc';
import { formatDate, isInRange } from './date';
import { buildUrl } from './queryParams';

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

function getDataByDateRange<T extends { saleDate?: string; purchaseDate?: string; checkDate?: string }>(
  data: T[],
  dateField: 'saleDate' | 'purchaseDate' | 'checkDate',
  start: string,
  end: string
): T[] {
  return data.filter((item) => {
    const date = item[dateField];
    if (!date) return false;
    return isInRange(date, start, end);
  });
}

export function calculateCostBreakdown(
  sources: ReportDataSources,
  dateRange: DateRange
): CostBreakdown {
  const { sales, purchases, inventoryChecks, ingredients, dishes } = sources;
  const { start, end } = dateRange;

  const filteredSales = getDataByDateRange(sales, 'saleDate', start, end);
  const filteredPurchases = getDataByDateRange(purchases, 'purchaseDate', start, end);
  const filteredChecks = getDataByDateRange(inventoryChecks, 'checkDate', start, end);

  const revenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);

  const salesCost = filteredSales.reduce((sum, sale) => {
    if (typeof sale.totalCost === 'number' && sale.totalCost > 0) {
      return sum + sale.totalCost;
    }
    return sum + sale.items.reduce((itemSum, item) => itemSum + (item.cost || 0), 0);
  }, 0);

  const purchaseAmount = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);

  const profitAmount = filteredChecks.reduce((sum, c) => sum + (c.profitAmount || 0), 0);
  const lossAmount = filteredChecks.reduce((sum, c) => sum + (c.lossAmount || 0), 0);
  const inventoryDiff = lossAmount - profitAmount;

  const totalActualCost = salesCost + inventoryDiff;

  const theoreticalCost = filteredSales.reduce((sum, sale) => {
    return sum + sale.items.reduce((itemSum, saleItem) => {
      const dish = dishes.find((d) => d.id === saleItem.dishId);
      if (dish) {
        const dishCost = calcDishTheoreticalCost(dish, ingredients);
        return itemSum + dishCost * saleItem.quantity;
      }
      return itemSum;
    }, 0);
  }, 0);

  const saleCount = filteredSales.length;
  const purchaseCount = filteredPurchases.length;
  const checkCount = filteredChecks.length;

  return {
    salesCost: Number(salesCost.toFixed(2)),
    purchaseAmount: Number(purchaseAmount.toFixed(2)),
    inventoryDiff: Number(inventoryDiff.toFixed(2)),
    totalActualCost: Number(totalActualCost.toFixed(2)),
    theoreticalCost: Number(theoreticalCost.toFixed(2)),
    revenue: Number(revenue.toFixed(2)),
    saleCount,
    purchaseCount,
    checkCount,
  };
}

export function generateGrossProfitReport(
  sources: ReportDataSources,
  type: 'day' | 'week' | 'month'
): GrossProfitReportItem[] {
  const { sales, purchases, inventoryChecks, ingredients, dishes } = sources;
  const range = getDateRange(type);

  const filteredSales = getDataByDateRange(sales, 'saleDate', range.start, range.end);
  const filteredPurchases = getDataByDateRange(purchases, 'purchaseDate', range.start, range.end);
  const filteredChecks = getDataByDateRange(inventoryChecks, 'checkDate', range.start, range.end);

  const allDates = new Set<string>();
  filteredSales.forEach((s) => allDates.add(s.saleDate!));
  filteredPurchases.forEach((p) => allDates.add(p.purchaseDate!));
  filteredChecks.forEach((c) => allDates.add(c.checkDate!));

  if (allDates.size === 0) {
    const today = dayjs();
    for (let i = 6; i >= 0; i--) {
      allDates.add(today.subtract(i, 'day').format('YYYY-MM-DD'));
    }
  }

  const groups = groupByDatePeriod(Array.from(allDates).sort(), type);
  const report: GrossProfitReportItem[] = [];

  groups.forEach((datesInPeriod, periodKey) => {
    const periodSales = filteredSales.filter((s) => datesInPeriod.includes(s.saleDate!));
    const periodPurchases = filteredPurchases.filter((p) => datesInPeriod.includes(p.purchaseDate!));
    const periodChecks = filteredChecks.filter((c) => datesInPeriod.includes(c.checkDate!));

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

    const salesCost = periodSales.reduce((sum, sale) => {
      if (typeof sale.totalCost === 'number' && sale.totalCost > 0) {
        return sum + sale.totalCost;
      }
      return sum + sale.items.reduce((itemSum, item) => itemSum + (item.cost || 0), 0);
    }, 0);

    const purchaseAmount = periodPurchases.reduce((sum, p) => sum + p.totalAmount, 0);

    const profitAmount = periodChecks.reduce((sum, c) => sum + (c.profitAmount || 0), 0);
    const lossAmount = periodChecks.reduce((sum, c) => sum + (c.lossAmount || 0), 0);
    const inventoryDiff = lossAmount - profitAmount;

    const actualCost = salesCost + inventoryDiff;

    const grossProfit = calcGrossProfit(revenue, actualCost);
    const grossProfitRate = calcGrossProfitRate(revenue, actualCost);
    const deviationRate = calcDeviationRate(theoreticalCost, actualCost);

    report.push({
      date: periodKey,
      revenue: Number(revenue.toFixed(2)),
      theoreticalCost: Number(theoreticalCost.toFixed(2)),
      salesCost: Number(salesCost.toFixed(2)),
      purchaseAmount: Number(purchaseAmount.toFixed(2)),
      inventoryDiff: Number(inventoryDiff.toFixed(2)),
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
  dateRange: PeriodDateRange
): DeviationDetail {
  const { sales, ingredients, dishes, inventoryChecks } = sources;
  const { start, end, displayName } = dateRange;

  const periodSales = sales.filter((s) => isInRange(s.saleDate, start, end));
  const periodChecks = inventoryChecks.filter((c) => isInRange(c.checkDate, start, end));

  const dishMap = new Map<string, DeviationDishItem>();
  const ingredientUsage = new Map<string, { theoretical: number; actual: number; dishes: string[] }>();

  periodSales.forEach((sale) => {
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

  periodChecks.forEach((check) => {
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

  return { date: displayName, periodDateRange: dateRange, dishes: dishItems, ingredients: ingredientsList };
}

export function getPeriodDateRange(
  dim: 'day' | 'week' | 'month',
  periodLabel: string
): PeriodDateRange {
  const today = dayjs();

  if (dim === 'day') {
    const matched = periodLabel.match(/^(\d{1,2})-(\d{1,2})$/);
    if (matched) {
      const [, mm, dd] = matched;
      const target = dayjs(`${today.year()}-${mm}-${dd}`);
      const dateStr = target.format('YYYY-MM-DD');
      return { start: dateStr, end: dateStr, displayName: periodLabel };
    }
    const todayStr = today.format('YYYY-MM-DD');
    return { start: todayStr, end: todayStr, displayName: periodLabel };
  }

  if (dim === 'week') {
    const weekMatch = periodLabel.match(/^第(\d+)周$/);
    if (weekMatch) {
      const weekNum = parseInt(weekMatch[1], 10);
      const year = today.year();
      let weekDate = dayjs(`${year}-01-01`).add(weekNum - 1, 'week');
      while (weekDate.week() !== weekNum) {
        weekDate = weekDate.add(1, 'day');
      }
      const start = weekDate.startOf('week');
      const end = weekDate.endOf('week');
      return {
        start: start.format('YYYY-MM-DD'),
        end: end.format('YYYY-MM-DD'),
        displayName: periodLabel,
      };
    }
    const start = today.startOf('week');
    const end = today.endOf('week');
    return {
      start: start.format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD'),
      displayName: periodLabel,
    };
  }

  const monthMatch = periodLabel.match(/^(\d+)月$/);
  if (monthMatch) {
    const monthNum = parseInt(monthMatch[1], 10);
    const year = today.year();
    const target = dayjs(`${year}-${monthNum}-01`);
    const start = target.startOf('month');
    const end = target.endOf('month');
    return {
      start: start.format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD'),
      displayName: periodLabel,
    };
  }

  const start = today.startOf('month');
  const end = today.endOf('month');
  return {
    start: start.format('YYYY-MM-DD'),
    end: end.format('YYYY-MM-DD'),
    displayName: periodLabel,
  };
}

export function generateOperationTrackerData(
  sources: ReportDataSources,
  dimension: 'ingredient' | 'dish',
  days = 30
): OperationTrackerData {
  const { sales, purchases, ingredients, dishes } = sources;
  const today = dayjs();
  const startDate = today.subtract(days - 1, 'day');
  const start = startDate.format('YYYY-MM-DD');
  const end = today.format('YYYY-MM-DD');

  const labels: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    labels.push(today.subtract(i, 'day').format('MM-DD'));
  }

  const periodPurchases = getDataByDateRange(purchases, 'purchaseDate', start, end);
  const periodSales = getDataByDateRange(sales, 'saleDate', start, end);

  const summary = calculateCostBreakdown(sources, { start, end });

  const priceTrend: { name: string; data: number[] }[] = [];
  const topByConsumption: OperationTrackerData['topByConsumption'] = [];
  const topByGrossProfit: OperationTrackerData['topByGrossProfit'] = [];
  const priceChanges: OperationTrackerData['priceChanges'] = [];

  if (dimension === 'ingredient') {
    const ingredientDailyPrice = new Map<string, number[]>();
    const ingredientConsumption = new Map<string, { consumption: number; amount: number; unit: string; name: string }>();
    const ingredientRevenue = new Map<string, { revenue: number; cost: number }>();
    const ingredientFirstLastPrice = new Map<string, { firstPrice: number; lastPrice: number; name: string }>();

    ingredients.forEach((ing) => {
      ingredientDailyPrice.set(ing.id, new Array(days).fill(0));
      ingredientConsumption.set(ing.id, { consumption: 0, amount: 0, unit: ing.unit, name: ing.name });
      ingredientRevenue.set(ing.id, { revenue: 0, cost: 0 });
      ingredientFirstLastPrice.set(ing.id, { firstPrice: ing.costPrice, lastPrice: ing.costPrice, name: ing.name });
    });

    const dailyPurchaseMap = new Map<string, Map<string, number[]>>();
    periodPurchases.forEach((purchase) => {
      const dayIdx = dayjs(purchase.purchaseDate).diff(startDate, 'day');
      if (dayIdx < 0 || dayIdx >= days) return;
      purchase.items.forEach((item) => {
        if (!dailyPurchaseMap.has(item.ingredientId)) {
          dailyPurchaseMap.set(item.ingredientId, new Map());
        }
        const dayMap = dailyPurchaseMap.get(item.ingredientId)!;
        if (!dayMap.has(String(dayIdx))) {
          dayMap.set(String(dayIdx), []);
        }
        dayMap.get(String(dayIdx))!.push(item.unitPrice);
      });
    });

    ingredients.forEach((ing) => {
      const prices = ingredientDailyPrice.get(ing.id)!;
      const fl = ingredientFirstLastPrice.get(ing.id)!;
      let foundFirst = false;
      for (let i = 0; i < days; i++) {
        const dayPurchases = dailyPurchaseMap.get(ing.id);
        const dayPrices = dayPurchases ? dayPurchases.get(String(i)) : null;
        if (dayPrices && dayPrices.length > 0) {
          const avg = dayPrices.reduce((s, p) => s + p, 0) / dayPrices.length;
          prices[i] = Number(avg.toFixed(2));
          if (!foundFirst) {
            fl.firstPrice = avg;
            foundFirst = true;
          }
          fl.lastPrice = avg;
        } else {
          prices[i] = i > 0 ? prices[i - 1] : ing.costPrice;
        }
      }
    });

    periodSales.forEach((sale) => {
      sale.items.forEach((saleItem) => {
        const dish = dishes.find((d) => d.id === saleItem.dishId);
        if (!dish) return;
        const dishRevenue = saleItem.amount;
        const dishActualCost = saleItem.cost;
        const dishTheoreticalCost = calcDishTheoreticalCost(dish, ingredients) * saleItem.quantity;

        dish.bomItems.forEach((bomItem) => {
          const usage = bomItem.dosage * saleItem.quantity;
          const ing = ingredients.find((i) => i.id === bomItem.ingredientId);
          if (!ing) return;

          const cons = ingredientConsumption.get(bomItem.ingredientId)!;
          cons.consumption += usage;
          cons.amount += usage * ing.costPrice;

          const rev = ingredientRevenue.get(bomItem.ingredientId)!;
          const costRatio = dishTheoreticalCost > 0
            ? (bomItem.dosage * ing.costPrice * saleItem.quantity) / dishTheoreticalCost
            : 0;
          rev.revenue += dishRevenue * costRatio;
          rev.cost += dishActualCost * costRatio;
        });
      });
    });

    const topPriceIngredients = Array.from(ingredientDailyPrice.entries())
      .map(([id, data]) => {
        const ing = ingredients.find((i) => i.id === id);
        return { id, name: ing?.name || id, data };
      })
      .slice(0, 5);

    priceTrend.push(...topPriceIngredients);

    const sortedConsumption = Array.from(ingredientConsumption.entries())
      .map(([id, v]) => ({ id, name: v.name, consumption: v.consumption, amount: v.amount, unit: v.unit }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
      .map((v) => ({
        ...v,
        consumption: Number(v.consumption.toFixed(2)),
        amount: Number(v.amount.toFixed(2)),
      }));
    topByConsumption.push(...sortedConsumption);

    const sortedGP = Array.from(ingredientRevenue.entries())
      .map(([id, v]) => {
        const ing = ingredients.find((i) => i.id === id);
        const grossProfit = Number((v.revenue - v.cost).toFixed(2));
        const rate = v.revenue > 0 ? Number(((v.revenue - v.cost) / v.revenue * 100).toFixed(2)) : 0;
        return {
          id,
          name: ing?.name || id,
          revenue: Number(v.revenue.toFixed(2)),
          cost: Number(v.cost.toFixed(2)),
          grossProfit,
          rate,
        };
      })
      .sort((a, b) => b.grossProfit - a.grossProfit)
      .slice(0, 10);
    topByGrossProfit.push(...sortedGP);

    const sortedChanges = Array.from(ingredientFirstLastPrice.entries())
      .map(([id, v]) => {
        const changeRate = v.firstPrice > 0
          ? Number(((v.lastPrice - v.firstPrice) / v.firstPrice * 100).toFixed(2))
          : 0;
        return {
          id,
          name: v.name,
          firstPrice: Number(v.firstPrice.toFixed(2)),
          lastPrice: Number(v.lastPrice.toFixed(2)),
          changeRate,
        };
      })
      .filter((v) => Math.abs(v.changeRate) > 0.01)
      .sort((a, b) => Math.abs(b.changeRate) - Math.abs(a.changeRate))
      .slice(0, 10);
    priceChanges.push(...sortedChanges);
  } else {
    const dishDailyPrice = new Map<string, number[]>();
    const dishConsumption = new Map<string, { consumption: number; amount: number; unit: string; name: string }>();
    const dishRevenue = new Map<string, { revenue: number; cost: number; name: string }>();
    const dishFirstLastPrice = new Map<string, { firstPrice: number; lastPrice: number; name: string }>();

    dishes.forEach((dish) => {
      dishDailyPrice.set(dish.id, new Array(days).fill(0));
      dishConsumption.set(dish.id, { consumption: 0, amount: 0, unit: '份', name: dish.name });
      dishRevenue.set(dish.id, { revenue: 0, cost: 0, name: dish.name });
      dishFirstLastPrice.set(dish.id, { firstPrice: dish.price, lastPrice: dish.price, name: dish.name });
    });

    const dailySalePriceMap = new Map<string, Map<string, number[]>>();
    periodSales.forEach((sale) => {
      const dayIdx = dayjs(sale.saleDate).diff(startDate, 'day');
      if (dayIdx < 0 || dayIdx >= days) return;
      sale.items.forEach((item) => {
        if (!dailySalePriceMap.has(item.dishId)) {
          dailySalePriceMap.set(item.dishId, new Map());
        }
        const dayMap = dailySalePriceMap.get(item.dishId)!;
        if (!dayMap.has(String(dayIdx))) {
          dayMap.set(String(dayIdx), []);
        }
        dayMap.get(String(dayIdx))!.push(item.unitPrice);
      });
    });

    dishes.forEach((dish) => {
      const prices = dishDailyPrice.get(dish.id)!;
      const fl = dishFirstLastPrice.get(dish.id)!;
      let foundFirst = false;
      for (let i = 0; i < days; i++) {
        const daySales = dailySalePriceMap.get(dish.id);
        const dayPrices = daySales ? daySales.get(String(i)) : null;
        if (dayPrices && dayPrices.length > 0) {
          const avg = dayPrices.reduce((s, p) => s + p, 0) / dayPrices.length;
          prices[i] = Number(avg.toFixed(2));
          if (!foundFirst) {
            fl.firstPrice = avg;
            foundFirst = true;
          }
          fl.lastPrice = avg;
        } else {
          prices[i] = i > 0 ? prices[i - 1] : dish.price;
        }
      }
    });

    periodSales.forEach((sale) => {
      sale.items.forEach((saleItem) => {
        const dish = dishes.find((d) => d.id === saleItem.dishId);
        if (!dish) return;

        const cons = dishConsumption.get(dish.id)!;
        cons.consumption += saleItem.quantity;
        cons.amount += saleItem.amount;

        const rev = dishRevenue.get(dish.id)!;
        rev.revenue += saleItem.amount;
        rev.cost += saleItem.cost;
      });
    });

    const topPriceDishes = Array.from(dishDailyPrice.entries())
      .map(([id, data]) => {
        const dish = dishes.find((d) => d.id === id);
        return { id, name: dish?.name || id, data };
      })
      .slice(0, 5);
    priceTrend.push(...topPriceDishes);

    const sortedConsumption = Array.from(dishConsumption.entries())
      .map(([id, v]) => ({ id, name: v.name, consumption: v.consumption, amount: v.amount, unit: v.unit }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
      .map((v) => ({
        ...v,
        consumption: Number(v.consumption.toFixed(2)),
        amount: Number(v.amount.toFixed(2)),
      }));
    topByConsumption.push(...sortedConsumption);

    const sortedGP = Array.from(dishRevenue.entries())
      .map(([id, v]) => {
        const grossProfit = Number((v.revenue - v.cost).toFixed(2));
        const rate = v.revenue > 0 ? Number(((v.revenue - v.cost) / v.revenue * 100).toFixed(2)) : 0;
        return {
          id,
          name: v.name,
          revenue: Number(v.revenue.toFixed(2)),
          cost: Number(v.cost.toFixed(2)),
          grossProfit,
          rate,
        };
      })
      .sort((a, b) => b.grossProfit - a.grossProfit)
      .slice(0, 10);
    topByGrossProfit.push(...sortedGP);

    const sortedChanges = Array.from(dishFirstLastPrice.entries())
      .map(([id, v]) => {
        const changeRate = v.firstPrice > 0
          ? Number(((v.lastPrice - v.firstPrice) / v.firstPrice * 100).toFixed(2))
          : 0;
        return {
          id,
          name: v.name,
          firstPrice: Number(v.firstPrice.toFixed(2)),
          lastPrice: Number(v.lastPrice.toFixed(2)),
          changeRate,
        };
      })
      .filter((v) => Math.abs(v.changeRate) > 0.01)
      .sort((a, b) => Math.abs(b.changeRate) - Math.abs(a.changeRate))
      .slice(0, 10);
    priceChanges.push(...sortedChanges);
  }

  return {
    labels,
    priceTrend,
    topByConsumption,
    topByGrossProfit,
    priceChanges,
  };
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

export function generateAlerts(sources: ReportDataSources): AlertItem[] {
  const { sales, purchases, inventoryChecks, ingredients, dishes } = sources;
  const alerts: AlertItem[] = [];
  const today = dayjs().format('YYYY-MM-DD');

  const negativeRiskCount = ingredients.filter(
    (ing) => ing.stock < ing.alertThreshold * 1.2 && ing.stock > 0
  ).length;
  if (negativeRiskCount > 0) {
    const params = { type: 'negative_risk', date: today };
    alerts.push({
      type: 'negative_stock',
      title: '负库存风险预警',
      description: `${negativeRiskCount} 种食材库存接近预警线，建议尽快采购`,
      value: `${negativeRiskCount} 种`,
      level: negativeRiskCount > 3 ? 'danger' : 'warning',
      targetPath: buildUrl('/reports/stock-alert', params),
      targetLabel: '查看库存预警',
      queryParams: params,
    });
  }

  const todayChecks = inventoryChecks.filter(
    (c) => c.checkDate === today && c.status === 'completed'
  );
  const todayLoss = todayChecks.reduce((sum, c) => sum + c.lossAmount, 0);
  const todaySaleAmount = sales
    .filter((s) => s.saleDate === today)
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const lossRate = todaySaleAmount > 0 ? (todayLoss / todaySaleAmount) * 100 : 0;
  if (lossRate > 3 || todayLoss >= 200) {
    const params = { date: today, type: 'high_loss' };
    alerts.push({
      type: 'high_loss',
      title: '盘亏金额偏高',
      description: `今日盘亏 ${lossRate.toFixed(1)}%（占销售额比例），建议检查盘点操作或损耗情况`,
      value: `¥${todayLoss.toFixed(2)}`,
      level: lossRate > 5 ? 'danger' : 'warning',
      targetPath: buildUrl('/inventory', params),
      targetLabel: '查看盘点记录',
      queryParams: params,
    });
  }

  const todaySale = sales.filter((s) => s.saleDate === today);
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const yesterdaySale = sales.filter((s) => s.saleDate === yesterday);

  const todayGp =
    todaySale.reduce((sum, s) => sum + s.totalAmount, 0) -
    todaySale.reduce((sum, s) => sum + s.totalCost, 0);
  const todayRev = todaySale.reduce((sum, s) => sum + s.totalAmount, 0);
  const todayGpRate = todayRev > 0 ? (todayGp / todayRev) * 100 : 0;

  const yesterdayGp =
    yesterdaySale.reduce((sum, s) => sum + s.totalAmount, 0) -
    yesterdaySale.reduce((sum, s) => sum + s.totalCost, 0);
  const yesterdayRev = yesterdaySale.reduce((sum, s) => sum + s.totalAmount, 0);
  const yesterdayGpRate = yesterdayRev > 0 ? (yesterdayGp / yesterdayRev) * 100 : 0;

  const gpDrop = yesterdayGpRate - todayGpRate;
  if (todayRev > 0 && yesterdayRev > 500 && gpDrop >= 8) {
    const params = { dim: 'day', date: today, from: 'yesterday_compare' };
    alerts.push({
      type: 'gp_drop',
      title: '毛利率异常下降',
      description: `今日毛利率 ${todayGpRate.toFixed(1)}%，较昨日下降 ${gpDrop.toFixed(1)}%`,
      value: `${gpDrop.toFixed(1)}% ↓`,
      level: gpDrop > 15 ? 'danger' : 'warning',
      targetPath: buildUrl('/reports/gross-profit', params),
      targetLabel: '分析毛利明细',
      queryParams: params,
    });
  }

  const report7 = generateGrossProfitReport(sources, 'day');
  const recentDeviation = report7.length > 0 ? report7[report7.length - 1].deviationRate : 0;
  if (Math.abs(recentDeviation) > 10) {
    const params = { dim: 'day', date: today, type: 'high_deviation' };
    alerts.push({
      type: 'high_deviation',
      title: '成本偏差率偏高',
      description: `今日成本偏差率 ${recentDeviation.toFixed(1)}%，建议检查 BOM 配方和盘点`,
      value: `${recentDeviation.toFixed(1)}%`,
      level: Math.abs(recentDeviation) > 20 ? 'danger' : 'warning',
      targetPath: buildUrl('/reports/gross-profit', params),
      targetLabel: '查看成本偏差',
      queryParams: params,
    });
  }

  return alerts;
}

export function generateDrillDetail(
  sources: ReportDataSources,
  targetId: string,
  targetType: 'dish' | 'ingredient',
  periodDateRange: { start: string; end: string; displayName: string }
): DrillDetail {
  const { sales, purchases, inventoryChecks, ingredients, dishes } = sources;
  const { start, end } = periodDateRange;

  const periodSales = sales.filter((s) => isInRange(s.saleDate, start, end));
  const periodPurchases = purchases.filter((p) => isInRange(p.purchaseDate, start, end));
  const periodChecks = inventoryChecks.filter((c) => isInRange(c.checkDate, start, end));

  if (targetType === 'dish') {
    const dish = dishes.find((d) => d.id === targetId);
    if (!dish) {
      return {
        targetId,
        targetName: '未知菜品',
        targetType,
        periodDateRange,
        theoreticalCost: 0,
        actualCost: 0,
        deviation: 0,
        deviationRate: 0,
        dishSales: [],
      };
    }

    const dishSales: DrillDishSaleItem[] = [];
    let totalTheoreticalCost = 0;
    let totalActualCost = 0;

    periodSales.forEach((sale) => {
      const saleItem = sale.items.find((item) => item.dishId === targetId);
      if (!saleItem) return;

      const dishTheoreticalCost = calcDishTheoreticalCost(dish, ingredients);
      const theoreticalCost = Number((dishTheoreticalCost * saleItem.quantity).toFixed(2));
      const actualCost = Number(saleItem.cost.toFixed(2));

      totalTheoreticalCost += theoreticalCost;
      totalActualCost += actualCost;

      const bomBreakdown = dish.bomItems.map((bomItem) => {
        const ingredient = ingredients.find((i) => i.id === bomItem.ingredientId);
        const quantity = Number((bomItem.dosage * saleItem.quantity).toFixed(4));
        const cost = Number((quantity * (ingredient?.costPrice || 0)).toFixed(2));
        return {
          ingredientId: bomItem.ingredientId,
          ingredientName: bomItem.ingredientName,
          quantity,
          unit: bomItem.unit,
          cost,
        };
      });

      dishSales.push({
        saleId: sale.id,
        saleDate: sale.saleDate,
        quantity: saleItem.quantity,
        revenue: Number(saleItem.amount.toFixed(2)),
        theoreticalCost,
        actualCost,
        bomBreakdown,
      });
    });

    const ingredientIds = dish.bomItems.map((b) => b.ingredientId);
    const dishInventories: DrillInventoryItem[] = [];
    periodChecks.forEach((check) => {
      if (check.status !== 'completed') return;
      check.items.forEach((checkItem) => {
        if (ingredientIds.includes(checkItem.ingredientId)) {
          const ingredient = ingredients.find((i) => i.id === checkItem.ingredientId);
          dishInventories.push({
            checkId: check.id,
            checkDate: check.checkDate,
            ingredientName: checkItem.ingredientName || ingredient?.name,
            systemStock: Number(checkItem.systemStock.toFixed(4)),
            actualStock: Number(checkItem.actualStock.toFixed(4)),
            diffQuantity: Number(checkItem.diffQuantity.toFixed(4)),
            diffAmount: Number(checkItem.diffAmount.toFixed(2)),
            diffType: checkItem.diffType,
            unit: ingredient?.unit || checkItem.unit,
          });
        }
      });
    });

    totalTheoreticalCost = Number(totalTheoreticalCost.toFixed(2));
    totalActualCost = Number(totalActualCost.toFixed(2));
    const deviation = Number((totalActualCost - totalTheoreticalCost).toFixed(2));
    const deviationRate = Number(calcDeviationRate(totalTheoreticalCost, totalActualCost));

    return {
      targetId,
      targetName: dish.name,
      targetType,
      periodDateRange,
      theoreticalCost: totalTheoreticalCost,
      actualCost: totalActualCost,
      deviation,
      deviationRate,
      dishSales,
      dishInventories,
    };
  }

  const ingredient = ingredients.find((i) => i.id === targetId);
  if (!ingredient) {
    return {
      targetId,
      targetName: '未知食材',
      targetType,
      periodDateRange,
      theoreticalCost: 0,
      actualCost: 0,
      deviation: 0,
      deviationRate: 0,
      ingredientConsumptions: [],
      ingredientPurchases: [],
      ingredientInventories: [],
    };
  }

  const consumptionMap = new Map<string, {
    dishId: string;
    dishName: string;
    soldQuantity: number;
    consumedQuantity: number;
    theoreticalCost: number;
  }>();

  let totalTheoreticalCost = 0;

  periodSales.forEach((sale) => {
    sale.items.forEach((saleItem) => {
      const dish = dishes.find((d) => d.id === saleItem.dishId);
      if (!dish) return;
      const bomItem = dish.bomItems.find((b) => b.ingredientId === targetId);
      if (!bomItem) return;

      const consumedQuantity = bomItem.dosage * saleItem.quantity;
      const theoreticalCost = Number((consumedQuantity * ingredient.costPrice).toFixed(2));

      if (!consumptionMap.has(dish.id)) {
        consumptionMap.set(dish.id, {
          dishId: dish.id,
          dishName: dish.name,
          soldQuantity: 0,
          consumedQuantity: 0,
          theoreticalCost: 0,
        });
      }

      const entry = consumptionMap.get(dish.id)!;
      entry.soldQuantity += saleItem.quantity;
      entry.consumedQuantity += consumedQuantity;
      entry.theoreticalCost += theoreticalCost;

      totalTheoreticalCost += theoreticalCost;
    });
  });

  const ingredientConsumptions: DrillIngredientConsumptionItem[] = Array.from(
    consumptionMap.values()
  ).map((item) => ({
    ...item,
    consumedQuantity: Number(item.consumedQuantity.toFixed(4)),
    theoreticalCost: Number(item.theoreticalCost.toFixed(2)),
    unit: ingredient.unit,
  }));

  const ingredientPurchases: DrillPurchaseItem[] = [];
  periodPurchases.forEach((purchase) => {
    const purchaseItem = purchase.items.find((item) => item.ingredientId === targetId);
    if (!purchaseItem) return;
    ingredientPurchases.push({
      purchaseId: purchase.id,
      purchaseDate: purchase.purchaseDate,
      supplierName: purchase.supplierName,
      quantity: Number(purchaseItem.quantity.toFixed(4)),
      unit: ingredient.unit,
      unitPrice: Number(purchaseItem.unitPrice.toFixed(2)),
      amount: Number(purchaseItem.amount.toFixed(2)),
    });
  });

  const ingredientInventories: DrillInventoryItem[] = [];
  periodChecks.forEach((check) => {
    if (check.status !== 'completed') return;
    const checkItem = check.items.find((item) => item.ingredientId === targetId);
    if (!checkItem) return;
    ingredientInventories.push({
      checkId: check.id,
      checkDate: check.checkDate,
      ingredientName: checkItem.ingredientName || ingredient.name,
      systemStock: Number(checkItem.systemStock.toFixed(4)),
      actualStock: Number(checkItem.actualStock.toFixed(4)),
      diffQuantity: Number(checkItem.diffQuantity.toFixed(4)),
      diffAmount: Number(checkItem.diffAmount.toFixed(2)),
      diffType: checkItem.diffType,
      unit: ingredient.unit,
    });
  });

  const totalDiffAmount = ingredientInventories.reduce((sum, item) => sum + item.diffAmount, 0);
  const totalActualCost = Number((totalTheoreticalCost + totalDiffAmount).toFixed(2));
  const deviation = Number((totalActualCost - totalTheoreticalCost).toFixed(2));
  const deviationRate = Number(calcDeviationRate(totalTheoreticalCost, totalActualCost));

  return {
    targetId,
    targetName: ingredient.name,
    targetType,
    periodDateRange,
    theoreticalCost: Number(totalTheoreticalCost.toFixed(2)),
    actualCost: totalActualCost,
    deviation,
    deviationRate,
    ingredientConsumptions,
    ingredientPurchases,
    ingredientInventories,
  };
}

export function generateReconciliationData(
  sources: ReportDataSources,
  days: number
): ReconciliationData {
  const { sales, ingredients, dishes } = sources;
  const today = dayjs();
  const startDate = today.subtract(days - 1, 'day');
  const start = startDate.format('YYYY-MM-DD');
  const end = today.format('YYYY-MM-DD');

  const dateRange = { start, end };
  const filteredSales = getDataByDateRange(sales, 'saleDate', start, end);

  const salesRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const salesCost = filteredSales.reduce((sum, s) => sum + s.totalCost, 0);
  const saleCount = filteredSales.length;

  const costBreakdown = calculateCostBreakdown(sources, dateRange);

  const opRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const opCost = filteredSales.reduce((sum, sale) => {
    return sum + sale.items.reduce((itemSum, saleItem) => {
      const dish = dishes.find((d) => d.id === saleItem.dishId);
      if (dish) {
        const dishCost = calcDishTheoreticalCost(dish, ingredients);
        return itemSum + dishCost * saleItem.quantity;
      }
      return itemSum;
    }, 0);
  }, 0);

  const usedIngredientIds = new Set<string>();
  const usedDishIds = new Set<string>();
  filteredSales.forEach((sale) => {
    sale.items.forEach((saleItem) => {
      usedDishIds.add(saleItem.dishId);
      const dish = dishes.find((d) => d.id === saleItem.dishId);
      if (dish) {
        dish.bomItems.forEach((bomItem) => {
          usedIngredientIds.add(bomItem.ingredientId);
        });
      }
    });
  });

  const salesGrossProfit = calcGrossProfit(salesRevenue, salesCost);
  const salesGrossProfitRate = calcGrossProfitRate(salesRevenue, salesCost);

  const gpGrossProfit = calcGrossProfit(costBreakdown.revenue, costBreakdown.totalActualCost);
  const gpGrossProfitRate = calcGrossProfitRate(costBreakdown.revenue, costBreakdown.totalActualCost);
  const gpDeviationRate = calcDeviationRate(costBreakdown.theoreticalCost, costBreakdown.totalActualCost);

  const opGrossProfit = calcGrossProfit(opRevenue, opCost);
  const opGrossProfitRate = calcGrossProfitRate(opRevenue, opCost);

  return {
    period: { start, end, days },
    salesTotal: {
      revenue: Number(salesRevenue.toFixed(2)),
      cost: Number(salesCost.toFixed(2)),
      grossProfit: salesGrossProfit,
      grossProfitRate: salesGrossProfitRate,
      saleCount,
    },
    grossProfitAnalysis: {
      revenue: costBreakdown.revenue,
      theoreticalCost: costBreakdown.theoreticalCost,
      actualCost: costBreakdown.totalActualCost,
      salesCost: costBreakdown.salesCost,
      purchaseAmount: costBreakdown.purchaseAmount,
      inventoryDiff: costBreakdown.inventoryDiff,
      grossProfit: gpGrossProfit,
      grossProfitRate: gpGrossProfitRate,
      deviationRate: gpDeviationRate,
    },
    operationTracker: {
      revenue: Number(opRevenue.toFixed(2)),
      cost: Number(opCost.toFixed(2)),
      grossProfit: opGrossProfit,
      grossProfitRate: opGrossProfitRate,
      ingredientCount: usedIngredientIds.size,
      dishCount: usedDishIds.size,
    },
    differences: {
      sales_vs_gp_revenue: Number((salesRevenue - costBreakdown.revenue).toFixed(2)),
      sales_vs_gp_cost: Number((salesCost - costBreakdown.totalActualCost).toFixed(2)),
      sales_vs_op_revenue: Number((salesRevenue - opRevenue).toFixed(2)),
      sales_vs_op_cost: Number((salesCost - opCost).toFixed(2)),
    },
  };
}
