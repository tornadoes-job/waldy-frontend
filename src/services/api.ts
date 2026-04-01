import axios from 'axios';
import type {
  Product, Supplier, Sector, ProductCategory, SubProduct,
  StockMovement, TraceabilityData, PaginatedResponse,
  ProductFilters
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Erreur réseau';
    return Promise.reject(new Error(msg));
  }
);

// ============================================================
// SECTORS
// ============================================================
export const sectorsApi = {
  getAll: () => api.get<{ success: boolean; data: Sector[] }>('/sectors').then(r => r.data.data),
  getCategories: (sectorId: string) =>
    api.get<{ success: boolean; data: ProductCategory[] }>(`/sectors/${sectorId}/categories`).then(r => r.data.data),
  getAllCategories: () =>
    api.get<{ success: boolean; data: ProductCategory[] }>('/categories').then(r => r.data.data),
  createCategory: (data: { code: string; name: string; sector_id: string; description?: string }) =>
    api.post<{ success: boolean; data: ProductCategory }>('/categories', data).then(r => r.data.data),
};

// ============================================================
// SUPPLIERS
// ============================================================
export const suppliersApi = {
  getAll: (params?: { search?: string; sector_id?: string; is_active?: boolean }) =>
    api.get<{ success: boolean; data: Supplier[] }>('/suppliers', { params }).then(r => r.data.data),

  getById: (id: string) =>
    api.get<{ success: boolean; data: Supplier & { products: Product[] } }>(`/suppliers/${id}`).then(r => r.data.data),

  create: (data: Partial<Supplier>) =>
    api.post<{ success: boolean; data: Supplier; message: string }>('/suppliers', data).then(r => r.data),

  update: (id: string, data: Partial<Supplier>) =>
    api.put<{ success: boolean; data: Supplier }>(`/suppliers/${id}`, data).then(r => r.data.data),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/suppliers/${id}`).then(r => r.data),
};

// ============================================================
// PRODUCTS
// ============================================================
export const productsApi = {
  getAll: (filters?: ProductFilters) =>
    api.get<PaginatedResponse<Product> & { success: boolean }>('/products', { params: filters })
      .then(r => ({ data: r.data.data, pagination: r.data.pagination })),

  getById: (id: string) =>
    api.get<{ success: boolean; data: Product }>(`/products/${id}`).then(r => r.data.data),

  searchByCode: (code: string) =>
    api.get<{ success: boolean; data: Product[] }>('/products/search-by-code', { params: { code } }).then(r => r.data.data),

  getBySupplierCode: (supplierCode: string) =>
    api.get<{ success: boolean; data: Product[] }>('/products/by-supplier', { params: { supplierCode } }).then(r => r.data.data),

  create: (formData: FormData) =>
    api.post<{ success: boolean; data: Product; message: string }>('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  update: (id: string, formData: FormData) =>
    api.put<{ success: boolean; data: Product; message: string }>(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/products/${id}`).then(r => r.data),

  getTraceability: (id: string) =>
    api.get<{ success: boolean; data: TraceabilityData }>(`/products/${id}/trace`).then(r => r.data.data),

  getStockMovements: (id: string) =>
    api.get<{ success: boolean; data: StockMovement[] }>(`/products/${id}/stock`).then(r => r.data.data),

  recordStockMovement: (id: string, data: {
    movement_type: string; quantity: number; unit: string;
    unit_price?: number; reference_doc?: string; reason?: string; operator_name?: string;
  }) => api.post<{ success: boolean; data: StockMovement }>(`/products/${id}/stock`, data).then(r => r.data.data),
};

// ============================================================
// SUB-PRODUCTS
// ============================================================
export const subProductsApi = {
  create: (productId: string, formData: FormData) =>
    api.post<{ success: boolean; data: SubProduct; message: string }>(
      `/products/${productId}/sub-products`, formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then(r => r.data),

  update: (id: string, data: Partial<SubProduct>) =>
    api.put<{ success: boolean; data: SubProduct }>(`/sub-products/${id}`, data).then(r => r.data.data),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/sub-products/${id}`).then(r => r.data),

  recordStock: (id: string, data: {
    movement_type: string; quantity: number; unit: string; reason?: string; operator_name?: string;
  }) => api.post<{ success: boolean; data: StockMovement }>(`/sub-products/${id}/stock`, data).then(r => r.data.data),
};

export default api;