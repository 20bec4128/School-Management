const STRICT_NAV_PAGES = new Set([
  'head-offices',
  'manage-super-admin',
])

const hasExplicitViewPermission = (page, pagePermissions) => {
  if (!page || !pagePermissions) return false
  const perms = pagePermissions[page]
  return !!perms && perms.view === true
}

export const canShowNavPage = ({ page, pagePermissions = {}, isSuperAdminRole = false }) => {
  if (!page) return true
  if (isSuperAdminRole) return true

  // These pages are reserved for real super admins only, regardless of page permissions.
  if (STRICT_NAV_PAGES.has(page)) {
    return false
  }

  if (!pagePermissions || Object.keys(pagePermissions).length === 0) return true

  const perms = pagePermissions[page]
  if (!perms) return true
  return perms.view === true
}
