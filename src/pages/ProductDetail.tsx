import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Package, GitBranch, BarChart2, Plus, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { productsApi, subProductsApi } from '../services/api';
import { MOVEMENT_TYPES } from '../types';
import ProductFormModal from '../components/ProductFormModal';
import StockModal from '../components/StockModal';
import SubProductModal from '../components/SubProductModal';
import type { Product } from '../types';
import prixImg from '../assets/prix.png';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [tab, setTab] = useState<'info' | 'stock' | 'trace' | 'subproducts'>('info');
  const [showEdit, setShowEdit] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showSubProduct, setShowSubProduct] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(id!),
    enabled: !!id,
  });

  const { data: movements } = useQuery({
    queryKey: ['product-stock', id],
    queryFn: () => productsApi.getStockMovements(id!),
    enabled: !!id && tab === 'stock',
  });

  const { data: trace } = useQuery({
    queryKey: ['product-trace', id],
    queryFn: () => productsApi.getTraceability(id!),
    enabled: !!id && tab === 'trace',
  });

  const delSubProd = useMutation({
    mutationFn: subProductsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['product', id] }); toast.success('Sous-produit supprimé'); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="loading-overlay"><div className="spinner" /> Chargement...</div>;
  if (!product) return <div className="empty-state"><Package size={48} /><h3>Produit introuvable</h3></div>;

  const stockStatus = product.quantity_in_stock <= 0 ? 'red'
    : product.quantity_in_stock <= product.min_stock_alert && product.min_stock_alert > 0 ? 'orange' : 'green';

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/products')} style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Retour aux produits
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="page-title">{product.name}</h1>
            {product.variant && <span style={{ fontSize: 14, color: 'var(--text-3)' }}>— {product.variant}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <span className="wal-badge">{product.wal_reference}</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{product.sector?.icon} {product.sector?.name}</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>›</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{product.category?.name}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowStock(true)}>
            <TrendingUp size={14} /> Mouvement stock
          </button>
          <button className="btn btn-primary" onClick={() => setShowEdit(true)}>
            <Edit2 size={14} /> Modifier
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Stock actuel</div>
            <div className={`stat-value ${stockStatus}`}>{product.quantity_in_stock}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{product.unit}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Alerte seuil</div>
            <div className="stat-value" style={{ color: 'var(--text-2)' }}>{product.min_stock_alert}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{product.unit}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Prix achat</div>
            <div className="stat-value" style={{ fontSize: 18 }}>
              {product.purchase_price ? `${product.purchase_price.toLocaleString()}` : '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{product.currency}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Prix vente</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {product.selling_price ? (
                <div className="price-badge">
                  <img src={prixImg} alt="prix" className="price-badge-img" />
                  <div className="price-badge-content">
                    <span className="price-badge-value">
                      {product.selling_price.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{product.currency}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Sous-produits</div>
            <div className="stat-value">{product.sub_products?.length ?? 0}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[
            { key: 'info', label: 'Informations', icon: Package },
            { key: 'subproducts', label: `Sous-produits (${product.sub_products?.length ?? 0})`, icon: GitBranch },
            { key: 'stock', label: 'Historique stock', icon: BarChart2 },
            { key: 'trace', label: 'Traçabilité', icon: GitBranch },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} className={`tab-btn${tab === key ? ' active' : ''}`}
              onClick={() => setTab(key as typeof tab)}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* INFO */}
        {tab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <div className="card-header"><div className="card-title">Identité Produit</div></div>
              <div className="card-body">
                {product.image_url && (
                  <img src={product.image_url} alt={product.name}
                    style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 'var(--radius)', marginBottom: 16, background: 'var(--bg-3)' }} />
                )}
                <dl style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['Référence WAL', <span className="wal-badge">{product.wal_reference}</span>],
                    ['Nom', product.name],
                    ['Variante', product.variant || '—'],
                    ['Description', product.description || '—'],
                    ['Code-barres', product.barcode ? <span className="text-mono">{product.barcode}</span> : '—'],
                    ['N° Lot', product.batch_number || '—'],
                    ['Pays d\'origine', product.origin_country || '—'],
                    ['Région', product.origin_region || '—'],
                    ['Date expiration', product.expiry_date ? format(new Date(product.expiry_date), 'dd MMM yyyy', { locale: fr }) : '—'],
                    ['Notes', product.notes || '—'],
                  ].map(([label, value]) => (
                    <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                      <dt style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>{label}</dt>
                      <dd style={{ fontSize: 13, color: 'var(--text-1)', textAlign: 'right' }}>{value as React.ReactNode}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <div className="card-header"><div className="card-title">Fournisseur</div></div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <span className="wal-badge supplier">{product.supplier?.code}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{product.supplier?.name}</div>
                    {[
                      ['Contact', product.supplier?.contact_person],
                      ['Email', product.supplier?.email],
                      ['Téléphone', product.supplier?.phone],
                      ['Ville', product.supplier?.city],
                      ['Pays', product.supplier?.country],
                    ].filter(([, v]) => v).map(([label, value]) => (
                      <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
                        <span style={{ fontSize: 13 }}>{value}</span>
                      </div>
                    ))}
                    <button className="btn btn-secondary btn-sm" style={{ marginTop: 8, width: '100%' }}
                      onClick={() => navigate(`/suppliers/${product.supplier_id}`)}>
                      Voir le fournisseur →
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Classification WAL</div></div>
                <div className="card-body">
                  <div className="trace-chain" style={{ flexDirection: 'column', gap: 10 }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>SECTEUR</div>
                      <span className="wal-badge">{product.sector?.wal_code}</span>
                      <span style={{ fontSize: 13, marginLeft: 8 }}>{product.sector?.icon} {product.sector?.name}</span>
                    </div>
                    <div style={{ width: '100%' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>CATÉGORIE</div>
                      <span className="wal-badge">{product.category?.wal_code}</span>
                      <span style={{ fontSize: 13, marginLeft: 8 }}>{product.category?.name}</span>
                    </div>
                    <div style={{ width: '100%' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>PRODUIT</div>
                      <span className="wal-badge">{product.wal_reference}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-PRODUCTS */}
        {tab === 'subproducts' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Sous-produits de {product.name}</div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowSubProduct(true)}>
                <Plus size={13} /> Ajouter
              </button>
            </div>
            {!product.sub_products?.length ? (
              <div className="empty-state">
                <GitBranch size={40} />
                <h3>Aucun sous-produit</h3>
                <p>Ex : pour le mil : mil décortiqué, son de mil, farine de mil, etc.</p>
                <button className="btn btn-primary" onClick={() => setShowSubProduct(true)}>
                  <Plus size={14} /> Ajouter un sous-produit
                </button>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Référence WAL</th>
                      <th>Nom</th>
                      <th>Stock</th>
                      <th>Prix Vente</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.sub_products.map((sp, idx) => (
                      <tr key={sp.id} style={{ background: idx % 2 === 0 ? 'var(--bg-2)' : 'transparent' }}>
                        <td><span className="wal-badge subproduct">{sp.wal_reference}</span></td>
                        <td className="name-cell">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: 'var(--text-3)', fontSize: 10 }}>└─</span>
                            <span>{sp.name}</span>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{sp.quantity_in_stock} {sp.unit}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {sp.selling_price ? `${sp.selling_price.toLocaleString()} ${sp.currency}` : '—'}
                        </td>
                        <td>
                          <button className="btn btn-danger btn-sm"
                            onClick={() => {
                              if (confirm(`Supprimer "${sp.name}" ?`)) delSubProd.mutate(sp.id);
                            }}>
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* STOCK HISTORY */}
        {tab === 'stock' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Historique des mouvements</div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowStock(true)}>
                <Plus size={13} /> Nouveau mouvement
              </button>
            </div>
            {!movements?.length ? (
              <div className="empty-state"><BarChart2 size={40} /><h3>Aucun mouvement enregistré</h3></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Quantité</th>
                      <th>Avant</th>
                      <th>Après</th>
                      <th>Référence doc</th>
                      <th>Motif</th>
                      <th>Opérateur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map(m => {
                      const mt = MOVEMENT_TYPES[m.movement_type];
                      return (
                        <tr key={m.id}>
                          <td style={{ fontSize: 12 }}>{format(new Date(m.created_at), 'dd/MM/yy HH:mm')}</td>
                          <td><span className="badge" style={{ background: `${mt.color}18`, color: mt.color }}>{mt.label}</span></td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: m.movement_type === 'EXIT' ? 'var(--red)' : 'var(--green)' }}>
                            {m.movement_type === 'EXIT' ? '-' : '+'}{m.quantity} {m.unit}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{m.stock_before}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{m.stock_after}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{m.reference_doc || '—'}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{m.reason || '—'}</td>
                          <td style={{ fontSize: 12 }}>{m.operator_name || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TRACEABILITY */}
        {tab === 'trace' && trace && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">🔗 Chaîne de traçabilité WAL complète</div>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
                  {[
                    { level: 'FOURNISSEUR', code: trace.supplier?.code, name: trace.supplier?.name, type: 'supplier' },
                    null,
                    { level: 'SECTEUR', code: trace.wal_chain.sector, name: trace.sector?.name, type: 'sector' },
                    null,
                    { level: 'CATÉGORIE', code: trace.wal_chain.category, name: trace.category?.name, type: 'category' },
                    null,
                    { level: 'PRODUIT', code: trace.wal_chain.product, name: trace.product?.name, type: 'product' },
                    ...(trace.wal_chain.sub_products.flatMap((sp: string) => [null, { level: 'SOUS-PRODUIT', code: sp, name: '', type: 'subproduct' }])),
                  ].map((node, i) =>
                    node === null ? (
                      <div key={i} className="trace-arrow">→</div>
                    ) : (
                      <div key={i} className="trace-node">
                        <span className="level">{node.level}</span>
                        <span className={`wal-badge${node.type === 'supplier' ? ' supplier' : node.type === 'subproduct' ? ' subproduct' : ''}`}>
                          {node.code}
                        </span>
                        {node.name && <span style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{node.name}</span>}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card">
                <div className="card-header"><div className="card-title">Fournisseur d'origine</div></div>
                <div className="card-body">
                  <span className="wal-badge supplier">{trace.supplier?.code}</span>
                  <div style={{ fontSize: 16, fontWeight: 600, marginTop: 10 }}>{trace.supplier?.name}</div>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {trace.supplier?.phone && <div style={{ fontSize: 13 }}>📞 {trace.supplier.phone}</div>}
                    {trace.supplier?.email && <div style={{ fontSize: 13 }}>✉️ {trace.supplier.email}</div>}
                    {trace.supplier?.city && <div style={{ fontSize: 13 }}>📍 {trace.supplier.city}, {trace.supplier.country}</div>}
                  </div>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 14, width: '100%' }}
                    onClick={() => navigate(`/suppliers/${trace.supplier?.id}`)}>
                    Voir tous ses produits →
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Résumé traçabilité</div></div>
                <div className="card-body">
                  {[
                    ['N° Lot', trace.product.batch_number],
                    ['Origine', [trace.product.origin_country, trace.product.origin_region].filter(Boolean).join(', ')],
                    ['Date exp.', trace.product.expiry_date ? format(new Date(trace.product.expiry_date), 'dd MMM yyyy', { locale: fr }) : null],
                    ['Mouvements', `${trace.movements?.length ?? 0} enregistré(s)`],
                    ['Sous-produits', `${trace.sub_products?.length ?? 0}`],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showEdit && (
        <ProductFormModal product={product} onClose={() => setShowEdit(false)}
          onSuccess={() => { setShowEdit(false); qc.invalidateQueries({ queryKey: ['product', id] }); }} />
      )}

      {showStock && (
        <StockModal product={product} onClose={() => setShowStock(false)}
          onSuccess={() => { setShowStock(false); qc.invalidateQueries({ queryKey: ['product', id] }); qc.invalidateQueries({ queryKey: ['product-stock', id] }); }} />
      )}

      {showSubProduct && (
        <SubProductModal productId={id!} onClose={() => setShowSubProduct(false)}
          onSuccess={() => { setShowSubProduct(false); qc.invalidateQueries({ queryKey: ['product', id] }); }} />
      )}
    </div>
  );
}