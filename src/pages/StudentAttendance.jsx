import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import TablePagination from '../components/table/TablePagination'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import ExportDropdown from '../components/ExportDropdown'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchStudentsPage } from '../apis/studentsApi'
import { fetchLeaveCoverage } from '../apis/leaveApplicationsApi'
import {
  createAttendance,
  fetchAttendances,
} from '../apis/attendanceApi'
import '../assets/css/addModalShared.css'

const DAILY_EXAM_TERM = 'Daily Attendance'
const ATTENDANCE_SUBJECT = 'Attendance'

const STATUS_OPTIONS = [
  { value: 'Present', label: 'Present', className: 'bg-success-100 text-success-600' },
  { value: 'Absent', label: 'Absent', className: 'bg-danger-100 text-danger-600' },
  { value: 'Late', label: 'Late', className: 'bg-warning-100 text-warning-600' },
]

const STATUS_INLINE_STYLES = {
  Present: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    borderColor: '#bbf7d0',
  },
  Absent: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderColor: '#fecaca',
  },
  Late: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
    borderColor: '#fde68a',
  },
}

const todayIso = () => new Date().toISOString().slice(0, 10)

const emptyPendingFilters = {
  headOfficeId: '',
  schoolId: '',
  classId: 'Select',
  sectionId: 'Select',
  date: todayIso(),
}

const columnOptions = [
  { key: 'school', label: 'School', defaultVisible: false },
  { key: 'photo', label: 'Photo', defaultVisible: false },
  { key: 'name', label: 'Name' },
  { key: 'rollNo', label: 'Roll No' },
  { key: 'className', label: 'Class' },
  { key: 'sectionName', label: 'Section' },
  { key: 'date', label: 'Date', defaultVisible: false },
  { key: 'status', label: 'Status' },
]

const normalizeText = (value) => String(value ?? '').trim()

const normalizeStatus = (value) => {
  const text = normalizeText(value).toLowerCase()
  if (text === 'present') return 'Present'
  if (text === 'absent') return 'Absent'
  if (text === 'late') return 'Late'
  if (text === 'leave' || text === 'on leave' || text === 'onleave') return 'Leave'
  return ''
}

const pickStudentKey = (row) => String(row?.id ?? row?.studentId ?? row?.rollNo ?? row?.name ?? '').trim()

const pickStudentRollNo = (row) => normalizeText(row?.rollNo ?? row?.studentRollNo ?? '')

const normalizeIdentity = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()

const buildAttendanceKeys = (row, date) => {
  const keys = []
  const normalizedDate = normalizeIdentity(date)
  const name = normalizeIdentity(row?.name)
  const rollNo = normalizeIdentity(row?.rollNo ?? row?.studentRollNo)
  const phone = normalizeIdentity(row?.phone)
  const className = normalizeIdentity(row?.className)
  const sectionName = normalizeIdentity(row?.sectionName || row?.section)

  if (rollNo && normalizedDate) keys.push(`roll:${rollNo}|date:${normalizedDate}`)
  if (name && phone && normalizedDate) keys.push(`name:${name}|phone:${phone}|class:${className}|section:${sectionName}|date:${normalizedDate}`)
  if (name && className && sectionName && normalizedDate) keys.push(`name:${name}|class:${className}|section:${sectionName}|date:${normalizedDate}`)
  if (name && normalizedDate) keys.push(`name:${name}|date:${normalizedDate}`)

  return keys
}

