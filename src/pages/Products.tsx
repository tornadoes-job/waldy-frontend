import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Package, AlertTriangle, Filter, Grid, List, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi, sectorsApi } from '../services/api';
import type { ProductFilters, Product } from '../types';
import { MOVEMENT_TYPES } from '../types';
import ProductFormModal from '../components/ProductFormModal';
import StockModal from '../components/StockModal';
import prixImg from '../assets/prix.png';

function StockBar({ qty, min }: { qty: number; min: number }) {
  const pct = min > 0 ? Math.min((qty / (min * 2)) * 100, 100) : 100;
  const color = qty <= 0 ? 'var(--red)' : qty <= min ? 'var(--orange)' : 'var(--green)';
  return (
    <div className="stock-bar-wrap">
      <div className="stock-bar">
        <div className="stock-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 600, minWidth: 40, textAlign: 'right' }}>
        {qty}
      </span>
    </div>
  );
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [filters, setFilters] = useState<ProductFilters>({
    page: 1, limit: 20, is_active: true, sort_by: 'created_at', sort_order: 'DESC'
  });
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [walSearchCode, setWalSearchCode] = useState('');
  const [walResults, setWalResults] = useState<Product[] | null>(null);

  const { data: sectors = [] } = useQuery({ queryKey: ['sectors'], queryFn: sectorsApi.getAll });

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getAll(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit désactivé');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleWalSearch = useCallback(async (val: string) => {
    setWalSearchCode(val);
    if (val.length >= 7) {
      // Check if it's a supplier code (W/FRN-XXXX format)
      const isSupplierCode = /^W\/FRN/i.test(val);
      if (isSupplierCode && !/^W\/FRN-\d{4}$/i.test(val)) {
        // Invalid supplier code format, don't search yet
        setWalResults(null);
        return;
      }
      const results = isSupplierCode
        ? await productsApi.getBySupplierCode(val)
        : await productsApi.searchByCode(val);
      setWalResults(results);
    } else {
      setWalResults(null);
    }
  }, []);

  const setFilter = (key: keyof ProductFilters, value: unknown) => {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
  };

  const products = walResults !== null ? walResults : data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Produits</h1>
          <p className="page-subtitle">
            {pagination ? `${pagination.total} produits enregistrés` : '—'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditProduct(null); setShowForm(true); }}>
          <Plus size={14} /> Nouveau produit
        </button>
      </div>

      <div className="page-body">
        {/* WAL CODE SEARCH */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>
                  🔍 Recherche par code WAL
                </label>
                <div className="search-wrap" style={{ maxWidth: '100%', borderColor: walSearchCode.startsWith('W/FRN') ? 'var(--accent)' : undefined }}>
                  <Search size={14} />
                  <input
                    className="form-input mono"
                    placeholder="W/AGR/MIL ou W/FRN-0001 → affiche tous les produits du fournisseur..."
                    value={walSearchCode}
                    onChange={e => handleWalSearch(e.target.value.toUpperCase())}
                  />
                </div>
                {walSearchCode.startsWith('W/FRN') && (
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={12} />
                    <strong>Mode fournisseur</strong> — Affiche tous les produits de {walSearchCode}
                  </div>
                )}
              </div>
              {walResults !== null && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setWalResults(null); setWalSearchCode(''); }}>
                  Réinitialiser
                </button>
              )}
            </div>
            {walSearchCode && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['W/AGR/MIL', 'W/AGR/RIZ', 'W/AGR/MAI', 'W/ELV/BOV', 'W/PEC/POI', 'W/HAB/VET'].map(s => (
                  <button key={s} className="wal-badge" style={{ cursor: 'pointer', border: 'none' }}
                    onClick={() => handleWalSearch(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {walResults !== null && walResults.length > 0 && (
              <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--bg-2)', borderRadius: 'var(--radius)', fontSize: 13 }}>
                <strong>{walResults.length}</strong> produit{walResults.length > 1 ? 's' : ''} trouvé{walResults.length > 1 ? 's' : ''}
                {/^W\/FRN/i.test(walSearchCode) ? (
                  <span> du fournisseur <strong style={{ color: 'var(--accent)' }}>{walSearchCode}</strong></span>
                ) : (
                  walResults[0]?.category && (
                    <span> dans la catégorie <strong>{walResults[0].category.name}</strong></span>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* FILTERS */}
        {walResults === null && (
          <div className="filters-bar">
            <div className="search-wrap">
              <Search size={14} />
              <input
                className="form-input"
                placeholder="Nom, variante, référence..."
                value={filters.search || ''}
                onChange={e => setFilter('search', e.target.value)}
              />
            </div>

            <select className="filter-select"
              value={filters.sector_id || ''}
              onChange={e => setFilter('sector_id', e.target.value || undefined)}>
              <option value="">Tous les secteurs</option>
              {sectors?.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>

            <select className="filter-select"
              value={filters.sort_by || 'created_at'}
              onChange={e => setFilter('sort_by', e.target.value)}>
              <option value="created_at">Plus récents</option>
              <option value="name">Nom A→Z</option>
              <option value="wal_reference">Code WAL</option>
              <option value="quantity_in_stock">Stock</option>
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!filters.low_stock}
                onChange={e => setFilter('low_stock', e.target.checked)} />
              <AlertTriangle size={13} style={{ color: 'var(--orange)' }} /> Stock faible
            </label>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              <button className={`btn btn-ghost btn-icon${viewMode === 'table' ? ' active' : ''}`}
                onClick={() => setViewMode('table')} title="Vue tableau">
                <List size={15} />
              </button>
              <button className={`btn btn-ghost btn-icon${viewMode === 'grid' ? ' active' : ''}`}
                onClick={() => setViewMode('grid')} title="Vue grille">
                <Grid size={15} />
              </button>
            </div>
          </div>
        )}

        {/* CONTENT */}
        {isLoading && walResults === null ? (
          <div className="loading-overlay"><div className="spinner" /> Chargement...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <h3>Aucun produit trouvé</h3>
            <p>Ajoutez votre premier produit ou modifiez les filtres.</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={14} /> Ajouter un produit
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Référence WAL</th>
                    <th>Produit</th>
                    <th>Secteur</th>
                    <th>Catégorie</th>
                    <th>Fournisseur</th>
                    <th>Stock</th>
                    <th>Prix Vente</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/products/${p.id}`)}>
                      <td><span className="wal-badge">{p.wal_reference}</span></td>
                      <td className="name-cell">
                        <div>{p.name}</div>
                        {p.variant && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.variant}</div>}
                      </td>
                      <td>{p.sector?.icon} {p.sector?.name}</td>
                      <td style={{ color: 'var(--text-2)' }}>{p.category?.name}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{p.supplier?.name}</td>
                      <td style={{ minWidth: 120 }}>
                        <StockBar qty={p.quantity_in_stock} min={p.min_stock_alert} />
                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{p.unit}</div>
                      </td>
                      <td>
                        {p.selling_price ? (
                          <div className="price-badge" style={{ width: 50, height: 50 }}>
                            <img src={prixImg} alt="prix" className="price-badge-img" />
                            <div className="price-badge-content">
                              <span className="price-badge-value" style={{ fontSize: 13 }}>
                                {p.selling_price.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        {p.quantity_in_stock <= 0
                          ? <span className="badge badge-red">Rupture</span>
                          : p.quantity_in_stock <= p.min_stock_alert && p.min_stock_alert > 0
                          ? <span className="badge badge-orange">Faible</span>
                          : <span className="badge badge-green">En stock</span>}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setStockProduct(p)}>
                            Mouvement
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditProduct(p); setShowForm(true); }}>
                            Éditer
                          </button>
                          <button className="btn btn-danger btn-sm"
                            onClick={() => {
                              if (confirm(`Désactiver "${p.name}" ?`)) deleteMutation.mutate(p.id);
                            }}>
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && pagination.total_pages > 1 && (
              <div className="pagination">
                <span>Page {pagination.page} / {pagination.total_pages} — {pagination.total} résultats</span>
                <div className="pagination-btns">
                  <button className="btn btn-ghost btn-sm"
                    disabled={pagination.page === 1}
                    onClick={() => setFilter('page', pagination.page - 1)}>
                    <ChevronLeft size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm"
                    disabled={pagination.page === pagination.total_pages}
                    onClick={() => setFilter('page', pagination.page + 1)}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="product-grid">
            {products.map(p => (
              <div
                key={p.id}
                className="product-card"
                onClick={() => navigate(`/products/${p.id}`)}
                role="button"
                tabIndex={0}
                aria-label={`Voir détails du produit ${p.name}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-1)',
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Image Section */}
                <div style={{
                  position: 'relative',
                  height: 200,
                  background: 'var(--bg-2)',
                  overflow: 'hidden',
                }}>
                  {/* Price Badge - Top Right */}
                  {p.selling_price && (
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 10,
                      width: 75,
                      height: 75,
                      backgroundImage: `url(${prixImg})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{
                        color: 'white',
                        fontSize: 14,
                        fontWeight: 700,
                        textAlign: 'center',
                        lineHeight: 1,
                      }}>
                        {p.selling_price.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {p.image_url ? (
                    <img
                      className="product-card-img"
                      src={p.image_url}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-3)',
                    }}>
                      <Package size={56} strokeWidth={1.5} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Category */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: 'var(--text-2)',
                    fontWeight: 500,
                  }}>
                    <span style={{ fontSize: 16 }}>{p.sector?.icon}</span>
                    <span>{p.category?.name}</span>
                  </div>

                  {/* Product Name */}
                  <h3 style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--text-1)',
                    lineHeight: 1.4,
                    margin: 0,
                    flex: 1,
                  }}>
                    {p.name}
                  </h3>

                  {/* Variant */}
                  {p.variant && (
                    <div style={{
                      fontSize: 13,
                      color: 'var(--text-2)',
                      fontStyle: 'italic',
                    }}>
                      {p.variant}
                    </div>
                  )}

                  {/* Stock Indicator */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 8,
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Stock
                    </span>
                    <span style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: p.quantity_in_stock <= 0 
                        ? 'var(--red)' 
                        : p.quantity_in_stock <= p.min_stock_alert 
                          ? 'var(--orange)' 
                          : 'var(--green)',
                    }}>
                      {p.quantity_in_stock} {p.unit}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ProductFormModal
          product={editProduct}
          onClose={() => { setShowForm(false); setEditProduct(null); }}
          onSuccess={() => { setShowForm(false); setEditProduct(null); qc.invalidateQueries({ queryKey: ['products'] }); }}
        />
      )}

      {stockProduct && (
        <StockModal
          product={stockProduct}
          onClose={() => setStockProduct(null)}
          onSuccess={() => { setStockProduct(null); qc.invalidateQueries({ queryKey: ['products'] }); }}
        />
      )}
    </div>
  );
}