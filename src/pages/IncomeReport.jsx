import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchIncomeHeads } from '../apis/incomeHeadsApi'
import { fetchIncomesPage } from '../apis/incomesApi'
import ExportDropdown from '../components/ExportDropdown'
import '../assets/css/addModalShared.css'

const INCOME_METHOD_OPTIONS = ['Cash', 'Bank', 'Online', 'Cheque', 'Mobile Banking', 'Other']

const makeDefaultFilters = (schoolId = 'Select') => ({
  schoolId,
  incomeHeadId: 'Select',
  incomeMethod: 'Select',
  startDate: '',
  endDate: '',
})

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'incomeHeadName', label: 'Income Head' },
  { key: 'incomeMethod', label: 'Income Method' },
  { key: 'amount', label: 'Amount' },
  { key: 'incomeDate', label: 'Income Date' },
  { key: 'note', label: 'Note' },
  { key: 'createdAt', label: 'Created At' },
]

const formatMoney = (value) => {
  if (value == null || value === '') return '--'
  const amount = Number(value)
  if (Number.isNaN(amount)) return '--'
  return `Rs. ${amount.toFixed(2)}`
}

const formatDate = (value) => {
  if (!value) return '--'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-IN')
}

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-IN')
}

const IncomeReport = () => {
  const { status, token, user, role: authRole, schoolId: authSchoolId } = useAuth()
  const role = useMemo(
    () => normalizeRole(authRole || user?.role || user?.userRole || user?.authority),
    [authRole, user],
  )

  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'

  const initialSchoolId = authSchoolId != null ? String(authSchoolId) : 'Select'
  const [rows, setRows] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [schools, setSchools] = useState([])
  const [incomeHeads, setIncomeHeads] = useState([])

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
    if (isSchoolAdmin || isHeadOfficeAdmin) return authSchoolId != null ? String(authSchoolId) : ''
    return ''
  }, [filters.schoolId, isSchoolAdmin, isHeadOfficeAdmin, authSchoolId])

  const canLoadRows = isSuperAdmin || Boolean(selectedSchoolId)

  const schoolOptions = useMemo(() => {
    return Array.isArray(schools) ? schools : []
  }, [schools])

  const exportRows = useMemo(
    () =>
      rows.map((row) => ({
        School: row.schoolName || '--',
        'Income Head': row.incomeHeadName || '--',
        'Income Method': row.incomeMethod || '--',
        Amount: row.amount != null ? Number(row.amount).toFixed(2) : '--',
        'Income Date': row.incomeDate || '--',
        Note: row.note || '--',
        'Created At': row.createdAt || '--',
      })),
    [rows],
  )

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (status !== 'ready' || !token) return

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
  }, [status, token])

  useEffect(() => {
    if (status !== 'ready' || !token) return

    let cancelled = false
    const load = async () => {
      const schoolId = pendingFilters.schoolId && pendingFilters.schoolId !== 'Select' ? pendingFilters.schoolId : null

      try {
        let list = []
        if (schoolId) {
          list = await fetchIncomeHeads({ schoolId })
        } else if (isSuperAdmin) {
          list = await fetchIncomeHeads()
        } else if (authSchoolId != null) {
          list = await fetchIncomeHeads({ schoolId: authSchoolId })
        }

        if (!cancelled) setIncomeHeads(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setIncomeHeads([])
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [status, token, pendingFilters.schoolId, isSuperAdmin, authSchoolId])

  useEffect(() => {
    if (status !== 'ready' || !token) return

    if (!canLoadRows) {
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
      return
    }

    let cancelled = false
    const load = async () => {
      setBusy(true)
      setLoadError('')
      try {
        const data = await fetchIncomesPage({
          schoolId: selectedSchoolId || null,
          incomeHeadId: filters.incomeHeadId && filters.incomeHeadId !== 'Select' ? filters.incomeHeadId : null,
          incomeMethod: filters.incomeMethod && filters.incomeMethod !== 'Select' ? filters.incomeMethod : null,
          startDate: filters.startDate || null,
          endDate: filters.endDate || null,
          page: currentPage - 1,
          size: rowsPerPage,
          search: debouncedSearch,
        })

        if (cancelled) return
        setRows(Array.isArray(data?.content) ? data.content : [])
        setTotalElements(Number.isFinite(data?.totalElements) ? data.totalElements : 0)
        setTotalPages(Number.isFinite(data?.totalPages) ? data.totalPages : 0)
      } catch (error) {
        if (cancelled) return
        setRows([])
        setTotalElements(0)
        setTotalPages(0)
        setLoadError(error?.message || 'Failed to load income report')
      } finally {
        if (!cancelled) setBusy(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [
    status,
    token,
    canLoadRows,
    selectedSchoolId,
    filters.incomeHeadId,
    filters.incomeMethod,
    filters.startDate,
    filters.endDate,
    currentPage,
    rowsPerPage,
    debouncedSearch,
  ])

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
    setPendingFilters(nextFilters)
    setFilters(nextFilters)
    setCurrentPage(1)
  }

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Income Report')
    XLSX.writeFile(workbook, 'Income_Report.xlsx')
  }

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.text('Income Report', 14, 12)
    doc.autoTable({
      startY: 18,
      head: [columnOptions.map((column) => column.label)],
      body: rows.map((row) =>
        columnOptions.map((column) => {
          if (column.key === 'amount') return row.amount != null ? Number(row.amount).toFixed(2) : '--'
          if (column.key === 'incomeDate') return formatDate(row.incomeDate)
          if (column.key === 'createdAt') return formatDateTime(row.createdAt)
          return row[column.key] || '--'
        }),
      ),
    })
    doc.save('Income_Report.pdf')
  }

  const renderCell = (row, column) => {
    const value = row[column.key]

    switch (column.key) {
      case 'schoolName':
      case 'incomeHeadName':
        return <span className="fw-medium text-primary-light">{value || '--'}</span>
      case 'incomeMethod':
        return value || '--'
      case 'amount':
        return <span className="fw-semibold text-success">{formatMoney(value)}</span>
      case 'incomeDate':
        return formatDate(value)
      case 'createdAt':
        return formatDateTime(value)
      case 'note':
        return <span style={{ maxWidth: 220, display: 'inline-block', whiteSpace: 'normal' }}>{value || '--'}</span>
      default:
        return value || '--'
    }
  }

  const totalAmount = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row?.amount) || 0), 0),
    [rows],
  )

  const pageCount = Math.max(1, totalPages)
  const showingStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const showingEnd = Math.min(currentPage * rowsPerPage, totalElements)

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Income Report</h1>
          <span className="text-secondary-light">Dashboard / Income Report</span>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={handleExportExcel} onExportPDF={handleExportPDF} />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
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
                placeholder="Search income..."
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
              Showing {showingStart} - {showingEnd} of {totalElements} records
            </div>
            <div className="text-sm text-secondary-light">
              Current page total: <span className="fw-semibold text-primary-light">{formatMoney(totalAmount)}</span>
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
                      Loading income report...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      {canLoadRows ? 'No income records found.' : 'Select a school to view the income report.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
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

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {showingStart} - {showingEnd} of {totalElements} entries
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
              {Array.from({ length: pageCount }, (_, i) => i + 1)
                .slice(Math.max(0, currentPage - 2), currentPage + 1)
                .map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={page === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Income Report"
        onClose={() => setIsFilterSidebarOpen(false)}
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
            <select
              className="form-control form-select"
              value={pendingFilters.schoolId}
              onChange={(e) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  schoolId: e.target.value,
                  incomeHeadId: 'Select',
                }))
              }
              disabled={isSchoolAdmin}
            >
              <option value="Select">All Schools</option>
              {schoolOptions.map((school) => (
                <option key={school.id} value={String(school.id)}>
                  {school.schoolName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Income Head</label>
            <select
              className="form-control form-select"
              value={pendingFilters.incomeHeadId}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, incomeHeadId: e.target.value }))}
              disabled={!isSuperAdmin && pendingFilters.schoolId === 'Select' && authSchoolId == null}
            >
              <option value="Select">{pendingFilters.schoolId !== 'Select' ? 'All Heads' : 'Select School First'}</option>
              {incomeHeads.map((head) => (
                <option key={head.id} value={String(head.id)}>
                  {head.incomeHead}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Income Method</label>
            <select
              className="form-control form-select"
              value={pendingFilters.incomeMethod}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, incomeMethod: e.target.value }))}
            >
              <option value="Select">All Methods</option>
              {INCOME_METHOD_OPTIONS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={pendingFilters.startDate}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, startDate: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">End Date</label>
            <input
              type="date"
              className="form-control"
              value={pendingFilters.endDate}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, endDate: e.target.value }))}
            />
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

export default IncomeReport
