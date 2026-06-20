import { useState, useEffect } from 'react';
import { Plus, Eye, Calendar } from 'lucide-react';
import { useSaleStore } from '@/store/useSaleStore';
import { formatMoney, formatPercent, calcGrossProfit, calcGrossProfitRate } from '@/utils/calc';
import { formatDate } from '@/utils/date';
import Button from '@/components/common/Button';
import Modal from '@/components/Modal';
import NewSaleModal from './NewSaleModal';
import type { Sale } from '@/types';

export default function Sales() {
  const { sales, init: initSales, createSale } = useSaleStore();
  const [dateFilter, setDateFilter] = useState('');
  const [detailModal, setDetailModal] = useState(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [newSaleModal, setNewSaleModal] = useState(false);

  useEffect(() => {
    initSales();
  }, [initSales]);

  const filteredSales = dateFilter
    ? sales.filter((s) => s.saleDate === dateFilter)
    : sales;

  const handleViewDetail = (sale: Sale) => {
    setCurrentSale(sale);
    setDetailModal(true);
  };

  const handleNewSaleSubmit = (data: {
    saleDate: string;
    remark: string;
    items: { dishId: string; dishName: string; quantity: number; unitPrice: number }[];
  }) => {
    createSale(data);
    setNewSaleModal(false);
  };

  const grossProfit = (sale: Sale) => calcGrossProfit(sale.totalAmount, sale.totalCost);
  const grossProfitRate = (sale: Sale) => calcGrossProfitRate(sale.totalAmount, sale.totalCost);

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
        <Button onClick={() => setNewSaleModal(true)}>
          <Plus className="w-4 h-4" />
          新增销售
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                销售日期
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                销售金额
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                食材成本
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                毛利
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                毛利率
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  暂无销售记录
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(sale.saleDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-primary-600">
                    {formatMoney(sale.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                    {formatMoney(sale.totalCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-success-600">
                    {formatMoney(grossProfit(sale))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                    {formatPercent(grossProfitRate(sale))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button
                      onClick={() => handleViewDetail(sale)}
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
        title="销售详情"
        size="lg"
      >
        {currentSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">销售日期：</span>
                <span className="text-gray-800">{formatDate(currentSale.saleDate)}</span>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">菜品名称</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">数量</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">单价</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">金额</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">成本</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentSale.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-gray-700">{item.dishName}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{formatMoney(item.unitPrice)}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-800">{formatMoney(item.amount)}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{formatMoney(item.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <div className="space-y-1 text-right">
                <div>
                  <span className="text-gray-500 text-sm">销售总额：</span>
                  <span className="text-lg font-bold text-primary-600 ml-2">
                    {formatMoney(currentSale.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">成本总额：</span>
                  <span className="text-gray-700 ml-2">{formatMoney(currentSale.totalCost)}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">毛利：</span>
                  <span className="text-success-600 font-medium ml-2">
                    {formatMoney(grossProfit(currentSale))}
                  </span>
                  <span className="text-gray-400 text-xs ml-1">
                    ({formatPercent(grossProfitRate(currentSale))})
                  </span>
                </div>
              </div>
            </div>

            {currentSale.remark && (
              <div className="text-sm">
                <span className="text-gray-500">备注：</span>
                <span className="text-gray-700">{currentSale.remark}</span>
              </div>
            )}
          </div>
        )}
      </Modal>

      <NewSaleModal
        isOpen={newSaleModal}
        onClose={() => setNewSaleModal(false)}
        onSubmit={handleNewSaleSubmit}
      />
    </div>
  );
}
