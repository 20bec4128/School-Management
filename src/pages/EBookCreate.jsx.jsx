import { useEffect, useMemo, useState } from 'react'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import { createEBook, updateEBook } from '../apis/ebooksApi'
import { apiUrl } from '../apis/apiClient'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import '../assets/css/addModalShared.css'

const SUBJECT_TYPE = 'SUBJECT'
const GENERAL_TYPE = 'GENERAL'

const emptyForm = {
  id: null,
  headOfficeId: '',
  schoolId: '',
  ebookType: SUBJECT_TYPE,
  classId: '',
  subjectId: '',
  ebookName: '',
  edition: '',
  author: '',
  language: '',
  coverImage: '',
}

const TYPE_OPTIONS = [
  { value: SUBJECT_TYPE, label: 'Subject E-Books' },
  { value: GENERAL_TYPE, label: 'General E-Books' },
]

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  Type: 'ri-price-tag-3-line',
  Class: 'ri-bank-line',
  Subject: 'ri-book-open-line',
  Name: 'ri-book-line',
  Edition: 'ri-bookmark-line',
  Author: 'ri-user-follow-line',
  Language: 'ri-global-line',
}

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
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
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <i className={icon} />
        </span>
        {children}
      </div>
    </div>
  )
}

const getSchoolById = (rows, schoolId) =>
  (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(schoolId ?? '')) || null

const resolveMediaUrl = (value) => {
  const src = String(value || '').trim()
  if (!src) return ''
  return apiUrl(src)
}

