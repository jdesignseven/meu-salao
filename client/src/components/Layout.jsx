import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Calendar, Users, UserCircle2,
  Scissors, Package, DollarSign, Percent,
  ShoppingCart, LogOut, Menu, ChevronRight, Settings as SettingsIcon
} from 'lucide-react';

const ROLE_LEVELS = { admin: 4, manager: 3, operator: 2, viewer: 1 };

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, minLevel: 1 },
  { path: '/agenda', label: 'Agenda', icon: Calendar, minLevel: 1 },
  { path: '/clients', label: 'Clientes', icon: Users, minLevel: 2 },
  { path: '/employees', label: 'Profissionais', icon: UserCircle2, minLevel: 3 },
  { path: '/services', label: 'Serviços', icon: Scissors, minLevel: 3 },
  { path: '/products', label: 'Produtos', icon: Package, minLevel: 3 },
  { path: '/financeiro', label: 'Financeiro', icon: DollarSign, minLevel: 3 },
  { path: '/comissoes', label: 'Comissões', icon: Percent, minLevel: 3 },
  { path: '/caixa', label: 'PDV / Caixa', icon: ShoppingCart, minLevel: 2 },
  { path: '/ajustes', label: 'Ajustes', icon: SettingsIcon, minLevel: 4 },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const canSee = (item) => {
    const userLevel = ROLE_LEVELS[user?.role] || 0;
    return userLevel >= item.minLevel;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Roboto', sans-serif" }}>
      <aside style={{
        width: sidebarOpen ? '240px' : '64px',
        backgroundColor: '#fff',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0', textAlign: sidebarOpen ? 'left' : 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#2196f3', fontFamily: "'Coolvetica Book', sans-serif" }}>
            {sidebarOpen ? 'beautysis' : 'b'}
          </div>
        </div>

        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {menuItems.filter(canSee).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  color: active ? '#2196f3' : '#404040',
                  backgroundColor: active ? '#e3f2fd' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: active ? 500 : 400,
                  borderLeft: active ? '3px solid #2196f3' : '3px solid transparent',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center'
                }}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid #e0e0e0' }}>
          {sidebarOpen ? (
            <>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#404040' }}>{user?.name}</div>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#606060',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px 0'
                }}
              >
                <LogOut size={16} />
                Sair
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                color: '#606060',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          height: '56px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          backgroundColor: '#fff'
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Menu size={24} color="#404040" />
          </button>
        </header>
        <main style={{ flex: 1, padding: '24px', backgroundColor: '#fafafa', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
