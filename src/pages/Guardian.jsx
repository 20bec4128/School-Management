import { useMemo, useState, useRef } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import PhoneField from '../components/PhoneField'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const guardians = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    photo: null,
    name: 'James Harrington',
    phone: '+1 234 567 8901',
    profession: 'Engineer',
    email: 'james.h@email.com',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    photo: null,
    name: 'Patricia Nguyen',
    phone: '+1 234 567 8902',
    profession: 'Doctor',
    email: 'patricia.n@email.com',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    photo: null,
    name: 'Robert Ashford',
    phone: '+1 234 567 8903',
    profession: 'Teacher',
    email: 'robert.a@email.com',
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    photo: null,
    name: 'Linda Morrison',
    phone: '+1 234 567 8904',
    profession: 'Businessperson',
    email: 'linda.m@email.com',
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    photo: null,
    name: 'David Kim',
    phone: '+1 234 567 8905',
    profession: 'Lawyer',
    email: 'david.k@email.com',
  },
]

const emptyForm = {
  school: '',
  name: '',
  phone: '',
  profession: '',
  religion: '',
  presentAddress: '',
  permanentAddress: '',
  nationalId: '',
  email: '',
  username: '',
  password: '',
  otherInfo: '',
  photo: null,
}

const emptyFilters = {
  school: 'Select',
  profession: 'Select',
}

const STEPS = ['Basic Info', 'Academic Info', 'Other Info']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Name: 'ri-user-3-line',
  Profession: 'ri-briefcase-4-line',
  Religion: 'ri-bookmark-3-line',
  'Present Address': 'ri-map-pin-2-line',
  'Permanent Address': 'ri-home-4-line',
  'National ID': 'ri-fingerprint-line',
  Email: 'ri-mail-line',
  Username: 'ri-at-line',
  Password: 'ri-lock-2-line',
  'Other Info': 'ri-information-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'photo', label: 'Photo' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'profession', label: 'Profession' },
  { key: 'email', label: 'Email' },
]

