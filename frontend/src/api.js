const BASE = '/api'

function getToken() {
  return localStorage.getItem('finance_token')
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }
}

async function req(method, path, body) {
  const opts = { method, headers: authHeaders() }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res = await fetch(BASE + path, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || 'Request failed')
  }
  return res
}

async function json(method, path, body) {
  return (await req(method, path, body)).json()
}

export const api = {
  // Auth
  register: (username, password) => json('POST', '/auth/register', { username, password }),
  login: (username, password) => json('POST', '/auth/login', { username, password }),

  // Calculations
  calculate: (data) => json('POST', '/calculations', data),
  getCalculations: () => json('GET', '/calculations'),
  deleteCalculation: (id) => json('DELETE', `/calculations/${id}`),
  editCalculation: (id, data) => json('PUT', `/calculations/${id}`, data),

  // Assets
  addAsset: (data) => json('POST', '/assets', data),
  getAssets: () => json('GET', '/assets'),
  deleteAsset: (id) => json('DELETE', `/assets/${id}`),
  editAsset: (id, data) => json('PUT', `/assets/${id}`, data),
  refreshAssetRate: (id) => json('POST', `/assets/${id}/refresh-rate`),

  // Rate
  getRate: (currency) => json('GET', `/rate/${currency}`),

  // Balance
  getBalance: () => json('GET', '/balance'),

  // Months
  getMonths: () => json('GET', '/months'),
  closeMonth: () => json('POST', '/months/close'),
  deleteMonth: (id) => json('DELETE', `/months/${id}`),

  // Export (returns a blob)
  exportExcel: async () => {
    const res = await req('GET', '/export')
    return res.blob()
  },
}
