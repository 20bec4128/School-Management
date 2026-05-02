import { apiFetch } from './apiClient'

const BASE = '/api/lesson-plan-entries'

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

export const fetchLessonPlanEntries = async ({ schoolId, academicYear, classId, subjectId, lessonId, topicId } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && schoolId !== '' && schoolId !== 'Select') qs.set('schoolId', String(schoolId))
  if (academicYear != null && academicYear !== '' && academicYear !== 'Select') qs.set('academicYear', String(academicYear))
  if (classId != null && classId !== '' && classId !== 'Select') qs.set('classId', String(classId))
  if (subjectId != null && subjectId !== '' && subjectId !== 'Select') qs.set('subjectId', String(subjectId))
  if (lessonId != null && lessonId !== '' && lessonId !== 'Select') qs.set('lessonId', String(lessonId))
  if (topicId != null && topicId !== '' && topicId !== 'Select') qs.set('topicId', String(topicId))
  const url = qs.toString() ? `${BASE}?${qs.toString()}` : BASE

  const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export const createLessonPlanEntry = async (payload) => {
  const res = await apiFetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateLessonPlanEntry = async (id, payload) => {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteLessonPlanEntry = async (id) => {
  const res = await apiFetch(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}

