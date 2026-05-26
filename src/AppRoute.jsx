import { lazy } from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import { normalizeRole } from './utils/roles'

const SchoolAdminDashboard = lazy(() => import("./pages/SchoolAdminDashboard"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const ParentDashboard = lazy(() => import("./pages/ParentDashboard"));
const LmsDashboard = lazy(() => import("./pages/LmsDashboard"));
const HeadOffices = lazy(() => import("./pages/HeadOffices"));
const RoleTable = lazy(() => import("./pages/RoleTable"));
const RolePermissionSetting = lazy(() => import("./pages/RolePermissionSetting"));
const TeacherDepartment = lazy(() => import("./pages/TeacherDepartment"));
const StudentList = lazy(() => import("./pages/StudentList"));
const AddStudent = lazy(() => import("./pages/AddStudent"));
const AddStudentActivity = lazy(() => import("./pages/AddStudentActivity"));

const AddLesson = lazy(() => import("./pages/AddLesson"));
const EditLesson = lazy(() => import("./pages/EditLesson"));
const ManageTeacher = lazy(() => import("./pages/Manageteacher"));
const AddTeacher = lazy(() => import("./pages/AddTeacher"));

const ClassLecture = lazy(() => import("./pages/ClassLecture"));
const Rating = lazy(() => import("./pages/Rating"));
const ManageDesignation = lazy(() => import("./pages/Managedesignation"));
const ManageEmployee = lazy(() => import("./pages/ManageEmployee"));
const VisitorPurpose = lazy(() => import("./pages/VisitorPurpose"));
const CallLog = lazy(() => import("./pages/CallLog"));
const VisitorInfo = lazy(() => import("./pages/VisiterInfo"));
const PostalDispatch = lazy(() => import("./pages/PostalDispatch"));
const PostalReceive = lazy(() => import("./pages/PostalReceive"));
const ComplainType = lazy(() => import("./pages/ComplainType"));
const ManageComplain = lazy(() => import("./pages/ManageComplain"));
const AddComplain = lazy(() => import("./pages/AddComplain"));
const Notice = lazy(() => import("./pages/Notice"));
const News = lazy(() => import("./pages/News"));
const AddNews = lazy(() => import("./pages/AddNews.jsx"));
const Holiday = lazy(() => import("./pages/Holiday"));
const AddHoliday = lazy(() => import("./pages/AddHoliday.jsx"));
const Event = lazy(() => import("./pages/Event"));
const Gallery = lazy(() => import("./pages/Gallery"));
const AddGallery = lazy(() => import("./pages/AddGallery.jsx"));
const Images = lazy(() => import("./pages/Images"));
const AddImages = lazy(() => import("./pages/AddImages.jsx"));
const Videos = lazy(() => import("./pages/Videos"));
const AddVideos = lazy(() => import("./pages/AddVideos.jsx"));
const StudentType = lazy(() => import("./pages/StudentType"));
const BulkAdmission = lazy(() => import("./pages/BulkAdmission"));
const OnlineAdmission = lazy(() => import("./pages/OnlineAdmission"));
const StudentActivity = lazy(() => import("./pages/StudentActivity"));
const StudentAttendance = lazy(() => import("./pages/StudentAttendance"));
const TeacherAttendance = lazy(() => import("./pages/TeacherAttendance"));
const EmployeeAttendance = lazy(() => import("./pages/EmployeeAttendance"));
const AbsentEmail = lazy(() => import("./pages/AbsentEmail"));
const AddAbsentEmail = lazy(() => import("./pages/AddAbsentEmail"));
const AbsentSMS = lazy(() => import("./pages/AbsentSMS"));
const Promotion = lazy(() => import("./pages/Promotion"));
const IdCardSetting = lazy(() => import("./pages/IdCardSetting"));
const AdmitCardSetting = lazy(() => import("./pages/AdmitCardSetting"));
const AdmitCardSettingCreate = lazy(() => import("./pages/AdmitCardSettingCreate"));
const CertificateType = lazy(() => import("./pages/CertificateType"));
const CertificateTypeCreate = lazy(() => import("./pages/CertificateTypeCreate"));
const GenerateCertificate = lazy(() => import("./pages/GenerateCertificate"));
const Candidate = lazy(() => import("./pages/Candidate"));
const CandidateCreate = lazy(() => import("./pages/CandidateCreate"));
const Donar = lazy(() => import("./pages/Donar"));
const AddDonor = lazy(() => import("./pages/AddDonor"));
const Scholarship = lazy(() => import("./pages/Scholarship"));
const AddScholarship = lazy(() => import("./pages/AddScholarship"));
const Guardian = lazy(() => import("./pages/Guardian"));
const AddGuardian = lazy(() => import("./pages/AddGuardian"));
const Class = lazy(() => import("./pages/Class"));
const Section = lazy(() => import("./pages/Section"));
const Subject = lazy(() => import("./pages/Subject"));
const AddSubject = lazy(() => import("./pages/AddSubject"));

const Syllabus = lazy(() => import("./pages/Syllabus"));
const AddSyllabus = lazy(() => import("./pages/AddSyllabus"));
const StudyMaterial = lazy(() => import("./pages/StudyMaterial"));
const AddStudyMaterial = lazy(() => import("./pages/AddStudyMaterial"));
const Liveclass = lazy(() => import("./pages/Liveclass"));
const AddLiveClass = lazy(() => import("./pages/AddLiveClass"));
const Assignment = lazy(() => import("./pages/Assignment"));
const AddAssignment = lazy(() => import("./pages/AddAssignment"));
const Submission = lazy(() => import("./pages/Submission"));
const AddQuestionBank = lazy(() => import("./pages/AddQuestionBank"));
const Lesson = lazy(() => import("./pages/Lesson"));
const Topic = lazy(() => import("./pages/Topic"));
const LessonTimeline = lazy(() => import("./pages/LessonTimeline"));
const LessonStatus = lazy(() => import("./pages/LessonStatus"));
const LessonPlan = lazy(() => import("./pages/LessonPlan"));
const ClassRoutine = lazy(() => import("./pages/ClassRoutine"));
const ExamInstruction = lazy(() => import("./pages/ExamInstruction"));
const QuestionBank = lazy(() => import("./pages/QuestionBank"));
const OnlineExam = lazy(() => import("./pages/OnlineExam"));
const AddOnlineExam = lazy(() => import("./pages/AddOnlineExam"));
const ExamResult = lazy(() => import("./pages/ExamResult"));
const ExamGrade = lazy(() => import("./pages/ExamGrade"));
const ExamTerm = lazy(() => import("./pages/ExamTerm"));
const Schedule = lazy(() => import("./pages/Schedule"));
const ScheduleCreate = lazy(() => import("./pages/ScheduleCreate"));
const Suggestion = lazy(() => import("./pages/Suggestion"));
const SuggestionCreate = lazy(() => import("./pages/SuggestionCreate"));
const Attendance = lazy(() => import("./pages/Attendence"));
const Managemark = lazy(() => import("./pages/Managemark"));
const Examtermresult = lazy(() => import("./pages/Examtermresult"));
const Examfinalresult = lazy(() => import("./pages/Examfinalresult"));
const MeritList = lazy(() => import("./pages/MeritList"));
const MarkSheet = lazy(() => import("./pages/MarkSheet"));
const ResultCard = lazy(() => import("./pages/ResultCard"));
const MarkSendByEmail = lazy(() => import("./pages/MarkSendByEmail"));
const MarkSendByEmailCreate = lazy(() => import("./pages/MarkSendByEmailCreate"));
const MarkSendBySMS = lazy(() => import("./pages/MarkSendBySMS"));
const MarkSendBySMSCreate = lazy(() => import("./pages/MarkSendBySMSCreate"));
const ResultEmail = lazy(() => import("./pages/ResultEmail"));
const ResultEmailCreate = lazy(() => import("./pages/ResultEmailCreate"));
const ResultSMS = lazy(() => import("./pages/ResultSMS"));
const ResultSmsCreate = lazy(() => import("./pages/ResultSmsCreate"));
const LeaveType = lazy(() => import("./pages/LeaveType"));
const AddLeaveType = lazy(() => import("./pages/AddLeaveType"));
const LeaveApplication = lazy(() => import("./pages/LeaveApplication"));
const AddLeaveApplication = lazy(() => import("./pages/AddLeaveApplication"));
const WaitingApplication = lazy(() => import("./pages/WaitingApplication"));
const ApprovedApplication = lazy(() => import("./pages/ApprovedApplication"));
const DeclineApplication = lazy(() => import("./pages/DeclineApplication"));
const SalaryPayment = lazy(() => import("./pages/SalaryPayment"));
const SalaryGrade = lazy(() => import("./pages/SalaryGrade"));
const AddSalaryGrade = lazy(() => import("./pages/AddSalaryGrade"));
const SalaryHistory = lazy(() => import("./pages/SalaryHistory"));
const Discount = lazy(() => import("./pages/Discount"));
const FeeType = lazy(() => import("./pages/FeeType"));
const FeeCollection = lazy(() => import("./pages/FeeCollection"));
const AddFeeCollection = lazy(() => import("./pages/AddFeeCollection"));
const AddBulkInvoice = lazy(() => import("./pages/AddBulkInvoice"));
const ManageSchool = lazy(() => import("./pages/ManageSchool"));
const AcademicYear = lazy(() => import("./pages/AcademicYear"));
const PaymentSetting = lazy(() => import("./pages/PaymentSetting"));
const PaymentSettingCreate = lazy(() => import("./pages/PaymentSettingCreate"));
const EmailSetting = lazy(() => import("./pages/EmailSetting"));
const EmailSettingCreate = lazy(() => import("./pages/EmailSettingCreate"));
const SmsSetting = lazy(() => import("./pages/SmsSetting"));
const SmsSettingCreate = lazy(() => import("./pages/SmsSettingCreate"));
const DueInvoice = lazy(() => import("./pages/DueInvoice"));
const ManageInvoice = lazy(() => import("./pages/ManageInvoice"));
const DueReceipt = lazy(() => import("./pages/DueReceipt"));
const PaidReceipt = lazy(() => import("./pages/PaidReceipt"));
const DueFeeEmail = lazy(() => import("./pages/DueFeeEmail"));
const DueFeeSMS = lazy(() => import("./pages/DueFeeSMS"));
const IncomeHead = lazy(() => import("./pages/IncomeHead"));
const Income = lazy(() => import("./pages/Income"));
const ExpenditureHead = lazy(() => import("./pages/ExpenditureHead"));
const Expenditure = lazy(() => import("./pages/Expenditure"));
const AddExpenditure = lazy(() => import("./pages/AddExpenditure"));
const IncomeReport = lazy(() => import("./pages/IncomeReport"));
const ExpenditureReport = lazy(() => import("./pages/ExpenditureReport"));
const InvoiceReport = lazy(() => import("./pages/InvoiceReport"));
const DueFeeReport = lazy(() => import("./pages/DueFeeReport"));
const FeeCollectionReport = lazy(() => import("./pages/FeeCollectionReport"));
const AccountingBalanceReport = lazy(() => import("./pages/AccountingBalanceReport"));
const LibraryReport = lazy(() => import("./pages/LibraryReport"));
const StudentAttendanceReport = lazy(() => import("./pages/StudentAttendanceReport"));
const StudentYearlyAttendanceReport = lazy(() => import("./pages/StudentYearlyAttendanceReport"));
const TeacherAttendanceReport = lazy(() => import("./pages/TeacherAttendanceReport"));
const TeacherYearlyAttendanceReport = lazy(() => import("./pages/TeacherYearlyAttendanceReport"));
const EmployeeAttendanceReport = lazy(() => import("./pages/EmployeeAttendanceReport"));
const EmployeeYearlyAttendanceReport = lazy(() => import("./pages/EmployeeYearlyAttendanceReport"));
const StudentReport = lazy(() => import("./pages/StudentReport"));
const StudentInvoiceReport = lazy(() => import("./pages/StudentInvoiceReport"));
const StudentActivityReport = lazy(() => import("./pages/StudentActivityReport"));
const PayrollReport = lazy(() => import("./pages/PayrollReport"));
const DailyTransactionReport = lazy(() => import("./pages/DailyTransactionReport"));
const DailyStatementReport = lazy(() => import("./pages/DailyStatementReport"));
const ExamResultReport = lazy(() => import("./pages/ExamResultReport"));
const Supplier = lazy(() => import("./pages/Supplier"));
const Warehouse = lazy(() => import("./pages/Warehouse"));
const Category = lazy(() => import("./pages/Category"));
const Product = lazy(() => import("./pages/Product"));
const Purchase = lazy(() => import("./pages/Purchase.jsx"));
const AddPurchase = lazy(() => import("./pages/AddPurchase.jsx"));
const Sale = lazy(() => import("./pages/Sale"));
const Issue = lazy(() => import("./pages/Issue"));
const AddIssue = lazy(() => import("./pages/AddIssue.jsx"));
const AddVendor = lazy(() => import("./pages/AddVendor.jsx"));
const SaleCreate = lazy(() => import("./pages/SaleCreate"));
const Vendor = lazy(() => import("./pages/Vendor"));
const AssetStore = lazy(() => import("./pages/AssetStore"));
const AssetCategory = lazy(() => import("./pages/AssetCategory"));
const AssetItem = lazy(() => import("./pages/AssetItem"));
const AssetPurchase = lazy(() => import("./pages/AssetPurchase"));
const AssetIssue = lazy(() => import("./pages/AssetIssue"));
const AssetReturn = lazy(() => import("./pages/AssetReturn"));
const AssetReport = lazy(() => import("./pages/AssetReport"));
const AssetVendorCreate = lazy(() => import("./pages/AssetVendorCreate"));
const AssetStoreCreate = lazy(() => import("./pages/AssetStoreCreate"));
const AssetItemCreate = lazy(() => import("./pages/AssetItemCreate"));
const AssetPurchaseCreate = lazy(() => import("./pages/AssetPurchaseCreate"));
const Book = lazy(() => import("./pages/Book.jsx"));
const BookCreate = lazy(() => import("./pages/BookCreate.jsx"));
const LibraryMember = lazy(() => import("./pages/LibraryMember.jsx"));
const IssueReturn = lazy(() => import("./pages/IssueReturn.jsx"));
const IssueBookCreate = lazy(() => import("./pages/IssueBookCreate.jsx"));
const NonLibraryMember = lazy(() => import("./pages/NonLibraryMember.jsx"));
const EBook = lazy(() => import("./pages/EBook.jsx"));
const EBookCreate = lazy(() => import("./pages/EBookCreate.jsx.jsx"));
const Vehicle = lazy(() => import("./pages/Vehicle.jsx"));
const TransportRoute = lazy(() => import("./pages/TransportRoute.jsx"));
const TransportRouteCreate = lazy(() => import("./pages/TransportRouteCreate.jsx"));
const TransportMember = lazy(() => import("./pages/TransportMember.jsx"));
const NonTransportMember = lazy(() => import("./pages/NonTransportMember.jsx"));
const VehicleCreate = lazy(() => import("./pages/VehicleCreate.jsx"));
const ManageHostel = lazy(() => import("./pages/ManageHostel.jsx"));
const HostelCreate = lazy(() => import("./pages/HostelCreate.jsx"));
const ManageRoom = lazy(() => import("./pages/ManageRoom.jsx"));
const RoomCreate = lazy(() => import("./pages/RoomCreate.jsx"));
const HostelMember = lazy(() => import("./pages/HostelMember.jsx"));
const NonHostelMember = lazy(() => import("./pages/NonHostelMember.jsx"));
const Email = lazy(() => import("./pages/Email.jsx"));
const EmailCreate = lazy(() => import("./pages/EmailCreate.jsx"));
const SMS = lazy(() => import("./pages/SMS.jsx"));
const SMSCreate = lazy(() => import("./pages/SMSCreate.jsx"));
const FrontendPage = lazy(() => import("./pages/FrontendPage.jsx"));
const FrontendPageCreate = lazy(() => import("./pages/FrontendPageCreate.jsx"));
const Slider = lazy(() => import("./pages/Slider.jsx"));
const SliderCreate = lazy(() => import("./pages/SliderCreate.jsx"));
const AboutSchool = lazy(() => import("./pages/AboutSchool.jsx"));
const AboutSchoolEdit = lazy(() => import("./pages/AboutSchoolEdit.jsx"));
const ManageAward = lazy(() => import("./pages/ManageAward.jsx"));
const AwardCreate = lazy(() => import("./pages/AwardCreate.jsx"));
const TodoCreate = lazy(() => import("./pages/TodoCreate.jsx"));
const ManageTodo = lazy(() => import("./pages/ManageTodo.jsx"));
const FAQ = lazy(() => import("./pages/FAQ.jsx"));
const SubscriptionFAQ = lazy(() => import("./pages/SubscriptionFAQ.jsx"));
const SubscriptionSlider = lazy(() => import("./pages/SubscriptionSlider.jsx"));
const SubscriptionSetting = lazy(() => import("./pages/SubscriptionSetting.jsx"));
const SubscriptionPlan = lazy(() => import("./pages/SubscriptionPlan.jsx"));
const SchoolSubscription = lazy(() => import("./pages/SchoolSubscription.jsx"));
const GeneralSetting = lazy(() => import("./pages/GeneralSetting.jsx"));
const AddSchool = lazy(() => import("./pages/AddSchool.jsx"));
const AddVisitorInfo = lazy(() => import("./pages/AddVisitorInfo.jsx"));
const AddCallLog = lazy(() => import("./pages/AddCallLog.jsx"));
const AddPostalDispatch = lazy(() => import("./pages/AddPostalDispatch.jsx"));
const AddNotice = lazy(() => import("./pages/AddNotice.jsx"));
const AddEvent = lazy(() => import("./pages/AddEvent.jsx"));
const AddPostalReceive = lazy(() => import("./pages/AddPostalReceive.jsx"));
const AddSubmission = lazy(() => import("./pages/AddSubmission.jsx"));
const AddClassLecture = lazy(() => import("./pages/AddClassLecture.jsx"));
const AddTopic = lazy(() => import("./pages/AddTopic.jsx"));
const AddManageDesignation = lazy(() => import("./pages/AddManageDesignation.jsx"));
const AddManageEmployee = lazy(() => import("./pages/AddManageEmployee.jsx"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin.jsx"));
const SuperAdminCreate = lazy(() => import("./pages/SuperAdminCreate.jsx"));
const ManageFeedback = lazy(() => import("./pages/ManageFeedback.jsx"));
const BackupDatabase = lazy(() => import("./pages/BackupDatabase.jsx"));
const OpeningHour = lazy(() => import("./pages/OpeningHour.jsx"));
const OpeningHourCreate = lazy(() => import("./pages/OpeningHourCreate.jsx"));
const SuperAdminDashboard = lazy(() => import("./pages/SchoolAdminDashboard"));
const AccessDenied = lazy(() => import("./pages/AccessDenied"));


const routeEntries = [
  {
    pageKey: "super-admin-dashboard",
    component: SuperAdminDashboard,
    allowedRoles: ["SUPER_ADMIN"],
  },
  {
    pageKey: "school-admin-dashboard",
    component: SchoolAdminDashboard,
    allowedRoles: ["SCHOOL_ADMIN", "SUPER_ADMIN", "HEAD_OFFICE_ADMIN"],
  },
  {
    pageKey: "head-offices",
    component: HeadOffices,
    permission: ["HEAD_OFFICE_MANAGE", "*"],
  },
  {
    pageKey: "teacher-dashboard",
    component: TeacherDashboard,
    allowedRoles: ["TEACHER"],
  },
  {
    pageKey: "student-dashboard",
    component: StudentDashboard,
    allowedRoles: ["STUDENT"],
  },
  {
    pageKey: "parent-dashboard",
    component: ParentDashboard,
    allowedRoles: ["PARENT"],
  },
  { pageKey: "lms-dashboard", component: LmsDashboard },
  {
    pageKey: "user-role-acl",
    component: RoleTable,
    permission: ["RBAC_MANAGE", "SCHOOL_RBAC_MANAGE", "*"],
  },
  {
    pageKey: "role-permission-setting",
    component: RolePermissionSetting,
    permission: ["RBAC_MANAGE", "SCHOOL_RBAC_MANAGE", "*"],
  },
  { pageKey: "teacher-department", component: TeacherDepartment },
  { pageKey: "student-list", component: StudentList },
  { pageKey: "add-student", component: AddStudent },
  { pageKey: "admit-card-setting", component: AdmitCardSetting },
  { pageKey: "admit-card-setting-create", component: AdmitCardSettingCreate },
  { pageKey: "bulk-admission", component: BulkAdmission },
  { pageKey: "manage-teacher", component: ManageTeacher },
  { pageKey: "add-teacher", component: AddTeacher },

  { pageKey: "class-lecture", component: ClassLecture },
  { pageKey: "rating", component: Rating },
  { pageKey: "manage-designation", component: ManageDesignation },
  { pageKey: "manage-employee", component: ManageEmployee },
  { pageKey: "visitor-purpose", component: VisitorPurpose },
  { pageKey: "call-log", component: CallLog },
  { pageKey: "visitor-info", component: VisitorInfo },
  { pageKey: "postal-dispatch", component: PostalDispatch },
  { pageKey: "postal-receive", component: PostalReceive },
  { pageKey: "complain-type", component: ComplainType },
  { pageKey: "manage-complain", component: ManageComplain },
  { pageKey: "add-complain", component: AddComplain },
  { pageKey: "notice", component: Notice },
  { pageKey: "news", component: News },
  { pageKey: "add-news", component: AddNews },
  { pageKey: "holiday", component: Holiday },
  { pageKey: "add-holiday", component: AddHoliday },
  { pageKey: "event", component: Event },
  { pageKey: "add-event", component: AddEvent },
  { pageKey: "gallery", component: Gallery },
  { pageKey: "add-gallery", component: AddGallery },
  { pageKey: "images", component: Images },
  { pageKey: "images-add", component: AddImages },
  { pageKey: "videos", component: Videos },
  { pageKey: "add-videos", component: AddVideos },
  { pageKey: "student-type", component: StudentType },
  { pageKey: "online-admission", component: OnlineAdmission },
  { pageKey: "student-activity", component: StudentActivity },
  { pageKey: "student-attendance", component: StudentAttendance },
  { pageKey: "teacher-attendance", component: TeacherAttendance },
  { pageKey: "employee-attendance", component: EmployeeAttendance },
  { pageKey: "absent-email", component: AbsentEmail },
  { pageKey: "add-absent-email", component: AddAbsentEmail },
  { pageKey: "absent-sms", component: AbsentSMS },
  { pageKey: "promotion", component: Promotion },
  { pageKey: "id-card-setting", component: IdCardSetting },
  { pageKey: "certificate-type", component: CertificateType },
  { pageKey: "certificate-type-create", component: CertificateTypeCreate },
  { pageKey: "generate-certificate", component: GenerateCertificate },
  { pageKey: "candidate", component: Candidate },
  { pageKey: "candidate-create", component: CandidateCreate },
  { pageKey: "donar", component: Donar },
  { pageKey: "add-donor", component: AddDonor },
  { pageKey: "scholarship", component: Scholarship },
  { pageKey: "add-scholarship", component: AddScholarship },
  { pageKey: "guardian", component: Guardian },
  { pageKey: "add-guardian", component: AddGuardian },
  { pageKey: "class", component: Class },
  { pageKey: "section", component: Section },
  { pageKey: "subject", component: Subject },
  { pageKey: "add-subject", component: AddSubject },

  { pageKey: "syllabus", component: Syllabus },
  { pageKey: "add-syllabus", component: AddSyllabus },
  { pageKey: "study-material", component: StudyMaterial },
  { pageKey: "add-study-material", component: AddStudyMaterial },
  { pageKey: "live-class", component: Liveclass },
  { pageKey: "add-live-class", component: AddLiveClass },
  { pageKey: "assignment", component: Assignment },
  { pageKey: "add-assignment", component: AddAssignment },
  { pageKey: "add-question-bank", component: AddQuestionBank },
  { pageKey: "submission", component: Submission },
  { pageKey: "lesson", component: Lesson },
  { pageKey: "add-lesson", component: AddLesson },
  { pageKey: "edit-lesson", component: EditLesson },
  { pageKey: "topic", component: Topic },
  { pageKey: "add-topic", component: AddTopic },
  { pageKey: "lesson-timeline", component: LessonTimeline },
  { pageKey: "lesson-status", component: LessonStatus },
  { pageKey: "lesson-plan", component: LessonPlan },
  { pageKey: "class-routine", component: ClassRoutine },
  { pageKey: "exam-instruction", component: ExamInstruction },
  { pageKey: "question-bank", component: QuestionBank },
  { pageKey: "onlineexam", component: OnlineExam },
  { pageKey: "add-online-exam", component: AddOnlineExam },
  { pageKey: "exam-result", component: ExamResult },
  { pageKey: "exam-grade", component: ExamGrade },
  { pageKey: "exam-term", component: ExamTerm },
  { pageKey: "schedule", component: Schedule },
  { pageKey: "schedule-create", component: ScheduleCreate },
  { pageKey: "suggestion", component: Suggestion },
  { pageKey: "suggestion-create", component: SuggestionCreate },
  { pageKey: "attendance", component: Attendance },
  { pageKey: "manage-mark", component: Managemark },
  { pageKey: "exam-term-result", component: Examtermresult },
  { pageKey: "exam-final-result", component: Examfinalresult },
  { pageKey: "merit-list", component: MeritList },
  { pageKey: "mark-sheet", component: MarkSheet },
  { pageKey: "result-card", component: ResultCard },
  { pageKey: "mark-send-email", component: MarkSendByEmail },
  { pageKey: "mark-send-email-create", component: MarkSendByEmailCreate },
  { pageKey: "mark-send-sms-create", component: MarkSendBySMSCreate },
  { pageKey: "mark-send-sms", component: MarkSendBySMS },
  { pageKey: "result-email", component: ResultEmail },
  { pageKey: "result-email-create", component: ResultEmailCreate },
  { pageKey: "result-sms", component: ResultSMS },
  { pageKey: "result-sms-create", component: ResultSmsCreate },
  { pageKey: "leave-type", component: LeaveType },
  { pageKey: "add-leave-type", component: AddLeaveType },
  { pageKey: "leave-application", component: LeaveApplication },
  { pageKey: "add-leave-application", component: AddLeaveApplication },
  { pageKey: "waiting-application", component: WaitingApplication },
  { pageKey: "approved-application", component: ApprovedApplication },
  { pageKey: "declined-application", component: DeclineApplication },
  { pageKey: "salary-grade", component: SalaryGrade },
  { pageKey: "add-salary-grade", component: AddSalaryGrade },
  { pageKey: "salary-payment", component: SalaryPayment },
  { pageKey: "salary-history", component: SalaryHistory },
  { pageKey: "discount", component: Discount },
  { pageKey: "fee-type", component: FeeType },
  { pageKey: "fee-collection", component: FeeCollection },
  { pageKey: "add-fee-collection", component: AddFeeCollection },
  { pageKey: "issue-return", component: IssueReturn },
  { pageKey: "issue-book-create", component: IssueBookCreate },

  {
    pageKey: "manage-school",
    component: ManageSchool,
    permission: ["SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"],
  },
  {
    pageKey: "academic-year",
    component: AcademicYear,
    permission: ["SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"],
  },
  {
    pageKey: "payment-setting",
    component: PaymentSetting,
    permission: ["SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"],
  },
  {
    pageKey: "payment-setting-create",
    component: PaymentSettingCreate,
    permission: ["SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"],
  },
  {
    pageKey: "email-setting",
    component: EmailSetting,
    permission: ["SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"],
  },
  {
    pageKey: "email-setting-create",
    component: EmailSettingCreate,
    permission: ["SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"],
  },
  {
    pageKey: "sms-setting",
    component: SmsSetting,
    permission: ["SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"],
  },
  {
    pageKey: "sms-setting-create",
    component: SmsSettingCreate,
    permission: ["SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"],
  },
  { pageKey: "leave-type", component: LeaveType },
  { pageKey: "add-leave-type", component: AddLeaveType },
  { pageKey: "leave-application", component: LeaveApplication },
  { pageKey: "add-leave-application", component: AddLeaveApplication },
  { pageKey: "waiting-application", component: WaitingApplication },
  { pageKey: "approved-application", component: ApprovedApplication },
  { pageKey: "declined-application", component: DeclineApplication },
  { pageKey: "discount", component: Discount },
  { pageKey: "fee-type", component: FeeType },
  { pageKey: "fee-collection", component: FeeCollection },
  { pageKey: "add-fee-collection", component: AddFeeCollection },
  { pageKey: "manage-invoice", component: ManageInvoice },
  { pageKey: "add-bulk-invoice", component: AddBulkInvoice },
  { pageKey: "due-invoice", component: DueInvoice },
  { pageKey: "due-receipt", component: DueReceipt },
  { pageKey: "paid-receipt", component: PaidReceipt },
  { pageKey: "due-fee-email", component: DueFeeEmail },
  { pageKey: "due-fee-sms", component: DueFeeSMS },
  { pageKey: "income-head", component: IncomeHead },
  { pageKey: "income", component: Income },
  { pageKey: "expenditure-head", component: ExpenditureHead },
  { pageKey: "expenditure", component: Expenditure },
  { pageKey: "income-report", component: IncomeReport },
  { pageKey: "expenditure-report", component: ExpenditureReport },
  { pageKey: "invoice-report", component: InvoiceReport },
  { pageKey: "due-fee-report", component: DueFeeReport },
  { pageKey: "fee-collection-report", component: FeeCollectionReport },
  { pageKey: "accounting-balance-report", component: AccountingBalanceReport },
  { pageKey: "library-report", component: LibraryReport },
  { pageKey: "student-attendance-report", component: StudentAttendanceReport },
  {
    pageKey: "student-yearly-attendance-report",
    component: StudentYearlyAttendanceReport,
  },
  { pageKey: "teacher-attendance-report", component: TeacherAttendanceReport },
  {
    pageKey: "teacher-yearly-attendance-report",
    component: TeacherYearlyAttendanceReport,
  },
  {
    pageKey: "employee-attendance-report",
    component: EmployeeAttendanceReport,
  },
  {
    pageKey: "employee-yearly-attendance-report",
    component: EmployeeYearlyAttendanceReport,
  },
  { pageKey: "student-report", component: StudentReport },
  { pageKey: "student-invoice-report", component: StudentInvoiceReport },
  { pageKey: "student-activity-report", component: StudentActivityReport },
  { pageKey: "payroll-report", component: PayrollReport },
  { pageKey: "daily-transaction-report", component: DailyTransactionReport },
  { pageKey: "daily-statement-report", component: DailyStatementReport },
  { pageKey: "exam-result-report", component: ExamResultReport },
  { pageKey: "supplier", component: Supplier },
  { pageKey: "warehouse", component: Warehouse },
  { pageKey: "category", component: Category },
  { pageKey: "product", component: Product },
  { pageKey: "purchase", component: Purchase },
  { pageKey: "add-purchase", component: AddPurchase },
  { pageKey: "sale", component: Sale },
  { pageKey: "issue", component: Issue },
  { pageKey: "add-issue", component: AddIssue },
  { pageKey: "add-vendor", component: AddVendor },
  { pageKey: "sale-create", component: SaleCreate },
  { pageKey: "asset-vendor", component: Vendor },
  { pageKey: "asset-store", component: AssetStore },
  { pageKey: "asset-category", component: AssetCategory },
  { pageKey: "asset-item", component: AssetItem },
  { pageKey: "asset-purchase", component: AssetPurchase },
  { pageKey: "asset-issue", component: AssetIssue },
  { pageKey: "asset-return", component: AssetReturn },
  { pageKey: "asset-report", component: AssetReport },
  { pageKey: "add-asset-vendor", component: AssetVendorCreate },
  { pageKey: "add-asset-store", component: AssetStoreCreate },
  { pageKey: "add-asset-item", component: AssetItemCreate },
  { pageKey: "add-asset-purchase", component: AssetPurchaseCreate },
  { pageKey: "books-list", component: Book },
  { pageKey: "book", component: Book },
  { pageKey: "book-create", component: BookCreate },
  { pageKey: "library-members", component: LibraryMember },
  { pageKey: "non-library-members", component: NonLibraryMember },
  { pageKey: "issue-book-create", component: IssueBookCreate },
  { pageKey: "ebook", component: EBook },
  { pageKey: "ebook-list", component: EBook },
  { pageKey: "ebook-create", component: EBookCreate },
  { pageKey: "vehicle", component: Vehicle },
  { pageKey: "transport-member", component: TransportMember },
  { pageKey: "transport-route", component: TransportRoute },
  { pageKey: "transport-route-create", component: TransportRouteCreate },
  { pageKey: "non-transport-member", component: NonTransportMember },
  { pageKey: "vehicle-create", component: VehicleCreate },
  { pageKey: "manage-hostel", component: ManageHostel },
  { pageKey: "hostel-create", component: HostelCreate },
  { pageKey: "manage-room", component: ManageRoom },
  { pageKey: "add-room", component: RoomCreate },
  { pageKey: "hostel-member", component: HostelMember },
  { pageKey: "non-hostel-member", component: NonHostelMember },
  { pageKey: "email", component: Email },
  { pageKey: "email-create", component: EmailCreate },
  { pageKey: "sms", component: SMS },
  { pageKey: "sms-create", component: SMSCreate },
  { pageKey: "frontend-page", component: FrontendPage },
  { pageKey: "frontend-page-create", component: FrontendPageCreate },
  { pageKey: "slider", component: Slider },
  { pageKey: "slider-create", component: SliderCreate },
  { pageKey: "about-school", component: AboutSchool },
  { pageKey: "about-school-edit", component: AboutSchoolEdit },
  { pageKey: "manage-award", component: ManageAward },
  { pageKey: "manage-award-create", component: AwardCreate },
  { pageKey: "manage-todo", component: ManageTodo },
  { pageKey: "manage-todo-create", component: TodoCreate },
  { pageKey: "faq", component: FAQ },
  { pageKey: "subscription-faq", component: SubscriptionFAQ },
  { pageKey: "subscription-slider", component: SubscriptionSlider },
  { pageKey: "subscription-settings", component: SubscriptionSetting },
  { pageKey: "images", component: Images },
  { pageKey: "videos", component: Videos },
  { pageKey: "student-type", component: StudentType },
  { pageKey: "online-admission", component: OnlineAdmission },
  { pageKey: "student-activity", component: StudentActivity },
  { pageKey: "add-student-activity", component: AddStudentActivity },
  { pageKey: "student-attendance", component: StudentAttendance },
  { pageKey: "teacher-attendance", component: TeacherAttendance },
  { pageKey: "employee-attendance", component: EmployeeAttendance },
  { pageKey: "absent-email", component: AbsentEmail },
  { pageKey: "add-absent-email", component: AddAbsentEmail },
  { pageKey: "absent-sms", component: AbsentSMS },
  { pageKey: "promotion", component: Promotion },
  { pageKey: "id-card-setting", component: IdCardSetting },
  { pageKey: "certificate-type", component: CertificateType },
  { pageKey: "certificate-type-create", component: CertificateTypeCreate },
  { pageKey: "generate-certificate", component: GenerateCertificate },
  { pageKey: "candidate", component: Candidate },
  { pageKey: "candidate-create", component: CandidateCreate },
  { pageKey: "donar", component: Donar },
  { pageKey: "add-donor", component: AddDonor },
  { pageKey: "scholarship", component: Scholarship },
  { pageKey: "add-scholarship", component: AddScholarship },
  { pageKey: "guardian", component: Guardian },
  { pageKey: "class", component: Class },
  { pageKey: "section", component: Section },
  { pageKey: "subject", component: Subject },
  { pageKey: "add-subject", component: AddSubject },
  { pageKey: "syllabus", component: Syllabus },
  { pageKey: "add-syllabus", component: AddSyllabus },
  { pageKey: "study-material", component: StudyMaterial },
  { pageKey: "add-study-material", component: AddStudyMaterial },
  { pageKey: "live-class", component: Liveclass },
  { pageKey: "add-live-class", component: AddLiveClass },
  { pageKey: "assignment", component: Assignment },
  { pageKey: "add-question-bank", component: AddQuestionBank },
  { pageKey: "submission", component: Submission },
  { pageKey: "lesson", component: Lesson },
  { pageKey: "add-lesson", component: AddLesson },
  { pageKey: "edit-lesson", component: EditLesson },
  { pageKey: "topic", component: Topic },
  { pageKey: "lesson-timeline", component: LessonTimeline },
  { pageKey: "lesson-status", component: LessonStatus },
  { pageKey: "lesson-plan", component: LessonPlan },
  { pageKey: "class-routine", component: ClassRoutine },
  { pageKey: "exam-instruction", component: ExamInstruction },
  { pageKey: "question-bank", component: QuestionBank },
  { pageKey: "onlineexam", component: OnlineExam },
  { pageKey: "add-online-exam", component: AddOnlineExam },
  { pageKey: "exam-result", component: ExamResult },
  { pageKey: "exam-grade", component: ExamGrade },
  { pageKey: "exam-term", component: ExamTerm },
  { pageKey: "schedule", component: Schedule },
  { pageKey: "schedule-create", component: ScheduleCreate },
  { pageKey: "suggestion", component: Suggestion },
  { pageKey: "suggestion-create", component: SuggestionCreate },
  { pageKey: "attendance", component: Attendance },
  { pageKey: "manage-mark", component: Managemark },
  { pageKey: "exam-term-result", component: Examtermresult },
  { pageKey: "exam-final-result", component: Examfinalresult },
  { pageKey: "merit-list", component: MeritList },
  { pageKey: "mark-sheet", component: MarkSheet },
  { pageKey: "result-card", component: ResultCard },
  { pageKey: "mark-send-email", component: MarkSendByEmail },
  { pageKey: "mark-send-email-create", component: MarkSendByEmailCreate },
  { pageKey: "mark-send-sms-create", component: MarkSendBySMSCreate },
  { pageKey: "mark-send-sms", component: MarkSendBySMS },
  { pageKey: "result-email", component: ResultEmail },
  { pageKey: "result-email-create", component: ResultEmailCreate },
  { pageKey: "result-sms", component: ResultSMS },
  { pageKey: "leave-type", component: LeaveType },
  { pageKey: "add-leave-type", component: AddLeaveType },
  { pageKey: "leave-application", component: LeaveApplication },
  { pageKey: "add-leave-application", component: AddLeaveApplication },
  { pageKey: "waiting-application", component: WaitingApplication },
  { pageKey: "approved-application", component: ApprovedApplication },
  { pageKey: "declined-application", component: DeclineApplication },
  { pageKey: "salary-grade", component: SalaryGrade },
  { pageKey: "add-salary-grade", component: AddSalaryGrade },
  { pageKey: "salary-payment", component: SalaryPayment },
  { pageKey: "salary-history", component: SalaryHistory },
  { pageKey: "discount", component: Discount },
  { pageKey: "fee-type", component: FeeType },
  { pageKey: "fee-collection", component: FeeCollection },
  { pageKey: "add-fee-collection", component: AddFeeCollection },
  { pageKey: "issue-return", component: IssueReturn },
  { pageKey: "issue-book-create", component: IssueBookCreate },

  {
    pageKey: "manage-school",
    component: ManageSchool,
    permission: ["SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"],
  },
  {
    pageKey: "academic-year",
    component: AcademicYear,
    permission: ["SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"],
  },
  {
    pageKey: "payment-setting",
    component: PaymentSetting,
    permission: ["SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"],
  },
  {
    pageKey: "sms-setting",
    component: SmsSetting,
    permission: ["SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"],
  },
  {
    pageKey: "sms-setting-create",
    component: SmsSettingCreate,
    permission: ["SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"],
  },
  { pageKey: "leave-type", component: LeaveType },
  { pageKey: "add-leave-type", component: AddLeaveType },
  { pageKey: "leave-application", component: LeaveApplication },
  { pageKey: "add-leave-application", component: AddLeaveApplication },
  { pageKey: "waiting-application", component: WaitingApplication },
  { pageKey: "approved-application", component: ApprovedApplication },
  { pageKey: "declined-application", component: DeclineApplication },
  { pageKey: "discount", component: Discount },
  { pageKey: "fee-type", component: FeeType },
  { pageKey: "fee-collection", component: FeeCollection },
  { pageKey: "add-fee-collection", component: AddFeeCollection },
  { pageKey: "manage-invoice", component: ManageInvoice },
  { pageKey: "add-bulk-invoice", component: AddBulkInvoice },
  { pageKey: "due-invoice", component: DueInvoice },
  { pageKey: "due-receipt", component: DueReceipt },
  { pageKey: "paid-receipt", component: PaidReceipt },
  { pageKey: "due-fee-email", component: DueFeeEmail },
  { pageKey: "due-fee-sms", component: DueFeeSMS },
  { pageKey: "income-head", component: IncomeHead },
  { pageKey: "income", component: Income },
  { pageKey: "expenditure-head", component: ExpenditureHead },
  { pageKey: "expenditure", component: Expenditure },
  { pageKey: "add-expenditure", component: AddExpenditure },
  { pageKey: "income-report", component: IncomeReport },
  { pageKey: "expenditure-report", component: ExpenditureReport },
  { pageKey: "invoice-report", component: InvoiceReport },
  { pageKey: "due-fee-report", component: DueFeeReport },
  { pageKey: "fee-collection-report", component: FeeCollectionReport },
  { pageKey: "accounting-balance-report", component: AccountingBalanceReport },
  { pageKey: "library-report", component: LibraryReport },
  { pageKey: "student-attendance-report", component: StudentAttendanceReport },
  {
    pageKey: "student-yearly-attendance-report",
    component: StudentYearlyAttendanceReport,
  },
  { pageKey: "teacher-attendance-report", component: TeacherAttendanceReport },
  {
    pageKey: "teacher-yearly-attendance-report",
    component: TeacherYearlyAttendanceReport,
  },
  {
    pageKey: "employee-attendance-report",
    component: EmployeeAttendanceReport,
  },
  {
    pageKey: "employee-yearly-attendance-report",
    component: EmployeeYearlyAttendanceReport,
  },
  { pageKey: "student-report", component: StudentReport },
  { pageKey: "student-invoice-report", component: StudentInvoiceReport },
  { pageKey: "student-activity-report", component: StudentActivityReport },
  { pageKey: "payroll-report", component: PayrollReport },
  { pageKey: "daily-transaction-report", component: DailyTransactionReport },
  { pageKey: "daily-statement-report", component: DailyStatementReport },
  { pageKey: "exam-result-report", component: ExamResultReport },
  { pageKey: "supplier", component: Supplier },
  { pageKey: "warehouse", component: Warehouse },
  { pageKey: "category", component: Category },
  { pageKey: "product", component: Product },
  { pageKey: "purchase", component: Purchase },
  { pageKey: "add-purchase", component: AddPurchase },
  { pageKey: "sale", component: Sale },
  { pageKey: "issue", component: Issue },
  { pageKey: "add-issue", component: AddIssue },
  { pageKey: "add-vendor", component: AddVendor },
  { pageKey: "sale-create", component: SaleCreate },
  { pageKey: "asset-vendor", component: Vendor },
  { pageKey: "asset-store", component: AssetStore },
  { pageKey: "asset-category", component: AssetCategory },
  { pageKey: "asset-item", component: AssetItem },
  { pageKey: "asset-purchase", component: AssetPurchase },
  { pageKey: "asset-issue", component: AssetIssue },
  { pageKey: "asset-return", component: AssetReturn },
  { pageKey: "asset-report", component: AssetReport },
  { pageKey: "add-asset-vendor", component: AssetVendorCreate },
  { pageKey: "add-asset-store", component: AssetStoreCreate },
  { pageKey: "add-asset-item", component: AssetItemCreate },
  { pageKey: "add-asset-purchase", component: AssetPurchaseCreate },
  { pageKey: "books-list", component: Book },
  { pageKey: "book", component: Book },
  { pageKey: "book-create", component: BookCreate },
  { pageKey: "library-members", component: LibraryMember },
  { pageKey: "non-library-members", component: NonLibraryMember },
  { pageKey: "issue-book-create", component: IssueBookCreate },
  { pageKey: "ebook", component: EBook },
  { pageKey: "ebook-list", component: EBook },
  { pageKey: "ebook-create", component: EBookCreate },
  { pageKey: "vehicle", component: Vehicle },
  { pageKey: "transport-member", component: TransportMember },
  { pageKey: "transport-route", component: TransportRoute },
  { pageKey: "transport-route-create", component: TransportRouteCreate },
  { pageKey: "non-transport-member", component: NonTransportMember },
  { pageKey: "vehicle-create", component: VehicleCreate },
  { pageKey: "manage-hostel", component: ManageHostel },
  { pageKey: "hostel-create", component: HostelCreate },
  { pageKey: "manage-room", component: ManageRoom },
  { pageKey: "add-room", component: RoomCreate },
  { pageKey: "hostel-member", component: HostelMember },
  { pageKey: "non-hostel-member", component: NonHostelMember },
  { pageKey: "email", component: Email },
  { pageKey: "email-create", component: EmailCreate },
  { pageKey: "sms", component: SMS },
  { pageKey: "sms-create", component: SMSCreate },
  { pageKey: "frontend-page", component: FrontendPage },
  { pageKey: "frontend-page-create", component: FrontendPageCreate },
  { pageKey: "slider", component: Slider },
  { pageKey: "slider-create", component: SliderCreate },
  { pageKey: "about-school", component: AboutSchool },
  { pageKey: "manage-award", component: ManageAward },
  { pageKey: "manage-award-create", component: AwardCreate },
  { pageKey: "manage-todo", component: ManageTodo },
  { pageKey: "manage-todo-create", component: TodoCreate },
  { pageKey: "faq", component: FAQ },
  { pageKey: "subscription-faq", component: SubscriptionFAQ },
  { pageKey: "subscription-slider", component: SubscriptionSlider },
  { pageKey: "subscription-settings", component: SubscriptionSetting },
  { pageKey: "general-settings", component: GeneralSetting },
  { pageKey: "subscription-plans", component: SubscriptionPlan },
  { pageKey: "school-subscription", component: SchoolSubscription },
  { pageKey: "add-school", component: AddSchool },
  { pageKey: "add-visitor-info", component: AddVisitorInfo },
  { pageKey: "add-call-log", component: AddCallLog },
  { pageKey: "add-postal-dispatch", component: AddPostalDispatch },
  { pageKey: "add-notice", component: AddNotice },
  { pageKey: "add-postal-receive", component: AddPostalReceive },
  { pageKey: "add-teacher", component: AddTeacher },
  { pageKey: "add-submission", component: AddSubmission },
  { pageKey: "add-class-lecture", component: AddClassLecture },
  { pageKey: "add-topic", component: AddTopic },
  { pageKey: "add-manage-designation", component: AddManageDesignation },
  { pageKey: "add-manage-employee", component: AddManageEmployee },
  { pageKey: "manage-super-admin", component: SuperAdmin },
  { pageKey: "add-super-admin", component: SuperAdminCreate },
  { pageKey: "manage-feedback", component: ManageFeedback },
  { pageKey: "backup-database", component: BackupDatabase },
  { pageKey: "opening-hour", component: OpeningHour },
  { pageKey: "add-opening-hour", component: OpeningHourCreate },
];

const AppRoute = ({
  currentPage,
  user,

  role,
  onNavigate,
}) => {
  const normalizedRole = normalizeRole(
    role || user?.role || user?.userRole || user?.authority,
  );
  const homePage = (() => {
    const r = normalizeRole(
      role || user?.role || user?.userRole || user?.authority,
    );
    if (r === "SUPER_ADMIN") return "school-admin-dashboard";
    if (r === "HEAD_OFFICE_ADMIN") return "school-admin-dashboard";
    if (r === "SCHOOL_ADMIN") return "school-admin-dashboard";
    if (r === "TEACHER") return "teacher-dashboard";
    if (r === "STUDENT") return "student-dashboard";
    if (r === "PARENT") return "parent-dashboard";
    return "dashboard";
  })();
  const effectivePage = currentPage === "dashboard" ? homePage : currentPage;
  const [basePage, queryString] = (effectivePage || '').split('?');
  const entry = routeEntries.find((item) => item.pageKey === basePage);
  const searchParams = new URLSearchParams(queryString || '');

  const homeEntry =
    routeEntries.find((item) => item.pageKey === homePage) ||
    routeEntries.find((item) => item.pageKey === "school-admin-dashboard") ||
    routeEntries.find((item) => item.pageKey === "lms-dashboard") ||
    routeEntries[0];
  const HomeComponent = homeEntry?.component;
  const homeContent = HomeComponent ? (
    <HomeComponent onNavigate={onNavigate} />
  ) : null;

  if (!entry) return homeContent;

  const PageComponent = entry.component;
  const pageProps = {
    onNavigate,
    role: searchParams.get('role'),
    schoolId: searchParams.get('schoolId'),
  };
  const content = <PageComponent {...pageProps} />;

  return (
    <ProtectedRoute
      user={user}
      role={normalizedRole}
      allowedRoles={entry.allowedRoles}
      permission={entry.permission}
      pageKey={basePage}
      fallback={<AccessDenied />}
    >
      {content}
    </ProtectedRoute>
  );
};

export default AppRoute;
