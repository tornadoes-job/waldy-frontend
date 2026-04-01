import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, TrendingUp, TrendingDown, RefreshCw, CornerUpLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi } from '../services/api';
import type { Product } from '../types';
import { MOVEMENT_TYPES } from '../types';

interface Props {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

const TYPE_ICONS = {
  ENTRY: TrendingUp,
  EXIT: TrendingDown,
  ADJUSTMENT: RefreshCw,
  RETURN: CornerUpLeft,
};

export default function StockModal({ product, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    movement_type: 'ENTRY',
    quantity: '',
    unit: product.unit,
    unit_price: '',
    reference_doc: '',
    reason: '',
    operator_name: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => productsApi.recordStockMovement(product.id, {
      movement_type: form.movement_type,
      quantity: parseFloat(form.quantity),
      unit: form.unit,
      unit_price: form.unit_price ? parseFloat(form.unit_price) : undefined,
      reference_doc: form.reference_doc,
      reason: form.reason,
      operator_name: form.operator_name,
    }),
    onSuccess: () => {
      toast.success('Mouvement de stock enregistré');
      onSuccess();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.quantity || parseFloat(form.quantity) <= 0) {
      toast.error('La quantité doit être supérieure à 0');
      return;
    }
    mutation.mutate();
  };

  const previewStock = () => {
    const qty = parseFloat(form.quantity) || 0;
    const cur = product.quantity_in_stock;
    if (form.movement_type === 'ENTRY' || form.movement_type === 'RETURN') return cur + qty;
    if (form.movement_type === 'EXIT') return cur - qty;
    return qty;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Mouvement de stock</div>
            <div style={{ marginTop: 4 }}>
              <span className="wal-badge">{product.wal_reference}</span>
              {' '}<span style={{ fontSize: 13, color: 'var(--text-2)' }}>{product.name}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Current stock */}
            <div style={{
              background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
              padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>STOCK ACTUEL</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {product.quantity_in_stock} <span style={{ fontSize: 14, color: 'var(--text-3)' }}>{product.unit}</span>
                </div>
              </div>
              {form.quantity && parseFloat(form.quantity) > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>APRÈS MOUVEMENT</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)',
                    color: previewStock() < 0 ? 'var(--red)' : previewStock() <= product.min_stock_alert ? 'var(--orange)' : 'var(--green)' }}>
                    {previewStock().toFixed(2)} <span style={{ fontSize: 14, color: 'var(--text-3)' }}>{form.unit}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Type selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
              {(Object.entries(MOVEMENT_TYPES) as [string, { label: string; color: string }][]).map(([key, { label, color }]) => {
                const Icon = TYPE_ICONS[key as keyof typeof TYPE_ICONS];
                return (
                  <button key={key} type="button"
                    style={{
                      padding: '10px 8px', border: `2px solid ${form.movement_type === key ? color : 'var(--border)'}`,
                      borderRadius: 'var(--radius)', background: form.movement_type === key ? `${color}18` : 'var(--bg-3)',
                      cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                    }}
                    onClick={() => set('movement_type', key)}>
                    <Icon size={16} style={{ color, marginBottom: 4 }} />
                    <div style={{ fontSize: 11, fontWeight: 600, color: form.movement_type === key ? color : 'var(--text-2)' }}>
                      {label}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Quantité <span className="required">*</span></label>
                  <input className="form-input" type="number" min="0.001" step="0.001"
                    value={form.quantity} onChange={e => set('quantity', e.target.value)}
                    autoFocus placeholder="0.000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Unité</label>
                  <input className="form-input" value={form.unit} onChange={e => set('unit', e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Prix unitaire</label>
                <input className="form-input" type="number" min="0" step="0.01"
                  value={form.unit_price} onChange={e => set('unit_price', e.target.value)}
                  placeholder={`en ${product.currency}`} />
              </div>

              <div className="form-group">
                <label className="form-label">N° Document de référence</label>
                <input className="form-input mono" value={form.reference_doc}
                  onChange={e => set('reference_doc', e.target.value)} placeholder="BL-2024-001, FAC-123..." />
              </div>

              <div className="form-group">
                <label className="form-label">Motif / Raison</label>
                <input className="form-input" value={form.reason}
                  onChange={e => set('reason', e.target.value)} placeholder="Livraison fournisseur, vente client..." />
              </div>

              <div className="form-group">
                <label className="form-label">Opérateur</label>
                <input className="form-input" value={form.operator_name}
                  onChange={e => set('operator_name', e.target.value)} placeholder="Nom de la personne..." />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? <><div className="spinner" /> Enregistrement...</> : 'Enregistrer le mouvement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}