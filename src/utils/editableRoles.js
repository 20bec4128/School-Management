const normalizeRole = (value) => String(value || '').trim().toUpperCase()

export const getEditableRoles = (role) => {
  const r = normalizeRole(role)
  if (r === 'SUPER_ADMIN') return ['ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']
  if (r === 'ADMIN') return ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']
  if (r === 'SCHOOL_ADMIN') return ['TEACHER', 'STUDENT', 'PARENT']
  if (r === 'TEACHER') return ['STUDENT', 'PARENT']
  return []
}

export const canManageUsers = (user) => {
  const role = normalizeRole(user?.role || user?.userRole || user?.authority)
  return getEditableRoles(role).length > 0
}

