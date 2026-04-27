import { useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { fetchSchoolsPage } from '../apis/schoolsApi'
import { fetchStudentsByClassSection } from '../apis/studentsApi'
import {
  createStudentActivity,
  deleteStudentActivity,
  fetchStudentActivitiesPage,
  updateStudentActivity,
} from '../apis/studentActivityApi'
import '../assets/css/addModalShared.css'

const emptyForm = {
  schoolId: '',
  schoolName: '',
  className: '',
  section: '',
  studentId: '',
  studentName: '',
  date: '',
  activity: '',
  description: '',
}

const emptyFilters = {
  schoolId: 'Select',
  className: 'Select',
  section: 'Select',
}

const STEPS = ['Basic']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Class: 'ri-book-open-line',
  Section: 'ri-layout-grid-line',
  Student: 'ri-user-3-line',
  Date: 'ri-calendar-2-line',
  Activity: 'ri-medal-line',
  Description: 'ri-file-text-line',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'studentName', label: 'Student' },
  { key: 'className', label: 'Class' },
  { key: 'section', label: 'Section' },
  { key: 'activity', label: 'Activity' },
  { key: 'date', label: 'Date' },
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

const StudentActivity = () => {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [activities, setActivities] = useState([])
  const [schools, setSchools] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // ── Table state ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [selectedRows, setSelectedRows] = useState([])

  // ── Modal / sidebar state ────────────────────────────────────────────────────
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  // ── Derived options ──────────────────────────────────────────────────────────
  const schoolOptions = useMemo(() => schools.map(s => ({ id: s.id, name: s.schoolName })), [schools])
  
  const filterClassOptions = useMemo(() => {
    const classes = new Set()
    activities.forEach(item => {
      if (item.className) classes.add(item.className)
    })
    return Array.from(classes).sort()
  }, [activities])
  
  const filterSectionOptions = useMemo(() => {
    const sections = new Set()
    activities.forEach(item => {
      if (item.section) sections.add(item.section)
    })
    return Array.from(sections).sort()
  }, [activities])

  // ── Dynamic dropdown options ─────────────────────────────────────────────────
  const getClassOptions = () => {
    if (!addForm.schoolId) return []
    const school = schools.find(s => s.id === Number(addForm.schoolId))
    if (!school || !school.classes) return []
    return school.classes || []
  }

  const getSectionOptions = () => {
    if (!addForm.schoolId || !addForm.className) return []
    const school = schools.find(s => s.id === Number(addForm.schoolId))
    if (!school || !school.sections || !school.sections[addForm.className]) return []
    return school.sections[addForm.className] || []
  }

  // ── Fetch students when class and section change ─────────────────────────────
  useEffect(() => {
    let cancelled = false
    const loadStudents = async () => {
      if (!addForm.schoolId || !addForm.className || !addForm.section) {
        setStudents([])
        return
      }
      try {
        const data = await fetchStudentsByClassSection(addForm.schoolId, addForm.className, addForm.section)
        if (!cancelled) setStudents(data)
      } catch {
        if (!cancelled) setStudents([])
      }
    }
    loadStudents()
    return () => { cancelled = true }
  }, [addForm.schoolId, addForm.className, addForm.section])

  useEffect(() => {
    let cancelled = false
    const loadStudents = async () => {
      if (!editForm.schoolId || !editForm.className || !editForm.section) {
        return
      }
      try {
        const data = await fetchStudentsByClassSection(editForm.schoolId, editForm.className, editForm.section)
        if (!cancelled) setStudents(data)
      } catch {
        if (!cancelled) setStudents([])
      }
    }
    loadStudents()
    return () => { cancelled = true }
  }, [editForm.schoolId, editForm.className, editForm.section])

  // ── Filtering (client-side within the current page) ──────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return activities.filter((row) => {
      const matchesSearch =
        !q ||
        [row.schoolName, row.studentName, row.className, row.section, row.activity, row.date]
          .join(' ')
          .toLowerCase()
          .includes(q)

      const matchesSchool = filters.schoolId === 'Select' || 
        (filters.schoolId && row.schoolId === Number(filters.schoolId))
      const matchesClass = filters.className === 'Select' || row.className === filters.className
      const matchesSection = filters.section === 'Select' || row.section === filters.section

      return matchesSearch && matchesSchool && matchesClass && matchesSection
    })
  }, [activities, search, filters])

  const allSelected = filtered.length > 0 && filtered.every((row) => selectedRows.includes(row.id))

  // ── Data fetching ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const apiFilters = {
          schoolId: filters.schoolId !== 'Select' ? filters.schoolId : null,
          className: filters.className !== 'Select' ? filters.className : null,
          section: filters.section !== 'Select' ? filters.section : null,
        }
        const data = await fetchStudentActivitiesPage(currentPage - 1, rowsPerPage, apiFilters)
        if (cancelled) return
        if (Array.isArray(data)) {
          setActivities(data)
          setTotalElements(data.length)
          setTotalPages(1)
        } else {
          setActivities(Array.isArray(data?.content) ? data.content : [])
          setTotalElements(Number.isFinite(data?.totalElements) ? data.totalElements : 0)
          setTotalPages(Math.max(1, Number.isFinite(data?.totalPages) ? data.totalPages : 1))
        }
      } catch (e) {
        if (cancelled) return
        setActivities([])
        setTotalElements(0)
        setTotalPages(1)
        setError(e?.message || 'Failed to load student activities')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [currentPage, rowsPerPage, refreshKey, filters])

  // ── Load schools for dropdown ────────────────────────────────────────────────
  useEffect(() => {
    fetchSchoolsPage(0, 200)
      .then((data) => {
        const list = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : [])
        setSchools(list)
      })
      .catch(() => setSchools([]))
  }, [])

  // ── Selection helpers ────────────────────────────────────────────────────────
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...filtered.map((row) => row.id)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !filtered.some((row) => row.id === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    )
  }

  // ── Form helpers ─────────────────────────────────────────────────────────────
  const handleChange = (setter) => (e) => {
    const { id, value } = e.target

    setter((prev) => {
      if (id === 'schoolId') {
        const selectedSchool = schools.find(s => s.id === Number(value))
        return {
          ...prev,
          schoolId: value,
          schoolName: selectedSchool?.schoolName || '',
          className: '',
          section: '',
          studentId: '',
          studentName: '',
        }
      }

      if (id === 'className') {
        return {
          ...prev,
          className: value,
          section: '',
          studentId: '',
          studentName: '',
        }
      }

      if (id === 'section') {
        return {
          ...prev,
          section: value,
          studentId: '',
          studentName: '',
        }
      }

      if (id === 'studentId') {
        const selectedStudent = students.find(s => s.id === Number(value))
        return {
          ...prev,
          studentId: value,
          studentName: selectedStudent?.name || '',
        }
      }

      return { ...prev, [id]: value }
    })
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
    setRefreshKey((k) => k + 1)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
    setRefreshKey((k) => k + 1)
  }

  // ── Open modals ──────────────────────────────────────────────────────────────
  const openAdd = () => {
    setError('')
    setEditingId(null)
    setAddForm(emptyForm)
    setStudents([])
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setError('')
    setEditingId(row.id)
    setEditForm({
      id: row.id,
      schoolId: row.schoolId || '',
      schoolName: row.schoolName || '',
      className: row.className || '',
      section: row.section || '',
      studentId: row.studentId || '',
      studentName: row.studentName || '',
      date: row.date || '',
      activity: row.activity || '',
      description: row.description || '',
    })
    setEditStep(0)
    setIsEditOpen(true)
  }

  // ── CRUD handlers ────────────────────────────────────────────────────────────
  const buildPayload = (form) => ({
    schoolId: form.schoolId ? Number(form.schoolId) : null,
    studentId: form.studentId ? Number(form.studentId) : null,
    className: form.className || '',
    section: form.section || '',
    date: form.date || '',
    activity: form.activity || '',
    description: form.description || '',
  })

  const handleCreate = async () => {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await createStudentActivity(buildPayload(addForm))
      setIsAddOpen(false)
      setAddForm(emptyForm)
      setAddStep(0)
      setCurrentPage(1)
      setRefreshKey((k) => k + 1)
    } catch (e) {
      setError(e?.message || 'Failed to create student activity')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (saving) return
    if (!editingId) { setError('No record selected for update'); return }
    setSaving(true)
    setError('')
    try {
      await updateStudentActivity(editingId, buildPayload(editForm))
      setIsEditOpen(false)
      setEditForm(emptyForm)
      setEditStep(0)
      setEditingId(null)
      setRefreshKey((k) => k + 1)
    } catch (e) {
      setError(e?.message || 'Failed to update student activity')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!id) return
    if (!window.confirm('Delete this student activity? This cannot be undone.')) return
    setSaving(true)
    setError('')
    try {
      await deleteStudentActivity(id)
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id))
      setRefreshKey((k) => k + 1)
    } catch (e) {
      setError(e?.message || 'Failed to delete student activity')
    } finally {
      setSaving(false)
    }
  }

  // ── Pagination ───────────────────────────────────────────────────────────────
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  // ── Form renderer ─────────────────────────────────────────────────────────────
  const renderForm = (form, setter) => {
    const classOptions = getClassOptions()
    const sectionOptions = getSectionOptions()
    const currentStudents = students

    return (
      <>
        <p className="avm-section-title">Basic Information</p>
        <div className="avm-grid">
          <FormField label="School Name" required full>
            <select 
              className="avm-select" 
              id="schoolId" 
              value={form.schoolId} 
              onChange={handleChange(setter)}
            >
              <option value="">--Select School--</option>
              {schoolOptions.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Class" required>
            <select
              className="avm-select"
              id="className"
              value={form.className}
              onChange={handleChange(setter)}
              disabled={!form.schoolId}
            >
              <option value="">--Select--</option>
              {classOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Section" required>
            <select
              className="avm-select"
              id="section"
              value={form.section}
              onChange={handleChange(setter)}
              disabled={!form.className}
            >
              <option value="">--Select--</option>
              {sectionOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Student" required full>
            <select
              className="avm-select"
              id="studentId"
              value={form.studentId}
              onChange={handleChange(setter)}
              disabled={!form.section}
            >
              <option value="">--Select Student--</option>
              {currentStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.admissionNo})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Date" required>
            <input
              type="date"
              className="avm-input"
              id="date"
              value={form.date}
              onChange={handleChange(setter)}
            />
          </FormField>

          <FormField label="Activity" required full>
            <input
              type="text"
              className="avm-input"
              id="activity"
              placeholder="Enter activity (e.g., Science Exhibition, Football Practice)"
              value={form.activity}
              onChange={handleChange(setter)}
            />
          </FormField>

          <FormField label="Description" full noIcon>
            <textarea
              rows="3"
              className="avm-input avm-textarea"
              id="description"
              placeholder="Additional details about the activity..."
              value={form.description}
              onChange={handleChange(setter)}
            />
          </FormField>
        </div>
      </>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Student Activity</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Student Activity</span>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-12">
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={openAdd}
          >
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add Student Activity
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-8" role="alert">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      )}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {/* ── Toolbar ── */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              {/* Export */}
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
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
                      <i className="ri-file-3-line"></i> PDF
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
                      <i className="ri-file-excel-2-line"></i> Excel
                    </button>
                  </li>
                </ul>
              </div>

              {/* Filter */}
              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              {/* Columns */}
              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
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

              {/* Rows per page */}
              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search student activity..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1050 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.schoolName && <th scope="col">School</th>}
                  {visibleColumns.studentName && <th scope="col">Student</th>}
                  {visibleColumns.className && <th scope="col">Class</th>}
                  {visibleColumns.section && <th scope="col">Section</th>}
                  {visibleColumns.activity && <th scope="col">Activity</th>}
                  {visibleColumns.date && <th scope="col">Date</th>}
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading student activities...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No student activities found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">
                            {(currentPage - 1) * rowsPerPage + idx + 1}
                          </label>
                        </div>
                      </td>
                      {visibleColumns.schoolName && <td>{row.schoolName}</td>}
                      {visibleColumns.studentName && (
                        <td className="fw-medium text-primary-light">{row.studentName}</td>
                      )}
                      {visibleColumns.className && <td>{row.className}</td>}
                      {visibleColumns.section && <td>{row.section}</td>}
                      {visibleColumns.activity && <td>{row.activity}</td>}
                      {visibleColumns.date && <td>{row.date}</td>}
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
                            disabled={saving}
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} –{' '}
              {totalElements === 0 ? 0 : Math.min((currentPage - 1) * rowsPerPage + paginated.length, totalElements)} of {totalElements}
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

      {/* ── Add Modal ── */}
      <WizardPopup
        modalWidth="600px"
        open={isAddOpen}
        title="Add Student Activity"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleCreate}
        submitLabel={saving ? 'Saving…' : 'Save'}
      >
        {renderForm(addForm, setAddForm, false)}
      </WizardPopup>

      {/* ── Edit Modal ── */}
      <WizardPopup
        modalWidth="600px"
        open={isEditOpen}
        title="Edit Student Activity"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleUpdate}
        submitLabel={saving ? 'Saving…' : 'Update'}
      >
        {renderForm(editForm, setEditForm, true)}
      </WizardPopup>

      {/* ── Filter Sidebar ── */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Student Activity"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School
            </label>
            <select
              id="schoolId"
              className="form-control form-select"
              value={pendingFilters.schoolId}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select School</option>
              {schoolOptions.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="className" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class
            </label>
            <select
              id="className"
              className="form-control form-select"
              value={pendingFilters.className}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Class</option>
              {filterClassOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="section" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Section
            </label>
            <select
              id="section"
              className="form-control form-select"
              value={pendingFilters.section}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Section</option>
              {filterSectionOptions.map((option) => (
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
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default StudentActivity