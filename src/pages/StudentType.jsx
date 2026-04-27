import { useCallback, useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { fetchSchoolsPage } from '../apis/schoolsApi'
import {
  createStudentType,
  deleteStudentType,
  fetchStudentTypesPage,
  updateStudentType,
} from '../apis/studentTypeApi'
import '../assets/css/addModalShared.css'

const emptyForm = {
  schoolId: '',
  studentType: '',
  note: '',
}

const emptyFilters = {
  school: 'Select',
  studentType: 'Select',
}

const STEPS = ['Basic']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Student Type': 'ri-group-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'studentType', label: 'Student Type' },
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

const StudentType = () => {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [studentTypes, setStudentTypes] = useState([])
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)

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
  const studentTypeOptions = useMemo(
    () => Array.from(new Set(studentTypes.map((item) => item.studentType))).sort(),
    [studentTypes],
  )

  // ── Filtering (client-side within the current page) ──────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return studentTypes.filter((row) => {
      const schoolName = row.schoolName || row.school || ''
      const matchesSearch =
        !q || [schoolName, row.studentType, row.note].join(' ').toLowerCase().includes(q)
      const matchesSchool =
        filters.school === 'Select' || schoolName === filters.school
      const matchesStudentType =
        filters.studentType === 'Select' || row.studentType === filters.studentType
      return matchesSearch && matchesSchool && matchesStudentType
    })
  }, [studentTypes, search, filters])

  const allSelected =
    filtered.length > 0 && filtered.every((row) => selectedRows.includes(row.id))

  // ── Data fetching ────────────────────────────────────────────────────────────
  const loadStudentTypes = useCallback(async (page, size) => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchStudentTypesPage(page - 1, size)
      if (Array.isArray(data)) {
        setStudentTypes(data)
        setTotalElements(data.length)
        setTotalPages(1)
      } else {
        setStudentTypes(Array.isArray(data?.content) ? data.content : [])
        setTotalElements(Number.isFinite(data?.totalElements) ? data.totalElements : 0)
        setTotalPages(Math.max(1, Number.isFinite(data?.totalPages) ? data.totalPages : 1))
      }
    } catch (e) {
      setStudentTypes([])
      setTotalElements(0)
      setTotalPages(1)
      setError(e?.message || 'Failed to load student types')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadSchools = useCallback(async () => {
    try {
      // Fetch a large page so the dropdown is fully populated
      const data = await fetchSchoolsPage(0, 200)
      const list = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : [])
      setSchools(list)
    } catch {
      // Non-fatal: the dropdown will just be empty
      setSchools([])
    }
  }, [])

  useEffect(() => {
    void loadStudentTypes(currentPage, rowsPerPage)
  }, [currentPage, rowsPerPage, loadStudentTypes])

  useEffect(() => {
    void loadSchools()
  }, [loadSchools])

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
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    )
  }

  // ── Form helpers ─────────────────────────────────────────────────────────────
  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({ ...prev, [id]: value }))
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
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
  }

  // ── Open modals ──────────────────────────────────────────────────────────────
  const openAdd = () => {
    setError('')
    setEditingId(null)
    setAddForm(emptyForm)
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setError('')
    setEditingId(row.id)
    setEditForm({
      schoolId: row.schoolId != null ? String(row.schoolId) : '',
      studentType: row.studentType || '',
      note: row.note || '',
    })
    setEditStep(0)
    setIsEditOpen(true)
  }

  // ── CRUD handlers ────────────────────────────────────────────────────────────
  const buildPayload = (form) => ({
    schoolId: form.schoolId ? Number(form.schoolId) : null,
    studentType: form.studentType || '',
    note: form.note || '',
  })

  const handleCreate = async () => {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await createStudentType(buildPayload(addForm))
      setIsAddOpen(false)
      setAddForm(emptyForm)
      setAddStep(0)
      if (currentPage !== 1) setCurrentPage(1)
      else await loadStudentTypes(currentPage, rowsPerPage)
    } catch (e) {
      setError(e?.message || 'Failed to create student type')
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
      await updateStudentType(editingId, buildPayload(editForm))
      setIsEditOpen(false)
      setEditForm(emptyForm)
      setEditStep(0)
      setEditingId(null)
      await loadStudentTypes(currentPage, rowsPerPage)
    } catch (e) {
      setError(e?.message || 'Failed to update student type')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!id) return
    if (!window.confirm('Delete this student type? This cannot be undone.')) return
    setSaving(true)
    setError('')
    try {
      await deleteStudentType(id)
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id))
      await loadStudentTypes(currentPage, rowsPerPage)
    } catch (e) {
      setError(e?.message || 'Failed to delete student type')
    } finally {
      setSaving(false)
    }
  }

  // ── Pagination ───────────────────────────────────────────────────────────────
  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  // ── School name lookup (for display in table) ────────────────────────────────
  const schoolNameById = useMemo(() => {
    const map = {}
    schools.forEach((s) => { map[s.id] = s.schoolName })
    return map
  }, [schools])

  const getSchoolName = (row) =>
    row.schoolName || row.school || schoolNameById[row.schoolId] || '-'

  // ── Form renderer ─────────────────────────────────────────────────────────────
  const renderForm = (form, setter) => (
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
            <option value="">-- Select School --</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.schoolName}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Student Type" required full>
          <input
            type="text"
            className="avm-input"
            id="studentType"
            placeholder="Student Type"
            value={form.studentType}
            onChange={handleChange(setter)}
          />
        </FormField>

        <FormField label="Note" full noIcon>
          <textarea
            rows="4"
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

  // ── Filter sidebar school options (from live schools list) ───────────────────
  const schoolFilterOptions = useMemo(
    () => Array.from(new Set(schools.map((s) => s.schoolName))).sort(),
    [schools],
  )

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Student Type</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Student Type</span>
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
            Add Student Type
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
                placeholder="Search student type..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school && <th scope="col">School</th>}
                  {visibleColumns.studentType && <th scope="col">Student Type</th>}
                  {visibleColumns.note && <th scope="col">Note</th>}
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading student types...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No student types found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, idx) => (
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
                      {visibleColumns.school && <td>{getSchoolName(row)}</td>}
                      {visibleColumns.studentType && (
                        <td className="fw-medium text-primary-light">{row.studentType}</td>
                      )}
                      {visibleColumns.note && <td>{row.note}</td>}
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
              {totalElements === 0 ? 0 : Math.min((currentPage - 1) * rowsPerPage + filtered.length, totalElements)} of {totalElements}
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
        modalWidth="540px"
        open={isAddOpen}
        title="Add Student Type"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleCreate}
        submitLabel={saving ? 'Saving…' : 'Save'}
      >
        {renderForm(addForm, setAddForm)}
      </WizardPopup>

      {/* ── Edit Modal ── */}
      <WizardPopup
        modalWidth="540px"
        open={isEditOpen}
        title="Edit Student Type"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleUpdate}
        submitLabel={saving ? 'Saving…' : 'Update'}
      >
        {renderForm(editForm, setEditForm)}
      </WizardPopup>

      {/* ── Filter Sidebar ── */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Student Type"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label htmlFor="school" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School
            </label>
            <select
              id="school"
              className="form-control form-select"
              value={pendingFilters.school}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select School</option>
              {schoolFilterOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="studentType" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Student Type
            </label>
            <select
              id="studentType"
              className="form-control form-select"
              value={pendingFilters.studentType}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select</option>
              {studentTypeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
              Reset
            </button>
          </div>

          <div>
            <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default StudentType