const getRowFromSession = () => {
  try {
    const raw = sessionStorage.getItem('edit-ebook-row')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const normalizeType = (value) => {
  const v = String(value || '').trim().toUpperCase()
  if (v === GENERAL_TYPE) return GENERAL_TYPE
  return SUBJECT_TYPE
}

const EBookCreate = ({ onNavigate }) => {
  const { role: authRole, headOfficeId: authHeadOfficeId, schoolId: authSchoolId } = useAuth()
  const { activeSchoolId } = useSchool()
  const role = useMemo(() => normalizeRole(authRole), [authRole])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(true)

  const initialRow = useMemo(() => getRowFromSession(), [])

  const [form, setForm] = useState(() => {
    if (!initialRow) return emptyForm
    return {
      ...emptyForm,
      id: initialRow?.id ?? null,
      headOfficeId: initialRow?.headOfficeId != null ? String(initialRow.headOfficeId) : '',
      schoolId: initialRow?.schoolId != null ? String(initialRow.schoolId) : '',
      ebookType: normalizeType(initialRow?.ebookType),
      classId: initialRow?.classId != null ? String(initialRow.classId) : '',
      subjectId: initialRow?.subjectId != null ? String(initialRow.subjectId) : '',
      ebookName: initialRow?.ebookName || '',
      edition: initialRow?.edition || '',
      author: initialRow?.author || '',
      language: initialRow?.language || '',
      coverImage: initialRow?.coverImage || '',
    }
  })
  const [coverPreview, setCoverPreview] = useState(() => resolveMediaUrl(initialRow?.coverImage))
  const [ebookFile, setEbookFile] = useState(null)
  const [existingFileName, setExistingFileName] = useState(initialRow?.fileName || '')
  const [ebookFileName, setEbookFileName] = useState(initialRow?.fileName || '')
  const [classOptions, setClassOptions] = useState([])
  const [subjectOptions, setSubjectOptions] = useState([])
  const [lookupLoading, setLookupLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEditing = Boolean(form.id)
  const isSubjectType = normalizeType(form.ebookType) === SUBJECT_TYPE

  const scopedSchoolOptions = useMemo(() => {
    const rows = Array.isArray(manualScope.schoolOptions) ? manualScope.schoolOptions : []
    if (isSuperAdmin) {
      if (!form.headOfficeId) return rows
      return rows.filter((school) => String(school?.headOfficeId ?? '') === String(form.headOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return rows.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return rows.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return rows
  }, [authHeadOfficeId, authSchoolId, form.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.schoolOptions])

  const selectedHeadOfficeName = useMemo(
    () => manualScope.headOffices.find((row) => String(row?.id ?? '') === String(form.headOfficeId))?.name || '',
    [form.headOfficeId, manualScope.headOffices],
  )

  const selectedSchool = useMemo(
    () => getSchoolById(manualScope.schoolOptions, form.schoolId),
    [form.schoolId, manualScope.schoolOptions],
  )

  useEffect(() => {
    if (isSuperAdmin && activeSchoolId) {
      const school = getSchoolById(manualScope.schoolOptions, activeSchoolId)
      if (school?.headOfficeId != null) {
        manualScope.setSelectedScope(String(school.headOfficeId), String(activeSchoolId))
      }
    }
  }, [activeSchoolId, isSuperAdmin, manualScope])

  useEffect(() => {
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      manualScope.setSelectedScope(String(authHeadOfficeId), String(authSchoolId ?? ''))
      setForm((prev) => ({
        ...prev,
        headOfficeId: String(authHeadOfficeId),
        schoolId: authSchoolId != null ? String(authSchoolId) : prev.schoolId,
      }))
    }
  }, [authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, manualScope])

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return
    const school = getSchoolById(manualScope.schoolOptions, authSchoolId)
    manualScope.setSelectedScope(school?.headOfficeId != null ? String(school.headOfficeId) : '', String(authSchoolId))
    setForm((prev) => ({
      ...prev,
      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
      schoolId: String(authSchoolId),
    }))
  }, [authSchoolId, isSchoolAdmin, manualScope])

  useEffect(() => {
    if (!form.schoolId || !isSubjectType) {
      setClassOptions([])
      setSubjectOptions([])
      return
    }

    let cancelled = false

    const loadLookups = async () => {
      setLookupLoading(true)
      try {
        const [classes, subjects] = await Promise.all([
          fetchClasses({ schoolId: form.schoolId }),
          fetchSubjects({ schoolId: form.schoolId }),
        ])
        if (cancelled) return
        setClassOptions(Array.isArray(classes) ? classes : [])
        setSubjectOptions(Array.isArray(subjects) ? subjects : [])
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load e-book lookups:', err)
        setClassOptions([])
        setSubjectOptions([])
      } finally {
        if (!cancelled) setLookupLoading(false)
      }
    }

    void loadLookups()
    return () => {
      cancelled = true
    }
  }, [form.schoolId, isSubjectType])

  const handleSchoolChange = (value) => {
    const school = getSchoolById(manualScope.schoolOptions, value)
    setForm((prev) => ({
      ...prev,
      schoolId: value,
      classId: '',
      subjectId: '',
      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
    }))
    manualScope.setSelectedScope(school?.headOfficeId != null ? String(school.headOfficeId) : form.headOfficeId, value)
  }

  const handleTypeChange = (value) => {
    const ebookType = normalizeType(value)
    setForm((prev) => ({
      ...prev,
      ebookType,
      classId: ebookType === GENERAL_TYPE ? '' : prev.classId,
      subjectId: ebookType === GENERAL_TYPE ? '' : prev.subjectId,
    }))
  }

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      setCoverPreview(dataUrl)
      setForm((prev) => ({ ...prev, coverImage: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  const handleEBookFileChange = (e) => {
    const file = e.target.files?.[0] || null
    setEbookFile(file)
    setEbookFileName(file?.name || existingFileName || '')
  }

  const handleSave = async () => {
    const school = selectedSchool || getSchoolById(manualScope.schoolOptions, form.schoolId)
    const headOfficeId = form.headOfficeId
      ? Number(form.headOfficeId)
      : school?.headOfficeId != null
        ? Number(school.headOfficeId)
        : null

    if (!headOfficeId) return setError('Head office is required.')
    if (!form.schoolId) return setError('School is required.')
    if (!form.ebookName.trim()) return setError('Name is required.')

    const ebookType = normalizeType(form.ebookType)
    const payload = {
      headOfficeId,
      schoolId: Number(form.schoolId),
      ebookType,
      ebookName: form.ebookName.trim(),
      edition: form.edition.trim() || null,
      author: form.author.trim() || null,
      language: form.language.trim() || null,
      coverImage: form.coverImage || null,
      classId: null,
      subjectId: null,
    }

    if (ebookType === SUBJECT_TYPE) {
      if (!form.classId) return setError('Class is required for subject e-books.')
      if (!form.subjectId) return setError('Subject is required for subject e-books.')
      payload.classId = Number(form.classId)
      payload.subjectId = Number(form.subjectId)
    }

    if (!ebookFile && !existingFileName) {
      return setError('E-Book file is required.')
    }

    setSaving(true)
    setError('')
    try {
      if (isEditing) {
        await updateEBook(form.id, payload, ebookFile)
      } else {
        await createEBook(payload, ebookFile)
      }
      sessionStorage.removeItem('edit-ebook-row')
      onNavigate?.('ebook-list')
    } catch (err) {
      console.error('Failed to save e-book:', err)
      setError(err?.message || 'Failed to save e-book')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">{isEditing ? 'Edit E-Book' : 'Add E-Book'}</h1>
          <span className="text-secondary-light">Library / E-Book / {isEditing ? 'Edit' : 'Add'}</span>
        </div>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-6"
          onClick={() => {
            sessionStorage.removeItem('edit-ebook-row')
            onNavigate ? onNavigate('ebook-list') : window.history.back()
          }}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-header border-bottom border-neutral-200">
          <h6 className="text-md fw-semibold mb-0">E-Book Information</h6>
        </div>
        <div className="card-body p-24">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleSave()
            }}
          >
            <div className="row g-20 mb-32">
              {error ? <div className="col-12 text-danger">{error}</div> : null}

              {isSuperAdmin ? (
                <div className="col-12">
                  <ManualScopeSelectors
                    enabled
                    headOffices={manualScope.headOffices}
                    schoolOptions={scopedSchoolOptions}
                    selectedHeadOfficeId={form.headOfficeId}
                    onHeadOfficeChange={(value) => {
                      setForm((prev) => ({ ...prev, headOfficeId: value, schoolId: '', classId: '', subjectId: '' }))
                      manualScope.setSelectedScope(value, '')
                    }}
                    selectedSchoolId={form.schoolId}
                    onSchoolChange={handleSchoolChange}
                    schoolLabel="School"
                  />
                </div>
              ) : (
                <>
                  {isHeadOfficeAdmin ? (
                    <div className="col-12">
                      <label className="form-label fw-semibold text-primary-light">Head Office</label>
                      <input className="form-control bg-light" value={selectedHeadOfficeName || String(authHeadOfficeId ?? '')} disabled />
                    </div>
                  ) : null}

                  <div className="col-12">
                    <FormField label="School Name" required full>
                      <select
                        className="avm-select"
                        value={form.schoolId}
                        onChange={(e) => handleSchoolChange(e.target.value)}
                        disabled={isSchoolAdmin}
                      >
                        <option value="">{isSchoolAdmin ? 'Current School' : '--Select School--'}</option>
                        {scopedSchoolOptions.map((school) => (
                          <option key={String(school.id)} value={String(school.id)}>
                            {school.schoolName}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                </>
              )}

              <div className="col-md-6">
                <FormField label="Type" required full>
                  <select
                    className="avm-select"
                    value={form.ebookType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                  >
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {isSubjectType ? (
                <>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-primary-light">Class <span className="text-danger">*</span></label>
                    <select
                      className="form-control form-select"
                      value={form.classId}
                      onChange={(e) => setForm((prev) => ({ ...prev, classId: e.target.value, subjectId: '' }))}
                      required
                      disabled={!form.schoolId}
                    >
                      <option value="">{form.schoolId ? '--Select--' : 'Select School First'}</option>
                      {classOptions.map((schoolClass) => (
                        <option key={String(schoolClass.id)} value={String(schoolClass.id)}>
                          {schoolClass.className || schoolClass.numericName || `Class ${schoolClass.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-primary-light">Subject <span className="text-danger">*</span></label>
                    <select
                      className="form-control form-select"
                      value={form.subjectId}
                      onChange={(e) => setForm((prev) => ({ ...prev, subjectId: e.target.value }))}
                      required
                      disabled={!form.schoolId}
                    >
                      <option value="">{form.schoolId ? '--Select--' : 'Select School First'}</option>
                      {subjectOptions.map((subject) => (
                        <option key={String(subject.id)} value={String(subject.id)}>
                          {subject.subjectName || subject.name || `Subject ${subject.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="col-12">
                  
                </div>
              )}

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={form.ebookName}
                  onChange={(e) => setForm((prev) => ({ ...prev, ebookName: e.target.value }))}
                  placeholder="Name"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">Edition</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.edition}
                  onChange={(e) => setForm((prev) => ({ ...prev, edition: e.target.value }))}
                  placeholder="Edition"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">Author</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.author}
                  onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
                  placeholder="Author"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">Language</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.language}
                  onChange={(e) => setForm((prev) => ({ ...prev, language: e.target.value }))}
                  placeholder="Language"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">Cover Image</label>
                <input type="file" className="form-control" accept=".jpg,.jpeg,.png,.gif" onChange={handleCoverChange} />
                <p className="text-xs text-secondary-light mt-8">Max-W: 600px, Max-H: 800px (.jpg, .jpeg, .png, .gif)</p>
                {coverPreview ? <img src={coverPreview} alt="preview" className="mt-12 radius-8 w-100-px h-120-px object-fit-cover border" /> : null}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">E-Book File <span className="text-danger">*</span></label>
                <input
                  type="file"
                  className="form-control"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  onChange={handleEBookFileChange}
                  required={!existingFileName}
                />
                <p className="text-xs text-secondary-light mt-8">
                  Format: .pdf, .doc/docx, .ppt/pptx or .txt
                  {ebookFileName ? ` | Selected: ${ebookFileName}` : existingFileName ? ` | Current: ${existingFileName}` : ''}
                </p>
              </div>

              {lookupLoading ? (
                <div className="col-12 text-secondary-light">Loading class and subject lookups...</div>
              ) : null}
            </div>

            <div className="d-flex justify-content-end gap-12">
              <button
                type="button"
                className="btn btn-light border px-32"
                onClick={() => {
                  sessionStorage.removeItem('edit-ebook-row')
                  onNavigate?.('ebook-list')
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-600 px-32" disabled={saving}>
                {saving ? 'Saving...' : 'Save E-Book'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EBookCreate
