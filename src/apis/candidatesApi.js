import { apiFetch } from './apiClient'

const CANDIDATES_API_BASE = '/api/candidates'

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

export const fetchCandidatesPage = async (page, size, filters = {}) => {
  const qs = new URLSearchParams({
    page: String(Math.max(page, 0)),
    size: String(Math.max(size, 1)),
  })

  if (filters.schoolId != null && String(filters.schoolId).trim() !== '') {
    qs.set('schoolId', String(filters.schoolId))
  }
  if (filters.headOfficeId != null && String(filters.headOfficeId).trim() !== '') {
    qs.set('headOfficeId', String(filters.headOfficeId))
  }
  if (filters.classId != null && String(filters.classId).trim() !== '') {
    qs.set('classId', String(filters.classId))
  }
  if (filters.sectionId != null && String(filters.sectionId).trim() !== '') {
    qs.set('sectionId', String(filters.sectionId))
  }
  if (filters.academicYear != null && String(filters.academicYear).trim() !== '') {
    qs.set('academicYear', String(filters.academicYear).trim())
  }
  if (filters.search != null && String(filters.search).trim() !== '') {
    qs.set('search', String(filters.search).trim())
  }

  const res = await apiFetch(`${CANDIDATES_API_BASE}?${qs.toString()}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createCandidate = async (payload) => {
  const res = await apiFetch(CANDIDATES_API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateCandidate = async (id, payload) => {
  const res = await apiFetch(`${CANDIDATES_API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteCandidate = async (id) => {
  const res = await apiFetch(`${CANDIDATES_API_BASE}/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
