import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = '/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      login(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      setError('Erro ao fazer login')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa', fontFamily: "'Roboto', sans-serif" }}>
      <div style={{ backgroundColor: '#fff', padding: '48px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#002cd6', marginBottom: '8px', fontFamily: "'Coolvetica Book', sans-serif" }}>beautysis</h1>
          <p style={{ fontSize: '14px', color: '#606060' }}>Faça login para continuar</p>
        </div>

        {error && <div style={{ backgroundColor: '#ffebee', color: '#d32f2f', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#606060', marginBottom: '4px', fontWeight: 500 }}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <button
            type="submit"
            style={{ width: '100%', backgroundColor: '#002cd6', color: '#fff', padding: '12px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
          >
            Entrar
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#606060' }}>
          Não tem conta? <Link to="/register" style={{ color: '#002cd6', textDecoration: 'none' }}>Registre-se</Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#606060' }}>
          <Link to="/" style={{ color: '#606060', textDecoration: 'none' }}>← Voltar para home</Link>
        </div>
      </div>
    </div>
  )
}
