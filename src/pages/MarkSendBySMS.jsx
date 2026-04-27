import { useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const smsRecords = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    sessionYear: '2024-2025',
    examTerm: 'First Term',
    className: 'Class 10',
    receiverType: 'Student',
    receiver: 'Alice Brown',
    gateway: 'Twilio',
    sendDate: '2024-02-10',
    phone: '+1 234 567 8901',
    examMark: '85',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    sessionYear: '2024-2025',
    examTerm: 'First Term',
    className: 'Class 10',
    receiverType: 'Parent',
    receiver: 'Bob Wilson Parent',
    gateway: 'Fast2SMS',
    sendDate: '2024-02-10',
    phone: '+1 234 567 8902',
    examMark: '72',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    sessionYear: '2024-2025',
    examTerm: 'Second Term',
    className: 'Class 11',
    receiverType: 'Student',
    receiver: 'Charlie Davis',
    gateway: 'TextLocal',
    sendDate: '2024-03-15',
    phone: '+1 234 567 8903',
    examMark: '91',
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    sessionYear: '2024-2025',
    examTerm: 'Final Term',
    className: 'Class 12',
    receiverType: 'Parent',
    receiver: 'Diana Prince Parent',
    gateway: 'Twilio',
    sendDate: '2024-04-20',
    phone: '+1 234 567 8904',
    examMark: '78',
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    sessionYear: '2024-2025',
    examTerm: 'Final Term',
    className: 'Class 12',
    receiverType: 'Student',
    receiver: 'Ethan Hunt',
    gateway: 'Fast2SMS',
    sendDate: '2024-04-20',
    phone: '+1 234 567 8905',
    examMark: '88',
  },
]

const examTermOptions = ['First Term', 'Second Term', 'Final Term']
const receiverTypeOptions = ['Student', 'Parent', 'Guardian']
const receiverOptions = ['All', 'Selected Students', 'Selected Parents']
const templateOptions = ['Default Mark SMS', 'Exam Result SMS', 'Parent Notification SMS']
const gatewayOptions = ['Twilio', 'Fast2SMS', 'TextLocal']

const emptyFilters = {
  school: 'Select',
  examTerm: 'Select',
  receiverType: 'Select',
  receiver: 'Select',
  template: 'Select',
  sms: '',
  gateway: 'Select',
}

const emptySmsForm = {
  school: '',
  examTerm: '',
  receiverType: '',
  receiver: '',
  template: '',
  sms: '',
  gateway: '',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'sessionYear', label: 'Session Year' },
  { key: 'examTerm', label: 'Exam Term' },
  { key: 'className', label: 'Class' },
  { key: 'receiverType', label: 'Receiver Type' },
  { key: 'gateway', label: 'Gateway' },
  { key: 'sendDate', label: 'Send Date' },
]

