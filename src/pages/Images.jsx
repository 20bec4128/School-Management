import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { fetchGalleries } from '../apis/galleryApi'
import {
  deleteGalleryImage,
  fetchGalleryImages,
  fetchGalleryImagesPage,
} from '../apis/galleryImageApi'
import { fetchRowsForSchoolIds, normalizeSchoolIds, uniqueBy } from '../utils/schoolScope'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'



const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  galleryId: '',
}



const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Gallery: 'ri-gallery-line',
  Title: 'ri-image-line',
  Image: 'ri-upload-2-line',
  Caption: 'ri-chat-quote-line',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'galleryTitle', label: 'Gallery' },
  { key: 'title', label: 'Title' },
  { key: 'imagePath', label: 'Image' },
  { key: 'caption', label: 'Caption' },
]

const Images = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [rows, setRows] = useState([])
  const [galleries, setGalleries] = useState([])
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
  }, [contextSchoolOptions, isSuperAdmin, manualScope.schoolOptions, manualScope.selectedHeadOfficeId])
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
        const data = await fetchGalleryImagesPage({
          schoolId: scopedSchoolIds[0],
          galleryId: filters.galleryId || '',
          search,
          page: currentPage - 1,
          size: rowsPerPage,
        })
        const content = Array.isArray(data?.content) ? data.content : []
        setRows(content)
        setTotalElements(Number(data?.totalElements ?? content.length))
        setTotalPages(Math.max(1, Number(data?.totalPages ?? 1)))
        return
      }

      const rows = await fetchRowsForSchoolIds(scopedSchoolIds, (schoolId) =>
        fetchGalleryImages({ schoolId, galleryId: filters.galleryId || '' }),
      )
      const query = search.trim().toLowerCase()
      const filteredRows = uniqueBy(Array.isArray(rows) ? rows : [], (row) => row?.id)
        .filter((row) => {
          if (filters.galleryId && String(row?.galleryId ?? '') !== String(filters.galleryId)) return false
          if (!query) return true
          const haystack = [row?.title, row?.caption, row?.imagePath, row?.schoolName, row?.galleryTitle]
            .map((value) => String(value ?? '').toLowerCase())
            .join(' ')
          return haystack.includes(query)
        })
      const start = (currentPage - 1) * rowsPerPage
      setRows(filteredRows.slice(start, start + rowsPerPage))
      setTotalElements(filteredRows.length)
      setTotalPages(Math.max(1, Math.ceil(filteredRows.length / rowsPerPage)))
    } catch {
      setRows([])
      setTotalElements(0)
      setTotalPages(1)
      setError('Failed to load images')
    } finally {
      setLoading(false)
    }
  }, [currentPage, filters.galleryId, rowsPerPage, scopedSchoolIds, search])

  const loadGalleries = useCallback(async (schoolId) => {
    if (!schoolId) {
      setGalleries([])
      return
    }
    try {
      const list = await fetchGalleries({ schoolId })
      setGalleries(Array.isArray(list) ? list : [])
    } catch {
      setGalleries([])
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])



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



  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
    if (isSuperAdmin && pendingFilters.schoolId) {
      manualScope.setSelectedSchoolId(pendingFilters.schoolId)
    }
    if (pendingFilters.schoolId) loadGalleries(pendingFilters.schoolId)
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const openAdd = () => {
    sessionStorage.removeItem('edit-image-row')
    onNavigate('images-add')
  }

  const openEdit = (row) => {
    sessionStorage.setItem('edit-image-row', JSON.stringify(row))
    onNavigate('images-add')
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this image?')) return
    try {
      await deleteGalleryImage(id)
      await loadData()
    } catch (err) {
      alert(err.message || 'Delete failed')
    }
  }

  const currentStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const currentEnd = totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Images</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Images</span>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-12">
          <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add Images
          </button>
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
                placeholder="Search images..."
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

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 860 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.schoolName ? <th scope="col">School</th> : null}
                  {visibleColumns.galleryTitle ? <th scope="col">Gallery</th> : null}
                  {visibleColumns.title ? <th scope="col">Title</th> : null}
                  {visibleColumns.imagePath ? <th scope="col">Image</th> : null}
                  {visibleColumns.caption ? <th scope="col">Caption</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading images...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No images found.
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
                      {visibleColumns.galleryTitle ? <td>{row.galleryTitle}</td> : null}
                      {visibleColumns.title ? <td className="fw-medium text-primary-light">{row.title}</td> : null}
                      {visibleColumns.imagePath ? (
                        <td>
                          <div
                            className="radius-8 border border-neutral-200 bg-neutral-50 d-flex align-items-center justify-content-center overflow-hidden"
                            style={{ width: 70, height: 50, minWidth: 70 }}
                          >
                            {row.imagePath ? (
                              <img
                                src={`/uploads/gallery_images/${row.imagePath}`}
                                alt={row.title}
                                className="w-100 h-100 object-fit-cover"
                              />
                            ) : (
                              <i className="ri-image-line text-secondary-light"></i>
                            )}
                          </div>
                        </td>
                      ) : null}
                      {visibleColumns.caption ? <td>{row.caption}</td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => openEdit(row)}
                            title="Edit"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => handleDelete(row.id)}
                            title="Delete"
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



      <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter Images" onClose={() => setIsFilterSidebarOpen(false)} className="filter-sidebar">
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
           <div style={{ display: isSuperAdmin ? 'block' : 'none' }}>
            <ManualScopeSelectors
                enabled={isSuperAdmin}
                headOffices={manualScope.headOffices}
                schoolOptions={schoolOptions}
                showSchoolSelector={showSchoolSelector}
                selectedHeadOfficeId={pendingFilters.headOfficeId}
                onHeadOfficeChange={(val) => {
                  manualScope.setSelectedHeadOfficeId(val)
                  manualScope.setSelectedSchoolId('')
                  setPendingFilters(p => ({ ...p, headOfficeId: val, schoolId: '', galleryId: '' }))
                  setGalleries([])
                }}
                selectedSchoolId={pendingFilters.schoolId}
                onSchoolChange={(val) => {
                   setPendingFilters(p => ({ ...p, schoolId: val, galleryId: '' }))
                   loadGalleries(val)
                }}
             />
          </div>

          {!isSuperAdmin && (
            <div>
              <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                School
              </label>
              <select id="schoolId" className="form-control form-select" value={pendingFilters.schoolId} onChange={(e) => {
                 const val = e.target.value
                 setPendingFilters(p => ({ ...p, schoolId: val, galleryId: '' }))
                 loadGalleries(val)
              }}>
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
            <label htmlFor="galleryId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Gallery
            </label>
            <select id="galleryId" className="form-control form-select" value={pendingFilters.galleryId} onChange={handlePendingFilterChange}>
              <option value="">Select Gallery</option>
              {galleries.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
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

export default Images
