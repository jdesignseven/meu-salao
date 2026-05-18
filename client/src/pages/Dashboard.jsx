import { useState, useEffect, useMemo } from 'react';
import { Users, Calendar, XCircle, Clock, TrendingUp, UserPlus, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

  const periodLabel = (months) => {
    const now = new Date();
    const start = new Date(now);
    start.setMonth(start.getMonth() - months);
    const fmt = (d) => {
      const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      return `${meses[d.getMonth()]}/${d.getFullYear()}`;
    };
    return `${fmt(start)} a ${fmt(now)}`;
  };

  const Period = ({ children }) => (
    <p style={{ fontSize: '11px', color: '#aaa', textAlign: 'center', margin: '6px 0 0' }}>{children}</p>
  );

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
                <Bar dataKey="count" fill="#002cd6" radius={[4, 4, 0, 0]} name="Agendamentos" maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyData />}
          <Period>{periodLabel(6)}</Period>
        </ChartCard>

        {/* Aniversariantes — 30 dias */}
        <ChartCard title="Aniversariantes nos Próximos 30 Dias">
          {charts.nextBirthdays?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {charts.nextBirthdays.map(c => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '6px 10px', background: '#f9f9f9', borderRadius: '4px', fontSize: '13px'
                }}>
                  <span style={{ fontWeight: 600, color: '#e91e63', minWidth: '28px' }}>{c.daysUntil}d</span>
                  <span style={{ flex: 1, color: '#000' }}>{c.name}</span>
                  <span style={{ color: '#888', fontSize: '12px' }}>{c.age} anos</span>
                  <span style={{ color: '#888', fontSize: '12px' }}>{new Date(c.birth_date).toLocaleDateString('pt-BR')}</span>
                </div>
              ))}
            </div>
          ) : <EmptyData height="auto" text="Nenhum aniversariante nos próximos 30 dias" />}
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
                <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} name="Atendimentos" maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyData />}
          <Period>{periodLabel(6)}</Period>
        </ChartCard>

        {/* Clientes por Idade e Sexo */}
        <ChartCard title="Clientes por Idade e Sexo">
          {charts.clientsAgeGender?.length > 0 ? (() => {
            const faixas = [...new Set(charts.clientsAgeGender.map(d => d.faixa))];
            const order = ['0-18','19-25','26-35','36-50','51+','Não informado'];
            faixas.sort((a, b) => order.indexOf(a) - order.indexOf(b));
            const data = faixas.map(f => {
              const row = { faixa: f };
              const items = charts.clientsAgeGender.filter(d => d.faixa === f);
              const fem = items.find(d => d.sexo === 'Feminino');
              const masc = items.find(d => d.sexo === 'Masculino');
              const outro = items.find(d => d.sexo === 'Outro');
              row.Feminino = fem ? fem.count : 0;
              row.Masculino = masc ? masc.count : 0;
              row.Outro = outro ? outro.count : 0;
              return row;
            });
            return (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="faixa" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Feminino" fill="#e91e63" radius={[3, 3, 0, 0]} name="Feminino" maxBarSize={24} />
                  <Bar dataKey="Masculino" fill="#002cd6" radius={[3, 3, 0, 0]} name="Masculino" maxBarSize={24} />
                  <Bar dataKey="Outro" fill="#9e9e9e" radius={[3, 3, 0, 0]} name="Outro" maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            );
          })() : <EmptyData />}
          <Period>Total: {stats.totalClients} clientes</Period>
        </ChartCard>
      </div>

      {/* Atendimentos Finalizados, Ausências e Cancelamentos — 12 meses */}
      <ChartCard title="Atendimentos Finalizados, Ausências e Cancelamentos — Últimos 12 Meses" fullWidth>
        {charts.atendimentos12m?.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={charts.atendimentos12m} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={formatMonth} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={formatMonth} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="finalizados" fill="#16a34a" radius={[3, 3, 0, 0]} name="Finalizados" maxBarSize={24} />
              <Bar dataKey="cancelados" fill="#ef4444" radius={[3, 3, 0, 0]} name="Cancelados" maxBarSize={24} />
              <Bar dataKey="ausentes" fill="#f97316" radius={[3, 3, 0, 0]} name="Ausentes" maxBarSize={24} />
            </BarChart>
            </ResponsiveContainer>
          ) : <EmptyData />}
          <Period>{periodLabel(12)}</Period>
        </ChartCard>
    </div>
  );
}

function EmptyData({ height, text }) {
  return <div style={{ height: height || '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '13px' }}>{text || 'Sem dados para o período'}</div>;
}
