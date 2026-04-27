import { useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const resultSmsData = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    sessionYear: '2024-2025',
    receiverType: 'Student',
    sendDate: '2024-03-18',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    sessionYear: '2024-2025',
    receiverType: 'Parent',
    sendDate: '2024-03-19',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    sessionYear: '2024-2025',
    receiverType: 'Guardian',
    sendDate: '2024-03-20',
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    sessionYear: '2025-2026',
    receiverType: 'Student',
    sendDate: '2024-03-21',
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    sessionYear: '2025-2026',
    receiverType: 'Parent',
    sendDate: '2024-03-22',
  },
]

const receiverOptionsMap = {
  Student: ['Alice Brown', 'Michael Brown', 'Sophia Wilson', 'David Johnson', 'Emma Davis'],
  Parent: ['Mr. Brown', 'Mrs. Brown', 'Mrs. Wilson', 'Mr. Johnson', 'Mrs. Davis'],
  Guardian: ['Guardian - Alice', 'Guardian - Michael', 'Guardian - Sophia'],
}

const templateOptions = {
  'Result Alert Template': {
    sms: 'Dear [name], your result for [exam] is [exam_result]. Total: [total_obtain]/[total_mark], Grade: [letter_grade]',
  },
  'Parent Notification Template': {
    sms: 'Dear Parent, your child [student_name] scored [total_obtain]/[total_mark] in [exam]. Grade: [letter_grade]',
  },
  'Student Result Template': {
    sms: 'Hello [name], your exam result: [exam] - [exam_result]. Percentage: [percentage]%',
  },
}

const emptyForm = {
  school: '',
  receiverType: '',
  receiver: '',
  template: '',
  sms: '',
  gateway: '',
}

const emptyFilters = {
  school: 'Select',
  sessionYear: 'Select',
  receiverType: 'Select',
}

const STEPS = ['Basic Information', 'SMS Content']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Receiver Type': 'ri-group-line',
  Receiver: 'ri-user-3-line',
  Template: 'ri-file-list-3-line',
  SMS: 'ri-message-2-line',
  Gateway: 'ri-radar-line',
  'Dynamic Tag': 'ri-price-tag-3-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'sessionYear', label: 'Session Year' },
  { key: 'receiverType', label: 'Receiver Type' },
  { key: 'sendDate', label: 'Send Date' },
]

const dynamicTags = ['[name]', '[email]', '[phone]', '[exam_result]']

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

const ResultSMS = () => {
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
  const [findErrors, setFindErrors] = useState({})

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(
    () => Array.from(new Set(resultSmsData.map((item) => item.school))),
    [],
  )
  const sessionYearOptions = useMemo(
    () => Array.from(new Set(resultSmsData.map((item) => item.sessionYear))),
    [],
  )
  const receiverTypeOptions = useMemo(
    () => Array.from(new Set(resultSmsData.map((item) => item.receiverType))),
    [],
  )
  const gatewayOptions = useMemo(() => ['Twilio', 'MSG91', 'TextLocal', 'Vonage'], [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return resultSmsData.filter((row) => {
      const matchesSearch =
        !q ||
        [row.school, row.sessionYear, row.receiverType, row.sendDate]
          .join(' ')
          .toLowerCase()
          .includes(q)

      const matchesSchool = filters.school === 'Select' || row.school === filters.school
      const matchesSessionYear = filters.sessionYear === 'Select' || row.sessionYear === filters.sessionYear
      const matchesReceiverType = filters.receiverType === 'Select' || row.receiverType === filters.receiverType

      return matchesSearch && matchesSchool && matchesSessionYear && matchesReceiverType
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
          receiver: '',
        }
      }

      if (id === 'template') {
        return {
          ...prev,
          template: value,
          sms: templateOptions[value]?.sms || prev.sms,
        }
      }

      return { ...prev, [id]: value }
    })
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
    setFindErrors((prev) => ({ ...prev, [id]: '' }))
  }

  const validateFind = () => {
    const errs = {}
    if (pendingFilters.school === 'Select') errs.school = 'School Name is required.'
    return errs
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    const errors = validateFind()
    if (Object.keys(errors).length > 0) {
      setFindErrors(errors)
      return
    }
    setFilters(pendingFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setFindErrors({})
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
      receiverType: row.receiverType,
      receiver: receiverOptionsMap[row.receiverType]?.[0] || '',
      template: '',
      sms: '',
      gateway: '',
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
    const receiverOptions = form.receiverType ? receiverOptionsMap[form.receiverType] || [] : []
    const remainingCharacters = 160 - form.sms.length

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

              <FormField label="Receiver" required>
                <select
                  className="avm-select"
                  id="receiver"
                  value={form.receiver}
                  onChange={handleChange(setter)}
                  disabled={!form.receiverType}
                >
                  <option value="">--Select--</option>
                  {receiverOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
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
              <FormField label="Template">
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

              <FormField label="Gateway" required>
                <select
                  className="avm-select"
                  id="gateway"
                  value={form.gateway}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {gatewayOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="SMS" required full>
                <textarea
                  rows="4"
                  className="avm-input avm-textarea"
                  id="sms"
                  placeholder="Enter SMS"
                  value={form.sms}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <div className="avm-field full">
                <span
                  style={{
                    fontSize: '0.82rem',
                    color: remainingCharacters < 0 ? '#dc3545' : '#667085',
                  }}
                >
                  You have remain character/letter : {remainingCharacters}
                </span>
              </div>

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
                            sms: prev.sms ? `${prev.sms} ${tag}` : tag,
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Result SMS</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Result SMS</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={openAdd}
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
                placeholder="Search result SMS..."
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
                  {visibleColumns.receiverType ? <th scope="col">Receiver Type</th> : null}
                  {visibleColumns.sendDate ? <th scope="col">Send Date</th> : null}
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
                      No result SMS records found.
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
                      {visibleColumns.receiverType ? <td>{row.receiverType}</td> : null}
                      {visibleColumns.sendDate ? <td>{row.sendDate}</td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-success-focus bg-hover-success-200 text-success-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            title="Send SMS"
                          >
                            <i className="ri-message-2-line"></i>
                          </button>
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
        title="Send SMS"
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
        title="Edit Result SMS"
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
        title="Filter Result SMS"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
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
              className={`form-control form-select ${findErrors.school ? 'border-danger-600' : ''}`}
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
            {findErrors.school && (
              <div className="text-danger-600 text-sm mt-4">{findErrors.school}</div>
            )}
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

export default ResultSMS
