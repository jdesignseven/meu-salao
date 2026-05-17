import { useState, useEffect } from 'react';
import { RefreshCw, DollarSign, CheckCircle, Users, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = '/api';

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
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${API_URL}/commissions/${empId}/pay`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ month: selectedMonth })
      });
      if (res.ok) fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  const handleSinglePay = async (commId, currentStatus) => {
    const newStatus = currentStatus === 'pago' ? 'pendente' : 'pago';
    try {
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${API_URL}/commissions/${commId}/status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchData();
        if (selectedEmployee) fetchDetails(selectedEmployee);
      }
    } catch (error) { console.error('Error:', error); }
  };

  if (loading) return <div style={{ padding: '24px', color: '#606060' }}>Carregando...</div>;

  const totalPending = summary.reduce((s, e) => s + e.pendingValue, 0);
  const totalPaid = summary.reduce((s, e) => s + e.paidValue, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#000', margin: 0 }}>Gestão de Comissões</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff' }} />
          <button onClick={handleSync} style={{
            display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f5f5f5', color: '#606060',
            padding: '10px 20px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
          }}><RefreshCw size={16} /> Sincronizar</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { icon: DollarSign, color: '#f44336', label: 'Comissões Pendentes', value: `R$ ${totalPending.toFixed(2)}` },
          { icon: CheckCircle, color: '#4caf50', label: 'Comissões Pagas', value: `R$ ${totalPaid.toFixed(2)}` },
          { icon: Users, color: '#002cd6', label: 'Profissionais', value: summary.length.toString() }
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} style={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ backgroundColor: card.color, padding: '8px', borderRadius: '4px' }}>
                  <Icon size={20} color="#fff" />
                </div>
                <span style={{ fontSize: '14px', color: '#606060' }}>{card.label}</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 500, color: card.color }}>{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Employee Grid */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#000', margin: '0 0 16px' }}>Profissionais</h2>
        {summary.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '24px', textAlign: 'center', color: '#606060', fontSize: '14px' }}>
            Nenhum dado disponível para este período. Clique em "Sincronizar" para atualizar.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {summary.map(emp => (
              <div key={emp.id} style={{
                backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px',
                cursor: 'pointer', transition: 'box-shadow 0.2s'
              }} onClick={() => fetchDetails(emp.id)}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '45px', height: '45px', borderRadius: '50%', background: '#f5f5f5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 500, color: '#606060'
                    }}>{emp.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight: 500, color: '#000', fontSize: '14px' }}>{emp.name}</div>
                      <div style={{ fontSize: '12px', color: '#606060', marginTop: '4px' }}>Taxa: {emp.commission_rate}%</div>
                    </div>
                  </div>
                  {emp.pendingValue > 0 && (
                    <span style={{
                      background: '#f44336', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500
                    }}>PENDENTE</span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 500, color: '#000' }}>{emp.totalServices}</div>
                    <div style={{ fontSize: '11px', color: '#606060', marginTop: '4px' }}>Serviços</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 500, color: '#4caf50' }}>R$ {emp.totalSales.toFixed(2)}</div>
                    <div style={{ fontSize: '11px', color: '#606060', marginTop: '4px' }}>Vendas</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 500, color: '#ff9800' }}>R$ {emp.pendingValue.toFixed(2)}</div>
                    <div style={{ fontSize: '11px', color: '#606060', marginTop: '4px' }}>A Pagar</div>
                  </div>
                </div>

                {emp.pendingValue > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); handlePayAll(emp.id); }} style={{
                    width: '100%', padding: '10px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, fontSize: '14px'
                  }}>Pagar Comissões</button>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '12px', fontSize: '12px', color: '#606060' }}>
                  {selectedEmployee === emp.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  <span style={{ marginLeft: '4px' }}>{selectedEmployee === emp.id ? 'Ocultar' : 'Ver'} detalhes</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Table */}
      {selectedEmployee && details.length > 0 && (
        <div style={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#000', margin: 0 }}>
              Detalhamento: {summary.find(e => e.id === selectedEmployee)?.name}
            </h3>
            <button onClick={() => setSelectedEmployee(null)} style={{
              padding: '8px 16px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', cursor: 'pointer'
            }}>Fechar</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Data</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Cliente</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Serviço</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Valor</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Taxa</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Comissão</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {details.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #eee', background: c.status === 'pago' ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{new Date(c.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{c.client_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{c.service_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>R$ {c.service_price.toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{c.commission_rate}%</td>
                    <td style={{ padding: '12px 16px', fontWeight: 500, fontSize: '14px', color: '#ff9800' }}>R$ {c.commission_value.toFixed(2)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500,
                        backgroundColor: c.status === 'pago' ? '#e8f5e9' : '#fff3e0',
                        color: c.status === 'pago' ? '#4caf50' : '#ff9800'
                      }}>{c.status === 'pago' ? 'Pago' : 'Pendente'}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => handleSinglePay(c.id, c.status)} style={{
                        padding: '6px 12px', background: c.status === 'pago' ? '#ff9800' : '#4caf50',
                        color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500
                      }}>{c.status === 'pago' ? 'Estornar' : 'Marcar Pago'}</button>
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
