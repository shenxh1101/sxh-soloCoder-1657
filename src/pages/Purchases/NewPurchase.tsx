import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { usePurchaseStore } from '@/store/usePurchaseStore';
import { useSupplierStore } from '@/store/useSupplierStore';
import { useIngredientStore } from '@/store/useIngredientStore';
import { formatMoney } from '@/utils/calc';
import { getToday } from '@/utils/date';
import { generateId } from '@/utils/mock';
import Button from '@/components/common/Button';

interface PurchaseItemForm {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unitPrice: number;
}

export default function NewPurchase() {
  const navigate = useNavigate();
  const { createPurchase } = usePurchaseStore();
  const { suppliers, init: initSuppliers } = useSupplierStore();
  const { ingredients, init: initIngredients } = useIngredientStore();

  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(getToday());
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<PurchaseItemForm[]>([]);

  useEffect(() => {
    initSuppliers();
    initIngredients();
  }, [initSuppliers, initIngredients]);

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleAddItem = () => {
    const firstIngredient = ingredients[0];
    const newItem: PurchaseItemForm = {
      id: generateId('tmp'),
      ingredientId: firstIngredient?.id || '',
      ingredientName: firstIngredient?.name || '',
      quantity: 0,
      unitPrice: firstIngredient?.costPrice || 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleIngredientChange = (id: string, ingredientId: string) => {
    const ingredient = ingredients.find((i) => i.id === ingredientId);
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              ingredientId,
              ingredientName: ingredient?.name || '',
              unitPrice: ingredient?.costPrice || 0,
            }
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

  const handleUnitPriceChange = (id: string, unitPrice: number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, unitPrice: isNaN(unitPrice) ? 0 : unitPrice } : item
      )
    );
  };

  const handleSubmit = () => {
    if (!supplierId) {
      alert('请选择供应商');
      return;
    }
    if (items.length === 0) {
      alert('请添加采购明细');
      return;
    }
    const hasInvalidItem = items.some(
      (item) => !item.ingredientId || item.quantity <= 0 || item.unitPrice <= 0
    );
    if (hasInvalidItem) {
      alert('请完善所有采购明细');
      return;
    }

    const supplier = suppliers.find((s) => s.id === supplierId);

    createPurchase({
      supplierId,
      supplierName: supplier?.name || '',
      purchaseDate,
      remark,
      items: items.map((item) => ({
        ingredientId: item.ingredientId,
        ingredientName: item.ingredientName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });

    navigate('/purchases');
  };

  const handleBack = () => {
    navigate('/purchases');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold text-gray-800">采购入库</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">采购日期</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">供应商</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
            >
              <option value="">请选择供应商</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-medium text-gray-800">采购明细</h3>
          <Button variant="secondary" size="sm" onClick={handleAddItem}>
            <Plus className="w-4 h-4" />
            添加行
          </Button>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                食材名称
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                采购数量
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                单价（元）
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                金额（元）
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  暂无采购明细，点击「添加行」开始录入
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <select
                      value={item.ingredientId}
                      onChange={(e) => handleIngredientChange(item.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                    >
                      <option value="">请选择食材</option>
                      {ingredients.map((ingredient) => (
                        <option key={ingredient.id} value={ingredient.id}>
                          {ingredient.name} ({ingredient.spec})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity || ''}
                      onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice || ''}
                      onChange={(e) => handleUnitPriceChange(item.id, Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-medium text-gray-800">
                    {formatMoney(item.quantity * item.unitPrice)}
                  </td>
                  <td className="px-6 py-3 text-center">
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

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">合计金额：</span>
            <span className="text-2xl font-bold text-primary-600">{formatMoney(totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={handleBack}>
          取消
        </Button>
        <Button onClick={handleSubmit}>提交采购单</Button>
      </div>
    </div>
  );
}
