import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

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

  const monthLabel = (dateStr) => {
    const [y, m] = dateStr.split('-');
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Financeiro</h1>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px'}} />
          <Link to="/financeiro/lancamentos" className="btn-primary">📝 Lançamentos</Link>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdue.length > 0 && (
        <div style={{background: '#fdedec', border: '1px solid #e74c3c', borderRadius: '8px', padding: '15px', marginBottom: '20px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontWeight: 'bold', color: '#e74c3c', fontSize: '16px'}}>⚠️ {overdue.length} lançamento(s) vencido(s)!</span>
            <Link to="/financeiro/lancamentos?status=vencido" style={{color: '#e74c3c', textDecoration: 'underline', fontSize: '14px'}}>Ver todos →</Link>
          </div>
          <div style={{marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
            {overdue.slice(0, 5).map(t => (
              <div key={t.id} style={{background: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', border: '1px solid #f5c6cb'}}>
                <strong>{t.description}</strong> — <span style={{color: '#e74c3c'}}>R$ {t.amount.toFixed(2)}</span> (Venc: {new Date(t.due_date + 'T12:00:00').toLocaleDateString('pt-BR')})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#eafaf1', color: '#27ae60'}}>💰</div>
          <div className="stat-info"><h3 style={{color: '#27ae60'}}>R$ {summary.receitasPagas.toFixed(2)}</h3><p>Receitas Pagas</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#fdedec', color: '#e74c3c'}}>📉</div>
          <div className="stat-info"><h3 style={{color: '#e74c3c'}}>R$ {summary.despesasPagas.toFixed(2)}</h3><p>Despesas Pagas</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: summary.saldo >= 0 ? '#eafaf1' : '#fdedec', color: summary.saldo >= 0 ? '#27ae60' : '#e74c3c'}}>📊</div>
          <div className="stat-info"><h3 style={{color: summary.saldo >= 0 ? '#27ae60' : '#e74c3c'}}>R$ {summary.saldo.toFixed(2)}</h3><p>Saldo do Mês</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#ebf5fb', color: '#3498db'}}>🏦</div>
          <div className="stat-info"><h3 style={{color: '#3498db'}}>R$ {summary.totalAccounts.toFixed(2)}</h3><p>Saldo Total Contas</p></div>
        </div>
      </div>

      {/* Pending */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px'}}>
        <div style={{background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
          <h3 style={{color: '#2c3e50', marginBottom: '15px'}}>Receitas Pendentes</h3>
          <div style={{fontSize: '28px', fontWeight: 'bold', color: '#f39c12', marginBottom: '15px'}}>R$ {summary.receitasPendentes.toFixed(2)}</div>
          {upcoming.filter(t => t.type === 'receita').length > 0 ? upcoming.filter(t => t.type === 'receita').slice(0, 5).map(t => (
            <div key={t.id} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee', fontSize: '13px'}}>
              <span>{t.description}</span>
              <span style={{fontWeight: 'bold', color: '#27ae60'}}>R$ {t.amount.toFixed(2)}</span>
            </div>
          )) : <p style={{color: '#999', fontSize: '13px'}}>Nenhuma receita próxima</p>}
        </div>
        <div style={{background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
          <h3 style={{color: '#2c3e50', marginBottom: '15px'}}>Despesas Pendentes</h3>
          <div style={{fontSize: '28px', fontWeight: 'bold', color: '#e74c3c', marginBottom: '15px'}}>R$ {summary.despesasPendentes.toFixed(2)}</div>
          {upcoming.filter(t => t.type === 'despesa').length > 0 ? upcoming.filter(t => t.type === 'despesa').slice(0, 5).map(t => (
            <div key={t.id} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee', fontSize: '13px'}}>
              <span>{t.description}</span>
              <span style={{fontWeight: 'bold', color: '#e74c3c'}}>R$ {t.amount.toFixed(2)}</span>
            </div>
          )) : <p style={{color: '#999', fontSize: '13px'}}>Nenhuma despesa próxima</p>}
        </div>
      </div>

      {/* Accounts */}
      <div style={{background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginTop: '20px'}}>
        <h3 style={{color: '#2c3e50', marginBottom: '15px'}}>Saldos por Conta</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px'}}>
          {accountsSummary?.accounts.map(a => (
            <div key={a.id} style={{background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center'}}>
              <div style={{fontSize: '24px', marginBottom: '5px'}}>{a.type === 'dinheiro' ? '💵' : a.type === 'banco' ? '🏦' : a.type === 'digital' ? '📱' : '💳'}</div>
              <div style={{fontSize: '12px', color: '#777', marginBottom: '5px'}}>{a.name}</div>
              <div style={{fontSize: '20px', fontWeight: 'bold', color: '#2c3e50'}}>R$ {a.balance.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      {summary.byCategory.length > 0 && (
        <div style={{background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginTop: '20px'}}>
          <h3 style={{color: '#2c3e50', marginBottom: '15px'}}>Por Categoria (Pago)</h3>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
            {['receita', 'despesa'].map(type => (
              <div key={type}>
                <h4 style={{color: type === 'receita' ? '#27ae60' : '#e74c3c', marginBottom: '10px', fontSize: '14px', textTransform: 'capitalize'}}>{type === 'receita' ? 'Receitas' : 'Despesas'}</h4>
                {summary.byCategory.filter(c => c.type === type).map(cat => {
                  const maxVal = Math.max(...summary.byCategory.filter(c => c.type === type).map(c => c.total));
                  const pct = maxVal > 0 ? (cat.total / maxVal * 100) : 0;
                  return (
                    <div key={cat.id} style={{marginBottom: '10px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px'}}>
                        <span>{cat.icon} {cat.name}</span>
                        <span style={{fontWeight: 'bold'}}>R$ {cat.total.toFixed(2)} ({cat.count})</span>
                      </div>
                      <div style={{height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden'}}>
                        <div style={{height: '100%', width: `${pct}%`, background: cat.color, borderRadius: '4px', transition: 'width 0.3s'}}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Flow Chart */}
      {summary.dailyFlow && summary.dailyFlow.some(d => d.entrada > 0 || d.saida > 0) && (
        <div style={{background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginTop: '20px'}}>
          <h3 style={{color: '#2c3e50', marginBottom: '15px'}}>Fluxo Diário</h3>
          <div style={{display: 'flex', alignItems: 'flex-end', gap: '2px', height: '150px', padding: '0 5px', overflowX: 'auto'}}>
            {summary.dailyFlow.map((d, i) => {
              const maxVal = Math.max(...summary.dailyFlow.map(x => Math.max(x.entrada, x.saida)));
              const barH = maxVal > 0 ? (Math.max(d.entrada, d.saida) / maxVal * 130) : 0;
              return (
                <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '12px', flex: 1}} title={`${d.date}: Entradas R$${d.entrada.toFixed(2)} / Saídas R$${d.saida.toFixed(2)}`}>
                  <div style={{display: 'flex', gap: '1px', alignItems: 'flex-end', height: `${Math.max(barH, 2)}px`}}>
                    <div style={{width: '5px', background: '#27ae60', borderRadius: '2px 2px 0 0', height: `${maxVal > 0 ? (d.entrada / maxVal * 130) : 0}px`}}></div>
                    <div style={{width: '5px', background: '#e74c3c', borderRadius: '2px 2px 0 0', height: `${maxVal > 0 ? (d.saida / maxVal * 130) : 0}px`}}></div>
                  </div>
                  <span style={{fontSize: '8px', color: '#999', marginTop: '4px'}}>{parseInt(d.date.split('-')[2])}</span>
                </div>
              );
            })}
          </div>
          <div style={{display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '10px', fontSize: '12px'}}>
            <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><span style={{width: '10px', height: '10px', background: '#27ae60', borderRadius: '2px', display: 'inline-block'}}></span> Entradas</span>
            <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><span style={{width: '10px', height: '10px', background: '#e74c3c', borderRadius: '2px', display: 'inline-block'}}></span> Saídas</span>
          </div>
        </div>
      )}
    </div>
  );
}
