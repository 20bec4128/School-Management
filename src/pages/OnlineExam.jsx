import { useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const STEPS = ['Basic Info', 'Schedule & Duration', 'Assessment & Settings']

const emptyForm = {
  school: '',
  examTitle: '',
  className: '',
  section: '',
  subject: '',
  instruction: '',
  duration: '',
  startDate: '',
  endDate: '',
  markType: '',
  passMark: '',
  isPublish: '',
  examLimit: '',
  note: '',
}

const emptyFilters = {
  school: 'Select',
  className: 'Select',
  subject: 'Select',
  isPublish: 'Select',
}

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Exam Title': 'ri-file-list-line',
  Class: 'ri-graduation-cap-line',
  Section: 'ri-grid-line',
  Subject: 'ri-book-open-line',
  Instruction: 'ri-survey-line',
  'Duration (Minute)': 'ri-timer-line',
  'Start Date': 'ri-calendar-line',
  'End Date': 'ri-calendar-line',
  'Mark Type': 'ri-bar-chart-2-line',
  'Pass Mark': 'ri-check-line',
  'Is Publish?': 'ri-global-line',
  'Exam limit per Student': 'ri-restriction-line',
  Note: 'ri-sticky-note-line',
}

// Dummy data
const dummyData = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    examTitle: 'Midterm Exam',
    className: 'Class 10',
    subject: 'Mathematics',
    totalQuestion: 50,
    isPublish: 'Published',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    examTitle: 'Final Exam',
    className: 'Class 9',
    subject: 'Science',
    totalQuestion: 40,
    isPublish: 'Draft',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    examTitle: 'Weekly Test',
    className: 'Class 8',
    subject: 'English',
    totalQuestion: 30,
    isPublish: 'Published',
  },
]

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'examTitle', label: 'Exam Title' },
  { key: 'className', label: 'Class' },
  { key: 'subject', label: 'Subject' },
  { key: 'totalQuestion', label: 'Total Question' },
  { key: 'isPublish', label: 'Is Publish?' },
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

