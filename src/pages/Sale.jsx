import { useCallback, useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { deleteSale, fetchSalesPage } from '../apis/salesApi'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'sale-edit-row'

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  status: '',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'invoiceNumber', label: 'Invoice Number' },
  { key: 'userType', label: 'User Type' },
  { key: 'saleToName', label: 'Sale To' },
  { key: 'incomeHeadName', label: 'Income Head' },
  { key: 'grossAmount', label: 'Gross Amount' },
  { key: 'discountAmount', label: 'Discount' },
  { key: 'netAmount', label: 'Net Amount' },
  { key: 'status', label: 'Status' },
  { key: 'saleDate', label: 'Sale Date' },
]

const FormField = ({ label, children, full = false }) => (
  <div className={`avm-field${full ? ' full' : ''}`}>
    <label className="avm-label">{label}</label>
    {children}
  </div>
)

const Sale = ({ onNavigate }) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'

  const [rows, setRows] = useState([])
  const [headOffices, setHeadOffices] = useState([])
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
  const [filters, setFilters] = useState(emptyFilters)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const loadLookups = useCallback(async () => {
    setLookupLoading(true)
    try {
      const [headOfficePage, schools] = await Promise.all([
        fetchHeadOfficesPage(0, 500),
        fetchSchoolsLookup(),
      ])
      setHeadOffices(Array.isArray(headOfficePage?.content) ? headOfficePage.content : [])
      setAllSchools(Array.isArray(schools) ? schools : [])
    } catch (err) {
      console.error('Failed to load sale lookups:', err)
      setHeadOffices([])
      setAllSchools([])
    } finally {
      setLookupLoading(false)
    }
  }, [])

  const loadSales = useCallback(async () => {
    if (status !== 'ready' || !token) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchSalesPage({
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
      console.error('Failed to load sales:', err)
      setError(err?.message || 'Failed to load sales')
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, filters.headOfficeId, filters.schoolId, rowsPerPage, status, token])

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    void loadSales()
  }, [loadSales, status, token])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      const value = String(authHeadOfficeId)
      setPendingFilters((prev) => ({ ...prev, headOfficeId: value }))
      setFilters((prev) => ({ ...prev, headOfficeId: value }))
    }
  }, [authHeadOfficeId, isHeadOfficeAdmin])

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return
    const school = (Array.isArray(allSchools) ? allSchools : []).find((row) => String(row?.id ?? '') === String(authSchoolId))
    const headOfficeId = school?.headOfficeId != null ? String(school.headOfficeId) : ''
    const schoolId = String(authSchoolId)
    setPendingFilters((prev) => ({ ...prev, headOfficeId, schoolId }))
    setFilters((prev) => ({ ...prev, headOfficeId, schoolId }))
  }, [allSchools, authSchoolId, isSchoolAdmin])

  useEffect(() => {
    if (currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const resolveSchoolName = useCallback(
    (schoolId) => {
      if (schoolId == null) return ''
      const match = (Array.isArray(allSchools) ? allSchools : []).find((row) => String(row?.id ?? '') === String(schoolId))
      return match?.schoolName || (String(schoolId) === String(authSchoolId ?? '') ? authSchoolName || '' : '')
    },
    [allSchools, authSchoolId, authSchoolName],
  )

  const schoolOptionsFor = useCallback(
    (headOfficeId) => {
      const list = Array.isArray(allSchools) ? allSchools : []
      if (isSuperAdmin) {
        if (!headOfficeId) return []
        return list.filter((school) => String(school?.headOfficeId ?? '') === String(headOfficeId))
      }
      if (isHeadOfficeAdmin) {
        return list.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
      }
      if (isSchoolAdmin) {
        return list.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
      }
      return list
    },
    [allSchools, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin],
  )

  const filterSchoolOptions = useMemo(() => schoolOptionsFor(pendingFilters.headOfficeId), [pendingFilters.headOfficeId, schoolOptionsFor])

  const normalizedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        schoolName: row.schoolName || resolveSchoolName(row.schoolId),
      })),
    [resolveSchoolName, rows],
  )

  const currentStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const currentEnd = totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    const next = {
      headOfficeId: isHeadOfficeAdmin ? String(authHeadOfficeId ?? '') : '',
      schoolId: isSchoolAdmin ? String(authSchoolId ?? '') : '',
      status: '',
    }
    setPendingFilters(next)
    setFilters(next)
    setCurrentPage(1)
  }

  const exportRows = async () => {
    const size = Math.max(totalElements, rowsPerPage, 1)
    const data = await fetchSalesPage({
      page: 0,
      size,
      search: debouncedSearch,
      headOfficeId: filters.headOfficeId || undefined,
      schoolId: filters.schoolId || undefined,
      status: filters.status || undefined,
    })
    return Array.isArray(data?.content) ? data.content : []
  }

  const handleExportExcel = async () => {
    try {
      const exportData = await exportRows()
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales')
      XLSX.writeFile(workbook, 'Sale_Records.xlsx')
    } catch (err) {
      console.error('Failed to export sales:', err)
      setError(err?.message || 'Failed to export sales')
    }
  }

  const handleExportPDF = async () => {
    try {
      const exportData = await exportRows()
      const doc = new jsPDF({ orientation: 'landscape' })
      const visibleColumnsForExport = columnOptions.filter((column) => visibleColumns[column.key])
      doc.text('Sale Report', 14, 10)
      doc.autoTable({
        head: [['S.L', ...visibleColumnsForExport.map((column) => column.label)]],
        body: exportData.map((row, index) => [
          index + 1,
          ...visibleColumnsForExport.map((column) => row[column.key] ?? ''),
        ]),
        headStyles: { fillColor: [31, 41, 55] },
      })
      doc.save('Sale_Records.pdf')
    } catch (err) {
      console.error('Failed to export sales:', err)
      setError(err?.message || 'Failed to export sales')
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Sale</h1>
          <span className="text-secondary-light">Inventory / Sale Management</span>
        </div>
        <button
          type="button"
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={() => {
            sessionStorage.removeItem(EDIT_STORAGE_KEY)
            onNavigate?.('sale-create')
          }}
        >
          <i className="ri-add-large-line"></i> Add Sale
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1"></i> Export
                  </span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 d-flex align-items-center gap-10" onClick={handleExportExcel}><i className="ri-file-excel-2-line"></i> Excel</button></li>
                  <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 d-flex align-items-center gap-10" onClick={handleExportPDF}><i className="ri-file-3-line"></i> PDF</button></li>
                </ul>
              </div>
              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="text-secondary-light text-sm">Find</span>
                <i className="ri-arrow-right-line"></i>
              </button>
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown">
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <ul className="dropdown-menu p-12 border shadow">
                  {columnOptions.map((col) => (
                    <li key={col.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input type="checkbox" className="form-check-input mt-0" checked={visibleColumns[col.key]} onChange={() => toggleColumn(col.key)} />
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
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search sales..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          {error ? <div className="px-20 py-12 text-danger">{error}</div> : null}
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
                  {columnOptions.map((col) => visibleColumns[col.key] && <th key={col.key}>{col.label}</th>)}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading sales...
                    </td>
                  </tr>
                ) : normalizedRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  normalizedRows.map((row, idx) => (
                    <tr key={row.id ?? idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" />
                          <label className="form-check-label">{currentStart + idx}</label>
                        </div>
                      </td>
                      {columnOptions.map((col) =>
                        visibleColumns[col.key] ? (
                          <td key={col.key}>
                            {col.key === 'invoiceNumber' ? (
                              <span className="fw-medium text-primary-light">{row.invoiceNumber}</span>
                            ) : col.key === 'status' ? (
                              <span className="px-12 py-4 radius-4 fw-medium text-sm bg-success-100 text-success-600">{row.status || 'PAID'}</span>
                            ) : col.key === 'netAmount' ? (
                              <span className="fw-bold text-primary-light">{row.netAmount}</span>
                            ) : (
                              row[col.key] || '--'
                            )}
                          </td>
                        ) : null,
                      )}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => {
                              sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify({ id: row.id }))
                              onNavigate?.('sale-create')
                            }}
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={async () => {
                              if (!window.confirm(`Delete sale "${row.invoiceNumber || 'this sale'}"?`)) return
                              try {
                                await deleteSale(row.id)
                                await loadSales()
                              } catch (err) {
                                setError(err?.message || 'Failed to delete sale')
                              }
                            }}
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
              Showing {totalElements === 0 ? 0 : currentStart} - {totalElements === 0 ? 0 : currentEnd} of {totalElements} entries
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1 || totalPages < 1}>Prev</button>
              <button type="button" className="btn btn-sm btn-primary-600">{currentPage}</button>
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(Math.max(1, totalPages), p + 1))} disabled={currentPage === totalPages || totalPages < 1}>Next</button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} title="Find Sale">
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={headOffices.map((row) => ({ id: row.id, name: row.name || row.headOfficeName || '' }))}
              schoolOptions={filterSchoolOptions}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={(value) => setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))}
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={(value) => {
                const selectedSchool = (Array.isArray(allSchools) ? allSchools : []).find((row) => String(row?.id ?? '') === String(value))
                setPendingFilters((prev) => ({
                  ...prev,
                  schoolId: value,
                  headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
                }))
              }}
              schoolLabel="School"
            />
          ) : (
            <>
              {isHeadOfficeAdmin ? (
                <FormField label="Head Office" full>
                  <input className="avm-input" value={authHeadOfficeName || String(authHeadOfficeId || '')} disabled />
                </FormField>
              ) : null}
              <FormField label="School" full>
                <select className="avm-select" value={pendingFilters.schoolId} onChange={(e) => setPendingFilters((prev) => ({ ...prev, schoolId: e.target.value }))} disabled={isSchoolAdmin}>
                  <option value="">All Schools</option>
                  {filterSchoolOptions.map((school) => (
                    <option key={String(school.id)} value={String(school.id)}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </FormField>
            </>
          )}

          <FormField label="Status" full>
            <select className="avm-select" value={pendingFilters.status} onChange={(e) => setPendingFilters((prev) => ({ ...prev, status: e.target.value }))}>
              <option value="">All Status</option>
              <option value="PAID">PAID</option>
              <option value="UNPAID">UNPAID</option>
              <option value="PARTIAL">PARTIAL</option>
            </select>
          </FormField>

          <div className="d-flex gap-8 mt-12">
            <button type="button" className="btn btn-danger-200 text-danger-600 w-100" onClick={handleResetFilters}>
              Reset
            </button>
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply Filter
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default Sale
