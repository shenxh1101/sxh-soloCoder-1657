import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Filter, Package } from 'lucide-react';
import { useIngredientStore } from '@/store/useIngredientStore';
import { formatMoney, calcSuggestPurchaseQty } from '@/utils/calc';
import Button from '@/components/common/Button';
import type { Ingredient } from '@/types';

type AlertSeverity = 'severe' | 'low';

function getAlertSeverity(stock: number, threshold: number): AlertSeverity {
  return stock < threshold * 0.5 ? 'severe' : 'low';
}

export default function StockAlert() {
  const navigate = useNavigate();
  const { ingredients, init, getAlertIngredients } = useIngredientStore();
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  useEffect(() => {
    init();
  }, [init]);

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
