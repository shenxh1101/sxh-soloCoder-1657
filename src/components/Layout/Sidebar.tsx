import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Carrot,
  Truck,
  ShoppingCart,
  UtensilsCrossed,
  Receipt,
  ClipboardList,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Package,
  TrendingUp,
  AlertTriangle,
  LineChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  {
    group: '概览',
    items: [
      { path: '/', label: '仪表盘', icon: LayoutDashboard },
    ],
  },
  {
    group: '基础数据',
    items: [
      { path: '/ingredients', label: '食材管理', icon: Carrot },
      { path: '/suppliers', label: '供应商管理', icon: Truck },
    ],
  },
  {
    group: '业务管理',
    items: [
      { path: '/purchases', label: '采购管理', icon: ShoppingCart },
      { path: '/dishes', label: '菜品管理', icon: UtensilsCrossed },
      { path: '/sales', label: '销售管理', icon: Receipt },
      { path: '/inventory', label: '库存盘点', icon: ClipboardList },
    ],
  },
  {
    group: '报表中心',
    items: [
      { path: '/reports/operation-tracker', label: '经营数据追踪', icon: LineChart },
      { path: '/reports/gross-profit', label: '毛利分析', icon: TrendingUp },
      { path: '/reports/stock-alert', label: '库存预警', icon: AlertTriangle },
      { path: '/reports/purchase-suggestion', label: '采购建议', icon: Package },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-primary-800 to-primary-900 transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-primary-700">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center w-full')}>
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">食材管家</h1>
              <p className="text-primary-200 text-xs">库存成本管控系统</p>
            </div>
          )}
        </div>
      </div>

      <nav className="mt-4 px-3 pb-4 overflow-y-auto h-[calc(100vh-5rem)]">
        {menuItems.map((group) => (
          <div key={group.group} className="mb-4">
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-medium text-primary-300 uppercase tracking-wider">
                {group.group}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-white/15 text-white shadow-inner'
                          : 'text-primary-100 hover:bg-white/10 hover:text-white',
                        collapsed && 'justify-center px-0'
                      )}
                    >
                      <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-white')} />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <button
        onClick={onToggle}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
}
