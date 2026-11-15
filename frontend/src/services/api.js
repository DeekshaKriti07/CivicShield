const API_BASE = '/api'

export async function request(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 40_000)
  try {
    const isFormData = options.body instanceof FormData
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: options.signal || controller.signal,
      credentials: 'same-origin',
      headers: {
        ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
        'X-CSRF-Protection': '1',
        ...options.headers,
      },
    })
    const data =
      response.status === 204 ? null : await response.json().catch(() => null)
    if (!response.ok) {
      const detail = data?.detail
      const message = Array.isArray(detail)
        ? detail
            .map(
              (item) =>
                `${item.loc?.slice(1).join(' ') || 'Input'}: ${item.msg}`,
            )
            .join('; ')
        : typeof detail === 'string'
          ? detail
          : `Request failed (${response.status}). Please try again.`
      const error = Object.assign(new Error(message), {
        status: response.status,
      })
      if (
        response.status === 401 &&
        !['/auth/login', '/auth/me'].includes(path)
      ) {
        window.dispatchEvent(new Event('session-expired'))
      }
      throw error
    }
    if (
      response.status !== 204 &&
      !response.headers.get('content-type')?.includes('application/json')
    )
      throw new Error('The server returned an unreadable response.')
    return data
  } catch (error) {
    if (error.name === 'AbortError')
      throw new Error(
        'The request timed out. Refresh to check whether the action was saved.',
      )
    if (error instanceof TypeError)
      throw new Error(
        'Unable to reach CivicShield. Check your connection and try again.',
      )
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

const post = (path, payload) =>
  request(path, {
    method: 'POST',
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  })
export const api = {
  me: () => request('/auth/me'),
  login: (username, password) => post('/auth/login', { username, password }),
  register: (username, password) =>
    post('/auth/register', { username, password }),
  logout: () => post('/auth/logout'),
  incidents: (offset = 0) => request(`/incidents?limit=100&offset=${offset}`),
  incident: (id) => request(`/incident/${id}`),
  evidence: (id) => request(`/incident/${id}/evidence`),
  evidenceImageUrl: (incidentId, evidenceId) =>
    `${API_BASE}/incident/${incidentId}/evidence/${evidenceId}/image`,
  timeline: (id) => request(`/incident/${id}/timeline`),
  analysis: (id) => request(`/incident/${id}/analysis`),
  createIncident: (payload) => post('/incident', payload),
  createIncidentWithEvidence: (payload, evidence) => {
    const form = new FormData()
    form.append('description', payload.description)
    form.append('latitude', String(payload.latitude))
    form.append('longitude', String(payload.longitude))
    form.append('evidence', evidence)
    return request('/incident-with-evidence', { method: 'POST', body: form })
  },
  workflow: (id) => post(`/incident/${id}/workflow`),
  approve: (id) => post(`/incident/${id}/approve`),
  assign: (id) => post(`/incident/${id}/assign`),
  resolve: (id, note) => post(`/incident/${id}/resolve`, { note }),
}
