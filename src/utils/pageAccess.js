import { can } from './permissions'
import { normalizeRole } from './roles'
import { getRouteAccessRule } from '../constants/pageAccess'

const studentAllowedPages = new Set([
  'dashboard',
  'student-dashboard',
  'class-routine',
  'subject',
  'syllabus',
  'study-material',
  'live-class',
  'assignment',
  'submission',
  'lesson',
  'topic',
  'lesson-timeline',
  'lesson-status',
  'lesson-plan',
])

const schoolAdminAllowedPages = new Set([
  'dashboard',
  'school-admin-dashboard',
  'teacher-department',
  'user-role-acl',
  'class',
  'section',
  'subject',
  'manage-teacher',
  'student-list',
  'student-type',
  'student-activity',
  'syllabus',
  'study-material',
  'live-class',
  'assignment',
  'submission',
  'class-routine',
])

const studentTypeAllowedRoles = new Set([
  'SUPER_ADMIN',
  'HEAD_OFFICE_ADMIN',
  'SCHOOL_ADMIN',
  'TEACHER',
])

const schoolScopedAllowedPages = new Set([
  'student-type',
  'student-list',
  'online-admission',
  'class',
  'section',
  'subject',
  'syllabus',
  'study-material',
  'live-class',
  'assignment',
  'submission',
  'lesson',
  'topic',
  'lesson-timeline',
  'lesson-status',
  'lesson-plan',
  'class-routine',
])

const parentAllowedPages = new Set([
  'dashboard',
  'parent-dashboard',
  'parent-child-select',
  'class-routine',
  'student-attendance',
  'exam-result',
  'mark-sheet',
  'result-card',
  'fee-collection',
  'subject',
  'syllabus',
  'study-material',
  'live-class',
  'assignment',
  'submission',
  'lesson',
  'topic',
  'lesson-timeline',
  'lesson-status',
  'lesson-plan',
])

export const canAccessPage = (user, pageKey) => {
  if (!pageKey) return true

  const role = normalizeRole(user?.role || user?.userRole || user?.authority)
  if (role === 'SUPER_ADMIN') return true

  if (['HEAD_OFFICE_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(role) && schoolScopedAllowedPages.has(pageKey)) {
    return true
  }

  if (pageKey === 'student-type' && studentTypeAllowedRoles.has(role)) {
    return true
  }

  if (role === 'PARENT') return parentAllowedPages.has(pageKey)

  const rule = getRouteAccessRule(pageKey)
  if (rule?.permissions?.length && !can(user, rule.permissions)) return false

  if (role === 'STUDENT') return studentAllowedPages.has(pageKey)
  if (role === 'SCHOOL_ADMIN') return schoolAdminAllowedPages.has(pageKey)

  return true
}
