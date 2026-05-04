import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

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
    client_id: '',
    employee_id: '',
    service_id: '',
    date: '',
    time: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [filterDate, filterStatus]);

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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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
      setFormData({
        client_id: '',
        employee_id: '',
        service_id: '',
        date: '',
        time: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAppointment(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingAppointment
        ? `${API_URL}/appointments/${editingAppointment.id}`
        : `${API_URL}/appointments`;
      const method = editingAppointment ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: parseInt(formData.client_id),
          employee_id: parseInt(formData.employee_id),
          service_id: parseInt(formData.service_id),
          date: formData.date,
          time: formData.time,
          notes: formData.notes
        })
      });

      if (res.ok) {
        fetchData();
        closeModal();
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao salvar agendamento');
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;
    try {
      const res = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      agendado: 'Agendado', atendendo: 'Atendendo', atendido: 'Atendido',
      atrasado: 'Atrasado', cancelado: 'Cancelado', confirmado: 'Confirmado',
      espera: 'Espera', faltou: 'Faltou', concluido: 'Concluido'
    };
    return labels[status] || status;
  };

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Agendamentos</h1>
        <button onClick={() => openModal()} className="btn-primary">
          + Novo Agendamento
        </button>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Data:</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="agendado">Agendado</option>
            <option value="confirmado">Confirmado</option>
            <option value="atendendo">Atendendo</option>
            <option value="atendido">Atendido</option>
            <option value="atrasado">Atrasado</option>
            <option value="espera">Espera</option>
            <option value="faltou">Faltou</option>
            <option value="concluido">Concluido</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="appointments-list">
        {appointments.length === 0 ? (
          <p className="empty-state">Nenhum agendamento encontrado</p>
        ) : (
          appointments.map((apt) => (
            <div key={apt.id} className="appointment-card">
              <div className="apt-header">
                <div className="apt-datetime">
                  <span className="apt-date">{new Date(apt.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  <span className="apt-time">{apt.time}</span>
                </div>
                <span className={`status-badge status-${apt.status}`}>
                  {getStatusLabel(apt.status)}
                </span>
              </div>
              <div className="apt-body">
                <div className="apt-info">
                  <strong>Cliente:</strong> {apt.client_name}
                </div>
                <div className="apt-info">
                  <strong>Serviço:</strong> {apt.service_name}
                </div>
                <div className="apt-info">
                  <strong>Profissional:</strong> {apt.employee_name}
                </div>
                <div className="apt-info">
                  <strong>Valor:</strong> R$ {apt.total_price?.toFixed(2) || '0.00'}
                </div>
                {apt.notes && <div className="apt-info"><strong>Obs:</strong> {apt.notes}</div>}
              </div>
              <div className="apt-actions">
                {apt.status === 'agendado' && (
                  <>
                    <button onClick={() => handleStatusChange(apt.id, 'atendido')} className="btn-complete">Concluir</button>
                    <button onClick={() => handleStatusChange(apt.id, 'cancelado')} className="btn-cancel">Cancelar</button>
                  </>
                )}
                <button onClick={() => openModal(apt)} className="btn-edit">Editar</button>
                <button onClick={() => handleDelete(apt.id)} className="btn-delete">Excluir</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>{editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Cliente *</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Profissional *</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  required
                >
                  <option value="">Selecione um profissional</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} {e.specialty ? `(${e.specialty})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Serviço *</label>
                <select
                  value={formData.service_id}
                  onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                  required
                >
                  <option value="">Selecione um serviço</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} - R$ {s.price.toFixed(2)}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Data *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Hora *</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="2"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingAppointment ? 'Salvar' : 'Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
