import { BarChart, DonutChart, StepAreaChart } from '../components/SimpleCharts'
import { useEffect, useMemo, useState } from 'react'
import MiniCalendar from '../components/MiniCalendar'
import ProgressRing from '../components/ProgressRing'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { fetchStudentsPage } from '../apis/studentsApi'
import { fetchTeachers } from '../apis/teachersApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchFeeCollections } from '../apis/feeCollectionApi'
import { fetchBooksPage } from '../apis/booksApi'
import { fetchEvents } from '../apis/eventApi'
import { fetchLeaveApplications } from '../apis/leaveApplicationsApi'
import { fetchEmployees } from '../apis/employeesApi'
import { fetchIncomes } from '../apis/incomesApi'
import { fetchExpenditures } from '../apis/expendituresApi'
import '../assets/css/addModalShared.css'

function AdmissionsDonutChart() {
  const legendItems = [
    { label: 'English', value: 15, color: '#00B341', dotClass: 'bg-success-600' },
    { label: 'Math', value: 15, color: '#0A51CE', dotClass: 'bg-blue-600' },
    { label: 'Biology', value: 5, color: '#FF7A2C', dotClass: 'bg-warning-600' },
    { label: 'Physics', value: 10, color: '#25A194', dotClass: 'bg-primary-600' },
  ]

  return (
    <div>
      <DonutChart
        segments={legendItems}
        size={270}
        thickness={42}
        showLegend={false}
        tooltip
        stroke="transparent"
        strokeWidth={0}
      />
      <div className="d-flex flex-wrap gap-16 justify-content-center mt-20">
        {legendItems.map((item) => (
          <div key={item.label} className="d-flex align-items-center gap-8">
            <span className={`w-8-px h-8-px rounded-circle ${item.dotClass}`} />
            <div>
              <h6 className="mb-0 text-sm">{item.value}</h6>
              <p className="text-secondary-light text-xs mb-0">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const STUDENT_PAGE_SIZE = 200

const getStudentDate = (student) => {
  const rawValue = student?.admissionDate || student?.createdAt
  if (!rawValue) return null
  const date = new Date(rawValue)
  return Number.isNaN(date.getTime()) ? null : date
}

const getTeacherDate = (teacher) => {
  const rawValue = teacher?.joiningDate
  if (!rawValue) return null
  const date = new Date(rawValue)
  return Number.isNaN(date.getTime()) ? null : date
}

const getFeeDate = (fee) => {
  const rawValue = fee?.createdAt
  if (!rawValue) return null
  const date = new Date(rawValue)
  return Number.isNaN(date.getTime()) ? null : date
}

const getBookDate = (book) => {
  const rawValue = book?.createdAt
  if (!rawValue) return null
  const date = new Date(rawValue)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDateRange = (fromDate, toDate) => {
  if (!fromDate && !toDate) return 'No date set'
  const options = { month: 'short', day: 'numeric', year: 'numeric' }
  const fromStr = fromDate ? new Date(fromDate).toLocaleDateString(undefined, options) : ''
  const toStr = toDate ? new Date(toDate).toLocaleDateString(undefined, options) : ''
  if (fromStr && toStr && fromStr !== toStr) {
    return `${fromStr} - ${toStr}`
  }
  return fromStr || toStr
}

const calculateDays = (fromStr, toStr) => {
  if (!fromStr || !toStr) return 0
  const from = new Date(fromStr)
  const to = new Date(toStr)
  const diffTime = Math.abs(to - from)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return Number.isNaN(diffDays) ? 0 : diffDays
}

const statusBadgeClass = (status) => {
  const normalized = String(status || '').trim().toUpperCase()
  if (normalized === 'APPROVED') return 'bg-success-100 text-success-600 px-8 py-2 radius-4 fw-medium text-xs'
  if (normalized === 'DECLINED' || normalized === 'REJECTED') {
    return 'bg-danger-100 text-danger-600 px-8 py-2 radius-4 fw-medium text-xs'
  }
  if (normalized === 'PENDING') return 'bg-warning-100 text-warning-600 px-8 py-2 radius-4 fw-medium text-xs'
  return 'bg-neutral-100 text-secondary-light px-8 py-2 radius-4 fw-medium text-xs'
}

const statusLabel = (status) => {
  const normalized = String(status || '').trim().toUpperCase()
  if (normalized === 'DECLINED') return 'Declined'
  if (normalized === 'REJECTED') return 'Rejected'
  if (normalized === 'APPROVED') return 'Approved'
  if (normalized === 'PENDING') return 'Pending'
  return status || '-'
}

const formatApplicationDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

const LEAVE_THUMBS = [
  '/assets/images/thumbs/leave-request-img1.png',
  '/assets/images/thumbs/leave-request-img2.png',
  '/assets/images/thumbs/leave-request-img3.png',
  '/assets/images/thumbs/leave-request-img4.png',
  '/assets/images/thumbs/leave-request-img5.png',
]

const getLeaveThumb = (index) => {
  return LEAVE_THUMBS[index % LEAVE_THUMBS.length]
}

const getMonthKey = (date) => date.getFullYear() * 12 + date.getMonth()

const getRollingMonths = (count = 9) => {
  const months = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: d.getFullYear() * 12 + d.getMonth(),
      label: d.toLocaleDateString(undefined, { month: 'short' }),
    })
  }
  return months
}

const fetchAllStudents = async (filters) => {
  const firstPage = await fetchStudentsPage(0, STUDENT_PAGE_SIZE, filters)
  const firstContent = Array.isArray(firstPage?.content) ? firstPage.content : []
  const totalPages = Number(firstPage?.totalPages ?? 1)

  if (!Number.isFinite(totalPages) || totalPages <= 1) {
    return {
      rows: firstContent,
      totalElements: Number(firstPage?.totalElements ?? firstContent.length ?? 0),
    }
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => fetchStudentsPage(index + 1, STUDENT_PAGE_SIZE, filters)),
  )

  const rows = [
    ...firstContent,
    ...remainingPages.flatMap((page) => (Array.isArray(page?.content) ? page.content : [])),
  ]

  return {
    rows,
    totalElements: Number(firstPage?.totalElements ?? rows.length ?? 0),
  }
}

const fetchAllBooks = async (filters = {}) => {
  const firstPage = await fetchBooksPage({ page: 0, size: 200, ...filters })
  const firstContent = Array.isArray(firstPage?.content) ? firstPage.content : []
  const totalPages = Number(firstPage?.totalPages ?? 1)

  if (!Number.isFinite(totalPages) || totalPages <= 1) {
    return {
      rows: firstContent,
    }
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => fetchBooksPage({ page: index + 1, size: 200, ...filters })),
  )

  const rows = [
    ...firstContent,
    ...remainingPages.flatMap((page) => (Array.isArray(page?.content) ? page.content : [])),
  ]

  return {
    rows,
  }
}

const Dashboard = () => {
  const { role, schoolId: authSchoolId, headOfficeId: authHeadOfficeId } = useAuth()
  const isSuperAdmin = normalizeRole(role) === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const [totalStudents, setTotalStudents] = useState(null)
  const [monthlyStudentsTrend, setMonthlyStudentsTrend] = useState(null)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [totalTeachers, setTotalTeachers] = useState(null)
  const [monthlyTeachersTrend, setMonthlyTeachersTrend] = useState(null)
  const [teachersLoading, setTeachersLoading] = useState(false)
  const [totalFees, setTotalFees] = useState(null)
  const [monthlyFeesTrend, setMonthlyFeesTrend] = useState(null)
  const [feesLoading, setFeesLoading] = useState(false)
  const [totalBooks, setTotalBooks] = useState(null)
  const [monthlyBooksTrend, setMonthlyBooksTrend] = useState(null)
  const [booksLoading, setBooksLoading] = useState(false)
  const [revenueTotalFee, setRevenueTotalFee] = useState(0)
  const [revenueCollectedFee, setRevenueCollectedFee] = useState(0)
  const [revenueChartSeries, setRevenueChartSeries] = useState([
    { name: 'Total Fee', color: '#25A194', data: Array(12).fill(0) },
    { name: 'Collected Fee', color: '#FF7A2C', data: Array(12).fill(0) },
  ])
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [selectedEventDetails, setSelectedEventDetails] = useState(null)
  const [leaveRequests, setLeaveRequests] = useState([])
  const [leaveRequestsLoading, setLeaveRequestsLoading] = useState(false)
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [employeesLoading, setEmployeesLoading] = useState(false)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [incomeExpenseChartLabels, setIncomeExpenseChartLabels] = useState(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'])
  const [incomeExpenseChartSeries, setIncomeExpenseChartSeries] = useState([
    { name: 'Income', color: '#25A194', fill: '#25A194', data: Array(9).fill(0) },
    { name: 'Expense', color: '#FF7A2C', fill: '#FF7A2C', data: Array(9).fill(0) },
  ])
  const [incomeExpenseLoading, setIncomeExpenseLoading] = useState(false)

  const studentScope = useMemo(() => {
    if (isSuperAdmin) {
      if (manualScope.selectedSchoolId) {
        return { schoolId: manualScope.selectedSchoolId }
      }
      if (manualScope.selectedHeadOfficeId) {
        return { headOfficeId: manualScope.selectedHeadOfficeId }
      }
      return null
    }

    if (authSchoolId != null && String(authSchoolId).trim()) {
      return { schoolId: String(authSchoolId) }
    }

    if (authHeadOfficeId != null && String(authHeadOfficeId).trim()) {
      return { headOfficeId: String(authHeadOfficeId) }
    }

    return null
  }, [authHeadOfficeId, authSchoolId, isSuperAdmin, manualScope.selectedHeadOfficeId, manualScope.selectedSchoolId])

  useEffect(() => {
    let cancelled = false

    const loadTotalStudents = async () => {
      setStudentsLoading(true)
      try {
        const { rows, totalElements } = await fetchAllStudents(studentScope || {})
        if (cancelled) return
        setTotalStudents(Number(totalElements ?? 0))

        const now = new Date()
        const currentMonthKey = getMonthKey(now)
        const previousMonthKey = currentMonthKey - 1
        let currentMonthCount = 0
        let previousMonthCount = 0

        for (const student of rows) {
          const studentDate = getStudentDate(student)
          if (!studentDate) continue

          const monthKey = getMonthKey(studentDate)
          if (monthKey === currentMonthKey) {
            currentMonthCount += 1
          } else if (monthKey === previousMonthKey) {
            previousMonthCount += 1
          }
        }

        const difference = currentMonthCount - previousMonthCount
        const direction = difference >= 0 ? 'up' : 'down'
        const percentChange = previousMonthCount > 0
          ? Math.abs((difference / previousMonthCount) * 100)
          : currentMonthCount > 0
            ? 100
            : 0

        setMonthlyStudentsTrend({
          currentMonthCount,
          percentChange,
          direction,
          hasPreviousMonthData: previousMonthCount > 0,
        })
      } catch {
        if (!cancelled) setTotalStudents(0)
        if (!cancelled) setMonthlyStudentsTrend(null)
      } finally {
        if (!cancelled) setStudentsLoading(false)
      }
    }

    void loadTotalStudents()

    return () => {
      cancelled = true
    }
  }, [studentScope])

  useEffect(() => {
    let cancelled = false

    const loadTotalTeachers = async () => {
      setTeachersLoading(true)
      try {
        const [teachersList, schoolsList] = await Promise.all([
          fetchTeachers(),
          fetchSchoolsLookup(),
        ])
        if (cancelled) return

        const schoolsById = new Map()
        for (const school of Array.isArray(schoolsList) ? schoolsList : []) {
          if (school?.id == null) continue
          schoolsById.set(String(school.id), school)
        }

        const filteredTeachers = teachersList.filter((t) => {
          const teacherSchoolId = t?.schoolId != null ? String(t.schoolId) : ''
          const teacherSchool = teacherSchoolId ? schoolsById.get(teacherSchoolId) : null
          const teacherHeadOfficeId = String(t?.headOfficeId ?? t?.headOffice?.id ?? teacherSchool?.headOfficeId ?? '')

          if (isSuperAdmin) {
            if (manualScope.selectedSchoolId) {
              return String(teacherSchoolId) === String(manualScope.selectedSchoolId)
            }
            if (manualScope.selectedHeadOfficeId) {
              return String(teacherHeadOfficeId) === String(manualScope.selectedHeadOfficeId)
            }
            return true
          }

          if (authSchoolId != null && String(authSchoolId).trim()) {
            return String(teacherSchoolId) === String(authSchoolId)
          }

          if (authHeadOfficeId != null && String(authHeadOfficeId).trim()) {
            return String(teacherHeadOfficeId) === String(authHeadOfficeId)
          }

          return true
        })

        setTotalTeachers(filteredTeachers.length)

        const now = new Date()
        const currentMonthKey = getMonthKey(now)
        const previousMonthKey = currentMonthKey - 1
        let currentMonthCount = 0
        let previousMonthCount = 0

        for (const teacher of filteredTeachers) {
          const teacherDate = getTeacherDate(teacher)
          if (!teacherDate) continue

          const monthKey = getMonthKey(teacherDate)
          if (monthKey === currentMonthKey) {
            currentMonthCount += 1
          } else if (monthKey === previousMonthKey) {
            previousMonthCount += 1
          }
        }

        const difference = currentMonthCount - previousMonthCount
        const direction = difference >= 0 ? 'up' : 'down'
        const percentChange = previousMonthCount > 0
          ? Math.abs((difference / previousMonthCount) * 100)
          : currentMonthCount > 0
            ? 100
            : 0

        setMonthlyTeachersTrend({
          currentMonthCount,
          percentChange,
          direction,
          hasPreviousMonthData: previousMonthCount > 0,
        })
      } catch {
        if (!cancelled) setTotalTeachers(0)
        if (!cancelled) setMonthlyTeachersTrend(null)
      } finally {
        if (!cancelled) setTeachersLoading(false)
      }
    }

    void loadTotalTeachers()

    return () => {
      cancelled = true
    }
  }, [studentScope, isSuperAdmin, manualScope.selectedSchoolId, manualScope.selectedHeadOfficeId, authSchoolId, authHeadOfficeId])

  useEffect(() => {
    let cancelled = false

    const loadTotalFees = async () => {
      setFeesLoading(true)
      try {
        const [feesList, schoolsList] = await Promise.all([
          fetchFeeCollections(),
          fetchSchoolsLookup(),
        ])
        if (cancelled) return

        const schoolsById = new Map()
        for (const school of Array.isArray(schoolsList) ? schoolsList : []) {
          if (school?.id == null) continue
          schoolsById.set(String(school.id), school)
        }

        const filteredFees = (Array.isArray(feesList) ? feesList : []).filter((f) => {
          const feeSchoolId = f?.schoolId != null ? String(f.schoolId) : ''
          const feeSchool = feeSchoolId ? schoolsById.get(feeSchoolId) : null
          const feeHeadOfficeId = String(f?.headOfficeId ?? f?.headOffice?.id ?? feeSchool?.headOfficeId ?? '')

          if (isSuperAdmin) {
            if (manualScope.selectedSchoolId) {
              return String(feeSchoolId) === String(manualScope.selectedSchoolId)
            }
            if (manualScope.selectedHeadOfficeId) {
              return String(feeHeadOfficeId) === String(manualScope.selectedHeadOfficeId)
            }
            return true
          }

          if (authSchoolId != null && String(authSchoolId).trim()) {
            return String(feeSchoolId) === String(authSchoolId)
          }

          if (authHeadOfficeId != null && String(authHeadOfficeId).trim()) {
            return String(feeHeadOfficeId) === String(authHeadOfficeId)
          }

          return true
        })

        let sumCollected = 0
        let sumTotalFee = 0
        const now = new Date()
        const currentMonthKey = getMonthKey(now)
        const previousMonthKey = currentMonthKey - 1
        let currentMonthAmount = 0
        let previousMonthAmount = 0

        const currentYear = now.getFullYear()
        const monthlyTotalFees = Array(12).fill(0)
        const monthlyCollectedFees = Array(12).fill(0)

        for (const fee of filteredFees) {
          const grossVal = Number(fee?.grossAmount || 0)
          const status = String(fee?.paidStatus || '').trim().toLowerCase()
          const netVal = fee.netAmount != null ? Number(fee.netAmount) : Number(fee.grossAmount || 0)
          let collectedVal = 0

          if (status === 'paid') {
            collectedVal = netVal
          } else if (status === 'partial') {
            const dueVal = Number(fee.dueAmount || 0)
            collectedVal = Math.max(netVal - dueVal, 0)
          }

          sumCollected += collectedVal
          sumTotalFee += grossVal

          const feeDate = getFeeDate(fee)
          if (!feeDate) continue

          const monthKey = getMonthKey(feeDate)
          if (monthKey === currentMonthKey) {
            currentMonthAmount += collectedVal
          } else if (monthKey === previousMonthKey) {
            previousMonthAmount += collectedVal
          }

          if (feeDate.getFullYear() === currentYear) {
            const monthIdx = feeDate.getMonth()
            if (monthIdx >= 0 && monthIdx < 12) {
              monthlyTotalFees[monthIdx] += grossVal
              monthlyCollectedFees[monthIdx] += collectedVal
            }
          }
        }

        setTotalFees(sumCollected)

        const difference = currentMonthAmount - previousMonthAmount
        const direction = difference >= 0 ? 'up' : 'down'
        const percentChange = previousMonthAmount > 0
          ? Math.abs((difference / previousMonthAmount) * 100)
          : currentMonthAmount > 0
            ? 100
            : 0

        setMonthlyFeesTrend({
          currentMonthAmount,
          percentChange,
          direction,
          hasPreviousMonthData: previousMonthAmount > 0,
        })

        setRevenueTotalFee(sumTotalFee)
        setRevenueCollectedFee(sumCollected)
        setRevenueChartSeries([
          { name: 'Total Fee', color: '#25A194', data: monthlyTotalFees.map((v) => v / 1000) },
          { name: 'Collected Fee', color: '#FF7A2C', data: monthlyCollectedFees.map((v) => v / 1000) },
        ])
      } catch (err) {
        console.error('Failed to load total fees:', err)
        if (!cancelled) {
          setTotalFees(0)
          setMonthlyFeesTrend(null)
          setRevenueTotalFee(0)
          setRevenueCollectedFee(0)
          setRevenueChartSeries([
            { name: 'Total Fee', color: '#25A194', data: Array(12).fill(0) },
            { name: 'Collected Fee', color: '#FF7A2C', data: Array(12).fill(0) },
          ])
        }
      } finally {
        if (!cancelled) setFeesLoading(false)
      }
    }

    void loadTotalFees()

    return () => {
      cancelled = true
    }
  }, [studentScope, isSuperAdmin, manualScope.selectedSchoolId, manualScope.selectedHeadOfficeId, authSchoolId, authHeadOfficeId])

  useEffect(() => {
    let cancelled = false

    const loadTotalBooks = async () => {
      setBooksLoading(true)
      try {
        const [booksData, schoolsList] = await Promise.all([
          fetchAllBooks(studentScope || {}),
          fetchSchoolsLookup(),
        ])
        if (cancelled) return

        const schoolsById = new Map()
        for (const school of Array.isArray(schoolsList) ? schoolsList : []) {
          if (school?.id == null) continue
          schoolsById.set(String(school.id), school)
        }

        const booksList = booksData.rows || []
        const filteredBooks = booksList.filter((b) => {
          const bookSchoolId = b?.schoolId != null ? String(b.schoolId) : ''
          const bookSchool = bookSchoolId ? schoolsById.get(bookSchoolId) : null
          const bookHeadOfficeId = String(b?.headOfficeId ?? b?.headOffice?.id ?? bookSchool?.headOfficeId ?? '')

          if (isSuperAdmin) {
            if (manualScope.selectedSchoolId) {
              return String(bookSchoolId) === String(manualScope.selectedSchoolId)
            }
            if (manualScope.selectedHeadOfficeId) {
              return String(bookHeadOfficeId) === String(manualScope.selectedHeadOfficeId)
            }
            return true
          }

          if (authSchoolId != null && String(authSchoolId).trim()) {
            return String(bookSchoolId) === String(authSchoolId)
          }

          if (authHeadOfficeId != null && String(authHeadOfficeId).trim()) {
            return String(bookHeadOfficeId) === String(authHeadOfficeId)
          }

          return true
        })

        let sumQuantity = 0
        const now = new Date()
        const currentMonthKey = getMonthKey(now)
        const previousMonthKey = currentMonthKey - 1
        let currentMonthCount = 0
        let previousMonthCount = 0

        for (const book of filteredBooks) {
          const qty = Number(book?.quantity) || 0
          sumQuantity += qty

          const bookDate = getBookDate(book)
          if (!bookDate) continue

          const monthKey = getMonthKey(bookDate)
          if (monthKey === currentMonthKey) {
            currentMonthCount += qty
          } else if (monthKey === previousMonthKey) {
            previousMonthCount += qty
          }
        }

        setTotalBooks(sumQuantity)

        const difference = currentMonthCount - previousMonthCount
        const direction = difference >= 0 ? 'up' : 'down'
        const percentChange = previousMonthCount > 0
          ? Math.abs((difference / previousMonthCount) * 100)
          : currentMonthCount > 0
            ? 100
            : 0

        setMonthlyBooksTrend({
          currentMonthCount,
          percentChange,
          direction,
          hasPreviousMonthData: previousMonthCount > 0,
        })
      } catch (err) {
        console.error('Failed to load total books:', err)
        if (!cancelled) {
          setTotalBooks(0)
          setMonthlyBooksTrend(null)
        }
      } finally {
        if (!cancelled) setBooksLoading(false)
      }
    }

    void loadTotalBooks()

    return () => {
      cancelled = true
    }
  }, [studentScope, isSuperAdmin, manualScope.selectedSchoolId, manualScope.selectedHeadOfficeId, authSchoolId, authHeadOfficeId])

  useEffect(() => {
    let cancelled = false

    const loadUpcomingEvents = async () => {
      setEventsLoading(true)
      try {
        const [eventsList, schoolsList] = await Promise.all([
          fetchEvents(),
          fetchSchoolsLookup(),
        ])
        if (cancelled) return

        const schoolsById = new Map()
        for (const school of Array.isArray(schoolsList) ? schoolsList : []) {
          if (school?.id == null) continue
          schoolsById.set(String(school.id), school)
        }

        const filteredEvents = (Array.isArray(eventsList) ? eventsList : []).filter((e) => {
          const eventSchoolId = e?.schoolId != null ? String(e.schoolId) : ''
          const eventSchool = eventSchoolId ? schoolsById.get(eventSchoolId) : null
          const eventHeadOfficeId = String(e?.headOfficeId ?? e?.headOffice?.id ?? eventSchool?.headOfficeId ?? '')

          if (isSuperAdmin) {
            if (manualScope.selectedSchoolId) {
              return String(eventSchoolId) === String(manualScope.selectedSchoolId)
            }
            if (manualScope.selectedHeadOfficeId) {
              return String(eventHeadOfficeId) === String(manualScope.selectedHeadOfficeId)
            }
            return true
          }

          if (authSchoolId != null && String(authSchoolId).trim()) {
            return String(eventSchoolId) === String(authSchoolId)
          }

          if (authHeadOfficeId != null && String(authHeadOfficeId).trim()) {
            return String(eventHeadOfficeId) === String(authHeadOfficeId)
          }

          return true
        })

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const activeOrFutureEvents = filteredEvents.filter((e) => {
          const toDateObj = e.toDate ? new Date(e.toDate) : null
          const fromDateObj = e.fromDate ? new Date(e.fromDate) : null
          return toDateObj ? (toDateObj >= today) : (fromDateObj ? (fromDateObj >= today) : false)
        })

        const sortedEvents = activeOrFutureEvents.sort((a, b) => {
          const dateA = new Date(a.fromDate || a.toDate || 0)
          const dateB = new Date(b.fromDate || b.toDate || 0)
          return dateA - dateB
        })

        setEvents(sortedEvents)
      } catch (err) {
        console.error('Failed to load upcoming events:', err)
        if (!cancelled) setEvents([])
      } finally {
        if (!cancelled) setEventsLoading(false)
      }
    }

    void loadUpcomingEvents()

    return () => {
      cancelled = true
    }
  }, [studentScope, isSuperAdmin, manualScope.selectedSchoolId, manualScope.selectedHeadOfficeId, authSchoolId, authHeadOfficeId])

  useEffect(() => {
    let cancelled = false

    const loadLeaveRequests = async () => {
      setLeaveRequestsLoading(true)
      try {
        const [leaveList, schoolsList] = await Promise.all([
          fetchLeaveApplications(),
          fetchSchoolsLookup(),
        ])
        if (cancelled) return

        const schoolsById = new Map()
        for (const school of Array.isArray(schoolsList) ? schoolsList : []) {
          if (school?.id == null) continue
          schoolsById.set(String(school.id), school)
        }

        const filteredLeaves = (Array.isArray(leaveList) ? leaveList : []).filter((leave) => {
          const leaveSchoolId = leave?.schoolId != null ? String(leave.schoolId) : ''
          const leaveSchool = leaveSchoolId ? schoolsById.get(leaveSchoolId) : null
          const leaveHeadOfficeId = String(leave?.headOfficeId ?? leave?.headOffice?.id ?? leaveSchool?.headOfficeId ?? '')

          if (isSuperAdmin) {
            if (manualScope.selectedSchoolId) {
              return String(leaveSchoolId) === String(manualScope.selectedSchoolId)
            }
            if (manualScope.selectedHeadOfficeId) {
              return String(leaveHeadOfficeId) === String(manualScope.selectedHeadOfficeId)
            }
            return true
          }

          if (authSchoolId != null && String(authSchoolId).trim()) {
            return String(leaveSchoolId) === String(authSchoolId)
          }

          if (authHeadOfficeId != null && String(authHeadOfficeId).trim()) {
            return String(leaveHeadOfficeId) === String(authHeadOfficeId)
          }

          return true
        })

        const sortedLeaves = filteredLeaves.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.applicationDate || 0)
          const dateB = new Date(b.createdAt || b.applicationDate || 0)
          return dateB - dateA
        })

        setLeaveRequests(sortedLeaves)
      } catch (err) {
        console.error('Failed to load leave requests:', err)
        if (!cancelled) setLeaveRequests([])
      } finally {
        if (!cancelled) setLeaveRequestsLoading(false)
      }
    }

    void loadLeaveRequests()

    return () => {
      cancelled = true
    }
  }, [studentScope, isSuperAdmin, manualScope.selectedSchoolId, manualScope.selectedHeadOfficeId, authSchoolId, authHeadOfficeId])

  useEffect(() => {
    let cancelled = false

    const loadTotalEmployees = async () => {
      setEmployeesLoading(true)
      try {
        const [employeesList, schoolsList] = await Promise.all([
          fetchEmployees(),
          fetchSchoolsLookup(),
        ])
        if (cancelled) return

        const schoolsById = new Map()
        for (const school of Array.isArray(schoolsList) ? schoolsList : []) {
          if (school?.id == null) continue
          schoolsById.set(String(school.id), school)
        }

        const filteredEmployees = (Array.isArray(employeesList) ? employeesList : []).filter((emp) => {
          const empSchoolId = emp?.schoolId != null ? String(emp.schoolId) : ''
          const empSchool = empSchoolId ? schoolsById.get(empSchoolId) : null
          const empHeadOfficeId = String(emp?.headOfficeId ?? emp?.headOffice?.id ?? empSchool?.headOfficeId ?? '')

          if (isSuperAdmin) {
            if (manualScope.selectedSchoolId) {
              return String(empSchoolId) === String(manualScope.selectedSchoolId)
            }
            if (manualScope.selectedHeadOfficeId) {
              return String(empHeadOfficeId) === String(manualScope.selectedHeadOfficeId)
            }
            return true
          }

          if (authSchoolId != null && String(authSchoolId).trim()) {
            return String(empSchoolId) === String(authSchoolId)
          }

          if (authHeadOfficeId != null && String(authHeadOfficeId).trim()) {
            return String(empHeadOfficeId) === String(authHeadOfficeId)
          }

          return true
        })

        setTotalEmployees(filteredEmployees.length)
      } catch (err) {
        console.error('Failed to load employees count:', err)
        if (!cancelled) setTotalEmployees(0)
      } finally {
        if (!cancelled) setEmployeesLoading(false)
      }
    }

    void loadTotalEmployees()

    return () => {
      cancelled = true
    }
  }, [studentScope, isSuperAdmin, manualScope.selectedSchoolId, manualScope.selectedHeadOfficeId, authSchoolId, authHeadOfficeId])

  useEffect(() => {
    let cancelled = false

    const loadIncomeVsExpense = async () => {
      setIncomeExpenseLoading(true)
      try {
        const [incomesList, expendituresList, schoolsList] = await Promise.all([
          fetchIncomes(),
          fetchExpenditures(),
          fetchSchoolsLookup(),
        ])
        if (cancelled) return

        const schoolsById = new Map()
        for (const school of Array.isArray(schoolsList) ? schoolsList : []) {
          if (school?.id == null) continue
          schoolsById.set(String(school.id), school)
        }

        const filterRecord = (item) => {
          const itemSchoolId = item?.schoolId != null ? String(item.schoolId) : ''
          const itemSchool = itemSchoolId ? schoolsById.get(itemSchoolId) : null
          const itemHeadOfficeId = String(item?.headOfficeId ?? item?.headOffice?.id ?? itemSchool?.headOfficeId ?? '')

          if (isSuperAdmin) {
            if (manualScope.selectedSchoolId) {
              return String(itemSchoolId) === String(manualScope.selectedSchoolId)
            }
            if (manualScope.selectedHeadOfficeId) {
              return String(itemHeadOfficeId) === String(manualScope.selectedHeadOfficeId)
            }
            return true
          }

          if (authSchoolId != null && String(authSchoolId).trim()) {
            return String(itemSchoolId) === String(authSchoolId)
          }

          if (authHeadOfficeId != null && String(authHeadOfficeId).trim()) {
            return String(itemHeadOfficeId) === String(authHeadOfficeId)
          }

          return true
        }

        const filteredIncomes = (Array.isArray(incomesList) ? incomesList : []).filter(filterRecord)
        const filteredExpenditures = (Array.isArray(expendituresList) ? expendituresList : []).filter(filterRecord)

        const parseIncomeDate = (income) => {
          const rawValue = income?.incomeDate || income?.createdAt
          if (!rawValue) return null
          const date = new Date(rawValue)
          return Number.isNaN(date.getTime()) ? null : date
        }

        const parseExpenditureDate = (exp) => {
          const rawValue = exp?.expenditureDate || exp?.createdAt
          if (!rawValue) return null
          const date = new Date(rawValue)
          return Number.isNaN(date.getTime()) ? null : date
        }

        const rollingMonths = getRollingMonths(9)
        const labels = rollingMonths.map((m) => m.label)

        let sumIncome = 0
        let sumExpense = 0

        const incomeMap = new Map()
        const expenseMap = new Map()

        for (const income of filteredIncomes) {
          const amt = Number(income?.amount || 0)
          sumIncome += amt

          const date = parseIncomeDate(income)
          if (date) {
            const key = getMonthKey(date)
            incomeMap.set(key, (incomeMap.get(key) || 0) + amt)
          }
        }

        for (const exp of filteredExpenditures) {
          const amt = Number(exp?.amount || 0)
          sumExpense += amt

          const date = parseExpenditureDate(exp)
          if (date) {
            const key = getMonthKey(date)
            expenseMap.set(key, (expenseMap.get(key) || 0) + amt)
          }
        }

        const incomeData = rollingMonths.map((m) => (incomeMap.get(m.key) || 0) / 1000)
        const expenseData = rollingMonths.map((m) => (expenseMap.get(m.key) || 0) / 1000)

        setTotalIncome(sumIncome)
        setTotalExpense(sumExpense)
        setIncomeExpenseChartLabels(labels)
        setIncomeExpenseChartSeries([
          { name: 'Income', color: '#25A194', fill: '#25A194', data: incomeData },
          { name: 'Expense', color: '#FF7A2C', fill: '#FF7A2C', data: expenseData },
        ])
      } catch (err) {
        console.error('Failed to load income/expenditure data:', err)
        if (!cancelled) {
          setTotalIncome(0)
          setTotalExpense(0)
          setIncomeExpenseChartLabels(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'])
          setIncomeExpenseChartSeries([
            { name: 'Income', color: '#25A194', fill: '#25A194', data: Array(9).fill(0) },
            { name: 'Expense', color: '#FF7A2C', fill: '#FF7A2C', data: Array(9).fill(0) },
          ])
        }
      } finally {
        if (!cancelled) setIncomeExpenseLoading(false)
      }
    }

    void loadIncomeVsExpense()

    return () => {
      cancelled = true
    }
  }, [studentScope, isSuperAdmin, manualScope.selectedSchoolId, manualScope.selectedHeadOfficeId, authSchoolId, authHeadOfficeId])

  const totalStudentsLabel = studentsLoading ? '...' : new Intl.NumberFormat(undefined).format(totalStudents ?? 0)
  const monthlyStudentsCountLabel = studentsLoading
    ? '...'
    : `+${new Intl.NumberFormat(undefined).format(monthlyStudentsTrend?.currentMonthCount ?? 0)} This Month`
  const monthlyStudentsPercentLabel = studentsLoading
    ? '...'
    : `${Number(monthlyStudentsTrend?.percentChange ?? 0).toFixed(0)}%`

  const totalTeachersLabel = teachersLoading ? '...' : new Intl.NumberFormat(undefined).format(totalTeachers ?? 0)
  const monthlyTeachersCountLabel = teachersLoading
    ? '...'
    : `+${new Intl.NumberFormat(undefined).format(monthlyTeachersTrend?.currentMonthCount ?? 0)} This Month`
  const monthlyTeachersPercentLabel = teachersLoading
    ? '...'
    : `${Number(monthlyTeachersTrend?.percentChange ?? 0).toFixed(0)}%`

  const totalFeesLabel = feesLoading
    ? '...'
    : `₹${Number(totalFees ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const monthlyFeesCountLabel = feesLoading
    ? '...'
    : `+₹${Number(monthlyFeesTrend?.currentMonthAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} This Month`
  const monthlyFeesPercentLabel = feesLoading
    ? '...'
    : `${Number(monthlyFeesTrend?.percentChange ?? 0).toFixed(0)}%`

  const totalBooksLabel = booksLoading ? '...' : new Intl.NumberFormat(undefined).format(totalBooks ?? 0)
  const monthlyBooksCountLabel = booksLoading
    ? '...'
    : `+${new Intl.NumberFormat(undefined).format(monthlyBooksTrend?.currentMonthCount ?? 0)} This Month`
  const monthlyBooksPercentLabel = booksLoading
    ? '...'
    : `${Number(monthlyBooksTrend?.percentChange ?? 0).toFixed(0)}%`

  const totalUsers = (totalStudents || 0) + (totalTeachers || 0) + (totalEmployees || 0)
  const studentPercent = totalUsers > 0 ? Math.round(((totalStudents || 0) / totalUsers) * 100) : 0
  const teacherPercent = totalUsers > 0 ? Math.round(((totalTeachers || 0) / totalUsers) * 100) : 0
  const staffPercent = totalUsers > 0 ? Math.max(0, 100 - studentPercent - teacherPercent) : 0

  const userOverviewLoading = studentsLoading || teachersLoading || employeesLoading

  const studentPercentLabel = userOverviewLoading ? '...' : `${studentPercent}%`
  const teacherPercentLabel = userOverviewLoading ? '...' : `${teacherPercent}%`
  const staffPercentLabel = userOverviewLoading ? '...' : `${staffPercent}%`

  const studentCountLabel = studentsLoading ? '...' : new Intl.NumberFormat(undefined).format(totalStudents ?? 0)
  const teacherCountLabel = teachersLoading ? '...' : new Intl.NumberFormat(undefined).format(totalTeachers ?? 0)
  const staffCountLabel = employeesLoading ? '...' : new Intl.NumberFormat(undefined).format(totalEmployees ?? 0)

  const totalIncomeLabel = incomeExpenseLoading
    ? '...'
    : `$${Number(totalIncome ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const totalExpenseLabel = incomeExpenseLoading
    ? '...'
    : `$${Number(totalExpense ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const maxValInData = Math.max(
    ...(incomeExpenseChartSeries[0]?.data || []),
    ...(incomeExpenseChartSeries[1]?.data || []),
    10
  )
  const chartMaxValue = Math.ceil(maxValInData / 10) * 10

  return (
    <>
      <div className="dashboard-main-body">
        {/*
          Charts in the original HTML template were rendered by ApexCharts + jQuery scripts.
          Here we render lightweight SVG charts so the dashboard works without those scripts.
        */}
        <div className="breadcrumb d-flex flex-wrap align-items-start justify-content-between gap-3 mb-24 school-dashboard__header">
          <div>
            <h6 className="fw-semibold mb-0">Dashboard</h6>
            <p className="text-neutral-600 mt-4 mb-0">School - Manage your school, track attendance, expense, and net worth.</p>
          </div>
          {isSuperAdmin ? (
            <div className="school-dashboard__scope-selector">
              <ManualScopeSelectors
                enabled={isSuperAdmin}
                headOffices={manualScope.headOffices}
                schoolOptions={manualScope.schoolOptions}
                selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                onHeadOfficeChange={(value) => {
                  manualScope.setSelectedScope(value, '')
                }}
                selectedSchoolId={manualScope.selectedSchoolId}
                onSchoolChange={(value) => {
                  manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value)
                }}
                compact
                showSchoolSelector
              />
            </div>
          ) : null}
        </div>

        <div className="mt-24">

          <div className="row gy-4">

            <div className="col-xxl-8">

              <div className="row gy-4">

                <div className="col-xxl-4 col-sm-6">

                  <div className="card shadow-1 radius-8 gradient-bg-end-1 h-100">

                    <div className="card-body p-20">

                      <div className="d-flex flex-wrap align-items-center gap-3 mb-16">

                        <div

                          className="w-44-px h-44-px bg-warning-600 rounded-circle d-flex justify-content-center align-items-center">

                          <img src="/assets/images/icons/student-icon.png" alt="Students" />

                        </div>

                        <p className="fw-medium text-primary-light mb-1">Total Students</p>

                      </div>

                      <h6 className="mb-0">{totalStudentsLabel}</h6>

                      <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">

                        <span className="d-inline-flex align-items-center gap-1 text-primary-600 text-sm fw-semibold">

                          {monthlyStudentsPercentLabel}

                          <iconify-icon
                            icon={monthlyStudentsTrend?.direction === 'down' ? 'bxs:down-arrow' : 'bxs:up-arrow'}
                            className="text-xs"
                          ></iconify-icon>

                        </span>

                        {monthlyStudentsCountLabel}

                      </p>

                    </div>

                  </div>

                </div>

                <div className="col-xxl-4 col-sm-6">

                  <div className="card shadow-1 radius-8 gradient-bg-end-2 h-100">

                    <div className="card-body p-20">

                      <div className="d-flex flex-wrap align-items-center gap-3 mb-16">

                        <div

                          className="w-44-px h-44-px bg-blue-600 rounded-circle d-flex justify-content-center align-items-center">

                          <img src="/assets/images/icons/teacher-icon.png" alt="Teachers" />

                        </div>

                        <p className="fw-medium text-primary-light mb-1">Total Teachers</p>

                      </div>

                      <h6 className="mb-0">{totalTeachersLabel}</h6>

                      <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">

                        <span className="d-inline-flex align-items-center gap-1 text-primary-600 text-sm fw-semibold">

                          {monthlyTeachersPercentLabel}

                          <iconify-icon icon={monthlyTeachersTrend?.direction === 'down' ? 'bxs:down-arrow' : 'bxs:up-arrow'} className="text-xs"></iconify-icon>

                        </span>

                        {monthlyTeachersCountLabel}

                      </p>

                    </div>

                  </div>

                </div>

                <div className="col-xxl-4 col-sm-6">

                  <div className="card shadow-1 radius-8 gradient-bg-end-3 h-100">

                    <div className="card-body p-20">

                      <div className="d-flex flex-wrap align-items-center gap-3 mb-16">

                        <div

                          className="w-44-px h-44-px bg-purple-600 rounded-circle d-flex justify-content-center align-items-center">

                          <img src="/assets/images/icons/guardian-icon.png" alt="Parents" />

                        </div>

                        <p className="fw-medium text-primary-light mb-1">Total Parents</p>

                      </div>

                      <h6 className="mb-0">12,400</h6>

                      <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">

                        <span className="d-inline-flex align-items-center gap-1 text-primary-600 text-sm fw-semibold">

                          7%

                          <iconify-icon icon="bxs:up-arrow" className="text-xs"></iconify-icon>

                        </span>

                        +140 This Month

                      </p>

                    </div>

                  </div>

                </div>

                <div className="col-xxl-4 col-sm-6">

                  <div className="card shadow-1 radius-8 gradient-bg-end-4 h-100">

                    <div className="card-body p-20">

                      <div className="d-flex flex-wrap align-items-center gap-3 mb-16">

                        <div

                          className="w-44-px h-44-px bg-primary-600 rounded-circle d-flex justify-content-center align-items-center">

                          <img src="/assets/images/icons/fees-icon1.png" alt="Fees" />

                        </div>

                        <p className="fw-medium text-primary-light mb-1">Fees Collected</p>

                      </div>

                      <h6 className="mb-0">{totalFeesLabel}</h6>

                      <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">

                        <span className="d-inline-flex align-items-center gap-1 text-primary-600 text-sm fw-semibold">

                          {monthlyFeesPercentLabel}

                          <iconify-icon icon={monthlyFeesTrend?.direction === 'down' ? 'bxs:down-arrow' : 'bxs:up-arrow'} className="text-xs"></iconify-icon>

                        </span>

                        {monthlyFeesCountLabel}

                      </p>

                    </div>

                  </div>

                </div>

                <div className="col-xxl-4 col-sm-6">

                  <div className="card shadow-1 radius-8 gradient-bg-end-5 h-100">

                    <div className="card-body p-20">

                      <div className="d-flex flex-wrap align-items-center gap-3 mb-16">

                        <div

                          className="w-44-px h-44-px bg-success-600 rounded-circle d-flex justify-content-center align-items-center">

                          <img src="/assets/images/icons/attendence-icon1.png" alt="Attendance" />

                        </div>

                        <p className="fw-medium text-primary-light mb-1">Avg Attendance</p>

                      </div>

                      <h6 className="mb-0">87%</h6>

                      <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">

                        <span className="d-inline-flex align-items-center gap-1 text-primary-600 text-sm fw-semibold">

                          2%

                          <iconify-icon icon="bxs:up-arrow" className="text-xs"></iconify-icon>

                        </span>

                        +1.5% This Month

                      </p>

                    </div>

                  </div>

                </div>

                <div className="col-xxl-4 col-sm-6">

                  <div className="card shadow-1 radius-8 gradient-bg-end-6 h-100">

                    <div className="card-body p-20">

                      <div className="d-flex flex-wrap align-items-center gap-3 mb-16">

                        <div

                          className="w-44-px h-44-px bg-cyan-600 rounded-circle d-flex justify-content-center align-items-center">

                          <img src="/assets/images/icons/library-icon.png" alt="Library" />

                        </div>

                        <p className="fw-medium text-primary-light mb-1">Library Books</p>

                      </div>

                      <h6 className="mb-0">{totalBooksLabel}</h6>

                      <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">

                        <span className="d-inline-flex align-items-center gap-1 text-primary-600 text-sm fw-semibold">

                          {monthlyBooksPercentLabel}

                          <iconify-icon icon={monthlyBooksTrend?.direction === 'down' ? 'bxs:down-arrow' : 'bxs:up-arrow'} className="text-xs"></iconify-icon>

                        </span>

                        {monthlyBooksCountLabel}

                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            <div className="col-xxl-4">

              <div className="card h-100">

                <div className="card-body p-0">

                  <div

                    className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">

                    <h6 className="text-lg mb-0">Student Attendance</h6>

                  </div>

                  <div className="p-20">

                    <div className="d-flex gap-6">

                      <div className="h-44-px bg-primary-600 rounded" style={{ width: '87%' }}></div>

                      <div className="h-44-px bg-warning-600 rounded" style={{ width: '40%' }}></div>

                      <div className="h-44-px bg-purple-600 rounded" style={{ width: '20%' }}></div>

                      <div className="h-44-px bg-success-600 rounded" style={{ width: '20%' }}></div>

                    </div>

                    <div className="mt-32 d-flex flex-column gap-24">

                      <div className="d-flex align-items-center justify-content-between">

                        <div className="d-flex align-items-center gap-2">

                          <span className="w-12-px h-12-px radius-2 bg-primary-600"></span>

                          <span className="text-neutral-600">Present </span>

                        </div>

                        <span className="fw-semibold text-primary-light">87%</span>

                      </div>

                      <div className="d-flex align-items-center justify-content-between">

                        <div className="d-flex align-items-center gap-2">

                          <span className="w-12-px h-12-px radius-2 bg-warning-600"></span>

                          <span className="text-neutral-600">Absent: </span>

                        </div>

                        <span className="fw-semibold text-primary-light">40%</span>

                      </div>

                      <div className="d-flex align-items-center justify-content-between">

                        <div className="d-flex align-items-center gap-2">

                          <span className="w-12-px h-12-px radius-2 bg-purple-600"></span>

                          <span className="text-neutral-600">Late </span>

                        </div>

                        <span className="fw-semibold text-primary-light">20%</span>

                      </div>

                      <div className="d-flex align-items-center justify-content-between">

                        <div className="d-flex align-items-center gap-2">

                          <span className="w-12-px h-12-px radius-2 bg-success-600"></span>

                          <span className="text-neutral-600">Half day </span>

                        </div>

                        <span className="fw-semibold text-primary-light">20%</span>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            <div className="col-12">

              <div className="row gy-4">

                <div className="col-xxl-8">

                  <div className="row gy-4">

                    <div className="col-12">

                      <div className="card h-100">

                        <div className="card-body p-0">

                          <div

                            className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">

                            <div className="d-flex align-items-center gap-10">
                              <span className="w-32-px h-32-px bg-primary-50 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                                <img src="/assets/images/icons/price-icon1.png" alt="Revenue" className="w-20-px h-20-px" />
                              </span>
                              <h6 className="text-lg mb-0">Revenue Statistic</h6>
                            </div>

                          </div>

                          <div className="p-20">

                            <ul className="d-flex flex-wrap align-items-center justify-content-center mb-16 gap-3">
                              <li className="d-flex align-items-center gap-8">
                                <span className="w-12-px h-12-px radius-2 rotate-45-deg" style={{ background: '#25A194' }}></span>
                                <span className="text-secondary-light text-sm fw-semibold">
                                  Total Fee: <span className="text-primary-light fw-bold">₹{Number(revenueTotalFee).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                </span>
                              </li>
                              <li className="d-flex align-items-center gap-8">
                                <span className="w-12-px h-12-px radius-2 rotate-45-deg" style={{ background: '#FF7A2C' }}></span>
                                <span className="text-secondary-light text-sm fw-semibold">
                                  Collected Fee: <span className="text-primary-light fw-bold">₹{Number(revenueCollectedFee).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                </span>
                              </li>
                            </ul>

                            <div className="w-100">
                              {/* Bar chart: total fee vs collected fee */}
                              {(() => {
                                const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                                return (
                                  <div className="w-100">
                                    {/*
                                      Note: colors match the theme utility classes above.
                                    */}
                                    <BarChart
                                      labels={labels}
                                      series={revenueChartSeries}
                                      height={260}
                                      stacked
                                      showValueLabels
                                      tooltip
                                      valueFormatter={(v) => `₹${Number(v * 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                                      valueLabelFormatter={(v) => `${Number(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}k`}
                                      yLabelFormatter={(v) => `₹${Number(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}k`}
                                    />
                                  </div>
                                )
                              })()}
                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                    <div className="col-md-6">

                      <div className="card h-100">

                        <div className="card-body p-0">

                          <div

                            className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">

                            <h6 className="text-lg mb-0">Notice Board</h6>

                            <div className="dropdown">

                              <button type="button" data-bs-toggle="dropdown" aria-expanded="false">

                                <iconify-icon icon="entypo:dots-three-vertical"

                                  className="icon text-secondary-light"></iconify-icon>

                              </button>

                              <ul className="dropdown-menu p-12 border bg-base shadow">

                                <li>

                                  <button type="button"

                                    className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"

                                    data-bs-toggle="modal" data-bs-target="#exampleModalView">

                                    <iconify-icon icon="hugeicons:view" className="icon text-lg line-height-1"></iconify-icon>

                                    View

                                  </button>

                                </li>

                                <li>

                                  <button type="button"

                                    className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"

                                    data-bs-toggle="modal" data-bs-target="#exampleModalEdit">

                                    <iconify-icon icon="lucide:edit" className="icon text-lg line-height-1"></iconify-icon>

                                    Edit

                                  </button>

                                </li>

                                <li>

                                  <button type="button"

                                    className="delete-item dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-danger-100 text-hover-danger-600 d-flex align-items-center gap-10"

                                    data-bs-toggle="modal" data-bs-target="#exampleModalDelete">

                                    <iconify-icon icon="fluent:delete-24-regular"

                                      className="icon text-lg line-height-1"></iconify-icon>

                                    Delete

                                  </button>

                                </li>

                              </ul>

                            </div>

                          </div>

                          <div className="ps-20 pt-20 pb-20">

                            <div className="pe-20 d-flex flex-column gap-20 max-h-462-px overflow-y-auto scroll-sm">

                              <div className="d-flex align-items-start gap-16">

                                <img src="/assets/images/thumbs/notice-board-img1.png" alt="Thumbnail"

                                  className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0" />

                                <div className="">

                                  <h6 className="mb-4 text-lg">Admin</h6>

                                  <p className="text-secondary-light text-sm mb-0">Lorem Ipsum is simply dummy text of the

                                    printing and typesetti</p>

                                  <span className="text-secondary-light text-sm mb-0 mt-4">25 Jan 2024</span>

                                </div>

                              </div>

                              <div className="d-flex align-items-start gap-16">

                                <img src="/assets/images/thumbs/notice-board-img2.png" alt="Thumbnail"

                                  className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0" />

                                <div className="">

                                  <h6 className="mb-4 text-lg">Kathryn Murphy</h6>

                                  <p className="text-secondary-light text-sm mb-0">Lorem Ipsum is simply dummy text of the

                                    printing and typesett ing industry Lorem Ipsum is simply dummy text of the printing and

                                    typesetting industry.</p>

                                  <span className="text-secondary-light text-sm mb-0 mt-4">25 Jan 2024</span>

                                </div>

                              </div>

                              <div className="d-flex align-items-start gap-16">

                                <img src="/assets/images/thumbs/notice-board-img3.png" alt="Thumbnail"

                                  className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0" />

                                <div className="">

                                  <h6 className="mb-4 text-lg">Admin</h6>

                                  <p className="text-secondary-light text-sm mb-0">Lorem Ipsum is simply dummy text of the

                                    printing and typesetti</p>

                                  <span className="text-secondary-light text-sm mb-0 mt-4">25 Jan 2024</span>

                                </div>

                              </div>

                              <div className="d-flex align-items-start gap-16">

                                <img src="/assets/images/thumbs/notice-board-img2.png" alt="Thumbnail"

                                  className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0" />

                                <div className="">

                                  <h6 className="mb-4 text-lg">John Doe</h6>

                                  <p className="text-secondary-light text-sm mb-0">Lorem ipsum dolor sit amet consectetur

                                    adipisicing elit. Laborum voluptas corporis qui dolore est odit officia fuga?</p>

                                  <span className="text-secondary-light text-sm mb-0 mt-4">25 Jan 2024</span>

                                </div>

                              </div>

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                    <div className="col-md-6">

                      <div className="card h-100">

                        <div className="card-body p-0">

                          <div

                            className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">

                            <h6 className="text-lg mb-0">Leave Requests</h6>

                            <div className="dropdown">

                              <button type="button" data-bs-toggle="dropdown" aria-expanded="false">

                                <iconify-icon icon="entypo:dots-three-vertical"

                                  className="icon text-secondary-light"></iconify-icon>

                              </button>

                              <ul className="dropdown-menu p-12 border bg-base shadow">

                                <li>

                                  <button type="button"

                                    className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"

                                    data-bs-toggle="modal" data-bs-target="#exampleModalView">

                                    <iconify-icon icon="hugeicons:view" className="icon text-lg line-height-1"></iconify-icon>

                                    View

                                  </button>

                                </li>

                                <li>

                                  <button type="button"

                                    className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"

                                    data-bs-toggle="modal" data-bs-target="#exampleModalEdit">

                                    <iconify-icon icon="lucide:edit" className="icon text-lg line-height-1"></iconify-icon>

                                    Edit

                                  </button>

                                </li>

                                <li>

                                  <button type="button"

                                    className="delete-item dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-danger-100 text-hover-danger-600 d-flex align-items-center gap-10"

                                    data-bs-toggle="modal" data-bs-target="#exampleModalDelete">

                                    <iconify-icon icon="fluent:delete-24-regular"

                                      className="icon text-lg line-height-1"></iconify-icon>

                                    Delete

                                  </button>

                                </li>

                              </ul>

                            </div>

                          </div>

                          <div className="ps-20 pt-20 pb-20">

                            <div className="pe-20 d-flex flex-column gap-28 max-h-462-px overflow-y-auto scroll-sm">

                              {leaveRequestsLoading ? (
                                <div className="text-center py-20">
                                  <span className="text-secondary-light">Loading leave requests...</span>
                                </div>
                              ) : leaveRequests.length === 0 ? (
                                <div className="text-center py-20">
                                  <span className="text-secondary-light">No leave requests found for this scope.</span>
                                </div>
                              ) : (
                                leaveRequests.map((item, idx) => (
                                  <div key={item.id || idx} className="d-flex align-items-center justify-content-between gap-16">

                                    <div className="d-flex align-items-start gap-16">

                                      <img src={getLeaveThumb(idx)} alt="Thumbnail"

                                        className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0" />

                                      <div className="">

                                        <h6 className="mb-0 text-lg">{item.applicantName || 'Unknown Applicant'}</h6>

                                        <span className="text-secondary-light text-sm mb-0">{item.designationName || item.applicantType || 'Staff'}</span>

                                      </div>

                                    </div>

                                    <div className="text-end d-flex flex-column align-items-end gap-4">

                                      <span className={statusBadgeClass(item.status)}>
                                        {statusLabel(item.status)}
                                      </span>

                                      <span className="d-block fw-bold text-primary-light">{calculateDays(item.leaveFrom, item.leaveTo)} Days</span>

                                      <p className="text-secondary-light text-sm mb-0">Apply on: {formatApplicationDate(item.applicationDate)}</p>

                                    </div>

                                  </div>
                                ))
                              )}

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

                <div className="col-xxl-4">

                  <div className="card h-100">

                    <div className="card-body p-0">

                      <div

                        className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">

                        <h6 className="text-lg mb-0">Calendar</h6>

                      </div>



                      <div className="p-20">
                        <MiniCalendar />
                      </div>



                      <div className="ps-20 pt-20 pb-20 border-top border-neutral-200">

                        <h6 className="text-lg mb-20">Upcoming Events</h6>

                        <div className="pe-20 d-flex flex-column gap-32 overflow-y-auto max-h-500-px scroll-sm">
                          {eventsLoading ? (
                            <div className="text-center py-20 text-secondary-light">
                              Loading upcoming events...
                            </div>
                          ) : events.length === 0 ? (
                            <div className="text-center py-20 text-secondary-light">
                              No upcoming events scheduled.
                            </div>
                          ) : (
                            events.map((event, index) => {
                              const borderColors = ['border-purple-600', 'border-warning-600', 'border-blue-600', 'border-success-600', 'border-primary-600']
                              const borderClass = borderColors[index % borderColors.length]
                              const dateRange = formatDateRange(event.fromDate, event.toDate)

                              return (
                                <div key={event.id} className="d-flex align-items-center justify-content-between gap-16">
                                  <div className={`ps-10 border-start-width-3-px ${borderClass}`}>
                                    <div className="d-flex align-items-end gap-6">
                                      <h6 className="text-md fw-semibold mb-0">{dateRange}</h6>
                                    </div>
                                    <p className="text-secondary-light mt-4 mb-2 text-sm fw-medium">{event.title}</p>
                                    <p className="text-xs text-secondary-light mb-0">
                                      {event.eventPlace ? `At: ${event.eventPlace}` : ''}
                                      {event.eventFor ? ` (For: ${event.eventFor})` : ''}
                                    </p>
                                  </div>
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedEventDetails(event)}
                                      className="py-6 px-16 radius-4 bg-neutral-100 text-secondary-light fw-semibold bg-hover-primary-600 hover-text-white border-0"
                                    >
                                      View
                                    </button>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            <div className="col-xxl-4 col-lg-6">

              <div className="card h-100">

                <div className="card-body p-0">

                  <div

                    className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">

                    <div className="d-flex align-items-center gap-10">
                      <span className="w-32-px h-32-px bg-primary-50 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                        <i className="ri-shield-user-line text-primary-300 text-lg" aria-hidden="true" />
                      </span>
                      <h6 className="text-lg mb-0">User Overview</h6>
                    </div>

                    <div className="dropdown">

                      <button type="button" data-bs-toggle="dropdown" aria-expanded="false">

                        <iconify-icon icon="entypo:dots-three-vertical" className="icon text-secondary-light"></iconify-icon>

                      </button>

                      <ul className="dropdown-menu p-12 border bg-base shadow">

                        <li>

                          <button type="button"

                            className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"

                            data-bs-toggle="modal" data-bs-target="#exampleModalView">

                            <iconify-icon icon="hugeicons:view" className="icon text-lg line-height-1"></iconify-icon>

                            View

                          </button>

                        </li>

                        <li>

                          <button type="button"

                            className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"

                            data-bs-toggle="modal" data-bs-target="#exampleModalEdit">

                            <iconify-icon icon="lucide:edit" className="icon text-lg line-height-1"></iconify-icon>

                            Edit

                          </button>

                        </li>

                        <li>

                          <button type="button"

                            className="delete-item dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-danger-100 text-hover-danger-600 d-flex align-items-center gap-10"

                            data-bs-toggle="modal" data-bs-target="#exampleModalDelete">

                            <iconify-icon icon="fluent:delete-24-regular" className="icon text-lg line-height-1"></iconify-icon>

                            Delete

                          </button>

                        </li>

                      </ul>

                    </div>

                  </div>

                  <div className="p-20">

                    <div>

                      <div className="mt-40 mb-24 pe-110 position-relative max-w-288-px mx-auto">

                        <div

                          className="w-170-px h-170-px rounded-circle z-1 position-relative d-inline-flex justify-content-center align-items-center">

                          <img src="/assets/images/icons/radial-bg1.png" alt="Image"

                            className="position-absolute top-0 start-0 z-n1 w-100 h-100 object-fit-cover" />

                          <h5 className="text-white"> {studentPercentLabel} </h5>

                        </div>

                        <div

                          className="w-144-px h-144-px rounded-circle z-1 position-relative d-inline-flex justify-content-center align-items-center position-absolute top-0 end-0 mt--36">

                          <img src="/assets/images/icons/radial-bg2.png" alt="Image"

                            className="position-absolute top-0 start-0 z-n1 w-100 h-100 object-fit-cover" />

                          <h5 className="text-white"> {teacherPercentLabel} </h5>

                        </div>

                        <div

                          className="w-110-px h-110-px rounded-circle z-1 position-relative d-inline-flex justify-content-center align-items-center position-absolute bottom-0 start-50 translate-middle-x ms-48">

                          <img src="/assets/images/icons/radial-bg3.png" alt="Image"

                            className="position-absolute top-0 start-0 z-n1 w-100 h-100 object-fit-cover" />

                          <h5 className="text-white"> {staffPercentLabel} </h5>

                        </div>

                      </div>



                      <div className="d-flex align-items-center flex-wrap gap-24 justify-content-evenly">

                        <div className="d-flex flex-column align-items-start">

                          <div className="d-flex align-items-center gap-2">

                            <span className="w-12-px h-12-px rounded-pill bg-success-600"></span>

                            <span className="text-secondary-light text-sm fw-normal">Student</span>

                          </div>

                          <h6 className="text-primary-light fw-semibold mb-0 mt-4 text-lg">{studentCountLabel}</h6>

                        </div>

                        <div className="d-flex flex-column align-items-start">

                          <div className="d-flex align-items-center gap-2">

                            <span className="w-12-px h-12-px rounded-pill bg-warning-600"></span>

                            <span className="text-secondary-light text-sm fw-normal">Teacher</span>

                          </div>

                          <h6 className="text-primary-light fw-semibold mb-0 mt-4 text-lg">{teacherCountLabel}</h6>

                        </div>

                        <div className="d-flex flex-column align-items-start">

                          <div className="d-flex align-items-center gap-2">

                            <span className="w-12-px h-12-px rounded-pill bg-blue-600"></span>

                            <span className="text-secondary-light text-sm fw-normal">Staffs </span>

                          </div>

                          <h6 className="text-primary-light fw-semibold mb-0 mt-4 text-lg">{staffCountLabel}</h6>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            <div className="col-xxl-8 col-lg-6">

              <div className="card h-100">

                <div className="card-body p-0">

                  <div

                    className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">

                    <div className="d-flex align-items-center gap-10">
                      <span className="w-32-px h-32-px bg-primary-50 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                        <img src="/assets/images/icons/price-icon3.png" alt="Income vs Expense" className="w-20-px h-20-px" />
                      </span>
                      <h6 className="text-lg mb-0">Income Vs Expense</h6>
                    </div>

                    <div className="dropdown">

                      <button type="button" data-bs-toggle="dropdown" aria-expanded="false">

                        <iconify-icon icon="entypo:dots-three-vertical" className="icon text-secondary-light"></iconify-icon>

                      </button>

                      <ul className="dropdown-menu p-12 border bg-base shadow">

                        <li>

                          <button type="button"

                            className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"

                            data-bs-toggle="modal" data-bs-target="#exampleModalView">

                            <iconify-icon icon="hugeicons:view" className="icon text-lg line-height-1"></iconify-icon>

                            View

                          </button>

                        </li>

                        <li>

                          <button type="button"

                            className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"

                            data-bs-toggle="modal" data-bs-target="#exampleModalEdit">

                            <iconify-icon icon="lucide:edit" className="icon text-lg line-height-1"></iconify-icon>

                            Edit

                          </button>

                        </li>

                        <li>

                          <button type="button"

                            className="delete-item dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-danger-100 text-hover-danger-600 d-flex align-items-center gap-10"

                            data-bs-toggle="modal" data-bs-target="#exampleModalDelete">

                            <iconify-icon icon="fluent:delete-24-regular" className="icon text-lg line-height-1"></iconify-icon>

                            Delete

                          </button>

                        </li>

                      </ul>

                    </div>

                  </div>

                  <div className="p-20">

              
                    <div className="w-100">
                      <div className="mb-16 d-flex flex-wrap justify-content-center gap-24">
                        <div className="d-flex align-items-center gap-10">
                          <span
                            className="w-12-px h-12-px rounded-circle"
                            style={{ background: '#25A194', border: '2px solid rgba(0,0,0,0.06)' }}
                          ></span>
                          <span className="text-secondary-light text-md">
                            Income: <span className="text-primary-light fw-bold">{totalIncomeLabel}</span>
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-10">
                          <span
                            className="w-12-px h-12-px rounded-circle"
                            style={{ background: '#FF7A2C', border: '2px solid rgba(0,0,0,0.06)' }}
                          ></span>
                          <span className="text-secondary-light text-md">
                            Expense: <span className="text-primary-light fw-bold">{totalExpenseLabel}</span>
                          </span>
                        </div>
                      </div>

                      <StepAreaChart
                        labels={incomeExpenseChartLabels}
                        series={incomeExpenseChartSeries}
                        height={260}
                        maxValue={chartMaxValue}
                        tooltip
                        valueFormatter={(v) => `$${v}k`}
                      />
                    </div>

                  </div>

                </div>

              </div>

            </div>

            <div className="col-xxl-4 col-lg-6">

              <div className="card h-100">

                <div className="card-body p-0">

                  <div

                    className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">

                    <h6 className="text-lg mb-0">Top Teachers</h6>

                    <div className="dropdown">

                      <button type="button" data-bs-toggle="dropdown" aria-expanded="false">

                        <iconify-icon icon="entypo:dots-three-vertical" className="icon text-secondary-light"></iconify-icon>

                      </button>

                      <ul className="dropdown-menu p-12 border bg-base shadow">

                        <li>

                          <button type="button"

                            className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"

                            data-bs-toggle="modal" data-bs-target="#exampleModalView">

                            <iconify-icon icon="hugeicons:view" className="icon text-lg line-height-1"></iconify-icon>

                            View

                          </button>

                        </li>

                        <li>

                          <button type="button"

                            className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"

                            data-bs-toggle="modal" data-bs-target="#exampleModalEdit">

                            <iconify-icon icon="lucide:edit" className="icon text-lg line-height-1"></iconify-icon>

                            Edit

                          </button>

                        </li>

                        <li>

                          <button type="button"

                            className="delete-item dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-danger-100 text-hover-danger-600 d-flex align-items-center gap-10"

                            data-bs-toggle="modal" data-bs-target="#exampleModalDelete">

                            <iconify-icon icon="fluent:delete-24-regular" className="icon text-lg line-height-1"></iconify-icon>

                            Delete

                          </button>

                        </li>

                      </ul>

                    </div>

                  </div>

                  <div className="ps-20 pt-20 pb-20">

                    <div className="pe-20 d-flex flex-column gap-20 max-h-462-px overflow-y-auto scroll-sm">

                      <div className="d-flex align-items-center justify-content-between gap-16">

                        <div className="d-flex align-items-start gap-16">

                          <img src="/assets/images/thumbs/top-teacher-img1.png" alt="Thumbnail"

                            className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0" />

                          <div className="">

                            <h6 className="mb-0 text-lg">Theresa Webb</h6>

                            <span className="text-secondary-light text-sm mb-0">example@gmail.com</span>

                          </div>

                        </div>

                        <div className="text-end">

                          <span className="d-block fw-semibold text-primary-light">Mathematics</span>

                        </div>

                      </div>

                      <div className="d-flex align-items-center justify-content-between gap-16">

                        <div className="d-flex align-items-start gap-16">

                          <img src="/assets/images/thumbs/top-teacher-img2.png" alt="Thumbnail"

                            className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0" />

                          <div className="">

                            <h6 className="mb-0 text-lg">Darrell Steward</h6>

                            <span className="text-secondary-light text-sm mb-0">example@gmail.com</span>

                          </div>

                        </div>

                        <div className="text-end">

                          <span className="d-block fw-semibold text-primary-light">Physics</span>

                        </div>

                      </div>

                      <div className="d-flex align-items-center justify-content-between gap-16">

                        <div className="d-flex align-items-start gap-16">

                          <img src="/assets/images/thumbs/top-teacher-img3.png" alt="Thumbnail"

                            className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0" />

                          <div className="">

                            <h6 className="mb-0 text-lg">Jane Cooper</h6>

                            <span className="text-secondary-light text-sm mb-0">example@gmail.com</span>

                          </div>

                        </div>

                        <div className="text-end">

                          <span className="d-block fw-semibold text-primary-light">Biology</span>

                        </div>

                      </div>

                      <div className="d-flex align-items-center justify-content-between gap-16">

                        <div className="d-flex align-items-start gap-16">

                          <img src="/assets/images/thumbs/top-teacher-img4.png" alt="Thumbnail"

                            className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0" />

                          <div className="">

                            <h6 className="mb-0 text-lg">Savannah Nguyen</h6>

                            <span className="text-secondary-light text-sm mb-0">example@gmail.com</span>

                          </div>

                        </div>

                        <div className="text-end">

                          <span className="d-block fw-semibold text-primary-light">English</span>

                        </div>

                      </div>

                      <div className="d-flex align-items-center justify-content-between gap-16">

                        <div className="d-flex align-items-start gap-16">

                          <img src="/assets/images/thumbs/top-teacher-img5.png" alt="Thumbnail"

                            className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0" />

                          <div className="">

                            <h6 className="mb-0 text-lg">Eleanor Pena</h6>

                            <span className="text-secondary-light text-sm mb-0">example@gmail.com</span>

                          </div>

                        </div>

                        <div className="text-end">

                          <span className="d-block fw-semibold text-primary-light">Math</span>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            <div className="col-xxl-4 col-lg-6">

              <div className="card h-100">

                <div className="card-body p-0">

                  <div

                    className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">

                    <div className="d-flex align-items-center gap-10">
                      <span className="w-32-px h-32-px bg-primary-50 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                        <i className="ri-user-add-line text-primary-300 text-lg" aria-hidden="true" />
                      </span>
                      <h6 className="text-lg mb-0">New Admissions</h6>
                    </div>

                    <div className="dropdown">

                      <button type="button" data-bs-toggle="dropdown" aria-expanded="false">

                        <iconify-icon icon="entypo:dots-three-vertical" className="icon text-secondary-light"></iconify-icon>

                      </button>

                      <ul className="dropdown-menu p-12 border bg-base shadow">

                        <li>

                          <button type="button"

                            className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"

                            data-bs-toggle="modal" data-bs-target="#exampleModalView">

                            <iconify-icon icon="hugeicons:view" className="icon text-lg line-height-1"></iconify-icon>

                            View

                          </button>

                        </li>

                        <li>

                          <button type="button"

                            className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"

                            data-bs-toggle="modal" data-bs-target="#exampleModalEdit">

                            <iconify-icon icon="lucide:edit" className="icon text-lg line-height-1"></iconify-icon>

                            Edit

                          </button>

                        </li>

                        <li>

                          <button type="button"

                            className="delete-item dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-danger-100 text-hover-danger-600 d-flex align-items-center gap-10"

                            data-bs-toggle="modal" data-bs-target="#exampleModalDelete">

                            <iconify-icon icon="fluent:delete-24-regular" className="icon text-lg line-height-1"></iconify-icon>

                            Delete

                          </button>

                        </li>

                      </ul>

                    </div>

                  </div>

                  <div className="p-20">

                    <div className="position-relative text-center">

                      <AdmissionsDonutChart />

                      
                    </div>

                    

                  </div>

                </div>

              </div>

            </div>

            <div className="col-xxl-4">

              <div className="card radius-12 border-0 h-100">

                <div

                  className="d-flex align-items-center flex-wrap gap-2 justify-content-between py-12 px-20 border-bottom border-neutral-200">

                  <h6 className="mb-2 fw-bold text-lg">Top Student</h6>

                  <div className="dropdown">

                    <button type="button" data-bs-toggle="dropdown" aria-expanded="false">

                      <iconify-icon icon="entypo:dots-three-vertical" className="icon text-secondary-light"></iconify-icon>

                    </button>

                    <ul className="dropdown-menu p-12 border bg-base shadow">

                      <li>

                        <button type="button"

                          className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"

                          data-bs-toggle="modal" data-bs-target="#exampleModalView">

                          <iconify-icon icon="hugeicons:view" className="icon text-lg line-height-1"></iconify-icon>

                          View

                        </button>

                      </li>

                      <li>

                        <button type="button"

                          className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"

                          data-bs-toggle="modal" data-bs-target="#exampleModalEdit">

                          <iconify-icon icon="lucide:edit" className="icon text-lg line-height-1"></iconify-icon>

                          Edit

                        </button>

                      </li>

                      <li>

                        <button type="button"

                          className="delete-item dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-danger-100 text-hover-danger-600 d-flex align-items-center gap-10"

                          data-bs-toggle="modal" data-bs-target="#exampleModalDelete">

                          <iconify-icon icon="fluent:delete-24-regular" className="icon text-lg line-height-1"></iconify-icon>

                          Delete

                        </button>

                      </li>

                    </ul>

                  </div>

                </div>

                <div className="card-body">

                  <div className="d-flex flex-column gap-28">

                    <div className="top-student-row d-flex align-items-center justify-content-between gap-10">

                      <div className="d-flex align-items-center gap-12">

                        <span className="w-44-px h-44-px rounded-circle d-flex justify-content-center align-items-center">

                          <img src="/assets/images/thumbs/avatar-img1.png"

                            className="w-44-px h-44-px object-fit-cover rounded-circle" alt="Icon" />

                        </span>

                        <div>
                          <div className="top-student-name">Brooklyn Simmons</div>
                          <div className="top-student-class text-secondary-light">Class: Six</div>
                        </div>

                      </div>

                      <div className="top-student-marks">
                        <div className="top-student-marks-label">Marks</div>
                        <ProgressRing value={20} color="#2F6BFF" label="Marks 20" />
                      </div>

                    </div>



                    <div className="top-student-row d-flex align-items-center justify-content-between gap-10">

                      <div className="d-flex align-items-center gap-12">

                        <span className="w-44-px h-44-px rounded-circle d-flex justify-content-center align-items-center">

                          <img src="/assets/images/thumbs/avatar-img2.png"

                            className="w-44-px h-44-px object-fit-cover rounded-circle" alt="Icon" />

                        </span>

                        <div>
                          <div className="top-student-name">Floyd Miles</div>
                          <div className="top-student-class text-secondary-light">Class: Seven</div>
                        </div>

                      </div>

                      <div className="top-student-marks">
                        <div className="top-student-marks-label">Marks</div>
                        <ProgressRing value={35} color="#FF7A2C" label="Marks 35" />
                      </div>

                    </div>



                    <div className="top-student-row d-flex align-items-center justify-content-between gap-10">

                      <div className="d-flex align-items-center gap-12">

                        <span className="w-44-px h-44-px rounded-circle d-flex justify-content-center align-items-center">

                          <img src="/assets/images/thumbs/avatar-img2.png"

                            className="w-44-px h-44-px object-fit-cover rounded-circle" alt="Icon" />

                        </span>

                        <div>
                          <div className="top-student-name">Courtney Henry</div>
                          <div className="top-student-class text-secondary-light">Class: Eight</div>
                        </div>

                      </div>

                      <div className="top-student-marks">
                        <div className="top-student-marks-label">Marks</div>
                        <ProgressRing value={45} color="#FFB020" label="Marks 45" />
                      </div>

                    </div>



                    <div className="top-student-row d-flex align-items-center justify-content-between gap-10">

                      <div className="d-flex align-items-center gap-12">

                        <span className="w-44-px h-44-px rounded-circle d-flex justify-content-center align-items-center">

                          <img src="/assets/images/thumbs/avatar-img4.png"

                            className="w-44-px h-44-px object-fit-cover rounded-circle" alt="Icon" />

                        </span>

                        <div>
                          <div className="top-student-name">Kathryn Murphy</div>
                          <div className="top-student-class text-secondary-light">Class: Nine</div>
                        </div>

                      </div>

                      <div className="top-student-marks">
                        <div className="top-student-marks-label">Marks</div>
                        <ProgressRing value={65} color="#22A06B" label="Marks 65" />
                      </div>

                    </div>



                    <div className="top-student-row d-flex align-items-center justify-content-between gap-10">

                      <div className="d-flex align-items-center gap-12">

                        <span className="w-44-px h-44-px rounded-circle d-flex justify-content-center align-items-center">

                          <img src="/assets/images/thumbs/avatar-img5.png"

                            className="w-44-px h-44-px object-fit-cover rounded-circle" alt="Icon" />

                        </span>

                        <div>
                          <div className="top-student-name">Annette Black</div>
                          <div className="top-student-class text-secondary-light">Class: Ten</div>
                        </div>

                      </div>

                      <div className="top-student-marks">
                        <div className="top-student-marks-label">Marks</div>
                        <ProgressRing value={65} color="#2F6BFF" label="Marks 65" />
                      </div>

                    </div>



                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>



      <footer className="d-footer">
        <div className="">
          <p className="mb-0 text-center">
            {' '}
            &copy; <span className="current-year"></span> Made With &#10084;
          </p>
        </div>
      </footer>

      {selectedEventDetails && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 radius-12 shadow-lg">
              <div className="modal-header border-bottom border-neutral-200 bg-base px-24 py-16">
                <h5 className="modal-title text-primary-light fw-bold text-lg">{selectedEventDetails.title}</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedEventDetails(null)} aria-label="Close"></button>
              </div>
              <div className="modal-body px-24 py-20">
                {selectedEventDetails.image && (
                  <div className="text-center mb-16 rounded overflow-hidden">
                    <img
                      src={selectedEventDetails.image}
                      alt={selectedEventDetails.title}
                      style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'cover' }}
                      className="w-100"
                    />
                  </div>
                )}
                <div className="d-flex flex-column gap-12">
                  <div className="d-flex align-items-center gap-8">
                    <span className="text-secondary-light fw-medium text-sm">Date:</span>
                    <span className="text-primary-light fw-semibold text-sm">{formatDateRange(selectedEventDetails.fromDate, selectedEventDetails.toDate)}</span>
                  </div>
                  {selectedEventDetails.eventPlace && (
                    <div className="d-flex align-items-center gap-8">
                      <span className="text-secondary-light fw-medium text-sm">Place:</span>
                      <span className="text-primary-light fw-semibold text-sm">{selectedEventDetails.eventPlace}</span>
                    </div>
                  )}
                  {selectedEventDetails.eventFor && (
                    <div className="d-flex align-items-center gap-8">
                      <span className="text-secondary-light fw-medium text-sm">Audience:</span>
                      <span className="text-primary-light fw-semibold text-sm">{selectedEventDetails.eventFor}</span>
                    </div>
                  )}
                  {selectedEventDetails.note && (
                    <div className="mt-8 border-top border-neutral-100 pt-12">
                      <span className="text-secondary-light fw-medium text-sm d-block mb-4">Note:</span>
                      <p className="text-secondary-light text-sm mb-0">{selectedEventDetails.note}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-top border-neutral-200 px-24 py-12">
                <button type="button" className="btn btn-secondary py-6 px-16 radius-4" onClick={() => setSelectedEventDetails(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  )
}

export default Dashboard
  
