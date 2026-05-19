import { useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchFeeCollectionsPage } from '../apis/feeCollectionApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchFeeTypes } from '../apis/feeTypesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import { TablePagination } from '../components/table'
import '../assets/css/addModalShared.css'

const monthOptions = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const makeDefaultFilters = (schoolId = 'Select') => ({
  schoolId,
  classId: 'Select',
  feeTypeId: 'Select',
  month: 'Select',
})

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'className', label: 'Class' },
  { key: 'studentName', label: 'Student / Sale To' },
  { key: 'invoiceNumber', label: 'Invoice No.' },
  { key: 'month', label: 'Month' },
  { key: 'netAmount', label: 'Net Amount' },
  { key: 'paidAmount', label: 'Paid Amount' },
  { key: 'dueAmount', label: 'Due Amount' },
  { key: 'paidStatus', label: 'Status' },
]

const formatMoney = (value) => {
  if (value == null || value === '') return '--'
  const amount = Number(value)
  if (Number.isNaN(amount)) return '--'
  return `Rs. ${amount.toFixed(2)}`
}

const getStatusBadge = (status) => {
  const s = String(status || '').toLowerCase()
  if (s === 'partial') return <span className="bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm">Partial</span>
  if (s === 'paid') return <span className="bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm">Paid</span>
  return <span className="bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm">Unpaid</span>
}

