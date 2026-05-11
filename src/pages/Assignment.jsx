import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { createAssignment, deleteAssignment, fetchAssignments, fetchAssignmentsForStudent, updateAssignment } from '../apis/assignmentsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { can } from '../utils/permissions'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import '../assets/css/addModalShared.css'

const ACCEPTED_DOC_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.txt'
const ACCEPTED_DOC_LABEL = '.pdf, .doc/docx, .ppt/pptx or .txt'

const emptyForm = {
  schoolId: 'Select',
  classId: 'Select',
  sectionId: 'Select',
  subjectId: 'Select',
  title: '',
  assignmentDate: '',
  submissionDate: '',
  smsNotification: false,
  emailNotification: false,
  note: '',
}

const emptyFilters = {
  schoolId: 'Select',
  classId: 'Select',
  sectionId: 'Select',
  subjectId: 'Select',
  status: 'Select',
}

const STEPS = ['Basic Info', 'Dates & Settings']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Title: 'ri-file-list-2-line',
  Class: 'ri-building-line',
  Section: 'ri-layout-grid-line',
  Subject: 'ri-book-open-line',
  'Assignment Date': 'ri-calendar-2-line',
  'Submission Date': 'ri-calendar-check-line',
  Note: 'ri-sticky-note-line',
  Assignment: 'ri-attachment-2',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'className', label: 'Class' },
  { key: 'sectionName', label: 'Section' },
  { key: 'subjectName', label: 'Subject' },
  { key: 'title', label: 'Title' },
  { key: 'assignmentDate', label: 'Assignment Date' },
  { key: 'submissionDate', label: 'Submission Date' },
  { key: 'status', label: 'Status' },
  { key: 'assignmentFile', label: 'File' },
]

const statusBadge = (status) => {
  const value = String(status || '').toLowerCase()
  if (value === 'submitted') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (value === 'graded') return 'bg-primary-100 text-primary-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (value === 'pending') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (value === 'overdue') return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
}

const getFileIcon = (fileName) => {
  if (!fileName) return 'ri-file-line'
  const ext = String(fileName).split('.').pop().toLowerCase()
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

const NotificationToggle = ({ id, label, icon, checked, onChange }) => (
  <label
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.65rem',
      cursor: 'pointer',
      padding: '0.7rem 1rem',
      background: checked ? '#e8edf4' : '#f8fafc',
      border: `1px solid ${checked ? '#45597a' : '#d0d5dd'}`,
      borderRadius: '0.75rem',
      transition: 'all 0.18s',
      userSelect: 'none',
      flex: 1,
    }}
  >
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onChange}
      style={{ width: 16, height: 16, accentColor: '#45597a', flexShrink: 0 }}
    />
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <i className={icon} style={{ color: checked ? '#45597a' : '#7a8a9a', fontSize: '1rem' }}></i>
      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: checked ? '#45597a' : '#34393f' }}>{label}</span>
    </span>
    {checked ? (
      <span
        style={{
          marginLeft: 'auto',
          fontSize: '0.72rem',
          fontWeight: 600,
          color: '#45597a',
          background: '#c8d4e8',
          borderRadius: '2rem',
          padding: '0.15rem 0.55rem',
          whiteSpace: 'nowrap',
        }}
      >
        On
      </span>
    ) : null}
  </label>
)

