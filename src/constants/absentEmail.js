export const ABSENT_EMAIL_EDIT_STORAGE_KEY = 'edit-absent-email-row'
export const ABSENT_EMAIL_ROWS_STORAGE_KEY = 'absent-email-rows'

export const absentEmailReceiverOptionsMap = {
  Student: ['Alice Brown', 'Michael Brown', 'Sophia Wilson', 'David Johnson', 'Emma Davis'],
  Parent: ['Mr. Brown', 'Mrs. Brown', 'Mrs. Wilson', 'Mr. Johnson', 'Mrs. Davis'],
  Guardian: ['Guardian - Alice', 'Guardian - Michael', 'Guardian - Sophia'],
}

export const absentEmailTemplateOptions = {
  'Absent Alert Template': {
    subject: 'Absent Notification for {student_name}',
    emailBody:
      'Dear {receiver_name},\n\nThis is to inform you that {student_name} was absent on {absent_date} in {class_name} - {section_name}.\n\nRegards,\n{school_name}',
  },
  'Parent Notice Template': {
    subject: 'Attendance Alert - {student_name}',
    emailBody:
      'Hello {receiver_name},\n\nPlease note that {student_name} was marked absent on {absent_date}.\n\nSchool: {school_name}\nClass: {class_name}\nSection: {section_name}\n\nThank you.',
  },
  'Guardian Follow-up Template': {
    subject: 'Follow-up on Absence - {student_name}',
    emailBody:
      'Dear {receiver_name},\n\nWe would like to inform you that {student_name} was absent on {absent_date}. Kindly ensure regular attendance.\n\nRegards,\n{school_name}',
  },
}

export const absentEmailEmptyForm = {
  school: '',
  receiverType: '',
  receiver: '',
  template: '',
  absentDate: '',
  subject: '',
  emailBody: '',
}
