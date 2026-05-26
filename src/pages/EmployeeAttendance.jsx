import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import TablePagination from '../components/table/TablePagination'
import ExportDropdown from '../components/ExportDropdown'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchEmployees } from '../apis/employeesApi'
import { fetchDesignations } from '../apis/designationsApi'
import { createAttendance, fetchAttendances } from '../apis/attendanceApi'
import { fetchLeaveCoverage } from '../apis/leaveApplicationsApi'
import '../assets/css/addModalShared.css'

const EMPLOYEE_EXAM_TERM = 'Employee Attendance'
const ATTENDANCE_SUBJECT = 'Attendance'
const EMPLOYEE_CLASS_NAME = 'Employee'

const STATUS_OPTIONS = [
  { value: 'Present', label: 'Present', className: 'bg-success-100 text-success-600' },
  { value: 'Absent', label: 'Absent', className: 'bg-danger-100 text-danger-600' },
  { value: 'Late', label: 'Late', className: 'bg-warning-100 text-warning-600' },
]

const todayIso = () => new Date().toISOString().slice(0, 10)

const columnOptions = [
  { key: 'school', label: 'School', defaultVisible: false },
  { key: 'photo', label: 'Photo', defaultVisible: false },
  { key: 'name', label: 'Name' },
  { key: 'designation', label: 'Designation' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
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

const pickEmployeeKey = (row) => String(row?.id ?? row?.employeeId ?? row?.email ?? row?.name ?? '').trim()

const pickEmployeeCode = (row) => normalizeText(row?.id ?? row?.employeeId ?? '')

const EmployeeAttendance = () => {
  const {
    role,
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    canAdd,
    canEdit,
    canDelete,
  } = useAuth()
  const PAGE_SLUG = 'employee-attendance'
  const {
    activeSchoolId,
    schoolOptions: contextSchoolOptions,
    setActiveSchoolId,
    isSchoolSelectionEnabled,
  } = useSchool()

  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = String(role || '').toUpperCase() === 'HEAD_OFFICE_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const buildDefaultFilters = useCallback(() => {
    const schoolId = !isSuperAdmin && !isHeadOfficeAdmin ? String(activeSchoolId || authSchoolId || '') : ''
    const headOfficeId =
      isHeadOfficeAdmin || (!isSuperAdmin && authHeadOfficeId != null) ? String(authHeadOfficeId ?? '') : ''
    return {
      headOfficeId,
      schoolId,
      designation: 'Select',
      date: todayIso(),
    }
  }, [activeSchoolId, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSuperAdmin])

  const [employees, setEmployees] = useState([])
  const [attendanceRows, setAttendanceRows] = useState([])
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
  const [leaveByEmployeeId, setLeaveByEmployeeId] = useState(() => new Map())
  const [designations, setDesignations] = useState([])

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const selectedHeadOfficeId =
    normalizeText(filters.headOfficeId) || (authHeadOfficeId != null ? String(authHeadOfficeId) : '')

  const selectedSchoolId =
    isSuperAdmin || isHeadOfficeAdmin
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

  const schoolNameById = useMemo(() => {
    const map = new Map()
    ;(Array.isArray(scopeSchoolOptions) ? scopeSchoolOptions : []).forEach((row) => {
      const id = normalizeText(row?.id)
      if (!id) return
      map.set(id, row?.schoolName || row?.name || `School ${id}`)
    })
    return map
  }, [scopeSchoolOptions])

  const designationOptions = useMemo(() => {
    const schoolId = normalizeText(pendingFilters.schoolId)
    const masterRows = (Array.isArray(designations) ? designations : []).filter((row) => {
      if (!schoolId) return false
      return String(row?.schoolId ?? '') === schoolId
    })
    const fallbackRows = (Array.isArray(employees) ? employees : []).filter((e) => {
      if (!schoolId) return false
      return String(e?.schoolId ?? '') === schoolId
    })
    const uniq = new Map()
    masterRows.forEach((row) => {
      const des = normalizeText(row?.name)
      if (!des) return
      uniq.set(des.toLowerCase(), des)
    })
    fallbackRows.forEach((e) => {
      const des = normalizeText(e?.designationName ?? e?.designation)
      if (!des) return
      uniq.set(des.toLowerCase(), des)
    })
    return Array.from(uniq.values()).sort((a, b) => a.localeCompare(b))
  }, [designations, employees, pendingFilters.schoolId])

  const attendanceByEmployeeCode = useMemo(() => {
    const map = new Map()
    const sorted = [...(Array.isArray(attendanceRows) ? attendanceRows : [])].sort(
      (a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0),
    )

    sorted.forEach((row) => {
      const code = normalizeText(row?.rollNo)
      const date = normalizeText(row?.attendanceDate)
      if (!code || !date) return
      if (normalizeText(date) !== normalizeText(filters.date)) return
      if (!map.has(code)) {
        map.set(code, {
          id: row?.id ?? null,
          status: normalizeStatus(row?.attendAll),
          attendanceDate: date,
          schoolId: row?.schoolId ?? null,
          sectionName: row?.sectionName || '',
        })
      }
    })

    return map
  }, [attendanceRows, filters.date])

  const resolveEmployeeRow = useCallback(
    (row) => {
      const key = pickEmployeeKey(row)
      const employeeCode = pickEmployeeCode(row)
      const attendance = employeeCode ? attendanceByEmployeeCode.get(employeeCode) || null : null
      const draft = drafts[key] || null
      const status = normalizeStatus(draft?.status || attendance?.status || '')
      const recordId = draft?.recordId ?? attendance?.id ?? null
      const schoolIdText = normalizeText(row?.schoolId)
      return {
        key,
        employeeId: row?.id ?? null,
        employeeCode,
        schoolId: schoolIdText,
        schoolName: schoolNameById.get(schoolIdText) || authSchoolName || '',
        photo: row?.photoUrl || row?.photoPath || row?.photo || '',
        name: row?.name || '',
        designation: row?.designationName || row?.designation || '',
        designationName: row?.designationName || row?.designation || '',
        phone: row?.phone || '',
        email: row?.email || '',
        status,
        recordId,
        isSaved: recordId != null,
        attendanceDate: filters.date,
      }
    },
    [attendanceByEmployeeCode, authSchoolName, drafts, filters.date, schoolNameById],
  )

  const displayedEmployees = useMemo(() => {
    const q = search.trim().toLowerCase()
    const selectedDes = normalizeText(filters.designation)
    return (Array.isArray(employees) ? employees : [])
      .filter((e) => {
        if (!selectedSchoolId) return false
        if (String(e?.schoolId ?? '') !== String(selectedSchoolId)) return false
        if (selectedDes && selectedDes !== 'Select') {
          const des = normalizeText(e?.designationName ?? e?.designation)
          if (des !== selectedDes) return false
        }
        return true
      })
      .map((row) => resolveEmployeeRow(row))
      .filter((row) => {
        if (!q) return true
        return [row.name, row.designation, row.phone, row.email, row.schoolName, row.status]
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
  }, [employees, filters.designation, resolveEmployeeRow, search, selectedSchoolId])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(displayedEmployees.length / rowsPerPage)),
    [displayedEmployees.length, rowsPerPage],
  )

  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return displayedEmployees.slice(start, start + rowsPerPage)
  }, [currentPage, displayedEmployees, rowsPerPage])

  // Load approved leave coverage for the visible roster (current page).
  useEffect(() => {
    if (!selectedSchoolId || !filters.date) {
      setLeaveByEmployeeId(new Map())
      return
    }

    const ids = paginatedEmployees
      .map((e) => e?.employeeId)
      .filter((v) => v != null)
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v))

    if (ids.length === 0) {
      setLeaveByEmployeeId(new Map())
      return
    }

    let cancelled = false
    const run = async () => {
      try {
        const rows = await fetchLeaveCoverage({
          schoolId: selectedSchoolId,
          applicantType: 'EMPLOYEE',
          date: filters.date,
          applicantIds: ids,
        })
        if (cancelled) return
        const map = new Map()
        for (const row of Array.isArray(rows) ? rows : []) {
          if (row?.applicantId == null) continue
          map.set(String(row.applicantId), row)
        }
        setLeaveByEmployeeId(map)
      } catch {
        if (!cancelled) setLeaveByEmployeeId(new Map())
      }
    }
    void run()

    return () => {
      cancelled = true
    }
  }, [filters.date, paginatedEmployees, selectedSchoolId])

  useEffect(() => {
    const schoolId = normalizeText(pendingFilters.schoolId)
    if (!schoolId) {
      setDesignations([])
      return
    }

    let cancelled = false
    const run = async () => {
      try {
        const rows = await fetchDesignations({ schoolId })
        if (cancelled) return
        setDesignations(Array.isArray(rows) ? rows : [])
      } catch {
        if (!cancelled) setDesignations([])
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [pendingFilters.schoolId])

  const dirtyDraftEntries = useMemo(() => {
    const entries = Object.values(drafts).filter((entry) => normalizeStatus(entry?.status) && !entry?.recordId)
    const leaveEntries = paginatedEmployees
      .filter((e) => e?.recordId == null && e?.employeeId != null && leaveByEmployeeId.has(String(e.employeeId)))
      .map((e) => ({ employee: e, status: 'Leave', recordId: null }))
    return [...entries, ...leaveEntries]
  }, [drafts, leaveByEmployeeId, paginatedEmployees])

  const loadPageData = useCallback(async () => {
    if (!selectedSchoolId) {
      setEmployees([])
      setAttendanceRows([])
      setError('')
      return
    }

    if (!filters.date) {
      setEmployees([])
      setAttendanceRows([])
      setError('')
      return
    }

    setLoading(true)
    setError('')

    try {
      const [employeeList, attendanceList] = await Promise.all([
        fetchEmployees({ schoolId: selectedSchoolId }),
        fetchAttendances({
          headOfficeId: selectedHeadOfficeId || undefined,
          schoolId: selectedSchoolId || undefined,
          examTerm: EMPLOYEE_EXAM_TERM,
          className: EMPLOYEE_CLASS_NAME,
          sectionName: normalizeText(filters.designation) && filters.designation !== 'Select' ? filters.designation : undefined,
          subjectName: ATTENDANCE_SUBJECT,
        }),
      ])

      setEmployees(Array.isArray(employeeList) ? employeeList : [])
      setAttendanceRows(Array.isArray(attendanceList) ? attendanceList : [])
    } catch (err) {
      setEmployees([])
      setAttendanceRows([])
      setError(err?.message || 'Failed to load employee attendance')
    } finally {
      setLoading(false)
    }
  }, [filters.date, filters.designation, selectedHeadOfficeId, selectedSchoolId])

  useEffect(() => {
    void loadPageData()
  }, [loadPageData])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters.date, filters.designation, rowsPerPage, selectedSchoolId])

  useEffect(() => {
    if (isSuperAdmin) return
    if (isHeadOfficeAdmin && selectedSchoolId) {
      setActiveSchoolId(selectedSchoolId)
    }
  }, [isHeadOfficeAdmin, isSuperAdmin, selectedSchoolId, setActiveSchoolId])

  useEffect(() => {
    if (isSuperAdmin) return
    if (!isSchoolSelectionEnabled && authSchoolId) {
      setActiveSchoolId(String(authSchoolId))
    }
  }, [authSchoolId, isSchoolSelectionEnabled, isSuperAdmin, setActiveSchoolId])

  // Uniform status highlight across all filtered employees (all pages).
  useEffect(() => {
    if (!selectedSchoolId || !filters.date) {
      setAllFilteredUniformStatus('')
      return
    }

    let cancelled = false
    const handle = setTimeout(() => {
      const run = async () => {
        try {
          const rows = displayedEmployees

          // Any approved leave in the filtered set => keep bulk header buttons neutral.
          {
            const ids = rows
              .map((r) => r?.employeeId)
              .filter((v) => v != null)
              .map((v) => Number(v))
              .filter((v) => Number.isFinite(v))

            let anyLeave = false
            const batchSize = 200
            for (let i = 0; i < ids.length && !anyLeave; i += batchSize) {
              const batch = ids.slice(i, i + batchSize)
              if (batch.length === 0) continue
              const coverage = await fetchLeaveCoverage({
                schoolId: selectedSchoolId,
                applicantType: 'EMPLOYEE',
                date: filters.date,
                applicantIds: batch,
              })
              if (Array.isArray(coverage) && coverage.length > 0) anyLeave = true
            }

            if (anyLeave) {
              if (!cancelled) setAllFilteredUniformStatus('')
              return
            }
          }

          let uniform = ''
          if (rows.length > 0) {
            const first = normalizeStatus(rows[0]?.status)
            if (first) {
              uniform = rows.every((r) => normalizeStatus(r?.status) === first) ? first : ''
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
  }, [displayedEmployees, filters.date, selectedSchoolId])

  const handlePendingFilterChange = (event) => {
    const { id, value } = event.target
    setPendingFilters((prev) => {
      if (id === 'headOfficeId') {
        manualScope.setSelectedScope(value, '')
        return { ...prev, headOfficeId: value, schoolId: '', designation: 'Select' }
      }
      if (id === 'schoolId') {
        manualScope.setSelectedScope(prev.headOfficeId, value)
        return { ...prev, schoolId: value, designation: 'Select' }
      }
      return { ...prev, [id]: value }
    })
  }

  const handleApplyFilters = (event) => {
    event.preventDefault()
    if ((isSuperAdmin || isHeadOfficeAdmin) && !pendingFilters.headOfficeId) return
    if (!pendingFilters.schoolId) return
    if (!pendingFilters.date) return
    if (isSuperAdmin) {
      manualScope.setSelectedScope(pendingFilters.headOfficeId, pendingFilters.schoolId)
    }
    setFilters(pendingFilters)
    setDrafts({})
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    const reset = buildDefaultFilters()
    if (isSuperAdmin) {
      manualScope.setSelectedScope('', '')
    }
    setPendingFilters(reset)
    setFilters(reset)
    setDrafts({})
    setCurrentPage(1)
  }

  const setEmployeeStatus = useCallback((employee, status) => {
    if (employee?.recordId != null) return
    if (employee?.employeeId != null && leaveByEmployeeId.has(String(employee.employeeId))) return
    const key = employee.key
    setDrafts((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        employee,
        status,
        recordId: employee.recordId || prev[key]?.recordId || null,
      },
    }))
  }, [leaveByEmployeeId])

  const applyBulkStatus = (status) => {
    setDrafts((prev) => {
      const next = { ...prev }
      paginatedEmployees.forEach((employee) => {
        if (employee?.recordId != null) return
        if (employee?.employeeId != null && leaveByEmployeeId.has(String(employee.employeeId))) return
        next[employee.key] = {
          ...(next[employee.key] || {}),
          employee,
          status,
          recordId: employee.recordId || next[employee.key]?.recordId || null,
        }
      })
      return next
    })
  }

  const saveAttendance = async () => {
    if (dirtyDraftEntries.length === 0) return
    setSaving(true)
    setError('')

    try {
      for (const entry of dirtyDraftEntries) {
        const employee = entry.employee || {}
        const employeeLabel = `${employee.name || 'Employee'}${employee.email ? ` (${employee.email})` : ''}`
        if (entry.recordId) continue

        const payload = {
          headOfficeId: selectedHeadOfficeId ? Number(selectedHeadOfficeId) : null,
          schoolId: employee.schoolId ? Number(employee.schoolId) : selectedSchoolId ? Number(selectedSchoolId) : null,
          examTerm: EMPLOYEE_EXAM_TERM,
          className: EMPLOYEE_CLASS_NAME,
          sectionName: employee.designation || employee.designationName || (filters.designation !== 'Select' ? filters.designation : '') || '',
          subjectName: ATTENDANCE_SUBJECT,
          name: employee.name || '',
          phone: employee.phone || '',
          rollNo: employee.employeeCode || '',
          photoPath: employee.photo || '',
          attendAll: normalizeStatus(entry.status),
          attendanceDate: filters.date,
          note: '',
        }

        try {
          await createAttendance(payload)
        } catch (e) {
          throw new Error(`${employeeLabel}: ${e?.message || 'Create failed'}`)
        }
      }

      const refreshedAttendance = await fetchAttendances({
        headOfficeId: selectedHeadOfficeId || undefined,
        schoolId: selectedSchoolId || undefined,
        examTerm: EMPLOYEE_EXAM_TERM,
        className: EMPLOYEE_CLASS_NAME,
        sectionName: normalizeText(filters.designation) && filters.designation !== 'Select' ? filters.designation : undefined,
        subjectName: ATTENDANCE_SUBJECT,
      })
      setAttendanceRows(Array.isArray(refreshedAttendance) ? refreshedAttendance : [])
      setDrafts({})
      await loadPageData()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to save employee attendance', err)
      setError(err?.message || 'Failed to save employee attendance')
    } finally {
      setSaving(false)
    }
  }

  const loadExportRows = useCallback(async () => displayedEmployees, [displayedEmployees])

  const exportColumns = useMemo(
    () => columnOptions.map((column) => ({ key: column.key, label: column.label })),
    [],
  )

  const mapExportRow = useCallback(
    (row) => ({
      school: row.schoolName || '',
      photo: row.photo || '',
      name: row.name || '',
      designation: row.designation || '',
      phone: row.phone || '',
      email: row.email || '',
      date: row.attendanceDate || filters.date || '',
      status: row.status || '',
    }),
    [filters.date],
  )

  const resolvedPageInfo =
    displayedEmployees.length === 0
      ? 'Showing 0 - 0 of 0 entries'
      : `Showing ${(currentPage - 1) * rowsPerPage + 1} - ${Math.min(
          currentPage * rowsPerPage,
          displayedEmployees.length,
        )} of ${displayedEmployees.length} entries`

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Employee Attendance</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Employee Attendance</span>
          </div>
        </div>
        {(canAdd(PAGE_SLUG) || canEdit(PAGE_SLUG)) && (
          <button
            type="button"
            className="btn btn-primary-600 px-16 py-8"
            onClick={saveAttendance}
            disabled={saving || dirtyDraftEntries.length === 0}
          >
            {saving
              ? 'Saving...'
              : `Save Attendance${dirtyDraftEntries.length > 0 ? ` (${dirtyDraftEntries.length})` : ''}`}
          </button>
        )}
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-start gap-16">
              <ExportDropdown
                title="Export"
                rows={displayedEmployees}
                loadRows={loadExportRows}
                columns={exportColumns}
                visibleColumns={visibleColumns}
                mapRow={mapExportRow}
                fileName="Employee Attendance"
                sheetName="Employee Attendance"
                pdfTitle="Employee Attendance"
              />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
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
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
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
                placeholder="Search employee attendance..."
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
                  <th scope="col" style={{ width: 80 }}>
                    S.L
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.photo ? <th scope="col">Photo</th> : null}
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.designation ? <th scope="col">Designation</th> : null}
                  {visibleColumns.phone ? <th scope="col">Phone</th> : null}
                  {visibleColumns.email ? <th scope="col">Email</th> : null}
                  {visibleColumns.date ? <th scope="col">Date</th> : null}
                  {visibleColumns.status ? (
                    <th scope="col">
                      <div className="d-flex align-items-center gap-8 flex-wrap w-100">
                        {STATUS_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`px-10 py-4 radius-8 border d-flex align-items-center justify-content-center gap-6 ${
                              allFilteredUniformStatus === option.value ? option.className : 'bg-white text-secondary-light'
                            }`}
                            style={{ flex: '1 1 0' }}
                            disabled={!canAdd(PAGE_SLUG) && !canEdit(PAGE_SLUG)}
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
                ) : paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      No employee attendance records found.
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((row, index) => (
                    <tr key={row.key}>
                      <td className="fw-medium text-secondary-light">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      {visibleColumns.school ? <td>{row.schoolName || '-'}</td> : null}
                      {visibleColumns.photo ? (
                        <td>
                          <div
                            className="w-40-px h-40-px rounded-circle bg-neutral-100 d-flex align-items-center justify-content-center overflow-hidden"
                            style={{ minWidth: 40 }}
                          >
                            {row.photo ? (
                              <img src={row.photo} alt={row.name || 'employee'} className="w-100 h-100 object-fit-cover" />
                            ) : (
                              <i className="ri-user-line text-secondary-light"></i>
                            )}
                          </div>
                        </td>
                      ) : null}
                      {visibleColumns.name ? <td className="fw-medium text-primary-light">{row.name || '-'}</td> : null}
                      {visibleColumns.designation ? <td>{row.designation || '-'}</td> : null}
                      {visibleColumns.phone ? <td>{row.phone || '-'}</td> : null}
                      {visibleColumns.email ? <td>{row.email || '-'}</td> : null}
                      {visibleColumns.date ? <td>{row.attendanceDate || '-'}</td> : null}
                      {visibleColumns.status ? (
                        <td>
                          <div className="d-flex align-items-center gap-12 flex-wrap w-100">
                            {row?.employeeId != null && leaveByEmployeeId.has(String(row.employeeId)) ? (
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
                                    } ${checked ? option.className : 'bg-white text-secondary-light'}
                                    }`}
                                    style={{ flex: '1 1 0', justifyContent: 'center' }}
                                  >
                                    <input
                                      type="checkbox"
                                      className="form-check-input mt-0"
                                      checked={checked}
                                      disabled={disabled || (!canAdd(PAGE_SLUG) && !canEdit(PAGE_SLUG))}
                                      onChange={() => setEmployeeStatus(row, option.value)}
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
              totalPages,
              setCurrentPage,
              pageInfo: resolvedPageInfo,
            }}
          />
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Find Employee Attendance"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin || isHeadOfficeAdmin ? (
            <div className="full">
              <label htmlFor="headOfficeId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                Head Office <span className="text-danger-600">*</span>
              </label>
              <select
                id="headOfficeId"
                className="form-control form-select"
                value={pendingFilters.headOfficeId}
                onChange={handlePendingFilterChange}
              >
                <option value="">--Select Head Office--</option>
                {headOfficeOptions.map((row) => (
                  <option key={String(row?.id ?? '')} value={String(row?.id ?? '')}>
                    {row?.name || `Head Office ${row?.id ?? ''}`}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="full">
            <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School <span className="text-danger-600">*</span>
            </label>
            <select
              id="schoolId"
              className="form-control form-select"
              value={pendingFilters.schoolId}
              onChange={handlePendingFilterChange}
              disabled={!isSuperAdmin && !isHeadOfficeAdmin}
            >
              <option value="">--Select School--</option>
              {scopeSchoolOptions.map((school) => {
                const id = normalizeText(school?.id)
                if (!id) return null
                return (
                  <option key={id} value={id}>
                    {school?.schoolName || school?.name || `School ${id}`}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="full">
            <label htmlFor="designation" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Designation
            </label>
            <select
              id="designation"
              className="form-control form-select"
              value={pendingFilters.designation}
              onChange={handlePendingFilterChange}
              disabled={!pendingFilters.schoolId}
            >
              <option value="Select">Select</option>
              {designationOptions.map((des) => (
                <option key={des} value={des}>
                  {des}
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
          </div>

          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
              Reset
            </button>
          </div>

          <div>
            <button
              type="submit"
              className="btn btn-primary-600 w-100"
              disabled={
                isSuperAdmin || isHeadOfficeAdmin
                  ? !pendingFilters.headOfficeId || !pendingFilters.schoolId || !pendingFilters.date
                  : !pendingFilters.schoolId || !pendingFilters.date
              }
            >
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default EmployeeAttendance
