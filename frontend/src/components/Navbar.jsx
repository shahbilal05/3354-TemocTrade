import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_STYLES = `
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: rgba(15,17,23,0.85); backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border); height: 64px;
`

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <nav style={{ position:'fixed',top:0,left:0,right:0,zIndex:100, background:'rgba(15,17,23,0.88)', backdropFilter:'blur(16px)', borderBottom:'1px solid var(--border)', height: 64 }}>
      <div className="container flex items-center justify-between" style={{ height: 64 }}>
        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap: 10, textDecoration:'none' }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg, var(--accent), var(--utd-green))', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1.1rem', color:'white' }}>T</div>
          <span style={{ fontWeight:800, fontSize:'1.15rem', color:'var(--text-primary)', letterSpacing:'-0.02em' }}>TemocTrade</span>
        </Link>

        {/* Center links */}
        <div className="flex gap-4" style={{ display:'flex', gap: 8 }}>
          <Link to="/" style={{ color:'var(--text-secondary)', fontSize:'0.9rem', fontWeight:500, padding:'6px 12px', borderRadius:'var(--radius)', transition:'all 150ms' }}>Browse</Link>
          {user && (
            <>
              <Link to="/create-listing" style={{ color:'var(--text-secondary)', fontSize:'0.9rem', fontWeight:500, padding:'6px 12px', borderRadius:'var(--radius)', transition:'all 150ms' }}>Sell</Link>
              <Link to="/messages" style={{ color:'var(--text-secondary)', fontSize:'0.9rem', fontWeight:500, padding:'6px 12px', borderRadius:'var(--radius)', transition:'all 150ms' }}>Messages</Link>
            </>
          )}
        </div>

        {/* Right: Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/profile" style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', borderRadius:'var(--radius)', background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-primary)', fontSize:'0.85rem', fontWeight:500, textDecoration:'none' }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg, var(--accent), var(--utd-green))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, color:'white' }}>
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                {user.name?.split(' ')[0]}
              </Link>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/auth"><button className="btn btn-secondary btn-sm">Log In</button></Link>
              <Link to="/auth"><button className="btn btn-primary btn-sm">Sign Up</button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
