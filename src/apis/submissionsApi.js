import { apiFetch } from './apiClient'

const SUBMISSIONS_API_BASE = '/api/submissions'

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

const buildCreateFormData = (payload, file) => {
  const fd = new FormData()
  fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  if (file instanceof File) fd.append('file', file)
  return fd
}

export const fetchSubmissions = async () => {
  const res = await apiFetch(SUBMISSIONS_API_BASE, { headers: { Accept: 'application/json' } })
  if (res.status === 403) return []
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : Array.isArray(data?.value) ? data.value : []
}

export const createSubmission = async (payload, file) => {
  const res = await apiFetch(SUBMISSIONS_API_BASE, {
    method: 'POST',
    body: buildCreateFormData(payload, file),
  })
  if (res.status === 403) throw new Error('Forbidden')
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const evaluateSubmission = async (id, payload) => {
  const res = await apiFetch(`${SUBMISSIONS_API_BASE}/${id}/evaluate`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (res.status === 403) throw new Error('Forbidden')
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteSubmission = async (id) => {
  const res = await apiFetch(`${SUBMISSIONS_API_BASE}/${id}`, { method: 'DELETE' })
  if (res.status === 403) throw new Error('Forbidden')
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
