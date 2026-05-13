import { apiFetch, apiUrl } from './apiClient'

const AUTH_BASE = '/api/auth'

const readApiError = async (res) => {
  try {
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await res.json()
      if (data?.message) return String(data.message)
      return `Request failed (${res.status})`
    }
    const text = await res.text()
    return text || `Request failed (${res.status})`
  } catch {
    return `Request failed (${res.status})`
  }
}

export const login = async (username, password) => {
  const res = await fetch(apiUrl(`${AUTH_BASE}/login`), {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const me = async () => {
  const res = await apiFetch(`${AUTH_BASE}/me`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const logout = async () => {
  const res = await apiFetch(`${AUTH_BASE}/logout`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}
