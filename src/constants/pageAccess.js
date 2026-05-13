export const PAGE_GROUPS = [
  {
    key: 'core-system',
    label: 'Core System',
    pageKeys: [
      'dashboard',
      'head-office-dashboard',
      'school-admin-dashboard',
      'teacher-dashboard',
      'student-dashboard',
      'parent-dashboard',
      'lms-dashboard',
    ],
  },
  {
    key: 'administrator',
    label: 'Administrator',
    pageKeys: ['head-offices', 'manage-school', 'user-role-acl', 'payment-setting', 'sms-setting'],
  },
  {
    key: 'student-management',
    label: 'Student Management',
    pageKeys: ['student-type', 'student-list', 'online-admission', 'student-activity', 'student-attendance'],
  },
  {
    key: 'academic-management',
    label: 'Academic Management',
    pageKeys: ['class', 'section', 'subject', 'syllabus', 'study-material', 'live-class', 'assignment', 'submission'],
  },
  {
    key: 'teacher-management',
    label: 'Teacher',
    pageKeys: ['teacher-department', 'manage-teacher', 'class-lecture', 'rating', 'teacher-attendance'],
  },
  {
    key: 'lesson-plan',
    label: 'Lesson Plan',
    pageKeys: ['lesson', 'topic', 'lesson-timeline', 'lesson-status', 'lesson-plan', 'class-routine'],
  },
  {
    key: 'examination',
    label: 'Examination System',
    pageKeys: [
      'exam-instruction',
      'question-bank',
      'onlineexam',
      'exam-result',
      'exam-grade',
      'exam-term',
      'schedule',
      'suggestion',
      'attendance',
      'manage-mark',
      'exam-term-result',
      'exam-final-result',
      'merit-list',
      'mark-sheet',
      'result-card',
      'mark-send-email',
      'mark-send-sms',
      'result-email',
      'result-sms',
    ],
  },
  {
    key: 'hr',
    label: 'Human Resource',
    pageKeys: ['manage-designation', 'manage-employee', 'leave-type', 'leave-application', 'waiting-application', 'approved-application', 'declined-application', 'salary-grade', 'salary-payment', 'salary-history', 'employee-attendance-report'],
  },
  {
    key: 'finance',
    label: 'Finance & Accounts',
    pageKeys: ['discount', 'fee-type', 'fee-collection', 'manage-invoice', 'due-invoice'],
  },
  {
    key: 'communication',
    label: 'Communication',
    pageKeys: ['visitor-purpose', 'call-log', 'visitor-info', 'postal-dispatch', 'postal-receive', 'complain-type', 'manage-complain', 'notice', 'news', 'holiday', 'event', 'gallery', 'images', 'videos'],
  },
  {
    key: 'certificates',
    label: 'Certificates',
    pageKeys: ['id-card-setting', 'admit-card-setting', 'certificate-type', 'generate-certificate', 'candidate', 'donar', 'scholarship', 'guardian'],
  },
]

export const ROUTE_ACCESS_RULES = [
  { pageKeys: ['head-offices'], permissions: ['HEAD_OFFICE_MANAGE', '*'] },
  { pageKeys: ['manage-school', 'payment-setting', 'sms-setting'], permissions: ['SCHOOL_MANAGE', 'HEAD_OFFICE_SCHOOL_MANAGE', '*'] },
  { pageKeys: ['user-role-acl'], permissions: ['RBAC_MANAGE', 'SCHOOL_RBAC_MANAGE', '*'] },
  { pageKeys: ['class-routine'], permissions: ['CLASS_ROUTINE_VIEW', 'CLASS_ROUTINE_MANAGE', 'SCHOOL_MANAGE', 'HEAD_OFFICE_SCHOOL_MANAGE', '*'] },
]

