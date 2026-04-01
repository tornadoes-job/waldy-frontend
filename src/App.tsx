import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProductsPage from './pages/Products';
import ProductDetailPage from './pages/ProductDetail';
import SuppliersPage from './pages/Suppliers';
import SupplierDetailPage from './pages/SupplierDetail';
import CategoriesPage from './pages/Categories';
import TraceabilityPage from './pages/Traceability';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/products" replace />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="suppliers/:id" element={<SupplierDetailPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="traceability" element={<TraceabilityPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}