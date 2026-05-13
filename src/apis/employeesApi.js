import { apiFetch } from './apiClient'

const BASE = '/api/employees'

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

const buildMultipartFormData = (payload, files = {}) => {
  const fd = new FormData()
  fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  if (files?.photo instanceof File) fd.append('photo', files.photo)
  if (files?.resume instanceof File) fd.append('resume', files.resume)
  return fd
}

export const fetchEmployees = async ({ schoolId } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  const url = qs.toString() ? `${BASE}?${qs.toString()}` : BASE
  const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export const createEmployee = async (payload, { photo, resume } = {}) => {
  const res = await apiFetch(BASE, {
    method: 'POST',
    body: buildMultipartFormData(payload, { photo, resume }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateEmployee = async (id, payload, { photo, resume } = {}) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: buildMultipartFormData(payload, { photo, resume }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteEmployee = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
