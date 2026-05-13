import { useEffect, useRef } from 'react'

const SUMMARY_CARDS = [
  { title: 'Due Fees', amount: '$500', growth: '10%', note: '+5 This Month', iconBg: 'bg-warning-600', gradient: 'gradient-bg-end-12' },
  { title: 'Due Fees', amount: '$500', growth: '10%', note: '+5 This Month', iconBg: 'bg-blue-600', gradient: 'gradient-bg-end-13' },
  { title: 'Due Fees', amount: '$500', growth: '10%', note: '+5 This Month', iconBg: 'bg-purple-600', gradient: 'gradient-bg-end-14' },
  { title: 'Due Fees', amount: '$500', growth: '10%', note: '+5 This Month', iconBg: 'bg-primary-600', gradient: 'gradient-bg-end-15' },
]

const LEAVE_STATUS = [
  { title: 'Emergency Leave', date: '10/10/24', status: 'Pending', statusClass: 'bg-warning-100 text-warning-600' },
  { title: 'Medical Leave', date: '10/10/24', status: 'Accepted', statusClass: 'bg-success-100 text-success-600' },
  { title: 'Now Well', date: '10/10/24', status: 'Pending', statusClass: 'bg-warning-100 text-warning-600' },
  { title: 'Medical Leave', date: '10/10/24', status: 'Accepted', statusClass: 'bg-success-100 text-success-600' },
  { title: 'Now Well', date: '10/10/24', status: 'Pending', statusClass: 'bg-warning-100 text-warning-600' },
  { title: 'Emergency Leave', date: '10/10/24', status: 'Pending', statusClass: 'bg-warning-100 text-warning-600' },
  { title: 'Medical Leave', date: '10/10/24', status: 'Accepted', statusClass: 'bg-success-100 text-success-600' },
  { title: 'Now Well', date: '10/10/24', status: 'Pending', statusClass: 'bg-warning-100 text-warning-600' },
]

const NOTICES = [
  { image: '/assets/images/thumbs/notice-board-img1.png', author: 'Admin', date: '25 Jan 2024', text: 'Lorem Ipsum is simply dummy text of the printing and typesetti' },
  { image: '/assets/images/thumbs/notice-board-img2.png', author: 'Kathryn Murphy', date: '25 Jan 2024', text: 'Lorem Ipsum is simply dummy text of the printing and typesett ing industry Lorem Ipsum is simply dummy text of the printing and typesetting industry.' },
  { image: '/assets/images/thumbs/notice-board-img3.png', author: 'Admin', date: '25 Jan 2024', text: 'Lorem Ipsum is simply dummy text of the printing and typesetti' },
  { image: '/assets/images/thumbs/notice-board-img1.png', author: 'Admin', date: '25 Jan 2024', text: 'Lorem Ipsum is simply dummy text of the printing and typesetti' },
  { image: '/assets/images/thumbs/notice-board-img2.png', author: 'Kathryn Murphy', date: '25 Jan 2024', text: 'Lorem Ipsum is simply dummy text of the printing and typesett ing industry Lorem Ipsum is simply dummy text of the printing and typesetting industry.' },
]

const EXAM_RESULTS = [
  { id: 'AD52365', exam: 'Class Test', subject: 'English', grade: 'A', marks: '95%', cgpa: '4.2', status: 'Pass', statusClass: 'bg-success-100 text-success-600' },
  { id: 'AD52365', exam: 'First Semester', subject: 'Chemistry', grade: 'A', marks: '80%', cgpa: '3.2', status: 'Pass', statusClass: 'bg-success-100 text-success-600' },
  { id: 'AD52365', exam: 'Class Test', subject: 'Accounting', grade: 'C', marks: '60%', cgpa: '3.9', status: 'Pass', statusClass: 'bg-success-100 text-success-600' },
  { id: 'AD52365', exam: 'First Semester', subject: 'Chemistry', grade: 'A', marks: '80%', cgpa: '3.2', status: 'Pass', statusClass: 'bg-success-100 text-success-600' },
  { id: 'AD52365', exam: 'Class Test', subject: 'English', grade: 'F', marks: '30%', cgpa: '2.5', status: 'Fail', statusClass: 'bg-danger-100 text-danger-600' },
]

