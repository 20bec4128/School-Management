import { useMemo, useState, useEffect, useCallback } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useSchool } from '../context/useSchool'
import { useAuth } from '../context/useAuth'
import { fetchRowsForSchoolIds, normalizeSchoolIds, uniqueBy } from '../utils/schoolScope'
import { fetchPostalDispatches, deletePostalDispatch } from '../apis/postalApi'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const emptyFilters = { headOfficeId: '', schoolId: '' }

const columnOptions = [
  { key: 'schoolId', label: 'School ID' },
  { key: 'toTitle', label: 'To Title' },
  { key: 'referenceNo', label: 'Reference' },
  { key: 'fromTitle', label: 'From Title' },
  { key: 'date', label: 'Dispatch Date' },
]

const PostalDispatch = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)
  
  const listSchoolId = isSuperAdmin
    ? (activeSchoolId ? String(activeSchoolId) : '')
    : activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isSuperAdmin) {
        if (listSchoolId) {
          const list = await fetchPostalDispatches(listSchoolId)
          setData(Array.isArray(list) ? list : [])
        } else {
          const schoolIds = normalizeSchoolIds(contextSchoolOptions)
          const list = await fetchRowsForSchoolIds(schoolIds, (schoolId) => fetchPostalDispatches(schoolId))
          setData(uniqueBy(list, (row) => String(row?.id ?? `${row?.schoolId ?? ''}-${row?.referenceNo ?? ''}-${row?.date ?? ''}`)))
        }
      } else {
        if (!listSchoolId) {
          setData([])
          setError('Select a school before viewing postal dispatches.')
          return
        }
        const list = await fetchPostalDispatches(listSchoolId)
        setData(Array.isArray(list) ? list : [])
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch postal dispatches')
    } finally {
      setLoading(false)
    }
  }, [isSuperAdmin, listSchoolId, contextSchoolOptions])

  // Load table data on mount and whenever the active school scope changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadData() }, [loadData])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((r) => {
      const matchesSearch = !q || [String(r.schoolId), r.toTitle, r.referenceNo, r.fromTitle, r.date].join(' ').toLowerCase().includes(q)
      const matchesSchool = !filters.schoolId || String(r.schoolId) === String(filters.schoolId)
      return matchesSearch && matchesSchool
    })
  }, [search, filters, data])

  const paginated = useMemo(() => filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [currentPage, filtered, rowsPerPage])
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p += 1) pages.push(p)
    return pages
  }

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

  const exportRows = filtered.map((row, index) => ({
    'S.L': index + 1,
    'School ID': row.schoolId ?? '',
    'To Title': row.toTitle ?? '',
    Reference: row.referenceNo ?? '-',
    'From Title': row.fromTitle ?? '',
    'Dispatch Date': row.date ?? '',
  }))

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PostalDispatch')
    XLSX.writeFile(workbook, 'Postal_Dispatch.xlsx')
  }

  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    doc.setFontSize(16)
    doc.text('Postal Dispatch', 14, 14)
    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportRows[0] || {})],
      body: exportRows.map((row) => Object.values(row)),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [13, 110, 253] },
    })
    doc.save('Postal_Dispatch.pdf')
  }

  const openAdd = () => {
    sessionStorage.removeItem('edit-postal-dispatch-row')
    onNavigate('add-postal-dispatch')
  }

  const openEdit = (row) => {
    sessionStorage.setItem('edit-postal-dispatch-row', JSON.stringify(row))
    onNavigate('add-postal-dispatch')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this dispatch?')) return
    try {
      await deletePostalDispatch(id)
      void loadData()
    } catch {
      alert('Failed to delete postal dispatch')
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Postal Dispatch</h1>
          <span className="text-secondary-light">Dashboard / Postal Dispatch</span>
        </div>
        <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd} disabled={!isSuperAdmin && !listSchoolId}>
          <i className="ri-add-large-line"></i> Add Postal Dispatch
        </button>
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
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1"></i> Export
                  </span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li>
                    <button
                      type="button"
                      className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                      onClick={handleExportPdf}
                    >
                      <i className="ri-file-pdf-line"></i> PDF
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                      onClick={handleExportExcel}
                    >
                      <i className="ri-file-excel-2-line"></i> Excel
                    </button>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => {
                  setPendingFilters(filters)
                  setIsFilterSidebarOpen(true)
                }}
              >
                <span className="text-secondary-light text-sm">Filter</span>
                <i className="ri-arrow-right-line"></i>
              </button>
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line"></i>
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
              <select className="form-select form-select-sm w-auto" value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }}>
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="position-relative">
              <input type="text" className="form-control ps-40" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} />
              <i className="ri-search-line position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light"></i>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table bordered-table mb-0">
              <thead>
                <tr>
                  <th>S.L</th>
                  {columnOptions.map(col => visibleColumns[col.key] && <th key={col.key}>{col.label}</th>)}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={visibleColumnCount + 1} className="text-center py-40">Loading...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">No postal dispatches found.</td></tr>
                ) : paginated.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                    {visibleColumns.schoolId && <td>{row.schoolId}</td>}
                    {visibleColumns.toTitle && <td className="fw-medium text-primary-light">{row.toTitle}</td>}
                    {visibleColumns.referenceNo && <td>{row.referenceNo || '-'}</td>}
                    {visibleColumns.fromTitle && <td>{row.fromTitle}</td>}
                    {visibleColumns.date && <td>{row.date}</td>}
                    <td>
                      <div className="d-flex align-items-center gap-10">
                        <button className="bg-info-focus text-info-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" onClick={() => openEdit(row)}><i className="ri-edit-line"></i></button>
                        <button className="bg-danger-focus text-danger-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" onClick={() => handleDelete(row.id)}><i className="ri-delete-bin-line"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                Prev
              </button>
              {getVisiblePages().map((page) => (
                <button
                  key={page}
                  type="button"
                  className={page === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter" onClose={() => setIsFilterSidebarOpen(false)}>
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled={isSuperAdmin}
              headOffices={manualScope.headOffices}
              schoolOptions={manualScope.schoolOptions}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={(val) => setPendingFilters((p) => ({ ...p, headOfficeId: val, schoolId: '' }))}
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={(val) => setPendingFilters((p) => ({ ...p, schoolId: val }))}
            />
          ) : (
            <div>
              <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
              <select
                id="schoolId"
                className="form-control form-select"
                value={pendingFilters.schoolId}
                onChange={(e) => setPendingFilters((p) => ({ ...p, schoolId: e.target.value }))}
              >
                <option value="">All Schools</option>
                {(contextSchoolOptions || []).map((school) => (
                  <option key={String(school.id)} value={String(school.id)}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </div>
          )}
           <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
           <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">Reset</button>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default PostalDispatch
