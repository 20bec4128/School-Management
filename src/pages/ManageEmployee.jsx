import { useMemo, useRef, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import PhoneField from '../components/PhoneField'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const employees = [
  { sl: '01', school: 'Windsor Park High School', photo: null, name: 'James Carter', designation: 'Accountant', phone: '+1 234 567 8901', email: 'james.c@school.com', joiningDate: '2021-03-15', isViewOnWeb: true, displayOrder: 1 },
  { sl: '02', school: 'Windsor Park High School', photo: null, name: 'Linda Brooks', designation: 'Librarian', phone: '+1 234 567 8902', email: 'linda.b@school.com', joiningDate: '2020-07-01', isViewOnWeb: true, displayOrder: 2 },
  { sl: '03', school: 'Windsor Park High School', photo: null, name: 'Marcus Hill', designation: 'Receptionist', phone: '+1 234 567 8903', email: 'marcus.h@school.com', joiningDate: '2019-01-10', isViewOnWeb: false, displayOrder: 3 },
  { sl: '04', school: 'Windsor Park High School', photo: null, name: 'Nina Walsh', designation: 'Staff', phone: '+1 234 567 8904', email: 'nina.w@school.com', joiningDate: '2022-08-20', isViewOnWeb: true, displayOrder: 4 },
  { sl: '05', school: 'Windsor Park High School', photo: null, name: 'Oscar Grant', designation: 'Servant', phone: '+1 234 567 8905', email: 'oscar.g@school.com', joiningDate: '2018-11-05', isViewOnWeb: false, displayOrder: 5 },
]

const emptyForm = {
  // Basic
  school: '', name: '', nationalId: '', designation: '', phone: '', gender: '', bloodGroup: '', religion: '', birthDate: '', presentAddress: '', permanentAddress: '',
  // Academic
  email: '', username: '', password: '', salaryGrade: '', salaryType: '', role: '', joiningDate: '', resume: null,
  // Other
  isViewOnWeb: '', facebookUrl: '', linkedinUrl: '', twitterUrl: '', instagramUrl: '', youtubeUrl: '', pinterestUrl: '', otherInfo: '', photo: null,
}

const STEPS = ['Basic Info', 'Address Info', 'Academic Info', 'Other Info']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Name: 'ri-user-3-line',
  'National ID': 'ri-fingerprint-line',
  Designation: 'ri-award-line',
  Gender: 'ri-user-settings-line',
  'Blood Group': 'ri-heart-pulse-line',
  Religion: 'ri-bookmark-3-line',
  'Birth Date': 'ri-calendar-2-line',
  'Present Address': 'ri-map-pin-2-line',
  'Permanent Address': 'ri-home-4-line',
  Email: 'ri-mail-line',
  Username: 'ri-at-line',
  Password: 'ri-lock-2-line',
  'Salary Grade': 'ri-medal-line',
  'Salary Type': 'ri-money-dollar-circle-line',
  Role: 'ri-shield-user-line',
  'Joining Date': 'ri-calendar-check-line',
  Resume: 'ri-file-text-line',
  'Is View on Web?': 'ri-global-line',
  'Facebook URL': 'ri-facebook-circle-line',
  'LinkedIn URL': 'ri-linkedin-box-line',
  'Twitter URL': 'ri-twitter-x-line',
  'Instagram URL': 'ri-instagram-line',
  'Youtube URL': 'ri-youtube-line',
  'Pinterest URL': 'ri-pinterest-line',
  'Other Info': 'ri-information-line',
  Photo: 'ri-image-2-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'photo', label: 'Photo' },
  { key: 'name', label: 'Name' },
  { key: 'designation', label: 'Designation' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'joiningDate', label: 'Joining Date' },
  { key: 'isViewOnWeb', label: 'Is View on Web?' },
  { key: 'displayOrder', label: 'Display Order' },
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

const ManageEmployee = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [filters, setFilters] = useState({
    name: '',
    school: 'All',
    designation: 'All',
    email: '',
    joiningDate: '',
    isViewOnWeb: 'All',
  })
  const [pendingFilters, setPendingFilters] = useState({
    name: '',
    school: 'All',
    designation: 'All',
    email: '',
    joiningDate: '',
    isViewOnWeb: 'All',
  })
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState(null)
  const photoRef = useRef()
  const editPhotoRef = useRef()
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return employees.filter((r) => {
      const matchesSearch = !q || [r.name, r.designation, r.phone, r.email, r.school].join(' ').toLowerCase().includes(q)
      const matchesName = !filters.name || r.name.toLowerCase().includes(filters.name.toLowerCase())
      const matchesSchool = filters.school === 'All' || r.school === filters.school
      const matchesDesignation = filters.designation === 'All' || r.designation === filters.designation
      const matchesEmail = !filters.email || r.email.toLowerCase().includes(filters.email.toLowerCase())
      const matchesJoiningDate = !filters.joiningDate || r.joiningDate === filters.joiningDate
      const matchesViewOnWeb =
        filters.isViewOnWeb === 'All' ||
        (filters.isViewOnWeb === 'Yes' ? r.isViewOnWeb : !r.isViewOnWeb)
      return matchesSearch && matchesName && matchesSchool && matchesDesignation && matchesEmail && matchesJoiningDate && matchesViewOnWeb
    })
  }, [filters, search])
  const schoolOptions = useMemo(() => Array.from(new Set(employees.map((item) => item.school))), [])
  const designationOptions = useMemo(() => Array.from(new Set(employees.map((item) => item.designation))), [])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((r) => selectedRows.includes(r.sl))

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((r) => r.sl)])])
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

  const handlePhotoChange = (e, setPreview, setter) => {
    const file = e.target.files[0]
    if (!file) return
    setter((prev) => ({ ...prev, photo: file }))
    setPreview(URL.createObjectURL(file))
  }

  const openAdd = () => { setAddForm(emptyForm); setPhotoPreview(null); setAddStep(0); setIsAddOpen(true) }
  const openEdit = (row) => {
    setEditForm({ ...emptyForm, school: row.school, name: row.name, designation: row.designation, phone: row.phone, email: row.email, joiningDate: row.joiningDate, isViewOnWeb: row.isViewOnWeb ? 'Yes' : 'No' })
    setEditPhotoPreview(null); setEditStep(0); setIsEditOpen(true)
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  const renderStep = (step, form, setter, photoPrev, setPhotoPrev, pRef) => {
    if (step === 0) return (
      <>
        <p className="avm-section-title">School & Basic Information</p>
        <div className="avm-grid">
          <FormField label="School Name" required full>
            <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
              <option value="">--Select School--</option>
              <option>Windsor Park High School</option>
            </select>
          </FormField>
          <FormField label="Name" required><input type="text" className="avm-input" id="name" placeholder="Enter name" value={form.name} onChange={handleChange(setter)} /></FormField>
          <FormField label="National ID"><input type="text" className="avm-input" id="nationalId" placeholder="Enter national ID" value={form.nationalId} onChange={handleChange(setter)} /></FormField>
          <FormField label="Designation" required>
            <select className="avm-select" id="designation" value={form.designation} onChange={handleChange(setter)}>
              <option value="">--Select--</option>
              <option>Admin</option>
              <option>Accountant</option>
              <option>Librarian</option>
              <option>Receptionist</option>
              <option>Staff</option>
              <option>Servant</option>
            </select>
          </FormField>
          <PhoneField
            id="phone"
            label="Phone number"
            required
            value={form.phone}
            onChange={(fullValue) => setter((prev) => ({ ...prev, phone: fullValue }))}
          />
          <FormField label="Gender" required>
            <select className="avm-select" id="gender" value={form.gender} onChange={handleChange(setter)}>
              <option value="">--Select--</option><option>Male</option><option>Female</option>
            </select>
          </FormField>
          <FormField label="Blood Group">
            <select className="avm-select" id="bloodGroup" value={form.bloodGroup} onChange={handleChange(setter)}>
              <option value="">--Select--</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
            </select>
          </FormField>
          <FormField label="Religion"><input type="text" className="avm-input" id="religion" placeholder="Enter religion" value={form.religion} onChange={handleChange(setter)} /></FormField>
          <FormField label="Birth Date" required><input type="date" className="avm-input" id="birthDate" value={form.birthDate} onChange={handleChange(setter)} /></FormField>
        </div>
      </>
    )
    if (step === 1) return (
      <>
        <p className="avm-section-title">Address Information</p>
        <div className="avm-grid">
          <FormField label="Present Address" full><textarea rows="3" className="avm-input" id="presentAddress" placeholder="Enter present address" value={form.presentAddress} onChange={handleChange(setter)} /></FormField>
          <FormField label="Permanent Address" full><textarea rows="3" className="avm-input" id="permanentAddress" placeholder="Enter permanent address" value={form.permanentAddress} onChange={handleChange(setter)} /></FormField>
        </div>
      </>
    )
    if (step === 2) return (
      <>
        <p className="avm-section-title">Academic Information</p>
        <div className="avm-grid">
          <FormField label="Email"><input type="email" className="avm-input" id="email" placeholder="Enter email" value={form.email} onChange={handleChange(setter)} /></FormField>
          <FormField label="Username" required><input type="text" className="avm-input" id="username" placeholder="Enter username" value={form.username} onChange={handleChange(setter)} /></FormField>
          <FormField label="Password" required><input type="password" className="avm-input" id="password" placeholder="Enter password" value={form.password} onChange={handleChange(setter)} /></FormField>
          <FormField label="Salary Grade" required>
            <select className="avm-select" id="salaryGrade" value={form.salaryGrade} onChange={handleChange(setter)}>
              <option value="">--Select--</option><option>Grade A</option><option>Grade B</option><option>Grade C</option>
            </select>
          </FormField>
          <FormField label="Salary Type" required>
            <select className="avm-select" id="salaryType" value={form.salaryType} onChange={handleChange(setter)}>
              <option value="">--Select--</option><option>Monthly</option><option>Hourly</option>
            </select>
          </FormField>
          <FormField label="Role" required>
            <select className="avm-select" id="role" value={form.role} onChange={handleChange(setter)}>
              <option value="">--Select--</option>
              <option>Admin</option>
              <option>Accountant</option>
              <option>Librarian</option>
              <option>Receptionist</option>
              <option>Staff</option>
              <option>Servant</option>
            </select>
          </FormField>
          <FormField label="Joining Date" required><input type="date" className="avm-input" id="joiningDate" value={form.joiningDate} onChange={handleChange(setter)} /></FormField>
          <FormField label="Resume" full noIcon>
            <input type="file" className="avm-input" id="resume" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={(e) => setter((prev) => ({ ...prev, resume: e.target.files[0] }))} style={{ padding: '0.45rem 1rem' }} />
            <span style={{ fontSize: '0.78rem', color: '#7a8a9a', marginTop: 4 }}>File format: .pdf, .doc/docx, .ppt/pptx or .txt</span>
          </FormField>
        </div>
      </>
    )
    if (step === 3) return (
      <>
        <p className="avm-section-title">Other Information</p>
        <div className="avm-grid">
          <FormField label="Is View on Web?">
            <select className="avm-select" id="isViewOnWeb" value={form.isViewOnWeb} onChange={handleChange(setter)}>
              <option value="">--Select--</option><option>Yes</option><option>No</option>
            </select>
          </FormField>
          <FormField label="Facebook URL"><input type="url" className="avm-input" id="facebookUrl" placeholder="https://facebook.com/..." value={form.facebookUrl} onChange={handleChange(setter)} /></FormField>
          <FormField label="LinkedIn URL"><input type="url" className="avm-input" id="linkedinUrl" placeholder="https://linkedin.com/..." value={form.linkedinUrl} onChange={handleChange(setter)} /></FormField>
          <FormField label="Twitter URL"><input type="url" className="avm-input" id="twitterUrl" placeholder="https://twitter.com/..." value={form.twitterUrl} onChange={handleChange(setter)} /></FormField>
          <FormField label="Instagram URL"><input type="url" className="avm-input" id="instagramUrl" placeholder="https://instagram.com/..." value={form.instagramUrl} onChange={handleChange(setter)} /></FormField>
          <FormField label="Youtube URL"><input type="url" className="avm-input" id="youtubeUrl" placeholder="https://youtube.com/..." value={form.youtubeUrl} onChange={handleChange(setter)} /></FormField>
          <FormField label="Pinterest URL"><input type="url" className="avm-input" id="pinterestUrl" placeholder="https://pinterest.com/..." value={form.pinterestUrl} onChange={handleChange(setter)} /></FormField>
          <FormField label="Other Info" full><input type="text" className="avm-input" id="otherInfo" placeholder="Any other info" value={form.otherInfo} onChange={handleChange(setter)} /></FormField>
          <FormField label="Photo" full noIcon>
            <input ref={pRef} type="file" accept=".jpg,.jpeg,.png,.gif" style={{ display: 'none' }} onChange={(e) => handlePhotoChange(e, setPhotoPrev, setter)} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button type="button" className="avm-btn light" onClick={() => pRef.current.click()}>
                <i className="ri-upload-2-line"></i> Upload Photo
              </button>
              {photoPrev && <img src={photoPrev} alt="preview" style={{ width: 60, height: 65, objectFit: 'cover', borderRadius: 8, border: '1px solid #d0d5dd' }} />}
            </div>
            <span style={{ fontSize: '0.78rem', color: '#7a8a9a', marginTop: 4 }}>Max-W: 120px, Max-H: 130px — .jpg, .jpeg, .png or .gif</span>
          </FormField>
        </div>
        <div className="avm-grid" style={{ marginTop: '1rem' }}>
          <div className="full" style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="ri-information-line" style={{ color: '#d97706', fontSize: '1rem', flexShrink: 0 }}></i>
            <span style={{ fontSize: '0.82rem', color: '#92400e' }}>Please add Designation before adding an Employee.</span>
          </div>
        </div>
      </>
    )
    return null
  }

  return (
    <div className="dashboard-main-body">
      {/* Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Manage Employee</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">Dashboard</button>
            <span className="text-secondary-light"> / Manage Employee</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
          <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <span className="d-flex text-md"><i className="ri-add-large-line"></i></span>
            Add Employee
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {/* Toolbar */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm"><i className="ri-file-upload-line text-md line-height-1"></i> Export</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"><i className="ri-file-3-line"></i> PDF</button></li>
                  <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"><i className="ri-file-excel-2-line"></i> Excel</button></li>
                </ul>
              </div>
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
              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>
              <select className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light" value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }}>
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="position-relative">
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search employee..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light"><i className="ri-search-line"></i></span>
            </div>
          </div>

          {/* Table */}
          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 900 }}>
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
                  {visibleColumns.designation ? <th scope="col">Designation</th> : null}
                  {visibleColumns.phone ? <th scope="col">Phone</th> : null}
                  {visibleColumns.email ? <th scope="col">Email</th> : null}
                  {visibleColumns.joiningDate ? <th scope="col">Joining Date</th> : null}
                  {visibleColumns.isViewOnWeb ? <th scope="col">Is View on Web?</th> : null}
                  {visibleColumns.displayOrder ? <th scope="col">Display Order</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount} className="text-center py-40 text-secondary-light">No employees found.</td></tr>
                ) : paginated.map((row) => (
                  <tr key={row.sl}>
                    <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input type="checkbox" className="form-check-input" checked={selectedRows.includes(row.sl)} onChange={() => handleSelectRow(row.sl)} />
                          <label className="form-check-label">{row.sl}</label>
                        </div>
                      </td>
                    {visibleColumns.school ? <td>{row.school}</td> : null}
                    {visibleColumns.photo ? (
                      <td>
                        <div className="w-40-px h-40-px rounded-circle bg-neutral-200 d-flex align-items-center justify-content-center overflow-hidden" style={{ minWidth: 40 }}>
                          {row.photo ? <img src={row.photo} alt={row.name} className="w-100 h-100 object-fit-cover" /> : <i className="ri-user-line text-secondary-light"></i>}
                        </div>
                      </td>
                    ) : null}
                    {visibleColumns.name ? <td className="fw-medium text-primary-light">{row.name}</td> : null}
                    {visibleColumns.designation ? <td>{row.designation}</td> : null}
                    {visibleColumns.phone ? <td>{row.phone}</td> : null}
                    {visibleColumns.email ? <td>{row.email}</td> : null}
                    {visibleColumns.joiningDate ? <td>{row.joiningDate}</td> : null}
                    {visibleColumns.isViewOnWeb ? (
                      <td>
                        <div className="form-check form-switch d-flex justify-content-center mb-0">
                          <input className="form-check-input" type="checkbox" defaultChecked={row.isViewOnWeb} style={{ cursor: 'pointer' }} />
                        </div>
                      </td>
                    ) : null}
                    {visibleColumns.displayOrder ? <td className="text-center">{row.displayOrder}</td> : null}
                    <td>
                      <div className="d-flex align-items-center gap-10">
                        <button type="button" className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" onClick={() => openEdit(row)} title="Edit"><i className="ri-edit-line"></i></button>
                        <button type="button" className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" title="Delete"><i className="ri-delete-bin-line"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
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

      {/* Add Employee Modal */}
      <WizardPopup
        modalWidth="570px"
        open={isAddOpen}
        title="Add Employee"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsAddOpen(false)}
        submitLabel="Save"
      >
        {renderStep(addStep, addForm, setAddForm, photoPreview, setPhotoPreview, photoRef)}
      </WizardPopup>

      {/* Edit Employee Modal */}
      <WizardPopup
        modalWidth="570px"
        open={isEditOpen}
        title="Edit Employee"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsEditOpen(false)}
        submitLabel="Update"
      >
        {renderStep(editStep, editForm, setEditForm, editPhotoPreview, setEditPhotoPreview, editPhotoRef)}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Employees"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form
          className="p-20 d-grid grid-cols-2 gap-16"
          onSubmit={(e) => {
            e.preventDefault()
            setFilters(pendingFilters)
            setCurrentPage(1)
            setIsFilterSidebarOpen(false)
          }}
        >
          <div>
            <label htmlFor="filterEmployeeName" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Name</label>
            <input
              id="filterEmployeeName"
              type="text"
              className="form-control"
              value={pendingFilters.name}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Search by name"
            />
          </div>
          <div>
            <label htmlFor="filterEmployeeSchool" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
            <select
              id="filterEmployeeSchool"
              className="form-control form-select"
              value={pendingFilters.school}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, school: e.target.value }))}
            >
              <option value="All">All</option>
              {schoolOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filterEmployeeDesignation" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Designation</label>
            <select
              id="filterEmployeeDesignation"
              className="form-control form-select"
              value={pendingFilters.designation}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, designation: e.target.value }))}
            >
              <option value="All">All</option>
              {designationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filterEmployeeEmail" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Email</label>
            <input
              id="filterEmployeeEmail"
              type="text"
              className="form-control"
              value={pendingFilters.email}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Search by email"
            />
          </div>
          <div>
            <label htmlFor="filterEmployeeJoiningDate" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Joining Date</label>
            <input
              id="filterEmployeeJoiningDate"
              type="date"
              className="form-control"
              value={pendingFilters.joiningDate}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, joiningDate: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="filterEmployeeWeb" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Is View on Web?</label>
            <select
              id="filterEmployeeWeb"
              className="form-control form-select"
              value={pendingFilters.isViewOnWeb}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, isViewOnWeb: e.target.value }))}
            >
              <option value="All">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div>
            <button
              type="button"
              className="btn btn-danger-200 text-danger-600 w-100"
              onClick={() => {
                const reset = { name: '', school: 'All', designation: 'All', email: '', joiningDate: '', isViewOnWeb: 'All' }
                setPendingFilters(reset)
                setFilters(reset)
                setCurrentPage(1)
              }}
            >
              Reset
            </button>
          </div>
          <div>
            <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default ManageEmployee

