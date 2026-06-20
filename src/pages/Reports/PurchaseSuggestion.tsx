import { useState, useEffect, useMemo } from 'react';
import { Download, Package, Plus, Minus, FileText } from 'lucide-react';
import { useIngredientStore } from '@/store/useIngredientStore';
import { formatMoney, calcSuggestPurchaseQty } from '@/utils/calc';
import Button from '@/components/common/Button';
import Modal from '@/components/Modal';
import type { PurchaseSuggestionItem } from '@/types';

export default function PurchaseSuggestion() {
  const { ingredients, init, getAlertIngredients } = useIngredientStore();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [exportModal, setExportModal] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  const suggestions = useMemo((): PurchaseSuggestionItem[] => {
    const alertItems = getAlertIngredients();
    return alertItems.map((item) => {
      const suggestQty = calcSuggestPurchaseQty(item.stock, item.alertThreshold);
      const qty = quantities[item.id] ?? suggestQty;
      return {
        ingredientId: item.id,
        ingredientName: item.name,
        spec: item.spec,
        unit: item.unit,
        currentStock: item.stock,
        alertThreshold: item.alertThreshold,
        suggestQuantity: qty,
        estimatedCost: Number((qty * item.costPrice).toFixed(2)),
      };
    });
  }, [ingredients, quantities]);

  const totalAmount = useMemo(() => {
    return suggestions.reduce((sum, item) => sum + item.estimatedCost, 0);
  }, [suggestions]);

  const handleQuantityChange = (ingredientId: string, value: number) => {
    setQuantities((prev) => ({
      ...prev,
      [ingredientId]: Math.max(0, Number(value.toFixed(2))),
    }));
  };

  const handleAdjustQty = (ingredientId: string, delta: number) => {
    const current = suggestions.find((s) => s.ingredientId === ingredientId);
    if (current) {
      handleQuantityChange(ingredientId, current.suggestQuantity + delta);
    }
  };

  const handleExport = () => {
    setExportModal(true);
  };

  const handleConfirmExport = () => {
    setExportModal(false);
    alert('采购单已导出（模拟）');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">采购建议清单</h2>
          <p className="text-sm text-gray-500 mt-1">
            根据库存预警自动生成，共 {suggestions.length} 种食材需采购
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="w-4 h-4" />
          导出采购单
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
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  建议采购量
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  预估金额
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suggestions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    暂无采购建议，库存充足
                  </td>
                </tr>
              ) : (
                suggestions.map((item) => (
                  <tr key={item.ingredientId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-800">
                        {item.ingredientName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.spec}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                      {item.currentStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {item.alertThreshold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleAdjustQty(item.ingredientId, -1)}
                          className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          value={item.suggestQuantity}
                          onChange={(e) =>
                            handleQuantityChange(item.ingredientId, parseFloat(e.target.value) || 0)
                          }
                          className="w-20 px-2 py-1.5 text-center text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                        />
                        <button
                          onClick={() => handleAdjustQty(item.ingredientId, 1)}
                          className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-primary-600">
                      {formatMoney(item.estimatedCost)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {suggestions.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              共 <span className="font-medium text-gray-700">{suggestions.length}</span> 种食材
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">预估总金额：</span>
              <span className="text-2xl font-bold text-primary-600">
                {formatMoney(totalAmount)}
              </span>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={exportModal}
        onClose={() => setExportModal(false)}
        title="导出采购单"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            确认导出以下采购清单吗？
          </p>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">食材种类</span>
              <span className="font-medium text-gray-700">{suggestions.length} 种</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">预估总金额</span>
              <span className="font-bold text-primary-600">{formatMoney(totalAmount)}</span>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setExportModal(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmExport}>
              <FileText className="w-4 h-4" />
              确认导出
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
