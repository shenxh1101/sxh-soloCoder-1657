import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Calendar, TrendingUp, TrendingDown, CheckCircle, Clock } from 'lucide-react';
import { useInventoryStore } from '@/store/useInventoryStore';
import Modal from '@/components/Modal';
import Button from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/utils/calc';
import type { InventoryCheck } from '@/types';

export default function InventoryPage() {
  const navigate = useNavigate();
  const { checks, init: initInventory } = useInventoryStore();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<InventoryCheck | null>(null);

  useEffect(() => {
    initInventory();
  }, [initInventory]);

  const openDetail = (check: InventoryCheck) => {
    setSelectedCheck(check);
    setDetailModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-success-50 text-success-700 text-xs rounded-full font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          已完成
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-warning-50 text-warning-700 text-xs rounded-full font-medium">
        <Clock className="w-3.5 h-3.5" />
        草稿
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">盘点单列表</h2>
        <Button onClick={() => navigate('/inventory/new')}>
          <Plus className="w-4 h-4" />
          新建盘点
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">盘点日期</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">盘盈金额</th>
              <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">盘亏金额</th>
              <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {checks.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  暂无盘点单
                </td>
              </tr>
            ) : (
              checks.map(check => (
                <tr key={check.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-gray-800">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{check.checkDate}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">{getStatusBadge(check.status)}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1 text-success-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-semibold">{formatMoney(check.profitAmount)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1 text-danger-600">
                      <TrendingDown className="w-4 h-4" />
                      <span className="font-semibold">{formatMoney(check.lossAmount)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => openDetail(check)}
                      className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      详情
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="盘点详情"
        size="xl"
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
              关闭
            </Button>
          </div>
        }
      >
        {selectedCheck && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500">盘点日期</p>
                <p className="text-lg font-semibold text-gray-800">{selectedCheck.checkDate}</p>
              </div>
              {getStatusBadge(selectedCheck.status)}
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 px-4 text-xs font-medium text-gray-500">食材名称</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-gray-500">系统库存</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-gray-500">实盘数量</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-gray-500">差异数量</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-gray-500">差异金额</th>
                    <th className="text-center py-2 px-4 text-xs font-medium text-gray-500">差异类型</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedCheck.items.map(item => (
                    <tr key={item.id}>
                      <td className="py-2 px-4 text-gray-800 font-medium">{item.ingredientName}</td>
                      <td className="py-2 px-4 text-right text-gray-600">
                        {item.systemStock} {item.unit}
                      </td>
                      <td className="py-2 px-4 text-right text-gray-600">
                        {item.actualStock} {item.unit}
                      </td>
                      <td className={cn(
                        'py-2 px-4 text-right font-medium',
                        item.diffType === 'profit' && 'text-success-600',
                        item.diffType === 'loss' && 'text-danger-600',
                        item.diffType === 'equal' && 'text-gray-400'
                      )}>
                        {item.diffQuantity > 0 ? '+' : ''}{item.diffQuantity} {item.unit}
                      </td>
                      <td className={cn(
                        'py-2 px-4 text-right font-medium',
                        item.diffType === 'profit' && 'text-success-600',
                        item.diffType === 'loss' && 'text-danger-600',
                        item.diffType === 'equal' && 'text-gray-400'
                      )}>
                        {item.diffAmount > 0 ? '+' : ''}{formatMoney(item.diffAmount)}
                      </td>
                      <td className="py-2 px-4 text-center">
                        {item.diffType === 'profit' && (
                          <span className="inline-block px-2 py-0.5 bg-success-50 text-success-700 text-xs rounded-md">盘盈</span>
                        )}
                        {item.diffType === 'loss' && (
                          <span className="inline-block px-2 py-0.5 bg-danger-50 text-danger-700 text-xs rounded-md">盘亏</span>
                        )}
                        {item.diffType === 'equal' && (
                          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">无差异</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success-600" />
                  <span className="text-gray-600 text-sm">盘盈总金额：</span>
                  <span className="text-lg font-bold text-success-600">{formatMoney(selectedCheck.profitAmount)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-danger-600" />
                  <span className="text-gray-600 text-sm">盘亏总金额：</span>
                  <span className="text-lg font-bold text-danger-600">{formatMoney(selectedCheck.lossAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
