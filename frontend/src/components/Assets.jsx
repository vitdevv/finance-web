import { useState } from 'react'
import { api } from '../api'

const TYPES = ['Savings', 'Investment', 'Expense', 'Asset']
const CURRENCIES = ['BRL', 'USD', 'AUD']
const fmt = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

const TYPE_COLORS = {
  Expense: 'bg-red-900/40 text-red-300',
  Investment: 'bg-blue-900/40 text-blue-300',
  Savings: 'bg-green-900/40 text-green-300',
  Asset: 'bg-yellow-900/40 text-yellow-300',
}

export default function Assets({ assets, onRefresh, notify }) {
  const [type, setType] = useState('')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('BRL')
  const [rate, setRate] = useState(1.0)
  const [rateLabel, setRateLabel] = useState('Rate: 1.0')
  const [rateColor, setRateColor] = useState('text-gray-400')
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})

  async function selectCurrency(cur) {
    setCurrency(cur)
    if (cur === 'BRL') {
      setRate(1.0); setRateLabel('Rate: 1.0'); setRateColor('text-gray-400')
      return
    }
    setRateLabel(`Fetching ${cur}→BRL…`); setRateColor('text-yellow-400')
    try {
      const data = await api.getRate(cur)
      setRate(data.rate)
      setRateLabel(`1 ${cur} = R$ ${data.rate.toFixed(4)}`)
      setRateColor('text-green-400')
    } catch {
      setRate(0)
      setRateLabel('Could not fetch rate')
      setRateColor('text-red-400')
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!type || !name) return notify('Fill type and name.', true)
    if (!rate && currency !== 'BRL') return notify('Could not get rate. Reselect currency.', true)
    const origAmt = parseFloat(amount) || 0
    const brlAmt = Math.round(origAmt * rate * 100) / 100
    try {
      await api.addAsset({ type, name, orig_amount: origAmt, orig_currency: currency, rate_used: rate, amount: brlAmt })
      setName(''); setAmount('')
      onRefresh()
      notify(`Saved: ${currency} ${origAmt.toFixed(2)} → ${fmt(brlAmt)}`)
    } catch (err) {
      notify(err.message, true)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this asset?')) return
    try {
      await api.deleteAsset(id)
      onRefresh()
      notify('Deleted.')
    } catch (err) {
      notify(err.message, true)
    }
  }

  async function handleRefreshRate(asset) {
    try {
      const data = await api.refreshAssetRate(asset.id)
      onRefresh()
      notify(`Rate updated: 1 ${asset.orig_currency} = R$ ${data.rate.toFixed(4)}`)
    } catch (err) {
      notify(err.message, true)
    }
  }

  function openEdit(a) {
    setEditId(a.id)
    setEditData({ name: a.name, orig_amount: a.orig_amount, rate_used: a.rate_used })
  }

  async function handleSaveEdit() {
    const origAmt = parseFloat(editData.orig_amount) || 0
    const brlAmt = Math.round(origAmt * editData.rate_used * 100) / 100
    try {
      await api.editAsset(editId, { name: editData.name, orig_amount: origAmt, rate_used: editData.rate_used, amount: brlAmt })
      setEditId(null)
      onRefresh()
      notify('Asset updated!')
    } catch (err) {
      notify(err.message, true)
    }
  }

  const editAsset = assets.find(a => a.id === editId)
  const total = assets.reduce((s, a) => s + a.amount, 0)

  return (
    <div className="card">
      <h2 className="section-title">Assets & Expenses (current month)</h2>

      {/* Add form */}
      <form onSubmit={handleAdd} className="mb-4">
        <div className="flex flex-wrap gap-3 mb-3">
          <select className="w-36" value={type} onChange={e => setType(e.target.value)}>
            <option value="">Type…</option>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <input className="w-44" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <input className="w-32" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
          <button type="submit" className="btn-primary">Add</button>
        </div>

        {/* Currency picker */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-400">Currency:</span>
          {CURRENCIES.map(cur => (
            <button
              key={cur}
              type="button"
              onClick={() => selectCurrency(cur)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors
                ${currency === cur ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              {cur}
            </button>
          ))}
          <span className={`text-xs ${rateColor}`}>{rateLabel}</span>
        </div>
      </form>

      {/* Assets table */}
      {assets.length === 0 ? (
        <p className="text-gray-500 text-sm">No assets or expenses for this month.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  {['Type', 'Name', 'Original', 'BRL', 'Date', ''].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assets.map(a => (
                  <tr key={a.id} className="hover:bg-gray-800/50">
                    <td className="table-td">
                      <span className={`badge ${TYPE_COLORS[a.type] || 'bg-gray-700 text-gray-300'}`}>{a.type}</span>
                    </td>
                    <td className="table-td text-gray-200">{a.name}</td>
                    <td className="table-td font-mono text-right text-gray-300">
                      {a.orig_currency !== 'BRL'
                        ? `${a.orig_currency} ${a.orig_amount.toFixed(2)}`
                        : fmt(a.orig_amount)}
                    </td>
                    <td className="table-td font-mono text-right text-yellow-300">{fmt(a.amount)}</td>
                    <td className="table-td text-gray-400 whitespace-nowrap">{a.created_at.slice(0, 10)}</td>
                    <td className="table-td">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(a)} className="text-blue-400 hover:text-blue-300 p-1" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {a.orig_currency !== 'BRL' && (
                          <button onClick={() => handleRefreshRate(a)} className="text-orange-400 hover:text-orange-300 p-1" title={`Refresh ${a.orig_currency}→BRL`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        )}
                        <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-300 p-1" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-700">
                  <td colSpan={3} className="table-td font-semibold text-gray-300">Total deductions</td>
                  <td className="table-td font-mono text-right font-bold text-yellow-300">{fmt(total)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editId && editAsset && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm border border-gray-700 shadow-2xl">
            <h3 className="text-base font-semibold mb-4">Edit {editAsset.name}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Name</label>
                <input className="w-full" value={editData.name}
                  onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Amount ({editAsset.orig_currency})
                </label>
                <input className="w-full" value={editData.orig_amount}
                  onChange={e => setEditData(d => ({ ...d, orig_amount: e.target.value }))} />
              </div>
              {editAsset.orig_currency !== 'BRL' && (
                <p className="text-xs text-gray-400">
                  ≈ {fmt(parseFloat(editData.orig_amount) * editData.rate_used || 0)} BRL
                  (rate: {editData.rate_used})
                </p>
              )}
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setEditId(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleSaveEdit} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
