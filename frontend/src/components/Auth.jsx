import { useState } from 'react'
import { api } from '../api'

export default function Auth({ onLogin }) {
  const [tab, setTab] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const data = await api.login(username, password)
      onLogin(data.token, data.username)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!username || !password) return setError('Fill all fields.')
    if (password !== confirm) return setError('Passwords do not match.')
    setLoading(true)
    try {
      await api.register(username, password)
      setSuccess('Account created! You can now log in.')
      setTab('login')
      setPassword(''); setConfirm('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center mb-1 text-white">Finance PRO</h1>
        <p className="text-gray-400 text-center text-sm mb-6">Brazilian freelancer tax dashboard</p>

        <div className="card">
          <div className="flex rounded-lg overflow-hidden mb-5 bg-gray-800">
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === 'login' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => { setTab('login'); setError(''); setSuccess('') }}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === 'register' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => { setTab('register'); setError(''); setSuccess('') }}
            >
              Create Account
            </button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <input className="w-full" placeholder="Username" value={username}
                onChange={e => setUsername(e.target.value)} autoFocus />
              <input className="w-full" type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)} />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {success && <p className="text-green-400 text-sm">{success}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <input className="w-full" placeholder="Username" value={username}
                onChange={e => setUsername(e.target.value)} autoFocus />
              <input className="w-full" type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)} />
              <input className="w-full" type="password" placeholder="Confirm Password" value={confirm}
                onChange={e => setConfirm(e.target.value)} />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Creating…' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
