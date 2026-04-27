import { useMemo, useState, useRef } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const admitCardSettings = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    borderColor: '#e01ab5',
    topBackground: '#3b82f6',
    bottomSignature: 'Principal',
    signatureBackground: '#1e3a5f',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    borderColor: '#10b981',
    topBackground: '#065f46',
    bottomSignature: 'Vice Principal',
    signatureBackground: '#064e3b',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    borderColor: '#f59e0b',
    topBackground: '#92400e',
    bottomSignature: 'Headmaster',
    signatureBackground: '#78350f',
  },
]

const emptyForm = {
  school: '',
  borderColor: '#e01ab5',
  topBackground: '#e01ab5',
  cardSchoolName: '',
  schoolNameFontSize: '',
  schoolNameColor: '#e01ab5',
  schoolAddress: '',
  schoolAddressColor: '#e01ab5',
  admitTitleFontSize: '',
  admitTitleColor: '#e01ab5',
  admitTitleBackground: '#e01ab5',
  titleFontSize: '',
  titleColor: '#e01ab5',
  valueFontSize: '',
  valueColor: '#e01ab5',
  examTitleFontSize: '',
  examTitleColor: '#e01ab5',
  subjectFontSize: '',
  subjectColor: '#e01ab5',
  bottomSignature: '',
  signatureBackground: '#e01ab5',
  signatureColor: '#e01ab5',
  signatureAlign: '',
  cardLogo: null,
}

const emptyFilters = {
  school: 'Select',
}

const STEPS = ['Card Style', 'Text & Title Style', 'Signature & Logo']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Card School Name': 'ri-font-size',
  'School Name Font Size': 'ri-text-spacing',
  'School Address': 'ri-map-pin-2-line',
  'Admit Title Font Size': 'ri-article-line',
  'Title Font Size': 'ri-heading',
  'Value Font Size': 'ri-list-check',
  'Exam Title Font Size': 'ri-file-list-3-line',
  'Subject Font Size': 'ri-book-open-line',
  'Bottom Signature': 'ri-pen-nib-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'borderColor', label: 'Border Color' },
  { key: 'topBackground', label: 'Top Background' },
  { key: 'bottomSignature', label: 'Bottom Signature' },
  { key: 'signatureBackground', label: 'Signature Background' },
]