const Assignment = () => {
  const {
    user,
    role,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    studentId,
    selectedChildId,
    parentChildren,
  } = useAuth()
  const { activeSchoolId } = useSchool()

  const roleUpper = String(role || '').toUpperCase()
  const selectedChild = useMemo(() => {
    const list = Array.isArray(parentChildren) ? parentChildren : []
    if (selectedChildId == null || selectedChildId === '') return null
    return (
      list.find((child) =>
        [child?.studentId ?? child?.id ?? child?.student?.id ?? '', child?.student?.studentId ?? ''].some(
          (candidate) => String(candidate) === String(selectedChildId),
        ),
      ) || null
    )
  }, [parentChildren, selectedChildId])
  const fixedStudentId =
    roleUpper === 'STUDENT'
      ? studentId
      : roleUpper === 'PARENT'
        ? selectedChildId || null
        : null
  const scopeSchoolId = activeSchoolId
    ? String(activeSchoolId)
    : roleUpper === 'PARENT'
      ? selectedChild?.schoolId != null
        ? String(selectedChild.schoolId)
        : ''
      : authSchoolId != null
        ? String(authSchoolId)
        : ''
  const scopeSchoolName = activeSchoolId
    ? ''
    : roleUpper === 'PARENT'
      ? selectedChild?.schoolName || selectedChild?.school?.schoolName || selectedChild?.school?.name || ''
      : authSchoolName || ''
  const canManage = can(user, ['ASSIGNMENT_MANAGE', 'ASSIGNMENT_MANAGE_ASSIGNED', '*'])
  const isReadOnly = fixedStudentId != null

  const [rows, setRows] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [sectionsLookup, setSectionsLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
  const [editingId, setEditingId] = useState(null)

  const [addFile, setAddFile] = useState(null)
  const [editFile, setEditFile] = useState(null)
  const addFileRef = useRef(null)
  const editFileRef = useRef(null)

  const [isFindSidebarOpen, setIsFindSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [findErrors, setFindErrors] = useState({})
  const [hasSearched, setHasSearched] = useState(true)
  const hasSearchResults = true

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const loadLookups = useCallback(async () => {
    const [schools, classes, sections, subjects] = await Promise.all([
      fetchSchoolsLookup().catch(() => []),
      fetchClasses({ schoolId: scopeSchoolId || undefined }).catch(() => []),
      fetchSections({ schoolId: scopeSchoolId || undefined }).catch(() => []),
      fetchSubjects().catch(() => []),
    ])
    setSchoolsLookup(Array.isArray(schools) ? schools : [])
    setClassesLookup(Array.isArray(classes) ? classes : [])
    setSectionsLookup(Array.isArray(sections) ? sections : [])
    setSubjectsLookup(Array.isArray(subjects) ? subjects : [])
  }, [scopeSchoolId])

  const loadRows = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (roleUpper === 'PARENT' && !fixedStudentId) {
        setRows([])
        return
      }
      const data =
        fixedStudentId != null
          ? await fetchAssignmentsForStudent(fixedStudentId)
          : await fetchAssignments(scopeSchoolId ? { schoolId: scopeSchoolId } : undefined)
      setRows(Array.isArray(data) ? data : [])
      setHasSearched(true)
    } catch (e) {
      setRows([])
      setError(e?.message || 'Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }, [fixedStudentId, roleUpper, scopeSchoolId])

  useEffect(() => {
    void loadLookups()
    void loadRows()
  }, [loadLookups, loadRows])

  useEffect(() => {
    const nextFilters = scopeSchoolId ? { ...emptyFilters, schoolId: scopeSchoolId } : emptyFilters
    setPendingFilters(nextFilters)
    setFilters(nextFilters)
    setFindErrors({})
    setSearch('')
    setCurrentPage(1)
    setSelectedRows([])
  }, [scopeSchoolId])

  const schoolNameById = useMemo(() => {
    const map = new Map()
    for (const school of schoolsLookup) {
      const id = school?.id ?? school?.schoolId ?? null
      const name = school?.schoolName || school?.name || school?.label || ''
      if (id != null && name) map.set(String(id), name)
    }
    if (scopeSchoolId && !map.has(String(scopeSchoolId))) {
      map.set(String(scopeSchoolId), scopeSchoolName || `School ${scopeSchoolId}`)
    }
    return map
  }, [scopeSchoolId, scopeSchoolName, schoolsLookup])

  const classNameById = useMemo(() => {
    const map = new Map()
    for (const cls of classesLookup) {
      const id = cls?.id ?? cls?.classId ?? null
      const name = cls?.className || cls?.name || cls?.label || ''
      if (id != null && name) map.set(String(id), name)
    }
    return map
  }, [classesLookup])

  const sectionNameById = useMemo(() => {
    const map = new Map()
    for (const section of sectionsLookup) {
      const id = section?.id ?? section?.sectionId ?? null
      const name = section?.sectionName || section?.name || section?.label || ''
      if (id != null && name) map.set(String(id), name)
    }
    return map
  }, [sectionsLookup])

  const subjectNameById = useMemo(() => {
    const map = new Map()
    for (const subject of subjectsLookup) {
      const id = subject?.id ?? subject?.subjectId ?? null
      const name = subject?.name || subject?.subjectName || subject?.label || ''
      if (id != null && name) map.set(String(id), name)
    }
    return map
  }, [subjectsLookup])

  const displayRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      schoolName: row?.schoolName || schoolNameById.get(String(row?.schoolId)) || (row?.schoolId != null ? `School ${row.schoolId}` : ''),
      className: row?.className || classNameById.get(String(row?.classId)) || (row?.classId != null ? `Class ${row.classId}` : ''),
      sectionName: row?.sectionName || sectionNameById.get(String(row?.sectionId)) || (row?.sectionId != null ? `Section ${row.sectionId}` : ''),
      subjectName: row?.subjectName || subjectNameById.get(String(row?.subjectId)) || (row?.subjectId != null ? `Subject ${row.subjectId}` : ''),
    }))
  }, [classNameById, rows, schoolNameById, sectionNameById, subjectNameById])

  const effectiveSchoolFilterId = pendingFilters.schoolId !== 'Select' ? pendingFilters.schoolId : scopeSchoolId

  const classOptions = useMemo(() => {
    return classesLookup
      .filter((c) => !effectiveSchoolFilterId || String(c.schoolId) === String(effectiveSchoolFilterId))
      .slice()
      .sort((a, b) => String(a.className || '').localeCompare(String(b.className || '')))
  }, [classesLookup, effectiveSchoolFilterId])

  const sectionOptions = useMemo(() => {
    return sectionsLookup
      .filter((s) => {
        if (effectiveSchoolFilterId && String(s.schoolId) !== String(effectiveSchoolFilterId)) return false
        if (pendingFilters.classId !== 'Select' && String(s.classId) !== String(pendingFilters.classId)) return false
        return true
      })
      .slice()
      .sort((a, b) => String(a.sectionName || '').localeCompare(String(b.sectionName || '')))
  }, [effectiveSchoolFilterId, pendingFilters.classId, sectionsLookup])

  const subjectOptions = useMemo(() => {
    return subjectsLookup
      .filter((s) => {
        if (effectiveSchoolFilterId && String(s.schoolId) !== String(effectiveSchoolFilterId)) return false
        if (pendingFilters.classId !== 'Select' && String(s.classId) !== String(pendingFilters.classId)) return false
        return true
      })
      .slice()
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
  }, [effectiveSchoolFilterId, pendingFilters.classId, subjectsLookup])

  const validateFind = () => ({})

  const handlePendingFilterChange = async (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => {
      if (id === 'schoolId') return { ...prev, schoolId: value, classId: 'Select', sectionId: 'Select', subjectId: 'Select' }
      if (id === 'classId') return { ...prev, classId: value, sectionId: 'Select', subjectId: 'Select' }
      return { ...prev, [id]: value }
    })
    setFindErrors((prev) => ({ ...prev, [id]: '' }))

    if (id === 'schoolId' || id === 'classId') {
      try {
        const nextSchoolId = id === 'schoolId' ? value : pendingFilters.schoolId
        const nextClassId = id === 'classId' ? value : pendingFilters.classId
        if (nextSchoolId !== 'Select' && nextClassId !== 'Select') {
          const secs = await fetchSections({ schoolId: nextSchoolId, classId: nextClassId })
          setSectionsLookup(Array.isArray(secs) ? secs : [])
        } else if (nextSchoolId !== 'Select') {
          const secs = await fetchSections({ schoolId: nextSchoolId })
          setSectionsLookup(Array.isArray(secs) ? secs : [])
        } else {
          setSectionsLookup([])
        }
      } catch {
        setSectionsLookup([])
      }
    }
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFindErrors({})
    setFilters(pendingFilters)
    setHasSearched(true)
    setIsFindSidebarOpen(false)
    setCurrentPage(1)
    setSelectedRows([])
  }

  const handleResetFilters = () => {
    const nextFilters = scopeSchoolId ? { ...emptyFilters, schoolId: scopeSchoolId } : emptyFilters
    setPendingFilters(nextFilters)
    setFilters(nextFilters)
    setFindErrors({})
    setHasSearched(false)
    setSearch('')
    setCurrentPage(1)
    setSelectedRows([])
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return displayRows
      .filter((r) => {
        if (filters.schoolId !== 'Select' && String(r.schoolId) !== String(filters.schoolId)) return false
        if (filters.classId !== 'Select' && String(r.classId) !== String(filters.classId)) return false
        if (filters.sectionId !== 'Select' && String(r.sectionId) !== String(filters.sectionId)) return false
        if (filters.subjectId !== 'Select' && String(r.subjectId) !== String(filters.subjectId)) return false
        if (filters.status !== 'Select' && String(r.status || '') !== String(filters.status)) return false
        if (!q) return true
        return [r.title, r.schoolName, r.className, r.sectionName, r.subjectName, r.assignmentDate, r.submissionDate, r.status]
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
  }, [displayRows, filters, search])

  const statusOptions = useMemo(() => {
    const set = new Set()
    for (const r of rows) if (r?.status) set.add(String(r.status))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((r) => selectedRows.includes(r.id))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((r) => r.id)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !paginated.some((r) => r.id === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const handleChange = (setter) => (e) => {
    const { id, value, type, checked } = e.target
    setter((prev) => ({ ...prev, [id]: type === 'checkbox' ? checked : value }))
  }

  const openAdd = () => {
    if (isReadOnly) return
    setAddForm(scopeSchoolId ? { ...emptyForm, schoolId: scopeSchoolId } : emptyForm)
    setAddFile(null)
    if (addFileRef.current) addFileRef.current.value = ''
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    if (isReadOnly) return
    setEditingId(row.id)
    setEditForm({
      schoolId: row.schoolId ? String(row.schoolId) : (scopeSchoolId || 'Select'),
      classId: row.classId ? String(row.classId) : 'Select',
      sectionId: row.sectionId ? String(row.sectionId) : 'Select',
      subjectId: row.subjectId ? String(row.subjectId) : 'Select',
      title: row.title || '',
      assignmentDate: row.assignmentDate || '',
      submissionDate: row.submissionDate || '',
      smsNotification: !!row.smsNotification,
      emailNotification: !!row.emailNotification,
      note: row.note || '',
    })
    setEditFile(null)
    if (editFileRef.current) editFileRef.current.value = ''
    setEditStep(0)
    setIsEditOpen(true)
    if (row?.schoolId && row?.classId) {
      void fetchSections({ schoolId: String(row.schoolId), classId: String(row.classId) })
        .then((secs) => setSectionsLookup(Array.isArray(secs) ? secs : []))
        .catch(() => setSectionsLookup([]))
    }
  }

  const validateForm = (form) => {
    const errs = {}
    if (form.schoolId === 'Select') errs.schoolId = 'School is required.'
    if (form.classId === 'Select') errs.classId = 'Class is required.'
    if (form.sectionId === 'Select') errs.sectionId = 'Section is required.'
    if (form.subjectId === 'Select') errs.subjectId = 'Subject is required.'
    if (!String(form.title || '').trim()) errs.title = 'Title is required.'
    if (!String(form.assignmentDate || '').trim()) errs.assignmentDate = 'Assignment date is required.'
    if (!String(form.submissionDate || '').trim()) errs.submissionDate = 'Submission date is required.'
    return errs
  }

  const saveAdd = async () => {
    const errs = validateForm(addForm)
    if (Object.keys(errs).length > 0) {
      setError(Object.values(errs)[0])
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...addForm,
        schoolId: Number(addForm.schoolId),
        classId: Number(addForm.classId),
        sectionId: Number(addForm.sectionId),
        subjectId: Number(addForm.subjectId),
      }
      await createAssignment(payload, addFile)
      setIsAddOpen(false)
      await loadRows()
    } catch (e) {
      setError(e?.message || 'Failed to create assignment')
    } finally {
      setSaving(false)
    }
  }

  const saveEdit = async () => {
    if (!editingId) return
    const errs = validateForm(editForm)
    if (Object.keys(errs).length > 0) {
      setError(Object.values(errs)[0])
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...editForm,
        schoolId: Number(editForm.schoolId),
        classId: Number(editForm.classId),
        sectionId: Number(editForm.sectionId),
        subjectId: Number(editForm.subjectId),
      }
      await updateAssignment(editingId, payload, editFile)
      setIsEditOpen(false)
      await loadRows()
    } catch (e) {
      setError(e?.message || 'Failed to update assignment')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!canManage || isReadOnly) return
    const yes = window.confirm(`Delete assignment "${row.title}"?`)
    if (!yes) return
    setSaving(true)
    setError('')
    try {
      await deleteAssignment(row.id)
      await loadRows()
      setSelectedRows((prev) => prev.filter((id) => id !== row.id))
    } catch (e) {
      setError(e?.message || 'Failed to delete assignment')
    } finally {
      setSaving(false)
    }
  }

  const renderForm = (form, setter, file, setFile, fileRef) => {
    const effectiveSchoolOptions = scopeSchoolId
      ? [{ id: scopeSchoolId, schoolName: schoolNameById.get(String(scopeSchoolId)) || scopeSchoolName || `School ${scopeSchoolId}` }]
      : schoolsLookup
    return (
      <div className="avm-grid">
        <FormField label="School Name" required>
          <select
            className="form-select avm-input ps-44"
            id="schoolId"
            value={form.schoolId}
            onChange={(e) => {
              const value = e.target.value
              setter((prev) => ({ ...prev, schoolId: value, classId: 'Select', sectionId: 'Select', subjectId: 'Select' }))
            }}
            disabled={Boolean(scopeSchoolId)}
          >
            <option value="Select">Select</option>
            {effectiveSchoolOptions.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.schoolName || s.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Class" required>
          <select
            className="form-select avm-input ps-44"
            id="classId"
            value={form.classId}
            onChange={async (e) => {
              const value = e.target.value
              setter((prev) => ({ ...prev, classId: value, sectionId: 'Select', subjectId: 'Select' }))
              try {
                if (form.schoolId !== 'Select' && value !== 'Select') {
                  const secs = await fetchSections({ schoolId: form.schoolId, classId: value })
                  setSectionsLookup(Array.isArray(secs) ? secs : [])
                }
              } catch {
                setSectionsLookup([])
              }
            }}
            disabled={form.schoolId === 'Select'}
          >
            <option value="Select">Select</option>
            {classesLookup
              .filter((c) => String(c.schoolId) === String(form.schoolId))
              .map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.className}
                </option>
              ))}
          </select>
        </FormField>

        <FormField label="Section" required>
          <select
            className="form-select avm-input ps-44"
            id="sectionId"
            value={form.sectionId}
            onChange={handleChange(setter)}
            disabled={form.classId === 'Select'}
          >
            <option value="Select">Select</option>
            {sectionsLookup
              .filter((s) => String(s.schoolId) === String(form.schoolId) && String(s.classId) === String(form.classId))
              .map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.sectionName}
                </option>
              ))}
          </select>
        </FormField>

        <FormField label="Subject" required>
          <select
            className="form-select avm-input ps-44"
            id="subjectId"
            value={form.subjectId}
            onChange={handleChange(setter)}
            disabled={form.classId === 'Select'}
          >
            <option value="Select">Select</option>
            {subjectsLookup
              .filter((s) => String(s.schoolId) === String(form.schoolId) && String(s.classId) === String(form.classId))
              .map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
          </select>
        </FormField>

        <FormField label="Title" required full>
          <input className="form-control avm-input ps-44" id="title" value={form.title} onChange={handleChange(setter)} placeholder="Assignment title" />
        </FormField>

        <FormField label="Assignment Date" required>
          <input className="form-control avm-input ps-44" id="assignmentDate" type="date" value={form.assignmentDate} onChange={handleChange(setter)} />
        </FormField>

        <FormField label="Submission Date" required>
          <input className="form-control avm-input ps-44" id="submissionDate" type="date" value={form.submissionDate} onChange={handleChange(setter)} />
        </FormField>

        <FormField label="Assignment" full noIcon>
          <div className="d-flex align-items-center gap-2">
            <input ref={fileRef} type="file" accept={ACCEPTED_DOC_TYPES} className="form-control" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file ? <span className="text-muted small">{file.name}</span> : <span className="text-muted small">{ACCEPTED_DOC_LABEL}</span>}
          </div>
        </FormField>

        <FormField label="Note" full>
          <textarea className="form-control avm-input ps-44" id="note" value={form.note} onChange={handleChange(setter)} rows={3} placeholder="Optional note" />
        </FormField>

        <div className="avm-field full">
          <label className="avm-label">Notifications</label>
          <div className="d-flex gap-3 flex-wrap">
            <NotificationToggle
              id="smsNotification"
              label="SMS"
              icon="ri-message-2-line"
              checked={!!form.smsNotification}
              onChange={() => setter((prev) => ({ ...prev, smsNotification: !prev.smsNotification }))}
            />
            <NotificationToggle
              id="emailNotification"
              label="Email"
              icon="ri-mail-line"
              checked={!!form.emailNotification}
              onChange={() => setter((prev) => ({ ...prev, emailNotification: !prev.emailNotification }))}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-main-body">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h5 className="mb-0">Assignment</h5>
          <div className="text-muted small">Create and manage assignments within your scope.</div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => setIsFindSidebarOpen(true)}>
            Find
          </button>
          {canManage && !isReadOnly ? (
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              Add Assignment
            </button>
          ) : null}
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="card">
        <div className="card-body">
          {roleUpper === 'PARENT' && !selectedChildId ? (
            <div className="alert alert-info mb-3">
              Select a child from the top bar to view assignments.
            </div>
          ) : null}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div className="d-flex align-items-center gap-2">
              <input className="form-control" style={{ minWidth: 260 }} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} disabled={!hasSearchResults} />
              <button type="button" className="btn btn-outline-secondary" onClick={handleResetFilters} disabled={!hasSearchResults}>
                Reset
              </button>
            </div>
            <div className="d-flex align-items-center gap-2">
              <div className="dropdown">
                <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                  Columns ({visibleColumnCount})
                </button>
                <ul className="dropdown-menu p-2" style={{ minWidth: 220 }}>
                  {columnOptions.map((col) => (
                    <li key={col.key} className="px-1 py-1">
                      <label className="d-flex align-items-center gap-2">
                        <input type="checkbox" checked={!!visibleColumns[col.key]} onChange={() => toggleColumn(col.key)} />
                        <span>{col.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
              <select className="form-select" style={{ width: 110 }} value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))} disabled={!hasSearchResults}>
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}/page
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th style={{ width: 34 }}>
                    <input type="checkbox" checked={allSelected} onChange={handleSelectAll} disabled={!hasSearchResults || loading} />
                  </th>
                  {visibleColumns.schoolName ? <th>School</th> : null}
                  {visibleColumns.title ? <th>Title</th> : null}
                  {visibleColumns.className ? <th>Class</th> : null}
                  {visibleColumns.sectionName ? <th>Section</th> : null}
                  {visibleColumns.subjectName ? <th>Subject</th> : null}
                  {visibleColumns.assignmentDate ? <th>Assignment Date</th> : null}
                  {visibleColumns.submissionDate ? <th>Submission Date</th> : null}
                  {visibleColumns.status ? <th>Status</th> : null}
                  {visibleColumns.assignmentFile ? <th>File</th> : null}
                  <th style={{ width: 140 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center text-muted">
                      Loading...
                    </td>
                  </tr>
                ) : !hasSearchResults ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center text-muted">
                      Use Find to select School/Class/Section/Subject.
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center text-muted">
                      No assignments found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <input type="checkbox" checked={selectedRows.includes(row.id)} onChange={() => handleSelectRow(row.id)} />
                      </td>
                      {visibleColumns.schoolName ? <td>{row.schoolName}</td> : null}
                      {visibleColumns.title ? <td className="fw-medium">{row.title}</td> : null}
                      {visibleColumns.className ? <td>{row.className}</td> : null}
                      {visibleColumns.sectionName ? <td>{row.sectionName}</td> : null}
                      {visibleColumns.subjectName ? <td>{row.subjectName}</td> : null}
                      {visibleColumns.assignmentDate ? <td>{row.assignmentDate}</td> : null}
                      {visibleColumns.submissionDate ? <td>{row.submissionDate}</td> : null}
                      {visibleColumns.status ? (
                        <td>
                          <span className={statusBadge(row.status)}>{row.status || 'Pending'}</span>
                        </td>
                      ) : null}
                      {visibleColumns.assignmentFile ? (
                        <td>
                          {row.assignmentFile ? (
                            <span className="d-flex align-items-center gap-2">
                              <i className={getFileIcon(row.assignmentFile)}></i>
                              <span className="text-truncate" style={{ maxWidth: 180 }}>
                                {row.assignmentFile}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      ) : null}
                      <td>
                        <div className="d-flex gap-2">
                          {canManage ? (
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEdit(row)}>
                              Edit
                            </button>
                          ) : null}
                          {canManage ? (
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(row)} disabled={saving}>
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between mt-3">
            <div className="text-muted small">
              Page {hasSearchResults ? currentPage : 1} of {hasSearchResults ? totalPages : 1}
            </div>
            <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={!hasSearchResults || currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                Prev
              </button>
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={!hasSearchResults || currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <WizardPopup
        title="Add Assignment"
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        steps={STEPS}
        currentStep={addStep}
        setCurrentStep={setAddStep}
        onSave={saveAdd}
        saving={saving}
      >
        {addStep === 0 ? renderForm(addForm, setAddForm, addFile, setAddFile, addFileRef) : renderForm(addForm, setAddForm, addFile, setAddFile, addFileRef)}
      </WizardPopup>

      <WizardPopup
        title="Edit Assignment"
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        steps={STEPS}
        currentStep={editStep}
        setCurrentStep={setEditStep}
        onSave={saveEdit}
        saving={saving}
      >
        {editStep === 0 ? renderForm(editForm, setEditForm, editFile, setEditFile, editFileRef) : renderForm(editForm, setEditForm, editFile, setEditFile, editFileRef)}
      </WizardPopup>

      <SlideSidebar
        show={isFindSidebarOpen}
        onClose={() => setIsFindSidebarOpen(false)}
        title="Find Assignments"
        width="400px"
      >
        <form onSubmit={handleApplyFilters} className="p-3">
          <div className="mb-3">
            <label className="form-label">School</label>
            <select className="form-select" id="schoolId" value={scopeSchoolId || pendingFilters.schoolId} onChange={handlePendingFilterChange} disabled={Boolean(scopeSchoolId)}>
              <option value="Select">Select</option>
              {schoolsLookup.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.schoolName || s.name}
                </option>
              ))}
            </select>
            {findErrors.schoolId ? <div className="text-danger small mt-1">{findErrors.schoolId}</div> : null}
          </div>

          <div className="mb-3">
            <label className="form-label">Class</label>
            <select className="form-select" id="classId" value={pendingFilters.classId} onChange={handlePendingFilterChange} disabled={pendingFilters.schoolId === 'Select'}>
              <option value="Select">Select</option>
              {classOptions.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.className}
                </option>
              ))}
            </select>
            {findErrors.classId ? <div className="text-danger small mt-1">{findErrors.classId}</div> : null}
          </div>

          <div className="mb-3">
            <label className="form-label">Section</label>
            <select className="form-select" id="sectionId" value={pendingFilters.sectionId} onChange={handlePendingFilterChange} disabled={pendingFilters.classId === 'Select'}>
              <option value="Select">Select</option>
              {sectionOptions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.sectionName}
                </option>
              ))}
            </select>
            {findErrors.sectionId ? <div className="text-danger small mt-1">{findErrors.sectionId}</div> : null}
          </div>

          <div className="mb-3">
            <label className="form-label">Subject</label>
            <select className="form-select" id="subjectId" value={pendingFilters.subjectId} onChange={handlePendingFilterChange} disabled={pendingFilters.classId === 'Select'}>
              <option value="Select">Select</option>
              {subjectOptions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
            {findErrors.subjectId ? <div className="text-danger small mt-1">{findErrors.subjectId}</div> : null}
          </div>

          <div className="mb-3">
            <label className="form-label">Status</label>
            <select className="form-select" id="status" value={pendingFilters.status} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary flex-grow-1">
              Apply
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={handleResetFilters}>
              Clear
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default Assignment
