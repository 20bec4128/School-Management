import React, { useMemo, useState } from "react";
import "../css/sidebar.css";
import { useSidebar } from "../context/SidebarContext";
import { normalizeRole } from "../utils/roles";
import { useAuth } from "../context/useAuth";
import { canShowNavPage } from "../utils/navigationVisibility";

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
            label: "General Settings",
            href: "#",
            page: "general-settings",
            perm: "SCHOOL_MANAGE",
          },
          {
            label: "Manage School",
            href: "#",
            page: "manage-school",
            perm: "SCHOOL_MANAGE",
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
          {
            label: "Academic Year",
            href: "#",
            page: "academic-year",
            perm: "SCHOOL_MANAGE",
          },
          {
            label: "Manage User Roles",
            href: "#",
            page: "user-role-acl",
            perm: ["RBAC_MANAGE", "SCHOOL_RBAC_MANAGE"],
          },
          {
            label: "Manage Super Admin",
            href: "#",
            page: "manage-super-admin",
            perm: "*",
          },
          {
            label: "Manage Feedback",
            href: "#",
            page: "manage-feedback",
            perm: "SCHOOL_MANAGE",
          },
          {
            label: "Backup Database",
            href: "#",
            page: "backup-database",
            perm: "*",
          },
          {
            label: "Opening Hour",
            href: "#",
            page: "opening-hour",
            perm: "SCHOOL_MANAGE",
          },
        ],
      },
    ],
  },

  {
    title: "Office Services",
    items: [
      {
        title: "Visitor Management",
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
          {
            label: "Admit Card Setting",
            href: "#",
            page: "admit-card-setting",
          },
        ],
      },
      {
        title: "Certificate",
        icon: "ri:award-line",
        submenu: [
          { label: "Certificate Type", href: "#", page: "certificate-type" },
          {
            label: "Generate Certificate",
            href: "#",
            page: "generate-certificate",
          },
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

  {
    title: "Human Resource",
    items: [
      {
        title: "Human Resource",
        icon: "ri:team-line",
        submenu: [
          {
            label: "Manage Designation",
            href: "#",
            page: "manage-designation",
          },
          { label: "Manage Employees", href: "#", page: "manage-employee" },
        ],
      },
       {
        title: "Attendance",
        icon: "ri:calendar-check-line",
        submenu: [
          {
            label: "Student Attendance",
            href: "#",
            page: "student-attendance",
          },
          {
            label: "Teacher Attendance",
            href: "#",
            page: "teacher-attendance",
          },
          {
            label: "Employee Attendance",
            href: "#",
            page: "employee-attendance",
          },
          { label: "Absent Email", href: "#", page: "absent-email" },
          { label: "Absent SMS", href: "#", page: "absent-sms" },
        ],
      },
       {
        title: "Manage Leave",
        icon: "ri:calendar-todo-line",
        submenu: [
          { label: "Leave Type", href: "#", page: "leave-type" },
          { label: "Leave Application", href: "#", page: "leave-application" },
          {
            label: "Waiting Application",
            href: "#",
            page: "waiting-application",
          },
          {
            label: "Approved Application",
            href: "#",
            page: "approved-application",
          },
          {
            label: "Declined Application",
            href: "#",
            page: "declined-application",
          },
        ],
      },
    ],
  },
  
  
  {
    title: "Finance & Accounts",
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
          {
            label: "Expenditure Report",
            href: "#",
            page: "expenditure-report",
          },
          { label: "Invoice Report", href: "#", page: "invoice-report" },
          { label: "Due Fee Report", href: "#", page: "due-fee-report" },
          {
            label: "Fee Collection Report",
            href: "#",
            page: "fee-collection-report",
          },
          {
            label: "Accounting Balance Report",
            href: "#",
            page: "accounting-balance-report",
          },
          { label: "Library Report", href: "#", page: "library-report" },
          {
            label: "Student Attendance Report",
            href: "#",
            page: "student-attendance-report",
          },
          {
            label: "Student Yearly Attendance Report",
            href: "#",
            page: "student-yearly-attendance-report",
          },
          {
            label: "Teacher Attendance Report",
            href: "#",
            page: "teacher-attendance-report",
          },
          {
            label: "Teacher Yearly Attendance Report",
            href: "#",
            page: "teacher-yearly-attendance-report",
          },
          {
            label: "Employee Attendance Report",
            href: "#",
            page: "employee-attendance-report",
          },
          {
            label: "Employee Yearly Attendance Report",
            href: "#",
            page: "employee-yearly-attendance-report",
          },
          { label: "Student Report", href: "#", page: "student-report" },
          {
            label: "Student Invoice Report",
            href: "#",
            page: "student-invoice-report",
          },
          {
            label: "Student Activity Report",
            href: "#",
            page: "student-activity-report",
          },
          { label: "Payroll Report", href: "#", page: "payroll-report" },
          {
            label: "Daily Transaction Report",
            href: "#",
            page: "daily-transaction-report",
          },
          {
            label: "Daily Statement Report",
            href: "#",
            page: "daily-statement-report",
          },
          {
            label: "Exam Result Report",
            href: "#",
            page: "exam-result-report",
          },
        ],
      },
    ],
  },

  {
    title: "Inventory & Assets",
    items: [
      {
        title: "Inventory",
        icon: "ri:box-3-line",
        submenu: [
          {
            label: "Supplier",
            href: "#",
            page: "supplier",
            perm: ["SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"],
          },
          { label: "Warehouse", href: "#", page: "warehouse" },
          { label: "Category", href: "#", page: "category" },
          { label: "Product", href: "#", page: "product" },
          { label: "Purchase", href: "#", page: "purchase" },
          { label: "Sale", href: "#", page: "sale" },
          { label: "Issue", href: "#", page: "issue" },
        ],
      },
      {
        title: "Library",
        icon: "ri:book-2-line",
        submenu: [
          { label: "Book", href: "#", page: "book" },
          { label: "Library Members", href: "#", page: "library-members" },
          {
            label: "Non Library Members",
            href: "#",
            page: "non-library-members",
          },
          { label: "Issue/Return", href: "#", page: "issue-return" },
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
          { label: "Vehicle", href: "#", page: "vehicle" },
          { label: "Transport Route", href: "#", page: "transport-route" },
          { label: "Transport Member", href: "#", page: "transport-member" },
          {
            label: "Non Transport Member",
            href: "#",
            page: "non-transport-member",
          },
        ],
      },
      {
        title: "Hostel",
        icon: "ri:hotel-bed-line",
        submenu: [
          { label: "Manage Hostel", href: "#", page: "manage-hostel" },
          { label: "Manage Room", href: "#", page: "manage-room" },
          { label: "Hostel Member", href: "#", page: "hostel-member" },
          { label: "Non Hostel Member", href: "#", page: "non-hostel-member" },
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
          { label: "Manage Award", href: "#", page: "manage-award" },
          { label: "Todo", href: "#", page: "manage-todo" },
          { label: "FAQ", href: "#", page: "faq" },
        ],
      },
      {
        title: "Subscription (SaaS)",
        icon: "ri:vip-crown-line",
        submenu: [
          { label: "FAQ", href: "#", page: "subscription-faq" },
          { label: "Slider", href: "#", page: "subscription-slider" },
          {
            label: "Subscription Settings",
            href: "#",
            page: "subscription-settings",
          },
          { label: "General Settings", href: "#", page: "general-settings" },
          {
            label: "Subscription Plans",
            href: "#",
            page: "subscription-plans",
          },
          {
            label: "School Subscription",
            href: "#",
            page: "school-subscription",
          },
        ],
      },
    ],
  },
];

