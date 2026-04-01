// ============================================================
// WAL FRONTEND — SHARED TYPES
// ============================================================

export interface Sector {
  id: string;
  code: string;
  wal_code: string;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  sector_id?: string;
  sector?: Sector;
  is_active: boolean;
  notes?: string;
  products?: ProductSummary[];
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  code: string;
  wal_code: string;
  name: string;
  sector_id: string;
  sector_name?: string;
  sector_icon?: string;
  sector_wal_code?: string;
  parent_category_id?: string;
  parent_category?: ProductCategory;
  description?: string;
  is_active: boolean;
  product_count?: number;
  created_at: string;
  updated_at: string;
  children?: ProductCategory[];
}

export interface ProductSummary {
  id: string;
  wal_reference: string;
  name: string;
  variant?: string;
  quantity_in_stock: number;
  unit: string;
  sector_name?: string;
  sector_icon?: string;
  category_name?: string;
}

export interface Product {
  id: string;
  wal_reference: string;
  sector_id: string;
  category_id: string;
  supplier_id: string;
  sector?: Sector;
  category?: ProductCategory;
  supplier?: Supplier;
  name: string;
  variant?: string;
  description?: string;
  unit: string;
  barcode?: string;
  quantity_in_stock: number;
  min_stock_alert: number;
  purchase_price?: number;
  selling_price?: number;
  currency: string;
  image_url?: string;
  origin_country?: string;
  origin_region?: string;
  batch_number?: string;
  expiry_date?: string;
  manufacture_date?: string;
  is_active: boolean;
  notes?: string;
  sub_products?: SubProduct[];
  created_at: string;
  updated_at: string;
}

export interface SubProduct {
  id: string;
  wal_reference: string;
  parent_product_id: string;
  parent_product?: Pick<Product, 'id' | 'name' | 'wal_reference'>;
  name: string;
  description?: string;
  unit: string;
  quantity_in_stock: number;
  purchase_price?: number;
  selling_price?: number;
  currency: string;
  image_url?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id?: string;
  sub_product_id?: string;
  product_name?: string;
  wal_reference?: string;
  movement_type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  unit: string;
  unit_price?: number;
  reference_doc?: string;
  reason?: string;
  operator_name?: string;
  stock_before?: number;
  stock_after?: number;
  created_at: string;
}

export interface TraceabilityData {
  product: Product;
  supplier: Supplier;
  sector: Sector;
  category: ProductCategory;
  movements: StockMovement[];
  sub_products: SubProduct[];
  wal_chain: {
    sector: string;
    category: string;
    product: string;
    sub_products: string[];
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ProductFilters {
  search?: string;
  sector_id?: string;
  category_id?: string;
  supplier_id?: string;
  is_active?: boolean;
  low_stock?: boolean;
  page?: number;
  limit?: number;
  sort_by?: 'name' | 'wal_reference' | 'quantity_in_stock' | 'created_at';
  sort_order?: 'ASC' | 'DESC';
}

export const UNITS = ['kg', 'g', 'tonne', 'L', 'mL', 'm', 'cm', 'm²', 'pièce', 'sac', 'carton', 'boîte', 'liasse', 'botte', 'douzaine'] as const;
export const CURRENCIES = ['XOF', 'EUR', 'USD', 'GBP'] as const;
export const MOVEMENT_TYPES = {
  ENTRY: { label: 'Entrée', color: '#22c55e' },
  EXIT: { label: 'Sortie', color: '#ef4444' },
  ADJUSTMENT: { label: 'Ajustement', color: '#f59e0b' },
  RETURN: { label: 'Retour', color: '#6366f1' },
} as const;