import { useEffect, useMemo, useRef, useState } from 'react'
import { DonutChart } from '../components/SimpleCharts'
import { loadApexCharts } from '../utils/loadApexCharts'

const widgetCards = [
  { title: 'Enrolled Courses', value: '500', trend: '43,9%', trendClass: 'text-success-600', trendIcon: 'ri-arrow-left-up-line', iconBg: 'bg-primary-100', icon: '/assets/images/icons/lms-icon-1.png', gradient: '/assets/images/icons/lms-card-gradient-bg1.png', chart: 'area', color: '#487FFF' },
  { title: 'Total Students', value: '3,570', trend: '43,9%', trendClass: 'text-success-600', trendIcon: 'ri-arrow-left-up-line', iconBg: 'bg-purple-100', icon: '/assets/images/icons/lms-icon-2.png', gradient: '/assets/images/icons/lms-card-gradient-bg2.png', chart: 'bar', color: '#9935FE' },
  { title: 'Total Courses', value: '30', trend: '43,9%', trendClass: 'text-success-600', trendIcon: 'ri-arrow-left-up-line', iconBg: 'bg-warning-100', icon: '/assets/images/icons/lms-icon-3.png', gradient: '/assets/images/icons/lms-card-gradient-bg3.png', chart: 'bar', color: '#FF9F29' },
  { title: 'Total Earnings', value: '$50,000', trend: '20,3%', trendClass: 'text-danger-600', trendIcon: 'ri-arrow-left-down-line', iconBg: 'bg-success-100', icon: '/assets/images/icons/lms-icon-4.png', gradient: '/assets/images/icons/lms-card-gradient-bg4.png', chart: 'area', color: '#45B369' },
]

const sessions = [
  { image: '/assets/images/thumbs/session-img1.png', name: 'Cameron Williamson', subject: 'English', date: '15 Jun 2025', time: '12:30 PM' },
  { image: '/assets/images/thumbs/session-img2.png', name: 'Kristin Watson', subject: 'English', date: '15 Jun 2025', time: '12:30 PM' },
  { image: '/assets/images/thumbs/session-img2.png', name: 'Kristin Watson', subject: 'English', date: '15 Jun 2025', time: '12:30 PM' },
  { image: '/assets/images/thumbs/session-img1.png', name: 'Cameron Williamson', subject: 'English', date: '15 Jun 2025', time: '12:30 PM' },
]

const userActivities = [
  { label: 'Organic Search', value: '875', color: 'bg-primary-600' },
  { label: 'Referrals', value: '350', color: 'bg-warning-600' },
  { label: 'Social Media', value: '320', color: 'bg-success' },
  { label: 'Google Search', value: '340', color: 'bg-purple' },
]

const topStudents = [
  { name: 'Brooklyn Simmons', classNameText: 'Class: Six', image: '/assets/images/thumbs/avatar-img1.png', percentage: 20, stroke: 'stroke-blue' },
  { name: 'Floyd Miles', classNameText: 'Class: Seven', image: '/assets/images/thumbs/avatar-img2.png', percentage: 35, stroke: 'stroke-red' },
  { name: 'Courtney Henry', classNameText: 'Class: Eight', image: '/assets/images/thumbs/avatar-img2.png', percentage: 45, stroke: 'stroke-warning' },
  { name: 'Kathryn Murphy', classNameText: 'Class: Nine', image: '/assets/images/thumbs/avatar-img4.png', percentage: 65, stroke: 'stroke-green' },
  { name: 'Annette Black', classNameText: 'Class: Ten', image: '/assets/images/thumbs/avatar-img5.png', percentage: 65, stroke: 'stroke-blue' },
]

const topInstructors = [
  { name: 'Dianne Russell', id: '36254', image: '/assets/images/users/user1.png', rating: '5.0' },
  { name: 'Wade Warren', id: '36255', image: '/assets/images/users/user2.png', rating: '5.0' },
  { name: 'Albert Flores', id: '36256', image: '/assets/images/users/user3.png', rating: '5.0' },
  { name: 'Bessie Cooper', id: '36257', image: '/assets/images/users/user4.png', rating: '5.0' },
  { name: 'Arlene McCoy', id: '36258', image: '/assets/images/users/user5.png', rating: '5.0' },
]

