import { useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import '../assets/css/addModalShared.css'
import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { fetchExamTerms } from '../apis/examTermApi'
import { createSuggestion, fetchSuggestionById, updateSuggestion } from '../apis/suggestionApi'

const EDIT_STORAGE_KEY = 'sm_suggestion_edit_id'
const STEPS = ['Basic Info', 'Suggestion & Media']

const emptyForm = {
  id: null,
  headOfficeId: '',
  schoolId: '',
  title: '',
  examTerm: '',
  className: '',
  subjectName: '',
  suggestionText: '',
  documentName: '',
  documentPath: '',
  note: '',
  removeDocument: false,
}

const DEFAULT_EXAM_TERMS = ['First Term', 'Second Term', 'Final Term']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Title: 'ri-file-list-line',
  'Exam Term': 'ri-calendar-event-line',
  Class: 'ri-graduation-cap-line',
  Subject: 'ri-book-open-line',
  Suggestion: 'ri-lightbulb-line',
  Document: 'ri-file-copy-line',
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

const uniqueStrings = (items) =>
  Array.from(
    new Set(
      (Array.isArray(items) ? items : [])
        .map((item) => String(item ?? '').trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b))

const getFileIcon = (fileName) => {
  if (!fileName) return 'ri-file-line'
  const ext = String(fileName).split('.').pop().toLowerCase()
  if (ext === 'pdf') return 'ri-file-pdf-line'
  if (['doc', 'docx'].includes(ext)) return 'ri-file-word-line'
  if (['ppt', 'pptx'].includes(ext)) return 'ri-slideshow-line'
  if (ext === 'txt') return 'ri-file-text-line'
  return 'ri-file-line'
}

const SuggestionCreate = ({ onNavigate }) => {
  const { role, headOfficeId: authHeadOfficeId, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const normalizedRole = useMemo(() => normalizeRole(role), [role])
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = normalizedRole === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = normalizedRole === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const currentSchoolOption = useMemo(() => {
    if (authSchoolId == null) return null
    return {
      id: authSchoolId,
      schoolName: authSchoolName || `School ${authSchoolId}`,
      headOfficeId: authHeadOfficeId ?? '',
    }
  }, [authHeadOfficeId, authSchoolId, authSchoolName])

  const [initialEditId] = useState(() => {
    try {
      return sessionStorage.getItem(EDIT_STORAGE_KEY) || ''
    } catch {
      return ''
    }
  })
  const isEditMode = Boolean(initialEditId)

  const [schools, setSchools] = useState([])
  const [classOptions, setClassOptions] = useState([])
  const [subjectOptions, setSubjectOptions] = useState([])
  const [examTermOptions, setExamTermOptions] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [docFile, setDocFile] = useState(null)
  const [docInputKey, setDocInputKey] = useState(0)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const schoolOptions = useMemo(() => {
    const list = Array.isArray(schools) ? schools : []
    if (isSuperAdmin) return manualScope.schoolOptions || []
    if (isHeadOfficeAdmin) {
      return list.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return currentSchoolOption ? [currentSchoolOption] : []
    }
    return list
  }, [schools, isSuperAdmin, manualScope.schoolOptions, isHeadOfficeAdmin, isSchoolAdmin, currentSchoolOption, authHeadOfficeId])

  useEffect(() => {
    if (isSchoolAdmin) {
      setSchools(currentSchoolOption ? [currentSchoolOption] : [])
      return
    }
    fetchSchoolsLookup()
      .then((data) => setSchools(Array.isArray(data) ? data : []))
      .catch(() => setSchools([]))
  }, [currentSchoolOption, isSchoolAdmin])

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return
    setForm((prev) => ({ ...prev, schoolId: String(authSchoolId) }))
  }, [isSchoolAdmin, authSchoolId])

  useEffect(() => {
    if (!isEditMode || !initialEditId) return
    let cancelled = false
    const load = async () => {
      try {
        const suggestion = await fetchSuggestionById(initialEditId)
        if (cancelled || !suggestion) return
        setForm({
          id: suggestion.id ?? null,
          headOfficeId: suggestion.headOfficeId != null ? String(suggestion.headOfficeId) : '',
          schoolId: suggestion.schoolId != null ? String(suggestion.schoolId) : '',
          title: suggestion.title ?? '',
          examTerm: suggestion.examTerm ?? '',
          className: suggestion.className ?? '',
          subjectName: suggestion.subjectName ?? '',
          suggestionText: suggestion.suggestionText ?? '',
          documentName: suggestion.documentName ?? '',
          documentPath: suggestion.documentPath ?? '',
          note: suggestion.note ?? '',
          removeDocument: false,
        })
        if (isSuperAdmin && suggestion.schoolId != null) {
          const match = Array.isArray(schools)
            ? schools.find((school) => String(school?.id ?? '') === String(suggestion.schoolId))
            : null
          if (match?.headOfficeId != null) {
            manualScope.setSelectedScope(String(match.headOfficeId), String(suggestion.schoolId))
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load suggestion')
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [initialEditId, isEditMode, isSuperAdmin, schools, manualScope])

  useEffect(() => {
    if (isEditMode || !isSuperAdmin) return
    if (!manualScope.selectedSchoolId) return
    setForm((prev) => ({ ...prev, schoolId: String(manualScope.selectedSchoolId) }))
  }, [isSuperAdmin, isEditMode, manualScope.selectedSchoolId])

  useEffect(() => {
    const selectedSchoolId = form.schoolId
    if (!selectedSchoolId) {
      setClassOptions([])
      setSubjectOptions([])
      setExamTermOptions([])
      return
    }

    let cancelled = false
    const loadLookups = async () => {
      try {
        const [classesData, subjectsData, examTermsData] = await Promise.all([
          fetchClasses({ schoolId: selectedSchoolId }).catch(() => []),
          fetchSubjects({ schoolId: selectedSchoolId }).catch(() => []),
          fetchExamTerms({ schoolId: selectedSchoolId }).catch(() => []),
        ])
        if (cancelled) return
        setClassOptions(
          uniqueStrings((Array.isArray(classesData) ? classesData : []).map((item) => String(item?.className ?? item?.name ?? item?.title ?? '').trim())),
        )
        setSubjectOptions(
          uniqueStrings((Array.isArray(subjectsData) ? subjectsData : []).map((item) => String(item?.subjectName ?? item?.name ?? item?.title ?? '').trim())),
        )
        setExamTermOptions(
          uniqueStrings([
            ...DEFAULT_EXAM_TERMS,
            ...(Array.isArray(examTermsData) ? examTermsData : []).map((item) =>
              String(item?.examTerm ?? item?.name ?? item?.title ?? item ?? '').trim(),
            ),
          ]),
        )
      } catch {
        if (!cancelled) {
          setClassOptions([])
          setSubjectOptions([])
          setExamTermOptions(DEFAULT_EXAM_TERMS)
        }
      }
    }
    void loadLookups()
    return () => {
      cancelled = true
    }
  }, [form.schoolId])

  const onChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const validate = () => {
    if (!form.schoolId) return 'School is required'
    if (!form.title.trim()) return 'Title is required'
    if (!form.examTerm.trim()) return 'Exam term is required'
    if (!form.className.trim()) return 'Class is required'
    if (!form.subjectName.trim()) return 'Subject is required'
    if (!form.suggestionText.trim()) return 'Suggestion is required'
    return ''
  }

  const validateStep = (targetStep) => {
    if (targetStep === 0) {
      if (!form.schoolId) return 'School is required'
      if (!form.title.trim()) return 'Title is required'
      if (!form.examTerm.trim()) return 'Exam term is required'
      if (!form.className.trim()) return 'Class is required'
      if (!form.subjectName.trim()) return 'Subject is required'
    }
    return ''
  }

  const resolveScope = () => {
    const selectedSchool = schools.find((school) => String(school?.id ?? '') === String(form.schoolId ?? ''))
    const schoolId = form.schoolId ? Number(form.schoolId) : null
    const headOfficeIdFromSchool = selectedSchool?.headOfficeId != null ? Number(selectedSchool.headOfficeId) : null

    if (isSuperAdmin) {
      const selectedHeadOfficeId = manualScope.selectedHeadOfficeId
        ? Number(manualScope.selectedHeadOfficeId)
        : headOfficeIdFromSchool
      return { headOfficeId: selectedHeadOfficeId, schoolId }
    }
    if (isHeadOfficeAdmin) {
      return {
        headOfficeId: authHeadOfficeId != null ? Number(authHeadOfficeId) : headOfficeIdFromSchool,
        schoolId,
      }
    }
    return {
      headOfficeId: headOfficeIdFromSchool != null ? headOfficeIdFromSchool : authHeadOfficeId != null ? Number(authHeadOfficeId) : null,
      schoolId: schoolId != null ? schoolId : authSchoolId != null ? Number(authSchoolId) : null,
    }
  }

  const submit = async () => {
    const validation = validate()
    if (validation) {
      setError(validation)
      return
    }
    setSaving(true)
    setError('')
    try {
      const scope = resolveScope()
      const payload = {
        headOfficeId: scope.headOfficeId,
        schoolId: scope.schoolId,
        title: form.title.trim(),
        examTerm: form.examTerm.trim(),
        className: form.className.trim(),
        subjectName: form.subjectName.trim(),
        suggestionText: form.suggestionText.trim(),
        note: form.note.trim(),
        removeDocument: Boolean(form.removeDocument),
      }
      if (isEditMode && form.id) {
        await updateSuggestion(form.id, payload, docFile)
      } else {
        await createSuggestion(payload, docFile)
      }
      setSuccessMessage(`Suggestion ${isEditMode ? 'updated' : 'created'} successfully! Redirecting...`)
      setSuccess(true)
      setTimeout(() => {
        sessionStorage.removeItem(EDIT_STORAGE_KEY)
        if (typeof onNavigate === 'function') onNavigate('suggestion')
      }, 1000)
    } catch (err) {
      setError(err?.message || 'Failed to save suggestion')
    } finally {
      setSaving(false)
    }
  }

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDocFile(file)
    setForm((prev) => ({ ...prev, removeDocument: false }))
  }

  const pageTitle = isEditMode ? 'Edit Suggestion' : 'Add Suggestion'

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">{pageTitle}</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
              onClick={() => typeof onNavigate === 'function' && onNavigate('suggestion')}
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Suggestion / {isEditMode ? 'Edit' : 'Add'}</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border px-20 d-flex align-items-center gap-6"
          onClick={() => typeof onNavigate === 'function' && onNavigate('suggestion')}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-10 mb-24 radius-8">
          <i className="ri-error-warning-line text-lg" />
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="alert alert-success d-flex align-items-center gap-10 mb-24 radius-8">
          <i className="ri-checkbox-circle-line text-lg" />
          {successMessage}
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-header border-bottom border-neutral-200 px-20 py-0 d-flex gap-0">
          {STEPS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                if (i > step) {
                  const validation = validateStep(step)
                  if (validation) {
                    setError(validation)
                    return
                  }
                }
                setError('')
                setStep(i)
              }}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: step === i ? '2px solid var(--primary-600, #4f46e5)' : '2px solid transparent',
                color: step === i ? 'var(--primary-600, #4f46e5)' : 'var(--secondary-light, #667085)',
                fontWeight: step === i ? 600 : 400,
                padding: '14px 20px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                transition: 'all 0.2s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="card-body p-24">
          <form onSubmit={(e) => e.preventDefault()}>
            {step === 0 && (
              <>
                <p className="avm-section-title">{STEPS[0]}</p>
                <div className="avm-grid">
                {isSuperAdmin ? (
                  <div className="avm-field full">
                    <ManualScopeSelectors
                      enabled={isSuperAdmin}
                      headOffices={manualScope.headOffices}
                      schoolOptions={schoolOptions}
                      selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                      onHeadOfficeChange={(value) => {
                        manualScope.setSelectedHeadOfficeId(value)
                        manualScope.setSelectedSchoolId('')
                        setForm((prev) => ({
                          ...prev,
                          headOfficeId: value,
                          schoolId: '',
                          className: '',
                          subjectName: '',
                          examTerm: '',
                        }))
                      }}
                      selectedSchoolId={form.schoolId}
                      onSchoolChange={(value) => {
                        manualScope.setSelectedSchoolId(value)
                        setForm((prev) => ({
                          ...prev,
                          schoolId: value,
                          className: '',
                          subjectName: '',
                          examTerm: '',
                        }))
                      }}
                      compact
                    />
                  </div>
                ) : (
                  <FormField label="School Name" required full>
                    <select
                      className="avm-select"
                      id="schoolId"
                      value={form.schoolId}
                      onChange={(e) => setForm((prev) => ({ ...prev, schoolId: e.target.value, className: '', subjectName: '', examTerm: '' }))}
                      disabled={isSchoolAdmin}
                    >
                      <option value="">--Select School--</option>
                      {schoolOptions.map((school) => (
                        <option key={String(school.id)} value={String(school.id)}>
                          {school.schoolName}
                        </option>
                      ))}
                    </select>
                  </FormField>
                )}

                <FormField label="Title" required full>
                  <input
                    type="text"
                    className="avm-input"
                    id="title"
                    placeholder="Title"
                    value={form.title}
                    onChange={onChange}
                  />
                </FormField>

                <FormField label="Exam Term" required>
                  <select className="avm-select" id="examTerm" value={form.examTerm} onChange={onChange}>
                    <option value="">--Select--</option>
                    {examTermOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Class" required>
                  <select className="avm-select" id="className" value={form.className} onChange={onChange}>
                    <option value="">--Select--</option>
                    {classOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Subject" required>
                  <select className="avm-select" id="subjectName" value={form.subjectName} onChange={onChange}>
                    <option value="">--Select--</option>
                    {subjectOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FormField>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <p className="avm-section-title">{STEPS[1]}</p>
                <div className="avm-grid">
                <FormField label="Suggestion" full noIcon>
                  <textarea
                    rows={5}
                    className="avm-input avm-textarea"
                    id="suggestionText"
                    placeholder="Enter your suggestion..."
                    value={form.suggestionText}
                    onChange={onChange}
                  />
                </FormField>

                <div className="avm-field full">
                  <label className="avm-label">Document</label>
                  <label
                    htmlFor="suggestionDocument"
                    style={{
                      border: '2px dashed #d0d5dd',
                      borderRadius: '0.75rem',
                      padding: '1.25rem 1rem',
                      background: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.7rem',
                      cursor: 'pointer',
                    }}
                  >
                    {docFile || form.documentName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                        <i className={getFileIcon(docFile?.name || form.documentName)} style={{ fontSize: '1.5rem', color: '#45597a' }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {docFile?.name || form.documentName}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#7a8a9a' }}>
                            {docFile ? `${(docFile.size / 1024).toFixed(1)} KB` : 'Existing file'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e8edf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ri-upload-cloud-2-line" style={{ fontSize: '1.5rem', color: '#45597a' }}></i>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#45597a' }}>
                            Click to upload document
                          </p>
                          <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                            Document file format: .pdf, .doc/docx, .ppt/pptx or .txt
                          </p>
                        </div>
                      </>
                    )}
                    <input
                      key={docInputKey}
                      id="suggestionDocument"
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                      style={{ display: 'none' }}
                      onChange={onFileChange}
                    />
                  </label>
                  {(docFile || form.documentName) && (
                    <button
                      type="button"
                      className="btn btn-light border mt-8"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, documentName: '', documentPath: '', removeDocument: true }))
                        setDocFile(null)
                        setDocInputKey((key) => key + 1)
                      }}
                    >
                      <i className="ri-delete-bin-line"></i> Remove
                    </button>
                  )}
                </div>

                <FormField label="Note" full noIcon>
                  <textarea
                    rows={3}
                    className="avm-input avm-textarea"
                    id="note"
                    placeholder="Note"
                    value={form.note}
                    onChange={onChange}
                  />
                </FormField>
                </div>
              </>
            )}

            <div className="d-flex justify-content-between align-items-center mt-24">
              <div>
                {step > 0 ? (
                  <button type="button" className="btn btn-light border" onClick={() => setStep((s) => Math.max(0, s - 1))}>
                    Back
                  </button>
                ) : null}
              </div>
              <div className="d-flex gap-10">
                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={() => typeof onNavigate === 'function' && onNavigate('suggestion')}
                >
                  Cancel
                </button>
                {step === STEPS.length - 1 ? (
                  <button type="button" className="btn btn-primary-600" onClick={submit} disabled={saving}>
                    {saving ? 'Saving...' : isEditMode ? 'Update' : 'Save'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary-600"
                    onClick={() => {
                      const validation = validateStep(step)
                      if (validation) {
                        setError(validation)
                        return
                      }
                      setError('')
                      setStep((s) => Math.min(STEPS.length - 1, s + 1))
                    }}
                  >
                    Next
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

export default SuggestionCreate
