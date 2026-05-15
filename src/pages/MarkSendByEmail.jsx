import { useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const markSendByEmailData = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    sessionYear: '2024-2025',
    exam: 'Term 1',
    class: 'Class 10',
    receiverType: 'Student',
    subject: 'Mathematics',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    sessionYear: '2024-2025',
    exam: 'Term 1',
    class: 'Class 10',
    receiverType: 'Parent',
    subject: 'Physics',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    sessionYear: '2024-2025',
    exam: 'Term 1',
    class: 'Class 10',
    receiverType: 'Student',
    subject: 'Chemistry',
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    sessionYear: '2025-2026',
    exam: 'Term 2',
    class: 'Class 11',
    receiverType: 'Parent',
    subject: 'Biology',
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    sessionYear: '2025-2026',
    exam: 'Final',
    class: 'Class 12',
    receiverType: 'Student',
    subject: 'English',
  },
]

const emptyForm = {
  school: '',
  sessionYear: '',
  exam: '',
  class: '',
  receiverType: '',
  studentMark: '',
  template: '',
  subject: '',
  emailBody: '',
}

const emptyFilters = {
  school: 'Select',
  sessionYear: 'Select',
  exam: 'Select',
  class: 'Select',
  receiverType: 'Select',
  subject: 'Select',
}

const STEPS = ['Basic Information', 'Email Content']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Session Year': 'ri-calendar-line',
  Exam: 'ri-file-list-3-line',
  Class: 'ri-bank-line',
  'Receiver Type': 'ri-group-line',
  'Student Mark': 'ri-bar-chart-2-line',
  Template: 'ri-file-list-3-line',
  Subject: 'ri-mail-open-line',
  'Email Body': 'ri-mail-send-line',
  'Dynamic Tag': 'ri-price-tag-3-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'sessionYear', label: 'Session Year' },
  { key: 'exam', label: 'Exam' },
  { key: 'class', label: 'Class' },
  { key: 'receiverType', label: 'Receiver Type' },
  { key: 'subject', label: 'Subject' },
]

const templateOptions = {
  'Mark Sheet Template': {
    subject: 'Your Mark Sheet for {exam} - {subject}',
    emailBody:
      'Dear {receiver_name},\n\nPlease find your mark sheet for {exam} examination in {subject}.\n\nYour obtained mark: {obtain_mark} out of {total_mark}\nPercentage: {percentage}%\nGrade: {letter_grade}\n\nRegards,\n{school_name}',
  },
  'Parent Notification Template': {
    subject: 'Mark Sheet Notification - {student_name}',
    emailBody:
      'Dear Parent/Guardian,\n\nPlease find the mark sheet of {student_name} for {exam} examination in {subject}.\n\nObtained Mark: {obtain_mark} / {total_mark}\nPercentage: {percentage}%\nGrade: {letter_grade}\n\nRegards,\n{school_name}',
  },
  'Result Alert Template': {
    subject: 'Result Published - {exam}',
    emailBody:
      'Hello,\n\nThe results for {exam} examination have been published.\n\nSubject: {subject}\nObtained Mark: {obtain_mark}\nPercentage: {percentage}%\nGrade: {letter_grade}\n\nThank you,\n{school_name}',
  },
}