const recentCourses = [
  { invoice: '#829776', student: 'John Doe', course: 'Scorm drawing course', amount: '$29.00', payment: 'PayPal', date: '04 Feb, 2025' },
  { invoice: '#829777', student: 'Emily Carter', course: 'Advanced UI/UX Design', amount: '$49.00', payment: 'Stripe', date: '06 Feb, 2025' },
  { invoice: '#829778', student: 'Michael Smith', course: 'Full-Stack Development', amount: '$79.00', payment: 'MasterCard', date: '08 Feb, 2025' },
  { invoice: '#829779', student: 'Sarah Johnson', course: 'Digital Marketing Pro', amount: '$39.00', payment: 'Visa', date: '10 Feb, 2025' },
  { invoice: '#829780', student: 'David Wilson', course: 'Laravel API Development', amount: '$59.00', payment: 'PayPal', date: '12 Feb, 2025' },
]

const weekLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function useApexChart(optionsFactory, deps = []) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return undefined
    let chart
    let cancelled = false

    const render = async () => {
      const ApexCharts = await loadApexCharts()
      if (cancelled || !ref.current || !ApexCharts) return

      chart = new ApexCharts(ref.current, optionsFactory())
      chart.render()
    }

    void render()
    return () => {
      cancelled = true
      chart?.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}

function MiniChart({ type, color }) {
  const ref = useApexChart(() => {
    if (type === 'bar') {
      return {
        series: [{ data: [30, 45, 32, 55, 38, 52, 42] }],
        chart: { type: 'bar', width: 130, height: 60, sparkline: { enabled: true }, toolbar: { show: false } },
        plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } },
        dataLabels: { enabled: false },
        colors: [color],
        grid: { show: false },
        xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { show: false },
        tooltip: { enabled: false },
      }
    }

    return {
      series: [{ name: 'series1', data: [31, 24, 30, 25, 32, 28, 40, 32, 42, 38, 40, 32, 38, 35, 45] }],
      chart: { type: 'area', width: 150, height: 60, sparkline: { enabled: true }, toolbar: { show: false } },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2, colors: [color], lineCap: 'round' },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] } },
      colors: [color],
      grid: { show: false },
      xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { show: false },
      tooltip: { enabled: false },
    }
  }, [type, color])

  return <div ref={ref} className="remove-tooltip-title rounded-tooltip-value" />
}

function CardDotMenu() {
  return (
    <div className="dropdown">
      <button type="button" data-bs-toggle="dropdown" aria-expanded="false" className="border-0 bg-transparent p-0">
        <iconify-icon icon="entypo:dots-three-vertical" className="icon text-secondary-light" />
      </button>
      <ul className="dropdown-menu p-12 border bg-base shadow">
        <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"><iconify-icon icon="hugeicons:view" className="icon text-lg line-height-1" /> View</button></li>
        <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"><iconify-icon icon="lucide:edit" className="icon text-lg line-height-1" /> Edit</button></li>
        <li><button type="button" className="delete-item dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-danger-100 text-hover-danger-600 d-flex align-items-center gap-10"><iconify-icon icon="fluent:delete-24-regular" className="icon text-lg line-height-1" /> Delete</button></li>
      </ul>
    </div>
  )
}