const MarkSendBySMS = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isSendSmsOpen, setIsSendSmsOpen] = useState(false)
  const [smsForm, setSmsForm] = useState(emptySmsForm)
  const [isFindSidebarOpen, setIsFindSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [findErrors, setFindErrors] = useState({})
  const [hasSearched, setHasSearched] = useState(false)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(
    () => Array.from(new Set(smsRecords.map((r) => r.school))),
    [],
  )

  const filteredData = useMemo(() => {
    if (!hasSearched) return []

    const q = search.trim().toLowerCase()

    return smsRecords.filter((row) => {
      const matchesSearch =
        !q ||
        [
          row.school,
          row.sessionYear,
          row.examTerm,
          row.className,
          row.receiverType,
          row.gateway,
          row.sendDate,
          row.receiver,
          row.phone,
        ]
          .join(' ')
          .toLowerCase()
          .includes(q)

      const matchesSchool = filters.school === 'Select' || row.school === filters.school
      const matchesExamTerm = filters.examTerm === 'Select' || row.examTerm === filters.examTerm
      const matchesReceiverType =
        filters.receiverType === 'Select' || row.receiverType === filters.receiverType
      const matchesGateway = filters.gateway === 'Select' || row.gateway === filters.gateway

      return matchesSearch && matchesSchool && matchesExamTerm && matchesReceiverType && matchesGateway
    })
  }, [search, filters, hasSearched])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage))

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredData.slice(start, start + rowsPerPage)
  }, [currentPage, filteredData, rowsPerPage])

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...paginatedData.map((r) => r.sl)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !paginatedData.some((r) => r.sl === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    )
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
    setFindErrors((prev) => ({ ...prev, [id]: '' }))
  }

  const handleSmsFormChange = (e) => {
    const { id, value } = e.target
    setSmsForm((prev) => ({ ...prev, [id]: value }))
  }

  const validateFind = () => {
    const errors = {}

    if (pendingFilters.school === 'Select') errors.school = 'School Name is required.'
    if (pendingFilters.examTerm === 'Select') errors.examTerm = 'Exam Term is required.'
    if (pendingFilters.receiverType === 'Select') errors.receiverType = 'Receiver Type is required.'
    if (pendingFilters.receiver === 'Select') errors.receiver = 'Receiver is required.'
    if (!pendingFilters.sms.trim()) errors.sms = 'SMS is required.'
    if (pendingFilters.gateway === 'Select') errors.gateway = 'Gateway is required.'

    return errors
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()

    const errors = validateFind()
    if (Object.keys(errors).length > 0) {
      setFindErrors(errors)
      return
    }

    setFindErrors({})
    setFilters({ ...pendingFilters })
    setCurrentPage(1)
    setHasSearched(true)
    setIsFindSidebarOpen(false)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setFindErrors({})
    setCurrentPage(1)
    setHasSearched(false)
  }

  const openSendSmsModal = (row = null) => {
    if (row) {
      setSmsForm({
        school: row.school,
        examTerm: row.examTerm,
        receiverType: row.receiverType,
        receiver: row.receiver,
        template: '',
        sms: `Hello ${row.receiver}, your exam mark is ${row.examMark}.`,
        gateway: row.gateway,
      })
    } else {
      setSmsForm(emptySmsForm)
    }
    setIsSendSmsOpen(true)
  }

  const renderSmsForm = (form, onChange) => (
    <form className="p-0 d-grid grid-cols-2 gap-16">
      <div style={{ gridColumn: '1 / -1' }}>
        <label
          htmlFor="school"
          className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
        >
          School Name <span className="text-danger-600">*</span>
        </label>
        <select
          id="school"
          className="form-control form-select"
          value={form.school}
          onChange={onChange}
        >
          <option value="">--Select School--</option>
          {schoolOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <label
          htmlFor="examTerm"
          className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
        >
          Exam Term <span className="text-danger-600">*</span>
        </label>
        <select
          id="examTerm"
          className="form-control form-select"
          value={form.examTerm}
          onChange={onChange}
        >
          <option value="">--Select--</option>
          {examTermOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <label
          htmlFor="receiverType"
          className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
        >
          Receiver Type <span className="text-danger-600">*</span>
        </label>
        <select
          id="receiverType"
          className="form-control form-select"
          value={form.receiverType}
          onChange={onChange}
        >
          <option value="">--Select--</option>
          {receiverTypeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <label
          htmlFor="receiver"
          className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
        >
          Receiver <span className="text-danger-600">*</span>
        </label>
        <select
          id="receiver"
          className="form-control form-select"
          value={form.receiver}
          onChange={onChange}
        >
          <option value="">--Select--</option>
          {receiverOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <label
          htmlFor="template"
          className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
        >
          Template
        </label>
        <select
          id="template"
          className="form-control form-select"
          value={form.template}
          onChange={onChange}
        >
          <option value="">--Select--</option>
          {templateOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <label
          htmlFor="sms"
          className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
        >
          SMS <span className="text-danger-600">*</span>
        </label>
        <textarea
          id="sms"
          className="form-control"
          rows="4"
          placeholder="SMS"
          maxLength={160}
          value={form.sms}
          onChange={onChange}
        ></textarea>
        <div className="text-secondary-light text-sm mt-4">
          You have remain character/ letter : {160 - form.sms.length}
        </div>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <label
          htmlFor="gateway"
          className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
        >
          Gateway <span className="text-danger-600">*</span>
        </label>
        <select
          id="gateway"
          className="form-control form-select"
          value={form.gateway}
          onChange={onChange}
        >
          <option value="">--Select--</option>
          {gatewayOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          gridColumn: '1 / -1',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#fff8e6',
          border: '1px solid #fde68a',
          borderRadius: '0.65rem',
          padding: '0.75rem 1rem',
        }}
      >
        <span className="text-sm fw-semibold text-primary-light">Dynamic Tag</span>
        {['[name]', '[email]', '[phone]', '[exam_mark]'].map((tag) => (
          <button
            key={tag}
            type="button"
            className="avm-chip"
            style={{ border: 'none', cursor: 'pointer' }}
            onClick={() =>
              setSmsForm((prev) => ({
                ...prev,
                sms: prev.sms ? `${prev.sms} ${tag}` : tag,
              }))
            }
          >
            {tag}
          </button>
        ))}
      </div>
    </form>
  )

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Mark Send By SMS</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Mark Send By SMS</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={() => openSendSmsModal()}
        >
          <span className="d-flex text-md">
            <i className="ri-message-2-line"></i>
          </span>
          Send SMS
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFindSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                  Find
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
                placeholder="Search..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 950 }}>
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
                  {visibleColumns.sessionYear ? <th scope="col">Session Year</th> : null}
                  {visibleColumns.examTerm ? <th scope="col">Exam Term</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.receiverType ? <th scope="col">Receiver Type</th> : null}
                  {visibleColumns.gateway ? <th scope="col">Gateway</th> : null}
                  {visibleColumns.sendDate ? <th scope="col">Send Date</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {!hasSearched ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40">
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.75rem',
                          color: '#7a8a9a',
                        }}
                      >
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            background: '#f0f4f8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <i
                            className="ri-message-2-line"
                            style={{ fontSize: '1.5rem', color: '#45597a' }}
                          ></i>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#45597a',
                          }}
                        >
                          Mark SMS List
                        </p>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#7a8a9a' }}>
                          Use the <strong>Find</strong> button to select details and load SMS
                          records.
                        </p>
                        <button
                          type="button"
                          className="btn btn-primary-600 d-flex align-items-center gap-6"
                          style={{ marginTop: '0.25rem' }}
                          onClick={() => setIsFindSidebarOpen(true)}
                        >
                          <i className="ri-filter-3-line"></i> Find Records
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 1}
                      className="text-center py-40 text-secondary-light"
                    >
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
                      {visibleColumns.sessionYear ? <td>{row.sessionYear}</td> : null}
                      {visibleColumns.examTerm ? <td>{row.examTerm}</td> : null}
                      {visibleColumns.className ? <td>{row.className}</td> : null}
                      {visibleColumns.receiverType ? <td>{row.receiverType}</td> : null}
                      {visibleColumns.gateway ? (
                        <td>
                          <span className="bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm">
                            {row.gateway}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.sendDate ? <td>{row.sendDate}</td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-success-focus bg-hover-success-200 text-success-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            title="Send SMS"
                            onClick={() => openSendSmsModal(row)}
                          >
                            <i className="ri-message-2-line"></i>
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

          {hasSearched ? (
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
              <span className="text-sm text-secondary-light">
                Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
                {Math.min(currentPage * rowsPerPage, filteredData.length)} of{' '}
                {filteredData.length}
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
          ) : null}
        </div>
      </div>

      <WizardPopup
        open={isSendSmsOpen}
        title="Send SMS"
        steps={['Send SMS']}
        step={0}
        modalWidth="620px"
        onClose={() => setIsSendSmsOpen(false)}
        onBack={() => {}}
        onNext={() => {}}
        onSubmit={() => setIsSendSmsOpen(false)}
        submitLabel="Send"
      >
        {renderSmsForm(smsForm, handleSmsFormChange)}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFindSidebarOpen}
        onClose={() => setIsFindSidebarOpen(false)}
        title="Find Mark SMS"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="school"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              School Name <span className="text-danger-600">*</span>
            </label>
            <select
              id="school"
              className={`form-control form-select${findErrors.school ? ' is-invalid' : ''}`}
              value={pendingFilters.school}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select School--</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {findErrors.school ? (
              <div className="text-danger-600 text-sm mt-4">{findErrors.school}</div>
            ) : null}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="examTerm"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Exam Term <span className="text-danger-600">*</span>
            </label>
            <select
              id="examTerm"
              className={`form-control form-select${findErrors.examTerm ? ' is-invalid' : ''}`}
              value={pendingFilters.examTerm}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {examTermOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {findErrors.examTerm ? (
              <div className="text-danger-600 text-sm mt-4">{findErrors.examTerm}</div>
            ) : null}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="receiverType"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Receiver Type <span className="text-danger-600">*</span>
            </label>
            <select
              id="receiverType"
              className={`form-control form-select${findErrors.receiverType ? ' is-invalid' : ''}`}
              value={pendingFilters.receiverType}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {receiverTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {findErrors.receiverType ? (
              <div className="text-danger-600 text-sm mt-4">{findErrors.receiverType}</div>
            ) : null}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="receiver"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Receiver <span className="text-danger-600">*</span>
            </label>
            <select
              id="receiver"
              className={`form-control form-select${findErrors.receiver ? ' is-invalid' : ''}`}
              value={pendingFilters.receiver}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {receiverOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {findErrors.receiver ? (
              <div className="text-danger-600 text-sm mt-4">{findErrors.receiver}</div>
            ) : null}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="template"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Template
            </label>
            <select
              id="template"
              className="form-control form-select"
              value={pendingFilters.template}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {templateOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="sms"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              SMS <span className="text-danger-600">*</span>
            </label>
            <textarea
              id="sms"
              className={`form-control${findErrors.sms ? ' is-invalid' : ''}`}
              rows="4"
              placeholder="SMS"
              maxLength={160}
              value={pendingFilters.sms}
              onChange={handlePendingFilterChange}
            ></textarea>
            <div className="text-secondary-light text-sm mt-4">
              You have remain character/ letter : {160 - pendingFilters.sms.length}
            </div>
            {findErrors.sms ? (
              <div className="text-danger-600 text-sm mt-4">{findErrors.sms}</div>
            ) : null}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="gateway"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Gateway <span className="text-danger-600">*</span>
            </label>
            <select
              id="gateway"
              className={`form-control form-select${findErrors.gateway ? ' is-invalid' : ''}`}
              value={pendingFilters.gateway}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {gatewayOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {findErrors.gateway ? (
              <div className="text-danger-600 text-sm mt-4">{findErrors.gateway}</div>
            ) : null}
          </div>

          <div
            className="full"
            style={{
              gridColumn: '1 / -1',
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
              <strong>Dynamic Tag:</strong> [name] [email] [phone] [exam_mark]
            </p>
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

export default MarkSendBySMS
