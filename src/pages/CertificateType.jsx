import { useMemo, useState, useRef } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const certificateTypes = [
  {
    sl: '01',
    certificateName: 'Merit Certificate',
    schoolName: 'Windsor Park High School',
    certificateText: 'This is to certify that [name] of class [class_name] has achieved merit.',
    background: null,
  },
  {
    sl: '02',
    certificateName: 'Participation Certificate',
    schoolName: 'Windsor Park High School',
    certificateText: 'This certifies that [name] participated in the annual event.',
    background: null,
  },
  {
    sl: '03',
    certificateName: 'Completion Certificate',
    schoolName: 'Windsor Park High School',
    certificateText: 'This is to certify that [name] of [section] has successfully completed.',
    background: null,
  },
]

const emptyForm = {
  school: '',
  certificateName: '',
  schoolNameOnCard: '',
  certificateText: '',
  footerLeftText: '',
  footerMiddleText: '',
  footerRightText: '',
  background: null,
}

const emptyFilters = {
  school: 'Select',
}

const STEPS = ['Basic Info', 'Certificate Content', 'Footer & Background']

const DYNAMIC_TAGS = [
  '[name]', '[email]', '[phone]', '[class_name]', '[section]', '[roll_no]',
  '[dob]', '[gender]', '[religion]', '[blood_group]', '[registration_no]',
  '[group]', '[created_at]', '[guardian]', '[present_address]', '[permanent_address]',
]

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Certificate Name': 'ri-award-line',
  'School Name on Card': 'ri-building-4-line',
  'Certificate Text': 'ri-file-text-line',
  'Footer Left Text': 'ri-align-left',
  'Footer Middle Text': 'ri-align-center',
  'Footer Right Text': 'ri-align-right',
}

