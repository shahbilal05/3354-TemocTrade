import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

// Inject JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tt_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const register = (data) => api.post('/auth/register', data)
export const login = (email, password) => {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  return api.post('/auth/login', form)
}
export const getMe = () => api.get('/auth/me')
export const updateMe = (data) => api.put('/auth/me', null, { params: data })

// Categories
export const getCategories = () => api.get('/categories')

// Listings
export const getListings = (params) => api.get('/listings', { params })
export const getListing = (id) => api.get(`/listings/${id}`)
export const createListing = (data) => api.post('/listings', data)
export const updateListing = (id, data) => api.put(`/listings/${id}`, data)
export const deleteListing = (id) => api.delete(`/listings/${id}`)
export const uploadImage = (id, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/listings/${id}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const getMyListings = () => api.get('/my-listings')
export const reportListing = (id, reason) => api.post(`/listings/${id}/report`, { reason })

// Bids
export const getBids = (listingId) => api.get(`/listings/${listingId}/bids`)
export const placeBid = (listingId, amount) => api.post(`/listings/${listingId}/bids`, { amount })

// Messages
export const getConversations = () => api.get('/messages/conversations')
export const getMessages = (listingId) => api.get(`/messages/${listingId}`)
export const sendMessage = (listingId, receiver_id, content) =>
  api.post(`/messages/${listingId}`, { receiver_id, content })

// Cart
export const getCart = () => api.get('/cart')
export const addToCart = (listing_id, qty = 1) => api.post('/cart', { listing_id, qty })
export const removeFromCart = (listing_id) => api.delete(`/cart/${listing_id}`)

// Orders
export const placeOrder = (data) => api.post('/orders', data)
export const getOrders = () => api.get('/orders')
export const getOrder = (id) => api.get(`/orders/${id}`)

export default api
