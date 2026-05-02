import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { SidebarProvider } from './context/SidebarContext'
import Login from './pages/Login'
import ParentChildSelect from './pages/ParentChildSelect'
import Dashboard from './pages/Dashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import HeadOfficeDashboard from './pages/HeadOfficeDashboard'
import SchoolAdminDashboard from './pages/SchoolAdminDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'
import ParentDashboard from './pages/ParentDashboard'
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
import UserRoleAcl from './pages/UserRoleAcl'
import AccessDenied from './pages/AccessDenied'

import { useAuth } from './context/AuthContext'
import { can } from './utils/permissions'
import { normalizeRole } from './utils/roles'
import ProtectedRoute from './components/ProtectedRoute'
import HeadOffices from './pages/HeadOffices'
function App() {
  const { status, token, user, role, parentChildren, selectedChildId, logout } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

  const homePage = useMemo(() => {
    const backendHome = user?.homePage
    if (typeof backendHome === 'string' && backendHome.trim()) {
      // Parent "home" depends on whether a child is selected; backend can't know that local choice.
      if (backendHome === 'parent-dashboard' || backendHome === 'parent-child-select') {
        const children = Array.isArray(parentChildren) ? parentChildren : []
        if (children.length > 1 && !selectedChildId) return 'parent-child-select'
        return 'parent-dashboard'
      }
      return backendHome
    }

    const r = normalizeRole(role)
    if (r === 'SUPER_ADMIN') return 'super-admin-dashboard'
    if (r === 'HEAD_OFFICE_ADMIN') return 'head-office-dashboard'
    if (r === 'SCHOOL_ADMIN') return 'school-admin-dashboard'
    if (r === 'TEACHER') return 'teacher-dashboard'
    if (r === 'STUDENT') return 'student-dashboard'
    if (r === 'PARENT') {
      const children = Array.isArray(parentChildren) ? parentChildren : []
      if (children.length > 1 && !selectedChildId) return 'parent-child-select'
      return 'parent-dashboard'
    }
    return 'dashboard'
  }, [role, parentChildren, selectedChildId])

  useEffect(() => {
    if (status !== 'ready') return
    if (!token) {
      setCurrentPage('login')
      return
    }
    setCurrentPage((prev) => (prev === 'login' ? homePage : prev))
  }, [status, token, homePage])

  const renderPage = () => {
    const has = (perm) => can(user, perm)
    switch (currentPage) {
      case 'super-admin-dashboard':
        return (
          <ProtectedRoute user={user} role={role} allowedRoles={['SUPER_ADMIN']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        )
      case 'head-office-dashboard':
        return (
          <ProtectedRoute user={user} role={role} allowedRoles={['HEAD_OFFICE_ADMIN']}>
            <HeadOfficeDashboard />
          </ProtectedRoute>
        )
      case 'head-offices':
        return (
          <ProtectedRoute user={user} role={role} permission={['HEAD_OFFICE_MANAGE', '*']}>
            <HeadOffices />
          </ProtectedRoute>
        )
      case 'school-admin-dashboard':
        return (
          <ProtectedRoute user={user} role={role} allowedRoles={['SCHOOL_ADMIN']}>
            <SchoolAdminDashboard />
          </ProtectedRoute>
        )
      case 'teacher-dashboard':
        return (
          <ProtectedRoute user={user} role={role} allowedRoles={['TEACHER']}>
            <TeacherDashboard />
          </ProtectedRoute>
        )
      case 'student-dashboard':
        return (
          <ProtectedRoute user={user} role={role} allowedRoles={['STUDENT']}>
            <StudentDashboard />
          </ProtectedRoute>
        )
      case 'parent-dashboard':
        return (
          <ProtectedRoute user={user} role={role} allowedRoles={['PARENT']}>
            <ParentDashboard />
          </ProtectedRoute>
        )
      case 'parent-child-select':
        return (
          <ProtectedRoute user={user} role={role} allowedRoles={['PARENT']}>
            <ParentChildSelect onDone={() => setCurrentPage('parent-dashboard')} />
          </ProtectedRoute>
        )
      case 'user-role-acl':
        return has(['RBAC_MANAGE', 'SCHOOL_RBAC_MANAGE', '*']) ? <UserRoleAcl /> : <AccessDenied />
      case 'teacher-department':
        return <TeacherDepartment />
      
      case 'student-list':
        return <StudentList onNavigate={setCurrentPage} />
      case 'admit-card-setting':
        return <AdmitCardSetting />
      case 'bulk-admission':
        return <BulkAdmission onNavigate={setCurrentPage} />
      case 'manage-teacher':
        return <ManageTeacher />
      case 'class-lecture':
        return <ClassLecture />
      case 'rating':
        return <Rating />
      case 'manage-designation':
        return <ManageDesignation />  
      case 'manage-employee':
        return <ManageEmployee />
      case 'visitor-purpose':
        return <VisitorPurpose />
      case 'call-log':
        return <CallLog />
      case 'visitor-info':
        return <VisitorInfo />
      case 'postal-dispatch':
        return <PostalDispatch />
      case 'postal-receive':
        return <PostalReceive />
      case 'complain-type':
        return <ComplainType />
      case 'manage-complain':
        return <ManageComplain />
      case 'notice':
        return <Notice />
      case 'news':
        return <News />
      case 'holiday':
        return <Holiday />
      case 'event':
        return <Event />
      case 'gallery':
        return <Gallery />
      case 'images':
        return <Images />
      case 'videos':
        return <Videos />
      case 'student-type':
        return <StudentType />
      case 'online-admission':
        return <OnlineAdmission />
      case 'student-activity':
        return <StudentActivity />
      case 'student-attendance':
        return <StudentAttendance />
      case 'teacher-attendance':
        return <TeacherAttendance />
      case 'employee-attendance':
        return <EmployeeAttendance />
      case 'absent-email':
        return <AbsentEmail />
      case 'absent-sms':
        return <AbsentSMS />
      case 'promotion':
        return <Promotion />
      case 'id-card-setting':
        return <IdCardSetting />
      case 'certificate-type':
        return <CertificateType />
      case 'generate-certificate':
        return <GenerateCertificate />
        case 'candidate':
                return <Candidate />
        case 'donar':
                return <Donar />
        case 'scholarship':
                return <Scholarship />
        case 'guardian':
                return <Guardian />
        case 'class':
                return <Class/>
        case 'section':
                return <Section/>
        case 'subject':
                return <Subject/>
        case 'syllabus':
                return <Syllabus/>
        case 'study-material':
                return <StudyMaterial/>
        case 'live-class':
                return <Liveclass/>
      case 'assignment':
        return <Assignment />
      case 'submission':
        return <Submission />
        case 'lesson':
                return <Lesson/>
        case 'topic':
                return <Topic/>
        case 'lesson-timeline':
                return <LessonTimeline/>
        case 'lesson-status':
                return <LessonStatus/>
        case 'lesson-plan':
                return <LessonPlan/>
        case 'class-routine':
                return <ClassRoutine/>
        case 'exam-instruction':
                return <ExamInstruction/>
        case 'question-bank':
                return <QuestionBank/>
        case 'onlineexam':
                return <OnlineExam/>
        case 'exam-result':
                return <ExamResult/>
        case 'exam-grade':
                return <ExamGrade/>
        case 'exam-term':
                return <ExamTerm/>
        case 'schedule':
                return <Schedule/>
        case 'suggestion':
                return <Suggestion/>
        case 'attendance':
                return <Attendance/>
        case 'manage-mark':
                return <Managemark/>
        case 'exam-term-result':
                return <Examtermresult/>
        case 'exam-final-result':
                return <Examfinalresult/>
        case 'merit-list':
                return <MeritList/>
        case 'mark-sheet':
                return <MarkSheet/>
        case 'result-card':
                return <ResultCard/>
        case 'mark-send-email':
                return <MarkSendByEmail/>
        case 'mark-send-sms':
                return <MarkSendBySMS/>
        case 'result-email':
                return <ResultEmail/>
        case 'result-sms':
                return <ResultSMS/>
        case 'leave-type':
                return <LeaveType/>
        case 'leave-application':
                return <LeaveApplication/>
        case 'waiting-application':
                return <WaitingApplication/>
        case 'approved-application':
                return <ApprovedApplication/>
        case 'declined-application':
                return <DeclineApplication/>
        case 'salary-grade':
                return <SalaryGrade/>
        case 'salary-payment':
                return <SalaryPayment/>
        case 'salary-history':
                return <SalaryHistory/>
        case 'discount':
                return <Discount/>
        case 'fee-type':
                return <FeeType/>
        case 'fee-collection':
                return <FeeCollection/>
        case 'manage-school':
                return (
                  <ProtectedRoute user={user} role={role} permission={['SCHOOL_MANAGE', '*']}>
                    <ManageSchool />
                  </ProtectedRoute>
                )
        case 'payment-setting':
                return <PaymentSetting/>
        case 'sms-setting':
                return <SmsSetting/>
      default:
        return <Dashboard />
    }
  }

  if (status !== 'ready') return null

  if (!token || currentPage === 'login') {
    return (
      <Login
        onSuccess={() => {
          setCurrentPage(homePage)
        }}
      />
    )
  }

  return (
    <SidebarProvider>
      <Sidebar onNavigate={setCurrentPage} currentPage={currentPage} user={user} onLogout={logout} />

      <main className="dashboard-main">
        <Topbar user={user} onLogout={logout} />
        {renderPage()}
      </main>
    </SidebarProvider>
  )
}

export default App
