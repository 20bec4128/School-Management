import { useMemo, useRef, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import PhoneField from '../components/PhoneField'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const students = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    photo: null,
    name: 'John Carter',
    group: 'Science',
    className: '10',
    section: 'A',
    rollNo: '101',
    email: 'john.carter@school.com',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    photo: null,
    name: 'Emma Watson',
    group: 'Commerce',
    className: '11',
    section: 'B',
    rollNo: '102',
    email: 'emma.watson@school.com',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    photo: null,
    name: 'Daniel Joseph',
    group: 'Arts',
    className: '9',
    section: 'C',
    rollNo: '103',
    email: 'daniel.joseph@school.com',
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    photo: null,
    name: 'Sophia Green',
    group: 'Science',
    className: '12',
    section: 'A',
    rollNo: '104',
    email: 'sophia.green@school.com',
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    photo: null,
    name: 'Michael Brown',
    group: 'Commerce',
    className: '8',
    section: 'D',
    rollNo: '105',
    email: 'michael.brown@school.com',
  },
]

const emptyForm = {
  school: '',
  name: '',
  admissionNo: '',
  admissionDate: '',
  birthDate: '',
  gender: '',
  bloodGroup: '',
  religion: '',
  caste: '',
  phone: '',
  email: '',
  nationalId: '',

  studentType: '',
  className: '',
  section: '',
  group: '',
  rollNo: '',
  registrationNo: '',
  discount: '',
  secondLanguage: '',

  fatherName: '',
  fatherPhone: '',
  fatherEducation: '',
  fatherProfession: '',
  fatherDesignation: '',
  fatherPhoto: null,

  motherName: '',
  motherPhone: '',
  motherEducation: '',
  motherProfession: '',
  motherDesignation: '',
  motherPhoto: null,

  isGuardian: '',
  relationWithGuardian: '',

  presentAddress: '',
  permanentAddress: '',
  sameAsGuardianAddress: false,

  previousSchoolName: '',
  previousClass: '',
  transferCertificate: null,

  username: '',
  password: '',
  healthCondition: '',
  otherInfo: '',
  photo: null,
}

const emptyFilters = {
  school: 'Select',
  className: 'Select',
  section: 'Select',
  group: 'Select',
}

const STEPS = ['Basic Info', 'Address Info', 'Academic Info', 'Other Info']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Name: 'ri-user-3-line',
  'Admission No': 'ri-profile-line',
  'Admission Date': 'ri-calendar-check-line',
  'Birth Date': 'ri-calendar-2-line',
  Gender: 'ri-user-settings-line',
  'Blood Group': 'ri-heart-pulse-line',
  Religion: 'ri-bookmark-3-line',
  Caste: 'ri-group-line',
  Email: 'ri-mail-line',
  'National ID': 'ri-fingerprint-line',
  'Student Type': 'ri-team-line',
  Class: 'ri-building-line',
  Section: 'ri-layout-grid-line',
  Group: 'ri-group-2-line',
  'Roll No': 'ri-hashtag',
  'Registration No': 'ri-file-list-3-line',
  Discount: 'ri-percent-line',
  'Second Language': 'ri-translate-2',
  'Father Name': 'ri-user-line',
  'Father Education': 'ri-graduation-cap-line',
  'Father Profession': 'ri-briefcase-4-line',
  'Father Designation': 'ri-medal-line',
  'Mother Name': 'ri-user-line',
  'Mother Education': 'ri-graduation-cap-line',
  'Mother Profession': 'ri-briefcase-4-line',
  'Mother Designation': 'ri-medal-line',
  'Is Guardian?': 'ri-shield-user-line',
  'Relation With Guardian': 'ri-links-line',
  'Present Address': 'ri-map-pin-2-line',
  'Permanent Address': 'ri-home-4-line',
  Username: 'ri-at-line',
  Password: 'ri-lock-2-line',
  'Health Condition': 'ri-heart-add-line',
  'Other Info': 'ri-information-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'photo', label: 'Photo' },
  { key: 'name', label: 'Name' },
  { key: 'group', label: 'Group' },
  { key: 'className', label: 'Class' },
  { key: 'section', label: 'Section' },
  { key: 'rollNo', label: 'Roll No' },
  { key: 'email', label: 'Email' },
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

