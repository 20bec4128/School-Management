import { useEffect, useMemo, useState } from 'react'
import '../assets/css/addModalShared.css'
import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { createOnlineExam, updateOnlineExam } from '../apis/onlineExamsApi'
import { normalizeRole } from '../utils/roles'
import ManualScopeSelectors from '../components/ManualScopeSelectors'

const EDIT_STORAGE_KEY = 'edit-online-exam-row'
const STEPS = ['Basic Info', 'Schedule & Duration', 'Assessment & Settings']

const emptyForm = {
  id: null,
  headOfficeId: '',
  school: '',
  examTitle: '',
  className: '',
  section: '',
  subject: '',
  instruction: '',
  duration: '',
  startDate: '',
  endDate: '',
  markType: '',
  passMark: '',
  isPublish: '',
  examLimit: '',
  note: '',
}

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Head Office': 'ri-building-line',
  'Exam Title': 'ri-file-list-line',
  Class: 'ri-graduation-cap-line',
  Section: 'ri-grid-line',
  Subject: 'ri-book-open-line',
  Instruction: 'ri-survey-line',
  'Duration (Minute)': 'ri-timer-line',
  'Start Date': 'ri-calendar-line',
  'End Date': 'ri-calendar-line',
  'Mark Type': 'ri-bar-chart-2-line',
  'Pass Mark': 'ri-check-line',
  'Is Publish?': 'ri-global-line',
  'Exam limit per Student': 'ri-restriction-line',
  Note: 'ri-sticky-note-line',
}

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
            aria-hidden="true"
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
            <i className={icon} />
          </span>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

const getClassLabel = (row) => row?.className || row?.numericName || row?.name || row?.label || ''
const getSectionLabel = (row) => row?.sectionName || row?.name || row?.label || ''
const getSubjectLabel = (row) => row?.subjectName || row?.name || row?.label || ''

