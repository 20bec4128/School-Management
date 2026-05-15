import { normalizeRole } from '../utils/roles'

const makeTab = (key, label, page, icon, permission) => ({
  key,
  label,
  page,
  icon,
  permission,
})

const makeProfileItem = (key, label, kind, options = {}) => ({
  key,
  label,
  kind,
  icon: options.icon || 'ri-arrow-right-s-line',
  page: options.page || null,
  pages: options.pages || null,
  view: options.view || null,
  permission: options.permission || null,
  tone: options.tone || 'default',
})

const ROLE_CONFIGS = {
  SUPER_ADMIN: {
    accent: 'super-admin',
    tabs: [
      makeTab('dashboard', 'Dashboard', 'lms-dashboard', 'ri-dashboard-3-line'),
      makeTab('head-offices', 'Head Offices', 'head-offices', 'ri-building-4-line', ['HEAD_OFFICE_MANAGE', '*']),
      makeTab('roles', 'Manage Roles', 'user-role-acl', 'ri-shield-user-line', ['RBAC_MANAGE', 'SCHOOL_RBAC_MANAGE', '*']),
      makeTab('profile', 'Profile', null, 'ri-user-3-line'),
    ],
    centerAction: makeTab('create', 'Create', null, 'ri-add-line'),
    quickActions: [
      makeTab('add-head-office', 'Add Head Office', 'head-offices', 'ri-building-4-line', ['HEAD_OFFICE_MANAGE', '*']),
      makeTab('add-school', 'Add School', 'manage-school', 'ri-school-add-line', ['SCHOOL_MANAGE', 'HEAD_OFFICE_SCHOOL_MANAGE', '*']),
      makeTab('manage-roles', 'Manage Roles', 'user-role-acl', 'ri-shield-user-line', ['RBAC_MANAGE', 'SCHOOL_RBAC_MANAGE', '*']),
    ],
    profileItems: [
      makeProfileItem('notifications', 'Notifications', 'view', { view: 'notifications', icon: 'ri-notification-3-line' }),
      makeProfileItem('settings', 'Settings', 'route', { pages: ['payment-setting', 'sms-setting', 'user-role-acl'], icon: 'ri-settings-3-line' }),
      makeProfileItem('logout', 'Logout', 'action', { icon: 'ri-logout-box-r-line', tone: 'danger' }),
    ],
  },
  HEAD_OFFICE_ADMIN: {
    accent: 'head-office',
    tabs: [
      makeTab('dashboard', 'Dashboard', 'head-office-dashboard', 'ri-dashboard-3-line'),
      makeTab('schools', 'Schools', 'manage-school', 'ri-school-line', ['SCHOOL_MANAGE', 'HEAD_OFFICE_SCHOOL_MANAGE', '*']),
      makeTab('roles', 'Manage Users/Roles', 'user-role-acl', 'ri-shield-user-line', ['RBAC_MANAGE', 'SCHOOL_RBAC_MANAGE', '*']),
      makeTab('profile', 'Profile', null, 'ri-user-3-line'),
    ],
    centerAction: makeTab('create', 'Create', null, 'ri-add-line'),
    quickActions: [
      makeTab('add-school', 'Add School', 'manage-school', 'ri-school-add-line', ['SCHOOL_MANAGE', 'HEAD_OFFICE_SCHOOL_MANAGE', '*']),
      makeTab('add-admin', 'Add School Admin', 'manage-school', 'ri-user-add-line', ['SCHOOL_MANAGE', 'HEAD_OFFICE_SCHOOL_MANAGE', 'RBAC_MANAGE', 'SCHOOL_RBAC_MANAGE', '*']),
      makeTab('add-student', 'Add Student', 'student-list', 'ri-user-add-line', ['STUDENT_MANAGE', '*']),
    ],
    profileItems: [
      makeProfileItem('notifications', 'Notifications', 'view', { view: 'notifications', icon: 'ri-notification-3-line' }),
      makeProfileItem('settings', 'Settings', 'route', { pages: ['payment-setting', 'sms-setting'], icon: 'ri-settings-3-line' }),
      makeProfileItem('logout', 'Logout', 'action', { icon: 'ri-logout-box-r-line', tone: 'danger' }),
    ],
  },
  SCHOOL_ADMIN: {
    accent: 'school-admin',
    tabs: [
      makeTab('dashboard', 'Dashboard', 'school-admin-dashboard', 'ri-dashboard-3-line'),
      makeTab('students', 'Students', 'student-list', 'ri-group-line', ['STUDENT_MANAGE', '*']),
      makeTab('teachers', 'Teachers', 'manage-teacher', 'ri-user-star-line', ['TEACHER_MANAGE', '*']),
      makeTab('routine', 'Routine', 'class-routine', 'ri-time-line', ['CLASS_ROUTINE_VIEW', 'CLASS_ROUTINE_MANAGE', '*']),
      makeTab('profile', 'Profile', null, 'ri-user-3-line'),
    ],
    centerAction: makeTab('create', 'Create', null, 'ri-add-line'),
    quickActions: [
      makeTab('add-student', 'Add Student', 'student-list', 'ri-user-add-line', ['STUDENT_MANAGE', '*']),
      makeTab('add-teacher', 'Add Teacher', 'manage-teacher', 'ri-user-add-line', ['TEACHER_MANAGE', '*']),
      makeTab('manage-teachers', 'Manage Teachers', 'manage-teacher', 'ri-user-settings-line', ['TEACHER_MANAGE', '*']),
      makeTab('add-class', 'Add Class', 'class', 'ri-building-4-line', ['CLASS_MANAGE', 'HEAD_OFFICE_SCHOOL_MANAGE', '*']),
    ],
    profileItems: [
      makeProfileItem('notifications', 'Notifications', 'view', { view: 'notifications', icon: 'ri-notification-3-line' }),
      makeProfileItem('settings', 'Settings', 'route', { pages: ['payment-setting', 'sms-setting'], icon: 'ri-settings-3-line' }),
      makeProfileItem('logout', 'Logout', 'action', { icon: 'ri-logout-box-r-line', tone: 'danger' }),
    ],
  },
  TEACHER: {
    accent: 'teacher',
    tabs: [
      makeTab('dashboard', 'Dashboard', 'teacher-dashboard', 'ri-dashboard-3-line'),
      makeTab('classes', 'My Classes', 'class-lecture', 'ri-book-open-line', ['CLASS_VIEW_ASSIGNED', 'CLASS_MANAGE', '*']),
      makeTab('routine', 'Routine', 'class-routine', 'ri-time-line', ['CLASS_ROUTINE_VIEW', 'CLASS_ROUTINE_MANAGE', '*']),
      makeTab('profile', 'Profile', null, 'ri-user-3-line'),
    ],
    centerAction: makeTab('create', 'Create', null, 'ri-add-line'),
    quickActions: [
      makeTab('take-attendance', 'Take Attendance', 'student-attendance', 'ri-checkbox-circle-line', ['STUDENT_MANAGE', 'ATTENDANCE_VIEW_OWN', '*']),
      makeTab('add-assignment', 'Add Assignment', 'assignment', 'ri-file-add-line', ['ASSIGNMENT_MANAGE', 'ASSIGNMENT_MANAGE_ASSIGNED', '*']),
      makeTab('upload-material', 'Upload Study Material', 'study-material', 'ri-upload-2-line', ['STUDY_MATERIAL_MANAGE', 'STUDY_MATERIAL_MANAGE_ASSIGNED', '*']),
      makeTab('live-class', 'Start Live Class', 'live-class', 'ri-broadcast-line', ['LIVE_CLASS_MANAGE', 'LIVE_CLASS_MANAGE_ASSIGNED', '*']),
    ],
    profileItems: [
      makeProfileItem('notifications', 'Notifications', 'view', { view: 'notifications', icon: 'ri-notification-3-line' }),
      makeProfileItem('attendance', 'Attendance', 'route', { pages: ['student-attendance', 'teacher-attendance'], icon: 'ri-calendar-check-line' }),
      makeProfileItem('logout', 'Logout', 'action', { icon: 'ri-logout-box-r-line', tone: 'danger' }),
    ],
  },
  STUDENT: {
    accent: 'student',
    tabs: [
      makeTab('home', 'Home', 'student-dashboard', 'ri-home-5-line'),
      makeTab('routine', 'Routine', 'class-routine', 'ri-time-line', ['CLASS_ROUTINE_VIEW', 'CLASS_ROUTINE_MANAGE', '*']),
      makeTab('study-materials', 'Study Materials', 'study-material', 'ri-book-read-line', ['STUDY_MATERIAL_VIEW_OWN', '*']),
      makeTab('profile', 'Profile', null, 'ri-user-3-line'),
    ],
    centerAction: makeTab('create', 'Create', null, 'ri-add-line'),
    quickActions: [
      makeTab('submit-assignment', 'Submit Assignment', 'assignment', 'ri-file-upload-line', ['ASSIGNMENT_SUBMIT', '*']),
      makeTab('join-live', 'Join Live Class', 'live-class', 'ri-video-chat-line', ['LIVE_CLASS_JOIN', 'LIVE_CLASS_VIEW_OWN', '*']),
      makeTab('assignments', 'Assignments', 'assignment', 'ri-file-list-3-line', ['ASSIGNMENT_SUBMIT', 'ASSIGNMENT_VIEW_OWN', '*']),
    ],
    profileItems: [
      makeProfileItem('attendance', 'Attendance', 'route', { pages: ['student-attendance'], icon: 'ri-calendar-check-line' }),
      makeProfileItem('marks', 'Marks', 'route', { pages: ['exam-result', 'mark-sheet', 'result-card'], icon: 'ri-bar-chart-2-line' }),
      makeProfileItem('study-materials', 'Study Materials', 'route', { pages: ['study-material'], icon: 'ri-book-read-line' }),
      makeProfileItem('assignments', 'Assignments', 'route', { pages: ['assignment'], icon: 'ri-file-list-3-line' }),
      makeProfileItem('notifications', 'Notifications', 'view', { view: 'notifications', icon: 'ri-notification-3-line' }),
      makeProfileItem('logout', 'Logout', 'action', { icon: 'ri-logout-box-r-line', tone: 'danger' }),
    ],
  },
  PARENT: {
    accent: 'parent',
    tabs: [
      makeTab('home', 'Home', 'parent-dashboard', 'ri-home-5-line'),
      makeTab('children', 'Children', 'parent-dashboard', 'ri-team-line'),
      makeTab('fees', 'Fees', 'fee-collection', 'ri-bank-card-line', ['FEES_VIEW_OWN', 'FEES_VIEW_CHILD', '*']),
      makeTab('profile', 'Profile', null, 'ri-user-3-line'),
    ],
    centerAction: makeTab('create', 'Create', null, 'ri-add-line'),
    quickActions: [
      makeTab('assignments', 'Assignments', 'assignment', 'ri-file-list-3-line', ['ASSIGNMENT_VIEW_CHILD', 'ASSIGNMENT_SUBMIT', '*']),
      makeTab('attendance', 'Attendance', 'student-attendance', 'ri-calendar-check-line', ['ATTENDANCE_VIEW_OWN', 'ATTENDANCE_VIEW_CHILD', '*']),
      makeTab('marks', 'Marks', 'mark-sheet', 'ri-bar-chart-2-line', ['RESULT_VIEW_OWN', 'RESULT_VIEW_CHILD', '*']),
    ],
    profileItems: [
      makeProfileItem('routine', 'Child Routine', 'route', { pages: ['class-routine'], icon: 'ri-time-line' }),
      makeProfileItem('marks', 'Child Marks', 'route', { pages: ['exam-result', 'mark-sheet', 'result-card'], icon: 'ri-bar-chart-2-line' }),
      makeProfileItem('fees', 'Fees', 'route', { pages: ['fee-collection', 'fee-type'], icon: 'ri-bank-card-line' }),
      makeProfileItem('attendance', 'Attendance', 'route', { pages: ['student-attendance'], icon: 'ri-calendar-check-line' }),
      makeProfileItem('notifications', 'Notifications', 'view', { view: 'notifications', icon: 'ri-notification-3-line' }),
      makeProfileItem('logout', 'Logout', 'action', { icon: 'ri-logout-box-r-line', tone: 'danger' }),
    ],
  },
}

