const toList = (value) => {
  if (!value) return []
  if (value === '*') return ['*']
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    const v = value.trim()
    if (!v) return []
    if (v === '*') return ['*']
    return v.split(',').map((p) => p.trim()).filter(Boolean)
  }
  return []
}

const readPerms = (userOrPerms) => {
  if (!userOrPerms) return []
  if (Array.isArray(userOrPerms) || typeof userOrPerms === 'string') return toList(userOrPerms)

  // Common backend shapes
  const u = userOrPerms
  return toList(u.permissions ?? u.perms ?? u.authorities ?? u.roles ?? u.rolePermissions)
}

export const can = (userOrPerms, required) => {
  if (!userOrPerms || !required) return false

  const perms = readPerms(userOrPerms)
  if (perms.includes('*')) return true

  const reqList = Array.isArray(required) ? required : [required]
  return reqList.some((p) => perms.includes(p))
}
