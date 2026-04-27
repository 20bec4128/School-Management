import { useMemo, useState, useRef } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const questionBank = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    className: 'Class 10',
    subject: 'Mathematics',
    questionType: 'Single Answer',
    questionLevel: 'Easy',
    question: 'What is the value of π (pi) to two decimal places?',
    status: 'Active',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    className: 'Class 11',
    subject: 'Physics',
    questionType: 'Multi Answer',
    questionLevel: 'Hard',
    question: 'Which of the following are Newton\'s Laws of Motion?',
    status: 'Active',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    className: 'Class 9',
    subject: 'English',
    questionType: 'Fill in Blank',
    questionLevel: 'Medium',
    question: 'The sun _____ in the east.',
    status: 'Inactive',
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    className: 'Class 10',
    subject: 'Biology',
    questionType: 'TRUE/FALSE',
    questionLevel: 'Easy',
    question: 'Photosynthesis occurs in the mitochondria of plant cells.',
    status: 'Active',
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    className: 'Class 12',
    subject: 'Computer Science',
    questionType: 'Single Answer',
    questionLevel: 'Hard',
    question: 'What is the time complexity of binary search algorithm?',
    status: 'Active',
  },
]

const classOptions = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']
const sectionOptions = ['A', 'B', 'C', 'D']
const subjectOptions = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'English', 'Computer Science', 'History', 'Geography',
]
const questionLevelOptions = ['Easy', 'Medium', 'Hard']
const questionTypeOptions = ['Single Answer', 'Multi Answer', 'Fill in Blank', 'TRUE/FALSE']

const ACCEPTED_DOC_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.txt'
const ACCEPTED_DOC_LABEL = '.pdf, .doc/docx, .ppt/pptx or .txt'

const emptyForm = {
  school: '',
  className: '',
  section: '',
  subject: '',
  questionLevel: '',
  question: '',
  image: null,
  document: null,
  mark: '',
  questionType: '',
}

const emptyFilters = {
  school: 'Select',
  className: 'Select',
  subject: 'Select',
  questionType: 'Select',
  questionLevel: 'Select',
  status: 'Select',
}

const STEPS = ['Basic Info', 'Question Details']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Class: 'ri-building-line',
  Section: 'ri-layout-grid-line',
  Subject: 'ri-book-open-line',
  'Question Level': 'ri-bar-chart-line',
  Question: 'ri-question-line',
  Mark: 'ri-medal-line',
  'Question Type': 'ri-list-check',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'className', label: 'Class' },
  { key: 'subject', label: 'Subject' },
  { key: 'questionType', label: 'Question Type' },
  { key: 'questionLevel', label: 'Question Level' },
  { key: 'question', label: 'Question' },
  { key: 'status', label: 'Status' },
]

const levelBadge = (level) => {
  if (level === 'Easy') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (level === 'Medium') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (level === 'Hard') return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
}

const typeBadge = (type) => {
  if (type === 'Single Answer') return 'bg-primary-100 text-primary-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (type === 'Multi Answer') return 'bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (type === 'Fill in Blank') return 'bg-violet-100 text-violet-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (type === 'TRUE/FALSE') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
}

const statusBadge = (status) => {
  if (status === 'Active') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (status === 'Inactive') return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
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

const QuestionBank = () => {
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
  const [addImagePreview, setAddImagePreview] = useState(null)
  const [editImagePreview, setEditImagePreview] = useState(null)
  const [addDocFile, setAddDocFile] = useState(null)
  const [editDocFile, setEditDocFile] = useState(null)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const addImageRef = useRef(null)
  const editImageRef = useRef(null)
  const addDocRef = useRef(null)
  const editDocRef = useRef(null)

  const schoolOptions = useMemo(
    () => Array.from(new Set(questionBank.map((r) => r.school))),
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return questionBank.filter((r) => {
      const matchesSearch =
        !q ||
        [r.school, r.className, r.subject, r.questionType, r.questionLevel, r.question, r.status]
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesSchool = filters.school === 'Select' || r.school === filters.school
      const matchesClass = filters.className === 'Select' || r.className === filters.className
      const matchesSubject = filters.subject === 'Select' || r.subject === filters.subject
      const matchesType = filters.questionType === 'Select' || r.questionType === filters.questionType
      const matchesLevel = filters.questionLevel === 'Select' || r.questionLevel === filters.questionLevel
      const matchesStatus = filters.status === 'Select' || r.status === filters.status
      return matchesSearch && matchesSchool && matchesClass && matchesSubject && matchesType && matchesLevel && matchesStatus
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

  const handleImageChange = (setter, setPreview) => (e) => {
    const file = e.target.files[0]
    if (!file) return
    setter((prev) => ({ ...prev, image: file }))
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleDocChange = (setter, setFile) => (e) => {
    const file = e.target.files[0]
    if (!file) return
    setter((prev) => ({ ...prev, document: file }))
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
    setAddImagePreview(null)
    setAddDocFile(null)
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditForm({
      school: row.school,
      className: row.className,
      section: '',
      subject: row.subject,
      questionLevel: row.questionLevel,
      question: row.question,
      image: null,
      document: null,
      mark: '',
      questionType: row.questionType,
    })
    setEditImagePreview(null)
    setEditDocFile(null)
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

  const renderForm = (form, setter, step, imagePreview, setImagePreview, imageRef, docFile, setDocFile, docRef) => (
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

            <FormField label="Section">
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

            <FormField label="Question Level" required full>
              <select
                className="avm-select"
                id="questionLevel"
                value={form.questionLevel}
                onChange={handleChange(setter)}
              >
                <option value="">--Select--</option>
                {questionLevelOptions.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </FormField>
          </>
        )}

        {step === 1 && (
          <>
            <FormField label="Question" required full>
              <textarea
                rows={4}
                className="avm-input avm-textarea"
                id="question"
                placeholder="Question"
                value={form.question}
                onChange={handleChange(setter)}
              />
            </FormField>

            {/* Image Upload */}
            <div className="avm-field full">
              <label className="avm-label">Image</label>
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
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onClick={() => imageRef.current?.click()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#45597a'
                  e.currentTarget.style.background = '#f0f4f8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d0d5dd'
                  e.currentTarget.style.background = '#f8fafc'
                }}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Question"
                    style={{ maxWidth: '100%', maxHeight: 140, objectFit: 'contain', borderRadius: 6, border: '1px solid #e0e0e0' }}
                  />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e8edf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ri-image-add-line" style={{ fontSize: '1.5rem', color: '#45597a' }}></i>
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#45597a' }}>
                    {imagePreview ? 'Change Image' : 'Upload Image'}
                  </p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                    .jpg, .jpeg, .png or .gif
                  </p>
                </div>
                <input
                  ref={imageRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif"
                  style={{ display: 'none' }}
                  onChange={handleImageChange(setter, setImagePreview)}
                />
              </div>
              {imagePreview && (
                <button
                  type="button"
                  className="avm-btn light sm"
                  style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                  onClick={() => {
                    setter((prev) => ({ ...prev, image: null }))
                    setImagePreview(null)
                    if (imageRef.current) imageRef.current.value = ''
                  }}
                >
                  <i className="ri-delete-bin-line"></i> Remove
                </button>
              )}
            </div>

            {/* Document Upload */}
            <div className="avm-field full">
              <label className="avm-label">Document</label>
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
                onClick={() => docRef.current?.click()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#45597a'
                  e.currentTarget.style.background = '#f0f4f8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d0d5dd'
                  e.currentTarget.style.background = '#f8fafc'
                }}
              >
                {docFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#e8edf4', borderRadius: '0.6rem', padding: '0.65rem 1rem', width: '100%' }}>
                    <i className={getFileIcon(docFile.name)} style={{ fontSize: '1.5rem', color: '#45597a', flexShrink: 0 }}></i>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#34393f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {docFile.name}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#7a8a9a' }}>
                        {(docFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e8edf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="ri-upload-cloud-2-line" style={{ fontSize: '1.5rem', color: '#45597a' }}></i>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#45597a' }}>
                        Click to upload document
                      </p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                        Document file format: {ACCEPTED_DOC_LABEL}
                      </p>
                    </div>
                  </>
                )}
                <input
                  ref={docRef}
                  type="file"
                  accept={ACCEPTED_DOC_TYPES}
                  style={{ display: 'none' }}
                  onChange={handleDocChange(setter, setDocFile)}
                />
              </div>
              {docFile && (
                <button
                  type="button"
                  className="avm-btn light sm"
                  style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                  onClick={() => {
                    setter((prev) => ({ ...prev, document: null }))
                    setDocFile(null)
                    if (docRef.current) docRef.current.value = ''
                  }}
                >
                  <i className="ri-delete-bin-line"></i> Remove
                </button>
              )}
            </div>

            <FormField label="Mark" required>
              <input
                type="number"
                className="avm-input"
                id="mark"
                placeholder="Mark"
                value={form.mark}
                onChange={handleChange(setter)}
                min="0"
              />
            </FormField>

            <FormField label="Question Type" required>
              <select
                className="avm-select"
                id="questionType"
                value={form.questionType}
                onChange={handleChange(setter)}
              >
                <option value="">--Select--</option>
                {questionTypeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Question Bank</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Question Bank</span>
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
          Add Question
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
                placeholder="Search questions..."
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
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.subject ? <th scope="col">Subject</th> : null}
                  {visibleColumns.questionType ? <th scope="col">Question Type</th> : null}
                  {visibleColumns.questionLevel ? <th scope="col">Question Level</th> : null}
                  {visibleColumns.question ? <th scope="col">Question</th> : null}
                  {visibleColumns.status ? <th scope="col">Status</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      No questions found.
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
                      {visibleColumns.className ? (
                        <td className="fw-medium text-primary-light">{row.className}</td>
                      ) : null}
                      {visibleColumns.subject ? (
                        <td>
                          <span className="bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm">
                            {row.subject}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.questionType ? (
                        <td>
                          <span className={typeBadge(row.questionType)}>{row.questionType}</span>
                        </td>
                      ) : null}
                      {visibleColumns.questionLevel ? (
                        <td>
                          <span className={levelBadge(row.questionLevel)}>{row.questionLevel}</span>
                        </td>
                      ) : null}
                      {visibleColumns.question ? (
                        <td>
                          <span
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              maxWidth: 280,
                              fontSize: '0.85rem',
                              color: '#5a6472',
                            }}
                          >
                            {row.question}
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
        title="Add Question"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsAddOpen(false)}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm, addStep, addImagePreview, setAddImagePreview, addImageRef, addDocFile, setAddDocFile, addDocRef)}
      </WizardPopup>

      {/* Edit Modal */}
      <WizardPopup
        modalWidth="580px"
        open={isEditOpen}
        title="Edit Question"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsEditOpen(false)}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm, editStep, editImagePreview, setEditImagePreview, editImageRef, editDocFile, setEditDocFile, editDocRef)}
      </WizardPopup>

      {/* Filter Sidebar */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Questions"
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
            <label htmlFor="subject" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Subject</label>
            <select id="subject" className="form-control form-select" value={pendingFilters.subject} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="questionType" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Question Type</label>
            <select id="questionType" className="form-control form-select" value={pendingFilters.questionType} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              {questionTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="questionLevel" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Question Level</label>
            <select id="questionLevel" className="form-control form-select" value={pendingFilters.questionLevel} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              {questionLevelOptions.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Status</label>
            <select id="status" className="form-control form-select" value={pendingFilters.status} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
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

export default QuestionBank