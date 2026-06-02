import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createGuardian, updateGuardian } from '../apis/guardiansApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import PhoneCodeField from '../components/PhoneCodeField'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'

const EDIT_STORAGE_KEY = 'edit-guardian-row'

const STEPS = ['Basic Information', 'Academic Information', 'Other Information']

const PROFESSION_OPTIONS = [
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

const INITIAL_FORM = {
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

const stepFieldStyle = {
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '14px',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

const stepStyles = {
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '24px',
  },
  item: {
    flex: '1 1 220px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '12px 14px',
    background: '#f8fafc',
    color: '#64748b',
    fontWeight: 600,
    minHeight: '64px',
  },
  doneItem: {
    background: '#f0fdf4',
    borderColor: '#bbf7d0',
    color: '#166534',
  },
  activeItem: {
    background: '#eff6ff',
    borderColor: '#bfdbfe',
    color: '#1d4ed8',
    boxShadow: '0 10px 20px rgba(37, 99, 235, 0.12)',
  },
  dot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#cbd5e1',
    color: '#fff',
    flexShrink: 0,
    fontSize: '13px',
  },
  doneDot: {
    background: '#16a34a',
  },
  activeDot: {
    background: '#2563eb',
  },
  labelWrap: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.2,
  },
  label: {
    fontSize: '14px',
  },
  subLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'inherit',
    opacity: 0.75,
  },
}

