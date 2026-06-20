import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { useSupplierStore } from '@/store/useSupplierStore';
import type { Supplier } from '@/types';
import Modal from '@/components/Modal';
import Button from '@/components/common/Button';
import { cn } from '@/lib/utils';

interface FormData {
  name: string;
  contact: string;
  phone: string;
  address: string;
  supplyCategories: string;
}

const initialFormData: FormData = {
  name: '',
  contact: '',
  phone: '',
  address: '',
  supplyCategories: '',
};

export default function Suppliers() {
  const { suppliers, initialized, init, addSupplier, updateSupplier, deleteSupplier } = useSupplierStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    if (!initialized) {
      init();
    }
  }, [initialized, init]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((item) => {
      return (
        item.name.includes(searchTerm) ||
        item.contact.includes(searchTerm) ||
        item.phone.includes(searchTerm) ||
        item.supplyCategories.includes(searchTerm)
      );
    });
  }, [suppliers, searchTerm]);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData(initialFormData);
    setModalOpen(true);
  };

  const handleEdit = (item: Supplier) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      contact: item.contact,
      phone: item.phone,
      address: item.address,
      supplyCategories: item.supplyCategories,
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个供应商吗？')) {
      deleteSupplier(id);
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('请输入供应商名称');
      return;
    }

    if (editingItem) {
      updateSupplier(editingItem.id, formData);
    } else {
      addSupplier(formData);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800">供应商管理</h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索供应商名称、联系人、电话..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
            />
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">供应商名称</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">联系人</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">联系电话</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">地址</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">供应品类</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((item, index) => (
                <tr
                  key={item.id}
                  className={cn(
                    'border-b border-gray-50 hover:bg-gray-50/50 transition-colors',
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  )}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.contact}</td>
                  <td className="px-4 py-3 text-gray-600">{item.phone}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={item.address}>
                    {item.address}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                      {item.supplyCategories}
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
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
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
        title={editingItem ? '编辑供应商' : '新增供应商'}
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
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">供应商名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="请输入供应商名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="请输入联系人姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="请输入联系电话"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="请输入地址"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">供应品类</label>
            <input
              type="text"
              value={formData.supplyCategories}
              onChange={(e) => setFormData({ ...formData, supplyCategories: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="如：肉类、蔬菜、调料"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
