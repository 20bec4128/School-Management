import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchSalaryPaymentsPage, deleteSalaryPayment } from '../apis/salaryPaymentApi'
import ExportDropdown from '../components/ExportDropdown'
import '../assets/css/addModalShared.css'

const makeDefaultFilters = (schoolId = 'Select') => ({
  headOfficeId: '',
  schoolId,
  month: 'Select',
  gradeName: 'Select',
  salaryType: 'Select',
  paymentMethod: 'Select',
  status: 'Select',
})

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'employeeName', label: 'Employee' },
  { key: 'month', label: 'Month' },
  { key: 'gradeName', label: 'Grade Name' },
  { key: 'salaryType', label: 'Salary Type' },
  { key: 'paymentMethod', label: 'Payment Method' },
  { key: 'basicSalary', label: 'Basic Salary' },
  { key: 'totalAllowance', label: 'Total Allowance' },
  { key: 'totalDeduction', label: 'Total Deduction' },
  { key: 'grossSalary', label: 'Gross Salary' },
  { key: 'netSalary', label: 'Net Salary' },
  { key: 'paymentDate', label: 'Payment Date' },
  { key: 'status', label: 'Status' },
  { key: 'note', label: 'Note' },
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

const SalaryPayment = () => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, schoolId: authSchoolId, canAdd, canEdit, canDelete } = useAuth()
  const PAGE_SLUG = 'salary-payment'
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
  const [selectedRows, setSelectedRows] = useState([])
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(() => makeDefaultFilters(initialSchoolId))
  const [filters, setFilters] = useState(() => makeDefaultFilters(initialSchoolId))

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const selectedSchoolId = useMemo(() => {
    if (filters.schoolId && filters.schoolId !== 'Select') return String(filters.schoolId)
    if (isSchoolAdmin) return authSchoolId != null ? String(authSchoolId) : ''
    return ''
  }, [authSchoolId, filters.schoolId, isSchoolAdmin])

  const selectedHeadOfficeId = useMemo(() => {
    if (filters.headOfficeId && filters.headOfficeId !== 'Select') return String(filters.headOfficeId)
    if (isHeadOfficeAdmin) return authHeadOfficeId != null ? String(authHeadOfficeId) : ''
    return ''
  }, [authHeadOfficeId, filters.headOfficeId, isHeadOfficeAdmin])

  const canLoadRows = isSuperAdmin || isHeadOfficeAdmin || Boolean(selectedSchoolId)

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return Array.isArray(manualScope.schoolOptions) ? manualScope.schoolOptions : []
    const rowsList = Array.isArray(schools) ? schools : []
    if (isHeadOfficeAdmin) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return rowsList.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return rowsList
  }, [authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, manualScope.schoolOptions, schools, isSuperAdmin])

  const filteredData = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !q || Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(q))
      const matchesMonth = filters.month === 'Select' || row.month === filters.month
      const matchesGrade = filters.gradeName === 'Select' || row.gradeName === filters.gradeName
      const matchesType = filters.salaryType === 'Select' || row.salaryType === filters.salaryType
      const matchesMethod = filters.paymentMethod === 'Select' || row.paymentMethod === filters.paymentMethod
      const matchesStatus = filters.status === 'Select' || row.status === filters.status
      const matchesSchool = filters.schoolId === 'Select' || String(row.schoolId ?? '') === String(filters.schoolId)
      return matchesSearch && matchesMonth && matchesGrade && matchesType && matchesMethod && matchesStatus && matchesSchool
    })
  }, [rows, debouncedSearch, filters.gradeName, filters.month, filters.paymentMethod, filters.salaryType, filters.schoolId, filters.status])

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
  const paymentMethodOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.paymentMethod).filter(Boolean))).sort(),
    [rows],
  )
  const statusOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.status).filter(Boolean))).sort(),
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
        School: row.schoolName || '--',
        Employee: row.employeeName || '--',
        Month: row.month || '--',
        'Grade Name': row.gradeName || '--',
        'Salary Type': row.salaryType || '--',
        'Payment Method': row.paymentMethod || '--',
        'Basic Salary': row.basicSalary != null ? Number(row.basicSalary).toFixed(2) : '--',
        'Total Allowance': row.totalAllowance != null ? Number(row.totalAllowance).toFixed(2) : '--',
        'Total Deduction': row.totalDeduction != null ? Number(row.totalDeduction).toFixed(2) : '--',
        'Gross Salary': row.grossSalary != null ? Number(row.grossSalary).toFixed(2) : '--',
        'Net Salary': row.netSalary != null ? Number(row.netSalary).toFixed(2) : '--',
        'Payment Date': formatDate(row.paymentDate),
        Status: row.status || '--',
        Note: row.note || '--',
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

  const loadRows = async () => {
    if (status !== 'ready' || !token) return

    if (!canLoadRows) {
      setRows([])
      return
    }

    setBusy(true)
    setLoadError('')
    try {
      const data = await fetchAllPages(fetchSalaryPaymentsPage, {
        headOfficeId: selectedHeadOfficeId || null,
        schoolId: selectedSchoolId || null,
      })
      setRows(Array.isArray(data) ? data : [])
    } catch (error) {
      setRows([])
      setLoadError(error?.message || 'Failed to load salary payment records')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void loadRows()
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

  const handleDelete = async (row) => {
    if (!window.confirm('Are you sure you want to delete this salary payment record?')) return
    try {
      await deleteSalaryPayment(row.id)
      await loadRows()
    } catch (error) {
      alert(error?.message || 'Failed to delete salary payment record')
    }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows(paginatedData.map((row) => row.id))
    else setSelectedRows([])
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    )
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p += 1) pages.push(p)
    return pages
  }

  const totalNetSalary = useMemo(
    () => filteredData.reduce((sum, row) => sum + (Number(row.netSalary) || 0), 0),
    [filteredData],
  )
  const totalGrossSalary = useMemo(
    () => filteredData.reduce((sum, row) => sum + (Number(row.grossSalary) || 0), 0),
    [filteredData],
  )
  const paidCount = useMemo(
    () => filteredData.filter((row) => String(row.status || '').toLowerCase() === 'paid').length,
    [filteredData],
  )

  const showingStart = filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const showingEnd = Math.min(currentPage * rowsPerPage, filteredData.length)

  const renderCell = (row, column) => {
    const value = row[column.key]
    switch (column.key) {
      case 'schoolName':
      case 'employeeName':
      case 'gradeName':
      case 'salaryType':
      case 'paymentMethod':
      case 'note':
        return <span className="fw-medium text-primary-light">{value || '--'}</span>
      case 'basicSalary':
      case 'totalAllowance':
      case 'totalDeduction':
      case 'grossSalary':
      case 'netSalary':
        return <span className="fw-semibold">{formatMoney(value)}</span>
      case 'paymentDate':
        return formatDate(value)
      case 'status':
        return (
          <span
            className={`px-12 py-4 radius-4 fw-medium text-sm ${
              String(value || '').toLowerCase() === 'paid'
                ? 'bg-success-100 text-success-600'
                : String(value || '').toLowerCase() === 'pending'
                  ? 'bg-warning-100 text-warning-600'
                  : 'bg-danger-100 text-danger-600'
            }`}
          >
            {value || '--'}
          </span>
        )
      default:
        return value || '--'
    }
  }

  const mapExportRow = (row) => ({
    ...row,
    basicSalary: row.basicSalary != null ? Number(row.basicSalary).toFixed(2) : '--',
    totalAllowance: row.totalAllowance != null ? Number(row.totalAllowance).toFixed(2) : '--',
    totalDeduction: row.totalDeduction != null ? Number(row.totalDeduction).toFixed(2) : '--',
    grossSalary: row.grossSalary != null ? Number(row.grossSalary).toFixed(2) : '--',
    netSalary: row.netSalary != null ? Number(row.netSalary).toFixed(2) : '--',
    paymentDate: formatDate(row.paymentDate),
  })

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Salary Payment</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Salary Payment</span>
          </div>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown
                rows={filteredData}
                columns={columnOptions}
                visibleColumns={visibleColumns}
                mapRow={mapExportRow}
                fileName="Salary_Payment"
                sheetName="Salary Payment"
                pdfTitle="Salary Payment"
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
                placeholder="Search salary payments..."
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
                Net salary: <span className="fw-semibold text-success-600">{formatMoney(totalNetSalary)}</span>
              </span>
              <span>
                Gross salary: <span className="fw-semibold text-primary-light">{formatMoney(totalGrossSalary)}</span>
              </span>
              <span>
                Paid records: <span className="fw-semibold text-secondary-light">{paidCount}</span>
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1500 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={selectedRows.length > 0 && paginatedData.every((row) => selectedRows.includes(row.id))} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {columnOptions.map((col) => visibleColumns[col.key] && (
                    <th scope="col" key={col.key}>
                      {col.label}
                    </th>
                  ))}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {busy && rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading salary payment records...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      {canLoadRows ? 'No salary payment records found.' : 'Select a school to view salary payments.'}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" checked={selectedRows.includes(row.id)} onChange={() => handleSelectRow(row.id)} />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {columnOptions.map((col) => visibleColumns[col.key] && <td key={col.key}>{renderCell(row, col)}</td>)}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          {canDelete(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                              title="Delete"
                              onClick={() => handleDelete(row)}
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {loadError ? <div className="px-20 py-12 text-danger">{loadError}</div> : null}

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {showingStart} - {showingEnd} of {filteredData.length} entries
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              {getVisiblePages().map((p) => (
                <button key={p} type="button" className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Salary Payment"
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
                }))
              }}
              selectedSchoolId={manualScope.selectedSchoolId}
              onSchoolChange={(value) => {
                manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value)
                setPendingFilters((prev) => ({
                  ...prev,
                  schoolId: value || 'Select',
                }))
              }}
              schoolLabel="School"
            />
          ) : null}

          {!isSuperAdmin ? (
            <div className="avm-field full">
              <label className="avm-label" htmlFor="salaryPaymentSchool">
                School
              </label>
              <select
                id="salaryPaymentSchool"
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
              <label className="avm-label" htmlFor="salaryPaymentMonth">
                Month
              </label>
              <select
                id="salaryPaymentMonth"
                className="form-control form-select avm-select avm-input"
                value={pendingFilters.month}
                onChange={(e) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    month: e.target.value,
                  }))
                }
              >
                <option value="Select">Select Month</option>
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div className="avm-field">
              <label className="avm-label" htmlFor="salaryPaymentGrade">
                Grade Name
              </label>
              <select
                id="salaryPaymentGrade"
                className="form-control form-select avm-select avm-input"
                value={pendingFilters.gradeName}
                onChange={(e) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    gradeName: e.target.value,
                  }))
                }
              >
                <option value="Select">Select Grade</option>
                {gradeNameOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="avm-grid">
            <div className="avm-field">
              <label className="avm-label" htmlFor="salaryPaymentSalaryType">
                Salary Type
              </label>
              <select
                id="salaryPaymentSalaryType"
                className="form-control form-select avm-select avm-input"
                value={pendingFilters.salaryType}
                onChange={(e) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    salaryType: e.target.value,
                  }))
                }
              >
                <option value="Select">Select Salary Type</option>
                {salaryTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="avm-field">
              <label className="avm-label" htmlFor="salaryPaymentMethod">
                Payment Method
              </label>
              <select
                id="salaryPaymentMethod"
                className="form-control form-select avm-select avm-input"
                value={pendingFilters.paymentMethod}
                onChange={(e) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    paymentMethod: e.target.value,
                  }))
                }
              >
                <option value="Select">Select Method</option>
                {paymentMethodOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="avm-field full">
            <label className="avm-label" htmlFor="salaryPaymentStatus">
              Status
            </label>
            <select
              id="salaryPaymentStatus"
              className="form-control form-select avm-select avm-input w-100"
              value={pendingFilters.status}
              onChange={(e) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
            >
              <option value="Select">Select Status</option>
              {statusOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
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

export default SalaryPayment
