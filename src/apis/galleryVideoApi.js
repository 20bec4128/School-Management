import { apiFetch } from './apiClient'

const BASE = '/api/gallery-videos'

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

export const fetchGalleryVideos = async ({ schoolId, galleryId } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId) qs.set('schoolId', String(schoolId))
  if (galleryId) qs.set('galleryId', String(galleryId))
  const url = qs.size ? `${BASE}?${qs.toString()}` : BASE
  const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const fetchGalleryVideosPage = async ({ schoolId, galleryId, search = '', page = 0, size = 10 } = {}) => {
  const qs = new URLSearchParams({
    schoolId: String(schoolId),
    page: String(Math.max(0, page)),
    size: String(Math.max(1, size)),
  })
  if (galleryId != null && String(galleryId).trim() !== '') qs.set('galleryId', String(galleryId))
  const q = String(search || '').trim()
  if (q) qs.set('search', q)
  const res = await apiFetch(`${BASE}/page?${qs.toString()}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createGalleryVideo = async (payload, file) => {
  const formData = new FormData()
  formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  if (file) formData.append('file', file)

  const res = await apiFetch(BASE, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateGalleryVideo = async (id, payload, file) => {
  const formData = new FormData()
  formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  if (file) formData.append('file', file)

  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: formData,
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteGalleryVideo = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
