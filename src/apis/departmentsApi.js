import { apiFetch } from './apiClient'

const DEPARTMENTS_API_BASE = '/api/departments'

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

export const fetchAllDepartments = async (schoolId) => {
  const query = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') query.append('schoolId', String(schoolId))
  const url = query.toString() ? `${DEPARTMENTS_API_BASE}/all?${query.toString()}` : `${DEPARTMENTS_API_BASE}/all`
  const res = await apiFetch(url, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const fetchDepartmentsPage = async (page, size, schoolId) => {
  const query = new URLSearchParams({
    page: String(Math.max(page, 0)),
    size: String(size),
  })
  if (schoolId != null && String(schoolId).trim() !== '') query.append('schoolId', String(schoolId))
  const res = await apiFetch(`${DEPARTMENTS_API_BASE}?${query.toString()}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createDepartment = async (payload) => {
  const res = await apiFetch(DEPARTMENTS_API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateDepartment = async (departmentId, payload) => {
  const res = await apiFetch(`${DEPARTMENTS_API_BASE}/${departmentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteDepartment = async (departmentId) => {
  const res = await apiFetch(`${DEPARTMENTS_API_BASE}/${departmentId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
