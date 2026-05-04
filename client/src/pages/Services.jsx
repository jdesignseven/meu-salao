import { useState, useEffect } from 'react';
import { Clock, Plus } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

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
    name: '',
    description: '',
    price: '',
    duration_minutes: 30,
    active: 1
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_URL}/services`, {
        headers: getAuthHeader()
      });
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        price: service.price,
        duration_minutes: service.duration_minutes,
        active: service.active
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        duration_minutes: 30,
        active: 1
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingService(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingService
        ? `${API_URL}/services/${editingService.id}`
        : `${API_URL}/services`;
      const method = editingService ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          duration_minutes: parseInt(formData.duration_minutes)
        })
      });

      if (res.ok) {
        fetchServices();
        closeModal();
      }
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    try {
      const res = await fetch(`${API_URL}/services/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Serviços</h1>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus size={16} style={{display: 'inline', marginRight: '6px'}} /> Novo Serviço
        </button>
      </div>

      <div className="services-grid">
        {services.length === 0 ? (
          <p className="empty-state">Nenhum serviço cadastrado</p>
        ) : (
          services.map((service) => (
            <div key={service.id} className={`service-card ${!service.active ? 'inactive' : ''}`}>
              <div className="service-header">
                <h3>{service.name}</h3>
                <span className={`status-badge ${service.active ? 'status-active' : 'status-inactive'}`}>
                  {service.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              {service.description && <p className="service-desc">{service.description}</p>}
              <div className="service-details">
                <div className="service-price">R$ {service.price.toFixed(2)}</div>
                <div className="service-duration" style={{display: 'flex', alignItems: 'center', gap: '4px'}}><Clock size={14} /> {service.duration_minutes} min</div>
              </div>
              <div className="service-actions">
                <button onClick={() => openModal(service)} className="btn-edit">Editar</button>
                <button onClick={() => handleDelete(service.id)} className="btn-delete">Excluir</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="2"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Preço (R$) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Duração (minutos)</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    min="10"
                    step="5"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.active === 1}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked ? 1 : 0 })}
                  />
                  Ativo
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingService ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
