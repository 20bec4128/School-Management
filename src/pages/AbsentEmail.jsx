import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import TablePagination from '../components/table/TablePagination'
import ExportDropdown from '../components/ExportDropdown'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchEmailsPage } from '../apis/emailApi'
import '../assets/css/addModalShared.css'

const ABSENT_EMAIL_CATEGORY = 'ABSENT_ATTENDANCE'

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'receiverType', label: 'Receiver Type' },
  { key: 'receiver', label: 'Receiver' },
  { key: 'subject', label: 'Subject' },
  { key: 'sendDate', label: 'Send Date' },
]

const normalizeText = (value) => String(value ?? '').trim()

const AbsentEmail = ({ onNavigate }) => {
  const {
    role,
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    schoolId: authSchoolId,
  } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions, setActiveSchoolId, isSchoolSelectionEnabled } = useSchool()

  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = String(role || '').toUpperCase() === 'HEAD_OFFICE_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const buildDefaultFilters = useCallback(() => {
    const schoolId = !isSuperAdmin && !isHeadOfficeAdmin
      ? String(activeSchoolId || authSchoolId || '')
      : isHeadOfficeAdmin
        ? String(activeSchoolId || '')
        : ''
    const headOfficeId =
      isHeadOfficeAdmin || (!isSuperAdmin && authHeadOfficeId != null) ? String(authHeadOfficeId ?? '') : ''
    return {
      headOfficeId,
      schoolId,
    }
  }, [activeSchoolId, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSuperAdmin])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(() => buildDefaultFilters())
  const [filters, setFilters] = useState(() => buildDefaultFilters())
  const [pageRows, setPageRows] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const selectedHeadOfficeId =
    normalizeText(filters.headOfficeId) || (authHeadOfficeId != null ? String(authHeadOfficeId) : '')

  const selectedSchoolId = isSuperAdmin || isHeadOfficeAdmin
    ? normalizeText(filters.schoolId)
    : normalizeText(filters.schoolId) || String(activeSchoolId || authSchoolId || '')

  const scopeSchoolOptions = useMemo(() => {
    const rows = Array.isArray(contextSchoolOptions) ? contextSchoolOptions : []
    if (isSuperAdmin) return manualScope.schoolOptions || []
    if (authHeadOfficeId != null) {
      return rows.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId))
    }
    return rows
  }, [authHeadOfficeId, contextSchoolOptions, isSuperAdmin, manualScope.schoolOptions])

  const headOfficeOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.headOffices || []
    if (authHeadOfficeId != null) {
      return [{ id: authHeadOfficeId, name: authHeadOfficeName || `Head Office ${authHeadOfficeId}` }]
    }
    return []
  }, [authHeadOfficeId, authHeadOfficeName, isSuperAdmin, manualScope.headOffices])

  const loadPageData = useCallback(async () => {
    if (!selectedSchoolId) {
      setPageRows([])
      setTotalElements(0)
      setTotalPages(1)
      setError('')
      return
    }

    setLoading(true)
    setError('')

    try {
      const page = await fetchEmailsPage({
        headOfficeId: selectedHeadOfficeId || undefined,
        schoolId: selectedSchoolId || undefined,
        category: ABSENT_EMAIL_CATEGORY,
        page: currentPage - 1,
        size: rowsPerPage,
        search,
      })

      const content = Array.isArray(page?.content) ? page.content : []
      setPageRows(content)
      setTotalElements(Number(page?.totalElements ?? content.length) || 0)
      setTotalPages(Math.max(1, Number(page?.totalPages ?? 1) || 1))
    } catch (err) {
      setPageRows([])
      setTotalElements(0)
      setTotalPages(1)
      setError(err?.message || 'Failed to load absent email history')
    } finally {
      setLoading(false)
    }
  }, [currentPage, rowsPerPage, search, selectedHeadOfficeId, selectedSchoolId])

  useEffect(() => {
    void loadPageData()
  }, [loadPageData])

  useEffect(() => {
    setCurrentPage(1)
  }, [rowsPerPage, selectedSchoolId])

  useEffect(() => {
    if (isSuperAdmin) return
    if (isHeadOfficeAdmin && selectedSchoolId) {
      setActiveSchoolId(selectedSchoolId)
    }
  }, [isHeadOfficeAdmin, isSuperAdmin, selectedSchoolId, setActiveSchoolId])

  useEffect(() => {
    if (isSuperAdmin) return
    if (!isSchoolSelectionEnabled && authSchoolId) {
      setActiveSchoolId(String(authSchoolId))
    }
  }, [authSchoolId, isSchoolSelectionEnabled, isSuperAdmin, setActiveSchoolId])

  const handlePendingFilterChange = (event) => {
    const { id, value } = event.target
    setPendingFilters((prev) => {
      if (id === 'headOfficeId') return { ...prev, headOfficeId: value, schoolId: '' }
      return { ...prev, [id]: value }
    })
  }

  const handleApplyFilters = (event) => {
    event.preventDefault()
    if ((isSuperAdmin || isHeadOfficeAdmin) && !pendingFilters.headOfficeId) return
    if (!pendingFilters.schoolId) return
    setFilters(pendingFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const exportColumns = useMemo(
    () => columnOptions.map((column) => ({ key: column.key, label: column.label })),
    [],
  )

  const mapExportRow = useCallback(
    (row) => ({
      schoolName: row.schoolName || '',
      receiverType: row.receiverType || '',
      receiver: row.receiver || '',
      subject: row.subject || '',
      sendDate: row.sendDate || '',
    }),
    [],
  )

  const loadExportRows = useCallback(async () => {
    if (!selectedSchoolId) return []
    const size = Math.max(rowsPerPage, 50)
    let pageNo = 0
    let total = 1
    const all = []

    while (pageNo < total) {
      const page = await fetchEmailsPage({
        headOfficeId: selectedHeadOfficeId || undefined,
        schoolId: selectedSchoolId || undefined,
        category: ABSENT_EMAIL_CATEGORY,
        page: pageNo,
        size,
        search,
      })
      const content = Array.isArray(page?.content) ? page.content : []
      all.push(...content)
      total = Number(page?.totalPages ?? 1) || 1
      pageNo += 1
    }
    return all
  }, [rowsPerPage, search, selectedHeadOfficeId, selectedSchoolId])

  const resolvedPageInfo =
    totalElements === 0
      ? 'Showing 0 - 0 of 0 entries'
      : `Showing ${(currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, totalElements)} of ${totalElements} entries`

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Absent Email History</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Absent Email</span>
          </div>
        </div>
        <button type="button" className="btn btn-primary-600 px-16 py-8" onClick={() => onNavigate('add-absent-email')}>
          Settings
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-start gap-16">
              <ExportDropdown
                title="Export"
                rows={pageRows}
                loadRows={loadExportRows}
                columns={exportColumns}
                visibleColumns={visibleColumns}
                mapRow={mapExportRow}
                fileName="Absent Email History"
                sheetName="Absent Email History"
                pdfTitle="Absent Email History"
              />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
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
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span>
                    <i className="ri-arrow-down-s-line"></i>
                  </span>
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
                placeholder="Search absent email history..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setCurrentPage(1)
                }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          {error ? (
            <div className="px-20 pt-16">
              <div className="alert alert-danger mb-0" role="alert">
                {error}
              </div>
            </div>
          ) : null}

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table w-100" style={{ tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <th scope="col" style={{ width: 80 }}>S.L</th>
                  {visibleColumns.schoolName ? <th scope="col">School</th> : null}
                  {visibleColumns.receiverType ? <th scope="col">Receiver Type</th> : null}
                  {visibleColumns.receiver ? <th scope="col">Receiver</th> : null}
                  {visibleColumns.subject ? <th scope="col">Subject</th> : null}
                  {visibleColumns.sendDate ? <th scope="col">Send Date</th> : null}
                </tr>
              </thead>
              <tbody>
                {!selectedSchoolId ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      Select a school in Filter to view absent email history.
                    </td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      Loading...
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      No absent emails found.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, idx) => (
                    <tr key={row.id ?? `${idx}`}>
                      <td className="fw-medium text-secondary-light">{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                      {visibleColumns.schoolName ? <td>{row.schoolName || '-'}</td> : null}
                      {visibleColumns.receiverType ? <td>{row.receiverType || '-'}</td> : null}
                      {visibleColumns.receiver ? <td>{row.receiver || '-'}</td> : null}
                      {visibleColumns.subject ? <td>{row.subject || '-'}</td> : null}
                      {visibleColumns.sendDate ? <td>{row.sendDate || '-'}</td> : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            paginationProps={{
              currentPage,
              totalPages,
              setCurrentPage,
              pageInfo: resolvedPageInfo,
            }}
          />
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Absent Email"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          {(isSuperAdmin || isHeadOfficeAdmin) ? (
            <div className="full">
              <label htmlFor="headOfficeId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                Head Office <span className="text-danger-600">*</span>
              </label>
              <select
                id="headOfficeId"
                className="form-control form-select"
                value={pendingFilters.headOfficeId}
                onChange={handlePendingFilterChange}
              >
                <option value="">--Select Head Office--</option>
                {headOfficeOptions.map((row) => (
                  <option key={String(row?.id ?? '')} value={String(row?.id ?? '')}>
                    {row?.name || `Head Office ${row?.id ?? ''}`}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="full">
            <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School <span className="text-danger-600">*</span>
            </label>
            <select
              id="schoolId"
              className="form-control form-select"
              value={pendingFilters.schoolId}
              onChange={handlePendingFilterChange}
              disabled={!isSuperAdmin && !isHeadOfficeAdmin}
            >
              <option value="">--Select School--</option>
              {scopeSchoolOptions.map((school) => {
                const id = normalizeText(school?.id)
                if (!id) return null
                return (
                  <option key={id} value={id}>
                    {school?.schoolName || school?.name || `School ${id}`}
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <button type="button" className="btn btn-danger-200 text-danger-600 w-100" onClick={() => setPendingFilters(buildDefaultFilters())}>
              Reset
            </button>
          </div>

          <div>
            <button
              type="submit"
              className="btn btn-primary-600 w-100"
              disabled={(isSuperAdmin || isHeadOfficeAdmin) ? !pendingFilters.headOfficeId || !pendingFilters.schoolId : !pendingFilters.schoolId}
            >
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default AbsentEmail
