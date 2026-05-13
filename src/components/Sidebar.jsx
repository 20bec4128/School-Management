import React, { useState, useEffect } from "react";
import "../css/sidebar.css";
import { useSidebar } from "../context/SidebarContext";
import { can } from "../utils/permissions";
import { canManageUsers } from "../utils/editableRoles";
import { normalizeRole } from "../utils/roles";

const menuSections = [
  {
    title: "Core System",
    items: [
      {
        title: "Dashboard",
        icon: "ri:dashboard-line",
        submenu: [
          { label: "School", href: "#", page: "school-admin-dashboard", perm: "*" },
          { label: "Student", href: "#", page: "student-dashboard", perm: "*" },
          { label: "Teacher", href: "#", page: "teacher-dashboard", perm: "*" },
          { label: "Parent", href: "#", page: "parent-dashboard", perm: "*" },
          { label: "LMS", href: "#", page: "lms-dashboard", perm: "*" },
        ],
      },
      {
        title: "Administrator",
        icon: "ri:user-settings-line",
        submenu: [
          {
            label: "Head Offices",
            href: "#",
            page: "head-offices",
            perm: "HEAD_OFFICE_MANAGE",
          },
          {
            label: "Manage School",
            href: "#",
            page: "manage-school",
            perm: "SCHOOL_MANAGE",
          },
          {
            label: "Manage User Roles",
            href: "#",
            page: "user-role-acl",
            perm: ["RBAC_MANAGE", "SCHOOL_RBAC_MANAGE"],
          },
          {
            label: "Payment Setting",
            href: "#",
            page: "payment-setting",
            perm: "SCHOOL_MANAGE",
          },
          {
            label: "SMS Setting",
            href: "#",
            page: "sms-setting",
            perm: "SCHOOL_MANAGE",
          },
          {
            label: "Email Setting",
            href: "#",
            page: "email-setting",
            perm: "SCHOOL_MANAGE",
          },
          { label: "Academic Year", href: "#", page: "academic-year", perm: "SCHOOL_MANAGE" },
        ],
      },
    ],
  },

  
  {
    title: "Front Office",
    items: [
      {
        title: "Front Office",
        icon: "ri:building-4-line",
        submenu: [
          { label: "Visitor Purpose", href: "#", page: "visitor-purpose" },
          { label: "Visitor Info", href: "#", page: "visitor-info" },
          { label: "Call Log", href: "#", page: "call-log" },
          { label: "Postal Dispatch", href: "#", page: "postal-dispatch" },
          { label: "Postal Receive", href: "#", page: "postal-receive" },
        ],
      },
      {
        title: "Complain",
        icon: "ri:chat-3-line",
        submenu: [
          { label: "Complaints Type", href: "#", page: "complain-type" },
          { label: "Manage Complain", href: "#", page: "manage-complain" },
        ],
      },
      {
        title: "Announcement",
        icon: "ri:megaphone-line",
        submenu: [
          { label: "Notice", href: "#", page: "notice" },
          { label: "News", href: "#", page: "news" },
          { label: "Holiday", href: "#", page: "holiday" },
        ],
      },
      {
        title: "Event",
        icon: "ri:calendar-event-line",
        href: "#",
        page: "event",
      },
      {
        title: "Media Gallery",
        icon: "ri:image-line",
        submenu: [
          { label: "Gallery", href: "#", page: "gallery" },
          { label: "Images", href: "#", page: "images" },
          { label: "Videos", href: "#", page: "videos" },
        ],
      },
    ],
  },
  

  {
    title: "Student Management",
    items: [
      {
        title: "Manage Student",
        icon: "ri:group-line",
        perm: "STUDENT_TYPE_MANAGE",
        submenu: [
          { label: "Student Type", href: "#", page: "student-type" },
          { label: "Student List", href: "#", page: "student-list" },
          { label: "Online Admission", href: "#", page: "online-admission" },
          { label: "Student Activity", href: "#", page: "student-activity" },
        ],
      },

      /*
      {
        title: "Attendance",
        icon: "ri:calendar-check-line",
        submenu: [
          { label: "Student Attendance", href: "#", page: "student-attendance" },
          { label: "Teacher Attendance", href: "#", page: "teacher-attendance" },
          { label: "Employee Attendance", href: "#", page: "employee-attendance" },
          { label: "Absent Email", href: "#", page: "absent-email" },
          { label: "Absent SMS", href: "#", page: "absent-sms" },
        ],
      },
      {
        title: "Promotion",
        icon: "ri:arrow-up-circle-line",
        href: "#",
        page: "promotion",
      },
      {
        title: "Generate Card",
        icon: "ri:id-card-line",
        submenu: [
          { label: "ID Card Setting", href: "#", page: "id-card-setting" },
          { label: "Admit Card Setting", href: "#", page: "admit-card-setting" },
        ],
      },
      {
        title: "Certificate",
        icon: "ri:award-line",
        submenu: [
          { label: "Certificate Type", href: "#", page: "certificate-type" },
          { label: "Generate Certificate", href: "#", page: "generate-certificate" },
        ],
      },
      {
        title: "Scholarship",
        icon: "ri:graduation-cap-line",
        submenu: [
          { label: "Candidate", href: "#", page: "candidate" },
          { label: "Donar", href: "#", page: "donar" },
          { label: "Scholarship", href: "#", page: "scholarship" },
        ],
      },
      {
        title: "Guardian",
        icon: "ri:account-circle-line",
        href: "#",
        page: "guardian",
      },
      */
    ],
  },
  {
    title: "Academic Management",
    items: [
      {
        title: "Academic",
        icon: "ri:bank-line",
        submenu: [
          { label: "Class", href: "#", page: "class" },
          { label: "Section", href: "#", page: "section" },
          { label: "Subject", href: "#", page: "subject" },
          { label: "Syllabus", href: "#", page: "syllabus" },
          { label: "Study Material", href: "#", page: "study-material" },
          { label: "Live Class", href: "#", page: "live-class" },
          { label: "Assignment", href: "#", page: "assignment" },
          { label: "Submission", href: "#", page: "submission" },
        ],
      },
      {
        title: "Lesson Plan",
        icon: "ri:file-list-3-line",
        submenu: [
          { label: "Lesson", href: "#", page: "lesson" },
          { label: "Topic", href: "#", page: "topic" },
          { label: "Lesson Timeline", href: "#", page: "lesson-timeline" },
          { label: "Lesson Status", href: "#", page: "lesson-status" },
          { label: "Lesson Plan", href: "#", page: "lesson-plan" },
        ],
      },
      {
        title: "Class Routine",
        icon: "ri:time-line",
        href: "#",
        page: "class-routine",
      },
      {
        title: "Teacher",
        icon: "ri:user-star-line",
        submenu: [
          { label: "Department", href: "#", page: "teacher-department" },
          { label: "Manage Teacher", href: "#", page: "manage-teacher" },
          { label: "Class Lecture", href: "#", page: "class-lecture" },
          { label: "Rating", href: "#", page: "rating" },
        ],
      },
    ],
  },

  /*
  {
    title: "Examination System",
    items: [
      {
        title: "Online Exam",
        icon: "ri:computer-line",
        submenu: [
          { label: "Exam Instruction", href: "#", page: "exam-instruction" },
          { label: "Question Bank", href: "#", page: "question-bank" },
          { label: "Online Exam", href: "#", page: "onlineexam" },
          { label: "Exam Result", href: "#", page: "exam-result" },
        ],
      },
      {
        title: "Manage Exam",
        icon: "ri:file-edit-line",
        submenu: [
          { label: "Exam Grade", href: "#", page: "exam-grade" },
          { label: "Exam Term", href: "#", page: "exam-term" },
          { label: "Schedule", href: "#", page: "schedule" },
          { label: "Suggestion", href: "#", page: "suggestion" },
          { label: "Attendance", href: "#", page: "attendance" },
        ],
      },
      {
        title: "Exam Mark",
        icon: "ri:file-chart-line",
        submenu: [
          { label: "Manage Mark", href: "#", page: "manage-mark" },
          { label: "Exam Term Result", href: "#", page: "exam-term-result" },
          { label: "Exam Final Result", href: "#", page: "exam-final-result" },
          { label: "Merit List", href: "#", page: "merit-list" },
          { label: "Mark Sheet", href: "#", page: "mark-sheet" },
          { label: "Result Card", href: "#", page: "result-card" },
          { label: "Mark Send by Email", href: "#", page: "mark-send-email" },
          { label: "Mark Send by SMS", href: "#", page: "mark-send-sms" },
          { label: "Result Send by Email", href: "#", page: "result-email" },
          { label: "Result Send by SMS", href: "#", page: "result-sms" },
        ],
      },
    ],
  },
  */

  {
    title: "Human Resource (HR)",
    items: [
      {
        title: "Human Resource",
        icon: "ri:team-line",
        submenu: [
          { label: "Manage Designation", href: "#", page: "manage-designation" },
          { label: "Manage Employees", href: "#", page: "manage-employee" },
        ],
      },
    ],
  },
  {
    title: "Manage Leave",
    items: [
      {
        title: "Manage Leave",
        icon: "ri:calendar-todo-line",
        submenu: [
          { label: "Leave Type", href: "#", page: "leave-type" },
          { label: "Leave Application", href: "#", page: "leave-application" },
          { label: "Waiting Application", href: "#", page: "waiting-application" },
          { label: "Approved Application", href: "#", page: "approved-application" },
          { label: "Declined Application", href: "#", page: "declined-application" },
        ],
      },
    ],
  },
  {
    title: "Payroll",
    items: [
      {
        title: "Payroll",
        icon: "ri:money-dollar-circle-line",
        submenu: [
          { label: "Salary Grade", href: "#", page: "salary-grade" },
          { label: "Salary Payment", href: "#", page: "salary-payment" },
          { label: "Salary History", href: "#", page: "salary-history" },
        ],
      },
    ],
  },
  {
    title: "Finance & Accounts",
    items: [
      {
        title: "Accounting",
        icon: "ri:calculator-line",
        submenu: [
          { label: "Discount", href: "#", page: "discount" },
          { label: "Fee Type", href: "#", page: "fee-type" },
          { label: "Fee Collection", href: "#", page: "fee-collection" },
          { label: "Manage Invoice", href: "#", page: "manage-invoice" },
          { label: "Due Invoice", href: "#", page: "due-invoice" },
          { label: "Due Receipt", href: "#", page: "due-receipt" },
          { label: "Paid Receipt", href: "#", page: "paid-receipt" },
          { label: "Due Fee Email", href: "#", page: "due-fee-email" },
          { label: "Due Fee SMS", href: "#", page: "due-fee-sms" },
          { label: "Income Head", href: "#", page: "income-head" },
          { label: "Income", href: "#", page: "income" },
          { label: "Expenditure Head", href: "#", page: "expenditure-head" },
          { label: "Expenditure", href: "#", page: "expenditure" },
        ],
      },
      {
        title: "Report",
        icon: "ri:bar-chart-line",
        submenu: [
          { label: "Income Report", href: "#", page: "income-report" },
          { label: "Expenditure Report", href: "#", page: "expenditure-report" },
          { label: "Invoice Report", href: "#", page: "invoice-report" },
          { label: "Due Fee Report", href: "#", page: "due-fee-report" },
          { label: "Fee Collection Report", href: "#", page: "fee-collection-report" },
          { label: "Accounting Balance Report", href: "#", page: "accounting-balance-report" },
          { label: "Library Report", href: "#", page: "library-report" },
          { label: "Student Attendance Report", href: "#", page: "student-attendance-report" },
          { label: "Student Yearly Attendance Report", href: "#", page: "student-yearly-attendance-report" },
          { label: "Teacher Attendance Report", href: "#", page: "teacher-attendance-report" },
          { label: "Teacher Yearly Attendance Report", href: "#", page: "teacher-yearly-attendance-report" },
          { label: "Employee Attendance Report", href: "#", page: "employee-attendance-report" },
          { label: "Employee Yearly Attendance Report", href: "#", page: "employee-yearly-attendance-report" },
          { label: "Student Report", href: "#", page: "student-report" },
          { label: "Student Invoice Report", href: "#", page: "student-invoice-report" },
          { label: "Student Activity Report", href: "#", page: "student-activity-report" },
          { label: "Payroll Report", href: "#", page: "payroll-report" },
          { label: "Daily Transaction Report", href: "#", page: "daily-transaction-report" },
          { label: "Daily Statement Report", href: "#", page: "daily-statement-report" },
          { label: "Exam Result Report", href: "#", page: "exam-result-report" },
        ],
      },
    ],
  },

  /*
  {
    title: "Inventory & Assets",
    items: [
      {
        title: "Inventory",
        icon: "ri:box-3-line",
        submenu: [
          { label: "Suppliers", href: "#", page: "suppliers" },
          { label: "Warehouse", href: "#", page: "warehouse" },
          { label: "Category", href: "#", page: "inventory-category" },
          { label: "Product", href: "#", page: "inventory-product" },
          { label: "Purchase", href: "#", page: "inventory-purchase" },
          { label: "Sale", href: "#", page: "inventory-sale" },
          { label: "Issue", href: "#", page: "inventory-issue" },
        ],
      },
      {
        title: "Asset Management",
        icon: "ri:building-2-line",
        submenu: [
          { label: "Vendor", href: "#", page: "asset-vendor" },
          { label: "Store", href: "#", page: "asset-store" },
          { label: "Category", href: "#", page: "asset-category" },
          { label: "Item", href: "#", page: "asset-item" },
          { label: "Purchase", href: "#", page: "asset-purchase" },
          { label: "Issue", href: "#", page: "asset-issue" },
        ],
      },
      {
        title: "Library",
        icon: "ri:book-2-line",
        submenu: [
          { label: "Books List", href: "#", page: "books-list" },
          { label: "Library Members", href: "#", page: "library-members" },
          { label: "Issue/Return", href: "#", page: "library-issue-return" },
          { label: "E-Book", href: "#", page: "ebook" },
        ],
      },
    ],
  },
  {
    title: "Transport & Facilities",
    items: [
      {
        title: "Transport",
        icon: "ri:bus-line",
        submenu: [
          { label: "Vehicles", href: "#", page: "vehicles" },
          { label: "Transport Route", href: "#", page: "transport-route" },
          { label: "Transport Member", href: "#", page: "transport-member" },
        ],
      },
      {
        title: "Hostel",
        icon: "ri:hotel-bed-line",
        submenu: [
          { label: "Manage Hostel", href: "#", page: "manage-hostel" },
          { label: "Manage Room", href: "#", page: "manage-room" },
          { label: "Hostel Member", href: "#", page: "hostel-member" },
        ],
      },
    ],
  },
  {
    title: "Communication System",
    items: [
      {
        title: "Mail & SMS",
        icon: "ri:mail-line",
        submenu: [
          { label: "Email", href: "#", page: "email" },
          { label: "SMS", href: "#", page: "sms" },
        ],
      },
    ],
  },
  {
    title: "Website (CMS)",
    items: [
      {
        title: "Manage Frontend",
        icon: "ri:layout-line",
        submenu: [
          { label: "Frontend Page", href: "#", page: "frontend-page" },
          { label: "Slider", href: "#", page: "slider" },
          { label: "About School", href: "#", page: "about-school" },
        ],
      },
    ],
  },
  {
    title: "Miscellaneous",
    items: [
      {
        title: "Miscellaneous",
        icon: "ri:more-2-line",
        submenu: [
          { label: "Tools", href: "#", page: "tools" },
          { label: "Settings", href: "#", page: "settings" },
        ],
      },
      {
        title: "Subscription (SaaS)",
        icon: "ri:vip-crown-line",
        submenu: [
          { label: "FAQ", href: "#", page: "faq" },
          { label: "Slider", href: "#", page: "subscription-slider" },
          { label: "Subscription Settings", href: "#", page: "subscription-settings" },
          { label: "General Settings", href: "#", page: "general-settings" },
          { label: "Subscription Plans", href: "#", page: "subscription-plans" },
          { label: "School Subscription", href: "#", page: "school-subscription" },
        ],
      },
    ],
  },
  */
];

