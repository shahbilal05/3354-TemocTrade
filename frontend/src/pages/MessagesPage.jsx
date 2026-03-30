import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getConversations, getMessages, sendMessage } from '../api'
import { useAuth } from '../context/AuthContext'

export default function MessagesPage() {
  const { listingId: paramListingId } = useParams()
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeListing, setActiveListing] = useState(paramListingId || null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [receiverId, setReceiverId] = useState(null)
  const bottomRef = useRef(null)

  const fetchConversations = () =>
    getConversations().then(r => {
      setConversations(r.data)
      if (paramListingId && !activeListing) setActiveListing(paramListingId)
    })

  useEffect(() => { fetchConversations() }, [])

  useEffect(() => {
    if (!activeListing) return
    const load = () => getMessages(activeListing).then(r => {
      setMessages(r.data)
      const other = r.data.find(m => m.sender_id !== user.id || m.receiver_id !== user.id)
      if (other) setReceiverId(other.sender_id === user.id ? other.receiver_id : other.sender_id)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 50)
    })
    load()
    const interval = setInterval(load, 4000)
    return () => clearInterval(interval)
  }, [activeListing])

  const handleSend = async () => {
    if (!newMsg.trim() || !receiverId) return
    await sendMessage(activeListing, receiverId, newMsg)
    setNewMsg('')
    getMessages(activeListing).then(r => {
      setMessages(r.data)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 50)
    })
  }

  const activeConvo = conversations.find(c => c.listing_id === activeListing)

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 0 }}>
      <h2 style={{ marginBottom: 24 }}>Messages</h2>
      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20, height:'calc(100vh - 160px)' }}>

        {/* Sidebar */}
        <div className="card" style={{ padding:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid var(--border)', fontWeight:600, fontSize:'0.85rem',color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Conversations</div>
          <div style={{ overflowY:'auto', flex:1 }}>
            {conversations.length === 0 && (
              <div style={{ padding:24, textAlign:'center', color:'var(--text-muted)', fontSize:'0.875rem' }}>No conversations yet</div>
            )}
            {conversations.map(c => (
              <div key={c.listing_id} onClick={() => { setActiveListing(c.listing_id); setReceiverId(c.other_user_id) }}
                style={{ padding:'14px 16px', cursor:'pointer', borderBottom:'1px solid var(--border)', background: activeListing === c.listing_id ? 'var(--bg-card-hover)' : 'transparent', transition:'background 150ms' }}>
                <div style={{ fontWeight:600, fontSize:'0.875rem', marginBottom:2, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.listing_title}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginBottom:4 }}>with {c.other_user_name}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.last_message}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="card" style={{ padding:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {!activeListing ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>
              <div className="text-center">
                <div style={{ fontSize:'3rem', marginBottom:12 }}>💬</div>
                <p>Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12 }}>
                <div>
                  <div style={{ fontWeight:600 }}>{activeConvo?.listing_title || 'Conversation'}</div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>
                    with {activeConvo?.other_user_name}
                    {' · '}<Link to={`/listings/${activeListing}`} style={{ fontSize:'0.78rem' }}>View listing →</Link>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:12 }}>
                {messages.map(m => {
                  const isMe = m.sender_id === user.id
                  return (
                    <div key={m.id} style={{ display:'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth:'70%', padding:'10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isMe ? 'linear-gradient(135deg, var(--accent), var(--utd-green))' : 'var(--bg-secondary)',
                        border: isMe ? 'none' : '1px solid var(--border)',
                      }}>
                        {!isMe && <div style={{ fontSize:'0.72rem', fontWeight:600, color:'var(--accent)', marginBottom:4 }}>{m.sender_name}</div>}
                        <div style={{ fontSize:'0.9rem', color: isMe ? 'white' : 'var(--text-primary)' }}>{m.content}</div>
                        <div style={{ fontSize:'0.7rem', color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', marginTop:4, textAlign:'right' }}>
                          {new Date(m.sent_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ padding:'16px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:10 }}>
                <input className="form-input" placeholder="Type a message…"
                  value={newMsg} onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()} />
                <button className="btn btn-primary" onClick={handleSend}>Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
