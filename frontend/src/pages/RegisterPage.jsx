import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'both' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!form.email.endsWith('@utdallas.edu')) return 'Email must end in @utdallas.edu'
    if (form.password.length < 6) return 'Password must be at least 6 characters'
    if (!form.name.trim()) return 'Name is required'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)', padding: 24 }}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <div className="text-center" style={{ marginBottom: 40 }}>
          <div style={{ width:60, height:60, borderRadius:16, background:'linear-gradient(135deg, var(--accent), var(--utd-green))', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1.6rem', color:'white', margin:'0 auto 16px' }}>T</div>
          <h1 style={{ fontSize:'1.75rem', marginBottom: 8 }}>Join TemocTrade</h1>
          <p>UTDallas students & staff only</p>
        </div>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input id="reg-name" className="form-input" type="text" placeholder="Temoc Comet" value={form.name}
                onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">UTD Email</label>
              <input id="reg-email" className="form-input" type="email" placeholder="abc123456@utdallas.edu" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})} required />
              <div className="form-hint">Must end in @utdallas.edu</div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input id="reg-password" className="form-input" type="password" placeholder="Min. 6 characters" value={form.password}
                onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">I want to…</label>
              <select id="reg-role" className="form-select" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="both">Buy & Sell</option>
                <option value="buyer">Buy Only</option>
                <option value="seller">Sell Only</option>
              </select>
            </div>
            <button id="reg-submit" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <hr className="divider" />
          <p className="text-center" style={{ fontSize:'0.875rem' }}>
            Already have an account? <Link to="/login" style={{ fontWeight:600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
