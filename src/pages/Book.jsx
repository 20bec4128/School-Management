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
import { deleteBook, fetchBooksPage } from '../apis/booksApi'
import { apiUrl } from '../apis/apiClient'
import '../assets/css/addModalShared.css'

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  language: '',
  edition: '',
  almiraNo: '',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'title', label: 'Title' },
  { key: 'bookId', label: 'Book ID' },
  { key: 'isbnNo', label: 'ISBN No' },
  { key: 'author', label: 'Author' },
  { key: 'language', label: 'Language' },
  { key: 'edition', label: 'Edition' },
  { key: 'price', label: 'Price' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'almiraNo', label: 'Almira No' },
  { key: 'bookCover', label: 'Book Cover' },
]

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  Language: 'ri-global-line',
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

const resolveMediaUrl = (value) => {
  const src = String(value || '').trim()
  if (!src) return ''
  return apiUrl(src)
}

const Book = ({ onNavigate }) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
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
  const [previewBook, setPreviewBook] = useState(null)

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
        console.error('Failed to load book lookups:', err)
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

  const loadBooks = useCallback(async () => {
    if (status !== 'ready' || !token) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchBooksPage({
        page: currentPage - 1,
        size: rowsPerPage,
        search: debouncedSearch,
        headOfficeId: filters.headOfficeId || undefined,
        schoolId: filters.schoolId || undefined,
        language: filters.language || undefined,
        edition: filters.edition || undefined,
        almiraNo: filters.almiraNo || undefined,
      })
      setRows(Array.isArray(data?.content) ? data.content : [])
      setTotalElements(Number(data?.totalElements ?? 0))
      setTotalPages(Number(data?.totalPages ?? 0))
    } catch (err) {
      console.error('Failed to load books:', err)
      setError(err?.message || 'Failed to load books')
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, filters.almiraNo, filters.edition, filters.headOfficeId, filters.language, filters.schoolId, rowsPerPage, status, token])

  useEffect(() => {
    void loadBooks()
  }, [loadBooks])

  useEffect(() => {
    const handleStockUpdate = () => {
      void loadBooks()
    }

    window.addEventListener('library-book-stock-updated', handleStockUpdate)
    return () => window.removeEventListener('library-book-stock-updated', handleStockUpdate)
  }, [loadBooks])

  useEffect(() => {
    if (currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    if (!previewBook) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPreviewBook(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewBook])

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
    const data = await fetchBooksPage({
      page: 0,
      size,
      search: debouncedSearch,
      headOfficeId: filters.headOfficeId || undefined,
      schoolId: filters.schoolId || undefined,
      language: filters.language || undefined,
      edition: filters.edition || undefined,
      almiraNo: filters.almiraNo || undefined,
    })
    return Array.isArray(data?.content) ? data.content : []
  }, [debouncedSearch, filters.almiraNo, filters.edition, filters.headOfficeId, filters.language, filters.schoolId, rowsPerPage, totalElements])

  const mapExportRow = useCallback(
    (row) => ({
      ...row,
      schoolName: row.schoolName || resolveSchoolName(row.schoolId),
    }),
    [resolveSchoolName],
  )

  const openEdit = useCallback((row) => {
    if (!row) return
    sessionStorage.setItem('edit-book-row', JSON.stringify(row))
    onNavigate?.('book-create')
  }, [onNavigate])

  const handleDelete = useCallback(
    async (row) => {
      if (!row?.id) return
      if (!window.confirm(`Delete book "${row.title || row.bookId || 'this book'}"?`)) return
      try {
        await deleteBook(row.id)
        await loadBooks()
      } catch (err) {
        console.error('Failed to delete book:', err)
        setError(err?.message || 'Failed to delete book')
      }
    },
    [loadBooks],
  )

  const currentStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const currentEnd = totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Book</h1>
          <span className="text-secondary-light">Library / Book Management</span>
        </div>
        <button
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          type="button"
          onClick={() => {
            sessionStorage.removeItem('edit-book-row')
            onNavigate?.('book-create')
          }}
        >
          <i className="ri-add-large-line"></i> Add Book
        </button>
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
                fileName="Book_List"
                sheetName="Books"
                pdfTitle="Book Report"
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
                      Loading books...
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
                          {col.key === 'bookCover' ? (
                            <button
                              type="button"
                              className={`w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0 ${
                                row.bookCover ? 'bg-primary-focus text-primary-600' : 'bg-neutral-200 text-secondary-light'
                              }`}
                              title="View cover image"
                              onClick={() => {
                                setPreviewBook(row)
                              }}
                              aria-label="View cover image"
                            >
                              <i className="ri-eye-line"></i>
                            </button>
                          ) : col.key === 'title' ? (
                            <span className="fw-medium text-primary-light">{row.title || '--'}</span>
                          ) : col.key === 'schoolName' ? (
                            resolveSchoolName(row.schoolId) || row.schoolName || '--'
                          ) : col.key === 'price' ? (
                            row.price == null ? '--' : String(row.price)
                          ) : (
                            row[col.key] ?? '--'
                          )}
                        </td>
                      ))}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus text-info-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            onClick={() => openEdit(row)}
                            title="Edit book"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus text-danger-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            onClick={() => void handleDelete(row)}
                            title="Delete book"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
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

      {previewBook ? (
        <div
          role="presentation"
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.72)', zIndex: 1060, padding: '24px' }}
          onClick={() => setPreviewBook(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white radius-16 shadow-lg p-16 position-relative"
            style={{ maxWidth: '720px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn btn-light border position-absolute top-0 end-0 m-12 rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '36px', height: '36px' }}
              onClick={() => setPreviewBook(null)}
              aria-label="Close cover preview"
            >
              <i className="ri-close-line"></i>
            </button>
            <div className="d-flex align-items-center justify-content-between mb-12 pe-40">
              <h6 className="mb-0 fw-semibold text-primary-light">{previewBook.title || previewBook.bookId || 'Book Cover'}</h6>
            </div>
            <div className="d-flex align-items-center justify-content-center bg-light radius-12 p-12" style={{ minHeight: '420px' }}>
              {previewBook.bookCover ? (
                <img
                  src={resolveMediaUrl(previewBook.bookCover)}
                  alt={previewBook.title || 'Book cover preview'}
                  className="radius-12 object-fit-contain"
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                />
              ) : (
                <div className="text-secondary-light">No cover image available.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        title="Find Book"
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

          <FormField label="Language" full>
            <input
              type="text"
              className="avm-input"
              placeholder="Language"
              value={pendingFilters.language}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, language: e.target.value }))}
            />
          </FormField>

          <FormField label="Edition" full>
            <input
              type="text"
              className="avm-input"
              placeholder="Edition"
              value={pendingFilters.edition}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, edition: e.target.value }))}
            />
          </FormField>

          <FormField label="Almira No" full>
            <input
              type="text"
              className="avm-input"
              placeholder="Almira No"
              value={pendingFilters.almiraNo}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, almiraNo: e.target.value }))}
            />
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

export default Book
