import { apiFetch } from './apiClient'

const BASE = '/api/suggestions'

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

const appendIfPresent = (formData, key, value) => {
  if (value == null || value === '') return
  formData.append(key, String(value))
}

const buildFormData = (payload = {}, documentFile) => {
  const fd = new FormData()
  appendIfPresent(fd, 'headOfficeId', payload.headOfficeId)
  appendIfPresent(fd, 'schoolId', payload.schoolId)
  appendIfPresent(fd, 'title', payload.title)
  appendIfPresent(fd, 'examTerm', payload.examTerm)
  appendIfPresent(fd, 'className', payload.className)
  appendIfPresent(fd, 'subjectName', payload.subjectName)
  appendIfPresent(fd, 'suggestionText', payload.suggestionText)
  appendIfPresent(fd, 'note', payload.note)
  if (payload.removeDocument) {
    fd.append('removeDocument', 'true')
  }
  if (documentFile instanceof File) {
    fd.append('document', documentFile)
  }
  return fd
}

export const fetchSuggestions = async (params = {}) => {
  const qs = new URLSearchParams()
  if (params.headOfficeId != null && params.headOfficeId !== '') qs.set('headOfficeId', String(params.headOfficeId))
  if (params.schoolId != null && params.schoolId !== '') qs.set('schoolId', String(params.schoolId))
  if (params.examTerm) qs.set('examTerm', params.examTerm)
  if (params.className) qs.set('className', params.className)
  if (params.subjectName) qs.set('subjectName', params.subjectName)
  if (params.search) qs.set('search', params.search)
  const url = qs.toString() ? `${BASE}?${qs.toString()}` : BASE
  const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const fetchSuggestionsPage = async (params = {}) => {
  const qs = new URLSearchParams()
  if (params.headOfficeId != null && params.headOfficeId !== '') qs.set('headOfficeId', String(params.headOfficeId))
  if (params.schoolId != null && params.schoolId !== '') qs.set('schoolId', String(params.schoolId))
  if (params.examTerm) qs.set('examTerm', params.examTerm)
  if (params.className) qs.set('className', params.className)
  if (params.subjectName) qs.set('subjectName', params.subjectName)
  if (params.search) qs.set('search', params.search)
  qs.set('page', String(params.page ?? 0))
  qs.set('size', String(params.size ?? 10))
  const res = await apiFetch(`${BASE}/page?${qs.toString()}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const fetchSuggestionById = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createSuggestion = async (payload, documentFile) => {
  const res = await apiFetch(BASE, {
    method: 'POST',
    body: buildFormData(payload, documentFile),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateSuggestion = async (id, payload, documentFile) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: buildFormData(payload, documentFile),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteSuggestion = async (id) => {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(String(id))}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
