import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, TrendingUp, ArrowDownRight, DollarSign, CheckCircle, Undo2, Edit, Trash2 } from 'lucide-react';

const API_URL = '/api';

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
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(url, {
        method,
        headers,
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
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${API_URL}/financial/transactions/${id}/status`, {
        method: 'PATCH',
        headers,
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
      await Promise.all(overdueIds.map(id => {
        const headers = getAuthHeader();
        headers['Content-Type'] = 'application/json';
        return fetch(`${API_URL}/financial/transactions/${id}/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status })
        });
      }));
      fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  const isOverdue = (tx) => tx.due_date < new Date().toISOString().split('T')[0] && tx.status === 'pendente';

  if (loading) return <div style={{ padding: '24px', color: '#606060' }}>Carregando...</div>;

  const totalReceitas = transactions.filter(t => t.type === 'receita' && t.status === 'pago').reduce((s, t) => s + t.amount, 0);
  const totalDespesas = transactions.filter(t => t.type === 'despesa' && t.status === 'pago').reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#000', margin: 0 }}>Lançamentos Financeiros</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="/financeiro" style={{
            display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', color: '#606060',
            padding: '10px 20px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', textDecoration: 'none'
          }}><ArrowLeft size={16} /> Dashboard</a>
          <button onClick={() => openModal()} style={{
            display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#002cd6', color: '#fff',
            padding: '10px 20px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
          }}><Plus size={16} /> Novo Lançamento</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { icon: TrendingUp, color: '#4caf50', label: 'Total Receitas', value: `R$ ${totalReceitas.toFixed(2)}` },
          { icon: ArrowDownRight, color: '#f44336', label: 'Total Despesas', value: `R$ ${totalDespesas.toFixed(2)}` },
          { icon: DollarSign, color: '#002cd6', label: 'Saldo Período', value: `R$ ${(totalReceitas - totalDespesas).toFixed(2)}` }
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

      {/* Filters */}
      <div style={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Buscar..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', flex: 1, minWidth: '200px' }} />
          <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}>
            <option value="">Tipo</option><option value="receita">Receita</option><option value="despesa">Despesa</option>
          </select>
          <select value={filters.category_id} onChange={(e) => setFilters({...filters, category_id: e.target.value})}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}>
            <option value="">Categoria</option>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}>
            <option value="">Status</option><option value="pago">Pago</option><option value="pendente">Pendente</option><option value="parcial">Parcial</option>
          </select>
          <input type="date" value={filters.date_from} onChange={(e) => setFilters({...filters, date_from: e.target.value})}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
          <input type="date" value={filters.date_to} onChange={(e) => setFilters({...filters, date_to: e.target.value})}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
          <button onClick={() => setFilters({ type: '', category_id: '', account_id: '', status: '', payment_method_id: '', date_from: '', date_to: '', search: '' })}
            style={{ padding: '8px 16px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>Limpar</button>
        </div>
        {transactions.some(t => isOverdue(t)) && (
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#f44336', fontWeight: 500 }}>⚠️ {transactions.filter(t => isOverdue(t)).length} vencido(s)</span>
            <button onClick={() => handleStatusChangeAll('pago')}
              style={{ padding: '6px 12px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>✅ Pagar Todos</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Código</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Vencimento</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Descrição</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Categoria</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Tipo</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Valor</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Pagamento</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr><td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: '#606060', fontSize: '14px' }}>Nenhum lançamento encontrado</td></tr>
            ) : transactions.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #eee', background: isOverdue(t) ? '#fff5f5' : '#fff' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '13px', color: '#002cd6' }}>{t.code}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{new Date(t.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                  <strong>{t.description}</strong>
                  {t.client_name && <div style={{ fontSize: '12px', color: '#606060', marginTop: '4px' }}>{t.client_name}</div>}
                  {t.installments > 1 && <div style={{ fontSize: '12px', color: '#606060', marginTop: '4px' }}>{t.installments}x parcela(s)</div>}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{t.category_name}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontWeight: 500, color: t.type === 'receita' ? '#4caf50' : '#f44336', fontSize: '13px' }}>
                    {t.type === 'receita' ? '↑ Receita' : '↓ Despesa'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 500, fontSize: '14px', color: t.type === 'receita' ? '#4caf50' : '#f44336' }}>
                  R$ {t.amount.toFixed(2)}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{t.payment_method_name || '-'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500,
                    backgroundColor: t.status === 'pago' ? '#e8f5e9' : t.status === 'pendente' ? '#fff3e0' : '#f5f5f5',
                    color: t.status === 'pago' ? '#4caf50' : t.status === 'pendente' ? '#ff9800' : '#606060'
                  }}>
                    {t.status === 'pago' ? 'Pago' : t.status === 'pendente' ? 'Pendente' : 'Parcial'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {t.status === 'pendente' && (
                      <button onClick={() => handleStatusChange(t.id, 'pago')} style={{
                        padding: '4px 8px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                      }}><CheckCircle size={14} /></button>
                    )}
                    {t.status === 'pago' && (
                      <button onClick={() => handleStatusChange(t.id, 'pendente')} style={{
                        padding: '4px 8px', background: '#ff9800', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                      }}><Undo2 size={14} /></button>
                    )}
                    <button onClick={() => openModal(t)} style={{
                      padding: '4px 8px', background: '#002cd6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                    }}><Edit size={14} /></button>
                    <button onClick={() => handleDelete(t.id)} style={{
                      padding: '4px 8px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                    }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowModal(false)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '24px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#000', margin: '0 0 24px' }}>{editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Tipo *</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setFormData({...formData, type: 'receita'})} style={{
                    flex: 1, padding: '12px', border: formData.type === 'receita' ? '2px solid #4caf50' : '1px solid #ddd',
                    background: formData.type === 'receita' ? '#e8f5e9' : '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: formData.type === 'receita' ? '#4caf50' : '#606060'
                  }}>↑ Receita</button>
                  <button type="button" onClick={() => setFormData({...formData, type: 'despesa'})} style={{
                    flex: 1, padding: '12px', border: formData.type === 'despesa' ? '2px solid #f44336' : '1px solid #ddd',
                    background: formData.type === 'despesa' ? '#ffebee' : '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: formData.type === 'despesa' ? '#f44336' : '#606060'
                  }}>↓ Despesa</button>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Descrição *</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Categoria *</label>
                  <select value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} required>
                    <option value="">Selecione</option>
                    {categories.filter(c => c.type === formData.type).map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Valor (R$) *</label>
                  <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} min="0" step="0.01" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Conta *</label>
                  <select value={formData.account_id} onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} required>
                    <option value="">Selecione</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Forma de Pagamento *</label>
                  <select value={formData.payment_method_id} onChange={(e) => setFormData({...formData, payment_method_id: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} required>
                    <option value="">Selecione</option>
                    {paymentMethods.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Vencimento *</label>
                  <input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Parcelas</label>
                  <input type="number" value={formData.installments} onChange={(e) => setFormData({...formData, installments: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} min="1" max="24" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Cliente (opcional)</label>
                  <select value={formData.client_id} onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}>
                    <option value="">Nenhum</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}>
                    <option value="pendente">Pendente</option><option value="pago">Pago</option><option value="parcial">Parcial</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Observações</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', minHeight: '80px', resize: 'vertical' }} rows="3" />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{
                  padding: '10px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', cursor: 'pointer'
                }}>Cancelar</button>
                <button type="submit" style={{
                  padding: '10px 20px', background: '#002cd6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
                }}>{editingTransaction ? 'Salvar' : 'Cadastrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
