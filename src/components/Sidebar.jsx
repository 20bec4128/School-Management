import React, { useState, useEffect } from 'react';
import '../css/sidebar.css';
import { useSidebar } from '../context/SidebarContext';
import { can } from '../utils/permissions';
import { canManageUsers } from '../utils/editableRoles';
import { normalizeRole } from '../utils/roles';

const menuSections = [
  {
    title: 'Core System',
    items: [
      {
        title: 'Dashboard',
        icon: 'ri:dashboard-line',
        submenu: [
          { label: 'School', href: '#', page: 'school-admin-dashboard', perm: '*' },
          { label: 'Student', href: '#', page: 'student-dashboard', perm: '*' },
          { label: 'Teacher', href: '#', page: 'teacher-dashboard', perm: '*' },
          { label: 'Parent', href: '#', page: 'parent-dashboard', perm: '*' },
          { label: 'LMS', href: '#', page: 'lms-dashboard', perm: '*' },
        ],
      },
      {
        title: 'Administrator',
        icon: 'ri:user-settings-line',
        submenu: [
          { label: 'Head Offices', href: '#', page: 'head-offices', perm: 'HEAD_OFFICE_MANAGE' },
          { label: 'Manage School', href: '#', page: 'manage-school', perm: 'SCHOOL_MANAGE' },
          { label: 'Manage User Roles', href: '#', page: 'user-role-acl', perm: ['RBAC_MANAGE', 'SCHOOL_RBAC_MANAGE'] },
          { label: 'Payment Setting', href: '#', page: 'payment-setting', perm: 'SCHOOL_MANAGE' },
          { label: 'SMS Setting', href: '#', page: 'sms-setting', perm: 'SCHOOL_MANAGE' },
          { label: 'Email Setting', href: '#', page: 'email-setting', perm: 'SCHOOL_MANAGE' },
          { label: 'Academic Year', href: '#', perm: 'SCHOOL_MANAGE' },
        ],
      },
    ],
  },
  {
    title: 'Student Management',
    items: [
      {
        title: 'Manage Student',
        icon: 'ri:group-line',
        perm: 'STUDENT_TYPE_MANAGE',
        submenu: [
          { label: 'Student Type', href: '#', page: 'student-type' },
          { label: 'Student List', href: '#', page: 'student-list' },
          { label: 'Online Admission', href: '#', page: 'online-admission' },
          { label: 'Student Activity', href: '#', page: 'student-activity' },
        ],
      },
    ],
  },
  {
    title: 'Academic Management',
    items: [
      {
        title: 'Academic',
        icon: 'ri:bank-line',
        submenu: [
          { label: 'Class', href: '#', page: 'class' },
          { label: 'Section', href: '#', page: 'section' },
          { label: 'Subject', href: '#', page: 'subject' },
          { label: 'Syllabus', href: '#', page: 'syllabus' },
          { label: 'Study Material', href: '#', page: 'study-material' },
          { label: 'Live Class', href: '#', page: 'live-class' },
          { label: 'Assignment', href: '#', page: 'assignment' },
          { label: 'Submission', href: '#', page: 'submission' },
        ],
      },
      {
        title: 'Lesson Plan',
        icon: 'ri:file-list-3-line',
        submenu: [
          { label: 'Lesson', href: '#', page: 'lesson' },
          { label: 'Topic', href: '#', page: 'topic' },
          { label: 'Lesson Timeline', href: '#', page: 'lesson-timeline' },
          { label: 'Lesson Status', href: '#', page: 'lesson-status' },
          { label: 'Lesson Plan', href: '#', page: 'lesson-plan' },
        ],
      },
      {
        title: 'Class Routine',
        icon: 'ri:time-line',
        href: '#',
        page: 'class-routine',
      },
      {
        title: 'Teacher',
        icon: 'ri:user-star-line',
        submenu: [
          { label: 'Department', href: '#', page: 'teacher-department' },
          { label: 'Manage Teacher', href: '#', page: 'manage-teacher' },
          { label: 'Class Lecture', href: '#', page: 'class-lecture' },
          { label: 'Rating', href: '#', page: 'rating' },
        ],
      },
    ],
  },
  {
    title: 'Human Resource (HR)',
    items: [
      {
        title: 'Human Resource',
        icon: 'ri:team-line',
        submenu: [
          { label: 'Manage Destination', href: '#', page: 'manage-designation' },
          { label: 'Manage Employees', href: '#', page: 'manage-employee' },
        ],
      },
    ],
  },
  {
    title: 'Manage Leave',
    items: [
      {
        title: 'Manage Leave',
        icon: 'ri:calendar-todo-line',
        submenu: [
          { label: 'Leave Type', href: '#', page: '' },
          { label: 'Leave Application', href: '#', page: '' },
          { label: 'Waiting Application', href: '#', page: '' },
          { label: 'Approved Application', href: '#', page: '' },
          { label: 'Declined Application', href: '#', page: '' },
        ],
      },
    ],
  },
];

