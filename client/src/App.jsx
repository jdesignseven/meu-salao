import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Agendamento from './pages/Agendamento'
import Login from './pages/Login'
import Register from './pages/Register'
import PreRegister from './pages/PreRegister'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Employees from './pages/Employees'
import Services from './pages/Services'
import Products from './pages/Products'
import Plans from './pages/Plans'
import Appointments from './pages/Appointments'
import Calendar from './pages/Calendar'
import FinancialDashboard from './pages/FinancialDashboard'
import FinancialTransactions from './pages/FinancialTransactions'
import FinancialConfig from './pages/FinancialConfig'
import Commissions from './pages/Commissions'
import POS from './pages/POS'
import CashManagement from './pages/CashManagement'
import Settings from './pages/Settings'
import Permissions from './pages/Permissions'

const ROLE_LEVELS = { admin: 4, manager: 3, operator: 2, viewer: 1 }

function PrivateRoute({ children, minLevel = 1 }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">Carregando...</div>
  if (!user) return <Navigate to="/login" />
  const userLevel = ROLE_LEVELS[user.role] || 0
  if (userLevel < minLevel) return <Navigate to="/dashboard" />
  return children
}

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/agendamento" element={<Agendamento />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/pre-register" element={<PreRegister />} />
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/dashboard/financeiro" element={
        <PrivateRoute minLevel={3}>
          <Layout>
            <FinancialDashboard />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/financeiro" element={
        <PrivateRoute minLevel={3}>
          <Layout>
            <FinancialDashboard />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/financeiro/lancamentos" element={
        <PrivateRoute minLevel={3}>
          <Layout>
            <FinancialTransactions />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/financeiro/categoria" element={
        <PrivateRoute minLevel={3}>
          <Layout>
            <FinancialConfig />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/financeiro/conta" element={
        <PrivateRoute minLevel={3}>
          <Layout>
            <FinancialConfig />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/financeiro/formas-pagamento" element={
        <PrivateRoute minLevel={3}>
          <Layout>
            <FinancialConfig />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/comissoes" element={
        <PrivateRoute minLevel={3}>
          <Layout>
            <Commissions />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/dashboard/geral" element={
        <PrivateRoute>
          <Layout>
            <div className="page-content-wrapper"><div className="page-content"><h1>Gráfico Geral</h1><p>Em desenvolvimento...</p></div></div>
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/dashboard/vendas" element={
        <PrivateRoute>
          <Layout>
            <div className="page-content-wrapper"><div className="page-content"><h1>Gráfico Agenda e Vendas</h1><p>Em desenvolvimento...</p></div></div>
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/dashboard/financeiro-grafico" element={
        <PrivateRoute>
          <Layout>
            <div className="page-content-wrapper"><div className="page-content"><h1>Gráfico do Financeiro</h1><p>Em desenvolvimento...</p></div></div>
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/clients" element={
        <PrivateRoute>
          <Layout>
            <Clients />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/employees" element={
        <PrivateRoute minLevel={3}>
          <Layout>
            <Employees />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/services" element={
        <PrivateRoute minLevel={3}>
          <Layout>
            <Services />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/products" element={
        <PrivateRoute minLevel={3}>
          <Layout>
            <Products />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/planos" element={
        <PrivateRoute minLevel={4}>
          <Layout>
            <Plans />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/appointments" element={
        <PrivateRoute minLevel={2}>
          <Layout>
            <Appointments />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/agenda" element={
        <PrivateRoute>
          <Layout>
            <Calendar />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/caixa" element={
        <PrivateRoute minLevel={2}>
          <Layout>
            <POS />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/caixa/gestao" element={
        <PrivateRoute minLevel={2}>
          <Layout>
            <CashManagement />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/ajustes" element={
        <PrivateRoute minLevel={4}>
          <Layout>
            <Settings />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/permissoes" element={
        <PrivateRoute minLevel={4}>
          <Layout>
            <Permissions />
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  )
}

export default App
