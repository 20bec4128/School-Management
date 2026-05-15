import React, { useState, useEffect, useMemo } from 'react'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchStudentsByClassSection } from '../apis/studentsApi'
import { createStudentActivity, updateStudentActivity } from '../apis/studentActivityApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { findSchoolById } from '../utils/schoolScope'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-student-activity-row'

const emptyForm = {
  id: null,
  schoolId: '',
  classId: '',
  className: '',
  sectionId: '',
  section: '',
  studentId: '',
  studentName: '',
  date: '',
  activity: '',
  description: '',
}

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Class: 'ri-book-open-line',
  Section: 'ri-layout-grid-line',
  Student: 'ri-user-3-line',
  Date: 'ri-calendar-2-line',
  Activity: 'ri-medal-line',
  Description: 'ri-file-text-line',
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

const AddStudentActivity = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [initialEditRow] = useState(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const [schools, setSchools] = useState([])
  const [classOptions, setClassOptions] = useState([])
  const [sectionOptions, setSectionOptions] = useState([])
  const [studentOptions, setStudentOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState(() => {
    if (initialEditRow) {
      return {
        ...initialEditRow,
        schoolId: initialEditRow.schoolId ? String(initialEditRow.schoolId) : '',
        classId: initialEditRow.classId ? String(initialEditRow.classId) : '',
        sectionId: initialEditRow.sectionId ? String(initialEditRow.sectionId) : '',
        studentId: initialEditRow.studentId ? String(initialEditRow.studentId) : '',
      }
    }
    const listSchoolId = isSuperAdmin ? (activeSchoolId ? String(activeSchoolId) : '') : (authSchoolId ? String(authSchoolId) : '')
    return { ...emptyForm, schoolId: listSchoolId }
  })

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), [])

  useEffect(() => {
    fetchSchoolsLookup().then(setSchools).catch(() => setSchools([]))
  }, [])

  useEffect(() => {
    if (!initialEditRow || !isSuperAdmin || schools.length === 0) return
    const school = findSchoolById(schools, initialEditRow.schoolId)
    if (school?.headOfficeId != null) {
      manualScope.setSelectedScope(String(school.headOfficeId), String(initialEditRow.schoolId ?? ''))
    }
  }, [initialEditRow, isSuperAdmin, schools, manualScope])

  useEffect(() => {
    let cancelled = false
    const loadClasses = async () => {
      if (!form.schoolId) { setClassOptions([]); return }
      try {
        const data = await fetchClasses({ schoolId: form.schoolId })
        if (!cancelled) setClassOptions(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setClassOptions([])
      }
    }
    loadClasses()
    return () => { cancelled = true }
  }, [form.schoolId])

  useEffect(() => {
    let cancelled = false
    const loadSections = async () => {
      if (!form.schoolId || !form.classId) { setSectionOptions([]); return }
      try {
        const data = await fetchSections({ schoolId: form.schoolId, classId: form.classId })
        if (!cancelled) setSectionOptions(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setSectionOptions([])
      }
    }
    loadSections()
    return () => { cancelled = true }
  }, [form.schoolId, form.classId])

  useEffect(() => {
    let cancelled = false
    const loadStudents = async () => {
      if (!form.schoolId || !form.classId || !form.sectionId) { setStudentOptions([]); return }
      try {
        const data = await fetchStudentsByClassSection({
          schoolId: form.schoolId,
          classId: form.classId,
          sectionId: form.sectionId,
        })
        if (!cancelled) setStudentOptions(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setStudentOptions([])
      }
    }
    loadStudents()
    return () => { cancelled = true }
  }, [form.schoolId, form.classId, form.sectionId])

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions
    return contextSchoolOptions || []
  }, [isSuperAdmin, manualScope.schoolOptions, contextSchoolOptions])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setSuccess(false)

    if (!form.schoolId) { setError('School is required'); return }
    if (!form.studentId) { setError('Student is required'); return }
    if (!form.date) { setError('Date is required'); return }
    if (!form.activity.trim()) { setError('Activity is required'); return }

    setLoading(true)
    try {
      const payload = {
        schoolId: Number(form.schoolId),
        studentId: Number(form.studentId),
        date: form.date,
        activity: form.activity,
        description: form.description,
      }
      if (initialEditRow) {
        await updateStudentActivity(initialEditRow.id, payload)
      } else {
        await createStudentActivity(payload)
      }
      setSuccess(true)
      setTimeout(() => onNavigate('student-activity'), 1000)
    } catch (err) {
      setError(err?.message || 'Failed to process student activity')
    } finally {
      setLoading(false)
    }
  }

  const isEditing = Boolean(initialEditRow)

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">{isEditing ? 'Edit' : 'Add'} Student Activity</h1>
          <span className="text-secondary-light">Student Activity / {isEditing ? 'Edit' : 'Add'}</span>
        </div>
        <button className="btn btn-light border px-20 d-flex align-items-center gap-6" onClick={() => onNavigate('student-activity')}>
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
          Student activity {isEditing ? 'updated' : 'recorded'} successfully! Redirecting...
        </div>
      )}

      <div className="card h-100">
        <div className="card-body p-24">
          <form onSubmit={handleSubmit}>
            <div className="row g-20">
              {isSuperAdmin ? (
                <div className="col-12 mb-20">
                  <ManualScopeSelectors
                    enabled={isSuperAdmin}
                    headOffices={manualScope.headOffices}
                    schoolOptions={schoolOptions}
                    selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                    onHeadOfficeChange={(val) => { manualScope.setSelectedHeadOfficeId(val); setForm(p => ({ ...p, schoolId: '', classId: '', sectionId: '', studentId: '' })) }}
                    selectedSchoolId={form.schoolId}
                    onSchoolChange={(val) => setForm(p => ({ ...p, schoolId: val, classId: '', sectionId: '', studentId: '' }))}
                    compact
                  />
                </div>
              ) : (
                <FormField label="School Name" required full>
                  <select className="form-control form-select ps-40" id="schoolId" value={form.schoolId} onChange={(e) => setForm(p => ({ ...p, schoolId: e.target.value, classId: '', sectionId: '', studentId: '' }))}>
                    <option value="">--Select School--</option>
                    {schoolOptions.map((s) => (
                      <option key={s.id} value={String(s.id)}>{s.schoolName}</option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField label="Class" required>
                <select id="classId" className="form-control form-select ps-40" value={form.classId} onChange={(e) => setForm(p => ({ ...p, classId: e.target.value, sectionId: '', studentId: '' }))} disabled={!form.schoolId}>
                  <option value="">--Select Class--</option>
                  {classOptions.map((item) => <option key={item.id} value={String(item.id)}>{item.className || item.name}</option>)}
                </select>
              </FormField>

              <FormField label="Section" required>
                <select id="sectionId" className="form-control form-select ps-40" value={form.sectionId} onChange={(e) => setForm(p => ({ ...p, sectionId: e.target.value, studentId: '' }))} disabled={!form.classId}>
                  <option value="">--Select Section--</option>
                  {sectionOptions.map((item) => <option key={item.id} value={String(item.id)}>{item.name || item.sectionName}</option>)}
                </select>
              </FormField>

              <FormField label="Student" required full>
                <select id="studentId" className="form-control form-select ps-40" value={form.studentId} onChange={handleChange} disabled={!form.sectionId}>
                  <option value="">--Select Student--</option>
                  {studentOptions.map((student) => (
                    <option key={student.id} value={String(student.id)}>
                      {student.name} {student.admissionNo ? `(${student.admissionNo})` : ''}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Date" required>
                <input type="date" id="date" className="form-control ps-40" value={form.date} onChange={handleChange} />
              </FormField>

              <FormField label="Activity" required full>
                <input type="text" id="activity" className="form-control ps-40" placeholder="Activity (e.g. Science Fair, Football)" value={form.activity} onChange={handleChange} />
              </FormField>

              <FormField label="Description" full noIcon>
                <textarea id="description" rows="4" className="form-control pt-10" placeholder="Description" value={form.description} onChange={handleChange} />
              </FormField>
            </div>

            <div className="d-flex align-items-center justify-content-end gap-10 mt-24 pt-20 border-top border-neutral-200">
              <button type="button" className="btn btn-light border px-24" onClick={() => onNavigate('student-activity')}>Cancel</button>
              <button type="submit" className="btn btn-primary-600 px-24 d-flex align-items-center gap-8" disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...</>
                ) : (
                  <><i className="ri-save-line" /> {isEditing ? 'Update' : 'Save'} Activity</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddStudentActivity
