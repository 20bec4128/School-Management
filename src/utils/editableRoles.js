import { normalizeRole } from './roles'

export const getEditableRoles = (role) => {
  const r = normalizeRole(role)
  if (r === 'SUPER_ADMIN') return ['HEAD_OFFICE_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']
  if (r === 'HEAD_OFFICE_ADMIN') return ['SCHOOL_ADMIN']
  if (r === 'SCHOOL_ADMIN') return ['TEACHER', 'STUDENT', 'PARENT']
  return []
}

export const canManageUsers = (user) => {
  const role = normalizeRole(user?.role || user?.userRole || user?.authority)
  return getEditableRoles(role).length > 0
}
