import { useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchEmployeesPage } from '../apis/employeesApi'
import { fetchSalaryGradesPage } from '../apis/salaryGradeApi'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import { TablePagination } from '../components/table'
import '../assets/css/addModalShared.css'

const makeDefaultFilters = (schoolId = 'Select') => ({
  schoolId,
  role: 'Select',
  salaryGrade: 'Select',
  salaryType: 'Select',
})

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'employeeName', label: 'Employee' },
  { key: 'role', label: 'Role' },
  { key: 'salaryGrade', label: 'Salary Grade' },
  { key: 'salaryType', label: 'Salary Type' },
  { key: 'netSalary', label: 'Net Salary' },
  { key: 'joiningDate', label: 'Joining Date' },
  { key: 'phone', label: 'Phone' },
]

const formatMoney = (value) => {
  if (value == null || value === '') return '--'
  const amount = Number(value)
  if (Number.isNaN(amount)) return '--'
  return `Rs. ${amount.toFixed(2)}`
}

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

const PayrollReport = () => {
  const { status, token, user, role: authRole, schoolId: authSchoolId } = useAuth()
  const role = useMemo(
    () => normalizeRole(authRole || user?.role || user?.userRole || user?.authority),
    [authRole, user],
  )

  const isSuperAdmin = role === 'SUPER_ADMIN'
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

  const selectedSchoolId = useMemo(() => {
    if (filters.schoolId && filters.schoolId !== 'Select') return String(filters.schoolId)
    if (isSchoolAdmin) return authSchoolId != null ? String(authSchoolId) : ''
    return ''
  }, [authSchoolId, filters.schoolId, isSchoolAdmin])

  const canLoadRows = isSuperAdmin || Boolean(selectedSchoolId)

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return Array.isArray(manualScope.schoolOptions) ? manualScope.schoolOptions : []
    return Array.isArray(schools) ? schools : []
  }, [manualScope.schoolOptions, isSuperAdmin, schools])

  const filteredData = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !q || Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(q))
      const matchesRole = filters.role === 'Select' || row.role === filters.role
      const matchesGrade = filters.salaryGrade === 'Select' || row.salaryGrade === filters.salaryGrade
      const matchesType = filters.salaryType === 'Select' || row.salaryType === filters.salaryType
      return matchesSearch && matchesRole && matchesGrade && matchesType
    })
  }, [rows, debouncedSearch, filters.role, filters.salaryGrade, filters.salaryType])

  const roleOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.role).filter(Boolean))).sort(),
    [rows],
  )
  const salaryGradeOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.salaryGrade).filter(Boolean))).sort(),
    [rows],
  )
  const salaryTypeOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.salaryType).filter(Boolean))).sort(),
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
        employeeName: row.employeeName || '--',
        role: row.role || '--',
        salaryGrade: row.salaryGrade || '--',
        salaryType: row.salaryType || '--',
        netSalary: row.netSalary != null ? Number(row.netSalary).toFixed(2) : '--',
        joiningDate: formatDate(row.joiningDate),
        phone: row.phone || '--',
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
        const [employeeRows, salaryGradeRows] = await Promise.all([
          fetchAllPages(fetchEmployeesPage, {
            schoolId: selectedSchoolId || null,
          }),
          fetchAllPages(fetchSalaryGradesPage, {
            schoolId: selectedSchoolId || null,
          }),
        ])

        if (cancelled) return

        const schoolMap = new Map(
          (Array.isArray(manualScope.schoolOptions) ? manualScope.schoolOptions : schoolOptions).map((school) => [
            String(school?.id ?? ''),
            school?.schoolName || school?.name || String(school?.id ?? ''),
          ]),
        )
        const salaryGradeMap = new Map(
          salaryGradeRows.map((grade) => [
            `${String(grade?.schoolId ?? '')}|${String(grade?.gradeName ?? '').trim().toLowerCase()}`,
            grade,
          ]),
        )

        const nextRows = employeeRows.map((employee) => {
          const key = `${String(employee?.schoolId ?? '')}|${String(employee?.salaryGrade ?? '').trim().toLowerCase()}`
          const matchedGrade = salaryGradeMap.get(key)
          return {
            id: employee.id,
            schoolId: employee.schoolId,
            schoolName: employee.schoolName || schoolMap.get(String(employee.schoolId ?? '')) || '--',
            employeeName: employee.name || '--',
            role: employee.role || '--',
            salaryGrade: employee.salaryGrade || '--',
            salaryType: employee.salaryType || '--',
            netSalary: matchedGrade?.netSalary ?? null,
            joiningDate: employee.joiningDate,
            phone: employee.phone || '--',
          }
        })

        setRows(nextRows)
      } catch (error) {
        if (cancelled) return
        setRows([])
        setLoadError(error?.message || 'Failed to load payroll report')
      } finally {
        if (!cancelled) setBusy(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [status, token, canLoadRows, selectedSchoolId, manualScope.schoolOptions, schoolOptions])

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
      case 'employeeName':
      case 'role':
      case 'salaryGrade':
      case 'salaryType':
      case 'phone':
        return <span className="fw-medium text-primary-light">{value || '--'}</span>
      case 'netSalary':
        return <span className="fw-semibold text-success-600">{formatMoney(value)}</span>
      case 'joiningDate':
        return formatDate(value)
      default:
        return value || '--'
    }
  }

  const totalPayroll = useMemo(
    () => filteredData.reduce((sum, row) => sum + (Number(row?.netSalary) || 0), 0),
    [filteredData],
  )

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Payroll Report</h1>
          <span className="text-secondary-light">Dashboard / Payroll Report</span>
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
                fileName="Payroll_Report"
                sheetName="Payroll Report"
                pdfTitle="Payroll Report"
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
                placeholder="Search payroll..."
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
              Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} records
            </div>
            <div className="d-flex flex-wrap gap-24 text-sm text-secondary-light">
              <span>
                Roles: <span className="fw-semibold text-primary-light">{roleOptions.length}</span>
              </span>
              <span>
                Salary grades: <span className="fw-semibold text-success-600">{salaryGradeOptions.length}</span>
              </span>
              <span>
                Total payroll: <span className="fw-semibold text-secondary-light">{formatMoney(totalPayroll)}</span>
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1200 }}>
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
                      Loading payroll report...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      {canLoadRows ? 'No payroll records found.' : 'Select a school to view the payroll report.'}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr key={row.id ?? `${row.employeeName}-${idx}`}>
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
        title="Filter Payroll Report"
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
                  schoolId: 'Select',
                  role: 'Select',
                  salaryGrade: 'Select',
                  salaryType: 'Select',
                }))
              }}
              selectedSchoolId={manualScope.selectedSchoolId}
              onSchoolChange={(value) => {
                manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value)
                setPendingFilters((prev) => ({
                  ...prev,
                  schoolId: value || 'Select',
                  role: 'Select',
                  salaryGrade: 'Select',
                  salaryType: 'Select',
                }))
              }}
              schoolLabel="School"
            />
          ) : null}

          {!isSuperAdmin ? (
            <div className="avm-field full">
              <label className="avm-label" htmlFor="payrollSchool">
                School
              </label>
              <select
                id="payrollSchool"
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
              <label className="avm-label" htmlFor="payrollRole">
                Role
              </label>
              <select
                id="payrollRole"
                className="form-control form-select avm-select avm-input"
                value={pendingFilters.role}
                onChange={(e) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    role: e.target.value,
                  }))
                }
              >
                <option value="Select">Select Role</option>
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="avm-field">
              <label className="avm-label" htmlFor="payrollSalaryGrade">
                Salary Grade
              </label>
              <select
                id="payrollSalaryGrade"
                className="form-control form-select avm-select avm-input"
                value={pendingFilters.salaryGrade}
                onChange={(e) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    salaryGrade: e.target.value,
                  }))
                }
              >
                <option value="Select">Select Grade</option>
                {salaryGradeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="avm-field full">
            <label className="avm-label" htmlFor="payrollSalaryType">
              Salary Type
            </label>
            <select
              id="payrollSalaryType"
              className="form-control form-select avm-select avm-input w-100"
              value={pendingFilters.salaryType}
              onChange={(e) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  salaryType: e.target.value,
                }))
              }
            >
              <option value="Select">Select Salary Type</option>
              {salaryTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
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

export default PayrollReport
