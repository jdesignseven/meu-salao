import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Calendar, ShoppingCart, Users, UserCircle2, 
  Trophy, Package, DollarSign, BarChart3, ShoppingBag, FolderOpen, 
  Search, Settings, Key, FileText, HelpCircle, ChevronRight, 
  LogOut, Menu, CreditCard
} from 'lucide-react';

const iconMap = {
  'Dashboard': LayoutDashboard,
  'Agendamento': Calendar,
  'Agenda': Calendar,
  'Caixa': ShoppingCart,
  'PDV / Caixa': ShoppingCart,
  'Gestão de Caixa': DollarSign,
  'Clientes': Users,
  'Profissional': UserCircle2,
  'Serviços': Trophy,
  'Produtos e Estoque': Package,
  'Financeiro': DollarSign,
  'Lançamentos': FileText,
  'Categorias': FolderOpen,
  'Contas': FolderOpen,
  'Formas de Pagamento': CreditCard,
  'Análise': BarChart3,
  'Compras': ShoppingBag,
  'Compra': ShoppingBag,
  'Fornecedor': FolderOpen,
  'Cadastros Gerais': FolderOpen,
  'Consulta': Search,
  'Configurações': Settings,
  'Permissões': Key,
  'NFS-e': FileText,
  'Ajuda': HelpCircle,
  'Comissões': DollarSign
};

