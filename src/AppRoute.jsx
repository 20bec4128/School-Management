import HeadOfficeDashboard from "./pages/HeadOfficeDashboard";
import SchoolAdminDashboard from "./pages/SchoolAdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import LmsDashboard from "./pages/LmsDashboard";
import HeadOffices from "./pages/HeadOffices";
import UserRoleAcl from "./pages/UserRoleAcl";
import TeacherDepartment from "./pages/TeacherDepartment";
import StudentList from "./pages/StudentList";
import AddStudent from "./pages/AddStudent";
import AddLesson from "./pages/AddLesson";
import EditLesson from "./pages/EditLesson";
import ManageTeacher from "./pages/Manageteacher";
import ClassLecture from "./pages/ClassLecture";
import Rating from "./pages/Rating";
import ManageDesignation from "./pages/Managedesignation";
import ManageEmployee from "./pages/ManageEmployee";
import VisitorPurpose from "./pages/VisitorPurpose";
import CallLog from "./pages/CallLog";
import VisitorInfo from "./pages/VisiterInfo";
import PostalDispatch from "./pages/PostalDispatch";
import PostalReceive from "./pages/PostalReceive";
import ComplainType from "./pages/ComplainType";
import ManageComplain from "./pages/ManageComplain";
import Notice from "./pages/Notice";
import News from "./pages/News";
import Holiday from "./pages/Holiday";
import Event from "./pages/Event";
import Gallery from "./pages/Gallery";
import Images from "./pages/Images";
import Videos from "./pages/Videos";
import StudentType from "./pages/StudentType";
import BulkAdmission from "./pages/BulkAdmission";
import OnlineAdmission from "./pages/OnlineAdmission";
import StudentActivity from "./pages/StudentActivity";
import StudentAttendance from "./pages/StudentAttendance";
import TeacherAttendance from "./pages/TeacherAttendance";
import EmployeeAttendance from "./pages/EmployeeAttendance";
import AbsentEmail from "./pages/AbsentEmail";
import AbsentSMS from "./pages/AbsentSMS";
import Promotion from "./pages/Promotion";
import IdCardSetting from "./pages/IdCardSetting";
import AdmitCardSetting from "./pages/AdmitCardSetting";
import CertificateType from "./pages/CertificateType";
import GenerateCertificate from "./pages/GenerateCertificate";
import Candidate from "./pages/Candidate";
import Donar from "./pages/Donar";
import Scholarship from "./pages/Scholarship";
import Guardian from "./pages/Guardian";
import Class from "./pages/Class";
import Section from "./pages/Section";
import Subject from "./pages/Subject";
import Syllabus from "./pages/Syllabus";
import StudyMaterial from "./pages/StudyMaterial";
import Liveclass from "./pages/Liveclass";
import Assignment from "./pages/Assignment";
import Submission from "./pages/Submission";
import Lesson from "./pages/Lesson";
import Topic from "./pages/Topic";
import LessonTimeline from "./pages/LessonTimeline";
import LessonStatus from "./pages/LessonStatus";
import LessonPlan from "./pages/LessonPlan";
import ClassRoutine from "./pages/ClassRoutine";
import ExamInstruction from "./pages/ExamInstruction";
import QuestionBank from "./pages/QuestionBank";
import OnlineExam from "./pages/OnlineExam";
import ExamResult from "./pages/ExamResult";
import ExamGrade from "./pages/ExamGrade";
import ExamTerm from "./pages/ExamTerm";
import Schedule from "./pages/Schedule";
import Suggestion from "./pages/Suggestion";
import Attendance from "./pages/Attendence";
import Managemark from "./pages/Managemark";
import Examtermresult from "./pages/Examtermresult";
import Examfinalresult from "./pages/Examfinalresult";
import MeritList from "./pages/MeritList";
import MarkSheet from "./pages/MarkSheet";
import ResultCard from "./pages/ResultCard";
import MarkSendByEmail from "./pages/MarkSendByEmail";
import MarkSendBySMS from "./pages/MarkSendBySMS";
import ResultEmail from "./pages/ResultEmail";
import ResultSMS from "./pages/ResultSMS";
import LeaveType from "./pages/LeaveType";
import LeaveApplication from "./pages/LeaveApplication";
import WaitingApplication from "./pages/WaitingApplication";
import ApprovedApplication from "./pages/ApprovedApplication";
import DeclineApplication from "./pages/DeclineApplication";
import SalaryPayment from "./pages/SalaryPayment";
import SalaryGrade from "./pages/SalaryGrade";
import SalaryHistory from "./pages/SalaryHistory";
import Discount from "./pages/Discount";
import FeeType from "./pages/FeeType";
import FeeCollection from "./pages/FeeCollection";
import ManageSchool from "./pages/ManageSchool";
import AcademicYear from "./pages/AcademicYear";
import PaymentSetting from "./pages/PaymentSetting";
import SmsSetting from "./pages/SmsSetting";
import ProtectedRoute from "./components/ProtectedRoute";
import { normalizeRole } from "./utils/roles";
import DueInvoice from "./pages/DueInvoice";
import ManageInvoice from "./pages/ManageInvoice";
import DueReceipt from "./pages/DueReceipt";
import PaidReceipt from "./pages/PaidReceipt";
import DueFeeEmail from "./pages/DueFeeEmail";
import DueFeeSMS from "./pages/DueFeeSMS";
import IncomeHead from "./pages/IncomeHead";
import Income from "./pages/Income";
import ExpenditureHead from "./pages/ExpenditureHead";
import Expenditure from "./pages/Expenditure";
import IncomeReport from "./pages/IncomeReport";
import ExpenditureReport from "./pages/ExpenditureReport";
import InvoiceReport from "./pages/InvoiceReport";
import DueFeeReport from "./pages/DueFeeReport";
import FeeCollectionReport from "./pages/FeeCollectionReport";
import AccountingBalanceReport from "./pages/AccountingBalanceReport";
import LibraryReport from "./pages/LibraryReport";
import StudentAttendanceReport from "./pages/StudentAttendanceReport";
import StudentYearlyAttendanceReport from "./pages/StudentYearlyAttendanceReport";
import TeacherAttendanceReport from "./pages/TeacherAttendanceReport";
import TeacherYearlyAttendanceReport from "./pages/TeacherYearlyAttendanceReport";
import EmployeeAttendanceReport from "./pages/EmployeeAttendanceReport";
import EmployeeYearlyAttendanceReport from "./pages/EmployeeYearlyAttendanceReport";
import StudentReport from "./pages/StudentReport";
import StudentInvoiceReport from "./pages/StudentInvoiceReport";
import StudentActivityReport from "./pages/StudentActivityReport";
import PayrollReport from "./pages/PayrollReport";
import DailyTransactionReport from "./pages/DailyTransactionReport";
import DailyStatementReport from "./pages/DailyStatementReport";
import ExamResultReport from "./pages/ExamResultReport";
import Supplier from "./pages/Supplier";
import Warehouse from "./pages/Warehouse";
import Category from "./pages/Category";
import Product from "./pages/Product";
import Purchase from "./pages/Purchase.jsx";
import Sale from "./pages/Sale";
import Issue from "./pages/Issue";
import SaleCreate from "./pages/SaleCreate";
import Vendor from "./pages/Vendor";
import AssetStore from "./pages/AssetStore";
import AssetCategory from "./pages/AssetCategory";
import AssetItem from "./pages/AssetItem";
import AssetPurchase from "./pages/AssetPurchase";
import AssetIssue from "./pages/AssetIssue";
import AssetReturn from "./pages/AssetReturn";
import AssetReport from "./pages/AssetReport";
import AssetVendorCreate from "./pages/AssetVendorCreate";
import AssetStoreCreate from "./pages/AssetStoreCreate";
import AssetItemCreate from "./pages/AssetItemCreate";
import AssetPurchaseCreate from "./pages/AssetPurchaseCreate";
import Book from "./pages/Book.jsx";
import BookCreate from "./pages/BookCreate.jsx";
import LibraryMember from "./pages/LibraryMember.jsx";
import IssueReturn from "./pages/IssueReturn.jsx";
import IssueBookCreate from "./pages/IssueBookCreate.jsx";
import NonLibraryMember from "./pages/NonLibraryMember.jsx";
import EBook from "./pages/EBook.jsx";
import EBookCreate from "./pages/EBookCreate.jsx.jsx";



