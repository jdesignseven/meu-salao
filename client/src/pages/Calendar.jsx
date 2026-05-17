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
            right: 'dayGridMonth'
          }}
          locale={ptBrLocale}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          allDaySlot={false}
          height="auto"
          buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia' }}
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
