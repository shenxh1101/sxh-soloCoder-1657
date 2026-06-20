import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, AlertTriangle, X } from 'lucide-react';
import { useDishStore } from '@/store/useDishStore';
import { useIngredientStore } from '@/store/useIngredientStore';
import { formatMoney, calcDishTheoreticalCost } from '@/utils/calc';
import { checkNegativeStock } from '@/utils/report';
import { getToday } from '@/utils/date';
import { generateId } from '@/utils/mock';
import Button from '@/components/common/Button';
import Modal from '@/components/Modal';
import type { StockCheckResult, NegativeStockItem } from '@/types';

interface SaleItemForm {
  id: string;
  dishId: string;
  dishName: string;
  quantity: number;
  unitPrice: number;
}

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    saleDate: string;
    remark: string;
    items: { dishId: string; dishName: string; quantity: number; unitPrice: number }[];
  }) => void;
}

function NegativeStockWarning({
  isOpen,
  onClose,
  stockCheck,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  stockCheck: StockCheckResult | null;
  onConfirm: () => void;
}) {
  if (!stockCheck) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="库存不足警告"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            返回修改
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            确认提交（不建议）
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-danger-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-danger-800">
                提交后将导致 {stockCheck.items.length} 种食材库存为负数
              </p>
              <p className="text-sm text-danger-700 mt-1">
                负库存会导致成本计算失真，建议先进行采购入库再提交销售记录。
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">食材名称</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">当前库存</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">需要库存</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">缺口</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">影响菜品</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stockCheck.items.map((item: NegativeStockItem, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50 bg-danger-50/30">
                  <td className="px-4 py-2 text-gray-700 font-medium">{item.ingredientName}</td>
                  <td className="px-4 py-2 text-right text-danger-600">
                    {item.currentStock}{item.unit}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700">
                    {item.requiredStock.toFixed(2)}{item.unit}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-danger-600">
                    -{item.shortfall.toFixed(2)}{item.unit}
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {item.affectedDishes.join('、')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>建议：</strong>请先采购补齐库存后再录入销售，或调整销售数量。
            如果确认提交，系统会将库存扣减至负数，成本计算可能不准确。
          </p>
        </div>
      </div>
    </Modal>
  );
}