const routeEntries = [
  {
    pageKey: "school-admin-dashboard",
    component: SchoolAdminDashboard,
    allowedRoles: ["SCHOOL_ADMIN"],
  },
  {
    pageKey: "head-office-dashboard",
    component: HeadOfficeDashboard,
    allowedRoles: ["HEAD_OFFICE_ADMIN"],
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
    component: UserRoleAcl,
    permission: ["RBAC_MANAGE", "SCHOOL_RBAC_MANAGE", "*"],
  },
  { pageKey: "teacher-department", component: TeacherDepartment },
  { pageKey: "student-list", component: StudentList },
  { pageKey: "add-student", component: AddStudent },
  { pageKey: "admit-card-setting", component: AdmitCardSetting },
  { pageKey: "bulk-admission", component: BulkAdmission },
  { pageKey: "manage-teacher", component: ManageTeacher },
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
  { pageKey: "notice", component: Notice },
  { pageKey: "news", component: News },
  { pageKey: "holiday", component: Holiday },
  { pageKey: "event", component: Event },
  { pageKey: "gallery", component: Gallery },
  { pageKey: "images", component: Images },
  { pageKey: "videos", component: Videos },
  { pageKey: "student-type", component: StudentType },
  { pageKey: "online-admission", component: OnlineAdmission },
  { pageKey: "student-activity", component: StudentActivity },
  { pageKey: "student-attendance", component: StudentAttendance },
  { pageKey: "teacher-attendance", component: TeacherAttendance },
  { pageKey: "employee-attendance", component: EmployeeAttendance },
  { pageKey: "absent-email", component: AbsentEmail },
  { pageKey: "absent-sms", component: AbsentSMS },
  { pageKey: "promotion", component: Promotion },
  { pageKey: "id-card-setting", component: IdCardSetting },
  { pageKey: "certificate-type", component: CertificateType },
  { pageKey: "generate-certificate", component: GenerateCertificate },
  { pageKey: "candidate", component: Candidate },
  { pageKey: "donar", component: Donar },
  { pageKey: "scholarship", component: Scholarship },
  { pageKey: "guardian", component: Guardian },
  { pageKey: "class", component: Class },
  { pageKey: "section", component: Section },
  { pageKey: "subject", component: Subject },
  { pageKey: "syllabus", component: Syllabus },
  { pageKey: "study-material", component: StudyMaterial },
  { pageKey: "live-class", component: Liveclass },
  { pageKey: "assignment", component: Assignment },
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
  { pageKey: "exam-result", component: ExamResult },
  { pageKey: "exam-grade", component: ExamGrade },
  { pageKey: "exam-term", component: ExamTerm },
  { pageKey: "schedule", component: Schedule },
  { pageKey: "suggestion", component: Suggestion },
  { pageKey: "attendance", component: Attendance },
  { pageKey: "manage-mark", component: Managemark },
  { pageKey: "exam-term-result", component: Examtermresult },
  { pageKey: "exam-final-result", component: Examfinalresult },
  { pageKey: "merit-list", component: MeritList },
  { pageKey: "mark-sheet", component: MarkSheet },
  { pageKey: "result-card", component: ResultCard },
  { pageKey: "mark-send-email", component: MarkSendByEmail },
  { pageKey: "mark-send-sms", component: MarkSendBySMS },
  { pageKey: "result-email", component: ResultEmail },
  { pageKey: "result-sms", component: ResultSMS },
  { pageKey: "leave-type", component: LeaveType },
  { pageKey: "leave-application", component: LeaveApplication },
  { pageKey: "waiting-application", component: WaitingApplication },
  { pageKey: "approved-application", component: ApprovedApplication },
  { pageKey: "declined-application", component: DeclineApplication },
  { pageKey: "salary-grade", component: SalaryGrade },
  { pageKey: "salary-payment", component: SalaryPayment },
  { pageKey: "salary-history", component: SalaryHistory },
  { pageKey: "discount", component: Discount },
  { pageKey: "fee-type", component: FeeType },
  { pageKey: "fee-collection", component: FeeCollection },
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
  { pageKey: "leave-type", component: LeaveType },
  { pageKey: "leave-application", component: LeaveApplication },
  { pageKey: "waiting-application", component: WaitingApplication },
  { pageKey: "approved-application", component: ApprovedApplication },
  { pageKey: "declined-application", component: DeclineApplication },
  { pageKey: "discount", component: Discount },
  { pageKey: "fee-type", component: FeeType },
  { pageKey: "fee-collection", component: FeeCollection },
  { pageKey: "manage-invoice", component: ManageInvoice },
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
  { pageKey: "sale", component: Sale },
  { pageKey: "issue", component: Issue },
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
  {pageKey:"non-library-members",component:NonLibraryMember},
  {pageKey:"issue-book-create",component:IssueBookCreate},
  {pageKey:"ebook",component:EBook},
  {pageKey:"ebook-list",component:EBook},
  {pageKey:"ebook-create",component:EBookCreate}
];

const AppRoute = ({
  currentPage,
  user,

  role,
  parentChildren,
  selectedChildId,
  onNavigate,
}) => {
  const normalizedRole = normalizeRole(
    role || user?.role || user?.userRole || user?.authority,
  );
  const homePage = (() => {
    const r = normalizeRole(
      role || user?.role || user?.userRole || user?.authority,
    );
    if (r === "SUPER_ADMIN") return "lms-dashboard";
    if (r === "HEAD_OFFICE_ADMIN") return "head-office-dashboard";
    if (r === "SCHOOL_ADMIN") return "school-admin-dashboard";
    if (r === "TEACHER") return "teacher-dashboard";
    if (r === "STUDENT") return "student-dashboard";
    if (r === "PARENT") return "parent-dashboard";
    return "dashboard";
  })();
  const effectivePage = currentPage === "dashboard" ? homePage : currentPage;
  const entry = routeEntries.find((item) => item.pageKey === effectivePage);
  const homeEntry =
    routeEntries.find((item) => item.pageKey === homePage) ||
    routeEntries.find((item) => item.pageKey === "lms-dashboard") ||
    routeEntries[0];
  const HomeComponent = homeEntry?.component;
  const homeContent = HomeComponent ? (
    <HomeComponent onNavigate={onNavigate} />
  ) : null;

  if (!entry) return homeContent;

  const PageComponent = entry.component;
  const content = <PageComponent onNavigate={onNavigate} />;

  return (
    <ProtectedRoute
      user={user}
      role={normalizedRole}
      allowedRoles={entry.allowedRoles}
      permission={entry.permission}
      fallback={homeContent}
    >
      {content}
    </ProtectedRoute>
  );
};

export default AppRoute;
