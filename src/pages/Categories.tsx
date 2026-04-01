import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, LayoutGrid, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { sectorsApi } from '../services/api';
import type { Sector, ProductCategory } from '../types';

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ code: '', name: '', description: '' });

  const { data: sectors = [] } = useQuery({ queryKey: ['sectors'], queryFn: sectorsApi.getAll });
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', selectedSector?.id],
    queryFn: () => sectorsApi.getCategories(selectedSector!.id),
    enabled: !!selectedSector,
  });

  const createCatMutation = useMutation({
    mutationFn: () => sectorsApi.createCategory({ ...catForm, sector_id: selectedSector!.id, code: catForm.code.toUpperCase() }),
    onSuccess: () => {
      toast.success('Catégorie créée');
      qc.invalidateQueries({ queryKey: ['categories'] });
      setShowCatForm(false);
      setCatForm({ code: '', name: '', description: '' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const previewCode = selectedSector && catForm.code
    ? `${selectedSector.wal_code}-${catForm.code.toUpperCase()}`
    : null;

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Secteurs & Catégories</h1>
          <p className="page-subtitle">Classification WAL des produits</p>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* SECTORS */}
          <div>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 14, fontWeight: 600 }}>Secteurs ({sectors?.length ?? 0})</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sectors?.map(s => (
                <div key={s.id}
                  style={{
                    background: selectedSector?.id === s.id ? 'var(--accent-bg)' : 'var(--bg-2)',
                    border: `1px solid ${selectedSector?.id === s.id ? 'var(--accent-border)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s',
                  }}
                  onClick={() => setSelectedSector(selectedSector?.id === s.id ? null : s)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: selectedSector?.id === s.id ? 'var(--accent)' : 'var(--text-1)' }}>
                        {s.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <span className="wal-badge" style={{ fontSize: 10 }}>{s.wal_code}</span>
                        {s.product_count !== undefined && (
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.product_count} produit(s)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
                </div>
              ))}
            </div>
          </div>

          {/* CATEGORIES */}
          <div>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 14, fontWeight: 600 }}>
                {selectedSector ? `Catégories — ${selectedSector.name}` : 'Sélectionnez un secteur'}
              </h2>
              {selectedSector && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowCatForm(true)}>
                  <Plus size={13} /> Nouvelle catégorie
                </button>
              )}
            </div>

            {!selectedSector ? (
              <div className="empty-state" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <LayoutGrid size={40} />
                <h3>Sélectionnez un secteur</h3>
                <p>Cliquez sur un secteur pour voir ses catégories</p>
              </div>
            ) : !categories?.length ? (
              <div className="empty-state" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <LayoutGrid size={40} />
                <h3>Aucune catégorie</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowCatForm(true)}>
                  <Plus size={13} /> Créer une catégorie
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {categories.map(c => (
                  <div key={c.id} style={{
                    background: 'var(--bg-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '12px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="wal-badge">{c.wal_code}</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                      </div>
                      {c.description && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{c.description}</div>}
                    </div>
                    {(c as ProductCategory & { product_count?: number }).product_count !== undefined && (
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {(c as ProductCategory & { product_count?: number }).product_count} produit(s)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add category form inline */}
            {showCatForm && selectedSector && (
              <div style={{
                marginTop: 12, background: 'var(--bg-2)', border: '1px solid var(--accent-border)',
                borderRadius: 'var(--radius-lg)', padding: 16
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Nouvelle catégorie — {selectedSector.name}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="form-grid form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Code (3 lettres) <span className="required">*</span></label>
                      <input className="form-input mono" maxLength={5}
                        value={catForm.code} onChange={e => setCatForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                        placeholder="RIZ, BOV, VET..." />
                      {previewCode && <span className="form-hint">→ <strong>{previewCode}</strong></span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nom <span className="required">*</span></label>
                      <input className="form-input" value={catForm.name}
                        onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Riz, Bovins, Vêtements..." />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Description</label>
                      <input className="form-input" value={catForm.description}
                        onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowCatForm(false)}>Annuler</button>
                    <button className="btn btn-primary btn-sm"
                      disabled={!catForm.code || !catForm.name || createCatMutation.isPending}
                      onClick={() => createCatMutation.mutate()}>
                      {createCatMutation.isPending ? <><div className="spinner" /></> : 'Créer'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}