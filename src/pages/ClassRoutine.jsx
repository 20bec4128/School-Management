import { useCallback, useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { createClassRoutine, deleteClassRoutine, fetchClassRoutines, updateClassRoutine } from '../apis/classRoutinesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { fetchTeachers } from '../apis/teachersApi'
import { useAuth } from '../context/useAuth'
import { dedupeByKey, getParentChildId, getParentChildScope, getParentChildSchoolId, uniqueScopeCombos } from '../utils/parentChildScope'
import '../assets/css/addModalShared.css'
const STEPS = ['Basic Info']
const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const viewModes = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
]
const teacherScopeModes = [
  { key: 'class', label: 'My Class Routines' },
  { key: 'own', label: 'My Routines' },
]

const emptyForm = {
  schoolId: 'Select',
  classId: 'Select',
  sectionId: 'Select',
  subjectId: 'Select',
  teacherId: 'Select',
  day: 'Monday',
  startTime: '',
  endTime: '',
  roomNo: '',
}

const emptyFilters = {
  schoolId: 'Select',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'className', label: 'Class' },
  { key: 'sectionName', label: 'Section' },
  { key: 'subjectName', label: 'Subject' },
  { key: 'teacherName', label: 'Teacher' },
  { key: 'day', label: 'Day' },
  { key: 'startTime', label: 'Start Time' },
  { key: 'endTime', label: 'End Time' },
  { key: 'roomNo', label: 'Room No' },
]

const dayBadgeColor = (day) => {
  const map = {
    Monday: 'bg-primary-100 text-primary-600',
    Tuesday: 'bg-info-100 text-info-600',
    Wednesday: 'bg-success-100 text-success-600',
    Thursday: 'bg-warning-100 text-warning-600',
    Friday: 'bg-danger-100 text-danger-600',
    Saturday: 'bg-violet-100 text-violet-600',
    Sunday: 'bg-neutral-100 text-secondary-light',
  }
  return `${map[day] || 'bg-neutral-100 text-secondary-light'} px-12 py-4 radius-4 fw-medium text-sm`
}

const parseTimeToMinutes = (time) => {
  if (!time || typeof time !== 'string') return Number.MAX_SAFE_INTEGER
  const [hours, minutes] = time.split(':').map((part) => Number(part))
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return Number.MAX_SAFE_INTEGER
  return hours * 60 + minutes
}

const formatWeekCellTime = (startTime, endTime) => {
  const start = startTime || '--:--'
  const end = endTime || '--:--'
  return `${start} - ${end}`
}

const getTeacherId = (user, teacherContext) => {
  const candidate =
    user?.teacherId ??
    user?.teacher?.id ??
    user?.teacherContext?.id ??
    user?.teacherContext?.teacherId ??
    teacherContext?.id ??
    teacherContext?.teacherId ??
    null
  return candidate == null ? null : String(candidate)
}

const getTodayDate = () => new Date()

const getWeekdayNameFromDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return 'Monday'
  return dayOptions[(date.getDay() + 6) % 7]
}

const isSameCalendarDay = (a, b) => {
  if (!(a instanceof Date) || !(b instanceof Date)) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1)
const shiftMonth = (date, delta) => new Date(date.getFullYear(), date.getMonth() + delta, 1)
const monthLabel = (date) =>
  date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

