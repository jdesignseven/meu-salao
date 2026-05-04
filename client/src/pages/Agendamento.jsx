import { useState } from 'react'
import './Agendamento.css'

function Agendamento() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedProfessional, setSelectedProfessional] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [step, setStep] = useState(1)
  const [clientData, setClientData] = useState({
    name: '',
    phone: '',
    email: ''
  })

  const professionals = [
    { id: 1, name: 'Ana Silva', photo: '👩', specialty: 'Cabelo' },
    { id: 2, name: 'Carlos Santos', photo: '👨', specialty: 'Barba' },
    { id: 3, name: 'Maria Oliveira', photo: '👩', specialty: 'Estética' }
  ]

  const services = [
    { id: 1, name: 'Corte Feminino', duration: '45 min', price: 'R$ 60,00' },
    { id: 2, name: 'Corte Masculino', duration: '30 min', price: 'R$ 35,00' },
    { id: 3, name: 'Escova', duration: '40 min', price: 'R$ 45,00' },
    { id: 4, name: 'Barba', duration: '20 min', price: 'R$ 25,00' },
    { id: 5, name: 'Coloração', duration: '90 min', price: 'R$ 120,00' },
    { id: 6, name: 'Manicure', duration: '45 min', price: 'R$ 35,00' }
  ]

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

  const handleSubmit = (e) => {
    e.preventDefault()
    alert('Agendamento realizado com sucesso! Você receberá uma confirmação via WhatsApp.')
    setStep(1)
    setSelectedProfessional(null)
    setSelectedService(null)
    setSelectedTime(null)
    setClientData({ name: '', phone: '', email: '' })
  }

  return (
    <div className="agendamento-page">
      <div className="container">
        <div className="page-header">
          <h1>Agendamento Online</h1>
          <p className="subtitle">Agende seu horário de forma rápida e fácil</p>
        </div>

        <div className="booking-steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Profissional</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Serviço</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Data/Hora</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 4 ? 'active' : ''}`}>
            <span className="step-number">4</span>
            <span className="step-label">Confirmação</span>
          </div>
        </div>

        <div className="booking-content">
          {step === 1 && (
            <div className="step-content">
              <h2>Escolha o Profissional</h2>
              <div className="professionals-grid">
                {professionals.map(prof => (
                  <div
                    key={prof.id}
                    className={`professional-card ${selectedProfessional?.id === prof.id ? 'selected' : ''}`}
                    onClick={() => { setSelectedProfessional(prof); setStep(2) }}
                  >
                    <div className="professional-photo">{prof.photo}</div>
                    <h3>{prof.name}</h3>
                    <p>{prof.specialty}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <h2>Escolha o Serviço</h2>
              <div className="services-grid">
                {services.map(service => (
                  <div
                    key={service.id}
                    className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                    onClick={() => { setSelectedService(service); setStep(3) }}
                  >
                    <h3>{service.name}</h3>
                    <div className="service-details">
                      <span className="duration">⏱ {service.duration}</span>
                      <span className="price">{service.price}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-back" onClick={() => setStep(1)}>← Voltar</button>
            </div>
          )}

          {step === 3 && (
            <div className="step-content">
              <h2>Escolha Data e Horário</h2>
              
              <div className="calendar-section">
                <div className="calendar-header">
                  <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}>←</button>
                  <h3>{selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                  <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}>→</button>
                </div>
                <div className="calendar-grid">
                  <div className="calendar-day-header">Dom</div>
                  <div className="calendar-day-header">Seg</div>
                  <div className="calendar-day-header">Ter</div>
                  <div className="calendar-day-header">Qua</div>
                  <div className="calendar-day-header">Qui</div>
                  <div className="calendar-day-header">Sex</div>
                  <div className="calendar-day-header">Sáb</div>
                  {generateCalendar()}
                </div>
              </div>

              <div className="time-section">
                <h3>Horários Disponíveis</h3>
                <div className="time-grid">
                  {timeSlots.map(time => (
                    <div
                      key={time}
                      className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </div>
                  ))}
                </div>
              </div>

              {selectedTime && (
                <button className="btn-next" onClick={() => setStep(4)}>
                  Continuar →
                </button>
              )}
              <button className="btn-back" onClick={() => setStep(2)}>← Voltar</button>
            </div>
          )}

          {step === 4 && (
            <div className="step-content">
              <h2>Confirme seu Agendamento</h2>
              
              <div className="booking-summary">
                <div className="summary-item">
                  <strong>Profissional:</strong>
                  <span>{selectedProfessional?.name}</span>
                </div>
                <div className="summary-item">
                  <strong>Serviço:</strong>
                  <span>{selectedService?.name}</span>
                </div>
                <div className="summary-item">
                  <strong>Data:</strong>
                  <span>{selectedDate.toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="summary-item">
                  <strong>Horário:</strong>
                  <span>{selectedTime}</span>
                </div>
                <div className="summary-item">
                  <strong>Valor:</strong>
                  <span className="price">{selectedService?.price}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="client-form">
                <h3>Seus Dados</h3>
                <div className="form-group">
                  <label>Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={clientData.name}
                    onChange={(e) => setClientData({...clientData, name: e.target.value})}
                    placeholder="Digite seu nome"
                  />
                </div>
                <div className="form-group">
                  <label>WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={clientData.phone}
                    onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={clientData.email}
                    onChange={(e) => setClientData({...clientData, email: e.target.value})}
                    placeholder="seu@email.com"
                  />
                </div>
                <button type="submit" className="btn-confirm">
                  CONFIRMAR AGENDAMENTO
                </button>
              </form>

              <button className="btn-back" onClick={() => setStep(3)}>← Voltar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Agendamento
