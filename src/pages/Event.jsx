import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { deleteEvent, fetchEvents } from '../apis/eventApi'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'

const EDIT_STORAGE_KEY = 'event-edit-row'

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  eventFor: 'Select',
  isViewOnWeb: 'Select',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'title', label: 'Title' },
  { key: 'eventFor', label: 'Event for' },
  { key: 'eventPlace', label: 'Event Place' },
  { key: 'fromDate', label: 'From Date' },
  { key: 'toDate', label: 'To Date' },
  { key: 'image', label: 'Image' },
  { key: 'isViewOnWeb', label: 'Is View on Web?' },
]

const eventForOptions = ['Students', 'Parents', 'Staff', 'All']

const eventForBadge = (val) => {
  if (val === 'Students') return 'bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (val === 'Parents') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (val === 'Staff') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
}

const Event = ({ onNavigate }) => {
  const {
    role,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    headOfficeId: authHeadOfficeId,
    canAdd,
    canEdit,
    canDelete,
  } = useAuth()
  const PAGE_SLUG = 'event'
  const { schoolOptions: contextSchoolOptions } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = String(role || '').toUpperCase() === 'HEAD_OFFICE_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin || isHeadOfficeAdmin, isHeadOfficeAdmin ? authHeadOfficeId : undefined)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const listSchoolId = isSuperAdmin
    ? (manualScope.selectedSchoolId ? String(manualScope.selectedSchoolId) : '')
    : isHeadOfficeAdmin
      ? ''
      : authSchoolId
        ? String(authSchoolId)
        : ''
  const listHeadOfficeId = isSuperAdmin
    ? (manualScope.selectedHeadOfficeId ? String(manualScope.selectedHeadOfficeId) : '')
    : isHeadOfficeAdmin
      ? (authHeadOfficeId ? String(authHeadOfficeId) : '')
      : ''

  const schoolOptions = useMemo(() => {
    const list = isSuperAdmin
      ? (manualScope.selectedHeadOfficeId ? manualScope.schoolOptions : contextSchoolOptions)
      : isHeadOfficeAdmin
        ? manualScope.schoolOptions
        : contextSchoolOptions
    const fallback =
      listSchoolId && authSchoolName && !list.some((school) => String(school.id) === listSchoolId)
        ? [{ id: listSchoolId, schoolName: authSchoolName }]
        : []
    return [...list, ...fallback]
  }, [contextSchoolOptions, isHeadOfficeAdmin, listSchoolId, authSchoolName, isSuperAdmin, manualScope.selectedHeadOfficeId, manualScope.schoolOptions])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        [row.schoolName, row.title, row.eventFor, row.eventPlace, row.fromDate, row.toDate, row.note]
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesSchool = !filters.schoolId || String(row.schoolId ?? '') === String(filters.schoolId)
      const matchesEventFor = filters.eventFor === 'Select' || row.eventFor === filters.eventFor
      const matchesViewOnWeb =
        filters.isViewOnWeb === 'Select' ||
        (filters.isViewOnWeb === 'Yes' ? row.isViewOnWeb : !row.isViewOnWeb)
      return matchesSearch && matchesSchool && matchesEventFor && matchesViewOnWeb
    })
  }, [rows, search, filters])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [currentPage, filteredRows, rowsPerPage])

  const allSelected = paginatedRows.length > 0 && paginatedRows.every((row) => selectedRows.includes(String(row.id)))

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isSuperAdmin) {
        const list = await fetchEvents(
          listSchoolId
            ? { schoolId: listSchoolId }
            : listHeadOfficeId
              ? { headOfficeId: listHeadOfficeId }
              : {},
        )
        setRows(
          Array.isArray(list)
            ? list.map((item) => ({
                id: item?.id,
                schoolId: item?.schoolId ?? null,
                schoolName: item?.schoolName || '',
                title: item?.title || '',
                eventFor: item?.eventFor || '',
                eventPlace: item?.eventPlace || '',
                fromDate: item?.fromDate || '',
                toDate: item?.toDate || '',
                image: item?.image || '',
                note: item?.note || '',
                isViewOnWeb: Boolean(item?.isViewOnWeb),
              }))
            : [],
        )
        return
      }
      if (isHeadOfficeAdmin) {
        if (!listHeadOfficeId) {
          setRows([])
          setError('Head office scope is unavailable.')
          return
        }
        const list = await fetchEvents({ headOfficeId: listHeadOfficeId })
        setRows(
          Array.isArray(list)
            ? list.map((item) => ({
                id: item?.id,
                schoolId: item?.schoolId ?? null,
                schoolName: item?.schoolName || '',
                title: item?.title || '',
                eventFor: item?.eventFor || '',
                eventPlace: item?.eventPlace || '',
                fromDate: item?.fromDate || '',
                toDate: item?.toDate || '',
                image: item?.image || '',
                note: item?.note || '',
                isViewOnWeb: Boolean(item?.isViewOnWeb),
              }))
            : [],
        )
        return
      }
      if (!listSchoolId) {
        setRows([])
        setError('Select a school before viewing events.')
        return
      }
      const list = await fetchEvents({ schoolId: listSchoolId })
      setRows(
        Array.isArray(list)
          ? list.map((item) => ({
              id: item?.id,
              schoolId: item?.schoolId ?? null,
              schoolName: item?.schoolName || '',
              title: item?.title || '',
              eventFor: item?.eventFor || '',
              eventPlace: item?.eventPlace || '',
              fromDate: item?.fromDate || '',
              toDate: item?.toDate || '',
              image: item?.image || '',
              note: item?.note || '',
              isViewOnWeb: Boolean(item?.isViewOnWeb),
            }))
          : [],
      )
    } catch (err) {
      setRows([])
      setError(err?.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [isHeadOfficeAdmin, listHeadOfficeId, listSchoolId, isSuperAdmin])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...paginatedRows.map((row) => String(row.id))])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !paginatedRows.some((row) => String(row.id) === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const handlePendingFilterChange = (event) => {
    const { id, value } = event.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (event) => {
    event.preventDefault()
    setFilters(pendingFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      manualScope.setSelectedHeadOfficeId(String(authHeadOfficeId))
    } else {
      manualScope.setSelectedHeadOfficeId('')
    }
    manualScope.setSelectedSchoolId('')
  }

  const openAdd = () => {
    sessionStorage.removeItem(EDIT_STORAGE_KEY)
    onNavigate?.('add-event')
  }

  const openEdit = (row) => {
    if (!row?.id) return
    sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row))
    onNavigate?.('add-event')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return
    try {
      await deleteEvent(id)
      void loadData()
    } catch (err) {
      setError(err?.message || 'Failed to delete event')
    }
  }

  const currentStart = filteredRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const currentEnd = filteredRows.length === 0 ? 0 : Math.min(currentPage * rowsPerPage, filteredRows.length)

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Event</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Event</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
          {canAdd(PAGE_SLUG) && (
            <button
              type="button"
              className="btn btn-primary-600 d-flex align-items-center gap-6"
              onClick={openAdd}
              disabled={!isSuperAdmin && !listSchoolId}
              title={!isSuperAdmin && !listSchoolId ? 'Select a school first' : ''}
            >
              <span className="d-flex text-md">
                <i className="ri-add-large-line"></i>
              </span>
              Add Event
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-8" role="alert">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  {columnOptions.map((column) => (
                    <li key={column.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input type="checkbox" className="form-check-input mt-0" checked={visibleColumns[column.key]} onChange={() => toggleColumn(column.key)} />
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
                placeholder="Search events..."
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

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.schoolName ? <th scope="col">School</th> : null}
                  {visibleColumns.title ? <th scope="col">Title</th> : null}
                  {visibleColumns.eventFor ? <th scope="col">Event for</th> : null}
                  {visibleColumns.eventPlace ? <th scope="col">Event Place</th> : null}
                  {visibleColumns.fromDate ? <th scope="col">From Date</th> : null}
                  {visibleColumns.toDate ? <th scope="col">To Date</th> : null}
                  {visibleColumns.image ? <th scope="col">Image</th> : null}
                  {visibleColumns.isViewOnWeb ? <th scope="col">Is View on Web?</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading events...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No events found.
                    </td>
                  </tr>
                ) : paginatedRows.map((row, index) => (
                  <tr key={row.id}>
                    <td>
                      <div className="form-check style-check d-flex align-items-center">
                        <input type="checkbox" className="form-check-input" checked={selectedRows.includes(String(row.id))} onChange={() => handleSelectRow(String(row.id))} />
                        <label className="form-check-label">{(currentPage - 1) * rowsPerPage + index + 1}</label>
                      </div>
                    </td>
                    {visibleColumns.schoolName ? <td>{row.schoolName}</td> : null}
                    {visibleColumns.title ? <td className="fw-medium text-primary-light">{row.title}</td> : null}
                    {visibleColumns.eventFor ? (
                      <td>
                        <span className={eventForBadge(row.eventFor)}>{row.eventFor}</span>
                      </td>
                    ) : null}
                    {visibleColumns.eventPlace ? <td>{row.eventPlace}</td> : null}
                    {visibleColumns.fromDate ? <td>{row.fromDate}</td> : null}
                    {visibleColumns.toDate ? <td>{row.toDate}</td> : null}
                    {visibleColumns.image ? (
                      <td>
                        {row.image ? (
                          <img src={row.image} alt="event" style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                        ) : (
                          <span className="text-secondary-light text-sm">-</span>
                        )}
                      </td>
                    ) : null}
                    {visibleColumns.isViewOnWeb ? (
                      <td>
                        <div className="form-check form-switch d-flex justify-content-center mb-0">
                          <input className="form-check-input" type="checkbox" checked={row.isViewOnWeb} readOnly style={{ cursor: 'pointer' }} />
                        </div>
                      </td>
                    ) : null}
                    <td>
                      <div className="d-flex align-items-center gap-10">
                        {canEdit(PAGE_SLUG) && (
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => openEdit(row)}
                            title="Edit"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                        )}
                        {canDelete(PAGE_SLUG) && (
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => handleDelete(row.id)}
                            title="Delete"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {currentStart} - {currentEnd} of {filteredRows.length} entries
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1 || totalPages < 1}>
                Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 3) }, (_, index) => {
                const base = Math.max(1, currentPage - 1)
                const pageNumber = Math.min(totalPages, base + index)
                return pageNumber > 0 ? (
                  <button key={pageNumber} type="button" className={pageNumber === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'} onClick={() => setCurrentPage(pageNumber)}>
                    {pageNumber}
                  </button>
                ) : null
              })}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages || totalPages < 1}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter Events" onClose={() => setIsFilterSidebarOpen(false)} className="filter-sidebar">
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <div className="full">
              <ManualScopeSelectors
                enabled={isSuperAdmin}
                headOffices={manualScope.headOffices}
                schoolOptions={schoolOptions}
                selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                onHeadOfficeChange={(value) => {
                  manualScope.setSelectedHeadOfficeId(value)
                  manualScope.setSelectedSchoolId('')
                  setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))
                }}
                selectedSchoolId={pendingFilters.schoolId}
                onSchoolChange={(value) => {
                  manualScope.setSelectedSchoolId(value)
                  setPendingFilters((prev) => ({ ...prev, schoolId: value }))
                }}
              />
            </div>
          ) : (
            <div className="full">
              <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                School
              </label>
              <select id="schoolId" className="form-control form-select" value={pendingFilters.schoolId} onChange={handlePendingFilterChange}>
                <option value="">Select School</option>
                {schoolOptions.map((school) => (
                  <option key={String(school.id)} value={String(school.id)}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="eventFor" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Event for
            </label>
            <select id="eventFor" className="form-control form-select" value={pendingFilters.eventFor} onChange={handlePendingFilterChange}>
              <option value="Select">Select Event for</option>
              {eventForOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="isViewOnWeb" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Is View on Web?
            </label>
            <select id="isViewOnWeb" className="form-control form-select" value={pendingFilters.isViewOnWeb} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
              Reset
            </button>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default Event
