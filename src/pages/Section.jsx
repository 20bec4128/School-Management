import { useCallback, useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { createSection, deleteSection, fetchSections, updateSection } from '../apis/sectionsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchTeachers } from '../apis/teachersApi'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const emptyForm = {
  schoolId: '',
  classId: '',
  teacherId: '',
  name: '',
  note: '',
}

const emptyFilters = {
  school: 'Select',
  className: 'Select',
  classTeacher: 'Select',
}

const STEPS = ['Basic']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Name: 'ri-layout-grid-line',
  Class: 'ri-building-line',
  'Class Teacher': 'ri-user-3-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'section', label: 'Section' },
  { key: 'className', label: 'Class' },
  { key: 'classTeacher', label: 'Class Teacher' },
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

const Section = () => {
  const { schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId, isSchoolSelectionEnabled } = useSchool()
  const [sections, setSections] = useState([])
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
  const resolvedSchoolId = activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
  const resolvedSchoolName = authSchoolName || ''
  const scopedSchoolId = isSchoolSelectionEnabled && activeSchoolId ? String(activeSchoolId) : resolvedSchoolId
  const isSchoolLocked = (!isSchoolSelectionEnabled && !!resolvedSchoolId) || (!!activeSchoolId && isSchoolSelectionEnabled)

  const scopedSections = useMemo(() => {
    if (!isSchoolSelectionEnabled || !activeSchoolId) return sections
    return sections.filter((row) => String(row?.schoolId) === String(activeSchoolId))
  }, [activeSchoolId, isSchoolSelectionEnabled, sections])

  const effectiveSchoolsLookup = useMemo(() => {
    const byId = new Map((Array.isArray(schoolsLookup) ? schoolsLookup : []).map((school) => [String(school?.id), school]))
    if (scopedSchoolId && !byId.has(String(scopedSchoolId))) {
      byId.set(String(scopedSchoolId), {
        id: scopedSchoolId,
        schoolName: resolvedSchoolName || `School ${scopedSchoolId}`,
      })
    }
    if (isSchoolSelectionEnabled && activeSchoolId) {
      const selected = byId.get(String(activeSchoolId))
      return selected ? [selected] : [{ id: activeSchoolId, schoolName: resolvedSchoolName || `School ${activeSchoolId}` }]
    }
    return Array.from(byId.values()).sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
  }, [activeSchoolId, isSchoolSelectionEnabled, resolvedSchoolName, schoolsLookup, scopedSchoolId])

  const loadLookups = useCallback(async () => {
    const [schoolsResult, teachersResult] = await Promise.allSettled([fetchSchoolsLookup(), fetchTeachers()])
    const schools = schoolsResult.status === 'fulfilled' ? schoolsResult.value : []
    const teachers = teachersResult.status === 'fulfilled' ? teachersResult.value : []
    setSchoolsLookup(Array.isArray(schools) ? schools : [])
    const teacherRows = Array.isArray(teachers) ? teachers : []
    setTeachersLookup(
      teacherRows
        .map((t) => ({ id: t?.id, name: t?.name }))
        .filter((t) => t.id != null && t.name)
        .sort((a, b) => a.name.localeCompare(b.name)),
    )
  }, [])

  const loadSections = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchSections({
        schoolId: scopedSchoolId || undefined,
      })
      setSections(Array.isArray(data) ? data : [])
    } catch (e) {
      setSections([])
      setError(e?.message || 'Failed to load sections')
    } finally {
      setLoading(false)
    }
  }, [scopedSchoolId])

  const loadClassesForSchool = useCallback(async (schoolId) => {
    if (!schoolId) {
      setClassesLookup([])
      return
    }
    const data = await fetchClasses({ schoolId })
    setClassesLookup(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

  useEffect(() => {
    void loadSections()
  }, [loadSections])

  useEffect(() => {
    setCurrentPage(1)
    setSelectedRows([])
  }, [scopedSchoolId])

  const schoolOptions = useMemo(() => {
    const fromRows = scopedSections.map((r) => r?.schoolName).filter(Boolean)
    return Array.from(new Set(fromRows)).sort()
  }, [scopedSections])

  const teacherFilterOptions = useMemo(() => {
    const fromRows = scopedSections.map((r) => r?.teacherName).filter(Boolean)
    return Array.from(new Set(fromRows)).sort()
  }, [scopedSections])

  const classFilterOptions = useMemo(() => {
    const fromRows = scopedSections.map((r) => r?.className).filter(Boolean)
    return Array.from(new Set(fromRows)).sort()
  }, [scopedSections])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return scopedSections.filter((r) => {
      const matchesSearch =
        !q ||
        [r?.schoolName, r?.name, r?.className, r?.teacherName, r?.note]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesSchool = filters.school === 'Select' || r.schoolName === filters.school
      const matchesClass = filters.className === 'Select' || r.className === filters.className
      const matchesTeacher =
        filters.classTeacher === 'Select' || r.teacherName === filters.classTeacher
      return matchesSearch && matchesSchool && matchesClass && matchesTeacher
    })
  }, [scopedSections, search, filters])

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
    setAddForm(resolvedSchoolId ? { ...emptyForm, schoolId: resolvedSchoolId } : emptyForm)
    setAddStep(0)
    setIsAddOpen(true)
    void loadClassesForSchool(resolvedSchoolId)
  }

  const openEdit = (row) => {
    setError('')
    setEditingId(row?.id ?? null)
    const schoolId = row?.schoolId != null ? String(row.schoolId) : resolvedSchoolId
    void loadClassesForSchool(schoolId)
    setEditForm({
      schoolId,
      classId: row?.classId != null ? String(row.classId) : '',
      teacherId: row?.teacherId != null ? String(row.teacherId) : '',
      name: row?.name || '',
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
    note: form.note || '',
  })

  const handleCreate = async () => {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      const created = await createSection(buildPayload(addForm))
      setSections((prev) => [created, ...prev])
      setIsAddOpen(false)
      setAddForm(emptyForm)
      setAddStep(0)
      setCurrentPage(1)
    } catch (e) {
      setError(e?.message || 'Failed to create section')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (saving) return
    if (!editingId) {
      setError('No section selected for update')
      return
    }
    setSaving(true)
    setError('')
    try {
      const updated = await updateSection(editingId, buildPayload(editForm))
      setSections((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      setIsEditOpen(false)
      setEditForm(emptyForm)
      setEditStep(0)
      setEditingId(null)
    } catch (e) {
      setError(e?.message || 'Failed to update section')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!id) return
    const confirmed = window.confirm('Delete this section? This cannot be undone.')
    if (!confirmed) return

    setSaving(true)
    setError('')
    try {
      await deleteSection(id)
      setSections((prev) => prev.filter((r) => r.id !== id))
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id))
    } catch (e) {
      setError(e?.message || 'Failed to delete section')
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

  const renderForm = (form, setter) => (
    <>
      <p className="avm-section-title">Basic Information</p>
      <div className="avm-grid">
        <FormField label="School Name" required full>
          <select
            className="avm-select"
            id="schoolId"
            value={form.schoolId}
            onChange={handleSchoolChange(setter)}
            disabled={saving || isSchoolLocked}
          >
            <option value="">--Select School--</option>
            {effectiveSchoolsLookup.map((s) => (
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

        <FormField label="Class" required>
          <select
            className="avm-select"
            id="classId"
            value={form.classId}
            onChange={handleChange(setter)}
          >
            <option value="">--Select--</option>
            {classesLookup.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.className}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Class Teacher" required>
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
      </div>
    </>
  )

  return (
    <div className="dashboard-main-body">
      {/* Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Section</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Section</span>
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
          Add Section
        </button>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-8" role="alert">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      ) : null}

      {/* Table Card */}
      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {/* Toolbar */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              {/* Export */}
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

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
                placeholder="Search sections..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.section ? <th scope="col">Section</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.classTeacher ? <th scope="col">Class Teacher</th> : null}
                  {visibleColumns.note ? <th scope="col">Note</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 2}
                      className="text-center py-40 text-secondary-light"
                    >
                      Loading sections...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 2}
                      className="text-center py-40 text-secondary-light"
                    >
                      No sections found.
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
                      {visibleColumns.school ? <td>{row.schoolName}</td> : null}
                      {visibleColumns.section ? (
                        <td>
                          <span className="bg-primary-100 text-primary-600 px-12 py-4 radius-4 fw-medium text-sm">
                            {row.name}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.className ? (
                        <td className="fw-medium text-primary-light">{row.className}</td>
                      ) : null}
                      {visibleColumns.classTeacher ? <td>{row.teacherName || '-'}</td> : null}
                      {visibleColumns.note ? (
                        <td>
                          {row.note ? (
                            <span
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                maxWidth: 200,
                                fontSize: '0.85rem',
                                color: '#5a6472',
                              }}
                            >
                              {row.note}
                            </span>
                          ) : (
                            <span className="text-secondary-light">—</span>
                          )}
                        </td>
                      ) : null}
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
        modalWidth="540px"
        open={isAddOpen}
        title="Add Section"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleCreate}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm)}
      </WizardPopup>

      {/* Edit Modal */}
      <WizardPopup
        modalWidth="540px"
        open={isEditOpen}
        title="Edit Section"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleUpdate}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm)}
      </WizardPopup>

      {/* Filter Sidebar */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Sections"
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
              {schoolOptions.map((option) => (
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
              {classFilterOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="classTeacher"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Class Teacher
            </label>
            <select
              id="classTeacher"
              className="form-control form-select"
              value={pendingFilters.classTeacher}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select</option>
              {teacherFilterOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
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

export default Section
