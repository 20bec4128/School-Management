import { apiFetch } from './apiClient'

const BASE = '/api/leave-types'

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

export const fetchLeaveTypes = async ({ schoolId, role, designationId } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  if (role != null && String(role).trim() !== '') qs.set('role', String(role))
  if (designationId != null && String(designationId).trim() !== '') qs.set('designationId', String(designationId))
  const url = qs.size ? `${BASE}?${qs.toString()}` : BASE

  const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createLeaveType = async (payload) => {
  const res = await apiFetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateLeaveType = async (id, payload) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteLeaveType = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
