import React, { useState, useEffect, useMemo } from 'react'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { fetchTeachers } from '../apis/teachersApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createLiveClass, updateLiveClass } from '../apis/liveClassesApi'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { findSchoolById } from '../utils/schoolScope'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-live-class-row'

const emptyForm = {
  schoolId: '',
  classId: '',
  sectionId: '',
  subjectId: '',
  teacherId: '',
  liveClassType: 'Zoom',
  meetingLink: '',
  classDate: '',
  startTime: '',
  endTime: '',
  note: '',
  sendNotification: false,
  status: 'Scheduled',
}

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Class: 'ri-building-line',
  Section: 'ri-layout-grid-line',
  Subject: 'ri-book-open-line',
  Teacher: 'ri-user-star-line',
  'Class Type': 'ri-video-chat-line',
  'Meeting Link': 'ri-link',
  Date: 'ri-calendar-line',
  'Start Time': 'ri-time-line',
  'End Time': 'ri-time-line',
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

const AddLiveClass = ({ onNavigate }) => {
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
  const [classesLookup, setClassesLookup] = useState([])
  const [sectionsLookup, setSectionsLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])
  const [teachersLookup, setTeachersLookup] = useState([])
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
        subjectId: initialEditRow.subjectId ? String(initialEditRow.subjectId) : '',
        teacherId: initialEditRow.teacherId ? String(initialEditRow.teacherId) : '',
        startTime: initialEditRow.startTime ? String(initialEditRow.startTime).slice(0, 5) : '',
        endTime: initialEditRow.endTime ? String(initialEditRow.endTime).slice(0, 5) : '',
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
    let cancelled = false
    const loadTeachers = async () => {
      if (!form.schoolId) { setTeachersLookup([]); return }
      try {
        const data = await fetchTeachers({ schoolId: form.schoolId })
        if (!cancelled) setTeachersLookup(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setTeachersLookup([])
      }
    }
    loadTeachers()
    return () => { cancelled = true }
  }, [form.schoolId])

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
      if (!form.schoolId) { setClassesLookup([]); return }
      try {
        const data = await fetchClasses({ schoolId: form.schoolId })
        if (!cancelled) setClassesLookup(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setClassesLookup([])
      }
    }
    loadClasses()
    return () => { cancelled = true }
  }, [form.schoolId])

  useEffect(() => {
    let cancelled = false
    const loadSections = async () => {
      if (!form.schoolId || !form.classId) { setSectionsLookup([]); return }
      try {
        const data = await fetchSections({ schoolId: form.schoolId, classId: form.classId })
        if (!cancelled) setSectionsLookup(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setSectionsLookup([])
      }
    }
    loadSections()
    return () => { cancelled = true }
  }, [form.schoolId, form.classId])

  useEffect(() => {
    let cancelled = false
    const loadSubjects = async () => {
      if (!form.schoolId || !form.classId) { setSubjectsLookup([]); return }
      try {
        const data = await fetchSubjects({ schoolId: form.schoolId, classId: form.classId })
        if (!cancelled) setSubjectsLookup(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setSubjectsLookup([])
      }
    }
    loadSubjects()
    return () => { cancelled = true }
  }, [form.schoolId, form.classId])

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions
    return contextSchoolOptions || []
  }, [isSuperAdmin, manualScope.schoolOptions, contextSchoolOptions])

  const teacherOptions = useMemo(() => {
    return (Array.isArray(teachersLookup) ? teachersLookup : [])
      .filter((t) => !form.schoolId || String(t.schoolId) === String(form.schoolId))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [teachersLookup, form.schoolId])

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [id]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (loading) return
    setError('')
    setSuccess(false)

    if (!form.schoolId) { setError('School is required'); return }
    if (!form.classId) { setError('Class is required'); return }
    if (!form.sectionId) { setError('Section is required'); return }
    if (!form.subjectId) { setError('Subject is required'); return }
    if (!form.teacherId) { setError('Teacher is required'); return }
    if (!form.classDate) { setError('Class date is required'); return }
    if (!form.startTime) { setError('Start time is required'); return }
    if (!form.endTime) { setError('End time is required'); return }

    setLoading(true)
    try {
      const payload = {
        ...form,
        schoolId: Number(form.schoolId),
        classId: Number(form.classId),
        sectionId: Number(form.sectionId),
        subjectId: Number(form.subjectId),
        teacherId: Number(form.teacherId),
      }
      if (initialEditRow) {
        await updateLiveClass(initialEditRow.id, payload)
      } else {
        await createLiveClass(payload)
      }
      setSuccess(true)
      setTimeout(() => onNavigate('live-class'), 1000)
    } catch (err) {
      setError(err?.message || 'Failed to process live class')
    } finally {
      setLoading(false)
    }
  }

  const isEditing = Boolean(initialEditRow)

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">{isEditing ? 'Edit' : 'Add'} Live Class</h1>
          <span className="text-secondary-light">Academic / Live Class / {isEditing ? 'Edit' : 'Add'}</span>
        </div>
        <button className="btn btn-light border px-20 d-flex align-items-center gap-6" onClick={() => onNavigate('live-class')}>
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
          Live class {isEditing ? 'updated' : 'created'} successfully! Redirecting...
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
                    onHeadOfficeChange={(val) => { manualScope.setSelectedHeadOfficeId(val); setForm(p => ({ ...p, schoolId: '', classId: '', sectionId: '', subjectId: '', teacherId: '' })) }}
                    selectedSchoolId={form.schoolId}
                    onSchoolChange={(val) => setForm(p => ({ ...p, schoolId: val, classId: '', sectionId: '', subjectId: '', teacherId: '' }))}
                    compact
                  />
                </div>
              ) : (
                <FormField label="School Name" required>
                  <select className="form-control form-select ps-40" id="schoolId" value={form.schoolId} onChange={(e) => setForm(p => ({ ...p, schoolId: e.target.value, classId: '', sectionId: '', subjectId: '', teacherId: '' }))}>
                    <option value="">--Select School--</option>
                    {schoolOptions.map((s) => (
                      <option key={s.id} value={String(s.id)}>{s.schoolName}</option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField label="Class" required>
                <select id="classId" className="form-control form-select ps-40" value={form.classId} onChange={(e) => setForm(p => ({ ...p, classId: e.target.value, sectionId: '', subjectId: '' }))} disabled={!form.schoolId}>
                  <option value="">--Select Class--</option>
                  {classesLookup.map((c) => <option key={c.id} value={String(c.id)}>{c.className}</option>)}
                </select>
              </FormField>

              <FormField label="Section" required>
                <select id="sectionId" className="form-control form-select ps-40" value={form.sectionId} onChange={(e) => setForm(p => ({ ...p, sectionId: e.target.value }))} disabled={!form.classId}>
                  <option value="">--Select Section--</option>
                  {sectionsLookup.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                </select>
              </FormField>

              <FormField label="Subject" required>
                <select id="subjectId" className="form-control form-select ps-40" value={form.subjectId} onChange={handleChange} disabled={!form.classId}>
                  <option value="">--Select Subject--</option>
                  {subjectsLookup.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                </select>
              </FormField>

              <FormField label="Teacher" required>
                <select id="teacherId" className="form-control form-select ps-40" value={form.teacherId} onChange={handleChange} disabled={!form.schoolId}>
                  <option value="">--Select Teacher--</option>
                  {teacherOptions.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                </select>
              </FormField>

              <FormField label="Class Type" required>
                <input type="text" id="liveClassType" className="form-control ps-40" placeholder="e.g. Zoom, Google Meet" value={form.liveClassType} onChange={handleChange} />
              </FormField>

              <FormField label="Meeting Link" full>
                <input type="text" id="meetingLink" className="form-control ps-40" placeholder="https://zoom.us/j/..." value={form.meetingLink} onChange={handleChange} />
              </FormField>

              <FormField label="Date" required>
                <input type="date" id="classDate" className="form-control ps-40" value={form.classDate} onChange={handleChange} />
              </FormField>

              <FormField label="Start Time" required>
                <input type="time" id="startTime" className="form-control ps-40" value={form.startTime} onChange={handleChange} />
              </FormField>

              <FormField label="End Time" required>
                <input type="time" id="endTime" className="form-control ps-40" value={form.endTime} onChange={handleChange} />
              </FormField>

              <FormField label="Status" full>
                <select id="status" className="form-control form-select ps-40" value={form.status} onChange={handleChange}>
                  {['Scheduled', 'Live', 'Completed', 'Cancelled'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Note" full noIcon>
                <textarea id="note" rows="3" className="form-control pt-10" placeholder="Note" value={form.note} onChange={handleChange} />
              </FormField>

              <div className="col-12 mb-20">
                <div className="form-check d-flex align-items-center gap-8">
                  <input type="checkbox" id="sendNotification" className="form-check-input" checked={form.sendNotification} onChange={handleChange} />
                  <label htmlFor="sendNotification" className="form-check-label text-secondary-light">Send Notification</label>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-end gap-10 mt-24 pt-20 border-top border-neutral-200">
              <button type="button" className="btn btn-light border px-24" onClick={() => onNavigate('live-class')}>Cancel</button>
              <button type="submit" className="btn btn-primary-600 px-24 d-flex align-items-center gap-8" disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...</>
                ) : (
                  <><i className="ri-save-line" /> {isEditing ? 'Update' : 'Save'} Live Class</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddLiveClass
