import React, { useState, useEffect, useMemo, useRef } from 'react'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createTeacher, updateTeacher } from '../apis/teachersApi'
import { fetchAllDepartments } from '../apis/departmentsApi'
import { fetchDesignations } from '../apis/designationsApi'
import { fetchSchoolRoles } from '../apis/schoolRbacApi'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { findSchoolById } from '../utils/schoolScope'
import PhoneCodeField from '../components/PhoneCodeField'
import AddDepartmentModal from '../components/AddDepartmentModal'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-teacher-row'

const TABS = ['Basic Info', 'Address Info', 'Academic Info', 'Other Info', 'Review']

const emptyForm = {
  // Basic
  name: '', nationalId: '', department: '', phone: '', gender: '', bloodGroup: '', religion: '', birthDate: '', presentAddress: '', permanentAddress: '',
  // Academic
  email: '', username: '', password: '', salaryGrade: '', salaryType: '', designationId: '', role: 'Teacher', joiningDate: '', resume: null,
  // Other
  isViewOnWeb: 'No', facebookUrl: '', linkedinUrl: '', twitterUrl: '', instagramUrl: '', youtubeUrl: '', pinterestUrl: '', otherInfo: '', photo: null,
  schoolId: '',
}

const normalizeYesNo = (value, fallback = 'No') => {
  const text = String(value ?? '').trim().toLowerCase()
  if (['yes', 'y', 'true', '1'].includes(text)) return 'Yes'
  if (['no', 'n', 'false', '0'].includes(text)) return 'No'
  return fallback
}

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
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
  Designation: 'ri-award-line',
  Role: 'ri-shield-user-line',
  'Joining Date': 'ri-calendar-check-line',
  'Is View on Web?': 'ri-global-line',
  'Facebook URL': 'ri-facebook-circle-line',
  'LinkedIn URL': 'ri-linkedin-box-line',
  'Twitter URL': 'ri-twitter-x-line',
  'Instagram URL': 'ri-instagram-line',
  'Youtube URL': 'ri-youtube-line',
  'Pinterest URL': 'ri-pinterest-line',
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

