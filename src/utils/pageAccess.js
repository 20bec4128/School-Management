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
  'manage-invoice',
  'due-invoice',
  'due-receipt',
  'paid-receipt',
  'due-fee-email',
  'due-fee-sms',
  'income-head',
  'income',
  'expenditure-head',
  'expenditure',
  'income-report',
  'expenditure-report',
  'invoice-report',
  'due-fee-report',
  'fee-collection-report',
  'accounting-balance-report',
  'library-report',
  'student-attendance-report',
  'student-yearly-attendance-report',
  'teacher-attendance-report',
  'teacher-yearly-attendance-report',
  'vendor',
  'asset-store',
  'asset-category',
  'asset-item',
  'asset-purchase',
  'asset-issue',
  'asset-return',
  'asset-report',
  'book',
  'books-list',
  'book-create',
  'library-members',
  'library-issue-return',
  'issue-return',
  'ebook',
  'payroll-report',
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
  'manage-invoice',
  'due-invoice',
  'vendor',
  'asset-store',
  'asset-category',
  'asset-item',
  'asset-purchase',
  'asset-issue',
  'asset-return',
  'asset-report',
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
  'employee-attendance-report',
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
