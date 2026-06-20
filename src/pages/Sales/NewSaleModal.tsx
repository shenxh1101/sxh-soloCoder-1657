import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useDishStore } from '@/store/useDishStore';
import { useIngredientStore } from '@/store/useIngredientStore';
import { formatMoney, calcDishTheoreticalCost } from '@/utils/calc';
import { getToday } from '@/utils/date';
import { generateId } from '@/utils/mock';
import Button from '@/components/common/Button';
import Modal from '@/components/Modal';

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

export default function NewSaleModal({ isOpen, onClose, onSubmit }: NewSaleModalProps) {
  const { dishes, init: initDishes } = useDishStore();
  const { ingredients, init: initIngredients } = useIngredientStore();
  const [saleDate, setSaleDate] = useState(getToday());
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<SaleItemForm[]>([]);

  useEffect(() => {
    initDishes();
    initIngredients();
  }, [initDishes, initIngredients]);

  useEffect(() => {
    if (isOpen) {
      setSaleDate(getToday());
      setRemark('');
      setItems([]);
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
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="新增销售"
      size="xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">合计：</span>
            <span className="text-xl font-bold text-primary-600">{formatMoney(totalAmount)}</span>
            <span className="text-gray-400 text-sm ml-2">
              成本：{formatMoney(Number(totalCost.toFixed(2)))}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleSubmit}>确认提交</Button>
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
                  items.map((item) => (
                    <tr key={item.id}>
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
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
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
                  ))
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
  );
}
