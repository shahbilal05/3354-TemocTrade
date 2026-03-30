import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'both' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    if (!form.email.endsWith('@utdallas.edu')) return 'Email must end in @utdallas.edu'
    if (form.password.length < 6) return 'Password must be at least 6 characters'
    if (mode === 'register' && !form.name.trim()) return 'Name is required'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError(''); setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register({ name: form.name, email: form.email, password: form.password, role: form.role })
      }
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || (mode === 'login' ? 'Invalid credentials' : 'Registration failed'))
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)', padding:24 }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        {/* Logo */}
        <div className="text-center" style={{ marginBottom:36 }}>
          <Link to="/">
            <div style={{ width:60, height:60, borderRadius:16, background:'linear-gradient(135deg, var(--accent), var(--utd-green))', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1.6rem', color:'white', margin:'0 auto 16px', cursor:'pointer' }}>T</div>
          </Link>
          <h1 style={{ fontSize:'1.75rem', marginBottom:6 }}>
            {mode === 'login' ? 'Welcome back' : 'Join TemocTrade'}
          </h1>
          <p>UTDallas students &amp; staff only</p>
        </div>

        {/* Toggle */}
        <div style={{ display:'flex', background:'var(--bg-secondary)', borderRadius:'var(--radius-lg)', padding:4, marginBottom:24, border:'1px solid var(--border)' }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              style={{ flex:1, padding:'10px', borderRadius:'var(--radius)', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', fontFamily:'inherit', transition:'all 150ms',
                background: mode === m ? 'linear-gradient(135deg, var(--accent), var(--utd-green))' : 'transparent',
                color: mode === m ? 'white' : 'var(--text-secondary)',
                boxShadow: mode === m ? '0 2px 8px rgba(0,179,136,0.3)' : 'none',
              }}>
              {m === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input id="auth-name" className="form-input" type="text" placeholder="Temoc Comet"
                  value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">UTD Email</label>
              <input id="auth-email" className="form-input" type="email" placeholder="netid@utdallas.edu"
                value={form.email} onChange={e => set('email', e.target.value)} required />
              {mode === 'register' && <div className="form-hint">Must end in @utdallas.edu</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input id="auth-password" className="form-input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">I want to…</label>
                <select id="auth-role" className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="both">Buy &amp; Sell</option>
                  <option value="buyer">Buy Only</option>
                  <option value="seller">Sell Only</option>
                </select>
              </div>
            )}
            <button id="auth-submit" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
