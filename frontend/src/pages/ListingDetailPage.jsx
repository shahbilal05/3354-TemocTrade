import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getListing, addToCart, reportListing, getBids, placeBid, sendMessage } from '../api'
import { useAuth } from '../context/AuthContext'

const CONDITION_LABELS = { new:'New', like_new:'Like New', good:'Good', fair:'Fair', poor:'Poor' }

export default function ListingDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [bids, setBids] = useState([])
  const [bidAmount, setBidAmount] = useState('')
  const [bidError, setBidError] = useState('')
  const [msgContent, setMsgContent] = useState('')
  const [msgSent, setMsgSent] = useState(false)
  const [addedCart, setAddedCart] = useState(false)
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    getListing(id).then(r => { setListing(r.data); setLoading(false) }).catch(() => setLoading(false))
    getBids(id).then(r => setBids(r.data))
  }, [id])

  if (loading) return <div className="loading-center"><div className="spinner"/></div>
  if (!listing) return <div className="container" style={{paddingTop:40}}><div className="alert alert-error">Listing not found.</div></div>

  const isOwner = user && listing.seller_id === user.id
  const topBid = bids[0]?.amount

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return }
    await addToCart(listing.id)
    setAddedCart(true)
    setAlert({ type:'success', msg:'Added to cart!' })
    setTimeout(() => setAlert(null), 3000)
  }

  const handleBid = async () => {
    setBidError('')
    const amt = parseFloat(bidAmount)
    if (!amt || amt <= 0) { setBidError('Enter a valid amount'); return }
    try {
      await placeBid(id, amt)
      getBids(id).then(r => setBids(r.data))
      setBidAmount('')
      setAlert({ type:'success', msg:`Bid of $${amt} placed!` })
      setTimeout(() => setAlert(null), 3000)
    } catch (err) {
      setBidError(err.response?.data?.detail || 'Bid failed')
    }
  }

  const handleMessage = async () => {
    if (!user) { navigate('/login'); return }
    if (!msgContent.trim()) return
    await sendMessage(id, listing.seller_id, msgContent)
    setMsgSent(true)
    setMsgContent('')
    setAlert({ type:'success', msg:'Message sent!' })
    setTimeout(() => setAlert(null), 3000)
  }

  const handleReport = async () => {
    const reason = prompt('Why are you reporting this listing?')
    if (!reason) return
    await reportListing(id, reason)
    setAlert({ type:'info', msg:'Report submitted. Thank you.' })
    setTimeout(() => setAlert(null), 3000)
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {/* Breadcrumb */}
      <div style={{ marginBottom: 24, display:'flex', gap:8, color:'var(--text-muted)', fontSize:'0.85rem' }}>
        <Link to="/">Home</Link> <span>/</span>
        <span>{listing.category_name}</span> <span>/</span>
        <span style={{ color:'var(--text-secondary)' }}>{listing.title}</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:32, alignItems:'start' }}>
        {/* Left: Images */}
        <div>
          {/* Main image */}
          <div style={{ borderRadius:'var(--radius-lg)', overflow:'hidden', background:'var(--bg-card)', height:420, border:'1px solid var(--border)', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {listing.images?.length > 0 ? (
              <img src={listing.images[imgIdx]} alt={listing.title} style={{ width:'100%', height:'100%', objectFit:'contain' }} />
            ) : (
              <div style={{ fontSize:'5rem' }}>🛍️</div>
            )}
          </div>
          {/* Thumbnails */}
          {listing.images?.length > 1 && (
            <div style={{ display:'flex', gap:8 }}>
              {listing.images.map((img, i) => (
                <div key={i} onClick={() => setImgIdx(i)}
                  style={{ width:72, height:72, borderRadius:'var(--radius)', overflow:'hidden', cursor:'pointer', border: imgIdx===i ? '2px solid var(--accent)' : '2px solid var(--border)' }}>
                  <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Description</h3>
            <p style={{ whiteSpace:'pre-wrap', lineHeight:1.7 }}>{listing.description}</p>
            <hr className="divider" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Condition</div>
                <div style={{ fontWeight:600 }}>{CONDITION_LABELS[listing.condition] || listing.condition}</div>
              </div>
              <div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Category</div>
                <div style={{ fontWeight:600 }}>{listing.category_name}</div>
              </div>
              {listing.meetup_location && (
                <div>
                  <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Meetup Location</div>
                  <div style={{ fontWeight:600 }}>📍 {listing.meetup_location}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Shipping</div>
                <div style={{ fontWeight:600 }}>{listing.shipping_available ? '✅ Available' : '❌ Not available'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Purchase panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Main card */}
          <div className="card">
            <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
              <span className={`badge ${listing.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                {listing.status === 'active' ? '● Active' : listing.status}
              </span>
              <span className="badge badge-blue">{listing.listing_type === 'auction' ? '🏷️ Auction' : '🏪 Buy Now'}</span>
            </div>

            <h2 style={{ marginBottom: 8 }}>{listing.title}</h2>
            <div style={{ fontSize:'2rem', fontWeight:800, color:'var(--accent)', marginBottom: 4 }}>${listing.price.toLocaleString()}</div>
            {listing.listing_type === 'auction' && topBid && (
              <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom: 16 }}>
                Current top bid: <strong style={{ color:'var(--warning)' }}>${topBid}</strong>
              </div>
            )}

            {listing.listing_type === 'fixed' && !isOwner && listing.status === 'active' && (
              <button className="btn btn-primary btn-full" style={{ marginBottom: 10 }} onClick={handleAddToCart} disabled={addedCart}>
                {addedCart ? '✅ Added to Cart' : '🛒 Add to Cart'}
              </button>
            )}

            {!isOwner && (
              <button className="btn btn-secondary btn-full btn-sm" onClick={handleReport}>
                🚩 Report Listing
              </button>
            )}
            {isOwner && (
              <Link to={`/create-listing?edit=${listing.id}`}>
                <button className="btn btn-secondary btn-full">Edit Listing</button>
              </Link>
            )}
          </div>

          {/* Auction bids */}
          {listing.listing_type === 'auction' && (
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>🏆 Place a Bid</h3>
              {listing.auction_end && (
                <div style={{ marginBottom:12, fontSize:'0.85rem', color:'var(--warning)' }}>
                  ⏰ Ends: {new Date(listing.auction_end).toLocaleDateString()}
                </div>
              )}
              {!isOwner && user && listing.status === 'active' && (
                <>
                  {bidError && <div className="alert alert-error">{bidError}</div>}
                  <div style={{ display:'flex', gap:8 }}>
                    <input className="form-input" type="number" min="0" step="0.01"
                      placeholder={`Min $${topBid ? topBid + 0.01 : listing.price}`}
                      value={bidAmount} onChange={e => setBidAmount(e.target.value)} />
                    <button className="btn btn-primary" onClick={handleBid}>Bid</button>
                  </div>
                </>
              )}
              {bids.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Recent Bids</div>
                  {bids.slice(0,5).map((b, i) => (
                    <div key={b.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:'0.875rem' }}>
                      <span style={{ color:'var(--text-secondary)' }}>{i===0 ? '🥇' : i===1?'🥈':'🥉'} {b.bidder_name}</span>
                      <span style={{ fontWeight:700, color: i===0 ? 'var(--accent)' : 'var(--text-primary)' }}>${b.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contact seller / Message */}
          {!isOwner && (
            <div className="card">
              <h3 style={{ marginBottom: 4 }}>Contact Seller</h3>
              <p style={{ fontSize:'0.85rem', marginBottom: 16 }}>
                Listed by <strong style={{ color:'var(--text-primary)' }}>{listing.seller_name}</strong>
              </p>
              {user ? (
                <>
                  <textarea className="form-textarea" style={{ minHeight:80 }}
                    placeholder="Hi, is this still available?"
                    value={msgContent}
                    onChange={e => setMsgContent(e.target.value)}
                  />
                  <button className="btn btn-primary btn-full" style={{ marginTop: 10 }} onClick={handleMessage} disabled={msgSent}>
                    {msgSent ? '✅ Message Sent' : '💬 Send Message'}
                  </button>
                  <Link to={`/messages/${id}`} style={{ display:'block', textAlign:'center', marginTop:10, fontSize:'0.85rem' }}>
                    View full conversation →
                  </Link>
                </>
              ) : (
                <Link to="/login"><button className="btn btn-secondary btn-full">Log in to contact seller</button></Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
