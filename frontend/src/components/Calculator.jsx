import { useState } from 'react'
import { api } from '../api'

const fmt = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

const CURRENCIES = ['BRL', 'USD', 'AUD']

function CurrencyBox({ label, currency, setCurrency, amount, setAmount, rate, setRate, fetching, onGetRate }) {
  const isBRL = currency === 'BRL'

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-800/40 rounded-lg border border-gray-700 min-w-[220px]">
      <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{label}</span>

      <div className="flex gap-2">
        <select
          value={currency}
          onChange={e => { setCurrency(e.target.value); setRate('') }}
          className="w-20"
        >
          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          className="flex-1 min-w-0"
          placeholder="0.00"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
      </div>

      {!isBRL && (
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-500 shrink-0">{currency}→BRL</span>
          <input
            className="w-24"
            placeholder="rate"
            value={rate}
            onChange={e => setRate(e.target.value)}
          />
          <button
            type="button"
            onClick={onGetRate}
            className="btn-secondary text-xs whitespace-nowrap py-1.5 px-3"
            disabled={fetching}
          >
            {fetching ? '…' : 'Get Rate'}
          </button>
        </div>
      )}

      {!isBRL && amount && rate && (
        <p className="text-xs text-green-400">
          = {fmt((parseFloat(amount) || 0) * (parseFloat(rate) || 0))}
        </p>
      )}
    </div>
  )
}

export default function Calculator({ onSaved, notify }) {
  const [mode, setMode] = useState('PJ')
  const [prolabore, setProlabore] = useState('5500')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const [incomeCurrency, setIncomeCurrency] = useState('USD')
  const [income, setIncome] = useState('')
  const [incomeRate, setIncomeRate] = useState('')
  const [fetchingIncomeRate, setFetchingIncomeRate] = useState(false)

  const [bonusCurrency, setBonusCurrency] = useState('BRL')
  const [bonus, setBonus] = useState('')
  const [bonusRate, setBonusRate] = useState('')
  const [fetchingBonusRate, setFetchingBonusRate] = useState(false)

  async function fetchRate(currency, setRate, setFetching) {
    setFetching(true)
    try {
      const data = await api.getRate(currency)
      setRate(String(data.rate))
      notify(`${currency} → BRL: R$ ${data.rate} (câmbio comercial)`)
    } catch {
      notify('Could not fetch rate. Enter manually.', true)
    } finally {
      setFetching(false)
    }
  }

  async function handleCalculate(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const incRate = incomeCurrency === 'BRL' ? 1.0 : parseFloat(incomeRate) || 0
      const bonRate = bonusCurrency === 'BRL' ? 1.0 : parseFloat(bonusRate) || 0
      const bonusBRL = (parseFloat(bonus) || 0) * bonRate

      const data = await api.calculate({
        usd_received: parseFloat(income) || 0,
        usd_rate: incRate,
        brl_extra: bonusBRL,
        prolabore: parseFloat(prolabore) || 0,
        mode,
      })
      setResult({ ...data, incomeCurrency, bonusCurrency })
      onSaved()
      notify('Calculated and saved!')
    } catch (err) {
      notify(err.message, true)
    } finally {
      setLoading(false)
    }
  }

  const incomeEffectiveRate = incomeCurrency === 'BRL' ? 1 : parseFloat(incomeRate) || 0
  const bonusEffectiveRate  = bonusCurrency  === 'BRL' ? 1 : parseFloat(bonusRate)  || 0
  const incomeBRL = (parseFloat(income) || 0) * incomeEffectiveRate
  const bonusBRL  = (parseFloat(bonus)  || 0) * bonusEffectiveRate
  const totalBRL  = incomeBRL + bonusBRL

  return (
    <div className="card">
      <h2 className="section-title">Monthly Calculation</h2>

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
          <CurrencyBox
            label="Income"
            currency={incomeCurrency}
            setCurrency={setIncomeCurrency}
            amount={income}
            setAmount={setIncome}
            rate={incomeRate}
            setRate={setIncomeRate}
            fetching={fetchingIncomeRate}
            onGetRate={() => fetchRate(incomeCurrency, setIncomeRate, setFetchingIncomeRate)}
          />
          <CurrencyBox
            label="Bonus"
            currency={bonusCurrency}
            setCurrency={setBonusCurrency}
            amount={bonus}
            setAmount={setBonus}
            rate={bonusRate}
            setRate={setBonusRate}
            fetching={fetchingBonusRate}
            onGetRate={() => fetchRate(bonusCurrency, setBonusRate, setFetchingBonusRate)}
          />
          {mode === 'PJ' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Pro-Labore</label>
              <input className="w-36" placeholder="5500" value={prolabore} onChange={e => setProlabore(e.target.value)} />
            </div>
          )}
        </div>

        {totalBRL > 0 && (
          <p className="text-xs text-gray-400 mb-3">
            {incomeCurrency !== 'BRL' && incomeRate
              ? `${income} ${incomeCurrency} × ${incomeRate} = ${fmt(incomeBRL)}`
              : `Income: ${fmt(incomeBRL)}`}
            {bonusBRL > 0 && ` + Bonus: ${fmt(bonusBRL)}`}
            {` = ${fmt(totalBRL)} total`}
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

  const incomeLabel = result.incomeCurrency && result.incomeCurrency !== 'BRL'
    ? `${result.incomeCurrency} Income`
    : 'Income'
  const bonusAmt = result.receita_total - result.receita_usd

  const rows = mode === 'PF'
    ? [
        ['Income', incomeLabel, result.receita_usd],
        ...(bonusAmt > 0.001 ? [['Income', 'Bonus', bonusAmt]] : []),
        ['Result', 'PF Total Revenue', result.net_profit],
      ]
    : [
        ['Income', incomeLabel, result.receita_usd],
        ...(bonusAmt > 0.001 ? [['Income', 'Bonus', bonusAmt]] : []),
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