const dynamicTags = [
  '{school_name}',
  '{receiver_name}',
  '{student_name}',
  '{exam}',
  '{subject}',
  '{total_mark}',
  '{obtain_mark}',
  '{percentage}',
  '{letter_grade}',
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

const MarkSendByEmail = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [addForm, setAddForm] = useState(emptyForm)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editStep, setEditStep] = useState(0)
  const [editForm, setEditForm] = useState(emptyForm)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(
    () => Array.from(new Set(markSendByEmailData.map((item) => item.school))),
    [],
  )
  const sessionYearOptions = useMemo(
    () => Array.from(new Set(markSendByEmailData.map((item) => item.sessionYear))),
    [],
  )
  const examOptions = useMemo(
    () => Array.from(new Set(markSendByEmailData.map((item) => item.exam))),
    [],
  )
  const classOptions = useMemo(
    () => Array.from(new Set(markSendByEmailData.map((item) => item.class))),
    [],
  )
  const receiverTypeOptions = useMemo(
    () => Array.from(new Set(markSendByEmailData.map((item) => item.receiverType))),
    [],
  )
  const subjectOptions = useMemo(
    () => Array.from(new Set(markSendByEmailData.map((item) => item.subject))),
    [],
  )
  const studentMarkOptions = useMemo(
    () => ['Mark Sheet (All Subjects)', 'Subject Wise Mark', 'Consolidated Mark Sheet'],
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return markSendByEmailData.filter((row) => {
      const matchesSearch =
        !q ||
        [row.school, row.sessionYear, row.exam, row.class, row.receiverType, row.subject]
          .join(' ')
          .toLowerCase()
          .includes(q)

      const matchesSchool = filters.school === 'Select' || row.school === filters.school
      const matchesSessionYear = filters.sessionYear === 'Select' || row.sessionYear === filters.sessionYear
      const matchesExam = filters.exam === 'Select' || row.exam === filters.exam
      const matchesClass = filters.class === 'Select' || row.class === filters.class
      const matchesReceiverType = filters.receiverType === 'Select' || row.receiverType === filters.receiverType
      const matchesSubject = filters.subject === 'Select' || row.subject === filters.subject

      return matchesSearch && matchesSchool && matchesSessionYear && matchesExam && matchesClass && matchesReceiverType && matchesSubject
    })
  }, [search, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((row) => selectedRows.includes(row.sl))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((row) => row.sl)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !paginated.some((row) => row.sl === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    )
  }

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target

    setter((prev) => {
      if (id === 'receiverType') {
        return {
          ...prev,
          receiverType: value,
        }
      }

      if (id === 'template') {
        const selectedTemplate = templateOptions[value]
        return {
          ...prev,
          template: value,
          subject: selectedTemplate ? selectedTemplate.subject : prev.subject,
          emailBody: selectedTemplate ? selectedTemplate.emailBody : prev.emailBody,
        }
      }

      return { ...prev, [id]: value }
    })
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
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditForm({
      ...emptyForm,
      school: row.school,
      sessionYear: row.sessionYear,
      exam: row.exam,
      class: row.class,
      receiverType: row.receiverType,
      subject: row.subject,
      studentMark: 'Mark Sheet (All Subjects)',
      template: 'Mark Sheet Template',
      emailBody: templateOptions['Mark Sheet Template'].emailBody,
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

  const renderForm = (form, setter, step) => {
    return (
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
                  {schoolOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Session Year" required>
                <select
                  className="avm-select"
                  id="sessionYear"
                  value={form.sessionYear || ''}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {sessionYearOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Exam" required>
                <select
                  className="avm-select"
                  id="exam"
                  value={form.exam}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {examOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Class" required>
                <select
                  className="avm-select"
                  id="class"
                  value={form.class || ''}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {classOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Receiver Type" required>
                <select
                  className="avm-select"
                  id="receiverType"
                  value={form.receiverType}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {receiverTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Student Mark" required full>
                <select
                  className="avm-select"
                  id="studentMark"
                  value={form.studentMark}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {studentMarkOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="avm-section-title">{STEPS[1]}</p>
            <div className="avm-grid">

              <FormField label="Template" full>
                <select
                  className="avm-select"
                  id="template"
                  value={form.template}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {Object.keys(templateOptions).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Subject" required full>
                <input
                  type="text"
                  className="avm-input"
                  id="subject"
                  placeholder="Enter email subject"
                  value={form.subject}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Email Body" required full>
                <textarea
                  rows="5"
                  className="avm-input avm-textarea"
                  id="emailBody"
                  placeholder="Enter email body"
                  value={form.emailBody}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Dynamic Tag" full noIcon>
                <div
                  style={{
                    border: '1px solid #d0d5dd',
                    borderRadius: '0.9rem',
                    padding: '0.9rem',
                    background: '#f8fafc',
                  }}
                >
                  <div className="avm-chip-wrap" style={{ marginTop: 0 }}>
                    {dynamicTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="avm-chip"
                        style={{ border: 'none', cursor: 'pointer' }}
                        onClick={() =>
                          setter((prev) => ({
                            ...prev,
                            emailBody: prev.emailBody ? `${prev.emailBody} ${tag}` : tag,
                          }))
                        }
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </FormField>
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Mark Send By Email</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Mark Send By Email</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={openAdd}
        >
          <span className="d-flex text-md">
            <i className="ri-mail-send-line"></i>
          </span>
          Send Email
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

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
                placeholder="Search mark send by email..."
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
                        type="checkbox"
                        className="form-check-input"
                        checked={allSelected}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.sessionYear ? <th scope="col">Session Year</th> : null}
                  {visibleColumns.exam ? <th scope="col">Exam</th> : null}
                  {visibleColumns.class ? <th scope="col">Class</th> : null}
                  {visibleColumns.receiverType ? <th scope="col">Receiver Type</th> : null}
                  {visibleColumns.subject ? <th scope="col">Subject</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 1}
                      className="text-center py-40 text-secondary-light"
                    >
                      No records found.
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
                      {visibleColumns.school ? (
                        <td className="fw-medium text-primary-light">{row.school}</td>
                      ) : null}
                      {visibleColumns.sessionYear ? <td>{row.sessionYear}</td> : null}
                      {visibleColumns.exam ? <td>{row.exam}</td> : null}
                      {visibleColumns.class ? <td>{row.class}</td> : null}
                      {visibleColumns.receiverType ? <td>{row.receiverType}</td> : null}
                      {visibleColumns.subject ? <td>{row.subject}</td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-success-focus bg-hover-success-200 text-success-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            title="Send Email"
                          >
                            <i className="ri-mail-send-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            title="Edit"
                            onClick={() => openEdit(row)}
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

      <WizardPopup
        modalWidth="620px"
        open={isAddOpen}
        title="Send Email"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsAddOpen(false)}
        submitLabel="Send"
      >
        {renderForm(addForm, setAddForm, addStep)}
      </WizardPopup>

      <WizardPopup
        modalWidth="620px"
        open={isEditOpen}
        title="Edit Email"
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
        title="Filter Mark Send By Email"
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
            <label
              htmlFor="sessionYear"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Session Year
            </label>
            <select
              id="sessionYear"
              className="form-control form-select"
              value={pendingFilters.sessionYear}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Session Year</option>
              {sessionYearOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="exam"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Exam
            </label>
            <select
              id="exam"
              className="form-control form-select"
              value={pendingFilters.exam}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Exam</option>
              {examOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="class"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Class
            </label>
            <select
              id="class"
              className="form-control form-select"
              value={pendingFilters.class}
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
            <label
              htmlFor="receiverType"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Receiver Type
            </label>
            <select
              id="receiverType"
              className="form-control form-select"
              value={pendingFilters.receiverType}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Receiver Type</option>
              {receiverTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="subject"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Subject
            </label>
            <select
              id="subject"
              className="form-control form-select"
              value={pendingFilters.subject}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Subject</option>
              {subjectOptions.map((option) => (
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
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default MarkSendByEmail
