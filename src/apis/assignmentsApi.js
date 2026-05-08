import { apiFetch } from './apiClient'

const ASSIGNMENTS_API_BASE = '/api/assignments'

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

const appendScalar = (fd, key, value) => {
  if (value === undefined || value === null) return
  if (typeof value === 'string' && value.trim() === '') return
  fd.append(key, String(value))
}

const buildUpsertFormData = (payload, file) => {
  const fd = new FormData()
  appendScalar(fd, 'schoolId', payload?.schoolId)
  appendScalar(fd, 'classId', payload?.classId)
  appendScalar(fd, 'sectionId', payload?.sectionId)
  appendScalar(fd, 'subjectId', payload?.subjectId)
  appendScalar(fd, 'title', payload?.title)
  appendScalar(fd, 'assignmentDate', payload?.assignmentDate)
  appendScalar(fd, 'submissionDate', payload?.submissionDate)
  appendScalar(fd, 'smsNotification', payload?.smsNotification)
  appendScalar(fd, 'emailNotification', payload?.emailNotification)
  appendScalar(fd, 'note', payload?.note)
  appendScalar(fd, 'status', payload?.status)

  if (file instanceof File) fd.append('file', file)
  return fd
}

export const fetchAssignments = async () => {
  const res = await apiFetch(ASSIGNMENTS_API_BASE, { headers: { Accept: 'application/json' } })
  if (res.status === 403) return []
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : Array.isArray(data?.value) ? data.value : []
}

export const fetchAssignmentsForStudent = async (studentId) => {
  const res = await apiFetch(`${ASSIGNMENTS_API_BASE}/student/${encodeURIComponent(String(studentId))}`, {
    headers: { Accept: 'application/json' },
  })
  if (res.status === 403) return []
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : Array.isArray(data?.value) ? data.value : []
}

export const createAssignment = async (payload, file) => {
  const res = await apiFetch(ASSIGNMENTS_API_BASE, {
    method: 'POST',
    body: buildUpsertFormData(payload, file),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateAssignment = async (id, payload, file) => {
  const res = await apiFetch(`${ASSIGNMENTS_API_BASE}/${id}`, {
    method: 'PUT',
    body: buildUpsertFormData(payload, file),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteAssignment = async (id) => {
  const res = await apiFetch(`${ASSIGNMENTS_API_BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
