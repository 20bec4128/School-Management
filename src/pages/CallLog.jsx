import { useMemo, useState, useEffect, useCallback } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import PhoneField from '../components/PhoneField'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useSchool } from '../context/useSchool'
import { useAuth } from '../context/useAuth'
import { fetchRowsForSchoolIds, findSchoolById, normalizeSchoolIds, uniqueBy } from '../utils/schoolScope'
import { 
  fetchCallLogsPage, 
  createCallLog, 
  updateCallLog, 
  deleteCallLog 
} from '../apis/callLogApi'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'

const emptyForm = {
  schoolId: '',
  name: '',
  phone: '',
  callDuration: '',
  date: new Date().toISOString().split('T')[0],
  followUpDate: '',
  callType: 'Incoming',
  note: '',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  callType: 'Select',
}

const ADD_STEPS = ['Basic Info', 'Other Info']
const EDIT_STEPS = ['Basic Info', 'Other Info']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Name: 'ri-user-3-line',
  Phone: 'ri-phone-line',
  'Call Duration': 'ri-time-line',
  'Call Date': 'ri-calendar-2-line',
  'Follow Up': 'ri-calendar-check-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'schoolId', label: 'School ID' },
  { key: 'callType', label: 'Call Type' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'callDuration', label: 'Call Duration' },
  { key: 'date', label: 'Call Date' },
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

const callTypeBadge = (type) => {
  if (type === 'Incoming') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (type === 'Outgoing') return 'bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
}

