import { apiFetch } from './apiClient'

const SCHOOL_RBAC_API_BASE = '/api/school-rbac'

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

export const fetchSchoolPermissions = async () => {
  const res = await apiFetch(`${SCHOOL_RBAC_API_BASE}/permissions`)
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export const fetchEditableRoles = async () => {
  const res = await apiFetch(`${SCHOOL_RBAC_API_BASE}/editable-roles`)
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export const fetchSchoolRoles = async ({ schoolId, headOfficeId } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && schoolId !== '') qs.set('schoolId', String(schoolId))
  if (headOfficeId != null && headOfficeId !== '' && (schoolId == null || schoolId === '')) qs.set('headOfficeId', String(headOfficeId))
  const url = qs.toString() ? `${SCHOOL_RBAC_API_BASE}/roles?${qs.toString()}` : `${SCHOOL_RBAC_API_BASE}/roles`
  const res = await apiFetch(url)
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export const createSchoolRole = async ({ name, description, permissions, schoolId, headOfficeId } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && schoolId !== '') qs.set('schoolId', String(schoolId))
  const url = qs.toString() ? `${SCHOOL_RBAC_API_BASE}/roles?${qs.toString()}` : `${SCHOOL_RBAC_API_BASE}/roles`
  const res = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      name,
      description: description || null,
      headOfficeId: headOfficeId != null && headOfficeId !== '' ? Number(headOfficeId) : null,
      permissions: Array.isArray(permissions) ? permissions : [],
    }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateSchoolRolePermissions = async (roleName, permissions, { schoolId, headOfficeId } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && schoolId !== '') qs.set('schoolId', String(schoolId))
  if (headOfficeId != null && headOfficeId !== '' && (schoolId == null || schoolId === '')) qs.set('headOfficeId', String(headOfficeId))
  const url = qs.toString()
    ? `${SCHOOL_RBAC_API_BASE}/roles/${encodeURIComponent(roleName)}/permissions?${qs.toString()}`
    : `${SCHOOL_RBAC_API_BASE}/roles/${encodeURIComponent(roleName)}/permissions`

  const res = await apiFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissions: Array.isArray(permissions) ? permissions : [] }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteSchoolRole = async (roleName, { schoolId, headOfficeId } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && schoolId !== '') qs.set('schoolId', String(schoolId))
  if (headOfficeId != null && headOfficeId !== '') qs.set('headOfficeId', String(headOfficeId))
  const url = qs.toString()
    ? `${SCHOOL_RBAC_API_BASE}/roles/${encodeURIComponent(roleName)}?${qs.toString()}`
    : `${SCHOOL_RBAC_API_BASE}/roles/${encodeURIComponent(roleName)}`

  const res = await apiFetch(url, { method: 'DELETE', headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  // ok:true JSON
  return res.json()
}
