import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getCategories, createListing, uploadImage, getListing, updateListing } from '../api'

const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor']
const CONDITION_LABELS = { new:'New', like_new:'Like New', good:'Good', fair:'Fair', poor:'Poor' }

export default function CreateListingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    title:'', description:'', price:'', category_id:'',
    condition:'good', listing_type:'fixed', auction_end:'',
    meetup_location:'', shipping_available: false,
  })
  const [images, setImages] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getCategories().then(r => setCategories(r.data))
    if (editId) {
      getListing(editId).then(r => {
        const l = r.data
        setForm({ title:l.title, description:l.description, price:l.price,
          category_id:l.category_id, condition:l.condition, listing_type:l.listing_type,
          auction_end: l.auction_end ? l.auction_end.slice(0,16) : '',
          meetup_location: l.meetup_location||'', shipping_available: l.shipping_available||false })
        setImages(l.images || [])
      })
    }
  }, [editId])

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    setImageFiles(files)
    const previews = files.map(f => URL.createObjectURL(f))
    setImages(prev => [...prev, ...previews])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.category_id) { setError('Please select a category'); return }
    setLoading(true)
    try {
      const payload = { ...form, price: parseFloat(form.price), auction_end: form.auction_end || null }
      let listingId = editId
      if (editId) {
        await updateListing(editId, payload)
      } else {
        const res = await createListing(payload)
        listingId = res.data.id
      }
      // Upload images
      for (const file of imageFiles) {
        await uploadImage(listingId, file)
      }
      navigate(`/listings/${listingId}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save listing')
    }
    setLoading(false)
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 720 }}>
      <h1 style={{ marginBottom: 8 }}>{editId ? 'Edit Listing' : 'Create a Listing'}</h1>
      <p style={{ marginBottom: 32 }}>Fill out the details below to list your item for UTD students.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 20 }}>Item Details</h3>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="e.g. MacBook Pro 14-inch 2023" required
              value={form.title} onChange={e => setForm({...form, title:e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-textarea" style={{ minHeight:120 }}
              placeholder="Describe your item — condition details, what's included, pickup preferences…"
              required value={form.description} onChange={e => setForm({...form, description:e.target.value})} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div className="form-group">
              <label className="form-label">Price ($) *</label>
              <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" required
                value={form.price} onChange={e => setForm({...form, price:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" value={form.category_id} onChange={e => setForm({...form, category_id:e.target.value})} required>
                <option value="">Select category…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Condition</label>
              <select className="form-select" value={form.condition} onChange={e => setForm({...form, condition:e.target.value})}>
                {CONDITIONS.map(c => <option key={c} value={c}>{CONDITION_LABELS[c]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Listing Type</label>
              <select className="form-select" value={form.listing_type} onChange={e => setForm({...form, listing_type:e.target.value})}>
                <option value="fixed">Buy Now (Fixed Price)</option>
                <option value="auction">Auction</option>
              </select>
            </div>
          </div>
          {form.listing_type === 'auction' && (
            <div className="form-group">
              <label className="form-label">Auction End Date & Time</label>
              <input className="form-input" type="datetime-local"
                value={form.auction_end} onChange={e => setForm({...form, auction_end:e.target.value})} />
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 20 }}>Delivery & Meetup</h3>
          <div className="form-group">
            <label className="form-label">Campus Meetup Location</label>
            <input className="form-input" placeholder="e.g. SU Food Court, ECSN Lobby"
              value={form.meetup_location} onChange={e => setForm({...form, meetup_location:e.target.value})} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <input type="checkbox" id="shipping" checked={form.shipping_available}
              onChange={e => setForm({...form, shipping_available:e.target.checked})}
              style={{ width:18, height:18, accentColor:'var(--accent)' }} />
            <label htmlFor="shipping" style={{ color:'var(--text-secondary)', cursor:'pointer' }}>Shipping available</label>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 20 }}>Photos</h3>
          <input type="file" accept="image/*" multiple onChange={handleImageChange}
            style={{ display:'none' }} id="img-upload" />
          <label htmlFor="img-upload" className="btn btn-secondary" style={{ display:'inline-flex', cursor:'pointer', marginBottom:16 }}>
            📷 Add Photos
          </label>
          {images.length > 0 && (
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {images.map((img, i) => (
                <div key={i} style={{ width:100, height:100, borderRadius:'var(--radius)', overflow:'hidden', border:'1px solid var(--border)' }}>
                  <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display:'flex', gap:12 }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Saving…' : editId ? 'Update Listing' : 'Publish Listing'}
          </button>
          <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
