import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, register as apiRegister, getMe } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('tt_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      getMe()
        .then((res) => setUser(res.data))
        .catch(() => { localStorage.removeItem('tt_token'); setToken(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email, password) => {
    const res = await apiLogin(email, password)
    const { access_token, user: u } = res.data
    localStorage.setItem('tt_token', access_token)
    setToken(access_token)
    setUser(u)
    return u
  }

  const register = async (data) => {
    const res = await apiRegister(data)
    const { access_token, user: u } = res.data
    localStorage.setItem('tt_token', access_token)
    setToken(access_token)
    setUser(u)
    return u
  }

  const logout = () => {
    localStorage.removeItem('tt_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
