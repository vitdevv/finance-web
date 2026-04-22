import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import Calculator from './Calculator'
import History from './History'
import Assets from './Assets'
import Months from './Months'
import { useLang } from '../LangContext'

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all
      ${toast.error ? 'bg-red-700 text-white' : 'bg-green-700 text-white'}`}>
      {toast.msg}
    </div>
  )
}

export default function Dashboard({ username, onLogout }) {
  const { t, lang, toggleLang } = useLang()
  const [calculations, setCalculations] = useState([])
  const [assets, setAssets] = useState([])
  const [months, setMonths] = useState([])
  const [balance, setBalance] = useState(null)
  const [toast, setToast] = useState(null)

  const notify = useCallback((msg, error = false) => {
    setToast({ msg, error })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const refreshAll = useCallback(async () => {
    try {
      const [calcs, assetList, monthList, bal] = await Promise.all([
        api.getCalculations(),
        api.getAssets(),
        api.getMonths(),
        api.getBalance(),
      ])
      setCalculations(calcs)
      setAssets(assetList)
      setMonths(monthList)
      setBalance(bal)
    } catch (err) {
      notify(err.message, true)
    }
  }, [notify])

  useEffect(() => { refreshAll() }, [refreshAll])

  async function handleExport() {
    try {
      const blob = await api.exportExcel()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finance_report_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      notify(t('excelDownloaded'))
    } catch (err) {
      notify(err.message, true)
    }
  }

  const fmt = (n) =>
    n == null
      ? '—'
      : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Finance PRO</h1>
          <p className="text-gray-400 text-sm">{t('welcome', { name: username })}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleLang} className="btn-secondary text-xs px-3 py-1">
            {lang === 'en' ? 'PT' : 'EN'}
          </button>
          <button onClick={handleExport} className="btn-success flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('exportExcel')}
          </button>
          <button onClick={onLogout} className="btn-secondary">{t('logout')}</button>
        </div>
      </div>

      {/* Balance bar */}
      {balance && balance.net_profit != null && (
        <div className="card flex flex-wrap gap-6">
          <Stat label={t('netProfit')} value={fmt(balance.net_profit)} color="text-blue-300" />
          <Stat label={t('deductions')} value={fmt(balance.deductions)} color="text-yellow-300" />
          <Stat
            label={t('monthlyBalance')}
            value={fmt(balance.balance)}
            color={balance.balance >= 0 ? 'text-green-400' : 'text-red-400'}
          />
        </div>
      )}

      <Calculator onSaved={refreshAll} notify={notify} />
      <History calculations={calculations} onRefresh={refreshAll} notify={notify} />
      <Assets assets={assets} onRefresh={refreshAll} notify={notify} />
      <Months months={months} onRefresh={refreshAll} notify={notify} />
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
