import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChefHat, Layers, DollarSign, Settings } from 'lucide-react';
import { useDishStore } from '@/store/useDishStore';
import { useIngredientStore } from '@/store/useIngredientStore';
import Modal from '@/components/Modal';
import Button from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/utils/calc';
import type { Dish, DishBomItem } from '@/types';

export default function DishesPage() {
  const { dishes, init: initDishes, addDish, updateDish, deleteDish, updateBom, getCategories } = useDishStore();
  const { ingredients, init: initIngredients } = useIngredientStore();
  const [activeCategory, setActiveCategory] = useState('全部');
  const [dishModalOpen, setDishModalOpen] = useState(false);
  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [bomDish, setBomDish] = useState<Dish | null>(null);
  const [formData, setFormData] = useState({ name: '', category: '', price: '' });
  const [bomItems, setBomItems] = useState<Omit<DishBomItem, 'id'>[]>([]);

  useEffect(() => {
    initDishes();
    initIngredients();
  }, [initDishes, initIngredients]);

  const categories = ['全部', ...getCategories()];
  const filteredDishes = activeCategory === '全部' 
    ? dishes 
    : dishes.filter(d => d.category === activeCategory);

  const openAddModal = () => {
    setEditingDish(null);
    setFormData({ name: '', category: '', price: '' });
    setDishModalOpen(true);
  };

  const openEditModal = (dish: Dish) => {
    setEditingDish(dish);
    setFormData({ name: dish.name, category: dish.category, price: String(dish.price) });
    setDishModalOpen(true);
  };

  const handleSaveDish = () => {
    if (!formData.name || !formData.category || !formData.price) return;
    const price = parseFloat(formData.price);
    if (editingDish) {
      updateDish(editingDish.id, { name: formData.name, category: formData.category, price });
    } else {
      addDish({ name: formData.name, category: formData.category, price, bomItems: [] });
    }
    setDishModalOpen(false);
  };

  const openBomModal = (dish: Dish) => {
    setBomDish(dish);
    setBomItems(dish.bomItems.map(item => ({
      ingredientId: item.ingredientId,
      ingredientName: item.ingredientName,
      dosage: item.dosage,
      unit: item.unit,
    })));
    setBomModalOpen(true);
  };

  const addBomRow = () => {
    if (ingredients.length === 0) return;
    const firstIng = ingredients[0];
    setBomItems([...bomItems, {
      ingredientId: firstIng.id,
      ingredientName: firstIng.name,
      dosage: 0,
      unit: firstIng.unit,
    }]);
  };

  const removeBomRow = (index: number) => {
    setBomItems(bomItems.filter((_, i) => i !== index));
  };

  const updateBomRow = (index: number, field: string, value: string | number) => {
    const newItems = [...bomItems];
    if (field === 'ingredientId') {
      const ing = ingredients.find(i => i.id === value);
      if (ing) {
        newItems[index] = {
          ...newItems[index],
          ingredientId: ing.id,
          ingredientName: ing.name,
          unit: ing.unit,
        };
      }
    } else {
      (newItems[index] as any)[field] = value;
    }
    setBomItems(newItems);
  };

  const handleSaveBom = () => {
    if (!bomDish) return;
    const validItems = bomItems.filter(item => item.ingredientId && item.dosage > 0);
    updateBom(bomDish.id, validItems);
    setBomModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">菜品管理</h2>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4" />
          新增菜品
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-all text-sm',
              activeCategory === cat
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDishes.map(dish => (
          <div
            key={dish.id}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 border border-gray-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEditModal(dish)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteDish(dish.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-gray-800 text-lg mb-1">{dish.name}</h3>
            <span className="inline-block px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-md mb-3">
              {dish.category}
            </span>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-gray-500">
                <Layers className="w-4 h-4" />
                <span>{dish.bomItems.length} 种食材</span>
              </div>
              <div className="flex items-center gap-0.5 text-primary-600 font-semibold">
                <span className="text-xs">¥</span>
                <span>{formatMoney(dish.price).replace('¥', '')}</span>
              </div>
            </div>
            <button
              onClick={() => openBomModal(dish)}
              className="w-full mt-4 py-2 rounded-lg bg-gray-50 hover:bg-primary-50 text-gray-600 hover:text-primary-600 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Settings className="w-4 h-4" />
              配置BOM
            </button>
          </div>
        ))}
        {filteredDishes.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">
            暂无菜品
          </div>
        )}
      </div>

      <Modal
        isOpen={dishModalOpen}
        onClose={() => setDishModalOpen(false)}
        title={editingDish ? '编辑菜品' : '新增菜品'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDishModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveDish}>保存</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">菜品名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="请输入菜品名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">菜品分类</label>
            <input
              type="text"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="如：招牌菜、肉类、素菜"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">售价（元）</label>
            <input
              type="number"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="请输入售价"
              step="0.01"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={bomModalOpen}
        onClose={() => setBomModalOpen(false)}
        title={`BOM配置 - ${bomDish?.name || ''}`}
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setBomModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveBom}>保存</Button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">食材</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">用量</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">单位</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-gray-500 w-16">操作</th>
              </tr>
            </thead>
            <tbody>
              {bomItems.map((item, index) => (
                <tr key={index} className="border-b border-gray-50">
                  <td className="py-2 px-2">
                    <select
                      value={item.ingredientId}
                      onChange={e => updateBomRow(index, 'ingredientId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm"
                    >
                      {ingredients.map(ing => (
                        <option key={ing.id} value={ing.id}>{ing.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      value={item.dosage}
                      onChange={e => updateBomRow(index, 'dosage', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm"
                      step="0.01"
                    />
                  </td>
                  <td className="py-2 px-2 text-sm text-gray-600">{item.unit}</td>
                  <td className="py-2 px-2 text-right">
                    <button
                      onClick={() => removeBomRow(index)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={addBomRow}
          className="mt-4 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          添加食材
        </button>
      </Modal>
    </div>
  );
}
