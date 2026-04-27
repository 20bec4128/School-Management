import { useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const STEPS = ['Schedule Information']

const emptyForm = {
  id: null,
  school: '',
  examTerm: '',
  class: '',
  subject: '',
  examDate: '',
  startTime: '9:00 AM',
  endTime: '9:00 AM',
  roomNo: '',
  note: '',
}

const emptyFilters = {
  school: 'Select',
  examTerm: 'Select',
  class: 'Select',
  subject: 'Select',
}

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Exam Term': 'ri-calendar-event-line',
  Class: 'ri-graduation-cap-line',
  Subject: 'ri-book-open-line',
  'Exam Date': 'ri-calendar-2-line',
  'Start Time': 'ri-time-line',
  'End Time': 'ri-time-line',
  'Room No': 'ri-door-open-line',
  Note: 'ri-sticky-note-line',
}

// Dummy data
const dummySchedules = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    examTerm: 'First Term',
    class: 'Class 10',
    subject: 'Mathematics',
    date: '2024-03-25',
    time: '9:00 AM - 11:00 AM',
    roomNo: 'Room 101',
    note: 'Bring calculator',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    examTerm: 'First Term',
    class: 'Class 10',
    subject: 'Science',
    date: '2024-03-26',
    time: '9:00 AM - 11:00 AM',
    roomNo: 'Room 102',
    note: 'Practical exam',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    examTerm: 'Second Term',
    class: 'Class 9',
    subject: 'English',
    date: '2024-06-10',
    time: '10:00 AM - 12:00 PM',
    roomNo: 'Room 103',
    note: 'Bring dictionary',
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    examTerm: 'Second Term',
    class: 'Class 9',
    subject: 'Mathematics',
    date: '2024-06-12',
    time: '10:00 AM - 12:00 PM',
    roomNo: 'Room 101',
    note: '',
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    examTerm: 'Final Term',
    class: 'Class 8',
    subject: 'Science',
    date: '2024-09-15',
    time: '9:00 AM - 11:00 AM',
    roomNo: 'Room 104',
    note: 'Theory exam',
  },
]

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'examTerm', label: 'Exam Term' },
  { key: 'class', label: 'Class' },
  { key: 'subject', label: 'Subject' },
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'roomNo', label: 'Room No' },
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

const Schedule = () => {
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
    let data = [...dummySchedules]
    if (filters.school !== 'Select')
      data = data.filter((r) => r.school === filters.school)
    if (filters.examTerm !== 'Select')
      data = data.filter((r) => r.examTerm === filters.examTerm)
    if (filters.class !== 'Select')
      data = data.filter((r) => r.class === filters.class)
    if (filters.subject !== 'Select')
      data = data.filter((r) => r.subject === filters.subject)
    if (search) {
      const term = search.toLowerCase()
      data = data.filter(
        (r) =>
          r.school.toLowerCase().includes(term) ||
          r.examTerm.toLowerCase().includes(term) ||
          r.class.toLowerCase().includes(term) ||
          r.subject.toLowerCase().includes(term) ||
          r.roomNo.toLowerCase().includes(term)
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
    setter((prev) => {
      const updated = { ...prev, [id]: value }
      // Update time display when start/end time changes
      if (id === 'startTime' || id === 'endTime') {
        // Time display will be handled when saving/showing
      }
      return updated
    })
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
    // Parse time string "9:00 AM - 11:00 AM" into start and end
    let startTime = '9:00 AM'
    let endTime = '9:00 AM'
    if (row.time && row.time.includes(' - ')) {
      const parts = row.time.split(' - ')
      startTime = parts[0]
      endTime = parts[1]
    }

    setEditForm({
      id: row.sl,
      school: row.school,
      examTerm: row.examTerm,
      class: row.class,
      subject: row.subject,
      examDate: row.date,
      startTime: startTime,
      endTime: endTime,
      roomNo: row.roomNo,
      note: row.note || '',
    })
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

            <FormField label="Exam Term" required>
              <select
                className="avm-select"
                id="examTerm"
                value={form.examTerm}
                onChange={handleChange(setter)}
              >
                <option value="">--Select--</option>
                <option>First Term</option>
                <option>Second Term</option>
                <option>Final Term</option>
              </select>
            </FormField>

            <FormField label="Class" required>
              <select
                className="avm-select"
                id="class"
                value={form.class}
                onChange={handleChange(setter)}
              >
                <option value="">--Select--</option>
                <option>Class 8</option>
                <option>Class 9</option>
                <option>Class 10</option>
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
                <option>Bangla</option>
              </select>
            </FormField>

            <FormField label="Exam Date" required>
              <input
                type="date"
                className="avm-input"
                id="examDate"
                value={form.examDate}
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
              />
            </FormField>

            <FormField label="End Time" required>
              <input
                type="time"
                className="avm-input"
                id="endTime"
                value={form.endTime}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Room No" required>
              <input
                type="text"
                className="avm-input"
                id="roomNo"
                placeholder="Room No"
                value={form.roomNo}
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Schedule</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Schedule</span>
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
          Add Schedule
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
                placeholder="Search schedule..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1000 }}>
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
                  {visibleColumns.examTerm ? <th scope="col">Exam Term</th> : null}
                  {visibleColumns.class ? <th scope="col">Class</th> : null}
                  {visibleColumns.subject ? <th scope="col">Subject</th> : null}
                  {visibleColumns.date ? <th scope="col">Date</th> : null}
                  {visibleColumns.time ? <th scope="col">Time</th> : null}
                  {visibleColumns.roomNo ? <th scope="col">Room No</th> : null}
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
                      {visibleColumns.school ? <td className="fw-medium">{row.school}</td> : null}
                      {visibleColumns.examTerm ? <td>{row.examTerm}</td> : null}
                      {visibleColumns.class ? <td>{row.class}</td> : null}
                      {visibleColumns.subject ? <td>{row.subject}</td> : null}
                      {visibleColumns.date ? <td>{row.date}</td> : null}
                      {visibleColumns.time ? <td>{row.time}</td> : null}
                      {visibleColumns.roomNo ? <td>{row.roomNo}</td> : null}
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
        modalWidth="580px"
        open={isAddOpen}
        title="Add Schedule"
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
        modalWidth="580px"
        open={isEditOpen}
        title="Edit Schedule"
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
        title="Filter Schedule"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div>
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
            <label htmlFor="examTerm" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Exam Term
            </label>
            <select
              id="examTerm"
              className="form-control form-select"
              value={pendingFilters.examTerm}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Term</option>
              <option>First Term</option>
              <option>Second Term</option>
              <option>Final Term</option>
            </select>
          </div>
          <div>
            <label htmlFor="class" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class
            </label>
            <select
              id="class"
              className="form-control form-select"
              value={pendingFilters.class}
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
              <option>Bangla</option>
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

export default Schedule