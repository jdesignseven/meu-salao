import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export default function FinancialConfig() {
  const [activeTab, setActiveTab] = useState('categorias');
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (activeTab === 'categorias') fetchCategories();
    if (activeTab === 'contas') fetchAccounts();
    if (activeTab === 'pagamento') fetchPaymentMethods();
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/financial/categories`, { headers: getAuthHeader() });
      if (res.ok) setCategories(await res.json());
    } catch (error) { console.error(error); }
  };
  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/financial/accounts`, { headers: getAuthHeader() });
      if (res.ok) setAccounts(await res.json());
    } catch (error) { console.error(error); }
  };
  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch(`${API_URL}/financial/payment-methods`, { headers: getAuthHeader() });
      if (res.ok) setPaymentMethods(await res.json());
    } catch (error) { console.error(error); }
  };

  const openModal = (item = null, tab = activeTab) => {
    if (tab === 'categorias') {
      setEditingItem(item);
      setFormData(item ? { ...item } : { name: '', type: 'receita', icon: '📝', color: '#999', active: 1 });
    } else if (tab === 'contas') {
      setEditingItem(item);
      setFormData(item ? { ...item } : { name: '', type: 'dinheiro', balance: 0, active: 1 });
    } else {
      setEditingItem(item);
      setFormData(item ? { ...item } : { name: '', type: 'dinheiro', icon: '💰', max_installments: 1, active: 1 });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let endpoint = '';
    if (activeTab === 'categorias') endpoint = 'categories';
    else if (activeTab === 'contas') endpoint = 'accounts';
    else endpoint = 'payment-methods';

    try {
      const url = editingItem ? `${API_URL}/financial/${endpoint}/${editingItem.id}` : `${API_URL}/financial/${endpoint}`;
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { ...getAuthHeader(), 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { setShowModal(false); fetchCategories(); fetchAccounts(); fetchPaymentMethods(); }
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir?')) return;
    let endpoint = '';
    if (activeTab === 'categorias') endpoint = 'categories';
    else if (activeTab === 'contas') endpoint = 'accounts';
    else endpoint = 'payment-methods';
    try {
      const res = await fetch(`${API_URL}/financial/${endpoint}/${id}`, { method: 'DELETE', headers: getAuthHeader() });
      if (res.ok) { fetchCategories(); fetchAccounts(); fetchPaymentMethods(); }
    } catch (error) { console.error(error); }
  };

  const iconPicker = ['📝','💰','✂️','📦','🏠','🛒','💵','💡','💧','📱','🧹','📢','🎯','🔧','📄','🔵','🏦','💳'];

  return (
    <div className="page">
      <div className="page-header"><h1>Configurações Financeiras</h1></div>
      <div style={{display: 'flex', gap: '5px', borderBottom: '2px solid #ddd', marginBottom: '20px'}}>
        {[{key:'categorias', label:'Categorias'},{key:'contas', label:'Contas'},{key:'pagamento', label:'Formas de Pagamento'}].map(t => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} style={{padding: '10px 20px', border: 'none', borderBottom: activeTab === t.key ? '3px solid #007bff' : '3px solid transparent', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === t.key ? 'bold' : 'normal'}}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'categorias' && (
        <>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
            <h2>Categorias</h2>
            <button onClick={() => openModal(null, 'categorias')} className="btn-primary">+ Nova Categoria</button>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
            {['receita', 'despesa'].map(type => (
              <div key={type} style={{background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
                <h3 style={{color: type === 'receita' ? '#27ae60' : '#e74c3c', marginBottom: '10px', textTransform: 'capitalize'}}>{type === 'receita' ? 'Receitas' : 'Despesas'}</h3>
                {categories.filter(c => c.type === type).map(c => (
                  <div key={c.id} style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderBottom: '1px solid #eee', fontSize: '14px'}}>
                    <span style={{fontSize: '20px'}}>{c.icon}</span>
                    <div style={{flex: 1}}><strong>{c.name}</strong><br/><span style={{fontSize: '11px', color: '#999'}}>Ativo: {c.active ? 'Sim' : 'Não'}</span></div>
                    <div style={{width: '20px', height: '20px', borderRadius: '4px', background: c.color}}></div>
                    <button onClick={() => openModal(c, 'categorias')} className="btn-edit" style={{padding: '4px 8px', fontSize: '11px'}}>Editar</button>
                    <button onClick={() => handleDelete(c.id)} className="btn-delete" style={{padding: '4px 8px', fontSize: '11px'}}>Excluir</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'contas' && (
        <>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
            <h2>Contas</h2>
            <button onClick={() => openModal(null, 'contas')} className="btn-primary">+ Nova Conta</button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Nome</th><th>Tipo</th><th>Saldo</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>{accounts.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.name}</strong></td>
                  <td>{a.type === 'dinheiro' ? '💵 Dinheiro' : a.type === 'banco' ? '🏦 Banco' : a.type === 'digital' ? '📱 Digital' : '💳 Cartão'}</td>
                  <td style={{fontWeight: 'bold', color: '#2c3e50', fontSize: '18px'}}>R$ {a.balance.toFixed(2)}</td>
                  <td><span className={`status-badge ${a.active ? 'status-active' : 'status-inactive'}`}>{a.active ? 'Ativo' : 'Inativo'}</span></td>
                  <td className="actions"><button onClick={() => openModal(a, 'contas')} className="btn-edit">Editar</button><button onClick={() => handleDelete(a.id)} className="btn-delete">Excluir</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'pagamento' && (
        <>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
            <h2>Formas de Pagamento</h2>
            <button onClick={() => openModal(null, 'pagamento')} className="btn-primary">+ Nova Forma</button>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px'}}>
            {paymentMethods.map(p => (
              <div key={p.id} style={{background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                  <span style={{fontSize: '28px'}}>{p.icon}</span>
                  <div><strong style={{fontSize: '16px'}}>{p.name}</strong><br/><span style={{fontSize: '12px', color: '#777'}}>{p.type}</span></div>
                </div>
                {p.max_installments > 1 && <span style={{fontSize: '12px', background: '#ebf5fb', padding: '2px 8px', borderRadius: '4px', color: '#3498db'}}>Até {p.max_installments}x parcelas</span>}
                <div style={{display: 'flex', gap: '8px', marginTop: '15px'}}>
                  <button onClick={() => openModal(p, 'pagamento')} className="btn-edit" style={{flex: 1, padding: '6px', fontSize: '12px'}}>Editar</button>
                  <button onClick={() => handleDelete(p.id)} className="btn-delete" style={{flex: 1, padding: '6px', fontSize: '12px'}}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{marginBottom: '20px'}}>{editingItem ? 'Editar' : 'Novo'} {activeTab === 'categorias' ? 'Categoria' : activeTab === 'contas' ? 'Conta' : 'Forma de Pagamento'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Nome *</label><input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
              {activeTab === 'categorias' && (
                <>
                  <div className="form-group"><label>Tipo</label><select value={formData.type || 'receita'} onChange={(e) => setFormData({...formData, type: e.target.value})}><option value="receita">Receita</option><option value="despesa">Despesa</option></select></div>
                  <div className="form-group"><label>Ícone</label><div style={{display: 'flex', gap: '5px', flexWrap: 'wrap'}}>{iconPicker.map(icon => (<button key={icon} type="button" onClick={() => setFormData({...formData, icon})} style={{padding: '8px', border: formData.icon === icon ? '2px solid #3498db' : '1px solid #ddd', background: formData.icon === icon ? '#ebf5fb' : 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '18px'}}>{icon}</button>))}</div></div>
                  <div className="form-group"><label>Cor</label><input type="color" value={formData.color || '#999'} onChange={(e) => setFormData({...formData, color: e.target.value})} style={{width: '60px', height: '40px', padding: '2px', cursor: 'pointer'}} /></div>
                </>
              )}
              {activeTab === 'contas' && (
                <>
                  <div className="form-group"><label>Tipo</label><select value={formData.type || 'dinheiro'} onChange={(e) => setFormData({...formData, type: e.target.value})}><option value="dinheiro">💵 Dinheiro</option><option value="banco">🏦 Banco</option><option value="digital">📱 Digital</option><option value="cartao">💳 Cartão</option></select></div>
                  <div className="form-group"><label>Saldo Inicial (R$)</label><input type="number" value={formData.balance || 0} onChange={(e) => setFormData({...formData, balance: e.target.value})} min="0" step="0.01" /></div>
                </>
              )}
              {activeTab === 'pagamento' && (
                <>
                  <div className="form-group"><label>Tipo</label><input type="text" value={formData.type || ''} onChange={(e) => setFormData({...formData, type: e.target.value})} /></div>
                  <div className="form-group"><label>Ícone</label><input type="text" value={formData.icon || ''} onChange={(e) => setFormData({...formData, icon: e.target.value})} maxLength="2" /></div>
                  <div className="form-group"><label>Max Parcelas</label><input type="number" value={formData.max_installments || 1} onChange={(e) => setFormData({...formData, max_installments: e.target.value})} min="1" max="24" /></div>
                </>
              )}
              <div className="form-group"><label><input type="checkbox" checked={formData.active === 1} onChange={(e) => setFormData({...formData, active: e.target.checked ? 1 : 0})} style={{marginRight: '8px'}} />Ativo</label></div>
              <div className="modal-actions"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">{editingItem ? 'Salvar' : 'Cadastrar'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