// Default page visibility rules (UI + route gating). If a pageKey has an entry here, users
// must have at least one of the listed permissions (or '*') to access it.
export const PAGE_KEY_PERMISSIONS = {
  // Student management
  'student-type': ['STUDENT_TYPE_MANAGE', '*'],
  'student-list': ['STUDENT_MANAGE', '*'],
  'online-admission': ['STUDENT_MANAGE', '*'],
  'student-activity': ['STUDENT_MANAGE', '*'],
  'student-attendance': ['STUDENT_MANAGE', '*'],

  // Academic management
  class: ['CLASS_MANAGE', 'HEAD_OFFICE_SCHOOL_MANAGE', '*'],
  section: ['SECTION_MANAGE', 'HEAD_OFFICE_SCHOOL_MANAGE', '*'],
  subject: ['SUBJECT_VIEW_OWN', 'SUBJECT_VIEW_CHILD', 'SUBJECT_VIEW_ASSIGNED', 'SUBJECT_MANAGE', 'SUBJECT_MANAGE_ASSIGNED', '*'],
  syllabus: ['SYLLABUS_VIEW_OWN', 'SYLLABUS_VIEW_CHILD', 'SYLLABUS_MANAGE', 'SYLLABUS_MANAGE_ASSIGNED', '*'],
  'study-material': ['STUDY_MATERIAL_VIEW_OWN', 'STUDY_MATERIAL_VIEW_CHILD', 'STUDY_MATERIAL_MANAGE', 'STUDY_MATERIAL_MANAGE_ASSIGNED', '*'],
  'live-class': ['LIVE_CLASS_JOIN', 'LIVE_CLASS_VIEW_OWN', 'LIVE_CLASS_VIEW_CHILD', 'LIVE_CLASS_MANAGE', 'LIVE_CLASS_MANAGE_ASSIGNED', '*'],
  assignment: ['ASSIGNMENT_SUBMIT', 'ASSIGNMENT_VIEW_OWN', 'ASSIGNMENT_VIEW_CHILD', 'ASSIGNMENT_MANAGE', 'ASSIGNMENT_MANAGE_ASSIGNED', '*'],
  submission: [
    'ASSIGNMENT_SUBMIT',
    'SUBMISSION_MANAGE',
    'SUBMISSION_VIEW_ASSIGNED',
    'SUBMISSION_VIEW_OWN',
    'SUBMISSION_VIEW_CHILD',
    '*',
  ],

  // Teacher module
  'teacher-department': ['DEPARTMENT_MANAGE', '*'],
  'manage-teacher': ['TEACHER_MANAGE', '*'],
  'class-lecture': ['CLASS_VIEW_ASSIGNED', 'CLASS_MANAGE', '*'],
  rating: ['TEACHER_MANAGE', '*'],
  'teacher-attendance': ['TEACHER_MANAGE', '*'],

  // Lesson plan module
  lesson: ['LESSON_VIEW_OWN', 'LESSON_VIEW_CHILD', 'LESSON_MANAGE', 'LESSON_MANAGE_ASSIGNED', '*'],
  topic: ['TOPIC_VIEW_OWN', 'TOPIC_VIEW_CHILD', 'TOPIC_MANAGE', 'TOPIC_MANAGE_ASSIGNED', '*'],
  'lesson-timeline': ['LESSON_PLAN_VIEW_OWN', 'LESSON_PLAN_VIEW_CHILD', 'LESSON_PLAN_MANAGE', 'LESSON_PLAN_MANAGE_ASSIGNED', '*'],
  'lesson-status': ['LESSON_PLAN_VIEW_OWN', 'LESSON_PLAN_VIEW_CHILD', 'LESSON_PLAN_MANAGE', 'LESSON_PLAN_MANAGE_ASSIGNED', '*'],
  'lesson-plan': ['LESSON_PLAN_VIEW_OWN', 'LESSON_PLAN_VIEW_CHILD', 'LESSON_PLAN_MANAGE', 'LESSON_PLAN_MANAGE_ASSIGNED', '*'],

  'class-routine': ['CLASS_ROUTINE_VIEW', 'CLASS_ROUTINE_MANAGE', 'SCHOOL_MANAGE', 'HEAD_OFFICE_SCHOOL_MANAGE', '*'],

  // Examination system (conservative: tie to result/exam permissions if present, otherwise require all-access)
  'exam-instruction': ['*'],
  'question-bank': ['*'],
  onlineexam: ['*'],
  'exam-result': ['RESULT_VIEW_OWN', 'RESULT_VIEW_CHILD', '*'],
  'exam-grade': ['*'],
  'exam-term': ['*'],
  schedule: ['*'],
  suggestion: ['*'],
  attendance: ['ATTENDANCE_VIEW_OWN', 'ATTENDANCE_VIEW_CHILD', '*'],
  'manage-mark': ['*'],
  'exam-term-result': ['RESULT_VIEW_OWN', 'RESULT_VIEW_CHILD', '*'],
  'exam-final-result': ['RESULT_VIEW_OWN', 'RESULT_VIEW_CHILD', '*'],
  'merit-list': ['RESULT_VIEW_OWN', 'RESULT_VIEW_CHILD', '*'],
  'mark-sheet': ['RESULT_VIEW_OWN', 'RESULT_VIEW_CHILD', '*'],
  'result-card': ['REPORT_CARD_VIEW_OWN', 'REPORT_CARD_VIEW_CHILD', '*'],
  'mark-send-email': ['*'],
  'mark-send-sms': ['*'],
  'result-email': ['*'],
  'result-sms': ['*'],

  // HR module
  'manage-designation': ['DEPARTMENT_MANAGE', '*'],
  'manage-employee': ['ADMIN_USER_MANAGE', '*'],
  'leave-type': ['ADMIN_USER_MANAGE', 'SCHOOL_MANAGE', 'HEAD_OFFICE_SCHOOL_MANAGE', '*'],
  'leave-application': ['ADMIN_USER_MANAGE', 'SCHOOL_MANAGE', 'HEAD_OFFICE_SCHOOL_MANAGE', '*'],
  'waiting-application': ['ADMIN_USER_MANAGE', 'SCHOOL_MANAGE', 'HEAD_OFFICE_SCHOOL_MANAGE', '*'],
  'approved-application': ['ADMIN_USER_MANAGE', 'SCHOOL_MANAGE', 'HEAD_OFFICE_SCHOOL_MANAGE', '*'],
  'declined-application': ['ADMIN_USER_MANAGE', 'SCHOOL_MANAGE', 'HEAD_OFFICE_SCHOOL_MANAGE', '*'],
  'salary-grade': ['ADMIN_USER_MANAGE', '*'],
  'salary-payment': ['ADMIN_USER_MANAGE', '*'],
  'salary-history': ['ADMIN_USER_MANAGE', '*'],

  // Finance
  discount: ['FEES_VIEW_OWN', 'FEES_VIEW_CHILD', '*'],
  'fee-type': ['FEES_VIEW_OWN', 'FEES_VIEW_CHILD', '*'],
  'fee-collection': ['FEES_VIEW_OWN', 'FEES_VIEW_CHILD', '*'],
  'manage-invoice': ['FEES_VIEW_OWN', 'FEES_VIEW_CHILD', '*'],
  'due-invoice': ['FEES_VIEW_OWN', 'FEES_VIEW_CHILD', '*'],

  // Communication
  'visitor-purpose': ['NOTICE_VIEW', 'NEWS_VIEW', '*'],
  'call-log': ['NOTICE_VIEW', 'NEWS_VIEW', '*'],
  'visitor-info': ['NOTICE_VIEW', 'NEWS_VIEW', '*'],
  'postal-dispatch': ['NOTICE_VIEW', 'NEWS_VIEW', '*'],
  'postal-receive': ['NOTICE_VIEW', 'NEWS_VIEW', '*'],
  'complain-type': ['COMPLAINT_VIEW_OWN', 'COMPLAINT_VIEW_CHILD', '*'],
  'manage-complain': ['COMPLAINT_VIEW_OWN', 'COMPLAINT_VIEW_CHILD', '*'],
  notice: ['NOTICE_VIEW', '*'],
  news: ['NEWS_VIEW', '*'],
  holiday: ['HOLIDAY_VIEW', '*'],
  event: ['EVENT_VIEW', '*'],
  gallery: ['GALLERY_VIEW', '*'],
  images: ['GALLERY_VIEW', '*'],
  videos: ['GALLERY_VIEW', '*'],

  // Certificates
  'id-card-setting': ['ID_CARD_SETTING', '*'],
  'admit-card-setting': ['ADMIT_CARD_SETTING', '*'],
  'certificate-type': ['CERTIFICATE_TYPE', '*'],
  'generate-certificate': ['GENERATE_CERTIFICATE', '*'],
  candidate: ['CANDIDATE', '*'],
  donar: ['DONAR', '*'],
  scholarship: ['SCHOLARSHIP', '*'],
  guardian: ['GUARDIAN', '*'],
}

export const getPageGroup = (pageKey) => PAGE_GROUPS.find((group) => group.pageKeys.includes(pageKey)) || null

export const getRouteAccessRule = (pageKey) =>
  ROUTE_ACCESS_RULES.find((rule) => rule.pageKeys.includes(pageKey)) ||
  (PAGE_KEY_PERMISSIONS[pageKey]
    ? { pageKeys: [pageKey], permissions: PAGE_KEY_PERMISSIONS[pageKey] }
    : null)
