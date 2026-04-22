import { useState } from 'react'
import { api } from '../api'
import { useLang } from '../LangContext'

export default function Auth({ onLogin }) {
  const { t, lang, toggleLang } = useLang()
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
    if (!username || !password) return setError(t('fillAllFields'))
    if (password !== confirm) return setError(t('passwordsMismatch'))
    setLoading(true)
    try {
      await api.register(username, password)
      setSuccess(t('accountCreated'))
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
        <div className="flex justify-end mb-3">
          <button onClick={toggleLang} className="btn-secondary text-xs px-3 py-1">
            {lang === 'en' ? 'PT' : 'EN'}
          </button>
        </div>

        <h1 className="text-3xl font-bold text-center mb-1 text-white">Finance PRO</h1>
        <p className="text-gray-400 text-center text-sm mb-6">{t('tagline')}</p>

        <div className="card">
          <div className="flex rounded-lg overflow-hidden mb-5 bg-gray-800">
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === 'login' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => { setTab('login'); setError(''); setSuccess('') }}
            >
              {t('signIn')}
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === 'register' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => { setTab('register'); setError(''); setSuccess('') }}
            >
              {t('createAccount')}
            </button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <input className="w-full" placeholder={t('username')} value={username}
                onChange={e => setUsername(e.target.value)} autoFocus />
              <input className="w-full" type="password" placeholder={t('password')} value={password}
                onChange={e => setPassword(e.target.value)} />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {success && <p className="text-green-400 text-sm">{success}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? t('signingIn') : t('signIn')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <input className="w-full" placeholder={t('username')} value={username}
                onChange={e => setUsername(e.target.value)} autoFocus />
              <input className="w-full" type="password" placeholder={t('password')} value={password}
                onChange={e => setPassword(e.target.value)} />
              <input className="w-full" type="password" placeholder={t('confirmPassword')} value={confirm}
                onChange={e => setConfirm(e.target.value)} />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? t('creating') : t('createAccount')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
