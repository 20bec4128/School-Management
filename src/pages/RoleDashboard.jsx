import { useMemo } from 'react'
import { BarChart, DonutChart } from '../components/SimpleCharts'
import MiniCalendar from '../components/MiniCalendar'
import ProgressRing from '../components/ProgressRing'
import { useAuth } from '../context/useAuth'
import studentIcon from '../../OldAssets/images/icons/student-icon.png'
import teacherIcon from '../../OldAssets/images/icons/teacher-icon.png'
import guardianIcon from '../../OldAssets/images/icons/guardian-icon.png'
import feesIcon from '../../OldAssets/images/icons/fees-icon1.png'
import attendanceIcon from '../../OldAssets/images/icons/attendence-icon1.png'
import libraryIcon from '../../OldAssets/images/icons/library-icon.png'
import studentBg from '../../OldAssets/images/bg/edit-profile-bg.png'
import studentAvatar from '../../OldAssets/images/thumbs/studnt-edit-profile-img.png'
import widgetOne from '../../OldAssets/images/icons/teacher-widget-icon1.png'
import widgetTwo from '../../OldAssets/images/icons/teacher-widget-icon2.png'
import widgetThree from '../../OldAssets/images/icons/teacher-widget-icon3.png'
import courseOne from '../../OldAssets/images/icons/dashboard-icon1.png'
import courseTwo from '../../OldAssets/images/icons/dashboard-icon2.png'
import courseThree from '../../OldAssets/images/icons/dashboard-icon3.png'
import lmsIconOne from '../../OldAssets/images/icons/lms-icon-1.png'
import lmsIconTwo from '../../OldAssets/images/icons/lms-icon-2.png'
import lmsIconThree from '../../OldAssets/images/icons/lms-icon-3.png'
import lmsIconFour from '../../OldAssets/images/icons/lms-icon-4.png'
import lmsBgOne from '../../OldAssets/images/icons/lms-card-gradient-bg1.png'
import lmsBgTwo from '../../OldAssets/images/icons/lms-card-gradient-bg2.png'
import lmsBgThree from '../../OldAssets/images/icons/lms-card-gradient-bg3.png'
import lmsBgFour from '../../OldAssets/images/icons/lms-card-gradient-bg4.png'
import sessionOne from '../../OldAssets/images/thumbs/session-img1.png'
import sessionTwo from '../../OldAssets/images/thumbs/session-img2.png'
import '../assets/css/roleDashboard.css'

const defaultName = 'Learner'

const getInitials = (name) =>
  String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'ED'

const formatMeta = (value, fallback) => (value == null || value === '' ? fallback : value)

const getChildScope = (children, selectedChildId) => {
  const list = Array.isArray(children) ? children : []
  const selected =
    selectedChildId != null && selectedChildId !== ''
      ? list.find((child) => String(child?.studentId ?? child?.id ?? child?.student?.id ?? '') === String(selectedChildId))
      : null
  return selected || list[0] || null
}

const SectionCard = ({ title, subtitle, children, action }) => (
  <div className="role-dashboard__panel h-100">
    <div className="role-dashboard__panel-head">
      <div>
        <h3 className="role-dashboard__panel-title">{title}</h3>
        {subtitle ? <p className="role-dashboard__panel-subtitle">{subtitle}</p> : null}
      </div>
      {action || null}
    </div>
    <div className="role-dashboard__panel-body">{children}</div>
  </div>
)

const StatCard = ({ icon, image, label, value, foot, tone }) => (
  <div className="col-sm-6 col-xxl-3">
    <div className="role-dashboard__stat-card p-20 h-100">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="role-dashboard__stat-icon" style={{ background: tone }}>
            {image ? <img src={image} alt="" className="w-100 h-100 object-fit-contain" /> : <i className={icon}></i>}
          </div>
          <p className="role-dashboard__stat-label">{label}</p>
        </div>
        <span className="role-dashboard__badge" style={{ background: `${tone}20`, color: tone }}>
          Live
        </span>
      </div>

      <h4 className="role-dashboard__stat-value">{value}</h4>
      <p className="role-dashboard__stat-foot">{foot}</p>
    </div>
  </div>
)

const DashboardCard = ({ title, subtitle, action, children, className = '' }) => (
  <div className={`role-dashboard__panel h-100 ${className}`.trim()}>
    <div className="role-dashboard__panel-head">
      <div>
        <h3 className="role-dashboard__panel-title">{title}</h3>
        {subtitle ? <p className="role-dashboard__panel-subtitle">{subtitle}</p> : null}
      </div>
      {action || null}
    </div>
    <div className="role-dashboard__panel-body">{children}</div>
  </div>
)

const ProgressBar = ({ value, tone }) => (
  <div className="student-dashboard__progress">
    <div className="student-dashboard__progress-track">
      <span className="student-dashboard__progress-fill" style={{ width: `${value}%`, background: tone }} />
    </div>
    <strong style={{ color: tone }}>{value}%</strong>
  </div>
)

