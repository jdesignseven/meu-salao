import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Scissors, DollarSign, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const monthStr = `${selectedYear}-${selectedMonth}`;
      const [statsRes, financialRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/overview`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/financial/summary?month=${monthStr}`, { headers: getAuthHeader() })
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (financialRes.ok) setFinancialSummary(await financialRes.json());
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, [selectedMonth, selectedYear]);

  if (loading) return <div style={{ padding: '24px', color: '#606060' }}>Carregando...</div>;
  if (!stats) return <div style={{ padding: '24px', color: '#d32f2f' }}>Erro ao carregar dados</div>;

  const chartData = financialSummary ? financialSummary.dailyFlow.map(d => ({
    date: d.date.split('-')[2],
    entrada: Math.round(d.entrada)
  })) : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#000', margin: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff' }}>
            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff' }}>
            {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Cards de Resumo */}
      {financialSummary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Receitas', value: `R$ ${financialSummary.totalReceitas.toFixed(2).replace('.', ',')}`, color: '#16a34a' },
            { label: 'Despesas', value: `R$ ${financialSummary.totalDespesas.toFixed(2).replace('.', ',')}`, color: '#dc2626' },
            { label: 'Saldo', value: `R$ ${financialSummary.saldo.toFixed(2).replace('.', ',')}`, color: financialSummary.saldo >= 0 ? '#16a34a' : '#dc2626' },
            { label: 'Contas a Pagar', value: financialSummary.overdueCount, color: '#f59e0b' }
          ].map((card, i) => (
            <div key={i} style={{ padding: '20px', background: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <p style={{ fontSize: '13px', color: '#606060', margin: '0 0 4px' }}>{card.label}</p>
              <p style={{ fontSize: '22px', fontWeight: 500, color: card.color, margin: 0 }}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Gráfico de Vendas */}
      <div style={{ background: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#000', margin: '0 0 16px' }}>Vendas do Mês</h3>
        <div style={{ height: '200px' }}>
          {chartData.length > 0 && chartData.some(d => d.entrada > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="entrada" fill="#002cd6" radius={[4, 4, 0, 0]} name="Vendas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
              Sem dados para o período
            </div>
          )}
        </div>
      </div>

      {/* Links Rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { to: '/clients', icon: Users, label: 'Clientes', count: stats.totalClients, color: '#002cd6' },
          { to: '/agenda', icon: Calendar, label: 'Agendamentos', count: `${stats.monthAppointments}/${stats.totalAppointments}`, color: '#10b981' },
          { to: '/services', icon: Scissors, label: 'Serviços', count: stats.totalServices, color: '#6366f1' },
          { to: '/employees', icon: DollarSign, label: 'Profissionais', count: stats.totalEmployees, color: '#f59e0b' }
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <Link key={i} to={item.to} style={{ textDecoration: 'none', padding: '20px', background: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '16px', color: '#000' }}>
              <div style={{ backgroundColor: item.color, padding: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={24} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: '24px', fontWeight: 500, margin: 0 }}>{item.count}</p>
                <p style={{ fontSize: '14px', color: '#606060', margin: '4px 0 0' }}>{item.label}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
