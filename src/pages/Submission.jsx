import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { createSubmission, deleteSubmission, evaluateSubmission, fetchSubmissions } from '../apis/submissionsApi'
import { fetchAssignments } from '../apis/assignmentsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchStudentsByClassSection } from '../apis/studentsApi'
import { can } from '../utils/permissions'
import { useAuth } from '../context/AuthContext'
import '../assets/css/addModalShared.css'

const ACCEPTED_DOC_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png'
const ACCEPTED_DOC_LABEL = 'pdf/doc/ppt/txt or image'

const emptyForm = {
  schoolId: 'Select',
  classId: 'Select',
  sectionId: 'Select',
  studentId: 'Select',
  assignmentId: 'Select',
  note: '',
}

const emptyFilters = {
  schoolId: 'Select',
  classId: 'Select',
  sectionId: 'Select',
  assignmentId: 'Select',
  studentId: 'Select',
  evaluate: 'Select',
}

const STEPS = ['Basic']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Class: 'ri-building-line',
  Section: 'ri-layout-grid-line',
  Student: 'ri-user-3-line',
  Assignment: 'ri-book-open-line',
  Submission: 'ri-upload-2-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'assignmentTitle', label: 'Assignment' },
  { key: 'className', label: 'Class' },
  { key: 'sectionName', label: 'Section' },
  { key: 'studentName', label: 'Student' },
  { key: 'submittedAt', label: 'Submitted At' },
  { key: 'evaluate', label: 'Evaluate' },
  { key: 'marks', label: 'Marks' },
]

