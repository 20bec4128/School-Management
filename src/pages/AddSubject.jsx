import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { fetchClasses } from '../apis/classesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchTeachers } from '../apis/teachersApi'
import { createSubject, updateSubject } from '../apis/subjectsApi'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { findSchoolById } from '../utils/schoolScope'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-subject-row'
const subjectTypeOptions = ['Core', 'Elective', 'Optional', 'Co-Curricular']

const emptyForm = {
  schoolId: '',
  name: '',
  subjectCode: '',
  author: '',
  type: '',
  classId: '',
  teacherId: '',
  note: '',
}

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Name: 'ri-book-open-line',
  'Subject Code': 'ri-barcode-line',
  Author: 'ri-quill-pen-line',
  Type: 'ri-price-tag-3-line',
  Class: 'ri-building-line',
  Teacher: 'ri-user-3-line',
  Note: 'ri-sticky-note-line',
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

const AddSubject = ({ onNavigate }) => {
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

  const [activeTab, setActiveTab] = useState(0)
  const [schools, setSchools] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
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
        teacherId: initialEditRow.teacherId ? String(initialEditRow.teacherId) : '',
      }
    }
    const listSchoolId = isSuperAdmin ? (activeSchoolId ? String(activeSchoolId) : '') : (authSchoolId ? String(authSchoolId) : '')
    return { ...emptyForm, schoolId: listSchoolId }
  })

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), [])

  useEffect(() => {
    fetchSchoolsLookup().then(setSchools).catch(() => setSchools([]))
    fetchTeachers().then(data => {
        const rows = Array.isArray(data) ? data : []
        setTeachersLookup(
          rows
            .map((t) => ({ id: t?.id, name: t?.name }))
            .filter((t) => t.id != null && t.name)
            .sort((a, b) => a.name.localeCompare(b.name))
        )
    }).catch(() => setTeachersLookup([]))
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

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions
    return contextSchoolOptions || []
  }, [isSuperAdmin, manualScope.schoolOptions, contextSchoolOptions])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (loading) return
    setError('')
    setSuccess(false)

    if (!form.schoolId) { setError('School is required'); return }
    if (!form.name.trim()) { setError('Subject name is required'); return }
    if (!form.classId) { setError('Class is required'); return }
    if (!form.teacherId) { setError('Teacher is required'); return }

    setLoading(true)
    try {
      const payload = {
        schoolId: Number(form.schoolId),
        classId: Number(form.classId),
        teacherId: Number(form.teacherId),
        name: form.name,
        subjectCode: form.subjectCode,
        author: form.author,
        type: form.type,
        note: form.note,
      }
      if (initialEditRow) {
        await updateSubject(initialEditRow.id, payload)
      } else {
        await createSubject(payload)
      }
      setSuccess(true)
      setTimeout(() => onNavigate('subject'), 1000)
    } catch (err) {
      setError(err?.message || 'Failed to process subject')
    } finally {
      setLoading(false)
    }
  }

  const isEditing = Boolean(initialEditRow)

  const TABS = ['Basic Info', 'Class & Teacher']

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">{isEditing ? 'Edit' : 'Add'} Subject</h1>
          <span className="text-secondary-light">Academic / Subject / {isEditing ? 'Edit' : 'Add'}</span>
        </div>
        <button className="btn btn-light border px-20 d-flex align-items-center gap-6" onClick={() => onNavigate('subject')}>
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
          Subject {isEditing ? 'updated' : 'created'} successfully! Redirecting...
        </div>
      )}

      <div className="card h-100">
        <div className="card-header border-bottom border-neutral-200 px-20 py-0 d-flex gap-0">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(i)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === i ? '2px solid var(--primary-600, #4f46e5)' : '2px solid transparent',
                color: activeTab === i ? 'var(--primary-600, #4f46e5)' : 'var(--secondary-light, #667085)',
                fontWeight: activeTab === i ? 600 : 400,
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
            {activeTab === 0 && (
              <div className="row g-20">
                {isSuperAdmin ? (
                  <div className="col-12 mb-20">
                    <ManualScopeSelectors
                      enabled={isSuperAdmin}
                      headOffices={manualScope.headOffices}
                      schoolOptions={schoolOptions}
                      selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                      onHeadOfficeChange={(val) => { manualScope.setSelectedHeadOfficeId(val); setForm(p => ({ ...p, schoolId: '', classId: '' })) }}
                      selectedSchoolId={form.schoolId}
                      onSchoolChange={(val) => setForm(p => ({ ...p, schoolId: val, classId: '' }))}
                      compact
                    />
                  </div>
                ) : (
                  <FormField label="School Name" required full>
                    <select className="form-control form-select ps-40" id="schoolId" value={form.schoolId} onChange={(e) => setForm(p => ({ ...p, schoolId: e.target.value, classId: '' }))}>
                      <option value="">--Select School--</option>
                      {schoolOptions.map((s) => (
                        <option key={s.id} value={String(s.id)}>{s.schoolName}</option>
                      ))}
                    </select>
                  </FormField>
                )}

                <FormField label="Name" required full>
                  <input type="text" id="name" className="form-control ps-40" placeholder="Subject Name" value={form.name} onChange={handleChange} />
                </FormField>

                <FormField label="Subject Code">
                  <input type="text" id="subjectCode" className="form-control ps-40" placeholder="Subject Code" value={form.subjectCode} onChange={handleChange} />
                </FormField>

                <FormField label="Author">
                  <input type="text" id="author" className="form-control ps-40" placeholder="Author" value={form.author} onChange={handleChange} />
                </FormField>

                <FormField label="Type" full>
                  <select id="type" className="form-control form-select ps-40" value={form.type} onChange={handleChange}>
                    <option value="">--Select Type--</option>
                    {subjectTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>
              </div>
            )}

            {activeTab === 1 && (
              <div className="row g-20">
                <FormField label="Class" required full>
                  <select id="classId" className="form-control form-select ps-40" value={form.classId} onChange={handleChange} disabled={!form.schoolId}>
                    <option value="">--Select Class--</option>
                    {classesLookup.map((c) => <option key={c.id} value={String(c.id)}>{c.className}</option>)}
                  </select>
                </FormField>

                <FormField label="Teacher" required full>
                  <select id="teacherId" className="form-control form-select ps-40" value={form.teacherId} onChange={handleChange}>
                    <option value="">--Select Teacher--</option>
                    {teachersLookup.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                  </select>
                </FormField>

                <FormField label="Note" full noIcon>
                  <textarea id="note" rows="4" className="form-control pt-10" placeholder="Note" value={form.note} onChange={handleChange} />
                </FormField>
              </div>
            )}

            <div className="d-flex align-items-center justify-content-between gap-10 mt-24 pt-20 border-top border-neutral-200">
              <div>
                {activeTab > 0 && (
                  <button type="button" className="btn btn-light border px-24" onClick={() => setActiveTab(activeTab - 1)}>
                    <i className="ri-arrow-left-line" /> Previous
                  </button>
                )}
              </div>
              <div className="d-flex gap-10">
                <button type="button" className="btn btn-light border px-24" onClick={() => onNavigate('subject')}>Cancel</button>
                {activeTab < 1 ? (
                  <button type="button" className="btn btn-primary-600 px-24 d-flex align-items-center gap-8" onClick={() => setActiveTab(activeTab + 1)}>
                    Next <i className="ri-arrow-right-line" />
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary-600 px-24 d-flex align-items-center gap-8" disabled={loading} onClick={handleSubmit}>
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...</>
                    ) : (
                      <><i className="ri-save-line" /> {isEditing ? 'Update' : 'Save'} Subject</>
                    )}
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

export default AddSubject
