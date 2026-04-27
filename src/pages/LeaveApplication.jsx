import { useMemo, useState, useRef } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const STEPS = ['Basic Information', 'Leave Details']

const emptyForm = {
  school: '',
  applicantType: '',
  applicant: '',
  leaveType: '',
  applicationDate: '',
  leaveFrom: '',
  leaveTo: '',
  leaveReason: '',
  document: null,
}

const emptyFilters = {
  school: 'All',
  academicYear: 'All',
  applicantType: 'All',
  leaveType: 'All',
  status: 'All',
}

const leaveApplications = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    academicYear: '2023-2024',
    applicantType: 'Teacher',
    leaveType: 'Casual Leave',
    applicant: 'Sarah Jenkins',
    status: 'Approved',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    academicYear: '2023-2024',
    applicantType: 'Student',
    leaveType: 'Sick Leave',
    applicant: 'Michael Chang',
    status: 'Pending',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    academicYear: '2023-2024',
    applicantType: 'Admin',
    leaveType: 'Annual Leave',
    applicant: 'Robert Vance',
    status: 'Approved',
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    academicYear: '2024-2025',
    applicantType: 'Staff',
    leaveType: 'Maternity Leave',
    applicant: 'Emily Davis',
    status: 'Pending',
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    academicYear: '2024-2025',
    applicantType: 'Librarian',
    leaveType: 'Sick Leave',
    applicant: 'Thomas Moore',
    status: 'Rejected',
  },
]

const applicantTypeOptions = [
  'Admin',
  'Student',
  'Teacher',
  'Accountant',
  'Librarian',
  'Receptionist',
  'Staff',
  'Servant',
]

const leaveTypeOptions = [
  'Casual Leave',
  'Sick Leave',
  'Annual Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Without Pay',
]

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Applicant Type': 'ri-group-line',
  Applicant: 'ri-user-3-line',
  'Leave Type': 'ri-file-list-3-line',
  'Application Date': 'ri-calendar-2-line',
  'Leave From': 'ri-calendar-event-line',
  'Leave To': 'ri-calendar-event-line',
  'Leave Reason': 'ri-file-text-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'academicYear', label: 'Academic Year' },
  { key: 'applicantType', label: 'Applicant Type' },
  { key: 'leaveType', label: 'Leave Type' },
  { key: 'applicant', label: 'Applicant' },
  { key: 'status', label: 'Status' },
]