const AddGuardian = ({ onNavigate }) => {
  const {
    role,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    status: authStatus,
  } = useAuth()
  
  const { activeSchoolId } = useSchool()
  
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = String(role || '').toUpperCase() === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = String(role || '').toUpperCase() === 'SCHOOL_ADMIN'
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : () => {}

  const [form, setForm] = useState(INITIAL_FORM)
  const [editId, setEditId] = useState(null)
  
  const [schools, setSchools] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [selectedHeadOfficeId, setSelectedHeadOfficeId] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  
  const [photoPreview, setPhotoPreview] = useState(null)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const photoRef = useRef(null)

  const loadSchools = useCallback(async () => {
    try {
      if (isSchoolAdmin) {
        setSchools(
          authSchoolId
            ? [
                {
                  id: authSchoolId,
                  schoolName: authSchoolName || `School ${authSchoolId}`,
                  headOfficeId: authHeadOfficeId ?? null,
                },
              ]
            : [],
        )
        return
      }

      const data = await fetchSchoolsLookup()
      setSchools(Array.isArray(data) ? data : [])
    } catch {
      setSchools(
        isSchoolAdmin && authSchoolId
          ? [
              {
                id: authSchoolId,
                schoolName: authSchoolName || `School ${authSchoolId}`,
                headOfficeId: authHeadOfficeId ?? null,
              },
            ]
          : [],
      )
    }
  }, [authHeadOfficeId, authSchoolId, authSchoolName, isSchoolAdmin])

  const loadHeadOffices = useCallback(async () => {
    try {
      const data = await fetchHeadOfficesPage(0, 500)
      const list = Array.isArray(data?.content) ? data.content : []
      setHeadOffices(
        list.map((ho) => ({ id: ho?.id, name: ho?.name || ho?.headOfficeName || '' }))
          .filter((ho) => ho.id != null && ho.name)
          .sort((a, b) => String(a.name).localeCompare(String(b.name)))
      )
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    void loadSchools()
  }, [loadSchools])

  useEffect(() => {
    if (!isSuperAdmin) return
    void loadHeadOffices()
  }, [isSuperAdmin, loadHeadOffices])

  const currentSchoolOption = useMemo(() => {
    if (!authSchoolId) return null
    return {
      id: authSchoolId,
      schoolName: authSchoolName || `School ${authSchoolId}`,
      headOfficeId: authHeadOfficeId ?? null,
    }
  }, [authHeadOfficeId, authSchoolId, authSchoolName])

  const schoolOptions = useMemo(() => {
    if (isSchoolAdmin) {
      return currentSchoolOption ? [currentSchoolOption] : []
    }

    if (isHeadOfficeAdmin) {
      const targetHeadOfficeId = authHeadOfficeId != null ? String(authHeadOfficeId) : ''
      return [...schools]
        .filter((school) => String(school?.headOfficeId ?? '') === targetHeadOfficeId)
        .sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
    }

    if (selectedHeadOfficeId) {
      return [...schools]
        .filter((school) => String(school?.headOfficeId ?? '') === String(selectedHeadOfficeId))
        .sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
    }

    return [...schools].sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
  }, [authHeadOfficeId, currentSchoolOption, isHeadOfficeAdmin, isSchoolAdmin, schools, selectedHeadOfficeId])

  const scopeLabel = useMemo(() => {
    if (isSchoolAdmin) {
      return `School scope: ${authSchoolName || `School ${authSchoolId}`}`
    }

    if (isHeadOfficeAdmin) {
      return `Head office scope: ${authHeadOfficeName || `Head Office ${authHeadOfficeId}`}`
    }

    if (selectedHeadOfficeId) {
      const selectedHeadOffice = headOffices.find((ho) => String(ho.id) === String(selectedHeadOfficeId))
      const selectedSchool = schoolOptions.find((school) => String(school.id) === String(form.schoolId))
      return `Scope: ${selectedHeadOffice?.name || `Head Office ${selectedHeadOfficeId}`} / ${selectedSchool?.schoolName || 'Select school'}`
    }

    return 'Super admin scope: all schools'
  }, [
    authHeadOfficeId,
    authHeadOfficeName,
    authSchoolId,
    authSchoolName,
    headOffices,
    isHeadOfficeAdmin,
    isSchoolAdmin,
    selectedHeadOfficeId,
    schoolOptions,
    form.schoolId,
  ])

  // Setup Form / Edit mode
  useEffect(() => {
    if (authStatus !== 'ready') return

    // Apply Scope Hook configuration
    if (isSchoolAdmin && authSchoolId) {
      setForm((prev) => ({ ...prev, schoolId: String(authSchoolId) }))
    } else if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      setSelectedHeadOfficeId(String(authHeadOfficeId))
    } else if (activeSchoolId) {
      setForm((prev) => ({ ...prev, schoolId: String(activeSchoolId) }))
    }

    try {
      const stored = sessionStorage.getItem(EDIT_STORAGE_KEY)
      if (stored) {
        const row = JSON.parse(stored)
        if (row && row.id) {
          setEditId(row.id)
          
          // Match school to get head office ID
          const matchedSchool = schools.find((s) => String(s.id) === String(row.schoolId))
          if (matchedSchool?.headOfficeId != null) {
            setSelectedHeadOfficeId(String(matchedSchool.headOfficeId))
          }

          setForm({
            headOfficeId: matchedSchool?.headOfficeId != null ? String(matchedSchool.headOfficeId) : '',
            schoolId: row.schoolId != null ? String(row.schoolId) : '',
            name: row.name || '',
            phone: row.phone || '',
            profession: row.profession || '',
            religion: row.religion || '',
            presentAddress: row.presentAddress || '',
            permanentAddress: row.permanentAddress || '',
            nationalId: row.nationalId || '',
            email: row.email || '',
            username: row.username || '',
            password: '', // Blank during edit unless changing
            otherInfo: row.otherInfo || '',
            photo: row.photoUrl || null,
          })
          setPhotoPreview(row.photoUrl || null)
        }
      }
    } catch {
      // ignore
    }
  }, [activeSchoolId, authHeadOfficeId, authSchoolId, authStatus, isHeadOfficeAdmin, isSchoolAdmin, schools])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = String(ev.target?.result || '')
      setForm((prev) => ({ ...prev, photo: dataUrl }))
      setPhotoPreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, photo: null }))
    setPhotoPreview(null)
    if (photoRef.current) photoRef.current.value = ''
  }

  const validateStep = useCallback(
    (step) => {
      if (step === 0) {
        if (!form.schoolId) return 'Please select a school'
        if (!form.name.trim()) return 'Name is required'
        if (!form.phone.trim()) return 'Phone is required'
        if (!form.profession) return 'Profession is required'
      }

      if (step === 1) {
        if (!form.username.trim()) return 'Username is required'
        if (!editId && !form.password) return 'Password is required'
      }

      return ''
    },
    [editId, form.name, form.password, form.phone, form.profession, form.schoolId, form.username],
  )

  const handleNextStep = () => {
    const message = validateStep(activeStep)
    if (message) {
      setError(message)
      return
    }
    setError('')
    setActiveStep((step) => Math.min(STEPS.length - 1, step + 1))
  }

  const handlePrevStep = () => {
    setError('')
    setActiveStep((step) => Math.max(0, step - 1))
  }

  const handleTabChange = (index) => {
    if (index > activeStep) {
      const message = validateStep(activeStep)
      if (message) {
        setError(message)
        return
      }
    }

    setError('')
    setActiveStep(index)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setBusy(true)

    const step0Message = validateStep(0)
    const step1Message = validateStep(1)
    if (step0Message || step1Message) {
      setError(step0Message || step1Message)
      setBusy(false)
      return
    }

    try {
      const payload = {
        schoolId: Number(form.schoolId),
        name: form.name.trim(),
        phone: form.phone.trim(),
        profession: form.profession,
        religion: form.religion ? form.religion.trim() : null,
        presentAddress: form.presentAddress ? form.presentAddress.trim() : null,
        permanentAddress: form.permanentAddress ? form.permanentAddress.trim() : null,
        nationalId: form.nationalId ? form.nationalId.trim() : null,
        email: form.email ? form.email.trim() : null,
        username: form.username.trim(),
        password: form.password ? form.password : null,
        otherInfo: form.otherInfo ? form.otherInfo.trim() : null,
        photoUrl: form.photo || null,
      }

      if (editId) {
        await updateGuardian(editId, payload)
        setSuccess('Guardian updated successfully!')
      } else {
        await createGuardian(payload)
        setSuccess('Guardian added successfully!')
      }

      setTimeout(() => {
        try {
          sessionStorage.removeItem(EDIT_STORAGE_KEY)
        } catch {
          // ignore
        }
        navigateTo('guardian')
      }, 1500)
    } catch (err) {
      setError(err?.message || 'Failed to save guardian')
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    } catch {
      // ignore
    }
    navigateTo('guardian')
  }

  const isEdit = !!editId

  // Styling identical to SuperAdminCreate for consistency
  const cardStyle = {
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
  }

  const headerStyle = {
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderBottom: '1px solid #e2e8f0',
    padding: '16px 24px',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
  }

  const inputStyle = {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <div className="dashboard-main-body">
      {/* Header & Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {isEdit ? 'Edit Guardian' : 'Add Guardian'}
          </h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0 text-sm"
              onClick={() => navigateTo('dashboard')}
            >
              Dashboard
            </button>
            <span className="text-secondary-light text-sm"> / </span>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0 text-sm"
              onClick={handleCancel}
            >
              Guardian
            </button>
            <span className="text-secondary-light text-sm"> / {isEdit ? 'Edit' : 'Add'}</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            className="btn btn-outline-secondary d-flex align-items-center gap-6"
            onClick={handleCancel}
          >
            <i className="ri-arrow-left-line"></i> Back to List
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-8 mb-20">
          <i className="ri-error-warning-line text-lg"></i>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success d-flex align-items-center gap-8 mb-20">
          <i className="ri-checkbox-circle-line text-lg"></i>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="d-flex flex-column gap-24">
          <div className="card h-100">
            <div className="card-header border-bottom border-neutral-200 px-20 py-0 d-flex gap-0 scroll-x-mobile">
              {STEPS.map((step, idx) => (
                <button
                  key={step}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    handleTabChange(idx)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: activeStep === idx ? '2px solid var(--primary-600, #4f46e5)' : '2px solid transparent',
                    color: activeStep === idx ? 'var(--primary-600, #4f46e5)' : 'var(--secondary-light, #667085)',
                    fontWeight: activeStep === idx ? 600 : 400,
                    padding: '14px 20px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                  }}
                >
                  {step}
                </button>
              ))}
            </div>
          </div>

          {activeStep === 0 && (
            <div className="card bg-white" style={cardStyle}>
              <div style={headerStyle}>
                <h6 className="fw-semibold text-primary-light mb-0 d-flex align-items-center gap-8">
                  <i className="ri-user-line text-primary-600"></i> Basic Information
                </h6>
              </div>

              <div className="card-body p-24">
                <div className="alert alert-info d-flex align-items-center gap-8 mb-24">
                  <i className="ri-information-line"></i>
                  <span>{scopeLabel}</span>
                </div>

                <div className="row g-20 mb-20">
                  <div className="col-12">
                    <ManualScopeSelectors
                      enabled={!isSchoolAdmin}
                      headOffices={headOffices}
                      schoolOptions={schoolOptions}
                      selectedHeadOfficeId={selectedHeadOfficeId}
                      onHeadOfficeChange={(value) => {
                        setSelectedHeadOfficeId(value)
                        setForm((prev) => ({ ...prev, schoolId: '' }))
                      }}
                      selectedSchoolId={form.schoolId}
                      onSchoolChange={(value) => setForm((prev) => ({ ...prev, schoolId: value }))}
                      showSchoolSelector={true}
                      showHeadOfficeSelector={isSuperAdmin}
                      compact
                    />
                  </div>
                </div>

                <div className="row g-20">
                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="name" className="form-label fw-medium text-primary-light mb-0">Name *</label>
                    <input
                      type="text"
                      id="name"
                      className="form-control"
                      style={inputStyle}
                      placeholder="Name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <PhoneCodeField
                      id="phone"
                      label="Phone"
                      required
                      value={form.phone}
                      onChange={(fullValue) => setForm((prev) => ({ ...prev, phone: fullValue }))}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="profession" className="form-label fw-medium text-primary-light mb-0">Profession *</label>
                    <select
                      id="profession"
                      className="form-select"
                      style={inputStyle}
                      value={form.profession}
                      onChange={handleChange}
                      required
                    >
                      <option value="">--Select--</option>
                      {PROFESSION_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="religion" className="form-label fw-medium text-primary-light mb-0">Religion</label>
                    <input
                      type="text"
                      id="religion"
                      className="form-control"
                      style={inputStyle}
                      placeholder="Religion"
                      value={form.religion}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="presentAddress" className="form-label fw-medium text-primary-light mb-0">Present Address</label>
                    <textarea
                      id="presentAddress"
                      className="form-control"
                      style={{ ...inputStyle, minHeight: '80px' }}
                      placeholder="Present Address"
                      value={form.presentAddress}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="permanentAddress" className="form-label fw-medium text-primary-light mb-0">Permanent Address</label>
                    <textarea
                      id="permanentAddress"
                      className="form-control"
                      style={{ ...inputStyle, minHeight: '80px' }}
                      placeholder="Permanent Address"
                      value={form.permanentAddress}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div className="card bg-white" style={cardStyle}>
              <div style={headerStyle}>
                <h6 className="fw-semibold text-primary-light mb-0 d-flex align-items-center gap-8">
                  <i className="ri-graduation-cap-line text-primary-600"></i> Academic Information
                </h6>
              </div>

              <div className="card-body p-24">
                <div className="row g-20">
                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="nationalId" className="form-label fw-medium text-primary-light mb-0">National ID</label>
                    <input
                      type="text"
                      id="nationalId"
                      className="form-control"
                      style={inputStyle}
                      placeholder="National ID"
                      value={form.nationalId}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="email" className="form-label fw-medium text-primary-light mb-0">Email</label>
                    <input
                      type="email"
                      id="email"
                      className="form-control"
                      style={inputStyle}
                      placeholder="Email"
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="username" className="form-label fw-medium text-primary-light mb-0">Username *</label>
                    <input
                      type="text"
                      id="username"
                      className="form-control"
                      style={inputStyle}
                      placeholder="Username"
                      value={form.username}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="password" className="form-label fw-medium text-primary-light mb-0">
                      Password {isEdit ? '(Leave blank to keep current)' : '*'}
                    </label>
                    <div className="position-relative">
                      <input
                        type={passwordVisible ? 'text' : 'password'}
                        id="password"
                        className="form-control"
                        style={{ ...inputStyle, paddingRight: '44px' }}
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        required={!isEdit}
                      />
                      <button
                        type="button"
                        className="position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent text-secondary-light pe-12"
                        onClick={() => setPasswordVisible((v) => !v)}
                        aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                        style={{ lineHeight: 1 }}
                      >
                        <i className={passwordVisible ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="card bg-white" style={cardStyle}>
              <div style={headerStyle}>
                <h6 className="fw-semibold text-primary-light mb-0 d-flex align-items-center gap-8">
                  <i className="ri-information-line text-primary-600"></i> Other Information
                </h6>
              </div>

              <div className="card-body p-24">
                <div className="row g-20">
                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="otherInfo" className="form-label fw-medium text-primary-light mb-0">Other Info</label>
                    <textarea
                      id="otherInfo"
                      className="form-control"
                      style={{ ...inputStyle, minHeight: '120px' }}
                      placeholder="Other Info"
                      value={form.otherInfo}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label className="form-label fw-medium text-primary-light mb-0">Photo</label>

                    <div
                      style={{
                        border: '2px dashed #cbd5e1',
                        borderRadius: '12px',
                        padding: '20px',
                        background: '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
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
                            border: '1px solid #cbd5e1',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            background: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <i className="ri-user-add-line" style={{ fontSize: '1.5rem', color: '#475569' }}></i>
                        </div>
                      )}
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                          {photoPreview ? 'Change Photo' : 'Upload Photo'}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                          Dimension:- Max-W: 120px, Max-H: 130px
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                          Image file format: .jpg, .jpeg, .png or .gif
                        </p>
                      </div>
                      <input
                        ref={photoRef}
                        type="file"
                        id="photo"
                        accept=".jpg,.jpeg,.png,.gif"
                        style={{ display: 'none' }}
                        onChange={handlePhotoChange}
                      />
                    </div>

                    {photoPreview ? (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm align-self-start"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemovePhoto()
                        }}
                      >
                        <i className="ri-delete-bin-line"></i> Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center gap-16 py-12 flex-wrap">
            <div className="d-flex align-items-center gap-16">
              {activeStep > 0 && (
                <button
                  type="button"
                  className="btn btn-outline-secondary px-24 py-10 radius-8"
                  onClick={handlePrevStep}
                  disabled={busy}
                >
                  Back
                </button>
              )}
              <button
                type="button"
                className="btn btn-outline-secondary px-24 py-10 radius-8"
                onClick={handleCancel}
                disabled={busy}
              >
                Cancel
              </button>
            </div>

            <div>
              {activeStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary-600 px-32 py-10 radius-8 d-flex align-items-center gap-8"
                  onClick={(e) => {
                    e.preventDefault()
                    handleNextStep()
                  }}
                  disabled={busy}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary-600 px-32 py-10 radius-8 d-flex align-items-center gap-8"
                  onClick={(e) => {
                    e.preventDefault()
                    void handleSubmit(e)
                  }}
                  disabled={busy}
                >
                  {busy && <span className="spinner-border spinner-border-sm" role="status" />}
                  {isEdit ? 'Update Guardian' : 'Save Guardian'}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AddGuardian
