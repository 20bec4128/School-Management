import AccessDenied from './pages/AccessDenied'
import Dashboard from './pages/Dashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import HeadOfficeDashboard from './pages/HeadOfficeDashboard'
import SchoolAdminDashboard from './pages/SchoolAdminDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'
import ParentDashboard from './pages/ParentDashboard'
import LmsDashboard from './pages/LmsDashboard'
import HeadOffices from './pages/HeadOffices'
import UserRoleAcl from './pages/UserRoleAcl'
import TeacherDepartment from './pages/TeacherDepartment'
import StudentList from './pages/StudentList'
import ManageTeacher from './pages/Manageteacher'
import ClassLecture from './pages/ClassLecture'
import Rating from './pages/Rating'
import ManageDesignation from './pages/Managedesignation'
import ManageEmployee from './pages/ManageEmployee'
import VisitorPurpose from './pages/VisitorPurpose'
import CallLog from './pages/CallLog'
import VisitorInfo from './pages/VisiterInfo'
import PostalDispatch from './pages/PostalDispatch'
import PostalReceive from './pages/PostalReceive'
import ComplainType from './pages/ComplainType'
import ManageComplain from './pages/ManageComplain'
import Notice from './pages/Notice'
import News from './pages/News'
import Holiday from './pages/Holiday'
import Event from './pages/Event'
import Gallery from './pages/Gallery'
import Images from './pages/Images'
import Videos from './pages/Videos'
import StudentType from './pages/StudentType'
import BulkAdmission from './pages/BulkAdmission'
import OnlineAdmission from './pages/OnlineAdmission'
import StudentActivity from './pages/StudentActivity'
import StudentAttendance from './pages/StudentAttendance'
import TeacherAttendance from './pages/TeacherAttendance'
import EmployeeAttendance from './pages/EmployeeAttendance'
import AbsentEmail from './pages/AbsentEmail'
import AbsentSMS from './pages/AbsentSMS'
import Promotion from './pages/Promotion'
import IdCardSetting from './pages/IdCardSetting'
import AdmitCardSetting from './pages/AdmitCardSetting'
import CertificateType from './pages/CertificateType'
import GenerateCertificate from './pages/GenerateCertificate'
import Candidate from './pages/Candidate'
import Donar from './pages/Donar'
import Scholarship from './pages/Scholarship'
import Guardian from './pages/Guardian'
import Class from './pages/Class'
import Section from './pages/Section'
import Subject from './pages/Subject'
import Syllabus from './pages/Syllabus'
import StudyMaterial from './pages/StudyMaterial'
import Liveclass from './pages/Liveclass'
import Assignment from './pages/Assignment'
import Submission from './pages/Submission'
import Lesson from './pages/Lesson'
import Topic from './pages/Topic'
import LessonTimeline from './pages/LessonTimeline'
import LessonStatus from './pages/LessonStatus'
import LessonPlan from './pages/LessonPlan'
import ClassRoutine from './pages/ClassRoutine'
import ExamInstruction from './pages/ExamInstruction'
import QuestionBank from './pages/QuestionBank'
import OnlineExam from './pages/OnlineExam'
import ExamResult from './pages/ExamResult'
import ExamGrade from './pages/ExamGrade'
import ExamTerm from './pages/ExamTerm'
import Schedule from './pages/Schedule'
import Suggestion from './pages/Suggestion'
import Attendance from './pages/Attendence'
import Managemark from './pages/Managemark'
import Examtermresult from './pages/Examtermresult'
import Examfinalresult from './pages/Examfinalresult'
import MeritList from './pages/MeritList'
import MarkSheet from './pages/MarkSheet'
import ResultCard from './pages/ResultCard'
import MarkSendByEmail from './pages/MarkSendByEmail'
import MarkSendBySMS from './pages/MarkSendBySMS'
import ResultEmail from './pages/ResultEmail'
import ResultSMS from './pages/ResultSMS'
import LeaveType from './pages/LeaveType'
import LeaveApplication from './pages/LeaveApplication'
import WaitingApplication from './pages/WaitingApplication'
import ApprovedApplication from './pages/ApprovedApplication'
import DeclineApplication from './pages/DeclineApplication'
import SalaryPayment from './pages/SalaryPayment'
import SalaryGrade from './pages/SalaryGrade'
import SalaryHistory from './pages/SalaryHistory'
import Discount from './pages/Discount'
import FeeType from './pages/FeeType'
import FeeCollection from './pages/FeeCollection'
import ManageSchool from './pages/ManageSchool'
import PaymentSetting from './pages/PaymentSetting'
import SmsSetting from './pages/SmsSetting'
import ProtectedRoute from './components/ProtectedRoute'
import { canAccessPage } from './utils/pageAccess'
import { normalizeRole } from './utils/roles'

