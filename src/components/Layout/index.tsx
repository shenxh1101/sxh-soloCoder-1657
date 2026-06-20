import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const pageTitles: Record<string, string> = {
  '/': '仪表盘',
  '/ingredients': '食材管理',
  '/suppliers': '供应商管理',
  '/purchases': '采购管理',
  '/purchases/new': '采购入库',
  '/dishes': '菜品管理',
  '/sales': '销售管理',
  '/inventory': '库存盘点',
  '/inventory/new': '新建盘点',
  '/reports/gross-profit': '毛利分析',
  '/reports/stock-alert': '库存预警',
  '/reports/purchase-suggestion': '采购建议',
};

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const title = pageTitles[location.pathname] || '食材管家';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div
        className={`transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}
      >
        <Header title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
