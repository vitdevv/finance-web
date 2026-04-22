import { useState } from 'react'
import { api } from '../api'
import { useLang } from '../LangContext'

const fmt = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

export default function History({ calculations, onRefresh, notify }) {
  const { t } = useLang()
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})

  function openEdit(calc) {
    setEditId(calc.id)
    setEditData({
      usd_received: calc.usd_received,
      usd_rate: calc.usd_rate,
      brl_extra: calc.brl_extra,
      date: calc.created_at.slice(0, 10),
    })
  }

  async function handleDelete(id) {
    if (!confirm(t('deleteCalcConfirm'))) return
    try {
      await api.deleteCalculation(id)
      onRefresh()
      notify(t('calcDeleted'))
    } catch (err) {
      notify(err.message, true)
    }
  }

  async function handleSaveEdit() {
    try {
      await api.editCalculation(editId, {
        usd_received: parseFloat(editData.usd_received) || 0,
        usd_rate: parseFloat(editData.usd_rate) || 0,
        brl_extra: parseFloat(editData.brl_extra) || 0,
        date: editData.date,
      })
      setEditId(null)
      onRefresh()
      notify(t('calcUpdated'))
    } catch (err) {
      notify(err.message, true)
    }
  }

  const editCalc = calculations.find(c => c.id === editId)

  return (
    <div className="card">
      <h2 className="section-title">{t('calcHistory')}</h2>

      {calculations.length === 0 ? (
        <p className="text-gray-500 text-sm">{t('noCalcs')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                {[t('date'), t('regime'), t('revenue'), 'DAS', 'INSS', 'IRPF', t('netProfit'), ''].map((h, i) => (
                  <th key={i} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calculations.map(c => (
                <tr key={c.id} className="hover:bg-gray-800/50">
                  <td className="table-td text-gray-400 whitespace-nowrap">{c.created_at.slice(0, 16)}</td>
                  <td className="table-td">
                    <span className="badge bg-blue-900/50 text-blue-300">{c.regime}</span>
                  </td>
                  <td className="table-td font-mono text-right">{fmt(c.revenue)}</td>
                  <td className="table-td font-mono text-right text-red-400">{fmt(c.das)}</td>
                  <td className="table-td font-mono text-right text-red-400">{fmt(c.inss)}</td>
                  <td className="table-td font-mono text-right text-red-400">{fmt(c.irpf)}</td>
                  <td className={`table-td font-mono text-right font-semibold ${c.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {fmt(c.net_profit)}
                  </td>
                  <td className="table-td">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(c)} className="text-blue-400 hover:text-blue-300 p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-300 p-1">
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
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editId && editCalc && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm border border-gray-700 shadow-2xl">
            <h3 className="text-base font-semibold mb-4">{t('editCalcTitle')}</h3>
            <div className="space-y-3">
              <Field label={t('fieldIncome')} value={editData.usd_received}
                onChange={v => setEditData(d => ({ ...d, usd_received: v }))} />
              <Field label={t('fieldRate')} value={editData.usd_rate}
                onChange={v => setEditData(d => ({ ...d, usd_rate: v }))} />
              <Field label={t('fieldBonus')} value={editData.brl_extra}
                onChange={v => setEditData(d => ({ ...d, brl_extra: v }))} />
              <Field label={t('fieldDate')} value={editData.date}
                onChange={v => setEditData(d => ({ ...d, date: v }))} />
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setEditId(null)} className="btn-secondary">{t('cancel')}</button>
              <button onClick={handleSaveEdit} className="btn-primary">{t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-gray-400 block mb-1">{label}</label>
      <input className="w-full" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
