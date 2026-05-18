import { useState, useEffect, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { Plus, MessageCircle } from 'lucide-react';

const API_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

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
  const [formData, setFormData] = useState({
    client_id: '', employee_id: '', service_id: '', date: '', time: '', notes: '', status: 'agendado'
  });
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

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

  const getStatusColor = (status) => {
    const colors = {
      agendado: '#002cd6',
      confirmado: '#00bcd4',
      aguardando: '#ff9800',
      atendendo: '#e91e63',
      atendido: '#4caf50',
      concluido: '#1b5e20',
      cancelado: '#9e9e9e',
      espera: '#9c27b0',
      faltou: '#607d8b',
      atrasado: '#f44336'
    };
    return colors[status] || '#002cd6';
  };

  const getEndTime = (start, durationMinutes) => {
    const [datePart, timePart] = start.split('T');
    const [hours, minutes] = timePart.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${datePart}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const events = appointments
    .filter(a => !employeeFilter || a.employee_id === parseInt(employeeFilter))
    .map(a => {
      const service = services.find(s => s.id === a.service_id);
      return {
        id: a.id.toString(),
        title: `${a.client_name} - ${a.service_name || ''}`,
        start: `${a.date}T${a.time}`,
        end: service ? getEndTime(`${a.date}T${a.time}`, service.duration_minutes) : `${a.date}T${a.time}`,
        backgroundColor: getStatusColor(a.status),
        borderColor: getStatusColor(a.status),
        textColor: '#fff',
        extendedProps: { ...a }
      };
    });

  const handleDateClick = (arg) => {
    const dateStr = arg.dateStr.split('T')[0];
    const timeStr = arg.dateStr.split('T')[1]?.substring(0, 5) || '09:00';
    setEditingAppointment(null);
    setFormData({ client_id: '', employee_id: employeeFilter || '', service_id: '', date: dateStr, time: timeStr, notes: '', status: 'agendado' });
    setShowModal(true);
  };

  const handleEventClick = (clickInfo) => {
    setSelectedAppointment(clickInfo.event.extendedProps);
    setShowDetails(true);
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
        notes: appointment.notes || '',
        status: appointment.status
      });
    } else {
      setEditingAppointment(null);
      setFormData({ client_id: '', employee_id: employeeFilter || '', service_id: '', date: '', time: '', notes: '', status: 'agendado' });
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
        method,
        headers,
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
      if (res.ok) { fetchData(); setShowDetails(false); }
    } catch (error) { console.error('Error deleting appointment:', error); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchData();
        setShowDetails(false);
      }
    } catch (error) { console.error('Error updating status:', error); }
  };

  const openCamera = async (type) => {
    setCameraTarget(type);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setShowCamera(false);
    }
  };

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCameraTarget(null);
  }, []);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    const key = cameraTarget === 'before' ? 'before_photo' : 'after_photo';
    setSelectedAppointment(prev => prev ? { ...prev, [key]: photoData } : prev);
    savePhoto(photoData, cameraTarget);
    closeCamera();
  };

  const savePhoto = async (photoData, type) => {
    const key = type === 'before' ? 'before_photo' : 'after_photo';
    try {
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${API_URL}/appointments/${selectedAppointment.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ [key]: photoData })
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error saving photo:', error);
    }
  };

  const getWhatsAppLink = (phone) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '').replace(/^0+/, '');
    return `https://wa.me/${cleaned.startsWith('55') ? cleaned : `55${cleaned}`}`;
  };

  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const photoData = reader.result;
      const key = type === 'before' ? 'before_photo' : 'after_photo';
      setSelectedAppointment(prev => prev ? { ...prev, [key]: photoData } : prev);
      await savePhoto(photoData, type);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (loading) return <div style={{ padding: '24px', color: '#606060' }}>Carregando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#000', margin: 0 }}>Agenda</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff' }}>
            <option value="">Todos os profissionais</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <button onClick={() => openModal()} style={{
            display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#002cd6', color: '#fff',
            padding: '10px 20px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
          }}>
            <Plus size={16} /> Novo Agendamento
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '16px' }}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
          }}
          views={{
            timeGridWeek: { titleFormat: { year: 'numeric', month: 'long', day: 'numeric' } },
            listWeek: { titleFormat: { year: 'numeric', month: 'long', day: 'numeric' } }
          }}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          locale={ptBrLocale}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          allDaySlot={false}
          nowIndicator={true}
          height="auto"
          buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia', list: 'Lista' }}
        />
      </div>

      {/* Details Modal */}
      {showDetails && selectedAppointment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowDetails(false)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '24px', maxWidth: '1000px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#000', margin: '0 0 24px' }}>Detalhes do Agendamento</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}><strong style={{ color: '#606060' }}>Cliente:</strong> {selectedAppointment.client_name}
                {(() => { const client = clients.find(c => c.id === selectedAppointment.client_id); return client?.phone ? <a href={getWhatsAppLink(client.phone)} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', display: 'inline-flex', alignItems: 'center' }} title="Enviar WhatsApp"><MessageCircle size={18} /></a> : null; })()}
              </div>
              <div style={{ fontSize: '14px' }}><strong style={{ color: '#606060' }}>Serviço:</strong> {selectedAppointment.service_name}</div>
              <div style={{ fontSize: '14px' }}><strong style={{ color: '#606060' }}>Profissional:</strong> {selectedAppointment.employee_name}</div>
              <div style={{ fontSize: '14px' }}><strong style={{ color: '#606060' }}>Data:</strong> {new Date(selectedAppointment.date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
              <div style={{ fontSize: '14px' }}><strong style={{ color: '#606060' }}>Horário:</strong> {selectedAppointment.time}</div>
              <div style={{ fontSize: '14px' }}><strong style={{ color: '#606060' }}>Valor:</strong> R$ {selectedAppointment.total_price?.toFixed(2) || '0.00'}</div>
              <div style={{ gridColumn: 'span 2', fontSize: '14px' }}><strong style={{ color: '#606060' }}>Observações:</strong> {selectedAppointment.notes || '-'}</div>
            </div>

          <AnamneseSection client={clients.find(c => c.id === selectedAppointment.client_id)} onUpdate={fetchData} />

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Alterar Status:</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['agendado', 'confirmado', 'aguardando', 'atendendo', 'atendido', 'concluido', 'cancelado'].map((status) => (
                  <button key={status} type="button"
                    onClick={() => handleStatusChange(selectedAppointment.id, status)}
                    style={{
                      padding: '6px 12px',
                      border: selectedAppointment.status === status ? '2px solid ' + getStatusColor(status) : '1px solid #ddd',
                      background: selectedAppointment.status === status ? getStatusColor(status) : '#fff',
                      color: selectedAppointment.status === status ? '#fff' : getStatusColor(status),
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '400px' }}>
                  <strong style={{ fontSize: '13px', color: '#606060' }}>Antes</strong>
                  <div style={{ width: '100%', height: '350px', background: '#f5f5f5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#999', marginTop: '4px', overflow: 'hidden' }}>
                    {selectedAppointment.before_photo ? <img src={selectedAppointment.before_photo} alt="Antes" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : 'Nenhuma'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <label style={{ flex: 1, cursor: 'pointer', position: 'relative' }}>
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'before')} style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }} />
                      <span style={{ display: 'block', width: '100%', padding: '10px', background: '#555', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', textAlign: 'center', boxSizing: 'border-box' }}>ALTERAR FOTO</span>
                    </label>
                    <button onClick={() => openCamera('before')} style={{ flex: 1, padding: '10px', background: '#002cd6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', textAlign: 'center', cursor: 'pointer' }}>TIRAR FOTO</button>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: '400px' }}>
                  <strong style={{ fontSize: '13px', color: '#606060' }}>Depois</strong>
                  <div style={{ width: '100%', height: '350px', background: '#f5f5f5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#999', marginTop: '4px', overflow: 'hidden' }}>
                    {selectedAppointment.after_photo ? <img src={selectedAppointment.after_photo} alt="Depois" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : 'Nenhuma'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <label style={{ flex: 1, cursor: 'pointer', position: 'relative' }}>
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'after')} style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }} />
                      <span style={{ display: 'block', width: '100%', padding: '10px', background: '#555', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', textAlign: 'center', boxSizing: 'border-box' }}>ALTERAR FOTO</span>
                    </label>
                    <button onClick={() => openCamera('after')} style={{ flex: 1, padding: '10px', background: '#002cd6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', textAlign: 'center', cursor: 'pointer' }}>TIRAR FOTO</button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowDetails(false); openModal(selectedAppointment); }} style={{
                padding: '10px 20px', background: '#002cd6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
              }}>Editar</button>
              <button onClick={() => handleDelete(selectedAppointment.id)} style={{
                padding: '10px 20px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
              }}>Excluir</button>
              <button onClick={() => setShowDetails(false)} style={{
                padding: '10px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', cursor: 'pointer'
              }}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowModal(false)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '24px', maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#000', margin: '0 0 24px' }}>
              {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Cliente *</label>
                <select value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} required>
                  <option value="">Selecione</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Profissional *</label>
                  <select value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} required>
                    <option value="">Selecione</option>
                    {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Serviço *</label>
                  <select value={formData.service_id} onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} required>
                    <option value="">Selecione</option>
                    {services.map((s) => <option key={s.id} value={s.id}>{s.name} - R$ {s.price.toFixed(2)}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Data *</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Hora *</label>
                  <input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} required />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}>
                  <option value="agendado">Agendado</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="aguardando">Aguardando</option>
                  <option value="atendendo">Atendendo</option>
                  <option value="atendido">Atendido</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Observações</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', minHeight: '80px', resize: 'vertical' }} rows="3" />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{
                  padding: '10px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', cursor: 'pointer'
                }}>Cancelar</button>
                <button type="submit" style={{
                  padding: '10px 20px', background: '#002cd6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
                }}>{editingAppointment ? 'Salvar' : 'Agendar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={closeCamera}>
          <div style={{ backgroundColor: '#000', borderRadius: '8px', padding: '16px', maxWidth: '600px', width: '95%' }}
            onClick={(e) => e.stopPropagation()}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '4px', display: 'block' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
              <button onClick={capturePhoto} style={{ padding: '12px 32px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}>📸 Capturar</button>
              <button onClick={closeCamera} style={{ padding: '12px 32px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ANAMNESE_LABELS = {
  tipo_cabelo: 'Tipo de Cabelo',
  couro_cabeludo: 'Couro Cabeludo',
  problemas: 'Problemas Capilares',
  frequencia_lavagem: 'Frequência de Lavagem',
  finalizadores: 'Usa Finalizadores',
  finalizadores_quais: 'Quais Finalizadores',
  produtos: 'Produtos Utilizados',
  quimicos: 'Químicos / Procedimentos',
  alergias: 'Alergias',
  transplante: 'Já fez Transplante',
  doencas: 'Doenças',
  medicamentos: 'Medicamentos',
  gestante: 'Gestante',
  objetivos: 'Objetivos',
  observacoes: 'Observações',
  teste_mecha_raiz: 'Raiz',
  teste_mecha_meio: 'Meio',
  teste_mecha_pontas: 'Pontas'
};

const ANAMNESE_OPTIONS = {
  tipo_cabelo: { liso: 'Liso', ondulado: 'Ondulado', cacheado: 'Cacheado', crespo: 'Crespo' },
  couro_cabeludo: { oleoso: 'Oleoso', seco: 'Seco', normal: 'Normal', misto: 'Misto' },
  frequencia_lavagem: { diaria: 'Diária', dia_sim_nao: 'Dia sim, dia não', '2x_semana': '2x por semana', '1x_semana': '1x por semana' }
};

const MULTI_OPTS = {
  tipo_cabelo: ['Liso', 'Ondulado', 'Cacheado', 'Crespo'],
  couro_cabeludo: ['Oleoso', 'Seco', 'Normal', 'Misto'],
  frequencia_lavagem: ['Diária', 'Dia sim, dia não', '2x por semana', '1x por semana'],
  problemas: ['Queda', 'Quebra', 'Caspa', 'Oleosidade excessiva', 'Ressecamento', 'Coceira', 'Dermatite', 'Outro'],
  quimicos: ['Progressiva', 'Botox capilar', 'Selagem', 'Relaxamento', 'Descoloração/Luzes', 'Coloração', 'Alisamento', 'Nenhum', 'Outro'],
  produtos: ['Shampoo', 'Condicionador', 'Máscara de hidratação', 'Óleo capilar', 'Leave-in', 'Protetor térmico', 'Finalizador', 'Nenhum', 'Outro'],
  alergias: ['Parafenilenodiamina', 'Amônia', 'Peróxido', 'Álcool', 'Látex', 'Nenhuma', 'Outra'],
  doencas: ['Diabetes', 'Hipertensão', 'Tireoide', 'Dermatite seborreica', 'Psoríase', 'Alopecia', 'Anemia', 'Nenhuma', 'Outra'],
  medicamentos: ['Anticoncepcional', 'Isotretinoína (Roacutan)', 'Finasterida', 'Minoxidil', 'Antidepressivo', 'Ansiolítico', 'Nenhum', 'Outro'],
  objetivos: ['Hidratar', 'Fortalecer', 'Reduzir queda', 'Crescimento', 'Recuperar químicos', 'Mudar visual', 'Manutenção', 'Outro']
};

function CheckboxGroup({ field, form, onChange }) {
  const opts = MULTI_OPTS[field] || [];
  const vals = Array.isArray(form[field]) ? form[field] : [];
  const outroKey = field + '_outro';

  const toggle = (val) => {
    const next = vals.includes(val) ? vals.filter(x => x !== val) : [...vals, val];
    onChange({ ...form, [field]: next });
  };

  const chipBase = {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '5px 10px', borderRadius: '16px', fontSize: '12px',
    cursor: 'pointer', border: '1px solid #ddd',
    background: '#fff', color: '#555',
    transition: 'all 0.15s', userSelect: 'none'
  };
  const chipActive = { background: '#002cd6', color: '#fff', borderColor: '#002cd6' };
  const chipDisabled = { opacity: 0.4, cursor: 'not-allowed' };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
      {opts.map(o => {
        const checked = vals.includes(o);
        const isNenhum = o === 'Nenhum' || o === 'Nenhuma';
        const isOutro = o === 'Outro' || o === 'Outra';
        const hasNenhum = vals.includes('Nenhum') || vals.includes('Nenhuma');
        const disabled = !isNenhum && !isOutro && hasNenhum;

        if (isOutro) {
          return (
            <div key={o} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span onClick={() => toggle(o)}
                style={{ ...chipBase, ...(checked ? chipActive : {}) }}>
                {o}
              </span>
              {checked && (
                <input type="text" value={form[outroKey] || ''}
                  onChange={e => onChange({ ...form, [outroKey]: e.target.value })}
                  placeholder="Especifique..."
                  style={{ width: '120px', padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                />
              )}
            </div>
          );
        }

        return (
          <span key={o} onClick={() => { if (!disabled) toggle(o); }}
            style={{
              ...chipBase,
              ...(checked ? chipActive : {}),
              ...(disabled ? chipDisabled : {})
            }}>
            {o}
          </span>
        );
      })}
    </div>
  );
}

const MECHA_STATUS = { nao_informado: 'Não Informado', aprovado: 'Aprovado', reprovado: 'Reprovado' };
const MECHA_COLORS = { nao_informado: '#999', aprovado: '#2e7d32', reprovado: '#c62828' };

function AnamneseSection({ client, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const defaultAnamnese = {
    tipo_cabelo: [], couro_cabeludo: [], problemas: [], frequencia_lavagem: [],
    finalizadores: false, finalizadores_quais: '', produtos: [],
    quimicos: [], alergias: [], transplante: false,
    doencas: [], medicamentos: [], gestante: false,
    objetivos: [], observacoes: '',
    produtos_outro: '', quimicos_outro: '', alergias_outro: '',
    doencas_outro: '', medicamentos_outro: '', objetivos_outro: '',
    teste_mecha_raiz: 'nao_informado', teste_mecha_raiz_tempo: '',
    teste_mecha_meio: 'nao_informado', teste_mecha_meio_tempo: '',
    teste_mecha_pontas: 'nao_informado', teste_mecha_pontas_tempo: ''
  };

  const [form, setForm] = useState({ ...defaultAnamnese });

  useEffect(() => {
    if (client?.anamnese_capilar) {
      try {
        const parsed = JSON.parse(client.anamnese_capilar || '{}');
        const merged = { ...defaultAnamnese };
        for (const k of Object.keys(parsed)) {
          if (k.endsWith('_outro')) { merged[k] = parsed[k]; continue; }
          if (Array.isArray(parsed[k])) { merged[k] = parsed[k]; continue; }
          if (typeof parsed[k] === 'string' && parsed[k]) {
            if (ANAMNESE_OPTIONS[k]?.[parsed[k]]) {
              merged[k] = [ANAMNESE_OPTIONS[k][parsed[k]]];
            } else if (MULTI_OPTS[k]) {
              merged[k] = parsed[k].split(/[,;]\s*/).filter(Boolean);
            } else {
              merged[k] = parsed[k];
            }
          } else {
            merged[k] = parsed[k];
          }
        }
        setForm(merged);
      } catch { /* ignore */ }
    }
  }, [client]);

  if (!client) return null;

  const isFilled = (v) => v !== null && v !== undefined && v !== '' && (!Array.isArray(v) || v.length);

  const hasData = Object.entries(form).some(([k, v]) =>
    !k.endsWith('_outro') && isFilled(v)
  );

  const setFormField = (next) => setForm(next);

  const handleField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      const body = { ...client, anamnese_capilar: JSON.stringify(form) };
      delete body.id;
      delete body.services;
      delete body.financial;
      delete body.documents;

      const res = await fetch(`${API_URL}/clients/${client.id}`, {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setMsg('Salvo com sucesso!');
        setEditing(false);
        onUpdate?.();
      } else {
        const err = await res.json();
        setMsg(err.error || 'Erro ao salvar');
      }
    } catch {
      setMsg('Erro ao conectar');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px' };

  const SectionBox = ({ title, children }) => (
    <div style={{ marginBottom: '12px', background: '#fafafa', borderRadius: '6px', padding: '12px', border: '1px solid #eee' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#2c3e50', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #e0e0e0' }}>{title}</div>
      {children}
    </div>
  );
  const FieldRow = ({ children }) => <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>{children}</div>;
  const FieldHalf = ({ children }) => <div style={{ flex: 1, minWidth: 0 }}>{children}</div>;
  const FieldLabel = ({ children }) => <div style={labelStyle}>{children}</div>;

  const ViewSection = ({ title, keys, hasGrid = true }) => {
    const items = keys.map(key => {
      const display = formatVal(key, form[key]);
      if (display === null) return null;
      return { key, label: ANAMNESE_LABELS[key], display };
    }).filter(Boolean);
    if (!items.length) return null;
    return (
      <SectionBox title={title}>
        <div style={hasGrid ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' } : { display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {items.map(({ key, label, display }) => (
            <div key={key} style={{ fontSize: '13px', padding: '6px 8px', background: '#f5f5f5', borderRadius: '4px' }}>
              <span style={{ color: '#999', display: 'block', fontSize: '11px', marginBottom: '2px' }}>{label}</span>
              <span style={{ color: '#333' }}>{display}</span>
            </div>
          ))}
        </div>
      </SectionBox>
    );
  };

  const formatVal = (key, v) => {
    if (!isFilled(v) && key !== 'finalizadores_quais') return null;
    if (key === 'finalizadores' || key === 'transplante' || key === 'gestante') return v ? 'Sim' : 'Não';
    if (Array.isArray(v)) {
      const outroKey = key + '_outro';
      const outro = form[outroKey];
      const items = v.filter(x => x !== 'Outro' && x !== 'Outra');
      const display = outro ? [...items, outro].join(', ') : items.join(', ');
      return display || null;
    }
    if (ANAMNESE_OPTIONS[key]?.[v]) return ANAMNESE_OPTIONS[key][v];
    return v || null;
  };

  return (
    <div style={{ marginBottom: '24px', borderTop: '1px solid #e0e0e0', paddingTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <button
          onClick={() => setOpen(!open)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 500, color: '#2c3e50', padding: '4px 0' }}
        >
          <span style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
          Anamnese Capilar
        </button>
        {open && !editing && (
          <button onClick={() => setEditing(true)} style={{ padding: '4px 10px', background: '#e0e7ff', color: '#3730a3', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>
            {hasData ? 'Editar' : 'Preencher'}
          </button>
        )}
      </div>

      {open && (
        <>
          {msg && (
            <div style={{ padding: '8px 12px', background: msg.includes('sucesso') ? '#d4edda' : '#ffebee', color: msg.includes('sucesso') ? '#155724' : '#c62828', borderRadius: '4px', fontSize: '13px', marginBottom: '12px' }}>
              {msg}
            </div>
          )}

          {!editing ? (
            hasData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <ViewSection title="Dados do Cabelo" keys={['tipo_cabelo', 'couro_cabeludo', 'frequencia_lavagem', 'problemas']} />
                <ViewSection title="Produtos e Tratamentos" keys={['finalizadores', 'finalizadores_quais', 'produtos', 'quimicos', 'alergias', 'transplante']} />
                <ViewSection title="Saúde" keys={['doencas', 'medicamentos', 'gestante']} />
                <ViewSection title="Objetivos e Observações" keys={['objetivos', 'observacoes']} hasGrid={false} />
                {(form.teste_mecha_raiz !== 'nao_informado' || form.teste_mecha_raiz_tempo ||
                  form.teste_mecha_meio !== 'nao_informado' || form.teste_mecha_meio_tempo ||
                  form.teste_mecha_pontas !== 'nao_informado' || form.teste_mecha_pontas_tempo) && (
                  <SectionBox title="Teste de Mechas">
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {[
                        { key: 'teste_mecha_raiz', label: 'Raiz', tempo: form.teste_mecha_raiz_tempo },
                        { key: 'teste_mecha_meio', label: 'Meio', tempo: form.teste_mecha_meio_tempo },
                        { key: 'teste_mecha_pontas', label: 'Pontas', tempo: form.teste_mecha_pontas_tempo }
                      ].map(({ key, label, tempo }) => {
                        const v = form[key];
                        if (v === 'nao_informado' && !tempo) return null;
                        return (
                          <div key={key} style={{ flex: 1, fontSize: '13px', padding: '8px 10px', background: '#f5f5f5', borderRadius: '6px' }}>
                            <div style={{ color: '#999', fontSize: '11px', marginBottom: '3px' }}>{label}</div>
                            <div style={{ color: MECHA_COLORS[v] || '#333', fontWeight: v !== 'nao_informado' ? 600 : 400 }}>
                              {MECHA_STATUS[v] || v}{tempo ? ` — ${tempo}min` : ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SectionBox>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#999', margin: 0 }}>Nenhum dado de anamnese preenchido.</p>
            )
          ) : (
            <div>

              <SectionBox title="Dados do Cabelo">
                <FieldRow>
                  <FieldHalf>
                    <FieldLabel>Tipo de Cabelo</FieldLabel>
                    <CheckboxGroup field="tipo_cabelo" form={form} onChange={setFormField} />
                  </FieldHalf>
                  <FieldHalf>
                    <FieldLabel>Couro Cabeludo</FieldLabel>
                    <CheckboxGroup field="couro_cabeludo" form={form} onChange={setFormField} />
                  </FieldHalf>
                </FieldRow>
                <FieldRow>
                  <FieldHalf>
                    <FieldLabel>Frequência de Lavagem</FieldLabel>
                    <CheckboxGroup field="frequencia_lavagem" form={form} onChange={setFormField} />
                  </FieldHalf>
                  <FieldHalf>
                    <FieldLabel>Problemas Capilares</FieldLabel>
                    <CheckboxGroup field="problemas" form={form} onChange={setFormField} />
                  </FieldHalf>
                </FieldRow>
              </SectionBox>

              <SectionBox title="Produtos e Tratamentos">
                <FieldRow>
                  <FieldHalf>
                    <FieldLabel>Usa Finalizadores?</FieldLabel>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                      {['Sim', 'Não'].map(txt => (
                        <span key={txt} onClick={() => handleField('finalizadores', txt === 'Sim')}
                          style={{
                            padding: '5px 14px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer',
                            border: '1px solid #ddd', userSelect: 'none',
                            background: (txt === 'Sim' ? form.finalizadores === true : form.finalizadores === false) ? '#002cd6' : '#fff',
                            color: (txt === 'Sim' ? form.finalizadores === true : form.finalizadores === false) ? '#fff' : '#555'
                          }}>
                          {txt}
                        </span>
                      ))}
                    </div>
                    {form.finalizadores && (
                      <input type="text" value={form.finalizadores_quais} onChange={e => handleField('finalizadores_quais', e.target.value)}
                        placeholder="Quais?" style={{ ...inputStyle, marginTop: '6px', width: '200px' }} />
                    )}
                  </FieldHalf>
                  <FieldHalf>
                    <FieldLabel>Já fez Transplante Capilar?</FieldLabel>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                      {['Sim', 'Não'].map(txt => (
                        <span key={txt} onClick={() => handleField('transplante', txt === 'Sim')}
                          style={{
                            padding: '5px 14px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer',
                            border: '1px solid #ddd', userSelect: 'none',
                            background: (txt === 'Sim' ? form.transplante === true : form.transplante === false) ? '#002cd6' : '#fff',
                            color: (txt === 'Sim' ? form.transplante === true : form.transplante === false) ? '#fff' : '#555'
                          }}>
                          {txt}
                        </span>
                      ))}
                    </div>
                  </FieldHalf>
                </FieldRow>
                <FieldRow>
                  <FieldHalf>
                    <FieldLabel>Produtos Utilizados</FieldLabel>
                    <CheckboxGroup field="produtos" form={form} onChange={setFormField} />
                  </FieldHalf>
                  <FieldHalf>
                    <FieldLabel>Químicos / Procedimentos</FieldLabel>
                    <CheckboxGroup field="quimicos" form={form} onChange={setFormField} />
                  </FieldHalf>
                </FieldRow>
                <FieldRow>
                  <FieldHalf>
                    <FieldLabel>Alergias</FieldLabel>
                    <CheckboxGroup field="alergias" form={form} onChange={setFormField} />
                  </FieldHalf>
                  <FieldHalf />
                </FieldRow>
              </SectionBox>

              <SectionBox title="Saúde">
                <FieldRow>
                  <FieldHalf>
                    <FieldLabel>Doenças</FieldLabel>
                    <CheckboxGroup field="doencas" form={form} onChange={setFormField} />
                  </FieldHalf>
                  <FieldHalf>
                    <FieldLabel>Medicamentos</FieldLabel>
                    <CheckboxGroup field="medicamentos" form={form} onChange={setFormField} />
                  </FieldHalf>
                </FieldRow>
                <FieldRow>
                  <FieldHalf>
                    <FieldLabel>Gestante?</FieldLabel>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                      {['Sim', 'Não'].map(txt => (
                        <span key={txt} onClick={() => handleField('gestante', txt === 'Sim')}
                          style={{
                            padding: '5px 14px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer',
                            border: '1px solid #ddd', userSelect: 'none',
                            background: (txt === 'Sim' ? form.gestante === true : form.gestante === false) ? '#002cd6' : '#fff',
                            color: (txt === 'Sim' ? form.gestante === true : form.gestante === false) ? '#fff' : '#555'
                          }}>
                          {txt}
                        </span>
                      ))}
                    </div>
                  </FieldHalf>
                  <FieldHalf />
                </FieldRow>
              </SectionBox>

              <SectionBox title="Objetivos e Observações">
                <FieldRow>
                  <FieldHalf>
                    <FieldLabel>Objetivos</FieldLabel>
                    <CheckboxGroup field="objetivos" form={form} onChange={setFormField} />
                  </FieldHalf>
                  <FieldHalf>
                    <FieldLabel>Observações</FieldLabel>
                    <textarea value={form.observacoes} onChange={e => handleField('observacoes', e.target.value)}
                      style={{ ...inputStyle, resize: 'none', minHeight: '72px' }} />
                  </FieldHalf>
                </FieldRow>
              </SectionBox>

              <SectionBox title="Teste de Mechas">
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[['raiz', 'Raiz'], ['meio', 'Meio'], ['pontas', 'Pontas']].map(([part, label]) => {
                    const key = 'teste_mecha_' + part;
                    const tempoKey = key + '_tempo';
                    return (
                      <div key={part} style={{ flex: 1, background: '#f9f9f9', borderRadius: '6px', padding: '10px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#333', marginBottom: '6px' }}>{label}</div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {Object.entries(MECHA_STATUS).map(([val, display]) => (
                            <span key={val} onClick={() => handleField(key, val)}
                              style={{
                                padding: '4px 10px', borderRadius: '12px', fontSize: '11px', cursor: 'pointer',
                                border: '1px solid #ddd', userSelect: 'none',
                                background: form[key] === val ? MECHA_COLORS[val] : '#fff',
                                color: form[key] === val ? '#fff' : MECHA_COLORS[val],
                                fontWeight: val !== 'nao_informado' ? 600 : 400
                              }}>
                              {display}
                            </span>
                          ))}
                        </div>
                        <input type="number" value={form[tempoKey]} onChange={e => handleField(tempoKey, e.target.value)}
                          placeholder="Tempo (min)" style={{ ...inputStyle, marginTop: '6px' }} min="0" />
                      </div>
                    );
                  })}
                </div>
              </SectionBox>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button onClick={() => { setEditing(false); setMsg(''); }} style={{ padding: '8px 16px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', background: '#002cd6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>{saving ? 'Salvando...' : 'Salvar Anamnese'}</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
