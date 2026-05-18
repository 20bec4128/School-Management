export const MARK_SEND_EMAIL_ROWS_STORAGE_KEY = 'sm_mark_send_email_rows'
export const MARK_SEND_EMAIL_EDIT_STORAGE_KEY = 'sm_mark_send_email_edit_row'

export const DEFAULT_EXAM_TERMS = ['First Term', 'Second Term', 'Final Term']
export const RECEIVER_TYPE_OPTIONS = ['Student', 'Parent', 'Guardian']
export const STUDENT_MARK_OPTIONS = [
  'Mark Sheet (All Subjects)',
  'Subject Wise Mark',
  'Consolidated Mark Sheet',
]

export const TEMPLATE_OPTIONS = {
  'Mark Sheet Template': {
    subject: 'Your Mark Sheet for {exam} - {subject}',
    emailBody:
      'Dear {receiver_name},\n\nPlease find your mark sheet for {exam} in {subject}.\n\nYour obtained mark: {obtain_mark} out of {total_mark}\nPercentage: {percentage}%\nGrade: {letter_grade}\n\nRegards,\n{school_name}',
  },
  'Parent Notification Template': {
    subject: 'Mark Sheet Notification - {student_name}',
    emailBody:
      'Dear Parent/Guardian,\n\nPlease find the mark sheet of {student_name} for {exam} in {subject}.\n\nObtained Mark: {obtain_mark} / {total_mark}\nPercentage: {percentage}%\nGrade: {letter_grade}\n\nRegards,\n{school_name}',
  },
  'Result Alert Template': {
    subject: 'Result Published - {exam}',
    emailBody:
      'Hello,\n\nThe results for {exam} have been published.\n\nSubject: {subject}\nObtained Mark: {obtain_mark}\nPercentage: {percentage}%\nGrade: {letter_grade}\n\nThank you,\n{school_name}',
  },
}

export const DYNAMIC_TAGS = [
  '{school_name}',
  '{receiver_name}',
  '{student_name}',
  '{exam}',
  '{subject}',
  '{total_mark}',
  '{obtain_mark}',
  '{percentage}',
  '{letter_grade}',
]

export const emptyMarkSendEmailForm = {
  id: null,
  headOfficeId: '',
  schoolId: '',
  exam: '',
  receiverType: '',
  studentMark: '',
  template: '',
  subject: '',
  emailBody: '',
}

export const seedMarkSendEmailRows = [
  {
    sl: '01',
    headOfficeId: '1',
    schoolId: '101',
    school: 'Windsor Park High School',
    exam: 'First Term',
    receiverType: 'Student',
    studentMark: 'Mark Sheet (All Subjects)',
    template: 'Mark Sheet Template',
    subject: 'Mathematics Mark Update',
    emailBody: 'Dear {receiver_name}, your {exam} result for {subject} is ready.',
    sendDate: '2024-02-10',
  },
  {
    sl: '02',
    headOfficeId: '1',
    schoolId: '101',
    school: 'Windsor Park High School',
    exam: 'First Term',
    receiverType: 'Parent',
    studentMark: 'Subject Wise Mark',
    template: 'Parent Notification Template',
    subject: 'Physics Mark Notification',
    emailBody: 'Dear Parent/Guardian, please review the latest mark sheet.',
    sendDate: '2024-02-11',
  },
  {
    sl: '03',
    headOfficeId: '1',
    schoolId: '101',
    school: 'Windsor Park High School',
    exam: 'Second Term',
    receiverType: 'Student',
    studentMark: 'Consolidated Mark Sheet',
    template: 'Result Alert Template',
    subject: 'Chemistry Result Published',
    emailBody: 'Hello, the result for Chemistry is available now.',
    sendDate: '2024-03-15',
  },
  {
    sl: '04',
    headOfficeId: '1',
    schoolId: '101',
    school: 'Windsor Park High School',
    exam: 'Final Term',
    receiverType: 'Parent',
    studentMark: 'Mark Sheet (All Subjects)',
    template: 'Mark Sheet Template',
    subject: 'Biology Final Result',
    emailBody: 'Dear Parent/Guardian, final exam marks are ready.',
    sendDate: '2024-04-20',
  },
  {
    sl: '05',
    headOfficeId: '1',
    schoolId: '101',
    school: 'Windsor Park High School',
    exam: 'Final Term',
    receiverType: 'Guardian',
    studentMark: 'Subject Wise Mark',
    template: 'Result Alert Template',
    subject: 'English Result Update',
    emailBody: 'Hello, your English result has been published.',
    sendDate: '2024-04-22',
  },
]
