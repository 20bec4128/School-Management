import { useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchBooksPage } from '../apis/booksApi'
import { fetchLibraryIssuesPage } from '../apis/libraryIssuesApi'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import { TablePagination } from '../components/table'
import '../assets/css/addModalShared.css'

const makeDefaultFilters = (schoolId = 'Select') => ({
  headOfficeId: '',
  schoolId,
  language: '',
  edition: '',
  almiraNo: '',
})

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'title', label: 'Title' },
  { key: 'bookId', label: 'Book ID' },
  { key: 'language', label: 'Language' },
  { key: 'edition', label: 'Edition' },
  { key: 'issueCount', label: 'Issue Count' },
  { key: 'returnCount', label: 'Return Count' },
  { key: 'remain', label: 'Remain' },
]

const formatNumber = (value) => {
  if (value == null || value === '') return '--'
  const amount = Number(value)
  if (Number.isNaN(amount)) return '--'
  return String(amount)
}

const fetchAllPages = async (loader, params) => {
  const first = await loader({ ...params, page: 0, size: 200 })
  const firstContent = Array.isArray(first?.content) ? first.content : []
  const totalPages = Number.isFinite(first?.totalPages) ? first.totalPages : 1

  if (totalPages <= 1) return firstContent

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => loader({ ...params, page: index + 1, size: 200 })),
  )

  return [
    ...firstContent,
    ...rest.flatMap((page) => (Array.isArray(page?.content) ? page.content : [])),
  ]
}

const buildLibraryRows = (books = [], issues = []) => {
  const countsByBook = new Map()

  for (const issue of issues) {
    const key = `${issue?.schoolId ?? ''}|${issue?.bookId ?? ''}`
    const current = countsByBook.get(key) || { issueCount: 0, returnCount: 0 }
    if (String(issue?.status || '').toUpperCase() === 'RETURNED') {
      current.returnCount += 1
    } else {
      current.issueCount += 1
    }
    countsByBook.set(key, current)
  }

  return books
    .map((book) => {
      const key = `${book?.schoolId ?? ''}|${book?.id ?? ''}`
      const counts = countsByBook.get(key) || { issueCount: 0, returnCount: 0 }
      const remain = Number(book?.quantity) || 0

      return {
        id: book?.id,
        schoolId: book?.schoolId,
        schoolName: book?.schoolName || 'Unknown',
        title: book?.title || '--',
        bookId: book?.bookId || '--',
        language: book?.language || '--',
        edition: book?.edition || '--',
        almiraNo: book?.almiraNo || '',
        issueCount: counts.issueCount,
        returnCount: counts.returnCount,
        remain,
        status: remain > 0 ? 'Available' : 'Out of Stock',
      }
    })
    .sort((a, b) => {
      const schoolCompare = String(a.schoolName || '').localeCompare(String(b.schoolName || ''))
      if (schoolCompare !== 0) return schoolCompare
      return String(a.title || '').localeCompare(String(b.title || ''))
    })
}

const LibraryReport = () => {
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

  const canLoadRows = isSuperAdmin || Boolean(selectedSchoolId || selectedHeadOfficeId)

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

  const filteredData = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return rows.filter((row) => {
      if (!q) return true
      return Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(q))
    })
  }, [rows, debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredData.slice(start, start + rowsPerPage)
  }, [currentPage, filteredData, rowsPerPage])

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
          headOfficeId: selectedHeadOfficeId || null,
          schoolId: selectedSchoolId || null,
          language: filters.language || null,
          edition: filters.edition || null,
          almiraNo: filters.almiraNo || null,
          search: debouncedSearch,
        }

        const [bookRows, issueRows] = await Promise.all([
          fetchAllPages(fetchBooksPage, queryParams),
          fetchAllPages(fetchLibraryIssuesPage, {
            headOfficeId: selectedHeadOfficeId || null,
            schoolId: selectedSchoolId || null,
            search: debouncedSearch,
          }),
        ])

        if (cancelled) return
        setRows(buildLibraryRows(bookRows, issueRows))
      } catch (error) {
        if (cancelled) return
        setRows([])
        setLoadError(error?.message || 'Failed to load library report')
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
    selectedHeadOfficeId,
    selectedSchoolId,
    filters.language,
    filters.edition,
    filters.almiraNo,
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
      case 'title':
        return <span className="fw-medium text-primary-light">{value || '--'}</span>
      case 'issueCount':
        return <span className="text-primary-600 fw-semibold">{formatNumber(value)}</span>
      case 'returnCount':
        return <span className="text-success-600 fw-semibold">{formatNumber(value)}</span>
      case 'remain':
        return <span className="fw-bold text-danger-600">{formatNumber(value)}</span>
      default:
        return value || '--'
    }
  }

  const totalIssueCount = useMemo(
    () => filteredData.reduce((sum, row) => sum + (Number(row?.issueCount) || 0), 0),
    [filteredData],
  )
  const totalReturnCount = useMemo(
    () => filteredData.reduce((sum, row) => sum + (Number(row?.returnCount) || 0), 0),
    [filteredData],
  )
  const totalRemain = useMemo(
    () => filteredData.reduce((sum, row) => sum + (Number(row?.remain) || 0), 0),
    [filteredData],
  )

  const showingStart = filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const showingEnd = Math.min(currentPage * rowsPerPage, filteredData.length)

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Library Report</h1>
          <span className="text-secondary-light">Dashboard / Library Report</span>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown rows={filteredData} columns={columnOptions} visibleColumns={visibleColumns} fileName="Library_Report" sheetName="Library Report" pdfTitle="Library Report" />

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
                placeholder="Search books..."
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
                Issues: <span className="fw-semibold text-primary-light">{formatNumber(totalIssueCount)}</span>
              </span>
              <span>
                Returns: <span className="fw-semibold text-success-600">{formatNumber(totalReturnCount)}</span>
              </span>
              <span>
                Available copies: <span className="fw-semibold text-danger-600">{formatNumber(totalRemain)}</span>
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
                      Loading library report...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      {canLoadRows ? 'No library records found.' : 'Select a school to view the library report.'}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr key={row.id ?? `${row.schoolId}-${row.bookId}-${idx}`}>
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
                totalPages: Math.max(1, totalPages),
                pageInfo: `Showing ${showingStart} - ${showingEnd} of ${filteredData.length} entries`,
                onPageChange: (next) => setCurrentPage(Math.min(Math.max(1, Number(next) || 1), Math.max(1, totalPages))),
              }}
            />
          </div>
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Library Report"
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
                setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: 'Select' }))
              }}
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={(value) => {
                const selectedSchool = filterSchoolOptions.find((school) => String(school?.id ?? '') === String(value ?? ''))
                manualScope.setSelectedScope(pendingFilters.headOfficeId, value)
                setPendingFilters((prev) => ({
                  ...prev,
                  schoolId: value || 'Select',
                  headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
                }))
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
                {filterSchoolOptions.map((school) => (
                  <option key={school.id} value={String(school.id)}>
                    {school.schoolName || school.name || `School ${school.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Language</label>
            <input
              type="text"
              className="form-control"
              value={pendingFilters.language}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, language: e.target.value }))}
              placeholder="Language"
            />
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Edition</label>
            <input
              type="text"
              className="form-control"
              value={pendingFilters.edition}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, edition: e.target.value }))}
              placeholder="Edition"
            />
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Almira No</label>
            <input
              type="text"
              className="form-control"
              value={pendingFilters.almiraNo}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, almiraNo: e.target.value }))}
              placeholder="Almira No"
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

export default LibraryReport
