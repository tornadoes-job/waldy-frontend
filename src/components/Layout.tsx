import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Package, Users, LayoutGrid, GitBranch, BarChart2 } from 'lucide-react';

const navItems = [
  { to: '/products', icon: Package, label: 'Produits' },
  { to: '/suppliers', icon: Users, label: 'Fournisseurs' },
  { to: '/categories', icon: LayoutGrid, label: 'Secteurs & Catégories' },
  { to: '/traceability', icon: GitBranch, label: 'Traçabilité' },
];

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <NavLink to="/" className="brand-logo">
            <span className="brand-badge">WAL</span>
            <span className="brand-text">Gestion<br />Produits</span>
          </NavLink>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section-label">Navigation</p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            WAL PMS v1.0
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}