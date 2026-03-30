import { Link } from 'react-router-dom'

const CONDITION_LABELS = { new:'New', like_new:'Like New', good:'Good', fair:'Fair', poor:'Poor' }
const TYPE_LABELS = { fixed:'Buy Now', auction:'Auction' }

export default function ListingCard({ listing }) {
  const img = listing.images?.[0]

  return (
    <Link to={`/listings/${listing.id}`} style={{ textDecoration: 'none' }}>
      <div className="card card-hover" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
        {/* Image */}
        <div style={{ height: 180, background: 'var(--bg-secondary)', overflow: 'hidden', position: 'relative' }}>
          {img ? (
            <img src={img} alt={listing.title} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 300ms ease' }}
              onMouseOver={e => e.target.style.transform='scale(1.04)'}
              onMouseOut={e => e.target.style.transform='scale(1)'}
            />
          ) : (
            <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:'2.5rem' }}>🛍️</div>
          )}
          {/* Auction badge */}
          {listing.listing_type === 'auction' && (
            <div style={{ position:'absolute', top:8, left:8 }}>
              <span className="badge badge-orange">Auction</span>
            </div>
          )}
          {listing.status === 'sold' && (
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="badge badge-red" style={{ fontSize:'0.85rem', padding:'6px 14px' }}>SOLD</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '14px 16px 16px' }}>
          <h4 style={{ color:'var(--text-primary)', marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{listing.title}</h4>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 8 }}>
            <span style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--accent)' }}>${listing.price.toLocaleString()}</span>
            <span className="badge badge-gray">{CONDITION_LABELS[listing.condition] || listing.condition}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {listing.category_name && <span className="badge badge-blue">{listing.category_name}</span>}
            <span style={{ marginLeft:'auto', fontSize:'0.75rem', color:'var(--text-muted)' }}>{listing.seller_name}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
