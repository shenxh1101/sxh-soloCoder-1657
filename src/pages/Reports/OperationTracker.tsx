import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { TrendingUp, DollarSign, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight, Flame, AlertTriangle } from 'lucide-react';
import { formatMoney, formatPercent } from '@/utils/calc';
import { generateOperationTrackerData } from '@/utils/report';
import { useSaleStore } from '@/store/useSaleStore';
import { usePurchaseStore } from '@/store/usePurchaseStore';
import { useIngredientStore } from '@/store/useIngredientStore';
import { useDishStore } from '@/store/useDishStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import type { OperationTrackerData } from '@/types';

type Dimension = 'ingredient' | 'dish';
type DaysOption = 7 | 30 | 90;

const DAYS_OPTIONS: { label: string; value: DaysOption }[] = [
  { label: '近7天', value: 7 },
  { label: '近30天', value: 30 },
  { label: '近90天', value: 90 },
];

const LINE_COLORS = ['#0d9488', '#f97316', '#6366f1', '#ec4899', '#8b5cf6'];

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

export default function OperationTracker() {
  const [dimension, setDimension] = useState<Dimension>('ingredient');
  const [days, setDays] = useState<DaysOption>(30);

  const sales = useSaleStore((state) => state.sales);
  const purchases = usePurchaseStore((state) => state.purchases);
  const inventoryChecks = useInventoryStore((state) => state.checks);
  const ingredients = useIngredientStore((state) => state.ingredients);
  const dishes = useDishStore((state) => state.dishes);

  const trackerData = useMemo<OperationTrackerData>(() => {
    return generateOperationTrackerData(
      { sales, purchases, inventoryChecks, ingredients, dishes },
      dimension,
      days
    );
  }, [sales, purchases, inventoryChecks, ingredients, dishes, dimension, days]);

  const summary = useMemo(() => {
    const totalRevenue = trackerData.topByGrossProfit.reduce((sum, item) => sum + item.revenue, 0);
    const totalCost = trackerData.topByGrossProfit.reduce((sum, item) => sum + item.cost, 0);
    const topGPItem = trackerData.topByGrossProfit[0];
    const fastestRise = trackerData.priceChanges.sort((a, b) => b.changeRate - a.changeRate)[0];

    return {
      totalRevenue,
      totalCost,
      topGPName: topGPItem?.name || '-',
      topGPValue: topGPItem ? formatMoney(topGPItem.grossProfit) : '-',
      fastestRiseName: fastestRise?.name || '-',
      fastestRiseRate: fastestRise ? formatPercent(fastestRise.changeRate) : '-',
    };
  }, [trackerData]);

  const priceTrendChartData = useMemo(() => {
    return trackerData.labels.map((label, idx) => {
      const row: Record<string, string | number> = { date: label };
      trackerData.priceTrend.slice(0, 3).forEach((item) => {
        row[item.name] = item.data[idx];
      });
      return row;
    });
  }, [trackerData]);

  const top3Names = useMemo(() => {
    return trackerData.priceTrend.slice(0, 3).map((item) => item.name);
  }, [trackerData]);

  const consumptionChartData = useMemo(() => {
    return trackerData.topByConsumption.slice(0, 10).map((item) => ({
      name: item.name,
      金额: item.amount,
      消耗量: item.consumption,
    }));
  }, [trackerData]);

  const maxConsumption = useMemo(() => {
    return Math.max(...trackerData.topByConsumption.slice(0, 10).map((i) => i.consumption), 1);
  }, [trackerData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          {(['ingredient', 'dish'] as Dimension[]).map((dim) => (
            <button
              key={dim}
              onClick={() => setDimension(dim)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                dimension === dim
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {dim === 'ingredient' ? '食材维度' : '菜品维度'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {DAYS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                days === opt.value
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="周期内总销售额"
          value={formatMoney(summary.totalRevenue)}
          icon={<DollarSign className="w-5 h-5" />}
          color="bg-primary-500"
          subValue={`${days}天累计`}
        />
        <SummaryCard
          title="周期内总成本"
          value={formatMoney(summary.totalCost)}
          icon={<TrendingDown className="w-5 h-5" />}
          color="bg-warning-500"
        />
        <SummaryCard
          title={dimension === 'ingredient' ? '毛利贡献最高食材' : '毛利贡献最高菜品'}
          value={summary.topGPName}
          icon={<Flame className="w-5 h-5" />}
          color="bg-success-500"
          subValue={`毛利 ${summary.topGPValue}`}
        />
        <SummaryCard
          title="成本上涨最快品项"
          value={summary.fastestRiseName}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="bg-danger-500"
          subValue={`涨幅 ${summary.fastestRiseRate}`}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          {dimension === 'ingredient' ? 'Top3 食材采购价变化趋势' : 'Top3 菜品售价变化趋势'}
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceTrendChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: number) => formatMoney(value)}
              />
              <Legend />
              {top3Names.map((name, idx) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  name={name}
                  stroke={LINE_COLORS[idx]}
                  strokeWidth={2}
                  dot={{ fill: LINE_COLORS[idx], strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            {dimension === 'ingredient' ? '食材毛利贡献排名' : '菜品毛利贡献排名'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  排名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {dimension === 'ingredient' ? '食材名称' : '菜品名称'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  销售额
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  成本
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  毛利额
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  毛利率
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trackerData.topByGrossProfit.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                    {formatMoney(item.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-warning-600">
                    {formatMoney(item.cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-success-600">
                    {formatMoney(item.grossProfit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={`font-medium ${item.rate >= 40 ? 'text-success-600' : item.rate >= 20 ? 'text-primary-600' : 'text-warning-600'}`}>
                      {formatPercent(item.rate)}
                    </span>
                  </td>
                </tr>
              ))}
              {trackerData.topByGrossProfit.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            {dimension === 'ingredient' ? '食材消耗量排名' : '菜品销量排名'}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumptionChartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number, name: string) => {
                    const item = trackerData.topByConsumption.find((i) => i.name === name);
                    if (name === '金额') return formatMoney(value);
                    return [`${value}${item?.unit || ''}`, '消耗量'];
                  }}
                />
                <Bar dataKey="金额" radius={[0, 4, 4, 0]}>
                  {consumptionChartData.map((_, index) => (
                    <Cell key={index} fill={LINE_COLORS[index % LINE_COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            {trackerData.topByConsumption.slice(0, 10).map((item, index) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 text-gray-600 text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(item.consumption / maxConsumption) * 100}%`,
                          backgroundColor: LINE_COLORS[index % LINE_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-gray-600 w-24 text-right">
                      {item.consumption.toFixed(2)}{item.unit}
                    </span>
                  </div>
                  <span className="text-primary-600 font-medium w-24 text-right">
                    {formatMoney(item.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning-500" />
              价格变动追踪
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {dimension === 'ingredient' ? '食材名称' : '菜品名称'}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    期初价格
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    期末价格
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    涨跌幅
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trackerData.priceChanges.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                      {formatMoney(item.firstPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                      {formatMoney(item.lastPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={`inline-flex items-center gap-1 font-medium ${
                        item.changeRate > 0 ? 'text-danger-600' : item.changeRate < 0 ? 'text-success-600' : 'text-gray-500'
                      }`}>
                        {item.changeRate > 0 ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : item.changeRate < 0 ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : null}
                        {item.changeRate > 0 ? '+' : ''}{formatPercent(item.changeRate)}
                      </span>
                    </td>
                  </tr>
                ))}
                {trackerData.priceChanges.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      暂无价格变动数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
