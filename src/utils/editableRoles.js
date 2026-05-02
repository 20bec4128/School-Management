const normalizeRole = (value) => String(value || '').trim().toUpperCase()

export const getEditableRoles = (role) => {
  const r = normalizeRole(role)
  // Backend role naming: HEAD_OFFICE_ADMIN is represented as ADMIN
  if (r === 'SUPER_ADMIN') return ['ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']
  if (r === 'ADMIN' || r === 'HEAD_OFFICE_ADMIN') return ['SCHOOL_ADMIN']
  if (r === 'SCHOOL_ADMIN') return ['TEACHER', 'STUDENT', 'PARENT']
  return []
}

export const canManageUsers = (user) => {
  const role = normalizeRole(user?.role || user?.userRole || user?.authority)
  return getEditableRoles(role).length > 0
}