const menuItems = [
  {
    label: 'Dashboard',
    icon: 'Dashboard',
    submenu: [
      { path: '/dashboard', label: 'Padrão' },
      { path: '/financeiro', label: 'Financeiro' },
      { path: '/dashboard/geral', label: 'Gráfico Geral' },
      { path: '/dashboard/vendas', label: 'Gráfico Agenda e Vendas' },
      { path: '/dashboard/financeiro-grafico', label: 'Gráfico do Financeiro' },
    ]
  },
  { path: '/agendamento', label: 'Agendamento Online', icon: 'Agendamento' },
  { path: '/agenda', label: 'Agenda', icon: 'Agenda' },
  { path: '/caixa', label: 'PDV / Caixa', icon: 'PDV / Caixa' },
  { path: '/caixa/gestao', label: 'Gestão de Caixa', icon: 'Gestão de Caixa' },
  { path: '/clients', label: 'Clientes', icon: 'Clientes' },
  { path: '/employees', label: 'Profissional', icon: 'Profissional' },
  { path: '/comissoes', label: 'Comissões', icon: 'Comissões' },
  { path: '/services', label: 'Serviços', icon: 'Serviços' },
  { path: '/products', label: 'Produtos e Estoque', icon: 'Produtos e Estoque' },
  {
    label: 'Financeiro',
    icon: 'Financeiro',
    submenu: [
      { path: '/financeiro', label: 'Dashboard' },
      { path: '/financeiro/lancamentos', label: 'Lançamentos' },
      { path: '/financeiro/categoria', label: 'Categorias' },
      { path: '/financeiro/conta', label: 'Contas' },
      { path: '/financeiro/formas-pagamento', label: 'Formas de Pagamento' },
    ]
  },
  {
    label: 'Análise',
    icon: 'Análise',
    submenu: [
      { path: '/analise/fluxo-anual', label: 'Fluxo de Caixa Anual' },
      { path: '/analise/fluxo-mensal', label: 'Fluxo de Caixa Mensal' },
    ]
  },
  {
    label: 'Compras',
    icon: 'Compras',
    submenu: [
      { path: '/compras/compra', label: 'Compra' },
      { path: '/compras/fornecedor', label: 'Fornecedor' },
    ]
  },
  {
    label: 'Cadastros Gerais',
    icon: 'Cadastros Gerais',
    submenu: [
      { path: '/cadastros/fichas', label: 'Anamnese, Fichas e Contratos' },
      { path: '/cadastros/campos-personalizados', label: 'Campo Personalizado' },
      { path: '/cadastros/como-conheceu', label: 'Como nos Conheceu' },
      { path: '/cadastros/equipamentos', label: 'Equipamentos' },
      { path: '/cadastros/feriados', label: 'Feriado' },
      { path: '/cadastros/grupo-servicos', label: 'Grupo de Serviços' },
      { path: '/cadastros/marcas', label: 'Marcas' },
      { path: '/cadastros/salas', label: 'Salas' },
    ]
  },
  {
    label: 'Consulta',
    icon: 'Consulta',
    submenu: [
      { path: '/consulta/agendas', label: 'Agendas' },
      { path: '/consulta/analise', label: 'Análise' },
      { path: '/consulta/auditoria-agenda', label: 'Auditoria Agenda' },
      { path: '/consulta/auditoria-fichas', label: 'Auditoria de Anamnese, Fichas e Contrato' },
      { path: '/consulta/auditoria-vendas', label: 'Auditoria de Vendas' },
      { path: '/consulta/comissao', label: 'Comissão Detalhada' },
      { path: '/consulta/comparativo', label: 'Comparativo de Períodos' },
      { path: '/consulta/demonstrativo', label: 'Demonstrativo' },
      { path: '/consulta/estoque', label: 'Estoque' },
      { path: '/consulta/pacotes', label: 'Pacote por Cliente' },
      { path: '/consulta/previsao-retorno', label: 'Previsão de Retorno' },
      { path: '/consulta/orcamentos', label: 'Orçamentos' },
      { path: '/consulta/vendas', label: 'Vendas' },
      { path: '/consulta/vendas-cliente', label: 'Vendas por Cliente' },
    ]
  },
  {
    label: 'Configurações',
    icon: 'Configurações',
    submenu: [
      { path: '/configuracoes/empresa', label: 'Dados da Empresa' },
      { path: '/configuracoes/configuracao', label: 'Configuração' },
      { path: '/configuracoes/sms', label: 'SMS' },
      { path: '/configuracoes/whatsapp', label: 'WhatsApp' },
      { path: '/configuracoes/senha', label: 'Alterar Senha' },
      { path: '/configuracoes/tutorial', label: 'Vídeos Tutoriais' },
      { path: '/configuracoes/unifica', label: 'Unifica Cliente' },
      { path: '/configuracoes/meios-pagamento', label: 'Meios de Pagamento' },
    ]
  },
  {
    label: 'Permissões',
    icon: 'Permissões',
    submenu: [
      { path: '/permissoes/grupos', label: 'Grupos de Acessos' },
    ]
  },
  {
    label: 'NFS-e',
    icon: 'NFS-e',
    submenu: [
      { path: '/nfse/configuracoes', label: 'Configurações' },
      { path: '/nfse/painel', label: 'Caixa de Saída' },
      { path: '/nfse/servico-municipal', label: 'Serviço Municipal' },
      { path: '/nfse/lista-servico', label: 'Lista de Serviço LC116' },
      { path: '/nfse/cnae', label: 'CNAE' },
    ]
  },
  {
    label: 'Ajuda',
    icon: 'Ajuda',
    submenu: [
      { path: '/ajuda/agenda-online', label: 'Como Ativar a Agenda Online?' },
      { path: '/ajuda/pacotes', label: 'Como Controlar Pacote ou Sessão?' },
      { path: '/ajuda/anamnese', label: 'Como Preencher Ficha de Anamnese?' },
      { path: '/ajuda/faq', label: 'Portal Dúvidas Frequentes' },
      { path: '/ajuda/tutorial', label: 'Vídeos Tutoriais' },
    ]
  },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openSubmenus, setOpenSubmenus] = useState({ 'Dashboard': true });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSubmenu = (label) => {
    setOpenSubmenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const isSubmenuActive = (submenu) => {
    return submenu.some(item => location.pathname === item.path);
  };

  const renderIcon = (iconName, size = 20) => {
    const Icon = iconMap[iconName];
    return Icon ? <Icon size={size} /> : <FolderOpen size={size} />;
  };

  return (
    <div className="app-container">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>beauty<span className="brand-suffix">sis</span></h2>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div key={item.path || item.label}>
              {item.submenu ? (
                <>
                  <div
                    onClick={() => toggleSubmenu(item.label)}
                    className={`nav-item ${isSubmenuActive(item.submenu) ? 'active' : ''}`}
                  >
                    <span className="nav-icon">{renderIcon(item.icon)}</span>
                    <span className="nav-label">{item.label}</span>
                    <span className={`arrow ${openSubmenus[item.label] ? 'open' : ''}`}>
                      <ChevronRight size={16} />
                    </span>
                  </div>
                  {openSubmenus[item.label] && (
                    <div className="sub-menu">
                      {item.submenu.map((sub) => (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          className={`nav-item sub-item ${isActive(sub.path) ? 'active' : ''}`}
                        >
                          <span className="nav-label">{sub.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.path}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                >
                  <span className="nav-icon">{renderIcon(item.icon)}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
          </div>
          <button onClick={handleLogout} className="btn-logout" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="top-bar">
          <button
            className="btn-toggle-sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={24} />
          </button>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
