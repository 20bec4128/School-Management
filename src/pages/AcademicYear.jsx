import { useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'
import { useAuth } from '../context/useAuth'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createAcademicYear, deleteAcademicYear, fetchAcademicYears, updateAcademicYear } from '../apis/academicYearsApi'
import { normalizeRole } from '../utils/roles'

const emptyForm = {
  schoolId: '',
  sessionStart: '',
  sessionEnd: '',
  isRunning: false,
  note: '',
}

const emptyFilters = {
  schoolId: 'All',
  status: 'All',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'academicYear', label: 'Academic Year' },
  { key: 'sessionStart', label: 'Session Start' },
  { key: 'sessionEnd', label: 'Session End' },
  { key: 'isRunning', label: 'Is Running?' },
  { key: 'note', label: 'Note' },
]

const STEPS = ['Academic Year']

const FIELD_ICONS = {
  schoolId: 'ri-school-line',
  sessionStart: 'ri-calendar-event-line',
  sessionEnd: 'ri-calendar-check-line',
  note: 'ri-sticky-note-line',
}

const formatDate = (value) => {
  if (!value) return '--'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const buildAcademicYearLabel = (sessionStart, sessionEnd) => {
  if (!sessionStart || !sessionEnd) return ''
  const startYear = new Date(`${sessionStart}T00:00:00`).getFullYear()
  const endYear = new Date(`${sessionEnd}T00:00:00`).getFullYear()
  if (Number.isNaN(startYear) || Number.isNaN(endYear)) return ''
  return `${startYear}-${endYear}`
}

const normalizeRow = (row) => ({
  id: row?.id,
  schoolId: row?.schoolId ?? '',
  schoolName: row?.schoolName || '',
  academicYear: row?.academicYear || buildAcademicYearLabel(row?.sessionStart, row?.sessionEnd),
  sessionStart: row?.sessionStart || '',
  sessionEnd: row?.sessionEnd || '',
  isRunning: Boolean(row?.isRunning),
  note: row?.note || '',
})

const FormField = ({ label, id, required, children, full = false, noIcon = false }) => (
  <div className={`col-12 ${full ? '' : 'col-md-6'} mb-16`}>
    <label className="text-sm fw-semibold text-primary-light mb-8">
      {label} {required && <span className="text-danger-600">*</span>}
    </label>
    <div className="position-relative">
      {children}
      {noIcon ? null : (
        <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
          <i className={FIELD_ICONS[id] || 'ri-edit-line'} />
        </span>
      )}
    </div>
  </div>
)

const AcademicYear = () => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const role = useMemo(
    () => normalizeRole(authRole || user?.role || user?.userRole || user?.authority),
    [authRole, user],
  )
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'

  const [rows, setRows] = useState([])
  const [schools, setSchools] = useState([])
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [scopeSchoolId, setScopeSchoolId] = useState(() => (authSchoolId != null ? String(authSchoolId) : ''))
  const [filters, setFilters] = useState(emptyFilters)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolsById = useMemo(() => {
    const map = new Map()
    for (const school of Array.isArray(schools) ? schools : []) {
      if (school?.id == null) continue
      map.set(String(school.id), school)
    }
    return map
  }, [schools])

  const schoolOptions = useMemo(() => {
    return Array.isArray(schools)
      ? [...schools].sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
      : []
  }, [schools])

  const accessibleSchoolOptions = useMemo(() => {
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      return schoolOptions.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId))
    }
    return schoolOptions
  }, [authHeadOfficeId, isHeadOfficeAdmin, schoolOptions])

  const scopeSchoolName = useMemo(() => {
    if (scopeSchoolId && schoolsById.has(String(scopeSchoolId))) {
      return schoolsById.get(String(scopeSchoolId))?.schoolName || ''
    }
    if (isSchoolAdmin) return authSchoolName || (authSchoolId != null ? `School ${authSchoolId}` : '')
    return ''
  }, [authSchoolId, authSchoolName, isSchoolAdmin, schoolsById, scopeSchoolId])

  const loadSchools = async () => {
    const list = await fetchSchoolsLookup()
    setSchools(Array.isArray(list) ? list : [])
  }

  const loadAcademicYears = async ({ schoolId } = {}) => {
    if (isSchoolAdmin) {
      if (authSchoolId == null) {
        setRows([])
        return
      }
      const data = await fetchAcademicYears({ schoolId: authSchoolId })
      setRows(Array.isArray(data) ? data.map(normalizeRow) : [])
      return
    }

    const data = schoolId == null ? await fetchAcademicYears() : await fetchAcademicYears({ schoolId })
    setRows(Array.isArray(data) ? data.map(normalizeRow) : [])
  }

  useEffect(() => {
    if (status !== 'ready' || !token) return
    if (isSchoolAdmin && authSchoolId != null) {
      setScopeSchoolId(String(authSchoolId))
    }
  }, [authSchoolId, isSchoolAdmin, status, token])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    let alive = true
    setBusy(true)
    setLoadError('')
    Promise.allSettled([loadSchools()]).then(() => {
      if (!alive) return
      loadAcademicYears()
        .catch((error) => {
          if (!alive) return
          setLoadError(error?.message || 'Failed to load academic years')
        })
        .finally(() => {
          if (alive) setBusy(false)
        })
    }).catch(() => {
      if (alive) setBusy(false)
    })

    return () => {
      alive = false
    }
  }, [authSchoolId, isSchoolAdmin, status, token])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        [row.schoolName, row.academicYear, formatDate(row.sessionStart), formatDate(row.sessionEnd), row.note]
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesSchool = filters.schoolId === 'All' || String(row.schoolId) === String(filters.schoolId)
      const matchesStatus =
        filters.status === 'All' ||
        (filters.status === 'Running' ? row.isRunning : !row.isRunning)
      return matchesSearch && matchesSchool && matchesStatus
    })
  }, [filters.schoolId, filters.status, rows, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const resolveSchoolName = (schoolId) => {
    if (schoolId == null) return ''
    return schoolsById.get(String(schoolId))?.schoolName || `School ${schoolId}`
  }

  const openAdd = () => {
    setLoadError('')
    setAddForm({
      ...emptyForm,
      schoolId: isSchoolAdmin ? String(authSchoolId ?? '') : '',
    })
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setLoadError('')
    setEditId(row?.id ?? null)
    setEditForm({
      schoolId: String(row?.schoolId ?? ''),
      sessionStart: row?.sessionStart || '',
      sessionEnd: row?.sessionEnd || '',
      isRunning: Boolean(row?.isRunning),
      note: row?.note || '',
    })
    setIsEditOpen(true)
  }

  const validateForm = (form, schoolId) => {
    if (!schoolId) return 'School is required.'
    if (!form.sessionStart) return 'Session start is required.'
    if (!form.sessionEnd) return 'Session end is required.'
    if (form.sessionEnd < form.sessionStart) return 'Session end must be after session start.'
    return ''
  }

  const saveAcademicYear = async (mode) => {
    const form = mode === 'edit' ? editForm : addForm
    const schoolId = isSchoolAdmin ? authSchoolId : Number(form.schoolId || '')
    const validationError = validateForm(form, schoolId)
    if (validationError) {
      setLoadError(validationError)
      return
    }

    const payload = {
      schoolId,
      sessionStart: form.sessionStart,
      sessionEnd: form.sessionEnd,
      isRunning: Boolean(form.isRunning),
      note: form.note,
    }

    setBusy(true)
    setLoadError('')
    try {
      if (mode === 'edit') {
        await updateAcademicYear(editId, payload)
      } else {
        await createAcademicYear(payload)
      }

      if (mode === 'edit') {
        setIsEditOpen(false)
        setEditId(null)
        await loadAcademicYears()
      } else {
        setIsAddOpen(false)
        setAddForm(emptyForm)
        await loadAcademicYears()
      }
    } catch (error) {
      setLoadError(error?.message || `Failed to ${mode === 'edit' ? 'update' : 'create'} academic year`)
    } finally {
      setBusy(false)
    }
  }

  const removeAcademicYear = async (row) => {
    if (!row?.id) return
    setBusy(true)
    setLoadError('')
    try {
      await deleteAcademicYear(row.id)
      await loadAcademicYears()
    } catch (error) {
      setLoadError(error?.message || 'Failed to delete academic year')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Academic Year</h1>
          <span className="text-secondary-light">Dashboard / Academic Year</span>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-12">
          {isSchoolAdmin ? <div className="text-secondary-light small">{scopeSchoolName}</div> : null}
          <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <span className="d-flex text-md">
              <i className="ri-add-large-line" />
            </span>
            Add Year
          </button>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {loadError ? <div className="px-20 py-12 text-danger">{loadError}</div> : null}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1" /> Export
                  </span>
                  <i className="ri-arrow-down-s-line" />
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 d-flex align-items-center gap-10">
                      <i className="ri-file-text-line" /> CSV
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 d-flex align-items-center gap-10">
                      <i className="ri-file-excel-2-line" /> Excel
                    </button>
                  </li>
                </ul>
              </div>

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line" />
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

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <i className="ri-arrow-right-line" />
              </button>

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

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search academic years..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line" />
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  {visibleColumns.schoolName ? <th scope="col">School</th> : null}
                  {visibleColumns.academicYear ? <th scope="col">Academic Year</th> : null}
                  {visibleColumns.sessionStart ? <th scope="col">Session Start</th> : null}
                  {visibleColumns.sessionEnd ? <th scope="col">Session End</th> : null}
                  {visibleColumns.isRunning ? <th scope="col">Is Running?</th> : null}
                  {visibleColumns.note ? <th scope="col">Note</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No academic years found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, index) => (
                    <tr key={row.id ?? `${row.schoolId}-${row.academicYear}-${index}`}>
                      <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      {visibleColumns.schoolName ? <td>{row.schoolName || resolveSchoolName(row.schoolId)}</td> : null}
                      {visibleColumns.academicYear ? <td className="fw-medium text-primary-light">{row.academicYear}</td> : null}
                      {visibleColumns.sessionStart ? <td>{formatDate(row.sessionStart)}</td> : null}
                      {visibleColumns.sessionEnd ? <td>{formatDate(row.sessionEnd)}</td> : null}
                      {visibleColumns.isRunning ? (
                        <td>
                          <span
                            className={`px-12 py-4 radius-4 fw-medium text-sm ${
                              row.isRunning
                                ? 'bg-success-100 text-success-600'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {row.isRunning ? 'Running' : 'Closed'}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.note ? <td>{row.note || '--'}</td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => openEdit(row)}
                            title="Edit"
                          >
                            <i className="ri-edit-line" />
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => removeAcademicYear(row)}
                            title="Delete"
                          >
                            <i className="ri-delete-bin-line" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
              <button type="button" className="btn btn-sm btn-primary-600">
                {currentPage}
              </button>
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

      <WizardPopup
        open={isAddOpen}
        title="Add Academic Year"
        steps={STEPS}
        step={0}
        onClose={() => setIsAddOpen(false)}
        onSubmit={() => saveAcademicYear('add')}
        submitLabel="Save"
        modalWidth="640px"
      >
        <div className="row">
          {(isSuperAdmin || isHeadOfficeAdmin) ? (
            <FormField label="School" id="schoolId" required full>
              <select
                className="form-control ps-44 form-select"
                value={addForm.schoolId}
                onChange={(e) => setAddForm({ ...addForm, schoolId: e.target.value })}
              >
                <option value="">--Select School--</option>
                {accessibleSchoolOptions.map((school) => (
                  <option key={school.id} value={String(school.id)}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </FormField>
          ) : (
            <FormField label="School" id="schoolId" required full>
              <input className="form-control ps-44" value={scopeSchoolName} readOnly />
            </FormField>
          )}

          <FormField label="Session Start" id="sessionStart" required>
            <input
              type="date"
              className="form-control ps-44"
              value={addForm.sessionStart}
              onChange={(e) => setAddForm({ ...addForm, sessionStart: e.target.value })}
            />
          </FormField>

          <FormField label="Session End" id="sessionEnd" required>
            <input
              type="date"
              className="form-control ps-44"
              value={addForm.sessionEnd}
              onChange={(e) => setAddForm({ ...addForm, sessionEnd: e.target.value })}
            />
          </FormField>

          <FormField label="Is Running?" id="isRunning" full noIcon>
            <div className="form-check form-switch pt-2">
              <input
                className="form-check-input"
                type="checkbox"
                checked={addForm.isRunning}
                onChange={(e) => setAddForm({ ...addForm, isRunning: e.target.checked })}
                id="addAcademicYearRunning"
              />
              <label className="form-check-label" htmlFor="addAcademicYearRunning">
                Mark as active academic year
              </label>
            </div>
          </FormField>

          <FormField label="Note" id="note" full>
            <textarea
              className="form-control ps-44"
              rows="3"
              placeholder="Enter any notes"
              value={addForm.note}
              onChange={(e) => setAddForm({ ...addForm, note: e.target.value })}
            />
          </FormField>
        </div>
      </WizardPopup>

      <WizardPopup
        open={isEditOpen}
        title="Edit Academic Year"
        steps={STEPS}
        step={0}
        onClose={() => setIsEditOpen(false)}
        onSubmit={() => saveAcademicYear('edit')}
        submitLabel="Update"
        modalWidth="640px"
      >
        <div className="row">
          <FormField label="School" id="schoolId" required full>
            <input className="form-control ps-44" value={resolveSchoolName(editForm.schoolId)} readOnly />
          </FormField>

          <FormField label="Session Start" id="sessionStart" required>
            <input
              type="date"
              className="form-control ps-44"
              value={editForm.sessionStart}
              onChange={(e) => setEditForm({ ...editForm, sessionStart: e.target.value })}
            />
          </FormField>

          <FormField label="Session End" id="sessionEnd" required>
            <input
              type="date"
              className="form-control ps-44"
              value={editForm.sessionEnd}
              onChange={(e) => setEditForm({ ...editForm, sessionEnd: e.target.value })}
            />
          </FormField>

          <FormField label="Is Running?" id="isRunning" full noIcon>
            <div className="form-check form-switch pt-2">
              <input
                className="form-check-input"
                type="checkbox"
                checked={editForm.isRunning}
                onChange={(e) => setEditForm({ ...editForm, isRunning: e.target.checked })}
                id="editAcademicYearRunning"
              />
              <label className="form-check-label" htmlFor="editAcademicYearRunning">
                Mark as active academic year
              </label>
            </div>
          </FormField>

          <FormField label="Note" id="note" full>
            <textarea
              className="form-control ps-44"
              rows="3"
              placeholder="Enter any notes"
              value={editForm.note}
              onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
            />
          </FormField>
        </div>
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Academic Years"
        onClose={() => setIsFilterSidebarOpen(false)}
      >
        <form
          className="p-20 d-grid gap-16"
          onSubmit={(e) => {
            e.preventDefault()
            setFilters(pendingFilters)
            setCurrentPage(1)
            setIsFilterSidebarOpen(false)
          }}
        >
          <div>
            <label htmlFor="academicYearFilterSchool" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School
            </label>
            <select
              id="academicYearFilterSchool"
              className="form-control form-select"
              value={pendingFilters.schoolId}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, schoolId: e.target.value }))}
            >
              <option value="All">All</option>
              {accessibleSchoolOptions.map((school) => (
                <option key={school.id} value={String(school.id)}>
                  {school.schoolName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="academicYearFilterStatus" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Status
            </label>
            <select
              id="academicYearFilterStatus"
              className="form-control form-select"
              value={pendingFilters.status}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="All">All</option>
              <option value="Running">Running</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <button
            type="button"
            className="btn btn-danger-200 text-danger-600 w-100"
            onClick={() => {
              const reset = { ...emptyFilters }
              setPendingFilters(reset)
              setFilters(reset)
              setCurrentPage(1)
            }}
          >
            Reset
          </button>

          <button type="submit" className="btn btn-primary-600 w-100">
            Apply
          </button>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default AcademicYear