const OnlineExam = () => {
  // Form states
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState({ ...emptyForm, id: null })
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Table states
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])

  // Filter states
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  // Column visibility
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  // Filtered & paginated data
  const filteredData = useMemo(() => {
    let data = [...dummyData]
    if (filters.school !== 'Select')
      data = data.filter((r) => r.school === filters.school)
    if (filters.className !== 'Select')
      data = data.filter((r) => r.className === filters.className)
    if (filters.subject !== 'Select')
      data = data.filter((r) => r.subject === filters.subject)
    if (filters.isPublish !== 'Select')
      data = data.filter((r) => r.isPublish === filters.isPublish)
    if (search) {
      const term = search.toLowerCase()
      data = data.filter(
        (r) =>
          r.examTitle.toLowerCase().includes(term) ||
          r.school.toLowerCase().includes(term) ||
          r.subject.toLowerCase().includes(term)
      )
    }
    return data
  }, [filters, search])

  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredData.slice(start, start + rowsPerPage)
  }, [filteredData, currentPage, rowsPerPage])

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows(paginatedData.map((row) => row.sl))
    else setSelectedRows([])
  }

  const handleSelectRow = (sl) => {
    if (selectedRows.includes(sl))
      setSelectedRows(selectedRows.filter((id) => id !== sl))
    else setSelectedRows([...selectedRows, sl])
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
    setFilters({ ...pendingFilters })
    setIsFilterSidebarOpen(false)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setIsFilterSidebarOpen(false)
    setCurrentPage(1)
  }

  const openAdd = () => {
    setAddForm(emptyForm)
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditForm({ ...row })
    setEditStep(0)
    setIsEditOpen(true)
  }

  const renderForm = (form, setter, step) => (
    <>
      {step === 0 && (
        <>
          <p className="avm-section-title">{STEPS[0]}</p>
          <div className="avm-grid">
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

            <FormField label="Exam Title" required full>
              <input
                type="text"
                className="avm-input"
                id="examTitle"
                placeholder="Exam Title"
                value={form.examTitle}
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
                <option>Class 8</option>
                <option>Class 9</option>
                <option>Class 10</option>
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
                <option>A</option>
                <option>B</option>
                <option>C</option>
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
                <option>Mathematics</option>
                <option>Science</option>
                <option>English</option>
              </select>
            </FormField>

            <FormField label="Instruction" full>
              <select
                className="avm-select"
                id="instruction"
                value={form.instruction}
                onChange={handleChange(setter)}
              >
                <option value="">--Select--</option>
                <option>Read carefully</option>
                <option>No negative marking</option>
              </select>
            </FormField>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <p className="avm-section-title">{STEPS[1]}</p>
          <div className="avm-grid">
            <FormField label="Duration (Minute)" required>
              <input
                type="number"
                className="avm-input"
                id="duration"
                placeholder="Duration"
                value={form.duration}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Start Date" required>
              <input
                type="date"
                className="avm-input"
                id="startDate"
                value={form.startDate}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="End Date" required>
              <input
                type="date"
                className="avm-input"
                id="endDate"
                value={form.endDate}
                onChange={handleChange(setter)}
              />
            </FormField>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p className="avm-section-title">{STEPS[2]}</p>
          <div className="avm-grid">
            <FormField label="Mark Type" required>
              <select
                className="avm-select"
                id="markType"
                value={form.markType}
                onChange={handleChange(setter)}
              >
                <option value="">--Select--</option>
                <option>Percentage</option>
                <option>Grade</option>
              </select>
            </FormField>

            <FormField label="Pass Mark" required>
              <input
                type="text"
                className="avm-input"
                id="passMark"
                placeholder="Pass Mark"
                value={form.passMark}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Is Publish?" required>
              <select
                className="avm-select"
                id="isPublish"
                value={form.isPublish}
                onChange={handleChange(setter)}
              >
                <option value="">--Select--</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </FormField>

            <FormField label="Exam limit per Student" required>
              <input
                type="number"
                className="avm-input"
                id="examLimit"
                placeholder="Exam limit per Student"
                value={form.examLimit}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Note" full noIcon>
              <textarea
                rows={4}
                className="avm-input avm-textarea"
                id="note"
                placeholder="Note"
                value={form.note}
                onChange={handleChange(setter)}
              />
            </FormField>
          </div>
        </>
      )}
    </>
  )

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Online Exam</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Online Exam</span>
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
          Add Exam
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
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
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
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
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
                placeholder="Search exam..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={
                          selectedRows.length === paginatedData.length && paginatedData.length > 0
                        }
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.examTitle ? <th scope="col">Exam Title</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.subject ? <th scope="col">Subject</th> : null}
                  {visibleColumns.totalQuestion ? <th scope="col">Total Question</th> : null}
                  {visibleColumns.isPublish ? <th scope="col">Is Publish?</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
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
                      {visibleColumns.examTitle ? <td>{row.examTitle}</td> : null}
                      {visibleColumns.className ? <td>{row.className}</td> : null}
                      {visibleColumns.subject ? <td>{row.subject}</td> : null}
                      {visibleColumns.totalQuestion ? <td>{row.totalQuestion}</td> : null}
                      {visibleColumns.isPublish ? (
                        <td>
                          <span
                            className={
                              row.isPublish === 'Published'
                                ? 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
                                : 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
                            }
                          >
                            {row.isPublish}
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

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}
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
        modalWidth="620px"
        open={isAddOpen}
        title="Add Online Exam"
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
        modalWidth="620px"
        open={isEditOpen}
        title="Edit Online Exam"
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
        onClose={() => setIsFilterSidebarOpen(false)}
        title="Filter Online Exam"
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
              <option>Windsor Park High School</option>
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
              <option>Class 8</option>
              <option>Class 9</option>
              <option>Class 10</option>
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
              <option value="Select">Select Subject</option>
              <option>Mathematics</option>
              <option>Science</option>
              <option>English</option>
            </select>
          </div>
          <div>
            <label htmlFor="isPublish" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Is Publish?
            </label>
            <select
              id="isPublish"
              className="form-control form-select"
              value={pendingFilters.isPublish}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select</option>
              <option>Published</option>
              <option>Draft</option>
            </select>
          </div>
          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
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

export default OnlineExam