import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '../assets/css/addModalShared.css'
import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { createQuestionBank, updateQuestionBank } from '../apis/questionBankApi'
import { normalizeRole } from '../utils/roles'
import ManualScopeSelectors from '../components/ManualScopeSelectors'

const EDIT_STORAGE_KEY = 'edit-question-bank-row'
const STEPS = ['Basic Info', 'Question Details']

const questionLevelOptions = ['Easy', 'Medium', 'Hard']
const questionTypeOptions = ['Single Answer', 'Multi Answer', 'Fill in Blank', 'TRUE/FALSE']

const ACCEPTED_DOC_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.txt'
const ACCEPTED_DOC_LABEL = '.pdf, .doc/docx, .ppt/pptx or .txt'

const emptyForm = {
  school: '',
  className: '',
  section: '',
  subject: '',
  questionLevel: '',
  question: '',
  image: null,
  document: null,
  mark: '',
  questionType: '',
}

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Class: 'ri-building-line',
  Section: 'ri-layout-grid-line',
  Subject: 'ri-book-open-line',
  'Question Level': 'ri-bar-chart-line',
  Question: 'ri-question-line',
  Mark: 'ri-medal-line',
  'Question Type': 'ri-list-check',
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

const getFileIcon = (fileName) => {
  if (!fileName) return 'ri-file-line'
  const ext = fileName.split('.').pop().toLowerCase()
  if (ext === 'pdf') return 'ri-file-pdf-line'
  if (['doc', 'docx'].includes(ext)) return 'ri-file-word-line'
  if (['ppt', 'pptx'].includes(ext)) return 'ri-slideshow-line'
  if (ext === 'txt') return 'ri-file-text-line'
  return 'ri-file-line'
}