export default function NewSaleModal({ isOpen, onClose, onSubmit }: NewSaleModalProps) {
  const { dishes } = useDishStore();
  const { ingredients } = useIngredientStore();
  const [saleDate, setSaleDate] = useState(getToday());
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<SaleItemForm[]>([]);
  const [stockWarningOpen, setStockWarningOpen] = useState(false);
  const [stockCheckResult, setStockCheckResult] = useState<StockCheckResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSaleDate(getToday());
      setRemark('');
      setItems([]);
      setStockWarningOpen(false);
      setStockCheckResult(null);
    }
  }, [isOpen]);

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const totalCost = items.reduce((sum, item) => {
    const dish = dishes.find((d) => d.id === item.dishId);
    if (dish) {
      return sum + calcDishTheoreticalCost(dish, ingredients) * item.quantity;
    }
    return sum;
  }, 0);

  const stockCheck = useMemo(() => {
    if (items.length === 0) return null;
    return checkNegativeStock(
      items.map((item) => ({ dishId: item.dishId, quantity: item.quantity })),
      dishes,
      ingredients
    );
  }, [items, dishes, ingredients]);

  const hasNegativeStock = stockCheck?.hasNegativeStock ?? false;

  const handleAddItem = () => {
    const firstDish = dishes[0];
    const newItem: SaleItemForm = {
      id: generateId('tmp'),
      dishId: firstDish?.id || '',
      dishName: firstDish?.name || '',
      quantity: 0,
      unitPrice: firstDish?.price || 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleDishChange = (id: string, dishId: string) => {
    const dish = dishes.find((d) => d.id === dishId);
    setItems(
      items.map((item) =>
        item.id === id
          ? { ...item, dishId, dishName: dish?.name || '', unitPrice: dish?.price || 0 }
          : item
      )
    );
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, quantity: isNaN(quantity) ? 0 : quantity } : item
      )
    );
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      alert('请添加销售明细');
      return;
    }
    const hasInvalidItem = items.some((item) => !item.dishId || item.quantity <= 0);
    if (hasInvalidItem) {
      alert('请完善所有销售明细');
      return;
    }

    if (hasNegativeStock) {
      setStockCheckResult(stockCheck);
      setStockWarningOpen(true);
      return;
    }

    doSubmit();
  };

  const doSubmit = () => {
    onSubmit({
      saleDate,
      remark,
      items: items.map((item) => ({
        dishId: item.dishId,
        dishName: item.dishName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
    setStockWarningOpen(false);
    setStockCheckResult(null);
  };

  const handleConfirmNegativeStock = () => {
    doSubmit();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="新增销售"
        size="xl"
        footer={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">合计：</span>
                <span className="text-xl font-bold text-primary-600">{formatMoney(totalAmount)}</span>
                <span className="text-gray-400 text-sm">
                  成本：{formatMoney(Number(totalCost.toFixed(2)))}
                </span>
              </div>
              {hasNegativeStock && (
                <div className="flex items-center gap-1 px-3 py-1 bg-danger-100 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-danger-600" />
                  <span className="text-sm text-danger-700 font-medium">
                    库存不足，提交将产生负库存
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onClose}>
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                variant={hasNegativeStock ? 'danger' : 'primary'}
              >
                {hasNegativeStock ? '强制提交' : '确认提交'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">销售日期</label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              />
            </div>
          </div>

          {hasNegativeStock && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-danger-800">
                    检测到 {stockCheck?.items.length} 种食材库存不足
                  </p>
                  <p className="text-xs text-danger-700 mt-1">
                    提交后这些食材的库存将变为负数，可能导致成本计算不准确。
                    建议先采购入库，或点击下方详情查看具体缺口。
                  </p>
                  <button
                    onClick={() => {
                      setStockCheckResult(stockCheck);
                      setStockWarningOpen(true);
                    }}
                    className="text-xs text-primary-600 hover:text-primary-700 mt-2 underline"
                  >
                    查看库存缺口详情
                  </button>
                </div>
                <button
                  onClick={() => {
                    setStockWarningOpen(false);
                    setStockCheckResult(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">销售明细</label>
              <Button variant="secondary" size="sm" onClick={handleAddItem}>
                <Plus className="w-4 h-4" />
                添加行
              </Button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">菜品名称</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-24">数量</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">单价</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">金额</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                        点击「添加行」开始录入销售明细
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const dish = dishes.find((d) => d.id === item.dishId);
                      const itemStockCheck = dish && item.quantity > 0
                        ? checkNegativeStock([{ dishId: item.dishId, quantity: item.quantity }], [dish], ingredients)
                        : null;
                      const itemHasNegative = itemStockCheck?.hasNegativeStock ?? false;

                      return (
                        <tr key={item.id} className={itemHasNegative ? 'bg-danger-50/50' : ''}>
                          <td className="px-3 py-2">
                            <select
                              value={item.dishId}
                              onChange={(e) => handleDishChange(item.id, e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                            >
                              <option value="">请选择菜品</option>
                              {dishes.map((dish) => (
                                <option key={dish.id} value={dish.id}>
                                  {dish.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.quantity || ''}
                              onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                              className={`w-full px-2 py-1.5 border rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 ${
                                itemHasNegative ? 'border-danger-400 bg-danger-50' : 'border-gray-200'
                              }`}
                              placeholder="0"
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-gray-600">
                            {formatMoney(item.unitPrice)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-gray-800">
                            {formatMoney(item.quantity * item.unitPrice)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-gray-400 hover:text-danger-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 resize-none"
              placeholder="请输入备注信息（可选）"
            />
          </div>
        </div>
      </Modal>

      <NegativeStockWarning
        isOpen={stockWarningOpen}
        onClose={() => setStockWarningOpen(false)}
        stockCheck={stockCheckResult}
        onConfirm={handleConfirmNegativeStock}
      />
    </>
  );
}
