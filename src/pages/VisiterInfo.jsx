import { useMemo, useState, useEffect, useCallback } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import PhoneField from '../components/PhoneField'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useSchool } from '../context/useSchool'
import { useAuth } from '../context/useAuth'
import { fetchRowsForSchoolIds, findSchoolById, normalizeSchoolIds, uniqueBy } from '../utils/schoolScope'
import { 
  fetchVisitorInfos, 
  createVisitorInfo, 
  updateVisitorInfo, 
  deleteVisitorInfo 
} from '../apis/visitorInfoApi'
import { fetchVisitorPurposes } from '../apis/visitorPurposeApi'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const emptyForm = {
  schoolId: '',
  name: '',
  phone: '',
  purposeId: '',
  comingFrom: '',
  idCard: '',
  numOfPerson: 1,
  date: new Date().toISOString().split('T')[0],
  inTime: '',
  outTime: '',
  note: '',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
}

const STEPS = ['Basic']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Name: 'ri-user-3-line',
  'Meet User Type': 'ri-user-settings-line',
  'To Meet': 'ri-user-follow-line',
  'Visitor Purpose': 'ri-question-answer-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'schoolId', label: 'School ID' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'purposeName', label: 'Visitor Purpose' },
  { key: 'date', label: 'Date' },
  { key: 'inTime', label: 'In Time' },
  { key: 'outTime', label: 'Out Time' },
]

const FormField = ({ label, required, children, full = false, noIcon = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
      {!noIcon ? (
        <div className="avm-input-with-icon" style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#667085',
              fontSize: '0.95rem',
              lineHeight: 1,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <i className={icon}></i>
          </span>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

const VisitorInfo = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const [data, setData] = useState([])
  const [purposes, setPurposes] = useState([])
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
    : activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
  const schoolOptions = isSuperAdmin ? (manualScope.selectedHeadOfficeId ? manualScope.schoolOptions : []) : contextSchoolOptions
  const isSchoolLocked = !isSuperAdmin && !!listSchoolId

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isSuperAdmin) {
        if (listSchoolId) {
          const [infoList, purposeList] = await Promise.all([
            fetchVisitorInfos(listSchoolId),
            fetchVisitorPurposes(listSchoolId),
          ])
          setData(Array.isArray(infoList) ? infoList : [])
          setPurposes(uniqueBy(Array.isArray(purposeList) ? purposeList : [], (row) => row.id))
        } else {
          const schoolIds = normalizeSchoolIds(contextSchoolOptions)
          const [infoList, purposeList] = await Promise.all([
            fetchRowsForSchoolIds(schoolIds, (schoolId) => fetchVisitorInfos(schoolId)),
            fetchRowsForSchoolIds(schoolIds, (schoolId) => fetchVisitorPurposes(schoolId)),
          ])
          setData(uniqueBy(infoList, (row) => String(row?.id ?? `${row?.schoolId ?? ''}-${row?.name ?? ''}-${row?.phone ?? ''}`)))
          setPurposes(uniqueBy(purposeList, (row) => String(row?.id ?? `${row?.schoolId ?? ''}-${row?.purpose ?? ''}`)))
        }
      } else {
        if (!listSchoolId) {
          setData([])
          setPurposes([])
          setError('Select a school before viewing visitor info.')
          return
        }
        const [infoList, purposeList] = await Promise.all([
          fetchVisitorInfos(listSchoolId),
          fetchVisitorPurposes(listSchoolId),
        ])
        setData(Array.isArray(infoList) ? infoList : [])
        setPurposes(uniqueBy(Array.isArray(purposeList) ? purposeList : [], (row) => row.id))
      }
    } catch (err) {
      console.error('Failed to fetch visitor data:', err)
      setError(err?.message || 'Failed to fetch visitor info')
    } finally {
      setLoading(false)
    }
  }, [isSuperAdmin, listSchoolId, contextSchoolOptions])

  useEffect(() => {
    void loadData()
  }, [loadData])


  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((r) => {
      const matchesSearch = !q || [String(r.schoolId), r.name, r.phone, r.purposeName].join(' ').toLowerCase().includes(q)
      const matchesSchool = !filters.schoolId || String(r.schoolId) === String(filters.schoolId)
      return matchesSearch && matchesSchool
    })
  }, [search, filters, data])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((r) => selectedRows.includes(r.id))

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((r) => r.id)])])
    else setSelectedRows((prev) => prev.filter((id) => !paginated.some((r) => r.id === id)))
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({ ...prev, [id]: value }))
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
  }

  const openAdd = () => { 
    onNavigate("add-visitor-info");
  }

  const openEdit = (row) => {
    sessionStorage.setItem("visitor-info-edit-row", JSON.stringify(row));
    onNavigate("add-visitor-info");
  }


  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this visitor?')) return
    try {
      await deleteVisitorInfo(id)
      void loadData()
    } catch (err) {
      alert('Failed to delete visitor info')
    }
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }


  return (
    <div className="dashboard-main-body">
      {/* Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Visitor Info</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">Dashboard</button>
            <span className="text-secondary-light"> / Visitor Info</span>
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
            <span className="d-flex text-md"><i className="ri-add-large-line"></i></span>
            Add Visitor
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-8" role="alert">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      ) : null}

      {/* Table Card */}
      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {/* Toolbar */}
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

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }}
              >
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Search */}
            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search visitor..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light"><i className="ri-search-line"></i></span>
            </div>
          </div>

          {/* Table */}
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
                  {visibleColumns.schoolId ? <th scope="col">School ID</th> : null}
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.phone ? <th scope="col">Phone</th> : null}
                  {visibleColumns.purposeName ? <th scope="col">Visitor Purpose</th> : null}
                  {visibleColumns.date ? <th scope="col">Date</th> : null}
                  {visibleColumns.inTime ? <th scope="col">In Time</th> : null}
                  {visibleColumns.outTime ? <th scope="col">Out Time</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">Loading...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">No visitors found.</td></tr>
                ) : paginated.map((row, idx) => (
                  <tr key={row.id}>
                    <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input type="checkbox" className="form-check-input" checked={selectedRows.includes(row.id)} onChange={() => handleSelectRow(row.id)} />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                    {visibleColumns.schoolId ? <td>{row.schoolId}</td> : null}
                    {visibleColumns.name ? <td className="fw-medium text-primary-light">{row.name}</td> : null}
                    {visibleColumns.phone ? <td>{row.phone}</td> : null}
                    {visibleColumns.purposeName ? <td>{row.purposeName}</td> : null}
                    {visibleColumns.date ? <td>{row.date}</td> : null}
                    {visibleColumns.inTime ? (
                      <td>
                        {row.inTime
                          ? <span className="bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm">{row.inTime}</span>
                          : '-'}
                      </td>
                    ) : null}
                    {visibleColumns.outTime ? (
                      <td>
                        {row.outTime
                          ? <span className="bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm">{row.outTime}</span>
                          : <span className="bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm">In Premises</span>}
                      </td>
                    ) : null}
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              {getVisiblePages().map((p) => (
                <button key={p} type="button" className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </div>
      </div>


      {/* Filter Sidebar */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Visitors"
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
                selectedHeadOfficeId={pendingFilters.headOfficeId}
                onHeadOfficeChange={(val) => setPendingFilters((p) => ({ ...p, headOfficeId: val, schoolId: '' }))}
                selectedSchoolId={pendingFilters.schoolId}
                onSchoolChange={(val) => setPendingFilters((p) => ({ ...p, schoolId: val }))}
              />
            </div>
          ) : (
            <div className="full">
              <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
              <select
                id="schoolId"
                className="form-control form-select"
                value={pendingFilters.schoolId}
                onChange={handlePendingFilterChange}
              >
                <option value="">All Schools</option>
                {(contextSchoolOptions || []).map((s) => <option key={String(s.id)} value={String(s.id)}>{s.schoolName}</option>)}
              </select>
            </div>
          )}
          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">Reset</button>
          </div>
          <div>
            <button type="submit" className="btn btn-primary-600 w-100" onClick={() => setIsFilterSidebarOpen(false)}>Apply</button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default VisitorInfo

