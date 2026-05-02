import { apiFetch } from './apiClient'

const CLASS_ROUTINES_API_BASE = '/api/class-routines'

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

export const fetchClassRoutines = async ({ schoolId } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && schoolId !== '') qs.set('schoolId', String(schoolId))
  const url = qs.toString() ? `${CLASS_ROUTINES_API_BASE}?${qs.toString()}` : CLASS_ROUTINES_API_BASE
  const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return unwrapCollection(await res.json())
}

export const createClassRoutine = async (payload) => {
  const res = await apiFetch(CLASS_ROUTINES_API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateClassRoutine = async (id, payload) => {
  const res = await apiFetch(`${CLASS_ROUTINES_API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteClassRoutine = async (id, { schoolId } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && schoolId !== '') qs.set('schoolId', String(schoolId))
  const url = qs.toString()
    ? `${CLASS_ROUTINES_API_BASE}/${id}?${qs.toString()}`
    : `${CLASS_ROUTINES_API_BASE}/${id}`
  const res = await apiFetch(url, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
