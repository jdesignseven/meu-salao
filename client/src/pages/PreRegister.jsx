import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_URL = '/api'

export default function PreRegister() {
  const [form, setForm] = useState({
    name: '',
    gender: '',
    cpf: '',
    phone: '',
    profession: '',
    holder_type: 'Titular',
    cep: '',
    number: '',
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch(`${API_URL}/pre-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao realizar pré-cadastro')
        return
      }

      navigate(`/agendamento?name=${encodeURIComponent(form.name)}&phone=${encodeURIComponent(form.phone)}`)
    } catch {
      setError('Erro ao conectar com o servidor')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa', fontFamily: "'Roboto', sans-serif" }}>
      <div style={{ backgroundColor: '#fff', padding: '48px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', width: '100%', maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#002cd6', marginBottom: '8px', fontFamily: "'Coolvetica Book', sans-serif" }}>beautysis</h1>
          <p style={{ fontSize: '14px', color: '#606060' }}>Pré-cadastro</p>
        </div>

        {error && <div style={{ backgroundColor: '#ffebee', color: '#d32f2f', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>Nome Completo *</label>
            <input name="name" value={form.name} onChange={handleChange} required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>Sexo</label>
            <select name="gender" value={form.gender} onChange={handleChange}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: '#fff' }}>
              <option value="">Selecione</option>
              <option value="Feminino">Feminino</option>
              <option value="Masculino">Masculino</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>CPF</label>
            <input name="cpf" value={form.cpf} onChange={handleChange}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>WhatsApp *</label>
            <input name="phone" value={form.phone} onChange={handleChange} required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>Empresa onde trabalha</label>
            <input name="profession" value={form.profession} onChange={handleChange}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>Titular/Dependente/Particular *</label>
            <select name="holder_type" value={form.holder_type} onChange={handleChange} required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: '#fff' }}>
              <option value="Titular">Titular</option>
              <option value="Dependente">Dependente</option>
              <option value="Particular">Particular</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>CEP</label>
            <input name="cep" value={form.cep} onChange={handleChange}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>Número da Residência</label>
            <input name="number" value={form.number} onChange={handleChange}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <button type="submit"
            style={{ width: '100%', backgroundColor: '#002cd6', color: '#fff', padding: '12px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
            Enviar Pré-cadastro
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#606060' }}>
          <Link to="/" style={{ color: '#606060', textDecoration: 'none' }}>← Voltar para home</Link>
        </div>
      </div>
    </div>
  )
}
