import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useSchool } from '../context/useSchool'
import { useAuth } from '../context/useAuth'
import { fetchRowsForSchoolIds, findSchoolById, normalizeSchoolIds, uniqueBy } from '../utils/schoolScope'
import { 
  fetchPostalDispatches, 
  createPostalDispatch, 
  updatePostalDispatch, 
  deletePostalDispatch 
} from '../apis/postalApi'
import '../assets/css/addModalShared.css'

const emptyForm = {
  schoolId: '',
  toTitle: '',
  referenceNo: '',
  address: '',
  fromTitle: '',
  date: new Date().toISOString().split('T')[0],
  note: '',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
}

const ADD_STEPS = ['Basic Info', 'Other Info']
const EDIT_STEPS = ['Basic Info', 'Other Info']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'To Title': 'ri-user-received-line',
  Reference: 'ri-file-list-3-line',
  Address: 'ri-map-pin-2-line',
  'From Title': 'ri-user-shared-line',
  'Dispatch Date': 'ri-calendar-2-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'schoolId', label: 'School ID' },
  { key: 'toTitle', label: 'To Title' },
  { key: 'referenceNo', label: 'Reference' },
  { key: 'fromTitle', label: 'From Title' },
  { key: 'date', label: 'Dispatch Date' },
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

const PostalDispatch = () => {
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
  const [selectedRows, setSelectedRows] = useState([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const attachmentRef = useRef()
  const editAttachmentRef = useRef()
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
      console.error('Failed to fetch postal dispatches:', err)
      setError(err?.message || 'Failed to fetch postal dispatches')
    } finally {
      setLoading(false)
    }
  }, [isSuperAdmin, listSchoolId, contextSchoolOptions])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (!isSuperAdmin && listSchoolId) {
      setAddForm(prev => ({ ...prev, schoolId: listSchoolId }))
    }
  }, [isSuperAdmin, listSchoolId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((r) => {
      const matchesSearch = !q || [String(r.schoolId), r.toTitle, r.referenceNo, r.fromTitle, r.date].join(' ').toLowerCase().includes(q)
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
    setError('')
    setAddForm({ ...emptyForm, schoolId: isSuperAdmin ? '' : listSchoolId || '' })
    setAddStep(0)
    setIsAddOpen(true) 
  }

  const openEdit = (row) => {
    setError('')
    if (isSuperAdmin) {
      const school = findSchoolById(manualScope.schoolOptions, row.schoolId)
      if (school?.headOfficeId != null) {
        manualScope.setSelectedScope(String(school.headOfficeId), row.schoolId != null ? String(row.schoolId) : '')
      }
    }
    setEditForm({
      ...row,
      schoolId: row.schoolId != null ? String(row.schoolId) : listSchoolId,
      date: row.date || new Date().toISOString().split('T')[0],
      note: row.note || '',
    })
    setEditStep(0)
    setIsEditOpen(true)
  }

  const buildPayload = (form) => ({
    schoolId: form.schoolId ? Number(form.schoolId) : null,
    toTitle: form.toTitle || '',
    referenceNo: form.referenceNo || '',
    address: form.address || '',
    fromTitle: form.fromTitle || '',
    date: form.date || null,
    note: form.note || '',
  })

  const handleSave = async () => {
    try {
      if (!addForm.schoolId || !addForm.toTitle || !addForm.fromTitle || !addForm.date) {
        alert('Please fill all required fields')
        return
      }
      await createPostalDispatch(buildPayload(addForm))
      setIsAddOpen(false)
      void loadData()
    } catch (err) {
      setError(err?.message || 'Failed to save postal dispatch')
      alert('Failed to save postal dispatch')
    }
  }

  const handleUpdate = async () => {
    try {
      await updatePostalDispatch(editForm.id, buildPayload(editForm))
      setIsEditOpen(false)
      void loadData()
    } catch (err) {
      setError(err?.message || 'Failed to update postal dispatch')
      alert('Failed to update postal dispatch')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dispatch?')) return
    try {
      await deletePostalDispatch(id)
      void loadData()
    } catch (err) {
      alert('Failed to delete postal dispatch')
    }
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  const renderForm = (form, setter, aRef, step = 0) => (
    <>
      <p className="avm-section-title">{step === 0 ? 'Basic Information' : 'Other Information'}</p>
      <div className="avm-grid">
        {step === 0 ? (
          <>
        {isSuperAdmin ? (
          <div className="avm-field full">
            <ManualScopeSelectors
              enabled={isSuperAdmin}
              headOffices={manualScope.headOffices}
              schoolOptions={schoolOptions}
              selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
              onHeadOfficeChange={(value) => {
                manualScope.setSelectedHeadOfficeId(value)
                manualScope.setSelectedSchoolId('')
                setter((prev) => ({ ...prev, schoolId: '' }))
              }}
              selectedSchoolId={form.schoolId}
              onSchoolChange={(value) => setter((prev) => ({ ...prev, schoolId: value }))}
            />
          </div>
        ) : (
          <FormField label="School Name" required full>
            <select 
              className="avm-select" 
              id="schoolId" 
              value={form.schoolId} 
              onChange={handleChange(setter)}
              disabled={isSchoolLocked}
            >
              <option value="">--Select School--</option>
              {schoolOptions.map(s => (
                <option key={s.id} value={s.id}>{s.schoolName}</option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="To Title" required>
          <input
            type="text"
            className="avm-input"
            id="toTitle"
            placeholder="Enter to title"
            value={form.toTitle}
            onChange={handleChange(setter)}
          />
        </FormField>

        <FormField label="Reference">
          <input
            type="text"
            className="avm-input"
            id="referenceNo"
            placeholder="Enter reference"
            value={form.referenceNo}
            onChange={handleChange(setter)}
          />
        </FormField>

        <FormField label="Address" required full>
          <textarea
            rows="3"
            className="avm-input avm-textarea"
            id="address"
            placeholder="Enter address"
            value={form.address}
            onChange={handleChange(setter)}
          />
        </FormField>

        <FormField label="From Title" required>
          <input
            type="text"
            className="avm-input"
            id="fromTitle"
            placeholder="Enter from title"
            value={form.fromTitle}
            onChange={handleChange(setter)}
          />
        </FormField>

        <FormField label="Dispatch Date" required>
          <input
            type="date"
            className="avm-input"
            id="date"
            value={form.date}
            onChange={handleChange(setter)}
          />
        </FormField>
          </>
        ) : (
          <>

        <FormField label="Note" full>
          <textarea
            rows="3"
            className="avm-input avm-textarea"
            id="note"
            placeholder="Enter note"
            value={form.note}
            onChange={handleChange(setter)}
          />
        </FormField>
          </>
        )}
      </div>
    </>
  )

  return (
    <div className="dashboard-main-body">
      {/* Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Postal Dispatch</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">Dashboard</button>
            <span className="text-secondary-light"> / Postal Dispatch</span>
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
            Add Postal Dispatch
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
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm"><i className="ri-file-upload-line text-md line-height-1"></i> Export</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"><i className="ri-file-3-line"></i> PDF</button></li>
                  <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"><i className="ri-file-excel-2-line"></i> Excel</button></li>
                </ul>
              </div>

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
                placeholder="Search postal dispatch..."
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
                  {visibleColumns.toTitle ? <th scope="col">To Title</th> : null}
                  {visibleColumns.referenceNo ? <th scope="col">Reference</th> : null}
                  {visibleColumns.fromTitle ? <th scope="col">From Title</th> : null}
                  {visibleColumns.date ? <th scope="col">Dispatch Date</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">Loading...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">No postal dispatches found.</td></tr>
                ) : paginated.map((row, idx) => (
                  <tr key={row.id}>
                    <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input type="checkbox" className="form-check-input" checked={selectedRows.includes(row.id)} onChange={() => handleSelectRow(row.id)} />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                    {visibleColumns.schoolId ? <td>{row.schoolId}</td> : null}
                    {visibleColumns.toTitle ? <td className="fw-medium text-primary-light">{row.toTitle}</td> : null}
                    {visibleColumns.referenceNo ? <td>{row.referenceNo || '-'}</td> : null}
                    {visibleColumns.fromTitle ? <td>{row.fromTitle}</td> : null}
                    {visibleColumns.date ? <td>{row.date}</td> : null}
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

      {/* Add Modal */}
      <WizardPopup
        modalWidth="540px"
        open={isAddOpen}
        title="Add Postal Dispatch"
        steps={ADD_STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(ADD_STEPS.length - 1, s + 1))}
        onSubmit={handleSave}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm, attachmentRef, addStep)}
      </WizardPopup>

      {/* Edit Modal */}
      <WizardPopup
        modalWidth="540px"
        open={isEditOpen}
        title="Edit Postal Dispatch"
        steps={EDIT_STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(EDIT_STEPS.length - 1, s + 1))}
        onSubmit={handleUpdate}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm, editAttachmentRef, editStep)}
      </WizardPopup>

      {/* Filter Sidebar */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Postal Dispatches"
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

export default PostalDispatch

