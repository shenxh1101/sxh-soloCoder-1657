import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Warehouse,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  ClipboardList,
  Receipt,
  Package,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useIngredientStore } from '@/store/useIngredientStore';
import { usePurchaseStore } from '@/store/usePurchaseStore';
import { useSaleStore } from '@/store/useSaleStore';
import { formatMoney, formatPercent } from '@/utils/calc';
import { getToday, formatDate } from '@/utils/date';
import Button from '@/components/common/Button';

const mockTrendData = [
  { date: '周一', revenue: 2880, cost: 892.5, grossProfit: 1987.5 },
  { date: '周二', revenue: 3200, cost: 980, grossProfit: 2220 },
  { date: '周三', revenue: 2650, cost: 820, grossProfit: 1830 },
  { date: '周四', revenue: 3100, cost: 950, grossProfit: 2150 },
  { date: '周五', revenue: 3800, cost: 1150, grossProfit: 2650 },
  { date: '周六', revenue: 4500, cost: 1380, grossProfit: 3120 },
  { date: '周日', revenue: 4200, cost: 1280, grossProfit: 2920 },
];

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: number;
  gradient: string;
  iconBg: string;
}

function StatCard({ title, value, icon, change, gradient, iconBg }: StatCardProps) {
  const isPositive = change >= 0;
  return (
    <div className={`rounded-xl p-5 text-white shadow-lg ${gradient}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          <div className={`flex items-center gap-1 mt-3 text-sm ${isPositive ? 'text-green-200' : 'text-red-200'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{isPositive ? '+' : ''}{formatPercent(change)}</span>
            <span className="text-white/60">环比</span>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}

function QuickAction({ icon, label, onClick, color }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all duration-200 group"
    >
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { getTotalStockValue, getAlertIngredients } = useIngredientStore();
  const { getTotalPurchaseAmountByDate } = usePurchaseStore();
  const { getTotalRevenueByDate } = useSaleStore();

  const totalStockValue = getTotalStockValue();
  const todayPurchase = getTotalPurchaseAmountByDate(getToday());
  const todayRevenue = getTotalRevenueByDate(getToday());
  const alertIngredients = getAlertIngredients();

  const handleGenerateSuggestion = () => {
    navigate('/reports/purchase-suggestion');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="库存总金额"
          value={formatMoney(totalStockValue)}
          icon={<Warehouse className="w-6 h-6" />}
          change={5.2}
          gradient="bg-gradient-to-br from-primary-500 to-primary-700"
          iconBg="bg-white/20"
        />
        <StatCard
          title="今日采购金额"
          value={formatMoney(todayPurchase)}
          icon={<ShoppingCart className="w-6 h-6" />}
          change={-3.8}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          iconBg="bg-white/20"
        />
        <StatCard
          title="今日销售额"
          value={formatMoney(todayRevenue)}
          icon={<DollarSign className="w-6 h-6" />}
          change={12.5}
          gradient="bg-gradient-to-br from-success-500 to-success-700"
          iconBg="bg-white/20"
        />
        <StatCard
          title="预警食材数量"
          value={`${alertIngredients.length} 种`}
          icon={<AlertTriangle className="w-6 h-6" />}
          change={0}
          gradient="bg-gradient-to-br from-warning-500 to-warning-700"
          iconBg="bg-white/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">毛利趋势</h3>
            <span className="text-sm text-gray-500">最近7天</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorGrossProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="收入"
                  stroke="#0d9488"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  name="成本"
                  stroke="#f97316"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCost)"
                />
                <Area
                  type="monotone"
                  dataKey="grossProfit"
                  name="毛利"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorGrossProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">库存预警</h3>
            <span className="px-2 py-0.5 bg-danger-100 text-danger-600 text-xs font-medium rounded-full">
              {alertIngredients.length} 种
            </span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {alertIngredients.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                暂无预警食材
              </div>
            ) : (
              alertIngredients.map((item) => {
                const gap = item.alertThreshold - item.stock;
                const severity = item.stock < item.alertThreshold * 0.5 ? 'severe' : 'low';
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{item.name}</span>
                        <span className={`px-1.5 py-0.5 text-xs rounded ${
                          severity === 'severe'
                            ? 'bg-danger-100 text-danger-600'
                            : 'bg-warning-100 text-warning-600'
                        }`}>
                          {severity === 'severe' ? '严重不足' : '偏低'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>当前: {item.stock}{item.unit}</span>
                        <span>预警: {item.alertThreshold}{item.unit}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-danger-600">
                        缺口 {gap.toFixed(1)}{item.unit}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {alertIngredients.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              className="w-full mt-4"
              onClick={handleGenerateSuggestion}
            >
              <Package className="w-4 h-4" />
              一键生成采购建议
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">快捷操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <QuickAction
            icon={<Plus className="w-6 h-6" />}
            label="采购入库"
            onClick={() => navigate('/purchases/new')}
            color="bg-primary-500"
          />
          <QuickAction
            icon={<Receipt className="w-6 h-6" />}
            label="销售录入"
            onClick={() => navigate('/sales')}
            color="bg-success-500"
          />
          <QuickAction
            icon={<ClipboardList className="w-6 h-6" />}
            label="库存盘点"
            onClick={() => navigate('/inventory/new')}
            color="bg-blue-500"
          />
          <QuickAction
            icon={<Warehouse className="w-6 h-6" />}
            label="食材管理"
            onClick={() => navigate('/ingredients')}
            color="bg-warning-500"
          />
          <QuickAction
            icon={<AlertTriangle className="w-6 h-6" />}
            label="库存预警"
            onClick={() => navigate('/reports/stock-alert')}
            color="bg-danger-500"
          />
          <QuickAction
            icon={<TrendingUp className="w-6 h-6" />}
            label="毛利分析"
            onClick={() => navigate('/reports/gross-profit')}
            color="bg-purple-500"
          />
        </div>
      </div>
    </div>
  );
}
