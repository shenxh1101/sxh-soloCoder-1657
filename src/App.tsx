import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import DishesPage from '@/pages/Dishes';
import IngredientsPage from '@/pages/Ingredients';
import SuppliersPage from '@/pages/Suppliers';
import InventoryPage from '@/pages/Inventory';
import NewCheckPage from '@/pages/Inventory/NewCheck';
import Purchases from '@/pages/Purchases';
import NewPurchase from '@/pages/Purchases/NewPurchase';
import Sales from '@/pages/Sales';
import GrossProfitReport from '@/pages/Reports/GrossProfit';
import StockAlertReport from '@/pages/Reports/StockAlert';
import PurchaseSuggestionReport from '@/pages/Reports/PurchaseSuggestion';
import OperationTrackerReport from '@/pages/Reports/OperationTracker';
import { useIngredientStore } from '@/store/useIngredientStore';
import { useSupplierStore } from '@/store/useSupplierStore';
import { usePurchaseStore } from '@/store/usePurchaseStore';
import { useDishStore } from '@/store/useDishStore';
import { useSaleStore } from '@/store/useSaleStore';
import { useInventoryStore } from '@/store/useInventoryStore';

export default function App() {
  const initIngredients = useIngredientStore((state) => state.init);
  const initSuppliers = useSupplierStore((state) => state.init);
  const initPurchases = usePurchaseStore((state) => state.init);
  const initDishes = useDishStore((state) => state.init);
  const initSales = useSaleStore((state) => state.init);
  const initInventory = useInventoryStore((state) => state.init);

  useEffect(() => {
    initIngredients();
    initSuppliers();
    initPurchases();
    initDishes();
    initSales();
    initInventory();
  }, [initIngredients, initSuppliers, initPurchases, initDishes, initSales, initInventory]);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ingredients" element={<IngredientsPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/dishes" element={<DishesPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/inventory/new" element={<NewCheckPage />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/purchases/new" element={<NewPurchase />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/reports/gross-profit" element={<GrossProfitReport />} />
          <Route path="/reports/stock-alert" element={<StockAlertReport />} />
          <Route path="/reports/purchase-suggestion" element={<PurchaseSuggestionReport />} />
          <Route path="/reports/operation-tracker" element={<OperationTrackerReport />} />
        </Routes>
      </Layout>
    </Router>
  );
}
