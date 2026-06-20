import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { TrendingUp, DollarSign, TrendingDown, BarChart3, ChevronRight, ChevronDown, AlertCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import { formatMoney, formatPercent, calcGrossProfit, calcGrossProfitRate, calcDeviationRate } from '@/utils/calc';
import { generateGrossProfitReport, generateDeviationDetail, getPeriodDateRange, generateDrillDetail } from '@/utils/report';
import { parseQuery } from '@/utils/queryParams';
import { useSaleStore } from '@/store/useSaleStore';
import { usePurchaseStore } from '@/store/usePurchaseStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useIngredientStore } from '@/store/useIngredientStore';
import { useDishStore } from '@/store/useDishStore';
import { cn } from '@/lib/utils';

import Modal from '@/components/Modal';
import Button from '@/components/common/Button';
import type { GrossProfitReportItem, DeviationDetail, DrillDetail } from '@/types';

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
  onDrill,
}: {
  isOpen: boolean;
  onClose: () => void;
  detail: DeviationDetail | null;
  onDrill: (targetId: string, targetType: 'dish' | 'ingredient') => void;
}) {
  if (!detail) return null;

  const reasonLabels: Record<string, string> = {
    waste: '损耗',
    inventory: '盘点差异',
    bom: 'BOM用量不准',
    other: '其他',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`偏差明细 - ${detail.date}`} size="xl">
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
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">操作</th>
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
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDrill(dish.dishId, 'dish');
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                      >
                        钻取
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {detail.dishes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
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
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">操作</th>
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
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDrill(ing.ingredientId, 'ingredient');
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                      >
                        钻取
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {detail.ingredients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
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

function DrillDetailModal({
  isOpen,
  onClose,
  detail,
}: {
  isOpen: boolean;
  onClose: () => void;
  detail: DrillDetail | null;
}) {
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());

  if (!detail) return null;

  const toggleSaleExpand = (saleId: string) => {
    const next = new Set(expandedSales);
    if (next.has(saleId)) {
      next.delete(saleId);
    } else {
      next.add(saleId);
    }
    setExpandedSales(next);
  };

  const diffTypeLabels: Record<string, string> = {
    profit: '盘盈',
    loss: '盘亏',
    equal: '持平',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`钻取详情 - ${detail.targetName}`} size="xl">
      <div className="space-y-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-700">{detail.targetName}</h4>
              <p className="text-xs text-gray-500 mt-1">
                周期：{detail.periodDateRange.displayName}（{detail.periodDateRange.start} ~ {detail.periodDateRange.end}）
              </p>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              detail.targetType === 'dish' ? 'bg-primary-100 text-primary-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {detail.targetType === 'dish' ? '菜品' : '食材'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500">理论成本</p>
              <p className="text-lg font-bold text-gray-700 mt-1">{formatMoney(detail.theoreticalCost)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500">实际成本</p>
              <p className="text-lg font-bold text-warning-600 mt-1">{formatMoney(detail.actualCost)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500">偏差金额</p>
              <p className={`text-lg font-bold mt-1 ${
                detail.deviation > 0 ? 'text-danger-600' : detail.deviation < 0 ? 'text-success-600' : 'text-gray-500'
              }`}>
                {detail.deviation > 0 ? '+' : ''}{formatMoney(detail.deviation)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500">偏差率</p>
              <p className={`text-lg font-bold mt-1 ${
                detail.deviationRate > 5 ? 'text-danger-600' : 'text-warning-600'
              }`}>
                {detail.deviationRate > 0 ? '+' : ''}{formatPercent(detail.deviationRate)}
              </p>
            </div>
          </div>
        </div>

        {detail.targetType === 'dish' && (
          <>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">销售明细</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-10"></th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">日期</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">单据号</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">销售数量</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">收入</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">理论成本</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">实际成本</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detail.dishSales?.map((sale, idx) => (
                      <Fragment key={idx}>
                        <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleSaleExpand(sale.saleId)}>
                          <td className="px-4 py-2">
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSales.has(sale.saleId) ? 'rotate-180' : ''}`} />
                          </td>
                          <td className="px-4 py-2 text-gray-700">{sale.saleDate}</td>
                          <td className="px-4 py-2 text-gray-500 font-mono text-xs">{sale.saleId}</td>
                          <td className="px-4 py-2 text-right text-gray-700">{sale.quantity}</td>
                          <td className="px-4 py-2 text-right text-gray-700">{formatMoney(sale.revenue)}</td>
                          <td className="px-4 py-2 text-right text-gray-500">{formatMoney(sale.theoreticalCost)}</td>
                          <td className="px-4 py-2 text-right text-warning-600">{formatMoney(sale.actualCost)}</td>
                        </tr>
                        {expandedSales.has(sale.saleId) && (
                          <tr className="bg-gray-50">
                            <td colSpan={7} className="px-4 py-3">
                              <div className="pl-8">
                                <p className="text-xs font-medium text-gray-500 mb-2">BOM 食材成本拆分</p>
                                <div className="overflow-x-auto rounded border border-gray-200 bg-white">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                      <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500">食材名称</th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-500">用量</th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-500">成本</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {sale.bomBreakdown.map((bom, bomIdx) => (
                                        <tr key={bomIdx}>
                                          <td className="px-3 py-2 text-gray-700">{bom.ingredientName}</td>
                                          <td className="px-3 py-2 text-right text-gray-500">{bom.quantity}{bom.unit}</td>
                                          <td className="px-3 py-2 text-right text-gray-700">{formatMoney(bom.cost)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                    {(!detail.dishSales || detail.dishSales.length === 0) && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                          暂无销售记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                相关盘点
                <span className="ml-2 text-xs font-normal text-gray-400">
                  （涉及该菜品BOM食材的盘点）
                </span>
              </h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">日期</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">盘点单</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">食材</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">系统库存</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">实盘</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">差异数量</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">差异金额</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detail.dishInventories?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-700">{item.checkDate}</td>
                        <td className="px-4 py-2 text-gray-500 font-mono text-xs">{item.checkId}</td>
                        <td className="px-4 py-2 text-gray-700">{item.ingredientName || '-'}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{item.systemStock}{item.unit}</td>
                        <td className="px-4 py-2 text-right text-gray-700">{item.actualStock}{item.unit}</td>
                        <td className={`px-4 py-2 text-right font-medium ${
                          item.diffType === 'loss' ? 'text-danger-600' : item.diffType === 'profit' ? 'text-success-600' : 'text-gray-500'
                        }`}>
                          {item.diffQuantity > 0 ? '+' : ''}{item.diffQuantity}{item.unit}
                        </td>
                        <td className={`px-4 py-2 text-right font-medium ${
                          item.diffAmount > 0 ? 'text-danger-600' : item.diffAmount < 0 ? 'text-success-600' : 'text-gray-500'
                        }`}>
                          {item.diffAmount > 0 ? '+' : ''}{formatMoney(item.diffAmount)}
                        </td>
                      </tr>
                    ))}
                    {(!detail.dishInventories || detail.dishInventories.length === 0) && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                          暂无相关盘点记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {detail.targetType === 'ingredient' && (
          <>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">菜品消耗分布</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">菜品名称</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">销售份数</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">消耗数量</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">理论成本</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detail.ingredientConsumptions?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-700">{item.dishName}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{item.soldQuantity}份</td>
                        <td className="px-4 py-2 text-right text-gray-700">{item.consumedQuantity}{item.unit}</td>
                        <td className="px-4 py-2 text-right text-warning-600">{formatMoney(item.theoreticalCost)}</td>
                      </tr>
                    ))}
                    {(!detail.ingredientConsumptions || detail.ingredientConsumptions.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                          暂无消耗记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">采购明细</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">日期</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">采购单</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">供应商</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">数量</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">单价</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">金额</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detail.ingredientPurchases?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-700">{item.purchaseDate}</td>
                        <td className="px-4 py-2 text-gray-500 font-mono text-xs">{item.purchaseId}</td>
                        <td className="px-4 py-2 text-gray-700">{item.supplierName}</td>
                        <td className="px-4 py-2 text-right text-gray-700">{item.quantity}{item.unit}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{formatMoney(item.unitPrice)}</td>
                        <td className="px-4 py-2 text-right text-warning-600 font-medium">{formatMoney(item.amount)}</td>
                      </tr>
                    ))}
                    {(!detail.ingredientPurchases || detail.ingredientPurchases.length === 0) && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                          暂无采购记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">盘点明细</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">日期</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">盘点单</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">系统库存</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">实盘</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">差异数量</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">差异金额</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">类型</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detail.ingredientInventories?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-700">{item.checkDate}</td>
                        <td className="px-4 py-2 text-gray-500 font-mono text-xs">{item.checkId}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{item.systemStock}{item.unit}</td>
                        <td className="px-4 py-2 text-right text-gray-700">{item.actualStock}{item.unit}</td>
                        <td className={`px-4 py-2 text-right font-medium ${
                          item.diffType === 'loss' ? 'text-danger-600' : item.diffType === 'profit' ? 'text-success-600' : 'text-gray-500'
                        }`}>
                          {item.diffQuantity > 0 ? '+' : ''}{item.diffQuantity}{item.unit}
                        </td>
                        <td className={`px-4 py-2 text-right font-medium ${
                          item.diffAmount > 0 ? 'text-danger-600' : item.diffAmount < 0 ? 'text-success-600' : 'text-gray-500'
                        }`}>
                          {item.diffAmount > 0 ? '+' : ''}{formatMoney(item.diffAmount)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            item.diffType === 'profit' ? 'bg-success-100 text-success-700' :
                            item.diffType === 'loss' ? 'bg-danger-100 text-danger-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {diffTypeLabels[item.diffType]}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!detail.ingredientInventories || detail.ingredientInventories.length === 0) && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                          暂无盘点记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default function GrossProfit() {
  const navigate = useNavigate();
  const location = useLocation();
  const tableRef = useRef<HTMLTableElement>(null);

  const queryParams = useMemo(() => parseQuery(location.search), [location.search]);
  const initialDim = (['day', 'week', 'month'].includes(queryParams.dim) ? queryParams.dim : 'day') as TimeDimension;
  const [timeDimension, setTimeDimension] = useState<TimeDimension>(initialDim);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<DeviationDetail | null>(null);
  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [selectedDrillDetail, setSelectedDrillDetail] = useState<DrillDetail | null>(null);

  const highlightDate = queryParams.date as string | undefined;
  const highlightHighDeviation = queryParams.type === 'high_deviation';
  const fromYesterdayCompare = queryParams.from === 'yesterday_compare';

  useEffect(() => {
    if (queryParams.dim && ['day', 'week', 'month'].includes(queryParams.dim)) {
      setTimeDimension(queryParams.dim as TimeDimension);
    }
  }, [queryParams.dim]);

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

  useEffect(() => {
    if (highlightDate && tableRef.current) {
      setTimeout(() => {
        const rows = tableRef.current?.querySelectorAll('tbody tr');
        rows?.forEach((row) => {
          const dateCell = row.querySelector('td:first-child');
          if (dateCell?.textContent?.includes(highlightDate.slice(5))) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }, 100);
    }
  }, [highlightDate, data]);

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalTheoreticalCost = data.reduce((sum, item) => sum + item.theoreticalCost, 0);
  const totalActualCost = data.reduce((sum, item) => sum + item.actualCost, 0);
  const totalSalesCost = data.reduce((sum, item) => sum + item.salesCost, 0);
  const totalPurchaseAmount = data.reduce((sum, item) => sum + item.purchaseAmount, 0);
  const totalInventoryDiff = data.reduce((sum, item) => sum + item.inventoryDiff, 0);
  const totalGrossProfit = calcGrossProfit(totalRevenue, totalActualCost);
  const totalGrossProfitRate = calcGrossProfitRate(totalRevenue, totalActualCost);
  const totalDeviationRate = calcDeviationRate(totalTheoreticalCost, totalActualCost);

  const handleViewDetail = (item: GrossProfitReportItem) => {
    const dateRange = getPeriodDateRange(timeDimension, item.date);
    const detail = generateDeviationDetail(
      { sales, purchases, inventoryChecks, ingredients, dishes },
      dateRange
    );
    setSelectedDetail(detail);
    setDetailModalOpen(true);
  };

  const handleDrill = (targetId: string, targetType: 'dish' | 'ingredient') => {
    if (!selectedDetail) return;
    const drillDetail = generateDrillDetail(
      { sales, purchases, inventoryChecks, ingredients, dishes },
      targetId,
      targetType,
      selectedDetail.periodDateRange
    );
    setSelectedDrillDetail(drillDetail);
    setDrillModalOpen(true);
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
          subValue={`销售 ${formatMoney(totalSalesCost)} + 盘差 ${formatMoney(totalInventoryDiff)} = 实际 ${formatMoney(totalActualCost)}`}
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
          <table className="w-full" ref={tableRef}>
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
                  销售成本
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  采购入库
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  盘点差异
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
              {data.map((item, index) => {
                const isDateMatch = highlightDate && item.date.includes(highlightDate.slice(5));
                const isHighDeviation = highlightHighDeviation && Math.abs(item.deviationRate) > 5;
                return (
                  <tr
                    key={index}
                    className={cn(
                      'hover:bg-gray-50 transition-colors cursor-pointer',
                      isDateMatch && 'bg-primary-50/80 border-l-4 border-l-primary-500',
                      isHighDeviation && 'bg-danger-50/50'
                    )}
                    onClick={() => handleViewDetail(item)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className={cn(isDateMatch && 'font-semibold text-primary-700')}>
                        {item.date}
                      </span>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                    {formatMoney(item.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {formatMoney(item.theoreticalCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {formatMoney(item.salesCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {formatMoney(item.purchaseAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {formatMoney(item.inventoryDiff)}
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
                    <span className={cn(
                      'font-medium',
                      isHighDeviation && Math.abs(item.deviationRate) > 10
                        ? 'text-danger-600 text-base animate-pulse'
                        : item.deviationRate > 5
                        ? 'text-danger-600'
                        : 'text-warning-600'
                    )}>
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
              )})}
              {data.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-400">
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
        onDrill={handleDrill}
      />

      <DrillDetailModal
        isOpen={drillModalOpen}
        onClose={() => setDrillModalOpen(false)}
        detail={selectedDrillDetail}
      />
    </div>
  );
}
