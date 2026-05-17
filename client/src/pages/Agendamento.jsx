import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Calendar, Clock, User, Scissors, CheckCircle } from 'lucide-react'
import './Agendamento.css'

const API_URL = '/api'

function Agendamento() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedProfessional, setSelectedProfessional] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [step, setStep] = useState(1)
  const [clientData, setClientData] = useState({
    name: searchParams.get('name') || '',
    phone: searchParams.get('phone') || '',
    email: ''
  })
  const [professionals, setProfessionals] = useState([])
  const [services, setServices] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/public/employees`).then(res => res.json()).then(setProfessionals)
    fetch(`${API_URL}/public/services`).then(res => res.json()).then(setServices)
  }, [])

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ]

  const generateCalendar = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString()
      const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === month
      days.push(
        <div
          key={d}
          className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => setSelectedDate(new Date(year, month, d))}
        >
          {d}
        </div>
      )
    }

    return days
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
      await fetch(`${API_URL}/public/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...clientData,
          employee_id: selectedProfessional.id,
          service_id: selectedService.id,
          date: dateStr,
          time: selectedTime
        })
      })
      alert('Agendamento realizado com sucesso!')
      navigate('/')
    } catch (err) {
      alert('Erro ao agendar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const steps = [
    { num: 1, label: 'Profissional', icon: User },
    { num: 2, label: 'Serviço', icon: Scissors },
    { num: 3, label: 'Data/Hora', icon: Clock },
    { num: 4, label: 'Confirmação', icon: CheckCircle }
  ]

  return (
    <div style={{ fontFamily: "'Roboto', sans-serif", backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#000', marginBottom: '8px' }}>Agendamento Online</h1>
          <p style={{ fontSize: '16px', color: '#606060' }}>Agende seu horário de forma rápida e fácil</p>
        </div>

        {/* Steps Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '32px', gap: '8px' }}>
          {steps.map((s, i) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '4px',
                backgroundColor: step >= s.num ? '#002cd6' : '#fff',
                color: step >= s.num ? '#fff' : '#606060',
                fontSize: '14px',
                fontWeight: step === s.num ? 500 : 400
              }}>
                <s.icon size={16} />
                <span>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div style={{ width: '32px', height: '1px', backgroundColor: step > s.num ? '#002cd6' : '#ddd' }} />}
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#000', marginBottom: '16px' }}>Escolha o Profissional</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                {professionals.filter(p => p.active).map(prof => (
                  <div
                    key={prof.id}
                    onClick={() => { setSelectedProfessional(prof); setStep(2) }}
                    style={{
                      padding: '20px 16px',
                      border: selectedProfessional?.id === prof.id ? '2px solid #002cd6' : '1px solid #ddd',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: selectedProfessional?.id === prof.id ? '#e3f2fd' : '#fff',
                      textAlign: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>{prof.gender === 'M' ? '👨' : '👩'}</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 500, margin: '0 0 4px', color: '#000' }}>{prof.name}</h3>
                    <p style={{ fontSize: '14px', color: '#606060', margin: 0 }}>{prof.specialty}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#000', marginBottom: '16px' }}>Escolha o Serviço</h2>
              <p style={{ fontSize: '14px', color: '#606060', marginBottom: '16px' }}>Profissional: <strong>{selectedProfessional?.name}</strong> - Especialidade: {selectedProfessional?.specialty}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {services.filter(s => {
                  if (!selectedProfessional?.specialty) return true;
                  const specialties = selectedProfessional.specialty.toLowerCase().split(',').map(x => x.trim());
                  const serviceName = s.name.toLowerCase();
                  return specialties.some(spec => serviceName.includes(spec) || spec.includes(serviceName.split(' ')[0]));
                }).map(service => (
                  <div
                    key={service.id}
                    onClick={() => { setSelectedService(service); setStep(3) }}
                    style={{
                      padding: '16px',
                      border: selectedService?.id === service.id ? '2px solid #002cd6' : '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: selectedService?.id === service.id ? '#e3f2fd' : '#fff'
                    }}
                  >
                    <h3 style={{ fontSize: '16px', fontWeight: 500, margin: '0 0 8px' }}>{service.name}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#606060' }}>
                      <span>{service.duration_minutes} min</span>
                      <span style={{ fontWeight: 500, color: '#002cd6' }}>R$ {service.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(1)} style={{ marginTop: '16px', background: 'none', border: 'none', color: '#606060', cursor: 'pointer', fontSize: '14px' }}>← Voltar</button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#000', marginBottom: '16px' }}>Escolha Data e Horário</h2>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))} style={{ background: 'none', border: '1px solid #ddd', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer' }}>←</button>
                  <h3 style={{ fontSize: '16px', fontWeight: 500, margin: 0 }}>{selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                  <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))} style={{ background: 'none', border: '1px solid #ddd', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer' }}>→</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '12px', color: '#606060', padding: '8px' }}>{d}</div>
                  ))}
                  {generateCalendar()}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Horários Disponíveis</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                  {timeSlots.map(time => (
                    <div
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      style={{
                        padding: '8px',
                        textAlign: 'center',
                        border: selectedTime === time ? '2px solid #002cd6' : '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        backgroundColor: selectedTime === time ? '#e3f2fd' : '#fff',
                        fontSize: '14px',
                        fontWeight: selectedTime === time ? 500 : 400
                      }}
                    >
                      {time}
                    </div>
                  ))}
                </div>
              </div>

              {selectedTime && (
                <button
                  onClick={() => setStep(4)}
                  style={{ marginTop: '24px', width: '100%', backgroundColor: '#002cd6', color: '#fff', padding: '12px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Continuar →
                </button>
              )}
              <button onClick={() => setStep(2)} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#606060', cursor: 'pointer', fontSize: '14px' }}>← Voltar</button>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#000', marginBottom: '16px' }}>Confirme seu Agendamento</h2>

              <div style={{ backgroundColor: '#f5f5f5', borderRadius: '4px', padding: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Profissional', value: selectedProfessional?.name },
                  { label: 'Serviço', value: selectedService?.name },
                  { label: 'Data', value: selectedDate.toLocaleDateString('pt-BR') },
                  { label: 'Horário', value: selectedTime },
                  { label: 'Valor', value: `R$ ${selectedService?.price.toFixed(2)}` }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? '1px solid #e0e0e0' : 'none' }}>
                    <span style={{ fontSize: '14px', color: '#606060' }}>{item.label}</span>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.value}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px' }}>Seus Dados</h3>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={clientData.name}
                    onChange={(e) => setClientData({...clientData, name: e.target.value})}
                    placeholder="Digite seu nome"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={clientData.phone}
                    onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                    placeholder="(11) 99999-9999"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>Email</label>
                  <input
                    type="email"
                    value={clientData.email}
                    onChange={(e) => setClientData({...clientData, email: e.target.value})}
                    placeholder="seu@email.com"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ width: '100%', backgroundColor: '#002cd6', color: '#fff', padding: '12px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
                >
                  {submitting ? 'Agendando...' : 'CONFIRMAR AGENDAMENTO'}
                </button>
              </form>

              <button onClick={() => setStep(3)} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#606060', cursor: 'pointer', fontSize: '14px' }}>← Voltar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Agendamento
