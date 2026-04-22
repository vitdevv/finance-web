import { useState, useEffect } from 'react'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'

export default function App() {
  const [auth, setAuth] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('finance_token')
    const username = localStorage.getItem('finance_username')
    if (token && username) setAuth({ token, username })
  }, [])

  function handleLogin(token, username) {
    localStorage.setItem('finance_token', token)
    localStorage.setItem('finance_username', username)
    setAuth({ token, username })
  }

  function handleLogout() {
    localStorage.removeItem('finance_token')
    localStorage.removeItem('finance_username')
    setAuth(null)
  }

  if (!auth) return <Auth onLogin={handleLogin} />
  return <Dashboard username={auth.username} onLogout={handleLogout} />
}