const routeEntries = [
  { pageKey: 'super-admin-dashboard', component: SuperAdminDashboard, allowedRoles: ['SUPER_ADMIN'] },
  { pageKey: 'head-office-dashboard', component: HeadOfficeDashboard, allowedRoles: ['HEAD_OFFICE_ADMIN'] },
  { pageKey: 'head-offices', component: HeadOffices, permission: ['HEAD_OFFICE_MANAGE', '*'] },
  { pageKey: 'school-admin-dashboard', component: SchoolAdminDashboard, allowedRoles: ['SCHOOL_ADMIN'] },
  { pageKey: 'teacher-dashboard', component: TeacherDashboard, allowedRoles: ['TEACHER'] },
  { pageKey: 'student-dashboard', component: StudentDashboard, allowedRoles: ['STUDENT'] },
  { pageKey: 'parent-dashboard', component: ParentDashboard, allowedRoles: ['PARENT'] },
  { pageKey: 'lms-dashboard', component: LmsDashboard },
  { pageKey: 'user-role-acl', component: UserRoleAcl, permission: ['RBAC_MANAGE', 'SCHOOL_RBAC_MANAGE', '*'] },
  { pageKey: 'teacher-department', component: TeacherDepartment },
  { pageKey: 'student-list', component: StudentList },
  { pageKey: 'admit-card-setting', component: AdmitCardSetting },
  { pageKey: 'bulk-admission', component: BulkAdmission },
  { pageKey: 'manage-teacher', component: ManageTeacher },
  { pageKey: 'class-lecture', component: ClassLecture },
  { pageKey: 'rating', component: Rating },
  { pageKey: 'manage-designation', component: ManageDesignation },
  { pageKey: 'manage-employee', component: ManageEmployee },
  { pageKey: 'visitor-purpose', component: VisitorPurpose },
  { pageKey: 'call-log', component: CallLog },
  { pageKey: 'visitor-info', component: VisitorInfo },
  { pageKey: 'postal-dispatch', component: PostalDispatch },
  { pageKey: 'postal-receive', component: PostalReceive },
  { pageKey: 'complain-type', component: ComplainType },
  { pageKey: 'manage-complain', component: ManageComplain },
  { pageKey: 'notice', component: Notice },
  { pageKey: 'news', component: News },
  { pageKey: 'holiday', component: Holiday },
  { pageKey: 'event', component: Event },
  { pageKey: 'gallery', component: Gallery },
  { pageKey: 'images', component: Images },
  { pageKey: 'videos', component: Videos },
  { pageKey: 'student-type', component: StudentType },
  { pageKey: 'online-admission', component: OnlineAdmission },
  { pageKey: 'student-activity', component: StudentActivity },
  { pageKey: 'student-attendance', component: StudentAttendance },
  { pageKey: 'teacher-attendance', component: TeacherAttendance },
  { pageKey: 'employee-attendance', component: EmployeeAttendance },
  { pageKey: 'absent-email', component: AbsentEmail },
  { pageKey: 'absent-sms', component: AbsentSMS },
  { pageKey: 'promotion', component: Promotion },
  { pageKey: 'id-card-setting', component: IdCardSetting },
  { pageKey: 'certificate-type', component: CertificateType },
  { pageKey: 'generate-certificate', component: GenerateCertificate },
  { pageKey: 'candidate', component: Candidate },
  { pageKey: 'donar', component: Donar },
  { pageKey: 'scholarship', component: Scholarship },
  { pageKey: 'guardian', component: Guardian },
  { pageKey: 'class', component: Class },
  { pageKey: 'section', component: Section },
  { pageKey: 'subject', component: Subject },
  { pageKey: 'syllabus', component: Syllabus },
  { pageKey: 'study-material', component: StudyMaterial },
  { pageKey: 'live-class', component: Liveclass },
  { pageKey: 'assignment', component: Assignment },
  { pageKey: 'submission', component: Submission },
  { pageKey: 'lesson', component: Lesson },
  { pageKey: 'topic', component: Topic },
  { pageKey: 'lesson-timeline', component: LessonTimeline },
  { pageKey: 'lesson-status', component: LessonStatus },
  { pageKey: 'lesson-plan', component: LessonPlan },
  { pageKey: 'class-routine', component: ClassRoutine },
  { pageKey: 'exam-instruction', component: ExamInstruction },
  { pageKey: 'question-bank', component: QuestionBank },
  { pageKey: 'onlineexam', component: OnlineExam },
  { pageKey: 'exam-result', component: ExamResult },
  { pageKey: 'exam-grade', component: ExamGrade },
  { pageKey: 'exam-term', component: ExamTerm },
  { pageKey: 'schedule', component: Schedule },
  { pageKey: 'suggestion', component: Suggestion },
  { pageKey: 'attendance', component: Attendance },
  { pageKey: 'manage-mark', component: Managemark },
  { pageKey: 'exam-term-result', component: Examtermresult },
  { pageKey: 'exam-final-result', component: Examfinalresult },
  { pageKey: 'merit-list', component: MeritList },
  { pageKey: 'mark-sheet', component: MarkSheet },
  { pageKey: 'result-card', component: ResultCard },
  { pageKey: 'mark-send-email', component: MarkSendByEmail },
  { pageKey: 'mark-send-sms', component: MarkSendBySMS },
  { pageKey: 'result-email', component: ResultEmail },
  { pageKey: 'result-sms', component: ResultSMS },
  { pageKey: 'leave-type', component: LeaveType },
  { pageKey: 'leave-application', component: LeaveApplication },
  { pageKey: 'waiting-application', component: WaitingApplication },
  { pageKey: 'approved-application', component: ApprovedApplication },
  { pageKey: 'declined-application', component: DeclineApplication },
  { pageKey: 'salary-grade', component: SalaryGrade },
  { pageKey: 'salary-payment', component: SalaryPayment },
  { pageKey: 'salary-history', component: SalaryHistory },
  { pageKey: 'discount', component: Discount },
  { pageKey: 'fee-type', component: FeeType },
  { pageKey: 'fee-collection', component: FeeCollection },
  { pageKey: 'manage-school', component: ManageSchool, permission: ['SCHOOL_MANAGE', 'HEAD_OFFICE_SCHOOL_MANAGE', '*'] },
  { pageKey: 'payment-setting', component: PaymentSetting, permission: ['SCHOOL_MANAGE', 'HEAD_OFFICE_SCHOOL_MANAGE', '*'] },
  { pageKey: 'sms-setting', component: SmsSetting, permission: ['SCHOOL_MANAGE', 'HEAD_OFFICE_SCHOOL_MANAGE', '*'] },
]

