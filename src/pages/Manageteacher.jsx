import { useMemo, useRef, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import PhoneField from '../components/PhoneField'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const teachers = [
  { sl: '01', photo: null, name: 'John Smith', department: 'Mathematics', phone: '+1 234 567 8901', email: 'john.smith@school.com', joiningDate: '2021-03-15', isViewOnWeb: true, displayOrder: 1 },
  { sl: '02', photo: null, name: 'Sarah Johnson', department: 'Science', phone: '+1 234 567 8902', email: 'sarah.j@school.com', joiningDate: '2020-07-01', isViewOnWeb: true, displayOrder: 2 },
  { sl: '03', photo: null, name: 'David Lee', department: 'English', phone: '+1 234 567 8903', email: 'david.lee@school.com', joiningDate: '2019-01-10', isViewOnWeb: false, displayOrder: 3 },
  { sl: '04', photo: null, name: 'Emily Clark', department: 'History', phone: '+1 234 567 8904', email: 'emily.c@school.com', joiningDate: '2022-08-20', isViewOnWeb: true, displayOrder: 4 },
  { sl: '05', photo: null, name: 'Michael Brown', department: 'Physics', phone: '+1 234 567 8905', email: 'michael.b@school.com', joiningDate: '2018-11-05', isViewOnWeb: false, displayOrder: 5 },
]

const emptyForm = {
  // Basic
  name: '', nationalId: '', department: '', phone: '', gender: '', bloodGroup: '', religion: '', birthDate: '', presentAddress: '', permanentAddress: '',
  // Academic
  email: '', username: '', password: '', salaryGrade: '', salaryType: '', role: 'Teacher', joiningDate: '', resume: null,
  // Other
  isViewOnWeb: '', facebookUrl: '', linkedinUrl: '', twitterUrl: '', instagramUrl: '', youtubeUrl: '', pinterestUrl: '', otherInfo: '', photo: null,
}

const STEPS = ['Basic Info', 'Address Info', 'Academic Info', 'Other Info']
const FIELD_ICONS = {
  Name: 'ri-user-3-line',
  'National ID': 'ri-fingerprint-line',
  Department: 'ri-building-line',
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
  { key: 'photo', label: 'Photo' },
  { key: 'name', label: 'Name' },
  { key: 'department', label: 'Department' },
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

const ManageTeacher = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [filters, setFilters] = useState({
    name: '',
    department: 'All',
    email: '',
    joiningDate: '',
    isViewOnWeb: 'All',
  })
  const [pendingFilters, setPendingFilters] = useState({
    name: '',
    department: 'All',
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
  const schoolOptions = ['Windsor Park High School']
  const photoRef = useRef()
  const editPhotoRef = useRef()
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return teachers.filter((r) => {
      const matchesSearch = !q || [r.name, r.department, r.phone, r.email].join(' ').toLowerCase().includes(q)
      const matchesName = !filters.name || r.name.toLowerCase().includes(filters.name.toLowerCase())
      const matchesDepartment = filters.department === 'All' || r.department === filters.department
      const matchesEmail = !filters.email || r.email.toLowerCase().includes(filters.email.toLowerCase())
      const matchesJoiningDate = !filters.joiningDate || r.joiningDate === filters.joiningDate
      const matchesViewOnWeb =
        filters.isViewOnWeb === 'All' ||
        (filters.isViewOnWeb === 'Yes' ? r.isViewOnWeb : !r.isViewOnWeb)
      return matchesSearch && matchesName && matchesDepartment && matchesEmail && matchesJoiningDate && matchesViewOnWeb
    })
  }, [filters, search])
  const departmentOptions = useMemo(() => Array.from(new Set(teachers.map((item) => item.department))), [])

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
    setEditForm({ ...emptyForm, name: row.name, department: row.department, phone: row.phone, email: row.email, joiningDate: row.joiningDate, isViewOnWeb: row.isViewOnWeb ? 'Yes' : 'No' })
    setEditPhotoPreview(null); setEditStep(0); setIsEditOpen(true)
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  const renderAddStep = () => {
    if (addStep === 0) return (
      <>
        <p className="avm-section-title">Basic Information</p>
        <div className="avm-grid">
          <FormField label="Name" required><input type="text" className="avm-input" id="name" placeholder="Enter name" value={addForm.name} onChange={handleChange(setAddForm)} /></FormField>
          <FormField label="National ID"><input type="text" className="avm-input" id="nationalId" placeholder="Enter national ID" value={addForm.nationalId} onChange={handleChange(setAddForm)} /></FormField>
          <FormField label="Department" required>
            <select className="avm-select" id="department" value={addForm.department} onChange={handleChange(setAddForm)}>
              <option value="">--Select--</option>
              <option>Mathematics</option><option>Science</option><option>English</option><option>History</option><option>Physics</option>
            </select>
          </FormField>
          <PhoneField
            id="phone"
            label="Phone number"
            required
            value={addForm.phone}
            onChange={(fullValue) => setAddForm((prev) => ({ ...prev, phone: fullValue }))}
          />
          <FormField label="Gender" required>
            <select className="avm-select" id="gender" value={addForm.gender} onChange={handleChange(setAddForm)}>
              <option value="">--Select--</option><option>Male</option><option>Female</option>
            </select>
          </FormField>
          <FormField label="Blood Group">
            <select className="avm-select" id="bloodGroup" value={addForm.bloodGroup} onChange={handleChange(setAddForm)}>
              <option value="">--Select--</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
            </select>
          </FormField>
          <FormField label="Religion"><input type="text" className="avm-input" id="religion" placeholder="Enter religion" value={addForm.religion} onChange={handleChange(setAddForm)} /></FormField>
          <FormField label="Birth Date" required><input type="date" className="avm-input" id="birthDate" value={addForm.birthDate} onChange={handleChange(setAddForm)} /></FormField>
        </div>
      </>
    )
    if (addStep === 1) return (
      <>
        <p className="avm-section-title">Address Information</p>
        <div className="avm-grid">
          <FormField label="Present Address" full><textarea type="text" rows="3" className="avm-input" id="presentAddress" placeholder="Enter present address" value={addForm.presentAddress} onChange={handleChange(setAddForm)} /></FormField>
          <FormField label="Permanent Address" full><textarea type="text" rows="3" className="avm-input" id="permanentAddress" placeholder="Enter permanent address" value={addForm.permanentAddress} onChange={handleChange(setAddForm)} /></FormField>
        </div>
      </>
    )
    if (addStep === 2) return (
      <>
        <p className="avm-section-title">Academic Information</p>
        <div className="avm-grid">
          <FormField label="Email"><input type="email" className="avm-input" id="email" placeholder="Enter email" value={addForm.email} onChange={handleChange(setAddForm)} /></FormField>
          <FormField label="Username" required><input type="text" className="avm-input" id="username" placeholder="Enter username" value={addForm.username} onChange={handleChange(setAddForm)} /></FormField>
          <FormField label="Password" required><input type="password" className="avm-input" id="password" placeholder="Enter password" value={addForm.password} onChange={handleChange(setAddForm)} /></FormField>
          <FormField label="Salary Grade" required>
            <select className="avm-select" id="salaryGrade" value={addForm.salaryGrade} onChange={handleChange(setAddForm)}>
              <option value="">--Select--</option><option>Grade A</option><option>Grade B</option><option>Grade C</option>
            </select>
          </FormField>
          <FormField label="Salary Type" required>
            <select className="avm-select" id="salaryType" value={addForm.salaryType} onChange={handleChange(setAddForm)}>
              <option value="">--Select--</option><option>Monthly</option><option>Hourly</option>
            </select>
          </FormField>
          <FormField label="Role" required><input type="text" className="avm-input" id="role" value={addForm.role} onChange={handleChange(setAddForm)} /></FormField>
          <FormField label="Joining Date" required><input type="date" className="avm-input" id="joiningDate" value={addForm.joiningDate} onChange={handleChange(setAddForm)} /></FormField>
          <FormField label="Resume" full noIcon>
            <input type="file" className="avm-input" id="resume" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={(e) => setAddForm((prev) => ({ ...prev, resume: e.target.files[0] }))} style={{ padding: '0.45rem 1rem' }} />
            <span style={{ fontSize: '0.78rem', color: '#7a8a9a', marginTop: 4 }}>File format: .pdf, .doc/docx, .ppt/pptx or .txt</span>
          </FormField>
        </div>
      </>
    )
    if (addStep === 3) return (
      <>
        <p className="avm-section-title">Other Information</p>
        <div className="avm-grid">
          <FormField label="Is View on Web?">
            <select className="avm-select" id="isViewOnWeb" value={addForm.isViewOnWeb} onChange={handleChange(setAddForm)}>
              <option value="">--Select--</option><option>Yes</option><option>No</option>
            </select>
          </FormField>
          <FormField label="Facebook URL"><input type="url" className="avm-input" id="facebookUrl" placeholder="https://facebook.com/..." value={addForm.facebookUrl} onChange={handleChange(setAddForm)} /></FormField>
          <FormField label="LinkedIn URL"><input type="url" className="avm-input" id="linkedinUrl" placeholder="https://linkedin.com/..." value={addForm.linkedinUrl} onChange={handleChange(setAddForm)} /></FormField>
          <FormField label="Twitter URL"><input type="url" className="avm-input" id="twitterUrl" placeholder="https://twitter.com/..." value={addForm.twitterUrl} onChange={handleChange(setAddForm)} /></FormField>
          <FormField label="Instagram URL"><input type="url" className="avm-input" id="instagramUrl" placeholder="https://instagram.com/..." value={addForm.instagramUrl} onChange={handleChange(setAddForm)} /></FormField>
          <FormField label="Youtube URL"><input type="url" className="avm-input" id="youtubeUrl" placeholder="https://youtube.com/..." value={addForm.youtubeUrl} onChange={handleChange(setAddForm)} /></FormField>
          <FormField label="Pinterest URL"><input type="url" className="avm-input" id="pinterestUrl" placeholder="https://pinterest.com/..." value={addForm.pinterestUrl} onChange={handleChange(setAddForm)} /></FormField>
          <FormField label="Other Info" full><input type="text" className="avm-input" id="otherInfo" placeholder="Any other info" value={addForm.otherInfo} onChange={handleChange(setAddForm)} /></FormField>
          <FormField label="Photo" full noIcon>
            <input ref={photoRef} type="file" accept=".jpg,.jpeg,.png,.gif" style={{ display: 'none' }} onChange={(e) => handlePhotoChange(e, setPhotoPreview, setAddForm)} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button type="button" className="avm-btn light" onClick={() => photoRef.current.click()}>
                <i className="ri-upload-2-line"></i> Upload Photo
              </button>
              {photoPreview && <img src={photoPreview} alt="preview" style={{ width: 60, height: 65, objectFit: 'cover', borderRadius: 8, border: '1px solid #d0d5dd' }} />}
            </div>
            <span style={{ fontSize: '0.78rem', color: '#7a8a9a', marginTop: 4 }}>Max-W: 120px, Max-H: 130px — .jpg, .jpeg, .png or .gif</span>
          </FormField>
        </div>
      </>
    )
  }

  const renderEditStep = () => {
    if (editStep === 0) return (
      <>
        <p className="avm-section-title">Basic Information</p>
        <div className="avm-grid">
          <FormField label="Name" required><input type="text" className="avm-input" id="name" placeholder="Enter name" value={editForm.name} onChange={handleChange(setEditForm)} /></FormField>
          <FormField label="National ID"><input type="text" className="avm-input" id="nationalId" placeholder="Enter national ID" value={editForm.nationalId} onChange={handleChange(setEditForm)} /></FormField>
          <FormField label="Department" required>
            <select className="avm-select" id="department" value={editForm.department} onChange={handleChange(setEditForm)}>
              <option value="">--Select--</option><option>Mathematics</option><option>Science</option><option>English</option><option>History</option><option>Physics</option>
            </select>
          </FormField>
          <PhoneField
            id="phone"
            label="Phone number"
            required
            value={editForm.phone}
            onChange={(fullValue) => setEditForm((prev) => ({ ...prev, phone: fullValue }))}
          />
          <FormField label="Gender" required>
            <select className="avm-select" id="gender" value={editForm.gender} onChange={handleChange(setEditForm)}>
              <option value="">--Select--</option><option>Male</option><option>Female</option>
            </select>
          </FormField>
          <FormField label="Blood Group">
            <select className="avm-select" id="bloodGroup" value={editForm.bloodGroup} onChange={handleChange(setEditForm)}>
              <option value="">--Select--</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
            </select>
          </FormField>
          <FormField label="Religion"><input type="text" className="avm-input" id="religion" placeholder="Enter religion" value={editForm.religion} onChange={handleChange(setEditForm)} /></FormField>
          <FormField label="Birth Date" required><input type="date" className="avm-input" id="birthDate" value={editForm.birthDate} onChange={handleChange(setEditForm)} /></FormField>
        </div>
      </>
    )
    if (editStep === 1) return (
      <>
        <p className="avm-section-title">Address Information</p>
        <div className="avm-grid">
          <FormField label="Present Address" full><textarea type="text" rows="3" className="avm-input" id="presentAddress" placeholder="Enter present address" value={editForm.presentAddress} onChange={handleChange(setEditForm)} ></textarea></FormField>
          <FormField label="Permanent Address" full><textarea type="text" rows="3" className="avm-input" id="permanentAddress" placeholder="Enter permanent address" value={editForm.permanentAddress} onChange={handleChange(setEditForm)} /></FormField>
        </div>
      </>
    )
    if (editStep === 2) return (
      <>
        <p className="avm-section-title">Academic Information</p>
        <div className="avm-grid">
          <FormField label="Email"><input type="email" className="avm-input" id="email" placeholder="Enter email" value={editForm.email} onChange={handleChange(setEditForm)} /></FormField>
          <FormField label="Username" required><input type="text" className="avm-input" id="username" placeholder="Enter username" value={editForm.username} onChange={handleChange(setEditForm)} /></FormField>
          <FormField label="Password" required><input type="password" className="avm-input" id="password" placeholder="Enter password" value={editForm.password} onChange={handleChange(setEditForm)} /></FormField>
          <FormField label="Salary Grade" required>
            <select className="avm-select" id="salaryGrade" value={editForm.salaryGrade} onChange={handleChange(setEditForm)}>
              <option value="">--Select--</option><option>Grade A</option><option>Grade B</option><option>Grade C</option>
            </select>
          </FormField>
          <FormField label="Salary Type" required>
            <select className="avm-select" id="salaryType" value={editForm.salaryType} onChange={handleChange(setEditForm)}>
              <option value="">--Select--</option><option>Monthly</option><option>Hourly</option>
            </select>
          </FormField>
          <FormField label="Role" required><input type="text" className="avm-input" id="role" value={editForm.role} onChange={handleChange(setEditForm)} /></FormField>
          <FormField label="Joining Date" required><input type="date" className="avm-input" id="joiningDate" value={editForm.joiningDate} onChange={handleChange(setEditForm)} /></FormField>
          <FormField label="Resume" full noIcon>
            <input type="file" className="avm-input" id="resume" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={(e) => setEditForm((prev) => ({ ...prev, resume: e.target.files[0] }))} style={{ padding: '0.45rem 1rem' }} />
            <span style={{ fontSize: '0.78rem', color: '#7a8a9a', marginTop: 4 }}>File format: .pdf, .doc/docx, .ppt/pptx or .txt</span>
          </FormField>
        </div>
      </>
    )
    if (editStep === 3) return (
      <>
        <p className="avm-section-title">Other Information</p>
        <div className="avm-grid">
          <FormField label="Is View on Web?">
            <select className="avm-select" id="isViewOnWeb" value={editForm.isViewOnWeb} onChange={handleChange(setEditForm)}>
              <option value="">--Select--</option><option>Yes</option><option>No</option>
            </select>
          </FormField>
          <FormField label="Facebook URL"><input type="url" className="avm-input" id="facebookUrl" placeholder="https://facebook.com/..." value={editForm.facebookUrl} onChange={handleChange(setEditForm)} /></FormField>
          <FormField label="LinkedIn URL"><input type="url" className="avm-input" id="linkedinUrl" placeholder="https://linkedin.com/..." value={editForm.linkedinUrl} onChange={handleChange(setEditForm)} /></FormField>
          <FormField label="Twitter URL"><input type="url" className="avm-input" id="twitterUrl" placeholder="https://twitter.com/..." value={editForm.twitterUrl} onChange={handleChange(setEditForm)} /></FormField>
          <FormField label="Instagram URL"><input type="url" className="avm-input" id="instagramUrl" placeholder="https://instagram.com/..." value={editForm.instagramUrl} onChange={handleChange(setEditForm)} /></FormField>
          <FormField label="Youtube URL"><input type="url" className="avm-input" id="youtubeUrl" placeholder="https://youtube.com/..." value={editForm.youtubeUrl} onChange={handleChange(setEditForm)} /></FormField>
          <FormField label="Pinterest URL"><input type="url" className="avm-input" id="pinterestUrl" placeholder="https://pinterest.com/..." value={editForm.pinterestUrl} onChange={handleChange(setEditForm)} /></FormField>
          <FormField label="Other Info" full><input type="text" className="avm-input" id="otherInfo" placeholder="Any other info" value={editForm.otherInfo} onChange={handleChange(setEditForm)} /></FormField>
          <FormField label="Photo" full noIcon>
            <input ref={editPhotoRef} type="file" accept=".jpg,.jpeg,.png,.gif" style={{ display: 'none' }} onChange={(e) => handlePhotoChange(e, setEditPhotoPreview, setEditForm)} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button type="button" className="avm-btn light" onClick={() => editPhotoRef.current.click()}>
                <i className="ri-upload-2-line"></i> Upload Photo
              </button>
              {editPhotoPreview && <img src={editPhotoPreview} alt="preview" style={{ width: 60, height: 65, objectFit: 'cover', borderRadius: 8, border: '1px solid #d0d5dd' }} />}
            </div>
            <span style={{ fontSize: '0.78rem', color: '#7a8a9a', marginTop: 4 }}>Max-W: 120px, Max-H: 130px — .jpg, .jpeg, .png or .gif</span>
          </FormField>
        </div>
      </>
    )
  }

  return (
    <div className="dashboard-main-body">
      {/* Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Manage Teacher</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">Dashboard</button>
            <span className="text-secondary-light"> / Manage Teacher</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
          <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <span className="d-flex text-md"><i className="ri-add-large-line"></i></span>
            Add Teacher
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
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search teacher..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} />
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
                  {visibleColumns.photo ? <th scope="col">Photo</th> : null}
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.department ? <th scope="col">Department</th> : null}
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
                  <tr><td colSpan={visibleColumnCount} className="text-center py-40 text-secondary-light">No teachers found.</td></tr>
                ) : paginated.map((row) => (
                  <tr key={row.sl}>
                    <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input type="checkbox" className="form-check-input" checked={selectedRows.includes(row.sl)} onChange={() => handleSelectRow(row.sl)} />
                          <label className="form-check-label">{row.sl}</label>
                        </div>
                      </td>
                    {visibleColumns.photo ? (
                      <td>
                      <div className="w-40-px h-40-px rounded-circle bg-neutral-200 d-flex align-items-center justify-content-center overflow-hidden" style={{ minWidth: 40 }}>
                        {row.photo ? <img src={row.photo} alt={row.name} className="w-100 h-100 object-fit-cover" /> : <i className="ri-user-line text-secondary-light"></i>}
                      </div>
                      </td>
                    ) : null}
                    {visibleColumns.name ? <td className="fw-medium text-primary-light">{row.name}</td> : null}
                    {visibleColumns.department ? <td>{row.department}</td> : null}
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

      {/* Add Teacher Modal */}
      <WizardPopup
      modalWidth="570px"
        open={isAddOpen}
        title="Add Teacher"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsAddOpen(false)}
        submitLabel="Save"
      >
        {renderAddStep()}
      </WizardPopup>

      {/* Edit Teacher Modal */}
      <WizardPopup
        open={isEditOpen}
        modalWidth="570px"
        title="Edit Teacher"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsEditOpen(false)}
        submitLabel="Update"
      >
        {renderEditStep()}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Teachers"
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
            <label htmlFor="filterTeacherName" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Name</label>
            <input
              id="filterTeacherName"
              type="text"
              className="form-control"
              value={pendingFilters.name}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Search by name"
            />
          </div>
          <div>
            <label htmlFor="filterDepartmentTeacher" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Department</label>
            <select
              id="filterDepartmentTeacher"
              className="form-control form-select"
              value={pendingFilters.department}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, department: e.target.value }))}
            >
              <option value="All">All</option>
              {departmentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filterTeacherEmail" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Email</label>
            <input
              id="filterTeacherEmail"
              type="text"
              className="form-control"
              value={pendingFilters.email}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Search by email"
            />
          </div>
          <div>
            <label htmlFor="filterTeacherJoiningDate" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Joining Date</label>
            <input
              id="filterTeacherJoiningDate"
              type="date"
              className="form-control"
              value={pendingFilters.joiningDate}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, joiningDate: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="filterWebTeacher" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Is View on Web?</label>
            <select
              id="filterWebTeacher"
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
                const reset = { name: '', department: 'All', email: '', joiningDate: '', isViewOnWeb: 'All' }
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

export default ManageTeacher

