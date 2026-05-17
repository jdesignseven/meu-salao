import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Landmark } from 'lucide-react';

const API_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export default function FinancialDashboard() {
  const [summary, setSummary] = useState(null);
  const [accountsSummary, setAccountsSummary] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

  useEffect(() => { fetchData(); }, [selectedMonth]);

  const fetchData = async () => {
    try {
      const [sumRes, accRes, overRes, upRes] = await Promise.all([
        fetch(`${API_URL}/financial/summary?month=${selectedMonth}`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/financial/accounts-summary`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/financial/transactions/overdue`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/financial/transactions/upcoming`, { headers: getAuthHeader() })
      ]);
      if (sumRes.ok) setSummary(await sumRes.json());
      if (accRes.ok) setAccountsSummary(await accRes.json());
      if (overRes.ok) setOverdue(await overRes.json());
      if (upRes.ok) setUpcoming(await upRes.json());
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  if (loading) return <div style={{ padding: '24px', color: '#606060' }}>Carregando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#000', margin: 0 }}>Financeiro</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff' }} />
          <Link to="/financeiro/lancamentos" style={{
            display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#002cd6', color: '#fff',
            padding: '10px 20px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, textDecoration: 'none'
          }}><DollarSign size={16} /> Lançamentos</Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ backgroundColor: '#002cd6', padding: '8px', borderRadius: '4px' }}><DollarSign size={20} color="#fff" /></div>
            <span style={{ fontSize: '14px', color: '#606060' }}>Receitas Pagas</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 500, color: '#002cd6' }}>R$ {summary.receitasPagas.toFixed(2)}</div>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ backgroundColor: '#f44336', padding: '8px', borderRadius: '4px' }}><ArrowDownRight size={20} color="#fff" /></div>
            <span style={{ fontSize: '14px', color: '#606060' }}>Despesas Pagas</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 500, color: '#f44336' }}>R$ {summary.despesasPagas.toFixed(2)}</div>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ backgroundColor: summary.saldo >= 0 ? '#4caf50' : '#f44336', padding: '8px', borderRadius: '4px' }}><TrendingUp size={20} color="#fff" /></div>
            <span style={{ fontSize: '14px', color: '#606060' }}>Saldo do Mês</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 500, color: summary.saldo >= 0 ? '#4caf50' : '#f44336' }}>R$ {summary.saldo.toFixed(2)}</div>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ backgroundColor: '#002cd6', padding: '8px', borderRadius: '4px' }}><Landmark size={20} color="#fff" /></div>
            <span style={{ fontSize: '14px', color: '#606060' }}>Saldo Total</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 500, color: '#002cd6' }}>R$ {summary.totalAccounts.toFixed(2)}</div>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdue.length > 0 && (
        <div style={{ background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: '4px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 500, color: '#d32f2f', fontSize: '14px' }}>⚠️ {overdue.length} lançamento(s) vencido(s)!</span>
            <Link to="/financeiro/lancamentos?status=vencido" style={{ color: '#d32f2f', textDecoration: 'none', fontSize: '14px' }}>Ver todos →</Link>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {overdue.slice(0, 5).map(t => (
              <div key={t.id} style={{ background: '#fff', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', border: '1px solid #ffcdd2' }}>
                <strong>{t.description}</strong> — <span style={{ color: '#d32f2f' }}>R$ {t.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#000', margin: '0 0 12px' }}>Receitas Pendentes</h3>
          <div style={{ fontSize: '24px', fontWeight: 500, color: '#ff9800', marginBottom: '16px' }}>R$ {summary.receitasPendentes.toFixed(2)}</div>
          {upcoming.filter(t => t.type === 'receita').length > 0 ? (
            upcoming.filter(t => t.type === 'receita').slice(0, 5).map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee', fontSize: '13px' }}>
                <span>{t.description}</span>
                <span style={{ fontWeight: 500, color: '#4caf50' }}>R$ {t.amount.toFixed(2)}</span>
              </div>
            ))
          ) : <p style={{ color: '#606060', fontSize: '13px' }}>Nenhum próximo</p>}
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#000', margin: '0 0 12px' }}>Despesas Pendentes</h3>
          <div style={{ fontSize: '24px', fontWeight: 500, color: '#f44336', marginBottom: '16px' }}>R$ {summary.despesasPendentes.toFixed(2)}</div>
          {upcoming.filter(t => t.type === 'despesa').length > 0 ? (
            upcoming.filter(t => t.type === 'despesa').slice(0, 5).map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee', fontSize: '13px' }}>
                <span>{t.description}</span>
                <span style={{ fontWeight: 500, color: '#f44336' }}>R$ {t.amount.toFixed(2)}</span>
              </div>
            ))
          ) : <p style={{ color: '#606060', fontSize: '13px' }}>Nenhum próximo</p>}
        </div>
      </div>
    </div>
  );
}