const Sidebar = ({ onNavigate, currentPage, user, onLogout }) => {
  const { isOpen, isCollapsed, closeSidebar, toggleSidebar } = useSidebar();
  const { generalSettings, pagePermissions, isSuperAdminRole } = useAuth();

  const username =
    user?.username ||
    user?.userName ||
    user?.name ||
    user?.fullName ||
    user?.email ||
    "User";

  const role = normalizeRole(user?.role || user?.userRole || user?.authority);

  const canOpenUserRoles = () => true;

  const filteredSections = menuSections.map((section) => {
    const items = (Array.isArray(section.items) ? section.items : [])
      .map((item) => {
        const hasSubmenu = Array.isArray(item.submenu) && item.submenu.length > 0;
        if (hasSubmenu) {
          const filteredSubs = item.submenu.filter((sub) => {
            if (sub?.page === "user-role-acl" && !canOpenUserRoles()) return false;
            if (sub?.page) {
              return canShowNavPage({
                page: sub.page,
                pagePermissions,
                isSuperAdminRole,
              });
            }
            return true;
          });
          return {
            ...item,
            submenu: filteredSubs
          };
        } else {
          return { ...item };
        }
      })
      .filter((item) => {
        const hasSubmenu = Array.isArray(item.submenu) && item.submenu.length > 0;
        if (hasSubmenu) return true;
        if (Array.isArray(item.submenu) && item.submenu.length === 0) return false;
        if (item.page) {
          return canShowNavPage({
            page: item.page,
            pagePermissions,
            isSuperAdminRole,
          });
        }
        return true;
      });

    return {
      ...section,
      items
    };
  }).filter(section => section.items.length > 0);

  const buildOpenKey = (sectionIndex, itemIndex) =>
    `${sectionIndex}-${itemIndex}`;

  const activeKey = useMemo(() => {
    for (let si = 0; si < filteredSections.length; si++) {
      const section = filteredSections[si];
      for (let ii = 0; ii < section.items.length; ii++) {
        const item = section.items[ii];
        if (Array.isArray(item.submenu)) {
          const isActiveChild = item.submenu.some(
            (sub) => sub.page && sub.page === currentPage,
          );
          if (isActiveChild) return buildOpenKey(si, ii);
        }
      }
    }
    return null;
  }, [filteredSections, currentPage]);

  // undefined = follow the active route, false = explicitly closed, string = explicitly opened
  const [manualOpenKey, setManualOpenKey] = useState(undefined);
  const openKey =
    isCollapsed
      ? null
      : manualOpenKey === undefined
        ? activeKey
        : manualOpenKey || null;

  const handleDropdownToggle = (key) => {
    setManualOpenKey((prev) => {
      const currentOpenKey = prev === undefined ? activeKey : prev || null;
      return currentOpenKey === key ? false : key;
    });
  };

  const handleNavClick = (e, page) => {
    e.preventDefault();
    e.stopPropagation();
    if (onNavigate) onNavigate(page);
    closeSidebar();
  };

  // IMPROVED: robust top clamping that keeps flyout fully inside viewport
  const handleMenuItemMouseEnter = (e, subCount = 0) => {
    if (!isCollapsed) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const flyoutHeight = Math.min(
      window.innerHeight - 24,
      Math.max(52, 48 + subCount * 36),
    );
    // ideal top = align with menu item's top edge
    let top = rect.top;
    // clamp to not go off screen top or bottom
    top = Math.max(8, top);
    const maxAllowedTop = window.innerHeight - flyoutHeight - 8;
    top = Math.min(top, maxAllowedTop);
    const maxHeight = Math.min(
      window.innerHeight - top - 12,
      flyoutHeight + 20,
    );

    e.currentTarget.style.setProperty("--flyout-top", `${top}px`);
    e.currentTarget.style.setProperty("--flyout-max-height", `${maxHeight}px`);
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
        <button
          type="button"
          className="sidebar-close-btn"
          onClick={closeSidebar}
        >
          <iconify-icon icon="ri:close-line"></iconify-icon>
        </button>

        <div className="sidebar-logo d-flex align-items-center justify-content-between">
            <a href="#" className="sidebar-logo__brand">
              <img
                src={generalSettings?.brandLogo || "/assets/images/logo.png"}
                alt="site logo"
                className="light-logo"
                style={{ maxHeight: "36px", objectFit: "contain" }}
              />
              <img
                src={
                  generalSettings?.brandLogo || "/assets/images/logo-light.png"
                }
                alt="site logo"
                className="dark-logo"
                style={{ maxHeight: "36px", objectFit: "contain" }}
              />
              <img
                src={
                  generalSettings?.faviconIcon ||
                  generalSettings?.brandLogo ||
                  "/assets/images/logo-icon.png"
                }
                alt="site logo"
                className="logo-icon"
                style={{ maxHeight: "36px", objectFit: "contain" }}
              />
            </a>

            {/* ✅ FIX: removed 'd-xl-flex d-none' classes */}
            <button
              type="button"
              className="sidebar-collapse-btn text-xxl line-height-1"
              aria-label="Collapse Sidebar"
              onClick={toggleSidebar}
              >
              <iconify-icon
                icon={
                  isCollapsed ? "ri:arrow-right-s-line" : "ri:arrow-left-s-line"
                }
              ></iconify-icon>
            </button>
        </div>

        <div className="mx-16 py-12">
          <div className="dropdown profile-dropdown">
            <button
              type="button"
              className="profile-dropdown__button d-flex align-items-center justify-content-between p-10 w-100 overflow-hidden radius-12"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              onClick={(e) => {
                if (isCollapsed) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget
                    .closest(".profile-dropdown")
                    .querySelector(".dropdown-menu")
                    ?.style.setProperty("--profile-top", `${rect.top}px`);
                }
              }}
            >
              <span className="d-flex align-items-start gap-10">
                <img
                  src="/assets/images/thumbs/leave-request-img2.png"
                  alt="User"
                  className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                />
                <span className="profile-dropdown__contents">
                  <span
                    className="h6 mb-0 text-md d-block"
                    style={{ color: "#e2e8f0" }}
                  >
                    {username}
                  </span>
                  {role ? (
                    <span
                      className="text-sm mb-0 d-block"
                      style={{ color: "#8fa3c0" }}
                    >
                      {role}
                    </span>
                  ) : null}
                </span>
              </span>
              <span
                className="profile-dropdown__icon pe-8 text-xl d-flex line-height-1"
                style={{ color: "#6b7fa3" }}
              >
                <iconify-icon icon="ri:arrow-right-s-line"></iconify-icon>
              </span>
            </button>
            <ul className="dropdown-menu border p-12">
              <li>
                <a
                  href="#"
                  className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6"
                >
                  <iconify-icon icon="ri:user-3-line"></iconify-icon>
                  My Profile
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6"
                >
                  <iconify-icon icon="ri:settings-3-line"></iconify-icon>
                  Setting
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
                  <iconify-icon icon="ri:shut-down-line"></iconify-icon>
                  Log Out
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
                  <li
                    className={`sidebar-menu-group-title ${
                      isCollapsed ? "hidden" : ""
                    }`}
                  >
                    {section.title}
                  </li>
                ) : null}

                {section.items.map((item, itemIndex) => {
                  const hasSubmenu =
                    Array.isArray(item.submenu) && item.submenu.length > 0;
                  const key = buildOpenKey(sectionIndex, itemIndex);
                  const isOpenDropdown = hasSubmenu && openKey === key;
                  const isItemActive = item.page && item.page === currentPage;

                  const filteredSubs = hasSubmenu ? item.submenu : [];

                  return (
                    <li
                      key={itemIndex}
                      className={[
                        hasSubmenu ? "dropdown" : "",
                        isOpenDropdown ? "open" : "",
                        isOpenDropdown ? "active-parent" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onMouseEnter={
                        isCollapsed
                          ? (e) =>
                              handleMenuItemMouseEnter(e, filteredSubs.length)
                          : undefined
                      }
                    >
                      <a
                        href={item.href || "#"}
                        className={isItemActive ? "active-page" : ""}
                        onClick={(e) => {
                          e.preventDefault();
                          if (hasSubmenu) {
                            if (!isCollapsed) handleDropdownToggle(key);
                          } else if (item.page) {
                            handleNavClick(e, item.page);
                          }
                        }}
                      >
                        <iconify-icon
                          icon={item.icon}
                          className="menu-icon"
                        ></iconify-icon>
                        <span>{item.title}</span>
                        {hasSubmenu ? (
                          <iconify-icon
                            icon="ri:arrow-down-s-line"
                            className="sidebar-menu__arrow"
                          ></iconify-icon>
                        ) : null}
                      </a>

                      {hasSubmenu ? (
                        <ul className="sidebar-submenu">
                          {filteredSubs.map((sub, subIndex) => (
                            <li key={subIndex}>
                              <a
                                href={sub.href || "#"}
                                className={
                                  sub.page && sub.page === currentPage
                                    ? "active-page"
                                    : ""
                                }
                                onClick={(e) => {
                                  if (sub.page) handleNavClick(e, sub.page);
                                }}
                              >
                                <span>{sub.label}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {isCollapsed && (
                        <div
                          className={`sidebar-flyout${
                            !hasSubmenu ? " flyout-leaf" : ""
                          }`}
                        >
                          {hasSubmenu ? (
                            <span className="flyout-title flyout-title-highlight">
                              {item.title}
                            </span>
                          ) : (
                            <a
                              href={item.href || "#"}
                              className={`flyout-title flyout-title-clickable ${
                                item.page && item.page === currentPage
                                  ? "active-page"
                                  : ""
                              }`}
                              onClick={(e) => {
                                if (item.page) handleNavClick(e, item.page);
                              }}
                            >
                              {item.title}
                            </a>
                          )}
                          {filteredSubs.map((sub, subIndex) => (
                            <a
                              key={subIndex}
                              href={sub.href || "#"}
                              className={`flyout-link ${
                                sub.page && sub.page === currentPage
                                  ? "active-page"
                                  : ""
                              }`}
                              onClick={(e) => {
                                if (sub.page) handleNavClick(e, sub.page);
                              }}
                            >
                              {sub.label}
                            </a>
                          ))}
                        </div>
                      )}
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
