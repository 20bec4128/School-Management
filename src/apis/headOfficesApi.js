import { apiFetch } from './apiClient'

const BASE = '/api/head-offices'

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

export const fetchHeadOfficesPage = async (page = 0, size = 20) => {
  const qs = new URLSearchParams({ page: String(Math.max(0, page)), size: String(Math.max(1, size)) })
  const res = await apiFetch(`${BASE}?${qs.toString()}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createHeadOfficeWithAdmin = async ({ headOffice, admin }) => {
  const res = await apiFetch(`${BASE}/create-with-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ headOffice, admin }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deactivateHeadOffice = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}/deactivate`, {
    method: 'PATCH',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const activateHeadOffice = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}/activate`, {
    method: 'PATCH',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateHeadOffice = async (id, { name, status }) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ name, status }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const fetchHeadOfficeAdmin = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}/admin`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateHeadOfficeAdmin = async (id, { username, password }) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}/admin`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteHeadOffice = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  // 204 returns empty body
  if (res.status === 204) return null
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return null
  return res.json()
}
export const fetchHeadOfficesLookup = async () => {
  const page = await fetchHeadOfficesPage(0, 500)
  const content = Array.isArray(page?.content) ? page.content : []
  return content.map(ho => ({ id: ho.id, name: ho.name })).sort((a, b) => a.name.localeCompare(b.name))
}
