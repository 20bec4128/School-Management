import { useEffect, useMemo, useRef, useState } from 'react'

const TEACHER_STATS = [
  { bg: 'bg-purple-100', border: 'border-purple-300', iconBg: 'bg-purple-200', icon: '/assets/images/icons/teacher-widget-icon1.png', label: 'Total Students', value: '3,500' },
  { bg: 'bg-success-100', border: 'border-success-300', iconBg: 'bg-success-200', icon: '/assets/images/icons/teacher-widget-icon2.png', label: 'Total Students', value: '3,500' },
  { bg: 'bg-primary-100', border: 'border-primary-300', iconBg: 'bg-primary-200', icon: '/assets/images/icons/teacher-widget-icon3.png', label: 'Total Students', value: '3,500' },
  { bg: 'bg-danger-100', border: 'border-danger-300', iconBg: 'bg-danger-200', icon: '/assets/images/icons/teacher-widget-icon4.png', label: 'Total Students', value: '3,500' },
]

const ATTENDANCE_ITEMS = [
  { dotClass: 'bg-primary-600', count: '200', label: 'Present' },
  { dotClass: 'bg-warning-600', count: '300', label: 'Half Day' },
  { dotClass: 'bg-success', count: '172', label: 'Late' },
  { dotClass: 'bg-purple', count: '500', label: 'Absent' },
]

