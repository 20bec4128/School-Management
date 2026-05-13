import React, { useState, useRef, useEffect, useMemo } from 'react'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { createStudent } from '../apis/studentsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchStudentTypesLookup } from '../apis/studentTypeApi'
import useCountryCodes from '../hooks/useCountryCodes'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'

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
  parentUsername: '',
  parentPassword: '',
  healthCondition: '',
  otherInfo: '',
  photo: null,
}

const DEFAULT_PHONE_CODE = '+91'
const PHONE_LENGTH_BY_ISO = {
  IN: { min: 10, max: 10 },
  US: { min: 10, max: 10 },
  CA: { min: 10, max: 10 },
  GB: { min: 10, max: 10 },
  AU: { min: 9, max: 9 },
  DE: { min: 10, max: 11 },
  FR: { min: 9, max: 9 },
  BR: { min: 10, max: 11 },
}
const DEFAULT_PHONE_LENGTH = { min: 6, max: 15 }

const combinePhoneValue = (code, number) => {
  const normalizedNumber = String(number || '').replace(/\D/g, '').trim()
  const normalizedCode = String(code || DEFAULT_PHONE_CODE).trim() || DEFAULT_PHONE_CODE
  return normalizedNumber ? `${normalizedCode} ${normalizedNumber}` : null
}

const buildPayload = (form, phoneCodes) => ({
  schoolId: form.school ? Number(form.school) : null,
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
  motherName: form.motherName || null,
  motherPhone: combinePhoneValue(phoneCodes.motherPhone, form.motherPhone),
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
  parentUsername: combinePhoneValue(phoneCodes.parentUsername, form.parentUsername),
  parentPassword: form.parentPassword || null,
  healthCondition: form.healthCondition || null,
  otherInfo: form.otherInfo || null,
})

const getClassOptionValue = (item) => String(item?.id ?? item?.classId ?? item?.numericName ?? item?.className ?? item?.name ?? '')
const getClassOptionLabel = (item) => item?.className || item?.numericName || item?.name || String(item?.id ?? '')
const getSectionOptionValue = (item) => String(item?.id ?? item?.sectionId ?? item?.name ?? item?.sectionName ?? item?.section ?? '')
const getSectionOptionLabel = (item) => item?.name || item?.sectionName || item?.section || String(item?.id ?? '')

const findMatchingClassOption = (value, classOptions) =>
  classOptions.find((item) =>
    [String(item?.id ?? ''), item?.className, item?.numericName, item?.name].some(
      (candidate) => String(candidate) === String(value),
    ),
  )

const findMatchingSectionOption = (value, sectionOptions) =>
  sectionOptions.find((item) =>
    [String(item?.id ?? ''), item?.name, item?.sectionName, item?.section].some(
      (candidate) => String(candidate) === String(value),
    ),
  )

