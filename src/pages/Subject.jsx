import { useCallback, useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { createSubject, deleteSubject, fetchSubjects, updateSubject } from '../apis/subjectsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchTeachers } from '../apis/teachersApi'
import '../assets/css/addModalShared.css'

const subjectTypeOptions = ['Core', 'Elective', 'Optional', 'Co-Curricular']

const emptyForm = {
  schoolId: '',
  name: '',
  subjectCode: '',
  author: '',
  type: '',
  classId: '',
  teacherId: '',
  note: '',
}

const emptyFilters = {
  school: 'Select',
  className: 'Select',
  type: 'Select',
  teacher: 'Select',
}

const STEPS = ['Basic Info', 'Class & Teacher']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Name: 'ri-book-open-line',
  'Subject Code': 'ri-barcode-line',
  Author: 'ri-quill-pen-line',
  Type: 'ri-price-tag-3-line',
  Class: 'ri-building-line',
  Teacher: 'ri-user-3-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'name', label: 'Name' },
  { key: 'subjectCode', label: 'Subject Code' },
  { key: 'className', label: 'Class' },
  { key: 'teacher', label: 'Teacher' },
]

const typeBadge = (type) => {
  if (type === 'Core') return 'bg-primary-100 text-primary-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (type === 'Elective') return 'bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (type === 'Optional') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
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

const Subject = () => {
  const [subjects, setSubjects] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [teachersLookup, setTeachersLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
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
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const loadLookups = useCallback(async () => {
    const [schools, teachers] = await Promise.all([fetchSchoolsLookup(), fetchTeachers()])
    setSchoolsLookup(Array.isArray(schools) ? schools : [])
    const teacherRows = Array.isArray(teachers) ? teachers : []
    setTeachersLookup(
      teacherRows
        .map((t) => ({ id: t?.id, name: t?.name }))
        .filter((t) => t.id != null && t.name)
        .sort((a, b) => a.name.localeCompare(b.name)),
    )
  }, [])

  const loadClassesForSchool = useCallback(async (schoolId) => {
    if (!schoolId) {
      setClassesLookup([])
      return
    }
    const data = await fetchClasses({ schoolId })
    setClassesLookup(Array.isArray(data) ? data : [])
  }, [])

  const loadSubjects = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchSubjects()
      setSubjects(Array.isArray(data) ? data : [])
    } catch (e) {
      setSubjects([])
      setError(e?.message || 'Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

  useEffect(() => {
    void loadSubjects()
  }, [loadSubjects])

  const schoolOptions = useMemo(() => {
    const fromRows = subjects.map((r) => r?.school).filter(Boolean)
    return Array.from(new Set(fromRows)).sort()
  }, [subjects])

  const teacherFilterOptions = useMemo(() => {
    const fromRows = subjects.map((r) => r?.teacher).filter(Boolean)
    return Array.from(new Set(fromRows)).sort()
  }, [subjects])

  const classFilterOptions = useMemo(() => {
    const fromRows = subjects.map((r) => r?.className).filter(Boolean)
    return Array.from(new Set(fromRows)).sort()
  }, [subjects])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return subjects.filter((r) => {
      const matchesSearch =
        !q ||
        [r?.school, r?.name, r?.subjectCode, r?.className, r?.teacher, r?.type]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesSchool = filters.school === 'Select' || r?.school === filters.school
      const matchesClass = filters.className === 'Select' || r?.className === filters.className
      const matchesType = filters.type === 'Select' || r?.type === filters.type
      const matchesTeacher = filters.teacher === 'Select' || r?.teacher === filters.teacher
      return matchesSearch && matchesSchool && matchesClass && matchesType && matchesTeacher
    })
  }, [subjects, search, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected =
    paginated.length > 0 && paginated.every((r) => selectedRows.includes(r.id))

  const handleSelectAll = (e) => {
    if (e.target.checked)
      setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((r) => r.id)])])
    else setSelectedRows((prev) => prev.filter((id) => !paginated.some((r) => r.id === id)))
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

  const handleSchoolChange = (setter) => async (e) => {
    const schoolId = e.target.value
    setter((prev) => ({ ...prev, schoolId, classId: '' }))
    await loadClassesForSchool(schoolId)
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
  }

  const openAdd = () => {
    setError('')
    setEditingId(null)
    setAddForm(emptyForm)
    setAddStep(0)
    setIsAddOpen(true)
    setClassesLookup([])
  }

  const openEdit = (row) => {
    setError('')
    setEditingId(row?.id ?? null)
    const schoolId = row?.schoolId != null ? String(row.schoolId) : ''
    void loadClassesForSchool(schoolId)
    setEditForm({
      schoolId,
      name: row?.name || '',
      subjectCode: row?.subjectCode || '',
      author: row?.author || '',
      type: row?.type || '',
      classId: row?.classId != null ? String(row.classId) : '',
      teacherId: row?.teacherId != null ? String(row.teacherId) : '',
      note: row?.note || '',
    })
    setEditStep(0)
    setIsEditOpen(true)
  }

  const buildPayload = (form) => ({
    schoolId: form.schoolId ? Number(form.schoolId) : null,
    classId: form.classId ? Number(form.classId) : null,
    teacherId: form.teacherId ? Number(form.teacherId) : null,
    name: form.name || '',
    subjectCode: form.subjectCode || '',
    author: form.author || '',
    type: form.type || '',
    note: form.note || '',
  })

  const handleCreate = async () => {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      const created = await createSubject(buildPayload(addForm))
      setSubjects((prev) => [created, ...prev])
      setIsAddOpen(false)
      setAddForm(emptyForm)
      setAddStep(0)
      setCurrentPage(1)
    } catch (e) {
      setError(e?.message || 'Failed to create subject')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (saving) return
    if (!editingId) {
      setError('No subject selected for update')
      return
    }
    setSaving(true)
    setError('')
    try {
      const updated = await updateSubject(editingId, buildPayload(editForm))
      setSubjects((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      setIsEditOpen(false)
      setEditForm(emptyForm)
      setEditStep(0)
      setEditingId(null)
    } catch (e) {
      setError(e?.message || 'Failed to update subject')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!id) return
    const confirmed = window.confirm('Delete this subject? This cannot be undone.')
    if (!confirmed) return

    setSaving(true)
    setError('')
    try {
      await deleteSubject(id)
      setSubjects((prev) => prev.filter((r) => r.id !== id))
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id))
    } catch (e) {
      setError(e?.message || 'Failed to delete subject')
    } finally {
      setSaving(false)
    }
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  const renderForm = (form, setter, step) => (
    <>
      <p className="avm-section-title">{STEPS[step]}</p>
      <div className="avm-grid">

        {step === 0 && (
          <>
            <FormField label="School Name" required full>
              <select
                className="avm-select"
                id="schoolId"
                value={form.schoolId}
                onChange={handleSchoolChange(setter)}
              >
                <option value="">--Select School--</option>
                {schoolsLookup.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.schoolName}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Name" required full>
              <input
                type="text"
                className="avm-input"
                id="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Subject Code">
              <input
                type="text"
                className="avm-input"
                id="subjectCode"
                placeholder="Subject Code"
                value={form.subjectCode}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Author">
              <input
                type="text"
                className="avm-input"
                id="author"
                placeholder="Author"
                value={form.author}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Type" full>
              <select
                className="avm-select"
                id="type"
                value={form.type}
                onChange={handleChange(setter)}
              >
                <option value="">--Select--</option>
                {subjectTypeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>
          </>
        )}

        {step === 1 && (
          <>
            <FormField label="Class" required full>
              <select
                className="avm-select"
                id="classId"
                value={form.classId}
                onChange={handleChange(setter)}
                disabled={!form.schoolId}
              >
                <option value="">--Select--</option>
                {classesLookup.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.className}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Teacher" required full>
              <select
                className="avm-select"
                id="teacherId"
                value={form.teacherId}
                onChange={handleChange(setter)}
              >
                <option value="">--Select--</option>
                {teachersLookup.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.name}
                  </option>
                ))}
              </select>
            </FormField>

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

  return (
    <div className="dashboard-main-body">
      {/* Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Subject</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Subject</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={openAdd}
        >
          <span className="d-flex text-md">
            <i className="ri-add-large-line"></i>
          </span>
          Add Subject
        </button>
      </div>

      {/* Table Card */}
      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {/* Toolbar */}
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

              {/* Filter */}
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

              {/* Columns */}
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

              {/* Rows per page */}
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

            {/* Search */}
            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search subjects..."
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

          {/* Table */}
          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.subjectCode ? <th scope="col">Subject Code</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.teacher ? <th scope="col">Teacher</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount}
                      className="text-center py-40 text-secondary-light"
                    >
                      No subjects found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">{row.id}</label>
                        </div>
                      </td>
                      {visibleColumns.school ? <td>{row.school}</td> : null}
                      {visibleColumns.name ? (
                        <td>
                          <span className="fw-medium text-primary-light d-block">{row.name}</span>
                          {row.type && (
                            <span className={typeBadge(row.type)} style={{ marginTop: 4, display: 'inline-block' }}>
                              {row.type}
                            </span>
                          )}
                        </td>
                      ) : null}
                      {visibleColumns.subjectCode ? (
                        <td>
                          <span className="bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm">
                            {row.subjectCode}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.className ? <td>{row.className}</td> : null}
                      {visibleColumns.teacher ? <td>{row.teacher}</td> : null}
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
                            title="Delete"
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

          {/* Pagination */}
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
                  className={
                    p === currentPage
                      ? 'btn btn-sm btn-primary-600'
                      : 'btn btn-sm btn-light border'
                  }
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

      {/* Add Modal */}
      <WizardPopup
        modalWidth="560px"
        open={isAddOpen}
        title="Add Subject"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleCreate}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm, addStep)}
      </WizardPopup>

      {/* Edit Modal */}
      <WizardPopup
        modalWidth="560px"
        open={isEditOpen}
        title="Edit Subject"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleUpdate}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm, editStep)}
      </WizardPopup>

      {/* Filter Sidebar */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Subjects"
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
              {schoolOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
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
              {classFilterOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="type"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Type
            </label>
            <select
              id="type"
              className="form-control form-select"
              value={pendingFilters.type}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select</option>
              {subjectTypeOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="teacher"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Teacher
            </label>
            <select
              id="teacher"
              className="form-control form-select"
              value={pendingFilters.teacher}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select</option>
              {teacherFilterOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
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
            <button
              type="submit"
              className="btn btn-primary-600 w-100"
              onClick={() => setIsFilterSidebarOpen(false)}
            >
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default Subject
