import { useEffect, useMemo, useRef, useState } from 'react'

// ─── Static Data ────────────────────────────────────────────────────────────

const TODAYS_CLASS = [
  { subject: 'English',    time: '09:30 - 09:45 AM', status: 'Completed'  },
  { subject: 'Physics',    time: '09:50 - 10:35 AM', status: 'Inprogress' },
  { subject: 'Bangla',     time: '10:45 - 11:30 AM', status: 'Inprogress' },
  { subject: 'Chemistry',  time: '11:40 - 12:25 PM', status: 'Inprogress' },
  { subject: 'Accounting', time: '01:30 - 02:15 PM', status: 'Inprogress' },
  { subject: 'English',    time: '02:20 - 03:05 PM', status: 'Completed'  },
  { subject: 'English',    time: '03:10 - 03:55 PM', status: 'Completed'  },
]

const EXAM_RESULTS = [
  { id: 'AD52365', exam: 'Class Test',      subject: 'English',   grade: 'A', marks: '95%', cgpa: '4.2', status: 'Pass', statusClass: 'bg-success-100 text-success-600' },
  { id: 'AD52365', exam: 'First Semester',  subject: 'Chemistry', grade: 'A', marks: '80%', cgpa: '3.2', status: 'Pass', statusClass: 'bg-success-100 text-success-600' },
  { id: 'AD52365', exam: 'Class Test',      subject: 'Bangla',    grade: 'B', marks: '70%', cgpa: '4.5', status: 'Pass', statusClass: 'bg-success-100 text-success-600' },
  { id: 'AD52365', exam: 'Class Test',      subject: 'Accounting',grade: 'C', marks: '60%', cgpa: '3.9', status: 'Pass', statusClass: 'bg-success-100 text-success-600' },
  { id: 'AD52365', exam: 'First Semester',  subject: 'Chemistry', grade: 'A', marks: '80%', cgpa: '3.2', status: 'Pass', statusClass: 'bg-success-100 text-success-600' },
  { id: 'AD52365', exam: 'Class Test',      subject: 'English',   grade: 'F', marks: '30%', cgpa: '2.5', status: 'Fail', statusClass: 'bg-danger-100 text-danger-600'   },
]

const LEAVE_STATUS = [
  { title: 'Emergency Leave', date: '10/10/24', status: 'Pending',  statusClass: 'bg-warning-100 text-warning-600' },
  { title: 'Medical Leave',   date: '10/10/24', status: 'Accepted', statusClass: 'bg-success-100 text-success-600' },
  { title: 'Now Well',        date: '10/10/24', status: 'Pending',  statusClass: 'bg-warning-100 text-warning-600' },
  { title: 'Medical Leave',   date: '10/10/24', status: 'Accepted', statusClass: 'bg-success-100 text-success-600' },
  { title: 'Emergency Leave', date: '10/10/24', status: 'Accepted', statusClass: 'bg-success-100 text-success-600' },
  { title: 'Now Well',        date: '10/10/24', status: 'Pending',  statusClass: 'bg-warning-100 text-warning-600' },
  { title: 'Medical Leave',   date: '10/10/24', status: 'Accepted', statusClass: 'bg-success-100 text-success-600' },
  { title: 'Emergency Leave', date: '10/10/24', status: 'Accepted', statusClass: 'bg-success-100 text-success-600' },
  { title: 'Emergency Leave', date: '10/10/24', status: 'Pending',  statusClass: 'bg-warning-100 text-warning-600' },
  { title: 'Medical Leave',   date: '10/10/24', status: 'Accepted', statusClass: 'bg-success-100 text-success-600' },
  { title: 'Now Well',        date: '10/10/24', status: 'Pending',  statusClass: 'bg-warning-100 text-warning-600' },
  { title: 'Medical Leave',   date: '10/10/24', status: 'Accepted', statusClass: 'bg-success-100 text-success-600' },
  { title: 'Emergency Leave', date: '10/10/24', status: 'Accepted', statusClass: 'bg-success-100 text-success-600' },
  { title: 'Now Well',        date: '10/10/24', status: 'Pending',  statusClass: 'bg-warning-100 text-warning-600' },
]

