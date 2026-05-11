import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { createSubmission, deleteSubmission, evaluateSubmission, fetchSubmissions, fetchSubmissionsForAssignment, fetchSubmissionsForStudent, updateSubmission } from '../apis/submissionsApi'
import { fetchAssignmentById, fetchAssignments, fetchAssignmentsForStudent } from '../apis/assignmentsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchStudentsByClassSection, fetchStudentsPage } from '../apis/studentsApi'
import { can } from '../utils/permissions'
import { useAuth } from '../context/useAuth'
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

const getChildId = (child) => child?.studentId ?? child?.id ?? child?.student?.id ?? null

const getBestLabel = (...values) =>
  values
    .map((value) => {
      if (value == null) return ''
      const text = String(value).trim()
      return text === 'null' || text === 'undefined' ? '' : text
    })
    .find(Boolean) || ''

const getOptionLabel = (...values) => getBestLabel(...values)

const getChildScope = (children, selectedChildId) => {
  const list = Array.isArray(children) ? children : []
  const selected =
    selectedChildId != null && selectedChildId !== ''
      ? list.find((child) => String(getChildId(child)) === String(selectedChildId))
      : null
  return selected || null
}

const getSchoolIdFromRow = (row) => row?.schoolId ?? row?.school?.id ?? row?.school?.schoolId ?? null
const getSchoolNameFromRow = (row) => row?.schoolName ?? row?.school?.schoolName ?? row?.school?.name ?? row?.name ?? row?.label ?? ''
const getClassIdFromRow = (row) => row?.id ?? row?.classId ?? row?.schoolClass?.id ?? row?.schoolClassId ?? null
const getClassNameFromRow = (row) => row?.className ?? row?.name ?? row?.label ?? row?.schoolClass?.className ?? row?.schoolClass?.name ?? ''
const getSectionIdFromRow = (row) => row?.id ?? row?.sectionId ?? row?.schoolSection?.id ?? row?.schoolSectionId ?? null
const getSectionNameFromRow = (row) => row?.sectionName ?? row?.name ?? row?.label ?? row?.schoolSection?.sectionName ?? row?.schoolSection?.name ?? ''
const rowMatchesSchool = (row, schoolId, schoolName = '') => {
  const targetId = schoolId != null && schoolId !== '' ? String(schoolId) : ''
  const targetName = String(schoolName || '').trim().toLowerCase()
  const rowSchoolId = getSchoolIdFromRow(row)
  const rowSchoolName = getSchoolNameFromRow(row).trim().toLowerCase()
  return (
    (targetId && rowSchoolId != null && String(rowSchoolId) === targetId) ||
    (targetName && rowSchoolName && rowSchoolName === targetName)
  )
}

const rowMatchesClass = (row, classId, className = '') => {
  const targetId = classId != null && classId !== '' ? String(classId) : ''
  const targetName = String(className || '').trim().toLowerCase()
  const rowClassId = getClassIdFromRow(row)
  const rowClassName = getClassNameFromRow(row).trim().toLowerCase()
  return (
    (targetId && rowClassId != null && String(rowClassId) === targetId) ||
    (targetName && rowClassName && rowClassName === targetName)
  )
}

