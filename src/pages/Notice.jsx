import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { deleteNotice, fetchNotices } from '../apis/noticeApi'
import { normalizeSchoolIds, uniqueBy } from '../utils/schoolScope'
import ExportDropdown from '../components/ExportDropdown'

const EDIT_STORAGE_KEY = 'notice-edit-row'

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  noticeFor: 'Select',
  isViewOnWeb: 'Select',
}

const noticeForOptions = ['All', 'Student', 'Teacher', 'Employee', 'Parent']

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'title', label: 'Title' },
  { key: 'date', label: 'Date' },
  { key: 'noticeFor', label: 'Notice for' },
  { key: 'isViewOnWeb', label: 'Is View on Web?' },
]

const Notice = ({ onNavigate }) => {
  const { role } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
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
    ? (activeSchoolId ? String(activeSchoolId) : '')
    : activeSchoolId
      ? String(activeSchoolId)
      : ''

  const schoolOptions = isSuperAdmin ? (manualScope.selectedHeadOfficeId ? manualScope.schoolOptions : []) : contextSchoolOptions

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        [row.schoolName, row.title, row.date, row.noticeFor, row.notice, row.isViewOnWeb ? 'yes' : 'no']
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesSchool = !filters.schoolId || String(row.schoolId ?? '') === String(filters.schoolId)
      const matchesNoticeFor = filters.noticeFor === 'Select' || row.noticeFor === filters.noticeFor
      const matchesViewOnWeb =
        filters.isViewOnWeb === 'Select' ||
        (filters.isViewOnWeb === 'Yes' ? row.isViewOnWeb : !row.isViewOnWeb)
      return matchesSearch && matchesSchool && matchesNoticeFor && matchesViewOnWeb
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
        if (listSchoolId) {
          const list = await fetchNotices({ schoolId: listSchoolId })
          setRows(
            Array.isArray(list)
              ? list.map((item) => ({
                  id: item?.id,
                  schoolId: item?.schoolId ?? null,
                  schoolName: item?.schoolName || '',
                  title: item?.title || '',
                  date: item?.date || '',
                  noticeFor: item?.noticeFor || '',
                  notice: item?.notice || '',
                  isViewOnWeb: Boolean(item?.isViewOnWeb),
                }))
              : [],
          )
          return
        }

        const schoolIds = normalizeSchoolIds(contextSchoolOptions)
        const nested = await Promise.all(schoolIds.map((schoolId) => fetchNotices({ schoolId })))
        const flattened = nested.flat()
        setRows(
          uniqueBy(
            Array.isArray(flattened)
              ? flattened.map((item) => ({
                  id: item?.id,
                  schoolId: item?.schoolId ?? null,
                  schoolName: item?.schoolName || '',
                  title: item?.title || '',
                  date: item?.date || '',
                  noticeFor: item?.noticeFor || '',
                  notice: item?.notice || '',
                  isViewOnWeb: Boolean(item?.isViewOnWeb),
                }))
              : [],
            (row) => String(row?.id ?? `${row?.schoolId ?? ''}-${row?.title ?? ''}-${row?.date ?? ''}`),
          ),
        )
        return
      }

      if (!listSchoolId) {
        setRows([])
        setError('Select a school before viewing notices.')
        return
      }

      const list = await fetchNotices({ schoolId: listSchoolId })
      setRows(
        Array.isArray(list)
          ? list.map((item) => ({
              id: item?.id,
              schoolId: item?.schoolId ?? null,
              schoolName: item?.schoolName || '',
              title: item?.title || '',
              date: item?.date || '',
              noticeFor: item?.noticeFor || '',
              notice: item?.notice || '',
              isViewOnWeb: Boolean(item?.isViewOnWeb),
            }))
          : [],
      )
    } catch (err) {
      console.error('Failed to fetch notices:', err)
      setRows([])
      setError(err?.message || 'Failed to load notices')
    } finally {
      setLoading(false)
    }
  }, [contextSchoolOptions, isSuperAdmin, listSchoolId])

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
    manualScope.setSelectedHeadOfficeId('')
    manualScope.setSelectedSchoolId('')
  }

  const openAdd = () => {
    sessionStorage.removeItem(EDIT_STORAGE_KEY)
    onNavigate?.('add-notice')
  }

  const openEdit = (row) => {
    if (!row?.id) return
    sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row))
    onNavigate?.('add-notice')
  }

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this notice? This cannot be undone.')) return
    try {
      await deleteNotice(row.id)
      setSelectedRows((prev) => prev.filter((id) => String(id) !== String(row.id)))
      void loadData()
    } catch (err) {
      setError(err?.message || 'Failed to delete notice')
    }
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let page = start; page <= end; page += 1) pages.push(page)
    return pages
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Notice</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Notice</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
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
            Add Notice
          </button>
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
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                  Filter
                </span>
                <span>
                  <i className="ri-arrow-right-line"></i>
                </span>
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    Columns
                  </span>
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

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value))
                  setCurrentPage(1)
                }}
              >
                {[5, 10, 20, 50].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search notice..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.title ? <th scope="col">Title</th> : null}
                  {visibleColumns.date ? <th scope="col">Date</th> : null}
                  {visibleColumns.noticeFor ? <th scope="col">Notice for</th> : null}
                  {visibleColumns.isViewOnWeb ? <th scope="col">Is View on Web?</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading notices...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No notices found.
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
                    {visibleColumns.school ? <td>{row.schoolName || '-'}</td> : null}
                    {visibleColumns.title ? <td className="fw-medium text-primary-light">{row.title}</td> : null}
                    {visibleColumns.date ? <td>{row.date}</td> : null}
                    {visibleColumns.noticeFor ? (
                      <td>
                        <span className="bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm">{row.noticeFor || '-'}</span>
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
                        <button type="button" className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" onClick={() => openEdit(row)} title="Edit">
                          <i className="ri-edit-line"></i>
                        </button>
                        <button type="button" className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" title="Delete" onClick={() => handleDelete(row)}>
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filteredRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredRows.length)} of {filteredRows.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
                Prev
              </button>
              {getVisiblePages().map((page) => (
                <button key={page} type="button" className={page === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'} onClick={() => setCurrentPage(page)}>
                  {page}
                </button>
              ))}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Notices"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
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
                <option value="">All Schools</option>
                {contextSchoolOptions.map((school) => (
                  <option key={String(school.id)} value={String(school.id)}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="full">
            <label htmlFor="noticeFor" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Notice for
            </label>
            <select id="noticeFor" className="form-control form-select" value={pendingFilters.noticeFor} onChange={handlePendingFilterChange}>
              <option value="Select">All Notice Types</option>
              {noticeForOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="full">
            <label htmlFor="isViewOnWeb" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Is View on Web?
            </label>
            <select id="isViewOnWeb" className="form-control form-select" value={pendingFilters.isViewOnWeb} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
              Reset
            </button>
          </div>
          <div>
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default Notice
