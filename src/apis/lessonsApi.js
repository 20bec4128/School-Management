import { apiFetch } from './apiClient'

const LESSONS_API_BASE = '/api/lessons'

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

export const fetchLessons = async ({ schoolId, academicYear, classId, subjectId } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && schoolId !== '' && schoolId !== 'Select') qs.set('schoolId', String(schoolId))
  if (academicYear != null && academicYear !== '' && academicYear !== 'Select') qs.set('academicYear', String(academicYear))
  if (classId != null && classId !== '' && classId !== 'Select') qs.set('classId', String(classId))
  if (subjectId != null && subjectId !== '' && subjectId !== 'Select') qs.set('subjectId', String(subjectId))
  const url = qs.toString() ? `${LESSONS_API_BASE}?${qs.toString()}` : LESSONS_API_BASE

  const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export const createLesson = async (payload) => {
  const res = await apiFetch(LESSONS_API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateLesson = async (id, payload) => {
  const res = await apiFetch(`${LESSONS_API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteLesson = async (id) => {
  const res = await apiFetch(`${LESSONS_API_BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}

