import { apiFetch } from './apiClient'

const SYLLABUSES_API_BASE = '/api/syllabuses'

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

const buildUpsertFormData = (payload, file) => {
  const fd = new FormData()
  fd.append('schoolId', String(payload.schoolId))
  fd.append('classId', String(payload.classId))
  fd.append('subjectId', String(payload.subjectId))
  fd.append('title', payload.title || '')
  fd.append('sessionYear', payload.sessionYear || '')
  fd.append('note', payload.note || '')
  if (file instanceof File) fd.append('file', file)
  return fd
}

export const fetchSyllabuses = async ({ schoolId, classId } = {}) => {
  const query = new URLSearchParams()
  if (schoolId != null && schoolId !== '') query.set('schoolId', String(schoolId))
  if (classId != null && classId !== '') query.set('classId', String(classId))
  const url = query.toString() ? `${SYLLABUSES_API_BASE}?${query.toString()}` : SYLLABUSES_API_BASE
  const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createSyllabus = async (payload, file) => {
  const res = await apiFetch(SYLLABUSES_API_BASE, {
    method: 'POST',
    body: buildUpsertFormData(payload, file),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateSyllabus = async (id, payload, file) => {
  const res = await apiFetch(`${SYLLABUSES_API_BASE}/${id}`, {
    method: 'PUT',
    body: buildUpsertFormData(payload, file),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteSyllabus = async (id) => {
  const res = await apiFetch(`${SYLLABUSES_API_BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