const NOTICE_BOARD = [
  { img: '/assets/images/thumbs/notice-board-img1.png', author: 'Admin',           date: '25 Jan 2024', text: 'Lorem Ipsum is simply dummy text of the printing and typesetti' },
  { img: '/assets/images/thumbs/notice-board-img2.png', author: 'Kathryn Murphy',  date: '25 Jan 2024', text: 'Lorem Ipsum is simply dummy text of the printing and typesett ing industry Lorem Ipsum is simply dummy text of the printing and typesetting industry.' },
  { img: '/assets/images/thumbs/notice-board-img3.png', author: 'Admin',           date: '25 Jan 2024', text: 'Lorem Ipsum is simply dummy text of the printing and typesetti' },
  { img: '/assets/images/thumbs/notice-board-img2.png', author: 'John Doe',        date: '25 Jan 2024', text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Laborum voluptas corporis qui dolore est odit officia fuga?' },
]

const UPCOMING_EVENTS = [
  { time: '09:00 - 09:45', period: 'AM', title: 'Marketing Strategy Kickoff',    lead: 'Robert Fox',      borderClass: 'border-purple-600' },
  { time: '11:15 - 12:00', period: 'AM', title: 'Product Design Brainstorm',     lead: 'Leslie Alexander', borderClass: 'border-warning-600' },
  { time: '02:00 - 03:00', period: 'PM', title: 'Client Feedback Review',         lead: 'Courtney Henry',  borderClass: 'border-blue-600'   },
  { time: '04:15 - 05:00', period: 'PM', title: 'Sprint Planning & Task Allocation', lead: 'Eleanor Pena', borderClass: 'border-success-600' },
  { time: '01:15 - 02:00', period: 'PM', title: 'Client Feedback Review',         lead: 'John',            borderClass: 'border-primary-600' },
]

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Reusable 3-dot dropdown used in multiple cards */
function CardDotMenu() {
  return (
    <div className="dropdown">
      <button type="button" data-bs-toggle="dropdown" aria-expanded="false" className="border-0 bg-transparent p-0">
        <iconify-icon icon="entypo:dots-three-vertical" class="icon text-secondary-light" />
      </button>
      <ul className="dropdown-menu p-12 border bg-base shadow">
        <li>
          <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
            <iconify-icon icon="hugeicons:view" class="icon text-lg line-height-1" /> View
          </button>
        </li>
        <li>
          <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
            <iconify-icon icon="lucide:edit" class="icon text-lg line-height-1" /> Edit
          </button>
        </li>
        <li>
          <button type="button" className="delete-item dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-danger-100 text-hover-danger-600 d-flex align-items-center gap-10">
            <iconify-icon icon="fluent:delete-24-regular" class="icon text-lg line-height-1" /> Delete
          </button>
        </li>
      </ul>
    </div>
  )
}

/** Student profile + quick-stat widgets */
function StudentProfileCard() {
  return (
    <div className="col-xxl-4">
      <div className="card radius-12 border-0 h-100">
        <div className="card-body p-24 d-flex gap-16 flex-sm-nowrap flex-wrap">

          {/* Profile banner */}
          <div
            className="radius-8 overflow-hidden position-relative z-1 py-32 px-20 text-center d-flex justify-content-center align-items-center flex-grow-1"
          >
            <img
              src="/assets/images/bg/edit-profile-bg.png"
              alt="BG"
              className="position-absolute start-0 top-0 w-100 h-100 z-n1"
            />
            <div>
              <span className="mb-12 d-block">
                <img
                  src="/assets/images/thumbs/studnt-edit-profile-img.png"
                  alt="Student"
                  className="rounded-circle object-fit-cover"
                />
              </span>
              <h6 className="text-white">Devon Lane</h6>
              <span className="text-white text-lg d-block">Class: 7</span>
              <span className="text-white text-lg d-block">Roll No: 03</span>
              <div className="mt-12">
                <a
                  href="#"
                  className="px-20 py-8 text-white bg-white bg-opacity-10 radius-6 fw-medium text-lg"
                >
                  Edit Profile
                </a>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="d-flex flex-column gap-20 flex-grow-1 justify-content-between">
            <div className="radius-8 py-24 px-24 text-start d-flex align-items-center gap-12 bg-purple-100">
              <span className="w-48-px h-48-px d-inline-flex justify-content-center align-items-center rounded-circle border border-purple-300 bg-purple-200">
                <img src="/assets/images/icons/teacher-widget-icon1.png" alt="Events" />
              </span>
              <div>
                <span className="text-secondary-light fw-medium d-block">Events</span>
                <h5 className="text-primary-light">10</h5>
              </div>
            </div>

            <div className="radius-8 py-24 px-24 text-start d-flex align-items-center gap-12 bg-success-100">
              <span className="w-48-px h-48-px d-inline-flex justify-content-center align-items-center rounded-circle border border-success-300 bg-success-200">
                <img src="/assets/images/icons/teacher-widget-icon2.png" alt="Notifications" />
              </span>
              <div>
                <span className="text-secondary-light fw-medium d-block">Notifications</span>
                <h5 className="text-primary-light">15</h5>
              </div>
            </div>

            <div className="radius-8 py-24 px-24 text-start d-flex align-items-center gap-12 bg-primary-100">
              <span className="w-48-px h-48-px d-inline-flex justify-content-center align-items-center rounded-circle border border-primary-300 bg-primary-200">
                <img src="/assets/images/icons/teacher-widget-icon3.png" alt="Attendance" />
              </span>
              <div>
                <span className="text-secondary-light fw-medium d-block">Attendance</span>
                <h5 className="text-primary-light">90%</h5>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

/** Attendance donut chart */
function AttendanceCard() {
  const chartRef = useRef(null)

  useEffect(() => {
    if (!chartRef.current) return undefined
    const ApexCharts = window.ApexCharts || globalThis.ApexCharts
    if (!ApexCharts) return undefined

    const chart = new ApexCharts(chartRef.current, {
      series: [200, 200, 200, 200],
      colors: ['#487FFF', '#9935FE', '#FF9F29', '#45B369'],
      labels: ['Total Visitors', 'Registrations', 'Total Page Views', 'Registrations'],
      legend: { show: false },
      chart: {
        type: 'donut',
        height: 270,
        sparkline: { enabled: true },
        margin:  { top: 0, right: 0, bottom: 0, left: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      },
      stroke: { width: 0 },
      dataLabels: { enabled: false },
      responsive: [{ breakpoint: 480, options: { chart: { width: 300 }, legend: { position: 'bottom' } } }],
    })
    chart.render()
    return () => chart.destroy()
  }, [])

  return (
    <div className="col-xxl-4 col-lg-6">
      <div className="card radius-12 border-0 h-100">
        <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between py-12 px-20 border-bottom border-neutral-200">
          <h6 className="mb-2 fw-bold text-lg">Attendance</h6>
          <select className="form-select bg-base form-select-sm w-auto radius-8">
            <option>Yearly</option>
            <option>Monthly</option>
            <option>Weekly</option>
            <option>Today</option>
          </select>
        </div>
        <div className="card-body py-24">
          <div className="gap-20">
            <div className="text-center">
              <div ref={chartRef} className="apexcharts-tooltip-z-none" />
            </div>
            <div className="d-flex gap-12 justify-content-around mt-24">
              {[
                { color: 'bg-success-500', count: '200', label: 'Present'  },
                { color: 'bg-info',        count: '300', label: 'Half Day' },
                { color: 'bg-purple',      count: '172', label: 'Late'     },
                { color: 'bg-warning',     count: '500', label: 'Absent'   },
              ].map(({ color, count, label }) => (
                <div key={label} className="d-flex align-items-start gap-8">
                  <span className={`w-6-px h-16-px ${color} rounded-pill position-relative mt-8`} />
                  <div>
                    <h6 className="mb-0">{count}</h6>
                    <p className="text-secondary-light text-sm mb-0">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Today's class list */
function TodaysClassCard() {
  return (
    <div className="col-xxl-4 col-lg-6">
      <div className="card radius-12 border-0 h-100">
        <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between py-12 px-20 border-bottom border-neutral-200">
          <h6 className="mb-2 fw-bold text-lg">Today's Class</h6>
        </div>
        <div className="card-body pe-0 py-8">
          <div className="d-flex flex-column max-h-390-px overflow-y-auto scroll-sm pe-20">
            {TODAYS_CLASS.map((item, i) => (
              <div
                key={i}
                className={`d-flex align-items-center justify-content-between gap-3 py-10${i < TODAYS_CLASS.length - 1 ? ' border-bottom' : ''}`}
              >
                <div className="flex-grow-1">
                  <h6 className="text-lg mb-4 fw-medium">{item.subject}</h6>
                  <div className="d-flex align-items-center gap-8">
                    <span className="d-flex"><i className="ri-graduation-cap-line" /></span>
                    <span className="text-sm text-secondary-light fw-medium">{item.time}</span>
                  </div>
                </div>
                <div>
                  <span className={`${item.status === 'Completed' ? 'bg-success-100 text-success-600' : 'bg-warning-100 text-warning-600'} px-24 py-4 radius-4 fw-medium text-sm`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Exam results table */
function ExamResultsCard() {
  return (
    <div className="col-xxl-8">
      <div className="card radius-12 border-0">
        <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between py-12 px-20 border-bottom border-neutral-200">
          <h6 className="mb-2 fw-bold text-lg">Exam Results</h6>
          <CardDotMenu />
        </div>
        <div className="card-body p-0">
          <div className="table-responsive scroll-sm">
            <table className="table bordered-table mb-0">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Exam Name</th>
                  <th scope="col">Subject</th>
                  <th scope="col">Grade</th>
                  <th scope="col">Marks%</th>
                  <th scope="col">CGPA</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {EXAM_RESULTS.map((row, i) => (
                  <tr key={i}>
                    <td className="py-10-px"><span className="text-primary-600">{row.id}</span></td>
                    <td className="py-10-px">{row.exam}</td>
                    <td className="py-10-px">{row.subject}</td>
                    <td className="py-10-px">{row.grade}</td>
                    <td className="py-10-px">{row.marks}</td>
                    <td className="py-10-px">{row.cgpa}</td>
                    <td className="py-10-px">
                      <span className={`${row.statusClass} px-24 py-4 radius-4 fw-medium text-sm`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Big navigable calendar (matches original style-big calendar in HTML) */
function BigCalendarCard() {
  const today = useMemo(() => new Date(), [])
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const displayTitle = useMemo(
    () => cursor.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    [cursor],
  )

  const cells = useMemo(() => {
    const year  = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstDayIndex = new Date(year, month, 1).getDay()
    const daysInMonth   = new Date(year, month + 1, 0).getDate()
    const result = []
    for (let i = 0; i < firstDayIndex; i++) result.push(null)
    for (let d = 1; d <= daysInMonth; d++) result.push(d)
    return result
  }, [cursor])

  const prevMonth = () => setCursor(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setCursor(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  return (
    <div className="col-xxl-4 col-lg-6">
      <div className="card h-100">
        <div className="card-body p-0">
          <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
            <h6 className="text-lg mb-0">Calendar</h6>
          </div>
          <div className="p-20">
            <div className="calendar style-big">

              {/* Calendar header: prev | month title | next */}
              <div className="calendar__header">
                <button type="button" className="calendar__arrow left" onClick={prevMonth}>
                  <i className="ri-arrow-left-s-line" />
                </button>
                <p className="display text-md text-secondary-light fw-semibold mb-0">{displayTitle}</p>
                <button type="button" className="calendar__arrow right" onClick={nextMonth}>
                  <i className="ri-arrow-right-s-line" />
                </button>
              </div>

              {/* Weekday labels */}
              <div className="calendar__week week">
                {WEEKDAY_LABELS.map(day => (
                  <div key={day} className="calendar__week-text">{day}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="days">
                {cells.map((day, i) => {
                  if (day === null) return <div key={`e-${i}`} />
                  const isToday = isSameDay(
                    new Date(cursor.getFullYear(), cursor.getMonth(), day),
                    today,
                  )
                  return (
                    <div key={day} className={isToday ? 'current-date' : undefined}>
                      {day}
                    </div>
                  )
                })}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Leave status scrollable list */
function LeaveStatusCard() {
  return (
    <div className="col-xxl-4 col-lg-6">
      <div className="card radius-12 border-0 h-100">
        <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between py-12 px-20 border-bottom border-neutral-200">
          <h6 className="mb-2 fw-bold text-lg">Leave Status</h6>
          <select className="form-select bg-base form-select-sm w-auto radius-8">
            <option>Yearly</option>
            <option>Monthly</option>
            <option>Weekly</option>
            <option>Today</option>
          </select>
        </div>
        <div className="card-body pe-0">
          <div className="d-flex flex-column max-h-494-px overflow-y-auto scroll-sm pe-20">
            {LEAVE_STATUS.map((item, i) => (
              <div
                key={i}
                className="d-flex align-items-center justify-content-between gap-3 py-10 border-bottom"
              >
                <div className="flex-grow-1">
                  <h6 className="text-lg mb-0 fw-medium">{item.title}</h6>
                  <span className="text-sm text-secondary-light fw-medium">Date: {item.date}</span>
                </div>
                <div>
                  <span className={`${item.statusClass} px-24 py-4 radius-4 fw-medium text-sm`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Notice board */
function NoticeBoardCard() {
  return (
    <div className="col-xxl-4 col-lg-6">
      <div className="card h-100">
        <div className="card-body p-0">
          <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
            <h6 className="text-lg mb-0">Notice Board</h6>
            <CardDotMenu />
          </div>
          <div className="ps-20 pt-20 pb-20">
            <div className="pe-20 d-flex flex-column gap-28 overflow-y-auto max-h-490-px scroll-sm">
              {NOTICE_BOARD.map((item, i) => (
                <div key={i} className="d-flex align-items-start gap-16">
                  <img
                    src={item.img}
                    alt="Thumbnail"
                    className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                  />
                  <div>
                    <h6 className="mb-4 text-lg">{item.author}</h6>
                    <p className="text-secondary-light text-sm mb-0">{item.text}</p>
                    <span className="text-secondary-light text-sm mb-0 mt-4 d-block">{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Upcoming events */
function UpcomingEventsCard() {
  return (
    <div className="col-xxl-4 col-lg-6">
      <div className="card h-100">
        <div className="card-body p-0">
          <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
            <h6 className="text-lg mb-0">Upcoming Events</h6>
          </div>
          <div className="ps-20 pt-20 pb-20">
            <div className="pe-20 d-flex flex-column gap-28 overflow-y-auto max-h-490-px scroll-sm">
              {UPCOMING_EVENTS.map((ev, i) => (
                <div key={i} className="d-flex align-items-center justify-content-between gap-16">
                  <div className={`ps-10 border-start-width-3-px ${ev.borderClass}`}>
                    <div className="d-flex align-items-end gap-6">
                      <h6 className="text-lg fw-normal mb-0">{ev.time}</h6>
                      <span className="text-xs text-secondary-light line-height-1 mb-2">{ev.period}</span>
                    </div>
                    <p className="text-secondary-light mt-4 mb-2 text-sm">{ev.title}</p>
                    <p className="text-xs text-secondary-light mb-0">
                      Lead by{' '}
                      <a href="#" className="text-primary-600 hover-underline">{ev.lead}</a>
                    </p>
                  </div>
                  <div>
                    <a
                      href="#"
                      className="py-6 px-16 radius-4 bg-neutral-100 text-secondary-light fw-semibold bg-hover-primary-600 hover-text-white"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const StudentDashboard = () => (
  <div className="dashboard-main-body">

    {/* Breadcrumb */}
    <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
      <div>
        <h6 className="fw-semibold mb-0">Dashboard</h6>
        <p className="text-neutral-600 mt-4 mb-0">
          Student → Manage courses, students, and assignments efficiently from a centralized teacher.
        </p>
      </div>
    </div>

    {/* All cards in one responsive row */}
    <div className="mt-24">
      <div className="row gy-4">
        <StudentProfileCard />
        <AttendanceCard />
        <TodaysClassCard />
        <ExamResultsCard />
        <BigCalendarCard />
        <LeaveStatusCard />
        <NoticeBoardCard />
        <UpcomingEventsCard />
      </div>
    </div>

  </div>
)

export default StudentDashboard