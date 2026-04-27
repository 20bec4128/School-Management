import { useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const liveClasses = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    className: 'Class 10',
    section: 'A',
    subject: 'Mathematics',
    teacher: 'Mr. John Smith',
    classDate: '2024-04-10',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    status: 'Scheduled',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    className: 'Class 11',
    section: 'B',
    subject: 'Physics',
    teacher: 'Mr. David Kim',
    classDate: '2024-04-11',
    startTime: '11:00 AM',
    endTime: '12:00 PM',
    status: 'Live',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    className: 'Class 9',
    section: 'A',
    subject: 'English',
    teacher: 'Ms. Sarah Connor',
    classDate: '2024-04-08',
    startTime: '01:15 PM',
    endTime: '02:15 PM',
    status: 'Completed',
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    className: 'Class 12',
    section: 'A',
    subject: 'Computer Science',
    teacher: 'Mr. Robert Ashford',
    classDate: '2024-04-12',
    startTime: '02:30 PM',
    endTime: '03:30 PM',
    status: 'Scheduled',
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    className: 'Class 11',
    section: 'A',
    subject: 'Biology',
    teacher: 'Ms. Patricia Nguyen',
    classDate: '2024-04-07',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    status: 'Cancelled',
  },
]

const classOptions = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']
const sectionOptions = ['A', 'B', 'C', 'D']
const subjectOptions = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'English', 'Computer Science', 'History', 'Geography',
]
const teacherOptions = [
  'Mr. John Smith', 'Ms. Sarah Connor', 'Mr. David Kim',
  'Ms. Linda Morrison', 'Mr. Robert Ashford', 'Ms. Patricia Nguyen',
]
const liveClassTypeOptions = ['Zoom', 'Google Meet', 'Microsoft Teams', 'YouTube Live', 'Custom Link']
const statusOptions = ['Scheduled', 'Live', 'Completed', 'Cancelled']

const emptyForm = {
  school: '',
  className: '',
  section: '',
  subject: '',
  teacher: '',
  liveClassType: '',
  classDate: '',
  startTime: '',
  endTime: '',
  note: '',
  sendNotification: false,
}

const emptyFilters = {
  school: 'Select',
  className: 'Select',
  section: 'Select',
  subject: 'Select',
  status: 'Select',
}

const STEPS = ['Basic Info', 'Schedule & Notes']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Class: 'ri-building-line',
  Section: 'ri-layout-grid-line',
  Subject: 'ri-book-open-line',
  Teacher: 'ri-user-3-line',
  'Live Class Type': 'ri-live-line',
  'Class Date': 'ri-calendar-2-line',
  'Start Time': 'ri-time-line',
  'End Time': 'ri-time-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'className', label: 'Class' },
  { key: 'section', label: 'Section' },
  { key: 'subject', label: 'Subject' },
  { key: 'teacher', label: 'Teacher' },
  { key: 'classDate', label: 'Class Date' },
  { key: 'startTime', label: 'Start Time' },
  { key: 'endTime', label: 'End Time' },
  { key: 'status', label: 'Status' },
]

const statusBadge = (status) => {
  if (status === 'Live') return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (status === 'Scheduled') return 'bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (status === 'Completed') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (status === 'Cancelled') return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
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

const LiveClass = () => {
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

  const schoolOptions = useMemo(
    () => Array.from(new Set(liveClasses.map((r) => r.school))),
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return liveClasses.filter((r) => {
      const matchesSearch =
        !q ||
        [r.school, r.className, r.section, r.subject, r.teacher, r.classDate, r.status]
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
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditForm({
      school: row.school,
      className: row.className,
      section: row.section,
      subject: row.subject,
      teacher: row.teacher,
      liveClassType: '',
      classDate: row.classDate,
      startTime: row.startTime,
      endTime: row.endTime,
      note: '',
      sendNotification: false,
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

  const renderForm = (form, setter, step) => (
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

            <FormField label="Subject" required>
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

            <FormField label="Teacher" required>
              <select
                className="avm-select"
                id="teacher"
                value={form.teacher}
                onChange={handleChange(setter)}
              >
                <option value="">--Select--</option>
                {teacherOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Live Class Type" required full>
              <select
                className="avm-select"
                id="liveClassType"
                value={form.liveClassType}
                onChange={handleChange(setter)}
              >
                <option value="">--Select--</option>
                {liveClassTypeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </FormField>
          </>
        )}

        {step === 1 && (
          <>
            <FormField label="Class Date" required full>
              <input
                type="date"
                className="avm-input"
                id="classDate"
                value={form.classDate}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Start Time" required>
              <input
                type="time"
                className="avm-input"
                id="startTime"
                value={form.startTime}
                onChange={handleChange(setter)}
                placeholder="1:15 PM"
              />
            </FormField>

            <FormField label="End Time" required>
              <input
                type="time"
                className="avm-input"
                id="endTime"
                value={form.endTime}
                onChange={handleChange(setter)}
                placeholder="1:15 PM"
              />
            </FormField>

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

            <div className="avm-field full">
              <label className="avm-label">Send Notification</label>
              <label className="d-flex align-items-center gap-10 cursor-pointer">
                <input
                  type="checkbox"
                  id="sendNotification"
                  checked={form.sendNotification}
                  onChange={handleChange(setter)}
                  className="form-check-input mt-0"
                />
                <span className="text-primary-light fw-medium">Send Notification</span>
              </label>
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Live Class</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Live Class</span>
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
          Add Live Class
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
                placeholder="Search live classes..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1000 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.section ? <th scope="col">Section</th> : null}
                  {visibleColumns.subject ? <th scope="col">Subject</th> : null}
                  {visibleColumns.teacher ? <th scope="col">Teacher</th> : null}
                  {visibleColumns.classDate ? <th scope="col">Class Date</th> : null}
                  {visibleColumns.startTime ? <th scope="col">Start Time</th> : null}
                  {visibleColumns.endTime ? <th scope="col">End Time</th> : null}
                  {visibleColumns.status ? <th scope="col">Status</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center py-40 text-secondary-light">
                      No live classes found.
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
                      {visibleColumns.section ? (
                        <td>
                          <span className="bg-primary-100 text-primary-600 px-12 py-4 radius-4 fw-medium text-sm">
                            {row.section}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.subject ? (
                        <td>
                          <span className="bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm">
                            {row.subject}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.teacher ? <td>{row.teacher}</td> : null}
                      {visibleColumns.classDate ? <td>{row.classDate}</td> : null}
                      {visibleColumns.startTime ? (
                        <td>
                          <span className="d-flex align-items-center gap-4">
                            <i className="ri-time-line text-secondary-light text-sm"></i>
                            {row.startTime}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.endTime ? (
                        <td>
                          <span className="d-flex align-items-center gap-4">
                            <i className="ri-time-line text-secondary-light text-sm"></i>
                            {row.endTime}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.status ? (
                        <td>
                          <span className={statusBadge(row.status)}>
                            {row.status === 'Live' && (
                              <span
                                style={{
                                  display: 'inline-block',
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: 'currentColor',
                                  marginRight: 5,
                                  verticalAlign: 'middle',
                                  animation: 'pulse 1.5s infinite',
                                }}
                              />
                            )}
                            {row.status}
                          </span>
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
        modalWidth="560px"
        open={isAddOpen}
        title="Add Live Class"
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

      {/* Edit Modal */}
      <WizardPopup
        modalWidth="560px"
        open={isEditOpen}
        title="Edit Live Class"
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

      {/* Filter Sidebar */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Live Classes"
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
              {schoolOptions.map((o) => <option key={o} value={o}>{o}</option>)}
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
              <option value="Select">Select</option>
              {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
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
              <option value="Select">Select</option>
              {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="subject" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Subject
            </label>
            <select
              id="subject"
              className="form-control form-select"
              value={pendingFilters.subject}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select</option>
              {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="status" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Status
            </label>
            <select
              id="status"
              className="form-control form-select"
              value={pendingFilters.status}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select</option>
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
              Reset
            </button>
          </div>
          <div>
            <button type="submit" className="btn btn-primary-600 w-100" onClick={() => setIsFilterSidebarOpen(false)}>
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default LiveClass

