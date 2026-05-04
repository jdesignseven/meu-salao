import { useState, useEffect } from 'react';
import { Phone, Mail, Briefcase, DollarSign, Plus } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    specialty: '',
    commission_rate: 0,
    active: 1
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/employees`, {
        headers: getAuthHeader()
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        phone: employee.phone,
        email: employee.email || '',
        specialty: employee.specialty || '',
        commission_rate: employee.commission_rate,
        active: employee.active
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        specialty: '',
        commission_rate: 0,
        active: 1
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingEmployee
        ? `${API_URL}/employees/${editingEmployee.id}`
        : `${API_URL}/employees`;
      const method = editingEmployee ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          commission_rate: parseFloat(formData.commission_rate)
        })
      });

      if (res.ok) {
        fetchEmployees();
        closeModal();
      }
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;
    try {
      const res = await fetch(`${API_URL}/employees/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Funcionários</h1>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus size={16} style={{display: 'inline', marginRight: '6px'}} /> Novo Funcionário
        </button>
      </div>

      <div className="cards-grid">
        {employees.length === 0 ? (
          <p className="empty-state">Nenhum funcionário cadastrado</p>
        ) : (
          employees.map((employee) => (
            <div key={employee.id} className={`employee-card ${!employee.active ? 'inactive' : ''}`}>
              <div className="employee-header">
                <h3>{employee.name}</h3>
                <span className={`status-badge ${employee.active ? 'status-active' : 'status-inactive'}`}>
                  {employee.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="employee-info">
                <p style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Phone size={14} /> {employee.phone}</p>
                {employee.email && <p style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Mail size={14} /> {employee.email}</p>}
                {employee.specialty && <p style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Briefcase size={14} /> {employee.specialty}</p>}
                <p style={{display: 'flex', alignItems: 'center', gap: '8px'}}><DollarSign size={14} /> Comissão: {employee.commission_rate}%</p>
              </div>
              <div className="employee-actions">
                <button onClick={() => openModal(employee)} className="btn-edit">Editar</button>
                <button onClick={() => handleDelete(employee.id)} className="btn-delete">Excluir</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
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
                <label>Telefone *</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Especialidade</label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="Ex: Cabeleireiro, Manicure, Barbeiro"
                />
              </div>
              <div className="form-group">
                <label>Taxa de Comissão (%)</label>
                <input
                  type="number"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                  min="0"
                  max="100"
                  step="0.5"
                />
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
                  {editingEmployee ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
