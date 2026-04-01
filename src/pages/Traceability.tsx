import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Search, ArrowRight, Package, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi } from '../services/api';
import type { Product } from '../types';

export default function TraceabilityPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'wal' | 'supplier' | null>(null);

  const handleSearch = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const upperCode = code.trim().toUpperCase();

      // Detect if it's a supplier code (starts with W/FRN)
      const isSupplierCode = upperCode.startsWith('W/FRN');
      
      // Validate supplier code format if it looks like a supplier code
      if (isSupplierCode && !/^W\/FRN-\d{4}$/i.test(upperCode)) {
        toast.error('Format de code fournisseur invalide. Utilisez le format W/FRN-XXXX (ex: W/FRN-0001)');
        setResults([]);
        setSearchType('supplier');
        setLoading(false);
        return;
      }
      
      setSearchType(isSupplierCode ? 'supplier' : 'wal');

      const data = isSupplierCode
        ? await productsApi.getBySupplierCode(upperCode)
        : await productsApi.searchByCode(upperCode);

      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const examples = ['W/AGR/RIZ', 'W/ELV/BOV', 'W/PEC/POI', 'W/HAB/VET'];
  const supplierExamples = ['W/FRN-0001', 'W/FRN-0002'];

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Traçabilité</h1>
          <p className="page-subtitle">Remontez un produit jusqu'à son fournisseur via le code WAL</p>
        </div>
      </div>

      <div className="page-body">
        {/* WAL CHAIN EXPLAINER */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><div className="card-title">🔗 Comment fonctionne le code WAL ?</div></div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', marginBottom: 16 }}>
              {[
                { code: 'W/', desc: 'Préfixe WAL', color: 'var(--accent)' },
                { code: 'AGR', desc: 'Secteur', color: 'var(--blue)' },
                { code: '/', desc: '', color: 'var(--text-3)' },
                { code: 'RIZ', desc: 'Catégorie', color: 'var(--green)' },
                { code: '-', desc: '', color: 'var(--text-3)' },
                { code: '001', desc: 'N° séquence', color: 'var(--orange)' },
                { code: '-SP01', desc: 'Sous-produit', color: 'var(--text-3)' },
              ].map(({ code: c, desc, color }, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color }}>{c}</span>
                  {desc && <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{desc}</span>}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { example: 'W/FRN-0001', desc: 'Fournisseur numéro 1' },
                { example: 'W/AGR/RIZ-001', desc: 'Produit : Riz (1er enregistré)' },
                { example: 'W/AGR/RIZ-001-SP01', desc: 'Sous-produit : Son de riz' },
              ].map(({ example, desc }) => (
                <div key={example} style={{
                  background: 'var(--bg-3)', borderRadius: 'var(--radius)',
                  padding: '10px 14px', border: '1px solid var(--border)'
                }}>
                  <span className="wal-badge" style={{ display: 'block', marginBottom: 6 }}>{example}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><div className="card-title">Rechercher par code WAL</div></div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <input
                className="form-input mono"
                style={{ flex: 1, fontSize: 16, letterSpacing: '0.05em', borderColor: code.trim().toUpperCase().startsWith('W/FRN') ? 'var(--accent)' : undefined }}
                placeholder="W/AGR/RIZ ou W/FRN-0001..."
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              />
              <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                {loading ? <div className="spinner" /> : <Search size={15} />}
                Rechercher
              </button>
            </div>
            {code.trim().toUpperCase().startsWith('W/FRN') && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={12} />
                <strong>Recherche par fournisseur</strong> — Tous les produits de ce fournisseur seront affichés
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Exemples :</span>
              {examples.map(ex => (
                <button key={ex} className="wal-badge" style={{ cursor: 'pointer', border: 'none' }}
                  onClick={() => { setCode(ex); }}>
                  {ex}
                </button>
              ))}
              <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8 }}>Fournisseur :</span>
              {supplierExamples.map(ex => (
                <button key={ex} className="wal-badge supplier" style={{ cursor: 'pointer', border: 'none' }}
                  onClick={() => { setCode(ex); }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RESULTS */}
        {searched && (
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {searchType === 'supplier' ? <Users size={18} /> : <GitBranch size={18} />}
                {results.length > 0
                  ? searchType === 'supplier'
                    ? `${results.length} produit(s) du fournisseur "${code}"`
                    : `${results.length} produit(s) trouvé(s) pour "${code}"`
                  : `Aucun résultat pour "${code}"`
                }
              </div>
            </div>
            {!results.length ? (
              <div className="empty-state">
                <Package size={40} />
                <h3>Aucun produit trouvé</h3>
                {searchType === 'supplier' && (
                  <p style={{ color: 'var(--text-3)', marginTop: 8 }}>
                    Ce fournisseur n'a aucun produit enregistré ou le code est incorrect.
                  </p>
                )}
              </div>
            ) : (
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
                      <th>Traçabilité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(p => (
                      <tr key={p.id}>
                        <td><span className="wal-badge">{p.wal_reference}</span></td>
                        <td className="name-cell">
                          {p.name}
                          {p.variant && <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>{p.variant}</span>}
                        </td>
                        <td>{p.sector?.icon} {p.sector?.name}</td>
                        <td style={{ color: 'var(--text-2)' }}>{p.category?.name}</td>
                        <td>
                          <div style={{ fontSize: 12 }}>{p.supplier?.name}</div>
                          <span className="wal-badge supplier" style={{ fontSize: 9 }}>{p.supplier?.code}</span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {p.quantity_in_stock} {p.unit}
                        </td>
                        <td>
                          <button className="btn btn-primary btn-sm"
                            onClick={() => navigate(`/products/${p.id}?tab=trace`)}>
                            Voir trace <ArrowRight size={12} />
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
      </div>
    </div>
  );
}