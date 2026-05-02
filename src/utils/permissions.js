export const can = (user, permission) => {
  if (!user || !permission) return false
  const perms = user.permissions
  if (perms === '*' || perms?.includes?.('*')) return true
  if (Array.isArray(permission)) {
    return Array.isArray(perms) && permission.some((p) => perms.includes(p))
  }
  return Array.isArray(perms) && perms.includes(permission)
}
