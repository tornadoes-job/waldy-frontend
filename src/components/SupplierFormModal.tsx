import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { suppliersApi, sectorsApi } from '../services/api';
import type { Supplier } from '../types';

interface Props {
  supplier?: Supplier | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SupplierFormModal({ supplier, onClose, onSuccess }: Props) {
  const isEdit = !!supplier;

  const [form, setForm] = useState({
    sector_id: supplier?.sector_id || '',
    name: supplier?.name || '',
    contact_person: supplier?.contact_person || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    city: supplier?.city || '',
    country: supplier?.country || 'Burkina Faso',
  });

  const { data: sectors = [] } = useQuery({ queryKey: ['sectors'], queryFn: sectorsApi.getAll });

  const mutation = useMutation<{ success: boolean; data: Supplier; message?: string }, Error, typeof form>({
    mutationFn: (data) =>
      isEdit ? suppliersApi.update(supplier!.id, data).then(d => ({ success: true, data: d, message: undefined })) : suppliersApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Fournisseur mis à jour' : 'Fournisseur créé');
      onSuccess();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h2>{isEdit ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Secteur d'activité *</label>
            <select
              className="form-input"
              value={form.sector_id}
              onChange={e => setForm({ ...form, sector_id: e.target.value })}
              required
            >
              <option value="">Sélectionner un secteur</option>
              {sectors?.map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Nom du fournisseur *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Personne de contact</label>
            <input
              className="form-input"
              value={form.contact_person}
              onChange={e => setForm({ ...form, contact_person: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Téléphone</label>
              <input
                className="form-input"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ville *</label>
              <input
                className="form-input"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Pays</label>
              <input
                className="form-input"
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
