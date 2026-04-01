import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi, sectorsApi, suppliersApi } from '../services/api';
import type { Product } from '../types';
import { UNITS } from '../types';
import prixImg from '../assets/prix.png';

interface Props {
  product?: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductFormModal({ product, onClose, onSuccess }: Props) {
  const isEdit = !!product;
  const imgRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    sector_id: product?.sector_id || '',
    category_id: product?.category_id || '',
    supplier_id: product?.supplier_id || '',
    name: product?.name || '',
    variant: product?.variant || '',
    unit: product?.unit || 'kg',
    quantity_in_stock: product?.quantity_in_stock?.toString() || '0',
    min_stock_alert: product?.min_stock_alert?.toString() || '0',
    purchase_price: product?.purchase_price?.toString() || '',
    selling_price: product?.selling_price?.toString() || '',
  });

  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string>(product?.image_url || '');

  const { data: sectors = [] } = useQuery({ queryKey: ['sectors'], queryFn: sectorsApi.getAll });
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', form.sector_id],
    queryFn: () => sectorsApi.getCategories(form.sector_id),
    enabled: !!form.sector_id,
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: (fd: FormData) => isEdit ? productsApi.update(product!.id, fd) : productsApi.create(fd),
    onSuccess: (res) => {
      toast.success(res.message || (isEdit ? 'Produit mis à jour' : `Produit créé : ${res.data?.wal_reference}`));
      onSuccess();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgFile(f);
    setImgPreview(URL.createObjectURL(f));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sector_id || !form.category_id || !form.supplier_id || !form.name) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (imgFile) fd.append('image', imgFile);
    mutation.mutate(fd);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">
              {isEdit ? `Modifier — ${product!.wal_reference}` : 'Nouveau Produit'}
            </div>
            {!isEdit && (
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                Le code WAL sera généré automatiquement
              </div>
            )}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Secteur */}
            <div>
              <label className="form-label">Secteur <span className="required">*</span></label>
              <div className="sector-grid" style={{ marginTop: 8 }}>
                {sectors?.map(s => (
                  <div key={s.id}
                    className={`sector-card-pick${form.sector_id === s.id ? ' selected' : ''}`}
                    onClick={() => { set('sector_id', s.id); set('category_id', ''); }}>
                    <div className="icon">{s.icon}</div>
                    <div className="name">{s.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-grid form-grid-2">
              {/* Catégorie */}
              <div className="form-group">
                <label className="form-label">Catégorie <span className="required">*</span></label>
                <select className="form-select" value={form.category_id}
                  onChange={e => set('category_id', e.target.value)}
                  disabled={!form.sector_id}>
                  <option value="">— Choisir —</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Fournisseur */}
              <div className="form-group">
                <label className="form-label">Fournisseur <span className="required">*</span></label>
                <select className="form-select" value={form.supplier_id}
                  onChange={e => set('supplier_id', e.target.value)}>
                  <option value="">— Choisir —</option>
                  {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Nom du produit */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Nom du produit <span className="required">*</span></label>
                <input className="form-input" value={form.name}
                  onChange={e => set('name', e.target.value)} placeholder="Ex: Riz parfumé" />
              </div>

              {/* Variante */}
              <div className="form-group">
                <label className="form-label">Variante</label>
                <input className="form-input" value={form.variant}
                  onChange={e => set('variant', e.target.value)} placeholder="Ex: Long grain" />
              </div>

              {/* Unité */}
              <div className="form-group">
                <label className="form-label">Unité <span className="required">*</span></label>
                <select className="form-select" value={form.unit} onChange={e => set('unit', e.target.value)}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              {/* Stock */}
              <div className="form-group">
                <label className="form-label">Quantité en stock</label>
                <input className="form-input" type="number" min="0" step="0.001"
                  value={form.quantity_in_stock} onChange={e => set('quantity_in_stock', e.target.value)} />
              </div>

              {/* Seuil alerte */}
              <div className="form-group">
                <label className="form-label">Seuil alerte</label>
                <input className="form-input" type="number" min="0" step="0.001"
                  value={form.min_stock_alert} onChange={e => set('min_stock_alert', e.target.value)} />
              </div>

              {/* Prix d'achat */}
              <div className="form-group">
                <label className="form-label">Prix d'achat</label>
                <input className="form-input" type="number" min="0" step="0.01"
                  value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} />
              </div>

              {/* Prix de vente avec badge */}
              <div className="price-input-group">
                <div className="form-group">
                  <label className="form-label">Prix de vente <span className="required">*</span></label>
                  <input className="form-input" type="number" min="0" step="0.01"
                    value={form.selling_price} onChange={e => set('selling_price', e.target.value)} />
                </div>
                {form.selling_price && (
                  <div className="price-preview">
                    <div className="price-badge">
                      <img src={prixImg} alt="prix" className="price-badge-img" />
                      <div className="price-badge-content">
                        <span className="price-badge-value">
                          {Number(form.selling_price).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Image */}
            <div className="form-group">
              <label className="form-label">Photo du produit</label>
              <div className={`image-upload-area${imgPreview ? ' has-image' : ''}`}
                onClick={() => imgRef.current?.click()}>
                {imgPreview
                  ? <img className="image-preview" src={imgPreview} alt="preview" />
                  : <>
                      <Upload size={28} style={{ color: 'var(--text-3)', marginBottom: 8 }} />
                      <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
                        Cliquer pour ajouter une image
                      </div>
                    </>
                }
              </div>
              <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImg} />
              {imgPreview && (
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 6 }}
                  onClick={() => { setImgPreview(''); setImgFile(null); }}>
                  Supprimer l'image
                </button>
              )}
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? <><div className="spinner" /> Enregistrement...</> : isEdit ? 'Mettre à jour' : 'Créer le produit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}