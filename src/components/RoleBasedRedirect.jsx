import { useEffect, useMemo } from 'react'
import { normalizeRole } from '../utils/roles'

// Computes the "home page key" for the current auth context.
// This app uses page-key switching (no react-router).
const RoleBasedRedirect = ({ role, parentChildren, selectedChildId, onRedirect }) => {
  const homePage = useMemo(() => {
    const r = normalizeRole(role)
    if (r === 'SUPER_ADMIN') return 'school-admin-dashboard'
    if (r === 'HEAD_OFFICE_ADMIN') return 'head-office-dashboard'
    if (r === 'SCHOOL_ADMIN') return 'school-admin-dashboard'
    if (r === 'TEACHER') return 'teacher-dashboard'
    if (r === 'STUDENT') return 'student-dashboard'
    if (r === 'PARENT') return 'parent-dashboard'
    return 'dashboard'
  }, [role, parentChildren, selectedChildId])

  useEffect(() => {
    onRedirect?.(homePage)
  }, [homePage, onRedirect])

  return null
}

export default RoleBasedRedirect
