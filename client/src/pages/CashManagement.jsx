import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export default function CashManagement() {
  const [currentRegister, setCurrentRegister] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedRegister, setSelectedRegister] = useState(null);
  const [summary, setSummary] = useState(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openForm, setOpenForm] = useState({ initial_amount: '', notes: '' });
  const [closeForm, setCloseForm] = useState({ final_amount: '', notes: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [curRes, histRes] = await Promise.all([
        fetch(`${API_URL}/cash/current`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/cash/history`, { headers: getAuthHeader() })
      ]);
      if (curRes.ok) setCurrentRegister(await curRes.json());
      if (histRes.ok) setHistory(await histRes.json());
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const handleOpen = async () => {
    if (!openForm.initial_amount) { alert('Informe o valor inicial'); return; }
    try {
      const res = await fetch(`${API_URL}/cash/open`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(openForm)
      });
      if (res.ok) { setShowOpenModal(false); fetchData(); }
    } catch (error) { console.error('Error:', error); }
  };

  const handleClose = async () => {
    if (!closeForm.final_amount) { alert('Informe o valor final'); return; }
    try {
      const res = await fetch(`${API_URL}/cash/close`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(closeForm)
      });
      if (res.ok) {
        const result = await res.json();
        setShowCloseModal(false);
        fetchData();
        alert(`Caixa fechado!\nDiferença: R$ ${result.difference.toFixed(2)}\n${result.difference > 0 ? 'Sobra' : result.difference < 0 ? 'Falta' : 'Bateu!'}`);
      }
    } catch (error) { console.error('Error:', error); }
  };

  const viewRegisterSummary = async (regId) => {
    if (selectedRegister === regId) {
      setSelectedRegister(null);
      return;
    }
    setSelectedRegister(regId);
    try {
      const res = await fetch(`${API_URL}/cash/registers/${regId}/summary`, { headers: getAuthHeader() });
      if (res.ok) setSummary(await res.json());
    } catch (error) { console.error('Error:', error); }
  };

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>💰 Gestão de Caixa</h1>
      </div>

      {/* Current Register Status */}
      <div style={{background: currentRegister?.register ? '#e8f8f5' : '#fdedec', border: `2px solid ${currentRegister?.register ? '#1abc9c' : '#e74c3c'}`, borderRadius: '12px', padding: '20px', marginBottom: '25px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h2 style={{margin: '0 0 5px', color: '#2c3e50'}}>{currentRegister?.register ? `Caixa #${currentRegister.register.id} — ABERTO` : 'Caixa Fechado'}</h2>
            {currentRegister?.register && (
              <>
                <p style={{margin: '5px 0', fontSize: '14px', color: '#555'}}>Aberto em: <strong>{currentRegister.register.opened_at}</strong> por {currentRegister.register.user}</p>
                <p style={{margin: '5px 0', fontSize: '14px', color: '#555'}}>Valor Inicial: <strong>R$ {currentRegister.register.initial_amount.toFixed(2)}</strong></p>
                {currentRegister.summary && (
                  <p style={{margin: '5px 0', fontSize: '18px', fontWeight: 'bold', color: '#2c3e50'}}>Previsto: R$ {currentRegister.summary.expected.toFixed(2)}</p>
                )}
              </>
            )}
            {!currentRegister?.register && <p style={{margin: '5px 0', color: '#777'}}>Nenhum caixa aberto no momento.</p>}
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            {!currentRegister?.register && <button onClick={() => setShowOpenModal(true)} className="btn-primary" style={{padding: '12px 24px', fontSize: '16px'}}>🔓 Abrir Caixa</button>}
            {currentRegister?.register && <button onClick={() => setShowCloseModal(true)} className="btn-delete" style={{padding: '12px 24px', fontSize: '16px'}}>🔒 Fechar Caixa</button>}
          </div>
        </div>
      </div>

      {/* Current Register Transactions */}
      {currentRegister?.register && currentRegister.transactions?.length > 0 && (
        <div style={{background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
          <h3 style={{color: '#2c3e50', marginBottom: '15px'}}>Transações do Caixa Atual</h3>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Hora</th><th>Tipo</th><th>Descrição</th><th>Pagamento</th><th>Valor</th></tr></thead>
              <tbody>
                {currentRegister.transactions.map(t => (
                  <tr key={t.id} style={{background: t.type === 'venda' ? '#f9f9f9' : t.type === 'suprimento' ? '#eafaf1' : '#fdedec'}}>
                    <td>{t.created_at.split(' ')[1]}</td>
                    <td><span style={{fontWeight: 'bold', color: t.type === 'venda' ? '#3498db' : t.type === 'suprimento' ? '#27ae60' : '#e74c3c'}}>{t.type === 'venda' ? '🛒 Venda' : t.type === 'suprimento' ? '📥 Suprimento' : '📤 Sangria'}</span></td>
                    <td>{t.description}</td>
                    <td>{t.payment_method_name}</td>
                    <td style={{fontWeight: 'bold', fontSize: '16px', color: t.type === 'sangria' ? '#e74c3c' : '#2c3e50'}}>R$ {t.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History */}
      <div style={{background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
        <h3 style={{color: '#2c3e50', marginBottom: '15px'}}>Histórico de Caixas</h3>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>#</th><th>Abertura</th><th>Fechamento</th><th>Valor Inicial</th><th>Valor Final</th><th>Status</th><th>Usuário</th><th>Ações</th></tr></thead>
            <tbody>
              {history.map(r => (
                <tr key={r.id}>
                  <td style={{fontWeight: 'bold'}}>{r.id}</td>
                  <td>{r.opened_at}</td>
                  <td>{r.closed_at || '-'}</td>
                  <td>R$ {r.initial_amount.toFixed(2)}</td>
                  <td>{r.final_amount !== null ? `R$ ${r.final_amount.toFixed(2)}` : '-'}</td>
                  <td><span className={`status-badge ${r.status === 'aberto' ? 'status-active' : 'status-inactive'}`}>{r.status === 'aberto' ? 'Aberto' : 'Fechado'}</span></td>
                  <td>{r.user}</td>
                  <td><button onClick={() => viewRegisterSummary(r.id)} className="btn-edit" style={{padding: '4px 10px', fontSize: '12px'}}>{selectedRegister === r.id ? 'Fechar' : '📊 Detalhes'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Register Summary */}
      {summary && selectedRegister && (
        <div style={{background: 'white', borderRadius: '12px', padding: '20px', marginTop: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
          <h3 style={{color: '#2c3e50', marginBottom: '15px'}}>Resumo — Caixa #{summary.register.id}</h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px'}}>
            <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center'}}><div style={{fontSize: '20px', fontWeight: 'bold', color: '#27ae60'}}>R$ {summary.totalVendas.toFixed(2)}</div><div style={{fontSize: '12px', color: '#777'}}>Total Vendas</div></div>
            <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center'}}><div style={{fontSize: '20px', fontWeight: 'bold', color: '#3498db'}}>R$ {summary.totalSuprimentos.toFixed(2)}</div><div style={{fontSize: '12px', color: '#777'}}>Suprimentos</div></div>
            <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center'}}><div style={{fontSize: '20px', fontWeight: 'bold', color: '#e74c3c'}}>R$ {summary.totalSangrias.toFixed(2)}</div><div style={{fontSize: '12px', color: '#777'}}>Sangrias</div></div>
            <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center'}}><div style={{fontSize: '20px', fontWeight: 'bold', color: '#2c3e50'}}>R$ {summary.expected.toFixed(2)}</div><div style={{fontSize: '12px', color: '#777'}}>Previsto</div></div>
          </div>

          {Object.keys(summary.byPayment).length > 0 && (
            <>
              <h4 style={{color: '#2c3e50', marginBottom: '10px'}}>Por Forma de Pagamento</h4>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px'}}>
                {Object.entries(summary.byPayment).map(([name, data]) => (
                  <div key={name} style={{background: '#f8f9fa', padding: '12px', borderRadius: '8px'}}>
                    <div style={{fontWeight: 'bold', color: '#2c3e50'}}>{name}</div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '5px'}}>
                      <span style={{fontSize: '13px', color: '#777'}}>{data.count} vendas</span>
                      <span style={{fontWeight: 'bold', color: '#27ae60'}}>R$ {data.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Open Register Modal */}
      {showOpenModal && (
        <div className="modal-overlay" onClick={() => setShowOpenModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>🔓 Abrir Caixa</h2>
            <div className="form-group"><label>Valor Inicial (R$) *</label><input type="number" value={openForm.initial_amount} onChange={(e) => setOpenForm({...openForm, initial_amount: e.target.value})} min="0" step="0.01" placeholder="0.00" /></div>
            <div className="form-group"><label>Observações</label><input type="text" value={openForm.notes} onChange={(e) => setOpenForm({...openForm, notes: e.target.value})} placeholder="Ex: Turno manhã" /></div>
            <div className="modal-actions">
              <button onClick={() => setShowOpenModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleOpen} className="btn-primary">Abrir Caixa</button>
            </div>
          </div>
        </div>
      )}

      {/* Close Register Modal */}
      {showCloseModal && (
        <div className="modal-overlay" onClick={() => setShowCloseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>🔒 Fechar Caixa</h2>
            {currentRegister?.summary && (
              <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
                <p style={{margin: '5px 0'}}><strong>Valor Inicial:</strong> R$ {currentRegister.register.initial_amount.toFixed(2)}</p>
                <p style={{margin: '5px 0'}}><strong>Vendas:</strong> R$ {currentRegister.summary.vendas.toFixed(2)}</p>
                <p style={{margin: '5px 0'}}><strong>Suprimentos:</strong> R$ {currentRegister.summary.suprimentos.toFixed(2)}</p>
                <p style={{margin: '5px 0'}}><strong>Sangrias:</strong> R$ {currentRegister.summary.sangrias.toFixed(2)}</p>
                <hr style={{margin: '10px 0'}} />
                <p style={{margin: '5px 0', fontSize: '20px', fontWeight: 'bold', color: '#2c3e50'}}>Previsto: R$ {currentRegister.summary.expected.toFixed(2)}</p>
              </div>
            )}
            <div className="form-group"><label>Valor Final (Contado) *</label><input type="number" value={closeForm.final_amount} onChange={(e) => setCloseForm({...closeForm, final_amount: e.target.value})} min="0" step="0.01" placeholder="0.00" /></div>
            <div className="form-group"><label>Observações</label><input type="text" value={closeForm.notes} onChange={(e) => setCloseForm({...closeForm, notes: e.target.value})} placeholder="Ex: Diferença explicada por..." /></div>
            <div className="modal-actions">
              <button onClick={() => setShowCloseModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleClose} className="btn-delete">Fechar Caixa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
