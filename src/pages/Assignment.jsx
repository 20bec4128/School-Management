import { useMemo, useState, useRef } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const assignments = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    title: 'Algebra Problem Set',
    className: 'Class 10',
    section: 'A',
    subject: 'Mathematics',
    assignmentDate: '2024-04-01',
    submissionDate: '2024-04-10',
    status: 'Pending',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    title: 'Newton\'s Laws Essay',
    className: 'Class 11',
    section: 'B',
    subject: 'Physics',
    assignmentDate: '2024-04-02',
    submissionDate: '2024-04-12',
    status: 'Submitted',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    title: 'Grammar Worksheet',
    className: 'Class 9',
    section: 'A',
    subject: 'English',
    assignmentDate: '2024-03-25',
    submissionDate: '2024-04-01',
    status: 'Graded',
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    title: 'Cell Structure Diagram',
    className: 'Class 11',
    section: 'A',
    subject: 'Biology',
    assignmentDate: '2024-04-05',
    submissionDate: '2024-04-15',
    status: 'Pending',
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    title: 'Python Script Exercise',
    className: 'Class 12',
    section: 'A',
    subject: 'Computer Science',
    assignmentDate: '2024-04-08',
    submissionDate: '2024-04-20',
    status: 'Overdue',
  },
]

const classOptions = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']
const sectionOptions = ['A', 'B', 'C', 'D']
const subjectOptions = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'English', 'Computer Science', 'History', 'Geography',
]
const statusOptions = ['Pending', 'Submitted', 'Graded', 'Overdue']

const ACCEPTED_DOC_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.txt'
const ACCEPTED_DOC_LABEL = '.pdf, .doc/docx, .ppt/pptx or .txt'

const emptyForm = {
  school: '',
  title: '',
  className: '',
  section: '',
  subject: '',
  assignmentDate: '',
  submissionDate: '',
  assignment: null,
  smsNotification: false,
  emailNotification: false,
  note: '',
}

const emptyFilters = {
  school: 'Select',
  className: 'Select',
  section: 'Select',
  subject: 'Select',
  status: 'Select',
}

const STEPS = ['Basic Info', 'Dates & Settings']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Title: 'ri-file-list-2-line',
  Class: 'ri-building-line',
  Section: 'ri-layout-grid-line',
  Subject: 'ri-book-open-line',
  'Assignment Date': 'ri-calendar-2-line',
  'Submission Date': 'ri-calendar-check-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'title', label: 'Title' },
  { key: 'className', label: 'Class' },
  { key: 'subject', label: 'Subject' },
  { key: 'assignmentDate', label: 'Assignment Date' },
  { key: 'submissionDate', label: 'Submission Date' },
  { key: 'status', label: 'Status' },
]

const statusBadge = (status) => {
  if (status === 'Submitted') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (status === 'Graded') return 'bg-primary-100 text-primary-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (status === 'Pending') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (status === 'Overdue') return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
}

const getFileIcon = (fileName) => {
  if (!fileName) return 'ri-file-line'
  const ext = fileName.split('.').pop().toLowerCase()
  if (ext === 'pdf') return 'ri-file-pdf-line'
  if (['doc', 'docx'].includes(ext)) return 'ri-file-word-line'
  if (['ppt', 'pptx'].includes(ext)) return 'ri-slideshow-line'
  if (ext === 'txt') return 'ri-file-text-line'
  return 'ri-file-line'
}

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

const NotificationToggle = ({ id, label, icon, checked, onChange }) => (
  <label
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.65rem',
      cursor: 'pointer',
      padding: '0.7rem 1rem',
      background: checked ? '#e8edf4' : '#f8fafc',
      border: `1px solid ${checked ? '#45597a' : '#d0d5dd'}`,
      borderRadius: '0.75rem',
      transition: 'all 0.18s',
      userSelect: 'none',
      flex: 1,
    }}
  >
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onChange}
      style={{ width: 16, height: 16, accentColor: '#45597a', flexShrink: 0 }}
    />
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <i className={icon} style={{ color: checked ? '#45597a' : '#7a8a9a', fontSize: '1rem' }}></i>
      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: checked ? '#45597a' : '#34393f' }}>
        {label}
      </span>
    </span>
    {checked && (
      <span
        style={{
          marginLeft: 'auto',
          fontSize: '0.72rem',
          fontWeight: 600,
          color: '#45597a',
          background: '#c8d4e8',
          borderRadius: '2rem',
          padding: '0.15rem 0.55rem',
          whiteSpace: 'nowrap',
        }}
      >
        On
      </span>
    )}
  </label>
)

