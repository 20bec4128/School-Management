import { apiFetch } from './apiClient'

const BASE = '/api/ebooks'

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

const buildUpsertFormData = (payload, ebookFile) => {
  const fd = new FormData()
  fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  if (ebookFile instanceof File) fd.append('ebookFile', ebookFile)
  return fd
}

export const fetchEBooksPage = async ({ page = 0, size = 10, search = '', headOfficeId, schoolId, ebookType, classId, language } = {}) => {
  const qs = new URLSearchParams({
    page: String(Math.max(0, page)),
    size: String(Math.max(1, size)),
  })
  const q = String(search || '').trim()
  if (q) qs.append('search', q)
  if (headOfficeId != null && String(headOfficeId).trim()) qs.append('headOfficeId', String(headOfficeId))
  if (schoolId != null && String(schoolId).trim()) qs.append('schoolId', String(schoolId))
  if (ebookType != null && String(ebookType).trim()) qs.append('ebookType', String(ebookType).trim())
  if (classId != null && String(classId).trim()) qs.append('classId', String(classId))
  if (language != null && String(language).trim()) qs.append('language', String(language).trim())

  const res = await apiFetch(`${BASE}?${qs.toString()}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createEBook = async (payload, ebookFile) => {
  const res = await apiFetch(BASE, {
    method: 'POST',
    body: buildUpsertFormData(payload, ebookFile),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateEBook = async (id, payload, ebookFile) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: buildUpsertFormData(payload, ebookFile),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteEBook = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  if (res.status === 204) return null
  return res.text()
}
