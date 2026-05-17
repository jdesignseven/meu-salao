import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const API_URL = '/api';

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
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(url, { method, headers, body: JSON.stringify(formData) });
      if (res.ok) { setShowModal(false); fetchCategories(); fetchAccounts(); fetchPaymentMethods(); }
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
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
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#000', marginBottom: '24px' }}>Configurações Financeiras</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #ddd', marginBottom: '24px' }}>
        {[{key:'categorias', label:'Categorias'},{key:'contas', label:'Contas'},{key:'pagamento', label:'Formas de Pagamento'}].map(t => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} style={{
            padding: '12px 24px', border: 'none', borderBottom: activeTab === t.key ? '2px solid #002cd6' : '2px solid transparent',
            background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === t.key ? 500 : 400, color: activeTab === t.key ? '#002cd6' : '#606060'
          }}>{t.label}</button>
        ))}
      </div>

      {/* Categories Tab */}
      {activeTab === 'categorias' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#000', margin: 0 }}>Categorias</h2>
            <button onClick={() => openModal(null, 'categorias')} style={{
              display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#002cd6', color: '#fff',
              padding: '10px 20px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
            }}><Plus size={16} /> Nova Categoria</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {['receita', 'despesa'].map(type => (
              <div key={type} style={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 500, color: type === 'receita' ? '#4caf50' : '#f44336', margin: '0 0 16px', textTransform: 'capitalize' }}>{type === 'receita' ? 'Receitas' : 'Despesas'}</h3>
                {categories.filter(c => c.type === type).map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid #eee', fontSize: '14px' }}>
                    <span style={{ fontSize: '24px' }}>{c.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: '#000' }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: '#606060', marginTop: '4px' }}>Ativo: {c.active ? 'Sim' : 'Não'}</div>
                    </div>
                    <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: c.color }}></div>
                    <button onClick={() => openModal(c, 'categorias')} style={{
                      padding: '6px', background: '#002cd6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer'
                    }}><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(c.id)} style={{
                      padding: '6px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer'
                    }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Accounts Tab */}
      {activeTab === 'contas' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#000', margin: 0 }}>Contas</h2>
            <button onClick={() => openModal(null, 'contas')} style={{
              display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#002cd6', color: '#fff',
              padding: '10px 20px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
            }}><Plus size={16} /> Nova Conta</button>
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Nome</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Tipo</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Saldo</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#606060' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: '#000' }}>{a.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                      {a.type === 'dinheiro' ? '💵 Dinheiro' : a.type === 'banco' ? '🏦 Banco' : a.type === 'digital' ? '📱 Digital' : '💳 Cartão'}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500, fontSize: '16px', color: '#000' }}>R$ {a.balance.toFixed(2)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500,
                        backgroundColor: a.active ? '#e8f5e9' : '#f5f5f5', color: a.active ? '#4caf50' : '#606060'
                      }}>{a.active ? 'Ativo' : 'Inativo'}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openModal(a, 'contas')} style={{
                          padding: '6px', background: '#002cd6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer'
                        }}><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(a.id)} style={{
                          padding: '6px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer'
                        }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'pagamento' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#000', margin: 0 }}>Formas de Pagamento</h2>
            <button onClick={() => openModal(null, 'pagamento')} style={{
              display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#002cd6', color: '#fff',
              padding: '10px 20px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
            }}><Plus size={16} /> Nova Forma</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {paymentMethods.map(p => (
              <div key={p.id} style={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '32px' }}>{p.icon}</span>
                  <div>
                    <div style={{ fontWeight: 500, color: '#000', fontSize: '16px' }}>{p.name}</div>
                    <div style={{ fontSize: '13px', color: '#606060', marginTop: '4px' }}>{p.type}</div>
                  </div>
                </div>
                {p.max_installments > 1 && (
                  <span style={{ fontSize: '12px', background: '#e3f2fd', padding: '4px 8px', borderRadius: '4px', color: '#002cd6', display: 'inline-block', marginBottom: '12px' }}>
                    Até {p.max_installments}x parcelas
                  </span>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openModal(p, 'pagamento')} style={{
                    flex: 1, padding: '8px', background: '#002cd6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px'
                  }}><Edit2 size={14} /> Editar</button>
                  <button onClick={() => handleDelete(p.id)} style={{
                    flex: 1, padding: '8px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px'
                  }}><Trash2 size={14} /> Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowModal(false)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '24px', maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#000', margin: '0 0 24px' }}>
              {editingItem ? 'Editar' : 'Novo'} {activeTab === 'categorias' ? 'Categoria' : activeTab === 'contas' ? 'Conta' : 'Forma de Pagamento'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Nome *</label>
                <input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} required />
              </div>

              {activeTab === 'categorias' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Tipo</label>
                    <select value={formData.type || 'receita'} onChange={(e) => setFormData({...formData, type: e.target.value})}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}>
                      <option value="receita">Receita</option><option value="despesa">Despesa</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Ícone</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {iconPicker.map(icon => (
                        <button key={icon} type="button" onClick={() => setFormData({...formData, icon})}
                          style={{
                            padding: '8px 12px', border: formData.icon === icon ? '2px solid #002cd6' : '1px solid #ddd',
                            background: formData.icon === icon ? '#e3f2fd' : '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '18px'
                          }}>{icon}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Cor</label>
                    <input type="color" value={formData.color || '#999'} onChange={(e) => setFormData({...formData, color: e.target.value})}
                      style={{ width: '60px', height: '40px', padding: '2px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px' }} />
                  </div>
                </>
              )}

              {activeTab === 'contas' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Tipo</label>
                    <select value={formData.type || 'dinheiro'} onChange={(e) => setFormData({...formData, type: e.target.value})}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}>
                      <option value="dinheiro">💵 Dinheiro</option><option value="banco">🏦 Banco</option><option value="digital">📱 Digital</option><option value="cartao">💳 Cartão</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Saldo Inicial (R$)</label>
                    <input type="number" value={formData.balance || 0} onChange={(e) => setFormData({...formData, balance: e.target.value})}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} min="0" step="0.01" />
                  </div>
                </>
              )}

              {activeTab === 'pagamento' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Tipo</label>
                    <input type="text" value={formData.type || ''} onChange={(e) => setFormData({...formData, type: e.target.value})}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Ícone</label>
                    <input type="text" value={formData.icon || ''} onChange={(e) => setFormData({...formData, icon: e.target.value})}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} maxLength="2" />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Max Parcelas</label>
                    <input type="number" value={formData.max_installments || 1} onChange={(e) => setFormData({...formData, max_installments: e.target.value})}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} min="1" max="24" />
                  </div>
                </>
              )}

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#606060', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.active === 1} onChange={(e) => setFormData({...formData, active: e.target.checked ? 1 : 0})}
                    style={{ marginRight: '8px' }} />Ativo
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{
                  padding: '10px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', cursor: 'pointer'
                }}>Cancelar</button>
                <button type="submit" style={{
                  padding: '10px 20px', background: '#002cd6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
                }}>{editingItem ? 'Salvar' : 'Cadastrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
