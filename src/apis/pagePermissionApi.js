import { apiFetch } from './apiClient'

const BASE_URL = '/api/rbac/page-permissions'

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

export const fetchModulesWithFunctions = async () => {
  const res = await apiFetch(`${BASE_URL}/modules`)
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const fetchRolePagePermissions = async (roleName, schoolId) => {
  let url = `${BASE_URL}/${encodeURIComponent(roleName)}`
  if (schoolId !== undefined && schoolId !== null) {
    url += `?schoolId=${schoolId}`
  }
  const res = await apiFetch(url)
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const saveRolePagePermissions = async (roleName, permissions, schoolId) => {
  let url = `${BASE_URL}/${encodeURIComponent(roleName)}`
  if (schoolId !== undefined && schoolId !== null) {
    url += `?schoolId=${schoolId}`
  }
  const res = await apiFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissions }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const fetchMyPagePermissions = async () => {
  const res = await apiFetch(`${BASE_URL}/me`)
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}