const rowMatchesSection = (row, sectionId, sectionName = '') => {
  const targetId = sectionId != null && sectionId !== '' ? String(sectionId) : ''
  const targetName = String(sectionName || '').trim().toLowerCase()
  const rowSectionId = getSectionIdFromRow(row)
  const rowSectionName = getSectionNameFromRow(row).trim().toLowerCase()
  return (
    (targetId && rowSectionId != null && String(rowSectionId) === targetId) ||
    (targetName && rowSectionName && rowSectionName === targetName)
  )
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
  if (v === 'accepted') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
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
  const { user, role, schoolId, schoolName, teacherContext, studentClassId, studentSectionId, studentId, parentChildren, selectedChildId } = useAuth()

  const canSubmit = can(user, ['ASSIGNMENT_SUBMIT', '*'])
  const canView = can(user, ['SUBMISSION_MANAGE', 'SUBMISSION_VIEW_ASSIGNED', 'SUBMISSION_VIEW_OWN', 'SUBMISSION_VIEW_CHILD', '*'])
  const canEvaluate = can(user, ['SUBMISSION_MANAGE', 'SUBMISSION_EVALUATE_ASSIGNED', '*'])
  const canManage = can(user, ['SUBMISSION_MANAGE', 'SUBMISSION_VIEW_ASSIGNED', '*'])

  const roleUpper = String(role || '').toUpperCase()
  const isTeacherScopedUser = roleUpper === 'TEACHER'
  const selectedChild = useMemo(() => getChildScope(parentChildren, selectedChildId), [parentChildren, selectedChildId])
  const fixedStudentId =
    roleUpper === 'STUDENT'
      ? studentId
      : roleUpper === 'PARENT'
        ? getChildId(selectedChild)
        : null
  const isChildScopedUser = roleUpper === 'STUDENT' || roleUpper === 'PARENT'
  const fixedStudentSchoolId =
    roleUpper === 'STUDENT'
      ? schoolId != null
        ? String(schoolId)
        : null
      : roleUpper === 'PARENT'
        ? selectedChild?.schoolId != null
          ? String(selectedChild.schoolId)
          : null
        : null
  const fixedStudentClassId =
    roleUpper === 'STUDENT'
      ? studentClassId != null
        ? String(studentClassId)
        : null
      : roleUpper === 'PARENT'
        ? selectedChild?.classId != null
          ? String(selectedChild.classId)
          : null
        : null
  const fixedStudentSectionId =
    roleUpper === 'STUDENT'
      ? studentSectionId != null
        ? String(studentSectionId)
        : null
      : roleUpper === 'PARENT'
        ? selectedChild?.sectionId != null
          ? String(selectedChild.sectionId)
          : null
        : null
  const fixedStudentName =
    roleUpper === 'STUDENT'
      ? getBestLabel(user?.name, user?.fullName, user?.student?.name, user?.student?.fullName, user?.studentName, user?.email, studentId)
      : roleUpper === 'PARENT'
        ? getBestLabel(selectedChild?.name, selectedChild?.studentName, selectedChild?.fullName, selectedChild?.student?.name, selectedChild?.student?.fullName, selectedChild?.email, fixedStudentId)
        : ''
  const fixedTeacherSchoolId =
    isTeacherScopedUser
      ? teacherContext?.schoolId != null
        ? String(teacherContext.schoolId)
        : schoolId != null
          ? String(schoolId)
          : null
      : null
  const fixedTeacherSchoolName = isTeacherScopedUser
    ? getBestLabel(
        teacherContext?.schoolName,
        teacherContext?.school?.schoolName,
        teacherContext?.school?.name,
        user?.schoolName,
        user?.school?.schoolName,
        user?.school?.name,
        schoolName,
        `School ${fixedTeacherSchoolId || ''}`.trim(),
      )
    : ''
  const fixedStudentScope = useMemo(
    () =>
      isChildScopedUser
        ? {
            schoolId: fixedStudentSchoolId,
            classId: fixedStudentClassId,
            sectionId: fixedStudentSectionId,
            studentId: fixedStudentId != null ? String(fixedStudentId) : null,
            studentName: fixedStudentName,
          }
        : null,
    [fixedStudentClassId, fixedStudentId, fixedStudentName, fixedStudentSchoolId, fixedStudentSectionId, isChildScopedUser],
  )
  const fixedTeacherScope = useMemo(
    () =>
      isTeacherScopedUser
        ? {
            schoolId: fixedTeacherSchoolId,
            schoolName: fixedTeacherSchoolName,
          }
        : null,
    [fixedTeacherSchoolId, fixedTeacherSchoolName, isTeacherScopedUser],
  )

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

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editSubmissionId, setEditSubmissionId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editFile, setEditFile] = useState(null)
  const [editExistingFileName, setEditExistingFileName] = useState('')
  const [editStep, setEditStep] = useState(0)
  const editFileRef = useRef(null)

  const [isEvalOpen, setIsEvalOpen] = useState(false)
  const [evalId, setEvalId] = useState(null)
  const [evalForm, setEvalForm] = useState({ marks: '', feedback: '' })
  const [evalRow, setEvalRow] = useState(null)

  const [isFindSidebarOpen, setIsFindSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [findErrors, setFindErrors] = useState({})
  const [hasSearched, setHasSearched] = useState(false)
  const hasSearchResults = roleUpper === 'TEACHER' || hasSearched || fixedStudentId != null

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const loadLookups = useCallback(async () => {
    const teacherSchoolId = isTeacherScopedUser ? fixedTeacherSchoolId : null
    const [schools, classes, sections, students] = await Promise.all([
      fetchSchoolsLookup().catch(() => []),
      fetchClasses(teacherSchoolId ? { schoolId: teacherSchoolId } : undefined).catch(() => []),
      fetchSections(teacherSchoolId ? { schoolId: teacherSchoolId } : undefined).catch(() => []),
      teacherSchoolId
        ? fetchStudentsPage(0, 1000, { schoolId: teacherSchoolId })
            .then((page) => (Array.isArray(page?.content) ? page.content : Array.isArray(page?.value) ? page.value : []))
            .catch(() => [])
        : Promise.resolve([]),
    ])
    setSchoolsLookup(Array.isArray(schools) ? schools : [])
    setClassesLookup(Array.isArray(classes) ? classes : [])
    setSectionsLookup(Array.isArray(sections) ? sections : [])
    setStudentsLookup(Array.isArray(students) ? students : [])
  }, [fixedStudentId, fixedTeacherSchoolId, isTeacherScopedUser])

  const loadRows = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (roleUpper === 'PARENT' && fixedStudentId == null) {
        setRows([])
        setAssignments([])
        return
      }
      const [subs, asgs] = await Promise.all([
        fixedStudentId != null
          ? fetchSubmissionsForStudent(fixedStudentId)
          : filters.assignmentId && filters.assignmentId !== 'Select' && roleUpper === 'TEACHER'
            ? fetchSubmissionsForAssignment(filters.assignmentId)
            : fetchSubmissions(),
        fixedStudentId != null ? fetchAssignmentsForStudent(fixedStudentId) : fetchAssignments(),
      ])
      const nextRows = Array.isArray(subs) ? subs : []
      const nextAssignments = Array.isArray(asgs) ? asgs : []

      const knownAssignmentIds = new Set(nextAssignments.map((a) => String(a?.id)).filter((id) => id && id !== 'undefined' && id !== 'null'))
      const missingAssignmentIds = Array.from(
        new Set(
          nextRows
            .map((row) => row?.assignmentId)
            .filter((id) => id != null && !knownAssignmentIds.has(String(id)))
            .map((id) => String(id)),
        ),
      )

      if (missingAssignmentIds.length > 0) {
        const missingAssignments = await Promise.all(missingAssignmentIds.map((id) => fetchAssignmentById(id).catch(() => null)))
        for (const assignment of missingAssignments) {
          if (assignment?.id != null) nextAssignments.push(assignment)
        }
      }

      setRows(nextRows)
      setAssignments(nextAssignments)
    } catch (e) {
      setRows([])
      setAssignments([])
      setError(e?.message || 'Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [fixedStudentId, filters.assignmentId, roleUpper])

  useEffect(() => {
    void loadLookups()
    void loadRows()
  }, [loadLookups, loadRows])

  useEffect(() => {
    // For teachers, load submissions when assignment filter changes
    if (roleUpper !== 'TEACHER') return
    void loadRows()
  }, [roleUpper, filters.assignmentId, loadRows])

  const schoolNameById = useMemo(() => {
    const map = new Map()
    for (const school of schoolsLookup) {
      const id = school?.id ?? school?.schoolId ?? null
      const name = school?.schoolName || school?.name || school?.label || ''
      if (id != null && name) map.set(String(id), name)
    }
    return map
  }, [schoolsLookup])
  const classNameById = useMemo(() => {
    const map = new Map()
    for (const cls of classesLookup) {
      const id = cls?.id ?? cls?.classId ?? null
      const name = getBestLabel(cls?.className, cls?.numericName, cls?.name, cls?.label)
      if (id != null && name) map.set(String(id), name)
    }
    return map
  }, [classesLookup])
  const sectionNameById = useMemo(() => {
    const map = new Map()
    for (const section of sectionsLookup) {
      const id = section?.id ?? section?.sectionId ?? null
      const name = getBestLabel(section?.sectionName, section?.name, section?.label)
      if (id != null && name) map.set(String(id), name)
    }
    return map
  }, [sectionsLookup])
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

  const assignmentDetailsById = useMemo(() => {
    const map = new Map()
    for (const a of assignments) {
      const id = a?.id
      if (id == null) continue
      map.set(String(id), {
        schoolId: a?.schoolId ?? a?.school?.id ?? a?.school?.schoolId ?? null,
        schoolName: getBestLabel(a?.schoolName, a?.school?.schoolName, a?.school?.name, a?.school?.label),
        classId: a?.classId ?? a?.schoolClass?.id ?? a?.schoolClassId ?? null,
        className: getBestLabel(a?.className, a?.schoolClass?.className, a?.schoolClass?.name, a?.schoolClass?.label, a?.numericName),
        sectionId: a?.sectionId ?? a?.schoolSection?.id ?? a?.schoolSectionId ?? null,
        sectionName: getBestLabel(a?.sectionName, a?.schoolSection?.sectionName, a?.schoolSection?.name, a?.schoolSection?.label),
        subjectId: a?.subjectId ?? a?.subject?.id ?? null,
        subjectName: getBestLabel(a?.subjectName, a?.subject?.name, a?.subject?.subjectName, a?.subject?.label),
      })
    }
    return map
  }, [assignments])

  const classOptions = useMemo(() => {
    return classesLookup
      .filter((c) => pendingFilters.schoolId === 'Select' || rowMatchesSchool(c, pendingFilters.schoolId, schoolNameById.get(String(pendingFilters.schoolId))))
      .slice()
      .sort((a, b) => getOptionLabel(a.className, a.numericName, a.name, a.label).localeCompare(getOptionLabel(b.className, b.numericName, b.name, b.label)))
  }, [classesLookup, pendingFilters.schoolId, schoolNameById])

  const sectionOptions = useMemo(() => {
    return sectionsLookup
      .filter((s) => {
        if (pendingFilters.schoolId !== 'Select' && !rowMatchesSchool(s, pendingFilters.schoolId, schoolNameById.get(String(pendingFilters.schoolId)))) return false
        if (pendingFilters.classId !== 'Select' && !rowMatchesClass(s, pendingFilters.classId, classNameById.get(String(pendingFilters.classId)))) return false
        return true
      })
      .slice()
      .sort((a, b) => getOptionLabel(a.sectionName, a.name, a.label).localeCompare(getOptionLabel(b.sectionName, b.name, b.label)))
  }, [sectionsLookup, pendingFilters.schoolId, pendingFilters.classId, schoolNameById, classNameById])

  const assignmentOptions = useMemo(() => {
    return assignments
      .filter((a) => {
        if (pendingFilters.schoolId !== 'Select' && !rowMatchesSchool(a, pendingFilters.schoolId, schoolNameById.get(String(pendingFilters.schoolId)))) return false
        if (pendingFilters.classId !== 'Select' && !rowMatchesClass(a, pendingFilters.classId, classNameById.get(String(pendingFilters.classId)))) return false
        if (pendingFilters.sectionId !== 'Select' && !rowMatchesSection(a, pendingFilters.sectionId, sectionNameById.get(String(pendingFilters.sectionId)))) return false
        return true
      })
      .slice()
      .sort((a, b) => getOptionLabel(a.title, a.assignmentTitle, a.name, a.label).localeCompare(getOptionLabel(b.title, b.assignmentTitle, b.name, b.label)))
  }, [assignments, pendingFilters.schoolId, pendingFilters.classId, pendingFilters.sectionId, schoolNameById, classNameById, sectionNameById])

  const validateFind = () => {
    const errs = {}
    if (roleUpper === 'TEACHER') return errs
    if (!fixedStudentScope) {
      if (!fixedTeacherScope && pendingFilters.schoolId === 'Select') errs.schoolId = 'School is required.'
      if (pendingFilters.classId === 'Select') errs.classId = 'Class is required.'
      if (pendingFilters.sectionId === 'Select') errs.sectionId = 'Section is required.'
    }
    if (pendingFilters.assignmentId === 'Select') errs.assignmentId = 'Assignment is required.'
    if (!fixedStudentScope && pendingFilters.studentId === 'Select') errs.studentId = 'Student is required.'
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
    if (fixedStudentScope) {
      const next = {
        schoolId: fixedStudentScope.schoolId || 'Select',
        classId: fixedStudentScope.classId || 'Select',
        sectionId: fixedStudentScope.sectionId || 'Select',
        assignmentId: 'Select',
        studentId: fixedStudentScope.studentId || 'Select',
        evaluate: 'Select',
      }
      setPendingFilters(next)
      setFilters(next)
    } else if (fixedTeacherScope) {
      const next = {
        schoolId: fixedTeacherScope.schoolId || 'Select',
        classId: 'Select',
        sectionId: 'Select',
        assignmentId: 'Select',
        studentId: 'Select',
        evaluate: 'Select',
      }
      setPendingFilters(next)
      setFilters(next)
    } else {
      setPendingFilters(emptyFilters)
      setFilters(emptyFilters)
    }
    setFindErrors({})
    setHasSearched(false)
    setSearch('')
    setCurrentPage(1)
    setSelectedRows([])
  }

  useEffect(() => {
    if (!fixedStudentScope && !fixedTeacherScope) return
    const next = {
      schoolId: fixedStudentScope?.schoolId || fixedTeacherScope?.schoolId || 'Select',
      classId: fixedStudentScope?.classId || 'Select',
      sectionId: fixedStudentScope?.sectionId || 'Select',
      assignmentId: pendingFilters.assignmentId || 'Select',
      studentId: fixedStudentScope?.studentId || 'Select',
      evaluate: pendingFilters.evaluate || 'Select',
    }
    setPendingFilters(next)
    setFilters((prev) => ({ ...prev, ...next }))
  }, [fixedStudentScope, fixedTeacherScope, pendingFilters.assignmentId, pendingFilters.evaluate])

  const filtered = useMemo(() => {
    if (!hasSearchResults) return []
    const q = search.trim().toLowerCase()
    return rows
      .map((r) => ({
        ...r,
        schoolName:
          r.schoolName ||
          assignmentDetailsById.get(String(r.assignmentId))?.schoolName ||
          (isTeacherScopedUser ? fixedTeacherSchoolName : '') ||
          schoolNameById.get(String(r.schoolId)) ||
          '',
        className:
          r.className ||
          assignmentDetailsById.get(String(r.assignmentId))?.className ||
          classNameById.get(String(r.classId)) ||
          '',
        sectionName:
          r.sectionName ||
          assignmentDetailsById.get(String(r.assignmentId))?.sectionName ||
          sectionNameById.get(String(r.sectionId)) ||
          '',
        studentName:
          r.studentName ||
          studentNameById.get(String(r.studentId)) ||
          (isTeacherScopedUser ? getBestLabel(r.studentName, r.student?.name, r.student?.fullName) : '') ||
          String(r.studentId || ''),
        assignmentTitle:
          r.assignmentTitle ||
          assignmentTitleById.get(String(r.assignmentId)) ||
          assignmentDetailsById.get(String(r.assignmentId))?.subjectName ||
          String(r.assignmentId || ''),
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
  }, [hasSearchResults, rows, filters, search, schoolNameById, classNameById, sectionNameById, studentNameById, assignmentTitleById, fixedStudentId, assignmentDetailsById, isTeacherScopedUser, fixedTeacherSchoolName])

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
    if (roleUpper === 'PARENT' && fixedStudentId == null) {
      setError('Select a child first to submit assignments.')
      return
    }
    const initial = {
      ...emptyForm,
      ...(isChildScopedUser
        ? {
            schoolId: fixedStudentSchoolId || 'Select',
            classId: fixedStudentClassId || 'Select',
            sectionId: fixedStudentSectionId || 'Select',
            studentId: fixedStudentId ? String(fixedStudentId) : 'Select',
          }
        : isTeacherScopedUser
          ? {
              schoolId: fixedTeacherSchoolId || 'Select',
            }
        : {}),
    }
    if (fixedStudentId) initial.studentId = String(fixedStudentId)
    setAddForm(initial)
    setAddFile(null)
    if (addFileRef.current) addFileRef.current.value = ''
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    if (!row) return
    setEditSubmissionId(row.id)
    setEditForm({
      schoolId: row.schoolId ? String(row.schoolId) : 'Select',
      classId: row.classId ? String(row.classId) : 'Select',
      sectionId: row.sectionId ? String(row.sectionId) : 'Select',
      studentId: row.studentId ? String(row.studentId) : 'Select',
      assignmentId: row.assignmentId ? String(row.assignmentId) : 'Select',
      note: row.note || '',
    })
    setEditFile(null)
    setEditExistingFileName(String(row.fileUrl || '').split('/').filter(Boolean).pop() || '')
    if (editFileRef.current) editFileRef.current.value = ''
    setEditStep(0)
    setIsEditOpen(true)
    if (row?.schoolId && row?.classId) {
      void fetchSections({ schoolId: String(row.schoolId), classId: String(row.classId) })
        .then((secs) => setSectionsLookup(Array.isArray(secs) ? secs : []))
        .catch(() => setSectionsLookup([]))
    }
    if (row?.schoolId && row?.classId && row?.sectionId) {
      void fetchStudentsByClassSection({
        schoolId: String(row.schoolId),
        classId: String(row.classId),
        sectionId: String(row.sectionId),
      })
        .then((students) => setStudentsLookup(Array.isArray(students) ? students : []))
        .catch(() => setStudentsLookup([]))
    }
  }

  const validateAdd = () => {
    const errs = {}
    if (isChildScopedUser) {
      if (addForm.schoolId === 'Select') errs.schoolId = 'Unable to determine the child school.'
      if (addForm.classId === 'Select') errs.classId = 'Unable to determine the child class.'
      if (addForm.sectionId === 'Select') errs.sectionId = 'Unable to determine the child section.'
      if (addForm.studentId === 'Select') errs.studentId = 'Unable to determine the child student.'
    } else {
      if (addForm.schoolId === 'Select') errs.schoolId = 'School is required.'
      if (addForm.classId === 'Select') errs.classId = 'Class is required.'
      if (addForm.sectionId === 'Select') errs.sectionId = 'Section is required.'
      if (addForm.studentId === 'Select') errs.studentId = 'Student is required.'
    }
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
        studentId: Number(addForm.studentId),
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

  const saveEdit = async () => {
    if (!editSubmissionId) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        schoolId: Number(editForm.schoolId),
        classId: Number(editForm.classId),
        sectionId: Number(editForm.sectionId),
        studentId: Number(editForm.studentId),
        assignmentId: Number(editForm.assignmentId),
        note: editForm.note || null,
      }
      await updateSubmission(editSubmissionId, payload, editFile)
      setIsEditOpen(false)
      await loadRows()
    } catch (e) {
      setError(e?.message || 'Failed to update submission')
    } finally {
      setSaving(false)
    }
  }

  const openEvaluate = (row) => {
    setEvalId(row.id)
    setEvalRow(row)
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
      setEvalRow(null)
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

  const renderSubmissionForm = (form, setter, file, setFile, fileRef, mode = 'add') => {
    const isEditMode = mode === 'edit'
    const isChildScoped = isChildScopedUser
    const isTeacherScope = isTeacherScopedUser
    const hasAutoScope = fixedStudentId != null || isTeacherScope
    const isStudentScope = roleUpper === 'STUDENT'
    const isParentScope = roleUpper === 'PARENT'
    const currentAssignmentOptions = hasAutoScope ? assignments : assignmentOptions

    const resolveLockedValue = (id, lookupMap, fallback = '') => {
      const key = id != null ? String(id) : ''
      return lookupMap.get(key) || fallback || key || 'Selected automatically'
    }

    return (
    <div className="avm-grid">
      {!isChildScoped ? (
        isTeacherScope ? (
          <>
            <FormField label="School Name" required>
              <input className="form-control avm-input ps-44" value={fixedTeacherSchoolName || schoolName || 'Selected automatically'} readOnly />
            </FormField>

            <FormField label="Class" required>
              <select
                className="form-select avm-input ps-44"
                id="classId"
                value={form.classId}
                onChange={async (e) => {
                  const value = e.target.value
                  setter((prev) => ({ ...prev, classId: value, sectionId: 'Select', assignmentId: 'Select', studentId: 'Select' }))
                  try {
                    if (form.schoolId !== 'Select' && value !== 'Select') {
                      const secs = await fetchSections({ schoolId: form.schoolId, classId: value })
                      setSectionsLookup(Array.isArray(secs) ? secs : [])
                    } else {
                      setSectionsLookup([])
                    }
                  } catch {
                    setSectionsLookup([])
                  }
                }}
                disabled={isEditMode}
              >
                <option value="Select">Select</option>
                {classesLookup.filter((c) => rowMatchesSchool(c, form.schoolId, fixedTeacherSchoolName)).map((c) => (
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
                onChange={async (e) => {
                  const value = e.target.value
                  setter((prev) => ({ ...prev, sectionId: value, assignmentId: 'Select', studentId: 'Select' }))
                  try {
                    if (form.schoolId !== 'Select' && form.classId !== 'Select' && value !== 'Select') {
                      const students = await fetchStudentsByClassSection({ schoolId: form.schoolId, classId: form.classId, sectionId: value })
                      setStudentsLookup(Array.isArray(students) ? students : [])
                    } else {
                      setStudentsLookup([])
                    }
                  } catch {
                    setStudentsLookup([])
                  }
                }}
                disabled={form.classId === 'Select' || isEditMode}
              >
                <option value="Select">Select</option>
                {sectionsLookup.filter((s) => rowMatchesSchool(s, form.schoolId, fixedTeacherSchoolName) && rowMatchesClass(s, form.classId, classNameById.get(String(form.classId)))).map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.sectionName}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Student" required>
              <select
                className="form-select avm-input ps-44"
                id="studentId"
                value={form.studentId}
                onChange={(e) => setter((prev) => ({ ...prev, studentId: e.target.value }))}
                disabled={form.sectionId === 'Select' || isEditMode}
              >
                <option value="Select">Select</option>
                {studentsLookup.map((s) => (
                  <option key={s.id || s.studentId} value={String(s.id || s.studentId)}>
                    {s.name || s.fullName || s.studentName || s.email || `Student #${s.id || s.studentId}`}
                  </option>
                ))}
              </select>
            </FormField>
          </>
        ) : (
          <>
            <FormField label="School Name" required>
              <select
                className="form-select avm-input ps-44"
                id="schoolId"
                value={form.schoolId}
                onChange={(e) => setter((prev) => ({ ...prev, schoolId: e.target.value, classId: 'Select', sectionId: 'Select', assignmentId: 'Select', studentId: 'Select' }))}
                disabled={isEditMode}
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
                value={form.classId}
                onChange={async (e) => {
                  const value = e.target.value
                  setter((prev) => ({ ...prev, classId: value, sectionId: 'Select', assignmentId: 'Select', studentId: 'Select' }))
                  try {
                    if (form.schoolId !== 'Select' && value !== 'Select') {
                      const secs = await fetchSections({ schoolId: form.schoolId, classId: value })
                      setSectionsLookup(Array.isArray(secs) ? secs : [])
                    } else {
                      setSectionsLookup([])
                    }
                  } catch {
                    setSectionsLookup([])
                  }
                }}
                disabled={form.schoolId === 'Select' || isEditMode}
              >
                <option value="Select">Select</option>
                {classesLookup.filter((c) => rowMatchesSchool(c, form.schoolId, schoolNameById.get(String(form.schoolId)))).map((c) => (
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
                onChange={async (e) => {
                  const value = e.target.value
                  setter((prev) => ({ ...prev, sectionId: value, assignmentId: 'Select', studentId: 'Select' }))
                  try {
                    if (form.schoolId !== 'Select' && form.classId !== 'Select' && value !== 'Select') {
                      const students = await fetchStudentsByClassSection({ schoolId: form.schoolId, classId: form.classId, sectionId: value })
                      setStudentsLookup(Array.isArray(students) ? students : [])
                    } else {
                      setStudentsLookup([])
                    }
                  } catch {
                    setStudentsLookup([])
                  }
                }}
                disabled={form.classId === 'Select' || isEditMode}
              >
                <option value="Select">Select</option>
                {sectionsLookup.filter((s) => rowMatchesSchool(s, form.schoolId, schoolNameById.get(String(form.schoolId))) && rowMatchesClass(s, form.classId, classNameById.get(String(form.classId)))).map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.sectionName}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Student" required>
              <select
                className="form-select avm-input ps-44"
                id="studentId"
                value={form.studentId}
                onChange={(e) => setter((prev) => ({ ...prev, studentId: e.target.value }))}
                disabled={form.sectionId === 'Select' || isEditMode}
              >
                <option value="Select">Select</option>
                {studentsLookup.map((s) => (
                  <option key={s.id || s.studentId} value={String(s.id || s.studentId)}>
                    {s.name || s.fullName || s.studentName || s.email || `Student #${s.id || s.studentId}`}
                  </option>
                ))}
              </select>
            </FormField>
          </>
        )
      ) : (
        <>
          <FormField label="School Name" required>
            <input
              className="form-control avm-input ps-44"
              value={resolveLockedValue(form.schoolId, schoolNameById, isParentScope ? getBestLabel(selectedChild?.schoolName, selectedChild?.school?.schoolName, selectedChild?.school?.name) : getBestLabel(user?.schoolName, user?.school?.schoolName, user?.school?.name))}
              readOnly
            />
          </FormField>

          <FormField label="Class" required>
            <input
              className="form-control avm-input ps-44"
              value={resolveLockedValue(form.classId, classNameById, isParentScope ? getBestLabel(selectedChild?.className, selectedChild?.schoolClass?.className, selectedChild?.schoolClass?.name) : getBestLabel(user?.className, user?.student?.className, user?.student?.schoolClass?.className))}
              readOnly
            />
          </FormField>

          <FormField label="Section" required>
            <input
              className="form-control avm-input ps-44"
              value={resolveLockedValue(form.sectionId, sectionNameById, isParentScope ? getBestLabel(selectedChild?.sectionName, selectedChild?.schoolSection?.sectionName, selectedChild?.schoolSection?.name) : getBestLabel(user?.sectionName, user?.student?.sectionName, user?.student?.schoolSection?.sectionName))}
              readOnly
            />
          </FormField>

          <FormField label="Student" required>
            <input
              className="form-control avm-input ps-44"
              value={resolveLockedValue(form.studentId, studentNameById, isParentScope ? fixedStudentName : getBestLabel(fixedStudentName))}
              readOnly
            />
          </FormField>
        </>
      )}

      <FormField label="Assignment" required>
        <select
          className="form-select avm-input ps-44"
          id="assignmentId"
          value={form.assignmentId}
          onChange={(e) => setter((prev) => ({ ...prev, assignmentId: e.target.value }))}
          disabled={isEditMode || (!hasAutoScope && form.sectionId === 'Select')}
        >
          <option value="Select">Select</option>
          {currentAssignmentOptions
            .filter((a) =>
              !isStudentScope
                ? String(a.schoolId) === String(form.schoolId) && String(a.classId) === String(form.classId) && String(a.sectionId) === String(form.sectionId)
                : true
            )
            .map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.title}
              </option>
            ))}
        </select>
      </FormField>

      <FormField label="Submission" required full noIcon>
        <div className="d-flex align-items-center gap-2">
          <input ref={fileRef} type="file" accept={ACCEPTED_DOC_TYPES} className="form-control" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {file ? (
            <span className="text-muted small">{file.name}</span>
          ) : isEditMode && editExistingFileName ? (
            <span className="text-muted small">Current file: {editExistingFileName}</span>
          ) : (
            <span className="text-muted small">{ACCEPTED_DOC_LABEL}</span>
          )}
        </div>
      </FormField>

      <FormField label="Note" full>
        <textarea className="form-control avm-input ps-44" id="note" value={form.note} onChange={(e) => setter((prev) => ({ ...prev, note: e.target.value }))} rows={3} placeholder="Optional note" />
      </FormField>
    </div>
    )
  }

  if (!canView) return <div className="dashboard-main-body text-muted">No access.</div>

  return (
    <div className="dashboard-main-body">
      {roleUpper === 'PARENT' && !selectedChildId ? (
        <div className="alert alert-info mb-3">Select a child from the top bar to view submissions.</div>
      ) : null}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h5 className="mb-0">Submission</h5>
          <div className="text-muted small">Submit assignments and review/evaluate submissions within your scope.</div>
        </div>

      <div className="d-flex align-items-center gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => setIsFindSidebarOpen(true)}>
            Find
          </button>
          {canSubmit && roleUpper !== 'TEACHER' ? (
            <button type="button" className="btn btn-primary" onClick={openAdd} disabled={!hasSearchResults || (roleUpper === 'PARENT' && fixedStudentId == null)}>
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
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center text-muted">
                      Loading...
                    </td>
                  </tr>
                ) : !hasSearchResults ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center text-muted">
                      Use Find to select School/Class/Section/Assignment (and Student when applicable).
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center text-muted">
                      No submissions found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row) => (
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
                          {roleUpper === 'STUDENT' && fixedStudentId ? (
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => openEdit(row)}>
                              Edit
                            </button>
                          ) : null}
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

      <WizardPopup title="Submit Assignment" isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} steps={STEPS} currentStep={addStep} setCurrentStep={setAddStep} onSave={saveAdd} saving={saving}>
        {renderSubmissionForm(addForm, setAddForm, addFile, setAddFile, addFileRef, 'add')}
      </WizardPopup>

      <WizardPopup title="Edit Submission" isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} steps={STEPS} currentStep={editStep} setCurrentStep={setEditStep} onSave={saveEdit} saving={saving}>
        {renderSubmissionForm(editForm, setEditForm, editFile, setEditFile, editFileRef, 'edit')}
      </WizardPopup>

      <WizardPopup title="Evaluate Submission" isOpen={isEvalOpen} onClose={() => setIsEvalOpen(false)} steps={['Evaluate']} currentStep={0} setCurrentStep={() => {}} onSave={saveEvaluate} saving={saving}>
        <div className="avm-grid">
          <div className="avm-field full">
            <label className="avm-label">Submission Context</label>
            <div className="p-3 radius-8 border" style={{ background: '#f8fafc' }}>
              <div className="fw-medium mb-1">
                {getBestLabel(
                  evalRow?.assignmentTitle,
                  assignmentTitleById.get(String(evalRow?.assignmentId)),
                  assignmentDetailsById.get(String(evalRow?.assignmentId))?.subjectName,
                  'Assignment',
                )}
              </div>
              <div className="text-muted small">
                {getBestLabel(evalRow?.schoolName, schoolNameById.get(String(evalRow?.schoolId)), fixedTeacherSchoolName, 'School')} |{' '}
                {getBestLabel(evalRow?.className, classNameById.get(String(evalRow?.classId)), 'Class')} |{' '}
                {getBestLabel(evalRow?.sectionName, sectionNameById.get(String(evalRow?.sectionId)), 'Section')} |{' '}
                {getBestLabel(evalRow?.studentName, studentNameById.get(String(evalRow?.studentId)), 'Student')}
              </div>
            </div>
          </div>

          <div className="avm-field full">
            <label className="avm-label">Uploaded Document</label>
            {evalRow?.fileUrl ? (
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <a className="btn btn-outline-primary btn-sm" href={evalRow.fileUrl} target="_blank" rel="noreferrer">
                  View file
                </a>
                <span className="text-muted small text-break">{String(evalRow.fileUrl).split('/').filter(Boolean).pop() || evalRow.fileUrl}</span>
              </div>
            ) : (
              <div className="text-muted small">No file uploaded with this submission.</div>
            )}
          </div>

          <FormField label="Marks" required>
            <input
              className="form-control avm-input ps-44"
              type="number"
              inputMode="numeric"
              min="0"
              value={evalForm.marks}
              onChange={(e) => setEvalForm((p) => ({ ...p, marks: e.target.value }))}
              placeholder="e.g. 10"
            />
          </FormField>
          <FormField label="Feedback" full>
            <textarea className="form-control avm-input ps-44" value={evalForm.feedback} onChange={(e) => setEvalForm((p) => ({ ...p, feedback: e.target.value }))} rows={4} placeholder="Feedback" />
          </FormField>
        </div>
      </WizardPopup>

      <SlideSidebar show={isFindSidebarOpen} onClose={() => setIsFindSidebarOpen(false)} title="Find Submissions" width="420px">
        <form onSubmit={handleApplyFilters} className="p-3">
          {fixedStudentScope ? (
            <>
              <div className="mb-3">
                <label className="form-label">School</label>
                <input className="form-control" value={getBestLabel(schoolNameById.get(String(fixedStudentScope.schoolId)), selectedChild?.schoolName, selectedChild?.school?.schoolName, selectedChild?.school?.name, user?.schoolName, user?.school?.schoolName, user?.school?.name, 'Selected automatically')} readOnly />
              </div>

              <div className="mb-3">
                <label className="form-label">Class</label>
                <input className="form-control" value={getBestLabel(classNameById.get(String(fixedStudentScope.classId)), selectedChild?.className, selectedChild?.schoolClass?.className, selectedChild?.schoolClass?.name, user?.className, user?.student?.className, user?.student?.schoolClass?.className, 'Selected automatically')} readOnly />
              </div>

              <div className="mb-3">
                <label className="form-label">Section</label>
                <input className="form-control" value={getBestLabel(sectionNameById.get(String(fixedStudentScope.sectionId)), selectedChild?.sectionName, selectedChild?.schoolSection?.sectionName, selectedChild?.schoolSection?.name, user?.sectionName, user?.student?.sectionName, user?.student?.schoolSection?.sectionName, 'Selected automatically')} readOnly />
              </div>

              <div className="mb-3">
                <label className="form-label">Student</label>
                <input className="form-control" value={getBestLabel(fixedStudentScope.studentName, studentNameById.get(String(fixedStudentScope.studentId)), user?.name, user?.fullName, user?.student?.name, user?.student?.fullName, 'Selected automatically')} readOnly />
              </div>
            </>
          ) : fixedTeacherScope ? (
            <>
              <div className="mb-3">
                <label className="form-label">School</label>
                <input className="form-control" value={fixedTeacherSchoolName || schoolName || 'Selected automatically'} readOnly />
              </div>

              <div className="mb-3">
                <label className="form-label">Class</label>
                <select className="form-select" id="classId" value={pendingFilters.classId} onChange={handlePendingFilterChange}>
                  <option value="Select">Select</option>
                  {classOptions.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {getOptionLabel(c.className, c.numericName, c.name, c.label)}
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
                      {getOptionLabel(s.sectionName, s.name, s.label)}
                    </option>
                  ))}
                </select>
                {findErrors.sectionId ? <div className="text-danger small mt-1">{findErrors.sectionId}</div> : null}
              </div>

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
            </>
          ) : (
            <>
              <div className="mb-3">
                <label className="form-label">School</label>
                <select className="form-select" id="schoolId" value={pendingFilters.schoolId} onChange={handlePendingFilterChange}>
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
                      {getOptionLabel(c.className, c.numericName, c.name, c.label)}
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
                      {getOptionLabel(s.sectionName, s.name, s.label)}
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
            </>
          )}

          <div className="mb-3">
            <label className="form-label">Assignment</label>
                <select className="form-select" id="assignmentId" value={pendingFilters.assignmentId} onChange={handlePendingFilterChange} disabled={pendingFilters.sectionId === 'Select'}>
                  <option value="Select">Select</option>
                  {assignmentOptions.map((a) => (
                    <option key={a.id} value={String(a.id)}>
                      {getOptionLabel(a.title, a.assignmentTitle, a.name, a.label)}
                    </option>
                  ))}
                </select>
            {findErrors.assignmentId ? <div className="text-danger small mt-1">{findErrors.assignmentId}</div> : null}
          </div>

          <div className="mb-3">
            <label className="form-label">Evaluate</label>
            <select className="form-select" id="evaluate" value={pendingFilters.evaluate} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              {['Pending', 'Accepted', 'Reviewed'].map((v) => (
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
