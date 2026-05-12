import { apiFetch } from './apiClient'

const BASE = '/api/lesson-status'

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

export const fetchLessonStatusPageData = async ({ schoolId, classId, subjectId, academicYear } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && schoolId !== '' && schoolId !== 'Select') qs.set('schoolId', String(schoolId))
  if (classId != null && classId !== '' && classId !== 'Select') qs.set('classId', String(classId))
  if (subjectId != null && subjectId !== '' && subjectId !== 'Select') qs.set('subjectId', String(subjectId))
  if (academicYear != null && academicYear !== '' && academicYear !== 'Select') qs.set('academicYear', String(academicYear))

  const res = await apiFetch(`${BASE}/page-data?${qs.toString()}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateTopicStatus = async ({ topicId, status }) => {
  const res = await apiFetch(`${BASE}/update-topic`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ topicId, status }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateLessonStatus = async ({ lessonId, status }) => {
  const res = await apiFetch(`${BASE}/update-lesson`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ lessonId, status }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}