const ColorSwatch = ({ color }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      fontSize: '0.85rem',
      color: '#34393f',
    }}
  >
    <span
      style={{
        width: 18,
        height: 18,
        borderRadius: 4,
        background: color,
        border: '1px solid rgba(0,0,0,0.12)',
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
    {color}
  </span>
)

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

const ColorField = ({ label, required, id, value, onChange, full = false }) => (
  <div className={`avm-field${full ? ' full' : ''}`}>
    <label className="avm-label">
      {label}
      {required && <span className="req"> *</span>}
    </label>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <input
        type="color"
        id={id}
        value={value}
        onChange={onChange}
        style={{
          width: 38,
          height: 38,
          border: '1px solid #d0d5dd',
          borderRadius: '0.5rem',
          padding: 2,
          cursor: 'pointer',
          background: '#fff',
          flexShrink: 0,
        }}
      />
      <input
        type="text"
        className="avm-input"
        value={value}
        onChange={onChange}
        id={id}
        placeholder="#000000"
        style={{ flex: 1 }}
      />
    </div>
  </div>
)

const AdmitCardSetting = () => {
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
  const [addLogoPreview, setAddLogoPreview] = useState(null)
  const [editLogoPreview, setEditLogoPreview] = useState(null)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const addLogoRef = useRef(null)
  const editLogoRef = useRef(null)

  const schoolOptions = useMemo(
    () => Array.from(new Set(admitCardSettings.map((r) => r.school))),
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return admitCardSettings.filter((r) => {
      const matchesSearch =
        !q ||
        [r.school, r.borderColor, r.topBackground, r.bottomSignature, r.signatureBackground]
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesSchool = filters.school === 'Select' || r.school === filters.school
      return matchesSearch && matchesSchool
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

  const handleLogoChange = (setter, setPreview) => (e) => {
    const file = e.target.files[0]
    if (!file) return
    setter((prev) => ({ ...prev, cardLogo: file }))
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
    setAddLogoPreview(null)
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditForm({
      school: row.school,
      borderColor: row.borderColor,
      topBackground: row.topBackground,
      cardSchoolName: row.school,
      schoolNameFontSize: '',
      schoolNameColor: row.borderColor,
      schoolAddress: '',
      schoolAddressColor: row.borderColor,
      admitTitleFontSize: '',
      admitTitleColor: row.borderColor,
      admitTitleBackground: row.topBackground,
      titleFontSize: '',
      titleColor: row.borderColor,
      valueFontSize: '',
      valueColor: row.borderColor,
      examTitleFontSize: '',
      examTitleColor: row.borderColor,
      subjectFontSize: '',
      subjectColor: row.borderColor,
      bottomSignature: row.bottomSignature,
      signatureBackground: row.signatureBackground,
      signatureColor: '#ffffff',
      signatureAlign: '',
      cardLogo: null,
    })
    setEditLogoPreview(null)
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

  const renderForm = (form, setter, logoPreview, setLogoPreview, logoRef, step) => (
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

            <ColorField
              label="Border Color"
              id="borderColor"
              value={form.borderColor}
              onChange={handleChange(setter)}
            />
            <ColorField
              label="Top Background"
              id="topBackground"
              value={form.topBackground}
              onChange={handleChange(setter)}
            />

            <FormField label="Card School Name" full>
              <input
                type="text"
                className="avm-input"
                id="cardSchoolName"
                placeholder="Card School Name"
                value={form.cardSchoolName}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="School Name Font Size">
              <input
                type="number"
                className="avm-input"
                id="schoolNameFontSize"
                placeholder="e.g. 14"
                value={form.schoolNameFontSize}
                onChange={handleChange(setter)}
              />
            </FormField>
            <ColorField
              label="School Name Color"
              id="schoolNameColor"
              value={form.schoolNameColor}
              onChange={handleChange(setter)}
            />

            <FormField label="School Address" full>
              <input
                type="text"
                className="avm-input"
                id="schoolAddress"
                placeholder="School Address"
                value={form.schoolAddress}
                onChange={handleChange(setter)}
              />
            </FormField>
            <ColorField
              label="School Address Color"
              id="schoolAddressColor"
              value={form.schoolAddressColor}
              onChange={handleChange(setter)}
            />
          </>
        )}

        {step === 1 && (
          <>
            <FormField label="Admit Title Font Size">
              <input
                type="number"
                className="avm-input"
                id="admitTitleFontSize"
                placeholder="e.g. 16"
                value={form.admitTitleFontSize}
                onChange={handleChange(setter)}
              />
            </FormField>
            <ColorField
              label="Admit Title Color"
              id="admitTitleColor"
              value={form.admitTitleColor}
              onChange={handleChange(setter)}
            />
            <ColorField
              label="Admit Title Background"
              id="admitTitleBackground"
              value={form.admitTitleBackground}
              onChange={handleChange(setter)}
              full
            />

            <FormField label="Title Font Size">
              <input
                type="number"
                className="avm-input"
                id="titleFontSize"
                placeholder="e.g. 13"
                value={form.titleFontSize}
                onChange={handleChange(setter)}
              />
            </FormField>
            <ColorField
              label="Title Color"
              id="titleColor"
              value={form.titleColor}
              onChange={handleChange(setter)}
            />

            <FormField label="Value Font Size">
              <input
                type="number"
                className="avm-input"
                id="valueFontSize"
                placeholder="e.g. 13"
                value={form.valueFontSize}
                onChange={handleChange(setter)}
              />
            </FormField>
            <ColorField
              label="Value Color"
              id="valueColor"
              value={form.valueColor}
              onChange={handleChange(setter)}
            />

            <FormField label="Exam Title Font Size">
              <input
                type="number"
                className="avm-input"
                id="examTitleFontSize"
                placeholder="e.g. 14"
                value={form.examTitleFontSize}
                onChange={handleChange(setter)}
              />
            </FormField>
            <ColorField
              label="Exam Title Color"
              id="examTitleColor"
              value={form.examTitleColor}
              onChange={handleChange(setter)}
            />

            <FormField label="Subject Font Size">
              <input
                type="number"
                className="avm-input"
                id="subjectFontSize"
                placeholder="e.g. 12"
                value={form.subjectFontSize}
                onChange={handleChange(setter)}
              />
            </FormField>
            <ColorField
              label="Subject Color"
              id="subjectColor"
              value={form.subjectColor}
              onChange={handleChange(setter)}
            />
          </>
        )}

        {step === 2 && (
          <>
            <FormField label="Bottom Signature" required full>
              <input
                type="text"
                className="avm-input"
                id="bottomSignature"
                placeholder="Bottom Signature"
                value={form.bottomSignature}
                onChange={handleChange(setter)}
              />
            </FormField>

            <ColorField
              label="Signature Background"
              id="signatureBackground"
              value={form.signatureBackground}
              onChange={handleChange(setter)}
            />
            <ColorField
              label="Signature Color"
              id="signatureColor"
              value={form.signatureColor}
              onChange={handleChange(setter)}
            />

            <FormField label="Signature Align" noIcon>
              <select
                className="avm-select"
                id="signatureAlign"
                value={form.signatureAlign}
                onChange={handleChange(setter)}
              >
                <option value="">--Select--</option>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </FormField>

            <div className="avm-field full">
              <label className="avm-label">Card Logo</label>
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
                onClick={() => logoRef.current?.click()}
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Card Logo Preview"
                    style={{
                      maxWidth: 100,
                      maxHeight: 110,
                      objectFit: 'contain',
                      borderRadius: 6,
                      border: '1px solid #e0e0e0',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: '#e8edf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <i
                      className="ri-image-add-line"
                      style={{ fontSize: '1.6rem', color: '#45597a' }}
                    ></i>
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#45597a' }}>
                    {logoPreview ? 'Change Logo' : 'Upload Card Logo'}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                    Dimension:- Max-W: 100px, Max-H: 110px
                  </p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                    Image file format: .jpg, .jpeg, .png or .gif
                  </p>
                </div>
                <input
                  ref={logoRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif"
                  style={{ display: 'none' }}
                  onChange={handleLogoChange(setter, setLogoPreview)}
                />
              </div>
              {logoPreview && (
                <button
                  type="button"
                  className="avm-btn light sm"
                  style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                  onClick={() => {
                    setter((prev) => ({ ...prev, cardLogo: null }))
                    setLogoPreview(null)
                    if (logoRef.current) logoRef.current.value = ''
                  }}
                >
                  <i className="ri-delete-bin-line"></i> Remove
                </button>
              )}
            </div>

            <div className="full" style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
              <p style={{ fontSize: '0.78rem', color: '#a0aab4', margin: 0 }}>
                Copyright © Infitoolz Schools Manager Pro
              </p>
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Admit Card Setting</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Admit Card Setting</span>
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
          Add Admit Card Setting
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
                placeholder="Search admit card settings..."
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
                  {visibleColumns.borderColor ? <th scope="col">Border Color</th> : null}
                  {visibleColumns.topBackground ? <th scope="col">Top Background</th> : null}
                  {visibleColumns.bottomSignature ? <th scope="col">Bottom Signature</th> : null}
                  {visibleColumns.signatureBackground ? <th scope="col">Signature Background</th> : null}
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
                      No admit card settings found.
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
                      {visibleColumns.borderColor ? (
                        <td>
                          <ColorSwatch color={row.borderColor} />
                        </td>
                      ) : null}
                      {visibleColumns.topBackground ? (
                        <td>
                          <ColorSwatch color={row.topBackground} />
                        </td>
                      ) : null}
                      {visibleColumns.bottomSignature ? (
                        <td>{row.bottomSignature}</td>
                      ) : null}
                      {visibleColumns.signatureBackground ? (
                        <td>
                          <ColorSwatch color={row.signatureBackground} />
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
        modalWidth="620px"
        open={isAddOpen}
        title="Add Admit Card Setting"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsAddOpen(false)}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm, addLogoPreview, setAddLogoPreview, addLogoRef, addStep)}
      </WizardPopup>

      {/* Edit Modal */}
      <WizardPopup
        modalWidth="620px"
        open={isEditOpen}
        title="Edit Admit Card Setting"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsEditOpen(false)}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm, editLogoPreview, setEditLogoPreview, editLogoRef, editStep)}
      </WizardPopup>

      {/* Filter Sidebar */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Admit Card Settings"
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

export default AdmitCardSetting
