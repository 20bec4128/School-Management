import { apiFetch } from './apiClient'

const STUDY_MATERIALS_API_BASE = '/api/study-materials'

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

const buildUpsertFormData = (payload, file) => {
  const fd = new FormData()
  fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  if (file instanceof File) fd.append('material', file)
  return fd
}

export const fetchStudyMaterials = async ({ schoolId, classId, subjectId } = {}) => {
  const query = new URLSearchParams()
  if (schoolId != null && schoolId !== '') query.set('schoolId', String(schoolId))
  if (classId != null && classId !== '') query.set('classId', String(classId))
  if (subjectId != null && subjectId !== '') query.set('subjectId', String(subjectId))
  const url = query.toString() ? `${STUDY_MATERIALS_API_BASE}?${query.toString()}` : STUDY_MATERIALS_API_BASE
  const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?.value)
        ? data.value
        : []
}

export const createStudyMaterial = async (payload, file) => {
  const res = await apiFetch(STUDY_MATERIALS_API_BASE, {
    method: 'POST',
    body: buildUpsertFormData(payload, file),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateStudyMaterial = async (id, payload, file) => {
  const res = await apiFetch(`${STUDY_MATERIALS_API_BASE}/${id}`, {
    method: 'PUT',
    body: buildUpsertFormData(payload, file),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteStudyMaterial = async (id) => {
  const res = await apiFetch(`${STUDY_MATERIALS_API_BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
