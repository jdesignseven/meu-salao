import { useState, useEffect } from 'react';
import { DollarSign, Plus, X } from 'lucide-react';

const API_URL = '/api';

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
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${API_URL}/cash/open`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(openForm)
      });
      if (res.ok) { setShowOpenModal(false); fetchData(); }
    } catch (error) { console.error('Error:', error); }
  };

  const handleClose = async () => {
    if (!closeForm.final_amount) { alert('Informe o valor final'); return; }
    try {
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${API_URL}/cash/close`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(closeForm)
      });
      if (res.ok) {
        const result = await res.json();
        setShowCloseModal(false);
        fetchData();
        alert(`Caixa fechado!\nDiferença: R$ ${result.difference.toFixed(2)}`);
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

  const updateOpenForm = (field, value) => {
    setOpenForm(prev => ({ ...prev, [field]: value }));
  };

  const updateCloseForm = (field, value) => {
    setCloseForm(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <div style={{ padding: '24px', color: '#606060' }}>Carregando...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#000', marginBottom: '24px' }}>Gestão de Caixa</h1>

      <div style={{
        background: currentRegister?.register ? '#e3f2fd' : '#ffebee',
        border: `1px solid ${currentRegister?.register ? '#002cd6' : '#f44336'}`,
        borderRadius: '4px', padding: '20px', marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 500, color: '#000' }}>
              {currentRegister?.register ? `Caixa #${currentRegister.register.id} — ABERTO` : 'Caixa Fechado'}
            </h2>
            {currentRegister?.register && (
              <div>
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#606060' }}>
                  Aberto em: <strong>{currentRegister.register.opened_at}</strong> por {currentRegister.register.user}
                </p>
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#606060' }}>
                  Valor Inicial: <strong>R$ {currentRegister.register.initial_amount.toFixed(2)}</strong>
                </p>
              </div>
            )}
            {!currentRegister?.register && (
              <p style={{ margin: '4px 0', color: '#606060', fontSize: '14px' }}>Nenhum caixa aberto no momento.</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {!currentRegister?.register && (
              <button onClick={() => setShowOpenModal(true)} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                backgroundColor: '#002cd6', color: '#fff', border: 'none', borderRadius: '4px',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer'
              }}><Plus size={16} /> Abrir Caixa</button>
            )}
            {currentRegister?.register && (
              <button onClick={() => setShowCloseModal(true)} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                backgroundColor: '#f44336', color: '#fff', border: 'none', borderRadius: '4px',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer'
              }}><X size={16} /> Fechar Caixa</button>
            )}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#000', margin: '0 0 16px' }}>Histórico de Caixas</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>#</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Abertura</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Fechamento</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Valor Inicial</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Valor Final</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Usuário</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {history.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{r.id}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{r.opened_at}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{r.closed_at || '-'}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>R$ {r.initial_amount.toFixed(2)}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{r.final_amount !== null ? `R$ ${r.final_amount.toFixed(2)}` : '-'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500,
                    backgroundColor: r.status === 'aberto' ? '#e8f5e9' : '#f5f5f5',
                    color: r.status === 'aberto' ? '#4caf50' : '#606060'
                  }}>
                    {r.status === 'aberto' ? 'Aberto' : 'Fechado'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{r.user}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => viewRegisterSummary(r.id)} style={{
                    padding: '6px 12px', background: selectedRegister === r.id ? '#ff9800' : '#002cd6',
                    color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500
                  }}>{selectedRegister === r.id ? 'Fechar' : 'Detalhes'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Open Modal */}
      {showOpenModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowOpenModal(false)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '24px', maxWidth: '400px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#000', margin: '0 0 24px' }}>Abrir Caixa</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Valor Inicial (R$) *</label>
              <input type="number" value={openForm.initial_amount} onChange={(e) => updateOpenForm('initial_amount', e.target.value)}
                min="0" step="0.01" placeholder="0.00"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Observações</label>
              <input type="text" value={openForm.notes} onChange={(e) => updateOpenForm('notes', e.target.value)}
                placeholder="Ex: Turno manhã"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowOpenModal(false)} style={{
                padding: '10px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', cursor: 'pointer'
              }}>Cancelar</button>
              <button onClick={handleOpen} style={{
                padding: '10px 20px', background: '#002cd6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
              }}>Abrir Caixa</button>
            </div>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {showCloseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowCloseModal(false)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '24px', maxWidth: '400px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#000', margin: '0 0 24px' }}>Fechar Caixa</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Valor Final (Contado) *</label>
              <input type="number" value={closeForm.final_amount} onChange={(e) => updateCloseForm('final_amount', e.target.value)}
                min="0" step="0.01" placeholder="0.00"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Observações</label>
              <input type="text" value={closeForm.notes} onChange={(e) => updateCloseForm('notes', e.target.value)}
                placeholder="Ex: Diferença explicada por..."
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCloseModal(false)} style={{
                padding: '10px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', cursor: 'pointer'
              }}>Cancelar</button>
              <button onClick={handleClose} style={{
                padding: '10px 20px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
              }}>Fechar Caixa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