const DEFAULT_CONFIG = {
  accent: 'school-admin',
  tabs: [
    makeTab('dashboard', 'Dashboard', 'dashboard', 'ri-dashboard-3-line'),
    makeTab('profile', 'Profile', null, 'ri-user-3-line'),
  ],
  centerAction: makeTab('create', 'Create', null, 'ri-add-line'),
  quickActions: [],
  profileItems: [
    makeProfileItem('notifications', 'Notifications', 'view', { view: 'notifications', icon: 'ri-notification-3-line' }),
    makeProfileItem('logout', 'Logout', 'action', { icon: 'ri-logout-box-r-line', tone: 'danger' }),
  ],
}

const firstAccessiblePage = (user, pages) => {
  const list = Array.isArray(pages) ? pages : [pages]
  return list.find(Boolean) || null
}

const isVisible = () => true

export const getMobileNavigationConfig = ({ user, role }) => {
  const normalizedRole = normalizeRole(role || user?.role || user?.userRole || user?.authority)
  const raw = ROLE_CONFIGS[normalizedRole] || DEFAULT_CONFIG
  const notificationCount = Number(
    user?.unreadNotificationCount ??
      user?.notificationCount ??
      user?.notifications?.length ??
      0,
  )

  const tabs = raw.tabs
    .filter((tab) => isVisible(tab.permission, tab.page))
    .slice(0, 5)
    .map((tab) => ({
      ...tab,
      badgeCount: tab.key === 'profile' ? notificationCount : Number(tab.badgeCount || 0),
    }))

  const centerAction = raw.centerAction && isVisible(raw.centerAction.permission, raw.centerAction.page) ? raw.centerAction : null
  const quickActions = raw.quickActions.filter((action) => isVisible(action.permission, action.page))

  const profileItems = raw.profileItems
    .filter((item) => (item.pages ? !!firstAccessiblePage(user, item.pages) : true))
    .map((item) => ({
      ...item,
      page: item.page || firstAccessiblePage(user, item.pages),
      badgeCount: item.view === 'notifications' ? notificationCount : Number(item.badgeCount || 0),
    }))

  return {
    role: normalizedRole,
    accent: raw.accent,
    tabs,
    centerAction,
    quickActions,
    profileItems,
  }
}