const KIDS = [
  {
    name: 'Seth Hallam', admissionNo: 'AD1256589', rollNumber: '10', image: '/assets/images/thumbs/student-details-img.png',
    details: [
      ['Class', 'Class 6 (2025-26)'], ['Section', 'A'], ['Gender', 'Male'], ['Date Of Birth', '10 Nov 2006'], ['Academic Year', 'Jun 2025/2026'],
    ],
  },
  {
    name: 'Seth Hallam', admissionNo: 'AD1256589', rollNumber: '10', image: '/assets/images/thumbs/student-details-img.png',
    details: [
      ['Class', 'Class 6 (2025-26)'], ['Section', 'A'], ['Gender', 'Male'], ['Date Of Birth', '10 Nov 2006'], ['Academic Year', 'Jun 2025/2026'],
    ],
  },
]

const UPCOMING_EVENTS = [
  { time: '09:00 - 09:45', period: 'AM', title: 'Marketing Strategy Kickoff', lead: 'Robert Fox', borderClass: 'border-purple-600' },
  { time: '11:15 - 12:00', period: 'AM', title: 'Product Design Brainstorm', lead: 'Leslie Alexander', borderClass: 'border-warning-600' },
  { time: '02:00 - 03:00', period: 'PM', title: 'Client Feedback Review', lead: 'Courtney Henry', borderClass: 'border-blue-600' },
  { time: '04:15 - 05:00', period: 'PM', title: 'Sprint Planning & Task Allocation', lead: 'Eleanor Pena', borderClass: 'border-success-600' },
  { time: '01:15 - 02:00', period: 'PM', title: 'Client Feedback Review', lead: 'John', borderClass: 'border-primary-600' },
]

function CardDotMenu() {
  return (
    <div className="dropdown">
      <button type="button" data-bs-toggle="dropdown" aria-expanded="false" className="border-0 bg-transparent p-0">
        <iconify-icon icon="entypo:dots-three-vertical" class="icon text-secondary-light" />
      </button>
      <ul className="dropdown-menu p-12 border bg-base shadow">
        <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"><iconify-icon icon="hugeicons:view" class="icon text-lg line-height-1" /> View</button></li>
        <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"><iconify-icon icon="lucide:edit" class="icon text-lg line-height-1" /> Edit</button></li>
        <li><button type="button" className="delete-item dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-danger-100 text-hover-danger-600 d-flex align-items-center gap-10"><iconify-icon icon="fluent:delete-24-regular" class="icon text-lg line-height-1" /> Delete</button></li>
      </ul>
    </div>
  )
}

function SummaryCards() {
  return (
    <div className="row gy-4">
      {SUMMARY_CARDS.map((card, index) => (
        <div className="col-xxl-3 col-sm-6" key={`${card.gradient}-${index}`}>
          <div className={`card p-3 shadow-2 radius-8 h-100 border-0 ${card.gradient}`}>
            <div className="card-body p-0">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-1">
                <div className="d-flex align-items-center gap-3">
                  <span className={`mb-0 w-48-px h-48-px ${card.iconBg} flex-shrink-0 text-white d-flex justify-content-center align-items-center rounded-circle h6 mb-0`}>
                    <img src="/assets/images/icons/parent-widget-icon1.png" alt="Wallet Icon" />
                  </span>
                  <div><span className="fw-medium text-primary-light text-md">{card.title}</span></div>
                </div>
              </div>
              <div className="mt-16">
                <h6 className="fw-semibold mb-0">{card.amount}</h6>
                <p className="text-sm mb-0 mt-1"><span className="fw-semibold text-success-main text-sm">{card.growth}<span className="text-lg d-inline-flex line-height-1"><i className="ri-arrow-up-s-fill" /></span></span>{card.note}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatisticCard() {
  const chartRef = useRef(null)

  useEffect(() => {
    const ApexCharts = window.ApexCharts || globalThis.ApexCharts
    if (!chartRef.current || !ApexCharts) return undefined

    const chart = new ApexCharts(chartRef.current, {
      series: [
        { name: 'Free Course', data: [48, 35, 55, 32, 48, 30, 55, 50, 57] },
        { name: 'Paid Course', data: [12, 20, 15, 26, 22, 60, 40, 48, 25] },
      ],
      legend: { show: false },
      chart: { type: 'area', width: '100%', height: 210, toolbar: { show: false }, padding: { left: 0, right: 0, top: 0, bottom: 0 } },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3, colors: ['#487FFF', '#FF9F29'], lineCap: 'round' },
      grid: { show: true, borderColor: '#D1D5DB', strokeDashArray: 1, position: 'back', xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } }, padding: { top: -20, right: 0, bottom: -10, left: 0 } },
      colors: ['#487FFF', '#FF9F29'],
      markers: { colors: ['#487FFF', '#FF9F29'], strokeWidth: 3, size: 0, hover: { size: 10 } },
      xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], tooltip: { enabled: false }, labels: { formatter: value => value, style: { fontSize: '14px' } } },
      yaxis: { labels: { style: { fontSize: '14px' } } },
      tooltip: { x: { format: 'dd/MM/yy HH:mm' } },
    })

    chart.render()
    return () => chart.destroy()
  }, [])

  return (
    <div className="col-12">
      <div className="card radius-12 border-0 h-100">
        <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between py-12 px-20 border-bottom border-neutral-200">
          <h6 className="mb-2 fw-bold text-lg">Statistic</h6>
          <select className="form-select bg-base form-select-sm w-auto radius-8"><option>Yearly</option><option>Monthly</option><option>Weekly</option><option>Today</option></select>
        </div>
        <div className="card-body py-20 d-flex flex-column justify-content-center">
          <ul className="d-flex flex-wrap align-items-center justify-content-center mb-20 gap-3">
            <li className="d-flex align-items-center gap-2"><span className="w-12-px h-12-px rounded-circle bg-warning-600" /><span className="text-secondary-light text-sm">Avg. Attendance:<span className="text-primary-light text-xl fw-bold line-height-1 ms-4">200</span></span></li>
            <li className="d-flex align-items-center gap-2"><span className="w-12-px h-12-px rounded-circle bg-primary-600" /><span className="text-secondary-light text-sm">Avg. Exam Score:<span className="text-primary-light text-md fw-bold line-height-1 ms-4">500</span></span></li>
          </ul>
          <div ref={chartRef} className="apexcharts-tooltip-style-1" />
        </div>
      </div>
    </div>
  )
}

