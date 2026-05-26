import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ExportDropdown from '../components/ExportDropdown'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchLibraryIssuesPage, updateLibraryIssue } from '../apis/libraryIssuesApi'
import '../assets/css/addModalShared.css'

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  status: '',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'borrowerPhoto', label: 'Photo' },
  { key: 'borrowerName', label: 'Borrower' },
  { key: 'borrowerType', label: 'Type' },
  { key: 'borrowerContext', label: 'Context' },
  { key: 'bookTitle', label: 'Title' },
  { key: 'bookId', label: 'Book ID' },
  { key: 'issueDate', label: 'Issue Date' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'status', label: 'Status' },
  { key: 'returnDate', label: 'Return Date' },
  { key: 'bookCover', label: 'Book Cover' },
]

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  Status: 'ri-list-check',
}

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
      <div className="avm-input-with-icon" style={{ position: 'relative' }}>
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '0.85rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#667085',
            fontSize: '0.95rem',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <i className={icon} />
        </span>
        {children}
      </div>
    </div>
  )
}

const getSchoolById = (rows, schoolId) =>
  (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(schoolId ?? '')) || null

const IssueReturn = ({ onNavigate }) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, schoolId: authSchoolId, schoolName: authSchoolName, canAdd, canEdit, canDelete } = useAuth()
  const PAGE_SLUG = 'issue-return'
  const { activeSchoolId } = useSchool()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [rows, setRows] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const filterSchoolOptions = useMemo(() => {
    const rowsList = Array.isArray(allSchools) ? allSchools : []
    const scopeHeadOfficeId = pendingFilters.headOfficeId || filters.headOfficeId
    if (scopeHeadOfficeId) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(scopeHeadOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return rowsList.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return rowsList
  }, [allSchools, authHeadOfficeId, authSchoolId, filters.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin, pendingFilters.headOfficeId])

  const resolveSchoolName = useCallback(
    (schoolId) => getSchoolById(allSchools, schoolId)?.schoolName || (String(schoolId ?? '') === String(authSchoolId ?? '') ? authSchoolName || '' : ''),
    [allSchools, authSchoolId, authSchoolName],
  )

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    let cancelled = false

    const loadLookups = async () => {
      setLookupLoading(true)
      try {
        const schools = await fetchSchoolsLookup()
        if (cancelled) return
        setAllSchools(Array.isArray(schools) ? schools : [])
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load issue lookups:', err)
        setAllSchools([])
      } finally {
        if (!cancelled) setLookupLoading(false)
      }
    }

    void loadLookups()
    return () => {
      cancelled = true
    }
  }, [status, token])

  useEffect(() => {
    if (!isSuperAdmin) return
    if (!activeSchoolId) return
    const school = getSchoolById(allSchools, activeSchoolId)
    if (school?.headOfficeId == null) return
    setPendingFilters((prev) => ({
      ...prev,
      headOfficeId: String(school.headOfficeId),
      schoolId: String(activeSchoolId),
    }))
  }, [activeSchoolId, allSchools, isSuperAdmin])

  useEffect(() => {
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      setPendingFilters((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
    }
  }, [authHeadOfficeId, isHeadOfficeAdmin])

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return
    const school = getSchoolById(allSchools, authSchoolId)
    setPendingFilters((prev) => ({
      ...prev,
      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
      schoolId: String(authSchoolId),
    }))
  }, [allSchools, authSchoolId, isSchoolAdmin])

  const loadIssues = useCallback(async () => {
    if (status !== 'ready' || !token) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchLibraryIssuesPage({
        page: currentPage - 1,
        size: rowsPerPage,
        search: debouncedSearch,
        headOfficeId: filters.headOfficeId || undefined,
        schoolId: filters.schoolId || undefined,
        status: filters.status || undefined,
      })
      setRows(Array.isArray(data?.content) ? data.content : [])
      setTotalElements(Number(data?.totalElements ?? 0))
      setTotalPages(Number(data?.totalPages ?? 0))
    } catch (err) {
      console.error('Failed to load library issues:', err)
      setError(err?.message || 'Failed to load issue records')
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, filters.headOfficeId, filters.schoolId, filters.status, rowsPerPage, status, token])

  useEffect(() => {
    void loadIssues()
  }, [loadIssues])

  useEffect(() => {
    const handleStockUpdate = () => {
      void loadIssues()
    }

    window.addEventListener('library-book-stock-updated', handleStockUpdate)
    return () => window.removeEventListener('library-book-stock-updated', handleStockUpdate)
  }, [loadIssues])

  useEffect(() => {
    if (currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
  }

  const loadExportRows = useCallback(async () => {
    const size = Math.max(totalElements, rowsPerPage, 1)
    const data = await fetchLibraryIssuesPage({
      page: 0,
      size,
      search: debouncedSearch,
      headOfficeId: filters.headOfficeId || undefined,
      schoolId: filters.schoolId || undefined,
      status: filters.status || undefined,
    })
    return Array.isArray(data?.content) ? data.content : []
  }, [debouncedSearch, filters.headOfficeId, filters.schoolId, filters.status, rowsPerPage, totalElements])

  const mapExportRow = useCallback(
    (row) => ({
      ...row,
      schoolName: row.schoolName || resolveSchoolName(row.schoolId),
      borrowerName: row.borrowerName || row.studentName || row.employeeName || '',
      borrowerType: row.borrowerType || (row.employeeId ? 'EMPLOYEE' : row.studentId ? 'STUDENT' : ''),
      borrowerContext: row.borrowerContext || row.className || row.employeeRole || '',
    }),
    [resolveSchoolName],
  )

  const handleReturnBook = async (row) => {
    if (!window.confirm(`Mark "${row?.bookTitle || 'this book'}" as returned?`)) return
    setSaving(true)
    setError('')
    try {
      await updateLibraryIssue(row.id, {
        returnDate: new Date().toISOString().slice(0, 10),
      })
      await loadIssues()
      window.dispatchEvent(new Event('library-book-stock-updated'))
    } catch (err) {
      console.error('Failed to return book:', err)
      setError(err?.message || 'Failed to return book')
    } finally {
      setSaving(false)
    }
  }

  const currentStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const currentEnd = totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Issue & Return</h1>
          <span className="text-secondary-light">Library / Issue & Return</span>
        </div>
        {canAdd(PAGE_SLUG) && (
          <button
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            type="button"
            onClick={() => onNavigate?.('issue-book-create')}
          >
            <i className="ri-add-large-line"></i> Issue Book
          </button>
        )}
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {error ? <div className="px-20 py-12 text-danger">{error}</div> : null}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown
                rows={rows}
                columns={columnOptions}
                visibleColumns={visibleColumns}
                loadRows={loadExportRows}
                mapRow={mapExportRow}
                fileName="Issue_Return_List"
                sheetName="Issues_Returns"
                pdfTitle="Issue & Return Report"
                loading={saving}
              />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="text-secondary-light text-sm">Find</span>
                <i className="ri-arrow-right-line"></i>
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
                <ul className="dropdown-menu p-12 border shadow">
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
                value={rowsPerPage}
                onChange={(value) => {
                  setRowsPerPage(value)
                  setCurrentPage(1)
                }}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search issue records..."
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

          {lookupLoading ? <div className="px-20 py-12 text-secondary-light">Loading lookups...</div> : null}

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table">
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {columnOptions.map((col) => visibleColumns[col.key] && (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading issue records...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id ?? idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" />
                          <label className="form-check-label">{currentStart + idx}</label>
                        </div>
                      </td>
                      {columnOptions.map((col) => visibleColumns[col.key] && (
                        <td key={col.key}>
                          {col.key === 'borrowerPhoto' ? (
                            row.borrowerPhoto || row.studentPhoto || row.employeePhoto ? (
                              <img
                                src={row.borrowerPhoto || row.studentPhoto || row.employeePhoto}
                                alt={row.borrowerName || row.studentName || row.employeeName || 'borrower'}
                                className="w-40-px h-40-px rounded-circle object-fit-cover"
                              />
                            ) : (
                              '--'
                            )
                          ) : col.key === 'bookCover' ? (
                            row.bookCover ? (
                              <img
                                src={row.bookCover}
                                alt={row.bookTitle || 'book'}
                                className="w-40-px h-50-px radius-4 object-fit-cover"
                              />
                            ) : (
                              '--'
                            )
                          ) : col.key === 'borrowerName' ? (
                            <span className="fw-medium text-primary-light">
                              {row.borrowerName || row.studentName || row.employeeName || '--'}
                            </span>
                          ) : col.key === 'borrowerType' ? (
                            row.borrowerType || (row.employeeId ? 'EMPLOYEE' : row.studentId ? 'STUDENT' : '--')
                          ) : col.key === 'borrowerContext' ? (
                            row.borrowerContext || row.className || row.employeeRole || '--'
                          ) : col.key === 'schoolName' ? (
                            row.schoolName || resolveSchoolName(row.schoolId) || '--'
                          ) : col.key === 'status' ? (
                            <span
                              className={`badge ${
                                String(row.status || '').toUpperCase() === 'RETURNED'
                                  ? 'bg-success-focus text-success-600'
                                  : 'bg-warning-focus text-warning-600'
                              }`}
                            >
                              {row.status || '--'}
                            </span>
                          ) : (
                            row[col.key] ?? '--'
                          )}
                        </td>
                      ))}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          {canEdit(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="text-success-600 bg-success-focus w-32-px h-32-px rounded-circle border-0 d-flex align-items-center justify-content-center"
                              title="Return Book"
                              onClick={() => handleReturnBook(row)}
                              disabled={saving || row.status === 'RETURNED'}
                            >
                              <i className="ri-arrow-go-back-line"></i>
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

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {totalElements === 0 ? 0 : currentStart} - {currentEnd} of {totalElements} entries
            </span>
            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || totalPages < 1}
              >
                Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 3) }, (_, index) => {
                const base = Math.max(1, currentPage - 1)
                const pageNumber = Math.min(totalPages, base + index)
                return pageNumber > 0 ? (
                  <button
                    key={pageNumber}
                    type="button"
                    className={pageNumber === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'}
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ) : null
              })}
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.min(Math.max(1, totalPages), p + 1))}
                disabled={currentPage === totalPages || totalPages < 1}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        title="Find Issue"
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={manualScope.headOffices}
              schoolOptions={filterSchoolOptions}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={(value) => {
                setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))
              }}
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={(value) => {
                const selectedSchool = getSchoolById(allSchools, value)
                setPendingFilters((prev) => ({
                  ...prev,
                  schoolId: value,
                  headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
                }))
              }}
              schoolLabel="School"
            />
          ) : (
            <FormField label="School Name" full>
              <select
                className="avm-select"
                value={pendingFilters.schoolId}
                onChange={(e) => {
                  const value = e.target.value
                  setPendingFilters((prev) => ({ ...prev, schoolId: value }))
                }}
              >
                <option value="">All Schools</option>
                {filterSchoolOptions.map((school) => (
                  <option key={String(school.id)} value={String(school.id)}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <FormField label="Status" full>
            <select
              className="avm-select"
              value={pendingFilters.status}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="ISSUED">Issued</option>
              <option value="RETURNED">Returned</option>
            </select>
          </FormField>

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

export default IssueReturn
