import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Calendar, Search } from 'lucide-react';
import { usePurchaseStore } from '@/store/usePurchaseStore';
import { formatMoney } from '@/utils/calc';
import { formatDate, getToday } from '@/utils/date';
import Button from '@/components/common/Button';
import Modal from '@/components/Modal';
import type { Purchase } from '@/types';

export default function Purchases() {
  const navigate = useNavigate();
  const { purchases, init } = usePurchaseStore();
  const [dateFilter, setDateFilter] = useState('');
  const [detailModal, setDetailModal] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState<Purchase | null>(null);

  useEffect(() => {
    init();
  }, [init]);

  const filteredPurchases = dateFilter
    ? purchases.filter((p) => p.purchaseDate === dateFilter)
    : purchases;

  const handleViewDetail = (purchase: Purchase) => {
    setCurrentPurchase(purchase);
    setDetailModal(true);
  };

  const handleNewPurchase = () => {
    navigate('/purchases/new');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
            />
          </div>
          {dateFilter && (
            <Button variant="ghost" size="sm" onClick={() => setDateFilter('')}>
              清除筛选
            </Button>
          )}
        </div>
        <Button onClick={handleNewPurchase}>
          <Plus className="w-4 h-4" />
          新增采购
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                采购日期
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                供应商
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                采购金额
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                食材种类数
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPurchases.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  暂无采购记录
                </td>
              </tr>
            ) : (
              filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(purchase.purchaseDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {purchase.supplierName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-primary-600">
                    {formatMoney(purchase.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                    {purchase.items.length} 种
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button
                      onClick={() => handleViewDetail(purchase)}
                      className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      查看详情
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={detailModal}
        onClose={() => setDetailModal(false)}
        title="采购详情"
        size="lg"
      >
        {currentPurchase && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">采购日期：</span>
                <span className="text-gray-800">{formatDate(currentPurchase.purchaseDate)}</span>
              </div>
              <div>
                <span className="text-gray-500">供应商：</span>
                <span className="text-gray-800">{currentPurchase.supplierName}</span>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">食材名称</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">数量</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">单价</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">金额</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentPurchase.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-gray-700">{item.ingredientName}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{formatMoney(item.unitPrice)}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-800">{formatMoney(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <div className="text-right">
                <span className="text-gray-500 text-sm">合计金额：</span>
                <span className="text-lg font-bold text-primary-600 ml-2">
                  {formatMoney(currentPurchase.totalAmount)}
                </span>
              </div>
            </div>

            {currentPurchase.remark && (
              <div className="text-sm">
                <span className="text-gray-500">备注：</span>
                <span className="text-gray-700">{currentPurchase.remark}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
