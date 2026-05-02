import { apiFetch } from './apiClient'

const BASE = '/api/lesson-timeline'

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

export const fetchLessonTimelines = async ({ schoolId, academicYear, classId, subjectId } = {}) => {
  const qs = new URLSearchParams()
  qs.set('schoolId', String(schoolId))
  qs.set('academicYear', String(academicYear))
  qs.set('classId', String(classId))
  qs.set('subjectId', String(subjectId))
  const res = await apiFetch(`${BASE}/lessons?${qs.toString()}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const fetchTopicTimelinesForLesson = async ({ lessonId, schoolId, academicYear, classId, subjectId } = {}) => {
  const qs = new URLSearchParams()
  qs.set('schoolId', String(schoolId))
  qs.set('academicYear', String(academicYear))
  qs.set('classId', String(classId))
  qs.set('subjectId', String(subjectId))
  const res = await apiFetch(`${BASE}/lessons/${encodeURIComponent(String(lessonId))}/topics?${qs.toString()}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateLessonTimeline = async ({ lessonId, startDate, endDate }) => {
  const res = await apiFetch(`${BASE}/lessons/${encodeURIComponent(String(lessonId))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ startDate: startDate || null, endDate: endDate || null }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateTopicTimeline = async ({ topicId, startDate, endDate }) => {
  const res = await apiFetch(`${BASE}/topics/${encodeURIComponent(String(topicId))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ startDate: startDate || null, endDate: endDate || null }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const fetchLessonPlanView = async ({ schoolId, academicYear, classId, subjectId } = {}) => {
  const qs = new URLSearchParams()
  qs.set('schoolId', String(schoolId))
  qs.set('academicYear', String(academicYear))
  qs.set('classId', String(classId))
  qs.set('subjectId', String(subjectId))
  const res = await apiFetch(`${BASE}/plan-view?${qs.toString()}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

