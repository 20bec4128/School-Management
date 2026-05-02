import { getCurrentRole, getCurrentUser } from './currentUser'

export const isGlobalRole = (role) => {
  const r = String(role || '').toUpperCase()
  return r === 'SUPER_ADMIN' || r === 'ADMIN'
}

export const isSchoolScopedRole = (role) => {
  const r = String(role || '').toUpperCase()
  return r === 'SCHOOL_ADMIN' || r === 'TEACHER' || r === 'STUDENT' || r === 'PARENT'
}

export const getLockedSchool = () => {
  const user = getCurrentUser()
  const role = getCurrentRole()
  if (!isSchoolScopedRole(role)) return { locked: false, schoolId: null, schoolName: null }
  if (user?.schoolId == null) return { locked: true, schoolId: null, schoolName: null }
  return { locked: true, schoolId: String(user.schoolId), schoolName: user?.schoolName || null }
}