const AppRoute = ({ currentPage, user, role, parentChildren, selectedChildId, onNavigate }) => {
  const normalizedRole = normalizeRole(role || user?.role || user?.userRole || user?.authority)
  const homePage = (() => {
    const r = normalizeRole(role || user?.role || user?.userRole || user?.authority)
    if (r === 'SUPER_ADMIN') return 'super-admin-dashboard'
    if (r === 'HEAD_OFFICE_ADMIN') return 'head-office-dashboard'
    if (r === 'SCHOOL_ADMIN') return 'school-admin-dashboard'
    if (r === 'TEACHER') return 'teacher-dashboard'
    if (r === 'STUDENT') return 'student-dashboard'
    if (r === 'PARENT') return 'parent-dashboard'
    return 'dashboard'
  })()
  const effectivePage = currentPage === 'dashboard' ? homePage : currentPage
  const entry = routeEntries.find((item) => item.pageKey === effectivePage)

  if (!entry) return <Dashboard />

  const PageComponent = entry.component
  const content = <PageComponent onNavigate={onNavigate} />

  if (!canAccessPage(user, effectivePage)) {
    return <AccessDenied />
  }

  return (
    <ProtectedRoute user={user} role={normalizedRole} allowedRoles={entry.allowedRoles} permission={entry.permission}>
      {content}
    </ProtectedRoute>
  )
}

export default AppRoute