const DueFeeReport = () => {
  const { status, token, user, role: authRole, schoolId: authSchoolId, headOfficeId: authHeadOfficeId } = useAuth()
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
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [classes, setClasses] = useState([])
  const [feeTypes, setFeeTypes] = useState([])
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
  }, [filters.schoolId, isSchoolAdmin, authSchoolId])

  const canLoadRows = isSuperAdmin || Boolean(selectedSchoolId)

  const schoolOptions = useMemo(() => {
    const rows = isSuperAdmin
      ? (Array.isArray(manualScope.schoolOptions) ? manualScope.schoolOptions : [])
      : (Array.isArray(schools) ? schools : [])
    if (isSuperAdmin) return rows
    if (isHeadOfficeAdmin) {
      return rows.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return rows.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return rows
  }, [authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.schoolOptions, schools])

  const classOptions = useMemo(() => (Array.isArray(classes) ? classes : []), [classes])
  const feeTypeOptions = useMemo(() => (Array.isArray(feeTypes) ? feeTypes : []), [feeTypes])

  const exportRows = useMemo(
    () =>
      rows.map((row) => ({
        School: row.schoolName || '--',
        Class: row.className || '--',
        Student: row.studentName || '--',
        'Invoice No.': row.invoiceNumber || '--',
        Month: row.month || '--',
        'Net Amount': row.netAmount != null ? Number(row.netAmount).toFixed(2) : '--',
        'Paid Amount': row.paidAmount != null ? Number(row.paidAmount).toFixed(2) : '--',
        'Due Amount': row.dueAmount != null ? Number(row.dueAmount).toFixed(2) : '--',
        Status: row.paidStatus || '--',
      })),
    [rows],
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
    let cancelled = false

    const load = async () => {
      try {
        const schoolId = pendingFilters.schoolId && pendingFilters.schoolId !== 'Select' ? pendingFilters.schoolId : null
        const [classData, feeTypeData] = await Promise.all([
          fetchClasses({ schoolId }),
          fetchFeeTypes({ schoolId }),
        ])
        if (cancelled) return
        setClasses(Array.isArray(classData) ? classData : [])
        setFeeTypes(Array.isArray(feeTypeData) ? feeTypeData : [])
      } catch {
        if (cancelled) return
        setClasses([])
        setFeeTypes([])
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [status, token, pendingFilters.schoolId])

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
        const data = await fetchFeeCollectionsPage({
          schoolId: selectedSchoolId || null,
          classId: filters.classId && filters.classId !== 'Select' ? filters.classId : null,
          feeTypeId: filters.feeTypeId && filters.feeTypeId !== 'Select' ? filters.feeTypeId : null,
          month: filters.month && filters.month !== 'Select' ? filters.month : null,
          dueOnly: true,
          search: debouncedSearch,
          page: currentPage - 1,
          size: rowsPerPage,
        })

        if (cancelled) return
        const content = Array.isArray(data?.content) ? data.content : []
        setRows(content.map((row) => ({
          ...row,
          paidAmount: row.netAmount != null && row.dueAmount != null ? Number(row.netAmount) - Number(row.dueAmount) : null,
        })))
        setTotalElements(Number.isFinite(data?.totalElements) ? data.totalElements : 0)
        setTotalPages(Number.isFinite(data?.totalPages) ? data.totalPages : 0)
      } catch (error) {
        if (cancelled) return
        setRows([])
        setTotalElements(0)
        setTotalPages(0)
        setLoadError(error?.message || 'Failed to load due fee report')
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
    filters.classId,
    filters.feeTypeId,
    filters.month,
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

  const renderCell = (row, column) => {
    const value = row[column.key]

    switch (column.key) {
      case 'schoolName':
      case 'className':
      case 'studentName':
      case 'invoiceNumber':
        return <span className="fw-medium text-primary-light">{value || '--'}</span>
      case 'paidStatus':
        return getStatusBadge(value)
      case 'netAmount':
      case 'paidAmount':
      case 'dueAmount':
        return <span className="fw-semibold">{formatMoney(value)}</span>
      default:
        return value || '--'
    }
  }

  const totalDueAmount = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row?.dueAmount) || 0), 0),
    [rows],
  )

  const showingStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const showingEnd = Math.min(currentPage * rowsPerPage, totalElements)

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Due Fee Report</h1>
          <span className="text-secondary-light">Dashboard / Due Fee Report</span>
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
                fileName="Due_Fee_Report"
                sheetName="Due Fee Report"
                pdfTitle="Due Fee Report"
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
                onChange={(value) => {
                  setRowsPerPage(value)
                  setCurrentPage(1)
                }}
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search due fees..."
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
            <div className="text-sm text-secondary-light">
              Current due total: <span className="fw-semibold text-primary-light">{formatMoney(totalDueAmount)}</span>
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
                      Loading due fee report...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      {canLoadRows ? 'No due fee records found.' : 'Select a school to view the due fee report.'}
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

          <div className="px-20 py-16 border-top border-neutral-200">
            <TablePagination
              paginationProps={{
                currentPage,
                totalPages: Math.max(1, totalPages),
                pageInfo: `Showing ${showingStart} - ${showingEnd} of ${totalElements} entries`,
                onPageChange: (next) => setCurrentPage(Math.min(Math.max(1, Number(next) || 1), Math.max(1, totalPages))),
              }}
            />
          </div>
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Due Fee Report"
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
                setPendingFilters((prev) => ({ ...prev, schoolId: 'Select', classId: 'Select', feeTypeId: 'Select' }))
              }}
              selectedSchoolId={manualScope.selectedSchoolId}
              onSchoolChange={(value) => {
                manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value)
                setPendingFilters((prev) => ({ ...prev, schoolId: value || 'Select', classId: 'Select', feeTypeId: 'Select' }))
              }}
              schoolLabel="School"
            />
          ) : (
            <div>
              <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
              <select
                className="form-control form-select"
                value={pendingFilters.schoolId}
                onChange={(e) => setPendingFilters((prev) => ({ ...prev, schoolId: e.target.value, classId: 'Select', feeTypeId: 'Select' }))}
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
          )}

          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Class</label>
            <select
              className="form-control form-select"
              value={pendingFilters.classId}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, classId: e.target.value }))}
            >
              <option value="Select">All Classes</option>
              {classOptions.map((classRow) => (
                <option key={classRow.id} value={String(classRow.id)}>
                  {classRow.className || classRow.name || `Class ${classRow.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Fee Type</label>
            <select
              className="form-control form-select"
              value={pendingFilters.feeTypeId}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, feeTypeId: e.target.value }))}
            >
              <option value="Select">All Fee Types</option>
              {feeTypeOptions.map((feeType) => (
                <option key={feeType.id} value={String(feeType.id)}>
                  {feeType.title || feeType.feeType || `Fee Type ${feeType.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Month</label>
            <select
              className="form-control form-select"
              value={pendingFilters.month}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, month: e.target.value }))}
            >
              <option value="Select">All Months</option>
              {monthOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
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

export default DueFeeReport