const AddOnlineExam = ({ onNavigate } = {}) => {
  const {
    status,
    token,
    role: authRole,
    user,
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
  } = useAuth()

  const role = useMemo(
    () => normalizeRole(authRole || user?.role || user?.userRole || user?.authority),
    [authRole, user],
  )
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'

  const manualScope = useManualSchoolScope(isSuperAdmin)
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : null

  const [initialEditRow] = useState(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const isEditMode = Boolean(initialEditRow)
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [headOffices, setHeadOffices] = useState([])
  const [schools, setSchools] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [sectionsLookup, setSectionsLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])

  const [form, setForm] = useState(() => ({
    ...emptyForm,
    id: initialEditRow?.id || null,
    headOfficeId: initialEditRow?.headOfficeId ? String(initialEditRow.headOfficeId) : (isSuperAdmin ? '' : (authHeadOfficeId != null ? String(authHeadOfficeId) : '')),
    school: initialEditRow?.schoolId ? String(initialEditRow.schoolId) : (isSchoolAdmin ? (authSchoolId != null ? String(authSchoolId) : '') : ''),
    className: initialEditRow?.classId ? String(initialEditRow.classId) : '',
    section: initialEditRow?.sectionId ? String(initialEditRow.sectionId) : '',
    subject: initialEditRow?.subjectId ? String(initialEditRow.subjectId) : '',
    examTitle: initialEditRow?.examTitle || '',
    instruction: initialEditRow?.instruction || '',
    duration: initialEditRow?.duration != null ? String(initialEditRow.duration) : '',
    startDate: initialEditRow?.startDate || '',
    endDate: initialEditRow?.endDate || '',
    markType: initialEditRow?.markType || '',
    passMark: initialEditRow?.passMark != null ? String(initialEditRow.passMark) : '',
    isPublish: initialEditRow?.isPublish || '',
    examLimit: initialEditRow?.examLimit != null ? String(initialEditRow.examLimit) : '',
    note: initialEditRow?.note || '',
  }))

  useEffect(() => {
    if (status !== 'ready' || !token) return

    const loadLookups = async () => {
      try {
        const [hoPage, sList] = await Promise.all([
          fetchHeadOfficesPage(0, 500),
          fetchSchoolsLookup(),
        ])
        setHeadOffices(Array.isArray(hoPage?.content) ? hoPage.content : [])
        setSchools(Array.isArray(sList) ? sList : [])
      } catch (e) {
        console.error('Failed to load scope lookups', e)
      }
    }

    loadLookups()
  }, [status, token])

  useEffect(() => {
    if (!isEditMode || !initialEditRow || schools.length === 0) return
    const schoolId = String(initialEditRow.schoolId || form.school || '')
    if (!schoolId) return

    const school = schools.find((item) => String(item.id) === schoolId)
    const headOfficeId = String(initialEditRow.headOfficeId || school?.headOfficeId || '')

    if (headOfficeId && form.headOfficeId !== headOfficeId) {
      setForm((prev) => ({ ...prev, headOfficeId }))
    }
    if (isSuperAdmin && schoolId) {
      manualScope.setSelectedScope(headOfficeId, schoolId)
    }
  }, [form.headOfficeId, form.school, initialEditRow, isEditMode, isSuperAdmin, manualScope, schools])

  const scopeHeadOffices = useMemo(
    () =>
      (Array.isArray(manualScope.headOffices) && manualScope.headOffices.length > 0
        ? manualScope.headOffices
        : headOffices.map((ho) => ({
            id: ho?.id,
            name: ho?.name || ho?.headOfficeName || '',
          }))).filter((ho) => ho.id != null && ho.name),
    [headOffices, manualScope.headOffices],
  )

  const schoolOptions = useMemo(() => {
    const hId = isSuperAdmin ? manualScope.selectedHeadOfficeId : (authHeadOfficeId != null ? String(authHeadOfficeId) : '')
    if (!hId) return []
    return schools.filter((s) => String(s.headOfficeId ?? '') === String(hId))
  }, [isSuperAdmin, manualScope.selectedHeadOfficeId, authHeadOfficeId, schools])

  const effectiveSchoolId = useMemo(() => {
    if (isSuperAdmin) return String(manualScope.selectedSchoolId || form.school || '')
    if (isHeadOfficeAdmin) return String(form.school || '')
    if (isSchoolAdmin) return String(authSchoolId != null ? authSchoolId : form.school || '')
    return String(form.school || '')
  }, [authSchoolId, form.school, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.selectedSchoolId])

  const activeClassIdForLookups = useMemo(() => String(form.className || ''), [form.className])

  useEffect(() => {
    if (!effectiveSchoolId) {
      setClassesLookup([])
      setSubjectsLookup([])
      return
    }

    let cancelled = false
    Promise.all([
      fetchClasses({ schoolId: effectiveSchoolId }),
      fetchSubjects({ schoolId: effectiveSchoolId }),
    ])
      .then(([classRows, subjectRows]) => {
        if (cancelled) return
        setClassesLookup(Array.isArray(classRows) ? classRows : [])
        setSubjectsLookup(Array.isArray(subjectRows) ? subjectRows : [])
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load class/subject lookups', err)
        setClassesLookup([])
        setSubjectsLookup([])
      })

    return () => {
      cancelled = true
    }
  }, [effectiveSchoolId])

  useEffect(() => {
    if (!effectiveSchoolId || !activeClassIdForLookups) {
      setSectionsLookup([])
      return
    }

    let cancelled = false
    fetchSections({ schoolId: effectiveSchoolId, classId: activeClassIdForLookups })
      .then((rows) => {
        if (!cancelled) setSectionsLookup(Array.isArray(rows) ? rows : [])
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load section lookups', err)
          setSectionsLookup([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeClassIdForLookups, effectiveSchoolId])

  useEffect(() => () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const validateStep = (currentStep) => {
    if (currentStep === 0) {
      if (isSuperAdmin && !manualScope.selectedHeadOfficeId) return 'Head Office is required.'
      if (!effectiveSchoolId) return 'School is required.'
      if (!form.examTitle.trim()) return 'Exam title is required.'
      if (!form.className) return 'Class is required.'
      if (!form.subject) return 'Subject is required.'
    }
    if (currentStep === 1) {
      if (!form.duration) return 'Duration is required.'
      if (!form.startDate) return 'Start date is required.'
      if (!form.endDate) return 'End date is required.'
    }
    if (currentStep === 2) {
      if (!form.markType) return 'Mark type is required.'
      if (!form.passMark) return 'Pass mark is required.'
      if (!form.isPublish) return 'Publish status is required.'
      if (!form.examLimit) return 'Exam limit is required.'
    }
    return ''
  }

  const handleNext = () => {
    const msg = validateStep(step)
    if (msg) {
      setError(msg)
      return
    }
    setError('')
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  const handleBack = () => {
    setError('')
    setStep((s) => Math.max(0, s - 1))
  }

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({ ...prev, [id]: value }))
  }

  const handleSave = async () => {
    const msg = validateStep(step)
    if (msg) {
      setError(msg)
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        headOfficeId: form.headOfficeId || manualScope.selectedHeadOfficeId || authHeadOfficeId || '',
        schoolId: Number(effectiveSchoolId),
        classId: Number(form.className),
        sectionId: form.section ? Number(form.section) : null,
        subjectId: Number(form.subject),
        duration: Number(form.duration),
        passMark: Number(form.passMark),
        examLimit: Number(form.examLimit),
      }

      if (isEditMode && form.id) {
        await updateOnlineExam(form.id, payload)
      } else {
        await createOnlineExam(payload)
      }

      try {
        sessionStorage.removeItem(EDIT_STORAGE_KEY)
      } catch {
        // ignore
      }

      setSuccess(true)
      setTimeout(() => {
        if (navigateTo) navigateTo('onlineexam')
        else window.history.back()
      }, 800)
    } catch (err) {
      console.error('Failed to save online exam:', err)
      setError('Failed to save online exam. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const goToStep = (targetStep) => {
    if (targetStep <= step) {
      setError('')
      setStep(targetStep)
      return
    }
    const msg = validateStep(step)
    if (msg) {
      setError(msg)
      return
    }
    setError('')
    setStep(targetStep)
  }

  const getCurrentSchoolLabel = () => {
    if (isSuperAdmin) {
      const school = schoolOptions.find((item) => String(item.id) === String(manualScope.selectedSchoolId))
      return school?.schoolName || school?.name || ''
    }
    if (isSchoolAdmin) return authSchoolName || ''
    if (isHeadOfficeAdmin) {
      const school = schoolOptions.find((item) => String(item.id) === String(form.school))
      return school?.schoolName || school?.name || ''
    }
    return authSchoolName || ''
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {isEditMode ? 'Edit' : 'Add'} Online Exam
          </h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Online Exam</span>
            <span className="text-secondary-light"> / {isEditMode ? 'Edit' : 'Add'} Online Exam</span>
          </div>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-header border-bottom border-neutral-200 px-20 py-16">
          <div className="d-flex align-items-center gap-20 flex-wrap">
            {STEPS.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => goToStep(index)}
                className="border-0 bg-transparent d-flex align-items-center gap-8 px-0"
              >
                <div className={`step-number ${step >= index ? 'active' : ''}`}>{index + 1}</div>
                <span className={`step-label ${step >= index ? 'active' : ''}`}>{label}</span>
                {index < STEPS.length - 1 && <div className="step-line" />}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body p-20">
          {error && <div className="alert alert-danger mb-20">{error}</div>}
          {success && <div className="alert alert-success mb-20">Online exam {isEditMode ? 'updated' : 'saved'} successfully!</div>}

          {step === 0 && (
            <div className="avm-grid">
              {isSuperAdmin ? (
                <div style={{ gridColumn: '1 / -1' }}>
                  <ManualScopeSelectors
                    enabled
                    compact
                    headOffices={scopeHeadOffices}
                    schoolOptions={schoolOptions}
                    selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                    onHeadOfficeChange={(val) => {
                      manualScope.setSelectedScope(val, '')
                      setForm((prev) => ({
                        ...prev,
                        headOfficeId: val,
                        school: '',
                        className: '',
                        section: '',
                        subject: '',
                      }))
                    }}
                    selectedSchoolId={manualScope.selectedSchoolId || form.school}
                    onSchoolChange={(val) => {
                      manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, val)
                      setForm((prev) => ({
                        ...prev,
                        headOfficeId: manualScope.selectedHeadOfficeId,
                        school: val,
                        className: '',
                        section: '',
                        subject: '',
                      }))
                    }}
                    schoolLabel="School Name"
                  />
                </div>
              ) : isHeadOfficeAdmin ? (
                <>
                  <FormField label="Head Office" required>
                    <input className="avm-input" value={authHeadOfficeName || ''} readOnly />
                  </FormField>
                  <FormField label="School Name" required>
                    <select
                      className="avm-select"
                      id="school"
                      value={form.school}
                      onChange={(e) => {
                        const val = e.target.value
                        setForm((prev) => ({
                          ...prev,
                          school: val,
                          className: '',
                          section: '',
                          subject: '',
                        }))
                      }}
                    >
                      <option value="">--Select School--</option>
                      {schoolOptions.map((school) => (
                        <option key={school.id} value={String(school.id)}>
                          {school.schoolName || school.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </>
              ) : (
                <>
                  <FormField label="Head Office" required>
                    <input className="avm-input" value={authHeadOfficeName || ''} readOnly />
                  </FormField>
                  <FormField label="School Name" required>
                    <input className="avm-input" value={getCurrentSchoolLabel() || authSchoolName || ''} readOnly />
                  </FormField>
                </>
              )}

              <FormField label="Exam Title" required full>
                <input
                  type="text"
                  className="avm-input"
                  id="examTitle"
                  placeholder="Exam Title"
                  value={form.examTitle}
                  onChange={handleChange(setForm)}
                />
              </FormField>

              <FormField label="Class" required>
                <select
                  className="avm-select"
                  id="className"
                  value={form.className}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm((prev) => ({
                      ...prev,
                      className: val,
                      section: '',
                    }))
                  }}
                >
                  <option value="">--Select--</option>
                  {classesLookup.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {getClassLabel(c)}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Section">
                <select
                  className="avm-select"
                  id="section"
                  value={form.section}
                  onChange={handleChange(setForm)}
                >
                  <option value="">--Select--</option>
                  {sectionsLookup.map((section) => (
                    <option key={section.id} value={String(section.id)}>
                      {getSectionLabel(section)}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Subject" required>
                <select
                  className="avm-select"
                  id="subject"
                  value={form.subject}
                  onChange={handleChange(setForm)}
                >
                  <option value="">--Select--</option>
                  {subjectsLookup.map((subject) => (
                    <option key={subject.id} value={String(subject.id)}>
                      {getSubjectLabel(subject)}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Instruction" full>
                <textarea
                  className="avm-input avm-textarea"
                  id="instruction"
                  rows={3}
                  placeholder="Instruction"
                  value={form.instruction}
                  onChange={handleChange(setForm)}
                />
              </FormField>
            </div>
          )}

          {step === 1 && (
            <div className="avm-grid">
              <FormField label="Duration (Minute)" required>
                <input
                  type="number"
                  className="avm-input"
                  id="duration"
                  placeholder="Duration"
                  value={form.duration}
                  onChange={handleChange(setForm)}
                />
              </FormField>

              <FormField label="Start Date" required>
                <input
                  type="date"
                  className="avm-input"
                  id="startDate"
                  value={form.startDate}
                  onChange={handleChange(setForm)}
                />
              </FormField>

              <FormField label="End Date" required>
                <input
                  type="date"
                  className="avm-input"
                  id="endDate"
                  value={form.endDate}
                  onChange={handleChange(setForm)}
                />
              </FormField>
            </div>
          )}

          {step === 2 && (
            <div className="avm-grid">
              <FormField label="Mark Type" required>
                <select
                  className="avm-select"
                  id="markType"
                  value={form.markType}
                  onChange={handleChange(setForm)}
                >
                  <option value="">--Select--</option>
                  <option value="Percentage">Percentage</option>
                  <option value="Grade">Grade</option>
                </select>
              </FormField>

              <FormField label="Pass Mark" required>
                <input
                  type="number"
                  className="avm-input"
                  id="passMark"
                  placeholder="Pass Mark"
                  value={form.passMark}
                  onChange={handleChange(setForm)}
                />
              </FormField>

              <FormField label="Is Publish?" required>
                <select
                  className="avm-select"
                  id="isPublish"
                  value={form.isPublish}
                  onChange={handleChange(setForm)}
                >
                  <option value="">--Select--</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </FormField>

              <FormField label="Exam limit per Student" required>
                <input
                  type="number"
                  className="avm-input"
                  id="examLimit"
                  placeholder="Exam limit per Student"
                  value={form.examLimit}
                  onChange={handleChange(setForm)}
                />
              </FormField>

              <FormField label="Note" full noIcon>
                <textarea
                  rows={4}
                  className="avm-input avm-textarea"
                  id="note"
                  placeholder="Note"
                  value={form.note}
                  onChange={handleChange(setForm)}
                />
              </FormField>
            </div>
          )}
        </div>

        <div className="card-footer px-20 py-16 border-top border-neutral-200 d-flex align-items-center justify-content-between">
          <button
            type="button"
            className="btn btn-secondary-light"
            onClick={step === 0 ? () => (navigateTo ? navigateTo('onlineexam') : window.history.back()) : handleBack}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          <button
            type="button"
            className="btn btn-primary-600"
            onClick={step === STEPS.length - 1 ? handleSave : handleNext}
            disabled={saving}
          >
            {saving ? 'Saving...' : step === STEPS.length - 1 ? (isEditMode ? 'Update' : 'Save') : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddOnlineExam
