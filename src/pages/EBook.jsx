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
import { fetchClasses } from '../apis/classesApi'
import { deleteEBook, fetchEBooksPage } from '../apis/ebooksApi'
import { apiUrl } from '../apis/apiClient'
import '../assets/css/addModalShared.css'

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  ebookType: '',
  classId: '',
  language: '',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'ebookType', label: 'Type' },
  { key: 'className', label: 'Class' },
  { key: 'subjectName', label: 'Subject' },
  { key: 'ebookName', label: 'Name' },
  { key: 'author', label: 'Author' },
  { key: 'language', label: 'Language' },
  { key: 'edition', label: 'Edition' },
  { key: 'coverImage', label: 'Cover Image' },
]

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  Language: 'ri-global-line',
  Class: 'ri-bank-line',
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

const getClassById = (rows, classId) =>
  (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(classId ?? '')) || null

const classLabel = (row) => row?.className || row?.numericName || `Class ${row?.id ?? ''}`

const getEBookTypeLabel = (value) => {
  const type = String(value || '').trim().toUpperCase()
  if (type === 'GENERAL') return 'General E-Books'
  if (type === 'SUBJECT') return 'Subject E-Books'
  return '--'
}

const resolveMediaUrl = (value) => {
  const src = String(value || '').trim()
  if (!src) return ''
  return apiUrl(src)
}