function WidgetsCard() {
  return (
    <div className="col-xxl-6">
      <div className="bg-base rounded-3 p-20">
        <div className="row g-3">
          {widgetCards.map((card) => (
            <div className="col-sm-6" key={card.title}>
              <div className="border rounded-3">
                <div className="px-16 py-12 d-flex gap-8 align-items-center">
                  <span className={`d-flex align-items-center justify-content-center w-32-px h-32-px rounded-circle ${card.iconBg}`}>
                    <img src={card.icon} alt="Icon" />
                  </span>
                  <span className="text-primary-light fw-medium">{card.title}</span>
                </div>
                <div className="position-relative z-1">
                  <img src={card.gradient} className="position-absolute w-100 h-100 z-n1 object-fit-cover lms-card-gradient-bg" alt="Gradient BG" />
                  <div className="px-16 py-12 d-flex align-items-center justify-content-between gap-12 flex-wrap">
                    <div>
                      <h6 className="mb-6">{card.value}</h6>
                      <span className={`fw-medium ${card.trendClass} text-md d-flex gap-6 align-items-center`}>
                        <i className={`text-lg line-height-1 fw-medium ${card.trendIcon}`} />
                        {card.trend}
                      </span>
                      <span className="text-secondary-light fw-medium mt-6 d-block">From last month</span>
                    </div>
                    <MiniChart type={card.chart} color={card.color} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EarningStatisticCard() {
  const ref = useApexChart(() => ({
    series: [{ name: 'Earnings', data: [6500, 8200, 7600, 9800, 11500, 13200, 14600, 17200, 15800, 19600, 22400, 27200] }],
    chart: { type: 'area', height: 290, toolbar: { show: false }, zoom: { enabled: false } },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    grid: { borderColor: '#e5e7eb' },
    xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
    yaxis: { labels: { formatter: (value) => `$${Math.round(value / 1000)}k` } },
  }), [])

  return (
    <div className="col-xxl-6">
      <div className="card h-100">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center justify-content-between">
            <h6 className="text-lg mb-0">Earning Statistic</h6>
            <select className="form-select bg-base form-select-sm w-auto radius-8"><option>Yearly</option><option>Monthly</option><option>Weekly</option><option>Today</option></select>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2 mt-8">
            <h6 className="mb-0">$27,200</h6>
            <span className="text-sm fw-semibold rounded-pill bg-success-focus text-success-main border br-success px-8 py-4 line-height-1 d-flex align-items-center gap-1">10% <iconify-icon icon="bxs:up-arrow" className="text-xs" /></span>
            <span className="text-xs fw-medium">+ $1500 Per Day</span>
          </div>
          <div ref={ref} className="pt-28 apexcharts-tooltip-style-1" />
        </div>
      </div>
    </div>
  )
}

function CalendarCard() {
  const today = useMemo(() => new Date(), [])
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const title = useMemo(() => cursor.toLocaleString('en-US', { month: 'long', year: 'numeric' }), [cursor])
  const days = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const first = new Date(year, month, 1).getDay()
    const total = new Date(year, month + 1, 0).getDate()
    return [...Array(first).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)]
  }, [cursor])

  const isToday = (day) => day && today.getFullYear() === cursor.getFullYear() && today.getMonth() === cursor.getMonth() && today.getDate() === day

  return (
    <div className="col-xxl-5">
      <div className="card h-100">
        <div className="card-body">
          <div className="p-20">
            <div className="calendar">
              <div className="calendar__header">
                <button type="button" className="calendar__arrow left" onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}><i className="ri-arrow-left-s-line" /></button>
                <p className="display text-md text-secondary-light fw-semibold mb-0">{title}</p>
                <button type="button" className="calendar__arrow right" onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}><i className="ri-arrow-right-s-line" /></button>
              </div>
              <div className="calendar__week week">
                {weekLabels.map((day) => <div key={day} className="calendar__week-text">{day}</div>)}
              </div>
              <div className="days">
                {days.map((day, index) => day ? <div key={day} className={isToday(day) ? 'current-date' : undefined}>{day}</div> : <div key={`blank-${index}`} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UpcomingSessionsCard() {
  return (
    <div className="col-xxl-7">
      <div className="card h-100">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center justify-content-between pb-16">
            <h6 className="text-lg mb-0">Upcoming Sessions</h6>
          </div>
          <div className="row g-3">
            {sessions.map((session, index) => (
              <div className="col-sm-6" key={`${session.name}-${index}`}>
                <div className="border rounded-3 p-12">
                  <div className="d-flex gap-12">
                    <div className="d-flex flex-shrink-0"><img src={session.image} alt="Session" className="w-100 h-100 object-fit-cover rounded-3" /></div>
                    <div className="align-self-center w-100">
                      <h6 className="text-md mb-0">{session.name}</h6>
                      <span className="fw-medium">{session.subject}</span>
                      <div className="mt-8 d-flex align-items-center gap-8 justify-content-between flex-wrap w-100">
                        <div className="d-flex align-items-center gap-8 text-neutral-500 fw-medium"><i className="ri-calendar-2-line" />{session.date}</div>
                        <div className="d-flex align-items-center gap-8 text-neutral-500 fw-medium"><i className="ri-time-line" />{session.time}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-16 d-flex gap-12">
                    <a href="#" className="btn btn-primary-600 d-flex align-items-center gap-6 px-16 flex-grow-1 justify-content-center">Join Class</a>
                    <a href="#" className="btn btn-primary-100 d-flex align-items-center justify-content-center gap-6 p-0 w-44-px h-44-px text-primary-600 text-xl"><i className="ri-chat-1-line" /></a>
                    <a href="#" className="btn btn-warning-100 d-flex align-items-center gap-6 px-16 text-warning-600 flex-grow-1 justify-content-center"><i className="ri-time-line" />Join Class</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function UserActivityCard() {
  return (
    <div className="col-xl-6 col-xxl-4 col-lg-6">
      <div className="card radius-12 border-0 h-100">
        <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between py-12 px-20 border-bottom border-neutral-200">
          <h6 className="mb-2 fw-bold text-lg">User activity</h6>
          <select className="form-select bg-base form-select-sm w-auto radius-8"><option>Yearly</option><option>Monthly</option><option>Weekly</option><option>Today</option></select>
        </div>
        <div className="card-body py-24 d-flex flex-column justify-content-center">
          <div className="d-flex align-items-center gap-20 flex-sm-nowrap flex-wrap">
            <div className="d-flex flex-column gap-12">
              {userActivities.map((item) => (
                <div className="d-flex align-items-start gap-12" key={item.label}>
                  <div><span className={`w-16-px h-16-px ${item.color} radius-4 position-relative mt-6`} /></div>
                  <div><p className="text-secondary-light text-md mb-0">{item.label}</p><h6 className="mb-0 text-lg">{item.value}</h6></div>
                </div>
              ))}
            </div>
            <div>
              <DonutChart
                segments={[
                  { label: 'Organic Search', value: 875, color: '#487FFF' },
                  { label: 'Referrals', value: 350, color: '#FF9F29' },
                  { label: 'Social Media', value: 320, color: '#45B369' },
                  { label: 'Google Search', value: 340, color: '#9935FE' },
                ]}
                size={260}
                thickness={40}
                showLegend={false}
                tooltip
                stroke="transparent"
                strokeWidth={0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RadialProgress({ percentage, stroke }) {
  return (
    <svg className="radial-progress w-44-px" data-percentage={percentage} viewBox="0 0 80 80">
      <circle className={`incomplete stroke-8-px opacity-02 ${stroke}`} cx="40" cy="40" r="35" />
      <circle className={`complete stroke-8-px ${stroke}`} cx="40" cy="40" r="35" />
      <text className="percentage fill-black" x="50%" y="57%" transform="matrix(0, 1, -1, 0, 80, 0)">{percentage}</text>
    </svg>
  )
}

function TopStudentCard() {
  return (
    <div className="col-xxl-4 col-lg-6">
      <div className="card radius-12 border-0 h-100">
        <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between py-12 px-20 border-bottom border-neutral-200"><h6 className="mb-2 fw-bold text-lg">Top Student</h6><CardDotMenu /></div>
        <div className="card-body">
          <div className="d-flex flex-column gap-20">
            {topStudents.map((student) => (
              <div className="d-flex align-items-center justify-content-between gap-10" key={student.name}>
                <div className="d-flex align-items-center gap-12">
                  <span className="w-44-px h-44-px rounded-circle d-flex justify-content-center align-items-center"><img src={student.image} className="w-44-px h-44-px object-fit-cover rounded-circle" alt={student.name} /></span>
                  <div><h6 className="text-sm mb-2">{student.name}</h6><span className="text-xs text-secondary-light">{student.classNameText}</span></div>
                </div>
                <div className="d-flex align-items-center gap-8"><span className="text-sm text-secondary-light">Marks</span><span className="text-primary-light text-sm d-block text-end"><RadialProgress percentage={student.percentage} stroke={student.stroke} /></span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TopInstructorCard() {
  return (
    <div className="col-xxl-4">
      <div className="card radius-12 border-0">
        <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between py-12 px-20 border-bottom border-neutral-200"><h6 className="mb-2 fw-bold text-lg">Top Instructor</h6><CardDotMenu /></div>
        <div className="card-body d-flex flex-column gap-20">
          {topInstructors.map((instructor) => (
            <div className="d-flex align-items-center justify-content-between gap-3" key={instructor.name}>
              <div className="d-flex align-items-center">
                <img src={instructor.image} alt={instructor.name} className="w-40-px h-40-px radius-4 flex-shrink-0 me-12 overflow-hidden" />
                <div className="flex-grow-1"><h6 className="text-md mb-0 fw-medium">{instructor.name}</h6><span className="text-sm text-secondary-light fw-medium">Agent ID: {instructor.id}</span></div>
              </div>
              <div>
                <div className="d-flex align-items-center gap-6 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => <span key={i} className="text-lg text-warning-600 d-flex line-height-1"><i className="ri-star-fill" /></span>)}
                </div>
                <span className="text-sm text-secondary-light fw-medium d-block text-end">{instructor.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RecentCoursesCard() {
  return (
    <div className="col-xxl-8">
      <div className="card radius-12 border-0">
        <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between py-12 px-20 border-bottom border-neutral-200"><h6 className="mb-2 fw-bold text-lg">Recent Enrolled Courses</h6><CardDotMenu /></div>
        <div className="card-body p-0">
          <div className="table-responsive scroll-sm">
            <table className="table bordered-table mb-0 rounded-0 border-0">
              <thead><tr>{['Invoice', 'Student', 'Courses Name', 'Amount', 'Payment By', 'Date'].map((head) => <th key={head} scope="col" className="bg-neutral-100 rounded-0">{head}</th>)}</tr></thead>
              <tbody>
                {recentCourses.map((course) => (
                  <tr key={course.invoice}><td>{course.invoice}</td><td>{course.student}</td><td>{course.course}</td><td>{course.amount}</td><td>{course.payment}</td><td>{course.date}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function CourseActivityCard() {
  const chartRef = useApexChart(() => ({
    series: [{ name: 'Paid Course', data: [35, 45, 38, 55, 44, 60, 50, 70, 64] }, { name: 'Free Course', data: [20, 28, 32, 35, 30, 42, 38, 46, 44] }],
    chart: { type: 'bar', height: 260, toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '40%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'] },
    legend: { show: false },
  }), [])

  return (
    <div className="col-xxl-4">
      <div className="card h-100">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center justify-content-between"><h6 className="text-lg mb-0">Course Activity</h6><select className="form-select bg-base form-select-sm w-auto radius-8"><option>Yearly</option><option>Monthly</option><option>Weekly</option><option>Today</option></select></div>
          <ul className="d-flex flex-wrap align-items-center justify-content-center my-32 gap-3">
            <li className="d-flex align-items-center gap-2"><span className="w-12-px h-12-px rounded-circle bg-primary-600" /><span className="text-secondary-light text-sm">Paid Course:<span className="text-primary-light text-md fw-bold line-height-1 ms-4">500</span></span></li>
            <li className="d-flex align-items-center gap-2"><span className="w-12-px h-12-px rounded-circle bg-warning-600" /><span className="text-secondary-light text-sm">Free Course:<span className="text-primary-light text-xl fw-bold line-height-1 ms-4">200</span></span></li>
          </ul>
          <div className="margin-16-minus"><div ref={chartRef} className="apexcharts-tooltip-style-1" /></div>
        </div>
      </div>
    </div>
  )
}

export default function LmsDashboard() {
  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">Dashboard</h6>
          <p className="text-neutral-600 mt-4 mb-0">LMS -&gt; Manage courses, students, assignments and performance metrics in one centralized LMS Dashboard.</p>
        </div>
      </div>

      <div className="mt-24">
        <div className="row gy-4">
          <WidgetsCard />
          <EarningStatisticCard />
          <CalendarCard />
          <UpcomingSessionsCard />
          <UserActivityCard />
          <TopStudentCard />
          <TopInstructorCard />
          <RecentCoursesCard />
          <CourseActivityCard />
        </div>
      </div>
    </div>
  )
}
