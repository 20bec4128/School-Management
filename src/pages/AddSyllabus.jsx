import { useEffect, useMemo, useRef, useState } from 'react'
import { createSyllabus, updateSyllabus } from '../apis/syllabusApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import useAcademicYearOptions from '../hooks/useAcademicYearOptions'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { findSchoolById } from '../utils/schoolScope'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-syllabus-row'
const TABS = ['Basic Info', 'Syllabus & Notes']

const emptyForm = {
  schoolId: '',
  classId: '',
  subjectId: '',
  title: '',
  sessionYear: '',
  note: '',
  existingFileName: '',
}

const readEditRow = () => {
  try {
    const raw = sessionStorage.getItem(EDIT_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const normalizeSchoolId = (value) => (value == null ? '' : String(value))

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Title: 'ri-file-list-2-line',
  Class: 'ri-building-line',
  Subject: 'ri-book-open-line',
  'Session Year': 'ri-calendar-line',
  Note: 'ri-sticky-note-line',
}

const getFileIcon = (fileName) => {
  if (!fileName) return 'ri-file-line'
  const ext = String(fileName).split('.').pop().toLowerCase()
  if (ext === 'pdf') return 'ri-file-pdf-line'
  if (ext === 'doc' || ext === 'docx') return 'ri-file-word-line'
  if (ext === 'ppt' || ext === 'pptx') return 'ri-slideshow-line'
  if (ext === 'txt') return 'ri-file-text-line'
  return 'ri-file-line'
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

const AddSyllabus = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions, isSchoolSelectionEnabled } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const fileRef = useRef(null)

  const [initialEditRow] = useState(() => readEditRow())
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(0)
  const [syllabusFile, setSyllabusFile] = useState(null)

  const listSchoolId = isSuperAdmin
    ? (activeSchoolId ? String(activeSchoolId) : '')
    : activeSchoolId
      ? String(activeSchoolId)
      : authSchoolId
        ? String(authSchoolId)
        : ''
  const academicYearOptions = useAcademicYearOptions({
    schoolId: form.schoolId && form.schoolId !== 'Select' ? form.schoolId : listSchoolId,
    enabled: Boolean((form.schoolId && form.schoolId !== 'Select') || listSchoolId),
  })

  const [form, setForm] = useState(() => {
    if (initialEditRow) {
      return {
        ...emptyForm,
        schoolId: normalizeSchoolId(initialEditRow.schoolId),
        classId: normalizeSchoolId(initialEditRow.classId),
        subjectId: normalizeSchoolId(initialEditRow.subjectId),
        title: initialEditRow.title || '',
        sessionYear: initialEditRow.sessionYear || '',
        note: initialEditRow.note || '',
        existingFileName: initialEditRow.fileName || '',
      }
    }
    return {
      ...emptyForm,
      schoolId: !isSuperAdmin ? listSchoolId : '',
    }
  })

  const [editingId] = useState(() => (initialEditRow ? initialEditRow.id : null))

  const resolvedSchoolId = activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
  const resolvedSchoolName = authSchoolName || ''
  const resolvedSchoolLabel = resolvedSchoolName || (resolvedSchoolId ? `School ${resolvedSchoolId}` : '')
  const isSchoolLocked = !isSchoolSelectionEnabled && !!resolvedSchoolId

  useEffect(() => () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    } catch {
      // ignore session storage failures
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadLookups = async () => {
      try {
        const [schools, classes, subjects] = await Promise.all([
          fetchSchoolsLookup(),
          fetchClasses(),
          fetchSubjects(),
        ])
        if (cancelled) return
        setSchoolsLookup(Array.isArray(schools) ? schools : [])
        setClassesLookup(Array.isArray(classes) ? classes : [])
        setSubjectsLookup(Array.isArray(subjects) ? subjects : [])
      } catch {
        if (cancelled) return
        setSchoolsLookup([])
        setClassesLookup([])
        setSubjectsLookup([])
      }
    }

    void loadLookups()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!initialEditRow || !isSuperAdmin || schoolsLookup.length === 0) return
    const school = findSchoolById(schoolsLookup, initialEditRow.schoolId)
    if (school?.headOfficeId != null) {
      manualScope.setSelectedScope(String(school.headOfficeId), String(initialEditRow.schoolId ?? ''))
    }
  }, [initialEditRow, isSuperAdmin, schoolsLookup, manualScope])

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions
    const filtered = Array.isArray(contextSchoolOptions) ? contextSchoolOptions : []
    const fallback =
      form.schoolId &&
      authSchoolName &&
      !filtered.some((school) => String(school.id) === String(form.schoolId))
        ? [{ id: form.schoolId, schoolName: authSchoolName }]
        : []
    return [...filtered, ...fallback]
  }, [isSuperAdmin, manualScope.schoolOptions, contextSchoolOptions, form.schoolId, authSchoolName])

  const availableClasses = useMemo(() => {
    const rows = classesLookup.filter((row) => !form.schoolId || String(row?.schoolId) === String(form.schoolId))
    return rows.sort((a, b) => (a?.className || '').localeCompare(b?.className || ''))
  }, [classesLookup, form.schoolId])

  const availableSubjects = useMemo(() => {
    const rows = subjectsLookup.filter((row) => {
      const matchesSchool = !form.schoolId || String(row?.schoolId) === String(form.schoolId)
      const matchesClass = !form.classId || String(row?.classId) === String(form.classId)
      return matchesSchool && matchesClass
    })
    return rows.sort((a, b) => (a?.subject || a?.name || '').localeCompare(b?.subject || b?.name || ''))
  }, [subjectsLookup, form.schoolId, form.classId])

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleHeadOfficeChange = (value) => {
    manualScope.setSelectedHeadOfficeId(value)
    manualScope.setSelectedSchoolId('')
    setForm((prev) => ({ ...prev, schoolId: '', sessionYear: '', classId: '', subjectId: '' }))
  }

  const handleSchoolChange = (value) => {
    if (isSuperAdmin) manualScope.setSelectedSchoolId(value)
    setForm((prev) => ({ ...prev, schoolId: value, sessionYear: '', classId: '', subjectId: '' }))
  }

  const handleClassChange = (value) => {
    setForm((prev) => ({ ...prev, classId: value, subjectId: '' }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setSyllabusFile(file)
  }

  const handleRemoveFile = () => {
    setSyllabusFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const getValidationError = () => {
    if (!form.schoolId) return 'Please select a school.'
    if (!form.classId) return 'Please select a class.'
    if (!form.subjectId) return 'Please select a subject.'
    if (!String(form.title || '').trim()) return 'Please enter a title.'
    if (!form.sessionYear) return 'Please select an academic year.'
    return ''
  }

  const validateCurrentStep = () => {
    if (step !== 0) return null
    return getValidationError()
  }

  const handleStepChange = (nextStep) => {
    if (nextStep > step) {
      const errorMessage = validateCurrentStep()
      if (errorMessage) {
        setError(errorMessage)
        return
      }
    }
    setStep(nextStep)
    setError('')
  }

  const buildPayload = () => ({
    schoolId: Number(form.schoolId),
    classId: Number(form.classId),
    subjectId: Number(form.subjectId),
    title: String(form.title || '').trim(),
    sessionYear: form.sessionYear,
    note: String(form.note || '').trim(),
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (step !== 1) {
      return
    }
    if (saving) return

    const validationError = getValidationError()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await updateSyllabus(editingId, buildPayload(), syllabusFile)
      } else {
        await createSyllabus(buildPayload(), syllabusFile)
      }
      setSuccess(true)
      setTimeout(() => onNavigate('syllabus'), 1000)
    } catch (err) {
      setError(err?.message || 'Failed to save syllabus')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">{editingId ? 'Edit Syllabus' : 'Add Syllabus'}</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / {editingId ? 'Edit Syllabus' : 'Add Syllabus'}</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border px-20 d-flex align-items-center gap-6"
          onClick={() => onNavigate('syllabus')}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-8" role="alert">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      ) : null}
      {success ? (
        <div className="alert alert-success d-flex align-items-center gap-8" role="alert">
          <i className="ri-checkbox-circle-line"></i>
          <span>Syllabus {editingId ? 'updated' : 'saved'} successfully! Redirecting...</span>
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-header border-bottom border-neutral-200 px-20 py-0 d-flex gap-0 scroll-x-mobile">
          {TABS.map((tab, index) => (
            <button
              key={tab}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleStepChange(index)
              }}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: step === index ? '2px solid var(--primary-600, #4f46e5)' : '2px solid transparent',
                color: step === index ? 'var(--primary-600, #4f46e5)' : 'var(--secondary-light, #667085)',
                fontWeight: step === index ? 600 : 400,
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
          <form onSubmit={handleSubmit}>
            <p className="avm-section-title">{step === 0 ? 'Basic Info' : 'Syllabus & Notes'}</p>

            <div className="avm-grid">
              {step === 0 ? (
                <>
                  <div
                    className="full"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.6rem',
                      background: '#fff8e6',
                      border: '1px solid #fde68a',
                      borderRadius: '0.65rem',
                      padding: '0.75rem 1rem',
                    }}
                  >
                    <i
                      className="ri-information-line"
                      style={{ color: '#d97706', fontSize: '1rem', flexShrink: 0, marginTop: 2 }}
                    ></i>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#92400e', lineHeight: 1.5 }}>
                      <strong>Instruction:</strong> Please add academic year before creating a syllabus.
                    </p>
                  </div>

                  <FormField label="School Name" required full>
                    {isSuperAdmin ? (
                      <ManualScopeSelectors
                        enabled={isSuperAdmin}
                        headOffices={manualScope.headOffices}
                        schoolOptions={schoolOptions}
                        selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                        onHeadOfficeChange={handleHeadOfficeChange}
                        selectedSchoolId={form.schoolId}
                        onSchoolChange={handleSchoolChange}
                        compact
                      />
                    ) : String(role || '').toUpperCase() === 'TEACHER' ? (
                      <input
                        className="avm-input"
                        value={resolvedSchoolLabel}
                        readOnly
                        aria-readonly="true"
                      />
                    ) : (
                      <select
                        className="avm-select"
                        value={form.schoolId}
                        onChange={(e) => handleSchoolChange(e.target.value)}
                        disabled={saving || isSchoolLocked}
                      >
                        <option value="">--Select School--</option>
                        {schoolOptions.map((school) => (
                          <option key={String(school.id)} value={String(school.id)}>
                            {school.schoolName}
                          </option>
                        ))}
                      </select>
                    )}
                  </FormField>

                  <FormField label="Title" required full>
                    <input
                      type="text"
                      className="avm-input"
                      id="title"
                      placeholder="Title"
                      value={form.title}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      disabled={saving}
                    />
                  </FormField>

                  <FormField label="Class" required>
                    <select
                      className="avm-select"
                      id="classId"
                      value={form.classId}
                      onChange={(e) => handleClassChange(e.target.value)}
                      disabled={!form.schoolId || saving}
                    >
                      <option value="">--Select--</option>
                      {availableClasses.map((item) => (
                        <option key={item.id} value={String(item.id)}>
                          {item.className}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Subject" required>
                    <select
                      className="avm-select"
                      id="subjectId"
                      value={form.subjectId}
                      onChange={(e) => handleFieldChange('subjectId', e.target.value)}
                      disabled={!form.schoolId || !form.classId || saving}
                    >
                      <option value="">--Select--</option>
                      {availableSubjects.map((item) => (
                        <option key={item.id} value={String(item.id)}>
                          {item.subject || item.name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Session Year" required full>
                  <select
                    className="avm-select"
                    id="sessionYear"
                    value={form.sessionYear}
                    onChange={(e) => handleFieldChange('sessionYear', e.target.value)}
                    disabled={saving || academicYearOptions.length === 0}
                  >
                    <option value="">--Select--</option>
                    {academicYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                      ))}
                    </select>
                  </FormField>
                </>
              ) : (
                <>
                  <div className="avm-field full">
                    <label className="avm-label">Syllabus</label>
                    <div
                      style={{
                        border: '2px dashed #d0d5dd',
                        borderRadius: '0.75rem',
                        padding: '1.5rem 1.25rem',
                        background: '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s, background 0.2s',
                      }}
                      onClick={() => fileRef.current?.click()}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#45597a'
                        e.currentTarget.style.background = '#f0f4f8'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#d0d5dd'
                        e.currentTarget.style.background = '#f8fafc'
                      }}
                    >
                      {syllabusFile ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            background: '#e8edf4',
                            borderRadius: '0.6rem',
                            padding: '0.65rem 1rem',
                            width: '100%',
                          }}
                        >
                          <i
                            className={getFileIcon(syllabusFile.name)}
                            style={{ fontSize: '1.5rem', color: '#45597a', flexShrink: 0 }}
                          ></i>
                          <div style={{ minWidth: 0 }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: '#34393f',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {syllabusFile.name}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#7a8a9a' }}>
                              {(syllabusFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: '50%',
                              background: '#e8edf4',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <i className="ri-upload-cloud-2-line" style={{ fontSize: '1.6rem', color: '#45597a' }}></i>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#45597a' }}>
                              Click to upload document
                            </p>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                              Document file format: .pdf, .doc/docx, .ppt/pptx or .txt
                            </p>
                            {form.existingFileName ? (
                              <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: '#45597a' }}>
                                Current file: {form.existingFileName}
                              </p>
                            ) : null}
                          </div>
                        </>
                      )}
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                    </div>
                    {syllabusFile ? (
                      <button
                        type="button"
                        className="avm-btn light sm"
                        style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                        onClick={handleRemoveFile}
                      >
                        <i className="ri-delete-bin-line"></i> Remove
                      </button>
                    ) : null}
                  </div>

                  <FormField label="Note" full>
                    <textarea
                      rows={4}
                      className="avm-input avm-textarea"
                      id="note"
                      placeholder="Note"
                      value={form.note}
                      onChange={(e) => handleFieldChange('note', e.target.value)}
                      disabled={saving}
                    />
                  </FormField>
                </>
              )}
            </div>

            <div className="d-flex justify-content-between align-items-center mt-24 flex-wrap gap-12">
              <button
                type="button"
                className="btn btn-light border"
                onClick={() => onNavigate('syllabus')}
              >
                Back to List
              </button>

              <div className="d-flex align-items-center gap-10">
                {step > 0 ? (
                  <button
                    type="button"
                    className="btn btn-light border"
                    onClick={() => handleStepChange(Math.max(0, step - 1))}
                  >
                    Back
                  </button>
                ) : null}

                {step === 0 ? (
                  <button
                    type="button"
                    className="btn btn-primary-600"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleStepChange(1)
                    }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-primary-600"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (editingId ? 'Update' : 'Save')}
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

export default AddSyllabus
