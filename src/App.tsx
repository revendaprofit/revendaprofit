import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./hooks/useAuth";

// Pages - Store Owner
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import StockControl from "./pages/StockControl";
import Suppliers from "./pages/Suppliers";
import Categories from "./pages/Categories";
import Customers from "./pages/Customers";
import POS from "./pages/POS";
import SalesHistory from "./pages/SalesHistory";
import InstallmentsReport from "./pages/InstallmentsReport";
import StoreSettings from "./pages/StoreSettings";
import StoreOrders from "./pages/StoreOrders";
import FeaturedProducts from "./pages/FeaturedProducts";
import PublicCatalog from "./pages/PublicCatalog";
import AdminDashboard from "./pages/AdminDashboard";
import HubMarketplace from "./pages/HubMarketplace";
import HubOrders from "./pages/HubOrders";
import Partnerships from "./pages/Partnerships";
import ConsignmentBags from "./pages/ConsignmentBags";
import PublicConsignmentBag from "./pages/PublicConsignmentBag";

// Pages - Supplier
import SupplierDashboard from "./pages/supplier/SupplierDashboard";
import SupplierCatalog from "./pages/supplier/SupplierCatalog";
import SupplierTradeRules from "./pages/supplier/SupplierTradeRules";
import SupplierOrders from "./pages/supplier/SupplierOrders";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// Redirect component that sends suppliers to their panel and store owners to dashboard
function SmartRedirect() {
  const { role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (role === 'supplier') {
    return <Navigate to="/supplier" replace />;
  }

  return <Dashboard />;
}

import AppLayout from "./components/layout/AppLayout";

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/loja/:slug" element={<PublicCatalog />} />
    <Route path="/malinha/:bag_id" element={<PublicConsignmentBag />} />
    
    {/* Admin */}
    <Route path="/admin" element={<ProtectedRoute><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
    
    {/* Store Owner Routes */}
    <Route path="/" element={<ProtectedRoute><AppLayout><SmartRedirect /></AppLayout></ProtectedRoute>} />
    <Route path="/pos" element={<ProtectedRoute><AppLayout><POS /></AppLayout></ProtectedRoute>} />
    <Route path="/sales" element={<ProtectedRoute><AppLayout><SalesHistory /></AppLayout></ProtectedRoute>} />
    <Route path="/installments" element={<ProtectedRoute><AppLayout><InstallmentsReport /></AppLayout></ProtectedRoute>} />
    <Route path="/stock" element={<ProtectedRoute><AppLayout><StockControl /></AppLayout></ProtectedRoute>} />
    <Route path="/categories" element={<ProtectedRoute><AppLayout><Categories /></AppLayout></ProtectedRoute>} />
    <Route path="/suppliers" element={<ProtectedRoute><AppLayout><Suppliers /></AppLayout></ProtectedRoute>} />
    <Route path="/customers" element={<ProtectedRoute><AppLayout><Customers /></AppLayout></ProtectedRoute>} />
    <Route path="/orders" element={<ProtectedRoute><AppLayout><StoreOrders /></AppLayout></ProtectedRoute>} />
    <Route path="/featured-products" element={<ProtectedRoute><AppLayout><FeaturedProducts /></AppLayout></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><AppLayout><StoreSettings /></AppLayout></ProtectedRoute>} />
    <Route path="/hub" element={<ProtectedRoute><AppLayout><HubMarketplace /></AppLayout></ProtectedRoute>} />
    <Route path="/hub/orders" element={<ProtectedRoute><AppLayout><HubOrders /></AppLayout></ProtectedRoute>} />
    <Route path="/partnerships" element={<ProtectedRoute><AppLayout><Partnerships /></AppLayout></ProtectedRoute>} />
    <Route path="/consignment-bags" element={<ProtectedRoute><AppLayout><ConsignmentBags /></AppLayout></ProtectedRoute>} />

    {/* Supplier Routes */}
    <Route path="/supplier" element={<ProtectedRoute><AppLayout><SupplierDashboard /></AppLayout></ProtectedRoute>} />
    <Route path="/supplier/catalog" element={<ProtectedRoute><AppLayout><SupplierCatalog /></AppLayout></ProtectedRoute>} />
    <Route path="/supplier/trade-rules" element={<ProtectedRoute><AppLayout><SupplierTradeRules /></AppLayout></ProtectedRoute>} />
    <Route path="/supplier/orders" element={<ProtectedRoute><AppLayout><SupplierOrders /></AppLayout></ProtectedRoute>} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster richColors position="top-right" />
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
