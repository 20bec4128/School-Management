import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { createStudent, updateStudent } from '../apis/studentsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchStudentTypesLookup } from '../apis/studentTypeApi'
import PhoneCodeField from '../components/PhoneCodeField'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { findSchoolById } from '../utils/schoolScope'
import '../assets/css/addModalShared.css'

const TABS = ['Basic Information', 'Academic Information', 'Guardian Information', 'Address Information', 'Previous School', 'Other Information']
const EDIT_STORAGE_KEY = 'edit-student-row'
const DEFAULT_PHONE_CODE = '+91'

const emptyForm = {
  id: null,
  schoolId: '',
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
  classId: '',
  className: '',
  sectionId: '',
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
  fatherEmail: '',
  fatherPhoto: null,
  motherName: '',
  motherPhone: '',
  motherEducation: '',
  motherProfession: '',
  motherDesignation: '',
  motherEmail: '',
  motherPhoto: null,
  guardianEmail: '',
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
  parentUsername: '',
  parentPassword: '',
  healthCondition: '',
  otherInfo: '',
  photo: null,
}

const combinePhoneValue = (code, number) => {
  const normalizedNumber = String(number || '').replace(/\D/g, '').trim()
  const normalizedCode = String(code || DEFAULT_PHONE_CODE).trim() || DEFAULT_PHONE_CODE
  return normalizedNumber ? `${normalizedCode} ${normalizedNumber}` : null
}

const splitPhoneValue = (fullValue) => {
  const trimmed = String(fullValue || '').trim()
  if (!trimmed) return { code: DEFAULT_PHONE_CODE, number: '' }
  if (!trimmed.startsWith('+')) return { code: DEFAULT_PHONE_CODE, number: trimmed.replace(/\D/g, '') }
  const compact = trimmed.replace(/[\s()-]+/g, '')
  const prefixed = compact.match(/^(\+\d{1,4})(\d{6,})$/)
  if (prefixed) {
    return { code: prefixed[1], number: prefixed[2] }
  }
  const parts = trimmed.split(/\s+/)
  const code = parts[0] || DEFAULT_PHONE_CODE
  const number = parts.slice(1).join('').replace(/\D/g, '')
  return { code, number: number || compact.replace(/^\+\d{1,4}/, '').replace(/\D/g, '') }
}

const buildPayload = (form, phoneCodes) => ({
  schoolId: form.schoolId ? Number(form.schoolId) : null,
  name: form.name,
  admissionNo: form.admissionNo,
  admissionDate: form.admissionDate || null,
  birthDate: form.birthDate || null,
  gender: form.gender || null,
  bloodGroup: form.bloodGroup || null,
  religion: form.religion || null,
  caste: form.caste || null,
  phone: combinePhoneValue(phoneCodes.phone, form.phone),
  email: form.email || null,
  nationalId: form.nationalId || null,
  studentType: form.studentType || null,
  classId: form.classId ? Number(form.classId) : null,
  className: form.className || null,
  sectionId: form.sectionId ? Number(form.sectionId) : null,
  section: form.section || null,
  group: form.group || null,
  rollNo: form.rollNo || null,
  registrationNo: form.registrationNo || null,
  discount: form.discount || null,
  secondLanguage: form.secondLanguage || null,
  isGuardian: form.isGuardian || null,
  relationWithGuardian: form.relationWithGuardian || null,
  fatherName: form.fatherName || null,
  fatherPhone: combinePhoneValue(phoneCodes.fatherPhone, form.fatherPhone),
  fatherEducation: form.fatherEducation || null,
  fatherProfession: form.fatherProfession || null,
  fatherDesignation: form.fatherDesignation || null,
  fatherEmail: form.fatherEmail || null,
  motherName: form.motherName || null,
  motherPhone: combinePhoneValue(phoneCodes.motherPhone, form.motherPhone),
  motherEducation: form.motherEducation || null,
  motherProfession: form.motherProfession || null,
  motherDesignation: form.motherDesignation || null,
  motherEmail: form.motherEmail || null,
  guardianEmail: form.guardianEmail || null,
  presentAddress: form.presentAddress || null,
  permanentAddress: form.permanentAddress || null,
  sameAsGuardianAddress: form.sameAsGuardianAddress || false,
  previousSchoolName: form.previousSchoolName || null,
  previousClass: form.previousClass || null,
  username: form.username,
  password: form.password || null,
  parentUsername: combinePhoneValue(phoneCodes.parentUsername, form.parentUsername),
  parentPassword: form.parentPassword || null,
  healthCondition: form.healthCondition || null,
  otherInfo: form.otherInfo || null,
})

