import { useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const lectures = [
  { sl: '01', school: 'Windsor Park High School', title: 'Principal', class: 'Class 1', section: 'A', subject: 'Mathematics', teacher: 'John Smith', classLecture: 'Youtube', academicYear: '2024-2025' },
  { sl: '02', school: 'Windsor Park High School', title: 'Vice Principal', class: 'Class 2', section: 'B', subject: 'Science', teacher: 'Sarah Johnson', classLecture: 'Vimeo', academicYear: '2024-2025' },
  { sl: '03', school: 'Windsor Park High School', title: 'Head Teacher', class: 'Class 3', section: 'A', subject: 'English', teacher: 'David Lee', classLecture: 'Power Point', academicYear: '2023-2024' },
  { sl: '04', school: 'Windsor Park High School', title: 'Senior Teacher', class: 'Class 4', section: 'C', subject: 'History', teacher: 'Emily Clark', classLecture: 'Youtube', academicYear: '2024-2025' },
  { sl: '05', school: 'Windsor Park High School', title: 'Teacher', class: 'Class 5', section: 'B', subject: 'Physics', teacher: 'Michael Brown', classLecture: 'Power Point', academicYear: '2023-2024' },
]

const emptyForm = {
  school: '',
  title: '',
  class: '',
  section: '',
  subject: '',
  lectureType: '',
  note: '',
}

const STEPS = ['Basic']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Title: 'ri-bookmark-line',
  Class: 'ri-building-3-line',
  Section: 'ri-layout-grid-line',
  Subject: 'ri-book-open-line',
  'Lecture Type': 'ri-video-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'title', label: 'Title' },
  { key: 'class', label: 'Class' },
  { key: 'section', label: 'Section' },
  { key: 'subject', label: 'Subject' },
  { key: 'teacher', label: 'Teacher' },
  { key: 'classLecture', label: 'Class Lecture' },
  { key: 'academicYear', label: 'Academic Year' },
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
          <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#667085', fontSize: '0.95rem', lineHeight: 1, pointerEvents: 'none', zIndex: 1 }}>
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

const ClassLecture = () => {
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
  const [filters, setFilters] = useState({ class: 'All', subject: 'All', lectureType: 'All' })
  const [pendingFilters, setPendingFilters] = useState({ class: 'All', subject: 'All', lectureType: 'All' })
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return lectures.filter((r) => {
      const matchesSearch =
        !q ||
        [r.school, r.title, r.class, r.section, r.subject, r.teacher, r.classLecture, r.academicYear]
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesClass = filters.class === 'All' || r.class === filters.class
      const matchesSubject = filters.subject === 'All' || r.subject === filters.subject
      const matchesLectureType = filters.lectureType === 'All' || r.classLecture === filters.lectureType
      return matchesSearch && matchesClass && matchesSubject && matchesLectureType
    })
  }, [filters, search])

  const schoolOptions = useMemo(() => Array.from(new Set(lectures.map((item) => item.school))), [])
  const classOptions = useMemo(() => Array.from(new Set(lectures.map((item) => item.class))), [])
  const subjectOptions = useMemo(() => Array.from(new Set(lectures.map((item) => item.subject))), [])
  const lectureTypeOptions = useMemo(() => Array.from(new Set(lectures.map((item) => item.classLecture))), [])

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

  const openAdd = () => { setAddForm(emptyForm); setAddStep(0); setIsAddOpen(true) }
  const openEdit = (row) => {
    setEditForm({
      school: row.school,
      title: row.title,
      class: row.class,
      section: row.section,
      subject: row.subject,
      lectureType: row.classLecture,
      note: '',
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

  const lectureTypeBadge = (type) => {
    const map = {
      Youtube: 'bg-danger-100 text-danger-600',
      Vimeo: 'bg-info-100 text-info-600',
      'Power Point': 'bg-warning-100 text-warning-600',
    }
    return map[type] || 'bg-neutral-100 text-secondary-light'
  }

  const renderForm = (form, setter) => (
    <>
      <p className="avm-section-title">Basic Information</p>
      <div className="avm-grid">
        <FormField label="School Name" required full>
          <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
            <option value="">--Select School--</option>
            <option>Windsor Park High School</option>
          </select>
        </FormField>

        <FormField label="Title" required full>
          <select className="avm-select" id="title" value={form.title} onChange={handleChange(setter)}>
            <option value="">--Select--</option>
            <option>Principal</option>
            <option>Vice Principal</option>
            <option>Head Teacher</option>
            <option>Senior Teacher</option>
            <option>Teacher</option>
            <option>Assistant Teacher</option>
          </select>
        </FormField>

        <FormField label="Class" required>
          <select className="avm-select" id="class" value={form.class} onChange={handleChange(setter)}>
            <option value="">--Select--</option>
            <option>Class 1</option>
            <option>Class 2</option>
            <option>Class 3</option>
            <option>Class 4</option>
            <option>Class 5</option>
          </select>
        </FormField>

        <FormField label="Section" required>
          <select className="avm-select" id="section" value={form.section} onChange={handleChange(setter)}>
            <option value="">--Select--</option>
            <option>A</option>
            <option>B</option>
            <option>C</option>
            <option>D</option>
          </select>
        </FormField>

        <FormField label="Subject" required>
          <select className="avm-select" id="subject" value={form.subject} onChange={handleChange(setter)}>
            <option value="">--Select--</option>
            <option>Mathematics</option>
            <option>Science</option>
            <option>English</option>
            <option>History</option>
            <option>Physics</option>
          </select>
        </FormField>

        <FormField label="Lecture Type" required>
          <select className="avm-select" id="lectureType" value={form.lectureType} onChange={handleChange(setter)}>
            <option value="">--Select--</option>
            <option>Youtube</option>
            <option>Vimeo</option>
            <option>Power Point</option>
          </select>
        </FormField>

        <FormField label="Note" full noIcon>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.85rem', top: '1.15rem', color: '#667085', fontSize: '0.95rem', lineHeight: 1, pointerEvents: 'none', zIndex: 1 }}>
              <i className="ri-sticky-note-line"></i>
            </span>
            <textarea
              rows="4"
              className="avm-input avm-textarea"
              id="note"
              placeholder="Enter note"
              value={form.note}
              onChange={handleChange(setter)}
              style={{ paddingLeft: '2.35rem' }}
            />
          </div>
        </FormField>
      </div>
    </>
  )

  return (
    <div className="dashboard-main-body">
      {/* Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Class Lecture</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Class Lecture</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
          <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <span className="d-flex text-md"><i className="ri-add-large-line"></i></span>
            Add Class Lecture
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

              {/* Filter */}
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <div className="dropdown-menu p-12 border bg-base shadow" style={{ minWidth: 280 }}>
                  <div className="mb-10">
                    <label htmlFor="filterClass" className="text-sm fw-semibold text-primary-light d-inline-block mb-6">Class</label>
                    <select
                      id="filterClass"
                      className="form-control form-select"
                      value={pendingFilters.class}
                      onChange={(e) => setPendingFilters((prev) => ({ ...prev, class: e.target.value }))}
                    >
                      <option value="All">All</option>
                      {classOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="mb-10">
                    <label htmlFor="filterSubject" className="text-sm fw-semibold text-primary-light d-inline-block mb-6">Subject</label>
                    <select
                      id="filterSubject"
                      className="form-control form-select"
                      value={pendingFilters.subject}
                      onChange={(e) => setPendingFilters((prev) => ({ ...prev, subject: e.target.value }))}
                    >
                      <option value="All">All</option>
                      {subjectOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="mb-12">
                    <label htmlFor="filterLectureType" className="text-sm fw-semibold text-primary-light d-inline-block mb-6">Lecture Type</label>
                    <select
                      id="filterLectureType"
                      className="form-control form-select"
                      value={pendingFilters.lectureType}
                      onChange={(e) => setPendingFilters((prev) => ({ ...prev, lectureType: e.target.value }))}
                    >
                      <option value="All">All</option>
                      {lectureTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="d-flex gap-8">
                    <button
                      type="button"
                      className="btn btn-sm btn-light border w-100"
                      onClick={() => {
                        const reset = { class: 'All', subject: 'All', lectureType: 'All' }
                        setPendingFilters(reset)
                        setFilters(reset)
                        setCurrentPage(1)
                      }}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary-600 w-100"
                      onClick={() => {
                        setFilters(pendingFilters)
                        setCurrentPage(1)
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
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
                placeholder="Search lecture..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 900 }}>
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
                  {visibleColumns.school && <th scope="col">School</th>}
                  {visibleColumns.title && <th scope="col">Title</th>}
                  {visibleColumns.class && <th scope="col">Class</th>}
                  {visibleColumns.section && <th scope="col">Section</th>}
                  {visibleColumns.subject && <th scope="col">Subject</th>}
                  {visibleColumns.teacher && <th scope="col">Teacher</th>}
                  {visibleColumns.classLecture && <th scope="col">Class Lecture</th>}
                  {visibleColumns.academicYear && <th scope="col">Academic Year</th>}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      No class lectures found.
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
                      {visibleColumns.school && <td>{row.school}</td>}
                      {visibleColumns.title && <td>{row.title}</td>}
                      {visibleColumns.class && <td>{row.class}</td>}
                      {visibleColumns.section && <td className="text-center">{row.section}</td>}
                      {visibleColumns.subject && <td>{row.subject}</td>}
                      {visibleColumns.teacher && <td className="fw-medium text-primary-light">{row.teacher}</td>}
                      {visibleColumns.classLecture && (
                        <td>
                          <span className={`px-12 py-4 radius-4 fw-medium text-sm ${lectureTypeBadge(row.classLecture)}`}>
                            {row.classLecture}
                          </span>
                        </td>
                      )}
                      {visibleColumns.academicYear && <td>{row.academicYear}</td>}
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
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
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
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
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
        title="Add Class Lecture"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsAddOpen(false)}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm)}
      </WizardPopup>

      {/* Edit Modal */}
      <WizardPopup
        modalWidth="540px"
        open={isEditOpen}
        title="Edit Class Lecture"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsEditOpen(false)}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm)}
      </WizardPopup>
    </div>
  )
}

export default ClassLecture