const AddTeacher = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const isSchoolAdmin = String(role || '').toUpperCase() === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const currentSchoolOption = useMemo(() => {
    if (!isSchoolAdmin || authSchoolId == null) return null
    return {
      id: authSchoolId,
      schoolName: authSchoolName || `School ${authSchoolId}`,
      headOfficeId: activeSchoolId ?? null,
    }
  }, [activeSchoolId, authSchoolId, authSchoolName, isSchoolAdmin])

  const [initialEditRow] = useState(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })

  const [activeTab, setActiveTab] = useState(0)
  const [schools, setSchools] = useState([])
  const [departments, setDepartments] = useState([])
  const [roles, setRoles] = useState([])
  const [designations, setDesignations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isQuickAddDeptOpen, setIsQuickAddDeptOpen] = useState(false)

  const [form, setForm] = useState(() => {
    if (initialEditRow) {
      return {
        ...initialEditRow,
        schoolId: initialEditRow.schoolId ? String(initialEditRow.schoolId) : '',
        designationId: initialEditRow.designationId ? String(initialEditRow.designationId) : '',
        role: String(initialEditRow.role || '').trim().toUpperCase(),
        isViewOnWeb: normalizeYesNo(initialEditRow.isViewOnWeb, emptyForm.isViewOnWeb),
      }
    }
    const listSchoolId = isSuperAdmin ? (activeSchoolId ? String(activeSchoolId) : '') : (authSchoolId ? String(authSchoolId) : '')
    return { ...emptyForm, schoolId: listSchoolId }
  })

  const [photoPreview, setPhotoPreview] = useState(initialEditRow?.photoUrl || null)
  const photoRef = useRef()
  const selectedDepartmentSchoolId = useMemo(() => {
    if (form.schoolId) return String(form.schoolId)
    if (isSchoolAdmin && currentSchoolOption?.id != null) return String(currentSchoolOption.id)
    return ''
  }, [currentSchoolOption, form.schoolId, isSchoolAdmin])

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), [])

  useEffect(() => {
    if (isSchoolAdmin) {
      setSchools(currentSchoolOption ? [currentSchoolOption] : [])
      return
    }
    fetchSchoolsLookup().then(setSchools).catch(() => setSchools([]))
  }, [currentSchoolOption, isSchoolAdmin])

  useEffect(() => {
    if (!selectedDepartmentSchoolId) {
      setDepartments([])
      return
    }

    let cancelled = false
    const run = async () => {
      try {
        const rows = await fetchAllDepartments(selectedDepartmentSchoolId)
        if (!cancelled) setDepartments(Array.isArray(rows) ? rows : [])
      } catch {
        if (!cancelled) setDepartments([])
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [selectedDepartmentSchoolId])

  useEffect(() => {
    if (!form.schoolId) {
      setRoles([])
      return
    }

    let cancelled = false

    const loadRoles = async () => {
      try {
        const data = await fetchSchoolRoles({ schoolId: form.schoolId })
        if (cancelled) return

        const list = Array.isArray(data) ? data : []
        const normalized = []
        const seen = new Set()

        for (const item of list) {
          const roleName = String(item?.name || '').trim().toUpperCase()
          if (!roleName) continue
          if (roleName === 'SUPER_ADMIN' || roleName === 'HEAD_OFFICE_ADMIN') continue
          if (seen.has(roleName)) continue
          seen.add(roleName)
          normalized.push(roleName)
        }

        if (!seen.has('TEACHER')) normalized.push('TEACHER')
        normalized.sort((a, b) => a.localeCompare(b))
        setRoles(normalized)
      } catch {
        if (!cancelled) setRoles([])
      }
    }

    void loadRoles()

    return () => {
      cancelled = true
    }
  }, [form.schoolId])

  useEffect(() => {
    if (!initialEditRow || !isSuperAdmin) return

    const schoolId = initialEditRow.schoolId != null ? String(initialEditRow.schoolId) : ''
    const school = findSchoolById(schools, initialEditRow.schoolId)
    const headOfficeId = initialEditRow.headOfficeId != null
      ? String(initialEditRow.headOfficeId)
      : school?.headOfficeId != null
        ? String(school.headOfficeId)
        : ''

    if (headOfficeId) {
      manualScope.setSelectedScope(headOfficeId, schoolId)
    }
  }, [initialEditRow, isSuperAdmin, schools, manualScope])

  useEffect(() => {
    if (!form.schoolId || !form.role) { setDesignations([]); return }
    fetchDesignations({ schoolId: form.schoolId, role: form.role })
      .then(setDesignations)
      .catch(() => setDesignations([]))
  }, [form.role, form.schoolId])

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions
    if (isSchoolAdmin) return currentSchoolOption ? [currentSchoolOption] : []
    return contextSchoolOptions || []
  }, [currentSchoolOption, contextSchoolOptions, isSchoolAdmin, isSuperAdmin, manualScope.schoolOptions])

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [id]: type === 'checkbox' ? checked : value }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setForm(prev => ({ ...prev, photo: file }))
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (loading) return
    setError('')
    setSuccess(false)

    if (!form.name) { setError('Name is required'); setActiveTab(0); return }
    if (!form.schoolId) { setError('School is required'); setActiveTab(0); return }
    if (!form.phone) { setError('Phone is required'); setActiveTab(0); return }
    if (!form.username) { setError('Username is required'); setActiveTab(2); return }
    if (!form.password && !initialEditRow) { setError('Password is required'); setActiveTab(2); return }
    if (!form.role) { setError('Role is required'); setActiveTab(2); return }

    setLoading(true)
    try {
      const payload = {
        ...form,
        role: String(form.role || '').trim().toUpperCase(),
        schoolId: Number(form.schoolId),
        designationId: form.designationId ? Number(form.designationId) : null,
      }
      if (initialEditRow) {
        await updateTeacher(initialEditRow.id, payload, form)
      } else {
        await createTeacher(payload, form)
      }
      setSuccess(true)
      setTimeout(() => onNavigate('manage-teacher'), 1000)
    } catch (err) {
      setError(err?.message || 'Failed to process teacher')
    } finally {
      setLoading(false)
    }
  }

  const handleDeptAdded = (created) => {
    if (!created) return
    setDepartments((prev) => {
      const next = [...prev.filter((row) => String(row?.id) !== String(created.id)), created]
      return next.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
    })
    setForm((prev) => ({ ...prev, department: created.title }))
  }

  const validateCurrentTab = () => {
    setError('')
    if (activeTab === 0) {
      if (!form.schoolId) return 'School is required'
      if (!form.name.trim()) return 'Name is required'
      if (!form.phone.trim()) return 'Phone is required'
      if (!form.gender) return 'Gender is required'
      if (!form.birthDate) return 'Birth Date is required'
    }
    if (activeTab === 2) {
      if (!form.username.trim()) return 'Username is required'
      if (!isEditing && !form.password.trim()) return 'Password is required'
      if (!form.designationId) return 'Designation is required'
      if (!form.role) return 'Role is required'
      if (!form.joiningDate) return 'Joining Date is required'
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

  const handleNextStep = () => {
    const err = validateCurrentTab()
    if (err) {
      setError(err)
      return
    }
    setActiveTab((prev) => Math.min(prev + 1, TABS.length - 1))
    setError('')
  }

  const handlePrevStep = () => {
    setActiveTab((prev) => Math.max(0, prev - 1))
    setError('')
  }

  const renderSummaryItem = (label, value) => (
    <div className="d-flex flex-column gap-4">
      <span className="text-secondary-light text-sm">{label}</span>
      <span className="fw-medium text-primary-light">{value || '-'}</span>
    </div>
  )

  const isEditing = Boolean(initialEditRow)

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">{isEditing ? 'Edit' : 'Add'} Teacher</h1>
          <span className="text-secondary-light">Manage Teacher / {isEditing ? 'Edit' : 'Add'}</span>
        </div>
        <button className="btn btn-light border px-20 d-flex align-items-center gap-6" onClick={() => onNavigate('manage-teacher')}>
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card h-100">
        <div className="card-header border-bottom border-neutral-200 px-20 py-0 d-flex gap-0 scroll-x-mobile">
            {TABS.map((tab, idx) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === idx ? '2px solid var(--primary-600, #4f46e5)' : '2px solid transparent',
                  color: activeTab === idx ? 'var(--primary-600, #4f46e5)' : 'var(--secondary-light, #667085)',
                  fontWeight: activeTab === idx ? 600 : 400,
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
          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-10 mb-24 radius-8">
              <i className="ri-error-warning-line text-lg" />
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success d-flex align-items-center gap-10 mb-24 radius-8">
              <i className="ri-checkbox-circle-line text-lg" />
              Teacher {isEditing ? 'updated' : 'created'} successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="tab-content">
              {/* Basic Info */}
              {activeTab === 0 && (
                <div className="row g-20">
                  {isSuperAdmin ? (
                    <div className="col-12 mb-20">
                      <ManualScopeSelectors
                        enabled={isSuperAdmin}
                        headOffices={manualScope.headOffices}
                        schoolOptions={schoolOptions}
                        selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                        onHeadOfficeChange={(val) => { manualScope.setSelectedHeadOfficeId(val); setForm(p => ({ ...p, schoolId: '', designationId: '', role: '' })) }}
                        selectedSchoolId={form.schoolId}
                        onSchoolChange={(val) => setForm(p => ({ ...p, schoolId: val, designationId: '', role: '' }))}
                        compact
                      />
                    </div>
                  ) : (
                    <FormField label="School Name" required>
                      <select className="form-control form-select ps-40" id="schoolId" value={form.schoolId} onChange={(e) => setForm(p => ({ ...p, schoolId: e.target.value, designationId: '', role: '' }))}>
                        <option value="">--Select School--</option>
                        {schoolOptions.map((s) => (
                          <option key={s.id} value={String(s.id)}>{s.schoolName}</option>
                        ))}
                      </select>
                    </FormField>
                  )}

                  <FormField label="Name" required>
                    <input type="text" id="name" className="form-control ps-40" placeholder="Enter name" value={form.name} onChange={handleChange} />
                  </FormField>

                  <FormField label="National ID">
                    <input type="text" id="nationalId" className="form-control ps-40" placeholder="Enter national ID" value={form.nationalId} onChange={handleChange} />
                  </FormField>

                  <FormField label="Department" required noIcon>
                    <div className="d-flex gap-8 align-items-center">
                      <div className="position-relative flex-grow-1">
                        <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light"><i className="ri-building-line"></i></span>
                        <select className="form-control form-select ps-40" id="department" value={form.department} onChange={handleChange}>
                          <option value="">--Select--</option>
                          {departments.map((d) => <option key={d.id} value={d.title}>{d.title}</option>)}
                        </select>
                      </div>
                      <button type="button" className="btn btn-light border px-12 h-44-px" title="Add new department" onClick={() => setIsQuickAddDeptOpen(true)}>
                        <i className="ri-add-line"></i>
                      </button>
                    </div>
                  </FormField>

                  <div className="col-md-6 mb-20">
                    <PhoneCodeField
                      id="phone"
                      label="Phone number"
                      required
                      value={form.phone}
                      onChange={(val) => setForm(p => ({ ...p, phone: val }))}
                    />
                  </div>

                  <FormField label="Gender" required>
                    <select className="form-control form-select ps-40" id="gender" value={form.gender} onChange={handleChange}>
                      <option value="">--Select--</option>
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </FormField>

                  <FormField label="Blood Group">
                    <select className="form-control form-select ps-40" id="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
                      <option value="">--Select--</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg}>{bg}</option>)}
                    </select>
                  </FormField>

                  <FormField label="Religion">
                    <input type="text" id="religion" className="form-control ps-40" placeholder="Enter religion" value={form.religion} onChange={handleChange} />
                  </FormField>

                  <FormField label="Birth Date" required>
                    <input type="date" id="birthDate" className="form-control ps-40" value={form.birthDate} onChange={handleChange} />
                  </FormField>
                </div>
              )}

              {/* Address Info */}
              {activeTab === 1 && (
                <div className="row g-20">
                  <FormField label="Present Address" full noIcon>
                    <textarea id="presentAddress" rows="3" className="form-control pt-10" placeholder="Enter present address" value={form.presentAddress} onChange={handleChange} />
                  </FormField>
                  <FormField label="Permanent Address" full noIcon>
                    <textarea id="permanentAddress" rows="3" className="form-control pt-10" placeholder="Enter permanent address" value={form.permanentAddress} onChange={handleChange} />
                  </FormField>
                </div>
              )}

              {/* Academic Info */}
              {activeTab === 2 && (
                <div className="row g-20">
                  <FormField label="Email">
                    <input type="email" id="email" className="form-control ps-40" placeholder="Enter email" value={form.email} onChange={handleChange} />
                  </FormField>
                  <FormField label="Username" required>
                    <input type="text" id="username" className="form-control ps-40" placeholder="Enter username" value={form.username} onChange={handleChange} />
                  </FormField>
                  <FormField label="Password" required={!isEditing}>
                    <input type="password" id="password" className="form-control ps-40" placeholder={isEditing ? 'Leave blank to keep same' : 'Enter password'} value={form.password} onChange={handleChange} />
                  </FormField>
                  <FormField label="Salary Grade" required>
                    <select className="form-control form-select ps-40" id="salaryGrade" value={form.salaryGrade} onChange={handleChange}>
                      <option value="">--Select--</option>
                      <option>Grade A</option><option>Grade B</option><option>Grade C</option>
                    </select>
                  </FormField>
                  <FormField label="Salary Type" required>
                    <select className="form-control form-select ps-40" id="salaryType" value={form.salaryType} onChange={handleChange}>
                      <option value="">--Select--</option>
                      <option>Monthly</option><option>Hourly</option>
                    </select>
                  </FormField>
                  <FormField label="Role" required>
                    <select
                      className="form-control form-select ps-40"
                      id="role"
                      value={form.role}
                      onChange={(e) => setForm((p) => ({ ...p, role: e.target.value, designationId: '' }))}
                      disabled={!form.schoolId}
                    >
                      <option value="">--Select--</option>
                      {roles.map((roleName) => (
                        <option key={roleName} value={roleName}>
                          {roleName.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Designation" required>
                    <select
                      className="form-control form-select ps-40"
                      id="designationId"
                      value={form.designationId}
                      onChange={handleChange}
                      disabled={!form.schoolId || !form.role}
                    >
                      <option value="">--Select--</option>
                      {designations.map((d) => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Joining Date" required>
                    <input type="date" id="joiningDate" className="form-control ps-40" value={form.joiningDate} onChange={handleChange} />
                  </FormField>
                  <FormField label="Resume" full noIcon>
                    <input type="file" className="form-control" id="resume" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={(e) => setForm(p => ({ ...p, resume: e.target.files[0] }))} />
                    <span className="text-xs text-secondary-light mt-4">Formats: .pdf, .doc, .ppt, .txt</span>
                  </FormField>
                </div>
              )}

              {/* Other Info */}
              {activeTab === 3 && (
                <div className="row g-20">
                  <FormField label="Is View on Web?">
                    <select className="form-control form-select ps-40" id="isViewOnWeb" value={form.isViewOnWeb} onChange={handleChange}>
                      <option>Yes</option><option>No</option>
                    </select>
                  </FormField>
                  <FormField label="Facebook URL"><input type="url" id="facebookUrl" className="form-control ps-40" placeholder="https://facebook.com/..." value={form.facebookUrl} onChange={handleChange} /></FormField>
                  <FormField label="LinkedIn URL"><input type="url" id="linkedinId" className="form-control ps-40" placeholder="https://linkedin.com/..." value={form.linkedinUrl} onChange={handleChange} /></FormField>
                  <FormField label="Twitter URL"><input type="url" id="twitterUrl" className="form-control ps-40" placeholder="https://twitter.com/..." value={form.twitterUrl} onChange={handleChange} /></FormField>
                  <FormField label="Instagram URL"><input type="url" id="instagramUrl" className="form-control ps-40" placeholder="https://instagram.com/..." value={form.instagramUrl} onChange={handleChange} /></FormField>
                  <FormField label="Youtube URL"><input type="url" id="youtubeUrl" className="form-control ps-40" placeholder="https://youtube.com/..." value={form.youtubeUrl} onChange={handleChange} /></FormField>
                  <FormField label="Pinterest URL"><input type="url" id="pinterestUrl" className="form-control ps-40" placeholder="https://pinterest.com/..." value={form.pinterestUrl} onChange={handleChange} /></FormField>
                  <FormField label="Other Info" full noIcon>
                    <input type="text" id="otherInfo" className="form-control" placeholder="Any other info" value={form.otherInfo} onChange={handleChange} />
                  </FormField>
                  <FormField label="Photo" full noIcon>
                    <input ref={photoRef} type="file" accept=".jpg,.jpeg,.png,.gif" style={{ display: 'none' }} onChange={handlePhotoChange} />
                    <div className="d-flex align-items-center gap-16">
                      <button type="button" className="btn btn-light border d-flex align-items-center gap-8" onClick={() => photoRef.current.click()}>
                        <i className="ri-upload-2-line"></i> Upload Photo
                      </button>
                      {photoPreview && (
                        <img src={photoPreview} alt="preview" className="w-60-px h-65-px rounded object-fit-cover border" />
                      )}
                    </div>
                    <span className="text-xs text-secondary-light mt-4">Max-W: 120px, Max-H: 130px</span>
                  </FormField>
                </div>
              )}

              {/* Review */}
              {activeTab === 4 && (
                <div className="row g-20">
                  <div className="col-12">
                    <h6 className="text-primary-light mt-0 mb-16 border-bottom pb-8">Review Teacher Information</h6>
                  </div>
                  <div className="col-md-6">{renderSummaryItem('School', schoolOptions.find((s) => String(s.id) === String(form.schoolId))?.schoolName || form.schoolId)}</div>
                  <div className="col-md-6">{renderSummaryItem('Name', form.name)}</div>
                  <div className="col-md-6">{renderSummaryItem('National ID', form.nationalId)}</div>
                  <div className="col-md-6">{renderSummaryItem('Department', form.department)}</div>
                  <div className="col-md-6">{renderSummaryItem('Phone', form.phone)}</div>
                  <div className="col-md-6">{renderSummaryItem('Gender', form.gender)}</div>
                  <div className="col-md-6">{renderSummaryItem('Blood Group', form.bloodGroup)}</div>
                  <div className="col-md-6">{renderSummaryItem('Religion', form.religion)}</div>
                  <div className="col-md-6">{renderSummaryItem('Birth Date', form.birthDate)}</div>
                  <div className="col-md-6">{renderSummaryItem('Present Address', form.presentAddress)}</div>
                  <div className="col-md-6">{renderSummaryItem('Permanent Address', form.permanentAddress)}</div>
                  <div className="col-md-6">{renderSummaryItem('Email', form.email)}</div>
                  <div className="col-md-6">{renderSummaryItem('Username', form.username)}</div>
                  <div className="col-md-6">{renderSummaryItem('Salary Grade', form.salaryGrade)}</div>
                  <div className="col-md-6">{renderSummaryItem('Salary Type', form.salaryType)}</div>
                  <div className="col-md-6">{renderSummaryItem('Designation', designations.find((d) => String(d.id) === String(form.designationId))?.name || form.designationId)}</div>
                  <div className="col-md-6">{renderSummaryItem('Role', form.role)}</div>
                  <div className="col-md-6">{renderSummaryItem('Joining Date', form.joiningDate)}</div>
                  <div className="col-md-6">{renderSummaryItem('Is View on Web?', form.isViewOnWeb)}</div>
                  <div className="col-12">{renderSummaryItem('Other Info', form.otherInfo)}</div>
                </div>
              )}
            </div>

            <div className="d-flex align-items-center justify-content-end gap-10 mt-24 pt-20 border-top border-neutral-200">
              {activeTab > 0 ? (
                <button type="button" className="btn btn-light border px-24" onClick={handlePrevStep}>
                  Previous
                </button>
              ) : null}
              <button type="button" className="btn btn-light border px-24" onClick={() => onNavigate('manage-teacher')}>Cancel</button>
              {activeTab < TABS.length - 2 ? (
                <button type="button" className="btn btn-primary-600 px-24" onClick={handleNextStep}>Next Step</button>
              ) : activeTab === TABS.length - 2 ? (
                <button type="button" className="btn btn-primary-600 px-24" onClick={handleNextStep}>Review</button>
              ) : (
                <button type="submit" className="btn btn-primary-600 px-24 d-flex align-items-center gap-8" disabled={loading}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...</>
                  ) : (
                    <><i className="ri-save-line" /> {isEditing ? 'Update' : 'Save'} Teacher</>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <AddDepartmentModal
        isOpen={isQuickAddDeptOpen}
        onClose={() => setIsQuickAddDeptOpen(false)}
        onSuccess={handleDeptAdded}
      />
    </div>
  )
}

export default AddTeacher
