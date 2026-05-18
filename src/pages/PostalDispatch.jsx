import { useMemo, useState, useEffect, useCallback } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useSchool } from '../context/useSchool'
import { useAuth } from '../context/useAuth'
import { fetchRowsForSchoolIds, normalizeSchoolIds, uniqueBy } from '../utils/schoolScope'
import { fetchPostalDispatchesPage, deletePostalDispatch } from '../apis/postalApi'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'

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
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)
  
  const schoolOptions = isSuperAdmin ? (manualScope.selectedHeadOfficeId ? manualScope.schoolOptions : contextSchoolOptions) : contextSchoolOptions
  const scopedSchoolIds = useMemo(() => {
    if (isSuperAdmin) {
      if (filters.schoolId) return [String(filters.schoolId)]
      if (manualScope.selectedSchoolId) return [String(manualScope.selectedSchoolId)]
      if (manualScope.selectedHeadOfficeId) return normalizeSchoolIds(manualScope.schoolOptions)
      return normalizeSchoolIds(contextSchoolOptions)
    }
    const singleSchoolId = activeSchoolId || authSchoolId || (schoolOptions.length === 1 ? schoolOptions[0]?.id : '')
    return String(singleSchoolId ?? '').trim() ? [String(singleSchoolId)] : []
  }, [activeSchoolId, authSchoolId, contextSchoolOptions, filters.schoolId, isSuperAdmin, manualScope.schoolOptions, manualScope.selectedHeadOfficeId, manualScope.selectedSchoolId, schoolOptions])
  const listSchoolId = scopedSchoolIds[0] || ''
  const showSchoolSelector = schoolOptions.length > 1
  const currentStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const currentEnd = totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (scopedSchoolIds.length === 0) {
        setData([])
        setTotalElements(0)
        setTotalPages(1)
        return
      }
      if (scopedSchoolIds.length === 1) {
        const pageData = await fetchPostalDispatchesPage({
          schoolId: scopedSchoolIds[0],
          page: currentPage - 1,
          size: rowsPerPage,
          search,
        })
        setData(Array.isArray(pageData?.content) ? pageData.content : [])
        setTotalElements(Number(pageData?.totalElements ?? 0))
        setTotalPages(Math.max(1, Number(pageData?.totalPages ?? 1)))
        return
      }
      const rows = await fetchRowsForSchoolIds(scopedSchoolIds, async (schoolId) => {
        const pageData = await fetchPostalDispatchesPage({ schoolId, page: 0, size: 1000, search })
        return Array.isArray(pageData?.content) ? pageData.content : []
      })
      const mergedRows = uniqueBy(Array.isArray(rows) ? rows : [], (row) => row?.id).sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0))
      const start = Math.max(0, (currentPage - 1) * rowsPerPage)
      const end = Math.min(start + rowsPerPage, mergedRows.length)
      setData(mergedRows.slice(start, end))
      setTotalElements(mergedRows.length)
      setTotalPages(Math.max(1, Math.ceil(mergedRows.length / rowsPerPage)))
    } catch (err) {
      setError(err?.message || 'Failed to fetch postal dispatches')
      setData([])
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [currentPage, rowsPerPage, scopedSchoolIds, search])

  // Load table data on mount and whenever the active school scope changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadData() }, [loadData])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
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

  const exportRows = data.map((row, index) => ({
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

  const handleExportPDF = () => {
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
              <ExportDropdown onExportExcel={handleExportExcel} onExportPDF={handleExportPDF} />
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
                ) : data.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">No postal dispatches found.</td></tr>
                ) : data.map((row, idx) => (
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
              Showing {currentStart} - {currentEnd} of {totalElements} entries
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

      <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter" onClose={() => setIsFilterSidebarOpen(false)}>
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled={isSuperAdmin}
              headOffices={manualScope.headOffices}
              schoolOptions={manualScope.schoolOptions}
              showSchoolSelector={showSchoolSelector}
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