const StudentList = ({ onNavigate }) => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [isAddPasswordVisible, setIsAddPasswordVisible] = useState(false)
  const [isEditPasswordVisible, setIsEditPasswordVisible] = useState(false)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const [addPreviews, setAddPreviews] = useState({
    fatherPhoto: null,
    motherPhoto: null,
    transferCertificate: null,
    photo: null,
  })

  const [editPreviews, setEditPreviews] = useState({
    fatherPhoto: null,
    motherPhoto: null,
    transferCertificate: null,
    photo: null,
  })

  const addFatherPhotoRef = useRef(null)
  const addMotherPhotoRef = useRef(null)
  const addTransferCertificateRef = useRef(null)
  const addStudentPhotoRef = useRef(null)

  const editFatherPhotoRef = useRef(null)
  const editMotherPhotoRef = useRef(null)
  const editTransferCertificateRef = useRef(null)
  const editStudentPhotoRef = useRef(null)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(() => Array.from(new Set(students.map((item) => item.school))), [])
  const classOptions = useMemo(() => Array.from(new Set(students.map((item) => item.className))), [])
  const sectionOptions = useMemo(() => Array.from(new Set(students.map((item) => item.section))), [])
  const groupOptions = useMemo(() => Array.from(new Set(students.map((item) => item.group))), [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return students.filter((row) => {
      const matchesSearch =
        !q ||
        [row.school, row.name, row.group, row.className, row.section, row.rollNo, row.email]
          .join(' ')
          .toLowerCase()
          .includes(q)

      const matchesSchool = filters.school === 'Select' || row.school === filters.school
      const matchesClass = filters.className === 'Select' || row.className === filters.className
      const matchesSection = filters.section === 'Select' || row.section === filters.section
      const matchesGroup = filters.group === 'Select' || row.group === filters.group

      return matchesSearch && matchesSchool && matchesClass && matchesSection && matchesGroup
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
    const { id, value, type, checked } = e.target
    setter((prev) => ({ ...prev, [id]: type === 'checkbox' ? checked : value }))
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handlePhotoChange = (e, key, setPreviewState, setter) => {
    const file = e.target.files[0]
    if (!file) return
    setter((prev) => ({ ...prev, [key]: file }))
    setPreviewState((prev) => ({ ...prev, [key]: URL.createObjectURL(file) }))
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
    setIsAddPasswordVisible(false)
    setAddPreviews({
      fatherPhoto: null,
      motherPhoto: null,
      transferCertificate: null,
      photo: null,
    })
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditForm({
      ...emptyForm,
      school: row.school,
      name: row.name,
      group: row.group,
      className: row.className,
      section: row.section,
      rollNo: row.rollNo,
      email: row.email,
    })
    setIsEditPasswordVisible(false)
    setEditPreviews({
      fatherPhoto: null,
      motherPhoto: null,
      transferCertificate: null,
      photo: row.photo || null,
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

  const renderUploadField = (label, fileRef, preview, onSelect, note1, note2) => (
    <div className="avm-field full">
      <label className="avm-label">{label}</label>
      <input
        ref={fileRef}
        type="file"
        accept=".jpg,.jpeg,.png,.gif"
        style={{ display: 'none' }}
        onChange={onSelect}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button type="button" className="avm-btn light" onClick={() => fileRef.current.click()}>
          <i className="ri-upload-2-line"></i> Upload {label}
        </button>
        {preview && (
          <img
            src={preview}
            alt="preview"
            style={{
              width: 60,
              height: 65,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid #d0d5dd',
            }}
          />
        )}
      </div>
      <span style={{ fontSize: '0.78rem', color: '#7a8a9a', marginTop: 4 }}>{note1}</span>
      <span style={{ fontSize: '0.78rem', color: '#7a8a9a', marginTop: 4 }}>{note2}</span>
    </div>
  )

  const renderForm = (
    form,
    setter,
    step,
    previews,
    refs,
    setPreviewState,
    isPasswordVisible,
    setIsPasswordVisible,
  ) => (
    <>
      {step === 0 ? (
        <>
          <p className="avm-section-title">Basic Information</p>
          <div className="avm-grid">
            <FormField label="School Name" required full>
              <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
                <option value="">--Select School--</option>
                <option>Windsor Park High School</option>
              </select>
            </FormField>

            <FormField label="Name" required>
              <input
                type="text"
                className="avm-input"
                id="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Admission No" required>
              <input
                type="text"
                className="avm-input"
                id="admissionNo"
                placeholder="Admission No"
                value={form.admissionNo}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Admission Date" required>
              <input
                type="date"
                className="avm-input"
                id="admissionDate"
                value={form.admissionDate}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Birth Date" required>
              <input
                type="date"
                className="avm-input"
                id="birthDate"
                value={form.birthDate}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Gender" required>
              <select className="avm-select" id="gender" value={form.gender} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </FormField>

            <FormField label="Blood Group">
              <select className="avm-select" id="bloodGroup" value={form.bloodGroup} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>O+</option>
                <option>O-</option>
                <option>AB+</option>
                <option>AB-</option>
              </select>
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

            <FormField label="Caste">
              <input
                type="text"
                className="avm-input"
                id="caste"
                placeholder="Caste"
                value={form.caste}
                onChange={handleChange(setter)}
              />
            </FormField>

            <PhoneField
              id="phone"
              label="Phone number"
              required
              value={form.phone}
              onChange={(fullValue) => setter((prev) => ({ ...prev, phone: fullValue }))}
            />

            <FormField label="Email">
              <input
                type="email"
                className="avm-input"
                id="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="National ID">
              <input
                type="text"
                className="avm-input"
                id="nationalId"
                placeholder="National ID"
                value={form.nationalId}
                onChange={handleChange(setter)}
              />
            </FormField>
          </div>
        </>
      ) : step === 1 ? (
        <>
          <p className="avm-section-title">Address Information</p>
          <div className="avm-grid">
            <div className="avm-field full">
              <label className="avm-label d-flex align-items-center gap-8" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="sameAsGuardianAddress"
                  checked={form.sameAsGuardianAddress}
                  onChange={handleChange(setter)}
                />
                Same as Guardian Address
              </label>
            </div>

            <FormField label="Present Address" full>
              <textarea
                rows="4"
                className="avm-input avm-textarea"
                id="presentAddress"
                placeholder="Present Address"
                value={form.presentAddress}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Permanent Address" full>
              <textarea
                rows="4"
                className="avm-input avm-textarea"
                id="permanentAddress"
                placeholder="Permanent Address"
                value={form.permanentAddress}
                onChange={handleChange(setter)}
              />
            </FormField>
          </div>

          <p className="avm-section-title" style={{ marginTop: '1.5rem' }}>Previous School</p>
          <div className="avm-grid">
            <FormField label="School Name" full>
              <input
                type="text"
                className="avm-input"
                id="previousSchoolName"
                placeholder="School Name"
                value={form.previousSchoolName}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Class" full>
              <input
                type="text"
                className="avm-input"
                id="previousClass"
                placeholder="Previous Class"
                value={form.previousClass}
                onChange={handleChange(setter)}
              />
            </FormField>

            {renderUploadField(
              'Transfer Certificate',
              refs.transferCertificateRef,
              previews.transferCertificate,
              (e) => handlePhotoChange(e, 'transferCertificate', setPreviewState, setter),
              'Dimension:- Max-W: 1200px, Max-H: 600px',
              'Image file format: .jpg, .jpeg, .png or .gif',
            )}
          </div>
        </>
      ) : step === 2 ? (
        <>
          <p className="avm-section-title">Academic Information</p>
          <div className="avm-grid">
            <FormField label="Student Type">
              <select className="avm-select" id="studentType" value={form.studentType} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                <option>Day Scholar</option>
                <option>Hosteller</option>
                <option>Transport</option>
              </select>
            </FormField>

            <FormField label="Class" required>
              <select className="avm-select" id="className" value={form.className} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                <option>6</option>
                <option>7</option>
                <option>8</option>
                <option>9</option>
                <option>10</option>
                <option>11</option>
                <option>12</option>
              </select>
            </FormField>

            <FormField label="Section" required>
              <select className="avm-select" id="section" value={form.section} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                <option>A</option>
                <option>B</option>
                <option>C</option>
                <option>D</option>
              </select>
            </FormField>

            <FormField label="Group">
              <select className="avm-select" id="group" value={form.group} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                <option>Science</option>
                <option>Commerce</option>
                <option>Arts</option>
              </select>
            </FormField>

            <FormField label="Roll No" required>
              <input
                type="text"
                className="avm-input"
                id="rollNo"
                placeholder="Roll No"
                value={form.rollNo}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Registration No">
              <input
                type="text"
                className="avm-input"
                id="registrationNo"
                placeholder="Registration No"
                value={form.registrationNo}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Discount">
              <select className="avm-select" id="discount" value={form.discount} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                <option>No Discount</option>
                <option>10%</option>
                <option>20%</option>
                <option>50%</option>
              </select>
            </FormField>

            <FormField label="Second Language">
              <input
                type="text"
                className="avm-input"
                id="secondLanguage"
                placeholder="Second Language"
                value={form.secondLanguage}
                onChange={handleChange(setter)}
              />
            </FormField>
          </div>

          <p className="avm-section-title" style={{ marginTop: '1.5rem' }}>Guardian Information</p>
          <div className="avm-grid">
            <FormField label="Is Guardian?" required>
              <select className="avm-select" id="isGuardian" value={form.isGuardian} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                <option>Father</option>
                <option>Mother</option>
                <option>Other</option>
              </select>
            </FormField>

            <FormField label="Relation With Guardian">
              <input
                type="text"
                className="avm-input"
                id="relationWithGuardian"
                placeholder="Relation With Guardian"
                value={form.relationWithGuardian}
                onChange={handleChange(setter)}
              />
            </FormField>
          </div>
        </>
      ) : (
        <>
          <p className="avm-section-title">Father Information</p>
          <div className="avm-grid">
            <FormField label="Father Name">
              <input
                type="text"
                className="avm-input"
                id="fatherName"
                placeholder="Father Name"
                value={form.fatherName}
                onChange={handleChange(setter)}
              />
            </FormField>

            <PhoneField
              id="fatherPhone"
              label="Phone number"
              value={form.fatherPhone}
              onChange={(fullValue) => setter((prev) => ({ ...prev, fatherPhone: fullValue }))}
            />

            <FormField label="Father Education">
              <input
                type="text"
                className="avm-input"
                id="fatherEducation"
                placeholder="Father Education"
                value={form.fatherEducation}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Father Profession">
              <input
                type="text"
                className="avm-input"
                id="fatherProfession"
                placeholder="Father Profession"
                value={form.fatherProfession}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Father Designation">
              <input
                type="text"
                className="avm-input"
                id="fatherDesignation"
                placeholder="Father Designation"
                value={form.fatherDesignation}
                onChange={handleChange(setter)}
              />
            </FormField>

            {renderUploadField(
              'Father Photo',
              refs.fatherPhotoRef,
              previews.fatherPhoto,
              (e) => handlePhotoChange(e, 'fatherPhoto', setPreviewState, setter),
              'Dimension:- Max-W: 120px, Max-H: 130px',
              'Image file format: .jpg, .jpeg, .png or .gif',
            )}
          </div>

          <p className="avm-section-title" style={{ marginTop: '1.5rem' }}>Mother Information</p>
          <div className="avm-grid">
            <FormField label="Mother Name">
              <input
                type="text"
                className="avm-input"
                id="motherName"
                placeholder="Mother Name"
                value={form.motherName}
                onChange={handleChange(setter)}
              />
            </FormField>

            <PhoneField
              id="motherPhone"
              label="Phone number"
              value={form.motherPhone}
              onChange={(fullValue) => setter((prev) => ({ ...prev, motherPhone: fullValue }))}
            />

            <FormField label="Mother Education">
              <input
                type="text"
                className="avm-input"
                id="motherEducation"
                placeholder="Mother Education"
                value={form.motherEducation}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Mother Profession">
              <input
                type="text"
                className="avm-input"
                id="motherProfession"
                placeholder="Mother Profession"
                value={form.motherProfession}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Mother Designation">
              <input
                type="text"
                className="avm-input"
                id="motherDesignation"
                placeholder="Mother Designation"
                value={form.motherDesignation}
                onChange={handleChange(setter)}
              />
            </FormField>

            {renderUploadField(
              'Mother Photo',
              refs.motherPhotoRef,
              previews.motherPhoto,
              (e) => handlePhotoChange(e, 'motherPhoto', setPreviewState, setter),
              'Dimension:- Max-W: 120px, Max-H: 130px',
              'Image file format: .jpg, .jpeg, .png or .gif',
            )}
          </div>

          <p className="avm-section-title" style={{ marginTop: '1.5rem' }}>Other Information</p>
          <div className="avm-grid">
            <FormField label="Username" required>
              <input
                type="text"
                className="avm-input"
                id="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Password" required>
              <div style={{ position: 'relative' }}>
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  className="avm-input"
                  id="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange(setter)}
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((prev) => !prev)}
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                  className="border-0 bg-transparent text-secondary-light"
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    lineHeight: 1,
                  }}
                >
                  <i className={isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                </button>
              </div>
            </FormField>

            <FormField label="Health Condition" full>
              <input
                type="text"
                className="avm-input"
                id="healthCondition"
                placeholder="Health Condition"
                value={form.healthCondition}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Other Info" full>
              <textarea
                rows="4"
                className="avm-input avm-textarea"
                id="otherInfo"
                placeholder="Other Info"
                value={form.otherInfo}
                onChange={handleChange(setter)}
              />
            </FormField>

            {renderUploadField(
              'Photo',
              refs.studentPhotoRef,
              previews.photo,
              (e) => handlePhotoChange(e, 'photo', setPreviewState, setter),
              'Dimension:- Max-W: 120px, Max-H: 130px',
              'Image file format: .jpg, .jpeg, .png or .gif',
            )}
          </div>

          <div
            className="mt-16 radius-8"
            style={{
              background: '#fff7e6',
              border: '1px solid #f3d18b',
              color: '#8a5a00',
              padding: '0.9rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Instruction: Please add Guardian, Class &amp; Section before add Student.
          </div>
        </>
      )}
    </>
  )

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Student</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Student</span>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-12">

          <button
            type="button"
            className="btn btn-light border d-flex align-items-center gap-6"
            onClick={() => onNavigate?.('bulk-admission')}
          >
            <span className="d-flex text-md">
              <i className="ri-download-cloud-2-line"></i>
            </span>
            Import
          </button>

          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={openAdd}
          >
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add Student
          </button>
        </div>
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
                placeholder="Search student..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1100 }}>
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
                  {visibleColumns.group ? <th scope="col">Group</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.section ? <th scope="col">Section</th> : null}
                  {visibleColumns.rollNo ? <th scope="col">Roll No</th> : null}
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
                      No students found.
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
                              <img src={row.photo} alt={row.name} className="w-100 h-100 object-fit-cover" />
                            ) : (
                              <i className="ri-user-line text-secondary-light"></i>
                            )}
                          </div>
                        </td>
                      ) : null}
                      {visibleColumns.name ? <td className="fw-medium text-primary-light">{row.name}</td> : null}
                      {visibleColumns.group ? <td>{row.group}</td> : null}
                      {visibleColumns.className ? <td>{row.className}</td> : null}
                      {visibleColumns.section ? <td>{row.section}</td> : null}
                      {visibleColumns.rollNo ? <td>{row.rollNo}</td> : null}
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

      <WizardPopup
        modalWidth="700px"
        open={isAddOpen}
        title="Add Student"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsAddOpen(false)}
        submitLabel="Save"
      >
        {renderForm(
          addForm,
          setAddForm,
          addStep,
          addPreviews,
          {
            fatherPhotoRef: addFatherPhotoRef,
            motherPhotoRef: addMotherPhotoRef,
            transferCertificateRef: addTransferCertificateRef,
            studentPhotoRef: addStudentPhotoRef,
          },
          setAddPreviews,
          isAddPasswordVisible,
          setIsAddPasswordVisible,
        )}
      </WizardPopup>

      <WizardPopup
        modalWidth="700px"
        open={isEditOpen}
        title="Edit Student"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsEditOpen(false)}
        submitLabel="Update"
      >
        {renderForm(
          editForm,
          setEditForm,
          editStep,
          editPreviews,
          {
            fatherPhotoRef: editFatherPhotoRef,
            motherPhotoRef: editMotherPhotoRef,
            transferCertificateRef: editTransferCertificateRef,
            studentPhotoRef: editStudentPhotoRef,
          },
          setEditPreviews,
          isEditPasswordVisible,
          setIsEditPasswordVisible,
        )}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Students"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
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
              {schoolOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="className" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class
            </label>
            <select
              id="className"
              className="form-control form-select"
              value={pendingFilters.className}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select</option>
              {classOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="section" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Section
            </label>
            <select
              id="section"
              className="form-control form-select"
              value={pendingFilters.section}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select</option>
              {sectionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="group" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Group
            </label>
            <select
              id="group"
              className="form-control form-select"
              value={pendingFilters.group}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select</option>
              {groupOptions.map((option) => (
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

export default StudentList

