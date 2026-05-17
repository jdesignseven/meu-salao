import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Clock, Scissors } from 'lucide-react';

const API_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', duration_minutes: 30, active: 1
  });

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_URL}/services`, { headers: getAuthHeader() });
      if (res.ok) setServices(await res.json());
    } catch (error) { console.error('Error fetching services:', error); } finally { setLoading(false); }
  };

  const openModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({ name: service.name, description: service.description || '', price: service.price, duration_minutes: service.duration_minutes, active: service.active });
    } else {
      setEditingService(null);
      setFormData({ name: '', description: '', price: '', duration_minutes: 30, active: 1 });
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingService(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingService ? `${API_URL}/services/${editingService.id}` : `${API_URL}/services`;
      const method = editingService ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, price: parseFloat(formData.price), duration_minutes: parseInt(formData.duration_minutes) })
      });
      if (res.ok) { fetchServices(); closeModal(); }
    } catch (error) { console.error('Error saving service:', error); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    try {
      const res = await fetch(`${API_URL}/services/${id}`, { method: 'DELETE', headers: getAuthHeader() });
      if (res.ok) fetchServices();
    } catch (error) { console.error('Error deleting service:', error); }
  };

  if (loading) return <div style={{ padding: '24px', color: '#606060' }}>Carregando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#000', margin: 0 }}>Serviços</h1>
        <button onClick={() => openModal()} style={{
          display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#002cd6', color: '#fff',
          padding: '10px 20px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
        }}>
          <Plus size={16} /> Novo Serviço
        </button>
      </div>

      {services.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#606060' }}>Nenhum serviço cadastrado</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {services.map((service) => (
            <div key={service.id} style={{
              backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px',
              opacity: service.active ? 1 : 0.6
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ backgroundColor: '#002cd6', padding: '8px', borderRadius: '4px' }}>
                    <Scissors size={20} color="#fff" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 500, margin: '0 0 4px', color: '#000' }}>{service.name}</h3>
                    <span style={{
                      fontSize: '12px', padding: '2px 8px', borderRadius: '4px',
                      backgroundColor: service.active ? '#e8f5e9' : '#f5f5f5',
                      color: service.active ? '#2e7d32' : '#606060'
                    }}>
                      {service.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>
              {service.description && <p style={{ fontSize: '14px', color: '#606060', marginBottom: '16px' }}>{service.description}</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#606060', marginBottom: '16px' }}>
                <span style={{ fontWeight: 500, color: '#002cd6' }}>R$ {service.price.toFixed(2)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {service.duration_minutes} min</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => openModal(service)} style={{
                  flex: 1, padding: '8px', backgroundColor: '#e3f2fd', color: '#002cd6', border: 'none',
                  borderRadius: '4px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '4px'
                }}>
                  <Pencil size={14} /> Editar
                </button>
                <button onClick={() => handleDelete(service.id)} style={{
                  flex: 1, padding: '8px', backgroundColor: '#ffebee', color: '#d32f2f', border: 'none',
                  borderRadius: '4px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '4px'
                }}>
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={closeModal}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '4px', padding: '24px', width: '100%', maxWidth: '500px',
            maxHeight: '90vh', overflow: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#000', margin: '0 0 24px' }}>
              {editingService ? 'Editar Serviço' : 'Novo Serviço'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>Nome *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>Descrição</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="2" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>Preço (R$) *</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    min="0" step="0.01" required style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>Duração (min)</label>
                  <input type="number" value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    min="10" step="5" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#404040' }}>
                  <input type="checkbox" checked={formData.active === 1} onChange={(e) => setFormData({ ...formData, active: e.target.checked ? 1 : 0 })} />
                  Ativo
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={closeModal} style={{
                  flex: 1, padding: '10px', backgroundColor: '#f5f5f5', color: '#606060', border: 'none',
                  borderRadius: '4px', fontSize: '14px', cursor: 'pointer'
                }}>Cancelar</button>
                <button type="submit" style={{
                  flex: 1, padding: '10px', backgroundColor: '#002cd6', color: '#fff', border: 'none',
                  borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
                }}>{editingService ? 'Salvar' : 'Cadastrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
