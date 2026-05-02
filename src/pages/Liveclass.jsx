import { useCallback, useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import {
  createLiveClass,
  deleteLiveClass,
  endLiveClass,
  fetchLiveClasses,
  joinLiveClass,
  leaveLiveClass,
  startLiveClass,
  updateLiveClass,
} from '../apis/liveClassesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { fetchTeachers } from '../apis/teachersApi'
import { can } from '../utils/permissions'
import { useAuth } from '../context/AuthContext'
import '../assets/css/addModalShared.css'

const STEPS = ['Basic Info']

const emptyForm = {
  schoolId: 'Select',
  classId: 'Select',
  sectionId: 'Select',
  subjectId: 'Select',
  teacherId: 'Select',
  liveClassType: 'Zoom',
  meetingLink: '',
  classDate: '',
  startTime: '',
  endTime: '',
  note: '',
  sendNotification: false,
  status: 'Scheduled',
}

const emptyFilters = {
  schoolId: 'Select',
  classId: 'Select',
  sectionId: 'Select',
  subjectId: 'Select',
  status: 'Select',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'className', label: 'Class' },
  { key: 'sectionName', label: 'Section' },
  { key: 'subjectName', label: 'Subject' },
  { key: 'teacherName', label: 'Teacher' },
  { key: 'classDate', label: 'Class Date' },
  { key: 'startTime', label: 'Start Time' },
  { key: 'endTime', label: 'End Time' },
  { key: 'status', label: 'Status' },
]

const statusBadge = (status) => {
  if (status === 'Live') return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (status === 'Scheduled') return 'bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (status === 'Completed') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (status === 'Cancelled') return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
}

const LiveClass = () => {
  const { user } = useAuth()
  const canManage = can(user, ['LIVE_CLASS_MANAGE', 'LIVE_CLASS_MANAGE_ASSIGNED', '*'])
  const canJoin = can(user, ['LIVE_CLASS_JOIN', 'LIVE_CLASS_MANAGE', 'LIVE_CLASS_MANAGE_ASSIGNED', '*'])

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
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
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

  const loadRows = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchLiveClasses()
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setRows([])
      setError(e?.message || 'Failed to load live classes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLookups()
    void loadRows()
  }, [loadLookups, loadRows])

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
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
  }, [sectionsLookup, pendingFilters.schoolId, pendingFilters.classId])

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

  const teacherOptions = useMemo(() => {
    return (Array.isArray(teachersLookup) ? teachersLookup : [])
      .map((t) => ({ id: t?.id, name: t?.name }))
      .filter((t) => t.id != null && t.name)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [teachersLookup])

  const validateFind = () => {
    const errs = {}
    if (pendingFilters.schoolId === 'Select') errs.schoolId = 'School is required.'
    if (pendingFilters.classId === 'Select') errs.classId = 'Class is required.'
    if (pendingFilters.sectionId === 'Select') errs.sectionId = 'Section is required.'
    if (pendingFilters.subjectId === 'Select') errs.subjectId = 'Subject is required.'
    return errs
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
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setFindErrors({})
    setHasSearched(false)
    setSearch('')
    setCurrentPage(1)
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => {
      if (id === 'schoolId') return { ...prev, schoolId: value, classId: 'Select', sectionId: 'Select', subjectId: 'Select' }
      if (id === 'classId') return { ...prev, classId: value, sectionId: 'Select', subjectId: 'Select' }
      if (id === 'sectionId') return { ...prev, sectionId: value }
      return { ...prev, [id]: value }
    })
    setFindErrors((prev) => ({ ...prev, [id]: '' }))
  }

  const filtered = useMemo(() => {
    if (!hasSearched) return []
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      const scopeOk =
        String(r.schoolId) === String(filters.schoolId) &&
        String(r.classId) === String(filters.classId) &&
        String(r.sectionId) === String(filters.sectionId) &&
        String(r.subjectId) === String(filters.subjectId) &&
        (filters.status === 'Select' || String(r.status) === String(filters.status))
      if (!scopeOk) return false
      if (!q) return true
      return [r.teacherName, r.liveClassType, r.classDate, r.status].filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [rows, hasSearched, search, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const validateForm = (form) => {
    const errs = {}
    if (!form.schoolId || form.schoolId === 'Select') errs.schoolId = 'School is required.'
    if (!form.classId || form.classId === 'Select') errs.classId = 'Class is required.'
    if (!form.sectionId || form.sectionId === 'Select') errs.sectionId = 'Section is required.'
    if (!form.subjectId || form.subjectId === 'Select') errs.subjectId = 'Subject is required.'
    if (!form.teacherId || form.teacherId === 'Select') errs.teacherId = 'Teacher is required.'
    if (!form.classDate) errs.classDate = 'Class date is required.'
    if (!form.startTime) errs.startTime = 'Start time is required.'
    if (!form.endTime) errs.endTime = 'End time is required.'
    if (!String(form.liveClassType || '').trim()) errs.liveClassType = 'Live class type is required.'
    return errs
  }

  const openAdd = () => {
    setAddForm({ ...emptyForm, ...filters })
    setFormErrors({})
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row?.id ?? null)
    setEditForm({
      schoolId: row?.schoolId != null ? String(row.schoolId) : 'Select',
      classId: row?.classId != null ? String(row.classId) : 'Select',
      sectionId: row?.sectionId != null ? String(row.sectionId) : 'Select',
      subjectId: row?.subjectId != null ? String(row.subjectId) : 'Select',
      teacherId: row?.teacherId != null ? String(row.teacherId) : 'Select',
      liveClassType: row?.liveClassType || 'Zoom',
      meetingLink: row?.meetingLink || '',
      classDate: row?.classDate || '',
      startTime: row?.startTime ? String(row.startTime).slice(0, 5) : '',
      endTime: row?.endTime ? String(row.endTime).slice(0, 5) : '',
      note: row?.note || '',
      sendNotification: false,
      status: row?.status || 'Scheduled',
    })
    setFormErrors({})
    setEditStep(0)
    setIsEditOpen(true)
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
      await createLiveClass({
        schoolId: Number(addForm.schoolId),
        classId: Number(addForm.classId),
        sectionId: Number(addForm.sectionId),
        subjectId: Number(addForm.subjectId),
        teacherId: Number(addForm.teacherId),
        liveClassType: addForm.liveClassType,
        meetingLink: addForm.meetingLink || null,
        classDate: addForm.classDate,
        startTime: addForm.startTime,
        endTime: addForm.endTime,
        note: addForm.note || null,
        sendNotification: !!addForm.sendNotification,
        status: addForm.status || 'Scheduled',
      })
      setIsAddOpen(false)
      await loadRows()
    } catch (e) {
      setError(e?.message || 'Failed to create live class')
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
      await updateLiveClass(editingId, {
        schoolId: Number(editForm.schoolId),
        classId: Number(editForm.classId),
        sectionId: Number(editForm.sectionId),
        subjectId: Number(editForm.subjectId),
        teacherId: Number(editForm.teacherId),
        liveClassType: editForm.liveClassType,
        meetingLink: editForm.meetingLink || null,
        classDate: editForm.classDate,
        startTime: editForm.startTime,
        endTime: editForm.endTime,
        note: editForm.note || null,
        sendNotification: !!editForm.sendNotification,
        status: editForm.status || 'Scheduled',
      })
      setIsEditOpen(false)
      setEditingId(null)
      await loadRows()
    } catch (e) {
      setError(e?.message || 'Failed to update live class')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    const id = row?.id
    if (!id) return
    if (!window.confirm('Delete this live class?')) return
    try {
      setSaving(true)
      setError('')
      await deleteLiveClass(id)
      await loadRows()
    } catch (e) {
      setError(e?.message || 'Failed to delete live class')
    } finally {
      setSaving(false)
    }
  }

  const handleStart = async (row) => {
    try {
      setSaving(true)
      setError('')
      await startLiveClass(row.id)
      await loadRows()
    } catch (e) {
      setError(e?.message || 'Failed to start live class')
    } finally {
      setSaving(false)
    }
  }

  const handleEnd = async (row) => {
    try {
      setSaving(true)
      setError('')
      await endLiveClass(row.id)
      await loadRows()
    } catch (e) {
      setError(e?.message || 'Failed to end live class')
    } finally {
      setSaving(false)
    }
  }

  const handleJoin = async (row) => {
    try {
      setSaving(true)
      setError('')
      const res = await joinLiveClass(row.id)
      const url = res?.meetingRoomUrl || res?.url || res?.meetingLink || row.meetingLink
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      setError(e?.message || 'Failed to join live class')
    } finally {
      setSaving(false)
    }
  }

  const handleLeave = async (row) => {
    try {
      setSaving(true)
      setError('')
      await leaveLiveClass(row.id)
    } catch (e) {
      setError(e?.message || 'Failed to leave live class')
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
      const { id, value, type, checked } = e.target
      setForm((prev) => {
        if (id === 'schoolId') return { ...prev, schoolId: value, classId: 'Select', sectionId: 'Select', subjectId: 'Select' }
        if (id === 'classId') return { ...prev, classId: value, sectionId: 'Select', subjectId: 'Select' }
        return { ...prev, [id]: type === 'checkbox' ? checked : value }
      })
      setFormErrors((prev) => ({ ...prev, [id]: '' }))
    }

    return (
      <div className="avm-grid">
        <div className="avm-field">
          <label className="avm-label">
            School Name <span className="req"> *</span>
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
            Live Class Type <span className="req"> *</span>
          </label>
          <input id="liveClassType" className={`form-control${formErrors.liveClassType ? ' is-invalid' : ''}`} value={form.liveClassType} onChange={onChange} disabled={saving} />
          {formErrors.liveClassType ? <div className="text-danger-600 text-sm mt-4">{formErrors.liveClassType}</div> : null}
        </div>

        <div className="avm-field full">
          <label className="avm-label">Meeting Link</label>
          <input id="meetingLink" className="form-control" value={form.meetingLink} onChange={onChange} disabled={saving} placeholder="https://..." />
        </div>

        <div className="avm-field">
          <label className="avm-label">
            Class Date <span className="req"> *</span>
          </label>
          <input id="classDate" type="date" className={`form-control${formErrors.classDate ? ' is-invalid' : ''}`} value={form.classDate} onChange={onChange} disabled={saving} />
          {formErrors.classDate ? <div className="text-danger-600 text-sm mt-4">{formErrors.classDate}</div> : null}
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

        <div className="avm-field full">
          <label className="avm-label">Status</label>
          <select id="status" className="form-control form-select" value={form.status} onChange={onChange} disabled={saving}>
            {['Scheduled', 'Live', 'Completed', 'Cancelled'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="avm-field full">
          <label className="avm-label">Note</label>
          <textarea id="note" className="form-control" rows={3} value={form.note} onChange={onChange} disabled={saving} />
        </div>

        <div className="avm-field full">
          <label className="d-flex align-items-center gap-8">
            <input id="sendNotification" type="checkbox" checked={!!form.sendNotification} onChange={onChange} disabled={saving} />
            <span className="text-secondary-light">Send Notification</span>
          </label>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Live Class</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Live Class</span>
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
                <button type="button" className="btn btn-primary-600" onClick={openAdd} disabled={saving}>
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
            <div className="px-20 py-40 text-center text-secondary-light">
              Use <strong>Find</strong> to select School, Class, Section and Subject.
            </div>
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
                      {visibleColumns.classDate && <th>Date</th>}
                      {visibleColumns.startTime && <th>Start</th>}
                      {visibleColumns.endTime && <th>End</th>}
                      {visibleColumns.status && <th>Status</th>}
                      <th style={{ width: 280 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-24 text-secondary-light">
                          No live classes found.
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
                          {visibleColumns.classDate && <td>{r.classDate}</td>}
                          {visibleColumns.startTime && <td>{String(r.startTime || '').slice(0, 5)}</td>}
                          {visibleColumns.endTime && <td>{String(r.endTime || '').slice(0, 5)}</td>}
                          {visibleColumns.status && (
                            <td>
                              <span className={statusBadge(r.status)}>{r.status}</span>
                            </td>
                          )}
                          <td>
                            <div className="d-flex gap-8 flex-wrap">
                              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEdit(r)} disabled={!canManage || saving}>
                                Edit
                              </button>
                              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r)} disabled={!canManage || saving}>
                                Delete
                              </button>
                              <button type="button" className="btn btn-sm btn-primary-600" onClick={() => handleStart(r)} disabled={!canManage || saving}>
                                Start
                              </button>
                              <button type="button" className="btn btn-sm btn-success-600" onClick={() => handleJoin(r)} disabled={!canJoin || saving}>
                                Join
                              </button>
                              <button type="button" className="btn btn-sm btn-light border" onClick={() => handleLeave(r)} disabled={!canJoin || saving}>
                                Leave
                              </button>
                              <button type="button" className="btn btn-sm btn-warning-600" onClick={() => handleEnd(r)} disabled={!canManage || saving}>
                                End
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

      <WizardPopup modalWidth="900px" open={isAddOpen} title="Add Live Class" steps={STEPS} step={addStep} onClose={() => setIsAddOpen(false)} onBack={() => setAddStep((s) => Math.max(0, s - 1))} onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))} onSubmit={submitAdd} submitLabel={saving ? 'Saving...' : 'Save'}>
        {renderEntryForm(addForm, setAddForm)}
      </WizardPopup>

      <WizardPopup modalWidth="900px" open={isEditOpen} title="Edit Live Class" steps={STEPS} step={editStep} onClose={() => setIsEditOpen(false)} onBack={() => setEditStep((s) => Math.max(0, s - 1))} onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))} onSubmit={submitEdit} submitLabel={saving ? 'Updating...' : 'Update'}>
        {renderEntryForm(editForm, setEditForm)}
      </WizardPopup>

      <SlideSidebar isOpen={isFindSidebarOpen} title="Find Live Class" onClose={() => setIsFindSidebarOpen(false)} className="filter-sidebar">
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School <span className="text-danger-600">*</span>
            </label>
            <select id="schoolId" className={`form-control form-select${findErrors.schoolId ? ' is-invalid' : ''}`} value={pendingFilters.schoolId} onChange={handlePendingFilterChange}>
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
            <label htmlFor="classId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class <span className="text-danger-600">*</span>
            </label>
            <select id="classId" className={`form-control form-select${findErrors.classId ? ' is-invalid' : ''}`} value={pendingFilters.classId} onChange={handlePendingFilterChange}>
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
            <label htmlFor="sectionId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Section <span className="text-danger-600">*</span>
            </label>
            <select id="sectionId" className={`form-control form-select${findErrors.sectionId ? ' is-invalid' : ''}`} value={pendingFilters.sectionId} onChange={handlePendingFilterChange}>
              <option value="Select">--Select--</option>
              {sectionOptions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
            {findErrors.sectionId ? <div className="text-danger-600 text-sm mt-4">{findErrors.sectionId}</div> : null}
          </div>

          <div>
            <label htmlFor="subjectId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Subject <span className="text-danger-600">*</span>
            </label>
            <select id="subjectId" className={`form-control form-select${findErrors.subjectId ? ' is-invalid' : ''}`} value={pendingFilters.subjectId} onChange={handlePendingFilterChange}>
              <option value="Select">--Select--</option>
              {subjectOptions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
            {findErrors.subjectId ? <div className="text-danger-600 text-sm mt-4">{findErrors.subjectId}</div> : null}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="status" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Status (Optional)
            </label>
            <select id="status" className="form-control form-select" value={pendingFilters.status} onChange={handlePendingFilterChange}>
              <option value="Select">--All--</option>
              {['Scheduled', 'Live', 'Completed', 'Cancelled'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

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

export default LiveClass

