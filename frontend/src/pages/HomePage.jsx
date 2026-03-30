import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getListings, getCategories } from '../api'
import ListingCard from '../components/ListingCard'

const HERO_CATEGORIES = [
  { icon:'💻', name:'Electronics' }, { icon:'👕', name:'Clothes' },
  { icon:'📚', name:'Textbooks' },  { icon:'🛋️', name:'Furniture' },
  { icon:'⚽', name:'Sporting Goods' }, { icon:'🎮', name:'Gaming' },
  { icon:'🏠', name:'Household Items' }, { icon:'🎸', name:'Music Instruments' },
]

export default function HomePage() {
  const [listings, setListings] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('')
  const [sort, setSort] = useState('created_at')
  const [listingType, setListingType] = useState('')

  const fetchListings = async (params = {}) => {
    setLoading(true)
    try {
      const res = await getListings({ search, category_id: selectedCat, sort, listing_type: listingType, ...params })
      setListings(res.data.listings)
      setTotal(res.data.total)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { getCategories().then(r => setCategories(r.data)) }, [])
  useEffect(() => { fetchListings() }, [selectedCat, sort, listingType])

  const handleSearch = (e) => { e.preventDefault(); fetchListings() }

  return (
    <div>
      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg, var(--utd-green) 0%, #0d2b1e 60%, var(--bg-primary) 100%)', padding:'80px 0 60px' }}>
        <div className="container text-center">
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(0,179,136,0.15)', border:'1px solid rgba(0,179,136,0.3)', borderRadius:'var(--radius-full)', padding:'6px 16px', marginBottom:20 }}>
            <span style={{ color:'var(--accent)', fontSize:'0.8rem', fontWeight:600 }}>🎓 UTD Students Only</span>
          </div>
          <h1 style={{ marginBottom:16 }}>Buy & Sell with<br />
            <span style={{ background:'linear-gradient(90deg, var(--accent), #88ffdd)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Fellow Comets</span>
          </h1>
          <p style={{ maxWidth:500, margin:'0 auto 32px', fontSize:'1.05rem' }}>
            The trusted marketplace for UTDallas students. Verified identities, campus meetups, real-time auctions.
          </p>
          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ display:'flex', gap:12, maxWidth:580, margin:'0 auto', background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-xl)', padding:'8px 8px 8px 20px' }}>
            <input
              className="form-input"
              style={{ background:'transparent', border:'none', boxShadow:'none', flex:1, padding:'6px 0', fontSize:'1rem' }}
              placeholder="Search for textbooks, electronics, clothes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-lg)' }}>Search</button>
          </form>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        {/* Category row */}
        <h2 style={{ marginBottom: 20 }}>Browse Categories</h2>
        <div style={{ display:'flex', gap:10, marginBottom: 48, overflowX:'auto', paddingBottom: 8, scrollbarWidth:'none' }}>
          <button
            className={`card ${!selectedCat ? 'card-hover' : ''}`}
            style={{ textAlign:'center', padding:'16px 8px', cursor:'pointer', flexShrink:0, width:100, border: !selectedCat ? '1px solid var(--accent)' : '1px solid var(--border)', background: !selectedCat ? 'rgba(0,179,136,0.08)' : 'var(--bg-card)' }}
            onClick={() => setSelectedCat('')}
          >
            <div style={{ fontSize:'1.5rem', marginBottom: 6 }}>🛍️</div>
            <div style={{ fontSize:'0.78rem', fontWeight:600, color: !selectedCat ? 'var(--accent)' : 'var(--text-secondary)' }}>All</div>
          </button>
          {categories.map(cat => (
            <button key={cat.id}
              className="card card-hover"
              style={{ textAlign:'center', padding:'16px 8px', cursor:'pointer', flexShrink:0, width:100, border: selectedCat === cat.id ? '1px solid var(--accent)' : '1px solid var(--border)', background: selectedCat === cat.id ? 'rgba(0,179,136,0.08)' : 'var(--bg-card)' }}
              onClick={() => setSelectedCat(selectedCat === cat.id ? '' : cat.id)}
            >
              <div style={{ fontSize:'1.5rem', marginBottom: 6 }}>
                {HERO_CATEGORIES.find(h => h.name === cat.name)?.icon || '📦'}
              </div>
              <div style={{ fontSize:'0.78rem', fontWeight:600, color: selectedCat === cat.id ? 'var(--accent)' : 'var(--text-secondary)' }}>{cat.name}</div>
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 24, flexWrap:'wrap', gap: 12 }}>
          <div>
            <h2 style={{ marginBottom: 0 }}>
              {selectedCat ? categories.find(c=>c.id===selectedCat)?.name : 'All Listings'}
              <span style={{ fontSize:'1rem', color:'var(--text-muted)', fontWeight:400, marginLeft: 10 }}>{total} items</span>
            </h2>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <select className="form-select" style={{ width:'auto' }} value={listingType} onChange={e => setListingType(e.target.value)}>
              <option value="">All Types</option>
              <option value="fixed">Buy Now</option>
              <option value="auction">Auction</option>
            </select>
            <select className="form-select" style={{ width:'auto' }} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="created_at">Newest</option>
              <option value="price">Price</option>
            </select>
          </div>
        </div>

        {/* Listings grid */}
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : listings.length === 0 ? (
          <div className="text-center" style={{ paddingTop: 60, color: 'var(--text-muted)' }}>
            <div style={{ fontSize:'3rem', marginBottom: 16 }}>🔍</div>
            <h3>No listings found</h3>
            <p style={{ marginBottom: 24 }}>Be the first to list something!</p>
            <Link to="/create-listing"><button className="btn btn-primary">Create Listing</button></Link>
          </div>
        ) : (
          <div className="listings-grid">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  )
}