const StudentAttendance = () => {
  const { role, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions, setActiveSchoolId, isSchoolSelectionEnabled } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = String(role || '').toUpperCase() === 'HEAD_OFFICE_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const buildDefaultFilters = useCallback(() => {
    const schoolId = !isSuperAdmin && !isHeadOfficeAdmin ? String(activeSchoolId || authSchoolId || '') : ''
    const headOfficeId = (isHeadOfficeAdmin || (!isSuperAdmin && authHeadOfficeId != null))
      ? String(authHeadOfficeId ?? '')
      : ''
    return {
      headOfficeId,
      schoolId,
      classId: 'Select',
      sectionId: 'Select',
      date: todayIso(),
    }
  }, [activeSchoolId, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSuperAdmin])

  const [students, setStudents] = useState([])
  const [attendanceRows, setAttendanceRows] = useState([])
  const [classRows, setClassRows] = useState([])
  const [sectionRows, setSectionRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(() => buildDefaultFilters())
  const [filters, setFilters] = useState(() => buildDefaultFilters())
  const [drafts, setDrafts] = useState({})
  const [allFilteredUniformStatus, setAllFilteredUniformStatus] = useState('')
  const [leaveByStudentId, setLeaveByStudentId] = useState(() => new Map())
  const [studentTotalElements, setStudentTotalElements] = useState(0)
  const [studentTotalPages, setStudentTotalPages] = useState(1)
  const [savedStudentKeys, setSavedStudentKeys] = useState(() => new Set())
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const selectedHeadOfficeId =
    normalizeText(filters.headOfficeId) || (authHeadOfficeId != null ? String(authHeadOfficeId) : '')

  const selectedSchoolId = isSuperAdmin || isHeadOfficeAdmin
    ? normalizeText(filters.schoolId)
    : normalizeText(filters.schoolId) || String(activeSchoolId || authSchoolId || '')

  const scopeSchoolOptions = useMemo(() => {
    const rows = Array.isArray(contextSchoolOptions) ? contextSchoolOptions : []
    if (isSuperAdmin) return manualScope.schoolOptions || []
    if (authHeadOfficeId != null) {
      return rows.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId))
    }
    return rows
  }, [authHeadOfficeId, contextSchoolOptions, isSuperAdmin, manualScope.schoolOptions])

  const headOfficeOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.headOffices || []
    if (authHeadOfficeId != null) {
      return [{ id: authHeadOfficeId, name: authHeadOfficeName || `Head Office ${authHeadOfficeId}` }]
    }
    return []
  }, [authHeadOfficeId, authHeadOfficeName, isSuperAdmin, manualScope.headOffices])

  const selectedClassOption = useMemo(() => {
    const classId = normalizeText(filters.classId)
    if (!classId || classId === 'Select') return null
    return classRows.find((row) => String(row?.id ?? '') === classId) || null
  }, [classRows, filters.classId])

  const selectedSectionOption = useMemo(() => {
    const sectionId = normalizeText(filters.sectionId)
    if (!sectionId || sectionId === 'Select') return null
    return sectionRows.find((row) => String(row?.id ?? '') === sectionId) || null
  }, [filters.sectionId, sectionRows])

  const selectedClassLabel = useMemo(() => {
    if (!selectedClassOption) return ''
    return (
      selectedClassOption.className ||
      selectedClassOption.name ||
      selectedClassOption.numericName ||
      `Class ${selectedClassOption.id}`
    )
  }, [selectedClassOption])

  const selectedSectionLabel = useMemo(() => {
    if (!selectedSectionOption) return ''
    return selectedSectionOption.sectionName || selectedSectionOption.name || `Section ${selectedSectionOption.id}`
  }, [selectedSectionOption])

  const classOptions = useMemo(
    () =>
      (Array.isArray(classRows) ? classRows : [])
        .map((row) => ({
          id: String(row?.id ?? ''),
          label:
            row?.className ||
            row?.name ||
            row?.numericName ||
            `Class ${row?.id ?? ''}`,
        }))
        .filter((row) => row.id),
    [classRows],
  )

  const sectionOptions = useMemo(
    () =>
      (Array.isArray(sectionRows) ? sectionRows : [])
        .map((row) => ({
          id: String(row?.id ?? ''),
          label: row?.sectionName || row?.name || `Section ${row?.id ?? ''}`,
        }))
        .filter((row) => row.id),
    [sectionRows],
  )

  const attendanceByRollNo = useMemo(() => {
    const map = new Map()
    const sorted = [...(Array.isArray(attendanceRows) ? attendanceRows : [])].sort(
      (a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0),
    )
    sorted.forEach((row) => {
      const rollNo = pickStudentRollNo(row)
      const date = normalizeText(row?.attendanceDate)
      if (!rollNo || !date) return
      if (normalizeText(date) !== normalizeText(filters.date)) return
      if (!map.has(rollNo)) {
        map.set(rollNo, {
          id: row?.id ?? null,
          status: normalizeStatus(row?.attendAll),
          attendanceDate: date,
          headOfficeId: row?.headOfficeId ?? null,
          schoolId: row?.schoolId ?? null,
          className: row?.className || '',
          sectionName: row?.sectionName || '',
          subjectName: row?.subjectName || '',
        })
      }
    })
    return map
  }, [attendanceRows, filters.date])

  const attendanceLookup = useMemo(() => {
    const map = new Map()
    const sorted = [...(Array.isArray(attendanceRows) ? attendanceRows : [])].sort(
      (a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0),
    )

    sorted.forEach((row) => {
      const attendanceDate = normalizeIdentity(row?.attendanceDate)
      const keys = buildAttendanceKeys(row, attendanceDate)
      for (const key of keys) {
        if (!map.has(key)) {
          map.set(key, row)
        }
      }
    })

    return map
  }, [attendanceRows])

  const findAttendanceForStudent = useCallback(
    (student) => {
      const keys = buildAttendanceKeys(student, filters.date)
      for (const key of keys) {
        const match = attendanceLookup.get(key)
        if (match) return match
      }
      return null
    },
    [attendanceLookup, filters.date],
  )

  const resolveStudentRow = useCallback(
    (row) => {
      const key = pickStudentKey(row)
      const rollNo = pickStudentRollNo(row)
      const attendance = (rollNo ? attendanceByRollNo.get(rollNo) || null : null) || findAttendanceForStudent(row)
      const draft = drafts[key] || null
      const status = normalizeStatus(draft?.status || attendance?.status || '')
      const recordId = draft?.recordId ?? attendance?.id ?? null
      const isSaved = recordId != null || savedStudentKeys.has(key)
      return {
        key,
        id: row?.id ?? null,
        schoolId: row?.schoolId ?? null,
        schoolName: row?.schoolName || row?.school?.schoolName || row?.school?.name || authSchoolName || '',
        photo: row?.photoUrl || row?.photoPath || row?.photo || '',
        name: row?.name || '',
        rollNo,
        className: row?.className || row?.schoolClass?.className || row?.schoolClass?.name || '',
        sectionName: row?.section || row?.sectionName || row?.schoolSection?.sectionName || row?.schoolSection?.name || '',
        status,
        recordId,
        isSaved,
        attendanceDate: filters.date,
        note: draft?.note ?? attendance?.note ?? '',
        phone: row?.phone || '',
      }
    },
    [attendanceByRollNo, authSchoolName, drafts, findAttendanceForStudent, filters.date, savedStudentKeys],
  )

  const displayedStudents = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students
      .map((row) => resolveStudentRow(row))
      .filter((row) => {
        if (!q) return true
        return [row.name, row.rollNo, row.className, row.sectionName, row.schoolName, row.status]
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
  }, [resolveStudentRow, search, students])

  // Server-side pagination: `students` already contains only the current page.
  // Do not slice again client-side, otherwise later pages will appear empty.
  const paginatedStudents = useMemo(() => displayedStudents, [displayedStudents])

  // Load approved leave coverage for the visible roster (current page).
  useEffect(() => {
    if (!selectedSchoolId || !filters.date) {
      setLeaveByStudentId(new Map())
      return
    }

    const ids = paginatedStudents
      .map((s) => s?.id)
      .filter((v) => v != null)
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v))

    if (ids.length === 0) {
      setLeaveByStudentId(new Map())
      return
    }

    let cancelled = false
    const run = async () => {
      try {
        const rows = await fetchLeaveCoverage({
          schoolId: selectedSchoolId,
          applicantType: 'STUDENT',
          date: filters.date,
          applicantIds: ids,
        })
        if (cancelled) return
        const map = new Map()
        for (const row of Array.isArray(rows) ? rows : []) {
          if (row?.applicantId == null) continue
          map.set(String(row.applicantId), row)
        }
        setLeaveByStudentId(map)
      } catch {
        if (!cancelled) setLeaveByStudentId(new Map())
      }
    }
    void run()

    return () => {
      cancelled = true
    }
  }, [filters.date, paginatedStudents, selectedSchoolId])

  // Compute whether ALL students across the entire filtered dataset (all pages, including search)
  // share the same non-empty attendance status. Used to conditionally color the bulk header buttons.
  useEffect(() => {
    if (!selectedSchoolId || !filters.classId || filters.classId === 'Select' || !filters.date) {
      setAllFilteredUniformStatus('')
      return
    }

    let cancelled = false

    const handle = setTimeout(() => {
      const run = async () => {
        try {
          const pageSize = 100
          let page = 0
          let totalPagesFromServer = 1
          const allStudents = []

          while (page < totalPagesFromServer) {
            const studentPage = await fetchStudentsPage(page, pageSize, {
              headOfficeId: selectedHeadOfficeId || undefined,
              schoolId: selectedSchoolId || undefined,
              classId: filters.classId !== 'Select' ? filters.classId : undefined,
              sectionId: filters.sectionId !== 'Select' ? filters.sectionId : undefined,
            })

            const content = Array.isArray(studentPage?.content)
              ? studentPage.content
              : Array.isArray(studentPage)
                ? studentPage
                : []

            allStudents.push(...content)
            totalPagesFromServer = Number(studentPage?.totalPages ?? 1) || 1
            page += 1
          }

          const q = search.trim().toLowerCase()
          const resolved = allStudents
            // Resolve without using page-level leave map; uniform highlight needs to be based on DB/drafts only.
            .map((row) => {
              const key = pickStudentKey(row)
              const rollNo = pickStudentRollNo(row)
              const attendance = rollNo ? attendanceByRollNo.get(rollNo) || null : null
              const draft = drafts[key] || null
              const status = normalizeStatus(draft?.status || attendance?.status || '')
              return {
                id: row?.id ?? null,
                key,
                name: row?.name || '',
                rollNo,
                className: row?.className || row?.schoolClass?.className || row?.schoolClass?.name || '',
                sectionName: row?.section || row?.sectionName || row?.schoolSection?.sectionName || row?.schoolSection?.name || '',
                schoolName: row?.schoolName || row?.school?.schoolName || row?.school?.name || authSchoolName || '',
                status,
              }
            })
            .filter((row) => {
              if (!q) return true
              return [row.name, row.rollNo, row.className, row.sectionName, row.schoolName, row.status]
                .join(' ')
                .toLowerCase()
                .includes(q)
            })

          // If any Leave exists in the filtered set for this date, keep all header bulk buttons neutral.
          {
            const ids = resolved
              .map((r) => r?.id)
              .filter((v) => v != null)
              .map((v) => Number(v))
              .filter((v) => Number.isFinite(v))

            let anyLeave = false
            const batchSize = 200
            for (let i = 0; i < ids.length && !anyLeave; i += batchSize) {
              const batch = ids.slice(i, i + batchSize)
              if (batch.length === 0) continue
              const rows = await fetchLeaveCoverage({
                schoolId: selectedSchoolId,
                applicantType: 'STUDENT',
                date: filters.date,
                applicantIds: batch,
              })
              if (Array.isArray(rows) && rows.length > 0) anyLeave = true
            }
            if (anyLeave) {
              if (!cancelled) setAllFilteredUniformStatus('')
              return
            }
          }

          let uniform = ''
          if (resolved.length > 0) {
            const first = normalizeStatus(resolved[0]?.status)
            if (first) {
              const allSame = resolved.every((row) => normalizeStatus(row?.status) === first)
              uniform = allSame ? first : ''
            }
          }

          if (!cancelled) setAllFilteredUniformStatus(uniform)
        } catch {
          if (!cancelled) setAllFilteredUniformStatus('')
        }
      }

      void run()
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [
    drafts,
    filters.classId,
    filters.date,
    filters.sectionId,
    resolveStudentRow,
    search,
    selectedHeadOfficeId,
    selectedSchoolId,
  ])

  const loadScopeLookups = useCallback(async (schoolId, classId) => {
    if (!schoolId) {
      setClassRows([])
      setSectionRows([])
      return
    }

    const classData = await fetchClasses({ schoolId })
    const classes = Array.isArray(classData) ? classData : []
    setClassRows(classes)

    const selectedClassId = normalizeText(classId)
    if (!selectedClassId || selectedClassId === 'Select') {
      setSectionRows([])
      return
    }

    const selectedClass = classes.find((row) => String(row?.id ?? '') === selectedClassId)
    if (!selectedClass?.id) {
      setSectionRows([])
      return
    }

    const sectionData = await fetchSections({ schoolId, classId: selectedClass.id })
    setSectionRows(Array.isArray(sectionData) ? sectionData : [])
  }, [])

  const loadPageData = useCallback(async () => {
    if (!selectedSchoolId) {
      setStudents([])
      setAttendanceRows([])
      setError('')
      return
    }

    if (!filters.classId || filters.classId === 'Select' || !filters.date) {
      setStudents([])
      setAttendanceRows([])
      setError('')
      return
    }

    setLoading(true)
    setError('')

    try {
      const [studentPage, attendanceList] = await Promise.all([
        fetchStudentsPage(currentPage - 1, rowsPerPage, {
          headOfficeId: selectedHeadOfficeId || undefined,
          schoolId: selectedSchoolId || undefined,
          classId: filters.classId !== 'Select' ? filters.classId : undefined,
          sectionId: filters.sectionId !== 'Select' ? filters.sectionId : undefined,
        }),
        fetchAttendances({
          headOfficeId: selectedHeadOfficeId || undefined,
          schoolId: selectedSchoolId || undefined,
          examTerm: DAILY_EXAM_TERM,
          subjectName: ATTENDANCE_SUBJECT,
          attendanceDate: filters.date,
        }),
      ])

      const studentContent = Array.isArray(studentPage?.content)
        ? studentPage.content
        : Array.isArray(studentPage)
          ? studentPage
          : []

      setStudents(studentContent)
      setStudentTotalElements(Number(studentPage?.totalElements ?? studentContent.length) || 0)
      setStudentTotalPages(Math.max(1, Number(studentPage?.totalPages ?? 1) || 1))
      setAttendanceRows(Array.isArray(attendanceList) ? attendanceList : [])
    } catch (err) {
      setStudents([])
      setAttendanceRows([])
      setStudentTotalElements(0)
      setStudentTotalPages(1)
      setError(err?.message || 'Failed to load student attendance')
    } finally {
      setLoading(false)
    }
  }, [
    currentPage,
    filters.classId,
    filters.date,
    filters.sectionId,
    rowsPerPage,
    selectedClassLabel,
    selectedHeadOfficeId,
    selectedSchoolId,
    selectedSectionLabel,
  ])

  useEffect(() => {
    if (!pendingFilters.schoolId && !selectedSchoolId) {
      setClassRows([])
      setSectionRows([])
      return
    }

    let cancelled = false
    void loadScopeLookups(pendingFilters.schoolId || selectedSchoolId, pendingFilters.classId).catch((err) => {
      if (cancelled) return
      setClassRows([])
      setSectionRows([])
      setError(err?.message || 'Failed to load scope lookups')
    })

    return () => {
      cancelled = true
    }
  }, [loadScopeLookups, pendingFilters.classId, pendingFilters.schoolId, selectedSchoolId])

  useEffect(() => {
    void loadPageData()
  }, [loadPageData])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters.classId, filters.date, filters.sectionId, rowsPerPage, selectedSchoolId])

  useEffect(() => {
    if (filters.classId === 'Select') {
      setSectionRows([])
      setPendingFilters((prev) => ({ ...prev, sectionId: 'Select' }))
      setFilters((prev) => ({ ...prev, sectionId: 'Select' }))
      return
    }

    const stillValid = classOptions.some((option) => option.id === filters.classId)
    if (!stillValid && classOptions.length > 0) {
      setPendingFilters((prev) => ({ ...prev, classId: 'Select', sectionId: 'Select' }))
      setFilters((prev) => ({ ...prev, classId: 'Select', sectionId: 'Select' }))
      setDrafts({})
    }
  }, [classOptions, filters.classId])

  useEffect(() => {
    if (filters.classId === 'Select' || sectionOptions.length === 0) return
    if (filters.sectionId === 'Select') return
    const stillValid = sectionOptions.some((option) => option.id === filters.sectionId)
    if (!stillValid) {
      setPendingFilters((prev) => ({ ...prev, sectionId: 'Select' }))
      setFilters((prev) => ({ ...prev, sectionId: 'Select' }))
      setDrafts({})
    }
  }, [filters.classId, filters.sectionId, sectionOptions])

  useEffect(() => {
    if (isSuperAdmin) return
    if (isHeadOfficeAdmin && selectedSchoolId) {
      setActiveSchoolId(selectedSchoolId)
    }
  }, [isHeadOfficeAdmin, isSuperAdmin, selectedSchoolId, setActiveSchoolId])

  useEffect(() => {
    setPendingFilters((prev) => ({
      ...prev,
      classId: filters.classId,
      sectionId: filters.sectionId,
      date: filters.date,
    }))
  }, [filters.classId, filters.date, filters.sectionId])

  const handlePendingFilterChange = (event) => {
    const { id, value } = event.target
    setPendingFilters((prev) => {
      if (id === 'headOfficeId') {
        return { ...prev, headOfficeId: value, schoolId: '', classId: 'Select', sectionId: 'Select' }
      }
      if (id === 'schoolId') {
        return { ...prev, schoolId: value, classId: 'Select', sectionId: 'Select' }
      }
      if (id === 'classId') {
        return { ...prev, classId: value, sectionId: 'Select' }
      }
      return { ...prev, [id]: value }
    })
  }

  const handleApplyFilters = (event) => {
    event.preventDefault()
    if ((isSuperAdmin || isHeadOfficeAdmin) && !pendingFilters.headOfficeId) {
      return
    }
    if (!pendingFilters.schoolId) {
      return
    }
    if (!pendingFilters.classId || pendingFilters.classId === 'Select') {
      return
    }
    if (!pendingFilters.date) {
      return
    }
    setFilters(pendingFilters)
    setDrafts({})
    setSavedStudentKeys(new Set())
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    const reset = buildDefaultFilters()
    setPendingFilters(reset)
    setFilters(reset)
    setDrafts({})
    setSavedStudentKeys(new Set())
    setCurrentPage(1)
  }

  const setStudentStatus = useCallback((student, status) => {
    if (student?.recordId != null) return
    if (student?.id != null && leaveByStudentId.has(String(student.id))) return
    const key = student.key
    setDrafts((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        student,
        status,
        recordId: student.recordId || prev[key]?.recordId || null,
      },
    }))
  }, [leaveByStudentId])

  const applyBulkStatus = (status) => {
    setDrafts((prev) => {
      const next = { ...prev }
      paginatedStudents.forEach((student) => {
        if (student?.recordId != null) return
        if (student?.id != null && leaveByStudentId.has(String(student.id))) return
        next[student.key] = {
          ...(next[student.key] || {}),
          student,
          status,
          recordId: student.recordId || next[student.key]?.recordId || null,
        }
      })
      return next
    })
  }

  const dirtyDraftEntries = useMemo(() => {
    const entries = Object.values(drafts).filter((entry) => normalizeStatus(entry?.status))
    const leaveEntries = paginatedStudents
      .filter((s) => s?.recordId == null && s?.id != null && leaveByStudentId.has(String(s.id)))
      .map((s) => ({ student: s, status: 'Leave', recordId: null, note: '' }))
    return [...entries, ...leaveEntries]
  }, [drafts, leaveByStudentId, paginatedStudents])

  const saveAttendance = async () => {
    if (dirtyDraftEntries.length === 0) return
    setSaving(true)
    setError('')

    try {
      const savedKeys = []

      for (const entry of dirtyDraftEntries) {
        const student = entry.student || {}
        const studentLabel = `${student.name || 'Student'}${student.rollNo ? ` (Roll: ${student.rollNo})` : ''}`
        // Once a record is saved, it is view-only and should never be modified.
        if (entry.recordId) continue
        const payload = {
          headOfficeId: selectedHeadOfficeId ? Number(selectedHeadOfficeId) : null,
          schoolId: student.schoolId ? Number(student.schoolId) : selectedSchoolId ? Number(selectedSchoolId) : null,
          examTerm: DAILY_EXAM_TERM,
          className: selectedClassLabel || student.className || '',
          sectionName: selectedSectionLabel || student.sectionName || '',
          subjectName: ATTENDANCE_SUBJECT,
          name: student.name || '',
          phone: student.phone || '',
          rollNo: student.rollNo || '',
          photoPath: student.photo || '',
          attendAll: normalizeStatus(entry.status),
          attendanceDate: filters.date,
          note: entry.note || '',
        }

        let saved
        try {
          saved = await createAttendance(payload)
        } catch (e) {
          throw new Error(`${studentLabel}: ${e?.message || 'Create failed'}`)
        }
        const nextId = saved?.id ?? null
        if (nextId != null) {
          savedKeys.push(student.key)
          setDrafts((prev) => ({
            ...prev,
            [student.key]: {
              ...(prev[student.key] || {}),
              recordId: nextId,
              student,
              status: normalizeStatus(entry.status),
            },
          }))
        }
      }

      const refreshedAttendance = await fetchAttendances({
        headOfficeId: selectedHeadOfficeId || undefined,
        schoolId: selectedSchoolId || undefined,
        examTerm: DAILY_EXAM_TERM,
        subjectName: ATTENDANCE_SUBJECT,
        attendanceDate: filters.date,
      })
      setAttendanceRows(Array.isArray(refreshedAttendance) ? refreshedAttendance : [])
      // Clear local drafts after a successful save so the button disables and the UI reflects DB state.
      setDrafts({})
      if (savedKeys.length > 0) {
        setSavedStudentKeys((prev) => {
          const next = new Set(prev)
          for (const key of savedKeys) next.add(key)
          return next
        })
      }
      await loadPageData()
    } catch (err) {
      // Surfacing the error in both UI and console makes it easier to diagnose API issues.
      // eslint-disable-next-line no-console
      console.error('Failed to save attendance', err)
      setError(err?.message || 'Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  const loadExportRows = useCallback(async () => {
    if (!selectedSchoolId || !filters.classId || filters.classId === 'Select' || !filters.date) return []

    const pageSize = Math.max(rowsPerPage, 50)
    let page = 0
    let totalPagesFromServer = 1
    const allStudents = []

    while (page < totalPagesFromServer) {
      const studentPage = await fetchStudentsPage(page, pageSize, {
        headOfficeId: selectedHeadOfficeId || undefined,
        schoolId: selectedSchoolId || undefined,
        classId: filters.classId !== 'Select' ? filters.classId : undefined,
        sectionId: filters.sectionId !== 'Select' ? filters.sectionId : undefined,
      })

      const content = Array.isArray(studentPage?.content)
        ? studentPage.content
        : Array.isArray(studentPage)
          ? studentPage
          : []
      allStudents.push(...content)
      totalPagesFromServer = Number(studentPage?.totalPages ?? 1) || 1
      page += 1
    }

    const q = search.trim().toLowerCase()
    return allStudents
      .map((row) => resolveStudentRow(row))
      .filter((row) => {
        if (!q) return true
        return [row.name, row.rollNo, row.className, row.sectionName, row.schoolName, row.status]
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
  }, [
    filters.classId,
    filters.date,
    filters.sectionId,
    loadPageData,
    resolveStudentRow,
    rowsPerPage,
    search,
    selectedHeadOfficeId,
    selectedSchoolId,
  ])

  const exportColumns = useMemo(
    () => columnOptions.map((column) => ({ key: column.key, label: column.label })),
    [],
  )

  const mapExportRow = useCallback(
    (row) => ({
      school: row.schoolName || '',
      photo: row.photo || '',
      name: row.name || '',
      rollNo: row.rollNo || '',
      className: row.className || '',
      sectionName: row.sectionName || '',
      date: row.attendanceDate || filters.date || '',
      status: row.status || '',
    }),
    [filters.date],
  )

  const resolvedPageInfo =
    studentTotalElements === 0
      ? 'Showing 0 - 0 of 0 entries'
      : `Showing ${(currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, studentTotalElements)} of ${studentTotalElements} entries`

  const scopeSummary = useMemo(() => {
    const school = scopeSchoolOptions.find((row) => String(row?.id ?? '') === String(selectedSchoolId)) || null
    return {
      headOffice: selectedHeadOfficeId || '',
      school: school?.schoolName || school?.name || authSchoolName || '',
    }
  }, [authSchoolName, scopeSchoolOptions, selectedHeadOfficeId, selectedSchoolId])

  useEffect(() => {
    if (isSuperAdmin) return
    if (!isSchoolSelectionEnabled && authSchoolId) {
      setActiveSchoolId(String(authSchoolId))
    }
  }, [authSchoolId, isSchoolSelectionEnabled, isSuperAdmin, setActiveSchoolId])

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Student Attendance</h1>
          <span className="text-secondary-light">Attendance / Student Attendance</span>
        </div>
         <button
                type="button"
                className="btn btn-primary-600 px-16 py-8"
                onClick={saveAttendance}
                disabled={saving || dirtyDraftEntries.length === 0}
              >
                {saving ? 'Saving...' : `Save Attendance${dirtyDraftEntries.length > 0 ? ` (${dirtyDraftEntries.length})` : ''}`}
              </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-start gap-16">
              <ExportDropdown
                title="Export"
                rows={displayedStudents}
                loadRows={loadExportRows}
                columns={exportColumns}
                visibleColumns={visibleColumns}
                mapRow={mapExportRow}
                fileName="Student Attendance"
                sheetName="Student Attendance"
                pdfTitle="Student Attendance"
              />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                  Filter
                </span>
                <span>
                  <i className="ri-arrow-right-line"></i>
                </span>
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    Columns
                  </span>
                  <span>
                    <i className="ri-arrow-down-s-line"></i>
                  </span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  {columnOptions.map((column) => (
                    <li key={column.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={visibleColumns[column.key]}
                          onChange={() => toggleColumn(column.key)}
                        />
                        {column.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <RowsPerPageSelect
                value={rowsPerPage}
                onChange={(value) => {
                  setRowsPerPage(value)
                  setCurrentPage(1)
                }}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />

             
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search attendance..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setCurrentPage(1)
                }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          {error ? (
            <div className="px-20 pt-16">
              <div className="alert alert-danger mb-0" role="alert">
                {error}
              </div>
            </div>
          ) : null}

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table w-100" style={{ tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <th scope="col" style={{ width: 80 }}>S.L</th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.photo ? <th scope="col">Photo</th> : null}
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.rollNo ? <th scope="col">Roll No</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.sectionName ? <th scope="col">Section</th> : null}
                  {visibleColumns.date ? <th scope="col">Date</th> : null}
                  {visibleColumns.status ? (
                    <th scope="col">
                      <div
                        className="d-flex align-items-center gap-8 flex-wrap w-100"
                      >
                          {STATUS_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`px-10 py-4 radius-8 border d-flex align-items-center justify-content-center gap-6 ${
                                allFilteredUniformStatus === option.value
                                  ? option.className
                                  : 'bg-white text-secondary-light'
                              }`}
                              style={{ flex: '1 1 0' }}
                              onClick={() => applyBulkStatus(option.value)}
                              title={`${option.label} All (This Page)`}
                            >
                              <i className="ri-checkbox-circle-line"></i>
                              {option.label} All
                            </button>
                          ))}
                      </div>
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      Loading...
                    </td>
                  </tr>
                ) : paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      {filters.classId === 'Select'
                        ? 'Select a school and class to load students.'
                        : 'No attendance records found.'}
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((row, index) => (
                    <tr key={row.key}>
                      <td className="fw-medium text-secondary-light">
                        {(currentPage - 1) * rowsPerPage + index + 1}
                      </td>
                      {visibleColumns.school ? <td>{row.schoolName || '-'}</td> : null}
                      {visibleColumns.photo ? (
                        <td>
                          <div className="w-40-px h-40-px rounded-circle bg-neutral-100 d-flex align-items-center justify-content-center overflow-hidden">
                            {row.photo ? (
                              <img
                                src={row.photo}
                                alt={row.name || 'student'}
                                className="w-100 h-100 object-fit-cover"
                              />
                            ) : (
                              <i className="ri-user-line text-secondary-light text-xl"></i>
                            )}
                          </div>
                        </td>
                      ) : null}
                      {visibleColumns.name ? <td className="fw-medium text-primary-light">{row.name || '-'}</td> : null}
                      {visibleColumns.rollNo ? <td>{row.rollNo || '-'}</td> : null}
                      {visibleColumns.className ? <td>{row.className || '-'}</td> : null}
                      {visibleColumns.sectionName ? <td>{row.sectionName || '-'}</td> : null}
                      {visibleColumns.date ? <td>{row.attendanceDate || '-'}</td> : null}
                      {visibleColumns.status ? (
                        <td>
                          <div className="d-flex align-items-center gap-12 flex-wrap w-100">
                            {row?.id != null && leaveByStudentId.has(String(row.id)) ? (
                              <span
                                className="d-flex align-items-center justify-content-center px-10 py-6 radius-8 border bg-info-100 text-info-600 fw-semibold"
                                style={{ flex: '1 1 0' }}
                                title="Approved Leave"
                              >
                                On Leave
                              </span>
                            ) : (
                              STATUS_OPTIONS.map((option) => {
                                const checked = row.status === option.value
                                const disabled = row.isSaved
                                return (
                                  <label
                                    key={option.value}
                                    className={`d-flex align-items-center gap-6 px-10 py-6 radius-8 border ${
                                      disabled ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'
                                    }`}
                                    style={{
                                      flex: '1 1 0',
                                      justifyContent: 'center',
                                      backgroundColor: checked
                                        ? STATUS_INLINE_STYLES[option.value]?.backgroundColor
                                        : '#ffffff',
                                      color: checked
                                        ? STATUS_INLINE_STYLES[option.value]?.color
                                        : 'var(--text-secondary-light)',
                                      borderColor: checked
                                        ? STATUS_INLINE_STYLES[option.value]?.borderColor
                                        : 'var(--border-color)',
                                      transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      className="form-check-input mt-0"
                                      checked={checked}
                                      disabled={disabled}
                                      onChange={() => setStudentStatus(row, option.value)}
                                    />
                                    <span className="fw-medium">{option.label}</span>
                                  </label>
                                )
                              })
                            )}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            paginationProps={{
              currentPage,
              totalPages: studentTotalPages,
              setCurrentPage,
              pageInfo: resolvedPageInfo,
            }}
          />
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Find Attendance"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <div className="full">
              <ManualScopeSelectors
                enabled
                headOffices={headOfficeOptions}
                schoolOptions={scopeSchoolOptions}
                selectedHeadOfficeId={pendingFilters.headOfficeId}
                onHeadOfficeChange={(value) => {
                  setPendingFilters((prev) => ({
                    ...prev,
                    headOfficeId: value,
                    schoolId: '',
                    classId: 'Select',
                    sectionId: 'Select',
                  }))
                }}
                selectedSchoolId={pendingFilters.schoolId}
                onSchoolChange={(value) => {
                  setPendingFilters((prev) => ({
                    ...prev,
                    schoolId: value,
                    classId: 'Select',
                    sectionId: 'Select',
                  }))
                }}
                showHeadOfficeSelector
                showSchoolSelector
              />
            </div>
          ) : isHeadOfficeAdmin ? (
            <>
              <div className="full">
                <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Head Office</label>
                <input
                  type="text"
                  className="form-control"
                  value={authHeadOfficeName || selectedHeadOfficeId || 'Head Office'}
                  readOnly
                />
              </div>
              <div className="full">
                <ManualScopeSelectors
                  enabled
                  headOffices={headOfficeOptions}
                  schoolOptions={scopeSchoolOptions}
                  selectedHeadOfficeId={selectedHeadOfficeId}
                  onHeadOfficeChange={() => {}}
                  selectedSchoolId={pendingFilters.schoolId}
                  onSchoolChange={(value) => {
                    setPendingFilters((prev) => ({
                      ...prev,
                      schoolId: value,
                      classId: 'Select',
                      sectionId: 'Select',
                    }))
                  }}
                  showHeadOfficeSelector={false}
                  showSchoolSelector
                />
              </div>
            </>
          ) : (
            <div className="full">
              <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
              <input
                type="text"
                className="form-control"
                value={authSchoolName || selectedSchoolId || 'Current school'}
                readOnly
              />
            </div>
          )}

          <div className="full">
            <label htmlFor="classId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class <span className="text-danger-600">*</span>
            </label>
            <select
              id="classId"
              className="form-control form-select"
              value={pendingFilters.classId}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select Class--</option>
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {!pendingFilters.classId || pendingFilters.classId === 'Select' ? (
              <span className="text-danger-600 text-xs mt-6 d-inline-block">This field is required.</span>
            ) : null}
          </div>

          <div>
            <label htmlFor="sectionId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Section
            </label>
            <select
              id="sectionId"
              className="form-control form-select"
              value={pendingFilters.sectionId}
              onChange={handlePendingFilterChange}
              disabled={!pendingFilters.classId || pendingFilters.classId === 'Select'}
            >
              <option value="Select">--Select Section--</option>
              {sectionOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="full">
            <label htmlFor="date" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Date <span className="text-danger-600">*</span>
            </label>
            <input
              id="date"
              type="date"
              className="form-control"
              value={pendingFilters.date}
              onChange={handlePendingFilterChange}
            />
            {!pendingFilters.date ? (
              <span className="text-danger-600 text-xs mt-6 d-inline-block">This field is required.</span>
            ) : null}
          </div>

          <div className="full d-flex align-items-center gap-12 mt-8">
            <button
              type="button"
              className="btn btn-danger-200 text-danger-600 w-100"
              onClick={handleResetFilters}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary-600 w-100"
              disabled={!pendingFilters.classId || pendingFilters.classId === 'Select' || !pendingFilters.date}
            >
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default StudentAttendance
