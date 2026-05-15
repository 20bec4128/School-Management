import { apiFetch } from './apiClient'

const BASE = '/api/categories'

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

export const fetchCategoriesPage = async ({ headOfficeId, schoolId, search = '', page = 0, size = 10 } = {}) => {
  const qs = new URLSearchParams({
    page: String(Math.max(0, page)),
    size: String(Math.max(1, size)),
  })
  if (headOfficeId != null && String(headOfficeId).trim() !== '') qs.set('headOfficeId', String(headOfficeId))
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  if (search && String(search).trim() !== '') qs.set('search', String(search).trim())
  const res = await apiFetch(`${BASE}?${qs.toString()}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const fetchCategoryById = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createCategory = async (payload) => {
  const res = await apiFetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateCategory = async (id, payload) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteCategory = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  if (res.status === 204) return null
  return res.text()
}
