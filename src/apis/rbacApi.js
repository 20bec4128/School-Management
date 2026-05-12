import { apiFetch } from './apiClient'

const RBAC_API_BASE = '/api/rbac'

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

export const fetchPermissions = async () => {
  const res = await apiFetch(`${RBAC_API_BASE}/permissions`)
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export const fetchRoles = async () => {
  const res = await apiFetch(`${RBAC_API_BASE}/roles`)
  if (!res.ok) throw new Error(await readApiError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export const createRole = async ({ name, description, permissions }) => {
  const res = await apiFetch(`${RBAC_API_BASE}/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      description: description || null,
      permissions: Array.isArray(permissions) ? permissions : [],
    }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateRolePermissions = async (roleName, permissions) => {
  const res = await apiFetch(`${RBAC_API_BASE}/roles/${encodeURIComponent(roleName)}/permissions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      permissions: Array.isArray(permissions) ? permissions : [],
    }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