const Assignment = () => {
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
  const [addAssignmentFile, setAddAssignmentFile] = useState(null)
  const [editAssignmentFile, setEditAssignmentFile] = useState(null)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const addFileRef = useRef(null)
  const editFileRef = useRef(null)

  const schoolOptions = useMemo(
    () => Array.from(new Set(assignments.map((r) => r.school))),
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return assignments.filter((r) => {
      const matchesSearch =
        !q ||
        [r.school, r.title, r.className, r.section, r.subject, r.assignmentDate, r.submissionDate, r.status]
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesSchool = filters.school === 'Select' || r.school === filters.school
      const matchesClass = filters.className === 'Select' || r.className === filters.className
      const matchesSection = filters.section === 'Select' || r.section === filters.section
      const matchesSubject = filters.subject === 'Select' || r.subject === filters.subject
      const matchesStatus = filters.status === 'Select' || r.status === filters.status
      return matchesSearch && matchesSchool && matchesClass && matchesSection && matchesSubject && matchesStatus
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
    const { id, value, type, checked } = e.target
    setter((prev) => ({ ...prev, [id]: type === 'checkbox' ? checked : value }))
  }

  const handleFileChange = (setter, setFile) => (e) => {
    const file = e.target.files[0]
    if (!file) return
    setter((prev) => ({ ...prev, assignment: file }))
    setFile(file)
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
    setAddAssignmentFile(null)
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditForm({
      school: row.school,
      title: row.title,
      className: row.className,
      section: row.section,
      subject: row.subject,
      assignmentDate: row.assignmentDate,
      submissionDate: row.submissionDate,
      assignment: null,
      smsNotification: false,
      emailNotification: false,
      note: '',
    })
    setEditAssignmentFile(null)
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

  const renderForm = (form, setter, step, assignmentFile, setAssignmentFile, fileRef) => (
    <>
      <p className="avm-section-title">{STEPS[step]}</p>
      <div className="avm-grid">

        {step === 0 && (
          <>
            {/* Instruction banner */}
            <div
              className="full"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                background: '#fff8e6',
                border: '1px solid #fde68a',
                borderRadius: '0.65rem',
                padding: '0.75rem 1rem',
              }}
            >
              <i
                className="ri-information-line"
                style={{ color: '#d97706', fontSize: '1rem', flexShrink: 0, marginTop: 2 }}
              ></i>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#92400e', lineHeight: 1.5 }}>
                <strong>Instruction:</strong> Please add Class &amp; Subject before adding an Assignment.
              </p>
            </div>

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

            <FormField label="Title" required full>
              <input
                type="text"
                className="avm-input"
                id="title"
                placeholder="Title"
                value={form.title}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Class" required>
              <select
                className="avm-select"
                id="className"
                value={form.className}
                onChange={handleChange(setter)}
              >
                <option value="">--Select--</option>
                {classOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Section" required>
              <select
                className="avm-select"
                id="section"
                value={form.section}
                onChange={handleChange(setter)}
              >
                <option value="">--Select--</option>
                {sectionOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Subject" required full>
              <select
                className="avm-select"
                id="subject"
                value={form.subject}
                onChange={handleChange(setter)}
              >
                <option value="">--Select--</option>
                {subjectOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FormField>
          </>
        )}

        {step === 1 && (
          <>
            <FormField label="Assignment Date" required>
              <input
                type="date"
                className="avm-input"
                id="assignmentDate"
                value={form.assignmentDate}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Submission Date" required>
              <input
                type="date"
                className="avm-input"
                id="submissionDate"
                value={form.submissionDate}
                onChange={handleChange(setter)}
              />
            </FormField>

            {/* Document Upload */}
            <div className="avm-field full">
              <label className="avm-label">Assignment</label>
              <div
                style={{
                  border: '2px dashed #d0d5dd',
                  borderRadius: '0.75rem',
                  padding: '1.5rem 1.25rem',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onClick={() => fileRef.current?.click()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#45597a'
                  e.currentTarget.style.background = '#f0f4f8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d0d5dd'
                  e.currentTarget.style.background = '#f8fafc'
                }}
              >
                {assignmentFile ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      background: '#e8edf4',
                      borderRadius: '0.6rem',
                      padding: '0.65rem 1rem',
                      width: '100%',
                    }}
                  >
                    <i
                      className={getFileIcon(assignmentFile.name)}
                      style={{ fontSize: '1.5rem', color: '#45597a', flexShrink: 0 }}
                    ></i>
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#34393f',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {assignmentFile.name}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#7a8a9a' }}>
                        {(assignmentFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: '#e8edf4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <i
                        className="ri-upload-cloud-2-line"
                        style={{ fontSize: '1.6rem', color: '#45597a' }}
                      ></i>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#45597a' }}>
                        Click to upload document
                      </p>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                        Document file format: {ACCEPTED_DOC_LABEL}
                      </p>
                    </div>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED_DOC_TYPES}
                  style={{ display: 'none' }}
                  onChange={handleFileChange(setter, setAssignmentFile)}
                />
              </div>
              {assignmentFile && (
                <button
                  type="button"
                  className="avm-btn light sm"
                  style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                  onClick={() => {
                    setter((prev) => ({ ...prev, assignment: null }))
                    setAssignmentFile(null)
                    if (fileRef.current) fileRef.current.value = ''
                  }}
                >
                  <i className="ri-delete-bin-line"></i> Remove
                </button>
              )}
            </div>

            {/* Notification Toggles */}
            <div className="avm-field full">
              <label className="avm-label">Notifications</label>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <NotificationToggle
                  id="smsNotification"
                  label="SMS Notification"
                  icon="ri-message-2-line"
                  checked={form.smsNotification}
                  onChange={handleChange(setter)}
                />
                <NotificationToggle
                  id="emailNotification"
                  label="Email Notification"
                  icon="ri-mail-send-line"
                  checked={form.emailNotification}
                  onChange={handleChange(setter)}
                />
              </div>
            </div>

            <FormField label="Note" full>
              <textarea
                rows={4}
                className="avm-input avm-textarea"
                id="note"
                placeholder="Note"
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Assignment</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Assignment</span>
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
          Add Assignment
        </button>
      </div>

      {/* Table Card */}
      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {/* Toolbar */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              {/* Export */}
              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1"></i> Export
                  </span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
                      <i className="ri-file-3-line"></i> PDF
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
                      <i className="ri-file-excel-2-line"></i> Excel
                    </button>
                  </li>
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
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
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
                placeholder="Search assignments..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 950 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.title ? <th scope="col">Title</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.subject ? <th scope="col">Subject</th> : null}
                  {visibleColumns.assignmentDate ? <th scope="col">Assignment Date</th> : null}
                  {visibleColumns.submissionDate ? <th scope="col">Submission Date</th> : null}
                  {visibleColumns.status ? <th scope="col">Status</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center py-40 text-secondary-light">
                      No assignments found.
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
                      {visibleColumns.school ? <td>{row.school}</td> : null}
                      {visibleColumns.title ? (
                        <td>
                          <span className="fw-medium text-primary-light d-flex align-items-center gap-6">
                            <i className="ri-file-list-2-line text-secondary-light"></i>
                            {row.title}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.className ? <td>{row.className}</td> : null}
                      {visibleColumns.subject ? (
                        <td>
                          <span className="bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm">
                            {row.subject}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.assignmentDate ? (
                        <td>
                          <span className="d-flex align-items-center gap-4">
                            <i className="ri-calendar-2-line text-secondary-light text-sm"></i>
                            {row.assignmentDate}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.submissionDate ? (
                        <td>
                          <span className="d-flex align-items-center gap-4">
                            <i className="ri-calendar-check-line text-secondary-light text-sm"></i>
                            {row.submissionDate}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.status ? (
                        <td>
                          <span className={statusBadge(row.status)}>{row.status}</span>
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
                  className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'}
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
        modalWidth="580px"
        open={isAddOpen}
        title="Add Assignment"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsAddOpen(false)}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm, addStep, addAssignmentFile, setAddAssignmentFile, addFileRef)}
      </WizardPopup>

      {/* Edit Modal */}
      <WizardPopup
        modalWidth="580px"
        open={isEditOpen}
        title="Edit Assignment"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsEditOpen(false)}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm, editStep, editAssignmentFile, setEditAssignmentFile, editFileRef)}
      </WizardPopup>

      {/* Filter Sidebar */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Assignments"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="school" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
            <select id="school" className="form-control form-select" value={pendingFilters.school} onChange={handlePendingFilterChange}>
              <option value="Select">Select School</option>
              {schoolOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="className" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Class</label>
            <select id="className" className="form-control form-select" value={pendingFilters.className} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="section" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Section</label>
            <select id="section" className="form-control form-select" value={pendingFilters.section} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="subject" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Subject</label>
            <select id="subject" className="form-control form-select" value={pendingFilters.subject} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="status" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Status</label>
            <select id="status" className="form-control form-select" value={pendingFilters.status} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
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

export default Assignment
