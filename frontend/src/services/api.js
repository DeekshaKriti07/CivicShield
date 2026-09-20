import { getToken } from '../auth/auth'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const token = getToken()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail || `Request failed (${response.status})`)
  }

  return data
}

export const api = {
  health: () => request('/health'),

  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  incidents: () => request('/incidents'),

  summary: () => request('/dashboard/summary'),

  incident: (id) => request(`/incident/${id}`),

  timeline: (id) => request(`/incident/${id}/timeline`),

  facilities: (id) => request(`/incident/${id}/facilities`),

  createIncident: (payload) =>
    request('/incident', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  workflow: (id) =>
    request(`/incident/${id}/workflow`, {
      method: 'POST',
    }),

  approve: (id) =>
    request(`/incident/${id}/approve`, {
      method: 'POST',
    }),

  dispatch: (id) =>
    request(`/incident/${id}/dispatch`, {
      method: 'POST',
    }),
}
