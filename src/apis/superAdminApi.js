import { apiFetch } from './apiClient'

const BASE = '/api/super-admins'

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

const buildMultipartFormData = (payload, files = {}) => {
  const fd = new FormData()
  fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  if (files?.photo instanceof File) fd.append('photo', files.photo)
  if (files?.resume instanceof File) fd.append('resume', files.resume)
  return fd
}

export const fetchSuperAdminsPage = async ({
  page = 0,
  size = 10,
  search = '',
  name = '',
  email = '',
  phone = '',
} = {}) => {
  const qs = new URLSearchParams()
  qs.set('page', String(page))
  qs.set('size', String(size))
  if (search) qs.set('search', search)
  if (name) qs.set('name', name)
  if (email) qs.set('email', email)
  if (phone) qs.set('phone', phone)
  const url = `${BASE}?${qs.toString()}`

  const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createSuperAdmin = async (payload, { photo, resume } = {}) => {
  const res = await apiFetch(BASE, {
    method: 'POST',
    body: buildMultipartFormData(payload, { photo, resume }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateSuperAdmin = async (id, payload, { photo, resume } = {}) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: buildMultipartFormData(payload, { photo, resume }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteSuperAdmin = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
