import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchSalaryPaymentsPage } from '../apis/salaryPaymentApi'
import ExportDropdown from '../components/ExportDropdown'
import '../assets/css/addModalShared.css'

const makeDefaultFilters = (schoolId = 'Select') => ({
  schoolId,
  month: 'Select',
  gradeName: 'Select',
  salaryType: 'Select',
  status: 'Select',
})

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'employeeName', label: 'Employee' },
  { key: 'month', label: 'Month' },
  { key: 'gradeName', label: 'Grade Name' },
  { key: 'salaryType', label: 'Salary Type' },
  { key: 'paymentDate', label: 'Payment Date' },
  { key: 'paymentMethod', label: 'Payment Method' },
  { key: 'totalAllowance', label: 'Total Allowance' },
  { key: 'totalDeduction', label: 'Total Deduction' },
  { key: 'grossSalary', label: 'Gross Salary' },
  { key: 'netSalary', label: 'Net Salary' },
  { key: 'status', label: 'Status' },
  { key: 'note', label: 'Note' },
]

const formatMoney = (value) => {
  if (value == null || value === '') return '--'
  const amount = Number(value)
  if (Number.isNaN(amount)) return '--'
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDate = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-IN')
}

const fetchAllPages = async (params) => {
  const first = await fetchSalaryPaymentsPage({ ...params, page: 0, size: 200 })
  const firstRows = Array.isArray(first?.content) ? first.content : []
  const totalPages = Number(first?.totalPages ?? 1) || 1
  if (totalPages <= 1) return firstRows

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchSalaryPaymentsPage({ ...params, page: index + 1, size: 200 }),
    ),
  )

  return rest.reduce((acc, page) => {
    if (Array.isArray(page?.content)) acc.push(...page.content)
    return acc
  }, [...firstRows])
}

const SalaryHistory = () => {
  const { role, headOfficeId: authHeadOfficeId, schoolId: authSchoolId, canAdd, canEdit, canDelete } = useAuth()
  const PAGE_SLUG = 'salary-history'
  const normalizedRole = normalizeRole(role)
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = normalizedRole === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = normalizedRole === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const initialSchoolId = authSchoolId != null ? String(authSchoolId) : 'Select'

  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [schools, setSchools] = useState([])
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(() => makeDefaultFilters(initialSchoolId))
  const [filters, setFilters] = useState(() => makeDefaultFilters(initialSchoolId))
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let cancelled = false
    const loadSchools = async () => {
      try {
        const list = await fetchSchoolsLookup()
        if (!cancelled) setSchools(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setSchools([])
      }
    }
    void loadSchools()
    return () => {
      cancelled = true
    }
  }, [])

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return Array.isArray(manualScope.schoolOptions) ? manualScope.schoolOptions : []
    if (isHeadOfficeAdmin) return schools.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    if (isSchoolAdmin) return schools.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    return schools
  }, [authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.schoolOptions, schools])

  const effectiveHeadOfficeId = useMemo(() => {
    if (isSuperAdmin) return manualScope.selectedHeadOfficeId ? Number(manualScope.selectedHeadOfficeId) : null
    if (isHeadOfficeAdmin) return authHeadOfficeId ?? null
    if (isSchoolAdmin) {
      const school = schools.find((item) => String(item?.id ?? '') === String(authSchoolId ?? ''))
      return school?.headOfficeId != null ? Number(school.headOfficeId) : null
    }
    return null
  }, [authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.selectedHeadOfficeId, schools])

  const effectiveSchoolId = useMemo(() => {
    if (isSuperAdmin) return manualScope.selectedSchoolId ? Number(manualScope.selectedSchoolId) : null
    if (isSchoolAdmin) return authSchoolId ?? null
    return filters.schoolId !== 'Select' ? Number(filters.schoolId) : null
  }, [authSchoolId, filters.schoolId, isSchoolAdmin, isSuperAdmin, manualScope.selectedSchoolId])

  const loadRows = async () => {
    setBusy(true)
    try {
      const result = await fetchSalaryPaymentsPage({
        headOfficeId: effectiveHeadOfficeId,
        schoolId: effectiveSchoolId,
        month: filters.month !== 'Select' ? filters.month : undefined,
        gradeName: filters.gradeName !== 'Select' ? filters.gradeName : undefined,
        salaryType: filters.salaryType !== 'Select' ? filters.salaryType : undefined,
        status: filters.status !== 'Select' ? filters.status : undefined,
        search: debouncedSearch,
        page: currentPage - 1,
        size: rowsPerPage,
      })
      setRows(Array.isArray(result?.content) ? result.content : [])
      setTotalPages(Math.max(1, Number(result?.totalPages ?? 1) || 1))
      setTotalElements(Number(result?.totalElements ?? 0))
    } catch {
      setRows([])
      setTotalPages(1)
      setTotalElements(0)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void loadRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    rowsPerPage,
    debouncedSearch,
    filters.month,
    filters.gradeName,
    filters.salaryType,
    filters.status,
    effectiveHeadOfficeId,
    effectiveSchoolId,
  ])

  const monthOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.month).filter(Boolean))).sort(),
    [rows],
  )
  const gradeNameOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.gradeName).filter(Boolean))).sort(),
    [rows],
  )
  const salaryTypeOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.salaryType).filter(Boolean))).sort(),
    [rows],
  )

  const filtered = useMemo(() => rows, [rows])
  const paginated = filtered

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    const next = makeDefaultFilters(initialSchoolId)
    setPendingFilters(next)
    setFilters(next)
    setCurrentPage(1)
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p += 1) pages.push(p)
    return pages
  }

  const exportParams = {
    headOfficeId: effectiveHeadOfficeId,
    schoolId: effectiveSchoolId,
    month: filters.month !== 'Select' ? filters.month : undefined,
    gradeName: filters.gradeName !== 'Select' ? filters.gradeName : undefined,
    salaryType: filters.salaryType !== 'Select' ? filters.salaryType : undefined,
    status: filters.status !== 'Select' ? filters.status : undefined,
    search: debouncedSearch,
  }

  const exportColumns = columnOptions

  const mapExportRow = (row) => ({
    ...row,
    paymentDate: formatDate(row.paymentDate),
    totalAllowance: formatMoney(row.totalAllowance),
    totalDeduction: formatMoney(row.totalDeduction),
    grossSalary: formatMoney(row.grossSalary),
    netSalary: formatMoney(row.netSalary),
  })

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Salary History</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Salary History</span>
          </div>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown
                rows={filtered}
                loadRows={() => fetchAllPages(exportParams)}
                columns={exportColumns}
                visibleColumns={visibleColumns}
                mapRow={mapExportRow}
                fileName="Salary_History_List"
                sheetName="SalaryHistory"
                pdfTitle="Salary History Report"
              />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="text-secondary-light text-sm">Filter</span>
                <i className="ri-arrow-right-line" />
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line" />
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

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search salary history..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line" />
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1400 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.schoolName ? <th scope="col">School</th> : null}
                  {visibleColumns.employeeName ? <th scope="col">Employee</th> : null}
                  {visibleColumns.month ? <th scope="col">Month</th> : null}
                  {visibleColumns.gradeName ? <th scope="col">Grade Name</th> : null}
                  {visibleColumns.salaryType ? <th scope="col">Salary Type</th> : null}
                  {visibleColumns.paymentDate ? <th scope="col">Payment Date</th> : null}
                  {visibleColumns.paymentMethod ? <th scope="col">Payment Method</th> : null}
                  {visibleColumns.totalAllowance ? <th scope="col">Total Allowance</th> : null}
                  {visibleColumns.totalDeduction ? <th scope="col">Total Deduction</th> : null}
                  {visibleColumns.grossSalary ? <th scope="col">Gross Salary</th> : null}
                  {visibleColumns.netSalary ? <th scope="col">Net Salary</th> : null}
                  {visibleColumns.status ? <th scope="col">Status</th> : null}
                  {visibleColumns.note ? <th scope="col">Note</th> : null}
                </tr>
              </thead>

              <tbody>
                {busy ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      Loading...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      No salary history records found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, idx) => (
                    <tr key={row.id ?? idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.schoolName ? <td className="fw-medium text-primary-light">{row.schoolName || '--'}</td> : null}
                      {visibleColumns.employeeName ? <td className="fw-medium">{row.employeeName || '--'}</td> : null}
                      {visibleColumns.month ? <td>{row.month || '--'}</td> : null}
                      {visibleColumns.gradeName ? <td>{row.gradeName || '--'}</td> : null}
                      {visibleColumns.salaryType ? (
                        <td>
                          <span className="bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm">
                            {row.salaryType || '--'}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.paymentDate ? <td>{formatDate(row.paymentDate)}</td> : null}
                      {visibleColumns.paymentMethod ? <td>{row.paymentMethod || '--'}</td> : null}
                      {visibleColumns.totalAllowance ? <td className="text-end fw-semibold">{formatMoney(row.totalAllowance)}</td> : null}
                      {visibleColumns.totalDeduction ? <td className="text-end text-danger-600">{formatMoney(row.totalDeduction)}</td> : null}
                      {visibleColumns.grossSalary ? <td className="text-end fw-semibold">{formatMoney(row.grossSalary)}</td> : null}
                      {visibleColumns.netSalary ? <td className="text-end fw-semibold text-success-600">{formatMoney(row.netSalary)}</td> : null}
                      {visibleColumns.status ? (
                        <td>
                          <span
                            className={`px-12 py-4 radius-4 fw-medium text-sm ${
                              row.status === 'Paid'
                                ? 'bg-success-100 text-success-600'
                                : row.status === 'Pending'
                                  ? 'bg-warning-100 text-warning-600'
                                  : 'bg-danger-100 text-danger-600'
                            }`}
                          >
                            {row.status || '--'}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.note ? <td>{row.note || '--'}</td> : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, totalElements)} of {totalElements}
            </span>

            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              {getVisiblePages().map((p) => (
                <button
                  key={p}
                  type="button"
                  className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter Salary History" onClose={() => setIsFilterSidebarOpen(false)} className="filter-sidebar">
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {!isSuperAdmin && !isSchoolAdmin ? (
            <div>
              <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                School
              </label>
              <select id="schoolId" className="form-control form-select" value={pendingFilters.schoolId} onChange={handlePendingFilterChange}>
                <option value="Select">Select School</option>
                {schoolOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.schoolName || option.name || String(option.id)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label htmlFor="month" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Month
            </label>
            <select id="month" className="form-control form-select" value={pendingFilters.month} onChange={handlePendingFilterChange}>
              <option value="Select">Select Month</option>
              {monthOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="gradeName" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Grade Name
            </label>
            <select id="gradeName" className="form-control form-select" value={pendingFilters.gradeName} onChange={handlePendingFilterChange}>
              <option value="Select">Select Grade Name</option>
              {gradeNameOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="salaryType" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Salary Type
            </label>
            <select id="salaryType" className="form-control form-select" value={pendingFilters.salaryType} onChange={handlePendingFilterChange}>
              <option value="Select">Select Salary Type</option>
              {salaryTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Status
            </label>
            <select id="status" className="form-control form-select" value={pendingFilters.status} onChange={handlePendingFilterChange}>
              <option value="Select">Select Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="d-flex gap-12">
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
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

export default SalaryHistory
