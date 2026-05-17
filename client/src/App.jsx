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

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">Carregando...</div>
  return user ? children : <Navigate to="/login" />
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
        <PrivateRoute>
          <Layout>
            <FinancialDashboard />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/financeiro" element={
        <PrivateRoute>
          <Layout>
            <FinancialDashboard />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/financeiro/lancamentos" element={
        <PrivateRoute>
          <Layout>
            <FinancialTransactions />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/financeiro/categoria" element={
        <PrivateRoute>
          <Layout>
            <FinancialConfig />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/financeiro/conta" element={
        <PrivateRoute>
          <Layout>
            <FinancialConfig />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/financeiro/formas-pagamento" element={
        <PrivateRoute>
          <Layout>
            <FinancialConfig />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/comissoes" element={
        <PrivateRoute>
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
        <PrivateRoute>
          <Layout>
            <Employees />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/services" element={
        <PrivateRoute>
          <Layout>
            <Services />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/products" element={
        <PrivateRoute>
          <Layout>
            <Products />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/planos" element={
        <PrivateRoute>
          <Layout>
            <Plans />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/appointments" element={
        <PrivateRoute>
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
        <PrivateRoute>
          <Layout>
            <POS />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/caixa/gestao" element={
        <PrivateRoute>
          <Layout>
            <CashManagement />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/ajustes" element={
        <PrivateRoute>
          <Layout>
            <Settings />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/permissoes" element={
        <PrivateRoute>
          <Layout>
            <Permissions />
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  )
}

export default App
