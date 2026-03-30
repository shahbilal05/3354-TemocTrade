import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getOrders } from '../api'

const STATUS_BADGE = {
  pending:   'badge-orange',
  confirmed: 'badge-blue',
  shipped:   'badge-blue',
  completed: 'badge-green',
  cancelled: 'badge-red',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getOrders().then(r => { setOrders(r.data); setLoading(false) }) }, [])

  return (
    <div className="container" style={{ paddingTop:40, paddingBottom:60, maxWidth:800 }}>
      <h1 style={{ marginBottom:8 }}>My Orders</h1>
      <p style={{ marginBottom:32 }}>Track all your purchases</p>

      {loading ? (
        <div className="loading-center"><div className="spinner"/></div>
      ) : orders.length === 0 ? (
        <div className="card text-center" style={{ padding:60 }}>
          <div style={{ fontSize:'3rem', marginBottom:16 }}>📦</div>
          <h3>No orders yet</h3>
          <p style={{ marginBottom:24 }}>Once you buy something it'll appear here.</p>
          <Link to="/"><button className="btn btn-primary">Shop Now</button></Link>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {orders.map(order => (
            <div key={order.id} className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                <div>
                  <Link to={`/listings/${order.listing_id}`} style={{ fontWeight:700, fontSize:'1rem', color:'var(--text-primary)' }}>
                    {order.listing_title}
                  </Link>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:4 }}>
                    Order #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginTop:6 }}>
                    Payment: <strong>{order.payment_method}</strong> · Status: <strong>{order.payment_status}</strong>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:'1.3rem', fontWeight:800, color:'var(--accent)', marginBottom:8 }}>${order.total.toLocaleString()}</div>
                  <span className={`badge ${STATUS_BADGE[order.status] || 'badge-gray'}`}>{order.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