const CallLog = ({ onNavigate }) => {
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
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)
  const schoolOptions = isSuperAdmin
    ? (manualScope.selectedHeadOfficeId ? manualScope.schoolOptions : contextSchoolOptions)
    : contextSchoolOptions
  const scopedSchoolIds = useMemo(() => {
    if (isSuperAdmin) {
      if (filters.schoolId) return [String(filters.schoolId)]
      if (manualScope.selectedSchoolId) return [String(manualScope.selectedSchoolId)]
      if (manualScope.selectedHeadOfficeId) return normalizeSchoolIds(manualScope.schoolOptions)
      return normalizeSchoolIds(contextSchoolOptions)
    }

    const singleSchoolId =
      activeSchoolId || authSchoolId || (schoolOptions.length === 1 ? schoolOptions[0]?.id : '')
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
  const isSchoolLocked = !isSuperAdmin && !!listSchoolId
  const currentStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const currentEnd = totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)

  const loadData = useCallback(async () => {
    if (scopedSchoolIds.length === 0) {
      setData([])
      setTotalElements(0)
      setTotalPages(1)
      return
    }
    setLoading(true)
    setError('')
    try {
      if (scopedSchoolIds.length === 1) {
        const dataPage = await fetchCallLogsPage({
          schoolId: scopedSchoolIds[0],
          search,
          callType: filters.callType === 'Select' ? '' : filters.callType,
          page: currentPage - 1,
          size: rowsPerPage,
        })
        const content = Array.isArray(dataPage?.content) ? dataPage.content : []
        setData(content)
        setTotalElements(Number(dataPage?.totalElements ?? content.length))
        setTotalPages(Math.max(1, Number(dataPage?.totalPages ?? 1)))
        return
      }

      const rows = await fetchRowsForSchoolIds(scopedSchoolIds, async (schoolId) => {
        const dataPage = await fetchCallLogsPage({
          schoolId,
          search,
          callType: filters.callType === 'Select' ? '' : filters.callType,
          page: 0,
          size: 1000,
        })
        return Array.isArray(dataPage?.content) ? dataPage.content : []
      })
      const mergedRows = uniqueBy(Array.isArray(rows) ? rows : [], (row) => row?.id)
        .sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0))
      const start = Math.max(0, (currentPage - 1) * rowsPerPage)
      const end = Math.min(start + rowsPerPage, mergedRows.length)
      setData(mergedRows.slice(start, end))
      setTotalElements(mergedRows.length)
      setTotalPages(Math.max(1, Math.ceil(mergedRows.length / rowsPerPage)))
    } catch (err) {
      console.error('Failed to fetch call logs:', err)
      setData([])
      setTotalElements(0)
      setTotalPages(1)
      setError(err?.message || 'Failed to fetch call logs')
    } finally {
      setLoading(false)
    }
  }, [currentPage, filters.callType, rowsPerPage, scopedSchoolIds, search])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  useEffect(() => {
    if (listSchoolId) {
      setAddForm(prev => ({ ...prev, schoolId: listSchoolId }))
    }
  }, [listSchoolId])

  const allSelected = data.length > 0 && data.every((r) => selectedRows.includes(r.id))

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows((prev) => [...new Set([...prev, ...data.map((r) => r.id)])])
    else setSelectedRows((prev) => prev.filter((id) => !data.some((r) => r.id === id)))
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
    setError('')
    sessionStorage.removeItem('call-log-edit-row')
    onNavigate?.('add-call-log')
  }

  const openEdit = (row) => {
    if (!row?.id) return
    sessionStorage.setItem(
      'call-log-edit-row',
      JSON.stringify({
        id: row.id,
        schoolId: row.schoolId != null ? String(row.schoolId) : '',
        name: row.name || '',
        phone: row.phone || '',
        callDuration: row.callDuration || '',
        date: row.date || new Date().toISOString().split('T')[0],
        followUpDate: row.followUpDate || '',
        callType: row.callType || 'Incoming',
        note: row.note || '',
      }),
    )
    onNavigate?.('add-call-log')
  }

  const buildPayload = (form) => ({
    schoolId: form.schoolId ? Number(form.schoolId) : null,
    name: form.name || '',
    phone: form.phone || '',
    callDuration: form.callDuration || '',
    date: form.date || null,
    followUpDate: form.followUpDate || null,
    callType: form.callType || 'Incoming',
    note: form.note || '',
  })

  const handleSave = async () => {
    try {
      if (!addForm.schoolId || !addForm.name || !addForm.date) {
        alert('Please fill all required fields')
        return
      }
      await createCallLog(buildPayload(addForm))
      setIsAddOpen(false)
      void loadData()
    } catch (err) {
      setError(err?.message || 'Failed to save call log')
      alert('Failed to save call log')
    }
  }

  const handleUpdate = async () => {
    try {
      await updateCallLog(editForm.id, buildPayload(editForm))
      setIsEditOpen(false)
      void loadData()
    } catch (err) {
      setError(err?.message || 'Failed to update call log')
      alert('Failed to update call log')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this call log?')) return
    try {
      await deleteCallLog(id)
      void loadData()
    } catch (err) {
      alert('Failed to delete call log')
    }
  }

  const renderForm = (form, setter, step = 0) => (
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

        <FormField label="Name" required>
          <input
            type="text"
            className="avm-input"
            id="name"
            placeholder="Enter name"
            value={form.name}
            onChange={handleChange(setter)}
          />
        </FormField>

        <PhoneField
          id="phone"
          label="Phone number"
          required
          value={form.phone}
          onChange={(fullValue) => setter((prev) => ({ ...prev, phone: fullValue }))}
        />

        <FormField label="Call Duration" required>
          <input
            type="text"
            className="avm-input"
            id="callDuration"
            placeholder="e.g. 5 min"
            value={form.callDuration}
            onChange={handleChange(setter)}
          />
        </FormField>

        <FormField label="Call Date" required>
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

        <FormField label="Follow Up">
          <input
            type="date"
            className="avm-input"
            id="followUpDate"
            value={form.followUpDate}
            onChange={handleChange(setter)}
          />
        </FormField>

        <div className="avm-field full avm-call-type-group">
          <label className="avm-label">Call Type</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.45rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#34393f' }}>
              <input
                className="avm-call-type-radio"
                type="radio"
                name={`callType-${setter === setAddForm ? 'add' : 'edit'}`}
                value="Incoming"
                checked={form.callType === 'Incoming'}
                onChange={() => setter((prev) => ({ ...prev, callType: 'Incoming' }))}
                style={{ accentColor: '#45597a', width: 16, height: 16 }}
              />
              <i className="ri-phone-incoming-line" style={{ color: '#16a34a', fontSize: '1rem' }}></i>
              Incoming
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#34393f' }}>
              <input
                className="avm-call-type-radio"
                type="radio"
                name={`callType-${setter === setAddForm ? 'add' : 'edit'}`}
                value="Outgoing"
                checked={form.callType === 'Outgoing'}
                onChange={() => setter((prev) => ({ ...prev, callType: 'Outgoing' }))}
                style={{ accentColor: '#45597a', width: 16, height: 16 }}
              />
              <i className="ri-phone-outgoing-line" style={{ color: '#2563eb', fontSize: '1rem' }}></i>
              Outgoing
            </label>
          </div>
        </div>

        <FormField label="Note" full>
          <textarea
            rows="4"
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Call Log</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">Dashboard</button>
            <span className="text-secondary-light"> / Call Log</span>
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
            Add Call Log
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

              <RowsPerPageSelect
                value={rowsPerPage}
                onChange={(value) => {
                  setRowsPerPage(value)
                  setCurrentPage(1)
                }}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>

            {/* Search */}
            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search call log..."
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
                  {visibleColumns.callType ? <th scope="col">Call Type</th> : null}
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.phone ? <th scope="col">Phone</th> : null}
                  {visibleColumns.callDuration ? <th scope="col">Call Duration</th> : null}
                  {visibleColumns.date ? <th scope="col">Call Date</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">Loading...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">No call logs found.</td></tr>
                ) : data.map((row, idx) => (
                  <tr key={row.id}>
                    <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input type="checkbox" className="form-check-input" checked={selectedRows.includes(row.id)} onChange={() => handleSelectRow(row.id)} />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                    {visibleColumns.schoolId ? <td>{row.schoolId}</td> : null}
                    {visibleColumns.callType ? (
                      <td><span className={callTypeBadge(row.callType)}>{row.callType}</span></td>
                    ) : null}
                    {visibleColumns.name ? <td className="fw-medium text-primary-light">{row.name}</td> : null}
                    {visibleColumns.phone ? <td>{row.phone}</td> : null}
                    {visibleColumns.callDuration ? <td>{row.callDuration}</td> : null}
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

      {/* Add Modal */}
      <WizardPopup
        modalWidth="540px"
        open={isAddOpen}
        title="Add Call Log"
        steps={ADD_STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(ADD_STEPS.length - 1, s + 1))}
        onSubmit={handleSave}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm, addStep)}
      </WizardPopup>

      {/* Edit Modal */}
      <WizardPopup
        modalWidth="540px"
        open={isEditOpen}
        title="Edit Call Log"
        steps={EDIT_STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(EDIT_STEPS.length - 1, s + 1))}
        onSubmit={handleUpdate}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm, editStep)}
      </WizardPopup>

      {/* Filter Sidebar */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Call Logs"
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
                showSchoolSelector={showSchoolSelector}
                selectedHeadOfficeId={pendingFilters.headOfficeId}
                onHeadOfficeChange={(val) => setPendingFilters((p) => ({ ...p, headOfficeId: val, schoolId: '' }))}
                selectedSchoolId={pendingFilters.schoolId}
                onSchoolChange={(val) => setPendingFilters((p) => ({ ...p, schoolId: val }))}
              />
            </div>
          ) : (
            <div className="full">
              <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                School
              </label>
              <select
                id="schoolId"
                className="form-control form-select"
                value={pendingFilters.schoolId}
                onChange={handlePendingFilterChange}
              >
                <option value="">All Schools</option>
                {(contextSchoolOptions || []).map((s) => (
                  <option key={String(s.id)} value={String(s.id)}>{s.schoolName}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="callType" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Call Type
            </label>
            <select
              id="callType"
              className="form-control form-select"
              value={pendingFilters.callType}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Call Type</option>
              <option value="Incoming">Incoming</option>
              <option value="Outgoing">Outgoing</option>
            </select>
          </div>
          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
              Reset
            </button>
          </div>
          <div>
            <button
              type="submit"
              className="btn btn-primary-600 w-100"
              onClick={() => setIsFilterSidebarOpen(false)}
            >
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default CallLog

