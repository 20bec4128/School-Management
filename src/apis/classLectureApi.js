import { apiFetch } from './apiClient'

const CLASS_LECTURES_API_BASE = '/api/class-lectures'

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

export const fetchClassLectures = async () => {
  const res = await apiFetch(CLASS_LECTURES_API_BASE, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return unwrapCollection(data)
}

export const createClassLecture = async (payload) => {
  const res = await apiFetch(CLASS_LECTURES_API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateClassLecture = async (id, payload) => {
  const res = await apiFetch(`${CLASS_LECTURES_API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteClassLecture = async (id) => {
  const res = await apiFetch(`${CLASS_LECTURES_API_BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