const Sidebar = ({ onNavigate, currentPage, user, onLogout }) => {
  const { isOpen, isCollapsed, closeSidebar, toggleSidebar } = useSidebar();

  const username =
    user?.username ||
    user?.userName ||
    user?.name ||
    user?.fullName ||
    user?.email ||
    'User';
  const role = normalizeRole(user?.role || user?.userRole || user?.authority);
  const isStudent = role === 'STUDENT';
  const isSchoolAdmin = role === 'SCHOOL_ADMIN';
  const isTeacher = role === 'TEACHER';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  const studentAllowedPages = new Set([
    'dashboard', 'student-dashboard', 'class-routine', 'subject', 'syllabus',
    'study-material', 'live-class', 'assignment', 'submission', 'lesson',
    'topic', 'lesson-timeline', 'lesson-status', 'lesson-plan',
  ]);
  const schoolAdminAllowedPages = new Set([
    'dashboard', 'school-admin-dashboard', 'teacher-department', 'user-role-acl',
    'class', 'section', 'subject', 'manage-teacher', 'student-list', 'student-type',
    'online-admission', 'student-activity', 'syllabus', 'study-material', 'live-class',
    'assignment', 'submission', 'lesson', 'topic', 'lesson-timeline', 'lesson-status',
    'lesson-plan', 'class-routine',
  ]);
  const teacherVisiblePages = new Set([
    'teacher-dashboard', 'student-type', 'student-list', 'online-admission', 'class',
    'section', 'subject', 'syllabus', 'study-material', 'live-class', 'assignment',
    'submission', 'lesson', 'topic', 'lesson-timeline', 'lesson-status', 'lesson-plan',
    'class-routine',
  ]);
  const parentVisiblePages = new Set([
    'parent-dashboard', 'dashboard', 'class-routine', 'student-attendance', 'exam-result',
    'mark-sheet', 'result-card', 'fee-collection', 'subject', 'syllabus', 'study-material',
    'live-class', 'assignment', 'submission', 'lesson', 'topic', 'lesson-timeline',
    'lesson-status', 'lesson-plan',
  ]);

  const canOpenPage = (page) => {
    if (!page) return true;
    if (isStudent) return studentAllowedPages.has(page);
    if (isSchoolAdmin) return schoolAdminAllowedPages.has(page);
    if (isTeacher) return teacherVisiblePages.has(page);
    if (role === 'PARENT') return parentVisiblePages.has(page);
    return true;
  };

  const canOpenUserRoles = () => {
    if (!canManageUsers(user)) return false;
    return true;
  };

  // ─── Build the filtered sections ──────────────────────────────────────────
  const filteredSections = menuSections
    .map((section) => ({
      ...section,
      items: (Array.isArray(section.items) ? section.items : [])
        .filter((item) => {
          if (role === 'PARENT' && item.page && !canOpenPage(item.page)) return false;
          if (!isStudent && !isSchoolAdmin) return true;
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
                .filter((sub) => !(role === 'PARENT' && ['class', 'section'].includes(sub?.page)))
            : item.submenu,
        }))
        .filter((item) => {
          if (!Array.isArray(item.submenu)) return true;
          return item.submenu.length > 0 || !!item.page;
        }),
    }))
    .filter((section) => section.items.length > 0);

  // ─── Build a flat list of (sectionIdx, itemIdx) keys for dropdown items ──
  // Key format: `${sectionIndex}-${itemIndex}`
  const buildOpenKey = (sectionIndex, itemIndex) => `${sectionIndex}-${itemIndex}`;

  // Find which key contains the currentPage (to auto-open that dropdown)
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

  // React state: which dropdown key is open (only one at a time, accordion style)
  const [openKey, setOpenKey] = useState(() => findActiveKey());

  // Keep open key in sync when currentPage changes (e.g. external navigation)
  useEffect(() => {
    const activeKey = findActiveKey();
    if (activeKey) {
      setOpenKey(activeKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleDropdownToggle = (key) => {
    setOpenKey((prev) => (prev === key ? null : key));
  };

  const handleNavClick = (e, page) => {
    e.preventDefault();
    e.stopPropagation();
    if (onNavigate) {
      onNavigate(page);
    }
    // Close sidebar on mobile after navigation
    closeSidebar();
  };

  const sidebarClass = [
    'sidebar',
    isOpen ? 'sidebar-open' : '',
    isCollapsed ? 'active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      <aside className={sidebarClass}>
        <button type="button" className="sidebar-close-btn" onClick={closeSidebar}>
          <iconify-icon icon="ri:close-line"></iconify-icon>
        </button>

        {/* ── Logo ── */}
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

        {/* ── Profile dropdown ── */}
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
                  {role ? (
                    <span className="text-secondary-light text-sm mb-0 d-block">{role}</span>
                  ) : null}
                </span>
              </span>
              <span className="profile-dropdown__icon pe-8 text-xl d-flex line-height-1">
                <iconify-icon icon="ri:arrow-right-s-line"></iconify-icon>
              </span>
            </button>
            <ul className="dropdown-menu dropdown-menu-lg-end border p-12">
              <li>
                <a
                  href="#"
                  className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6"
                >
                  <iconify-icon icon="ri:user-3-line"></iconify-icon> My Profile
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6"
                >
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

        {/* ── Navigation menu ── */}
        <div className="sidebar-menu-area">
          <ul className="sidebar-menu" id="sidebar-menu">
            {filteredSections.map((section, sectionIndex) => (
              <React.Fragment key={sectionIndex}>
                {section.title ? (
                  <li className={`sidebar-menu-group-title ${isCollapsed ? 'hidden' : ''}`}>
                    {section.title}
                  </li>
                ) : null}

                {section.items.map((item, itemIndex) => {
                  const hasSubmenu = Array.isArray(item.submenu) && item.submenu.length > 0;
                  const key = buildOpenKey(sectionIndex, itemIndex);
                  const isOpen_dropdown = hasSubmenu && openKey === key;
                  const isItemActive = item.page && item.page === currentPage;

                  return (
                    <li
                      key={itemIndex}
                      className={[
                        hasSubmenu ? 'dropdown' : '',
                        isOpen_dropdown ? 'open' : '',
                        isOpen_dropdown ? 'active-parent' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <a
                        href={item.href || '#'}
                        className={isItemActive ? 'active-page' : ''}
                        onClick={(e) => {
                          e.preventDefault();
                          if (hasSubmenu) {
                            handleDropdownToggle(key);
                            // If item also has a page, navigate to it
                            if (item.page && onNavigate) {
                              onNavigate(item.page);
                            }
                          } else if (item.page) {
                            handleNavClick(e, item.page);
                          }
                        }}
                      >
                        <iconify-icon icon={item.icon} className="menu-icon"></iconify-icon>
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
                          {item.submenu
                            .filter((sub) => {
                              if (sub?.page === 'user-role-acl') return canOpenUserRoles();
                              return true;
                            })
                            .map((sub, subIndex) => (
                              <li key={subIndex}>
                                <a
                                  href={sub.href}
                                  className={
                                    sub.page && sub.page === currentPage ? 'active-page' : ''
                                  }
                                  onClick={(e) => {
                                    if (sub.page) handleNavClick(e, sub.page);
                                  }}
                                >
                                  <iconify-icon
                                    icon="ri:circle-fill"
                                    className="circle-icon w-auto"
                                    style={{ fontSize: '6px' }}
                                  ></iconify-icon>
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
