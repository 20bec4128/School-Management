import { useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchStudentActivitiesPage } from '../apis/studentActivityApi'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import { TablePagination } from '../components/table'
import '../assets/css/addModalShared.css'

const makeDefaultFilters = (schoolId = 'Select') => ({
  headOfficeId: '',
  schoolId,
  className: 'Select',
  section: 'Select',
  activity: 'Select',
})

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'studentName', label: 'Student' },
  { key: 'className', label: 'Class' },
  { key: 'section', label: 'Section' },
  { key: 'activity', label: 'Activity' },
  { key: 'date', label: 'Date' },
  { key: 'description', label: 'Description' },
]

const formatDate = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-IN')
}

const fetchAllPages = async (loader, params) => {
  const first = await loader({ ...params, page: 0, size: 200 })
  const firstContent = Array.isArray(first?.content) ? first.content : []
  const totalPages = Number(first?.totalPages ?? 1)

  if (!Number.isFinite(totalPages) || totalPages <= 1) return firstContent

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => loader({ ...params, page: index + 1, size: 200 })),
  )

  return [
    ...firstContent,
    ...rest.flatMap((page) => (Array.isArray(page?.content) ? page.content : [])),
  ]
}

const StudentActivityReport = () => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, schoolId: authSchoolId } = useAuth()
  const role = useMemo(
    () => normalizeRole(authRole || user?.role || user?.userRole || user?.authority),
    [authRole, user],
  )

  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'

  const manualScope = useManualSchoolScope(isSuperAdmin)
  const initialSchoolId = authSchoolId != null ? String(authSchoolId) : 'Select'
  const currentSchoolOption = useMemo(() => {
    if (!isSchoolAdmin || authSchoolId == null) return null
    return {
      id: authSchoolId,
      schoolName: `School ${authSchoolId}`,
      headOfficeId: null,
    }
  }, [authSchoolId, isSchoolAdmin])

  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [schools, setSchools] = useState([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(() => makeDefaultFilters(initialSchoolId))
  const [filters, setFilters] = useState(() => makeDefaultFilters(initialSchoolId))

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const selectedHeadOfficeId = useMemo(() => {
    if (filters.headOfficeId && filters.headOfficeId !== 'Select') return String(filters.headOfficeId)
    if (isHeadOfficeAdmin) return authHeadOfficeId != null ? String(authHeadOfficeId) : ''
    return ''
  }, [authHeadOfficeId, filters.headOfficeId, isHeadOfficeAdmin])

  const selectedSchoolId = useMemo(() => {
    if (filters.schoolId && filters.schoolId !== 'Select') return String(filters.schoolId)
    if (isSchoolAdmin) return authSchoolId != null ? String(authSchoolId) : ''
    return ''
  }, [authSchoolId, filters.schoolId, isSchoolAdmin])

  const canLoadRows = isSuperAdmin || Boolean(selectedHeadOfficeId || selectedSchoolId)

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return Array.isArray(manualScope.schoolOptions) ? manualScope.schoolOptions : []
    if (isSchoolAdmin) return currentSchoolOption ? [currentSchoolOption] : []
    return Array.isArray(schools) ? schools : []
  }, [currentSchoolOption, isSchoolAdmin, manualScope.schoolOptions, isSuperAdmin, schools])

  const filteredData = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !q || Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(q))
      const matchesSchool = filters.schoolId === 'Select' || String(row.schoolId ?? '') === String(filters.schoolId)
      const matchesClass = filters.className === 'Select' || row.className === filters.className
      const matchesSection = filters.section === 'Select' || row.section === filters.section
      const matchesActivity = filters.activity === 'Select' || row.activity === filters.activity
      return matchesSearch && matchesSchool && matchesClass && matchesSection && matchesActivity
    })
  }, [rows, debouncedSearch, filters.activity, filters.className, filters.schoolId, filters.section])

  const classOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.className).filter(Boolean))).sort(),
    [rows],
  )
  const sectionOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.section).filter(Boolean))).sort(),
    [rows],
  )
  const activityOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.activity).filter(Boolean))).sort(),
    [rows],
  )

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredData.slice(start, start + rowsPerPage)
  }, [currentPage, filteredData, rowsPerPage])

  const exportRows = useMemo(
    () =>
      filteredData.map((row) => ({
        schoolName: row.schoolName || '--',
        studentName: row.studentName || '--',
        className: row.className || '--',
        section: row.section || '--',
        activity: row.activity || '--',
        date: formatDate(row.date),
        description: row.description || '--',
      })),
    [filteredData],
  )

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    if (isSuperAdmin) return

    let cancelled = false
    const load = async () => {
      try {
        if (isSchoolAdmin) {
          if (!cancelled) setSchools(currentSchoolOption ? [currentSchoolOption] : [])
          return
        }
        const list = await fetchSchoolsLookup()
        if (!cancelled) setSchools(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setSchools(isSchoolAdmin && currentSchoolOption ? [currentSchoolOption] : [])
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [currentSchoolOption, isSchoolAdmin, status, token, isSuperAdmin])

  useEffect(() => {
    if (status !== 'ready' || !token) return

    if (!canLoadRows) {
      setRows([])
      return
    }

    let cancelled = false

    const load = async () => {
      setBusy(true)
      setLoadError('')
      try {
        const data = await fetchAllPages(fetchStudentActivitiesPage, {
          headOfficeId: selectedHeadOfficeId || null,
          schoolId: selectedSchoolId || null,
        })

        if (cancelled) return
        setRows(Array.isArray(data) ? data : [])
      } catch (error) {
        if (cancelled) return
        setRows([])
        setLoadError(error?.message || 'Failed to load student activity report')
      } finally {
        if (!cancelled) setBusy(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [status, token, canLoadRows, selectedHeadOfficeId, selectedSchoolId])

  useEffect(() => {
    setPendingFilters((prev) => {
      if (prev.schoolId !== 'Select' || initialSchoolId === 'Select') return prev
      return { ...prev, schoolId: initialSchoolId }
    })
    setFilters((prev) => {
      if (prev.schoolId !== 'Select' || initialSchoolId === 'Select') return prev
      return { ...prev, schoolId: initialSchoolId }
    })
  }, [initialSchoolId])

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    setIsFilterSidebarOpen(false)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    const nextFilters = makeDefaultFilters(initialSchoolId)
    if (isSuperAdmin) {
      manualScope.setSelectedScope('', '')
    }
    setPendingFilters(nextFilters)
    setFilters(nextFilters)
    setCurrentPage(1)
  }

  const renderCell = (row, column) => {
    const value = row[column.key]
    switch (column.key) {
      case 'schoolName':
      case 'studentName':
      case 'className':
        return <span className="fw-medium text-primary-light">{value || '--'}</span>
      case 'section':
        return <span className="fw-semibold text-secondary-light">{value || '--'}</span>
      case 'activity':
        return <span className="px-12 py-4 radius-4 fw-medium text-sm bg-info-100 text-info-600">{value || '--'}</span>
      case 'date':
        return formatDate(value)
      default:
        return value || '--'
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Student Activity Report</h1>
          <span className="text-secondary-light">Dashboard / Student Activity Report</span>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown
                rows={exportRows}
                columns={columnOptions}
                visibleColumns={visibleColumns}
                fileName="Student_Activity_Report"
                sheetName="Student Activity Report"
                pdfTitle="Student Activity Report"
              />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                >
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  {columnOptions.map((col) => (
                    <li key={col.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={visibleColumns[col.key]}
                          onChange={() => toggleColumn(col.key)}
                        />
                        {col.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <RowsPerPageSelect
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(next) => {
                  setRowsPerPage(next)
                  setCurrentPage(1)
                }}
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search activities..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="px-20 py-12 border-bottom border-neutral-200 d-flex flex-wrap gap-16 justify-content-between">
            <div className="text-sm text-secondary-light">
             
            </div>
            <div className="d-flex flex-wrap gap-24 text-sm text-secondary-light">
              <span>
                Class list: <span className="fw-semibold text-primary-light">{classOptions.length}</span>
              </span>
              <span>
                Section list: <span className="fw-semibold text-success-600">{sectionOptions.length}</span>
              </span>
              <span>
                Activity types: <span className="fw-semibold text-secondary-light">{activityOptions.length}</span>
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {columnOptions.map((col) => visibleColumns[col.key] && (
                    <th scope="col" key={col.key}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {busy && rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      Loading student activity report...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      {canLoadRows ? 'No student activity records found.' : 'Select a school to view the student activity report.'}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {columnOptions.map((col) => visibleColumns[col.key] && <td key={col.key}>{renderCell(row, col)}</td>)}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {loadError ? <div className="px-20 py-12 text-danger">{loadError}</div> : null}

          <div className="px-20 py-16 border-top border-neutral-200">
            <TablePagination
              paginationProps={{
                currentPage,
                totalPages,
                pageInfo: `Showing ${filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, filteredData.length)} of ${filteredData.length} entries`,
                onPageChange: (next) => setCurrentPage(Math.min(Math.max(1, Number(next) || 1), totalPages)),
              }}
            />
          </div>
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Student Activity"
        onClose={() => setIsFilterSidebarOpen(false)}
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={manualScope.headOffices}
              schoolOptions={manualScope.schoolOptions}
              selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
              onHeadOfficeChange={(value) => {
                manualScope.setSelectedScope(value, '')
                setPendingFilters((prev) => ({
                  ...prev,
                  headOfficeId: value,
                  schoolId: 'Select',
                  className: 'Select',
                  section: 'Select',
                  activity: 'Select',
                }))
              }}
              selectedSchoolId={manualScope.selectedSchoolId}
              onSchoolChange={(value) => {
                manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value)
                setPendingFilters((prev) => ({
                  ...prev,
                  schoolId: value || 'Select',
                  className: 'Select',
                  section: 'Select',
                  activity: 'Select',
                }))
              }}
              schoolLabel="School"
            />
          ) : null}

          {!isSuperAdmin ? (
            <div className="avm-field full">
              <label className="avm-label" htmlFor="studentActivitySchool">
                School
              </label>
              <select
                id="studentActivitySchool"
                className="form-control form-select avm-select avm-input w-100"
                value={pendingFilters.schoolId}
                onChange={(e) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    schoolId: e.target.value,
                  }))
                }
                disabled={isSchoolAdmin}
              >
                <option value="Select">Select School</option>
                {schoolOptions.map((school) => (
                  <option key={String(school.id)} value={String(school.id)}>
                    {school.schoolName || school.name || String(school.id)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="avm-grid">
            <div className="avm-field">
              <label className="avm-label" htmlFor="studentActivityClass">
                Class
              </label>
              <select
                id="studentActivityClass"
                className="form-control form-select avm-select avm-input"
                value={pendingFilters.className}
                onChange={(e) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    className: e.target.value,
                  }))
                }
              >
                <option value="Select">Select Class</option>
                {classOptions.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>

            <div className="avm-field">
              <label className="avm-label" htmlFor="studentActivitySection">
                Section
              </label>
              <select
                id="studentActivitySection"
                className="form-control form-select avm-select avm-input"
                value={pendingFilters.section}
                onChange={(e) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    section: e.target.value,
                  }))
                }
              >
                <option value="Select">Select Section</option>
                {sectionOptions.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="avm-field full">
            <label className="avm-label" htmlFor="studentActivityActivity">
              Activity
            </label>
            <select
              id="studentActivityActivity"
              className="form-control form-select avm-select avm-input w-100"
              value={pendingFilters.activity}
              onChange={(e) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  activity: e.target.value,
                }))
              }
            >
              <option value="Select">Select Activity</option>
              {activityOptions.map((activity) => (
                <option key={activity} value={activity}>
                  {activity}
                </option>
              ))}
            </select>
          </div>

          <div className="d-flex gap-12">
            <button type="submit" className="btn btn-primary-600 flex-fill">
              Apply Filters
            </button>
            <button type="button" className="btn btn-light border flex-fill" onClick={handleResetFilters}>
              Reset
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default StudentActivityReport
