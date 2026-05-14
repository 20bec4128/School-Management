import { apiFetch } from './apiClient'

const CLASSES_API_BASE = '/api/classes'

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

export const fetchClasses = async ({ schoolId } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && schoolId !== '') qs.set('schoolId', String(schoolId))
  const url = qs.toString() ? `${CLASSES_API_BASE}?${qs.toString()}` : CLASSES_API_BASE

  const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : Array.isArray(data?.value) ? data.value : []
}

export const fetchClassesPage = async (page = 0, size = 10, filters = {}) => {
  const qs = new URLSearchParams({
    page: String(Math.max(page, 0)),
    size: String(size),
  })

  if (filters.schoolId != null && String(filters.schoolId).trim() !== '') {
    qs.set('schoolId', String(filters.schoolId))
  }

  if (filters.search != null && String(filters.search).trim() !== '') {
    qs.set('search', String(filters.search).trim())
  }

  const res = await apiFetch(`${CLASSES_API_BASE}/page?${qs.toString()}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createClass = async (payload) => {
  const res = await apiFetch(CLASSES_API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateClass = async (id, payload) => {
  const res = await apiFetch(`${CLASSES_API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteClass = async (id) => {
  const res = await apiFetch(`${CLASSES_API_BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
