import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cake, DollarSign, TrendingUp, Users, Calendar, Trophy, UserCircle2, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend } from 'recharts';

const API_URL = 'http://localhost:3001/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#06b6d4', '#d946ef'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  if (loading) return <div className="loading">Carregando...</div>;
  if (!stats) return <div className="error">Erro ao carregar dados</div>;

  const dailyFlowData = financialSummary ? financialSummary.dailyFlow.map(d => ({
    ...d,
    date: d.date.split('-')[2],
    entrada: Math.round(d.entrada),
    saida: Math.round(d.saida),
    saldo: Math.round(d.saldo)
  })) : [];

  const categoryData = financialSummary ? financialSummary.byCategory.map(c => ({
    name: c.name,
    value: Math.round(c.total),
    color: c.color || '#3b82f6'
  })) : [];

  const monthLabel = new Date(`${selectedYear}-${selectedMonth}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', background: 'white'}}>
            {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', background: 'white'}}>
            {[2026, 2025, 2024, 2023, 2022].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Cards de Resumo Financeiro */}
      {financialSummary && (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px'}}>
          <div style={{padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <p style={{fontSize: '13px', color: '#6b7280', margin: '0 0 4px'}}>Receitas</p>
            <p style={{fontSize: '22px', fontWeight: 700, color: '#16a34a', margin: 0}}>R$ {financialSummary.totalReceitas.toFixed(2).replace('.', ',')}</p>
          </div>
          <div style={{padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <p style={{fontSize: '13px', color: '#6b7280', margin: '0 0 4px'}}>Despesas</p>
            <p style={{fontSize: '22px', fontWeight: 700, color: '#dc2626', margin: 0}}>R$ {financialSummary.totalDespesas.toFixed(2).replace('.', ',')}</p>
          </div>
          <div style={{padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <p style={{fontSize: '13px', color: '#6b7280', margin: '0 0 4px'}}>Saldo</p>
            <p style={{fontSize: '22px', fontWeight: 700, color: financialSummary.saldo >= 0 ? '#16a34a' : '#dc2626', margin: 0}}>R$ {financialSummary.saldo.toFixed(2).replace('.', ',')}</p>
          </div>
          <div style={{padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <p style={{fontSize: '13px', color: '#6b7280', margin: '0 0 4px'}}>Contas a Pagar</p>
            <p style={{fontSize: '22px', fontWeight: 700, color: '#f59e0b', margin: 0}}>{financialSummary.overdueCount}</p>
          </div>
        </div>
      )}

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px'}}>
        {/* Gráfico de Fluxo Diário */}
        <div className="table-container">
          <div style={{padding: '20px', borderBottom: '1px solid #e5e7eb'}}>
            <h3 style={{margin: 0, fontSize: '16px', fontWeight: 600}}>Fluxo Diário - {monthLabel}</h3>
          </div>
          <div style={{padding: '16px', height: '280px'}}>
            {dailyFlowData.length > 0 && dailyFlowData.some(d => d.entrada > 0 || d.saida > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyFlowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{fontSize: 11}} />
                  <YAxis tick={{fontSize: 11}} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} labelFormatter={(label) => `Dia ${label}`} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                  <Legend />
                  <Area type="monotone" dataKey="entrada" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Entradas" />
                  <Area type="monotone" dataKey="saida" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Saídas" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', background: '#f9fafb', borderRadius: '12px'}}>
                Sem dados para o período
              </div>
            )}
          </div>
        </div>

        {/* Gráfico por Categoria */}
        <div className="table-container">
          <div style={{padding: '20px', borderBottom: '1px solid #e5e7eb'}}>
            <h3 style={{margin: 0, fontSize: '16px', fontWeight: 600}}>Receitas por Categoria</h3>
          </div>
          <div style={{padding: '16px', height: '280px'}}>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', background: '#f9fafb', borderRadius: '12px'}}>
                Sem dados para o período
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px'}}>
        {/* Aniversariantes */}
        <div className="table-container">
          <div style={{padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <Cake style={{color: '#10b981'}} size={20} />
            <h3 style={{margin: 0, fontSize: '16px', fontWeight: 600}}>Aniversariantes do Dia</h3>
          </div>
          <div style={{padding: '16px'}}>
            {stats.todayBirthdays.length === 0 ? (
              <p style={{color: '#6b7280', textAlign: 'center', padding: '20px'}}>Não há aniversariantes hoje.</p>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {stats.todayBirthdays.map((client) => (
                  <div key={client.id} style={{display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f9fafb', borderRadius: '8px'}}>
                    <span style={{fontWeight: 500}}>{client.name}</span>
                    <span style={{color: '#6b7280'}}>{client.phone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Saldo em Aberto */}
        <div className="table-container">
          <div style={{padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <DollarSign style={{color: '#ef4444'}} size={20} />
            <h3 style={{margin: 0, fontSize: '16px', fontWeight: 600}}>Saldo em Aberto</h3>
          </div>
          <div style={{padding: '20px'}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px'}}>
              <div style={{padding: '16px', background: '#f0fdf4', borderRadius: '12px'}}>
                <p style={{fontSize: '13px', color: '#6b7280', margin: '0 0 4px'}}>Saldo em Aberto</p>
                <p style={{fontSize: '24px', fontWeight: 700, color: '#166534', margin: 0}}>R$ {stats.openBalance.toFixed(2).replace('.', ',')}</p>
              </div>
              <div style={{padding: '16px', background: '#fef2f2', borderRadius: '12px'}}>
                <p style={{fontSize: '13px', color: '#6b7280', margin: '0 0 4px'}}>Baixado Parcial</p>
                <p style={{fontSize: '24px', fontWeight: 700, color: '#991b1b', margin: 0}}>R$ {stats.partialPaid.toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
            <Link to="/consulta/vendas?status=Aberto" className="btn-delete" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%'}}>
              Ver Detalhes
            </Link>
          </div>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px'}}>
        {/* Vendas do Mês */}
        <div className="table-container">
          <div style={{padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <TrendingUp style={{color: '#3b82f6'}} size={20} />
            <h3 style={{margin: 0, fontSize: '16px', fontWeight: 600}}>Vendas do Mês</h3>
          </div>
          <div style={{padding: '20px'}}>
            {stats.monthSales === 0 ? (
              <div style={{padding: '16px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center', color: '#6b7280', marginBottom: '16px'}}>
                Não há <strong>faturamento</strong> neste mês.
              </div>
            ) : null}
            <div style={{height: '200px', marginBottom: '16px'}}>
              {dailyFlowData.length > 0 && dailyFlowData.some(d => d.entrada > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{fontSize: 11}} />
                    <YAxis tick={{fontSize: 11}} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} labelFormatter={(label) => `Dia ${label}`} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="entrada" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Vendas" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', background: '#f9fafb', borderRadius: '12px'}}>
                  Sem dados para o período
                </div>
              )}
            </div>
            <div style={{textAlign: 'right', fontSize: '16px', fontWeight: 600}}>
              Total Geral: <span style={{color: '#111827'}}>R$ {stats.monthSales.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>

        {/* Total de Cadastros */}
        <div className="table-container">
          <div style={{padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <Users style={{color: '#8b5cf6'}} size={20} />
            <h3 style={{margin: 0, fontSize: '16px', fontWeight: 600}}>Total de Cadastros</h3>
          </div>
          <div style={{padding: '20px'}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
              <Link to="/clients" style={{textDecoration: 'none', padding: '20px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', borderRadius: '12px', color: 'white', transition: 'transform 0.2s', display: 'block'}} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <Users size={32} style={{marginBottom: '12px', opacity: 0.8}} />
                <p style={{fontSize: '28px', fontWeight: 700, margin: '0 0 4px'}}>{stats.totalClients}</p>
                <p style={{fontSize: '13px', margin: 0, opacity: 0.9}}>Clientes</p>
                <div style={{display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '13px', opacity: 0.8}}>
                  Ver detalhes <ArrowRight size={14} />
                </div>
              </Link>

              <Link to="/agenda" style={{textDecoration: 'none', padding: '20px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '12px', color: 'white', transition: 'transform 0.2s', display: 'block'}} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <Calendar size={32} style={{marginBottom: '12px', opacity: 0.8}} />
                <p style={{fontSize: '28px', fontWeight: 700, margin: '0 0 4px'}}>{stats.monthAppointments} / {stats.totalAppointments}</p>
                <p style={{fontSize: '13px', margin: 0, opacity: 0.9}}>Agendamentos Mês / Geral</p>
                <div style={{display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '13px', opacity: 0.8}}>
                  Ver detalhes <ArrowRight size={14} />
                </div>
              </Link>

              <Link to="/services" style={{textDecoration: 'none', padding: '20px', background: 'linear-gradient(135deg, #6366f1, #4338ca)', borderRadius: '12px', color: 'white', transition: 'transform 0.2s', display: 'block'}} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <Trophy size={32} style={{marginBottom: '12px', opacity: 0.8}} />
                <p style={{fontSize: '28px', fontWeight: 700, margin: '0 0 4px'}}>{stats.totalServices}</p>
                <p style={{fontSize: '13px', margin: 0, opacity: 0.9}}>Serviços / Produtos</p>
                <div style={{display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '13px', opacity: 0.8}}>
                  Ver detalhes <ArrowRight size={14} />
                </div>
              </Link>

              <Link to="/employees" style={{textDecoration: 'none', padding: '20px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '12px', color: 'white', transition: 'transform 0.2s', display: 'block'}} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <UserCircle2 size={32} style={{marginBottom: '12px', opacity: 0.8}} />
                <p style={{fontSize: '28px', fontWeight: 700, margin: '0 0 4px'}}>{stats.totalEmployees}</p>
                <p style={{fontSize: '13px', margin: 0, opacity: 0.9}}>Profissionais</p>
                <div style={{display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '13px', opacity: 0.8}}>
                  Ver detalhes <ArrowRight size={14} />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
