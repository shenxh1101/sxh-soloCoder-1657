import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Filter, Package, ArrowLeft, ChefHat, AlertOctagon } from 'lucide-react';
import { useIngredientStore } from '@/store/useIngredientStore';
import { useDishStore } from '@/store/useDishStore';
import { formatMoney, calcSuggestPurchaseQty } from '@/utils/calc';
import { parseQuery } from '@/utils/queryParams';
import Button from '@/components/common/Button';
import { cn } from '@/lib/utils';
import type { Ingredient } from '@/types';

type AlertSeverity = 'severe' | 'low';

function getAlertSeverity(stock: number, threshold: number): AlertSeverity {
  return stock < threshold * 0.5 ? 'severe' : 'low';
}

export default function StockAlert() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ingredients, init, getAlertIngredients } = useIngredientStore();
  const { dishes } = useDishStore();
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  useEffect(() => {
    init();
  }, [init]);

  const queryParams = useMemo(() => parseQuery(location.search), [location.search]);
  const isNegativeRiskView = queryParams.type === 'negative_risk';
  const filterDate = queryParams.date as string | undefined;

  const negativeRiskItems = useMemo(() => {
    if (!isNegativeRiskView) return [];

    const riskIngredients = ingredients.filter(
      (ing) => ing.stock < ing.alertThreshold * 1.2 && ing.stock > 0
    );

    return riskIngredients.map((ing) => {
      const affectedDishes = dishes
        .filter((dish) =>
          dish.bomItems.some((bom) => bom.ingredientId === ing.id)
        )
        .map((dish) => dish.name);

      return {
        ingredient: ing,
        affectedDishes,
        riskLevel: ing.stock < ing.alertThreshold * 0.5 ? 'critical' : 'warning',
      };
    });
  }, [ingredients, dishes, isNegativeRiskView]);

  const alertIngredients = useMemo(() => {
    return getAlertIngredients();
  }, [ingredients]);

  const categories = useMemo(() => {
    const cats = new Set(alertIngredients.map((item) => item.category));
    return Array.from(cats);
  }, [alertIngredients]);

  const filteredIngredients = useMemo(() => {
    if (!categoryFilter) return alertIngredients;
    return alertIngredients.filter((item) => item.category === categoryFilter);
  }, [alertIngredients, categoryFilter]);

  const sortedIngredients = useMemo(() => {
    return [...filteredIngredients].sort((a, b) => {
      const severityA = getAlertSeverity(a.stock, a.alertThreshold);
      const severityB = getAlertSeverity(b.stock, b.alertThreshold);
      if (severityA === 'severe' && severityB === 'low') return -1;
      if (severityA === 'low' && severityB === 'severe') return 1;
      return a.stock / a.alertThreshold - b.stock / b.alertThreshold;
    });
  }, [filteredIngredients]);

  const severeCount = alertIngredients.filter(
    (item) => getAlertSeverity(item.stock, item.alertThreshold) === 'severe'
  ).length;

  const handleGenerateSuggestion = () => {
    navigate('/reports/purchase-suggestion');
  };

  if (isNegativeRiskView) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/reports/stock-alert')}>
            <ArrowLeft className="w-4 h-4" />
            返回库存预警
          </Button>
        </div>

        <div className="flex items-center gap-3 p-4 bg-danger-50 border border-danger-200 rounded-xl">
          <AlertOctagon className="w-6 h-6 text-danger-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-danger-800">负库存风险预警</h3>
            <p className="text-sm text-danger-600">
              以下食材库存接近预警线，可能导致负库存，影响菜品正常销售
              {filterDate && <span className="ml-2">（筛选日期：{filterDate}）</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-danger-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-danger-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">风险食材总数</p>
                <p className="text-2xl font-bold text-gray-800">{negativeRiskItems.length} 种</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-danger-500 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">严重风险</p>
                <p className="text-2xl font-bold text-danger-600">
                  {negativeRiskItems.filter(i => i.riskLevel === 'critical').length} 种
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-warning-500 flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">受影响菜品</p>
                <p className="text-2xl font-bold text-warning-600">
                  {new Set(negativeRiskItems.flatMap(i => i.affectedDishes)).size} 道
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    食材名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    规格
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    当前库存
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    预警阈值
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    安全缺口
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    受影响菜品
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    风险等级
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {negativeRiskItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      暂无负库存风险食材
                    </td>
                  </tr>
                ) : (
                  negativeRiskItems.map(({ ingredient, affectedDishes, riskLevel }) => {
                    const gap = (ingredient.alertThreshold * 1.2 - ingredient.stock).toFixed(2);
                    return (
                      <tr
                        key={ingredient.id}
                        className={cn(
                          'hover:bg-gray-50 transition-colors',
                          riskLevel === 'critical' && 'bg-danger-50/50'
                        )}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-800">{ingredient.name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ingredient.spec}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-700">
                          {ingredient.stock} {ingredient.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {ingredient.alertThreshold} {ingredient.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-danger-600">
                          {gap} {ingredient.unit}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {affectedDishes.length > 0 ? (
                              affectedDishes.slice(0, 3).map((dish, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-md"
                                >
                                  <ChefHat className="w-3 h-3 mr-1" />
                                  {dish}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">暂无关联菜品</span>
                            )}
                            {affectedDishes.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">
                                +{affectedDishes.length - 3} 道
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={cn(
                              'inline-flex px-2.5 py-1 text-xs font-medium rounded-full',
                              riskLevel === 'critical'
                                ? 'bg-danger-100 text-danger-700'
                                : 'bg-warning-100 text-warning-700'
                            )}
                          >
                            {riskLevel === 'critical' ? '严重风险' : '一般风险'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleGenerateSuggestion}>
            <Package className="w-4 h-4" />
            生成采购建议
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-danger-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">预警食材总数</p>
              <p className="text-2xl font-bold text-gray-800">{alertIngredients.length} 种</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-danger-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">严重不足</p>
              <p className="text-2xl font-bold text-danger-600">{severeCount} 种</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-warning-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">库存偏低</p>
              <p className="text-2xl font-bold text-warning-600">{alertIngredients.length - severeCount} 种</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white"
            >
              <option value="">全部分类</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          {categoryFilter && (
            <Button variant="ghost" size="sm" onClick={() => setCategoryFilter('')}>
              清除筛选
            </Button>
          )}
        </div>
        <Button onClick={handleGenerateSuggestion}>
          <Package className="w-4 h-4" />
          生成采购建议
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  食材名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  规格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  单位
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  当前库存
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  预警阈值
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  缺口数量
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  建议采购量
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedIngredients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    暂无预警食材
                  </td>
                </tr>
              ) : (
                sortedIngredients.map((item) => {
                  const severity = getAlertSeverity(item.stock, item.alertThreshold);
                  const gap = item.alertThreshold - item.stock;
                  const suggestQty = calcSuggestPurchaseQty(item.stock, item.alertThreshold);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-800">{item.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.spec}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-700">
                        {item.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {item.alertThreshold}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-danger-600">
                        {gap.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-primary-600">
                        {suggestQty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                            severity === 'severe'
                              ? 'bg-danger-100 text-danger-700'
                              : 'bg-warning-100 text-warning-700'
                          }`}
                        >
                          {severity === 'severe' ? '严重不足' : '偏低'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