const columnOptions = [
  { key: 'certificateName', label: 'Certificate Name' },
  { key: 'schoolName', label: 'School Name' },
  { key: 'certificateText', label: 'Certificate Text' },
  { key: 'background', label: 'Background' },
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

const CertificateType = () => {
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
  const [addBgPreview, setAddBgPreview] = useState(null)
  const [editBgPreview, setEditBgPreview] = useState(null)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const addBgRef = useRef(null)
  const editBgRef = useRef(null)
  const addTextareaRef = useRef(null)
  const editTextareaRef = useRef(null)

  const schoolOptions = useMemo(
    () => Array.from(new Set(certificateTypes.map((r) => r.schoolName))),
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return certificateTypes.filter((r) => {
      const matchesSearch =
        !q ||
        [r.certificateName, r.schoolName, r.certificateText]
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesSchool = filters.school === 'Select' || r.schoolName === filters.school
      return matchesSearch && matchesSchool
    })
  }, [search, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected =
    paginated.length > 0 && paginated.every((r) => selectedRows.includes(r.sl))

  const handleSelectAll = (e) => {
    if (e.target.checked)
      setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((r) => r.sl)])])
    else setSelectedRows((prev) => prev.filter((id) => !paginated.some((r) => r.sl === id)))
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    )
  }

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({ ...prev, [id]: value }))
  }

  const handleBgChange = (setter, setPreview) => (e) => {
    const file = e.target.files[0]
    if (!file) return
    setter((prev) => ({ ...prev, background: file }))
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const insertTag = (tag, setter, textareaRef) => {
    const el = textareaRef.current
    if (!el) {
      setter((prev) => ({ ...prev, certificateText: prev.certificateText + tag }))
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    setter((prev) => {
      const text = prev.certificateText
      return { ...prev, certificateText: text.slice(0, start) + tag + text.slice(end) }
    })
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + tag.length, start + tag.length)
    }, 0)
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
    setAddForm(emptyForm)
    setAddBgPreview(null)
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditForm({
      school: row.schoolName,
      certificateName: row.certificateName,
      schoolNameOnCard: row.schoolName,
      certificateText: row.certificateText,
      footerLeftText: '',
      footerMiddleText: '',
      footerRightText: '',
      background: null,
    })
    setEditBgPreview(null)
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

  const renderForm = (form, setter, bgPreview, setBgPreview, bgRef, textareaRef, step) => (
    <>
      <p className="avm-section-title">{STEPS[step]}</p>
      <div className="avm-grid">

        {step === 0 && (
          <>
            <FormField label="School Name" required full>
              <select
                className="avm-select"
                id="school"
                value={form.school}
                onChange={handleChange(setter)}
              >
                <option value="">--Select School--</option>
                <option>Windsor Park High School</option>
              </select>
            </FormField>

            <FormField label="Certificate Name" required full>
              <input
                type="text"
                className="avm-input"
                id="certificateName"
                placeholder="Certificate Name"
                value={form.certificateName}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="School Name on Card" required full>
              <input
                type="text"
                className="avm-input"
                id="schoolNameOnCard"
                placeholder="School Name"
                value={form.schoolNameOnCard}
                onChange={handleChange(setter)}
              />
            </FormField>
          </>
        )}

        {step === 1 && (
          <>
            {/* Dynamic tag chips */}
            <div className="avm-field full" style={{ marginBottom: '0.25rem' }}>
              <label className="avm-label">Dynamic Tags</label>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.4rem',
                  padding: '0.75rem',
                  background: '#f8fafc',
                  border: '1px solid #e8edf4',
                  borderRadius: '0.75rem',
                }}
              >
                {DYNAMIC_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertTag(tag, setter, textareaRef)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: '#e8edf4',
                      color: '#45597a',
                      border: 'none',
                      borderRadius: '2rem',
                      padding: '0.28rem 0.7rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.15s, color 0.15s',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#45597a'
                      e.currentTarget.style.color = '#fff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#e8edf4'
                      e.currentTarget.style.color = '#45597a'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#7a8a9a', margin: '0.4rem 0 0' }}>
                Click a tag to insert it at the cursor position in the text below.
              </p>
            </div>

            <div className="avm-field full">
              <label className="avm-label">
                Certificate Text <span className="req"> *</span>
              </label>
              <textarea
                ref={textareaRef}
                rows={6}
                className="avm-input avm-textarea"
                id="certificateText"
                placeholder="Certificate Text"
                value={form.certificateText}
                onChange={handleChange(setter)}
                style={{ borderRadius: '0.75rem' }}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <FormField label="Footer Left Text" full>
              <input
                type="text"
                className="avm-input"
                id="footerLeftText"
                placeholder="Footer Left Text"
                value={form.footerLeftText}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Footer Middle Text" full>
              <input
                type="text"
                className="avm-input"
                id="footerMiddleText"
                placeholder="Footer Middle Text"
                value={form.footerMiddleText}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Footer Right Text" full>
              <input
                type="text"
                className="avm-input"
                id="footerRightText"
                placeholder="Footer Right Text"
                value={form.footerRightText}
                onChange={handleChange(setter)}
              />
            </FormField>

            {/* Background upload */}
            <div className="avm-field full">
              <label className="avm-label">Background</label>
              <div
                style={{
                  border: '2px dashed #d0d5dd',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
                onClick={() => bgRef.current?.click()}
              >
                {bgPreview ? (
                  <img
                    src={bgPreview}
                    alt="Background Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 160,
                      objectFit: 'contain',
                      borderRadius: 6,
                      border: '1px solid #e0e0e0',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: '#e8edf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <i
                      className="ri-image-add-line"
                      style={{ fontSize: '1.6rem', color: '#45597a' }}
                    ></i>
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#45597a' }}>
                    {bgPreview ? 'Change Background' : 'Upload Background'}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                    Dimension:- Max-W: 1300px, Max-H: 700px
                  </p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                    Image file format: .jpg, .jpeg
                  </p>
                </div>
                <input
                  ref={bgRef}
                  type="file"
                  accept=".jpg,.jpeg"
                  style={{ display: 'none' }}
                  onChange={handleBgChange(setter, setBgPreview)}
                />
              </div>
              {bgPreview && (
                <button
                  type="button"
                  className="avm-btn light sm"
                  style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                  onClick={() => {
                    setter((prev) => ({ ...prev, background: null }))
                    setBgPreview(null)
                    if (bgRef.current) bgRef.current.value = ''
                  }}
                >
                  <i className="ri-delete-bin-line"></i> Remove
                </button>
              )}
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Certificate Type</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Certificate Type</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={openAdd}
        >
          <span className="d-flex text-md">
            <i className="ri-add-large-line"></i>
          </span>
          Add Certificate Type
        </button>
      </div>

      {/* Table Card */}
      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {/* Toolbar */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              {/* Export */}
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              {/* Filter */}
              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                  Filter
                </span>
                <span>
                  <i className="ri-arrow-right-line"></i>
                </span>
              </button>

              {/* Columns */}
              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
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

              {/* Rows per page */}
              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search certificate types..."
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
                  {visibleColumns.certificateName ? <th scope="col">Certificate Name</th> : null}
                  {visibleColumns.schoolName ? <th scope="col">School Name</th> : null}
                  {visibleColumns.certificateText ? <th scope="col">Certificate Text</th> : null}
                  {visibleColumns.background ? <th scope="col">Background</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount}
                      className="text-center py-40 text-secondary-light"
                    >
                      No certificate types found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row) => (
                    <tr key={row.sl}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(row.sl)}
                            onChange={() => handleSelectRow(row.sl)}
                          />
                          <label className="form-check-label">{row.sl}</label>
                        </div>
                      </td>
                      {visibleColumns.certificateName ? (
                        <td className="fw-medium text-primary-light">{row.certificateName}</td>
                      ) : null}
                      {visibleColumns.schoolName ? <td>{row.schoolName}</td> : null}
                      {visibleColumns.certificateText ? (
                        <td>
                          <span
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              maxWidth: 260,
                              fontSize: '0.85rem',
                              color: '#5a6472',
                            }}
                          >
                            {row.certificateText}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.background ? (
                        <td>
                          {row.background ? (
                            <img
                              src={row.background}
                              alt="bg"
                              style={{
                                width: 48,
                                height: 28,
                                objectFit: 'cover',
                                borderRadius: 4,
                                border: '1px solid #e0e0e0',
                              }}
                            />
                          ) : (
                            <span className="text-secondary-light text-sm">—</span>
                          )}
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

          {/* Pagination */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              {getVisiblePages().map((p) => (
                <button
                  key={p}
                  type="button"
                  className={
                    p === currentPage
                      ? 'btn btn-sm btn-primary-600'
                      : 'btn btn-sm btn-light border'
                  }
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <WizardPopup
        modalWidth="600px"
        open={isAddOpen}
        title="Add Certificate Type"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsAddOpen(false)}
        submitLabel="Save"
      >
        {renderForm(
          addForm,
          setAddForm,
          addBgPreview,
          setAddBgPreview,
          addBgRef,
          addTextareaRef,
          addStep,
        )}
      </WizardPopup>

      {/* Edit Modal */}
      <WizardPopup
        modalWidth="600px"
        open={isEditOpen}
        title="Edit Certificate Type"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsEditOpen(false)}
        submitLabel="Update"
      >
        {renderForm(
          editForm,
          setEditForm,
          editBgPreview,
          setEditBgPreview,
          editBgRef,
          editTextareaRef,
          editStep,
        )}
      </WizardPopup>

      {/* Filter Sidebar */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Certificate Types"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="school"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              School
            </label>
            <select
              id="school"
              className="form-control form-select"
              value={pendingFilters.school}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select School</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-danger-200 text-danger-600 w-100"
            >
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

export default CertificateType
