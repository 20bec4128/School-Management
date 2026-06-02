import { normalizePagePermissionSlug } from './pagePermissionAliases'

const STRICT_NAV_PAGES = new Set([
  'head-offices',
  'manage-super-admin',
])

const hasExplicitViewPermission = (page, pagePermissions) => {
  const key = normalizePagePermissionSlug(page)
  if (!key || !pagePermissions) return false
  const perms = pagePermissions[key]
  return !!perms && perms.view === true
}

export const canShowNavPage = ({ page, pagePermissions = {}, isSuperAdminRole = false }) => {
  const key = normalizePagePermissionSlug(page)
  if (!key) return true
  if (isSuperAdminRole) return true

  // These pages are reserved for real super admins only, regardless of page permissions.
  if (STRICT_NAV_PAGES.has(key)) {
    return false
  }

  if (!pagePermissions || Object.keys(pagePermissions).length === 0) return true

  const perms = pagePermissions[key]
  if (!perms) return true
  return perms.view === true
}
