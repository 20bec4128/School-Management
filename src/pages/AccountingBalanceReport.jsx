import { useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchIncomesPage } from '../apis/incomesApi'
import { fetchExpendituresPage } from '../apis/expendituresApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import { TablePagination } from '../components/table'
import '../assets/css/addModalShared.css'

const makeDefaultFilters = (schoolId = 'Select') => ({
  schoolId,
  startDate: '',
  endDate: '',
})

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'groupByData', label: 'Date' },
  { key: 'income', label: 'Income' },
  { key: 'expenditure', label: 'Expenditure' },
  { key: 'balance', label: 'Balance' },
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
  const totalPages = Number.isFinite(first?.totalPages) ? first.totalPages : 1

  if (totalPages <= 1) return firstContent

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      loader({ ...params, page: index + 1, size: 200 }),
    ),
  )

  return [
    ...firstContent,
    ...rest.flatMap((page) => (Array.isArray(page?.content) ? page.content : [])),
  ]
}

const buildBalanceRows = (incomeRows = [], expenditureRows = []) => {
  const rowsByKey = new Map()

  const upsert = (row, type) => {
    const schoolId = row?.schoolId != null ? String(row.schoolId) : ''
    const schoolName = row?.schoolName || 'All Schools'
    const groupByData = row?.incomeDate || row?.expenditureDate || row?.createdAt || ''
    const key = `${schoolId || 'all'}|${schoolName}|${groupByData || 'unknown'}`
    const current = rowsByKey.get(key) || {
      id: key,
      schoolId,
      schoolName,
      groupByData,
      income: 0,
      expenditure: 0,
    }

    const amount = Number(row?.amount) || 0
    if (type === 'income') {
      current.income += amount
    } else {
      current.expenditure += amount
    }
    rowsByKey.set(key, current)
  }

  incomeRows.forEach((row) => upsert(row, 'income'))
  expenditureRows.forEach((row) => upsert(row, 'expenditure'))

  return Array.from(rowsByKey.values())
    .map((row) => ({
      ...row,
      balance: row.income - row.expenditure,
    }))
    .sort((a, b) => {
      const aDate = a.groupByData || ''
      const bDate = b.groupByData || ''
      if (aDate !== bDate) return aDate.localeCompare(bDate)
      return String(a.schoolName || '').localeCompare(String(b.schoolName || ''))
    })
}

const AccountingBalanceReport = () => {
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

  const filteredData = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !q || Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(q))

      return matchesSearch
    })
  }, [rows, debouncedSearch])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredData.slice(start, start + rowsPerPage)
  }, [currentPage, filteredData, rowsPerPage])

  const exportRows = useMemo(
    () =>
      filteredData.map((row) => ({
        School: row.schoolName || '--',
        Date: formatDate(row.groupByData),
        Income: row.income != null ? Number(row.income).toFixed(2) : '--',
        Expenditure: row.expenditure != null ? Number(row.expenditure).toFixed(2) : '--',
        Balance: row.balance != null ? Number(row.balance).toFixed(2) : '--',
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
        const queryParams = {
          schoolId: selectedSchoolId || null,
          startDate: filters.startDate || null,
          endDate: filters.endDate || null,
        }

        const [incomeRows, expenditureRows] = await Promise.all([
          fetchAllPages(fetchIncomesPage, queryParams),
          fetchAllPages(fetchExpendituresPage, queryParams),
        ])

        if (cancelled) return

        const balanceRows = buildBalanceRows(incomeRows, expenditureRows)
        setRows(balanceRows)
      } catch (error) {
        if (cancelled) return
        setRows([])
        setLoadError(error?.message || 'Failed to load accounting balance report')
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
    filters.startDate,
    filters.endDate,
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
        return <span className="fw-medium text-primary-light">{value || '--'}</span>
      case 'groupByData':
        return formatDate(value)
      case 'income':
        return <span className="text-success-600 fw-semibold">{formatMoney(value)}</span>
      case 'expenditure':
        return <span className="text-danger-600 fw-semibold">{formatMoney(value)}</span>
      case 'balance': {
        const amount = Number(value) || 0
        return (
          <span className={`fw-bold ${amount >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            {formatMoney(value)}
          </span>
        )
      }
      default:
        return value || '--'
    }
  }

  const totalIncome = useMemo(
    () => filteredData.reduce((sum, row) => sum + (Number(row?.income) || 0), 0),
    [filteredData],
  )
  const totalExpenditure = useMemo(
    () => filteredData.reduce((sum, row) => sum + (Number(row?.expenditure) || 0), 0),
    [filteredData],
  )
  const netBalance = useMemo(
    () => totalIncome - totalExpenditure,
    [totalIncome, totalExpenditure],
  )

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage))
  const showingStart = filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const showingEnd = Math.min(currentPage * rowsPerPage, filteredData.length)

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Accounting Balance Report</h1>
          <span className="text-secondary-light">Dashboard / Accounting Balance Report</span>
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
                fileName="Accounting_Balance_Report"
                sheetName="Accounting Balance"
                pdfTitle="Accounting Balance Report"
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
                placeholder="Search balance report..."
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
              Showing {showingStart} - {showingEnd} of {filteredData.length} records
            </div>
            <div className="d-flex flex-wrap gap-24 text-sm text-secondary-light">
              <span>
                Total income: <span className="fw-semibold text-success-600">{formatMoney(totalIncome)}</span>
              </span>
              <span>
                Total expenditure: <span className="fw-semibold text-danger-600">{formatMoney(totalExpenditure)}</span>
              </span>
              <span>
                Net balance: <span className="fw-semibold text-primary-light">{formatMoney(netBalance)}</span>
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1000 }}>
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
                      Loading accounting balance report...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      {canLoadRows ? 'No accounting balance records found.' : 'Select a school to view the accounting balance report.'}
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
                pageInfo: `Showing ${showingStart} - ${showingEnd} of ${filteredData.length} entries`,
                onPageChange: (next) => setCurrentPage(Math.min(Math.max(1, Number(next) || 1), totalPages)),
              }}
            />
          </div>
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Balance Report"
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
                setPendingFilters((prev) => ({ ...prev, schoolId: 'Select' }))
              }}
              selectedSchoolId={manualScope.selectedSchoolId}
              onSchoolChange={(value) => {
                manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value)
                setPendingFilters((prev) => ({ ...prev, schoolId: value || 'Select' }))
              }}
              schoolLabel="School"
            />
          ) : (
            <div>
              <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
              <select
                className="form-control form-select"
                value={pendingFilters.schoolId}
                onChange={(e) => setPendingFilters((prev) => ({ ...prev, schoolId: e.target.value }))}
                disabled={isSchoolAdmin}
              >
                <option value="Select">All Schools</option>
                {schoolOptions.map((school) => (
                  <option key={school.id} value={String(school.id)}>
                    {school.schoolName || school.name || `School ${school.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

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

export default AccountingBalanceReport
