import { apiFetch } from './apiClient'

const TEACHERS_API_BASE = '/api/teachers'

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

const buildUpsertFormData = (payload, form) => {
  const fd = new FormData()
  fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  if (form?.photo instanceof File) fd.append('photo', form.photo)
  if (form?.resume instanceof File) fd.append('resume', form.resume)
  return fd
}

export const fetchTeachers = async () => {
  const res = await apiFetch(TEACHERS_API_BASE, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : Array.isArray(data?.value) ? data.value : []
}

export const createTeacher = async (payload, form) => {
  const res = await apiFetch(TEACHERS_API_BASE, {
    method: 'POST',
    body: buildUpsertFormData(payload, form),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateTeacher = async (teacherId, payload, form) => {
  const res = await apiFetch(`${TEACHERS_API_BASE}/${teacherId}`, {
    method: 'PUT',
    body: buildUpsertFormData(payload, form),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteTeacher = async (teacherId) => {
  const res = await apiFetch(`${TEACHERS_API_BASE}/${teacherId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
