import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export default function FinancialTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filters, setFilters] = useState({ type: '', category_id: '', account_id: '', status: '', payment_method_id: '', date_from: '', date_to: '', search: '' });
  const [formData, setFormData] = useState({
    type: 'receita', category_id: '', account_id: '', payment_method_id: '', client_id: '',
    description: '', amount: '', installments: 1, due_date: new Date().toISOString().split('T')[0], status: 'pendente', notes: ''
  });

  useEffect(() => { fetchData(); }, [filters]);

  const fetchData = async () => {
    try {
      let url = `${API_URL}/financial/transactions?`;
      Object.entries(filters).forEach(([k, v]) => { if (v) url += `${k}=${encodeURIComponent(v)}&`; });
      const [txRes, catRes, accRes, pmRes, clRes] = await Promise.all([
        fetch(url, { headers: getAuthHeader() }),
        fetch(`${API_URL}/financial/categories`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/financial/accounts?active=1`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/financial/payment-methods`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/clients`, { headers: getAuthHeader() })
      ]);
      if (txRes.ok) setTransactions(await txRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (accRes.ok) setAccounts(await accRes.json());
      if (pmRes.ok) setPaymentMethods(await pmRes.json());
      if (clRes.ok) setClients(await clRes.json());
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const openModal = (tx = null) => {
    if (tx) {
      setEditingTransaction(tx);
      setFormData({
        type: tx.type, category_id: tx.category_id, account_id: tx.account_id, payment_method_id: tx.payment_method_id,
        client_id: tx.client_id || '', description: tx.description, amount: tx.amount,
        installments: tx.installments, due_date: tx.due_date, status: tx.status, notes: tx.notes || ''
      });
    } else {
      setEditingTransaction(null);
      setFormData({
        type: 'receita', category_id: '', account_id: '', payment_method_id: '', client_id: '',
        description: '', amount: '', installments: 1, due_date: new Date().toISOString().split('T')[0], status: 'pendente', notes: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingTransaction ? `${API_URL}/financial/transactions/${editingTransaction.id}` : `${API_URL}/financial/transactions`;
      const method = editingTransaction ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) { fetchData(); setShowModal(false); }
    } catch (error) { console.error('Error saving transaction:', error); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
      const res = await fetch(`${API_URL}/financial/transactions/${id}`, { method: 'DELETE', headers: getAuthHeader() });
      if (res.ok) fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/financial/transactions/${id}/status`, {
        method: 'PATCH',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  const handleStatusChangeAll = async (status) => {
    const overdueIds = transactions.filter(t => t.due_date < new Date().toISOString().split('T')[0] && t.status === 'pendente').map(t => t.id);
    if (overdueIds.length === 0) { alert('Nenhum lançamento pendente para atualizar'); return; }
    if (!confirm(`Marcar ${overdueIds.length} lançamentos como ${status}?`)) return;
    try {
      await Promise.all(overdueIds.map(id =>
        fetch(`${API_URL}/financial/transactions/${id}/status`, {
          method: 'PATCH',
          headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        })
      ));
      fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  const getStatusBadge = (status) => {
    const map = { pago: { label: 'Pago', cls: 'status-active' }, pendente: { label: 'Pendente', cls: 'status-scheduled' }, parcial: { label: 'Parcial', cls: '' } };
    const s = map[status] || { label: status, cls: '' };
    return <span className={`status-badge ${s.cls}`}>{s.label}</span>;
  };

  const isOverdue = (tx) => tx.due_date < new Date().toISOString().split('T')[0] && tx.status === 'pendente';

  if (loading) return <div className="loading">Carregando...</div>;

  const totalReceitas = transactions.filter(t => t.type === 'receita' && t.status === 'pago').reduce((s, t) => s + t.amount, 0);
  const totalDespesas = transactions.filter(t => t.type === 'despesa' && t.status === 'pago').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Lançamentos Financeiros</h1>
        <div style={{display: 'flex', gap: '10px'}}>
          <a href="/financeiro" style={{padding: '10px 20px', background: '#95a5a6', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center'}}>← Dashboard</a>
          <button onClick={() => openModal()} className="btn-primary">+ Novo Lançamento</button>
        </div>
      </div>

      <div className="stats-grid" style={{marginBottom: '20px'}}>
        <div className="stat-card"><div className="stat-icon" style={{background: '#eafaf1', color: '#27ae60'}}>💰</div><div className="stat-info"><h3 style={{color: '#27ae60'}}>R$ {totalReceitas.toFixed(2)}</h3><p>Total Receitas (Pagas)</p></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background: '#fdedec', color: '#e74c3c'}}>📉</div><div className="stat-info"><h3 style={{color: '#e74c3c'}}>R$ {totalDespesas.toFixed(2)}</h3><p>Total Despesas (Pagas)</p></div></div>
        <div className="stat-card"><div className="stat-icon" style={{background: '#ebf5fb', color: '#3498db'}}>📊</div><div className="stat-info"><h3 style={{color: '#3498db'}}>R$ {(totalReceitas - totalDespesas).toFixed(2)}</h3><p>Saldo Período</p></div></div>
      </div>

      {/* Filters */}
      <div style={{background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
          <input type="text" placeholder="Buscar..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} style={{padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', flex: '1', minWidth: '200px'}} />
          <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})} style={{padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px'}}><option value="">Tipo</option><option value="receita">Receita</option><option value="despesa">Despesa</option></select>
          <select value={filters.category_id} onChange={(e) => setFilters({...filters, category_id: e.target.value})} style={{padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px'}}><option value="">Categoria</option>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
          <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} style={{padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px'}}><option value="">Status</option><option value="pago">Pago</option><option value="pendente">Pendente</option><option value="parcial">Parcial</option></select>
          <input type="date" value={filters.date_from} onChange={(e) => setFilters({...filters, date_from: e.target.value})} style={{padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px'}} />
          <input type="date" value={filters.date_to} onChange={(e) => setFilters({...filters, date_to: e.target.value})} style={{padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px'}} />
          <button onClick={() => setFilters({ type: '', category_id: '', account_id: '', status: '', payment_method_id: '', date_from: '', date_to: '', search: '' })} className="btn-secondary" style={{padding: '8px 12px', fontSize: '13px'}}>Limpar</button>
        </div>
        {transactions.some(t => isOverdue(t)) && (
          <div style={{marginTop: '10px', display: 'flex', gap: '10px'}}>
            <span style={{fontSize: '13px', color: '#e74c3c', fontWeight: 'bold'}}>⚠️ {transactions.filter(t => isOverdue(t)).length} vencido(s)</span>
            <button onClick={() => handleStatusChangeAll('pago')} style={{padding: '4px 10px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'}}>✅ Pagar Todos</button>
          </div>
        )}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Código</th><th>Data</th><th>Vencimento</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th><th>Pagamento</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {transactions.length === 0 ? <tr><td colSpan="10" className="empty-row">Nenhum lançamento encontrado</td></tr> :
              transactions.map(t => (
                <tr key={t.id} style={isOverdue(t) ? {background: '#fff5f5'} : {}}>
                  <td style={{fontFamily: 'monospace', fontSize: '12px', color: '#3498db'}}>{t.code}</td>
                  <td style={{fontSize: '13px'}}>{new Date(t.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td style={{fontSize: '13px'}}>{new Date(t.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td><strong>{t.description}</strong>{t.client_name && <><br/><span style={{fontSize: '11px', color: '#777'}}>{t.client_name}</span></>}{t.installments > 1 && <><br/><span style={{fontSize: '11px', color: '#777'}}>{t.installments}x parcela(s)</span></>}</td>
                  <td style={{fontSize: '13px'}}>{t.category_name}</td>
                  <td><span style={{fontWeight: 'bold', color: t.type === 'receita' ? '#27ae60' : '#e74c3c', fontSize: '12px'}}>{t.type === 'receita' ? '↑ Receita' : '↓ Despesa'}</span></td>
                  <td style={{fontWeight: 'bold', fontSize: '14px', color: t.type === 'receita' ? '#27ae60' : '#e74c3c'}}>R$ {t.amount.toFixed(2)}</td>
                  <td style={{fontSize: '12px'}}>{t.payment_method_name || '-'}</td>
                  <td>{getStatusBadge(t.status)}</td>
                  <td className="actions" style={{flexWrap: 'wrap'}}>
                    {t.status === 'pendente' && <button onClick={() => handleStatusChange(t.id, 'pago')} className="btn-complete" style={{padding: '3px 8px', fontSize: '11px', marginBottom: '4px'}}>✅ Pago</button>}
                    {t.status === 'pago' && <button onClick={() => handleStatusChange(t.id, 'pendente')} className="btn-cancel" style={{padding: '3px 8px', fontSize: '11px', marginBottom: '4px'}}>↩️ Estornar</button>}
                    <button onClick={() => openModal(t)} className="btn-edit" style={{padding: '3px 8px', fontSize: '11px', marginBottom: '4px'}}>Editar</button>
                    <button onClick={() => handleDelete(t.id)} className="btn-delete" style={{padding: '3px 8px', fontSize: '11px', marginBottom: '4px'}}>Excluir</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <h2 style={{marginBottom: '20px', color: '#2c3e50'}}>{editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tipo *</label>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button type="button" onClick={() => setFormData({...formData, type: 'receita'})} style={{flex: 1, padding: '12px', border: formData.type === 'receita' ? '2px solid #27ae60' : '1px solid #ddd', background: formData.type === 'receita' ? '#eafaf1' : 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: formData.type === 'receita' ? '#27ae60' : '#777'}}>↑ Receita</button>
                  <button type="button" onClick={() => setFormData({...formData, type: 'despesa'})} style={{flex: 1, padding: '12px', border: formData.type === 'despesa' ? '2px solid #e74c3c' : '1px solid #ddd', background: formData.type === 'despesa' ? '#fdedec' : 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: formData.type === 'despesa' ? '#e74c3c' : '#777'}}>↓ Despesa</button>
                </div>
              </div>
              <div className="form-group"><label>Descrição *</label><input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required /></div>
              <div className="form-row">
                <div className="form-group"><label>Categoria *</label><select value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} required>{categories.filter(c => c.type === formData.type).map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
                <div className="form-group"><label>Valor (R$) *</label><input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} min="0" step="0.01" required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Conta *</label><select value={formData.account_id} onChange={(e) => setFormData({...formData, account_id: e.target.value})} required>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                <div className="form-group"><label>Forma de Pagamento *</label><select value={formData.payment_method_id} onChange={(e) => setFormData({...formData, payment_method_id: e.target.value})} required>{paymentMethods.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Vencimento *</label><input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} required /></div>
                <div className="form-group"><label>Parcelas</label><input type="number" value={formData.installments} onChange={(e) => setFormData({...formData, installments: e.target.value})} min="1" max="24" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Cliente (opcional)</label><select value={formData.client_id} onChange={(e) => setFormData({...formData, client_id: e.target.value})}><option value="">Nenhum</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div className="form-group"><label>Status</label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}><option value="pendente">Pendente</option><option value="pago">Pago</option><option value="parcial">Parcial</option></select></div>
              </div>
              <div className="form-group"><label>Observações</label><textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows="2" /></div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">{editingTransaction ? 'Salvar' : 'Cadastrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