const PhoneCodeField = ({ id, label, value, code, onValueChange, onCodeChange, required = false }) => {
  const { countries } = useCountryCodes()
  const wrapperRef = useRef(null)
  const searchRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const uniqueCountries = useMemo(() => {
    const seen = new Set()
    return countries.filter((country) => {
      if (seen.has(country.code)) return false
      seen.add(country.code)
      return true
    })
  }, [countries])

  const selectedCountry =
    uniqueCountries.find((country) => country.code === code) ||
    uniqueCountries.find((country) => country.code === DEFAULT_PHONE_CODE) ||
    uniqueCountries[0] ||
    { code: DEFAULT_PHONE_CODE, country: 'India', iso: 'IN' }

  const phoneLengthRule = PHONE_LENGTH_BY_ISO[selectedCountry.iso] || DEFAULT_PHONE_LENGTH

  useEffect(() => {
    const handleOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 0)
    }
  }, [isOpen])

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return uniqueCountries
    return uniqueCountries.filter(
      (country) =>
        country.country.toLowerCase().includes(q) ||
        country.code.includes(q) ||
        country.iso.toLowerCase().includes(q),
    )
  }, [search, uniqueCountries])

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <label htmlFor={id} className="form-label fw-semibold text-primary-light">
        {label}{required ? <span className="text-danger"> *</span> : null}
      </label>
      <div className="input-group">
        <button
          type="button"
          className="form-select text-start"
          style={{ maxWidth: '11rem', minWidth: '11rem' }}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={`${label} country code`}
        >
          {selectedCountry.code} {selectedCountry.country}
        </button>
        <input
          type="tel"
          className="form-control"
          id={id}
          placeholder={label}
          value={value}
          onChange={(event) => onValueChange(event.target.value.replace(/\D/g, '').slice(0, phoneLengthRule.max))}
          maxLength={phoneLengthRule.max}
          pattern={`\\d{${phoneLengthRule.min},${phoneLengthRule.max}}`}
          title={`Enter ${phoneLengthRule.min === phoneLengthRule.max ? phoneLengthRule.max : `${phoneLengthRule.min}-${phoneLengthRule.max}`} digits`}
          required={required}
        />
      </div>

      {isOpen ? (
        <div
          className="border rounded-3 bg-white shadow-sm position-absolute mt-2"
          style={{ zIndex: 40, width: 'min(100%, 22rem)', left: 0, top: 'calc(100% + 0.4rem)' }}
        >
          <div className="p-2 border-bottom">
            <input
              ref={searchRef}
              type="text"
              className="form-control form-control-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search country or code..."
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filteredCountries.map((country) => (
              <button
                key={`${country.iso}-${country.code}`}
                type="button"
                className={`btn w-100 text-start rounded-0 border-0 px-3 py-2 ${
                  country.code === selectedCountry.code ? 'bg-light' : ''
                }`}
                onClick={() => {
                  onCodeChange(country.code)
                  setIsOpen(false)
                  setSearch('')
                }}
              >
                {country.code} {country.country}
              </button>
            ))}
            {filteredCountries.length === 0 ? (
              <div className="px-3 py-2 text-secondary-light">No countries found.</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

const AddStudent = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId } = useSchool()
  const [form, setForm] = useState(emptyForm)
  const [phoneCodes, setPhoneCodes] = useState({
    phone: DEFAULT_PHONE_CODE,
    fatherPhone: DEFAULT_PHONE_CODE,
    motherPhone: DEFAULT_PHONE_CODE,
    parentUsername: DEFAULT_PHONE_CODE,
  })
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isParentPasswordVisible, setIsParentPasswordVisible] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [schoolList, setSchoolList] = useState([])
  const [studentTypeOptions, setStudentTypeOptions] = useState([])
  const [classOptions, setClassOptions] = useState([])
  const [sectionOptions, setSectionOptions] = useState([])

  const [previews, setPreviews] = useState({
    fatherPhoto: null, motherPhoto: null, transferCertificate: null, photo: null,
  })

  const fatherPhotoRef = useRef(null)
  const motherPhotoRef = useRef(null)
  const transferCertificateRef = useRef(null)
  const studentPhotoRef = useRef(null)

  const resolvedSchoolId = activeSchoolId || authSchoolId || ''
  const resolvedSchoolName = authSchoolName || (resolvedSchoolId ? `School ${resolvedSchoolId}` : '')
  const scopedSchoolId = activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
  const isSchoolLocked = Boolean(scopedSchoolId) && role !== 'SUPER_ADMIN'

  useEffect(() => {
    setForm(prev => ({ ...prev, school: scopedSchoolId ? String(scopedSchoolId) : '' }))
  }, [scopedSchoolId])

  useEffect(() => {
    fetchSchoolsLookup().then(setSchoolList).catch(() => {})
    fetchStudentTypesLookup().then((data) => {
        setStudentTypeOptions(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadClasses = async () => {
      if (!form.school) {
        setClassOptions([])
        setSectionOptions([])
        return
      }
      try {
        const data = await fetchClasses({ schoolId: form.school })
        if (!cancelled) setClassOptions(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setClassOptions([])
      }
    }
    loadClasses()
    return () => { cancelled = true }
  }, [form.school])

  useEffect(() => {
    let cancelled = false
    const loadSections = async () => {
      const selectedClass = findMatchingClassOption(form.classId || form.className, classOptions)
      if (!form.school || !selectedClass?.id) {
        setSectionOptions([])
        return
      }
      try {
        const data = await fetchSections({ schoolId: form.school, classId: selectedClass.id })
        if (!cancelled) setSectionOptions(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setSectionOptions([])
      }
    }
    loadSections()
    return () => { cancelled = true }
  }, [form.school, form.classId, form.className, classOptions])

  const effectiveSchoolList = useMemo(() => {
    const list = Array.isArray(schoolList) ? schoolList.slice() : []
    if (!scopedSchoolId) return list
    const selected = list.find((s) => String(s?.id) === String(scopedSchoolId))
    return selected
      ? [selected]
      : [{
          id: scopedSchoolId,
          schoolName: resolvedSchoolName || `School ${scopedSchoolId}`,
        }]
  }, [resolvedSchoolName, schoolList, scopedSchoolId])

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [id]: type === 'checkbox' ? checked : value }))
  }

  const handlePhotoChange = (e, key) => {
    const file = e.target.files[0]
    if (!file) return
    setForm((prev) => ({ ...prev, [key]: file }))
    setPreviews((prev) => ({ ...prev, [key]: URL.createObjectURL(file) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await createStudent(buildPayload(form, phoneCodes))
      onNavigate?.('student-list')
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderUploadField = (label, id, fileRef, preview, onSelect, note1, note2) => (
    <div className="col-12 mt-8">
      <label className="form-label fw-semibold text-primary-light">{label}</label>
      <input
        ref={fileRef}
        type="file"
        accept=".jpg,.jpeg,.png,.gif"
        className="d-none"
        onChange={onSelect}
      />
      <div className="d-flex align-items-center gap-12">
        <button type="button" className="btn btn-light border" onClick={() => fileRef.current.click()}>
          <i className="ri-upload-2-line"></i> Upload {label}
        </button>
        {preview && (
          <img
            src={preview}
            alt="preview"
            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #d0d5dd' }}
          />
        )}
      </div>
      <div className="text-sm text-secondary-light mt-4">
        <div>{note1}</div>
        <div>{note2}</div>
      </div>
    </div>
  )

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Add Student</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0" onClick={() => onNavigate?.('dashboard')}>
              Dashboard
            </button>
            <span className="text-secondary-light"> / <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0" onClick={() => onNavigate?.('student-list')}>Student</button> / Add</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
          <button type="button" className="btn btn-light border d-flex align-items-center gap-6" onClick={() => onNavigate?.('student-list')}>
            <span className="d-flex text-md"><i className="ri-arrow-left-line"></i></span>
            Back to List
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-24">
          <form onSubmit={handleSubmit}>
            {submitError && <div className="alert alert-danger mb-24">{submitError}</div>}

            {/* Basic Information */}
            <h5 className="fw-semibold text-primary-light mb-16 border-bottom pb-8">Basic Information</h5>
            <div className="row g-20 mb-32">
              <div className="col-12">
                <label htmlFor="school" className="form-label fw-semibold text-primary-light">School <span className="text-danger">*</span></label>
                <select
                  className="form-control form-select"
                  id="school"
                  value={form.school}
                  disabled={isSchoolLocked}
                  onChange={(e) => setForm((prev) => ({ ...prev, school: e.target.value, classId: '', className: '', sectionId: '', section: '' }))}
                  required
                >
                  <option value="">--Select School--</option>
                  {effectiveSchoolList.map((s) => (
                    <option key={s.id} value={s.id}>{s.schoolName}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label htmlFor="name" className="form-label fw-semibold text-primary-light">Name <span className="text-danger">*</span></label>
                <input type="text" className="form-control" id="name" placeholder="Name" value={form.name} onChange={handleChange} required />
              </div>

              <div className="col-md-4">
                <label htmlFor="admissionNo" className="form-label fw-semibold text-primary-light">Admission No <span className="text-danger">*</span></label>
                <input type="text" className="form-control" id="admissionNo" placeholder="Admission No" value={form.admissionNo} onChange={handleChange} required />
              </div>

              <div className="col-md-4">
                <label htmlFor="admissionDate" className="form-label fw-semibold text-primary-light">Admission Date <span className="text-danger">*</span></label>
                <input type="date" className="form-control" id="admissionDate" value={form.admissionDate} onChange={handleChange} required />
              </div>

              <div className="col-md-4">
                <label htmlFor="birthDate" className="form-label fw-semibold text-primary-light">Birth Date <span className="text-danger">*</span></label>
                <input type="date" className="form-control" id="birthDate" value={form.birthDate} onChange={handleChange} required />
              </div>

              <div className="col-md-4">
                <label htmlFor="gender" className="form-label fw-semibold text-primary-light">Gender <span className="text-danger">*</span></label>
                <select className="form-control form-select" id="gender" value={form.gender} onChange={handleChange} required>
                  <option value="">--Select--</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="col-md-4">
                <label htmlFor="bloodGroup" className="form-label fw-semibold text-primary-light">Blood Group</label>
                <select className="form-control form-select" id="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
                  <option value="">--Select--</option>
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                  <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                </select>
              </div>

              <div className="col-md-4">
                <label htmlFor="religion" className="form-label fw-semibold text-primary-light">Religion</label>
                <input type="text" className="form-control" id="religion" placeholder="Religion" value={form.religion} onChange={handleChange} />
              </div>

              <div className="col-md-4">
                <label htmlFor="caste" className="form-label fw-semibold text-primary-light">Caste</label>
                <input type="text" className="form-control" id="caste" placeholder="Caste" value={form.caste} onChange={handleChange} />
              </div>

              <div className="col-md-4">
                <PhoneCodeField
                  id="phone"
                  label="Phone number"
                  required
                  code={phoneCodes.phone}
                  value={form.phone}
                  onCodeChange={(value) => setPhoneCodes((prev) => ({ ...prev, phone: value }))}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
                />
              </div>

              <div className="col-md-4">
                <label htmlFor="email" className="form-label fw-semibold text-primary-light">Email</label>
                <input type="email" className="form-control" id="email" placeholder="Email" value={form.email} onChange={handleChange} />
              </div>

              <div className="col-md-4">
                <label htmlFor="nationalId" className="form-label fw-semibold text-primary-light">National ID</label>
                <input type="text" className="form-control" id="nationalId" placeholder="National ID" value={form.nationalId} onChange={handleChange} />
              </div>

              <div className="col-md-6">
                <label htmlFor="username" className="form-label fw-semibold text-primary-light">Student Username <span className="text-danger">*</span></label>
                <input type="text" className="form-control" id="username" placeholder="Student Username" value={form.username} onChange={handleChange} required />
              </div>

              <div className="col-md-6">
                <label htmlFor="password" className="form-label fw-semibold text-primary-light">Student Password <span className="text-danger">*</span></label>
                <div className="position-relative">
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    className="form-control pe-48"
                    id="password"
                    placeholder="Student Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((prev) => !prev)}
                    className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent pe-16 text-secondary-light"
                    style={{ zIndex: 5 }}
                  >
                    <i className={isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <h5 className="fw-semibold text-primary-light mb-16 border-bottom pb-8">Address Information</h5>
            <div className="row g-20 mb-32">
              <div className="col-12">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="sameAsGuardianAddress" checked={form.sameAsGuardianAddress} onChange={handleChange} />
                  <label className="form-check-label fw-medium" htmlFor="sameAsGuardianAddress">
                    Same as Guardian Address
                  </label>
                </div>
              </div>

              <div className="col-md-6">
                <label htmlFor="presentAddress" className="form-label fw-semibold text-primary-light">Present Address</label>
                <textarea rows="3" className="form-control" id="presentAddress" placeholder="Present Address" value={form.presentAddress} onChange={handleChange} />
              </div>

              <div className="col-md-6">
                <label htmlFor="permanentAddress" className="form-label fw-semibold text-primary-light">Permanent Address</label>
                <textarea rows="3" className="form-control" id="permanentAddress" placeholder="Permanent Address" value={form.permanentAddress} onChange={handleChange} />
              </div>

              <div className="col-md-6">
                <label htmlFor="previousSchoolName" className="form-label fw-semibold text-primary-light">Previous School Name</label>
                <input type="text" className="form-control" id="previousSchoolName" placeholder="School Name" value={form.previousSchoolName} onChange={handleChange} />
              </div>

              <div className="col-md-6">
                <label htmlFor="previousClass" className="form-label fw-semibold text-primary-light">Previous Class</label>
                <input type="text" className="form-control" id="previousClass" placeholder="Previous Class" value={form.previousClass} onChange={handleChange} />
              </div>

              {renderUploadField(
                'Transfer Certificate', 'transferCertificate', transferCertificateRef, previews.transferCertificate,
                (e) => handlePhotoChange(e, 'transferCertificate'),
                'Max-W: 1200px, Max-H: 600px', 'Format: .jpg, .jpeg, .png or .gif'
              )}
            </div>

            {/* Academic Information */}
            <h5 className="fw-semibold text-primary-light mb-16 border-bottom pb-8">Academic Information</h5>
            <div className="row g-20 mb-32">
              <div className="col-md-4">
                <label htmlFor="studentType" className="form-label fw-semibold text-primary-light">Student Type</label>
                <select className="form-control form-select" id="studentType" value={form.studentType} onChange={handleChange}>
                  <option value="">--Select--</option>
                  {studentTypeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label htmlFor="classId" className="form-label fw-semibold text-primary-light">Class <span className="text-danger">*</span></label>
                <select
                  className="form-control form-select"
                  id="classId"
                  value={form.classId}
                  onChange={(e) => setForm((prev) => ({ ...prev, classId: e.target.value, section: '', sectionId: '' }))}
                  required
                >
                  <option value="">--Select--</option>
                  {classOptions.map((item) => (
                    <option key={item.id || getClassOptionValue(item)} value={getClassOptionValue(item)}>
                      {getClassOptionLabel(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label htmlFor="sectionId" className="form-label fw-semibold text-primary-light">Section <span className="text-danger">*</span></label>
                <select className="form-control form-select" id="sectionId" value={form.sectionId} onChange={handleChange} disabled={!form.classId} required>
                  <option value="">--Select--</option>
                  {sectionOptions.map((item) => (
                    <option key={item.id || getSectionOptionValue(item)} value={getSectionOptionValue(item)}>
                      {getSectionOptionLabel(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label htmlFor="group" className="form-label fw-semibold text-primary-light">Group</label>
                <select className="form-control form-select" id="group" value={form.group} onChange={handleChange}>
                  <option value="">--Select--</option>
                  <option>Science</option><option>Commerce</option><option>Arts</option>
                </select>
              </div>

              <div className="col-md-3">
                <label htmlFor="rollNo" className="form-label fw-semibold text-primary-light">Roll No <span className="text-danger">*</span></label>
                <input type="text" className="form-control" id="rollNo" placeholder="Roll No" value={form.rollNo} onChange={handleChange} required />
              </div>

              <div className="col-md-3">
                <label htmlFor="registrationNo" className="form-label fw-semibold text-primary-light">Registration No</label>
                <input type="text" className="form-control" id="registrationNo" placeholder="Registration No" value={form.registrationNo} onChange={handleChange} />
              </div>

              <div className="col-md-3">
                <label htmlFor="discount" className="form-label fw-semibold text-primary-light">Discount</label>
                <select className="form-control form-select" id="discount" value={form.discount} onChange={handleChange}>
                  <option value="">--Select--</option>
                  <option>No Discount</option><option>10%</option><option>20%</option><option>50%</option>
                </select>
              </div>

              <div className="col-md-4">
                <label htmlFor="secondLanguage" className="form-label fw-semibold text-primary-light">Second Language</label>
                <input type="text" className="form-control" id="secondLanguage" placeholder="Second Language" value={form.secondLanguage} onChange={handleChange} />
              </div>

              <div className="col-md-4">
                <label htmlFor="isGuardian" className="form-label fw-semibold text-primary-light">Is Guardian? <span className="text-danger">*</span></label>
                <select className="form-control form-select" id="isGuardian" value={form.isGuardian} onChange={handleChange} required>
                  <option value="">--Select--</option>
                  <option>Father</option><option>Mother</option><option>Other</option>
                </select>
              </div>

              <div className="col-md-4">
                <label htmlFor="relationWithGuardian" className="form-label fw-semibold text-primary-light">Relation With Guardian</label>
                <input type="text" className="form-control" id="relationWithGuardian" placeholder="Relation With Guardian" value={form.relationWithGuardian} onChange={handleChange} />
              </div>
            </div>

            {/* Parent Information */}
            <h5 className="fw-semibold text-primary-light mb-16 border-bottom pb-8">Parent Information</h5>
            <div className="row g-20 mb-32">
              <div className="col-md-4">
                <label htmlFor="fatherName" className="form-label fw-semibold text-primary-light">Father Name</label>
                <input type="text" className="form-control" id="fatherName" placeholder="Father Name" value={form.fatherName} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <PhoneCodeField
                  id="fatherPhone"
                  label="Father Phone"
                  code={phoneCodes.fatherPhone}
                  value={form.fatherPhone}
                  onCodeChange={(value) => setPhoneCodes((prev) => ({ ...prev, fatherPhone: value }))}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, fatherPhone: value }))}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="fatherProfession" className="form-label fw-semibold text-primary-light">Father Profession</label>
                <input type="text" className="form-control" id="fatherProfession" placeholder="Father Profession" value={form.fatherProfession} onChange={handleChange} />
              </div>

              <div className="col-md-4">
                <label htmlFor="motherName" className="form-label fw-semibold text-primary-light">Mother Name</label>
                <input type="text" className="form-control" id="motherName" placeholder="Mother Name" value={form.motherName} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <PhoneCodeField
                  id="motherPhone"
                  label="Mother Phone"
                  code={phoneCodes.motherPhone}
                  value={form.motherPhone}
                  onCodeChange={(value) => setPhoneCodes((prev) => ({ ...prev, motherPhone: value }))}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, motherPhone: value }))}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="motherProfession" className="form-label fw-semibold text-primary-light">Mother Profession</label>
                <input type="text" className="form-control" id="motherProfession" placeholder="Mother Profession" value={form.motherProfession} onChange={handleChange} />
              </div>

              <div className="col-md-6">
                <PhoneCodeField
                  id="parentUsername"
                  label="Parent Login Mobile (Username)"
                  code={phoneCodes.parentUsername}
                  value={form.parentUsername}
                  onCodeChange={(value) => setPhoneCodes((prev) => ({ ...prev, parentUsername: value }))}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, parentUsername: value }))}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="parentPassword" className="form-label fw-semibold text-primary-light">Parent Password</label>
                <div className="position-relative">
                  <input
                    type={isParentPasswordVisible ? 'text' : 'password'}
                    className="form-control pe-48"
                    id="parentPassword"
                    placeholder="Parent Password"
                    value={form.parentPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setIsParentPasswordVisible((prev) => !prev)}
                    className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent pe-16 text-secondary-light"
                    style={{ zIndex: 5 }}
                  >
                    <i className={isParentPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Other Information */}
            <h5 className="fw-semibold text-primary-light mb-16 border-bottom pb-8">Other Information</h5>
            <div className="row g-20 mb-32">
              <div className="col-md-6">
                <label htmlFor="healthCondition" className="form-label fw-semibold text-primary-light">Health Condition</label>
                <input type="text" className="form-control" id="healthCondition" placeholder="Health Condition" value={form.healthCondition} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label htmlFor="otherInfo" className="form-label fw-semibold text-primary-light">Other Info</label>
                <textarea rows="2" className="form-control" id="otherInfo" placeholder="Other Info" value={form.otherInfo} onChange={handleChange} />
              </div>

              {renderUploadField(
                'Student Photo', 'photo', studentPhotoRef, previews.photo,
                (e) => handlePhotoChange(e, 'photo'),
                'Max-W: 120px, Max-H: 130px', 'Format: .jpg, .jpeg, .png or .gif'
              )}
            </div>

            <div className="alert alert-warning mb-32">
                Instruction: Please add Guardian, Class & Section before add Student.
            </div>

            <div className="d-flex justify-content-end gap-12">
              <button type="button" className="btn btn-light border px-32" onClick={() => onNavigate?.('student-list')}>Cancel</button>
              <button type="submit" className="btn btn-primary-600 px-32" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddStudent
