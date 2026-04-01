import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { suppliersApi, sectorsApi } from '../services/api';
import type { Supplier } from '../types';
import SupplierFormModal from '../components/SupplierFormModal';

export default function SuppliersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);

  const { data: sectors = [] } = useQuery({ queryKey: ['sectors'], queryFn: sectorsApi.getAll });
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers', search, sectorFilter],
    queryFn: () => suppliersApi.getAll({ search, sector_id: sectorFilter || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: suppliersApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); toast.success('Fournisseur désactivé'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Fournisseurs</h1>
          <p className="page-subtitle">{suppliers?.length ?? 0} fournisseurs enregistrés</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditSupplier(null); setShowForm(true); }}>
          <Plus size={14} /> Nouveau fournisseur
        </button>
      </div>

      <div className="page-body">
        <div className="filters-bar">
          <div className="search-wrap">
            <Search size={14} />
            <input className="form-input" placeholder="Nom, code, ville..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}>
            <option value="">Tous les secteurs</option>
            {sectors?.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="loading-overlay"><div className="spinner" /> Chargement...</div>
        ) : !suppliers?.length ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>Aucun fournisseur</h3>
            <p>Ajoutez vos fournisseurs pour les associer aux produits.</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={14} /> Ajouter un fournisseur
            </button>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code WAL</th>
                    <th>Fournisseur</th>
                    <th>Contact</th>
                    <th>Téléphone</th>
                    <th>Ville</th>
                    <th>Secteur</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(s => (
                    <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/suppliers/${s.id}`)}>
                      <td><span className="wal-badge supplier">{s.code}</span></td>
                      <td className="name-cell">{s.name}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{s.contact_person || '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.phone || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.city || '—'}</td>
                      <td style={{ fontSize: 12 }}>
                        {(s as Supplier & { sector_icon?: string; sector_name?: string }).sector_icon}{' '}
                        {(s as Supplier & { sector_name?: string }).sector_name || '—'}
                      </td>
                      <td>
                        {s.is_active
                          ? <span className="badge badge-green">Actif</span>
                          : <span className="badge badge-gray">Inactif</span>}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm"
                            onClick={() => { setEditSupplier(s); setShowForm(true); }}>Éditer</button>
                          <button className="btn btn-danger btn-sm"
                            onClick={() => { if (confirm(`Désactiver "${s.name}" ?`)) deleteMutation.mutate(s.id); }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <SupplierFormModal supplier={editSupplier} onClose={() => { setShowForm(false); setEditSupplier(null); }}
          onSuccess={() => { setShowForm(false); setEditSupplier(null); qc.invalidateQueries({ queryKey: ['suppliers'] }); }} />
      )}
    </div>
  );
}