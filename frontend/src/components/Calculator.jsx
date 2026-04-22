import { useState } from 'react'
import { api } from '../api'

const fmt = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

export default function Calculator({ onSaved, notify }) {
  const [mode, setMode] = useState('PJ')
  const [usd, setUsd] = useState('')
  const [rate, setRate] = useState('')
  const [brl, setBrl] = useState('')
  const [prolabore, setProlabore] = useState('5500')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchingRate, setFetchingRate] = useState(false)

  async function handleGetRate() {
    setFetchingRate(true)
    try {
      const data = await api.getRate('USD')
      setRate(String(data.rate))
      notify(`USD rate: R$ ${data.rate}`)
    } catch {
      notify('Could not fetch rate. Enter manually.', true)
    } finally {
      setFetchingRate(false)
    }
  }

  async function handleCalculate(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await api.calculate({
        usd_received: parseFloat(usd) || 0,
        usd_rate: parseFloat(rate) || 0,
        brl_extra: parseFloat(brl) || 0,
        prolabore: parseFloat(prolabore) || 0,
        mode,
      })
      setResult(data)
      onSaved()
      notify('Calculated and saved!')
    } catch (err) {
      notify(err.message, true)
    } finally {
      setLoading(false)
    }
  }

  const usdInBrl = (parseFloat(usd) || 0) * (parseFloat(rate) || 0)

  return (
    <div className="card">
      <h2 className="section-title">Monthly Calculation</h2>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        {['PJ', 'PF'].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResult(null) }}
            className={`px-5 py-1.5 rounded text-sm font-medium transition-colors
              ${mode === m ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            {m}
          </button>
        ))}
      </div>

      <form onSubmit={handleCalculate}>
        <div className="flex flex-wrap gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">USD Received</label>
            <input className="w-36" placeholder="0.00" value={usd} onChange={e => setUsd(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">USD → BRL Rate</label>
            <div className="flex gap-2">
              <input className="w-28" placeholder="0.00" value={rate} onChange={e => setRate(e.target.value)} />
              <button type="button" onClick={handleGetRate} className="btn-secondary whitespace-nowrap" disabled={fetchingRate}>
                {fetchingRate ? '…' : 'Get Rate'}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">BRL Extra</label>
            <input className="w-36" placeholder="0.00" value={brl} onChange={e => setBrl(e.target.value)} />
          </div>
          {mode === 'PJ' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Pro-Labore</label>
              <input className="w-36" placeholder="5500" value={prolabore} onChange={e => setProlabore(e.target.value)} />
            </div>
          )}
        </div>

        {usdInBrl > 0 && (
          <p className="text-xs text-gray-400 mb-3">
            USD converted: {fmt(usdInBrl)} + BRL {fmt(parseFloat(brl) || 0)} = {fmt(usdInBrl + (parseFloat(brl) || 0))} total
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Calculating…' : 'Calculate & Save'}
        </button>
      </form>

      {result && (
        <div className="mt-5 border-t border-gray-800 pt-4">
          <ResultTable result={result} mode={mode} />
        </div>
      )}
    </div>
  )
}

function ResultTable({ result, mode }) {
  const fmt = (n) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

  const rows = mode === 'PF'
    ? [
        ['Income', 'USD Converted', result.receita_usd],
        ['Income', 'BRL Extra', result.receita_total - result.receita_usd],
        ['Result', 'PF Total Revenue', result.net_profit],
      ]
    : [
        ['Income', 'USD Converted', result.receita_usd],
        ['Income', 'BRL Extra', result.receita_total - result.receita_usd],
        ['Tax', `DAS (${result.regime})`, -result.das],
        ['Tax', 'INSS', -result.inss],
        ['Tax', 'IRPF', -result.irpf],
        ['Transfer', 'Pro-Labore (→ PF)', result.prolabore],
        ['Result', 'PJ Net Profit', result.net_profit],
      ]

  return (
    <div>
      <p className={`text-lg font-bold mb-3 ${result.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {mode === 'PF' ? 'Total Revenue' : 'Net Profit'}: {fmt(result.net_profit)}
      </p>
      <table className="w-full">
        <thead>
          <tr>
            <th className="table-th">Category</th>
            <th className="table-th">Description</th>
            <th className="table-th text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([cat, desc, amt], i) => (
            <tr key={i} className="hover:bg-gray-800/50">
              <td className="table-td">
                <span className={`badge ${cat === 'Tax' ? 'bg-red-900/50 text-red-300' : cat === 'Result' ? 'bg-blue-900/50 text-blue-300' : 'bg-green-900/50 text-green-300'}`}>
                  {cat}
                </span>
              </td>
              <td className="table-td text-gray-300">{desc}</td>
              <td className={`table-td text-right font-mono ${amt >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {fmt(amt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