const professionOptions = [
  'Engineer', 'Doctor', 'Teacher', 'Lawyer', 'Businessperson',
  'Accountant', 'Architect', 'Farmer', 'Government Employee', 'Other',
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

const Guardian = () => {
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
  const [addPhotoPreview, setAddPhotoPreview] = useState(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState(null)
  const [addPasswordVisible, setAddPasswordVisible] = useState(false)
  const [editPasswordVisible, setEditPasswordVisible] = useState(false)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const addPhotoRef = useRef(null)
  const editPhotoRef = useRef(null)

  const schoolOptions = useMemo(
    () => Array.from(new Set(guardians.map((r) => r.school))),
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return guardians.filter((r) => {
      const matchesSearch =
        !q ||
        [r.school, r.name, r.phone, r.profession, r.email]
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesSchool = filters.school === 'Select' || r.school === filters.school
      const matchesProfession = filters.profession === 'Select' || r.profession === filters.profession
      return matchesSearch && matchesSchool && matchesProfession
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

  const handlePhotoChange = (setter, setPreview) => (e) => {
    const file = e.target.files[0]
    if (!file) return
    setter((prev) => ({ ...prev, photo: file }))
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(file)
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
    setAddPhotoPreview(null)
    setAddPasswordVisible(false)
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditForm({
      school: row.school,
      name: row.name,
      phone: row.phone,
      profession: row.profession,
      religion: '',
      presentAddress: '',
      permanentAddress: '',
      nationalId: '',
      email: row.email,
      username: '',
      password: '',
      otherInfo: '',
      photo: null,
    })
    setEditPhotoPreview(null)
    setEditPasswordVisible(false)
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

  const renderForm = (form, setter, step, photoPreview, setPhotoPreview, photoRef, passwordVisible, setPasswordVisible) => (
    <>
      <p className="avm-section-title">
        {step === 0 ? 'Basic Information' : step === 1 ? 'Academic Information' : 'Other Information'}
      </p>
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

            <FormField label="Name" required full>
              <input
                type="text"
                className="avm-input"
                id="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange(setter)}
              />
            </FormField>

            <PhoneField
              id="phone"
              label="Phone"
              required
              value={form.phone}
              onChange={(fullValue) => setter((prev) => ({ ...prev, phone: fullValue }))}
            />

            <FormField label="Profession" required>
              <input
                type="text"
                className="avm-input"
                id="profession"
                placeholder="Profession"
                value={form.profession}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Religion">
              <input
                type="text"
                className="avm-input"
                id="religion"
                placeholder="Religion"
                value={form.religion}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Present Address" full>
              <textarea
                rows={3}
                className="avm-input avm-textarea"
                id="presentAddress"
                placeholder="Present Address"
                value={form.presentAddress}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Permanent Address" full>
              <textarea
                rows={3}
                className="avm-input avm-textarea"
                id="permanentAddress"
                placeholder="Permanent Address"
                value={form.permanentAddress}
                onChange={handleChange(setter)}
              />
            </FormField>
          </>
        )}

        {step === 1 && (
          <>
            <FormField label="National ID" full>
              <input
                type="text"
                className="avm-input"
                id="nationalId"
                placeholder="National ID"
                value={form.nationalId}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Email" full>
              <input
                type="email"
                className="avm-input"
                id="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Username" required full>
              <input
                type="text"
                className="avm-input"
                id="username"
                placeholder="supera"
                value={form.username}
                onChange={handleChange(setter)}
              />
            </FormField>

            <div className="avm-field full">
              <label className="avm-label">
                Password <span className="req"> *</span>
              </label>
              <div className="avm-password-wrap">
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
                    <i className="ri-lock-2-line"></i>
                  </span>
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    className="avm-input"
                    id="password"
                    placeholder="••••••••••••"
                    value={form.password}
                    onChange={handleChange(setter)}
                    style={{ paddingRight: '2.75rem' }}
                  />
                </div>
                <button
                  type="button"
                  className="avm-password-toggle"
                  onClick={() => setPasswordVisible((v) => !v)}
                  tabIndex={-1}
                >
                  <i className={passwordVisible ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                </button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <FormField label="Other Info" full>
              <textarea
                rows={4}
                className="avm-input avm-textarea"
                id="otherInfo"
                placeholder="Other Info"
                value={form.otherInfo}
                onChange={handleChange(setter)}
              />
            </FormField>

            {/* Photo Upload */}
            <div className="avm-field full">
              <label className="avm-label">Photo</label>
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
                }}
                onClick={() => photoRef.current?.click()}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Photo Preview"
                    style={{
                      maxWidth: 120,
                      maxHeight: 130,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid #e0e0e0',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      background: '#e8edf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <i
                      className="ri-user-add-line"
                      style={{ fontSize: '1.8rem', color: '#45597a' }}
                    ></i>
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#45597a' }}>
                    {photoPreview ? 'Change Photo' : 'Upload Photo'}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                    Dimension:- Max-W: 120px, Max-H: 130px
                  </p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                    Image file format: .jpg, .jpeg, .png or .gif
                  </p>
                </div>
                <input
                  ref={photoRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif"
                  style={{ display: 'none' }}
                  onChange={handlePhotoChange(setter, setPhotoPreview)}
                />
              </div>
              {photoPreview && (
                <button
                  type="button"
                  className="avm-btn light sm"
                  style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                  onClick={() => {
                    setter((prev) => ({ ...prev, photo: null }))
                    setPhotoPreview(null)
                    if (photoRef.current) photoRef.current.value = ''
                  }}
                >
                  <i className="ri-delete-bin-line"></i> Remove
                </button>
              )}
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Guardian</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Guardian</span>
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
          Add Guardian
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

              {/* Filter */}
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

              {/* Columns */}
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

              {/* Rows per page */}
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

            {/* Search */}
            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search guardians..."
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

          {/* Table */}
          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.photo ? <th scope="col">Photo</th> : null}
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.phone ? <th scope="col">Phone</th> : null}
                  {visibleColumns.profession ? <th scope="col">Profession</th> : null}
                  {visibleColumns.email ? <th scope="col">Email</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount}
                      className="text-center py-40 text-secondary-light"
                    >
                      No guardians found.
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
                      {visibleColumns.photo ? (
                        <td>
                          <div
                            className="w-40-px h-40-px rounded-circle bg-neutral-200 d-flex align-items-center justify-content-center overflow-hidden"
                            style={{ minWidth: 40 }}
                          >
                            {row.photo ? (
                              <img
                                src={row.photo}
                                alt={row.name}
                                className="w-100 h-100 object-fit-cover"
                              />
                            ) : (
                              <i className="ri-user-line text-secondary-light"></i>
                            )}
                          </div>
                        </td>
                      ) : null}
                      {visibleColumns.name ? (
                        <td className="fw-medium text-primary-light">{row.name}</td>
                      ) : null}
                      {visibleColumns.phone ? <td>{row.phone}</td> : null}
                      {visibleColumns.profession ? <td>{row.profession}</td> : null}
                      {visibleColumns.email ? <td>{row.email}</td> : null}
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

      {/* Add Modal */}
      <WizardPopup
        modalWidth="580px"
        open={isAddOpen}
        title="Add Guardian"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsAddOpen(false)}
        submitLabel="Save"
      >
        {renderForm(
          addForm, setAddForm, addStep,
          addPhotoPreview, setAddPhotoPreview, addPhotoRef,
          addPasswordVisible, setAddPasswordVisible,
        )}
      </WizardPopup>

      {/* Edit Modal */}
      <WizardPopup
        modalWidth="580px"
        open={isEditOpen}
        title="Edit Guardian"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsEditOpen(false)}
        submitLabel="Update"
      >
        {renderForm(
          editForm, setEditForm, editStep,
          editPhotoPreview, setEditPhotoPreview, editPhotoRef,
          editPasswordVisible, setEditPasswordVisible,
        )}
      </WizardPopup>

      {/* Filter Sidebar */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Guardians"
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

          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="profession"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Profession
            </label>
            <select
              id="profession"
              className="form-control form-select"
              value={pendingFilters.profession}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select</option>
              {professionOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
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
            <button
              type="submit"
              className="btn btn-primary-600 w-100"
              onClick={() => setIsFilterSidebarOpen(false)}
            >
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default Guardian
