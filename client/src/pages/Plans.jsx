import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

const API_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', benefits: '' });

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API_URL}/plans`, { headers: getAuthHeader() });
      if (res.ok) setPlans(await res.json());
    } catch (error) { console.error('Error fetching plans:', error); }
    finally { setLoading(false); }
  };

  const openModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({ name: plan.name, description: plan.description || '', price: plan.price?.toString() || '', benefits: plan.benefits || '' });
    } else {
      setEditingPlan(null);
      setFormData({ name: '', description: '', price: '', benefits: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingPlan ? `${API_URL}/plans/${editingPlan.id}` : `${API_URL}/plans`;
      const method = editingPlan ? 'PUT' : 'POST';
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(url, { method, headers, body: JSON.stringify({ ...formData, price: parseFloat(formData.price) || 0 }) });
      if (res.ok) { fetchPlans(); setShowModal(false); }
    } catch (error) { console.error('Error saving plan:', error); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;
    try {
      const res = await fetch(`${API_URL}/plans/${id}`, { method: 'DELETE', headers: getAuthHeader() });
      if (res.ok) fetchPlans();
    } catch (error) { console.error('Error deleting plan:', error); }
  };

  const toggleActive = async (plan) => {
    try {
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      await fetch(`${API_URL}/plans/${plan.id}`, { method: 'PUT', headers, body: JSON.stringify({ ...plan, active: plan.active ? 0 : 1 }) });
      fetchPlans();
    } catch (error) { console.error('Error toggling plan:', error); }
  };

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Planos</h1>
        <button onClick={() => openModal()} className="btn-primary"><Plus size={16} /> Novo Plano</button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th><th>Descrição</th><th>Valor</th><th>Benefícios</th><th>Ativo</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? <tr><td colSpan="6" className="empty-row">Nenhum plano cadastrado</td></tr> :
              plans.map((plan) => (
                <tr key={plan.id}>
                  <td><strong>{plan.name}</strong></td>
                  <td>{plan.description || '-'}</td>
                  <td>R$ {parseFloat(plan.price || 0).toFixed(2)}</td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'pre-wrap', fontSize: '12px' }}>{plan.benefits || '-'}</td>
                  <td>
                    <button onClick={() => toggleActive(plan)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: plan.active ? '#4caf50' : '#f44336' }}>
                      {plan.active ? <Check size={18} /> : <X size={18} />}
                    </button>
                  </td>
                  <td className="actions">
                    <button onClick={() => openModal(plan)} className="btn-edit"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(plan.id)} className="btn-delete"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome do Plano *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required style={{ fontSize: '13px', padding: '6px 10px', width: '100%' }} />
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="2" style={{ fontSize: '13px', padding: '6px 10px', width: '100%', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label>Valor (R$)</label>
                <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} style={{ fontSize: '13px', padding: '6px 10px', width: '100%' }} />
              </div>
              <div className="form-group">
                <label>Benefícios</label>
                <textarea value={formData.benefits} onChange={(e) => setFormData({ ...formData, benefits: e.target.value })} rows="3" placeholder="Liste os benefícios do plano" style={{ fontSize: '13px', padding: '6px 10px', width: '100%', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
              <div className="modal-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
