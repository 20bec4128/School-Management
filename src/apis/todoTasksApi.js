import { apiFetch } from './apiClient'

const BASE = '/api/todo-tasks'

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

export const fetchTodoTasksPage = async ({
  headOfficeId,
  schoolId,
  userType,
  workStatus,
  search = '',
  page = 0,
  size = 10,
} = {}) => {
  const qs = new URLSearchParams({
    page: String(page),
    size: String(size),
  })
  if (headOfficeId != null && String(headOfficeId).trim() !== '') qs.set('headOfficeId', String(headOfficeId))
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  if (userType && userType !== 'Select') qs.set('userType', String(userType))
  if (workStatus && workStatus !== 'Select') qs.set('workStatus', String(workStatus))
  if (search) qs.set('search', search)

  const res = await apiFetch(`${BASE}/page?${qs.toString()}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const fetchTodoTasks = async ({ headOfficeId, schoolId } = {}) => {
  const qs = new URLSearchParams()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') qs.set('headOfficeId', String(headOfficeId))
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  const url = qs.toString() ? `${BASE}?${qs.toString()}` : BASE
  const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export const createTodoTask = async (payload) => {
  const res = await apiFetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateTodoTask = async (id, payload) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteTodoTask = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
