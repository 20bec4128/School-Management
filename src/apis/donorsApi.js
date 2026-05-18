import { apiFetch } from './apiClient'

const DONORS_API_BASE = '/api/donors'

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

export const fetchDonorsPage = async (page, size, filters = {}) => {
  const qs = new URLSearchParams({
    page: String(Math.max(page, 0)),
    size: String(Math.max(size, 1)),
  })

  if (filters.headOfficeId != null && String(filters.headOfficeId).trim() !== '') {
    qs.set('headOfficeId', String(filters.headOfficeId))
  }
  if (filters.schoolId != null && String(filters.schoolId).trim() !== '') {
    qs.set('schoolId', String(filters.schoolId))
  }
  if (filters.donorType != null && String(filters.donorType).trim() !== '') {
    qs.set('donorType', String(filters.donorType).trim())
  }
  if (filters.academicYear != null && String(filters.academicYear).trim() !== '') {
    qs.set('academicYear', String(filters.academicYear).trim())
  }
  if (filters.search != null && String(filters.search).trim() !== '') {
    qs.set('search', String(filters.search).trim())
  }

  const res = await apiFetch(`${DONORS_API_BASE}?${qs.toString()}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createDonor = async (payload) => {
  const res = await apiFetch(DONORS_API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateDonor = async (id, payload) => {
  const res = await apiFetch(`${DONORS_API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteDonor = async (id) => {
  const res = await apiFetch(`${DONORS_API_BASE}/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}

