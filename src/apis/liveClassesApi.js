import { apiFetch } from './apiClient'

const LIVE_CLASSES_API_BASE = '/api/live-classes'

export const readApiError = async (res) => {
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

export const fetchLiveClasses = async () => {
  const res = await apiFetch(LIVE_CLASSES_API_BASE, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return unwrapCollection(await res.json())
}

export const fetchLiveClass = async (id) => {
  const res = await apiFetch(`${LIVE_CLASSES_API_BASE}/${id}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const fetchStudentLiveClasses = async ({ classId, sectionId }) => {
  const query = new URLSearchParams({ classId: String(classId), sectionId: String(sectionId) })
  const res = await apiFetch(`${LIVE_CLASSES_API_BASE}/student?${query.toString()}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return unwrapCollection(await res.json())
}

export const createLiveClass = async (payload) => {
  const res = await apiFetch(LIVE_CLASSES_API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateLiveClass = async (id, payload) => {
  const res = await apiFetch(`${LIVE_CLASSES_API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteLiveClass = async (id) => {
  const res = await apiFetch(`${LIVE_CLASSES_API_BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}

export const startLiveClass = async (id) => {
  const res = await apiFetch(`${LIVE_CLASSES_API_BASE}/${id}/start`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const joinLiveClass = async (id) => {
  const res = await apiFetch(`${LIVE_CLASSES_API_BASE}/${id}/join`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const leaveLiveClass = async (id) => {
  const res = await apiFetch(`${LIVE_CLASSES_API_BASE}/${id}/leave`, { method: 'POST' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}

export const endLiveClass = async (id) => {
  const res = await apiFetch(`${LIVE_CLASSES_API_BASE}/${id}/end`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}
