import { useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchStudentsPage } from '../apis/studentsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import { TablePagination } from '../components/table'
import '../assets/css/addModalShared.css'

const makeDefaultFilters = (schoolId = 'Select') => ({
  headOfficeId: '',
  schoolId,
  className: 'Select',
})

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'className', label: 'Class' },
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'total', label: 'Total' },
]

const formatNumber = (value) => {
  if (value == null || value === '') return '--'
  const amount = Number(value)
  if (Number.isNaN(amount)) return '--'
  return String(amount)
}

const fetchAllPages = async (loader, filters) => {
  const first = await loader(0, 200, filters)
  const firstContent = Array.isArray(first?.content) ? first.content : []
  const totalPages = Number.isFinite(first?.totalPages) ? first.totalPages : 1

  if (totalPages <= 1) return firstContent

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => loader(index + 1, 200, filters)),
  )

  return [
    ...firstContent,
    ...rest.flatMap((page) => (Array.isArray(page?.content) ? page.content : [])),
  ]
}

const buildStudentRows = (students = []) => {
  const rowsByKey = new Map()

  for (const student of students) {
    const schoolName = student?.schoolName || 'Unknown'
    const className = student?.className || 'Unassigned'
    const key = `${schoolName}|${className}`
    const current = rowsByKey.get(key) || {
      id: key,
      schoolId: student?.schoolId,
      schoolName,
      className,
      male: 0,
      female: 0,
      total: 0,
    }

    const gender = String(student?.gender || '').trim().toLowerCase()
    if (gender === 'male') current.male += 1
    if (gender === 'female') current.female += 1
    current.total += 1
    rowsByKey.set(key, current)
  }

  return Array.from(rowsByKey.values()).sort((a, b) => {
    const schoolCompare = String(a.schoolName || '').localeCompare(String(b.schoolName || ''))
    if (schoolCompare !== 0) return schoolCompare
    return String(a.className || '').localeCompare(String(b.className || ''))
  })
}

