import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyListings, getCart, removeFromCart, placeOrder, getOrders } from '../api'
import { useAuth } from '../context/AuthContext'
import ListingCard from '../components/ListingCard'

const PAYMENT_METHODS = ['cash', 'venmo', 'paypal', 'zelle']
const STATUS_BADGE = { pending:'badge-orange', confirmed:'badge-blue', shipped:'badge-blue', completed:'badge-green', cancelled:'badge-red' }

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('listings') // 'listings' | 'cart' | 'orders'
  const [listings, setListings] = useState([])
  const [cart, setCart] = useState([])
  const [orders, setOrders] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('venmo')
  const [confirmItem, setConfirmItem] = useState(null)
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(true)

  const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 4000) }

  useEffect(() => {
    setLoading(true)
    Promise.all([getMyListings(), getCart(), getOrders()])
      .then(([l, c, o]) => { setListings(l.data); setCart(c.data); setOrders(o.data) })
      .finally(() => setLoading(false))
  }, [])

  const handleRemoveCart = async (id) => {
    await removeFromCart(id)
    setCart(c => c.filter(i => i.listing_id !== id))
  }

  const handleOrder = async (item) => {
    try {
      await placeOrder({ listing_id: item.listing_id, payment: { method: paymentMethod, amount: item.price } })
      setCart(c => c.filter(i => i.listing_id !== item.listing_id))
      const o = await getOrders()
      setOrders(o.data)
      setConfirmItem(null)
      showAlert('success', `Order placed! Pay via ${paymentMethod}.`)
    } catch (err) {
      showAlert('error', err.response?.data?.detail || 'Order failed')
    }
  }

  const TABS = [
    { key:'listings', label:`My Listings (${listings.length})` },
    { key:'cart',     label:`Cart (${cart.length})` },
    { key:'orders',   label:`Orders (${orders.length})` },
  ]

  return (
    <div className="container" style={{ paddingTop:40, paddingBottom:60 }}>
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {/* Profile Header */}
      <div className="card" style={{ marginBottom:28, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg, var(--accent), var(--utd-green))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.8rem', fontWeight:800, color:'white', flexShrink:0 }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex:1 }}>
          <h2 style={{ marginBottom:4 }}>{user?.name}</h2>
          <p style={{ fontSize:'0.875rem', marginBottom:8 }}>{user?.email}</p>
          <div style={{ display:'flex', gap:6 }}>
            <span className="badge badge-green">✅ Verified UTD</span>
            <span className="badge badge-blue">{user?.role}</span>
          </div>
        </div>
        <button className="btn btn-danger btn-sm" onClick={() => { logout(); navigate('/') }}>Logout</button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
        {[
          { label:'Listed', value: listings.length },
          { label:'Active', value: listings.filter(l=>l.status==='active').length },
          { label:'Sold',   value: listings.filter(l=>l.status==='sold').length },
        ].map(s => (
          <div key={s.label} className="card text-center" style={{ padding:'16px 8px' }}>
            <div style={{ fontSize:'1.75rem', fontWeight:800, color:'var(--accent)' }}>{s.value}</div>
            <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:'var(--bg-secondary)', borderRadius:'var(--radius-lg)', padding:4, marginBottom:24, border:'1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex:1, padding:'9px', borderRadius:'var(--radius)', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.825rem', fontFamily:'inherit', transition:'all 150ms',
              background: tab === t.key ? 'var(--bg-card)' : 'transparent',
              color: tab === t.key ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-center"><div className="spinner"/></div> : (

        <>
          {/* ── MY LISTINGS ── */}
          {tab === 'listings' && (
            <>
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
                <Link to="/create-listing"><button className="btn btn-primary btn-sm">+ New Listing</button></Link>
              </div>
              {listings.length === 0 ? (
                <div className="card text-center" style={{ padding:48 }}>
                  <div style={{ fontSize:'2.5rem', marginBottom:12 }}>📦</div>
                  <h3>No listings yet</h3>
                  <p style={{ marginBottom:20 }}>Start selling to other Comets!</p>
                  <Link to="/create-listing"><button className="btn btn-primary">Create Listing</button></Link>
                </div>
              ) : (
                <div className="listings-grid">
                  {listings.map(l => <ListingCard key={l.id} listing={l} />)}
                </div>
              )}
            </>
          )}

          {/* ── CART ── */}
          {tab === 'cart' && (
            <>
              <div className="form-group" style={{ maxWidth:200, marginBottom:20 }}>
                <label className="form-label">Payment Method</label>
                <select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
                </select>
              </div>
              {cart.length === 0 ? (
                <div className="card text-center" style={{ padding:48 }}>
                  <div style={{ fontSize:'2.5rem', marginBottom:12 }}>🛒</div>
                  <h3>Cart is empty</h3>
                  <p style={{ marginBottom:20 }}>Browse listings to add items</p>
                  <Link to="/"><button className="btn btn-primary">Browse</button></Link>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {cart.map(item => (
                    <div key={item.listing_id} className="card" style={{ display:'flex', gap:16, alignItems:'center' }}>
                      <div style={{ width:72, height:72, borderRadius:'var(--radius)', overflow:'hidden', flexShrink:0, background:'var(--bg-secondary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>
                        {item.images?.[0] ? <img src={item.images[0]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : '📦'}
                      </div>
                      <div style={{ flex:1 }}>
                        <Link to={`/listings/${item.listing_id}`} style={{ fontWeight:600, color:'var(--text-primary)' }}>{item.title}</Link>
                        <div style={{ color:'var(--accent)', fontWeight:700, marginTop:4 }}>${item.price}</div>
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => setConfirmItem(item)}>Buy</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleRemoveCart(item.listing_id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── ORDERS ── */}
          {tab === 'orders' && (
            orders.length === 0 ? (
              <div className="card text-center" style={{ padding:48 }}>
                <div style={{ fontSize:'2.5rem', marginBottom:12 }}>📋</div>
                <h3>No orders yet</h3>
                <p style={{ marginBottom:20 }}>Your purchase history will appear here</p>
                <Link to="/"><button className="btn btn-primary">Shop Now</button></Link>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {orders.map(order => (
                  <div key={order.id} className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                    <div>
                      <Link to={`/listings/${order.listing_id}`} style={{ fontWeight:600, color:'var(--text-primary)' }}>{order.listing_title}</Link>
                      <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:4 }}>
                        #{order.id.slice(0,8)} · {new Date(order.created_at).toLocaleDateString()} · via {order.payment_method}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontWeight:800, color:'var(--accent)' }}>${order.total}</span>
                      <span className={`badge ${STATUS_BADGE[order.status] || 'badge-gray'}`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

      {/* Confirm order modal */}
      {confirmItem && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div className="card" style={{ maxWidth:400, width:'100%', margin:24 }}>
            <h3 style={{ marginBottom:8 }}>Confirm Order</h3>
            <p style={{ marginBottom:20 }}>
              Buy <strong>{confirmItem.title}</strong> for <strong style={{ color:'var(--accent)' }}>${confirmItem.price}</strong> via <strong>{paymentMethod}</strong>?
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-primary" onClick={() => handleOrder(confirmItem)}>Confirm</button>
              <button className="btn btn-secondary" onClick={() => setConfirmItem(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