const NOTICE_BOARD = [
  { img: '/assets/images/thumbs/notice-board-img1.png', author: 'Admin', date: '25 Jan 2024', text: 'Lorem Ipsum is simply dummy text of the printing and typesetti' },
  { img: '/assets/images/thumbs/notice-board-img2.png', author: 'Kathryn Murphy', date: '25 Jan 2024', text: 'Lorem Ipsum is simply dummy text of the printing and typesett ing industry Lorem Ipsum is simply dummy text of the printing and typesetting industry.' },
  { img: '/assets/images/thumbs/notice-board-img3.png', author: 'Admin', date: '25 Jan 2024', text: 'Lorem Ipsum is simply dummy text of the printing and typesetti' },
  { img: '/assets/images/thumbs/notice-board-img2.png', author: 'John Doe', date: '25 Jan 2024', text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Laborum voluptas corporis qui dolore est odit officia fuga?' },
]

const UPCOMING_EVENTS = [
  { time: '09:00 - 09:45', period: 'AM', title: 'Marketing Strategy Kickoff', lead: 'Robert Fox', borderClass: 'border-purple-600' },
  { time: '11:15 - 12:00', period: 'AM', title: 'Product Design Brainstorm', lead: 'Leslie Alexander', borderClass: 'border-warning-600' },
  { time: '02:00 - 03:00', period: 'PM', title: 'Client Feedback Review', lead: 'Courtney Henry', borderClass: 'border-blue-600' },
  { time: '04:15 - 05:00', period: 'PM', title: 'Sprint Planning & Task Allocation', lead: 'Eleanor Pena', borderClass: 'border-success-600' },
  { time: '01:15 - 02:00', period: 'PM', title: 'Client Feedback Review', lead: 'John', borderClass: 'border-primary-600' },
]

const STUDENT_MARKS = [
  { admissionNo: 'AD45231', img: '/assets/images/thumbs/avatar-img2.png', name: 'Wade Warren', rollNo: '08', className: 'Class 2 (B)', marks: '88%', cgpa: '3.9', status: 'Pass' },
  { admissionNo: 'AD67452', img: '/assets/images/thumbs/avatar-img3.png', name: 'Brooklyn Simmons', rollNo: '15', className: 'Class 3 (A)', marks: '72%', cgpa: '3.1', status: 'Pass' },
  { admissionNo: 'AD98214', img: '/assets/images/thumbs/avatar-img4.png', name: 'Darlene Robertson', rollNo: '20', className: 'Class 4 (C)', marks: '54%', cgpa: '2.4', status: 'Fail' },
  { admissionNo: 'AD76133', img: '/assets/images/thumbs/avatar-img5.png', name: 'Theresa Webb', rollNo: '11', className: 'Class 5 (A)', marks: '41%', cgpa: '1.9', status: 'Fail' },
  { admissionNo: 'AD33578', img: '/assets/images/thumbs/avatar-img6.png', name: 'Arlene McCoy', rollNo: '06', className: 'Class 1 (C)', marks: '91%', cgpa: '4.0', status: 'Pass' },
]

const LEAVE_STATUS = [
  { title: 'Emergency Leave', date: '10/10/24', status: 'Pending' },
  { title: 'Medical Leave', date: '10/10/24', status: 'Accepted' },
  { title: 'Now Well', date: '10/10/24', status: 'Pending' },
  { title: 'Medical Leave', date: '10/10/24', status: 'Accepted' },
  { title: 'Emergency Leave', date: '10/10/24', status: 'Accepted' },
  { title: 'Now Well', date: '10/10/24', status: 'Pending' },
  { title: 'Medical Leave', date: '10/10/24', status: 'Accepted' },
  { title: 'Emergency Leave', date: '10/10/24', status: 'Accepted' },
  { title: 'Emergency Leave', date: '10/10/24', status: 'Pending' },
  { title: 'Medical Leave', date: '10/10/24', status: 'Accepted' },
  { title: 'Now Well', date: '10/10/24', status: 'Pending' },
  { title: 'Medical Leave', date: '10/10/24', status: 'Accepted' },
  { title: 'Emergency Leave', date: '10/10/24', status: 'Accepted' },
  { title: 'Now Well', date: '10/10/24', status: 'Pending' },
]

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function statusClass(status) {
  return status === 'Accepted' || status === 'Pass'
    ? 'bg-success-100 text-success-600'
    : status === 'Fail'
      ? 'bg-danger-100 text-danger-600'
      : 'bg-warning-100 text-warning-600'
}

function CardDotMenu() {
  return (
    <div className="dropdown">
      <button type="button" data-bs-toggle="dropdown" aria-expanded="false" className="border-0 bg-transparent p-0">
        <iconify-icon icon="entypo:dots-three-vertical" className="icon text-secondary-light" />
      </button>
      <ul className="dropdown-menu p-12 border bg-base shadow">
        <li>
          <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
            <iconify-icon icon="hugeicons:view" className="icon text-lg line-height-1" />
            View
          </button>
        </li>
        <li>
          <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
            <iconify-icon icon="lucide:edit" className="icon text-lg line-height-1" />
            Edit
          </button>
        </li>
        <li>
          <button type="button" className="delete-item dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-danger-100 text-hover-danger-600 d-flex align-items-center gap-10">
            <iconify-icon icon="fluent:delete-24-regular" className="icon text-lg line-height-1" />
            Delete
          </button>
        </li>
      </ul>
    </div>
  )
}

function TeacherProfileCard() {
  return (
    <div className="col-xxl-7">
      <div className="card radius-12 border-0 h-100">
        <div className="card-body p-24">
          <div className="row g-3">
            <div className="col-md-5">
              <div className="radius-8 overflow-hidden position-relative z-1 h-100 py-32 px-20 text-center d-flex justify-content-center align-items-center">
                <img src="/assets/images/bg/edit-profile-bg.png" alt="BG" className="position-absolute start-0 top-0 w-100 h-100 object-fit-cover z-n1" />
                <div>
                  <span className="mb-12 d-block">
                    <img src="/assets/images/thumbs/edit-profile-img.png" alt="Teacher" className="rounded-circle object-fit-cover" />
                  </span>
                  <h6 className="text-white">Courtney Henry</h6>
                  <span className="text-white text-lg d-block">Class: 1-A, V-B</span>
                  <span className="text-white text-lg d-block">Physics</span>
                  <div className="mt-12">
                    <a href="edit-teacher.html" className="px-20 py-8 text-white bg-white bg-opacity-10 radius-6 fw-medium text-lg">
                      Edit Profile
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-7">
              <div className="row g-3">
                {TEACHER_STATS.map((item, index) => (
                  <div className="col-sm-6 col-xs-6" key={index}>
                    <div className={`radius-8 py-24 px-16 text-center ${item.bg}`}>
                      <span className={`w-48-px h-48-px d-inline-flex justify-content-center align-items-center rounded-circle border ${item.border} ${item.iconBg}`}>
                        <img src={item.icon} alt="User Icon" />
                      </span>
                      <span className="text-secondary-light fw-medium d-block mt-12">{item.label}</span>
                      <h5 className="text-primary-light">{item.value}</h5>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      },
      stroke: { width: 0 },
      dataLabels: { enabled: false },
      responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } }],
    })

    chart.render()
    return () => chart.destroy()
  }, [])

  return (
    <div className="col-xxl-5">
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
        <div className="card-body py-24 d-flex flex-column justify-content-center">
          <div className="d-flex align-items-center gap-20 flex-sm-nowrap flex-wrap justify-content-around">
            <div className="d-flex flex-column gap-12">
              {ATTENDANCE_ITEMS.map(item => (
                <div className="d-flex align-items-center gap-12" key={item.label}>
                  <div>
                    <span className={`w-20-px h-20-px ${item.dotClass} rounded-circle position-relative`}>
                      <span className="w-10-px h-10-px bg-white rounded-circle position-absolute top-50 start-50 translate-middle" />
                    </span>
                  </div>
                  <div>
                    <h6 className="mb-0">{item.count}</h6>
                    <p className="text-secondary-light text-sm mb-0">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <div ref={chartRef} className="apexcharts-tooltip-z-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
            <div className="pe-20 d-flex flex-column gap-20 max-h-462-px overflow-y-auto scroll-sm">
              {NOTICE_BOARD.map((notice, index) => (
                <div className="d-flex align-items-start gap-16" key={index}>
                  <img src={notice.img} alt="Thumbnail" className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0" />
                  <div>
                    <h6 className="mb-4 text-lg">{notice.author}</h6>
                    <p className="text-secondary-light text-sm mb-0">{notice.text}</p>
                    <span className="text-secondary-light text-sm mb-0 mt-4">{notice.date}</span>
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

function UpcomingEventsCard() {
  return (
    <div className="col-xxl-4 col-lg-6">
      <div className="card h-100">
        <div className="card-body p-0">
          <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
            <h6 className="text-lg mb-0">Upcoming Events</h6>
          </div>
          <div className="ps-20 pt-20 pb-20">
            <div className="pe-20 d-flex flex-column gap-20 overflow-y-auto max-h-460-px scroll-sm">
              {UPCOMING_EVENTS.map((event, index) => (
                <div className="d-flex align-items-center justify-content-between gap-16" key={index}>
                  <div className={`ps-10 border-start-width-3-px ${event.borderClass}`}>
                    <div className="d-flex align-items-end gap-6">
                      <h6 className="text-lg fw-normal mb-0">{event.time}</h6>
                      <span className="text-xs text-secondary-light line-height-1 mb-2">{event.period}</span>
                    </div>
                    <p className="text-secondary-light mt-4 mb-2 text-sm">{event.title}</p>
                    <p className="text-xs text-secondary-light mb-0">
                      Lead by <a href="#" className="text-primary-600 hover-underline">{event.lead}</a>
                    </p>
                  </div>
                  <div>
                    <a href="#" className="py-6 px-16 radius-4 bg-neutral-100 text-secondary-light fw-semibold bg-hover-primary-600 hover-text-white">View</a>
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

function CalendarCard() {
  const today = useMemo(() => new Date(), [])
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const displayTitle = useMemo(() => cursor.toLocaleString('en-US', { month: 'long', year: 'numeric' }), [cursor])

  const cells = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstDayIndex = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const result = []
    for (let i = 0; i < firstDayIndex; i += 1) result.push(null)
    for (let day = 1; day <= daysInMonth; day += 1) result.push(day)
    return result
  }, [cursor])

  return (
    <div className="col-xxl-4 col-lg-6">
      <div className="card h-100">
        <div className="card-body p-0">
          <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
            <h6 className="text-lg mb-0">Calendar</h6>
          </div>
          <div className="p-20">
            <div className="calendar style-big">
              <div className="calendar__header">
                <button type="button" className="calendar__arrow left" onClick={() => setCursor(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
                  <i className="ri-arrow-left-s-line" />
                </button>
                <p className="display text-md text-secondary-light fw-semibold mb-0">{displayTitle}</p>
                <button type="button" className="calendar__arrow right" onClick={() => setCursor(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
                  <i className="ri-arrow-right-s-line" />
                </button>
              </div>

              <div className="calendar__week week">
                {WEEKDAY_LABELS.map(day => <div className="calendar__week-text" key={day}>{day}</div>)}
              </div>

              <div className="days">
                {cells.map((day, index) => {
                  if (day === null) return <div key={`blank-${index}`} />
                  const active = isSameDay(new Date(cursor.getFullYear(), cursor.getMonth(), day), today)
                  return <div key={day} className={active ? 'current-date' : undefined}>{day}</div>
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StudentMarksCard() {
  return (
    <div className="col-xxl-8">
      <div className="card radius-12 border-0">
        <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between py-12 px-20 border-bottom border-neutral-200">
          <h6 className="mb-2 fw-bold text-lg">Student Marks</h6>
          <CardDotMenu />
        </div>
        <div className="card-body p-0">
          <div className="table-responsive scroll-sm">
            <table className="table bordered-table mb-0 data-table" id="dataTable" data-page-length="10">
              <thead>
                <tr>
                  <th scope="col">Admission No</th>
                  <th scope="col">Name</th>
                  <th scope="col">Class</th>
                  <th scope="col">Marks%</th>
                  <th scope="col">CGPA</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {STUDENT_MARKS.map(row => (
                  <tr key={row.admissionNo}>
                    <td className="py-10-px"><span className="text-primary-600">{row.admissionNo}</span></td>
                    <td className="py-10-px">
                      <div className="d-flex align-items-center">
                        <img src={row.img} alt="Student" className="flex-shrink-0 me-12 radius-8" />
                        <div>
                          <h6 className="text-md mb-0 fw-medium">{row.name}</h6>
                          <span>Roll No: <span className="fw-semibold">{row.rollNo}</span></span>
                        </div>
                      </div>
                    </td>
                    <td className="py-10-px">{row.className}</td>
                    <td className="py-10-px">{row.marks}</td>
                    <td className="py-10-px">{row.cgpa}</td>
                    <td className="py-10-px">
                      <span className={`${statusClass(row.status)} px-24 py-4 radius-4 fw-medium text-sm`}>{row.status}</span>
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

function LeaveStatusCard() {
  return (
    <div className="col-xxl-4">
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
            {LEAVE_STATUS.map((leave, index) => (
              <div className="d-flex align-items-center justify-content-between gap-3 py-10 border-bottom" key={`${leave.title}-${index}`}>
                <div className="flex-grow-1">
                  <h6 className="text-lg mb-0 fw-medium">{leave.title}</h6>
                  <span className="text-sm text-secondary-light fw-medium">Date: {leave.date}</span>
                </div>
                <div>
                  <span className={`${statusClass(leave.status)} px-24 py-4 radius-4 fw-medium text-sm`}>{leave.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TeacherDashboard() {
  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">Dashboard</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            Teacher -&gt; Manage courses, students, and assignments efficiently from a centralized teacher.
          </p>
        </div>
      </div>

      <div className="mt-24">
        <div className="row gy-4">
          <TeacherProfileCard />
          <AttendanceCard />
          <NoticeBoardCard />
          <UpcomingEventsCard />
          <CalendarCard />
          <StudentMarksCard />
          <LeaveStatusCard />
        </div>
      </div>
    </div>
  )
}