const findMatchingClassOption = (value, classOptions) =>
  classOptions.find((item) =>
    [String(item?.id ?? ''), item?.className, item?.numericName, item?.name].some(
      (candidate) => String(candidate) === String(value),
    ),
  )

const readEditRow = () => {
  try {
    const raw = sessionStorage.getItem(EDIT_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const normalizeEditRow = (row) => {
  if (!row) return null

  const pPhone = splitPhoneValue(row.phone)
  const fPhone = splitPhoneValue(row.fatherPhone)
  const mPhone = splitPhoneValue(row.motherPhone)
  const uPhone = splitPhoneValue(row.parentUsername)

  return {
    ...emptyForm,
    ...row,
    id: row.id ?? null,
    schoolId: row.schoolId != null ? String(row.schoolId) : '',
    classId: row.classId != null ? String(row.classId) : '',
    sectionId: row.sectionId != null ? String(row.sectionId) : '',
    phone: pPhone.number,
    fatherPhone: fPhone.number,
    motherPhone: mPhone.number,
    parentUsername: uPhone.number,
    sameAsGuardianAddress: Boolean(row.sameAsGuardianAddress),
    password: '',
    parentPassword: '',
  }
}

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
  'Father Email': 'ri-mail-line',
  'Mother Name': 'ri-user-line',
  'Mother Email': 'ri-mail-line',
  'Is Guardian?': 'ri-shield-user-line',
  'Relation With Guardian': 'ri-links-line',
  'Guardian Email': 'ri-mail-line',
  'Present Address': 'ri-map-pin-2-line',
  'Permanent Address': 'ri-home-4-line',
  Username: 'ri-at-line',
  Password: 'ri-lock-2-line',
  'Student Username': 'ri-at-line',
  'Student Password': 'ri-lock-2-line',
  'Parent Mobile': 'ri-smartphone-line',
  'Parent Password': 'ri-lock-password-line',
  'Health Condition': 'ri-heart-add-line',
  'Other Info': 'ri-information-line',
}

const FormField = ({ label, required, children, full = false, noIcon = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={full ? 'col-12 mb-20' : 'col-md-6 mb-20'}>
      <label className="form-label fw-semibold text-primary-light mb-8 d-block">
        {label} {required && <span className="text-danger-600">*</span>}
      </label>
      <div className="avm-input-with-icon" style={{ position: 'relative' }}>
        {!noIcon && (
          <span
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#667085',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          >
            <i className={icon}></i>
          </span>
        )}
        {children}
      </div>
    </div>
  )
}

const ImageUploadField = ({ label, id, preview, onChange, helperText }) => {
  const inputRef = useRef(null)
  return (
    <div className="col-md-6 mb-20">
      <label className="form-label fw-semibold text-primary-light mb-8 d-block">{label}</label>
      <div
        className="border border-neutral-300 radius-8 p-16 text-center cursor-pointer"
        style={{ minHeight: 140, background: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Preview" style={{ maxHeight: 100, maxWidth: '100%', borderRadius: 6 }} />
        ) : (
          <>
            <i className="ri-image-add-line text-3xl text-secondary-light d-block mb-8" />
            <span className="text-xs text-secondary-light">Click to upload {label}</span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.gif"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files[0]
          if (file) onChange(id, file)
        }}
      />
      {helperText ? <div className="text-xs text-secondary-light mt-8">{helperText}</div> : null}
    </div>
  )
}

const AddStudent = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [initialEditRow] = useState(() => readEditRow())
  const [activeTab, setActiveTab] = useState(0)
  const [schools, setSchools] = useState([])
  const [studentTypeOptions, setStudentTypeOptions] = useState([])
  const [classOptions, setClassOptions] = useState([])
  const [sectionOptions, setSectionOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [phoneCodes, setPhoneCodes] = useState({
    phone: DEFAULT_PHONE_CODE,
    fatherPhone: DEFAULT_PHONE_CODE,
    motherPhone: DEFAULT_PHONE_CODE,
    parentUsername: DEFAULT_PHONE_CODE,
  })

  const [previews, setPreviews] = useState({
    fatherPhoto: null, motherPhoto: null, transferCertificate: null, photo: null,
  })

  const [form, setForm] = useState(() => {
    if (initialEditRow) return normalizeEditRow(initialEditRow)
    const listSchoolId = isSuperAdmin ? (activeSchoolId ? String(activeSchoolId) : '') : (authSchoolId ? String(authSchoolId) : '')
    return { ...emptyForm, schoolId: listSchoolId }
  })

  useEffect(() => {
    if (!initialEditRow) return
    const normalizedRow = normalizeEditRow(initialEditRow)
    setForm(normalizedRow)
    setPhoneCodes({
      phone: splitPhoneValue(initialEditRow.phone).code,
      fatherPhone: splitPhoneValue(initialEditRow.fatherPhone).code,
      motherPhone: splitPhoneValue(initialEditRow.motherPhone).code,
      parentUsername: splitPhoneValue(initialEditRow.parentUsername).code,
    })
    setPreviews({
      fatherPhoto: initialEditRow.fatherPhotoUrl || null,
      motherPhoto: initialEditRow.motherPhotoUrl || null,
      transferCertificate: initialEditRow.transferCertificateUrl || null,
      photo: initialEditRow.photoUrl || null,
    })
  }, [initialEditRow])

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), [])

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [schoolList, types] = await Promise.all([
          fetchSchoolsLookup(),
          fetchStudentTypesLookup(),
        ])
        setSchools(Array.isArray(schoolList) ? schoolList : [])
        setStudentTypeOptions(Array.isArray(types) ? types : [])
      } catch {
        setSchools([])
        setStudentTypeOptions([])
      }
    }
    void loadLookups()
  }, [])

  useEffect(() => {
    if (!initialEditRow || !isSuperAdmin || schools.length === 0) return
    const school = findSchoolById(schools, initialEditRow.schoolId)
    if (school?.headOfficeId != null) {
      manualScope.setSelectedScope(String(school.headOfficeId), String(initialEditRow.schoolId ?? ''))
    }
  }, [initialEditRow, isSuperAdmin, schools, manualScope])

  useEffect(() => {
    if (!initialEditRow) return

    setForm((prev) => {
      let next = prev

      if (!prev.schoolId) {
        const normalizedSchoolName = String(initialEditRow.schoolName || '').trim().toLowerCase()
        if (normalizedSchoolName) {
          const matchedSchool = schools.find((school) =>
            [school?.schoolName, school?.name].some(
              (candidate) => String(candidate || '').trim().toLowerCase() === normalizedSchoolName,
            ),
          )
          if (matchedSchool?.id != null) {
            next = { ...next, schoolId: String(matchedSchool.id) }
          }
        }
      }

      if (!next.classId && prev.className) {
        const matchedClass = findMatchingClassOption(prev.className, classOptions)
        if (matchedClass?.id != null) {
          next = { ...next, classId: String(matchedClass.id) }
        }
      }

      if (!next.sectionId && prev.section) {
        const normalizedSection = String(prev.section).trim().toLowerCase()
        if (normalizedSection) {
          const matchedSection = sectionOptions.find((section) =>
            [section?.name, section?.sectionName].some(
              (candidate) => String(candidate || '').trim().toLowerCase() === normalizedSection,
            ),
          )
          if (matchedSection?.id != null) {
            next = { ...next, sectionId: String(matchedSection.id) }
          }
        }
      }

      return next === prev ? prev : next
    })
  }, [initialEditRow, schools, classOptions, sectionOptions])

  useEffect(() => {
    let cancelled = false
    const loadClasses = async () => {
      if (!form.schoolId) {
        setClassOptions([])
        return
      }
      try {
        const data = await fetchClasses({ schoolId: form.schoolId })
        if (!cancelled) setClassOptions(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setClassOptions([])
      }
    }
    void loadClasses()
    return () => { cancelled = true }
  }, [form.schoolId])

  useEffect(() => {
    let cancelled = false
    const loadSections = async () => {
      const selectedClass = findMatchingClassOption(form.classId || form.className, classOptions)
      if (!form.schoolId || !selectedClass?.id) {
        setSectionOptions([])
        return
      }
      try {
        const data = await fetchSections({ schoolId: form.schoolId, classId: selectedClass.id })
        if (!cancelled) setSectionOptions(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setSectionOptions([])
      }
    }
    void loadSections()
    return () => { cancelled = true }
  }, [form.schoolId, form.classId, form.className, classOptions])

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions
    return contextSchoolOptions || []
  }, [isSuperAdmin, manualScope.schoolOptions, contextSchoolOptions])

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [id]: type === 'checkbox' ? checked : value }))
  }

  const handleFileChange = (id, file) => {
    setForm((prev) => ({ ...prev, [id]: file }))
    setPreviews((prev) => ({ ...prev, [id]: URL.createObjectURL(file) }))
  }

  const validateCurrentTab = () => {
    setError('')
    if (activeTab === 0) {
      if (!form.schoolId) return 'School is required'
      if (!form.name.trim()) return 'Name is required'
      if (!form.admissionNo.trim()) return 'Admission No is required'
      if (!form.admissionDate) return 'Admission Date is required'
      if (!form.birthDate) return 'Birth Date is required'
      if (!form.gender) return 'Gender is required'
    }
    if (activeTab === 1) {
      if (!form.classId) return 'Class is required'
      if (!form.sectionId) return 'Section is required'
      if (!form.rollNo.trim()) return 'Roll No is required'
    }
    if (activeTab === 2) {
      if (!form.isGuardian) return 'Is Guardian? is required'
    }
    if (activeTab === 5) {
      if (!form.username.trim()) return 'Student Username is required'
      if (!initialEditRow && !form.password.trim()) return 'Student Password is required'
    }
    return null
  }

  const handleTabChange = (index) => {
    if (index > activeTab) {
      const err = validateCurrentTab()
      if (err) {
        setError(err)
        return
      }
    }
    setActiveTab(index)
    setError('')
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    if (loading) return
    setError('')
    setSuccess(false)

    const err = validateCurrentTab()
    if (err) {
      setError(err)
      return
    }

    setLoading(true)
    try {
      const payload = buildPayload(form, phoneCodes)
      if (initialEditRow) {
        await updateStudent(initialEditRow.id, payload, form)
      } else {
        await createStudent(payload, form)
      }
      setSuccess(true)
      if (!initialEditRow) {
        setTimeout(() => onNavigate('student-list'), 1000)
      }
    } catch (err) {
      setError(err?.message || 'Failed to process student registration')
    } finally {
      setLoading(false)
    }
  }

  const isEditing = Boolean(initialEditRow)

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">{isEditing ? 'Edit' : 'Add'} Student</h1>
          <span className="text-secondary-light">Student / {isEditing ? 'Edit' : 'Add'}</span>
        </div>
        <button type="button" className="btn btn-light border px-20 d-flex align-items-center gap-6" onClick={() => onNavigate('student-list')}>
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-10 mb-24 radius-8">
          <i className="ri-error-warning-line text-lg" />
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success d-flex align-items-center gap-10 mb-24 radius-8">
          <i className="ri-checkbox-circle-line text-lg" />
          Student {isEditing ? 'updated successfully!' : 'registered successfully! Redirecting...'}
        </div>
      )}

      <div className="card h-100">
        <div className="card-header border-bottom border-neutral-200 px-20 py-0 d-flex gap-0 scroll-x-mobile">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(i)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === i ? '2px solid var(--primary-600, #4f46e5)' : '2px solid transparent',
                color: activeTab === i ? 'var(--primary-600, #4f46e5)' : 'var(--secondary-light, #667085)',
                fontWeight: activeTab === i ? 600 : 400,
                padding: '14px 20px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="card-body p-24">
          <form onSubmit={(e) => e.preventDefault()}>
            {/* ═══ TAB 0 – Basic Information ═══ */}
            {activeTab === 0 && (
            <div className="row g-20">
                {isSuperAdmin ? (
                  <div className="col-12 mb-20">
                    <ManualScopeSelectors
                      enabled={isSuperAdmin}
                      headOffices={manualScope.headOffices}
                      schoolOptions={schoolOptions}
                      selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                      onHeadOfficeChange={(val) => { manualScope.setSelectedHeadOfficeId(val); setForm(p => ({ ...p, schoolId: '', classId: '', sectionId: '' })) }}
                      selectedSchoolId={form.schoolId}
                      onSchoolChange={(val) => setForm(p => ({ ...p, schoolId: val, classId: '', sectionId: '' }))}
                      compact
                    />
                  </div>
                ) : (
                  <FormField label="School Name" required full>
                    <select className="form-control form-select ps-40" id="schoolId" value={form.schoolId} onChange={(e) => setForm(p => ({ ...p, schoolId: e.target.value, classId: '', sectionId: '' }))}>
                      <option value="">--Select School--</option>
                      {schoolOptions.map((s) => (
                        <option key={s.id} value={String(s.id)}>{s.schoolName}</option>
                      ))}
                    </select>
                  </FormField>
                )}

                <FormField label="Name" required>
                  <input type="text" id="name" className="form-control ps-40" placeholder="Student Name" value={form.name} onChange={handleChange} />
                </FormField>

                <FormField label="Admission No" required>
                  <input type="text" id="admissionNo" className="form-control ps-40" placeholder="Admission No" value={form.admissionNo} onChange={handleChange} />
                </FormField>

                <FormField label="Admission Date" required>
                  <input type="date" id="admissionDate" className="form-control ps-40" value={form.admissionDate} onChange={handleChange} />
                </FormField>

                <FormField label="Birth Date" required>
                  <input type="date" id="birthDate" className="form-control ps-40" value={form.birthDate} onChange={handleChange} />
                </FormField>

                <FormField label="Gender" required>
                  <select id="gender" className="form-control form-select ps-40" value={form.gender} onChange={handleChange}>
                    <option value="">--Select--</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </FormField>

                <FormField label="Blood Group">
                  <select id="bloodGroup" className="form-control form-select ps-40" value={form.bloodGroup} onChange={handleChange}>
                    <option value="">--Select--</option>
                    <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                    <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                  </select>
                </FormField>

                <FormField label="Religion">
                  <input type="text" id="religion" className="form-control ps-40" placeholder="Religion" value={form.religion} onChange={handleChange} />
                </FormField>

                <FormField label="Caste">
                  <input type="text" id="caste" className="form-control ps-40" placeholder="Caste" value={form.caste} onChange={handleChange} />
                </FormField>

                <div className="col-md-6 mb-20">
                  <PhoneCodeField
                    id="phone"
                    label="Phone number"
                    code={phoneCodes.phone}
                    value={form.phone}
                    onCodeChange={(val) => setPhoneCodes(p => ({ ...p, phone: val }))}
                    onValueChange={(val) => setForm(p => ({ ...p, phone: val }))}
                  />
                </div>

                <FormField label="Email">
                  <input type="email" id="email" className="form-control ps-40" placeholder="Email Address" value={form.email} onChange={handleChange} />
                </FormField>

                <FormField label="National ID">
                  <input type="text" id="nationalId" className="form-control ps-40" placeholder="National ID" value={form.nationalId} onChange={handleChange} />
                </FormField>

              </div>
            )}

            {/* ═══ TAB 1 – Academic Information ═══ */}
            {activeTab === 1 && (
            <div className="row g-20">
                <h6 className="col-12 text-primary-light mt-0 mb-16 border-bottom pb-8">Academic Information</h6>
                <FormField label="Student Type">
                  <select id="studentType" className="form-control form-select ps-40" value={form.studentType} onChange={handleChange}>
                    <option value="">--Select--</option>
                    {studentTypeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </FormField>

                <FormField label="Class" required>
                  <select id="classId" className="form-control form-select ps-40" value={form.classId} onChange={(e) => setForm(p => ({ ...p, classId: e.target.value, sectionId: '' }))}>
                    <option value="">--Select--</option>
                    {classOptions.map((item) => <option key={item.id} value={String(item.id)}>{item.className || item.name}</option>)}
                  </select>
                </FormField>

                <FormField label="Section" required>
                  <select id="sectionId" className="form-control form-select ps-40" value={form.sectionId} onChange={handleChange} disabled={!form.classId}>
                    <option value="">--Select--</option>
                    {sectionOptions.map((item) => <option key={item.id} value={String(item.id)}>{item.name || item.sectionName}</option>)}
                  </select>
                </FormField>

                <FormField label="Group">
                  <select id="group" className="form-control form-select ps-40" value={form.group} onChange={handleChange}>
                    <option value="">--Select--</option>
                    <option>Science</option><option>Commerce</option><option>Arts</option>
                  </select>
                </FormField>

                <FormField label="Roll No" required>
                  <input type="text" id="rollNo" className="form-control ps-40" placeholder="Roll No" value={form.rollNo} onChange={handleChange} />
                </FormField>

                <FormField label="Registration No">
                  <input type="text" id="registrationNo" className="form-control ps-40" placeholder="Registration No" value={form.registrationNo} onChange={handleChange} />
                </FormField>

                <FormField label="Discount">
                  <select id="discount" className="form-control form-select ps-40" value={form.discount} onChange={handleChange}>
                    <option value="">--Select--</option>
                    <option>No Discount</option><option>10%</option><option>20%</option><option>50%</option>
                  </select>
                </FormField>

                <FormField label="Second Language">
                  <input type="text" id="secondLanguage" className="form-control ps-40" placeholder="Second Language" value={form.secondLanguage} onChange={handleChange} />
                </FormField>
              </div>
            )}

            {/* ═══ TAB 2 – Guardian Information ═══ */}
            {activeTab === 2 && (
            <div className="row g-20">
                <h6 className="col-12 text-primary-light mt-0 mb-16 border-bottom pb-8">Father Information</h6>
                <FormField label="Father Name">
                  <input type="text" id="fatherName" className="form-control ps-40" placeholder="Father Name" value={form.fatherName} onChange={handleChange} />
                </FormField>
                <div className="col-md-6 mb-20">
                  <PhoneCodeField
                    id="fatherPhone"
                    label="Father Phone"
                    code={phoneCodes.fatherPhone}
                    value={form.fatherPhone}
                    onCodeChange={(val) => setPhoneCodes(p => ({ ...p, fatherPhone: val }))}
                    onValueChange={(val) => setForm(p => ({ ...p, fatherPhone: val }))}
                  />
                </div>
                <FormField label="Father Email">
                  <input type="email" id="fatherEmail" className="form-control ps-40" placeholder="Father Email" value={form.fatherEmail} onChange={handleChange} />
                </FormField>
                <FormField label="Father Education">
                  <input type="text" id="fatherEducation" className="form-control ps-40" placeholder="Father Education" value={form.fatherEducation} onChange={handleChange} />
                </FormField>
                <FormField label="Father Profession">
                  <input type="text" id="fatherProfession" className="form-control ps-40" placeholder="Father Profession" value={form.fatherProfession} onChange={handleChange} />
                </FormField>
                <FormField label="Father Designation">
                  <input type="text" id="fatherDesignation" className="form-control ps-40" placeholder="Father Designation" value={form.fatherDesignation} onChange={handleChange} />
                </FormField>
                <ImageUploadField
                  label="Father Photo"
                  id="fatherPhoto"
                  preview={previews.fatherPhoto}
                  onChange={handleFileChange}
                  helperText="Dimension:- Max-W: 120px, Max-H: 130px. Image file format: .jpg, .jpeg, .png or .gif"
                />

                <h6 className="col-12 text-primary-light mt-12 mb-16 border-bottom pb-8">Mother Information</h6>
                <FormField label="Mother Name">
                  <input type="text" id="motherName" className="form-control ps-40" placeholder="Mother Name" value={form.motherName} onChange={handleChange} />
                </FormField>
                <div className="col-md-6 mb-20">
                  <PhoneCodeField
                    id="motherPhone"
                    label="Mother Phone"
                    code={phoneCodes.motherPhone}
                    value={form.motherPhone}
                    onCodeChange={(val) => setPhoneCodes(p => ({ ...p, motherPhone: val }))}
                    onValueChange={(val) => setForm(p => ({ ...p, motherPhone: val }))}
                  />
                </div>
                <FormField label="Mother Email">
                  <input type="email" id="motherEmail" className="form-control ps-40" placeholder="Mother Email" value={form.motherEmail} onChange={handleChange} />
                </FormField>
                <FormField label="Mother Education">
                  <input type="text" id="motherEducation" className="form-control ps-40" placeholder="Mother Education" value={form.motherEducation} onChange={handleChange} />
                </FormField>
                <FormField label="Mother Profession">
                  <input type="text" id="motherProfession" className="form-control ps-40" placeholder="Mother Profession" value={form.motherProfession} onChange={handleChange} />
                </FormField>
                <FormField label="Mother Designation">
                  <input type="text" id="motherDesignation" className="form-control ps-40" placeholder="Mother Designation" value={form.motherDesignation} onChange={handleChange} />
                </FormField>
                <ImageUploadField
                  label="Mother Photo"
                  id="motherPhoto"
                  preview={previews.motherPhoto}
                  onChange={handleFileChange}
                  helperText="Dimension:- Max-W: 120px, Max-H: 130px. Image file format: .jpg, .jpeg, .png or .gif"
                />

                <h6 className="col-12 text-primary-light mt-12 mb-16 border-bottom pb-8">Guardian Information</h6>
                <FormField label="Is Guardian?" required>
                  <select id="isGuardian" className="form-control form-select ps-40" value={form.isGuardian} onChange={handleChange}>
                    <option value="">--Select--</option>
                    <option>Father</option><option>Mother</option><option>Other</option>
                  </select>
                </FormField>

                <FormField label="Relation With Guardian">
                  <input type="text" id="relationWithGuardian" className="form-control ps-40" placeholder="Relation" value={form.relationWithGuardian} onChange={handleChange} />
                </FormField>
                <FormField label="Guardian Email">
                  <input type="email" id="guardianEmail" className="form-control ps-40" placeholder="Guardian Email" value={form.guardianEmail} onChange={handleChange} />
                </FormField>
                <h6 className="col-12 text-primary-light mt-12 mb-16 border-bottom pb-8">Parent Login Details</h6>
                <div className="col-md-6 mb-20">
                  <PhoneCodeField
                    id="parentUsername"
                    label="Parent Mobile (Username)"
                    code={phoneCodes.parentUsername}
                    value={form.parentUsername}
                    onCodeChange={(val) => setPhoneCodes(p => ({ ...p, parentUsername: val }))}
                    onValueChange={(val) => setForm(p => ({ ...p, parentUsername: val }))}
                  />
                </div>
                <FormField label="Parent Password">
                  <input type="password" id="parentPassword" className="form-control ps-40" placeholder={isEditing ? 'Leave blank to keep current' : 'Password'} value={form.parentPassword} onChange={handleChange} />
                </FormField>
              </div>
            )}

            {/* ═══ TAB 3 – Address Information ═══ */}
            {activeTab === 3 && (
            <div className="row g-20">
                <h6 className="col-12 text-primary-light mt-0 mb-16 border-bottom pb-8">Address Information</h6>
                <div className="col-12 mb-20">
                  <div className="form-check d-flex align-items-center gap-10 m-0 ps-0">
                    <input
                      className="form-check-input m-0"
                      style={{ marginTop: 0 }}
                      type="checkbox"
                      id="sameAsGuardianAddress"
                      checked={form.sameAsGuardianAddress}
                      onChange={handleChange}
                    />
                    <label className="form-check-label fw-medium mb-0" htmlFor="sameAsGuardianAddress">
                      Same as Guardian Address
                    </label>
                  </div>
                </div>

                <FormField label="Present Address" full>
                  <textarea id="presentAddress" rows="3" className="form-control ps-40 pt-10" placeholder="Present Address" value={form.presentAddress} onChange={handleChange} />
                </FormField>

                <FormField label="Permanent Address" full>
                  <textarea id="permanentAddress" rows="3" className="form-control ps-40 pt-10" placeholder="Permanent Address" value={form.permanentAddress} onChange={handleChange} />
                </FormField>
              </div>
            )}

            {/* ═══ TAB 4 – Previous School ═══ */}
            {activeTab === 4 && (
            <div className="row g-20">
                <h6 className="col-12 text-primary-light mt-0 mb-16 border-bottom pb-8">Previous School</h6>
                <FormField label="School Name" full>
                  <input type="text" id="previousSchoolName" className="form-control ps-40" placeholder="Previous School Name" value={form.previousSchoolName} onChange={handleChange} />
                </FormField>

                <FormField label="Class">
                  <input type="text" id="previousClass" className="form-control ps-40" placeholder="Previous Class" value={form.previousClass} onChange={handleChange} />
                </FormField>

                <ImageUploadField
                  label="Transfer Certificate"
                  id="transferCertificate"
                  preview={previews.transferCertificate}
                  onChange={handleFileChange}
                  helperText="Dimension:- Max-W: 1200px, Max-H: 600px. Image file format: .jpg, .jpeg, .png or .gif"
                />
              </div>
            )}

            {/* ═══ TAB 5 – Other Information ═══ */}
            {activeTab === 5 && (
            <div className="row g-20">
                <h6 className="col-12 text-primary-light mt-0 mb-16 border-bottom pb-8">Other Information</h6>
                <FormField label="Student Username" required>
                  <input type="text" id="username" className="form-control ps-40" placeholder="Username" value={form.username} onChange={handleChange} />
                </FormField>

                <FormField label="Student Password" required={!isEditing}>
                  <input type="password" id="password" className="form-control ps-40" placeholder={isEditing ? 'Leave blank to keep current' : 'Password'} value={form.password} onChange={handleChange} />
                </FormField>

                <FormField label="Health Condition" full>
                  <input type="text" id="healthCondition" className="form-control ps-40" placeholder="Health Condition" value={form.healthCondition} onChange={handleChange} />
                </FormField>
                <FormField label="Other Info" full>
                  <textarea id="otherInfo" rows="3" className="form-control ps-40 pt-10" placeholder="Other Info" value={form.otherInfo} onChange={handleChange} />
                </FormField>
                <ImageUploadField
                  label="Photo"
                  id="photo"
                  preview={previews.photo}
                  onChange={handleFileChange}
                  helperText="Dimension:- Max-W: 120px, Max-H: 130px. Image file format: .jpg, .jpeg, .png or .gif"
                />
              </div>
            )}

            {/* ─── Footer Buttons ─── */}
            <div className="d-flex align-items-center justify-content-between mt-24 pt-20 border-top border-neutral-200">
              <button
                type="button"
                className="btn btn-light border px-20 d-flex align-items-center gap-8"
                onClick={() => setActiveTab((t) => Math.max(0, t - 1))}
                disabled={activeTab === 0}
              >
                <i className="ri-arrow-left-line" /> Previous
              </button>

              <div className="d-flex align-items-center gap-10">
                {activeTab < TABS.length - 1 ? (
                  <button
                    type="button"
                    className="btn btn-primary-600 px-20 d-flex align-items-center gap-8"
                    onClick={() => handleTabChange(activeTab + 1)}
                  >
                    Next <i className="ri-arrow-right-line" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary-600 px-24 d-flex align-items-center gap-8"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...</>
                    ) : (
                      <><i className="ri-save-line" /> {isEditing ? 'Update Student' : 'Save Student'}</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddStudent
