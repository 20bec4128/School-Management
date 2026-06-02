import { useEffect, useMemo, useState } from 'react'
import { DonutChart } from '../components/SimpleCharts'
import { useAuth } from '../context/useAuth'
import { fetchAssignmentsForStudent } from '../apis/assignmentsApi'
import { fetchAttendances } from '../apis/attendanceApi'
import { fetchClassRoutines } from '../apis/classRoutinesApi'
import { fetchEvents } from '../apis/eventApi'
import { fetchLeaveApplications } from '../apis/leaveApplicationsApi'
import { fetchNotices } from '../apis/noticeApi'
import { fetchSubmissionsForStudent } from '../apis/submissionsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchSubjects } from '../apis/subjectsApi'

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const normalizeText = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()

const normalizeCollection = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.content)) return value.content
  if (Array.isArray(value?.value)) return value.value
  return []
}

const getBestLabel = (...values) =>
  values
    .map((value) => {
      if (value == null) return ''
      const text = String(value).trim()
      return text === 'null' || text === 'undefined' ? '' : text
    })
    .find(Boolean) || ''

const formatDate = (value, fallback = '--') => {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatTime = (value) => {
  if (!value) return ''
  const text = String(value).trim()
  if (!text) return ''
  const parts = text.split(':')
  if (parts.length < 2) return text
  return `${parts[0]}:${parts[1]}`
}

const formatRoutineRange = (routine) => {
  const start = formatTime(routine?.startTime)
  const end = formatTime(routine?.endTime)
  if (!start && !end) return '--'
  if (!end) return start
  return `${start} - ${end}`
}

const isStudentAudience = (value) => {
  const text = normalizeText(value)
  if (!text) return true
  return text.includes('student') || text.includes('all')
}

const getRoutineStatus = (routine) => {
  const now = new Date()
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  const startParts = String(routine?.startTime || '').split(':')
  const endParts = String(routine?.endTime || '').split(':')
  const startMinutes =
    startParts.length >= 2 ? Number(startParts[0]) * 60 + Number(startParts[1]) : null
  const endMinutes =
    endParts.length >= 2 ? Number(endParts[0]) * 60 + Number(endParts[1]) : null

  if (startMinutes == null || endMinutes == null) return 'Scheduled'
  if (minutesNow < startMinutes) return 'Upcoming'
  if (minutesNow > endMinutes) return 'Completed'
  return 'Live'
}

const routineStatusClass = (status) => {
  const value = normalizeText(status)
  if (value === 'live') return 'bg-primary-100 text-primary-600'
  if (value === 'completed') return 'bg-success-100 text-success-600'
  if (value === 'upcoming') return 'bg-warning-100 text-warning-600'
  return 'bg-neutral-100 text-secondary-light'
}

const assignmentStatusClass = (status) => {
  const value = normalizeText(status)
  if (value === 'submitted' || value === 'graded' || value === 'completed') {
    return 'bg-success-100 text-success-600'
  }
  if (value === 'pending' || value === 'upcoming') {
    return 'bg-warning-100 text-warning-600'
  }
  if (value === 'overdue' || value === 'rejected' || value === 'failed') {
    return 'bg-danger-100 text-danger-600'
  }
  return 'bg-neutral-100 text-secondary-light'
}

const leaveStatusClass = (status) => {
  const value = normalizeText(status)
  if (value === 'approved' || value === 'accepted') {
    return 'bg-success-100 text-success-600'
  }
  if (value === 'pending') return 'bg-warning-100 text-warning-600'
  if (value === 'rejected' || value === 'declined') {
    return 'bg-danger-100 text-danger-600'
  }
  return 'bg-neutral-100 text-secondary-light'
}

const getAttendanceBucket = (value) => {
  const text = normalizeText(value)
  if (!text) return 'Absent'
  if (text.includes('present') || text === 'p') return 'Present'
  if (text.includes('half')) return 'Half Day'
  if (text.includes('late')) return 'Late'
  if (text.includes('absent') || text === 'a') return 'Absent'
  return 'Absent'
}

const bucketColor = {
  Present: '#45B369',
  'Half Day': '#487FFF',
  Late: '#9935FE',
  Absent: '#FF9F29',
}

function CardHeader({ title, action }) {
  return (
    <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between py-12 px-20 border-bottom border-neutral-200">
      <h6 className="mb-2 fw-bold text-lg">{title}</h6>
      {action}
    </div>
  )
}

function SectionCard({ title, action, children, bodyClassName = 'card-body p-0' }) {
  return (
    <div className="card radius-12 border-0 h-100">
      <CardHeader title={title} action={action} />
      <div className={bodyClassName}>{children}</div>
    </div>
  )
}

function StatusPill({ status, className }) {
  return <span className={`${className} px-24 py-4 radius-4 fw-medium text-sm`}>{status}</span>
}

function StudentProfileCard({
  studentName,
  classLabel,
  sectionLabel,
  studentId,
  schoolName,
  eventCount,
  noticeCount,
  attendancePercent,
}) {
  return (
    <div className="col-xxl-4">
      <div className="card radius-12 border-0 h-100">
        <div className="card-body p-24 d-flex gap-16 flex-sm-nowrap flex-wrap">
          <div className="radius-8 overflow-hidden position-relative z-1 py-32 px-20 text-center d-flex justify-content-center align-items-center flex-grow-1">
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
              <h6 className="text-white mb-1">{studentName}</h6>
              <span className="text-white text-lg d-block">
                Class: {classLabel || '--'}
              </span>
              <span className="text-white text-lg d-block">
                Section: {sectionLabel || '--'}
              </span>
              <span className="text-white text-lg d-block">
                Student ID: {studentId || '--'}
              </span>
              <span className="text-white text-sm d-block mt-8">
                {schoolName || 'School'}
              </span>
            </div>
          </div>

          {/* <div className="d-flex flex-column gap-20 flex-grow-1 justify-content-between">
            <div className="radius-8 py-24 px-24 text-start d-flex align-items-center gap-12 bg-purple-100">
              <span className="w-48-px h-48-px d-inline-flex justify-content-center align-items-center rounded-circle border border-purple-300 bg-purple-200">
                <img src="/assets/images/icons/teacher-widget-icon1.png" alt="Events" />
              </span>
              <div>
                <span className="text-secondary-light fw-medium d-block">Events</span>
                <h5 className="text-primary-light">{eventCount}</h5>
              </div>
            </div>

            <div className="radius-8 py-24 px-24 text-start d-flex align-items-center gap-12 bg-success-100">
              <span className="w-48-px h-48-px d-inline-flex justify-content-center align-items-center rounded-circle border border-success-300 bg-success-200">
                <img src="/assets/images/icons/teacher-widget-icon2.png" alt="Notifications" />
              </span>
              <div>
                <span className="text-secondary-light fw-medium d-block">Notifications</span>
                <h5 className="text-primary-light">{noticeCount}</h5>
              </div>
            </div>

            <div className="radius-8 py-24 px-24 text-start d-flex align-items-center gap-12 bg-primary-100">
              <span className="w-48-px h-48-px d-inline-flex justify-content-center align-items-center rounded-circle border border-primary-300 bg-primary-200">
                <img src="/assets/images/icons/teacher-widget-icon3.png" alt="Attendance" />
              </span>
              <div>
                <span className="text-secondary-light fw-medium d-block">Attendance</span>
                <h5 className="text-primary-light">{attendancePercent}%</h5>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  )
}

function AttendanceCard({ attendanceItems, attendancePercent }) {
  return (
    <div className="col-xxl-4 col-lg-6">
      <SectionCard title="Attendance" bodyClassName="card-body py-24">
        <div className="gap-20">
          <div className="text-center">
            <DonutChart
              segments={attendanceItems}
              size={270}
              thickness={42}
              showLegend={false}
              tooltip
              stroke="transparent"
              strokeWidth={0}
              centerValue={`${attendancePercent}%`}
              centerLabel="Attendance"
            />
          </div>
          <div className="d-flex gap-12 justify-content-around mt-24 flex-wrap">
            {attendanceItems.map(({ label, value }) => (
              <div key={label} className="d-flex align-items-start gap-8">
                <span
                  className="w-6-px h-16-px rounded-pill position-relative mt-8"
                  style={{ background: bucketColor[label] || '#94A3B8' }}
                />
                <div>
                  <h6 className="mb-0">{value}</h6>
                  <p className="text-secondary-light text-sm mb-0">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

function TodaysClassCard({ routines, subjectMap }) {
  return (
    <div className="col-xxl-4 col-lg-6">
      <SectionCard title="Today's Class" bodyClassName="card-body pe-0 py-8">
        <div className="d-flex flex-column max-h-390-px overflow-y-auto scroll-sm pe-20">
          {routines.length === 0 ? (
            <div className="py-24 text-secondary-light">No classes scheduled for today.</div>
          ) : (
            routines.map((item, i) => {
              const subjectLabel =
                subjectMap.get(String(item.subjectId)) ||
                getBestLabel(item.subjectName, item.subject, item.title, `Subject ${item.subjectId}`)
              const status = getRoutineStatus(item)
              return (
                <div
                  key={item.id ?? `${item.subjectId}-${item.startTime}-${i}`}
                  className={`d-flex align-items-center justify-content-between gap-3 py-10${i < routines.length - 1 ? ' border-bottom' : ''}`}
                >
                  <div className="flex-grow-1">
                    <h6 className="text-lg mb-4 fw-medium">{subjectLabel}</h6>
                    <div className="d-flex align-items-center gap-8">
                      <span className="d-flex">
                        <i className="ri-graduation-cap-line" />
                      </span>
                      <span className="text-sm text-secondary-light fw-medium">
                        {formatRoutineRange(item)}
                      </span>
                    </div>
                    {item.roomNo ? (
                      <div className="text-xs text-secondary-light mt-4">Room {item.roomNo}</div>
                    ) : null}
                  </div>
                  <div>
                    <StatusPill status={status} className={routineStatusClass(status)} />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </SectionCard>
    </div>
  )
}

function AssignmentsCard({ assignments, subjectMap }) {
  return (
    <div className="col-xxl-8">
      <div className="card radius-12 border-0">
        <CardHeader title="Recent Assignments" />
        <div className="card-body p-0">
          <div className="table-responsive scroll-sm">
            <table className="table bordered-table mb-0">
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Subject</th>
                  <th scope="col">Assigned</th>
                  <th scope="col">Due</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td className="py-16 text-secondary-light" colSpan={5}>
                      No assignments found for your class yet.
                    </td>
                  </tr>
                ) : (
                  assignments.map((row) => {
                    const status = row?.status || 'Pending'
                    const subjectLabel =
                      subjectMap.get(String(row.subjectId)) ||
                      getBestLabel(row.subjectName, row.subject, `Subject ${row.subjectId}`)
                    return (
                      <tr key={row.id}>
                        <td className="py-10-px fw-medium">{getBestLabel(row.title, row.name)}</td>
                        <td className="py-10-px">{subjectLabel}</td>
                        <td className="py-10-px">{formatDate(row.assignmentDate)}</td>
                        <td className="py-10-px">{formatDate(row.submissionDate)}</td>
                        <td className="py-10-px">
                          <StatusPill status={status} className={assignmentStatusClass(status)} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExamResultsCard({ submissions, assignmentsById, subjectMap }) {
  return (
    <div className="col-xxl-8">
      <div className="card radius-12 border-0">
        <CardHeader title="Recent Results" />
        <div className="card-body p-0">
          <div className="table-responsive scroll-sm">
            <table className="table bordered-table mb-0">
              <thead>
                <tr>
                  <th scope="col">Assignment</th>
                  <th scope="col">Subject</th>
                  <th scope="col">Marks</th>
                  <th scope="col">Status</th>
                  <th scope="col">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr>
                    <td className="py-16 text-secondary-light" colSpan={5}>
                      No graded submissions found yet.
                    </td>
                  </tr>
                ) : (
                  submissions.map((row) => {
                    const assignment = assignmentsById.get(String(row.assignmentId)) || null
                    const subjectLabel =
                      subjectMap.get(String(assignment?.subjectId)) ||
                      getBestLabel(
                        assignment?.subjectName,
                        assignment?.subject,
                        row.subjectName,
                        `Subject ${assignment?.subjectId || '--'}`,
                      )
                    const status = getBestLabel(row.evaluate, row.marks != null ? 'Reviewed' : 'Pending')
                    return (
                      <tr key={row.id}>
                        <td className="py-10-px fw-medium">
                          {getBestLabel(assignment?.title, assignment?.name, `Assignment ${row.assignmentId}`)}
                        </td>
                        <td className="py-10-px">{subjectLabel}</td>
                        <td className="py-10-px">{row.marks != null ? row.marks : '--'}</td>
                        <td className="py-10-px">
                          <StatusPill
                            status={status}
                            className={assignmentStatusClass(status)}
                          />
                        </td>
                        <td className="py-10-px">{formatDate(row.submittedAt)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

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
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstDayIndex = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const result = []
    for (let i = 0; i < firstDayIndex; i += 1) result.push(null)
    for (let d = 1; d <= daysInMonth; d += 1) result.push(d)
    return result
  }, [cursor])

  const prevMonth = () => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))

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
                <button type="button" className="calendar__arrow left" onClick={prevMonth}>
                  <i className="ri-arrow-left-s-line" />
                </button>
                <p className="display text-md text-secondary-light fw-semibold mb-0">
                  {displayTitle}
                </p>
                <button type="button" className="calendar__arrow right" onClick={nextMonth}>
                  <i className="ri-arrow-right-s-line" />
                </button>
              </div>

              <div className="calendar__week week">
                {WEEKDAY_LABELS.map((day) => (
                  <div key={day} className="calendar__week-text">
                    {day}
                  </div>
                ))}
              </div>

              <div className="days">
                {cells.map((day, i) => {
                  if (day === null) return <div key={`e-${i}`} />
                  const isToday =
                    day === today.getDate() &&
                    cursor.getMonth() === today.getMonth() &&
                    cursor.getFullYear() === today.getFullYear()
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

function LeaveStatusCard({ leaves }) {
  return (
    <div className="col-xxl-4 col-lg-6">
      <SectionCard
        title="Leave Status"
        bodyClassName="card-body pe-0"
        action={
          <select className="form-select bg-base form-select-sm w-auto radius-8" disabled>
            <option>Recent</option>
          </select>
        }
      >
        <div className="d-flex flex-column max-h-494-px overflow-y-auto scroll-sm pe-20">
          {leaves.length === 0 ? (
            <div className="py-24 text-secondary-light">No leave applications found.</div>
          ) : (
            leaves.map((item) => (
              <div
                key={item.id}
                className="d-flex align-items-center justify-content-between gap-3 py-10 border-bottom"
              >
                <div className="flex-grow-1">
                  <h6 className="text-lg mb-0 fw-medium">
                    {getBestLabel(item.leaveTypeName, item.title, 'Leave Application')}
                  </h6>
                  <span className="text-sm text-secondary-light fw-medium">
                    Date: {formatDate(item.applicationDate)}
                  </span>
                  {item.leaveFrom && item.leaveTo ? (
                    <div className="text-xs text-secondary-light mt-4">
                      {formatDate(item.leaveFrom)} - {formatDate(item.leaveTo)}
                    </div>
                  ) : null}
                </div>
                <div>
                  <StatusPill
                    status={getBestLabel(item.status, 'Pending')}
                    className={leaveStatusClass(item.status)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  )
}

function NoticeBoardCard({ notices }) {
  return (
    <div className="col-xxl-4 col-lg-6">
      <div className="card h-100">
        <div className="card-body p-0">
          <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
            <h6 className="text-lg mb-0">Notice Board</h6>
          </div>
          <div className="ps-20 pt-20 pb-20">
            <div className="pe-20 d-flex flex-column gap-28 overflow-y-auto max-h-490-px scroll-sm">
              {notices.length === 0 ? (
                <div className="text-secondary-light">No notices available right now.</div>
              ) : (
                notices.map((item) => (
                  <div key={item.id} className="d-flex align-items-start gap-16">
                    <img
                      src="/assets/images/thumbs/notice-board-img1.png"
                      alt="Notice"
                      className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                    />
                    <div>
                      <h6 className="mb-4 text-lg">{getBestLabel(item.title, 'Notice')}</h6>
                      <p className="text-secondary-light text-sm mb-0">
                        {getBestLabel(item.notice, '').slice(0, 120) || 'Open the notice to read more.'}
                      </p>
                      <span className="text-secondary-light text-sm mb-0 mt-4 d-block">
                        {formatDate(item.noticeDate)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UpcomingEventsCard({ events }) {
  return (
    <div className="col-xxl-4 col-lg-6">
      <div className="card h-100">
        <div className="card-body p-0">
          <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
            <h6 className="text-lg mb-0">Upcoming Events</h6>
          </div>
          <div className="ps-20 pt-20 pb-20">
            <div className="pe-20 d-flex flex-column gap-28 overflow-y-auto max-h-490-px scroll-sm">
              {events.length === 0 ? (
                <div className="text-secondary-light">No events scheduled yet.</div>
              ) : (
                events.map((ev) => (
                  <div key={ev.id} className="d-flex align-items-center justify-content-between gap-16">
                    <div className="ps-10 border-start-width-3-px border-primary-600">
                      <div className="d-flex align-items-end gap-6">
                        <h6 className="text-lg fw-normal mb-0">
                          {formatDate(ev.fromDate, '--')}
                        </h6>
                        {ev.toDate ? (
                          <span className="text-xs text-secondary-light line-height-1 mb-2">
                            to {formatDate(ev.toDate, '--')}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-secondary-light mt-4 mb-2 text-sm">{getBestLabel(ev.title, 'Event')}</p>
                      <p className="text-xs text-secondary-light mb-0">
                        {getBestLabel(ev.eventPlace, 'School Event')}
                      </p>
                      <p className="text-xs text-secondary-light mb-0 mt-2">
                        For{' '}
                        <span className="text-primary-600 fw-semibold">
                          {getBestLabel(ev.eventFor, 'All')}
                        </span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const StudentDashboard = () => {
  const { user, studentId, studentClassId, studentSectionId, schoolId, schoolName } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [classesLookup, setClassesLookup] = useState([])
  const [sectionsLookup, setSectionsLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])
  const [routines, setRoutines] = useState([])
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [notices, setNotices] = useState([])
  const [events, setEvents] = useState([])
  const [leaves, setLeaves] = useState([])
  const [attendances, setAttendances] = useState([])

  const studentName = getBestLabel(user?.name, user?.fullName, user?.studentName, 'Student')
  const resolvedSchoolId = schoolId != null ? String(schoolId) : ''

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const [classRows, sectionRows, subjectRows] = await Promise.all([
          resolvedSchoolId ? fetchClasses({ schoolId: resolvedSchoolId }).catch(() => []) : Promise.resolve([]),
          resolvedSchoolId ? fetchSections({ schoolId: resolvedSchoolId }).catch(() => []) : Promise.resolve([]),
          resolvedSchoolId ? fetchSubjects({ schoolId: resolvedSchoolId }).catch(() => []) : Promise.resolve([]),
        ])

        const nextClasses = normalizeCollection(classRows)
        const nextSections = normalizeCollection(sectionRows)
        const nextSubjects = normalizeCollection(subjectRows)

        if (cancelled) return
        setClassesLookup(nextClasses)
        setSectionsLookup(nextSections)
        setSubjectsLookup(nextSubjects)

        const classLabel = getBestLabel(
          nextClasses.find((row) => String(row?.id) === String(studentClassId))?.className,
          nextClasses.find((row) => String(row?.id) === String(studentClassId))?.name,
        )
        const sectionLabel = getBestLabel(
          nextSections.find((row) => String(row?.id) === String(studentSectionId))?.sectionName,
          nextSections.find((row) => String(row?.id) === String(studentSectionId))?.name,
        )

        const loadPromises = [
          studentId ? fetchClassRoutines({ schoolId: resolvedSchoolId, studentId }).catch(() => []) : Promise.resolve([]),
          studentId ? fetchAssignmentsForStudent(studentId).catch(() => []) : Promise.resolve([]),
          studentId ? fetchSubmissionsForStudent(studentId).catch(() => []) : Promise.resolve([]),
          resolvedSchoolId ? fetchNotices({ schoolId: resolvedSchoolId }).catch(() => []) : Promise.resolve([]),
          resolvedSchoolId ? fetchEvents({ schoolId: resolvedSchoolId }).catch(() => []) : Promise.resolve([]),
          resolvedSchoolId ? fetchLeaveApplications({ schoolId: resolvedSchoolId }).catch(() => []) : Promise.resolve([]),
          resolvedSchoolId
            ? fetchAttendances({
                schoolId: resolvedSchoolId,
                className: classLabel || undefined,
                sectionName: sectionLabel || undefined,
                search: studentName,
              }).catch(() => [])
            : Promise.resolve([]),
        ]

        const [nextRoutines, nextAssignments, nextSubmissions, nextNotices, nextEvents, nextLeaves, nextAttendances] =
          await Promise.all(loadPromises)

        if (cancelled) return

        setRoutines(normalizeCollection(nextRoutines))
        setAssignments(normalizeCollection(nextAssignments))
        setSubmissions(normalizeCollection(nextSubmissions))
        setNotices(
          normalizeCollection(nextNotices)
            .filter((item) => item?.isViewOnWeb !== false)
            .filter((item) => isStudentAudience(item?.noticeFor))
            .sort((a, b) => String(b?.noticeDate || b?.createdAt || '').localeCompare(String(a?.noticeDate || a?.createdAt || ''))),
        )
        setEvents(
          normalizeCollection(nextEvents)
            .filter((item) => item?.isViewOnWeb !== false)
            .filter((item) => isStudentAudience(item?.eventFor))
            .sort((a, b) => String(b?.fromDate || b?.createdAt || '').localeCompare(String(a?.fromDate || a?.createdAt || ''))),
        )
        setLeaves(
          normalizeCollection(nextLeaves)
            .filter((item) => {
              const applicantIdMatch =
                studentId != null && String(item?.applicantId) === String(studentId)
              const applicantNameMatch =
                normalizeText(item?.applicantName) === normalizeText(studentName)
              return applicantIdMatch || applicantNameMatch
            })
            .sort((a, b) => String(b?.applicationDate || b?.createdAt || '').localeCompare(String(a?.applicationDate || a?.createdAt || ''))),
        )
        setAttendances(normalizeCollection(nextAttendances))
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message || 'Failed to load student dashboard')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [resolvedSchoolId, schoolId, studentClassId, studentId, studentName, studentSectionId])

  const subjectMap = useMemo(
    () =>
      new Map(
        subjectsLookup.map((subject) => [
          String(subject?.id),
          getBestLabel(subject?.name, subject?.subjectName, subject?.label),
        ]),
      ),
    [subjectsLookup],
  )

  const classLabel = useMemo(
    () =>
      getBestLabel(
        classesLookup.find((row) => String(row?.id) === String(studentClassId))?.className,
        classesLookup.find((row) => String(row?.id) === String(studentClassId))?.name,
        `Class ${studentClassId || '--'}`,
      ),
    [classesLookup, studentClassId],
  )

  const sectionLabel = useMemo(
    () =>
      getBestLabel(
        sectionsLookup.find((row) => String(row?.id) === String(studentSectionId))?.sectionName,
        sectionsLookup.find((row) => String(row?.id) === String(studentSectionId))?.name,
        `Section ${studentSectionId || '--'}`,
      ),
    [sectionsLookup, studentSectionId],
  )

  const today = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    [],
  )

  const todaysRoutines = useMemo(() => {
    const rows = routines.filter((routine) =>
      normalizeText(routine?.day).includes(normalizeText(today)),
    )
    return rows.slice().sort((a, b) => String(a?.startTime || '').localeCompare(String(b?.startTime || '')))
  }, [routines, today])

  const attendanceItems = useMemo(() => {
    const counts = attendances.reduce(
      (acc, row) => {
        const bucket = getAttendanceBucket(row?.attendAll)
        acc[bucket] = (acc[bucket] || 0) + 1
        return acc
      },
      { Present: 0, 'Half Day': 0, Late: 0, Absent: 0 },
    )

    return [
      { label: 'Present', value: counts.Present, color: bucketColor.Present },
      { label: 'Half Day', value: counts['Half Day'], color: bucketColor['Half Day'] },
      { label: 'Late', value: counts.Late, color: bucketColor.Late },
      { label: 'Absent', value: counts.Absent, color: bucketColor.Absent },
    ]
  }, [attendances])

  const totalAttendance = attendanceItems.reduce((sum, item) => sum + Number(item.value || 0), 0)
  const attendancePercent = totalAttendance > 0
    ? Math.round((attendanceItems[0].value / totalAttendance) * 100)
    : 0

  const recentAssignments = useMemo(
    () =>
      assignments
        .slice()
        .sort((a, b) => String(b?.assignmentDate || b?.createdAt || '').localeCompare(String(a?.assignmentDate || a?.createdAt || '')))
        .slice(0, 8),
    [assignments],
  )

  const recentResults = useMemo(
    () =>
      submissions
        .slice()
        .sort((a, b) => String(b?.submittedAt || b?.createdAt || '').localeCompare(String(a?.submittedAt || a?.createdAt || '')))
        .slice(0, 8),
    [submissions],
  )

  const assignmentsById = useMemo(
    () => new Map(assignments.map((assignment) => [String(assignment?.id), assignment])),
    [assignments],
  )

  const recentNotices = useMemo(() => notices.slice(0, 5), [notices])
  const recentEvents = useMemo(() => events.slice(0, 5), [events])
  const recentLeaves = useMemo(() => leaves.slice(0, 6), [leaves])

  const noticeCount = recentNotices.length
  const eventCount = recentEvents.length

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">Dashboard</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            Student dashboard powered by live school data for classes, assignments, notices, events, and leave records.
          </p>
        </div>
        <div className="text-end">
          <div className="fw-semibold text-primary-light">{studentName}</div>
          <div className="text-secondary-light text-sm">
            {schoolName || 'School'} {classLabel ? `• ${classLabel}` : ''} {sectionLabel ? `• ${sectionLabel}` : ''}
          </div>
        </div>
      </div>

      {error ? (
        <div className="alert alert-warning border-0 radius-12 mb-24">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="card radius-12 border-0 mb-24">
          <div className="card-body py-24 text-secondary-light">Loading student dashboard...</div>
        </div>
      ) : null}

      <div className="mt-24">
        <div className="row gy-4">
          <StudentProfileCard
            studentName={studentName}
            classLabel={classLabel}
            sectionLabel={sectionLabel}
            studentId={studentId}
            schoolName={schoolName}
            eventCount={eventCount}
            noticeCount={noticeCount}
            attendancePercent={attendancePercent}
          />
          <AttendanceCard attendanceItems={attendanceItems} attendancePercent={attendancePercent} />
          <TodaysClassCard routines={todaysRoutines} subjectMap={subjectMap} />
          <ExamResultsCard
            submissions={recentResults}
            assignmentsById={assignmentsById}
            subjectMap={subjectMap}
          />
          <BigCalendarCard />
          <LeaveStatusCard leaves={recentLeaves} />
          <NoticeBoardCard notices={recentNotices} />
          <UpcomingEventsCard events={recentEvents} />
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard
