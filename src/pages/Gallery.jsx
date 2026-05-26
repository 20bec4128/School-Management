import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { fetchRowsForSchoolIds, normalizeSchoolIds, uniqueBy } from '../utils/schoolScope'
import { deleteGallery, fetchGalleriesPage } from '../apis/galleryApi'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'



const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  isViewOnWeb: 'Select',
}



const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Title: 'ri-image-line',
  Note: 'ri-sticky-note-line',
  'Is View on Web?': 'ri-global-line',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'title', label: 'Title' },
  { key: 'note', label: 'Note' },
  { key: 'isViewOnWeb', label: 'Is View on Web?' },
]

const Gallery = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId, canAdd, canEdit, canDelete } = useAuth()
  const PAGE_SLUG = 'gallery'
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [rows, setRows] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
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

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.selectedHeadOfficeId ? manualScope.schoolOptions : contextSchoolOptions
    return contextSchoolOptions || []
  }, [isSuperAdmin, manualScope.schoolOptions, contextSchoolOptions, manualScope.selectedHeadOfficeId])
  const scopedSchoolIds = useMemo(() => {
    if (isSuperAdmin) {
      if (filters.schoolId) return [String(filters.schoolId)]
      if (manualScope.selectedSchoolId) return [String(manualScope.selectedSchoolId)]
      if (manualScope.selectedHeadOfficeId) return normalizeSchoolIds(manualScope.schoolOptions)
      return normalizeSchoolIds(contextSchoolOptions)
    }

    const singleSchoolId = activeSchoolId || authSchoolId || (schoolOptions.length === 1 ? schoolOptions[0]?.id : '')
    return String(singleSchoolId ?? '').trim() ? [String(singleSchoolId)] : []
  }, [
    activeSchoolId,
    authSchoolId,
    contextSchoolOptions,
    filters.schoolId,
    isSuperAdmin,
    manualScope.schoolOptions,
    manualScope.selectedHeadOfficeId,
    manualScope.selectedSchoolId,
    schoolOptions,
  ])
  const listSchoolId = scopedSchoolIds[0] || ''
  const showSchoolSelector = schoolOptions.length > 1

  const allSelected = rows.length > 0 && rows.every((row) => selectedRows.includes(String(row.id)))

  const loadData = useCallback(async () => {
    if (scopedSchoolIds.length === 0) {
      setRows([])
      setTotalElements(0)
      setTotalPages(1)
      return
    }
    setLoading(true)
    setError('')
    try {
      if (scopedSchoolIds.length === 1) {
        const data = await fetchGalleriesPage({
          schoolId: scopedSchoolIds[0],
          search,
          isViewOnWeb: filters.isViewOnWeb === 'Select' ? '' : filters.isViewOnWeb,
          page: currentPage - 1,
          size: rowsPerPage,
        })
        const content = Array.isArray(data?.content) ? data.content : []
        setRows(content.map((item) => ({
          id: item?.id,
          schoolId: item?.schoolId ?? null,
          schoolName: item?.schoolName || '',
          headOfficeId: item?.headOfficeId ?? null,
          title: item?.title || '',
          note: item?.note || '',
          isViewOnWeb: Boolean(item?.isViewOnWeb),
        })))
        setTotalElements(Number(data?.totalElements ?? content.length))
        setTotalPages(Math.max(1, Number(data?.totalPages ?? 1)))
        return
      }

      const rows = await fetchRowsForSchoolIds(scopedSchoolIds, (schoolId) =>
        fetchGalleriesPage({
          schoolId,
          search,
          isViewOnWeb: filters.isViewOnWeb === 'Select' ? '' : filters.isViewOnWeb,
          page: 0,
          size: 500,
        }).then((data) => Array.isArray(data?.content) ? data.content : []),
      )
      const normalizedRows = uniqueBy(Array.isArray(rows) ? rows : [], (row) => row?.id)
        .filter((row) => {
          const query = search.trim().toLowerCase()
          if (query) {
            const haystack = [row?.title, row?.note, row?.schoolName, row?.schoolId]
              .map((value) => String(value ?? '').toLowerCase())
              .join(' ')
            if (!haystack.includes(query)) return false
          }
          if (filters.isViewOnWeb !== 'Select' && String(Boolean(row?.isViewOnWeb)) !== String(filters.isViewOnWeb === 'Yes')) {
            return false
          }
          return true
        })
        .map((item) => ({
          id: item?.id,
          schoolId: item?.schoolId ?? null,
          schoolName: item?.schoolName || '',
          headOfficeId: item?.headOfficeId ?? null,
          title: item?.title || '',
          note: item?.note || '',
          isViewOnWeb: Boolean(item?.isViewOnWeb),
        }))
      const start = (currentPage - 1) * rowsPerPage
      setRows(normalizedRows.slice(start, start + rowsPerPage))
      setTotalElements(normalizedRows.length)
      setTotalPages(Math.max(1, Math.ceil(normalizedRows.length / rowsPerPage)))
    } catch (err) {
      setRows([])
      setTotalElements(0)
      setTotalPages(1)
      setError(err?.message || 'Failed to load gallery records')
    } finally {
      setLoading(false)
    }
  }, [currentPage, filters.isViewOnWeb, rowsPerPage, scopedSchoolIds, search])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])



  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...rows.map((row) => String(row.id))])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !rows.some((row) => String(row.id) === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }



  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
    if (isSuperAdmin && pendingFilters.schoolId) {
      manualScope.setSelectedSchoolId(pendingFilters.schoolId)
    }
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
  }

  const openAdd = () => {
    sessionStorage.removeItem('edit-gallery-row')
    onNavigate('add-gallery')
  }

  const openEdit = (row) => {
    sessionStorage.setItem('edit-gallery-row', JSON.stringify(row))
    onNavigate('add-gallery')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this gallery record?')) return
    await deleteGallery(id)
    await loadData()
  }

  const currentStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const currentEnd = totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Gallery</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Gallery</span>
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
              Add Gallery
            </button>
          )}
        </div>
      </div>

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
                placeholder="Search gallery..."
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

          {error ? <div className="px-20 pt-16 text-danger-600">{error}</div> : null}
          {loading ? <div className="px-20 pt-16 text-secondary-light">Loading gallery...</div> : null}

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 820 }}>
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
                  {visibleColumns.note ? <th scope="col">Note</th> : null}
                  {visibleColumns.isViewOnWeb ? <th scope="col">Is View on Web?</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No gallery records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(String(row.id))}
                            onChange={() => handleSelectRow(String(row.id))}
                          />
                          <label className="form-check-label">{String(row.id).padStart(2, '0')}</label>
                        </div>
                      </td>
                      {visibleColumns.schoolName ? <td>{row.schoolName}</td> : null}
                      {visibleColumns.title ? <td className="fw-medium text-primary-light">{row.title}</td> : null}
                      {visibleColumns.note ? <td>{row.note}</td> : null}
                      {visibleColumns.isViewOnWeb ? (
                        <td>
                          <div className="form-check form-switch d-flex justify-content-center mb-0">
                            <input className="form-check-input" type="checkbox" defaultChecked={row.isViewOnWeb} style={{ cursor: 'pointer' }} />
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {currentStart} - {currentEnd} of {totalElements} entries
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



      <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter Gallery" onClose={() => setIsFilterSidebarOpen(false)} className="filter-sidebar">
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
         <div style={{ display: isSuperAdmin ? 'block' : 'none' }}>
            <ManualScopeSelectors
                enabled={isSuperAdmin}
                headOffices={manualScope.headOffices}
                schoolOptions={schoolOptions}
                showSchoolSelector={showSchoolSelector}
                selectedHeadOfficeId={pendingFilters.headOfficeId}
                onHeadOfficeChange={(val) => setPendingFilters(p => ({ ...p, headOfficeId: val, schoolId: '' }))}
                selectedSchoolId={pendingFilters.schoolId}
                onSchoolChange={(val) => setPendingFilters(p => ({ ...p, schoolId: val }))}
             />
          </div>

          {!isSuperAdmin && (
            <div>
              <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                School
              </label>
              <select id="schoolId" className="form-control form-select" value={pendingFilters.schoolId} onChange={handlePendingFilterChange}>
                <option value="">Select School</option>
                {schoolOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.schoolName}
                  </option>
                ))}
              </select>
            </div>
          )}

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

          <div className="d-flex gap-16">
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
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

export default Gallery
