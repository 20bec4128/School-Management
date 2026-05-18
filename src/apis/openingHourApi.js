import { apiFetch } from './apiClient'

const BASE = '/api/opening-hours'

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

export const fetchOpeningHoursPage = async ({ schoolId, page = 0, size = 10 } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  qs.set('page', String(page))
  qs.set('size', String(size))
  const url = `${BASE}?${qs.toString()}`

  const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const fetchOpeningHourById = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createOpeningHour = async (payload) => {
  const res = await apiFetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateOpeningHour = async (id, payload) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const toggleOpeningHourStatus = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}/toggle-status`, {
    method: 'PATCH',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteOpeningHour = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
