import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Calendar, Clock } from 'lucide-react';

const API_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    client_id: '', employee_id: '', service_id: '', date: '', time: '', notes: ''
  });

  useEffect(() => { fetchData(); }, [filterDate, filterStatus]);

  const fetchData = async () => {
    try {
      let url = `${API_URL}/appointments?`;
      if (filterDate) url += `date=${filterDate}&`;
      if (filterStatus) url += `status=${filterStatus}`;
      const [aptRes, clientsRes, employeesRes, servicesRes] = await Promise.all([
        fetch(url, { headers: getAuthHeader() }),
        fetch(`${API_URL}/clients`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/employees?active=1`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/services?active=1`, { headers: getAuthHeader() })
      ]);
      if (aptRes.ok) setAppointments(await aptRes.json());
      if (clientsRes.ok) setClients(await clientsRes.json());
      if (employeesRes.ok) setEmployees(await employeesRes.json());
      if (servicesRes.ok) setServices(await servicesRes.json());
    } catch (error) { console.error('Error fetching data:', error); }
    finally { setLoading(false); }
  };

  const openModal = (appointment = null) => {
    if (appointment) {
      setEditingAppointment(appointment);
      setFormData({
        client_id: appointment.client_id,
        employee_id: appointment.employee_id,
        service_id: appointment.service_id,
        date: appointment.date,
        time: appointment.time,
        notes: appointment.notes || ''
      });
    } else {
      setEditingAppointment(null);
      setFormData({ client_id: '', employee_id: '', service_id: '', date: '', time: '', notes: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingAppointment(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingAppointment ? `${API_URL}/appointments/${editingAppointment.id}` : `${API_URL}/appointments`;
      const method = editingAppointment ? 'PUT' : 'POST';
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(url, {
        method, headers,
        body: JSON.stringify({
          ...formData,
          client_id: parseInt(formData.client_id),
          employee_id: parseInt(formData.employee_id),
          service_id: parseInt(formData.service_id)
        })
      });
      if (res.ok) { fetchData(); closeModal(); }
    } catch (error) { console.error('Error saving appointment:', error); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;
    try {
      const res = await fetch(`${API_URL}/appointments/${id}`, { method: 'DELETE', headers: getAuthHeader() });
      if (res.ok) fetchData();
    } catch (error) { console.error('Error deleting appointment:', error); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchData();
    } catch (error) { console.error('Error updating status:', error); }
  };

  const statusColors = {
    agendado: { bg: '#e3f2fd', color: '#002cd6' },
    confirmado: { bg: '#e8f5e9', color: '#2e7d32' },
    atendendo: { bg: '#fff3e0', color: '#f57c00' },
    atendido: { bg: '#e8f5e9', color: '#1b5e20' },
    concluido: { bg: '#f3e5f5', color: '#4a148c' },
    faltou: { bg: '#ffebee', color: '#c62828' },
    cancelado: { bg: '#f5f5f5', color: '#616161' },
    espera: { bg: '#f3e5f5', color: '#6a1b9a' }
  };

  const filteredAppointments = appointments.filter(a => {
    return (!filterDate || a.date === filterDate) && (!filterStatus || a.status === filterStatus);
  });

  if (loading) return <div style={{ padding: '24px', color: '#606060' }}>Carregando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#000', margin: 0 }}>Agendamentos</h1>
        <button onClick={() => openModal()} style={{
          display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#002cd6', color: '#fff',
          padding: '10px 20px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
        }}><Plus size={16} /> Novo Agendamento</button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff' }} />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff' }}>
          <option value="">Todos os status</option>
          {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filterDate || filterStatus) && (
          <button onClick={() => { setFilterDate(''); setFilterStatus(''); }} style={{
            padding: '8px 16px', background: '#f5f5f5', color: '#606060', border: '1px solid #ddd',
            borderRadius: '4px', fontSize: '14px', cursor: 'pointer'
          }}>Limpar Filtros</button>
        )}
      </div>

      {filteredAppointments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#606060' }}>Nenhum agendamento encontrado</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filteredAppointments.map((apt) => {
            const statusInfo = statusColors[apt.status] || statusColors.agendado;
            return (
              <div key={apt.id} style={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#606060' }}>
                    <Calendar size={16} /> {new Date(`${apt.date}T00:00:00`).toLocaleDateString('pt-BR')}
                  </div>
                  <span style={{
                    fontSize: '12px', padding: '4px 8px', borderRadius: '4px',
                    backgroundColor: statusInfo.bg, color: statusInfo.color
                  }}>{apt.status}</span>
                </div>
                <div style={{ marginBottom: '12px', fontSize: '14px', color: '#404040' }}>
                  <div style={{ fontWeight: 500, fontSize: '16px', color: '#000', marginBottom: '4px' }}>{apt.client_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Clock size={14} /> {apt.time} - {apt.service_name}
                  </div>
                  <div>Profissional: {apt.employee_name}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openModal(apt)} style={{
                    flex: 1, padding: '8px', backgroundColor: '#e3f2fd', color: '#002cd6', border: 'none',
                    borderRadius: '4px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '4px'
                  }}><Pencil size={14} /> Editar</button>
                  <button onClick={() => handleDelete(apt.id)} style={{
                    flex: 1, padding: '8px', backgroundColor: '#ffebee', color: '#d32f2f', border: 'none',
                    borderRadius: '4px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '4px'
                  }}><Trash2 size={14} /> Excluir</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={closeModal}>
          <div style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '24px', width: '100%', maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#000', margin: '0 0 24px' }}>
              {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Cliente *</label>
                <select value={formData.client_id} onChange={(e) => setFormData({...formData, client_id: e.target.value })}
                  required style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}>
                  <option value="">Selecione...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Profissional *</label>
                  <select value={formData.employee_id} onChange={(e) => setFormData({...formData, employee_id: e.target.value })}
                    required style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}>
                    <option value="">Selecione...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Serviço *</label>
                  <select value={formData.service_id} onChange={(e) => setFormData({...formData, service_id: e.target.value })}
                    required style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}>
                    <option value="">Selecione...</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Data *</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value })}
                    required style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Horário *</label>
                  <input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value })}
                    required style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Observações</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value })}
                  rows="2" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={closeModal} style={{
                  flex: 1, padding: '10px 20px', background: '#f5f5f5', color: '#606060', border: '1px solid #ddd',
                  borderRadius: '4px', fontSize: '14px', cursor: 'pointer'
                }}>Cancelar</button>
                <button type="submit" style={{
                  flex: 1, padding: '10px 20px', background: '#002cd6', color: '#fff', border: 'none',
                  borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
                }}>{editingAppointment ? 'Salvar' : 'Agendar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
