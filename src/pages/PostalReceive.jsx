import { useMemo, useRef, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const postalReceives = [
  { sl: '01', school: 'Windsor Park High School', toTitle: 'Ministry of Education', reference: 'REF-2024-001', fromTitle: 'Principal', receiveDate: '2024-03-15' },
  { sl: '02', school: 'Windsor Park High School', toTitle: 'District Office', reference: 'REF-2024-002', fromTitle: 'Vice Principal', receiveDate: '2024-03-16' },
  { sl: '03', school: 'Windsor Park High School', toTitle: 'Parents Association', reference: '', fromTitle: 'Head Teacher', receiveDate: '2024-03-17' },
  { sl: '04', school: 'Windsor Park High School', toTitle: 'Local Authority', reference: 'REF-2024-004', fromTitle: 'Principal', receiveDate: '2024-03-18' },
  { sl: '05', school: 'Windsor Park High School', toTitle: 'Board of Governors', reference: 'REF-2024-005', fromTitle: 'Vice Principal', receiveDate: '2024-03-19' },
]

const emptyForm = {
  school: '',
  toTitle: '',
  reference: '',
  address: '',
  fromTitle: '',
  receiveDate: '',
  note: '',
  attachment: null,
}

const emptyFilters = {
  school: 'Select',
  fromTitle: 'Select',
}

const ADD_STEPS = ['Basic Info', 'Other Info']
const EDIT_STEPS = ['Basic Info', 'Other Info']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'To Title': 'ri-user-received-line',
  Reference: 'ri-file-list-3-line',
  Address: 'ri-map-pin-2-line',
  'From Title': 'ri-user-shared-line',
  'Receive Date': 'ri-calendar-2-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'toTitle', label: 'To Title' },
  { key: 'reference', label: 'Reference' },
  { key: 'fromTitle', label: 'From Title' },
  { key: 'receiveDate', label: 'Receive Date' },
]

const fromTitleOptions = ['Principal', 'Vice Principal', 'Head Teacher', 'Senior Teacher']

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

const PostalReceive = () => {
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

  const schoolOptions = useMemo(
    () => Array.from(new Set(postalReceives.map((r) => r.school))),
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return postalReceives.filter((r) => {
      const matchesSearch = !q || [r.school, r.toTitle, r.reference, r.fromTitle, r.receiveDate].join(' ').toLowerCase().includes(q)
      const matchesSchool = filters.school === 'Select' || r.school === filters.school
      const matchesFromTitle = filters.fromTitle === 'Select' || r.fromTitle === filters.fromTitle
      return matchesSearch && matchesSchool && matchesFromTitle
    })
  }, [search, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((r) => selectedRows.includes(r.sl))

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((r) => r.sl)])])
    else setSelectedRows((prev) => prev.filter((id) => !paginated.some((r) => r.sl === id)))
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

  const openAdd = () => { setAddForm(emptyForm); setAddStep(0); setIsAddOpen(true) }

  const openEdit = (row) => {
    setEditForm({
      ...emptyForm,
      school: row.school,
      toTitle: row.toTitle,
      reference: row.reference,
      fromTitle: row.fromTitle,
      receiveDate: row.receiveDate,
    })
    setEditStep(0)
    setIsEditOpen(true)
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
        <FormField label="School Name" required full>
          <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
            <option value="">--Select School--</option>
            <option>Windsor Park High School</option>
          </select>
        </FormField>

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
            id="reference"
            placeholder="Enter reference"
            value={form.reference}
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

        <FormField label="Receive Date" required>
          <input
            type="date"
            className="avm-input"
            id="receiveDate"
            value={form.receiveDate}
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

        <div className="avm-field full">
          <label className="avm-label">Attachment</label>
          <input
            ref={aRef}
            type="file"
            style={{ display: 'none' }}
            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={(e) => setter((prev) => ({ ...prev, attachment: e.target.files[0] }))}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button type="button" className="avm-btn light" onClick={() => aRef.current.click()}>
              <i className="ri-attachment-2"></i> Choose File
            </button>
            {form.attachment && (
              <span style={{ fontSize: '0.82rem', color: '#45597a', fontWeight: 500 }}>
                <i className="ri-file-line" style={{ marginRight: 4 }}></i>
                {form.attachment.name}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.78rem', color: '#7a8a9a', marginTop: 4 }}>
            Please select a valid file format: .jpg, .jpeg, .png, .gif, .pdf, .doc/docx, .xls/xlsx
          </span>
        </div>
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Postal Receive</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">Dashboard</button>
            <span className="text-secondary-light"> / Postal Receive</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
          <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <span className="d-flex text-md"><i className="ri-add-large-line"></i></span>
            Add Postal Receive
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {/* Toolbar */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              {/* Export */}
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

              {/* Filter */}
              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              {/* Columns */}
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
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

              {/* Rows per page */}
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
                placeholder="Search postal receive..."
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
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.toTitle ? <th scope="col">To Title</th> : null}
                  {visibleColumns.reference ? <th scope="col">Reference</th> : null}
                  {visibleColumns.fromTitle ? <th scope="col">From Title</th> : null}
                  {visibleColumns.receiveDate ? <th scope="col">Receive Date</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount} className="text-center py-40 text-secondary-light">No postal receives found.</td></tr>
                ) : paginated.map((row) => (
                  <tr key={row.sl}>
                    <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input type="checkbox" className="form-check-input" checked={selectedRows.includes(row.sl)} onChange={() => handleSelectRow(row.sl)} />
                          <label className="form-check-label">{row.sl}</label>
                        </div>
                      </td>
                    {visibleColumns.school ? <td>{row.school}</td> : null}
                    {visibleColumns.toTitle ? <td className="fw-medium text-primary-light">{row.toTitle}</td> : null}
                    {visibleColumns.reference ? <td>{row.reference || '-'}</td> : null}
                    {visibleColumns.fromTitle ? <td>{row.fromTitle}</td> : null}
                    {visibleColumns.receiveDate ? <td>{row.receiveDate}</td> : null}
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
        title="Add Postal Receive"
        steps={ADD_STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(ADD_STEPS.length - 1, s + 1))}
        onSubmit={() => setIsAddOpen(false)}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm, attachmentRef, addStep)}
      </WizardPopup>

      {/* Edit Modal */}
      <WizardPopup
        modalWidth="540px"
        open={isEditOpen}
        title="Edit Postal Receive"
        steps={EDIT_STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(EDIT_STEPS.length - 1, s + 1))}
        onSubmit={() => setIsEditOpen(false)}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm, editAttachmentRef, editStep)}
      </WizardPopup>

      {/* Filter Sidebar */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Postal Receives"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label htmlFor="school" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
            <select
              id="school"
              className="form-control form-select"
              value={pendingFilters.school}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select School</option>
              {schoolOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="fromTitle" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">From Title</label>
            <select
              id="fromTitle"
              className="form-control form-select"
              value={pendingFilters.fromTitle}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select From Title</option>
              {fromTitleOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
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

export default PostalReceive