const ClassRoutine = () => {
  const {
    user,
    schoolId,
    schoolName,
    role,
    teacherContext,
    selectedChildId,
    parentChildren,
    selectedChildren,
    isAllChildrenSelected,
    canAdd,
    canEdit,
    canDelete,
  } = useAuth()
  const normalizedRole = String(role || '').toUpperCase()
  const isTeacher = normalizedRole === 'TEACHER'
  const isStudent = normalizedRole === 'STUDENT'
  const isParent = normalizedRole === 'PARENT'
  const isSchoolAdmin = normalizedRole === 'SCHOOL_ADMIN'
  const isTeacherScope = normalizedRole === 'TEACHER'
  const isFixedSchoolScope = isSchoolAdmin || isTeacherScope
  const isReadOnlyViewer = isStudent || isParent
  const defaultSchoolFilter = schoolId != null ? String(schoolId) : 'Select'
  const currentTeacherId = getTeacherId(user, teacherContext)
  const parentScope = useMemo(() => getParentChildScope(parentChildren, selectedChildId), [parentChildren, selectedChildId])
  const selectedChild = parentScope.selectedChild
  const effectiveChildId = useMemo(() => {
    if (!isParent || isAllChildrenSelected) return null
    return getParentChildId(selectedChild)
  }, [isAllChildrenSelected, isParent, selectedChild])

  const [rows, setRows] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [teachersLookup, setTeachersLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [sectionsLookup, setSectionsLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState('day')
  const [teacherScope, setTeacherScope] = useState('class')
  const [selectedDate, setSelectedDate] = useState(() => getTodayDate())
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(getTodayDate()))

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  const [isFindSidebarOpen, setIsFindSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(() => ({
    schoolId: defaultSchoolFilter,
  }))
  const [filters, setFilters] = useState(() => ({
    schoolId: defaultSchoolFilter,
  }))
  const [findErrors, setFindErrors] = useState({})
  const [hasSearched, setHasSearched] = useState(false)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)
  const currentSchoolOption = useMemo(() => {
    if (!isFixedSchoolScope || schoolId == null) return null
    return { id: schoolId, schoolName: schoolName || `School ${schoolId}` }
  }, [isFixedSchoolScope, schoolId, schoolName])

  const assignedClassIds = useMemo(() => {
    if (!isTeacher || !currentTeacherId) return []
    return (Array.isArray(classesLookup) ? classesLookup : [])
      .filter((c) => c?.id != null && String(c?.teacherId ?? '') === currentTeacherId)
      .map((c) => String(c.id))
  }, [classesLookup, currentTeacherId, isTeacher])

  const loadLookups = useCallback(async () => {
    const [schools, teachers, classes, sections, subjects] = await Promise.all([
      isFixedSchoolScope ? Promise.resolve(currentSchoolOption ? [currentSchoolOption] : []) : fetchSchoolsLookup(),
      fetchTeachers(),
      fetchClasses(),
      fetchSections(),
      fetchSubjects(),
    ])
    setSchoolsLookup(Array.isArray(schools) ? schools : [])
    setTeachersLookup(Array.isArray(teachers) ? teachers : [])
    setClassesLookup(Array.isArray(classes) ? classes : [])
    setSectionsLookup(Array.isArray(sections) ? sections : [])
    setSubjectsLookup(Array.isArray(subjects) ? subjects : [])
  }, [currentSchoolOption, isFixedSchoolScope])

  const loadRows = useCallback(async (effectiveSchoolId, effectiveStudentId) => {
    if (effectiveSchoolId == null || effectiveSchoolId === '' || effectiveSchoolId === 'Select') {
      setRows([])
      setLoading(false)
      setError('')
      return
    }
    setLoading(true)
    setError('')
    try {
      if (isParent && isAllChildrenSelected) {
        const scopedChildren = uniqueScopeCombos(selectedChildren.length > 0 ? selectedChildren : parentScope.children, (child) => `${getParentChildSchoolId(child)}:${getParentChildId(child)}`)
        const responses = await Promise.all(
          scopedChildren.map((child) =>
            fetchClassRoutines({
              schoolId: getParentChildSchoolId(child),
              studentId: getParentChildId(child),
            }).catch(() => []),
          ),
        )
        setRows(dedupeByKey(responses.flat(), (row) => row?.id ?? `${row?.schoolId ?? ''}-${row?.classId ?? ''}-${row?.sectionId ?? ''}-${row?.day ?? ''}-${row?.startTime ?? ''}`))
      } else {
        const data = await fetchClassRoutines({ schoolId: effectiveSchoolId, studentId: effectiveStudentId })
        setRows(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      setRows([])
      setError(e?.message || 'Failed to load class routines')
    } finally {
      setLoading(false)
    }
  }, [isAllChildrenSelected, parentScope.children, selectedChildren])

  useEffect(() => {
    const t = setTimeout(() => {
      void loadLookups()
    }, 0)
    return () => clearTimeout(t)
  }, [loadLookups])

  useEffect(() => {
    const shouldLoad = filters.schoolId !== 'Select' && (!isParent || isAllChildrenSelected || effectiveChildId != null)
    if (!shouldLoad) return
    void loadRows(filters.schoolId, effectiveChildId)
    setHasSearched(true)
  }, [effectiveChildId, filters.schoolId, isAllChildrenSelected, isParent, loadRows])

  const validateFind = () => {
    const errs = {}
    if (pendingFilters.schoolId === 'Select') errs.schoolId = 'School is required.'
    return errs
  }

  const handleApplyFilters = async (e) => {
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
    await loadRows(pendingFilters.schoolId, effectiveChildId)
  }

  const scopedRows = useMemo(() => {
    if (!hasSearched) return []
    if (!isTeacher) return rows
    if (teacherScope === 'own') {
      return rows.filter((r) => String(r?.teacherId ?? '') === currentTeacherId)
    }
    return rows.filter((r) => assignedClassIds.includes(String(r?.classId ?? '')))
  }, [assignedClassIds, currentTeacherId, hasSearched, isTeacher, rows, teacherScope])

  const filtered = useMemo(() => {
    if (!hasSearched) return []
    const q = search.trim().toLowerCase()
    if (!q) return scopedRows
    return scopedRows.filter((r) =>
      [r?.className, r?.sectionName, r?.subjectName, r?.teacherName, r?.day, r?.startTime, r?.endTime, r?.roomNo]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [hasSearched, scopedRows, search])

  const selectedDayLabel = useMemo(() => getWeekdayNameFromDate(selectedDate), [selectedDate])

  const selectedDayRows = useMemo(() => {
    if (!hasSearched) return []
    return filtered
      .filter((r) => String(r?.day || '') === selectedDayLabel)
      .slice()
      .sort((a, b) => {
        const startDiff = parseTimeToMinutes(a?.startTime) - parseTimeToMinutes(b?.startTime)
        if (startDiff !== 0) return startDiff
        return parseTimeToMinutes(a?.endTime) - parseTimeToMinutes(b?.endTime)
      })
  }, [filtered, hasSearched, selectedDayLabel])

  const monthCalendar = useMemo(() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const firstDayIndex = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []

    for (let i = 0; i < firstDayIndex; i += 1) {
      cells.push(null)
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day)
      cells.push({
        date,
        day,
        hasRoutine: filtered.some((row) => String(row?.day || '') === getWeekdayNameFromDate(date)),
      })
    }

    while (cells.length % 7 !== 0) {
      cells.push(null)
    }

    const weeks = []
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7))
    }

    return weeks
  }, [calendarMonth, filtered])

  const weekMatrix = useMemo(() => {
    if (!hasSearched) return []

    const slotMap = new Map()
    filtered.forEach((row) => {
      const day = row?.day
      if (!dayOptions.includes(day)) return
      const slotKey = `${row?.startTime || ''}__${row?.endTime || ''}`
      if (!slotMap.has(slotKey)) {
        slotMap.set(slotKey, {
          startTime: row?.startTime || '',
          endTime: row?.endTime || '',
          cells: new Map(),
        })
      }
      const slot = slotMap.get(slotKey)
      if (!slot.cells.has(day)) {
        slot.cells.set(day, [])
      }
      slot.cells.get(day).push(row)
    })

    return Array.from(slotMap.values())
      .sort((a, b) => {
        const startDiff = parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
        if (startDiff !== 0) return startDiff
        return parseTimeToMinutes(a.endTime) - parseTimeToMinutes(b.endTime)
      })
      .map((slot) => ({
        ...slot,
        cells: dayOptions.reduce((acc, day) => {
          acc[day] = (slot.cells.get(day) || []).slice()
          return acc
        }, {}),
      }))
  }, [filtered, hasSearched])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const isDayView = viewMode === 'day'

  const getVisiblePages = () => {
    const maxButtons = 5
    if (totalPages <= maxButtons) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 3) return [1, 2, 3, 4, 5]
    if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2]
  }

  const teacherOptions = useMemo(() => {
    return (Array.isArray(teachersLookup) ? teachersLookup : [])
      .map((t) => ({ id: t?.id, name: t?.name }))
      .filter((t) => t.id != null && t.name)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [teachersLookup])

  const validateForm = (form) => {
    const errs = {}
    if (!form.schoolId || form.schoolId === 'Select') errs.schoolId = 'School is required.'
    if (!form.classId || form.classId === 'Select') errs.classId = 'Class is required.'
    if (!form.sectionId || form.sectionId === 'Select') errs.sectionId = 'Section is required.'
    if (!form.subjectId || form.subjectId === 'Select') errs.subjectId = 'Subject is required.'
    if (!form.teacherId || form.teacherId === 'Select') errs.teacherId = 'Teacher is required.'
    if (!form.day) errs.day = 'Day is required.'
    if (!form.startTime) errs.startTime = 'Start time is required.'
    if (!form.endTime) errs.endTime = 'End time is required.'
    return errs
  }

  const openAdd = () => {
    setAddForm({
      ...emptyForm,
      schoolId: filters.schoolId,
      teacherId: currentTeacherId || emptyForm.teacherId,
    })
    setFormErrors({})
    setIsAddOpen(true)
    setAddStep(0)
  }

  const openEdit = (row) => {
    setEditingId(row?.id ?? null)
    setEditForm({
      schoolId: row?.schoolId != null ? String(row.schoolId) : filters.schoolId,
      classId: row?.classId != null ? String(row.classId) : 'Select',
      sectionId: row?.sectionId != null ? String(row.sectionId) : 'Select',
      subjectId: row?.subjectId != null ? String(row.subjectId) : 'Select',
      teacherId: row?.teacherId != null ? String(row.teacherId) : 'Select',
      day: row?.day || 'Monday',
      startTime: row?.startTime || '',
      endTime: row?.endTime || '',
      roomNo: row?.roomNo || '',
    })
    setFormErrors({})
    setIsEditOpen(true)
    setEditStep(0)
  }

  const submitAdd = async () => {
    const errs = validateForm(addForm)
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      return
    }
    try {
      setSaving(true)
      setError('')
      await createClassRoutine({
        schoolId: Number(addForm.schoolId),
        classId: Number(addForm.classId),
        sectionId: Number(addForm.sectionId),
        subjectId: Number(addForm.subjectId),
        teacherId: Number(addForm.teacherId),
        day: addForm.day,
        startTime: addForm.startTime,
        endTime: addForm.endTime,
        roomNo: addForm.roomNo || null,
      })
      setIsAddOpen(false)
    await loadRows(addForm.schoolId, effectiveChildId)
    } catch (e) {
      setError(e?.message || 'Failed to create routine')
    } finally {
      setSaving(false)
    }
  }

  const submitEdit = async () => {
    if (!editingId) return
    const errs = validateForm(editForm)
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      return
    }
    try {
      setSaving(true)
      setError('')
      await updateClassRoutine(editingId, {
        id: editingId,
        schoolId: Number(editForm.schoolId),
        classId: Number(editForm.classId),
        sectionId: Number(editForm.sectionId),
        subjectId: Number(editForm.subjectId),
        teacherId: Number(editForm.teacherId),
        day: editForm.day,
        startTime: editForm.startTime,
        endTime: editForm.endTime,
        roomNo: editForm.roomNo || null,
      })
      setIsEditOpen(false)
      setEditingId(null)
      await loadRows(editForm.schoolId, effectiveChildId)
    } catch (e) {
      setError(e?.message || 'Failed to update routine')
    } finally {
      setSaving(false)
    }
  }

  const handleResetFilters = () => {
    const resetFilters = { schoolId: defaultSchoolFilter }
    setPendingFilters(resetFilters)
    setFilters(resetFilters)
    setFindErrors({})
    setSearch('')
    setCurrentPage(1)
    const today = getTodayDate()
    setSelectedDate(today)
    setCalendarMonth(startOfMonth(today))
    if (defaultSchoolFilter !== 'Select') {
      setHasSearched(true)
      void loadRows(defaultSchoolFilter, effectiveChildId)
    } else {
      setHasSearched(false)
      setRows([])
      setLoading(false)
    }
  }

  const handleDelete = async (row) => {
    if (!row?.id) return
    if (!window.confirm('Delete this class routine?')) return
    try {
      setSaving(true)
      setError('')
      await deleteClassRoutine(row.id, { schoolId: filters.schoolId })
      await loadRows(row.schoolId ?? filters.schoolId, effectiveChildId)
    } catch (e) {
      setError(e?.message || 'Failed to delete routine')
    } finally {
      setSaving(false)
    }
  }

  const renderEntryForm = (form, setForm) => {
    const localTeacherOptions = teacherOptions.filter((t) => {
      if (!form.schoolId || form.schoolId === 'Select') return true
      return String((teachersLookup.find((teacher) => String(teacher?.id) === String(t.id))?.schoolId ?? '')) === String(form.schoolId)
    })

    const localClassOptions = classesLookup
      .filter((c) => !form.schoolId || form.schoolId === 'Select' || String(c.schoolId) === String(form.schoolId))
      .filter((c) => !isTeacher || !currentTeacherId || String(c.teacherId ?? '') === currentTeacherId)
      .slice()
      .sort((a, b) => String(a.className || '').localeCompare(String(b.className || '')))

    const localSectionOptions = sectionsLookup
      .filter((s) => {
        if (!form.schoolId || form.schoolId === 'Select') return true
        if (String(s.schoolId) !== String(form.schoolId)) return false
        if (form.classId && form.classId !== 'Select' && String(s.classId) !== String(form.classId)) return false
        return true
      })
      .slice()
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))

    const localSubjectOptions = subjectsLookup
      .filter((s) => {
        if (!form.schoolId || form.schoolId === 'Select') return true
        if (String(s.schoolId) !== String(form.schoolId)) return false
        if (form.classId && form.classId !== 'Select' && String(s.classId) !== String(form.classId)) return false
        return true
      })
      .slice()
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))

    const onChange = (e) => {
      const { id, value } = e.target
      setForm((prev) => {
        if (id === 'schoolId') return { ...prev, schoolId: value, classId: 'Select', sectionId: 'Select', subjectId: 'Select', teacherId: 'Select' }
        if (id === 'classId') return { ...prev, classId: value, sectionId: 'Select', subjectId: 'Select' }
        return { ...prev, [id]: value }
      })
      setFormErrors((prev) => ({ ...prev, [id]: '' }))
    }

    return (
      <div className="avm-grid">
        <div className="avm-field">
          <label className="avm-label">
            School <span className="req"> *</span>
          </label>
          <select id="schoolId" className={`form-control form-select${formErrors.schoolId ? ' is-invalid' : ''}`} value={form.schoolId} onChange={onChange} disabled={saving}>
            <option value="Select">--Select School--</option>
            {schoolsLookup.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.schoolName}
              </option>
            ))}
          </select>
          {formErrors.schoolId ? <div className="text-danger-600 text-sm mt-4">{formErrors.schoolId}</div> : null}
        </div>

        <div className="avm-field">
          <label className="avm-label">
            Class <span className="req"> *</span>
          </label>
          <select id="classId" className={`form-control form-select${formErrors.classId ? ' is-invalid' : ''}`} value={form.classId} onChange={onChange} disabled={saving}>
            <option value="Select">--Select Class--</option>
            {localClassOptions.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.className}
              </option>
            ))}
          </select>
          {formErrors.classId ? <div className="text-danger-600 text-sm mt-4">{formErrors.classId}</div> : null}
        </div>

        <div className="avm-field">
          <label className="avm-label">
            Section <span className="req"> *</span>
          </label>
          <select id="sectionId" className={`form-control form-select${formErrors.sectionId ? ' is-invalid' : ''}`} value={form.sectionId} onChange={onChange} disabled={saving}>
            <option value="Select">--Select Section--</option>
            {localSectionOptions.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
          {formErrors.sectionId ? <div className="text-danger-600 text-sm mt-4">{formErrors.sectionId}</div> : null}
        </div>

        <div className="avm-field">
          <label className="avm-label">
            Subject <span className="req"> *</span>
          </label>
          <select id="subjectId" className={`form-control form-select${formErrors.subjectId ? ' is-invalid' : ''}`} value={form.subjectId} onChange={onChange} disabled={saving}>
            <option value="Select">--Select Subject--</option>
            {localSubjectOptions.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
          {formErrors.subjectId ? <div className="text-danger-600 text-sm mt-4">{formErrors.subjectId}</div> : null}
        </div>

        <div className="avm-field">
          <label className="avm-label">
            Teacher <span className="req"> *</span>
          </label>
          <select
            id="teacherId"
            className={`form-control form-select${formErrors.teacherId ? ' is-invalid' : ''}`}
            value={isTeacher && currentTeacherId ? currentTeacherId : form.teacherId}
            onChange={onChange}
            disabled={saving || (isTeacher && !!currentTeacherId)}
          >
            {isTeacher && currentTeacherId ? (
              <option value={currentTeacherId}>{user?.teacherName || user?.name || 'Myself'}</option>
            ) : (
              <>
                <option value="Select">--Select Teacher--</option>
                {localTeacherOptions.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.name}
                  </option>
                ))}
              </>
            )}
          </select>
          {formErrors.teacherId ? <div className="text-danger-600 text-sm mt-4">{formErrors.teacherId}</div> : null}
        </div>

        <div className="avm-field">
          <label className="avm-label">
            Day <span className="req"> *</span>
          </label>
          <select id="day" className="form-control form-select" value={form.day} onChange={onChange} disabled={saving}>
            {dayOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="avm-field">
          <label className="avm-label">
            Start Time <span className="req"> *</span>
          </label>
          <input id="startTime" type="time" className={`form-control${formErrors.startTime ? ' is-invalid' : ''}`} value={form.startTime} onChange={onChange} disabled={saving} />
          {formErrors.startTime ? <div className="text-danger-600 text-sm mt-4">{formErrors.startTime}</div> : null}
        </div>

        <div className="avm-field">
          <label className="avm-label">
            End Time <span className="req"> *</span>
          </label>
          <input id="endTime" type="time" className={`form-control${formErrors.endTime ? ' is-invalid' : ''}`} value={form.endTime} onChange={onChange} disabled={saving} />
          {formErrors.endTime ? <div className="text-danger-600 text-sm mt-4">{formErrors.endTime}</div> : null}
        </div>

        <div className="avm-field">
          <label className="avm-label">Room No</label>
          <input id="roomNo" className="form-control" value={form.roomNo} onChange={onChange} disabled={saving} />
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Class Routine</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Class Routine</span>
          </div>
        </div>
        <div className="d-flex align-items-center gap-8">
          <div className="btn-group" role="tablist" aria-label="Class routine view mode">
            {viewModes.map((mode) => (
              <button
                key={mode.key}
                type="button"
                className={viewMode === mode.key ? 'btn btn-primary-600' : 'btn btn-light border'}
                onClick={() => {
                  setViewMode(mode.key)
                  setCurrentPage(1)
                  if (mode.key === 'day') {
                    const today = getTodayDate()
                    setSelectedDate(today)
                    setCalendarMonth(startOfMonth(today))
                  }
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <div className="card mb-16">
          <div className="card-body px-20 py-12 text-danger-600">{error}</div>
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-12 p-20">
            <div className="d-flex flex-wrap align-items-center gap-8">
              {isTeacher ? (
                <div className="btn-group" role="tablist" aria-label="Teacher routine scope">
                  {teacherScopeModes.map((mode) => (
                    <button
                      key={mode.key}
                      type="button"
                      className={teacherScope === mode.key ? 'btn btn-primary-600' : 'btn btn-light border'}
                      onClick={() => {
                        setTeacherScope(mode.key)
                        setCurrentPage(1)
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="position-relative">
                <input
                  className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                  placeholder="Search..."
                  value={search}
                  disabled={!hasSearched}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                  <i className="ri-search-line"></i>
                </span>
              </div>
              <button
                type="button"
                className="btn btn-light border"
                onClick={handleResetFilters}
                disabled={!hasSearched || saving}
              >
                Reset
              </button>
              {isDayView ? (
                <div className="dropdown">
                  <button className="btn btn-light border dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Columns ({visibleColumnCount})
                  </button>
                  <ul className="dropdown-menu p-2" style={{ minWidth: 240 }}>
                    {columnOptions.map((col) => (
                      <li key={col.key} className="dropdown-item">
                        <label className="d-flex align-items-center gap-8 m-0">
                          <input type="checkbox" checked={visibleColumns[col.key]} onChange={() => toggleColumn(col.key)} />
                          <span>{col.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {isDayView ? (
                <select
                  className="form-select"
                  style={{ width: 120 }}
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  disabled={!hasSearched}
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}/page
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            <div className="d-flex align-items-center gap-8 ms-auto">
              <button type="button" className="btn btn-secondary-600" onClick={() => setIsFindSidebarOpen(true)}>
                Find
              </button>
              {canAdd('class-routine') ? (
                <button type="button" className="btn btn-primary-600" onClick={openAdd} disabled={saving}>
                  + Add
                </button>
              ) : null}
            </div>
          </div>

          <div className="table-responsive">
            {isDayView ? (
              <div className="row g-16 p-20">
                <div className="col-12 col-xl-7">
                  <div className="card h-100 border">
                    <div className="card-body">
                      <div className="d-flex flex-wrap align-items-start justify-content-between gap-12 mb-16">
                        <div>
                          <div className="text-secondary-light text-sm fw-medium">Today&apos;s Schedule</div>
                          <h4 className="fw-semibold mb-2 text-primary-light">{selectedDayLabel}</h4>
                          <div className="text-secondary-light text-sm">{selectedDate.toLocaleDateString()}</div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-light border"
                          onClick={() => {
                            const today = getTodayDate()
                            setSelectedDate(today)
                            setCalendarMonth(startOfMonth(today))
                          }}
                          disabled={!hasSearched}
                        >
                          Today
                        </button>
                      </div>

                      {loading ? (
                        <div className="text-center py-24 text-secondary-light">Loading...</div>
                      ) : !hasSearched ? (
                        <div className="text-center py-24 text-secondary-light">
                          Use <strong>Find</strong> to select School to load class routines.
                        </div>
                      ) : selectedDayRows.length === 0 ? (
                        <div className="text-center py-24 text-secondary-light">No routines found for {selectedDayLabel}.</div>
                      ) : (
                        <div className="d-grid gap-12">
                          {selectedDayRows.map((r) => (
                            <div key={r.id} className="radius-8 border p-12 bg-neutral-50">
                              <div className="d-flex align-items-start justify-content-between gap-10">
                                <div className="flex-grow-1">
                                  <div className="d-flex align-items-center justify-content-between gap-10">
                                    <div className="fw-semibold text-primary-light">{r.subjectName || r.subjectId || 'Subject'}</div>
                                    <span className="bg-primary-100 text-primary-600 px-12 py-4 radius-4 fw-medium text-sm">
                                      {formatWeekCellTime(r.startTime, r.endTime)}
                                    </span>
                                  </div>
                                  {!isReadOnlyViewer ? (
                                    <div className="text-sm text-secondary-light mt-4">
                                      Class: {r.className || r.classId}
                                      {r.sectionName || r.sectionId ? ` | Section: ${r.sectionName || r.sectionId}` : ''}
                                    </div>
                                  ) : null}
                                  <div className="text-sm text-secondary-light">
                                    Teacher: {r.teacherName || r.teacherId}
                                    {r.roomNo ? ` | Room: ${r.roomNo}` : ''}
                                  </div>
                                </div>
                                {!isReadOnlyViewer ? (
                                  <div className="d-flex align-items-center gap-6 flex-shrink-0">
                                    {canEdit('class-routine') ? (
                                      <button
                                        type="button"
                                        className="btn btn-primary-600 px-8 py-4 radius-4 d-inline-flex align-items-center justify-content-center"
                                        onClick={() => openEdit(r)}
                                        disabled={saving || (isTeacher && currentTeacherId && String(r.teacherId ?? '') !== currentTeacherId)}
                                        aria-label="Edit routine"
                                        title="Edit"
                                      >
                                        <i className="ri-pencil-line" aria-hidden="true" />
                                      </button>
                                    ) : null}
                                    {canDelete('class-routine') ? (
                                      <button
                                        type="button"
                                        className="btn btn-danger-600 px-8 py-4 radius-4 d-inline-flex align-items-center justify-content-center"
                                        onClick={() => handleDelete(r)}
                                        disabled={saving || (isTeacher && currentTeacherId && String(r.teacherId ?? '') !== currentTeacherId)}
                                        aria-label="Delete routine"
                                        title="Delete"
                                      >
                                        <i className="ri-delete-bin-line" aria-hidden="true" />
                                      </button>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-12 col-xl-5">
                  <div className="card h-100 border">
                    <div className="card-body">
                      <div className="d-flex flex-wrap align-items-start justify-content-between gap-12 mb-16 cr-month-calendar__header">
                        <div>
                          <div className="text-secondary-light text-sm fw-medium">Month Calendar</div>
                          <h4 className="fw-semibold mb-0 text-primary-light">{monthLabel(calendarMonth)}</h4>
                        </div>
                        <div className="d-flex align-items-center gap-8 cr-month-calendar__actions">
                          <button type="button" className="btn btn-sm btn-light border" onClick={() => setCalendarMonth((m) => shiftMonth(m, -1))}>
                            <i className="ri-arrow-left-s-line" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-light border"
                            onClick={() => {
                              const today = getTodayDate()
                              setSelectedDate(today)
                              setCalendarMonth(startOfMonth(today))
                            }}
                          >
                            Today
                          </button>
                          <button type="button" className="btn btn-sm btn-light border" onClick={() => setCalendarMonth((m) => shiftMonth(m, 1))}>
                            <i className="ri-arrow-right-s-line" />
                          </button>
                        </div>
                      </div>

                      <div className="cr-month-calendar__viewport">
                        <div className="cr-month-calendar__surface">
                          <div className="d-grid gap-8 text-center cr-month-calendar__week">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => (
                              <div key={`${label}-${index}`} className="text-secondary-light fw-semibold py-4">
                                {label}
                              </div>
                            ))}
                          </div>

                          <div className="d-grid gap-8 cr-month-calendar__grid">
                            {monthCalendar.flatMap((week, weekIndex) =>
                              week.map((cell, dayIndex) => {
                                if (!cell) {
                                  return <div key={`empty-${weekIndex}-${dayIndex}`} className="cr-month-calendar__day is-empty radius-8 border border-transparent" />
                                }
                                const today = getTodayDate()
                                const isSelected = isSameCalendarDay(cell.date, selectedDate)
                                const isToday = isSameCalendarDay(cell.date, today)
                                return (
                                  <button
                                    key={cell.date.toISOString()}
                                    type="button"
                                    className={`cr-month-calendar__day text-start radius-8 border p-8 ${
                                      isSelected ? 'btn-primary-600 text-white border-primary-600' : 'bg-white'
                                    }`}
                                    onClick={() => {
                                      setSelectedDate(cell.date)
                                      setCalendarMonth(startOfMonth(cell.date))
                                    }}
                                  >
                                    <div className="d-flex align-items-center justify-content-between gap-8">
                                      <span className={`fw-semibold ${isSelected ? 'text-white' : 'text-primary-light'}`}>{cell.day}</span>
                                      {cell.hasRoutine ? <span className={`radius-999 ${isSelected ? 'bg-white' : 'bg-primary-100'}`} style={{ width: 8, height: 8 }} /> : null}
                                    </div>
                                    <div className={`text-sm ${isSelected ? 'text-white' : isToday ? 'text-primary-600' : 'text-secondary-light'}`}>
                                      {cell.date.toLocaleDateString(undefined, { weekday: 'short' })}
                                    </div>
                                  </button>
                                )
                              }),
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <table className="table table-bordered align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ minWidth: 130 }}>Time / Day</th>
                    {dayOptions.map((day) => (
                      <th key={day} style={{ minWidth: 180 }}>
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={dayOptions.length + 1} className="text-center py-24 text-secondary-light">
                        Loading...
                      </td>
                    </tr>
                  ) : !hasSearched ? (
                    <tr>
                      <td colSpan={dayOptions.length + 1} className="text-center py-24 text-secondary-light">
                        Use <strong>Find</strong> to select School to load class routines.
                      </td>
                    </tr>
                  ) : weekMatrix.length === 0 ? (
                    <tr>
                      <td colSpan={dayOptions.length + 1} className="text-center py-24 text-secondary-light">
                        No routines found.
                      </td>
                    </tr>
                  ) : (
                    weekMatrix.map((slot) => (
                      <tr key={`${slot.startTime}-${slot.endTime}`}>
                        <td className="fw-semibold text-primary-light">{formatWeekCellTime(slot.startTime, slot.endTime)}</td>
                        {dayOptions.map((day) => {
                          const cellRows = slot.cells[day] || []
                          return (
                            <td key={`${slot.startTime}-${slot.endTime}-${day}`} style={{ verticalAlign: 'top' }}>
                              {cellRows.length === 0 ? (
                                <span className="text-secondary-light">---</span>
                              ) : (
                                <div className="d-grid gap-8">
                                  {cellRows.map((r) => (
                                    <div key={r.id} className="radius-8 border p-8 bg-neutral-50">
                                      <div className="d-flex align-items-start justify-content-between gap-8">
                                        <div className="flex-grow-1">
                                          <div className="d-flex align-items-center justify-content-between gap-8">
                                            <div className="fw-semibold text-primary-light">{r.subjectName || r.subjectId || 'Subject'}</div>
                                            {!isReadOnlyViewer ? (
                                              <div className="d-flex align-items-center gap-6 flex-shrink-0">
                                              {canEdit('class-routine') ? (
                                                <button
                                                  type="button"
                                                  className="btn btn-primary-600 px-8 py-4 radius-4 d-inline-flex align-items-center justify-content-center"
                                                  onClick={() => openEdit(r)}
                                                  disabled={saving || (isTeacher && currentTeacherId && String(r.teacherId ?? '') !== currentTeacherId)}
                                                  aria-label="Edit routine"
                                                  title="Edit"
                                                >
                                                  <i className="ri-pencil-line" aria-hidden="true" />
                                                </button>
                                              ) : null}
                                              {canDelete('class-routine') ? (
                                                <button
                                                  type="button"
                                                  className="btn btn-danger-600 px-8 py-4 radius-4 d-inline-flex align-items-center justify-content-center"
                                                  onClick={() => handleDelete(r)}
                                                  disabled={saving || (isTeacher && currentTeacherId && String(r.teacherId ?? '') !== currentTeacherId)}
                                                  aria-label="Delete routine"
                                                  title="Delete"
                                                >
                                                  <i className="ri-delete-bin-line" aria-hidden="true" />
                                                </button>
                                              ) : null}
                                              </div>
                                            ) : null}
                                          </div>
                                          {!isReadOnlyViewer ? (
                                            <div className="text-sm text-secondary-light">
                                              {r.className || r.classId}
                                              {r.sectionName || r.sectionId ? ` | ${r.sectionName || r.sectionId}` : ''}
                                            </div>
                                          ) : null}
                                          <div className="text-sm text-secondary-light">
                                            {r.teacherName || r.teacherId}
                                            {r.roomNo ? ` | Room ${r.roomNo}` : ''}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="d-none">
                                        {canEdit('class-routine') ? (
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-primary-600 d-inline-flex align-items-center justify-content-center"
                                            onClick={() => openEdit(r)}
                                            disabled={saving || (isTeacher && currentTeacherId && String(r.teacherId ?? '') !== currentTeacherId)}
                                            aria-label="Edit routine"
                                            title="Edit"
                                          >
                                            <i className="ri-pencil-line" aria-hidden="true" />
                                          </button>
                                        ) : null}
                                        {canDelete('class-routine') ? (
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-danger-600 d-inline-flex align-items-center justify-content-center"
                                            onClick={() => handleDelete(r)}
                                            disabled={saving || (isTeacher && currentTeacherId && String(r.teacherId ?? '') !== currentTeacherId)}
                                            aria-label="Delete routine"
                                            title="Delete"
                                          >
                                            <i className="ri-delete-bin-line" aria-hidden="true" />
                                          </button>
                                        ) : null}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {isDayView ? (
            <div className="d-flex align-items-center justify-content-end p-20 flex-wrap gap-16">
              <div className="d-flex align-items-center gap-8">
                <button
                  type="button"
                  className="btn btn-sm btn-light border"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!hasSearched || currentPage === 1}
                >
                  Prev
                </button>
                {getVisiblePages().map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'}
                    onClick={() => setCurrentPage(p)}
                    disabled={!hasSearched}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-sm btn-light border"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={!hasSearched || currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <WizardPopup modalWidth="900px" open={isAddOpen} title="Add Class Routine" steps={STEPS} step={addStep} onClose={() => setIsAddOpen(false)} onBack={() => setAddStep((s) => Math.max(0, s - 1))} onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))} onSubmit={submitAdd} submitLabel={saving ? 'Saving...' : 'Save'}>
        {renderEntryForm(addForm, setAddForm)}
      </WizardPopup>

      <WizardPopup modalWidth="900px" open={isEditOpen} title="Edit Class Routine" steps={STEPS} step={editStep} onClose={() => setIsEditOpen(false)} onBack={() => setEditStep((s) => Math.max(0, s - 1))} onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))} onSubmit={submitEdit} submitLabel={saving ? 'Updating...' : 'Update'}>
        {renderEntryForm(editForm, setEditForm)}
      </WizardPopup>

      <SlideSidebar isOpen={isFindSidebarOpen} title="Find Class Routine" onClose={() => setIsFindSidebarOpen(false)} className="filter-sidebar">
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School <span className="text-danger-600">*</span>
            </label>
            <select id="schoolId" className={`form-control form-select${findErrors.schoolId ? ' is-invalid' : ''}`} value={pendingFilters.schoolId} onChange={(e) => { setPendingFilters({ schoolId: e.target.value }); setFindErrors({}) }}>
              <option value="Select">--Select School--</option>
              {schoolsLookup.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.schoolName}
                </option>
              ))}
            </select>
            {findErrors.schoolId ? <div className="text-danger-600 text-sm mt-4">{findErrors.schoolId}</div> : null}
          </div>
          <div>
            <button type="submit" className="btn btn-primary-600 w-100" disabled={loading}>
              Apply
            </button>
          </div>
          <div>
            <button type="button" className="btn btn-danger-200 text-danger-600 w-100" onClick={() => { setPendingFilters(emptyFilters); setFilters(emptyFilters); setHasSearched(false); setRows([]) }}>
              Reset
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default ClassRoutine
