import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export default function Commissions() {
  const [summary, setSummary] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [details, setDetails] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [selectedMonth]);

  const fetchData = async () => {
    try {
      const [sumRes] = await Promise.all([
        fetch(`${API_URL}/commissions/summary?month=${selectedMonth}`, { headers: getAuthHeader() })
      ]);
      if (sumRes.ok) setSummary(await sumRes.json());
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const handleSync = async () => {
    try {
      const res = await fetch(`${API_URL}/commissions/sync`, { method: 'POST', headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        alert(data.created > 0 ? `${data.created} comissão(ões) gerada(s)!` : 'Nenhum novo atendimento concluído encontrado para gerar comissões.');
        fetchData();
      }
    } catch (error) { console.error('Error syncing:', error); }
  };

  const fetchDetails = async (empId) => {
    if (selectedEmployee === empId) {
      setSelectedEmployee(null);
      return;
    }
    setSelectedEmployee(empId);
    try {
      const res = await fetch(`${API_URL}/commissions?employee_id=${empId}&month=${selectedMonth}`, { headers: getAuthHeader() });
      if (res.ok) setDetails(await res.json());
    } catch (error) { console.error('Error:', error); }
  };

  const handlePayAll = async (empId) => {
    if (!confirm('Confirmar pagamento de todas as comissões pendentes deste mês?')) return;
    try {
      const res = await fetch(`${API_URL}/commissions/${empId}/pay`, { 
        method: 'POST', 
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth })
      });
      if (res.ok) fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  const handleSinglePay = async (commId, currentStatus) => {
    const newStatus = currentStatus === 'pago' ? 'pendente' : 'pago';
    try {
      const res = await fetch(`${API_URL}/commissions/${commId}/status`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchData();
        if (selectedEmployee) fetchDetails(selectedEmployee);
      }
    } catch (error) { console.error('Error:', error); }
  };

  if (loading) return <div className="loading">Carregando...</div>;

  const totalPending = summary.reduce((s, e) => s + e.pendingValue, 0);
  const totalPaid = summary.reduce((s, e) => s + e.paidValue, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Gestão de Comissões</h1>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px'}} />
          <button onClick={handleSync} className="btn-secondary">🔄 Sincronizar</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#fdedec', color: '#e74c3c'}}>💰</div>
          <div className="stat-info"><h3 style={{color: '#e74c3c'}}>R$ {totalPending.toFixed(2)}</h3><p>Comissões Pendentes</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#eafaf1', color: '#27ae60'}}>✅</div>
          <div className="stat-info"><h3 style={{color: '#27ae60'}}>R$ {totalPaid.toFixed(2)}</h3><p>Comissões Pagas</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#ebf5fb', color: '#3498db'}}>👥</div>
          <div className="stat-info"><h3 style={{color: '#3498db'}}>{summary.length}</h3><p>Profissionais com Atividade</p></div>
        </div>
      </div>

      {/* Employee Grid */}
      <div style={{marginTop: '20px'}}>
        <h2 style={{color: '#2c3e50', marginBottom: '15px'}}>Profissionais</h2>
        {summary.length === 0 ? <p className="empty-state">Nenhum dado disponível para este período. Clique em "Sincronizar" para atualizar.</p> :
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
            {summary.map(emp => (
              <div key={emp.id} style={{background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #eee', cursor: 'pointer', transition: 'transform 0.2s'}} onClick={() => fetchDetails(emp.id)} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{width: '45px', height: '45px', borderRadius: '50%', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: '#555'}}>{emp.name.charAt(0)}</div>
                    <div><strong style={{fontSize: '16px'}}>{emp.name}</strong><br/><span style={{fontSize: '12px', color: '#777'}}>Taxa: {emp.commission_rate}%</span></div>
                  </div>
                  {emp.pendingValue > 0 && <span style={{background: '#e74c3c', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold'}}>PENDENTE</span>}
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center', marginBottom: '15px'}}>
                  <div><div style={{fontSize: '18px', fontWeight: 'bold', color: '#2c3e50'}}>{emp.totalServices}</div><div style={{fontSize: '11px', color: '#777'}}>Serviços</div></div>
                  <div><div style={{fontSize: '18px', fontWeight: 'bold', color: '#27ae60'}}>R$ {emp.totalSales.toFixed(2)}</div><div style={{fontSize: '11px', color: '#777'}}>Vendas</div></div>
                  <div><div style={{fontSize: '18px', fontWeight: 'bold', color: '#e67e22'}}>R$ {emp.pendingValue.toFixed(2)}</div><div style={{fontSize: '11px', color: '#777'}}>A Pagar</div></div>
                </div>

                {emp.pendingValue > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); handlePayAll(emp.id); }} style={{width: '100%', padding: '10px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'}}>💰 Pagar Comissões</button>
                )}
              </div>
            ))}
          </div>
        }
      </div>

      {/* Details Table */}
      {selectedEmployee && details.length > 0 && (
        <div style={{marginTop: '30px', background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
            <h3>Detalhamento: {summary.find(e => e.id === selectedEmployee)?.name}</h3>
            <button onClick={() => setSelectedEmployee(null)} className="btn-secondary" style={{padding: '5px 15px'}}>Fechar</button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Data</th><th>Cliente</th><th>Serviço</th><th>Valor Serviço</th><th>Taxa</th><th>Comissão</th><th>Status</th><th>Ação</th></tr></thead>
              <tbody>
                {details.map(c => (
                  <tr key={c.id} style={{background: c.status === 'pago' ? '#f9f9f9' : 'white'}}>
                    <td>{new Date(c.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                    <td>{c.client_name}</td>
                    <td>{c.service_name}</td>
                    <td>R$ {c.service_price.toFixed(2)}</td>
                    <td>{c.commission_rate}%</td>
                    <td style={{fontWeight: 'bold', color: '#e67e22'}}>R$ {c.commission_value.toFixed(2)}</td>
                    <td><span className={`status-badge ${c.status === 'pago' ? 'status-active' : 'status-scheduled'}`}>{c.status === 'pago' ? 'Pago' : 'Pendente'}</span></td>
                    <td>
                      <button onClick={() => handleSinglePay(c.id, c.status)} className={c.status === 'pago' ? 'btn-cancel' : 'btn-complete'} style={{padding: '3px 8px', fontSize: '11px'}}>{c.status === 'pago' ? 'Estornar' : 'Marcar Pago'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
