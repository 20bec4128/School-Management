import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import {
  createSyllabus,
  deleteSyllabus,
  fetchSyllabuses,
  updateSyllabus,
} from '../apis/syllabusApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { can } from '../utils/permissions'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import '../assets/css/addModalShared.css'

const sessionYearOptions = ['2024-2025', '2023-2024', '2022-2023']

const ACCEPTED_DOC_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.txt'
const ACCEPTED_DOC_LABEL = '.pdf, .doc/docx, .ppt/pptx or .txt'

const emptyForm = {
  schoolId: '',
  classId: '',
  subjectId: '',
  title: '',
  sessionYear: '',
  syllabus: null,
  note: '',
  existingFileName: '',
}

const emptyFilters = {
  school: 'Select',
  className: 'Select',
  subject: 'Select',
  sessionYear: 'Select',
}

const STEPS = ['Basic Info', 'Syllabus & Notes']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Title: 'ri-file-list-2-line',
  Class: 'ri-building-line',
  Subject: 'ri-book-open-line',
  'Session Year': 'ri-calendar-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'title', label: 'Title' },
  { key: 'className', label: 'Class' },
  { key: 'subject', label: 'Subject' },
  { key: 'sessionYear', label: 'Session Year' },
  { key: 'file', label: 'File' },
]

