import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import PhoneField from '../components/PhoneField'
import useColumnVisibility from '../hooks/useColumnVisibility'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import ExportDropdown from '../components/ExportDropdown'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import TablePagination from '../components/table/TablePagination'
import '../assets/css/addModalShared.css'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createGuardian, deleteGuardian, fetchGuardiansPage, updateGuardian } from '../apis/guardiansApi'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
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
  headOfficeId: 'Select',
  schoolId: 'Select',
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
  { key: 'schoolName', label: 'School' },
  { key: 'photoUrl', label: 'Photo' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'profession', label: 'Profession' },
  { key: 'email', label: 'Email' },
]

const professionOptions = [
  'Engineer',
  'Doctor',
  'Teacher',
  'Lawyer',
  'Businessperson',
  'Accountant',
  'Architect',
  'Farmer',
  'Government Employee',
  'Other',
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

const unwrapCollection = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.content)) return value.content
  return []
}

const schoolLabel = (row) => row?.schoolName || row?.name || ''
const getSchoolById = (rows, schoolId) =>
  (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(schoolId ?? '')) || null

const Guardian = () => {
  const [rows, setRows] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [editingId, setEditingId] = useState(null)

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
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

  const schoolOptionsFor = useCallback(
    (headOfficeId) =>
      schoolsLookup
        .filter((s) => !headOfficeId || String(s?.headOfficeId ?? '') === String(headOfficeId))
        .slice()
        .sort((a, b) => schoolLabel(a).localeCompare(schoolLabel(b))),
    [schoolsLookup],
  )

  const loadLookups = useCallback(async () => {
    const [headOfficesResult, schoolsResult] = await Promise.allSettled([
      fetchHeadOfficesPage(0, 500),
      fetchSchoolsLookup(),
    ])

    setHeadOffices(
      unwrapCollection(headOfficesResult.status === 'fulfilled' ? headOfficesResult.value : [])
        .map((ho) => ({ id: ho?.id, name: ho?.name || ho?.headOfficeName || '' }))
        .filter((ho) => ho.id != null && ho.name)
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    )
    setSchoolsLookup(unwrapCollection(schoolsResult.status === 'fulfilled' ? schoolsResult.value : []))
  }, [])

  const loadGuardians = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchGuardiansPage(currentPage - 1, rowsPerPage, {
        headOfficeId: filters.headOfficeId !== 'Select' ? filters.headOfficeId : undefined,
        schoolId: filters.schoolId !== 'Select' ? filters.schoolId : undefined,
        profession: filters.profession !== 'Select' ? filters.profession : undefined,
        search: search.trim(),
      })
      setRows(Array.isArray(data?.content) ? data.content : [])
      setTotalElements(Number.isFinite(data?.totalElements) ? Number(data.totalElements) : 0)
      setTotalPages(Math.max(1, Number.isFinite(data?.totalPages) ? Number(data.totalPages) : 1))
    } catch (e) {
      setRows([])
      setTotalElements(0)
      setTotalPages(1)
      setError(e?.message || 'Failed to load guardians')
    } finally {
      setLoading(false)
    }
  }, [currentPage, rowsPerPage, filters, search])

  useEffect(() => {
    loadLookups().catch(() => {})
  }, [loadLookups])

  useEffect(() => {
    loadGuardians().catch(() => {})
  }, [loadGuardians, refreshKey])

  const allSelected = rows.length > 0 && rows.every((r) => selectedRows.includes(String(r.id)))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...rows.map((r) => String(r.id))])])
      return
    }
    setSelectedRows((prev) => prev.filter((id) => !rows.some((r) => String(r.id) === id)))
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({ ...prev, [id]: value }))
  }

  const handlePhotoChange = (setter, setPreview) => (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = String(ev.target?.result || '')
      setter((prev) => ({ ...prev, photo: dataUrl }))
      setPreview(dataUrl)
    }
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
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const openAdd = () => {
    setAddForm(emptyForm)
    setAddPhotoPreview(null)
    setAddPasswordVisible(false)
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    const school = getSchoolById(schoolsLookup, row?.schoolId)
    setEditingId(row?.id ?? null)
    setEditForm({
      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : '',
      schoolId: row?.schoolId != null ? String(row.schoolId) : '',
      name: row?.name || '',
      phone: row?.phone || '',
      profession: row?.profession || '',
      religion: row?.religion || '',
      presentAddress: row?.presentAddress || '',
      permanentAddress: row?.permanentAddress || '',
      nationalId: row?.nationalId || '',
      email: row?.email || '',
      username: row?.username || '',
      password: '',
      otherInfo: row?.otherInfo || '',
      photo: row?.photoUrl || null,
    })
    setEditPhotoPreview(row?.photoUrl || null)
    setEditPasswordVisible(false)
    setEditStep(0)
    setIsEditOpen(true)
  }

  const handleCreate = async () => {
    setSaving(true)
    setError('')
    try {
      await createGuardian({
        schoolId: addForm.schoolId ? Number(addForm.schoolId) : null,
        name: addForm.name || null,
        phone: addForm.phone || null,
        profession: addForm.profession || null,
        religion: addForm.religion || null,
        presentAddress: addForm.presentAddress || null,
        permanentAddress: addForm.permanentAddress || null,
        nationalId: addForm.nationalId || null,
        email: addForm.email || null,
        username: addForm.username || null,
        password: addForm.password || null,
        otherInfo: addForm.otherInfo || null,
        photoUrl: addForm.photo || null,
      })
      setIsAddOpen(false)
      setRefreshKey((k) => k + 1)
    } catch (e) {
      setError(e?.message || 'Failed to create guardian')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (editingId == null) return
    setSaving(true)
    setError('')
    try {
      await updateGuardian(editingId, {
        schoolId: editForm.schoolId ? Number(editForm.schoolId) : null,
        name: editForm.name || null,
        phone: editForm.phone || null,
        profession: editForm.profession || null,
        religion: editForm.religion || null,
        presentAddress: editForm.presentAddress || null,
        permanentAddress: editForm.permanentAddress || null,
        nationalId: editForm.nationalId || null,
        email: editForm.email || null,
        username: editForm.username || null,
        password: editForm.password || null,
        otherInfo: editForm.otherInfo || null,
        photoUrl: editForm.photo || null,
      })
      setIsEditOpen(false)
      setEditingId(null)
      setRefreshKey((k) => k + 1)
    } catch (e) {
      setError(e?.message || 'Failed to update guardian')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (id == null) return
    // eslint-disable-next-line no-alert
    const ok = window.confirm('Delete this guardian?')
    if (!ok) return
    setSaving(true)
    setError('')
    try {
      await deleteGuardian(id)
      setSelectedRows((prev) => prev.filter((rowId) => String(rowId) !== String(id)))
      setRefreshKey((k) => k + 1)
    } catch (e) {
      setError(e?.message || 'Failed to delete guardian')
    } finally {
      setSaving(false)
    }
  }

  const pageInfo = useMemo(() => {
    const total = Number.isFinite(totalElements) ? totalElements : 0
    const start = total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
    const end = total === 0 ? 0 : Math.min(currentPage * rowsPerPage, total)
    return `Showing ${start} - ${end} of ${total} entries`
  }, [currentPage, rowsPerPage, totalElements])

  const renderForm = (
    form,
    setter,
    photoPreview,
    setPhotoPreview,
    photoRef,
    passwordVisible,
    setPasswordVisible,
    requirePassword,
  ) => (
    <>
      <p className="avm-section-title">{STEPS[0]}</p>
      <div className="avm-grid">
        <ManualScopeSelectors
          enabled
          headOffices={headOffices}
          schoolOptions={schoolOptionsFor(form.headOfficeId)}
          selectedHeadOfficeId={form.headOfficeId}
          onHeadOfficeChange={(value) =>
            setter((prev) => ({
              ...prev,
              headOfficeId: value || '',
              schoolId: '',
            }))
          }
          selectedSchoolId={form.schoolId}
          onSchoolChange={(value) => setter((prev) => ({ ...prev, schoolId: value || '' }))}
          schoolLabel="School"
        />

        <FormField label="Name" required full>
          <input type="text" className="avm-input" id="name" placeholder="Name" value={form.name} onChange={handleChange(setter)} />
        </FormField>

        <PhoneField
          id="phone"
          label="Phone"
          required
          value={form.phone}
          onChange={(fullValue) => setter((prev) => ({ ...prev, phone: fullValue }))}
        />

        <FormField label="Profession" required>
          <select className="avm-select" id="profession" value={form.profession} onChange={handleChange(setter)}>
            <option value="">--Select--</option>
            {professionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Religion">
          <input type="text" className="avm-input" id="religion" placeholder="Religion" value={form.religion} onChange={handleChange(setter)} />
        </FormField>

        <FormField label="Present Address" full>
          <textarea rows={3} className="avm-input avm-textarea" id="presentAddress" placeholder="Present Address" value={form.presentAddress} onChange={handleChange(setter)} />
        </FormField>

        <FormField label="Permanent Address" full>
          <textarea rows={3} className="avm-input avm-textarea" id="permanentAddress" placeholder="Permanent Address" value={form.permanentAddress} onChange={handleChange(setter)} />
        </FormField>
      </div>

      <p className="avm-section-title mt-20">Academic Info</p>
      <div className="avm-grid">
        <FormField label="National ID" full>
          <input type="text" className="avm-input" id="nationalId" placeholder="National ID" value={form.nationalId} onChange={handleChange(setter)} />
        </FormField>

        <FormField label="Email" full>
          <input type="email" className="avm-input" id="email" placeholder="Email" value={form.email} onChange={handleChange(setter)} />
        </FormField>

        <FormField label="Username" required full>
          <input type="text" className="avm-input" id="username" placeholder="Username" value={form.username} onChange={handleChange(setter)} />
        </FormField>

        <div className="avm-field full">
          <label className="avm-label">
            Password {requirePassword ? <span className="req"> *</span> : null}
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
                placeholder={requirePassword ? 'Password' : 'Leave blank to keep current password'}
                value={form.password}
                onChange={handleChange(setter)}
                style={{ paddingRight: '2.75rem' }}
              />
            </div>
            <button type="button" className="avm-password-toggle" onClick={() => setPasswordVisible((v) => !v)} tabIndex={-1}>
              <i className={passwordVisible ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
            </button>
          </div>
        </div>
      </div>

      <p className="avm-section-title mt-20">Other Info</p>
      <div className="avm-grid">
        <FormField label="Other Info" full>
          <textarea rows={4} className="avm-input avm-textarea" id="otherInfo" placeholder="Other Info" value={form.otherInfo} onChange={handleChange(setter)} />
        </FormField>

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
                <i className="ri-user-add-line" style={{ fontSize: '1.8rem', color: '#45597a' }}></i>
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
          {photoPreview ? (
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
          ) : null}
        </div>
      </div>
    </>
  )

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Guardian</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Guardian</span>
          </div>
        </div>
        <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <span className="d-flex text-md">
            <i className="ri-add-large-line"></i>
          </span>
          Add Guardian
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" onClick={() => setIsFilterSidebarOpen(true)}>
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
                        <input type="checkbox" className="form-check-input mt-0" checked={visibleColumns[column.key]} onChange={() => toggleColumn(column.key)} />
                        {column.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <RowsPerPageSelect
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(next) => {
                  setRowsPerPage(next)
                  setCurrentPage(1)
                }}
              />
            </div>

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
                  {visibleColumns.schoolName ? <th scope="col">School</th> : null}
                  {visibleColumns.photoUrl ? <th scope="col">Photo</th> : null}
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.phone ? <th scope="col">Phone</th> : null}
                  {visibleColumns.profession ? <th scope="col">Profession</th> : null}
                  {visibleColumns.email ? <th scope="col">Email</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center py-40 text-secondary-light">
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center py-40 text-danger-600">
                      {error}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center py-40 text-secondary-light">
                      No guardians found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id ?? idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" checked={selectedRows.includes(String(row.id))} onChange={() => handleSelectRow(String(row.id))} />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.schoolName ? <td>{row.schoolName}</td> : null}
                      {visibleColumns.photoUrl ? (
                        <td>
                          <div
                            className="w-40-px h-40-px rounded-circle bg-neutral-200 d-flex align-items-center justify-content-center overflow-hidden"
                            style={{ minWidth: 40 }}
                          >
                            {row.photoUrl ? (
                              <img src={row.photoUrl} alt={row.name} className="w-100 h-100 object-fit-cover" />
                            ) : (
                              <i className="ri-user-line text-secondary-light"></i>
                            )}
                          </div>
                        </td>
                      ) : null}
                      {visibleColumns.name ? <td className="fw-medium text-primary-light">{row.name}</td> : null}
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
                            onClick={() => handleDelete(row.id)}
                            disabled={saving}
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

          <TablePagination
            paginationProps={{
              currentPage,
              totalPages,
              pageInfo,
              onPageChange: (page) => setCurrentPage(Math.min(Math.max(1, page), totalPages)),
            }}
          />
        </div>
      </div>

      <WizardPopup
        modalWidth="580px"
        open={isAddOpen}
        title="Add Guardian"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleCreate}
        submitLabel={saving ? 'Saving...' : 'Save'}
      >
        {renderForm(addForm, setAddForm, addPhotoPreview, setAddPhotoPreview, addPhotoRef, addPasswordVisible, setAddPasswordVisible, true)}
      </WizardPopup>

      <WizardPopup
        modalWidth="580px"
        open={isEditOpen}
        title="Edit Guardian"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleUpdate}
        submitLabel={saving ? 'Saving...' : 'Update'}
      >
        {renderForm(editForm, setEditForm, editPhotoPreview, setEditPhotoPreview, editPhotoRef, editPasswordVisible, setEditPasswordVisible, false)}
      </WizardPopup>

      <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter Guardians" onClose={() => setIsFilterSidebarOpen(false)} className="filter-sidebar">
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <ManualScopeSelectors
              enabled
              headOffices={headOffices}
              schoolOptions={schoolOptionsFor(pendingFilters.headOfficeId === 'Select' ? '' : pendingFilters.headOfficeId)}
              selectedHeadOfficeId={pendingFilters.headOfficeId === 'Select' ? '' : pendingFilters.headOfficeId}
              onHeadOfficeChange={(value) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  headOfficeId: value || 'Select',
                  schoolId: 'Select',
                }))
              }
              selectedSchoolId={pendingFilters.schoolId === 'Select' ? '' : pendingFilters.schoolId}
              onSchoolChange={(value) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  schoolId: value || 'Select',
                }))
              }
              schoolLabel="School"
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="profession" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Profession
            </label>
            <select id="profession" className="form-control form-select" value={pendingFilters.profession} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              {professionOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
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

export default Guardian