const AddQuestionBank = ({ onNavigate } = {}) => {
  const {
    role: authRole,
    user,
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    status,
    token,
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
  const [imagePreview, setImagePreview] = useState(null)
  const [docFile, setDocFile] = useState(null)
  const [headOffices, setHeadOffices] = useState([])
  const [schools, setSchools] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [sectionsLookup, setSectionsLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])
  const imageRef = useRef(null)
  const docRef = useRef(null)

  const [form, setForm] = useState(() => ({
    ...emptyForm,
    id: initialEditRow?.id || null,
    school: initialEditRow?.schoolId ? String(initialEditRow.schoolId) : (isSchoolAdmin ? String(authSchoolId) : ''),
    className: initialEditRow?.classId ? String(initialEditRow.classId) : '',
    section: initialEditRow?.sectionId ? String(initialEditRow.sectionId) : '',
    subject: initialEditRow?.subjectId ? String(initialEditRow.subjectId) : '',
    questionLevel: initialEditRow?.questionLevel || '',
    question: initialEditRow?.question || '',
    mark: initialEditRow?.mark != null ? String(initialEditRow.mark) : '',
    questionType: initialEditRow?.questionType || '',
  }))

  useEffect(() => {
    if (isEditMode && initialEditRow) {
      const s = schools.find(item => String(item.id) === String(initialEditRow.schoolId))
      manualScope.setSelectedScope(String(s?.headOfficeId || ''), String(initialEditRow.schoolId || ''))
    }
  }, [isEditMode, initialEditRow, schools])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    const loadLookups = async () => {
      try {
        const [hoPage, sList] = await Promise.all([
          fetchHeadOfficesPage(0, 500),
          fetchSchoolsLookup()
        ])
        setHeadOffices(Array.isArray(hoPage?.content) ? hoPage.content : [])
        setSchools(Array.isArray(sList) ? sList : [])
      } catch (e) {
        console.error('Failed to load lookups', e)
      }
    }
    loadLookups()
  }, [status, token])

  const schoolOptions = useMemo(() => {
    const hId = isSuperAdmin ? manualScope.selectedHeadOfficeId : (authHeadOfficeId != null ? String(authHeadOfficeId) : '')
    if (!hId) return []
    return schools.filter(s => String(s.headOfficeId ?? '') === String(hId))
  }, [isSuperAdmin, manualScope.selectedHeadOfficeId, authHeadOfficeId, schools])

  const effectiveSchoolId = isSuperAdmin ? manualScope.selectedSchoolId : (isSchoolAdmin ? authSchoolId : form.school)

  useEffect(() => {
    if (!effectiveSchoolId) {
      setClassesLookup([])
      setSubjectsLookup([])
      return
    }
    fetchClasses({ schoolId: effectiveSchoolId }).then(data => setClassesLookup(Array.isArray(data) ? data : []))
    fetchSubjects({ schoolId: effectiveSchoolId }).then(data => setSubjectsLookup(Array.isArray(data) ? data : []))
  }, [effectiveSchoolId])

  useEffect(() => {
    if (!effectiveSchoolId || !form.className) {
      setSectionsLookup([])
      return
    }
    fetchSections({ schoolId: effectiveSchoolId, classId: form.className }).then(data => setSectionsLookup(Array.isArray(data) ? data : []))
  }, [effectiveSchoolId, form.className])

  const validateStep = (currentStep) => {
    if (currentStep === 0) {
      if (!form.school && !isSchoolAdmin) return 'School is required.'
      if (!form.className) return 'Class is required.'
      if (!form.subject) return 'Subject is required.'
      if (!form.questionLevel) return 'Question level is required.'
    }
    if (currentStep === 1) {
      if (!form.question.trim()) return 'Question is required.'
      if (!form.mark) return 'Mark is required.'
      if (!form.questionType) return 'Question type is required.'
    }
    return ''
  }

  const handleNext = () => {
    const msg = validateStep(step)
    if (msg) { setError(msg); return }
    setError('')
    setStep(s => Math.min(STEPS.length - 1, s + 1))
  }

  const handleBack = () => {
    setError('')
    setStep(s => Math.max(0, s - 1))
  }

  const handleSave = async () => {
    const msg = validateStep(step)
    if (msg) { setError(msg); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        schoolId: Number(effectiveSchoolId),
        classId: Number(form.className),
        sectionId: form.section ? Number(form.section) : null,
        subjectId: Number(form.subject),
        mark: Number(form.mark),
        imagePath: null, // Would handle file upload in real scenario
        documentPath: null,
      }
      if (isEditMode && form.id) {
        await updateQuestionBank(form.id, payload)
      } else {
        await createQuestionBank(payload)
      }
      setSuccess(true)
      setTimeout(() => navigateTo ? navigateTo('question-bank') : window.history.back(), 1000)
    } catch (err) {
      console.error('Failed to save question:', err)
      setError('Failed to save question. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {isEditMode ? 'Edit' : 'Add'} Question
          </h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Question Bank</span>
            <span className="text-secondary-light"> / {isEditMode ? 'Edit' : 'Add'} Question</span>
          </div>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-header border-bottom border-neutral-200 px-20 py-16">
          <div className="d-flex align-items-center gap-20">
            {STEPS.map((s, i) => (
              <div key={s} className="d-flex align-items-center gap-8">
                <div className={`step-number ${step >= i ? 'active' : ''}`}>{i + 1}</div>
                <span className={`step-label ${step >= i ? 'active' : ''}`}>{s}</span>
                {i < STEPS.length - 1 && <div className="step-line" />}
              </div>
            ))}
          </div>
        </div>

        <div className="card-body p-20">
          {error && <div className="alert alert-danger mb-20">{error}</div>}
          {success && <div className="alert alert-success mb-20">Question {isEditMode ? 'updated' : 'saved'} successfully!</div>}

          {step === 0 && (
            <div className="avm-grid">
              {isSuperAdmin ? (
                <div style={{ gridColumn: '1 / -1' }}>
                  <ManualScopeSelectors
                    enabled
                    compact
                    headOffices={headOffices.map(ho => ({ id: ho.id, name: ho.headOfficeName || ho.name }))}
                    schoolOptions={schoolOptions}
                    selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                    onHeadOfficeChange={(val) => {
                      manualScope.setSelectedScope(val, '')
                      setForm(prev => ({ ...prev, school: '', className: '', section: '', subject: '' }))
                    }}
                    selectedSchoolId={form.school}
                    onSchoolChange={(val) => {
                      manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, val)
                      setForm(prev => ({ ...prev, school: val, className: '', section: '', subject: '' }))
                    }}
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
                      onChange={(e) => setForm(prev => ({ ...prev, school: e.target.value, className: '', section: '', subject: '' }))}
                    >
                      <option value="">--Select School--</option>
                      {schoolOptions.map(s => <option key={s.id} value={String(s.id)}>{s.schoolName}</option>)}
                    </select>
                  </FormField>
                </>
              ) : (
                <>
                  <FormField label="Head Office" required>
                    <input className="avm-input" value={authHeadOfficeName || ''} readOnly />
                  </FormField>
                  <FormField label="School Name" required>
                    <input className="avm-input" value={authSchoolName || ''} readOnly />
                  </FormField>
                </>
              )}

              <FormField label="Class" required>
                <select className="avm-select" id="className" value={form.className} onChange={(e) => setForm(prev => ({ ...prev, className: e.target.value, section: '' }))}>
                  <option value="">--Select--</option>
                  {classesLookup.map(c => <option key={c.id} value={String(c.id)}>{c.className}</option>)}
                </select>
              </FormField>

              <FormField label="Section">
                <select className="avm-select" id="section" value={form.section} onChange={(e) => setForm(prev => ({ ...prev, section: e.target.value }))}>
                  <option value="">--Select--</option>
                  {sectionsLookup.map(s => <option key={s.id} value={String(s.id)}>{s.sectionName || s.name || s.label}</option>)}
                </select>
              </FormField>

              <FormField label="Subject" required full>
                <select className="avm-select" id="subject" value={form.subject} onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}>
                  <option value="">--Select--</option>
                  {subjectsLookup.map(s => <option key={s.id} value={String(s.id)}>{s.subjectName || s.name}</option>)}
                </select>
              </FormField>

              <FormField label="Question Level" required full>
                <select className="avm-select" id="questionLevel" value={form.questionLevel} onChange={(e) => setForm(prev => ({ ...prev, questionLevel: e.target.value }))}>
                  <option value="">--Select--</option>
                  {questionLevelOptions.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </FormField>
            </div>
          )}

          {step === 1 && (
            <div className="avm-grid">
              <FormField label="Question" required full>
                <textarea rows={4} className="avm-input avm-textarea" id="question" placeholder="Question" value={form.question} onChange={(e) => setForm(prev => ({ ...prev, question: e.target.value }))} />
              </FormField>

              <FormField label="Mark" required>
                <input type="number" className="avm-input" id="mark" placeholder="Mark" value={form.mark} onChange={(e) => setForm(prev => ({ ...prev, mark: e.target.value }))} min="0" />
              </FormField>

              <FormField label="Question Type" required>
                <select className="avm-select" id="questionType" value={form.questionType} onChange={(e) => setForm(prev => ({ ...prev, questionType: e.target.value }))}>
                  <option value="">--Select--</option>
                  {questionTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
            </div>
          )}
        </div>

        <div className="card-footer px-20 py-16 border-top border-neutral-200 d-flex align-items-center justify-content-between">
          <button type="button" className="btn btn-secondary-light" onClick={step === 0 ? () => navigateTo('question-bank') : handleBack}>
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          <button type="button" className="btn btn-primary-600" onClick={step === STEPS.length - 1 ? handleSave : handleNext} disabled={saving}>
            {saving ? 'Saving...' : step === STEPS.length - 1 ? (isEditMode ? 'Update' : 'Save') : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddQuestionBank
