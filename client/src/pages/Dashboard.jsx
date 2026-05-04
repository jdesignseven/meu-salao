import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cake, DollarSign, TrendingUp, Users, Calendar, Trophy, UserCircle2, ArrowRight } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/overview`, {
        headers: getAuthHeader()
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Carregando...</div>;
  if (!stats) return <div className="error">Erro ao carregar dados</div>;

  const months = Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0'));
  const years = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px'}}>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px'}}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
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
            <div style={{height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', background: '#f9fafb', borderRadius: '12px', marginBottom: '16px'}}>
              Gráfico de vendas (integração pendente)
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