const Sidebar = ({ onNavigate, currentPage, user, onLogout }) => {
  const { isOpen, isCollapsed, closeSidebar, toggleSidebar } = useSidebar();

  const username =
    user?.username ||
    user?.userName ||
    user?.name ||
    user?.fullName ||
    user?.email ||
    "User";

  const role = normalizeRole(user?.role || user?.userRole || user?.authority);

  const isStudent = role === "STUDENT";
  const isSchoolAdmin = role === "SCHOOL_ADMIN";
  const isTeacher = role === "TEACHER";
  const isSuperAdmin = role === "SUPER_ADMIN";

  const studentAllowedPages = new Set([
    "dashboard",
    "student-dashboard",
    "class-routine",
    "subject",
    "syllabus",
    "study-material",
    "live-class",
    "assignment",
    "submission",
    "lesson",
    "topic",
    "lesson-timeline",
    "lesson-status",
    "lesson-plan",
  ]);

  const schoolAdminAllowedPages = new Set([
    "dashboard",
    "school-admin-dashboard",
    "teacher-department",
    "user-role-acl",
    "academic-year",
    "class",
    "section",
    "subject",
    "manage-teacher",
    "student-list",
    "student-type",
    "online-admission",
    "student-activity",
    "syllabus",
    "study-material",
    "live-class",
    "assignment",
    "submission",
    "lesson",
    "topic",
    "lesson-timeline",
    "lesson-status",
    "lesson-plan",
    "class-routine",
    "manage-designation",
    "manage-employee",
    "leave-type",
    "leave-application",
    "waiting-application",
    "approved-application",
    "declined-application",
  ]);

  const teacherVisiblePages = new Set([
    "teacher-dashboard",
    "student-type",
    "student-list",
    "online-admission",
    "class",
    "section",
    "subject",
    "syllabus",
    "study-material",
    "live-class",
    "assignment",
    "submission",
    "lesson",
    "topic",
    "lesson-timeline",
    "lesson-status",
    "lesson-plan",
    "class-routine",
    "leave-application",
  ]);

  const parentVisiblePages = new Set([
    "parent-dashboard",
    "dashboard",
    "class-routine",
    "student-attendance",
    "exam-result",
    "mark-sheet",
    "result-card",
    "fee-collection",
    "subject",
    "syllabus",
    "study-material",
    "live-class",
    "assignment",
    "submission",
    "lesson",
    "topic",
    "lesson-timeline",
    "lesson-status",
    "lesson-plan",
  ]);

  const canOpenPage = (page) => {
    if (!page) return true;
    if (isStudent) return studentAllowedPages.has(page);
    if (isSchoolAdmin) return schoolAdminAllowedPages.has(page);
    if (isTeacher) return teacherVisiblePages.has(page);
    if (role === "PARENT") return parentVisiblePages.has(page);
    return true;
  };

  const canOpenUserRoles = () => {
    if (!canManageUsers(user)) return false;
    return true;
  };

  const filteredSections = menuSections
    .map((section) => ({
      ...section,
      items: (Array.isArray(section.items) ? section.items : [])
        .filter((item) => {
          if (role === "PARENT" && item.page && !canOpenPage(item.page)) return false;
          if (!isStudent && !isSchoolAdmin && !isTeacher && role !== "PARENT") return true;
          if (item.page && canOpenPage(item.page)) return true;
          if (Array.isArray(item.submenu)) {
            return item.submenu.some((sub) => sub?.page && canOpenPage(sub.page));
          }
          return false;
        })
        .filter((item) => isSuperAdmin || !item.perm || can(user, item.perm))
        .map((item) => ({
          ...item,
          submenu: Array.isArray(item.submenu)
            ? item.submenu
                .filter((sub) => canOpenPage(sub.page))
                .filter((sub) => isSuperAdmin || !sub.perm || sub.perm === "*" || can(user, sub.perm))
                .filter((sub) => !(role === "PARENT" && ["class", "section"].includes(sub?.page)))
            : item.submenu,
        }))
        .filter((item) => {
          if (!Array.isArray(item.submenu)) return true;
          return item.submenu.length > 0 || !!item.page;
        }),
    }))
    .filter((section) => section.items.length > 0);

  const buildOpenKey = (sectionIndex, itemIndex) => `${sectionIndex}-${itemIndex}`;

  const findActiveKey = () => {
    for (let si = 0; si < filteredSections.length; si++) {
      const section = filteredSections[si];
      for (let ii = 0; ii < section.items.length; ii++) {
        const item = section.items[ii];
        if (Array.isArray(item.submenu)) {
          if (item.submenu.some((sub) => sub.page && sub.page === currentPage)) {
            return buildOpenKey(si, ii);
          }
        }
      }
    }
    return null;
  };

  const [openKey, setOpenKey] = useState(() => findActiveKey());

  useEffect(() => {
    const activeKey = findActiveKey();
    if (activeKey) setOpenKey(activeKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleDropdownToggle = (key) => {
    setOpenKey((prev) => (prev === key ? null : key));
  };

  const handleNavClick = (e, page) => {
    e.preventDefault();
    e.stopPropagation();
    if (onNavigate) onNavigate(page);
    closeSidebar();
  };

  const sidebarClass = [
    "sidebar",
    isOpen ? "sidebar-open" : "",
    isCollapsed ? "active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      <aside className={sidebarClass}>
        <button type="button" className="sidebar-close-btn" onClick={closeSidebar}>
          <iconify-icon icon="ri:close-line"></iconify-icon>
        </button>

        <div>
          <div className="sidebar-logo d-flex align-items-center justify-content-between">
            <a href="#" className="sidebar-logo__brand">
              <img src="/assets/images/logo.png" alt="site logo" className="light-logo" />
              <img src="/assets/images/logo-light.png" alt="site logo" className="dark-logo" />
              <img src="/assets/images/logo-icon.png" alt="site logo" className="logo-icon" />
            </a>
            <button
              type="button"
              className="sidebar-collapse-btn text-xxl d-xl-flex d-none line-height-1 text-neutral-500"
              aria-label="Collapse Sidebar"
              onClick={toggleSidebar}
            >
              <iconify-icon icon="ri:contract-left-line"></iconify-icon>
            </button>
          </div>
        </div>

        <div className="mx-16 py-12">
          <div className="dropdown profile-dropdown">
            <button
              type="button"
              className="profile-dropdown__button d-flex align-items-center justify-content-between p-10 w-100 overflow-hidden bg-neutral-50 radius-12"
              data-bs-toggle="dropdown"
              data-bs-display="static"
              aria-expanded="false"
            >
              <span className="d-flex align-items-start gap-10">
                <img
                  src="/assets/images/thumbs/leave-request-img2.png"
                  alt="User"
                  className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                />
                <span className="profile-dropdown__contents">
                  <span className="h6 mb-0 text-md d-block text-primary-light">{username}</span>
                  {role ? <span className="text-secondary-light text-sm mb-0 d-block">{role}</span> : null}
                </span>
              </span>
              <span className="profile-dropdown__icon pe-8 text-xl d-flex line-height-1">
                <iconify-icon icon="ri:arrow-right-s-line"></iconify-icon>
              </span>
            </button>

            <ul className="dropdown-menu dropdown-menu-lg-end border p-12">
              <li>
                <a href="#" className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6">
                  <iconify-icon icon="ri:user-3-line"></iconify-icon> My Profile
                </a>
              </li>
              <li>
                <a href="#" className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6">
                  <iconify-icon icon="ri:settings-3-line"></iconify-icon> Setting
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6"
                  onClick={(e) => {
                    e.preventDefault();
                    onLogout?.();
                  }}
                >
                  <iconify-icon icon="ri:shut-down-line"></iconify-icon> Log Out
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="sidebar-menu-area">
          <ul className="sidebar-menu" id="sidebar-menu">
            {filteredSections.map((section, sectionIndex) => (
              <React.Fragment key={sectionIndex}>
                {section.title ? (
                  <li className={`sidebar-menu-group-title ${isCollapsed ? "hidden" : ""}`}>
                    {section.title}
                  </li>
                ) : null}

                {section.items.map((item, itemIndex) => {
                  const hasSubmenu = Array.isArray(item.submenu) && item.submenu.length > 0;
                  const key = buildOpenKey(sectionIndex, itemIndex);
                  const isOpenDropdown = hasSubmenu && openKey === key;
                  const isItemActive = item.page && item.page === currentPage;

                  return (
                    <li
                      key={itemIndex}
                      className={[hasSubmenu ? "dropdown" : "", isOpenDropdown ? "open" : "", isOpenDropdown ? "active-parent" : ""]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <a
                        href={item.href || "#"}
                        className={isItemActive ? "active-page" : ""}
                        onClick={(e) => {
                          e.preventDefault();
                          if (hasSubmenu) {
                            handleDropdownToggle(key);
                            if (item.page && onNavigate) onNavigate(item.page);
                          } else if (item.page) {
                            handleNavClick(e, item.page);
                          }
                        }}
                      >
                        <iconify-icon icon={item.icon} className="menu-icon"></iconify-icon>
                        <span>{item.title}</span>
                        {hasSubmenu ? <iconify-icon icon="ri:arrow-down-s-line" className="sidebar-menu__arrow"></iconify-icon> : null}
                      </a>

                      {hasSubmenu ? (
                        <ul className="sidebar-submenu">
                          {item.submenu
                            .filter((sub) => {
                              if (sub?.page === "user-role-acl") return canOpenUserRoles();
                              return true;
                            })
                            .map((sub, subIndex) => (
                              <li key={subIndex}>
                                <a
                                  href={sub.href}
                                  className={sub.page && sub.page === currentPage ? "active-page" : ""}
                                  onClick={(e) => {
                                    if (sub.page) handleNavClick(e, sub.page);
                                  }}
                                >
                                  <iconify-icon icon="ri:circle-fill" className="circle-icon w-auto" style={{ fontSize: "6px" }}></iconify-icon>
                                  <span>{sub.label}</span>
                                </a>
                              </li>
                            ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </React.Fragment>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