const getFileIcon = (fileName) => {
  if (!fileName) return 'ri-file-line'
  const ext = fileName.split('.').pop().toLowerCase()
  if (ext === 'pdf') return 'ri-file-pdf-line'
  if (['doc', 'docx'].includes(ext)) return 'ri-file-word-line'
  if (['ppt', 'pptx'].includes(ext)) return 'ri-slideshow-line'
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

const normalizeSyllabus = (row) => ({
  id: row?.id,
  schoolId: row?.schoolId != null ? String(row.schoolId) : '',
  school: row?.school || '',
  classId: row?.classId != null ? String(row.classId) : '',
  className: row?.className || '',
  subjectId: row?.subjectId != null ? String(row.subjectId) : '',
  subject: row?.subject || '',
  title: row?.title || '',
  sessionYear: row?.sessionYear || '',
  note: row?.note || '',
  fileName: row?.fileName || '',
  fileType: row?.fileType || '',
  fileUrl: row?.fileUrl || '',
})

const getChildScope = (children, selectedChildId) => {
  const list = Array.isArray(children) ? children : []
  const selected =
    selectedChildId != null && selectedChildId !== ''
      ? list.find((child) => String(
        child?.studentId ??
        child?.id ??
        child?.childId ??
        child?.student?.id ??
        child?.student?.studentId ??
        child?.student?.childId ??
        ''
      ) === String(selectedChildId))
      : null
  return selected || list[0] || null
}

const getChildSchoolId = (child) =>
  child?.schoolId ??
  child?.school?.id ??
  child?.student?.schoolId ??
  child?.student?.school?.id ??
  child?.student?.school?.schoolId ??
  child?.school?.schoolId ??
  null

const getChildClassId = (child) =>
  child?.classId ??
  child?.schoolClassId ??
  child?.schoolClass?.id ??
  child?.student?.classId ??
  child?.student?.schoolClassId ??
  child?.student?.schoolClass?.id ??
  child?.schoolClass?.id ??
  null

const Syllabus = () => {
  const { user, role, schoolId, studentClassId, selectedChildId, parentChildren } = useAuth()
  const { activeSchoolId, isSchoolSelectionEnabled } = useSchool()
  const canManage = can(user, ['SYLLABUS_MANAGE', 'SYLLABUS_MANAGE_ASSIGNED', '*'])

  const [syllabuses, setSyllabuses] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [addSyllabusFile, setAddSyllabusFile] = useState(null)
  const [editSyllabusFile, setEditSyllabusFile] = useState(null)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)
  const roleUpper = String(role || '').toUpperCase()
  const isStudentScope = roleUpper === 'STUDENT' || roleUpper === 'PARENT'
  const selectedChild = useMemo(() => getChildScope(parentChildren, selectedChildId), [parentChildren, selectedChildId])
  const effectiveSchoolId =
    roleUpper === 'STUDENT'
      ? (schoolId ?? activeSchoolId ?? null)
      : roleUpper === 'PARENT'
        ? getChildSchoolId(selectedChild)
        : null
  const effectiveClassId =
    roleUpper === 'STUDENT'
      ? studentClassId ?? null
      : roleUpper === 'PARENT'
        ? getChildClassId(selectedChild)
        : null

  const addFileRef = useRef(null)
  const editFileRef = useRef(null)

  const loadLookups = useCallback(async () => {
    if (!canManage) {
      setSchoolsLookup([])
      setClassesLookup([])
      setSubjectsLookup([])
      return
    }
    const [schools, classes, subjects] = await Promise.all([
      fetchSchoolsLookup(),
      fetchClasses(),
      fetchSubjects(),
    ])

    setSchoolsLookup(Array.isArray(schools) ? schools : [])
    setClassesLookup(Array.isArray(classes) ? classes : [])
    setSubjectsLookup(Array.isArray(subjects) ? subjects : [])
  }, [canManage])

  const loadSyllabuses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const scopedParams = isStudentScope
        ? (effectiveSchoolId && effectiveClassId
            ? { schoolId: effectiveSchoolId, classId: effectiveClassId }
            : null)
        : isSchoolSelectionEnabled && activeSchoolId
          ? { schoolId: activeSchoolId }
          : {}

      if (isStudentScope && !scopedParams) {
        setSyllabuses([])
        setError(roleUpper === 'PARENT' && !selectedChildId ? 'Please select a child first.' : 'Unable to determine your class scope.')
        return
      }

      const data = await fetchSyllabuses(scopedParams || {})
      setSyllabuses(Array.isArray(data) ? data.map(normalizeSyllabus) : [])
    } catch (e) {
      if (String(e?.message || '').toLowerCase().includes('403') || String(e?.message || '').toLowerCase().includes('forbidden')) {
        setSyllabuses([])
        setError(isStudentScope ? 'Select a child to view syllabuses.' : 'You are not allowed to view syllabuses.')
      } else {
        setSyllabuses([])
        setError(e?.message || 'Failed to load syllabuses')
      }
    } finally {
      setLoading(false)
    }
  }, [activeSchoolId, effectiveClassId, effectiveSchoolId, isSchoolSelectionEnabled, isStudentScope, roleUpper, selectedChildId])

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

  useEffect(() => {
    void loadSyllabuses()
  }, [loadSyllabuses])

  const schoolFilterOptions = useMemo(() => {
    const source = schoolsLookup.length > 0 ? schoolsLookup.map((s) => s?.schoolName) : syllabuses.map((row) => row?.school)
    return Array.from(new Set(source.filter(Boolean))).sort()
  }, [schoolsLookup, syllabuses])

  const classFilterOptions = useMemo(() => {
    const source = classesLookup.length > 0 ? classesLookup.map((c) => c?.className) : syllabuses.map((row) => row?.className)
    return Array.from(new Set(source.filter(Boolean))).sort()
  }, [classesLookup, syllabuses])

  const subjectFilterOptions = useMemo(() => {
    const source = subjectsLookup.length > 0 ? subjectsLookup.map((s) => s?.subject || s?.name) : syllabuses.map((row) => row?.subject)
    return Array.from(new Set(source.filter(Boolean))).sort()
  }, [subjectsLookup, syllabuses])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return syllabuses.filter((row) => {
      const matchesSearch =
        !q ||
        [row?.school, row?.title, row?.className, row?.subject, row?.sessionYear, row?.note, row?.fileName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)

      const matchesSchool = filters.school === 'Select' || row?.school === filters.school
      const matchesClass = filters.className === 'Select' || row?.className === filters.className
      const matchesSubject = filters.subject === 'Select' || row?.subject === filters.subject
      const matchesSession =
        filters.sessionYear === 'Select' || row?.sessionYear === filters.sessionYear

      return matchesSearch && matchesSchool && matchesClass && matchesSubject && matchesSession
    })
  }, [syllabuses, search, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const allSelected = paginated.length > 0 && paginated.every((row) => selectedRows.includes(row.id))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((row) => row.id)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !paginated.some((row) => row.id === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    )
  }

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({ ...prev, [id]: value }))
  }

  const handleSchoolChange = (setter) => (e) => {
    const schoolId = e.target.value
    setter((prev) => ({ ...prev, schoolId, classId: '', subjectId: '' }))
  }

  const handleClassChange = (setter) => (e) => {
    const classId = e.target.value
    setter((prev) => ({ ...prev, classId, subjectId: '' }))
  }

  const handleFileChange = (setter, setFile) => (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setter((prev) => ({ ...prev, syllabus: file }))
    setFile(file)
  }

  const handlePendingFilterChange = (e) => {
    if (isStudentScope) return
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    if (isStudentScope) return
    setFilters(pendingFilters)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    if (isStudentScope) return
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
  }

  const closeAdd = () => {
    setIsAddOpen(false)
    setAddForm(emptyForm)
    setAddSyllabusFile(null)
    setAddStep(0)
  }

  const closeEdit = () => {
    setIsEditOpen(false)
    setEditForm(emptyForm)
    setEditSyllabusFile(null)
    setEditStep(0)
    setEditingId(null)
  }

  const openAdd = () => {
    if (!canManage) return
    setError('')
    setAddForm(emptyForm)
    setAddSyllabusFile(null)
    setAddStep(0)
    if (addFileRef.current) addFileRef.current.value = ''
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    if (!canManage) return
    setError('')
    setEditingId(row?.id ?? null)
    setEditForm({
      schoolId: row?.schoolId || '',
      classId: row?.classId || '',
      subjectId: row?.subjectId || '',
      title: row?.title || '',
      sessionYear: row?.sessionYear || '',
      syllabus: null,
      note: row?.note || '',
      existingFileName: row?.fileName || '',
    })
    setEditSyllabusFile(null)
    if (editFileRef.current) editFileRef.current.value = ''
    setEditStep(0)
    setIsEditOpen(true)
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  const getClassesForSchool = (schoolId) => {
    const rows = classesLookup.filter((row) => !schoolId || String(row?.schoolId) === String(schoolId))
    return rows.sort((a, b) => (a?.className || '').localeCompare(b?.className || ''))
  }

  const getSubjectsForForm = (schoolId, classId) => {
    const rows = subjectsLookup.filter((row) => {
      const matchesSchool = !schoolId || String(row?.schoolId) === String(schoolId)
      const matchesClass = !classId || String(row?.classId) === String(classId)
      return matchesSchool && matchesClass
    })
    return rows.sort((a, b) => (a?.subject || a?.name || '').localeCompare(b?.subject || b?.name || ''))
  }

  const getValidationError = (form) => {
    if (!form.schoolId) return 'Please select a school.'
    if (!form.classId) return 'Please select a class.'
    if (!form.subjectId) return 'Please select a subject.'
    if (!form.title.trim()) return 'Please enter a title.'
    if (!form.sessionYear) return 'Please select an academic year.'
    return ''
  }

  const buildPayload = (form) => ({
    schoolId: Number(form.schoolId),
    classId: Number(form.classId),
    subjectId: Number(form.subjectId),
    title: form.title.trim(),
    sessionYear: form.sessionYear,
    note: form.note || '',
  })

  const handleCreate = async () => {
    if (saving) return
    const validationError = getValidationError(addForm)
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError('')
    try {
      const created = normalizeSyllabus(await createSyllabus(buildPayload(addForm), addSyllabusFile))
      setSyllabuses((prev) => [created, ...prev])
      closeAdd()
      setCurrentPage(1)
    } catch (e) {
      setError(e?.message || 'Failed to create syllabus')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (saving) return
    if (!editingId) {
      setError('No syllabus selected for update')
      return
    }

    const validationError = getValidationError(editForm)
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError('')
    try {
      const updated = normalizeSyllabus(
        await updateSyllabus(editingId, buildPayload(editForm), editSyllabusFile),
      )
      setSyllabuses((prev) => prev.map((row) => (row.id === updated.id ? updated : row)))
      closeEdit()
    } catch (e) {
      setError(e?.message || 'Failed to update syllabus')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!canManage) return
    if (!id) return
    const confirmed = window.confirm('Delete this syllabus? This cannot be undone.')
    if (!confirmed) return

    setSaving(true)
    setError('')
    try {
      await deleteSyllabus(id)
      setSyllabuses((prev) => prev.filter((row) => row.id !== id))
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id))
    } catch (e) {
      setError(e?.message || 'Failed to delete syllabus')
    } finally {
      setSaving(false)
    }
  }

  const renderForm = (form, setter, step, syllabusFile, setSyllabusFile, fileRef) => {
    const availableClasses = getClassesForSchool(form.schoolId)
    const availableSubjects = getSubjectsForForm(form.schoolId, form.classId)

    return (
      <>
        <p className="avm-section-title">{STEPS[step]}</p>
        <div className="avm-grid">
          {step === 0 && (
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
                <select
                  className="avm-select"
                  id="schoolId"
                  value={form.schoolId}
                  onChange={handleSchoolChange(setter)}
                >
                  <option value="">--Select School--</option>
                  {schoolsLookup.map((school) => (
                    <option key={school.id} value={String(school.id)}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Title" required full>
                <input
                  type="text"
                  className="avm-input"
                  id="title"
                  placeholder="Title"
                  value={form.title}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Class" required>
                <select
                  className="avm-select"
                  id="classId"
                  value={form.classId}
                  onChange={handleClassChange(setter)}
                  disabled={!form.schoolId}
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
                  onChange={handleChange(setter)}
                  disabled={!form.schoolId || !form.classId}
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
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {sessionYearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </FormField>
            </>
          )}

          {step === 1 && (
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
                        <i
                          className="ri-upload-cloud-2-line"
                          style={{ fontSize: '1.6rem', color: '#45597a' }}
                        ></i>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#45597a' }}>
                          Click to upload document
                        </p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                          Document file format: {ACCEPTED_DOC_LABEL}
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
                    accept={ACCEPTED_DOC_TYPES}
                    style={{ display: 'none' }}
                    onChange={handleFileChange(setter, setSyllabusFile)}
                  />
                </div>
                {syllabusFile && (
                  <button
                    type="button"
                    className="avm-btn light sm"
                    style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                    onClick={() => {
                      setter((prev) => ({ ...prev, syllabus: null }))
                      setSyllabusFile(null)
                      if (fileRef.current) fileRef.current.value = ''
                    }}
                  >
                    <i className="ri-delete-bin-line"></i> Remove
                  </button>
                )}
              </div>

              <FormField label="Note" full>
                <textarea
                  rows={4}
                  className="avm-input avm-textarea"
                  id="note"
                  placeholder="Note"
                  value={form.note}
                  onChange={handleChange(setter)}
                />
              </FormField>
            </>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Syllabus</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Syllabus</span>
          </div>
        </div>
        {canManage ? (
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={openAdd}
          >
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add Syllabus
          </button>
        ) : (
          <span className="text-secondary-light fw-medium">View only</span>
        )}
      </div>

      {error ? (
        <div className="alert alert-danger mb-20" role="alert">
          {error}
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1"></i> Export
                  </span>
                  <span>
                    <i className="ri-arrow-down-s-line"></i>
                  </span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li>
                    <button
                      type="button"
                      className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                    >
                      <i className="ri-file-3-line"></i> PDF
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                    >
                      <i className="ri-file-excel-2-line"></i> Excel
                    </button>
                  </li>
                </ul>
              </div>

              {!isStudentScope ? (
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  onClick={() => setIsFilterSidebarOpen(true)}
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    Filter
                  </span>
                  <span>
                    <i className="ri-arrow-right-line"></i>
                  </span>
                </button>
              ) : null}

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    Columns
                  </span>
                  <span>
                    <i className="ri-arrow-down-s-line"></i>
                  </span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  {columnOptions.map((column) => (
                    <li key={column.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={visibleColumns[column.key]}
                          onChange={() => toggleColumn(column.key)}
                        />
                        {column.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search syllabus..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 980 }}>
              <thead>
                <tr>
                  {canManage ? (
                    <th scope="col">
                      <div className="form-check style-check d-flex align-items-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={allSelected}
                          onChange={handleSelectAll}
                        />
                        <label className="form-check-label">S.L</label>
                      </div>
                    </th>
                  ) : null}
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.title ? <th scope="col">Title</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.subject ? <th scope="col">Subject</th> : null}
                  {visibleColumns.sessionYear ? <th scope="col">Session Year</th> : null}
                  {visibleColumns.file ? <th scope="col">File</th> : null}
                  {canManage ? <th scope="col">Action</th> : null}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + (canManage ? 2 : 0)}
                      className="text-center py-40 text-secondary-light"
                    >
                      Loading syllabus records...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + (canManage ? 2 : 0)}
                      className="text-center py-40 text-secondary-light"
                    >
                      No syllabus records found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, index) => (
                    <tr key={row.id}>
                      {canManage ? (
                        <td>
                          <div className="form-check style-check d-flex align-items-center">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={selectedRows.includes(row.id)}
                              onChange={() => handleSelectRow(row.id)}
                            />
                            <label className="form-check-label">
                              {(currentPage - 1) * rowsPerPage + index + 1}
                            </label>
                          </div>
                        </td>
                      ) : null}
                      {visibleColumns.school ? <td>{row.school}</td> : null}
                      {visibleColumns.title ? (
                        <td>
                          <span className="fw-medium text-primary-light d-flex align-items-center gap-6">
                            <i className="ri-file-list-2-line text-secondary-light"></i>
                            {row.title}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.className ? <td>{row.className}</td> : null}
                      {visibleColumns.subject ? (
                        <td>
                          <span className="bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm">
                            {row.subject}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.sessionYear ? (
                        <td>
                          <span className="bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm">
                            {row.sessionYear}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.file ? (
                        <td>
                          {row.fileUrl ? (
                            <a
                              href={row.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary-600 fw-medium d-inline-flex align-items-center gap-6"
                            >
                              <i className={getFileIcon(row.fileName)}></i>
                              {row.fileName || 'Download'}
                            </a>
                          ) : (
                            <span className="text-secondary-light">No file</span>
                          )}
                        </td>
                      ) : null}
                      {canManage ? (
                        <td>
                          <div className="d-flex align-items-center gap-10">
                            <button
                              type="button"
                              className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                              onClick={() => openEdit(row)}
                              title="Edit"
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                            <button
                              type="button"
                              className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                              onClick={() => handleDelete(row.id)}
                              title="Delete"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        </td>
                      ) : (
                        <td>
                          <span className="text-secondary-light">Read only</span>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              {getVisiblePages().map((p) => (
                <button
                  key={p}
                  type="button"
                  className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <WizardPopup
        modalWidth="560px"
        open={isAddOpen}
        title="Add Syllabus"
        steps={STEPS}
        step={addStep}
        onClose={closeAdd}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleCreate}
        submitLabel={saving ? 'Saving...' : 'Save'}
      >
        {renderForm(addForm, setAddForm, addStep, addSyllabusFile, setAddSyllabusFile, addFileRef)}
      </WizardPopup>

      <WizardPopup
        modalWidth="560px"
        open={isEditOpen}
        title="Edit Syllabus"
        steps={STEPS}
        step={editStep}
        onClose={closeEdit}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleUpdate}
        submitLabel={saving ? 'Updating...' : 'Update'}
      >
        {renderForm(editForm, setEditForm, editStep, editSyllabusFile, setEditSyllabusFile, editFileRef)}
      </WizardPopup>

      {!isStudentScope ? (
        <SlideSidebar
          isOpen={isFilterSidebarOpen}
          title="Filter Syllabus"
          onClose={() => setIsFilterSidebarOpen(false)}
          className="filter-sidebar"
        >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="school"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              School
            </label>
            <select
              id="school"
              className="form-control form-select"
              value={pendingFilters.school}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select School</option>
              {schoolFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="className"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Class
            </label>
            <select
              id="className"
              className="form-control form-select"
              value={pendingFilters.className}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select</option>
              {classFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="subject"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Subject
            </label>
            <select
              id="subject"
              className="form-control form-select"
              value={pendingFilters.subject}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select</option>
              {subjectFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="sessionYear"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Session Year
            </label>
            <select
              id="sessionYear"
              className="form-control form-select"
              value={pendingFilters.sessionYear}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select</option>
              {sessionYearOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-danger-200 text-danger-600 w-100"
            >
              Reset
            </button>
          </div>
          <div>
            <button type="submit" className="btn btn-primary-600 w-100" onClick={() => setIsFilterSidebarOpen(false)}>
              Apply
            </button>
          </div>
        </form>
        </SlideSidebar>
      ) : null}
    </div>
  )
}

export default Syllabus