function LeaveStatusCard() {
  return (
    <div className="col-md-6">
      <div className="card radius-12 border-0 h-100">
        <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between py-12 px-20 border-bottom border-neutral-200">
          <h6 className="mb-2 fw-bold text-lg">Today's Class</h6>
          <select className="form-select bg-base form-select-sm w-auto radius-8"><option>Yearly</option><option>Monthly</option><option>Weekly</option><option>Today</option></select>
        </div>
        <div className="card-body pe-0 py-8">
          <div className="d-flex flex-column max-h-390-px overflow-y-auto scroll-sm pe-20">
            {LEAVE_STATUS.map((item, index) => (
              <div className="d-flex align-items-center justify-content-between gap-3 py-10 border-bottom" key={`${item.title}-${index}`}>
                <div className="flex-grow-1">
                  <h6 className="text-lg mb-4 fw-medium">{item.title}</h6>
                  <div className="d-flex align-items-center gap-8"><span className="d-flex"><i className="ri-graduation-cap-line" /></span><span className="text-sm text-secondary-light fw-medium">Date: {item.date}</span></div>
                </div>
                <div><span className={`${item.statusClass} px-24 py-4 radius-4 fw-medium text-sm`}>{item.status}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function NoticeBoardCard() {
  return (
    <div className="col-md-6">
      <div className="card h-100">
        <div className="card-body p-0">
          <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200"><h6 className="text-lg mb-0">Notice Board</h6><CardDotMenu /></div>
          <div className="ps-20 pt-20 pb-20">
            <div className="pe-20 d-flex flex-column gap-28 overflow-y-auto max-h-390-px scroll-sm">
              {NOTICES.map((notice, index) => (
                <div className="d-flex align-items-start gap-16" key={`${notice.author}-${index}`}>
                  <img src={notice.image} alt="Thumbnail" className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0" />
                  <div><h6 className="mb-4 text-lg">{notice.author}</h6><p className="text-secondary-light text-sm mb-0">{notice.text}</p><span className="text-secondary-light text-sm mb-0 mt-4">{notice.date}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExamResultsCard() {
  return (
    <div className="col-12">
      <div className="card radius-12 border-0">
        <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between py-12 px-20 border-bottom border-neutral-200"><h6 className="mb-2 fw-bold text-lg">Exam Results</h6><CardDotMenu /></div>
        <div className="card-body p-0">
          <div className="table-responsive scroll-sm">
            <table className="table bordered-table mb-0 data-table">
              <thead><tr><th scope="col">ID</th><th scope="col">Exam Name</th><th scope="col">Subject</th><th scope="col">Grade</th><th scope="col">Marks%</th><th scope="col">CGPA</th><th scope="col">Status</th></tr></thead>
              <tbody>
                {EXAM_RESULTS.map((row, index) => (
                  <tr key={`${row.subject}-${row.grade}-${index}`}>
                    <td className="py-10-px"><span className="text-primary-600">{row.id}</span></td><td className="py-10-px">{row.exam}</td><td className="py-10-px">{row.subject}</td><td className="py-10-px">{row.grade}</td><td className="py-10-px">{row.marks}</td><td className="py-10-px">{row.cgpa}</td><td className="py-10-px"><span className={`${row.statusClass} px-24 py-4 radius-4 fw-medium text-sm`}>{row.status}</span></td>
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

function MyKidsCard() {
  return (
    <div className="card h-100">
      <div className="card-body p-0">
        <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200"><h6 className="text-lg mb-0">My Kids</h6></div>
        <div className="ps-20 pt-20 pb-20">
          <div className="pe-20 d-flex flex-column gap-16">
            {KIDS.map((kid, index) => (
              <div className="p-20 bg-neutral-40 rounded" key={`${kid.name}-${index}`}>
                <div className="d-flex align-items-center gap-16">
                  <figure className="w-120-px h-120-px rounded-circle overflow-hidden mb-0 border border-width-4-px border-white"><img src={kid.image} alt="Student" className="w-100 h-100 object-fit-cover" /></figure>
                  <div><h2 className="h6 text-primary-light mb-16 fw-semibold">{kid.name}</h2><p className="mb-0">Admission No: <span className="text-primary-600 fw-semibold">{kid.admissionNo}</span></p><p className="mb-0">Roll Number: <span className="text-primary-light fw-semibold">{kid.rollNumber}</span></p></div>
                </div>
                <div className="d-flex flex-column gap-8 border-top border-neutral-300 mt-16 pt-16">
                  {kid.details.map(([label, value]) => (<div className="d-flex gap-4" key={label}><span className="fw-semibold text-sm text-primary-light w-110-px">{label}</span><span className="fw-normal text-sm text-secondary-light">: {value}</span></div>))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function UpcomingEventsCard() {
  return (
    <div className="card h-100">
      <div className="card-body p-0">
        <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200"><h6 className="text-lg mb-0">Upcoming Events</h6></div>
        <div className="ps-20 pt-20 pb-20">
          <div className="pe-20 d-flex flex-column gap-28 overflow-y-auto max-h-490-px scroll-sm">
            {UPCOMING_EVENTS.map((event, index) => (
              <div className="d-flex align-items-center justify-content-between gap-16" key={`${event.time}-${index}`}>
                <div className={`ps-10 border-start-width-3-px ${event.borderClass}`}>
                  <div className="d-flex align-items-end gap-6"><h6 className="text-lg fw-normal mb-0">{event.time}</h6><span className="text-xs text-secondary-light line-height-1 mb-2">{event.period}</span></div>
                  <p className="text-secondary-light mt-4 mb-2 text-sm">{event.title}</p>
                  <p className="text-xs text-secondary-light mb-0">Lead by <a href="#" className="text-primary-600 hover-underline">{event.lead}</a></p>
                </div>
                <div><a href="#" className="py-6 px-16 radius-4 bg-neutral-100 text-secondary-light fw-semibold bg-hover-primary-600 hover-text-white">View</a></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ParentDashboard() {
  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div><h6 className="fw-semibold mb-0">Dashboard</h6><p className="text-neutral-600 mt-4 mb-0">Parent → Track student progress, attendance, and academic performance in one place.</p></div>
      </div>

      <div className="mt-24">
        <SummaryCards />
        <div className="mt-16">
          <div className="row gy-4">
            <div className="col-xxl-8">
              <div className="row gy-4">
                <StatisticCard />
                <LeaveStatusCard />
                <NoticeBoardCard />
                <ExamResultsCard />
              </div>
            </div>
            <div className="col-xxl-4">
              <div className="d-flex flex-column gap-24">
                <MyKidsCard />
                <UpcomingEventsCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
