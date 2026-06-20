import { useMemo } from 'react';
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
import { useDishStore } from '@/store/useDishStore';
import { formatMoney, formatPercent, calcGrossProfitRate, calcGrossProfit } from '@/utils/calc';
import { generateDailyTrendData } from '@/utils/report';
import { getToday } from '@/utils/date';
import Button from '@/components/common/Button';

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
  const { ingredients, getTotalStockValue, getAlertIngredients } = useIngredientStore();
  const { purchases, getTotalPurchaseAmountByDate } = usePurchaseStore();
  const { sales, getTotalRevenueByDate } = useSaleStore();
  const { dishes } = useDishStore();

  const totalStockValue = getTotalStockValue();
  const todayPurchase = getTotalPurchaseAmountByDate(getToday());
  const todayRevenue = getTotalRevenueByDate(getToday());
  const alertIngredients = getAlertIngredients();

  const trendData = useMemo(() => {
    return generateDailyTrendData({
      sales,
      purchases,
      inventoryChecks: [],
      ingredients,
      dishes,
    });
  }, [sales, purchases, ingredients, dishes]);

  const weekRevenue = trendData.reduce((sum, d) => sum + d.revenue, 0);
  const weekCost = trendData.reduce((sum, d) => sum + d.cost, 0);
  const weekGrossProfit = calcGrossProfit(weekRevenue, weekCost);
  const weekGrossProfitRate = calcGrossProfitRate(weekRevenue, weekCost);

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
          change={0}
          gradient="bg-gradient-to-br from-primary-500 to-primary-700"
          iconBg="bg-white/20"
        />
        <StatCard
          title="今日采购金额"
          value={formatMoney(todayPurchase)}
          icon={<ShoppingCart className="w-6 h-6" />}
          change={0}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          iconBg="bg-white/20"
        />
        <StatCard
          title="今日销售额"
          value={formatMoney(todayRevenue)}
          icon={<DollarSign className="w-6 h-6" />}
          change={0}
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">本周经营概览</h3>
            <span className="text-sm text-gray-500">最近7天</span>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">总收入</p>
              <p className="text-xl font-bold text-primary-600">{formatMoney(weekRevenue)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">总成本</p>
              <p className="text-xl font-bold text-warning-600">{formatMoney(weekCost)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">毛利率</p>
              <p className="text-xl font-bold text-success-600">{formatPercent(weekGrossProfitRate)}</p>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
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

        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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

        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">今日数据</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-700">今日销售额</p>
                  <p className="text-xl font-bold text-primary-700 mt-1">{formatMoney(todayRevenue)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-primary-600 mt-2">
                共 {sales.filter(s => s.saleDate === getToday()).length} 笔销售记录
              </p>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">今日采购</p>
                  <p className="text-xl font-bold text-blue-700 mt-1">{formatMoney(todayPurchase)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                共 {purchases.filter(p => p.purchaseDate === getToday()).length} 笔采购记录
              </p>
            </div>

            <div className="p-4 bg-gradient-to-r from-success-50 to-success-100 rounded-lg border border-success-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-success-700">本周毛利</p>
                  <p className="text-xl font-bold text-success-700 mt-1">{formatMoney(weekGrossProfit)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-success-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-success-600 mt-2">
                毛利率 {formatPercent(weekGrossProfitRate)}
              </p>
            </div>
          </div>
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
