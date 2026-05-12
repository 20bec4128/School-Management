import { useCallback, useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { createLesson, deleteLesson, fetchLessons, updateLesson } from '../apis/lessonsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import '../assets/css/addModalShared.css'
import FindEmptyState from '../components/FindEmptyState'

const ACADEMIC_YEAR_OPTIONS = ['2025-2026', '2024-2025', '2023-2024', '2022-2023']

const emptyForm = {
  schoolId: 'Select',
  academicYear: 'Select',
  classId: 'Select',
  subjectId: 'Select',
  lesson: '',
  note: '',
}

const emptyFilters = {
  schoolId: 'Select',
  academicYear: 'Select',
  classId: 'Select',
  subjectId: 'Select',
}

const STEPS = ['Basic']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Academic Year': 'ri-calendar-line',
  Class: 'ri-building-line',
  Subject: 'ri-book-open-line',
  Lesson: 'ri-file-list-3-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'academicYear', label: 'Academic Year' },
  { key: 'className', label: 'Class' },
  { key: 'subjectName', label: 'Subject' },
  { key: 'lesson', label: 'Lesson' },
  { key: 'note', label: 'Note' },
]

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

const Lesson = () => {
  const { role, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId, isSchoolSelectionEnabled } = useSchool()
  const [lessons, setLessons] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
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

  const [addQueue, setAddQueue] = useState([])
  const [formErrors, setFormErrors] = useState({})

  const [isFindSidebarOpen, setIsFindSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [findErrors, setFindErrors] = useState({})
  const [hasSearched, setHasSearched] = useState(false)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)
  const roleUpper = String(role || '').toUpperCase()
  const isTeacherScope = roleUpper === 'TEACHER'
  const canAddLesson = roleUpper !== 'STUDENT' && roleUpper !== 'PARENT'
  const resolvedSchoolId = activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
  const resolvedSchoolName = authSchoolName || ''
  const resolvedSchoolLabel = resolvedSchoolName || (resolvedSchoolId ? `School ${resolvedSchoolId}` : '')
  const isSchoolLocked = !isSchoolSelectionEnabled && !!resolvedSchoolId
  const effectiveSchoolsLookup = useMemo(() => {
    const byId = new Map((Array.isArray(schoolsLookup) ? schoolsLookup : []).map((school) => [String(school?.id), school]))
    if (resolvedSchoolId && !byId.has(String(resolvedSchoolId))) {
      byId.set(String(resolvedSchoolId), {
        id: resolvedSchoolId,
        schoolName: resolvedSchoolName || `School ${resolvedSchoolId}`,
      })
    }
    return Array.from(byId.values()).sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
  }, [resolvedSchoolId, resolvedSchoolName, schoolsLookup])

  useEffect(() => {
    let ignore = false
    const run = async () => {
      try {
        setLoading(true)
        setError('')
        const [schoolsResult, classesResult, subjectsResult] = await Promise.allSettled([
          fetchSchoolsLookup(),
          fetchClasses(),
          fetchSubjects(),
        ])
        if (ignore) return
        const schools = schoolsResult.status === 'fulfilled' ? schoolsResult.value : []
        const classes = classesResult.status === 'fulfilled' ? classesResult.value : []
        const subjects = subjectsResult.status === 'fulfilled' ? subjectsResult.value : []
        setSchoolsLookup(Array.isArray(schools) ? schools : [])
        setClassesLookup(Array.isArray(classes) ? classes : [])
        setSubjectsLookup(Array.isArray(subjects) ? subjects : [])
      } catch (e) {
        if (!ignore) setError(e?.message || 'Failed to load lookups')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void run()
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!isTeacherScope || !resolvedSchoolId) return
    setPendingFilters((prev) => (prev.schoolId === 'Select' ? { ...prev, schoolId: resolvedSchoolId } : prev))
    setFilters((prev) => (prev.schoolId === 'Select' ? { ...prev, schoolId: resolvedSchoolId } : prev))
  }, [isTeacherScope, resolvedSchoolId])

  const classOptions = useMemo(() => {
    return classesLookup
      .filter((c) => pendingFilters.schoolId === 'Select' || String(c.schoolId) === String(pendingFilters.schoolId))
      .slice()
      .sort((a, b) => String(a.className || '').localeCompare(String(b.className || '')))
  }, [classesLookup, pendingFilters.schoolId])

  const subjectOptions = useMemo(() => {
    return subjectsLookup
      .filter((s) => {
        if (pendingFilters.schoolId !== 'Select' && String(s.schoolId) !== String(pendingFilters.schoolId)) return false
        if (pendingFilters.classId !== 'Select' && String(s.classId) !== String(pendingFilters.classId)) return false
        return true
      })
      .slice()
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
  }, [subjectsLookup, pendingFilters.schoolId, pendingFilters.classId])

  const validateFind = () => {
    const errs = {}
    if (!isTeacherScope && pendingFilters.schoolId === 'Select') errs.schoolId = 'School is required.'
    if (pendingFilters.academicYear === 'Select') errs.academicYear = 'Academic Year is required.'
    if (pendingFilters.classId === 'Select') errs.classId = 'Class is required.'
    if (pendingFilters.subjectId === 'Select') errs.subjectId = 'Subject is required.'
    return errs
  }

  const loadLessons = useCallback(
    async (nextFilters) => {
      const data = await fetchLessons({
        schoolId: isTeacherScope ? resolvedSchoolId : nextFilters.schoolId,
        academicYear: nextFilters.academicYear,
        classId: nextFilters.classId,
        subjectId: nextFilters.subjectId,
      })
      setLessons(Array.isArray(data) ? data : [])
    },
    [isTeacherScope, resolvedSchoolId, setLessons],
  )

  const handleApplyFilters = async (e) => {
    e.preventDefault()
    const errs = validateFind()
    if (Object.keys(errs).length > 0) {
      setFindErrors(errs)
      return
    }
    try {
      setFindErrors({})
      setError('')
      setLoading(true)
      const nextFilters = isTeacherScope
        ? { ...pendingFilters, schoolId: resolvedSchoolId }
        : pendingFilters
      await loadLessons(nextFilters)
      setFilters(nextFilters)
      setHasSearched(true)
      setIsFindSidebarOpen(false)
      setCurrentPage(1)
      setSelectedRows([])
    } catch (e2) {
      setLessons([])
      setError(e2?.message || 'Failed to load lessons')
    } finally {
      setLoading(false)
    }
  }

  const handleResetFilters = () => {
    const next = isTeacherScope
      ? { ...emptyFilters, schoolId: resolvedSchoolId || 'Select' }
      : emptyFilters
    setPendingFilters(next)
    setFilters(next)
    setFindErrors({})
    setHasSearched(false)
    setLessons([])
    setSearch('')
    setCurrentPage(1)
    setSelectedRows([])
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => {
      if (isTeacherScope && id === 'schoolId') return prev
      if (id === 'schoolId') return { ...prev, schoolId: value, classId: 'Select', subjectId: 'Select' }
      if (id === 'classId') return { ...prev, classId: value, subjectId: 'Select' }
      return { ...prev, [id]: value }
    })
    setFindErrors((prev) => ({ ...prev, [id]: '' }))
  }

  const filtered = useMemo(() => {
    if (!hasSearched) return []
    const q = search.trim().toLowerCase()
    if (!q) return lessons
    return lessons.filter((r) =>
      [r?.schoolName, r?.academicYear, r?.className, r?.subjectName, r?.lesson, r?.note]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [lessons, search, hasSearched])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((r) => selectedRows.includes(r.id))

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((r) => r.id)])])
    else setSelectedRows((prev) => prev.filter((id) => !paginated.some((r) => r.id === id)))
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const openAdd = () => {
    if (!canAddLesson) return
    setAddForm({
      ...emptyForm,
      ...filters,
      ...(resolvedSchoolId ? { schoolId: resolvedSchoolId } : {}),
    })
    setAddQueue([])
    setFormErrors({})
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row?.id ?? null)
    setEditForm({
      schoolId: row?.schoolId != null ? String(row.schoolId) : resolvedSchoolId || 'Select',
      academicYear: row?.academicYear || 'Select',
      classId: row?.classId != null ? String(row.classId) : 'Select',
      subjectId: row?.subjectId != null ? String(row.subjectId) : 'Select',
      lesson: row?.lesson || '',
      note: row?.note || '',
    })
    setFormErrors({})
    setEditStep(0)
    setIsEditOpen(true)
  }

  const validateEntryForm = (form) => {
    const errs = {}
    if (!isTeacherScope && (!form.schoolId || form.schoolId === 'Select')) errs.schoolId = 'School is required.'
    if (!form.academicYear || form.academicYear === 'Select') errs.academicYear = 'Academic Year is required.'
    if (!form.classId || form.classId === 'Select') errs.classId = 'Class is required.'
    if (!form.subjectId || form.subjectId === 'Select') errs.subjectId = 'Subject is required.'
    if (!String(form.lesson || '').trim()) errs.lesson = 'Lesson is required.'
    return errs
  }

  const handleAddMore = () => {
    if (!canAddLesson) return
    const errs = validateEntryForm(addForm)
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      return
    }
    setFormErrors({})
    setAddQueue((prev) => [
      ...prev,
      {
        schoolId: isTeacherScope ? resolvedSchoolId : addForm.schoolId,
        academicYear: addForm.academicYear,
        classId: addForm.classId,
        subjectId: addForm.subjectId,
        lesson: addForm.lesson,
        note: addForm.note,
      },
    ])
    setAddForm((prev) => ({ ...prev, lesson: '', note: '' }))
  }

  const submitAdd = async () => {
    if (!canAddLesson) return
    const entries = [...addQueue]
    if (String(addForm.lesson || '').trim()) {
      const errs = validateEntryForm(addForm)
      if (Object.keys(errs).length > 0) {
        setFormErrors(errs)
        return
      }
      entries.push({
        schoolId: isTeacherScope ? resolvedSchoolId : addForm.schoolId,
        academicYear: addForm.academicYear,
        classId: addForm.classId,
        subjectId: addForm.subjectId,
        lesson: addForm.lesson,
        note: addForm.note,
      })
    }

    if (entries.length === 0) {
      setFormErrors({ lesson: 'Add at least one lesson.' })
      return
    }

    try {
      setSaving(true)
      setError('')
      for (const entry of entries) {
        await createLesson({
          schoolId: Number(isTeacherScope ? resolvedSchoolId : entry.schoolId),
          academicYear: entry.academicYear,
          classId: Number(entry.classId),
          subjectId: Number(entry.subjectId),
          lesson: entry.lesson,
          note: entry.note,
        })
      }
      setIsAddOpen(false)
      setAddQueue([])
      setAddForm(emptyForm)
      if (hasSearched) await loadLessons(filters)
    } catch (e) {
      setError(e?.message || 'Failed to create lesson')
    } finally {
      setSaving(false)
    }
  }

  const submitEdit = async () => {
    if (!editingId) return
    const errs = validateEntryForm(editForm)
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      return
    }
    try {
      setSaving(true)
      setError('')
      await updateLesson(editingId, {
        id: editingId,
        schoolId: Number(isTeacherScope ? resolvedSchoolId : editForm.schoolId),
        academicYear: editForm.academicYear,
        classId: Number(editForm.classId),
        subjectId: Number(editForm.subjectId),
        lesson: editForm.lesson,
        note: editForm.note,
      })
      setIsEditOpen(false)
      setEditingId(null)
      if (hasSearched) await loadLessons(filters)
    } catch (e) {
      setError(e?.message || 'Failed to update lesson')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    const id = row?.id
    if (!id) return
    if (!window.confirm(`Delete lesson "${row?.lesson || id}"?`)) return
    try {
      setSaving(true)
      setError('')
      await deleteLesson(id)
      if (hasSearched) await loadLessons(filters)
    } catch (e) {
      setError(e?.message || 'Failed to delete lesson')
    } finally {
      setSaving(false)
    }
  }

  const renderEntryForm = (form, setForm) => {
    const localClassOptions = classesLookup
      .filter((c) => isTeacherScope || !form.schoolId || form.schoolId === 'Select' || String(c.schoolId) === String(form.schoolId))
      .slice()
      .sort((a, b) => String(a.className || '').localeCompare(String(b.className || '')))

    const localSubjectOptions = subjectsLookup
      .filter((s) => {
        const schoolFilterId = isTeacherScope ? resolvedSchoolId : form.schoolId
        if (!schoolFilterId || schoolFilterId === 'Select') return true
        if (String(s.schoolId) !== String(schoolFilterId)) return false
        if (form.classId && form.classId !== 'Select' && String(s.classId) !== String(form.classId)) return false
        return true
      })
      .slice()
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))

    const onChange = (e) => {
      const { id, value } = e.target
      setForm((prev) => {
        if (id === 'schoolId') return { ...prev, schoolId: value, classId: 'Select', subjectId: 'Select' }
        if (id === 'classId') return { ...prev, classId: value, subjectId: 'Select' }
        return { ...prev, [id]: value }
      })
      setFormErrors((prev) => ({ ...prev, [id]: '' }))
    }

    return (
      <div className="avm-grid">
        <FormField label="School Name" required>
          {isTeacherScope ? (
            <input
              className="form-control ps-44"
              value={resolvedSchoolLabel}
              readOnly
            />
          ) : (
            <select
              id="schoolId"
              className={`form-control form-select ps-44${formErrors.schoolId ? ' is-invalid' : ''}`}
              value={form.schoolId}
              onChange={onChange}
              disabled={saving || isSchoolLocked}
            >
              <option value="Select">--Select School--</option>
              {effectiveSchoolsLookup.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.schoolName}
                </option>
              ))}
            </select>
          )}
          {formErrors.schoolId ? <div className="text-danger-600 text-sm mt-4">{formErrors.schoolId}</div> : null}
        </FormField>

        <FormField label="Academic Year" required>
          <select
            id="academicYear"
            className={`form-control form-select ps-44${formErrors.academicYear ? ' is-invalid' : ''}`}
            value={form.academicYear}
            onChange={onChange}
            disabled={saving}
          >
            <option value="Select">--Select--</option>
            {ACADEMIC_YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          {formErrors.academicYear ? <div className="text-danger-600 text-sm mt-4">{formErrors.academicYear}</div> : null}
        </FormField>

        <FormField label="Class" required>
          <select
            id="classId"
            className={`form-control form-select ps-44${formErrors.classId ? ' is-invalid' : ''}`}
            value={form.classId}
            onChange={onChange}
            disabled={saving}
          >
            <option value="Select">--Select Class--</option>
            {localClassOptions.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.className}
              </option>
            ))}
          </select>
          {formErrors.classId ? <div className="text-danger-600 text-sm mt-4">{formErrors.classId}</div> : null}
        </FormField>

        <FormField label="Subject" required>
          <select
            id="subjectId"
            className={`form-control form-select ps-44${formErrors.subjectId ? ' is-invalid' : ''}`}
            value={form.subjectId}
            onChange={onChange}
            disabled={saving}
          >
            <option value="Select">--Select Subject--</option>
            {localSubjectOptions.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
          {formErrors.subjectId ? <div className="text-danger-600 text-sm mt-4">{formErrors.subjectId}</div> : null}
        </FormField>

        <FormField label="Lesson" required full>
          <input
            id="lesson"
            className={`form-control ps-44${formErrors.lesson ? ' is-invalid' : ''}`}
            value={form.lesson}
            onChange={onChange}
            disabled={saving}
            placeholder="Enter lesson"
          />
          {formErrors.lesson ? <div className="text-danger-600 text-sm mt-4">{formErrors.lesson}</div> : null}
        </FormField>

        <FormField label="Note" full>
          <textarea
            id="note"
            className="form-control ps-44"
            rows={3}
            value={form.note}
            onChange={onChange}
            disabled={saving}
            placeholder="Optional note"
          />
        </FormField>
      </div>
    )
  }

  const getVisiblePages = () => {
    const maxButtons = 5
    if (totalPages <= maxButtons) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 3) return [1, 2, 3, 4, 5]
    if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2]
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Lesson</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Lesson</span>
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
            </div>

            <div className="d-flex align-items-center gap-8 ms-auto">
              <button type="button" className="btn btn-secondary-600" onClick={() => setIsFindSidebarOpen(true)}>
                Find
              </button>
              {canAddLesson ? (
                <button type="button" className="btn btn-primary-600" onClick={openAdd} disabled={saving}>
                  + Add
                </button>
              ) : null}
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-striped align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: 48 }}>
                    <input
                      type="checkbox"
                      checked={hasSearched && allSelected}
                      onChange={handleSelectAll}
                      disabled={!hasSearched || loading}
                    />
                  </th>
                  {visibleColumns.school && <th>School</th>}
                  {visibleColumns.academicYear && <th>Academic Year</th>}
                  {visibleColumns.className && <th>Class</th>}
                  {visibleColumns.subjectName && <th>Subject</th>}
                  {visibleColumns.lesson && <th>Lesson</th>}
                  {visibleColumns.note && <th>Note</th>}
                  <th style={{ width: 160 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {!hasSearched ? (
                  <tr>
                    <td colSpan={8} className="text-center py-24 text-secondary-light">
                      <FindEmptyState
                        title="Lesson"
                        description="Use the Find button to select School, Academic Year, Class and Subject to load lessons."
                        buttonLabel="Find Lessons"
                        onFind={() => setIsFindSidebarOpen(true)}
                      />
                    </td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-24 text-secondary-light">
                      Loading...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-24 text-secondary-light">
                      No lessons found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <input type="checkbox" checked={selectedRows.includes(r.id)} onChange={() => handleSelectRow(r.id)} />
                      </td>
                      {visibleColumns.school && <td>{r.schoolName}</td>}
                      {visibleColumns.academicYear && <td>{r.academicYear}</td>}
                      {visibleColumns.className && <td>{r.className}</td>}
                      {visibleColumns.subjectName && <td>{r.subjectName}</td>}
                      {visibleColumns.lesson && <td className="fw-medium text-primary-light">{r.lesson}</td>}
                      {visibleColumns.note && <td>{r.note}</td>}
                      <td>
                        <div className="d-flex gap-8">
                          <button type="button" className="btn btn-sm btn-primary-600" onClick={() => openEdit(r)} disabled={saving}>
                            Edit
                          </button>
                          <button type="button" className="btn btn-sm btn-danger-600" onClick={() => handleDelete(r)} disabled={saving}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {hasSearched && !loading ? (
            <div className="d-flex align-items-center justify-content-end p-20 flex-wrap gap-16">
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
          ) : null}
        </div>
      </div>

      <WizardPopup
        modalWidth="700px"
        open={isAddOpen}
        title="Add Lesson"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={submitAdd}
        submitLabel={saving ? 'Saving...' : 'Save'}
      >
        {renderEntryForm(addForm, setAddForm)}

        <div className="d-flex justify-content-end gap-8 mt-12">
          <button type="button" className="btn btn-light border" onClick={handleAddMore} disabled={saving}>
            Add More
          </button>
        </div>

        {addQueue.length > 0 ? (
          <div className="mt-12 border rounded p-12">
            <div className="fw-semibold text-primary-light mb-8">Queued ({addQueue.length})</div>
            <ul className="mb-0 ps-16">
              {addQueue.map((q, idx) => (
                <li key={`${q.lesson}-${idx}`} className="d-flex align-items-center justify-content-between gap-12">
                  <span className="text-secondary-light">{q.lesson}</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border"
                    onClick={() => setAddQueue((prev) => prev.filter((_, i) => i !== idx))}
                    disabled={saving}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </WizardPopup>

      <WizardPopup
        modalWidth="700px"
        open={isEditOpen}
        title="Edit Lesson"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={submitEdit}
        submitLabel={saving ? 'Updating...' : 'Update'}
      >
        {renderEntryForm(editForm, setEditForm)}
      </WizardPopup>

      <SlideSidebar isOpen={isFindSidebarOpen} title="Find Lesson" onClose={() => setIsFindSidebarOpen(false)} className="filter-sidebar">
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School <span className="text-danger-600">*</span>
            </label>
            {isTeacherScope ? (
              <input className="form-control" value={resolvedSchoolLabel} readOnly />
            ) : (
              <select
                id="schoolId"
                className={`form-control form-select${findErrors.schoolId ? ' is-invalid' : ''}`}
                value={pendingFilters.schoolId}
                onChange={handlePendingFilterChange}
              >
                <option value="Select">--Select School--</option>
                {schoolsLookup.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.schoolName}
                  </option>
                ))}
              </select>
            )}
            {findErrors.schoolId ? <div className="text-danger-600 text-sm mt-4">{findErrors.schoolId}</div> : null}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="academicYear" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Academic Year <span className="text-danger-600">*</span>
            </label>
            <select
              id="academicYear"
              className={`form-control form-select${findErrors.academicYear ? ' is-invalid' : ''}`}
              value={pendingFilters.academicYear}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {ACADEMIC_YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {findErrors.academicYear ? <div className="text-danger-600 text-sm mt-4">{findErrors.academicYear}</div> : null}
          </div>

          <div>
            <label htmlFor="classId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class <span className="text-danger-600">*</span>
            </label>
            <select
              id="classId"
              className={`form-control form-select${findErrors.classId ? ' is-invalid' : ''}`}
              value={pendingFilters.classId}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {classOptions.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.className}
                </option>
              ))}
            </select>
            {findErrors.classId ? <div className="text-danger-600 text-sm mt-4">{findErrors.classId}</div> : null}
          </div>

          <div>
            <label htmlFor="subjectId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Subject <span className="text-danger-600">*</span>
            </label>
            <select
              id="subjectId"
              className={`form-control form-select${findErrors.subjectId ? ' is-invalid' : ''}`}
              value={pendingFilters.subjectId}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {subjectOptions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
            {findErrors.subjectId ? <div className="text-danger-600 text-sm mt-4">{findErrors.subjectId}</div> : null}
          </div>

          <div></div>

          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
              Reset
            </button>
          </div>
          <div>
            <button type="submit" className="btn btn-primary-600 w-100" disabled={loading}>
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default Lesson
