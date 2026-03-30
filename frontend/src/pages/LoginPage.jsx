import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)', padding: 24 }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        {/* Logo */}
        <div className="text-center" style={{ marginBottom: 40 }}>
          <div style={{ width:60, height:60, borderRadius:16, background:'linear-gradient(135deg, var(--accent), var(--utd-green))', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1.6rem', color:'white', margin:'0 auto 16px' }}>T</div>
          <h1 style={{ fontSize:'1.75rem', marginBottom: 8 }}>Welcome back</h1>
          <p>Sign in to your TemocTrade account</p>
        </div>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">UTD Email</label>
              <input
                id="login-email"
                className="form-input"
                type="email"
                placeholder="netid@utdallas.edu"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="login-password"
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                required
              />
            </div>
            <button id="login-submit" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <hr className="divider" />
          <p className="text-center" style={{ fontSize:'0.875rem' }}>
            Don't have an account? <Link to="/register" style={{ fontWeight:600 }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