const EBook = ({ onNavigate }) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId } = useSchool()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [rows, setRows] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [allClasses, setAllClasses] = useState([])
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

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const filterClassOptions = useMemo(() => {
    const list = Array.isArray(allClasses) ? allClasses : []
    const schoolId = pendingFilters.schoolId || filters.schoolId
    if (schoolId) {
      return list.filter((schoolClass) => String(schoolClass?.schoolId ?? '') === String(schoolId))
    }
    return list
  }, [allClasses, filters.schoolId, pendingFilters.schoolId])

  const filterSchoolOptions = useMemo(() => {
    const list = Array.isArray(allSchools) ? allSchools : []
    const scopeHeadOfficeId = pendingFilters.headOfficeId || filters.headOfficeId
    if (scopeHeadOfficeId) {
      return list.filter((school) => String(school?.headOfficeId ?? '') === String(scopeHeadOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return list.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return list.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return list
  }, [allSchools, authHeadOfficeId, authSchoolId, filters.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin, pendingFilters.headOfficeId])

  const resolveSchoolName = useCallback(
    (schoolId) => getSchoolById(allSchools, schoolId)?.schoolName || (String(schoolId ?? '') === String(authSchoolId ?? '') ? authSchoolName || '' : ''),
    [allSchools, authSchoolId, authSchoolName],
  )

  const resolveClassName = useCallback((classId) => classLabel(getClassById(allClasses, classId)), [allClasses])

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
        const [schools, classes] = await Promise.all([
          fetchSchoolsLookup(),
          fetchClasses(),
        ])
        if (cancelled) return
        setAllSchools(Array.isArray(schools) ? schools : [])
        setAllClasses(Array.isArray(classes) ? classes : [])
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load e-book lookups:', err)
        setAllSchools([])
        setAllClasses([])
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
      classId: '',
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

  const loadEBooks = useCallback(async () => {
    if (status !== 'ready' || !token) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchEBooksPage({
        page: currentPage - 1,
        size: rowsPerPage,
        search: debouncedSearch,
        headOfficeId: filters.headOfficeId || undefined,
        schoolId: filters.schoolId || undefined,
        ebookType: filters.ebookType || undefined,
        classId: filters.classId || undefined,
        language: filters.language || undefined,
      })
      setRows(Array.isArray(data?.content) ? data.content : [])
      setTotalElements(Number(data?.totalElements ?? 0))
      setTotalPages(Number(data?.totalPages ?? 0))
    } catch (err) {
      console.error('Failed to load e-books:', err)
      setError(err?.message || 'Failed to load e-books')
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, filters.classId, filters.ebookType, filters.headOfficeId, filters.language, filters.schoolId, rowsPerPage, status, token])

  useEffect(() => {
    void loadEBooks()
  }, [loadEBooks])

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
    const data = await fetchEBooksPage({
      page: 0,
      size,
      search: debouncedSearch,
      headOfficeId: filters.headOfficeId || undefined,
      schoolId: filters.schoolId || undefined,
      ebookType: filters.ebookType || undefined,
      classId: filters.classId || undefined,
      language: filters.language || undefined,
    })
    return Array.isArray(data?.content) ? data.content : []
  }, [debouncedSearch, filters.classId, filters.ebookType, filters.headOfficeId, filters.language, filters.schoolId, rowsPerPage, totalElements])

  const mapExportRow = useCallback(
    (row) => ({
      ...row,
      schoolName: row.schoolName || resolveSchoolName(row.schoolId),
      className: row.className || resolveClassName(row.classId),
      ebookType: getEBookTypeLabel(row.ebookType),
    }),
    [resolveClassName, resolveSchoolName],
  )

  const openEdit = useCallback((row) => {
    if (!row) return
    sessionStorage.setItem('edit-ebook-row', JSON.stringify(row))
    onNavigate?.('ebook-create')
  }, [onNavigate])

  const handleDelete = useCallback(
    async (row) => {
      if (!row?.id) return
      const label = row.ebookName || row.subjectName || row.className || 'this e-book'
      if (!window.confirm(`Delete e-book "${label}"?`)) return
      try {
        await deleteEBook(row.id)
        await loadEBooks()
      } catch (err) {
        console.error('Failed to delete e-book:', err)
        setError(err?.message || 'Failed to delete e-book')
      }
    },
    [loadEBooks],
  )

  const currentStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const currentEnd = totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">E-Book</h1>
          <span className="text-secondary-light">Library / E-Book Management</span>
        </div>
        <button
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          type="button"
          onClick={() => {
            sessionStorage.removeItem('edit-ebook-row')
            onNavigate?.('ebook-create')
          }}
        >
          <i className="ri-add-large-line"></i> Add E-Book
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
                fileName="EBook_List"
                sheetName="EBooks"
                pdfTitle="E-Book Report"
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
                placeholder="Search e-books..."
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
                      Loading e-books...
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
                          {col.key === 'coverImage' ? (
                            row.coverImage ? (
                              <img
                                src={resolveMediaUrl(row.coverImage)}
                                alt={row.ebookName || 'E-book cover'}
                                className="w-40-px h-50-px radius-4 object-fit-cover"
                              />
                            ) : (
                              '--'
                            )
                          ) : col.key === 'ebookType' ? (
                            getEBookTypeLabel(row.ebookType)
                          ) : col.key === 'ebookName' ? (
                            <span className="fw-medium text-primary-light">{row.ebookName ?? '--'}</span>
                          ) : col.key === 'schoolName' ? (
                            row.schoolName || resolveSchoolName(row.schoolId) || '--'
                          ) : col.key === 'className' ? (
                            row.className || resolveClassName(row.classId) || '--'
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
                            title="Edit E-Book"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus text-danger-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            onClick={() => handleDelete(row)}
                            title="Delete E-Book"
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

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        title="Find E-Book"
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={manualScope.headOffices}
              schoolOptions={filterSchoolOptions}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={(value) => {
                setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: '', classId: '' }))
              }}
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={(value) => {
                const selectedSchool = getSchoolById(allSchools, value)
                setPendingFilters((prev) => ({
                  ...prev,
                  schoolId: value,
                  classId: '',
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
                  setPendingFilters((prev) => ({ ...prev, schoolId: value, classId: '' }))
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

          <FormField label="Type" full>
            <select
              className="avm-select"
              value={pendingFilters.ebookType}
              onChange={(e) => {
                const value = e.target.value
                setPendingFilters((prev) => ({
                  ...prev,
                  ebookType: value,
                  classId: value === 'GENERAL' ? '' : prev.classId,
                }))
              }}
            >
              <option value="">All Types</option>
              <option value="SUBJECT">Subject E-Books</option>
              <option value="GENERAL">General E-Books</option>
            </select>
          </FormField>

          <FormField label="Class" full>
            <select
              className="avm-select"
              value={pendingFilters.classId}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, classId: e.target.value }))}
              disabled={!pendingFilters.schoolId || pendingFilters.ebookType === 'GENERAL'}
            >
              <option value="">{pendingFilters.ebookType === 'GENERAL' ? 'Not Applicable' : pendingFilters.schoolId ? 'All Classes' : 'Select School First'}</option>
              {filterClassOptions.map((schoolClass) => (
                <option key={String(schoolClass.id)} value={String(schoolClass.id)}>
                  {classLabel(schoolClass)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Language" full>
            <input
              type="text"
              className="avm-input"
              placeholder="Language"
              value={pendingFilters.language}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, language: e.target.value }))}
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

export default EBook
