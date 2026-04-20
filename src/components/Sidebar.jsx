import React from 'react';
import '../css/sidebar.css';
import { useSidebar } from '../context/SidebarContext';

const menuSections = [
  {
    title: 'Core System',
    items: [
      {
        title: 'Dashboard',
        icon: 'ri:dashboard-line',
        submenu: [
          { label: 'School', href: '#' },
          { label: 'Teacher', href: '#' },
          { label: 'Student', href: '#' },
          { label: 'Teacher', href: '#' },
          
          { label: 'Parent', href: '#' },
          { label: 'LMS', href: '#' },
        ],
      },
      {
        title: 'Theme',
        icon: 'ri:palette-line',
        submenu: [
          { label: 'Colors', href: '#' },
          { label: 'Typography', href: '#' },
        ],
      },
      {
        title: 'Language',
        icon: 'ri:translate-2',
        submenu: [
          { label: 'English', href: '#' },
          { label: 'Hindi', href: '#' },
        ],
      },
      {
        title: 'Administrator',
        icon: 'ri:user-settings-line',
        submenu: [
          { label: 'General Setting', href: '#' },
          { label: 'Manage School', href: '#' },
          { label: 'Payment Setting', href: '#' },
          { label: 'SMS Setting', href: '#' },
          { label: 'Email Setting', href: '#' },
          { label: 'Academic Year', href: '#' },
          { label: 'User Role (ACL)', href: '#' },
          { label: 'Role Permission (ACL)', href: '#' },
          { label: 'Manage Super Admin', href: '#' },
          { label: 'Manage User', href: '#' },
          { label: 'Reset User Password', href: '#' },
          { label: 'Reset Username', href: '#' },
          { label: 'User Credential', href: '#' },
          { label: 'Activity Log', href: '#' },
          { label: 'Manage Feedback', href: '#' },
          { label: 'Backup Database', href: '#' },
          { label: 'Opening Hour', href: '#' },
        ],
      },
      {
        title: 'Template',
        icon: 'ri:layout-2-line',
        submenu: [
          { label: 'SMS Template', href: '#' },
          { label: 'Email Template', href: '#' },
        ],
      },
      {
        title: 'Profile',
        icon: 'ri:user-3-line',
        submenu: [
          { label: 'My Profile', href: '#' },
          { label: 'Settings', href: '#' },
          { label: 'Logout', href: '#' },
        ],
      },
      {
        title: 'Subscription (SaaS)',
        icon: 'ri:vip-crown-line',
        submenu: [
          { label: 'FAQ', href: '#' },
          { label: 'Slider', href: '#' },
          { label: 'Subscription Settings', href: '#' },            { label: 'Subscription Settings', href: '#' },
          { label: 'General Settings', href: '#' },
          { label: 'Subscription Plnas', href: '#' },
          { label: 'School Subscription', href: '#' },

        ],
      },
    ],
  },
  {
    title: 'Front Office',
    items: [
      {
        title: 'Front Office',
        icon: 'ri:building-4-line',
        submenu: [
          { label: 'Visitor Purpose', href: '#' },
          { label: 'Visitor Info', href: '#' },
          { label: 'Call Log', href: '#' },
        { label: 'Postal Dispatch', href: '#' },
          { label: 'Postal Receive', href: '#' },
        
        ],
      },
      {
        title: 'Complain',
        icon: 'ri:chat-3-line',
        submenu: [
          { label: 'Complaints Type', href: '#' },
          { label: 'Manage Complain', href: '#' },
        ],
      },
      {
        title: 'Announcement',
        icon: 'ri:megaphone-line',
        submenu: [
          { label: 'Notice', href: '#' },
          { label: 'News', href: '#' },
        ],
      },
      {
        title: 'Event',
        icon: 'ri:calendar-event-line',
        submenu: [
          { label: 'Calendar', href: '#' },
          { label: 'Event List', href: '#' },
        ],
      },
      {
        title: 'Media Gallery',
        icon: 'ri:image-line',
        submenu: [                    
          { label: 'Gallery', href: '#' },
          { label: 'Images', href: '#' },
         { label: 'Videos', href: '#' },

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
        submenu: [
          { label: 'Student Type', href: '#' },
          { label: 'Student List', href: '#' },
          { label: 'Admit Student', href: '#' },
          { label: 'Bulk Admission', href: '#' },
          { label: 'Online Admission', href: '#' },
          { label: 'Student Activity', href: '#' },
        ],
      },
      {
        title: 'Attendance',
        icon: 'ri:calendar-check-line',
        submenu: [
          { label: 'Student Attendance', href: '#' },
          { label: 'Teacher Attendance', href: '#' },
          { label: 'Employee Attendance', href: '#' },
          { label: 'Absent Email', href: '#' },
          { label: 'Absent SMS', href: '#' },
        ],
      },
      {
        title: 'Promotion',
        icon: 'ri:arrow-up-circle-line',
        submenu: [
          { label: 'Promote Students', href: '#' },
          { label: 'Promotion History', href: '#' },
        ],
      },
      {
        title: 'Generate Card',
        icon: 'ri:id-card-line',
        submenu: [
          { label: 'ID Card Setting', href: '#' },
          { label: 'Admit Card Setting', href: '#' },
          { label: 'Teacher ID card', href: '#' },
          { label: 'Employee ID Card', href: '#' },
          { label: 'Student ID Card', href: '#' },
          { label: 'Student Admit Card', href: '#' },
        ],
      },
      {
        title: 'Certificate',
        icon: 'ri:award-line',
        submenu: [
          { label: 'Department', href: '#', page: 'teacher-department' },
          { label: 'Manage Teacher', href: '#' },
          { label: 'Class Lecture', href: '#' },
          { label: 'Rating', href: '#' },
        ],
      },
      {
        title: 'Scholarship',
        icon: 'ri:graduation-cap-line',
        submenu: [
          { label: 'Candidate', href: '#' },
          { label: 'Donar', href: '#' },
          { label: 'Scholarship', href: '#' },
        ],
      },
      {
        title: 'Guardian',
        icon: 'ri:account-circle-line',
        submenu: [
          
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
          { label: 'Class', href: '#' },
          { label: 'Section', href: '#' },
          { label: 'Subject', href: '#' },
          { label: 'Syllabus', href: '#' },
          { label: 'Material', href: '#' },
          { label: 'Live Class', href: '#' },
          { label: 'Assignment', href: '#' },
          { label: 'Submission', href: '#' },
        ],
      },
      {
        title: 'Lesson Plan',
        icon: 'ri:file-list-3-line',
        submenu: [
          { label: 'Lesson', href: '#' },
          { label: 'Topic', href: '#' },
          { label: 'Lesson Timeline', href: '#' },
          { label: 'Lesson Status', href: '#' },
          { label: 'Lesson Plan', href: '#' },
        ],
      },
      {
        title: 'Class Routine',
        icon: 'ri:time-line',
        submenu: [
          
          
        ],
      },
      {
        title: 'Teacher',
        icon: 'ri:user-star-line',
        submenu: [
          { label: 'Teacher ID card', href: '#' },
          { label: 'Department', href: '#', page: 'teacher-department' },
          { label: 'Manage Teacher', href: '#' },
          { label: 'Class Lecture', href: '#' },
          { label: 'Rating', href: '#' },
        ],
      },
    ],
  },
  {
    title: 'Examination System',
    items: [
      {
        title: 'Online Exam',
        icon: 'ri:computer-line',
        submenu: [
          { label: 'Instruction', href: '#' },
          { label: 'Question Bank', href: '#' },
          { label: 'Online Exam', href: '#' },
          { label: 'Exam Result', href: '#' },
        ],
      },
      {
        title: 'Manage Exam',
        icon: 'ri:file-edit-line',
        submenu: [
          { label: 'Schedule', href: '#' },
          { label: 'Exam Grade', href: '#' },
          { label: 'Exam Term', href: '#' },
          { label: 'Suggestion', href: '#' },
          { label: 'Attendance', href: '#' },
        ],
      },
      {
        title: 'Exam Mark',
        icon: 'ri:file-chart-line',
        submenu: [
          { label: 'Manage Mark', href: '#' },
          { label: 'Exam Term Result', href: '#' },
          { label: 'Exam final result', href: '#' },
          { label: 'Merit List', href: '#' },
          { label: 'Mark Sheet', href: '#' },
          { label: 'Result Card', href: '#' },
          { label: 'Mark send by Email', href: '#' },
          { label: 'Mark send by SMS', href: '#' },
          { label: 'Result Send by Email', href: '#' },
          { label: 'Result Send by SMS', href: '#' },
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
          { label: 'Manage Destination', href: '#' },
          { label: 'Manage Employees', href: '#' },
          { label: 'Manage Mark', href: '#' },
          { label: 'Exam Term Result', href: '#' },
          { label: 'Exam final result', href: '#' },
          { label: 'Merit List', href: '#' },
          { label: 'Mark Sheet', href: '#' },
          { label: 'Result Card', href: '#' },
          { label: 'Mark send by Email', href: '#' },
          { label: 'Mark send by SMS', href: '#' },
          { label: 'Result Send by Email', href: '#' },
          { label: 'Result Send by SMS', href: '#' },
        ],
      },
      {
        title: 'Manage Leave',
        icon: 'ri:calendar-todo-line',
        submenu: [
          { label: 'Leave Type', href: '#' },
          { label: 'Leave Application', href: '#' },
          { label: 'Waiting Application', href: '#' },
          { label: 'Approved Application', href: '#' },
          { label: 'Declined Application', href: '#' },
        ],
      },
      {
        title: 'Payroll',
        icon: 'ri:money-dollar-circle-line',
        submenu: [
          { label: 'Salary Grade', href: '#' },
          { label: 'Payslips', href: '#' },
          { label: 'Salary History', href: '#' },
        ],
      },
    ],
  },
  {
    title: 'Finance & Accounts',
    items: [
      {
        title: 'Accounting',
        icon: 'ri:calculator-line',
        submenu: [
          { label: 'Discount', href: '#' },
          { label: 'Fee Type', href: '#' },
          { label: 'Fee Collection', href: '#' },
          { label: 'Manage Invoice', href: '#' },
          { label: 'Due Invoice', href: '#' },
          { label: 'Due Receipt', href: '#' },
          { label: 'Paid Receipt', href: '#' },
          { label: 'Due Fee Email', href: '#' },
          { label: 'Due Fee SMS', href: '#' },
          { label: 'Income Head', href: '#' },
          { label: 'Income', href: '#' },
          { label: 'Expenditure Head', href: '#' },
          { label: 'Expenditure', href: '#' },
        ],
      },
      {
        title: 'Report',
        icon: 'ri:bar-chart-line',
        submenu: [
          { label: 'Income Report', href: '#' },
          { label: 'Expenditure Report', href: '#' },
          { label: 'Invoice Report', href: '#' },
          { label: 'Due Fee Report', href: '#' },
          { label: 'Fee Collection Report', href: '#' },
          { label: 'Accounting Balance Report', href: '#' },
          { label: 'Library Report', href: '#' },
          { label: 'Student Attendance Report', href: '#' },
          { label: 'Student Yearly Attendance Report', href: '#' },
          { label: 'Teacher Attendance Report', href: '#' },
          { label: 'Teacher Yearly Attendance Report', href: '#' },
          { label: 'Employee Attendance Report', href: '#' },
          { label: 'Employee Yearly Attendance Report', href: '#' },
          { label: 'Student Report', href: '#' },
          { label: 'Student Invoice Report', href: '#' },
          { label: 'Student Activity Report', href: '#' },
          { label: 'Payroll Report', href: '#' },
          { label: 'Daily Transaction Report', href: '#' },
          { label: 'Daily Statemen Report', href: '#' },
          { label: 'Exam Result Report', href: '#' },
          { label: 'Certificate Type', href: '#' },
          { label: 'Gerate Certificate', href: '#' },
        ],
      },
    ],
  },
  {
    title: 'Inventory & Assets',
    items: [
      {
        title: 'Inventory',
        icon: 'ri:box-3-line',
        submenu: [
          
          
          { label: 'Suppliers', href: '#' },
           { label: 'Warhouse', href: '#' },
 { label: 'Category', href: '#' },
 { label: 'Product', href: '#' },
           { label: 'Purchase', href: '#' },
                     { label: 'Sale', href: '#' },
                               { label: 'Issue', href: '#' },
           { label: 'Warhouse', href: '#' },
 { label: 'Category', href: '#' },
 { label: 'Product', href: '#' },
           { label: 'Purchase', href: '#' },
                     { label: 'Sale', href: '#' },
                               { label: 'Issue', href: '#' },
        ],
      },
      {
        title: 'Asset Management',
        icon: 'ri:building-2-line',
        submenu: [
          { label: 'Vendor', href: '#' },
          { label: 'Store', href: '#' },
          { label: 'Category', href: '#' },
          { label: 'Item', href: '#' },
          { label: 'Purchase', href: '#' },
         
          { label: 'Issue', href: '#' },

          { label: 'Vendor', href: '#' },
          { label: 'Store', href: '#' },
          { label: 'Category', href: '#' },
          { label: 'Item', href: '#' },
          { label: 'Purchase', href: '#' },
         
          { label: 'Issue', href: '#' },

        ],
      },
      {
        title: 'Library',
        icon: 'ri:book-2-line',
        submenu: [
          { label: 'Books List', href: '#' },
          { label: 'Library Members', href: '#' },
          { label: 'Issue/Return', href: '#' },
          { label: 'E-Book', href: '#' },
        ],
      },
    ],
  },
  {
    title: 'Transport & Facilities',
    items: [
      {
        title: 'Transport',
        icon: 'ri:bus-line',
        submenu: [
          { label: 'Vehicles', href: '#' },
          { label: 'Trasnsport Route', href: '#' },
          { label: 'Trasnsport Member', href: '#' },
          { label: 'Trasnsport Route', href: '#' },
          { label: 'Trasnsport Member', href: '#' },
        ],
      },
      {
        title: 'Hostel',
        icon: 'ri:hotel-bed-line',
        submenu: [
          { label: 'Manage Hostel', href: '#' },
          { label: 'Manage Room', href: '#' },
          { label: 'Hostel Member', href: '#' },
          { label: 'Manage Hostel', href: '#' },
          { label: 'Manage Room', href: '#' },
          { label: 'Hostel Member', href: '#' },
        ],
      },
    ],
  },
  {
    title: 'Communication System',
    items: [
      {
        title: 'Mail & SMS',
        icon: 'ri:mail-line',
        submenu: [
          { label: 'Email', href: '#' },
          { label: 'SMS', href: '#' },
        ],
      },
      {
        title: 'Complain',
        icon: 'ri:chat-3-line',
        submenu: [
          { label: 'Complaints Type', href: '#' },
          { label: 'Manage Complain', href: '#' },
        ],
      },
      {
        title: 'Announcement',
        icon: 'ri:megaphone-line',
        submenu: [
          { label: 'Notice', href: '#' },
          { label: 'News', href: '#' },
        ],
      },
      {
        title: 'Scholarship',
        icon: 'ri:graduation-cap-line',
        submenu: [
          { label: 'Candidate', href: '#' },
          { label: 'Donar', href: '#' },
          { label: 'Scholarship', href: '#' },
        ],
      },
      {
        title: 'Event',
        icon: 'ri:calendar-event-line',
        submenu: [
          { label: 'Calendar', href: '#' },
          { label: 'Event List', href: '#' },
        ],
      },
      {
        title: 'Payroll',
        icon: 'ri:money-dollar-circle-line',
        submenu: [
          { label: 'Salary Grade', href: '#' },
          { label: 'Payslips', href: '#' },
          { label: 'Salary History', href: '#' },
        ],
      },
      {
        title: 'Accounting',
        icon: 'ri:calculator-line',
        submenu: [
          { label: 'Discount', href: '#' },
          { label: 'Fee Type', href: '#' },
          { label: 'Fee Collection', href: '#' },
          { label: 'Manage Invoice', href: '#' },
          { label: 'Due Invoice', href: '#' },
          { label: 'Due Receipt', href: '#' },
          { label: 'Paid Receipt', href: '#' },
          { label: 'Due Fee Email', href: '#' },
          { label: 'Due Fee SMS', href: '#' },
          { label: 'Income Head', href: '#' },
          { label: 'Income', href: '#' },
          { label: 'Expenditure Head', href: '#' },
          { label: 'Expenditure', href: '#' },
        ],
      },
      {
        title: 'Report',
        icon: 'ri:bar-chart-line',
        submenu: [
          { label: 'Income Report', href: '#' },
          { label: 'Expenditure Report', href: '#' },
          { label: 'Invoice Report', href: '#' },
          { label: 'Due Fee Report', href: '#' },
          { label: 'Fee Collection Report', href: '#' },
          { label: 'Accounting Balance Report', href: '#' },
          { label: 'Library Report', href: '#' },
          { label: 'Student Attendance Report', href: '#' },
          { label: 'Student Yearly Attendance Report', href: '#' },
          { label: 'Teacher Attendance Report', href: '#' },
          { label: 'Teacher Yearly Attendance Report', href: '#' },
          { label: 'Employee Attendance Report', href: '#' },
          { label: 'Employee Yearly Attendance Report', href: '#' },
          { label: 'Student Report', href: '#' },
          { label: 'Student Invoice Report', href: '#' },
          { label: 'Student Activity Report', href: '#' },
          { label: 'Payroll Report', href: '#' },
          { label: 'Daily Transaction Report', href: '#' },
          { label: 'Daily Statemen Report', href: '#' },
          { label: 'Exam Result Report', href: '#' },
        ],
      },
      {
        title: 'Media Gallery',
        icon: 'ri:image-line',
        submenu: [                    
          { label: 'Gallery', href: '#' },
          { label: 'Images', href: '#' },
         { label: 'Videos', href: '#' },

        ],
      },
    ],
  },
  {
    title: 'Website (CMS)',
    items: [
      {
        title: 'Manage Frontend',
        icon: 'ri:layout-line',
        submenu: [
          { label: 'Frontend Page', href: '#' },
          { label: 'Slider', href: '#' },
          { label: 'About School', href: '#' },
        ],
      },
    ],
  },
  {
    title: 'Miscellaneous',
    items: [
      {
        title: 'Miscellaneous',
        icon: 'ri:more-2-line',
        submenu: [
          { label: 'Tools', href: '#' },
          { label: 'Settings', href: '#' },
        ],
      },
      {
        title: 'Subscription (SaaS)',
        icon: 'ri:vip-crown-line',
        submenu: [
          { label: 'FAQ', href: '#' },
          { label: 'Slider', href: '#' },
          { label: 'Subscription Settings', href: '#' },            { label: 'Subscription Settings', href: '#' },
          { label: 'General Settings', href: '#' },
          { label: 'Subscription Plnas', href: '#' },
          { label: 'School Subscription', href: '#' },

        ],
      },
      {
        title: 'Profile',
        icon: 'ri:user-3-line',
        submenu: [
          { label: 'My Profile', href: '#' },
          { label: 'Settings', href: '#' },
          { label: 'Logout', href: '#' },
        ],
      },
    ],
  },
];

const Sidebar = ({ onNavigate }) => {
  const { isOpen, isCollapsed, closeSidebar, toggleSidebar } = useSidebar();

  const sidebarClass = [
    'sidebar',
    isOpen ? 'sidebar-open' : '',
    isCollapsed ? 'active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleDropdownToggle = (e) => {
    e.preventDefault();
    const li = e.currentTarget.closest('li.dropdown');
    if (li) li.classList.toggle('open');
  };

  const handleNavClick = (e, page) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      <aside className={sidebarClass}>
        <button type="button" className="sidebar-close-btn" onClick={closeSidebar}>
          <iconify-icon icon="ri:close-line"></iconify-icon>
        </button>

        <div>
          <div className="sidebar-logo d-flex align-items-center justify-content-center">
            <a href="#">
              <img src="/assets/images/logo.png" alt="site logo" className="light-logo" />
              <img src="/assets/images/logo-light.png" alt="site logo" className="dark-logo" />
              <img src="/assets/images/logo-icon.png" alt="site logo" className="logo-icon" />
            </a>
            <button
              type="button"
              className="text-xxl d-xl-flex d-none line-height-1 sidebar-toggle text-neutral-500"
              aria-label="Collapse Sidebar"
              onClick={toggleSidebar}
              style={{ position: 'absolute', right: '1rem' }}
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
                  <span className="h6 mb-0 text-md d-block text-primary-light">Jone Copper</span>
                  <span className="text-secondary-light text-sm mb-0 d-block">Admin</span>
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
                >
                  <iconify-icon icon="ri:shut-down-line"></iconify-icon> Log Out
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="sidebar-menu-area">
          <ul className="sidebar-menu" id="sidebar-menu">
            {menuSections.map((section, sectionIndex) => (
              <React.Fragment key={sectionIndex}>
                {section.title ? (
                  <li className={`sidebar-menu-group-title ${isCollapsed ? 'hidden' : ''}`}>
                    {section.title}
                  </li>
                ) : null}

                {section.items.map((item, index) => (
                  <li key={index} className={item.submenu ? 'dropdown' : ''}>
                    <a href="#" onClick={handleDropdownToggle}>
                      <iconify-icon icon={item.icon} className="menu-icon"></iconify-icon>
                      <span>{item.title}</span>
                      <iconify-icon icon="ri:arrow-down-s-line" className="sidebar-menu__arrow"></iconify-icon>
                    </a>
                    <ul className="sidebar-submenu">
                      {item.submenu.map((sub, subIndex) => (
                        <li key={subIndex}>
                          <a 
                            href={sub.href} 
                            onClick={(e) => sub.page && handleNavClick(e, sub.page)}
                          >
                            <iconify-icon
                              icon="ri:circle-fill"
                              className="circle-icon w-auto"
                              style={{ fontSize: '6px' }}
                            ></iconify-icon>
                            {sub.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </React.Fragment>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
