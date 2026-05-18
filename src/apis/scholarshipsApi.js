import { apiFetch } from './apiClient'

const BASE = '/api/scholarships'

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

export const fetchScholarshipsPage = async (page, size, filters = {}) => {
  const qs = new URLSearchParams({
    page: String(Math.max(0, page)),
    size: String(Math.max(1, size)),
  })

  if (filters.headOfficeId != null && String(filters.headOfficeId).trim() !== '') qs.set('headOfficeId', String(filters.headOfficeId))
  if (filters.schoolId != null && String(filters.schoolId).trim() !== '') qs.set('schoolId', String(filters.schoolId))
  if (filters.classId != null && String(filters.classId).trim() !== '') qs.set('classId', String(filters.classId))
  if (filters.sectionId != null && String(filters.sectionId).trim() !== '') qs.set('sectionId', String(filters.sectionId))
  if (filters.search != null && String(filters.search).trim() !== '') qs.set('search', String(filters.search).trim())

  const res = await apiFetch(`${BASE}?${qs.toString()}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createScholarship = async (payload) => {
  const res = await apiFetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateScholarship = async (id, payload) => {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteScholarship = async (id) => {
  const res = await apiFetch(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}

