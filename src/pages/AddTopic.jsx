import { useCallback, useEffect, useMemo, useState } from 'react'
import { createTopic, updateTopic } from '../apis/topicsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { fetchLessons } from '../apis/lessonsApi'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { findSchoolById } from '../utils/schoolScope'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-topic-row'
const ACADEMIC_YEAR_OPTIONS = ['2025-2026', '2024-2025', '2023-2024', '2022-2023']

const emptyForm = {
  schoolId: 'Select',
  academicYear: 'Select',
  classId: 'Select',
  subjectId: 'Select',
  lessonId: 'Select',
  topic: '',
  note: '',
}

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  'Academic Year': 'ri-calendar-line',
  Class: 'ri-building-line',
  Subject: 'ri-book-open-line',
  Lesson: 'ri-file-list-3-line',
  Topic: 'ri-bookmark-3-line',
  Note: 'ri-sticky-note-line',
}

const getBestLabel = (...values) =>
  values
    .map((value) => {
      if (value == null) return ''
      const text = String(value).trim()
      return text === 'null' || text === 'undefined' ? '' : text
    })
    .find(Boolean) || ''

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

const AddTopic = ({ onNavigate }) => {
  const { headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName, role } = useAuth()
  const { activeSchoolId } = useSchool()
  const roleUpper = String(role || '').toUpperCase()
  const isSuperAdmin = roleUpper === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [initialEditRow] = useState(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const editingId = initialEditRow?.id ?? null

  const [form, setForm] = useState(() => {
    if (initialEditRow) {
      return {
        schoolId: initialEditRow.schoolId != null ? String(initialEditRow.schoolId) : 'Select',
        academicYear: initialEditRow.academicYear || 'Select',
        classId: initialEditRow.classId != null ? String(initialEditRow.classId) : 'Select',
        subjectId: initialEditRow.subjectId != null ? String(initialEditRow.subjectId) : 'Select',
        lessonId: initialEditRow.lessonId != null ? String(initialEditRow.lessonId) : 'Select',
        topic: initialEditRow.topic || '',
        note: initialEditRow.note || '',
      }
    }
    const fixedSchoolId = activeSchoolId || authSchoolId
    return {
      ...emptyForm,
      schoolId: fixedSchoolId ? String(fixedSchoolId) : 'Select',
    }
  })

  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])
  const [lessonsLookup, setLessonsLookup] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), [])

  useEffect(() => {
    const loadSchools = async () => {
      try {
        const schools = await fetchSchoolsLookup()
        setSchoolsLookup(Array.isArray(schools) ? schools : [])
      } catch {
        setSchoolsLookup([])
      }
    }
    loadSchools()
  }, [])

  useEffect(() => {
    if (!initialEditRow || !isSuperAdmin || schoolsLookup.length === 0) return
    const school = findSchoolById(schoolsLookup, initialEditRow.schoolId)
    const headOfficeId = initialEditRow.headOfficeId != null 
      ? String(initialEditRow.headOfficeId) 
      : (school?.headOfficeId != null ? String(school.headOfficeId) : '')
    
    if (headOfficeId) {
      manualScope.setSelectedScope(headOfficeId, initialEditRow.schoolId != null ? String(initialEditRow.schoolId) : '')
    }
  }, [initialEditRow, isSuperAdmin, manualScope, schoolsLookup])

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions
    return Array.isArray(schoolsLookup) ? schoolsLookup : []
  }, [isSuperAdmin, manualScope.schoolOptions, schoolsLookup])

  const schoolIdForLookups = form.schoolId !== 'Select' ? form.schoolId : ''

  useEffect(() => {
    if (!schoolIdForLookups) {
      setClassesLookup([])
      return
    }
    const loadClasses = async () => {
      try {
        const data = await fetchClasses({ schoolId: schoolIdForLookups })
        setClassesLookup(Array.isArray(data) ? data : [])
      } catch {
        setClassesLookup([])
      }
    }
    loadClasses()
  }, [schoolIdForLookups])

  useEffect(() => {
    if (!schoolIdForLookups || form.classId === 'Select') {
      setSubjectsLookup([])
      return
    }
    const loadSubjects = async () => {
      try {
        const data = await fetchSubjects({ schoolId: schoolIdForLookups, classId: form.classId })
        setSubjectsLookup(Array.isArray(data) ? data : [])
      } catch {
        setSubjectsLookup([])
      }
    }
    loadSubjects()
  }, [form.classId, schoolIdForLookups])

  useEffect(() => {
    if (!schoolIdForLookups || form.academicYear === 'Select' || form.classId === 'Select' || form.subjectId === 'Select') {
      setLessonsLookup([])
      return
    }
    const loadLessons = async () => {
      try {
        const data = await fetchLessons({
          schoolId: schoolIdForLookups,
          academicYear: form.academicYear,
          classId: form.classId,
          subjectId: form.subjectId,
        })
        setLessonsLookup(Array.isArray(data) ? data : [])
      } catch {
        setLessonsLookup([])
      }
    }
    loadLessons()
  }, [form.academicYear, form.classId, form.subjectId, schoolIdForLookups])

  const handleChange = (id, value) => {
    setForm((prev) => {
      if (id === 'schoolId') return { ...prev, schoolId: value, classId: 'Select', subjectId: 'Select', lessonId: 'Select' }
      if (id === 'classId') return { ...prev, classId: value, subjectId: 'Select', lessonId: 'Select' }
      if (id === 'subjectId') return { ...prev, subjectId: value, lessonId: 'Select' }
      return { ...prev, [id]: value }
    })
  }

  const validate = () => {
    if (form.schoolId === 'Select') return 'School is required.'
    if (form.academicYear === 'Select') return 'Academic Year is required.'
    if (form.classId === 'Select') return 'Class is required.'
    if (form.subjectId === 'Select') return 'Subject is required.'
    if (form.lessonId === 'Select') return 'Lesson is required.'
    if (!String(form.topic || '').trim()) return 'Topic is required.'
    return ''
  }

  const save = async () => {
    const msg = validate()
    if (msg) {
      setError(msg)
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        schoolId: Number(form.schoolId),
        academicYear: form.academicYear,
        classId: Number(form.classId),
        subjectId: Number(form.subjectId),
        lessonId: Number(form.lessonId),
        topic: form.topic,
        note: form.note || null,
      }
      if (editingId) {
        await updateTopic(editingId, payload)
      } else {
        await createTopic(payload)
      }
      setSuccess(true)
      setTimeout(() => onNavigate?.('topic'), 900)
    } catch (err) {
      setError(err?.message || 'Failed to save topic')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">{editingId ? 'Edit' : 'Add'} Topic</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
              onClick={() => onNavigate?.('dashboard')}
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Topic / {editingId ? 'Edit' : 'Add'}</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-6"
          onClick={() => onNavigate?.('topic')}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card h-100">
        <div className="card-header border-bottom border-neutral-200 px-20 py-0 d-flex gap-0">
          <div
            style={{
              borderBottom: '2px solid var(--primary-600, #4f46e5)',
              color: 'var(--primary-600, #4f46e5)',
              fontWeight: 600,
              padding: '14px 20px',
              fontSize: '0.875rem',
            }}
          >
            Topic Details
          </div>
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
              Topic {editingId ? 'updated' : 'created'} successfully! Redirecting...
            </div>
          )}

          <div className="row g-20">
            {isSuperAdmin ? (
              <div className="col-12 mb-20">
                <ManualScopeSelectors
                  enabled={isSuperAdmin}
                  headOffices={manualScope.headOffices}
                  schoolOptions={schoolOptions}
                  selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                  onHeadOfficeChange={(val) => {
                    manualScope.setSelectedScope(val, '')
                    handleChange('schoolId', 'Select')
                  }}
                  selectedSchoolId={form.schoolId}
                  onSchoolChange={(val) => handleChange('schoolId', val)}
                  compact
                />
              </div>
            ) : (
              <div className="col-12 avm-grid">
                <FormField label="Head Office" required>
                  <input className="form-control avm-input ps-44" value={authHeadOfficeName || ''} readOnly />
                </FormField>
                <FormField label="School Name" required>
                  <input
                    className="form-control avm-input ps-44"
                    value={
                      schoolsLookup.find((s) => String(s.id) === String(form.schoolId))?.schoolName ||
                      authSchoolName ||
                      ''
                    }
                    readOnly
                  />
                </FormField>
              </div>
            )}

            <div className="col-12 avm-grid">
              <FormField label="Academic Year" required>
                <select
                  className="form-select avm-input ps-44"
                  value={form.academicYear}
                  onChange={(e) => handleChange('academicYear', e.target.value)}
                >
                  <option value="Select">Select</option>
                  {ACADEMIC_YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Class" required>
                <select
                  className="form-select avm-input ps-44"
                  value={form.classId}
                  onChange={(e) => handleChange('classId', e.target.value)}
                  disabled={form.schoolId === 'Select'}
                >
                  <option value="Select">Select</option>
                  {classesLookup.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.className}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Subject" required>
                <select
                  className="form-select avm-input ps-44"
                  value={form.subjectId}
                  onChange={(e) => handleChange('subjectId', e.target.value)}
                  disabled={form.classId === 'Select'}
                >
                  <option value="Select">Select</option>
                  {subjectsLookup.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Lesson" required>
                <select
                  className="form-select avm-input ps-44"
                  value={form.lessonId}
                  onChange={(e) => handleChange('lessonId', e.target.value)}
                  disabled={form.subjectId === 'Select'}
                >
                  <option value="Select">Select</option>
                  {lessonsLookup.map((l) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.lesson}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Topic" required full>
                <input
                  className="form-control avm-input ps-44"
                  value={form.topic}
                  onChange={(e) => handleChange('topic', e.target.value)}
                  placeholder="Enter topic name"
                />
              </FormField>

              <FormField label="Note" full>
                <textarea
                  className="form-control avm-input ps-44"
                  value={form.note}
                  onChange={(e) => handleChange('note', e.target.value)}
                  rows={3}
                  placeholder="Optional note"
                />
              </FormField>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-end gap-10 mt-24 pt-20 border-top border-neutral-200">
            <button type="button" className="btn btn-light border px-24" onClick={() => onNavigate?.('topic')}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary-600 px-24 d-flex align-items-center gap-8"
              onClick={save}
              disabled={saving || loading}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...
                </>
              ) : (
                <>
                  <i className="ri-save-line" /> {editingId ? 'Update' : 'Save'} Topic
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddTopic
