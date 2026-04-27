import { useMemo, useRef, useState, useEffect } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import PhoneField from '../components/PhoneField'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { fetchStudentsPage, createStudent, updateStudent, deleteStudent } from '../apis/studentsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import '../assets/css/addModalShared.css'

const emptyForm = {
  id: null,
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
  schoolId: '',
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

const buildPayload = (form) => ({
  schoolId: form.school ? Number(form.school) : null,
  name: form.name,
  admissionNo: form.admissionNo,
  admissionDate: form.admissionDate || null,
  birthDate: form.birthDate || null,
  gender: form.gender || null,
  bloodGroup: form.bloodGroup || null,
  religion: form.religion || null,
  caste: form.caste || null,
  phone: form.phone || null,
  email: form.email || null,
  nationalId: form.nationalId || null,
  studentType: form.studentType || null,
  className: form.className || null,
  section: form.section || null,
  group: form.group || null,
  rollNo: form.rollNo || null,
  registrationNo: form.registrationNo || null,
  discount: form.discount || null,
  secondLanguage: form.secondLanguage || null,
  isGuardian: form.isGuardian || null,
  relationWithGuardian: form.relationWithGuardian || null,
  fatherName: form.fatherName || null,
  fatherPhone: form.fatherPhone || null,
  fatherEducation: form.fatherEducation || null,
  fatherProfession: form.fatherProfession || null,
  fatherDesignation: form.fatherDesignation || null,
  motherName: form.motherName || null,
  motherPhone: form.motherPhone || null,
  motherEducation: form.motherEducation || null,
  motherProfession: form.motherProfession || null,
  motherDesignation: form.motherDesignation || null,
  presentAddress: form.presentAddress || null,
  permanentAddress: form.permanentAddress || null,
  sameAsGuardianAddress: form.sameAsGuardianAddress || false,
  previousSchoolName: form.previousSchoolName || null,
  previousClass: form.previousClass || null,
  username: form.username,
  password: form.password || null,
  healthCondition: form.healthCondition || null,
  otherInfo: form.otherInfo || null,
})

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
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalElements, setTotalElements] = useState(0)
  const [serverTotalPages, setServerTotalPages] = useState(1)
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
  const [submitError, setSubmitError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [schoolList, setSchoolList] = useState([])

  const [addPreviews, setAddPreviews] = useState({
    fatherPhoto: null, motherPhoto: null, transferCertificate: null, photo: null,
  })
  const [editPreviews, setEditPreviews] = useState({
    fatherPhoto: null, motherPhoto: null, transferCertificate: null, photo: null,
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

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetchStudentsPage(currentPage - 1, rowsPerPage, {
          schoolId: filters.schoolId || undefined,
          className: filters.className !== 'Select' ? filters.className : undefined,
          section: filters.section !== 'Select' ? filters.section : undefined,
          group: filters.group !== 'Select' ? filters.group : undefined,
        })
        if (!cancelled) {
          setStudents(res.content || [])
          setServerTotalPages(res.totalPages || 1)
          setTotalElements(res.totalElements || 0)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [currentPage, rowsPerPage, filters, refreshKey])

  useEffect(() => {
    fetchSchoolsLookup().then(setSchoolList).catch(() => {})
  }, [])

  const schoolOptions = useMemo(() => {
    const map = new Map()
    students.forEach((s) => {
      if (s.schoolId) map.set(s.schoolId, s.schoolName || `School ${s.schoolId}`)
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [students])

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return students
    return students.filter((row) =>
      [row.schoolName, row.name, row.group, row.className, row.section, row.rollNo, row.email]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [search, students])

  const totalPages = serverTotalPages
  const allSelected = displayed.length > 0 && displayed.every((row) => selectedRows.includes(row.id))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...displayed.map((row) => row.id)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !displayed.some((row) => row.id === id)))
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
    setAddPreviews({ fatherPhoto: null, motherPhoto: null, transferCertificate: null, photo: null })
    setAddStep(0)
    setSubmitError(null)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditForm({
      id: row.id,
      school: row.schoolId ? String(row.schoolId) : '',
      name: row.name || '',
      admissionNo: row.admissionNo || '',
      admissionDate: row.admissionDate || '',
      birthDate: row.birthDate || '',
      gender: row.gender || '',
      bloodGroup: row.bloodGroup || '',
      religion: row.religion || '',
      caste: row.caste || '',
      phone: row.phone || '',
      email: row.email || '',
      nationalId: row.nationalId || '',
      studentType: row.studentType || '',
      className: row.className || '',
      section: row.section || '',
      group: row.group || '',
      rollNo: row.rollNo || '',
      registrationNo: row.registrationNo || '',
      discount: row.discount || '',
      secondLanguage: row.secondLanguage || '',
      isGuardian: row.isGuardian || '',
      relationWithGuardian: row.relationWithGuardian || '',
      fatherName: row.fatherName || '',
      fatherPhone: row.fatherPhone || '',
      fatherEducation: row.fatherEducation || '',
      fatherProfession: row.fatherProfession || '',
      fatherDesignation: row.fatherDesignation || '',
      fatherPhoto: null,
      motherName: row.motherName || '',
      motherPhone: row.motherPhone || '',
      motherEducation: row.motherEducation || '',
      motherProfession: row.motherProfession || '',
      motherDesignation: row.motherDesignation || '',
      motherPhoto: null,
      presentAddress: row.presentAddress || '',
      permanentAddress: row.permanentAddress || '',
      sameAsGuardianAddress: row.sameAsGuardianAddress || false,
      previousSchoolName: row.previousSchoolName || '',
      previousClass: row.previousClass || '',
      transferCertificate: null,
      username: row.username || '',
      password: '',
      healthCondition: row.healthCondition || '',
      otherInfo: row.otherInfo || '',
      photo: null,
    })
    setIsEditPasswordVisible(false)
    setEditPreviews({
      fatherPhoto: row.fatherPhotoUrl || null,
      motherPhoto: row.motherPhotoUrl || null,
      transferCertificate: row.transferCertificateUrl || null,
      photo: row.photoUrl || null,
    })
    setEditStep(0)
    setSubmitError(null)
    setIsEditOpen(true)
  }

  const handleAddSubmit = async () => {
    setSubmitError(null)
    try {
      await createStudent(buildPayload(addForm))
      setIsAddOpen(false)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setSubmitError(err.message)
    }
  }

  const handleEditSubmit = async () => {
    setSubmitError(null)
    try {
      await updateStudent(editForm.id, buildPayload(editForm))
      setIsEditOpen(false)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setSubmitError(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return
    try {
      await deleteStudent(id)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      alert(err.message)
    }
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
            style={{ width: 60, height: 65, objectFit: 'cover', borderRadius: 8, border: '1px solid #d0d5dd' }}
          />
        )}
      </div>
      <span style={{ fontSize: '0.78rem', color: '#7a8a9a', marginTop: 4 }}>{note1}</span>
      <span style={{ fontSize: '0.78rem', color: '#7a8a9a', marginTop: 4 }}>{note2}</span>
    </div>
  )

  const renderForm = (
    form, setter, step, previews, refs, setPreviewState, isPasswordVisible, setIsPasswordVisible,
  ) => (
    <>
      {step === 0 ? (
        <>
          <p className="avm-section-title">Basic Information</p>
          <div className="avm-grid">
            <FormField label="School Name" required full>
              <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
                <option value="">--Select School--</option>
                {schoolList.map((s) => (
                  <option key={s.id} value={s.id}>{s.schoolName}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Name" required>
              <input type="text" className="avm-input" id="name" placeholder="Name" value={form.name} onChange={handleChange(setter)} />
            </FormField>

            <FormField label="Admission No" required>
              <input type="text" className="avm-input" id="admissionNo" placeholder="Admission No" value={form.admissionNo} onChange={handleChange(setter)} />
            </FormField>

            <FormField label="Admission Date" required>
              <input type="date" className="avm-input" id="admissionDate" value={form.admissionDate} onChange={handleChange(setter)} />
            </FormField>

            <FormField label="Birth Date" required>
              <input type="date" className="avm-input" id="birthDate" value={form.birthDate} onChange={handleChange(setter)} />
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
                <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
              </select>
            </FormField>

            <FormField label="Religion">
              <input type="text" className="avm-input" id="religion" placeholder="Religion" value={form.religion} onChange={handleChange(setter)} />
            </FormField>

            <FormField label="Caste">
              <input type="text" className="avm-input" id="caste" placeholder="Caste" value={form.caste} onChange={handleChange(setter)} />
            </FormField>

            <PhoneField
              id="phone" label="Phone number" required value={form.phone}
              onChange={(v) => setter((prev) => ({ ...prev, phone: v }))}
            />

            <FormField label="Email">
              <input type="email" className="avm-input" id="email" placeholder="Email" value={form.email} onChange={handleChange(setter)} />
            </FormField>

            <FormField label="National ID">
              <input type="text" className="avm-input" id="nationalId" placeholder="National ID" value={form.nationalId} onChange={handleChange(setter)} />
            </FormField>
          </div>
        </>
      ) : step === 1 ? (
        <>
          <p className="avm-section-title">Address Information</p>
          <div className="avm-grid">
            <div className="avm-field full">
              <label className="avm-label d-flex align-items-center gap-8" style={{ cursor: 'pointer' }}>
                <input type="checkbox" id="sameAsGuardianAddress" checked={form.sameAsGuardianAddress} onChange={handleChange(setter)} />
                Same as Guardian Address
              </label>
            </div>

            <FormField label="Present Address" full>
              <textarea rows="4" className="avm-input avm-textarea" id="presentAddress" placeholder="Present Address" value={form.presentAddress} onChange={handleChange(setter)} />
            </FormField>

            <FormField label="Permanent Address" full>
              <textarea rows="4" className="avm-input avm-textarea" id="permanentAddress" placeholder="Permanent Address" value={form.permanentAddress} onChange={handleChange(setter)} />
            </FormField>
          </div>

          <p className="avm-section-title" style={{ marginTop: '1.5rem' }}>Previous School</p>
          <div className="avm-grid">
            <FormField label="School Name" full>
              <input type="text" className="avm-input" id="previousSchoolName" placeholder="School Name" value={form.previousSchoolName} onChange={handleChange(setter)} />
            </FormField>

            <FormField label="Class" full>
              <input type="text" className="avm-input" id="previousClass" placeholder="Previous Class" value={form.previousClass} onChange={handleChange(setter)} />
            </FormField>

            {renderUploadField(
              'Transfer Certificate', refs.transferCertificateRef, previews.transferCertificate,
              (e) => handlePhotoChange(e, 'transferCertificate', setPreviewState, setter),
              'Dimension:- Max-W: 1200px, Max-H: 600px', 'Image file format: .jpg, .jpeg, .png or .gif',
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
                <option>Day Scholar</option><option>Hosteller</option><option>Transport</option>
              </select>
            </FormField>

            <FormField label="Class" required>
              <select className="avm-select" id="className" value={form.className} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                <option>6</option><option>7</option><option>8</option><option>9</option>
                <option>10</option><option>11</option><option>12</option>
              </select>
            </FormField>

            <FormField label="Section" required>
              <select className="avm-select" id="section" value={form.section} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                <option>A</option><option>B</option><option>C</option><option>D</option>
              </select>
            </FormField>

            <FormField label="Group">
              <select className="avm-select" id="group" value={form.group} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                <option>Science</option><option>Commerce</option><option>Arts</option>
              </select>
            </FormField>

            <FormField label="Roll No" required>
              <input type="text" className="avm-input" id="rollNo" placeholder="Roll No" value={form.rollNo} onChange={handleChange(setter)} />
            </FormField>

            <FormField label="Registration No">
              <input type="text" className="avm-input" id="registrationNo" placeholder="Registration No" value={form.registrationNo} onChange={handleChange(setter)} />
            </FormField>

            <FormField label="Discount">
              <select className="avm-select" id="discount" value={form.discount} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                <option>No Discount</option><option>10%</option><option>20%</option><option>50%</option>
              </select>
            </FormField>

            <FormField label="Second Language">
              <input type="text" className="avm-input" id="secondLanguage" placeholder="Second Language" value={form.secondLanguage} onChange={handleChange(setter)} />
            </FormField>
          </div>

          <p className="avm-section-title" style={{ marginTop: '1.5rem' }}>Guardian Information</p>
          <div className="avm-grid">
            <FormField label="Is Guardian?" required>
              <select className="avm-select" id="isGuardian" value={form.isGuardian} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                <option>Father</option><option>Mother</option><option>Other</option>
              </select>
            </FormField>

            <FormField label="Relation With Guardian">
              <input type="text" className="avm-input" id="relationWithGuardian" placeholder="Relation With Guardian" value={form.relationWithGuardian} onChange={handleChange(setter)} />
            </FormField>
          </div>
        </>
      ) : (
        <>
          <p className="avm-section-title">Father Information</p>
          <div className="avm-grid">
            <FormField label="Father Name">
              <input type="text" className="avm-input" id="fatherName" placeholder="Father Name" value={form.fatherName} onChange={handleChange(setter)} />
            </FormField>

            <PhoneField
              id="fatherPhone" label="Phone number" value={form.fatherPhone}
              onChange={(v) => setter((prev) => ({ ...prev, fatherPhone: v }))}
            />

            <FormField label="Father Education">
              <input type="text" className="avm-input" id="fatherEducation" placeholder="Father Education" value={form.fatherEducation} onChange={handleChange(setter)} />
            </FormField>

            <FormField label="Father Profession">
              <input type="text" className="avm-input" id="fatherProfession" placeholder="Father Profession" value={form.fatherProfession} onChange={handleChange(setter)} />
            </FormField>

            <FormField label="Father Designation">
              <input type="text" className="avm-input" id="fatherDesignation" placeholder="Father Designation" value={form.fatherDesignation} onChange={handleChange(setter)} />
            </FormField>

            {renderUploadField(
              'Father Photo', refs.fatherPhotoRef, previews.fatherPhoto,
              (e) => handlePhotoChange(e, 'fatherPhoto', setPreviewState, setter),
              'Dimension:- Max-W: 120px, Max-H: 130px', 'Image file format: .jpg, .jpeg, .png or .gif',
            )}
          </div>

          <p className="avm-section-title" style={{ marginTop: '1.5rem' }}>Mother Information</p>
          <div className="avm-grid">
            <FormField label="Mother Name">
              <input type="text" className="avm-input" id="motherName" placeholder="Mother Name" value={form.motherName} onChange={handleChange(setter)} />
            </FormField>

            <PhoneField
              id="motherPhone" label="Phone number" value={form.motherPhone}
              onChange={(v) => setter((prev) => ({ ...prev, motherPhone: v }))}
            />

            <FormField label="Mother Education">
              <input type="text" className="avm-input" id="motherEducation" placeholder="Mother Education" value={form.motherEducation} onChange={handleChange(setter)} />
            </FormField>

            <FormField label="Mother Profession">
              <input type="text" className="avm-input" id="motherProfession" placeholder="Mother Profession" value={form.motherProfession} onChange={handleChange(setter)} />
            </FormField>

            <FormField label="Mother Designation">
              <input type="text" className="avm-input" id="motherDesignation" placeholder="Mother Designation" value={form.motherDesignation} onChange={handleChange(setter)} />
            </FormField>

            {renderUploadField(
              'Mother Photo', refs.motherPhotoRef, previews.motherPhoto,
              (e) => handlePhotoChange(e, 'motherPhoto', setPreviewState, setter),
              'Dimension:- Max-W: 120px, Max-H: 130px', 'Image file format: .jpg, .jpeg, .png or .gif',
            )}
          </div>

          <p className="avm-section-title" style={{ marginTop: '1.5rem' }}>Other Information</p>
          <div className="avm-grid">
            <FormField label="Username" required>
              <input type="text" className="avm-input" id="username" placeholder="Username" value={form.username} onChange={handleChange(setter)} />
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
                  style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', lineHeight: 1 }}
                >
                  <i className={isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                </button>
              </div>
            </FormField>

            <FormField label="Health Condition" full>
              <input type="text" className="avm-input" id="healthCondition" placeholder="Health Condition" value={form.healthCondition} onChange={handleChange(setter)} />
            </FormField>

            <FormField label="Other Info" full>
              <textarea rows="4" className="avm-input avm-textarea" id="otherInfo" placeholder="Other Info" value={form.otherInfo} onChange={handleChange(setter)} />
            </FormField>

            {renderUploadField(
              'Photo', refs.studentPhotoRef, previews.photo,
              (e) => handlePhotoChange(e, 'photo', setPreviewState, setter),
              'Dimension:- Max-W: 120px, Max-H: 130px', 'Image file format: .jpg, .jpeg, .png or .gif',
            )}
          </div>

          <div
            className="mt-16 radius-8"
            style={{ background: '#fff7e6', border: '1px solid #f3d18b', color: '#8a5a00', padding: '0.9rem 1rem', fontSize: '0.85rem', fontWeight: 500 }}
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
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Student</span>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-12">
          <button type="button" className="btn btn-light border d-flex align-items-center gap-6" onClick={() => onNavigate?.('bulk-admission')}>
            <span className="d-flex text-md"><i className="ri-download-cloud-2-line"></i></span>
            Import
          </button>
          <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <span className="d-flex text-md"><i className="ri-add-large-line"></i></span>
            Add Student
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-16" role="alert">{error}</div>}

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
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
                      <i className="ri-file-3-line"></i> PDF
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
                      <i className="ri-file-excel-2-line"></i> Excel
                    </button>
                  </li>
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

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }}
              >
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading...
                    </td>
                  </tr>
                ) : displayed.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  displayed.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input" type="checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">
                            {(currentPage - 1) * rowsPerPage + idx + 1}
                          </label>
                        </div>
                      </td>
                      {visibleColumns.school ? <td>{row.schoolName}</td> : null}
                      {visibleColumns.photo ? (
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
                            onClick={() => handleDelete(row.id)}
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
              Showing {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, totalElements)} of {totalElements}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button
                type="button" className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              {getVisiblePages().map((p) => (
                <button
                  key={p} type="button"
                  className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button" className="btn btn-sm btn-light border"
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
        onSubmit={handleAddSubmit}
        submitLabel="Save"
      >
        {submitError && <div className="alert alert-danger mx-20 mt-16">{submitError}</div>}
        {renderForm(
          addForm, setAddForm, addStep, addPreviews,
          { fatherPhotoRef: addFatherPhotoRef, motherPhotoRef: addMotherPhotoRef, transferCertificateRef: addTransferCertificateRef, studentPhotoRef: addStudentPhotoRef },
          setAddPreviews, isAddPasswordVisible, setIsAddPasswordVisible,
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
        onSubmit={handleEditSubmit}
        submitLabel="Update"
      >
        {submitError && <div className="alert alert-danger mx-20 mt-16">{submitError}</div>}
        {renderForm(
          editForm, setEditForm, editStep, editPreviews,
          { fatherPhotoRef: editFatherPhotoRef, motherPhotoRef: editMotherPhotoRef, transferCertificateRef: editTransferCertificateRef, studentPhotoRef: editStudentPhotoRef },
          setEditPreviews, isEditPasswordVisible, setIsEditPasswordVisible,
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
            <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
            <select id="schoolId" className="form-control form-select" value={pendingFilters.schoolId} onChange={handlePendingFilterChange}>
              <option value="">Select School</option>
              {schoolOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="className" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Class</label>
            <select id="className" className="form-control form-select" value={pendingFilters.className} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              <option>6</option><option>7</option><option>8</option><option>9</option>
              <option>10</option><option>11</option><option>12</option>
            </select>
          </div>

          <div>
            <label htmlFor="section" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Section</label>
            <select id="section" className="form-control form-select" value={pendingFilters.section} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              <option>A</option><option>B</option><option>C</option><option>D</option>
            </select>
          </div>

          <div>
            <label htmlFor="group" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Group</label>
            <select id="group" className="form-control form-select" value={pendingFilters.group} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              <option>Science</option><option>Commerce</option><option>Arts</option>
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

export default StudentList
