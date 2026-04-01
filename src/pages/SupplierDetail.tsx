import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, Users } from 'lucide-react';
import { suppliersApi } from '../services/api';

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => suppliersApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="loading-overlay"><div className="spinner" /></div>;
  if (!supplier) return <div className="empty-state"><Users size={48} /><h3>Fournisseur introuvable</h3></div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/suppliers')} style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Retour aux fournisseurs
          </button>
          <h1 className="page-title">{supplier.name}</h1>
          <div style={{ marginTop: 6 }}>
            <span className="wal-badge supplier">{supplier.code}</span>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Informations</div></div>
            <div className="card-body">
              <dl style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Nom', supplier.name],
                  ['Code WAL', <span className="wal-badge supplier">{supplier.code}</span>],
                  ['Contact', supplier.contact_person],
                  ['Téléphone', supplier.phone],
                  ['Email', supplier.email],
                  ['Adresse', supplier.address],
                  ['Ville', supplier.city],
                  ['Pays', supplier.country],
                  ['Notes', supplier.notes],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={String(label)} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <dt style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</dt>
                    <dd style={{ fontSize: 13, color: 'var(--text-1)' }}>{value as React.ReactNode}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Produits de ce fournisseur ({supplier.products?.length ?? 0})</div>
            </div>
            {!supplier.products?.length ? (
              <div className="empty-state"><Package size={40} /><h3>Aucun produit associé</h3></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Référence WAL</th>
                      <th>Produit</th>
                      <th>Secteur</th>
                      <th>Catégorie</th>
                      <th>Stock</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplier.products.map((p) => (
                      <tr key={p.id}>
                        <td><span className="wal-badge">{p.wal_reference}</span></td>
                        <td className="name-cell">
                          {p.name}
                          {p.variant && <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>{p.variant}</span>}
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {(p as typeof p & { sector_icon?: string }).sector_icon}{' '}
                          {(p as typeof p & { sector_name?: string }).sector_name}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                          {(p as typeof p & { category_name?: string }).category_name}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {p.quantity_in_stock} {p.unit}
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/products/${p.id}`)}>Voir →</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}