const evaluateBadge = (value) => {
  const v = String(value || '').toLowerCase()
  if (v === 'reviewed') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (v === 'pending') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
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

const Submission = () => {
  const { user, role, studentId, selectedChildId } = useAuth()

  const canSubmit = can(user, ['ASSIGNMENT_SUBMIT', '*'])
  const canView = can(user, ['SUBMISSION_MANAGE', 'SUBMISSION_VIEW_ASSIGNED', 'SUBMISSION_VIEW_OWN', 'SUBMISSION_VIEW_CHILD', '*'])
  const canEvaluate = can(user, ['SUBMISSION_MANAGE', 'SUBMISSION_EVALUATE_ASSIGNED', '*'])
  const canManage = can(user, ['SUBMISSION_MANAGE', 'SUBMISSION_VIEW_ASSIGNED', '*'])

  const roleUpper = String(role || '').toUpperCase()
  const fixedStudentId =
    roleUpper === 'STUDENT'
      ? studentId
      : roleUpper === 'PARENT'
        ? selectedChildId
        : null

  const [rows, setRows] = useState([])
  const [assignments, setAssignments] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [sectionsLookup, setSectionsLookup] = useState([])
  const [studentsLookup, setStudentsLookup] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [addForm, setAddForm] = useState(emptyForm)
  const [addFile, setAddFile] = useState(null)
  const addFileRef = useRef(null)

  const [isEvalOpen, setIsEvalOpen] = useState(false)
  const [evalId, setEvalId] = useState(null)
  const [evalForm, setEvalForm] = useState({ marks: '', feedback: '' })

  const [isFindSidebarOpen, setIsFindSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [findErrors, setFindErrors] = useState({})
  const [hasSearched, setHasSearched] = useState(false)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const loadLookups = useCallback(async () => {
    const [schools, classes] = await Promise.all([fetchSchoolsLookup(), fetchClasses()])
    setSchoolsLookup(Array.isArray(schools) ? schools : [])
    setClassesLookup(Array.isArray(classes) ? classes : [])
  }, [])

  const loadRows = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [subs, asgs] = await Promise.all([fetchSubmissions(), fetchAssignments()])
      setRows(Array.isArray(subs) ? subs : [])
      setAssignments(Array.isArray(asgs) ? asgs : [])
    } catch (e) {
      setRows([])
      setAssignments([])
      setError(e?.message || 'Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLookups()
    void loadRows()
  }, [loadLookups, loadRows])

  const schoolNameById = useMemo(() => new Map(schoolsLookup.map((s) => [String(s.id), s.name])), [schoolsLookup])
  const classNameById = useMemo(() => new Map(classesLookup.map((c) => [String(c.id), c.className])), [classesLookup])
  const sectionNameById = useMemo(() => new Map(sectionsLookup.map((s) => [String(s.id), s.sectionName])), [sectionsLookup])
  const studentNameById = useMemo(() => {
    const map = new Map()
    for (const s of studentsLookup) map.set(String(s.id || s.studentId), s.name || s.fullName || s.studentName || s.email || String(s.id || s.studentId))
    return map
  }, [studentsLookup])
  const assignmentTitleById = useMemo(() => {
    const map = new Map()
    for (const a of assignments) map.set(String(a.id), a.title || String(a.id))
    return map
  }, [assignments])

  const classOptions = useMemo(() => {
    return classesLookup
      .filter((c) => pendingFilters.schoolId === 'Select' || String(c.schoolId) === String(pendingFilters.schoolId))
      .slice()
      .sort((a, b) => String(a.className || '').localeCompare(String(b.className || '')))
  }, [classesLookup, pendingFilters.schoolId])

  const sectionOptions = useMemo(() => {
    return sectionsLookup
      .filter((s) => {
        if (pendingFilters.schoolId !== 'Select' && String(s.schoolId) !== String(pendingFilters.schoolId)) return false
        if (pendingFilters.classId !== 'Select' && String(s.classId) !== String(pendingFilters.classId)) return false
        return true
      })
      .slice()
      .sort((a, b) => String(a.sectionName || '').localeCompare(String(b.sectionName || '')))
  }, [sectionsLookup, pendingFilters.schoolId, pendingFilters.classId])

  const assignmentOptions = useMemo(() => {
    return assignments
      .filter((a) => {
        if (pendingFilters.schoolId !== 'Select' && String(a.schoolId) !== String(pendingFilters.schoolId)) return false
        if (pendingFilters.classId !== 'Select' && String(a.classId) !== String(pendingFilters.classId)) return false
        if (pendingFilters.sectionId !== 'Select' && String(a.sectionId) !== String(pendingFilters.sectionId)) return false
        return true
      })
      .slice()
      .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
  }, [assignments, pendingFilters.schoolId, pendingFilters.classId, pendingFilters.sectionId])

  const validateFind = () => {
    const errs = {}
    if (pendingFilters.schoolId === 'Select') errs.schoolId = 'School is required.'
    if (pendingFilters.classId === 'Select') errs.classId = 'Class is required.'
    if (pendingFilters.sectionId === 'Select') errs.sectionId = 'Section is required.'
    if (pendingFilters.assignmentId === 'Select') errs.assignmentId = 'Assignment is required.'
    if (!fixedStudentId && pendingFilters.studentId === 'Select') errs.studentId = 'Student is required.'
    return errs
  }

  const handlePendingFilterChange = async (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => {
      if (id === 'schoolId') return { ...prev, schoolId: value, classId: 'Select', sectionId: 'Select', assignmentId: 'Select', studentId: 'Select' }
      if (id === 'classId') return { ...prev, classId: value, sectionId: 'Select', assignmentId: 'Select', studentId: 'Select' }
      if (id === 'sectionId') return { ...prev, sectionId: value, assignmentId: 'Select', studentId: 'Select' }
      return { ...prev, [id]: value }
    })
    setFindErrors((prev) => ({ ...prev, [id]: '' }))

    try {
      const nextSchoolId = id === 'schoolId' ? value : pendingFilters.schoolId
      const nextClassId = id === 'classId' ? value : pendingFilters.classId
      const nextSectionId = id === 'sectionId' ? value : pendingFilters.sectionId

      if (id === 'schoolId' || id === 'classId') {
        if (nextSchoolId !== 'Select' && nextClassId !== 'Select') {
          const secs = await fetchSections({ schoolId: nextSchoolId, classId: nextClassId })
          setSectionsLookup(Array.isArray(secs) ? secs : [])
        } else {
          setSectionsLookup([])
        }
      }

      if (nextSchoolId !== 'Select' && nextClassId !== 'Select' && nextSectionId !== 'Select') {
        const students = await fetchStudentsByClassSection({ schoolId: nextSchoolId, classId: nextClassId, sectionId: nextSectionId })
        setStudentsLookup(Array.isArray(students) ? students : [])
      } else {
        setStudentsLookup([])
      }
    } catch {
      setStudentsLookup([])
    }
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    const errs = validateFind()
    if (Object.keys(errs).length > 0) {
      setFindErrors(errs)
      return
    }
    setFindErrors({})
    setFilters(pendingFilters)
    setHasSearched(true)
    setIsFindSidebarOpen(false)
    setCurrentPage(1)
    setSelectedRows([])
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setFindErrors({})
    setHasSearched(false)
    setSearch('')
    setCurrentPage(1)
    setSelectedRows([])
  }

  const filtered = useMemo(() => {
    if (!hasSearched) return []
    const q = search.trim().toLowerCase()
    return rows
      .map((r) => ({
        ...r,
        schoolName: r.schoolName || schoolNameById.get(String(r.schoolId)) || '',
        className: r.className || classNameById.get(String(r.classId)) || '',
        sectionName: r.sectionName || sectionNameById.get(String(r.sectionId)) || '',
        studentName: r.studentName || studentNameById.get(String(r.studentId)) || String(r.studentId || ''),
        assignmentTitle: r.assignmentTitle || assignmentTitleById.get(String(r.assignmentId)) || String(r.assignmentId || ''),
      }))
      .filter((r) => {
        if (filters.schoolId !== 'Select' && String(r.schoolId) !== String(filters.schoolId)) return false
        if (filters.classId !== 'Select' && String(r.classId) !== String(filters.classId)) return false
        if (filters.sectionId !== 'Select' && String(r.sectionId) !== String(filters.sectionId)) return false
        if (filters.assignmentId !== 'Select' && String(r.assignmentId) !== String(filters.assignmentId)) return false
        const studentFilterId = fixedStudentId ? String(fixedStudentId) : filters.studentId
        if (studentFilterId && studentFilterId !== 'Select' && String(r.studentId) !== String(studentFilterId)) return false
        if (filters.evaluate !== 'Select' && String(r.evaluate || '') !== String(filters.evaluate)) return false
        if (!q) return true
        return [r.schoolName, r.assignmentTitle, r.className, r.sectionName, r.studentName, r.submittedAt, r.evaluate, r.marks]
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
  }, [hasSearched, rows, filters, search, schoolNameById, classNameById, sectionNameById, studentNameById, assignmentTitleById, fixedStudentId])

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

  const openAdd = () => {
    const initial = { ...emptyForm }
    if (fixedStudentId) initial.studentId = String(fixedStudentId)
    setAddForm(initial)
    setAddFile(null)
    if (addFileRef.current) addFileRef.current.value = ''
    setAddStep(0)
    setIsAddOpen(true)
  }

  const validateAdd = () => {
    const errs = {}
    if (addForm.schoolId === 'Select') errs.schoolId = 'School is required.'
    if (addForm.classId === 'Select') errs.classId = 'Class is required.'
    if (addForm.sectionId === 'Select') errs.sectionId = 'Section is required.'
    if (!fixedStudentId && addForm.studentId === 'Select') errs.studentId = 'Student is required.'
    if (addForm.assignmentId === 'Select') errs.assignmentId = 'Assignment is required.'
    if (!addFile) errs.file = 'Submission file is required.'
    return errs
  }

  const saveAdd = async () => {
    const errs = validateAdd()
    if (Object.keys(errs).length > 0) {
      setError(Object.values(errs)[0])
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        schoolId: Number(addForm.schoolId),
        classId: Number(addForm.classId),
        sectionId: Number(addForm.sectionId),
        studentId: fixedStudentId ? Number(fixedStudentId) : Number(addForm.studentId),
        assignmentId: Number(addForm.assignmentId),
        note: addForm.note || null,
      }
      await createSubmission(payload, addFile)
      setIsAddOpen(false)
      await loadRows()
    } catch (e) {
      setError(e?.message || 'Failed to submit assignment')
    } finally {
      setSaving(false)
    }
  }

  const openEvaluate = (row) => {
    setEvalId(row.id)
    setEvalForm({ marks: row.marks != null ? String(row.marks) : '', feedback: row.feedback || '' })
    setIsEvalOpen(true)
  }

  const saveEvaluate = async () => {
    if (!evalId) return
    const marks = evalForm.marks === '' ? null : Number(evalForm.marks)
    if (marks != null && Number.isNaN(marks)) {
      setError('Marks must be a number.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await evaluateSubmission(evalId, { marks, feedback: evalForm.feedback || null })
      setIsEvalOpen(false)
      await loadRows()
    } catch (e) {
      setError(e?.message || 'Failed to evaluate submission')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!canManage) return
    const yes = window.confirm('Delete submission?')
    if (!yes) return
    setSaving(true)
    setError('')
    try {
      await deleteSubmission(row.id)
      await loadRows()
      setSelectedRows((prev) => prev.filter((id) => id !== row.id))
    } catch (e) {
      setError(e?.message || 'Failed to delete submission')
    } finally {
      setSaving(false)
    }
  }

  const renderAddForm = () => (
    <div className="avm-grid">
      <FormField label="School Name" required>
        <select
          className="form-select avm-input ps-44"
          id="schoolId"
          value={addForm.schoolId}
          onChange={(e) => setAddForm((prev) => ({ ...prev, schoolId: e.target.value, classId: 'Select', sectionId: 'Select', assignmentId: 'Select', studentId: fixedStudentId ? String(fixedStudentId) : 'Select' }))}
        >
          <option value="Select">Select</option>
          {schoolsLookup.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Class" required>
        <select
          className="form-select avm-input ps-44"
          id="classId"
          value={addForm.classId}
          onChange={async (e) => {
            const value = e.target.value
            setAddForm((prev) => ({ ...prev, classId: value, sectionId: 'Select', assignmentId: 'Select', studentId: fixedStudentId ? String(fixedStudentId) : 'Select' }))
            try {
              if (addForm.schoolId !== 'Select' && value !== 'Select') {
                const secs = await fetchSections({ schoolId: addForm.schoolId, classId: value })
                setSectionsLookup(Array.isArray(secs) ? secs : [])
              } else {
                setSectionsLookup([])
              }
            } catch {
              setSectionsLookup([])
            }
          }}
          disabled={addForm.schoolId === 'Select'}
        >
          <option value="Select">Select</option>
          {classesLookup.filter((c) => String(c.schoolId) === String(addForm.schoolId)).map((c) => (
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
          value={addForm.sectionId}
          onChange={async (e) => {
            const value = e.target.value
            setAddForm((prev) => ({ ...prev, sectionId: value, assignmentId: 'Select', studentId: fixedStudentId ? String(fixedStudentId) : 'Select' }))
            try {
              if (addForm.schoolId !== 'Select' && addForm.classId !== 'Select' && value !== 'Select') {
                const students = await fetchStudentsByClassSection({ schoolId: addForm.schoolId, classId: addForm.classId, sectionId: value })
                setStudentsLookup(Array.isArray(students) ? students : [])
              } else {
                setStudentsLookup([])
              }
            } catch {
              setStudentsLookup([])
            }
          }}
          disabled={addForm.classId === 'Select'}
        >
          <option value="Select">Select</option>
          {sectionsLookup.filter((s) => String(s.schoolId) === String(addForm.schoolId) && String(s.classId) === String(addForm.classId)).map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.sectionName}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Student" required>
        {fixedStudentId ? (
          <input className="form-control avm-input ps-44" value={`Student #${fixedStudentId}`} disabled />
        ) : (
          <select className="form-select avm-input ps-44" id="studentId" value={addForm.studentId} onChange={(e) => setAddForm((prev) => ({ ...prev, studentId: e.target.value }))} disabled={addForm.sectionId === 'Select'}>
            <option value="Select">Select</option>
            {studentsLookup.map((s) => (
              <option key={s.id || s.studentId} value={String(s.id || s.studentId)}>
                {s.name || s.fullName || s.studentName || s.email || `Student #${s.id || s.studentId}`}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <FormField label="Assignment" required>
        <select className="form-select avm-input ps-44" id="assignmentId" value={addForm.assignmentId} onChange={(e) => setAddForm((prev) => ({ ...prev, assignmentId: e.target.value }))} disabled={addForm.sectionId === 'Select'}>
          <option value="Select">Select</option>
          {assignments
            .filter((a) => String(a.schoolId) === String(addForm.schoolId) && String(a.classId) === String(addForm.classId) && String(a.sectionId) === String(addForm.sectionId))
            .map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.title}
              </option>
            ))}
        </select>
      </FormField>

      <FormField label="Submission" required full noIcon>
        <div className="d-flex align-items-center gap-2">
          <input ref={addFileRef} type="file" accept={ACCEPTED_DOC_TYPES} className="form-control" onChange={(e) => setAddFile(e.target.files?.[0] || null)} />
          {addFile ? <span className="text-muted small">{addFile.name}</span> : <span className="text-muted small">{ACCEPTED_DOC_LABEL}</span>}
        </div>
      </FormField>

      <FormField label="Note" full>
        <textarea className="form-control avm-input ps-44" id="note" value={addForm.note} onChange={(e) => setAddForm((prev) => ({ ...prev, note: e.target.value }))} rows={3} placeholder="Optional note" />
      </FormField>
    </div>
  )

  if (!canView) return <div className="dashboard-main-body text-muted">No access.</div>

  return (
    <div className="dashboard-main-body">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h5 className="mb-0">Submission</h5>
          <div className="text-muted small">Submit assignments and review/evaluate submissions within your scope.</div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => setIsFindSidebarOpen(true)}>
            Find
          </button>
          {canSubmit ? (
            <button type="button" className="btn btn-primary" onClick={openAdd} disabled={!hasSearched || (roleUpper === 'PARENT' && !fixedStudentId)}>
              Submit
            </button>
          ) : null}
        </div>
      </div>

      {roleUpper === 'PARENT' && !fixedStudentId ? (
        <div className="alert alert-info">Select a child first to submit/view child submissions.</div>
      ) : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="card">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div className="d-flex align-items-center gap-2">
              <input className="form-control" style={{ minWidth: 260 }} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} disabled={!hasSearched} />
              <button type="button" className="btn btn-outline-secondary" onClick={handleResetFilters} disabled={!hasSearched}>
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
              <select className="form-select" style={{ width: 110 }} value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))} disabled={!hasSearched}>
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}/page
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!hasSearched ? (
            <div className="text-muted">Use Find to select School/Class/Section/Assignment (and Student when applicable).</div>
          ) : loading ? (
            <div className="text-muted">Loading...</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th style={{ width: 34 }}>
                      <input type="checkbox" checked={allSelected} onChange={handleSelectAll} />
                    </th>
                    {visibleColumns.schoolName ? <th>School</th> : null}
                    {visibleColumns.assignmentTitle ? <th>Assignment</th> : null}
                    {visibleColumns.className ? <th>Class</th> : null}
                    {visibleColumns.sectionName ? <th>Section</th> : null}
                    {visibleColumns.studentName ? <th>Student</th> : null}
                    {visibleColumns.submittedAt ? <th>Submitted At</th> : null}
                    {visibleColumns.evaluate ? <th>Evaluate</th> : null}
                    {visibleColumns.marks ? <th>Marks</th> : null}
                    <th style={{ width: 170 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <input type="checkbox" checked={selectedRows.includes(row.id)} onChange={() => handleSelectRow(row.id)} />
                      </td>
                      {visibleColumns.schoolName ? <td>{row.schoolName}</td> : null}
                      {visibleColumns.assignmentTitle ? <td className="fw-medium">{row.assignmentTitle}</td> : null}
                      {visibleColumns.className ? <td>{row.className}</td> : null}
                      {visibleColumns.sectionName ? <td>{row.sectionName}</td> : null}
                      {visibleColumns.studentName ? <td>{row.studentName}</td> : null}
                      {visibleColumns.submittedAt ? <td>{row.submittedAt ? String(row.submittedAt).replace('T', ' ') : '-'}</td> : null}
                      {visibleColumns.evaluate ? (
                        <td>
                          <span className={evaluateBadge(row.evaluate)}>{row.evaluate || 'Pending'}</span>
                        </td>
                      ) : null}
                      {visibleColumns.marks ? <td>{row.marks == null ? '-' : row.marks}</td> : null}
                      <td>
                        <div className="d-flex gap-2">
                          {canEvaluate ? (
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEvaluate(row)}>
                              Evaluate
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
                  ))}
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={20} className="text-center text-muted">
                        No submissions found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}

          {hasSearched ? (
            <div className="d-flex align-items-center justify-content-between mt-3">
              <div className="text-muted small">
                Page {currentPage} of {totalPages}
              </div>
              <div className="d-flex align-items-center gap-2">
                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                  Prev
                </button>
                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <WizardPopup title="Submit Assignment" isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} steps={STEPS} currentStep={addStep} setCurrentStep={setAddStep} onSave={saveAdd} saving={saving}>
        {renderAddForm()}
      </WizardPopup>

      <WizardPopup title="Evaluate Submission" isOpen={isEvalOpen} onClose={() => setIsEvalOpen(false)} steps={['Evaluate']} currentStep={0} setCurrentStep={() => {}} onSave={saveEvaluate} saving={saving}>
        <div className="avm-grid">
          <FormField label="Marks" required>
            <input className="form-control avm-input ps-44" value={evalForm.marks} onChange={(e) => setEvalForm((p) => ({ ...p, marks: e.target.value }))} placeholder="e.g. 10" />
          </FormField>
          <FormField label="Feedback" full>
            <textarea className="form-control avm-input ps-44" value={evalForm.feedback} onChange={(e) => setEvalForm((p) => ({ ...p, feedback: e.target.value }))} rows={4} placeholder="Feedback" />
          </FormField>
        </div>
      </WizardPopup>

      <SlideSidebar show={isFindSidebarOpen} onClose={() => setIsFindSidebarOpen(false)} title="Find Submissions" width="420px">
        <form onSubmit={handleApplyFilters} className="p-3">
          <div className="mb-3">
            <label className="form-label">School</label>
            <select className="form-select" id="schoolId" value={pendingFilters.schoolId} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              {schoolsLookup.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
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

          {!fixedStudentId ? (
            <div className="mb-3">
              <label className="form-label">Student</label>
              <select className="form-select" id="studentId" value={pendingFilters.studentId} onChange={handlePendingFilterChange} disabled={pendingFilters.sectionId === 'Select'}>
                <option value="Select">Select</option>
                {studentsLookup.map((s) => (
                  <option key={s.id || s.studentId} value={String(s.id || s.studentId)}>
                    {s.name || s.fullName || s.studentName || s.email || `Student #${s.id || s.studentId}`}
                  </option>
                ))}
              </select>
              {findErrors.studentId ? <div className="text-danger small mt-1">{findErrors.studentId}</div> : null}
            </div>
          ) : null}

          <div className="mb-3">
            <label className="form-label">Assignment</label>
            <select className="form-select" id="assignmentId" value={pendingFilters.assignmentId} onChange={handlePendingFilterChange} disabled={pendingFilters.sectionId === 'Select'}>
              <option value="Select">Select</option>
              {assignmentOptions.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.title}
                </option>
              ))}
            </select>
            {findErrors.assignmentId ? <div className="text-danger small mt-1">{findErrors.assignmentId}</div> : null}
          </div>

          <div className="mb-3">
            <label className="form-label">Evaluate</label>
            <select className="form-select" id="evaluate" value={pendingFilters.evaluate} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              {['Pending', 'Reviewed'].map((v) => (
                <option key={v} value={v}>
                  {v}
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

export default Submission