const statusBadge = (status) => {
  if (status === 'Approved') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (status === 'Pending') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (status === 'Rejected') return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
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
        {required ? <span className="req"> *</span> : null}
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

const LeaveApplication = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const [addDocFile, setAddDocFile] = useState(null)
  const [editDocFile, setEditDocFile] = useState(null)
  const addDocRef = useRef(null)
  const editDocRef = useRef(null)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(() => Array.from(new Set(leaveApplications.map((item) => item.school))), [])
  const academicYearOptions = useMemo(() => Array.from(new Set(leaveApplications.map((item) => item.academicYear))), [])
  const applicantOptions = useMemo(() => Array.from(new Set(leaveApplications.map((item) => item.applicant))), [])

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leaveApplications.filter((row) => {
      const matchesSearch = !q || [row.school, row.applicant, row.applicantType, row.leaveType].join(' ').toLowerCase().includes(q)
      const matchesSchool = filters.school === 'All' || row.school === filters.school
      const matchesYear = filters.academicYear === 'All' || row.academicYear === filters.academicYear
      const matchesType = filters.applicantType === 'All' || row.applicantType === filters.applicantType
      const matchesLeave = filters.leaveType === 'All' || row.leaveType === filters.leaveType
      const matchesStatus = filters.status === 'All' || row.status === filters.status

      return matchesSearch && matchesSchool && matchesYear && matchesType && matchesLeave && matchesStatus
    })
  }, [search, filters])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredData.slice(start, start + rowsPerPage)
  }, [currentPage, filteredData, rowsPerPage])

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows(paginatedData.map((r) => r.sl))
    else setSelectedRows([])
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => {
      const updated = { ...prev, [id]: value }
      if (id === 'school' || id === 'applicantType') {
        updated.applicant = ''
      }
      return updated
    })
  }

  const handleFileChange = (setter, setFile) => (e) => {
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
    setAddDocFile(null)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditForm({
      ...emptyForm,
      school: row.school,
      applicantType: row.applicantType,
      applicant: row.applicant,
      leaveType: row.leaveType,
    })
    setEditStep(0)
    setEditDocFile(null)
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
    const isAdd = setter === setAddForm
    const docFile = isAdd ? addDocFile : editDocFile
    const setDocFile = isAdd ? setAddDocFile : setEditDocFile
    const docRef = isAdd ? addDocRef : editDocRef

    return (
      <>
        {step === 0 ? (
          <>
            <p className="avm-section-title">{STEPS[0]}</p>
            <div className="avm-grid">
              <FormField label="School Name" required full>
                <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
                  <option value="">--Select School--</option>
                  {schoolOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Applicant Type" required>
                <select className="avm-select" id="applicantType" value={form.applicantType} onChange={handleChange(setter)}>
                  <option value="">--Select--</option>
                  {applicantTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Applicant" required>
                <select className="avm-select" id="applicant" value={form.applicant} onChange={handleChange(setter)} disabled={!form.school || !form.applicantType}>
                  <option value="">--Select--</option>
                  {applicantOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Leave Type" required full>
                <select className="avm-select" id="leaveType" value={form.leaveType} onChange={handleChange(setter)}>
                  <option value="">--Select--</option>
                  {leaveTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <p className="avm-section-title">{STEPS[1]}</p>
            <div className="avm-grid">
              <FormField label="Application Date" required full>
                <input type="date" className="avm-input" id="applicationDate" value={form.applicationDate} onChange={handleChange(setter)} />
              </FormField>
              <FormField label="Leave From" required>
                <input type="date" className="avm-input" id="leaveFrom" value={form.leaveFrom} onChange={handleChange(setter)} />
              </FormField>
              <FormField label="Leave To" required>
                <input type="date" className="avm-input" id="leaveTo" value={form.leaveTo} onChange={handleChange(setter)} />
              </FormField>
              <FormField label="Leave Reason" required full>
                <textarea rows="3" className="avm-input avm-textarea" id="leaveReason" placeholder="Reason for leave..." value={form.leaveReason} onChange={handleChange(setter)} />
              </FormField>
              <div className="avm-field full">
                <label className="avm-label">Attachment</label>
                <div
                  style={{ border: '2px dashed #d0d5dd', borderRadius: '0.75rem', padding: '1.5rem 1.25rem', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s' }}
                  onClick={() => docRef.current?.click()}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#45597a'; e.currentTarget.style.background = '#f0f4f8' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d0d5dd'; e.currentTarget.style.background = '#f8fafc' }}
                >
                  {docFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#e8edf4', borderRadius: '0.6rem', padding: '0.65rem 1rem', width: '100%' }}>
                      <i className={getFileIcon(docFile.name)} style={{ fontSize: '1.5rem', color: '#45597a', flexShrink: 0 }}></i>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#34393f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{docFile.name}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#7a8a9a' }}>{(docFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e8edf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ri-upload-cloud-2-line" style={{ fontSize: '1.5rem', color: '#45597a' }}></i>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#45597a' }}>Click to upload document</p>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>Document file format: .pdf, .doc/docx, .ppt/pptx or .txt</p>
                      </div>
                    </>
                  )}
                  <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" style={{ display: 'none' }} onChange={handleFileChange(setter, setDocFile)} />
                </div>
                {docFile ? (
                  <button type="button" className="avm-btn light sm" style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }} onClick={() => { setter((prev) => ({ ...prev, document: null })); setDocFile(null); if (docRef.current) docRef.current.value = '' }}>
                    <i className="ri-delete-bin-line"></i> Remove
                  </button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </>
    )
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Leave Application</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">Dashboard</button>
            <span className="text-secondary-light"> / Leave Application</span>
          </div>
        </div>
        <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <span className="d-flex text-md"><i className="ri-add-large-line"></i></span>
          Add Leave
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1"></i> Export
                  </span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"><i className="ri-file-3-line"></i> PDF</button></li>
                  <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"><i className="ri-file-excel-2-line"></i> Excel</button></li>
                </ul>
              </div>

              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  {columnOptions.map((column) => (
                    <li key={column.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input type="checkbox" className="form-check-input mt-0" checked={visibleColumns[column.key]} onChange={() => toggleColumn(column.key)} />
                        {column.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <select className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light" value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }}>
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="position-relative">
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light"><i className="ri-search-line"></i></span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input className="form-check-input" type="checkbox"
                        checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                        onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.academicYear ? <th scope="col">Academic Year</th> : null}
                  {visibleColumns.applicantType ? <th scope="col">Applicant Type</th> : null}
                  {visibleColumns.leaveType ? <th scope="col">Leave Type</th> : null}
                  {visibleColumns.applicant ? <th scope="col">Applicant</th> : null}
                  {visibleColumns.status ? <th scope="col">Status</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">No records found.</td></tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr key={row.sl}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox"
                            checked={selectedRows.includes(row.sl)}
                            onChange={() => handleSelectRow(row.sl)} />
                          <label className="form-check-label">{row.sl}</label>
                        </div>
                      </td>
                      {visibleColumns.school ? <td>{row.school}</td> : null}
                      {visibleColumns.academicYear ? <td>{row.academicYear}</td> : null}
                      {visibleColumns.applicantType ? <td>{row.applicantType}</td> : null}
                      {visibleColumns.leaveType ? <td>{row.leaveType}</td> : null}
                      {visibleColumns.applicant ? <td className="fw-medium text-primary-light">{row.applicant}</td> : null}
                      {visibleColumns.status ? (
                        <td>
                          <span className={statusBadge(row.status)}>{row.status}</span>
                        </td>
                      ) : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button type="button" className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" onClick={() => openEdit(row)} title="Edit">
                            <i className="ri-edit-line"></i>
                          </button>
                          <button type="button" className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" title="Delete">
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
              Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              {getVisiblePages().map((p) => (
                <button key={p} type="button" className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </div>
      </div>

      <WizardPopup
        modalWidth="580px"
        open={isAddOpen}
        title="Add Leave Application"
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
        modalWidth="580px"
        open={isEditOpen}
        title="Edit Leave Application"
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

      <SlideSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} title="Filter Leave Application">
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="school" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
            <select id="school" className="form-control form-select" value={pendingFilters.school} onChange={handlePendingFilterChange}>
              <option value="All">All Schools</option>
              {schoolOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="academicYear" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Academic Year</label>
            <select id="academicYear" className="form-control form-select" value={pendingFilters.academicYear} onChange={handlePendingFilterChange}>
              <option value="All">All</option>
              {academicYearOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="applicantType" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Applicant Type</label>
            <select id="applicantType" className="form-control form-select" value={pendingFilters.applicantType} onChange={handlePendingFilterChange}>
              <option value="All">All</option>
              {applicantTypeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="leaveType" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Leave Type</label>
            <select id="leaveType" className="form-control form-select" value={pendingFilters.leaveType} onChange={handlePendingFilterChange}>
              <option value="All">All</option>
              {leaveTypeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="status" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Status</label>
            <select id="status" className="form-control form-select" value={pendingFilters.status} onChange={handlePendingFilterChange}>
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">Reset</button>
          </div>
          <div>
            <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default LeaveApplication