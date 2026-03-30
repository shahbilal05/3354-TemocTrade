import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCart, removeFromCart, placeOrder } from '../api'

const PAYMENT_METHODS = ['cash', 'venmo', 'paypal', 'zelle']

export default function CartPage() {
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('venmo')
  const [ordering, setOrdering] = useState(false)
  const [alert, setAlert] = useState(null)
  const navigate = useNavigate()

  const fetchCart = () => getCart().then(r => { setCart(r.data); setLoading(false) })
  useEffect(() => { fetchCart() }, [])

  const handleRemove = async (id) => {
    await removeFromCart(id)
    fetchCart()
  }

  const handleOrder = async (item) => {
    setOrdering(true)
    try {
      await placeOrder({ listing_id: item.listing_id, payment: { method: paymentMethod, amount: item.price } })
      setAlert({ type:'success', msg:`Order placed for "${item.title}"! Pay via ${paymentMethod}.` })
      fetchCart()
      setSelectedItem(null)
    } catch (err) {
      setAlert({ type:'error', msg: err.response?.data?.detail || 'Order failed' })
    }
    setOrdering(false)
    setTimeout(() => setAlert(null), 5000)
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0)

  return (
    <div className="container" style={{ paddingTop:40, paddingBottom:60 }}>
      <h1 style={{ marginBottom:8 }}>🛒 Your Cart</h1>
      <p style={{ marginBottom:32 }}>{cart.length} item{cart.length !== 1 ? 's' : ''}</p>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {loading ? (
        <div className="loading-center"><div className="spinner"/></div>
      ) : cart.length === 0 ? (
        <div className="card text-center" style={{ padding:60 }}>
          <div style={{ fontSize:'3rem', marginBottom:16 }}>🛒</div>
          <h3>Your cart is empty</h3>
          <p style={{ marginBottom:24 }}>Find something you like!</p>
          <Link to="/"><button className="btn btn-primary">Browse Listings</button></Link>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:24, alignItems:'start' }}>
          {/* Items */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {cart.map(item => (
              <div key={item.listing_id} className="card" style={{ display:'flex', gap:16, alignItems:'center' }}>
                <div style={{ width:80, height:80, borderRadius:'var(--radius)', overflow:'hidden', flexShrink:0, background:'var(--bg-secondary)' }}>
                  {item.images?.[0] ? <img src={item.images[0]} alt={item.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>📦</div>}
                </div>
                <div style={{ flex:1 }}>
                  <Link to={`/listings/${item.listing_id}`} style={{ fontWeight:600, color:'var(--text-primary)', fontSize:'0.95rem' }}>{item.title}</Link>
                  <div style={{ color:'var(--accent)', fontWeight:700, marginTop:4 }}>${item.price.toLocaleString()}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => setSelectedItem(item)}>Buy Now</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleRemove(item.listing_id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="card">
            <h3 style={{ marginBottom:20 }}>Order Summary</h3>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, fontSize:'0.9rem' }}>
              <span style={{ color:'var(--text-secondary)' }}>Items ({cart.length})</span>
              <span style={{ fontWeight:600 }}>${total.toLocaleString()}</span>
            </div>
            <hr className="divider" />
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <span style={{ fontWeight:700 }}>Total</span>
              <span style={{ fontWeight:800, fontSize:'1.2rem', color:'var(--accent)' }}>${total.toLocaleString()}</span>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>
            <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:16 }}>
              Items are purchased individually. Select an item and click "Buy Now" to place an order.
            </p>
          </div>
        </div>
      )}

      {/* Order confirmation modal */}
      {selectedItem && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div className="card" style={{ maxWidth:440, width:'100%', margin:24 }}>
            <h3 style={{ marginBottom:8 }}>Confirm Order</h3>
            <p style={{ marginBottom:20 }}>You're placing an order for <strong>{selectedItem.title}</strong> for <strong style={{ color:'var(--accent)' }}>${selectedItem.price}</strong> via <strong>{paymentMethod}</strong>.</p>
            <div style={{ display:'flex', gap:12 }}>
              <button className="btn btn-primary" onClick={() => handleOrder(selectedItem)} disabled={ordering}>
                {ordering ? 'Placing…' : 'Confirm Order'}
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedItem(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
