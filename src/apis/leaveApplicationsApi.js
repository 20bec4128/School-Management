import { apiFetch } from './apiClient'

const BASE = '/api/leave-applications'

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

const buildMultipartFormData = (payload, attachment) => {
  const fd = new FormData()
  fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  if (attachment instanceof File) fd.append('attachment', attachment)
  return fd
}

export const fetchLeaveApplications = async ({ schoolId, status } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  if (status != null && String(status).trim() !== '' && String(status).trim().toUpperCase() !== 'ALL') {
    qs.set('status', String(status))
  }
  const url = qs.size ? `${BASE}?${qs.toString()}` : BASE
  const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export const fetchLeaveApplication = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createLeaveApplication = async (payload, attachment) => {
  const res = await apiFetch(BASE, {
    method: 'POST',
    body: buildMultipartFormData(payload, attachment),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateLeaveApplication = async (id, payload, attachment) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: buildMultipartFormData(payload, attachment),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateLeaveApplicationStatus = async (id, status) => {
  const qs = new URLSearchParams()
  qs.set('status', String(status))
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}/status?${qs.toString()}`, {
    method: 'PATCH',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteLeaveApplication = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, { method: 'DELETE', headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
