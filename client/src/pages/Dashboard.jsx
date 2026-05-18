import { useState, useEffect, useMemo } from 'react';
import { Users, Calendar, XCircle, Clock, TrendingUp, UserPlus, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const API_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, chartsRes] = await Promise.all([
          fetch(`${API_URL}/dashboard/overview`, { headers: getAuthHeader() }),
          fetch(`${API_URL}/dashboard/charts`, { headers: getAuthHeader() })
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (chartsRes.ok) setCharts(await chartsRes.json());
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = useMemo(() => {
    if (!stats || !charts) return [];
    return [
      { label: 'Clientes Cadastrados', value: stats.totalClients, icon: Users, color: '#002cd6' },
      { label: 'Novos no Último Mês', value: charts.newClientsMonth.count, icon: UserPlus, color: '#16a34a' },
      { label: 'Atendimentos Finalizados', value: charts.completedAppointments.count, icon: CheckCircle, color: '#6366f1' },
      { label: 'Agenda Hoje', value: charts.todaySchedule.length, icon: Calendar, color: '#f59e0b' },
    ];
  }, [stats, charts]);

  if (loading) return <div style={{ padding: '24px', color: '#606060' }}>Carregando...</div>;
  if (!stats || !charts) return <div style={{ padding: '24px', color: '#d32f2f' }}>Erro ao carregar dados</div>;

  const SectionTitle = ({ children }) => (
    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#2c3e50', margin: '0 0 12px' }}>{children}</h3>
  );

  const ChartCard = ({ title, children, fullWidth }) => (
    <div style={{
      background: '#fff', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      padding: '16px', gridColumn: fullWidth ? '1 / -1' : undefined
    }}>
      <SectionTitle>{title}</SectionTitle>
      {children}
    </div>
  );

  const formatMonth = (m) => {
    if (!m) return '';
    const [y, mo] = m.split('-');
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${months[parseInt(mo)-1]}/${y}`;
  };

  const tooltipStyle = { borderRadius: '4px', border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontSize: '12px' };

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#000', margin: '0 0 24px' }}>Inteligência</h1>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {cards.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} style={{ padding: '18px', background: '#fff', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ backgroundColor: item.color, padding: '10px', borderRadius: '6px', display: 'flex' }}>
                <Icon size={22} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: '22px', fontWeight: 600, margin: 0, color: '#000' }}>{item.value}</p>
                <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>

        {/* Principais Planos - 6 meses */}
        <ChartCard title="Principais Planos — Últimos 6 Meses">
          {charts.topPlans6m.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={charts.topPlans6m} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [value, 'Agendamentos']} contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#002cd6" radius={[4, 4, 0, 0]} name="Agendamentos" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyData />}
        </ChartCard>

        {/* Cancelamentos e Ausências — 7 dias */}
        <ChartCard title="Cancelamentos e Ausências — Últimos 7 Dias">
          {charts.cancelAbsence7d.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.cancelAbsence7d} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.substring(5) || ''} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="cancelados" fill="#ef4444" radius={[3, 3, 0, 0]} name="Cancelados" />
                <Bar dataKey="ausentes" fill="#f97316" radius={[3, 3, 0, 0]} name="Ausentes" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyData />}
        </ChartCard>

        {/* Planos Atendidos — 6 meses */}
        <ChartCard title="Planos Atendidos — Últimos 6 Meses">
          {charts.plansAttended6m.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={charts.plansAttended6m} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [value, 'Atendimentos']} contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} name="Atendimentos" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyData />}
        </ChartCard>

        {/* Ausentes e Cancelamentos — 12 meses */}
        <ChartCard title="Ausentes e Cancelamentos — Últimos 12 Meses">
          {charts.cancelAbsence12m.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={charts.cancelAbsence12m} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={formatMonth} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={formatMonth} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="cancelados" stroke="#ef4444" strokeWidth={2} name="Cancelados" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="ausentes" stroke="#f97316" strokeWidth={2} name="Ausentes" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyData />}
        </ChartCard>
      </div>

      {/* Agenda de Hoje */}
      <ChartCard title={`Agenda de Hoje (${new Date().toLocaleDateString('pt-BR')})`} fullWidth>
        {charts.todaySchedule.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {charts.todaySchedule.map((a) => {
              const statusColors = {
                agendado: '#002cd6', confirmado: '#00bcd4', aguardando: '#ff9800',
                atendendo: '#e91e63', atendido: '#4caf50', concluido: '#1b5e20',
                cancelado: '#9e9e9e', faltou: '#607d8b'
              };
              return (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '8px 12px', background: '#f9f9f9', borderRadius: '4px', fontSize: '13px'
                }}>
                  <span style={{ fontWeight: 600, color: '#333', minWidth: '50px' }}>{a.time?.substring(0, 5)}</span>
                  <span style={{ flex: 1, color: '#000' }}>{a.client_name}</span>
                  <span style={{ color: '#666', flex: 1 }}>{a.service_name}</span>
                  <span style={{ color: '#666', flex: 1 }}>{a.employee_name}</span>
                  {a.client_plan && <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>{a.client_plan}</span>}
                  <span style={{
                    padding: '2px 8px', borderRadius: '10px', fontSize: '11px',
                    background: statusColors[a.status] || '#999', color: '#fff', fontWeight: 500
                  }}>
                    {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : <EmptyData />}
      </ChartCard>
    </div>
  );
}

function EmptyData() {
  return <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '13px' }}>Sem dados para o período</div>;
}
