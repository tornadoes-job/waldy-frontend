import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { subProductsApi } from '../services/api';
import { UNITS, CURRENCIES } from '../types';

interface Props { productId: string; onClose: () => void; onSuccess: () => void; }

export default function SubProductModal({ productId, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ name: '', description: '', unit: 'kg', quantity_in_stock: '0', purchase_price: '', selling_price: '', currency: 'XOF', notes: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      return subProductsApi.create(productId, fd);
    },
    onSuccess: (res) => {
      toast.success(res.message || `Sous-produit créé : ${res.data?.wal_reference}`);
      onSuccess();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Nouveau sous-produit</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }}>
          <div className="modal-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Nom <span className="required">*</span></label>
                <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Ex: Son de riz, Brisures, Huile résiduelle..." required />
              </div>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Unité <span className="required">*</span></label>
                  <select className="form-select" value={form.unit} onChange={e => set('unit', e.target.value)}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Stock initial</label>
                  <input className="form-input" type="number" min="0" step="0.001"
                    value={form.quantity_in_stock} onChange={e => set('quantity_in_stock', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Prix achat</label>
                  <input className="form-input" type="number" min="0" step="0.01"
                    value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Prix vente</label>
                  <input className="form-input" type="number" min="0" step="0.01"
                    value={form.selling_price} onChange={e => set('selling_price', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Devise</label>
                  <select className="form-select" value={form.currency} onChange={e => set('currency', e.target.value)}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description}
                  onChange={e => set('description', e.target.value)} style={{ minHeight: 60 }} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? <><div className="spinner" /> Enregistrement...</> : 'Créer le sous-produit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}