const StudentReport = () => {
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
    return Array.isArray(schools) ? schools : []
  }, [manualScope.schoolOptions, isSuperAdmin, schools])

  const filterSchoolOptions = useMemo(() => {
    const rowsList = Array.isArray(schoolOptions) ? schoolOptions : []
    if (selectedHeadOfficeId) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(selectedHeadOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return rowsList.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return rowsList
  }, [authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, schoolOptions, selectedHeadOfficeId])

  const classOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.className).filter(Boolean))).sort(),
    [rows],
  )

  const filteredData = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !q || Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(q))
      const matchesSchool = filters.schoolId === 'Select' || String(row.schoolId ?? '') === String(filters.schoolId)
      const matchesClass = filters.className === 'Select' || row.className === filters.className
      return matchesSearch && matchesSchool && matchesClass
    })
  }, [rows, debouncedSearch, filters.className, filters.schoolId])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredData.slice(start, start + rowsPerPage)
  }, [currentPage, filteredData, rowsPerPage])

  const exportRows = useMemo(
    () =>
      filteredData.map((row) => ({
        schoolName: row.schoolName || '--',
        className: row.className || '--',
        male: formatNumber(row.male),
        female: formatNumber(row.female),
        total: formatNumber(row.total),
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
        const list = await fetchSchoolsLookup()
        if (!cancelled) setSchools(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setSchools([])
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [status, token, isSuperAdmin])

  useEffect(() => {
    if (!isSuperAdmin && isHeadOfficeAdmin && authHeadOfficeId != null) {
      setPendingFilters((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
      setFilters((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
    }
  }, [authHeadOfficeId, isHeadOfficeAdmin, isSuperAdmin])

  useEffect(() => {
    if (!isSuperAdmin && isSchoolAdmin && authSchoolId != null) {
      setPendingFilters((prev) => ({ ...prev, schoolId: String(authSchoolId) }))
      setFilters((prev) => ({ ...prev, schoolId: String(authSchoolId) }))
    }
  }, [authSchoolId, isSchoolAdmin, isSuperAdmin])

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
        const queryFilters = {
          headOfficeId: selectedHeadOfficeId || undefined,
          schoolId: selectedSchoolId || undefined,
          className: filters.className !== 'Select' ? filters.className : undefined,
        }

        const rawStudents = await fetchAllPages(fetchStudentsPage, queryFilters)
        if (cancelled) return
        setRows(buildStudentRows(rawStudents))
      } catch (error) {
        if (cancelled) return
        setRows([])
        setLoadError(error?.message || 'Failed to load student report')
      } finally {
        if (!cancelled) setBusy(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [status, token, canLoadRows, selectedHeadOfficeId, selectedSchoolId, filters.className])

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
  }, [totalPages, currentPage])

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
      case 'className':
        return <span className="fw-medium text-primary-light">{value || '--'}</span>
      case 'male':
        return <span className="text-primary-600 fw-semibold">{formatNumber(value)}</span>
      case 'female':
        return <span className="text-success-600 fw-semibold">{formatNumber(value)}</span>
      case 'total':
        return <span className="fw-bold text-secondary-light">{formatNumber(value)}</span>
      default:
        return value || '--'
    }
  }

  const totalMale = useMemo(
    () => filteredData.reduce((sum, row) => sum + (Number(row?.male) || 0), 0),
    [filteredData],
  )
  const totalFemale = useMemo(
    () => filteredData.reduce((sum, row) => sum + (Number(row?.female) || 0), 0),
    [filteredData],
  )
  const totalStudents = useMemo(
    () => filteredData.reduce((sum, row) => sum + (Number(row?.total) || 0), 0),
    [filteredData],
  )

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Student Report</h1>
          <span className="text-secondary-light">Dashboard / Student Report</span>
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
                fileName="Student_Report"
                sheetName="Student Report"
                pdfTitle="Student Report"
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
                placeholder="Search report..."
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
                Male: <span className="fw-semibold text-primary-600">{formatNumber(totalMale)}</span>
              </span>
              <span>
                Female: <span className="fw-semibold text-success-600">{formatNumber(totalFemale)}</span>
              </span>
              <span>
                Total students: <span className="fw-semibold text-secondary-light">{formatNumber(totalStudents)}</span>
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 900 }}>
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
                      Loading student report...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      {canLoadRows ? 'No student records found.' : 'Select a school to view the student report.'}
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
                      {columnOptions.map((col) => visibleColumns[col.key] && (
                        <td key={col.key}>{renderCell(row, col)}</td>
                      ))}
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
        title="Filter Student Report"
        onClose={() => setIsFilterSidebarOpen(false)}
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={manualScope.headOffices}
              schoolOptions={filterSchoolOptions}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={(value) => {
                manualScope.setSelectedScope(value, '')
                setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: 'Select', className: 'Select' }))
              }}
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={(value) => {
                manualScope.setSelectedScope(pendingFilters.headOfficeId, value)
                setPendingFilters((prev) => ({ ...prev, schoolId: value || 'Select', className: 'Select' }))
              }}
              schoolLabel="School"
            />
          ) : (
            <div>
              <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
              <select
                className="form-control form-select"
                value={pendingFilters.schoolId}
                onChange={(e) => setPendingFilters((prev) => ({ ...prev, schoolId: e.target.value, className: 'Select' }))}
                disabled={isSchoolAdmin}
              >
                <option value="Select">All Schools</option>
                {filterSchoolOptions.map((school) => (
                  <option key={school.id} value={String(school.id)}>
                    {school.schoolName || school.name || `School ${school.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Class</label>
            <select
              className="form-control form-select"
              value={pendingFilters.className}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, className: e.target.value }))}
            >
              <option value="Select">All Classes</option>
              {classOptions.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>

          <div className="d-flex gap-8 mt-12">
            <button
              type="button"
              className="btn btn-danger-200 text-danger-600 w-100"
              onClick={handleResetFilters}
            >
              Reset
            </button>
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default StudentReport
