import { apiFetch } from './apiClient'

const BASE = '/api/feedbacks'

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

export const fetchFeedbacksPage = async ({ schoolId, page = 0, size = 10, search = '' } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  qs.set('page', String(page))
  qs.set('size', String(size))
  if (search) qs.set('search', search)
  const url = `${BASE}?${qs.toString()}`

  const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createFeedback = async (payload) => {
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

export const toggleFeedbackPublish = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}/toggle-publish`, {
    method: 'PATCH',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteFeedback = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
