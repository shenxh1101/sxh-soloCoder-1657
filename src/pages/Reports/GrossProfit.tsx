import { useState } from 'react';
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
import { TrendingUp, DollarSign, TrendingDown, BarChart3 } from 'lucide-react';
import { formatMoney, formatPercent, calcGrossProfit, calcGrossProfitRate, calcDeviationRate } from '@/utils/calc';
import type { GrossProfitReportItem } from '@/types';

type TimeDimension = 'day' | 'week' | 'month';

const dailyData: GrossProfitReportItem[] = [
  { date: '06-15', revenue: 2880, theoreticalCost: 850, actualCost: 892.5, grossProfit: 1987.5, grossProfitRate: 69.01, deviationRate: 5.0 },
  { date: '06-16', revenue: 3200, theoreticalCost: 950, actualCost: 980, grossProfit: 2220, grossProfitRate: 69.38, deviationRate: 3.16 },
  { date: '06-17', revenue: 2650, theoreticalCost: 780, actualCost: 820, grossProfit: 1830, grossProfitRate: 69.06, deviationRate: 5.13 },
  { date: '06-18', revenue: 3100, theoreticalCost: 920, actualCost: 950, grossProfit: 2150, grossProfitRate: 69.35, deviationRate: 3.26 },
  { date: '06-19', revenue: 3800, theoreticalCost: 1100, actualCost: 1150, grossProfit: 2650, grossProfitRate: 69.74, deviationRate: 4.55 },
  { date: '06-20', revenue: 4500, theoreticalCost: 1320, actualCost: 1380, grossProfit: 3120, grossProfitRate: 69.33, deviationRate: 4.55 },
  { date: '06-21', revenue: 4200, theoreticalCost: 1220, actualCost: 1280, grossProfit: 2920, grossProfitRate: 69.52, deviationRate: 4.92 },
];

const weeklyData: GrossProfitReportItem[] = [
  { date: '第23周', revenue: 18500, theoreticalCost: 5500, actualCost: 5800, grossProfit: 12700, grossProfitRate: 68.65, deviationRate: 5.45 },
  { date: '第24周', revenue: 21200, theoreticalCost: 6200, actualCost: 6500, grossProfit: 14700, grossProfitRate: 69.34, deviationRate: 4.84 },
  { date: '第25周', revenue: 19800, theoreticalCost: 5800, actualCost: 6100, grossProfit: 13700, grossProfitRate: 69.19, deviationRate: 5.17 },
  { date: '第26周', revenue: 24330, theoreticalCost: 7140, actualCost: 7452.5, grossProfit: 16877.5, grossProfitRate: 69.37, deviationRate: 4.38 },
];

const monthlyData: GrossProfitReportItem[] = [
  { date: '1月', revenue: 78500, theoreticalCost: 23500, actualCost: 24800, grossProfit: 53700, grossProfitRate: 68.41, deviationRate: 5.53 },
  { date: '2月', revenue: 65200, theoreticalCost: 19500, actualCost: 20600, grossProfit: 44600, grossProfitRate: 68.40, deviationRate: 5.64 },
  { date: '3月', revenue: 82300, theoreticalCost: 24800, actualCost: 26100, grossProfit: 56200, grossProfitRate: 68.29, deviationRate: 5.24 },
  { date: '4月', revenue: 88600, theoreticalCost: 26500, actualCost: 27800, grossProfit: 60800, grossProfitRate: 68.62, deviationRate: 4.91 },
  { date: '5月', revenue: 92100, theoreticalCost: 27800, actualCost: 29100, grossProfit: 63000, grossProfitRate: 68.40, deviationRate: 4.68 },
  { date: '6月', revenue: 85400, theoreticalCost: 25600, actualCost: 26800, grossProfit: 58600, grossProfitRate: 68.62, deviationRate: 4.69 },
];

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

export default function GrossProfit() {
  const [timeDimension, setTimeDimension] = useState<TimeDimension>('day');

  const getData = () => {
    switch (timeDimension) {
      case 'day':
        return dailyData;
      case 'week':
        return weeklyData;
      case 'month':
        return monthlyData;
      default:
        return dailyData;
    }
  };

  const data = getData();

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalTheoreticalCost = data.reduce((sum, item) => sum + item.theoreticalCost, 0);
  const totalActualCost = data.reduce((sum, item) => sum + item.actualCost, 0);
  const totalGrossProfit = calcGrossProfit(totalRevenue, totalActualCost);
  const totalGrossProfitRate = calcGrossProfitRate(totalRevenue, totalActualCost);
  const totalDeviationRate = calcDeviationRate(totalTheoreticalCost, totalActualCost);

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard
          title="总收入"
          value={formatMoney(totalRevenue)}
          icon={<DollarSign className="w-5 h-5" />}
          color="bg-primary-500"
        />
        <SummaryCard
          title="总成本"
          value={formatMoney(totalActualCost)}
          icon={<TrendingDown className="w-5 h-5" />}
          color="bg-warning-500"
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
          color="bg-danger-500"
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
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">明细数据</h3>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
