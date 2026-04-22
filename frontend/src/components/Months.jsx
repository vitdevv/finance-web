import { useState } from 'react'
import { api } from '../api'

const fmt = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

export default function Months({ months, onRefresh, notify }) {
  const [closing, setClosing] = useState(false)

  async function handleCloseMonth() {
    if (!confirm('Close and archive the current month? This will lock all open assets and calculations.')) return
    setClosing(true)
    try {
      const data = await api.closeMonth()
      onRefresh()
      notify(data.message)
    } catch (err) {
      notify(err.message, true)
    } finally {
      setClosing(false)
    }
  }

  async function handleDelete(id, label) {
    if (!confirm(`Delete archived month "${label}"? This will reopen its assets.`)) return
    try {
      await api.deleteMonth(id)
      onRefresh()
      notify(`${label} removed from archive.`)
    } catch (err) {
      notify(err.message, true)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title mb-0">Month Management</h2>
        <button onClick={handleCloseMonth} className="btn-warning flex items-center gap-2" disabled={closing}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8M10 12v4m4-4v4" />
          </svg>
          {closing ? 'Closing…' : 'Close Month & Archive'}
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Closing the month locks all current calculations and assets, resetting the dashboard for the next month.
      </p>

      <h3 className="text-sm font-semibold text-gray-300 mb-2">Archived Months</h3>

      {months.length === 0 ? (
        <p className="text-gray-500 text-sm">No archived months yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px]">
            <thead>
              <tr>
                {['Month', 'Closed At', 'Net Profit', 'Deductions', 'Balance', ''].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map(m => (
                <tr key={m.id} className="hover:bg-gray-800/50">
                  <td className="table-td font-medium text-gray-200">{m.label}</td>
                  <td className="table-td text-gray-400 whitespace-nowrap">{m.closed_at.slice(0, 16)}</td>
                  <td className="table-td font-mono text-right text-blue-300">{fmt(m.net_profit)}</td>
                  <td className="table-td font-mono text-right text-yellow-300">{fmt(m.total_deductions)}</td>
                  <td className={`table-td font-mono text-right font-semibold ${m.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {fmt(m.balance)}
                  </td>
                  <td className="table-td">
                    <button onClick={() => handleDelete(m.id, m.label)} className="text-red-400 hover:text-red-300 p-1" title="Delete archive">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