const LmsMetricCard = ({ icon, image, title, value, foot, tone, trend, direction = 'up', background }) => (
  <div className="col-sm-6">
    <div
      className="lms-dashboard__metric-card position-relative overflow-hidden border rounded-3 h-100"
      style={{
        backgroundColor: '#fff',
        backgroundImage: background ? `url(${background})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="lms-dashboard__metric-inner position-relative z-1 p-16 d-flex flex-column gap-3">
        <div className="d-flex align-items-center gap-8">
          <span className="lms-dashboard__metric-icon" style={{ background: `${tone}16`, color: tone }}>
            {image ? <img src={image} alt="" /> : <i className={icon}></i>}
          </span>
          <span className="text-primary-light fw-medium">{title}</span>
        </div>

        <div className="d-flex align-items-end justify-content-between gap-3 flex-wrap">
          <div>
            <h6 className="mb-6">{value}</h6>
            <span
              className={`fw-medium text-md d-flex gap-6 align-items-center ${
                direction === 'down' ? 'text-danger-600' : 'text-success-600'
              }`}
            >
              <i className={`text-lg line-height-1 fw-medium ri-arrow-left-${direction === 'down' ? 'down' : 'up'}-line`}></i>
              {trend}
            </span>
            <span className="text-secondary-light fw-medium mt-6 d-block">{foot}</span>
          </div>
          <div className="lms-dashboard__sparkline">
            <ProgressRing value={Math.max(24, Math.min(96, Number(String(value).replace(/[^0-9]/g, '')) || 72))} color={tone} />
          </div>
        </div>
      </div>
    </div>
  </div>
)

const LmsSessionCard = ({ session }) => (
  <div className="col-sm-6">
    <div className="border rounded-3 p-12 h-100 bg-base">
      <div className="d-flex gap-12">
        <div className="d-flex flex-shrink-0">
          <img src={session.image} alt="" className="w-100 h-100 object-fit-cover rounded-3" />
        </div>
        <div className="align-self-center w-100">
          <h6 className="text-md mb-0">{session.title}</h6>
          <span className="fw-medium">{session.subject}</span>
          <div className="mt-8 d-flex align-items-center gap-8 justify-content-between flex-wrap w-100">
            <div className="d-flex align-items-center gap-8 text-neutral-500 fw-medium">
              <i className="ri-calendar-2-line"></i>
              {session.date}
            </div>
            <div className="d-flex align-items-center gap-8 text-neutral-500 fw-medium">
              <i className="ri-time-line"></i>
              {session.time}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-16 d-flex gap-12">
        <a href="javascript:void(0)" className="btn btn-primary-600 d-flex align-items-center gap-6 px-16 flex-grow-1 justify-content-center">
          Join Class
        </a>
        <a href="javascript:void(0)" className="btn btn-primary-100 d-flex align-items-center justify-content-center gap-6 p-0 w-44-px h-44-px text-primary-600 text-xl">
          <i className="ri-chat-1-line"></i>
        </a>
        <a href="javascript:void(0)" className="btn btn-warning-100 d-flex align-items-center gap-6 px-16 text-warning-600 flex-grow-1 justify-content-center">
          <i className="ri-time-line"></i>
          Join Later
        </a>
      </div>
    </div>
  </div>
)

const LmsDashboardLayout = ({ config }) => {
  const lms = config.lmsLayout || {}
  const metrics = lms.metrics || []
  const sessions = lms.sessions || []
  const courses = lms.courses || []
  const chartLabels = lms.chartLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const chartSeries = lms.chartSeries || [
    { name: 'Earnings', color: '#0A51CE', data: [24, 30, 28, 36, 32, 40] },
    { name: 'Enrollments', color: '#8B5CF6', data: [12, 14, 11, 18, 16, 20] },
  ]

  return (
    <div className="dashboard-main-body role-dashboard lms-dashboard">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">Dashboard</h6>
          <p className="text-neutral-600 mt-4 mb-0">{config.heroNote}</p>
        </div>
      </div>

      <div className="mt-24">
        <div className="row gy-4">
          <div className="col-xxl-6">
            <div className="bg-base rounded-3 p-20 h-100">
              <div className="row g-3">
                {metrics.map((metric) => (
                  <LmsMetricCard key={metric.title} {...metric} />
                ))}
              </div>
            </div>
          </div>

          <div className="col-xxl-6">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex flex-wrap align-items-center justify-content-between">
                  <h6 className="text-lg mb-0">{lms.chartTitle}</h6>
                  <select className="form-select bg-base form-select-sm w-auto radius-8">
                    <option>Yearly</option>
                    <option>Monthly</option>
                    <option>Weekly</option>
                    <option>Today</option>
                  </select>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-2 mt-8">
                  <h6 className="mb-0">{lms.chartValue || '$27,200'}</h6>
                  <span className="text-sm fw-semibold rounded-pill bg-success-focus text-success-main border br-success px-8 py-4 line-height-1 d-flex align-items-center gap-1">
                    10% <iconify-icon icon="bxs:up-arrow" className="text-xs"></iconify-icon>
                  </span>
                  <span className="text-xs fw-medium">{lms.chartFoot || '+ $1500 Per Day'}</span>
                </div>
                <div className="pt-28">
                  <BarChart labels={chartLabels} series={chartSeries} height={260} />
                </div>
              </div>
            </div>
          </div>

          <div className="col-xxl-5">
            <div className="card h-100">
              <div className="card-body">
                <div className="p-20">
                  <div className="calendar">
                    <div className="calendar__header">
                      <button type="button" className="calendar__arrow left">
                        <i className="ri-arrow-left-s-line"></i>
                      </button>
                      <p className="display text-md text-secondary-light fw-semibold mb-0">LMS Calendar</p>
                      <button type="button" className="calendar__arrow right">
                        <i className="ri-arrow-right-s-line"></i>
                      </button>
                    </div>
                    <div className="calendar__week week">
                      <div className="calendar__week-text">Su</div>
                      <div className="calendar__week-text">Mo</div>
                      <div className="calendar__week-text">Tu</div>
                      <div className="calendar__week-text">We</div>
                      <div className="calendar__week-text">Th</div>
                      <div className="calendar__week-text">Fr</div>
                      <div className="calendar__week-text">Sa</div>
                    </div>
                    <div className="days"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xxl-7">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex flex-wrap align-items-center justify-content-between pb-16">
                  <h6 className="text-lg mb-0">{lms.sessionsTitle}</h6>
                </div>
                <div className="row g-3">
                  {sessions.map((session) => (
                    <LmsSessionCard key={`${session.title}-${session.time}`} session={session} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-xxl-12">
            <div className="card radius-12 border-0">
              <div className="card-body">
                <div className="d-flex flex-wrap align-items-center justify-content-between pb-16">
                  <h6 className="text-lg mb-0">{lms.coursesTitle}</h6>
                </div>
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th className="bg-neutral-100">Courses Name</th>
                        <th className="bg-neutral-100">Instructor</th>
                        <th className="bg-neutral-100">Students</th>
                        <th className="bg-neutral-100">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr key={course.title}>
                          <td>
                            <div className="d-flex align-items-center gap-12">
                              <img src={course.image} alt="" className="w-44-px h-44-px rounded-3 object-fit-cover" />
                              <div>
                                <h6 className="mb-0 text-md">{course.title}</h6>
                                <span className="text-secondary-light text-sm">{course.copy}</span>
                              </div>
                            </div>
                          </td>
                          <td>{course.teacher}</td>
                          <td>{course.students}</td>
                          <td>
                            <div className="d-flex align-items-center gap-12">
                              <div className="flex-grow-1" style={{ minWidth: 120 }}>
                                <ProgressBar value={course.progress} tone={course.tone} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const StudentDashboardLayout = ({ config }) => {
  const student = config.studentLayout || {}
  const classLabel = student.classLabel || formatMeta(config.heroMeta?.find((meta) => meta.label === 'Class')?.value, 'Class not set')
  const rollLabel = student.rollLabel || formatMeta(config.heroMeta?.find((meta) => meta.label === 'Roll No.')?.value, 'Roll not set')
  const widgets = student.widgets || []
  const attendanceSegments = student.attendanceSegments || [
    { label: 'Present', value: 58, color: '#22c55e' },
    { label: 'Half Day', value: 22, color: '#0ea5e9' },
    { label: 'Late', value: 12, color: '#8b5cf6' },
    { label: 'Absent', value: 8, color: '#f59e0b' },
  ]
  const attendanceBreakdown = student.attendanceBreakdown || [
    { label: 'Present', value: '200', color: '#22c55e' },
    { label: 'Half Day', value: '300', color: '#0ea5e9' },
    { label: 'Late', value: '172', color: '#8b5cf6' },
    { label: 'Absent', value: '500', color: '#f59e0b' },
  ]
  const todayClasses = student.todayClasses || []
  const courses = student.courses || []
  const notices = student.notices || []
  const tasks = student.tasks || []

  return (
    <div className="dashboard-main-body role-dashboard student-dashboard">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">Dashboard</h6>
          <p className="text-neutral-600 mt-4 mb-0">{config.heroNote}</p>
        </div>
      </div>

      <div className="student-dashboard__grid mt-24">
        <section className="student-dashboard__intro-panel">
          <div className="student-dashboard__intro-card">
            <img src={studentBg} alt="" className="student-dashboard__intro-bg" />
            <div className="student-dashboard__intro-overlay">
              <img src={studentAvatar} alt={config.name} className="student-dashboard__intro-avatar" />
              <div className="student-dashboard__intro-copy">
                <h6>{config.name}</h6>
                <span>Class: {classLabel}</span>
                <span>Roll No: {rollLabel}</span>
              </div>
              <button type="button" className="student-dashboard__profile-button">
                Edit Profile
              </button>
            </div>
          </div>

          <div className="student-dashboard__widget-stack">
            {widgets.slice(0, 3).map((widget) => (
              <div key={widget.label} className={`student-dashboard__widget student-dashboard__widget--${widget.theme || 'blue'}`}>
                <span className="student-dashboard__widget-icon">
                  <img src={widget.icon} alt="" />
                </span>
                <div>
                  <span className="student-dashboard__widget-label">{widget.label}</span>
                  <h5 className="student-dashboard__widget-value">{widget.value}</h5>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="student-dashboard__card student-dashboard__attendance-card">
          <div className="student-dashboard__card-head">
            <div>
              <h3 className="student-dashboard__card-title">Attendance</h3>
              <p className="student-dashboard__card-subtitle">A quick look at attendance for the current term.</p>
            </div>
            <select className="form-select bg-base form-select-sm w-auto radius-8">
              <option>Yearly</option>
              <option>Monthly</option>
              <option>Weekly</option>
              <option>Today</option>
            </select>
          </div>
          <div className="student-dashboard__attendance-chart">
            <DonutChart
              segments={attendanceSegments}
              size={220}
              thickness={24}
              centerLabel="Attendance"
              centerValue="87%"
              legendMode="values"
            />
          </div>
          <div className="student-dashboard__attendance-summary">
            {attendanceBreakdown.map((item) => (
              <div key={item.label} className="student-dashboard__attendance-item">
                <span className="student-dashboard__attendance-mark" style={{ background: item.color }} />
                <div>
                  <h6>{item.value}</h6>
                  <p>{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="student-dashboard__card student-dashboard__class-card">
          <div className="student-dashboard__card-head">
            <div>
              <h3 className="student-dashboard__card-title">Today's Class</h3>
              <p className="student-dashboard__card-subtitle">Your upcoming classes in order.</p>
            </div>
          </div>
          <div className="student-dashboard__class-list">
            {todayClasses.map((item) => (
              <div key={`${item.time}-${item.title}`} className="student-dashboard__class-item">
                <div className="student-dashboard__class-time">{item.time}</div>
                <div className="student-dashboard__class-body">
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <h6 className="student-dashboard__class-title">{item.title}</h6>
                    <span className="role-dashboard__badge" style={{ background: `${item.color}18`, color: item.color }}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="student-dashboard__class-copy">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="student-dashboard__card student-dashboard__courses-card">
          <div className="student-dashboard__card-head">
            <div>
              <h3 className="student-dashboard__card-title">Recent Enrolled Courses</h3>
              <p className="student-dashboard__card-subtitle">Courses you are currently enrolled in.</p>
            </div>
          </div>
          <div className="student-dashboard__course-list">
            {courses.map((course) => (
              <article key={course.title} className="student-dashboard__course-item">
                <div className="student-dashboard__course-icon">
                  <img src={course.icon} alt="" />
                </div>
                <div className="student-dashboard__course-main">
                  <div className="d-flex align-items-center justify-content-between gap-3">
                    <div>
                      <h6 className="student-dashboard__course-title">{course.title}</h6>
                      <p className="student-dashboard__course-copy">{course.copy}</p>
                    </div>
                    <span className="student-dashboard__course-teacher">{course.teacher}</span>
                  </div>
                  <div className="student-dashboard__course-progress-row">
                    <ProgressBar value={course.progress} tone={course.tone} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="student-dashboard__card student-dashboard__calendar-card">
          <div className="student-dashboard__card-head">
            <div>
              <h3 className="student-dashboard__card-title">Calendar</h3>
              <p className="student-dashboard__card-subtitle">The current month at a glance.</p>
            </div>
          </div>
          <div className="student-dashboard__calendar-wrap">
            <MiniCalendar />
          </div>
        </section>

        <section className="student-dashboard__card student-dashboard__notice-card">
          <div className="student-dashboard__card-head">
            <div>
              <h3 className="student-dashboard__card-title">Notice Board</h3>
              <p className="student-dashboard__card-subtitle">Quick updates from your school and teachers.</p>
            </div>
          </div>
          <div className="student-dashboard__notice-list">
            {notices.map((notice) => (
              <div key={notice.title} className="student-dashboard__notice-item">
                <span className="student-dashboard__notice-mark" style={{ background: notice.color }} />
                <div>
                  <h6 className="student-dashboard__notice-title">{notice.title}</h6>
                  <p className="student-dashboard__notice-copy">{notice.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="student-dashboard__card student-dashboard__task-card">
          <div className="student-dashboard__card-head">
            <div>
              <h3 className="student-dashboard__card-title">Sprint Planning &amp; Task</h3>
              <p className="student-dashboard__card-subtitle">Work items and reminders to keep moving.</p>
            </div>
          </div>
          <div className="student-dashboard__task-list">
            {tasks.map((task) => (
              <div key={task.title} className="student-dashboard__task-item">
                <div>
                  <h6 className="student-dashboard__task-title">{task.title}</h6>
                  <p className="student-dashboard__task-copy">{task.copy}</p>
                </div>
                <span className="role-dashboard__badge" style={{ background: `${task.color}18`, color: task.color }}>
                  {task.badge}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

const RoleDashboard = ({ variant }) => {
  const { user, schoolName, headOfficeName, studentClassId, studentSectionId, studentId, teacherContext, selectedChildId, parentChildren } = useAuth()
  const selectedChild = useMemo(
    () => getChildScope(parentChildren, selectedChildId),
    [parentChildren, selectedChildId],
  )

  const config = useMemo(() => {
    const roleMap = {
      superAdmin: 'Super Admin Dashboard',
      headOffice: 'Head Office Dashboard',
      schoolAdmin: 'School Admin Dashboard',
      teacher: 'Teacher Dashboard',
      student: 'Student Dashboard',
      parent: 'Parent Dashboard',
      lms: 'LMS Dashboard',
    }
    const role = roleMap[variant] || 'Dashboard'
    const name =
      user?.name ||
      user?.fullName ||
      user?.displayName ||
      user?.username ||
      (variant === 'teacher'
        ? 'Teacher'
        : variant === 'parent'
          ? 'Parent'
          : variant === 'superAdmin'
            ? 'Super Admin'
            : variant === 'headOffice'
              ? 'Head Office Admin'
              : variant === 'schoolAdmin'
                ? 'School Admin'
                : variant === 'lms'
                  ? 'LMS Admin'
                : defaultName)
    const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'

    if (variant === 'superAdmin') {
      return {
        role,
        name,
        greeting,
        school: formatMeta(headOfficeName, 'Global Platform'),
        focus: 'System command center',
        workspaceLabel: 'Super Admin Workspace',
        accent: '#4F46E5',
        accent2: '#06B6D4',
        avatarTone: 'linear-gradient(135deg, #e0e7ff, #cffafe)',
        heroNote: 'Track every school, office, and approval flow from a single overview.',
        heroMeta: [
          { label: 'Head Office', value: formatMeta(headOfficeName, 'All offices') },
          { label: 'Schools', value: '128' },
          { label: 'Users', value: '9.4K' },
          { label: 'Alerts', value: '06' },
        ],
        focusLabel: 'Platform health',
        focusValue: '99.8% uptime',
        focusNote: 'Review onboarding, compliance, and system alerts before the end of the day.',
        stats: [
          { icon: 'ri-school-line', label: 'Schools', value: '128', foot: 'Active schools connected to the platform.', tone: '#4F46E5' },
          { icon: 'ri-team-line', label: 'Staff', value: '1.2K', foot: 'Teachers, admins, and office teams.', tone: '#06B6D4' },
          { icon: 'ri-checkbox-circle-line', label: 'Approvals', value: '24', foot: 'Requests waiting for sign-off.', tone: '#F59E0B' },
          { icon: 'ri-shield-check-line', label: 'Compliance', value: '94%', foot: 'Policy and audit coverage this month.', tone: '#10B981' },
        ],
        timetable: [
          { time: '09:00 AM', title: 'New school onboarding', copy: 'Review the pending registration package', badge: 'Priority', color: '#4F46E5' },
          { time: '10:30 AM', title: 'Platform audit', copy: 'Check login and permission activity', badge: 'Live', color: '#06B6D4' },
          { time: '12:00 PM', title: 'Approval queue', copy: 'Sign off on head-office requests', badge: 'Waiting', color: '#F59E0B' },
          { time: '03:00 PM', title: 'System review', copy: 'Look at uptime and backup status', badge: 'Today', color: '#10B981' },
        ],
        workQueue: [
          { title: 'Approve new school', copy: 'One campus is pending final onboarding.', badge: 'High', color: '#F59E0B' },
          { title: 'Review ACL changes', copy: 'Permission updates need validation.', badge: 'Security', color: '#4F46E5' },
          { title: 'Check backup report', copy: 'Daily backup completed at 2:00 AM.', badge: 'OK', color: '#10B981' },
        ],
        notices: [
          { title: 'License renewal due', copy: 'Platform license expires next month.', color: '#4F46E5' },
          { title: 'New school request', copy: 'A new campus is waiting for approval.', color: '#F59E0B' },
          { title: 'Security report ready', copy: 'Download the weekly access summary.', color: '#06B6D4' },
        ],
        chartLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        chartSeries: [
          { name: 'Active schools', color: '#4F46E5', data: [120, 122, 124, 126, 127, 128] },
          { name: 'Approvals', color: '#F59E0B', data: [6, 5, 7, 4, 6, 3] },
        ],
        donutSegments: [
          { label: 'Healthy', value: 79, color: '#10B981' },
          { label: 'Review', value: 14, color: '#F59E0B' },
          { label: 'Critical', value: 7, color: '#EF4444' },
        ],
        ring: { value: 98, color: '#4F46E5', label: 'Coverage' },
        timelineTitle: 'Executive timeline',
        timelineSubtitle: 'A quick look at what needs to be reviewed across the platform.',
        chartTitle: 'Platform growth',
        chartSubtitle: 'Track schools onboarded and approvals processed this week.',
        donutTitle: 'Operational mix',
        donutSubtitle: 'Healthy services versus items that need attention.',
        queueTitle: 'Priority queue',
        queueSubtitle: 'The top items waiting for your review.',
        noticeTitle: 'Platform notices',
        noticeSubtitle: 'Important updates for the global admin team.',
        calendarTitle: 'Calendar',
        calendarSubtitle: 'The current month at a glance.',
      }
    }

    if (variant === 'headOffice') {
      return {
        role,
        name,
        greeting,
        school: formatMeta(headOfficeName, 'Head Office'),
        focus: 'Regional control room',
        workspaceLabel: 'Head Office Workspace',
        accent: '#0F766E',
        accent2: '#F59E0B',
        avatarTone: 'linear-gradient(135deg, #ccfbf1, #fde68a)',
        heroNote: 'Monitor the schools under your office, approvals, and follow-ups in one place.',
        heroMeta: [
          { label: 'Office', value: formatMeta(headOfficeName, 'Current office') },
          { label: 'Schools', value: '18' },
          { label: 'Admins', value: '24' },
          { label: 'Pending', value: '11' },
        ],
        focusLabel: 'Office priority',
        focusValue: '3 school reviews today',
        focusNote: 'Support school admins, review reports, and close the pending requests before 5 PM.',
        stats: [
          { icon: 'ri-building-4-line', label: 'Schools', value: '18', foot: 'Schools currently under this office.', tone: '#0F766E' },
          { icon: 'ri-user-2-line', label: 'Admins', value: '24', foot: 'Head office and school-level admins.', tone: '#F59E0B' },
          { icon: 'ri-file-list-3-line', label: 'Reviews', value: '11', foot: 'Reports waiting for verification.', tone: '#2563EB' },
          { icon: 'ri-notification-3-line', label: 'Alerts', value: '05', foot: 'Office notices that need attention.', tone: '#EF4444' },
        ],
        timetable: [
          { time: '09:30 AM', title: 'School review', copy: 'Inspect attendance and fee reports', badge: 'Today', color: '#0F766E' },
          { time: '11:00 AM', title: 'Principal call', copy: 'Discuss staffing and section issues', badge: 'Scheduled', color: '#2563EB' },
          { time: '01:30 PM', title: 'Compliance check', copy: 'Confirm school audit responses', badge: 'Pending', color: '#F59E0B' },
          { time: '03:45 PM', title: 'Approvals', copy: 'Close office-level request queue', badge: 'Later', color: '#EF4444' },
        ],
        workQueue: [
          { title: 'Verify school report', copy: 'Attendance summary needs sign-off.', badge: 'Urgent', color: '#F59E0B' },
          { title: 'Review admin request', copy: 'A school admin role change is pending.', badge: 'Queue', color: '#0F766E' },
          { title: 'Check fee sync', copy: 'One school has a payment mismatch.', badge: 'Review', color: '#EF4444' },
        ],
        notices: [
          { title: 'Office meeting at 4 PM', copy: 'All regional admins must attend.', color: '#2563EB' },
          { title: 'Monthly compliance memo', copy: 'Please submit the school audit forms.', color: '#0F766E' },
          { title: 'Support ticket backlog', copy: 'Resolve the oldest requests first.', color: '#F59E0B' },
        ],
        chartLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        chartSeries: [
          { name: 'Schools reviewed', color: '#0F766E', data: [3, 4, 5, 3, 6, 4] },
          { name: 'Issues resolved', color: '#F59E0B', data: [2, 2, 4, 1, 3, 2] },
        ],
        donutSegments: [
          { label: 'Clear', value: 68, color: '#0F766E' },
          { label: 'Pending', value: 20, color: '#F59E0B' },
          { label: 'Escalated', value: 12, color: '#EF4444' },
        ],
        ring: { value: 86, color: '#0F766E', label: 'Coverage' },
        timelineTitle: 'Office timeline',
        timelineSubtitle: 'The most important office actions planned for today.',
        chartTitle: 'School oversight',
        chartSubtitle: 'Track reviews completed and issues resolved this week.',
        donutTitle: 'Workload mix',
        donutSubtitle: 'See how much is clear, pending, or escalated.',
        queueTitle: 'Office queue',
        queueSubtitle: 'The next items waiting for your attention.',
        noticeTitle: 'Office notices',
        noticeSubtitle: 'Regional updates and reminders for the office team.',
        calendarTitle: 'Calendar',
        calendarSubtitle: 'The current month at a glance.',
      }
    }

    if (variant === 'schoolAdmin') {
      return {
        role,
        name,
        greeting,
        school: formatMeta(schoolName, 'Assigned School'),
        focus: 'Campus operations',
        workspaceLabel: 'School Admin Workspace',
        accent: '#2563EB',
        accent2: '#14B8A6',
        avatarTone: 'linear-gradient(135deg, #dbeafe, #ccfbf1)',
        heroNote: 'Keep the campus running smoothly with live attendance, notices, and approvals.',
        heroMeta: [
          { label: 'School', value: formatMeta(schoolName, 'Assigned school') },
          { label: 'Teachers', value: '42' },
          { label: 'Sections', value: '18' },
          { label: 'Requests', value: '09' },
        ],
        focusLabel: 'Campus priority',
        focusValue: 'Attendance update due',
        focusNote: 'Daily school operations, notices, and approvals are grouped into one view.',
        stats: [
          { icon: 'ri-school-line', label: 'Students', value: '1.1K', foot: 'Students enrolled across the school.', tone: '#2563EB' },
          { icon: 'ri-group-line', label: 'Teachers', value: '42', foot: 'Active teaching staff and support team.', tone: '#14B8A6' },
          { icon: 'ri-calendar-check-line', label: 'Attendance', value: '94%', foot: 'Today - school attendance progress.', tone: '#F97316' },
          { icon: 'ri-file-list-3-line', label: 'Requests', value: '09', foot: 'Admission, leave, and class requests.', tone: '#EF4444' },
        ],
        timetable: [
          { time: '08:00 AM', title: 'Assembly', copy: 'Morning assembly and announcements', badge: 'Completed', color: '#2563EB' },
          { time: '10:00 AM', title: 'Class visit', copy: 'Observe classrooms and attendance', badge: 'Today', color: '#14B8A6' },
          { time: '12:30 PM', title: 'Parent meeting', copy: 'Meet parents for feedback review', badge: 'Scheduled', color: '#F97316' },
          { time: '03:00 PM', title: 'Office checks', copy: 'Review notices and fee updates', badge: 'Later', color: '#EF4444' },
        ],
        workQueue: [
          { title: 'Approve class routine', copy: 'One section timetable is pending.', badge: 'High', color: '#F97316' },
          { title: 'Check teacher attendance', copy: 'Morning sign-in report needs review.', badge: 'Today', color: '#14B8A6' },
          { title: 'Release parent notice', copy: 'New circular is ready to publish.', badge: 'New', color: '#2563EB' },
        ],
        notices: [
          { title: 'School inspection scheduled', copy: 'The office visit is set for Thursday.', color: '#2563EB' },
          { title: 'Sports day rehearsal', copy: 'Students should report to the field.', color: '#14B8A6' },
          { title: 'Fee reminder batch', copy: 'Pending reminders can be sent today.', color: '#F97316' },
        ],
        chartLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        chartSeries: [
          { name: 'Attendance', color: '#2563EB', data: [90, 92, 94, 93, 95, 94] },
          { name: 'Tasks', color: '#14B8A6', data: [4, 5, 4, 3, 6, 5] },
        ],
        donutSegments: [
          { label: 'Completed', value: 72, color: '#2563EB' },
          { label: 'Pending', value: 18, color: '#F97316' },
          { label: 'Review', value: 10, color: '#14B8A6' },
        ],
        ring: { value: 94, color: '#2563EB', label: 'Attendance' },
        timelineTitle: 'Campus timeline',
        timelineSubtitle: 'The school day and admin flow at a glance.',
        chartTitle: 'Weekly school health',
        chartSubtitle: 'See attendance and open tasks across the week.',
        donutTitle: 'Operations mix',
        donutSubtitle: 'Completed work versus items still in progress.',
        queueTitle: 'School queue',
        queueSubtitle: 'Tasks that need approval or follow-up.',
        noticeTitle: 'Campus notices',
        noticeSubtitle: 'Important updates from the school office.',
        calendarTitle: 'Calendar',
        calendarSubtitle: 'The current month at a glance.',
      }
    }

    if (variant === 'teacher') {
      const department =
        teacherContext?.department || user?.department || user?.subject || 'Academic Team'
      const school = formatMeta(schoolName, 'Assigned School')
      const focus = teacherContext?.designation || user?.designation || 'Lead Instructor'
      return {
        role,
        name,
        greeting,
        school,
        focus,
        workspaceLabel: 'Teacher Workspace',
        accent: '#6D28D9',
        accent2: '#F97316',
        avatarTone: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
        heroNote: 'Review lessons, submissions, and attendance from one command center.',
        heroMeta: [
          { label: 'School', value: school },
          { label: 'Department', value: department },
          { label: 'Focus', value: focus },
        ],
        focusLabel: 'Today in focus',
        focusValue: '6 classes scheduled',
        focusNote: '2 lessons to review, 18 submissions pending, 1 parent update requested.',
        stats: [
          { icon: 'ri-slideshow-line', label: 'Classes Today', value: '06', foot: 'Two are live, four are scheduled.', tone: '#6D28D9' },
          { icon: 'ri-group-line', label: 'Students', value: '284', foot: 'Across 8 sections this week.', tone: '#2563EB' },
          { icon: 'ri-file-list-3-line', label: 'Pending Review', value: '18', foot: 'Assignments and quizzes waiting.', tone: '#F97316' },
          { icon: 'ri-checkbox-circle-line', label: 'Attendance', value: '93%', foot: 'Average across your assigned classes.', tone: '#14B8A6' },
        ],
        timetable: [
          { time: '08:30 AM', title: 'Class 7 - Mathematics', copy: 'Algebra basics and quick recap', badge: 'Upcoming', color: '#6D28D9' },
          { time: '09:30 AM', title: 'Class 8 - Physics', copy: 'Lab demonstration and Q&A', badge: 'Live', color: '#2563EB' },
          { time: '10:45 AM', title: 'Class 10 - Chemistry', copy: 'Revision notes and worksheet', badge: 'Next', color: '#F97316' },
          { time: '01:00 PM', title: 'Class 9 - Science', copy: 'Chapter discussion and attendance', badge: 'Planned', color: '#14B8A6' },
        ],
        workQueue: [
          { title: 'Evaluate 12 submissions', copy: 'Grade the worksheet from Class 10', badge: 'High priority', color: '#F97316' },
          { title: 'Upload lesson notes', copy: 'Share the next slide deck before lunch', badge: 'Today', color: '#6D28D9' },
          { title: 'Parent follow-up', copy: 'Respond to two attendance queries', badge: 'Pending', color: '#2563EB' },
        ],
        notices: [
          { title: 'Faculty meeting at 3:30 PM', copy: 'Conference room B, attendance required.', color: '#6D28D9' },
          { title: 'Grade submission closes tonight', copy: 'Please publish marks before 9:00 PM.', color: '#F97316' },
          { title: 'New syllabus update available', copy: 'Check the revised science module.', color: '#14B8A6' },
        ],
        chartLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        chartSeries: [
          { name: 'Delivered', color: '#6D28D9', data: [4, 5, 4, 6, 5, 3] },
          { name: 'Reviewed', color: '#F97316', data: [2, 3, 2, 4, 3, 2] },
        ],
        donutSegments: [
          { label: 'Graded', value: 62, color: '#6D28D9' },
          { label: 'Queued', value: 24, color: '#F97316' },
          { label: 'Drafts', value: 14, color: '#14B8A6' },
        ],
        ring: { value: 78, color: '#6D28D9', label: 'Coverage' },
        timelineTitle: 'Teaching timeline',
        timelineSubtitle: 'A quick look at the day ahead and what needs your attention.',
        chartTitle: 'Weekly delivery',
        chartSubtitle: 'Compare lessons delivered against what still needs review.',
        donutTitle: 'Review load',
        donutSubtitle: 'An overview of the grading queue and pending follow-up.',
        queueTitle: 'Work queue',
        queueSubtitle: 'The jobs that need your attention next.',
        noticeTitle: 'Announcements',
        noticeSubtitle: 'Stay aligned with the latest staff updates.',
        calendarTitle: 'Calendar',
        calendarSubtitle: 'The current month at a glance.',
      }
    }

    if (variant === 'parent') {
      const childName =
        selectedChild?.name ||
        selectedChild?.studentName ||
        selectedChild?.fullName ||
        selectedChild?.student?.name ||
        'Your child'
      const school = formatMeta(
        selectedChild?.schoolName ||
          selectedChild?.school?.schoolName ||
          selectedChild?.school?.name ||
          schoolName,
        'Assigned School',
      )
      const childRoll = formatMeta(
        selectedChild?.rollNo ||
          selectedChild?.rollNumber ||
          selectedChild?.student?.rollNo ||
          studentId,
        'Roll not set',
      )
      return {
        role,
        name,
        greeting,
        school,
        focus: `${childName}'s progress`,
        workspaceLabel: 'Parent Workspace',
        accent: '#0F766E',
        accent2: '#F59E0B',
        avatarTone: 'linear-gradient(135deg, #ccfbf1, #fde68a)',
        heroNote: "Monitor your child's attendance, homework, fee reminders, and school notices in one place.",
        heroMeta: [
          { label: 'Child', value: childName },
          { label: 'School', value: school },
          { label: 'Class', value: formatMeta(selectedChild?.className || selectedChild?.schoolClassName || selectedChild?.student?.className || studentClassId, 'Class not set') },
          { label: 'Section', value: formatMeta(selectedChild?.sectionName || selectedChild?.schoolSectionName || selectedChild?.student?.sectionName || studentSectionId, 'Section not set') },
          { label: 'Roll No.', value: childRoll },
        ],
        focusLabel: 'Next update',
        focusValue: 'Homework due at 5:00 PM',
        focusNote: 'Math practice is assigned and the attendance report is refreshed daily.',
        stats: [
          { icon: 'ri-calendar-check-line', label: 'Attendance', value: '91%', foot: "This month's school attendance.", tone: '#0F766E' },
          { icon: 'ri-book-open-line', label: 'Homework', value: '03', foot: 'Assignments waiting for review.', tone: '#F59E0B' },
          { icon: 'ri-message-3-line', label: 'Messages', value: '07', foot: 'New teacher and office messages.', tone: '#2563EB' },
          { icon: 'ri-bank-card-line', label: 'Fees Due', value: '$120', foot: 'Next payment due this Friday.', tone: '#EF4444' },
        ],
        timetable: [
          { time: '08:30 AM', title: 'English', copy: 'Reading and vocabulary practice', badge: 'Completed', color: '#0F766E' },
          { time: '09:30 AM', title: 'Mathematics', copy: 'Number work and quick quiz', badge: 'Today', color: '#2563EB' },
          { time: '10:30 AM', title: 'Science', copy: 'Chapter review and activity', badge: 'Upcoming', color: '#F59E0B' },
          { time: '11:30 AM', title: 'Art', copy: 'Creative drawing task', badge: 'Later', color: '#EF4444' },
        ],
        workQueue: [
          { title: 'Submit signed homework', copy: 'Return the math sheet tomorrow morning.', badge: 'Due', color: '#F59E0B' },
          { title: 'Check fee notice', copy: 'Installment reminder from the office.', badge: 'Important', color: '#EF4444' },
          { title: 'Read teacher update', copy: 'Science class note sent after school.', badge: 'New', color: '#0F766E' },
        ],
        notices: [
          { title: 'Parent-teacher meeting', copy: 'Friday at 2:00 PM in the main hall.', color: '#2563EB' },
          { title: 'Annual sports practice', copy: 'Send sports shoes and water bottle.', color: '#0F766E' },
          { title: 'Library books due', copy: 'Please return borrowed books this week.', color: '#F59E0B' },
        ],
        chartLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        chartSeries: [
          { name: 'Attendance', color: '#0F766E', data: [90, 88, 94, 92, 96, 91] },
          { name: 'Homework', color: '#F59E0B', data: [2, 3, 1, 2, 4, 3] },
        ],
        donutSegments: [
          { label: 'Submitted', value: 64, color: '#0F766E' },
          { label: 'Pending', value: 21, color: '#F59E0B' },
          { label: 'Reviewed', value: 15, color: '#2563EB' },
        ],
        ring: { value: 91, color: '#0F766E', label: 'Attendance' },
        timelineTitle: 'Child timetable',
        timelineSubtitle: 'The classes and activities your child is following today.',
        chartTitle: 'Weekly attendance',
        chartSubtitle: 'See how attendance and homework move through the week.',
        donutTitle: 'Task status',
        donutSubtitle: 'Keep an eye on what is submitted and what still needs work.',
        queueTitle: 'Assignments & reminders',
        queueSubtitle: 'Important actions and due items to keep on top of.',
        noticeTitle: 'Notices',
        noticeSubtitle: 'Quick updates from your school office and teachers.',
        calendarTitle: 'Calendar',
        calendarSubtitle: 'The current month at a glance.',
      }
    }

    if (variant === 'lms') {
      const school = formatMeta(schoolName, 'Assigned School')
      return {
        role,
        name,
        greeting,
        school,
        focus: 'LMS overview',
        workspaceLabel: 'LMS Workspace',
        accent: '#0A51CE',
        accent2: '#8B5CF6',
        avatarTone: 'linear-gradient(135deg, #dbeafe, #ede9fe)',
        heroNote: 'Manage courses, students, assignments and performance metrics in one centralized LMS Dashboard.',
        lmsLayout: {
          metrics: [
            {
              title: 'Enrolled Courses',
              value: '500',
              foot: 'From last month',
              image: lmsIconOne,
              tone: '#0A51CE',
              trend: '43.9%',
              direction: 'up',
              background: lmsBgOne,
            },
            {
              title: 'Total Students',
              value: '3,570',
              foot: 'From last month',
              image: lmsIconTwo,
              tone: '#7C3AED',
              trend: '43.9%',
              direction: 'up',
              background: lmsBgTwo,
            },
            {
              title: 'Total Courses',
              value: '30',
              foot: 'From last month',
              image: lmsIconThree,
              tone: '#F59E0B',
              trend: '43.9%',
              direction: 'up',
              background: lmsBgThree,
            },
            {
              title: 'Total Earnings',
              value: '$50,000',
              foot: 'From last month',
              image: lmsIconFour,
              tone: '#16A34A',
              trend: '20.3%',
              direction: 'down',
              background: lmsBgFour,
            },
          ],
          chartTitle: 'Earning Statistic',
          chartValue: '$27,200',
          chartFoot: '+ $1500 Per Day',
          chartLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          chartSeries: [
            { name: 'Earnings', color: '#0A51CE', data: [24, 30, 28, 36, 32, 40] },
            { name: 'Enrollments', color: '#8B5CF6', data: [12, 14, 11, 18, 16, 20] },
          ],
          sessionsTitle: 'Upcoming Sessions',
          sessions: [
            { image: sessionOne, title: 'Cameron Williamson', subject: 'English', date: '15 Jun 2025', time: '12:30 PM' },
            { image: sessionTwo, title: 'Kristin Watson', subject: 'English', date: '15 Jun 2025', time: '12:30 PM' },
          ],
          coursesTitle: 'Recent Enrolled Courses',
          courses: [
            { title: 'Advanced Mathematics', copy: 'Algebra and practice sets', teacher: 'Mr. Khan', students: '124', progress: 78, tone: '#0A51CE', image: courseOne },
            { title: 'Science Foundations', copy: 'Lab notes and weekly revision', teacher: 'Ms. Ray', students: '98', progress: 64, tone: '#8B5CF6', image: courseTwo },
            { title: 'English Writing', copy: 'Vocabulary and essay practice', teacher: 'Mrs. Paul', students: '112', progress: 84, tone: '#16A34A', image: courseThree },
          ],
        },
        heroMeta: [
          { label: 'School', value: school },
          { label: 'Courses', value: '30' },
          { label: 'Students', value: '3,570' },
          { label: 'Earnings', value: '$50,000' },
        ],
        focusLabel: 'Today in focus',
        focusValue: '4 classes and 2 reviews',
        focusNote: 'Track sessions, enrollments, and revenue from a single LMS command center.',
        stats: [],
        timetable: [],
        workQueue: [],
        notices: [],
        chartLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        chartSeries: [
          { name: 'Earnings', color: '#0A51CE', data: [24, 30, 28, 36, 32, 40] },
          { name: 'Enrollments', color: '#8B5CF6', data: [12, 14, 11, 18, 16, 20] },
        ],
        donutSegments: [
          { label: 'Live', value: 54, color: '#0A51CE' },
          { label: 'Draft', value: 28, color: '#8B5CF6' },
          { label: 'Archived', value: 18, color: '#F59E0B' },
        ],
        ring: { value: 88, color: '#0A51CE', label: 'Revenue' },
        timelineTitle: 'LMS activity',
        timelineSubtitle: 'A snapshot of courses, sessions, and teaching load.',
        chartTitle: 'Earning Statistic',
        chartSubtitle: 'Track revenue and enrollments throughout the week.',
        donutTitle: 'Course mix',
        donutSubtitle: 'See which course states need the most attention.',
        queueTitle: 'Upcoming Sessions',
        queueSubtitle: 'Live classes and scheduled sessions for today.',
        noticeTitle: 'Recent Enrolled Courses',
        noticeSubtitle: 'Courses recently added to the LMS.',
        calendarTitle: 'Calendar',
        calendarSubtitle: 'Plan live sessions and assessments around the month.',
      }
    }

    if (variant === 'student') {
      const school = formatMeta(schoolName, 'Assigned School')
      const studentClass = formatMeta(user?.className || user?.studentClassName || studentClassId, 'Class not set')
      const section = formatMeta(user?.sectionName || user?.studentSectionName || studentSectionId, 'Section not set')
      const roll = formatMeta(user?.rollNo || user?.rollNumber || studentId, 'Roll not set')
      return {
        role,
        name,
        greeting,
        school,
        focus: 'Student journey',
        workspaceLabel: 'Student Workspace',
        accent: '#0EA5E9',
        accent2: '#14B8A6',
        avatarTone: 'linear-gradient(135deg, #e0f2fe, #cffafe)',
        heroNote: 'Keep track of classes, attendance, deadlines, and results in one clean view.',
        studentLayout: {
          classLabel: studentClass,
          rollLabel: roll,
          widgets: [
            { label: 'Events', value: '10', icon: widgetOne, theme: 'violet' },
            { label: 'Notifications', value: '15', icon: widgetTwo, theme: 'teal' },
            { label: 'Attendance', value: '90%', icon: widgetThree, theme: 'blue' },
          ],
          attendanceSegments: [
            { label: 'Present', value: 58, color: '#22c55e' },
            { label: 'Half Day', value: 22, color: '#0ea5e9' },
            { label: 'Late', value: 12, color: '#8b5cf6' },
            { label: 'Absent', value: 8, color: '#f59e0b' },
          ],
          attendanceBreakdown: [
            { label: 'Present', value: '200', color: '#22c55e' },
            { label: 'Half Day', value: '300', color: '#0ea5e9' },
            { label: 'Late', value: '172', color: '#8b5cf6' },
            { label: 'Absent', value: '500', color: '#f59e0b' },
          ],
          todayClasses: [
            { time: '08:30 AM', title: 'English', copy: 'Chapter reading and quick quiz', badge: 'Completed', color: '#0EA5E9' },
            { time: '09:30 AM', title: 'Mathematics', copy: 'Algebra exercises and board work', badge: 'Next', color: '#14B8A6' },
            { time: '10:30 AM', title: 'Science', copy: 'Lab discussion and notes', badge: 'Upcoming', color: '#8B5CF6' },
            { time: '11:30 AM', title: 'Social Studies', copy: 'Map practice and review', badge: 'Upcoming', color: '#F97316' },
          ],
          courses: [
            { title: 'Mathematics', copy: 'Class 7 - Chapter 4 and practice sets.', teacher: 'Mr. Khan', progress: 78, tone: '#0EA5E9', icon: courseOne },
            { title: 'Science', copy: 'Lab work and weekly chapter revision.', teacher: 'Ms. Ray', progress: 64, tone: '#14B8A6', icon: courseTwo },
            { title: 'English', copy: 'Reading, vocabulary, and writing tasks.', teacher: 'Mrs. Paul', progress: 84, tone: '#8B5CF6', icon: courseThree },
          ],
          notices: [
            { title: 'Annual sports day', copy: 'Uniform and ID card required.', color: '#0EA5E9' },
            { title: 'Result sheets published', copy: 'Term results are now available.', color: '#8B5CF6' },
            { title: 'Parent meeting notice', copy: 'See the office for schedule details.', color: '#14B8A6' },
          ],
          tasks: [
            { title: 'Science worksheet', copy: 'Submit by 5:00 PM today.', badge: 'Due today', color: '#F97316' },
            { title: 'Math revision', copy: 'Practice the chapter 4 problems.', badge: 'In progress', color: '#0EA5E9' },
            { title: 'Read notices', copy: 'Check your school announcements.', badge: 'New', color: '#14B8A6' },
          ],
        },
        heroMeta: [
          { label: 'School', value: school },
          { label: 'Class', value: studentClass },
          { label: 'Section', value: section },
          { label: 'Roll No.', value: roll },
        ],
        focusLabel: 'Next class',
        focusValue: 'Mathematics at 09:30 AM',
        focusNote: 'Bring your notebook and complete the warm-up before the bell rings.',
        stats: [
          { image: studentIcon, label: 'Total Students', value: '20,000', foot: 'Students enrolled across all active classes.', tone: '#FF7A21' },
          { image: teacherIcon, label: 'Total Teachers', value: '850', foot: 'Teachers supporting lessons and activities.', tone: '#2B57FF' },
          { image: guardianIcon, label: 'Total Parents', value: '12,400', foot: 'Parents connected through the portal.', tone: '#A31EEB' },
          { image: feesIcon, label: 'Fees Collected', value: '$320,000', foot: 'Fee collections processed this month.', tone: '#2AA79B' },
          { image: attendanceIcon, label: 'Avg Attendance', value: '87%', foot: 'Average attendance across your school.', tone: '#11B81B' },
          { image: libraryIcon, label: 'Library Books', value: '18,000', foot: 'Books currently available in the library.', tone: '#17A4F7' },
        ],
        timetable: [
          { time: '08:30 AM', title: 'English', copy: 'Reading and vocabulary practice', badge: 'Completed', color: '#0F766E' },
          { time: '09:30 AM', title: 'Mathematics', copy: 'Number work and quick quiz', badge: 'Today', color: '#2563EB' },
          { time: '10:30 AM', title: 'Science', copy: 'Chapter review and activity', badge: 'Upcoming', color: '#F59E0B' },
          { time: '11:30 AM', title: 'Art', copy: 'Creative drawing task', badge: 'Later', color: '#EF4444' },
        ],
        workQueue: [
          { title: 'Submit signed homework', copy: 'Return the math sheet tomorrow morning.', badge: 'Due', color: '#F59E0B' },
          { title: 'Check fee notice', copy: 'Installment reminder from the office.', badge: 'Important', color: '#EF4444' },
          { title: 'Read teacher update', copy: 'Science class note sent after school.', badge: 'New', color: '#0F766E' },
        ],
        notices: [
          { title: 'Parent-teacher meeting', copy: 'Friday at 2:00 PM in the main hall.', color: '#2563EB' },
          { title: 'Annual sports practice', copy: 'Send sports shoes and water bottle.', color: '#0F766E' },
          { title: 'Library books due', copy: 'Please return borrowed books this week.', color: '#F59E0B' },
        ],
        chartLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        chartSeries: [
          { name: 'Attendance', color: '#0F766E', data: [90, 88, 94, 92, 96, 91] },
          { name: 'Homework', color: '#F59E0B', data: [2, 3, 1, 2, 4, 3] },
        ],
        donutSegments: [
          { label: 'Submitted', value: 64, color: '#0F766E' },
          { label: 'Pending', value: 21, color: '#F59E0B' },
          { label: 'Reviewed', value: 15, color: '#2563EB' },
        ],
        ring: { value: 91, color: '#0F766E', label: 'Attendance' },
        timelineTitle: "Today's classes",
        timelineSubtitle: 'The classes and activities your child is following today.',
        chartTitle: 'Weekly attendance',
        chartSubtitle: 'See how attendance and homework move through the week.',
        donutTitle: 'Task status',
        donutSubtitle: 'Keep an eye on what is submitted and what still needs work.',
        queueTitle: 'Assignments & reminders',
        queueSubtitle: 'Important actions and due items to keep on top of.',
        noticeTitle: 'Notices',
        noticeSubtitle: 'Quick updates from your school office and teachers.',
        calendarTitle: 'Calendar',
        calendarSubtitle: 'The current month at a glance.',
      }
    }

    const school = formatMeta(schoolName, 'Assigned School')
    const studentClass = formatMeta(user?.className || user?.studentClassName || studentClassId, 'Class not set')
    const section = formatMeta(user?.sectionName || user?.studentSectionName || studentSectionId, 'Section not set')
    const roll = formatMeta(user?.rollNo || user?.rollNumber || studentId, 'Roll not set')

    return {
      role,
      name,
      greeting,
      school,
      focus: 'Student journey',
      workspaceLabel: 'Student Workspace',
      accent: '#0EA5E9',
      accent2: '#14B8A6',
      avatarTone: 'linear-gradient(135deg, #e0f2fe, #cffafe)',
      heroNote: 'Keep track of classes, attendance, deadlines, and results in one clean view.',
      heroMeta: [
        { label: 'School', value: school },
        { label: 'Class', value: studentClass },
        { label: 'Section', value: section },
        { label: 'Roll No.', value: roll },
      ],
      focusLabel: 'Next class',
      focusValue: 'Mathematics at 09:30 AM',
      focusNote: 'Bring your notebook and complete the warm-up before the bell rings.',
      stats: [
        { icon: 'ri-calendar-event-line', label: 'Events', value: '10', foot: 'School activities and class events this month.', tone: '#0EA5E9' },
        { icon: 'ri-notification-3-line', label: 'Notifications', value: '15', foot: 'Announcements from teachers and office.', tone: '#14B8A6' },
        { icon: 'ri-calendar-check-line', label: 'Attendance', value: '90%', foot: 'Your monthly attendance overview.', tone: '#8B5CF6' },
        { icon: 'ri-book-open-line', label: 'Pending Tasks', value: '04', foot: 'Assignments and notes to complete.', tone: '#F97316' },
      ],
      timetable: [
        { time: '08:30 AM', title: 'English', copy: 'Chapter reading and quick quiz', badge: 'Completed', color: '#0EA5E9' },
        { time: '09:30 AM', title: 'Mathematics', copy: 'Algebra exercises and board work', badge: 'Next', color: '#14B8A6' },
        { time: '10:30 AM', title: 'Science', copy: 'Lab discussion and notes', badge: 'Upcoming', color: '#8B5CF6' },
        { time: '11:30 AM', title: 'Social Studies', copy: 'Map practice and review', badge: 'Upcoming', color: '#F97316' },
      ],
      workQueue: [
        { title: 'Science worksheet', copy: 'Submit by 5:00 PM today.', badge: 'Due today', color: '#F97316' },
        { title: 'Math revision', copy: 'Practice the chapter 4 problems.', badge: 'In progress', color: '#0EA5E9' },
        { title: 'Read notices', copy: 'Check your school announcements.', badge: 'New', color: '#14B8A6' },
      ],
      notices: [
        { title: 'Annual sports day', copy: 'Uniform and ID card required.', color: '#0EA5E9' },
        { title: 'Result sheets published', copy: 'Term results are now available.', color: '#8B5CF6' },
        { title: 'Parent meeting notice', copy: 'See the office for schedule details.', color: '#14B8A6' },
      ],
      chartLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      chartSeries: [
        { name: 'Attendance', color: '#0EA5E9', data: [92, 88, 95, 84, 90, 98] },
        { name: 'Tasks', color: '#14B8A6', data: [2, 3, 1, 4, 2, 1] },
      ],
      donutSegments: [
        { label: 'Submitted', value: 58, color: '#0EA5E9' },
        { label: 'Pending', value: 28, color: '#F97316' },
        { label: 'Reviewed', value: 14, color: '#14B8A6' },
      ],
      ring: { value: 90, color: '#0EA5E9', label: 'Attendance' },
      timelineTitle: 'Today\'s classes',
      timelineSubtitle: 'Your next classes, in order, with the current status for each period.',
      chartTitle: 'Weekly attendance',
      chartSubtitle: 'See how your attendance and task completion move through the week.',
      donutTitle: 'Task status',
      donutSubtitle: 'Keep an eye on what is submitted and what still needs work.',
      queueTitle: 'Assignments & reminders',
      queueSubtitle: 'Important actions and due items to keep on top of.',
      noticeTitle: 'Notices',
      noticeSubtitle: 'Quick updates from your school office and teachers.',
      calendarTitle: 'Calendar',
      calendarSubtitle: 'The current month at a glance.',
    }
  }, [headOfficeName, parentChildren, schoolName, selectedChild, studentClassId, studentId, studentSectionId, teacherContext, user, variant])

  const initials = getInitials(config.name)
  const classBadge = config.workspaceLabel || 'Dashboard'

  if (variant === 'lms') {
    return <LmsDashboardLayout config={config} initials={initials} />
  }

  if (variant === 'student') {
    return <StudentDashboardLayout config={config} initials={initials} />
  }

  return (
    <div className="dashboard-main-body role-dashboard">
      <div
        className="role-dashboard__hero"
        style={{
          background: `linear-gradient(135deg, ${config.accent}, ${config.accent2})`,
        }}
      >
        <div className="role-dashboard__hero-grid">
          <div className="role-dashboard__hero-copy">
            <div>
              <div className="role-dashboard__eyebrow">
                <i className="ri-compass-3-line"></i>
                {classBadge}
              </div>
              <div className="mt-16">
                <h1 className="role-dashboard__hero-title">
                  {config.greeting}, {config.name}
                </h1>
                <p className="role-dashboard__hero-subtitle mt-16">{config.heroNote}</p>
              </div>
            </div>

            <div className="role-dashboard__hero-meta">
              {config.heroMeta.map((meta) => (
                <div key={meta.label} className="role-dashboard__meta-chip">
                  <span>{meta.label}:</span>
                  <strong>{meta.value}</strong>
                </div>
              ))}
            </div>

            <div className="role-dashboard__hero-actions">
              <button type="button" className="btn btn-light border-0 text-primary-600">
                <i className="ri-bookmark-line me-1"></i>
                Open timetable
              </button>
              <button type="button" className="btn btn-light border-0 text-primary-600">
                <i className="ri-message-3-line me-1"></i>
                View messages
              </button>
            </div>
          </div>

          <div className="role-dashboard__hero-side">
            <div className="role-dashboard__profile-card">
              <div className="role-dashboard__avatar" style={{ background: config.avatarTone }}>
                {initials}
              </div>
              <div>
                <p className="role-dashboard__profile-title">{config.name}</p>
                <p className="role-dashboard__profile-subtitle">
                  {config.school}
                  <br />
                  {config.focus}
                </p>
              </div>
            </div>

            <div className="role-dashboard__focus-card">
              <p className="role-dashboard__focus-label">{config.focusLabel}</p>
              <p className="role-dashboard__focus-value">{config.focusValue}</p>
              <p className="role-dashboard__focus-note">{config.focusNote}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 stats-grid role-dashboard__stats">
        {config.stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="row g-4 mt-0">
        <div className="col-xxl-8">
          <div className="role-dashboard__section-gap">
            <SectionCard
              title={config.timelineTitle}
              subtitle={config.timelineSubtitle}
            >
              <div className="role-dashboard__timeline">
                {config.timetable.map((item) => (
                  <div key={`${item.time}-${item.title}`} className="role-dashboard__timeline-item">
                    <span className="role-dashboard__timeline-dot" style={{ background: item.color }}></span>
                    <div className="role-dashboard__timeline-content">
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-12">
                        <h4 className="role-dashboard__timeline-title">{item.title}</h4>
                        <span className="role-dashboard__badge" style={{ background: `${item.color}18`, color: item.color }}>
                          {item.badge}
                        </span>
                      </div>
                      <p className="role-dashboard__timeline-copy">
                        {item.time} - {item.copy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className="row g-4">
              <div className="col-lg-7">
                <SectionCard
                  title={config.chartTitle}
                  subtitle={config.chartSubtitle}
                >
                  <BarChart
                    labels={config.chartLabels}
                    series={config.chartSeries.map((series) => ({
                      name: series.name,
                      color: series.color,
                      data: series.data,
                    }))}
                    height={260}
                    showValueLabels
                    tooltip
                    valueFormatter={(v) => `${v}`}
                    yLabelFormatter={(v) => `${v}`}
                  />
                </SectionCard>
              </div>

              <div className="col-lg-5">
                <SectionCard
                  title={config.donutTitle}
                  subtitle={config.donutSubtitle}
                >
                  <div className="d-flex justify-content-center">
                    <ProgressRing value={config.ring.value} size={122} stroke={10} color={config.ring.color} label={config.ring.label} />
                  </div>
                  <div className="mt-20">
                    <DonutChart
                      segments={config.donutSegments}
                      size={220}
                      thickness={24}
                      centerLabel={variant === 'teacher' ? 'Queue' : 'Status'}
                      centerValue={variant === 'teacher' ? '24' : '58'}
                      legendMode="values"
                    />
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-4">
          <div className="role-dashboard__section-gap">
            <SectionCard title={config.calendarTitle} subtitle={config.calendarSubtitle}>
              <div className="role-dashboard__calendar-wrap">
                <MiniCalendar />
              </div>
            </SectionCard>

            <SectionCard
              title={config.queueTitle}
              subtitle={config.queueSubtitle}
            >
              <div className="role-dashboard__list">
                {config.workQueue.map((item) => (
                  <div key={item.title} className="role-dashboard__list-item">
                    <div className="role-dashboard__list-item-main">
                      <p className="role-dashboard__list-item-title">{item.title}</p>
                      <p className="role-dashboard__list-item-copy">{item.copy}</p>
                    </div>
                    <span className="role-dashboard__badge" style={{ background: `${item.color}18`, color: item.color }}>
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title={config.noticeTitle}
              subtitle={config.noticeSubtitle}
            >
              <div className="role-dashboard__list">
                {config.notices.map((item) => (
                  <div key={item.title} className="role-dashboard__list-item">
                    <div className="role-dashboard__list-item-main">
                      <p className="role-dashboard__list-item-title">{item.title}</p>
                      <p className="role-dashboard__list-item-copy">{item.copy}</p>
                    </div>
                    <span className="role-dashboard__badge" style={{ background: `${item.color}18`, color: item.color }}>
                      New
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoleDashboard
