import { apiFetch } from './apiClient'

const SECTIONS_API_BASE = '/api/sections'

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

const unwrapCollection = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.value) ? data.value : []

export const fetchSections = async ({ headOfficeId, schoolId, classId } = {}) => {
  const qs = new URLSearchParams()
  if (headOfficeId != null && headOfficeId !== '') qs.set('headOfficeId', String(headOfficeId))
  if (schoolId != null && schoolId !== '') qs.set('schoolId', String(schoolId))
  if (classId != null && classId !== '') qs.set('classId', String(classId))
  const url = qs.toString() ? `${SECTIONS_API_BASE}?${qs.toString()}` : SECTIONS_API_BASE

  const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return unwrapCollection(data)
}

export const createSection = async (payload) => {
  const res = await apiFetch(SECTIONS_API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateSection = async (id, payload) => {
  const res = await apiFetch(`${SECTIONS_API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteSection = async (id) => {
  const res = await apiFetch(`${SECTIONS_API_BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
