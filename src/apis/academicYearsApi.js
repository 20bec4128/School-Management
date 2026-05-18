import { apiFetch } from './apiClient'

const BASE = '/api/academic-years'

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

export const fetchAcademicYears = async ({ headOfficeId, schoolId } = {}) => {
  const qs = new URLSearchParams()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') qs.set('headOfficeId', String(headOfficeId))
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  const url = qs.size ? `${BASE}?${qs.toString()}` : BASE

  const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const fetchAcademicYearsPage = async ({ headOfficeId, schoolId, page = 0, size = 10, search = '', running } = {}) => {
  const qs = new URLSearchParams()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') qs.set('headOfficeId', String(headOfficeId))
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  qs.set('page', String(Math.max(0, page)))
  qs.set('size', String(Math.max(1, size)))
  if (search != null && String(search).trim() !== '') qs.set('search', String(search).trim())
  if (running === true) qs.set('running', 'true')
  if (running === false) qs.set('running', 'false')

  const res = await apiFetch(`${BASE}/page?${qs.toString()}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createAcademicYear = async (payload) => {
  const res = await apiFetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateAcademicYear = async (id, payload) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteAcademicYear = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
