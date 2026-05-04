import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

const API_URL = 'http://localhost:3001/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

const statusMap = {
  agendado: { label: 'Agendado', color: '#3498db', bg: '#ebf5fb' },
  atendendo: { label: 'Atendendo', color: '#f39c12', bg: '#fef9e7' },
  atendido: { label: 'Atendido', color: '#27ae60', bg: '#eafaf1' },
  atrasado: { label: 'Atrasado', color: '#e74c3c', bg: '#fdedec' },
  cancelado: { label: 'Cancelado', color: '#95a5a6', bg: '#f2f3f4' },
  confirmado: { label: 'Confirmado', color: '#1abc9c', bg: '#e8f8f5' },
  espera: { label: 'Espera', color: '#9b59b6', bg: '#f5eef8' },
  faltou: { label: 'Faltou', color: '#34495e', bg: '#ebedef' },
  concluido: { label: 'Concluido', color: '#2ecc71', bg: '#eafaf1' },
};

export default function Calendar() {
  const calendarRef = useRef(null);
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [viewMode, setViewMode] = useState('timeGridWeek');
  const [formData, setFormData] = useState({
    client_id: '', employee_id: '', service_id: '',
    date: '', time: '', notes: '', status: 'agendado'
  });
  const [employeeFilter, setEmployeeFilter] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [aptRes, clientsRes, employeesRes, servicesRes] = await Promise.all([
        fetch(`${API_URL}/appointments`, { headers: getAuthHeader() }),
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

  const events = appointments
    .filter(a => !employeeFilter || a.employee_id === parseInt(employeeFilter))
    .map(a => {
      const statusInfo = statusMap[a.status] || statusMap.agendado;
      const service = services.find(s => s.id === a.service_id);
      const employee = employees.find(e => e.id === a.employee_id);
      return {
        id: a.id.toString(),
        title: `${a.client_name} - ${a.service_name || service?.name || ''}`,
        start: `${a.date}T${a.time}`,
        end: service ? getEndTime(`${a.date}T${a.time}`, service.duration_minutes) : `${a.date}T${a.time}`,
        backgroundColor: statusInfo.color,
        borderColor: statusInfo.color,
        textColor: '#fff',
        extendedProps: { ...a, employee_name: employee?.name || '', service_duration: service?.duration_minutes || 0 },
        status: a.status
      };
    });

  function getEndTime(start, durationMinutes) {
    const [datePart, timePart] = start.split('T');
    const [hours, minutes] = timePart.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${datePart}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }

  const handleDateClick = (arg) => {
    const dateStr = arg.dateStr.split('T')[0];
    const timeStr = arg.dateStr.split('T')[1]?.substring(0, 5) || '09:00';
    setEditingAppointment(null);
    setFormData({ client_id: '', employee_id: employeeFilter || '', service_id: '', date: dateStr, time: timeStr, notes: '', status: 'agendado' });
    setShowModal(true);
  };

  const handleEventClick = (clickInfo) => {
    const apt = appointments.find(a => a.id === parseInt(clickInfo.event.id));
    if (apt) {
      setSelectedAppointment(apt);
      setShowDetails(true);
    }
  };

  const handleEventDrop = async (dropInfo) => {
    const aptId = parseInt(dropInfo.event.id);
    const newDate = dropInfo.event.start.toISOString().split('T')[0];
    const newTime = dropInfo.event.start.toTimeString().substring(0, 5);
    try {
      const res = await fetch(`${API_URL}/appointments/${aptId}`, {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate, time: newTime })
      });
      if (res.ok) fetchData();
      else dropInfo.revert();
    } catch { dropInfo.revert(); }
  };

  const openEditModal = (apt) => {
    setEditingAppointment(apt);
    setFormData({
      client_id: apt.client_id, employee_id: apt.employee_id, service_id: apt.service_id,
      date: apt.date, time: apt.time, notes: apt.notes || '', status: apt.status
    });
    setShowDetails(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingAppointment ? `${API_URL}/appointments/${editingAppointment.id}` : `${API_URL}/appointments`;
      const method = editingAppointment ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: parseInt(formData.client_id),
          employee_id: parseInt(formData.employee_id),
          service_id: parseInt(formData.service_id),
          date: formData.date, time: formData.time, notes: formData.notes, status: formData.status
        })
      });
      if (res.ok) { fetchData(); setShowModal(false); }
    } catch (error) { console.error('Error saving appointment:', error); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;
    try {
      const res = await fetch(`${API_URL}/appointments/${id}`, { method: 'DELETE', headers: getAuthHeader() });
      if (res.ok) { fetchData(); setShowDetails(false); }
    } catch (error) { console.error('Error deleting appointment:', error); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) { fetchData(); setSelectedAppointment({ ...selectedAppointment, status }); }
    } catch (error) { console.error('Error updating status:', error); }
  };

  const changeView = (view) => {
    setViewMode(view);
    const calendarApi = calendarRef.current.getApi();
    calendarApi.changeView(view);
  };

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Agenda</h1>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} style={{padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px'}}>
            <option value="">Todos os Profissionais</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <button onClick={() => { setEditingAppointment(null); setFormData({ client_id: '', employee_id: employeeFilter || '', service_id: '', date: new Date().toISOString().split('T')[0], time: '09:00', notes: '', status: 'agendado' }); setShowModal(true); }} className="btn-primary">+ Novo Agendamento</button>
        </div>
      </div>

      <div style={{background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
        <div style={{display: 'flex', gap: '8px', marginBottom: '15px'}}>
          <button onClick={() => changeView('dayGridMonth')} className={`view-btn ${viewMode === 'dayGridMonth' ? 'active' : ''}`} style={{padding: '8px 16px', border: viewMode === 'dayGridMonth' ? '2px solid #3498db' : '1px solid #ddd', background: viewMode === 'dayGridMonth' ? '#3498db' : 'white', color: viewMode === 'dayGridMonth' ? 'white' : '#333', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'}}>Mês</button>
          <button onClick={() => changeView('timeGridWeek')} className={`view-btn ${viewMode === 'timeGridWeek' ? 'active' : ''}`} style={{padding: '8px 16px', border: viewMode === 'timeGridWeek' ? '2px solid #3498db' : '1px solid #ddd', background: viewMode === 'timeGridWeek' ? '#3498db' : 'white', color: viewMode === 'timeGridWeek' ? 'white' : '#333', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'}}>Semana</button>
          <button onClick={() => changeView('timeGridDay')} className={`view-btn ${viewMode === 'timeGridDay' ? 'active' : ''}`} style={{padding: '8px 16px', border: viewMode === 'timeGridDay' ? '2px solid #3498db' : '1px solid #ddd', background: viewMode === 'timeGridDay' ? '#3498db' : 'white', color: viewMode === 'timeGridDay' ? 'white' : '#333', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'}}>Dia</button>
          <button onClick={() => changeView('listWeek')} className={`view-btn ${viewMode === 'listWeek' ? 'active' : ''}`} style={{padding: '8px 16px', border: viewMode === 'listWeek' ? '2px solid #3498db' : '1px solid #ddd', background: viewMode === 'listWeek' ? '#3498db' : 'white', color: viewMode === 'listWeek' ? 'white' : '#333', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'}}>Lista</button>
          <div style={{marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
            {Object.entries(statusMap).map(([key, val]) => (
              <span key={key} style={{display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#555'}}>
                <span style={{width: '10px', height: '10px', borderRadius: '50%', background: val.color, display: 'inline-block'}}></span>
                {val.label}
              </span>
            ))}
          </div>
        </div>

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={viewMode}
          locale={ptBrLocale}
          headerToolbar={false}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={3}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          allDaySlot={false}
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          nowIndicator={true}
          height="auto"
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        />
      </div>

      {/* Details Modal */}
      {showDetails && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <h2 style={{marginBottom: '20px', color: '#2c3e50'}}>Detalhes do Agendamento</h2>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px'}}>
              <div><strong>Cliente:</strong> {selectedAppointment.client_name}</div>
              <div><strong>Serviço:</strong> {selectedAppointment.service_name}</div>
              <div><strong>Profissional:</strong> {selectedAppointment.employee_name}</div>
              <div><strong>Data:</strong> {new Date(selectedAppointment.date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
              <div><strong>Horário:</strong> {selectedAppointment.time}</div>
              <div><strong>Valor:</strong> R$ {selectedAppointment.total_price?.toFixed(2) || '0.00'}</div>
              <div style={{gridColumn: 'span 2'}}><strong>Observações:</strong> {selectedAppointment.notes || '-'}</div>
            </div>

            <div style={{marginBottom: '20px'}}>
              <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>Alterar Status:</label>
              <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                {Object.entries(statusMap).map(([key, val]) => (
                  <button key={key} type="button" onClick={() => handleStatusChange(selectedAppointment.id, key)} style={{padding: '6px 12px', border: selectedAppointment.status === key ? '2px solid ' + val.color : '1px solid #ddd', background: selectedAppointment.status === key ? val.color : 'white', color: selectedAppointment.status === key ? 'white' : val.color, borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'}}>{val.label}</button>
                ))}
              </div>
            </div>

            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button onClick={() => openEditModal(selectedAppointment)} className="btn-edit">Editar</button>
              <button onClick={() => handleDelete(selectedAppointment.id)} className="btn-delete">Excluir</button>
              <button onClick={() => setShowDetails(false)} className="btn-secondary">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>{editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Cliente *</label><select value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} required><option value="">Selecione</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="form-row">
                <div className="form-group"><label>Profissional *</label><select value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} required><option value="">Selecione</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
                <div className="form-group"><label>Serviço *</label><select value={formData.service_id} onChange={(e) => setFormData({ ...formData, service_id: e.target.value })} required><option value="">Selecione</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name} - R$ {s.price.toFixed(2)}</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Data *</label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></div>
                <div className="form-group"><label>Hora *</label><input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} required /></div>
              </div>
              <div className="form-group"><label>Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>{Object.entries(statusMap).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}</select></div>
              <div className="form-group"><label>Observações</label><textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="2" /></div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">{editingAppointment ? 'Salvar' : 'Agendar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
