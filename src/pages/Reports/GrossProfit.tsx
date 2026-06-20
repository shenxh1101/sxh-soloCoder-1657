import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { TrendingUp, DollarSign, TrendingDown, BarChart3, ChevronRight, AlertCircle } from 'lucide-react';
import { formatMoney, formatPercent, calcGrossProfit, calcGrossProfitRate, calcDeviationRate } from '@/utils/calc';
import { generateGrossProfitReport, generateDeviationDetail } from '@/utils/report';
import { useSaleStore } from '@/store/useSaleStore';
import { usePurchaseStore } from '@/store/usePurchaseStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useIngredientStore } from '@/store/useIngredientStore';
import { useDishStore } from '@/store/useDishStore';
import { formatDate } from '@/utils/date';
import Modal from '@/components/Modal';
import Button from '@/components/common/Button';
import type { GrossProfitReportItem, DeviationDetail } from '@/types';

type TimeDimension = 'day' | 'week' | 'month';

function SummaryCard({ title, value, icon, color, subValue }: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subValue?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
          {subValue && (
            <p className="text-sm text-gray-400 mt-1">{subValue}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function DeviationDetailModal({
  isOpen,
  onClose,
  detail,
}: {
  isOpen: boolean;
  onClose: () => void;
  detail: DeviationDetail | null;
}) {
  if (!detail) return null;

  const reasonLabels: Record<string, string> = {
    waste: '损耗',
    inventory: '盘点差异',
    bom: 'BOM用量不准',
    other: '其他',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`偏差明细 - ${formatDate(detail.date)}`} size="xl">
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">菜品维度偏差</h4>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">菜品名称</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">销售数量</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">理论成本</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">实际成本</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">偏差金额</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">偏差率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detail.dishes.map((dish, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">{dish.dishName}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{dish.soldQuantity}</td>
                    <td className="px-4 py-2 text-right text-gray-500">{formatMoney(dish.theoreticalCost)}</td>
                    <td className="px-4 py-2 text-right text-warning-600">{formatMoney(dish.actualCost)}</td>
                    <td className={`px-4 py-2 text-right font-medium ${dish.deviation > 0 ? 'text-danger-600' : dish.deviation < 0 ? 'text-success-600' : 'text-gray-500'}`}>
                      {dish.deviation > 0 ? '+' : ''}{formatMoney(dish.deviation)}
                    </td>
                    <td className={`px-4 py-2 text-right font-medium ${dish.deviationRate > 5 ? 'text-danger-600' : 'text-warning-600'}`}>
                      {dish.deviationRate > 0 ? '+' : ''}{formatPercent(dish.deviationRate)}
                    </td>
                  </tr>
                ))}
                {detail.dishes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      暂无数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">食材维度偏差</h4>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">食材名称</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">理论用量</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">实际用量</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">偏差数量</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">偏差金额</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">原因分析</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detail.ingredients.map((ing, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">{ing.ingredientName}</td>
                    <td className="px-4 py-2 text-right text-gray-500">{ing.theoreticalUsage}{ing.unit}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{ing.actualUsage}{ing.unit}</td>
                    <td className={`px-4 py-2 text-right font-medium ${ing.deviation > 0 ? 'text-danger-600' : ing.deviation < 0 ? 'text-success-600' : 'text-gray-500'}`}>
                      {ing.deviation > 0 ? '+' : ''}{ing.deviation.toFixed(2)}{ing.unit}
                    </td>
                    <td className={`px-4 py-2 text-right font-medium ${ing.deviationAmount > 0 ? 'text-danger-600' : ing.deviationAmount < 0 ? 'text-success-600' : 'text-gray-500'}`}>
                      {ing.deviationAmount > 0 ? '+' : ''}{formatMoney(ing.deviationAmount)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        ing.reason === 'waste' ? 'bg-warning-100 text-warning-700' :
                        ing.reason === 'inventory' ? 'bg-blue-100 text-blue-700' :
                        ing.reason === 'bom' ? 'bg-danger-100 text-danger-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {reasonLabels[ing.reason]}
                      </span>
                    </td>
                  </tr>
                ))}
                {detail.ingredients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      暂无数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">偏差原因说明</p>
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                <li><strong>损耗</strong>：食材正常损耗或浪费，偏差率5%-15%</li>
                <li><strong>盘点差异</strong>：盘点导致的库存调整，偏差量较小</li>
                <li><strong>BOM用量不准</strong>：菜品配方与实际用量不符，偏差率大于30%</li>
                <li><strong>其他</strong>：无法归类的其他原因</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function GrossProfit() {
  const [timeDimension, setTimeDimension] = useState<TimeDimension>('day');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<DeviationDetail | null>(null);

  const sales = useSaleStore((state) => state.sales);
  const purchases = usePurchaseStore((state) => state.purchases);
  const inventoryChecks = useInventoryStore((state) => state.checks);
  const ingredients = useIngredientStore((state) => state.ingredients);
  const dishes = useDishStore((state) => state.dishes);

  const data = useMemo<GrossProfitReportItem[]>(() => {
    return generateGrossProfitReport(
      { sales, purchases, inventoryChecks, ingredients, dishes },
      timeDimension
    );
  }, [sales, purchases, inventoryChecks, ingredients, dishes, timeDimension]);

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalTheoreticalCost = data.reduce((sum, item) => sum + item.theoreticalCost, 0);
  const totalActualCost = data.reduce((sum, item) => sum + item.actualCost, 0);
  const totalGrossProfit = calcGrossProfit(totalRevenue, totalActualCost);
  const totalGrossProfitRate = calcGrossProfitRate(totalRevenue, totalActualCost);
  const totalDeviationRate = calcDeviationRate(totalTheoreticalCost, totalActualCost);

  const handleViewDetail = (item: GrossProfitReportItem) => {
    const detail = generateDeviationDetail(
      { sales, purchases, inventoryChecks, ingredients, dishes },
      item.date
    );
    setSelectedDetail(detail);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(['day', 'week', 'month'] as TimeDimension[]).map((dim) => (
            <button
              key={dim}
              onClick={() => setTimeDimension(dim)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                timeDimension === dim
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {dim === 'day' ? '日' : dim === 'week' ? '周' : '月'}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500">
          数据根据销售记录、采购记录和盘点自动计算，实时更新
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard
          title="总收入"
          value={formatMoney(totalRevenue)}
          icon={<DollarSign className="w-5 h-5" />}
          color="bg-primary-500"
          subValue={`${data.length}个周期`}
        />
        <SummaryCard
          title="总成本"
          value={formatMoney(totalActualCost)}
          icon={<TrendingDown className="w-5 h-5" />}
          color="bg-warning-500"
          subValue={`理论 ${formatMoney(totalTheoreticalCost)}`}
        />
        <SummaryCard
          title="毛利额"
          value={formatMoney(totalGrossProfit)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-success-500"
        />
        <SummaryCard
          title="毛利率"
          value={formatPercent(totalGrossProfitRate)}
          icon={<BarChart3 className="w-5 h-5" />}
          color="bg-blue-500"
        />
        <SummaryCard
          title="成本偏差率"
          value={formatPercent(totalDeviationRate)}
          icon={<TrendingUp className="w-5 h-5" />}
          color={totalDeviationRate > 5 ? 'bg-danger-500' : 'bg-warning-500'}
          subValue={totalDeviationRate > 5 ? '偏差偏高' : '正常范围'}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">收入成本与毛利率趋势</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <defs>
                <linearGradient id="colorRevenueBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="colorCostBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: number, name: string) => {
                  if (name === '毛利率') {
                    return [formatPercent(value), name];
                  }
                  return [formatMoney(value), name];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" name="收入" fill="url(#colorRevenueBar)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="actualCost" name="成本" fill="url(#colorCostBar)" radius={[4, 4, 0, 0]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="grossProfitRate"
                name="毛利率"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">明细数据</h3>
          <p className="text-sm text-gray-500">点击行查看偏差明细</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日期
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  收入
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  理论成本
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  实际成本
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  毛利
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  毛利率
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  偏差率
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleViewDetail(item)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {item.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                    {formatMoney(item.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {formatMoney(item.theoreticalCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-warning-600">
                    {formatMoney(item.actualCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-success-600">
                    {formatMoney(item.grossProfit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-primary-600 font-medium">
                    {formatPercent(item.grossProfitRate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={`font-medium ${
                      item.deviationRate > 5 ? 'text-danger-600' : 'text-warning-600'
                    }`}>
                      {item.deviationRate > 0 ? '+' : ''}{formatPercent(item.deviationRate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700">
                      查看明细
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    暂无数据，请先录入采购、销售和盘点记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeviationDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        detail={selectedDetail}
      />
    </div>
  );
}
