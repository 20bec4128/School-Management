import { useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchIncomesPage } from '../apis/incomesApi'
import { fetchExpendituresPage } from '../apis/expendituresApi'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import { TablePagination } from '../components/table'
import '../assets/css/addModalShared.css'

const makeDefaultFilters = (schoolId = 'Select') => ({
  schoolId,
  transactionType: 'Select',
  paymentMethod: 'Select',
  startDate: '',
  endDate: '',
})

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'transactionType', label: 'Type' },
  { key: 'category', label: 'Category' },
  { key: 'paymentMethod', label: 'Payment Method' },
  { key: 'reference', label: 'Reference' },
  { key: 'amount', label: 'Amount' },
  { key: 'transactionDate', label: 'Transaction Date' },
  { key: 'runningBalance', label: 'Running Balance' },
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

const DailyTransactionReport = () => {
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
    const rowsWithBalance = rows
      .filter((row) => {
        const matchesSearch =
          !q || Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(q))
        const matchesType =
          filters.transactionType === 'Select' || row.transactionType === filters.transactionType
        const matchesMethod =
          filters.paymentMethod === 'Select' || row.paymentMethod === filters.paymentMethod
        const matchesDateStart =
          !filters.startDate || new Date(row.sortDate).getTime() >= new Date(filters.startDate).getTime()
        const matchesDateEnd =
          !filters.endDate || new Date(row.sortDate).getTime() <= new Date(filters.endDate).getTime()
        const matchesSchool =
          filters.schoolId === 'Select' || String(row.schoolId ?? '') === String(filters.schoolId)
        return matchesSearch && matchesType && matchesMethod && matchesDateStart && matchesDateEnd && matchesSchool
      })
      .sort((a, b) => {
        const dateDiff = new Date(a.sortDate).getTime() - new Date(b.sortDate).getTime()
        if (dateDiff !== 0) return dateDiff
        return new Date(a.sortCreatedAt).getTime() - new Date(b.sortCreatedAt).getTime()
      })

    let runningBalance = 0
    return rowsWithBalance.map((row) => {
      runningBalance += Number(row.amountSigned) || 0
      return {
        ...row,
        runningBalance,
      }
    })
  }, [
    rows,
    debouncedSearch,
    filters.endDate,
    filters.paymentMethod,
    filters.schoolId,
    filters.startDate,
    filters.transactionType,
  ])

  const transactionTypeOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.transactionType).filter(Boolean))).sort(),
    [rows],
  )
  const paymentMethodOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.paymentMethod).filter(Boolean))).sort(),
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
        transactionType: row.transactionType || '--',
        category: row.category || '--',
        paymentMethod: row.paymentMethod || '--',
        reference: row.reference || '--',
        amount: row.amount != null ? Number(row.amount).toFixed(2) : '--',
        transactionDate: formatDate(row.transactionDate),
        runningBalance: row.runningBalance != null ? Number(row.runningBalance).toFixed(2) : '--',
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
        const [incomeRows, expenditureRows] = await Promise.all([
          fetchAllPages(fetchIncomesPage, {
            schoolId: selectedSchoolId || null,
            startDate: filters.startDate || null,
            endDate: filters.endDate || null,
          }),
          fetchAllPages(fetchExpendituresPage, {
            schoolId: selectedSchoolId || null,
            startDate: filters.startDate || null,
            endDate: filters.endDate || null,
          }),
        ])

        if (cancelled) return

        const merged = [
          ...incomeRows.map((row) => ({
            id: `income-${row.id}`,
            schoolId: row.schoolId,
            schoolName: row.schoolName || '--',
            transactionType: 'Income',
            category: row.incomeHeadName || '--',
            paymentMethod: row.incomeMethod || '--',
            reference: row.note || '--',
            amount: Number(row.amount) || 0,
            amountSigned: Number(row.amount) || 0,
            transactionDate: row.incomeDate || row.createdAt || null,
            sortDate: row.incomeDate || row.createdAt || null,
            sortCreatedAt: row.createdAt || row.incomeDate || null,
            note: row.note || '--',
          })),
          ...expenditureRows.map((row) => ({
            id: `expenditure-${row.id}`,
            schoolId: row.schoolId,
            schoolName: row.schoolName || '--',
            transactionType: 'Expenditure',
            category: row.expenditureHeadName || '--',
            paymentMethod: row.expenditureMethod || '--',
            reference: row.reference || '--',
            amount: Number(row.amount) || 0,
            amountSigned: -(Number(row.amount) || 0),
            transactionDate: row.expenditureDate || row.createdAt || null,
            sortDate: row.expenditureDate || row.createdAt || null,
            sortCreatedAt: row.createdAt || row.expenditureDate || null,
            note: row.note || '--',
          })),
        ]

        setRows(merged)
      } catch (error) {
        if (cancelled) return
        setRows([])
        setLoadError(error?.message || 'Failed to load daily transaction report')
      } finally {
        if (!cancelled) setBusy(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [status, token, canLoadRows, selectedSchoolId, filters.startDate, filters.endDate])

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
      case 'category':
      case 'paymentMethod':
      case 'reference':
        return <span className="fw-medium text-primary-light">{value || '--'}</span>
      case 'transactionType':
        return (
          <span
            className={`px-12 py-4 radius-4 fw-medium text-sm ${
              value === 'Income' ? 'bg-success-100 text-success-600' : 'bg-danger-100 text-danger-600'
            }`}
          >
            {value || '--'}
          </span>
        )
      case 'amount':
        return <span className="fw-semibold text-primary-light">{formatMoney(value)}</span>
      case 'transactionDate':
        return formatDate(value)
      case 'runningBalance':
        return (
          <span className={`fw-semibold ${Number(value || 0) >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            {formatMoney(value)}
          </span>
        )
      default:
        return value || '--'
    }
  }

  const totalIncome = useMemo(
    () => filteredData.reduce((sum, row) => sum + (row.transactionType === 'Income' ? Number(row.amount) || 0 : 0), 0),
    [filteredData],
  )
  const totalExpenditure = useMemo(
    () => filteredData.reduce((sum, row) => sum + (row.transactionType === 'Expenditure' ? Number(row.amount) || 0 : 0), 0),
    [filteredData],
  )
  const closingBalance = filteredData.length > 0 ? filteredData[filteredData.length - 1].runningBalance || 0 : 0

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Daily Transaction Report</h1>
          <span className="text-secondary-light">Reporting / Financials</span>
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
                fileName="Daily_Transaction_Report"
                sheetName="Daily Transaction Report"
                pdfTitle="Daily Transaction Report"
              />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
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
                placeholder="Search transactions..."
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
                Income: <span className="fw-semibold text-success-600">{formatMoney(totalIncome)}</span>
              </span>
              <span>
                Expenditure: <span className="fw-semibold text-danger-600">{formatMoney(totalExpenditure)}</span>
              </span>
              <span>
                Balance: <span className="fw-semibold text-primary-light">{formatMoney(closingBalance)}</span>
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1250 }}>
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
                      Loading daily transaction report...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      {canLoadRows ? 'No daily transaction records found.' : 'Select a school to view the daily transaction report.'}
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
        title="Find Transactions"
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
                  transactionType: 'Select',
                  paymentMethod: 'Select',
                  startDate: '',
                  endDate: '',
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
              <label className="avm-label" htmlFor="dailyTransactionSchool">
                School
              </label>
              <select
                id="dailyTransactionSchool"
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
              <label className="avm-label" htmlFor="dailyTransactionType">
                Transaction Type
              </label>
              <select
                id="dailyTransactionType"
                className="form-control form-select avm-select avm-input"
                value={pendingFilters.transactionType}
                onChange={(e) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    transactionType: e.target.value,
                  }))
                }
              >
                <option value="Select">All Types</option>
                {transactionTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="avm-field">
              <label className="avm-label" htmlFor="dailyTransactionMethod">
                Payment Method
              </label>
              <select
                id="dailyTransactionMethod"
                className="form-control form-select avm-select avm-input"
                value={pendingFilters.paymentMethod}
                onChange={(e) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    paymentMethod: e.target.value,
                  }))
                }
              >
                <option value="Select">All Methods</option>
                {paymentMethodOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="avm-grid">
            <div className="avm-field">
              <label className="avm-label" htmlFor="dailyTransactionStartDate">
                Start Date
              </label>
              <input
                id="dailyTransactionStartDate"
                type="date"
                className="form-control avm-input"
                value={pendingFilters.startDate}
                onChange={(e) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
            </div>

            <div className="avm-field">
              <label className="avm-label" htmlFor="dailyTransactionEndDate">
                End Date
              </label>
              <input
                id="dailyTransactionEndDate"
                type="date"
                className="form-control avm-input"
                value={pendingFilters.endDate}
                onChange={(e) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="d-flex gap-12">
            <button type="submit" className="btn btn-primary-600 flex-fill">
              Apply Filter
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

export default DailyTransactionReport
