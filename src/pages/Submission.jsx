import { useMemo, useState, useRef } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const submissions = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    assignment: 'Math Homework Chapter 5',
    className: 'Class 10',
    section: 'A',
    subject: 'Mathematics',
    submittedBy: 'Alice Brown',
    submittedAt: '2026-04-18 10:30 AM',
    evaluate: 'Pending',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    assignment: 'Science Project Report',
    className: 'Class 10',
    section: 'B',
    subject: 'Science',
    submittedBy: 'Bob Wilson',
    submittedAt: '2026-04-18 11:15 AM',
    evaluate: 'Reviewed',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    assignment: 'English Essay Writing',
    className: 'Class 9',
    section: 'A',
    subject: 'English',
    submittedBy: 'Charlie Davis',
    submittedAt: '2026-04-19 09:20 AM',
    evaluate: 'Pending',
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    assignment: 'History Timeline Activity',
    className: 'Class 8',
    section: 'C',
    subject: 'History',
    submittedBy: 'Diana Prince',
    submittedAt: '2026-04-19 01:40 PM',
    evaluate: 'Reviewed',
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    assignment: 'Physics Numerical Sheet',
    className: 'Class 11',
    section: 'A',
    subject: 'Physics',
    submittedBy: 'Ethan Hunt',
    submittedAt: '2026-04-20 08:50 AM',
    evaluate: 'Pending',
  },
]

const emptyForm = {
  school: '',
  className: '',
  section: '',
  student: '',
  assignment: '',
  submission: null,
  note: '',
}

const emptyFilters = {
  school: 'Select',
  className: 'Select',
  section: 'Select',
  evaluate: 'Select',
}

const STEPS = ['Basic']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Class: 'ri-building-line',
  Section: 'ri-layout-grid-line',
  Student: 'ri-user-3-line',
  Assignment: 'ri-book-open-line',
  Submission: 'ri-upload-2-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'assignment', label: 'Assignment' },
  { key: 'className', label: 'Class' },
  { key: 'section', label: 'Section' },
  { key: 'subject', label: 'Subject' },
  { key: 'submittedBy', label: 'Submitted By' },
  { key: 'submittedAt', label: 'Submitted At' },
  { key: 'evaluate', label: 'Evaluate' },
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

const evaluateBadge = (value) => {
  if (value === 'Reviewed') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (value === 'Pending') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
}

const Submission = () => {
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
  const [addSubmissionFile, setAddSubmissionFile] = useState(null)
  const [editSubmissionFile, setEditSubmissionFile] = useState(null)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const addSubmissionRef = useRef(null)
  const editSubmissionRef = useRef(null)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(() => Array.from(new Set(submissions.map((r) => r.school))), [])
  const classOptions = useMemo(() => Array.from(new Set(submissions.map((r) => r.className))), [])
  const sectionOptions = useMemo(() => Array.from(new Set(submissions.map((r) => r.section))), [])

  const studentOptionsByClassSection = useMemo(
    () => ({
      'Class 8-C': ['Diana Prince', 'Sophia Lee'],
      'Class 9-A': ['Charlie Davis', 'Noah Martin'],
      'Class 10-A': ['Alice Brown', 'Emma Stone'],
      'Class 10-B': ['Bob Wilson', 'Liam Scott'],
      'Class 11-A': ['Ethan Hunt', 'Mason Reed'],
    }),
    [],
  )

  const assignmentOptionsByClassSection = useMemo(
    () => ({
      'Class 8-C': ['History Timeline Activity', 'Geography Map Work'],
      'Class 9-A': ['English Essay Writing', 'Grammar Worksheet'],
      'Class 10-A': ['Math Homework Chapter 5', 'Physics Lab Record'],
      'Class 10-B': ['Science Project Report', 'Chemistry Practical Note'],
      'Class 11-A': ['Physics Numerical Sheet', 'Biology Observation File'],
    }),
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return submissions.filter((r) => {
      const matchesSearch =
        !q ||
        [r.school, r.assignment, r.className, r.section, r.subject, r.submittedBy, r.submittedAt, r.evaluate]
          .join(' ')
          .toLowerCase()
          .includes(q)

      const matchesSchool = filters.school === 'Select' || r.school === filters.school
      const matchesClass = filters.className === 'Select' || r.className === filters.className
      const matchesSection = filters.section === 'Select' || r.section === filters.section
      const matchesEvaluate = filters.evaluate === 'Select' || r.evaluate === filters.evaluate

      return matchesSearch && matchesSchool && matchesClass && matchesSection && matchesEvaluate
    })
  }, [search, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((r) => selectedRows.includes(r.sl))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((r) => r.sl)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !paginated.some((r) => r.sl === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target

    setter((prev) => {
      const updated = { ...prev, [id]: value }

      if (id === 'school') {
        updated.className = ''
        updated.section = ''
        updated.student = ''
        updated.assignment = ''
      }

      if (id === 'className') {
        updated.section = ''
        updated.student = ''
        updated.assignment = ''
      }

      if (id === 'section') {
        updated.student = ''
        updated.assignment = ''
      }

      return updated
    })
  }

  const handleFileChange = (setter, setFile) => (e) => {
    const file = e.target.files?.[0] || null
    setter((prev) => ({ ...prev, submission: file }))
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
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
  }

  const openAdd = () => {
    setAddForm(emptyForm)
    setAddSubmissionFile(null)
    if (addSubmissionRef.current) addSubmissionRef.current.value = ''
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditForm({
      school: row.school,
      className: row.className,
      section: row.section,
      student: row.submittedBy,
      assignment: row.assignment,
      submission: null,
      note: '',
    })
    setEditSubmissionFile(null)
    if (editSubmissionRef.current) editSubmissionRef.current.value = ''
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

  const renderForm = (form, setter, step = 0) => {
    const studentKey = form.className && form.section ? `${form.className}-${form.section}` : ''
    const availableStudents = studentKey ? studentOptionsByClassSection[studentKey] || [] : []
    const availableAssignments = studentKey ? assignmentOptionsByClassSection[studentKey] || [] : []

    const isAddMode = setter === setAddForm
    const selectedFile = isAddMode ? addSubmissionFile : editSubmissionFile
    const fileInputRef = isAddMode ? addSubmissionRef : editSubmissionRef
    const setFile = isAddMode ? setAddSubmissionFile : setEditSubmissionFile

    return (
      <>
        <p className="avm-section-title">{STEPS[step]}</p>
        <div className="avm-grid">
          <FormField label="School Name" required full>
            <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
              <option value="">--Select School--</option>
              <option>Windsor Park High School</option>
            </select>
          </FormField>

          <FormField label="Class" required>
            <select
              className="avm-select"
              id="className"
              value={form.className}
              onChange={handleChange(setter)}
              disabled={!form.school}
            >
              <option value="">--Select--</option>
              {classOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Section" required>
            <select
              className="avm-select"
              id="section"
              value={form.section}
              onChange={handleChange(setter)}
              disabled={!form.className}
            >
              <option value="">--Select--</option>
              {(form.className
                ? sectionOptions.filter((section) =>
                    submissions.some((item) => item.className === form.className && item.section === section),
                  )
                : []
              ).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Student" required>
            <select
              className="avm-select"
              id="student"
              value={form.student}
              onChange={handleChange(setter)}
              disabled={!form.section}
            >
              <option value="">--Select--</option>
              {availableStudents.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Assignment" required>
            <select
              className="avm-select"
              id="assignment"
              value={form.assignment}
              onChange={handleChange(setter)}
              disabled={!form.section}
            >
              <option value="">--Select--</option>
              {availableAssignments.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Submission" required full noIcon>
            <input
              ref={fileInputRef}
              type="file"
              accept=".doc,.docx,.jpg,.jpeg,.pdf,.ppt,.pptx"
              style={{ display: 'none' }}
              onChange={handleFileChange(setter, setFile)}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '1.5px dashed #d0d5dd',
                borderRadius: '16px',
                padding: '22px 18px',
                background: '#fcfcfd',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#45597a'
                e.currentTarget.style.background = '#f8fafc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d0d5dd'
                e.currentTarget.style.background = '#fcfcfd'
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#eef2ff',
                  color: '#45597a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  fontSize: '1.25rem',
                }}
              >
                <i className="ri-upload-cloud-2-line"></i>
              </div>
              <p className="mb-6 fw-semibold text-primary-light">
                {selectedFile ? selectedFile.name : 'Click to upload submission'}
              </p>
              <p className="mb-0 text-sm text-secondary-light">
                Valid file format submission. Ex: doc, docx, jpg, jpeg, pdf, ppt, pptx.
              </p>
            </div>
          </FormField>

          <FormField label="Note" full>
            <textarea
              rows="4"
              className="avm-input avm-textarea"
              id="note"
              placeholder="Note"
              value={form.note}
              onChange={handleChange(setter)}
            />
          </FormField>
        </div>
      </>
    )
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Submission</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Submission</span>
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
          Add Submission
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
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
                  <span>
                    <i className="ri-arrow-down-s-line"></i>
                  </span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li>
                    <button
                      type="button"
                      className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                    >
                      <i className="ri-file-3-line"></i> PDF
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                    >
                      <i className="ri-file-excel-2-line"></i> Excel
                    </button>
                  </li>
                </ul>
              </div>

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

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search submission..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1300 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.assignment ? <th scope="col">Assignment</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.section ? <th scope="col">Section</th> : null}
                  {visibleColumns.subject ? <th scope="col">Subject</th> : null}
                  {visibleColumns.submittedBy ? <th scope="col">Submitted By</th> : null}
                  {visibleColumns.submittedAt ? <th scope="col">Submitted At</th> : null}
                  {visibleColumns.evaluate ? <th scope="col">Evaluate</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center py-40 text-secondary-light">
                      No submission records found.
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
                      {visibleColumns.assignment ? <td>{row.assignment}</td> : null}
                      {visibleColumns.className ? <td>{row.className}</td> : null}
                      {visibleColumns.section ? <td>{row.section}</td> : null}
                      {visibleColumns.subject ? <td>{row.subject}</td> : null}
                      {visibleColumns.submittedBy ? <td>{row.submittedBy}</td> : null}
                      {visibleColumns.submittedAt ? <td>{row.submittedAt}</td> : null}
                      {visibleColumns.evaluate ? (
                        <td>
                          <span className={evaluateBadge(row.evaluate)}>{row.evaluate}</span>
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

      <WizardPopup
        modalWidth="620px"
        open={isAddOpen}
        title="Add Submission"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsAddOpen(false)}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm, addStep)}
      </WizardPopup>

      <WizardPopup
        modalWidth="620px"
        open={isEditOpen}
        title="Edit Submission"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsEditOpen(false)}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm, editStep)}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Submission"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="school" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
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
            <label htmlFor="className" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class
            </label>
            <select
              id="className"
              className="form-control form-select"
              value={pendingFilters.className}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Class</option>
              {classOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="section" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Section
            </label>
            <select
              id="section"
              className="form-control form-select"
              value={pendingFilters.section}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Section</option>
              {sectionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="evaluate" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Evaluate
            </label>
            <select
              id="evaluate"
              className="form-control form-select"
              value={pendingFilters.evaluate}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Evaluate</option>
              <option value="Pending">Pending</option>
              <option value="Reviewed">Reviewed</option>
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
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default Submission
