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
import { can } from '../utils/permissions'
import { useAuth } from '../context/AuthContext'
import '../assets/css/addModalShared.css'

const STEPS = ['Basic Info']
const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

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

const ClassRoutine = () => {
  const { user, schoolId } = useAuth()
  const canManage = can(user, ['CLASS_ROUTINE_MANAGE', '*'])

  const [rows, setRows] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [teachersLookup, setTeachersLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [sectionsLookup, setSectionsLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

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
    schoolId: schoolId != null ? String(schoolId) : 'Select',
  }))
  const [filters, setFilters] = useState(() => ({
    schoolId: schoolId != null ? String(schoolId) : 'Select',
  }))
  const [findErrors, setFindErrors] = useState({})
  const [hasSearched, setHasSearched] = useState(false)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const loadLookups = useCallback(async () => {
    const [schools, teachers, classes, sections, subjects] = await Promise.all([
      fetchSchoolsLookup(),
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
  }, [])

  const loadRows = useCallback(async (effectiveSchoolId) => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchClassRoutines({ schoolId: effectiveSchoolId })
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setRows([])
      setError(e?.message || 'Failed to load class routines')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLookups()
    if (filters.schoolId !== 'Select') {
      void loadRows(filters.schoolId)
      setHasSearched(true)
    }
  }, [loadLookups]) // eslint-disable-line react-hooks/exhaustive-deps

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
    await loadRows(pendingFilters.schoolId)
  }

  const filtered = useMemo(() => {
    if (!hasSearched) return []
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      [r?.className, r?.sectionName, r?.subjectName, r?.teacherName, r?.day, r?.startTime, r?.endTime, r?.roomNo]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [rows, hasSearched, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

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
    setAddForm({ ...emptyForm, schoolId: filters.schoolId })
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
      await loadRows(filters.schoolId)
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
      await loadRows(filters.schoolId)
    } catch (e) {
      setError(e?.message || 'Failed to update routine')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!row?.id) return
    if (!window.confirm('Delete this class routine?')) return
    try {
      setSaving(true)
      setError('')
      await deleteClassRoutine(row.id, { schoolId: filters.schoolId })
      await loadRows(filters.schoolId)
    } catch (e) {
      setError(e?.message || 'Failed to delete routine')
    } finally {
      setSaving(false)
    }
  }

  const renderEntryForm = (form, setForm) => {
    const localClassOptions = classesLookup
      .filter((c) => !form.schoolId || form.schoolId === 'Select' || String(c.schoolId) === String(form.schoolId))
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
        if (id === 'schoolId') return { ...prev, schoolId: value, classId: 'Select', sectionId: 'Select', subjectId: 'Select' }
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
          <select id="teacherId" className={`form-control form-select${formErrors.teacherId ? ' is-invalid' : ''}`} value={form.teacherId} onChange={onChange} disabled={saving}>
            <option value="Select">--Select Teacher--</option>
            {teacherOptions.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.name}
              </option>
            ))}
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
      </div>

      {error ? (
        <div className="card mb-16">
          <div className="card-body px-20 py-12 text-danger-600">{error}</div>
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 p-20">
            <div className="d-flex align-items-center gap-8">
              {canManage ? (
                <button type="button" className="btn btn-primary-600" onClick={openAdd} disabled={saving || !hasSearched}>
                  + Add
                </button>
              ) : null}
              <button type="button" className="btn btn-secondary-600" onClick={() => setIsFindSidebarOpen(true)}>
                Find
              </button>
            </div>
            <div className="d-flex align-items-center gap-8">
              <div className="position-relative">
                <input className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search..." value={search} disabled={!hasSearched} onChange={(e) => setSearch(e.target.value)} />
                <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                  <i className="ri-search-line"></i>
                </span>
              </div>
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
            </div>
          </div>

          {!hasSearched ? (
            <div className="px-20 py-40 text-center text-secondary-light">Use <strong>Find</strong> to select School.</div>
          ) : loading ? (
            <div className="px-20 py-40 text-center text-secondary-light">Loading...</div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      {visibleColumns.school && <th>School</th>}
                      {visibleColumns.className && <th>Class</th>}
                      {visibleColumns.sectionName && <th>Section</th>}
                      {visibleColumns.subjectName && <th>Subject</th>}
                      {visibleColumns.teacherName && <th>Teacher</th>}
                      {visibleColumns.day && <th>Day</th>}
                      {visibleColumns.startTime && <th>Start</th>}
                      {visibleColumns.endTime && <th>End</th>}
                      {visibleColumns.roomNo && <th>Room</th>}
                      <th style={{ width: 160 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-24 text-secondary-light">
                          No routines found.
                        </td>
                      </tr>
                    ) : (
                      paginated.map((r) => (
                        <tr key={r.id}>
                          {visibleColumns.school && <td>{r.schoolName || r.schoolId}</td>}
                          {visibleColumns.className && <td>{r.className || r.classId}</td>}
                          {visibleColumns.sectionName && <td>{r.sectionName || r.sectionId}</td>}
                          {visibleColumns.subjectName && <td>{r.subjectName || r.subjectId}</td>}
                          {visibleColumns.teacherName && <td>{r.teacherName || r.teacherId}</td>}
                          {visibleColumns.day && (
                            <td>
                              <span className={dayBadgeColor(r.day)}>{r.day}</span>
                            </td>
                          )}
                          {visibleColumns.startTime && <td>{r.startTime}</td>}
                          {visibleColumns.endTime && <td>{r.endTime}</td>}
                          {visibleColumns.roomNo && <td>{r.roomNo || '-'}</td>}
                          <td>
                            <div className="d-flex gap-8">
                              <button type="button" className="btn btn-sm btn-primary-600" onClick={() => openEdit(r)} disabled={!canManage || saving}>
                                Edit
                              </button>
                              <button type="button" className="btn btn-sm btn-danger-600" onClick={() => handleDelete(r)} disabled={!canManage || saving}>
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

              <div className="d-flex align-items-center justify-content-between p-20 flex-wrap gap-16">
                <div className="d-flex align-items-center gap-8">
                  <span className="text-secondary-light">Rows per page:</span>
                  <select className="form-select form-select-sm" style={{ width: 90 }} value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }}>
                    {[5, 10, 20, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="d-flex align-items-center gap-8">
                  <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    Prev
                  </button>
                  <span className="text-secondary-light text-sm">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
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

