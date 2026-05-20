import { apiFetch } from './apiClient'

const BASE = '/api/attendances'

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

export const fetchAttendances = async ({
  headOfficeId,
  schoolId,
  examTerm,
  className,
  sectionName,
  subjectName,
  search = '',
} = {}) => {
  const qs = new URLSearchParams()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') qs.set('headOfficeId', String(headOfficeId))
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  if (examTerm != null && String(examTerm).trim() !== '') qs.set('examTerm', String(examTerm))
  if (className != null && String(className).trim() !== '') qs.set('className', String(className))
  if (sectionName != null && String(sectionName).trim() !== '') qs.set('sectionName', String(sectionName))
  if (subjectName != null && String(subjectName).trim() !== '') qs.set('subjectName', String(subjectName))
  if (search != null && String(search).trim() !== '') qs.set('search', String(search).trim())

  const url = qs.size ? `${BASE}?${qs.toString()}` : BASE
  const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export const fetchAttendancesPage = async ({
  headOfficeId,
  schoolId,
  examTerm,
  className,
  sectionName,
  subjectName,
  search = '',
  page = 0,
  size = 10,
} = {}) => {
  const qs = new URLSearchParams({
    page: String(Math.max(0, page)),
    size: String(Math.max(1, size)),
  })
  if (headOfficeId != null && String(headOfficeId).trim() !== '') qs.set('headOfficeId', String(headOfficeId))
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  if (examTerm != null && String(examTerm).trim() !== '') qs.set('examTerm', String(examTerm))
  if (className != null && String(className).trim() !== '') qs.set('className', String(className))
  if (sectionName != null && String(sectionName).trim() !== '') qs.set('sectionName', String(sectionName))
  if (subjectName != null && String(subjectName).trim() !== '') qs.set('subjectName', String(subjectName))
  if (search != null && String(search).trim() !== '') qs.set('search', String(search).trim())

  const res = await apiFetch(`${BASE}/page?${qs.toString()}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createAttendance = async (payload) => {
  const res = await apiFetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateAttendance = async (id, payload) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteAttendance = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
