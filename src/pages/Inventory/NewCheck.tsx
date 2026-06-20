import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown, PlusCircle, Equal, CheckCircle } from 'lucide-react';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useIngredientStore } from '@/store/useIngredientStore';
import Button from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/utils/calc';
import { getToday } from '@/utils/date';
import type { Ingredient } from '@/types';

interface CheckItem {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  systemStock: number;
  actualStock: number;
  costPrice: number;
}

export default function NewCheckPage() {
  const navigate = useNavigate();
  const { createCheck } = useInventoryStore();
  const { ingredients, init: initIngredients } = useIngredientStore();
  const [checkDate, setCheckDate] = useState(getToday());
  const [items, setItems] = useState<CheckItem[]>([]);
  const [ingredientSelectorOpen, setIngredientSelectorOpen] = useState(false);

  useEffect(() => {
    initIngredients();
  }, [initIngredients]);

  const availableIngredients = useMemo(() => {
    const selectedIds = new Set(items.map(item => item.ingredientId));
    return ingredients.filter(ing => !selectedIds.has(ing.id));
  }, [ingredients, items]);

  const calculatedItems = useMemo(() => {
    return items.map(item => {
      const diffQty = Number((item.actualStock - item.systemStock).toFixed(2));
      const diffAmount = Number((diffQty * item.costPrice).toFixed(2));
      let diffType: 'profit' | 'loss' | 'equal' = 'equal';
      if (diffQty > 0) diffType = 'profit';
      else if (diffQty < 0) diffType = 'loss';
      return {
        ...item,
        diffQuantity: diffQty,
        diffAmount,
        diffType,
      };
    });
  }, [items]);

  const summary = useMemo(() => {
    let profit = 0;
    let loss = 0;
    calculatedItems.forEach(item => {
      if (item.diffType === 'profit') profit += item.diffAmount;
      else if (item.diffType === 'loss') loss += Math.abs(item.diffAmount);
    });
    return {
      profitAmount: Number(profit.toFixed(2)),
      lossAmount: Number(loss.toFixed(2)),
    };
  }, [calculatedItems]);

  const addIngredient = (ingredient: Ingredient) => {
    setItems([...items, {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      unit: ingredient.unit,
      systemStock: ingredient.stock,
      actualStock: ingredient.stock,
      costPrice: ingredient.costPrice,
    }]);
    setIngredientSelectorOpen(false);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateActualStock = (index: number, value: number) => {
    const newItems = [...items];
    newItems[index].actualStock = value;
    setItems(newItems);
  };

  const handleComplete = () => {
    if (items.length === 0) return;
    
    const checkItems = items.map(item => ({
      ingredientId: item.ingredientId,
      ingredientName: item.ingredientName,
      actualStock: item.actualStock,
      unit: item.unit,
      systemStock: item.systemStock,
    }));

    createCheck({
      checkDate,
      remark: '',
      items: checkItems,
    });

    const state = useInventoryStore.getState();
    const newCheck = state.checks[0];
    
    if (newCheck) {
      const actualStocks = items.map(item => ({
        ingredientId: item.ingredientId,
        actualStock: item.actualStock,
      }));
      state.completeCheck(newCheck.id, actualStocks);
    }

    navigate('/inventory');
  };

  const DiffIcon = ({ type }: { type: 'profit' | 'loss' | 'equal' }) => {
    if (type === 'profit') return <TrendingUp className="w-4 h-4 text-success-600" />;
    if (type === 'loss') return <TrendingDown className="w-4 h-4 text-danger-600" />;
    return <Equal className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/inventory')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">返回盘点列表</span>
        </button>
        <h2 className="text-xl font-semibold text-gray-800">新建盘点</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">盘点日期：</label>
            <input
              type="date"
              value={checkDate}
              onChange={e => setCheckDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">盘点明细</h3>
          <div className="relative">
            <Button onClick={() => setIngredientSelectorOpen(!ingredientSelectorOpen)} size="sm">
              <Plus className="w-4 h-4" />
              添加食材
            </Button>
            {ingredientSelectorOpen && availableIngredients.length > 0 && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                {availableIngredients.map(ing => (
                  <button
                    key={ing.id}
                    onClick={() => addIngredient(ing)}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm text-gray-700 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="font-medium">{ing.name}</div>
                    <div className="text-xs text-gray-400">库存: {ing.stock} {ing.unit}</div>
                  </button>
                ))}
              </div>
            )}
            {ingredientSelectorOpen && availableIngredients.length === 0 && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4 text-center text-gray-400 text-sm">
                所有食材已添加
              </div>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <PlusCircle className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 mb-4">暂无盘点食材</p>
            <Button onClick={() => setIngredientSelectorOpen(true)} size="sm">
              <Plus className="w-4 h-4" />
              添加食材
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-600">食材名称</th>
                <th className="text-right py-3 px-6 font-medium text-gray-600">系统库存</th>
                <th className="text-right py-3 px-6 font-medium text-gray-600">实盘数量</th>
                <th className="text-right py-3 px-6 font-medium text-gray-600">差异数量</th>
                <th className="text-right py-3 px-6 font-medium text-gray-600">差异金额</th>
                <th className="text-center py-3 px-6 font-medium text-gray-600">差异类型</th>
                <th className="text-center py-3 px-6 font-medium text-gray-600 w-16">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {calculatedItems.map((item, index) => (
                <tr key={item.ingredientId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-6">
                    <span className="font-medium text-gray-800">{item.ingredientName}</span>
                  </td>
                  <td className="py-3 px-6 text-right text-gray-600">
                    {item.systemStock} {item.unit}
                  </td>
                  <td className="py-3 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <input
                        type="number"
                        value={item.actualStock}
                        onChange={e => updateActualStock(index, parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                        step="0.01"
                      />
                      <span className="text-gray-500 text-sm">{item.unit}</span>
                    </div>
                  </td>
                  <td className={cn(
                    'py-3 px-6 text-right font-semibold',
                    item.diffType === 'profit' && 'text-success-600',
                    item.diffType === 'loss' && 'text-danger-600',
                    item.diffType === 'equal' && 'text-gray-400'
                  )}>
                    <div className="flex items-center justify-end gap-1">
                      <DiffIcon type={item.diffType} />
                      <span>{item.diffQuantity > 0 ? '+' : ''}{item.diffQuantity}</span>
                    </div>
                  </td>
                  <td className={cn(
                    'py-3 px-6 text-right font-semibold',
                    item.diffType === 'profit' && 'text-success-600',
                    item.diffType === 'loss' && 'text-danger-600',
                    item.diffType === 'equal' && 'text-gray-400'
                  )}>
                    {item.diffAmount > 0 ? '+' : ''}{formatMoney(item.diffAmount)}
                  </td>
                  <td className="py-3 px-6 text-center">
                    {item.diffType === 'profit' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-success-50 text-success-700 text-xs rounded-full font-medium">
                        <TrendingUp className="w-3 h-3" />
                        盘盈
                      </span>
                    )}
                    {item.diffType === 'loss' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-danger-50 text-danger-700 text-xs rounded-full font-medium">
                        <TrendingDown className="w-3 h-3" />
                        盘亏
                      </span>
                    )}
                    {item.diffType === 'equal' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                        <Equal className="w-3 h-3" />
                        无差异
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={() => removeItem(index)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">盘盈总金额</p>
                <p className="text-xl font-bold text-success-600">{formatMoney(summary.profitAmount)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-danger-50 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-danger-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">盘亏总金额</p>
                <p className="text-xl font-bold text-danger-600">{formatMoney(summary.lossAmount)}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/inventory')}>
              取消
            </Button>
            <Button onClick={handleComplete} disabled={items.length === 0}>
              <CheckCircle className="w-4 h-4" />
              完成盘点
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
