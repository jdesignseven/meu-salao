import { useState, useEffect } from 'react';
import { Plus, User, Phone, Mail, Briefcase, Pencil, Trash2 } from 'lucide-react';

const API_URL = '/api';

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
    name: '', phone: '', email: '', specialty: '', commission_rate: 0, active: 1
  });

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/employees`, { headers: getAuthHeader() });
      if (res.ok) setEmployees(await res.json());
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
        name: employee.name, phone: employee.phone, email: employee.email || '',
        specialty: employee.specialty || '', commission_rate: employee.commission_rate, active: employee.active
      });
    } else {
      setEditingEmployee(null);
      setFormData({ name: '', phone: '', email: '', specialty: '', commission_rate: 0, active: 1 });
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingEmployee(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingEmployee ? `${API_URL}/employees/${editingEmployee.id}` : `${API_URL}/employees`;
      const method = editingEmployee ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, commission_rate: parseFloat(formData.commission_rate) })
      });
      if (res.ok) { fetchEmployees(); closeModal(); }
    } catch (error) { console.error('Error saving employee:', error); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;
    try {
      const res = await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE', headers: getAuthHeader() });
      if (res.ok) fetchEmployees();
    } catch (error) { console.error('Error deleting employee:', error); }
  };

  if (loading) return <div style={{ padding: '24px', color: '#606060' }}>Carregando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#000', margin: 0 }}>Profissionais</h1>
        <button onClick={() => openModal()} style={{
          display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#002cd6', color: '#fff',
          padding: '10px 20px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
        }}>
          <Plus size={16} /> Novo Profissional
        </button>
      </div>

      {employees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#606060' }}>Nenhum profissional cadastrado</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {employees.map((emp) => (
            <div key={emp.id} style={{
              backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px',
              opacity: emp.active ? 1 : 0.6
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ backgroundColor: '#002cd6', padding: '8px', borderRadius: '4px' }}>
                    <User size={20} color="#fff" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 500, margin: '0 0 4px', color: '#000' }}>{emp.name}</h3>
                    <span style={{
                      fontSize: '12px', padding: '2px 8px', borderRadius: '4px',
                      backgroundColor: emp.active ? '#e8f5e9' : '#f5f5f5',
                      color: emp.active ? '#2e7d32' : '#606060'
                    }}>
                      {emp.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#606060' }}>
                  <Phone size={14} /> {emp.phone}
                </div>
                {emp.email && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#606060' }}>
                  <Mail size={14} /> {emp.email}
                </div>}
                {emp.specialty && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#606060' }}>
                  <Briefcase size={14} /> {emp.specialty}
                </div>}
                <div style={{ fontSize: '14px', color: '#606060' }}>Comissão: {emp.commission_rate}%</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => openModal(emp)} style={{
                  flex: 1, padding: '8px', backgroundColor: '#e3f2fd', color: '#002cd6', border: 'none',
                  borderRadius: '4px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '4px'
                }}>
                  <Pencil size={14} /> Editar
                </button>
                <button onClick={() => handleDelete(emp.id)} style={{
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
              {editingEmployee ? 'Editar Profissional' : 'Novo Profissional'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>Nome *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>Telefone *</label>
                <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>Especialidade</label>
                <input type="text" value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="Ex: Cabeleireiro, Manicure" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>Taxa de Comissão (%)</label>
                <input type="number" value={formData.commission_rate} onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                  min="0" max="100" step="0.5" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
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
                }}>{editingEmployee ? 'Salvar' : 'Cadastrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
