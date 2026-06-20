import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Filter } from 'lucide-react';
import { useIngredientStore } from '@/store/useIngredientStore';
import type { Ingredient } from '@/types';
import Modal from '@/components/Modal';
import Button from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/utils/calc';

const CATEGORIES = ['全部', '肉类', '蔬菜', '菌菇类', '调料'];

interface FormData {
  name: string;
  spec: string;
  unit: string;
  stock: number;
  costPrice: number;
  alertThreshold: number;
  category: string;
}

const initialFormData: FormData = {
  name: '',
  spec: '',
  unit: '',
  stock: 0,
  costPrice: 0,
  alertThreshold: 0,
  category: '肉类',
};

export default function Ingredients() {
  const { ingredients, initialized, init, addIngredient, updateIngredient, deleteIngredient } = useIngredientStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    if (!initialized) {
      init();
    }
  }, [initialized, init]);

  const filteredIngredients = useMemo(() => {
    return ingredients.filter((item) => {
      const matchSearch = item.name.includes(searchTerm) || item.spec.includes(searchTerm);
      const matchCategory = categoryFilter === '全部' || item.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [ingredients, searchTerm, categoryFilter]);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData(initialFormData);
    setModalOpen(true);
  };

  const handleEdit = (item: Ingredient) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      spec: item.spec,
      unit: item.unit,
      stock: item.stock,
      costPrice: item.costPrice,
      alertThreshold: item.alertThreshold,
      category: item.category,
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个食材吗？')) {
      deleteIngredient(id);
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('请输入食材名称');
      return;
    }

    if (editingItem) {
      updateIngredient(editingItem.id, formData);
    } else {
      addIngredient(formData);
    }
    setModalOpen(false);
  };

  const isLowStock = (stock: number, threshold: number) => stock < threshold;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800">食材管理</h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索食材名称或规格..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 appearance-none bg-white cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4" />
            新增
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">食材名称</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">规格</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">单位</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">当前库存</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">成本价</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">库存金额</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">预警阈值</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">分类</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredIngredients.map((item, index) => (
                <tr
                  key={item.id}
                  className={cn(
                    'border-b border-gray-50 hover:bg-gray-50/50 transition-colors',
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  )}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.spec}</td>
                  <td className="px-4 py-3 text-gray-600">{item.unit}</td>
                  <td className={cn(
                    'px-4 py-3 text-right font-medium',
                    isLowStock(item.stock, item.alertThreshold) ? 'text-danger-600' : 'text-gray-800'
                  )}>
                    {item.stock}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatMoney(item.costPrice)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    {formatMoney(item.stock * item.costPrice)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{item.alertThreshold}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredIngredients.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? '编辑食材' : '新增食材'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingItem ? '保存' : '新增'}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">食材名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="请输入食材名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">规格</label>
            <input
              type="text"
              value={formData.spec}
              onChange={(e) => setFormData({ ...formData, spec: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="请输入规格"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">单位</label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="如：kg、袋、个"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
            >
              {CATEGORIES.filter((c) => c !== '全部').map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">当前库存</label>
            <input
              type="number"
              step="0.01"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="请输入库存数量"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">成本价</label>
            <input
              type="number"
              step="0.01"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="请输入成本价"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">预警阈值</label>
            <input
              type="number"
              step="0.01"
              value={formData.alertThreshold}
              onChange={(e) => setFormData({ ...formData, alertThreshold: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="库存低于此值时预警"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
