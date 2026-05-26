import { useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createExamGrade, deleteExamGrade, fetchExamGradesPage, updateExamGrade } from '../apis/examGradeApi'
import { normalizeRole } from '../utils/roles'

const STEPS = ['Grade Information']

const emptyForm = {
  id: null,
  headOfficeId: '',
  schoolId: '',
  gradeName: '',
  gradePoint: '',
  markFrom: '',
  markTo: '',
  note: '',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  gradeName: 'Select',
}

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  'Grade Name': 'ri-award-line',
  'Grade Point': 'ri-star-line',
  'Mark From': 'ri-bar-chart-2-line',
  'Mark To': 'ri-bar-chart-2-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'gradeName', label: 'Grade Name' },
  { key: 'gradePoint', label: 'Grade Point' },
  { key: 'markFrom', label: 'Mark From' },
  { key: 'markTo', label: 'Mark To' },
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

const ExamGrade = () => {
  const {
    status,
    token,
    user,
    role: authRole,
    headOfficeId: authHeadOfficeId,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    canAdd,
    canEdit,
    canDelete,
  } = useAuth()
  const PAGE_SLUG = 'exam-grade'
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [rows, setRows] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [schools, setSchools] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [addForm, setAddForm] = useState(() => ({
    ...emptyForm,
    schoolId: isSchoolAdmin ? (authSchoolId != null ? String(authSchoolId) : '') : '',
  }))
  const [editForm, setEditForm] = useState({ ...emptyForm })

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const getSchoolById = (schoolId) =>
    (Array.isArray(schools) ? schools : []).find((school) => String(school?.id ?? '') === String(schoolId ?? '')) || null

  const schoolsById = useMemo(() => {
    const map = new Map()
    for (const s of Array.isArray(schools) ? schools : []) {
      if (s?.id == null) continue
      map.set(String(s.id), s)
    }
    return map
  }, [schools])

  const schoolOptions = useMemo(() => {
    const list = Array.isArray(schools) ? schools : []
    if (isSuperAdmin) return manualScope.selectedHeadOfficeId ? manualScope.schoolOptions : []
    if (isHeadOfficeAdmin) {
      return list.filter((s) => String(s?.headOfficeId ?? '') === String(authHeadOfficeId))
    }
    return []
  }, [schools, isSuperAdmin, isHeadOfficeAdmin, authHeadOfficeId, manualScope.selectedHeadOfficeId, manualScope.schoolOptions])

  const filterSchoolOptions = useMemo(() => {
    const list = Array.isArray(schools) ? schools : []
    if (filters.headOfficeId) {
      return list.filter((school) => String(school?.headOfficeId ?? '') === String(filters.headOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return list.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return list.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return list
  }, [authHeadOfficeId, authSchoolId, filters.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin, schools])

  const schoolNameById = (schoolId) => {
    if (schoolId == null) return ''
    return schoolsById.get(String(schoolId))?.schoolName || ''
  }

  const loadLookups = async () => {
    if (isSchoolAdmin) return
    const [headOfficePage, list] = await Promise.all([
      fetchHeadOfficesPage(0, 500),
      fetchSchoolsLookup(),
    ])
    setHeadOffices(Array.isArray(headOfficePage?.content) ? headOfficePage.content : [])
    setSchools(Array.isArray(list) ? list : [])
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400)
    return () => clearTimeout(timer)
  }, [search])

  const effectiveSearch = useMemo(() => {
    const parts = [debouncedSearch]
    if (filters.gradeName && filters.gradeName !== 'Select') parts.push(filters.gradeName)
    return parts.filter(Boolean).join(' ').trim()
  }, [debouncedSearch, filters.gradeName])

  const loadExamGrades = async ({ headOfficeId, schoolId, page = 0, size = 10, searchText = '' } = {}) => {
    const effectiveSchoolId = isSchoolAdmin ? authSchoolId : (schoolId || null)
    const effectiveHeadOfficeId = isSuperAdmin ? (headOfficeId || null) : (isHeadOfficeAdmin ? authHeadOfficeId : null)
    if (!effectiveSchoolId && !effectiveHeadOfficeId && !isSuperAdmin) {
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
      return
    }

    const data = await fetchExamGradesPage({
      headOfficeId: effectiveHeadOfficeId || undefined,
      schoolId: effectiveSchoolId,
      page,
      size,
      search: searchText,
    })
    const list = Array.isArray(data?.content) ? data.content : []
    setRows(list)
    setTotalElements(data?.totalElements ?? 0)
    setTotalPages(data?.totalPages ?? 0)
  }

  useEffect(() => {
    if (status !== 'ready' || !token) return
    setLoadError('')
    setBusy(true)
    Promise.resolve()
      .then(loadLookups)
      .then(() =>
        loadExamGrades({
          headOfficeId: filters.headOfficeId ? Number(filters.headOfficeId) : null,
          schoolId: filters.schoolId ? Number(filters.schoolId) : null,
          page: currentPage - 1,
          size: rowsPerPage,
          searchText: effectiveSearch,
        }),
      )
      .catch((e) => setLoadError(e?.message || 'Failed to load exam grades'))
      .finally(() => setBusy(false))
  }, [status, token, currentPage, rowsPerPage, effectiveSearch, filters.headOfficeId, filters.schoolId, role])

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p += 1) pages.push(p)
    return pages
  }

  const openAdd = () => {
    if (isSuperAdmin) {
      manualScope.setSelectedScope('', '')
    }
    setAddForm({
      ...emptyForm,
      schoolId: isSchoolAdmin ? (authSchoolId != null ? String(authSchoolId) : '') : '',
    })
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    const school = getSchoolById(row.schoolId)
    const headOfficeId = school?.headOfficeId != null ? String(school.headOfficeId) : ''
    if (isSuperAdmin) {
      manualScope.setSelectedScope(headOfficeId, row.schoolId != null ? String(row.schoolId) : '')
    }
    setEditForm({
      id: row.id,
      headOfficeId,
      schoolId: row.schoolId != null ? String(row.schoolId) : '',
      gradeName: row.gradeName ?? '',
      gradePoint: row.gradePoint != null ? String(row.gradePoint) : '',
      markFrom: row.markFrom != null ? String(row.markFrom) : '',
      markTo: row.markTo != null ? String(row.markTo) : '',
      note: row.note ?? '',
    })
    setEditStep(0)
    setIsEditOpen(true)
  }

  const validateForm = (form) => {
    if (!isSchoolAdmin && !form.schoolId) return 'School is required'
    if (!form.gradeName) return 'Grade Name is required'
    if (form.gradePoint === '') return 'Grade Point is required'
    if (form.markFrom === '') return 'Mark From is required'
    if (form.markTo === '') return 'Mark To is required'
    if (Number(form.markFrom) > Number(form.markTo)) return 'Mark From cannot be greater than Mark To'
    return ''
  }

  const submitForm = async (form, closeModal) => {
    const err = validateForm(form)
    if (err) {
      setLoadError(err)
      return
    }

    setBusy(true)
    setLoadError('')
    try {
      const payload = {
        schoolId: isSchoolAdmin ? Number(authSchoolId) : Number(form.schoolId),
        gradeName: form.gradeName.trim(),
        gradePoint: Number(form.gradePoint),
        markFrom: Number(form.markFrom),
        markTo: Number(form.markTo),
        note: form.note?.trim() || null,
      }
      if (form.id) {
        await updateExamGrade(form.id, payload)
      } else {
        await createExamGrade(payload)
      }
      closeModal()
      await loadExamGrades({
        headOfficeId: filters.headOfficeId ? Number(filters.headOfficeId) : null,
        schoolId: filters.schoolId ? Number(filters.schoolId) : null,
        page: currentPage - 1,
        size: rowsPerPage,
        searchText: effectiveSearch,
      })
    } catch (e) {
      setLoadError(e?.message || 'Failed to save exam grade')
    } finally {
      setBusy(false)
    }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows(rows.map((row) => String(row.id)))
    else setSelectedRows([])
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(String(id)) ? prev.filter((rowId) => rowId !== String(id)) : [...prev, String(id)],
    )
  }

  const handleFilterHeadOfficeChange = (value) => {
    setPendingFilters((prev) => ({
      ...prev,
      headOfficeId: value,
      schoolId: '',
    }))
  }

  const handleFilterSchoolChange = (value) => {
    const selectedSchool = getSchoolById(value)
    setPendingFilters((prev) => ({
      ...prev,
      schoolId: value,
      headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
    }))
  }

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(value)
    setCurrentPage(1)
  }

  const renderForm = (form, setter) => (
    <div className="avm-grid">
      {isSuperAdmin ? (
        <div className="full">
          <ManualScopeSelectors
            enabled
            headOffices={manualScope.headOffices}
            schoolOptions={schoolOptions}
            selectedHeadOfficeId={form.headOfficeId}
            onHeadOfficeChange={(value) => {
              setter((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))
              manualScope.setSelectedScope(value, '')
            }}
            selectedSchoolId={form.schoolId}
            onSchoolChange={(value) => {
              const school = getSchoolById(value)
              const nextHeadOfficeId = school?.headOfficeId != null ? String(school.headOfficeId) : form.headOfficeId
              setter((prev) => ({
                ...prev,
                headOfficeId: nextHeadOfficeId,
                schoolId: value,
              }))
              manualScope.setSelectedScope(nextHeadOfficeId, value)
            }}
            compact
          />
        </div>
      ) : !isSchoolAdmin ? (
        <FormField label="School Name" required full>
          <select
            className="avm-select"
            id="schoolId"
            value={form.schoolId}
            onChange={(e) => setter((prev) => ({ ...prev, schoolId: e.target.value }))}
          >
            <option value="">--Select School--</option>
            {schoolOptions.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.schoolName}
              </option>
            ))}
          </select>
        </FormField>
      ) : (
        <FormField label="School Name" required full>
          <input className="avm-input" value={authSchoolName || ''} readOnly />
        </FormField>
      )}

      <FormField label="Grade Name" required full>
        <input
          type="text"
          className="avm-input"
          id="gradeName"
          placeholder="Grade Name"
          value={form.gradeName}
          onChange={(e) => setter((prev) => ({ ...prev, gradeName: e.target.value }))}
        />
      </FormField>

      <FormField label="Grade Point" required>
        <input
          type="number"
          step="0.01"
          className="avm-input"
          id="gradePoint"
          placeholder="Grade Point"
          value={form.gradePoint}
          onChange={(e) => setter((prev) => ({ ...prev, gradePoint: e.target.value }))}
        />
      </FormField>

      <FormField label="Mark From" required>
        <input
          type="number"
          className="avm-input"
          id="markFrom"
          placeholder="Mark From"
          value={form.markFrom}
          onChange={(e) => setter((prev) => ({ ...prev, markFrom: e.target.value }))}
        />
      </FormField>

      <FormField label="Mark To" required>
        <input
          type="number"
          className="avm-input"
          id="markTo"
          placeholder="Mark To"
          value={form.markTo}
          onChange={(e) => setter((prev) => ({ ...prev, markTo: e.target.value }))}
        />
      </FormField>

      <FormField label="Note" full noIcon>
        <textarea
          rows="3"
          className="avm-input avm-textarea"
          id="note"
          placeholder="Note"
          value={form.note}
          onChange={(e) => setter((prev) => ({ ...prev, note: e.target.value }))}
        />
      </FormField>
    </div>
  )

  const applyFilters = (e) => {
    e.preventDefault()
    setFilters({ ...pendingFilters })
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const resetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Exam Grade</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Exam Grade</span>
          </div>
        </div>
        {canAdd(PAGE_SLUG) && (
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={openAdd}
          >
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add Grade
          </button>
        )}
      </div>

      {loadError ? (
        <div className="alert alert-danger mb-16">{loadError}</div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span>
                  <i className="ri-arrow-right-line"></i>
                </span>
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
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

              <RowsPerPageSelect
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search grade..."
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

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" id="exam-grade-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ width: 60 }}>
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={rows.length > 0 && selectedRows.length === rows.length}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.gradeName ? <th scope="col">Grade Name</th> : null}
                  {visibleColumns.gradePoint ? <th scope="col">Grade Point</th> : null}
                  {visibleColumns.markFrom ? <th scope="col">Mark From</th> : null}
                  {visibleColumns.markTo ? <th scope="col">Mark To</th> : null}
                  {visibleColumns.note ? <th scope="col">Note</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {busy ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      No exam grade records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(String(row.id))}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.school ? (
                        <td className="fw-medium text-primary-light">{row.schoolName || schoolNameById(row.schoolId)}</td>
                      ) : null}
                      {visibleColumns.gradeName ? <td className="fw-medium">{row.gradeName}</td> : null}
                      {visibleColumns.gradePoint ? <td>{row.gradePoint}</td> : null}
                      {visibleColumns.markFrom ? <td>{row.markFrom}</td> : null}
                      {visibleColumns.markTo ? <td>{row.markTo}</td> : null}
                      {visibleColumns.note ? <td>{row.note}</td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          {canEdit(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                              onClick={() => openEdit(row)}
                              title="Edit"
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                          )}
                          {canDelete(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                              title="Delete"
                              onClick={async () => {
                                if (!window.confirm('Are you sure you want to delete this exam grade?')) return
                                setBusy(true)
                                try {
                                  await deleteExamGrade(row.id)
                                  await loadExamGrades({
                                    headOfficeId: filters.headOfficeId ? Number(filters.headOfficeId) : null,
                                    schoolId: filters.schoolId ? Number(filters.schoolId) : null,
                                    page: currentPage - 1,
                                    size: rowsPerPage,
                                    searchText: effectiveSearch,
                                  })
                                } catch (e) {
                                  setLoadError(e?.message || 'Failed to delete exam grade')
                                } finally {
                                  setBusy(false)
                                }
                              }}
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          )}
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
              Showing {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, totalElements)} of {totalElements}
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

      <WizardPopup
        modalWidth="580px"
        open={isAddOpen}
        title="Add Exam Grade"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => submitForm(addForm, () => setIsAddOpen(false))}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm)}
      </WizardPopup>

      <WizardPopup
        modalWidth="580px"
        open={isEditOpen}
        title="Edit Exam Grade"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => submitForm(editForm, () => setIsEditOpen(false))}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm)}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        title="Filter Exam Grade"
      >
        <form className="p-20 d-grid gap-16" onSubmit={applyFilters}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={(Array.isArray(manualScope.headOffices) && manualScope.headOffices.length > 0
                ? manualScope.headOffices
                : headOffices.map((ho) => ({ id: ho.id, name: ho.name || ho.headOfficeName || '' }))).filter((ho) => ho.id != null && ho.name)}
              schoolOptions={filterSchoolOptions.map((school) => ({ id: school.id, schoolName: school.schoolName || school.name || '' }))}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={handleFilterHeadOfficeChange}
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={handleFilterSchoolChange}
              schoolLabel="School"
            />
          ) : (
            <div className="avm-field full">
              <label htmlFor="schoolId" className="avm-label">
                School
              </label>
              <select
                id="schoolId"
                className="avm-select"
                value={pendingFilters.schoolId}
                onChange={(e) => handleFilterSchoolChange(e.target.value)}
              >
                <option value="">All Schools</option>
                {filterSchoolOptions.map((school) => (
                  <option key={String(school.id)} value={String(school.id)}>
                    {school.schoolName || school.name || String(school.id)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="gradeName" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Grade Name
            </label>
            <select
              id="gradeName"
              className="form-control form-select"
              value={pendingFilters.gradeName}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, gradeName: e.target.value }))}
            >
              <option value="Select">Select Grade</option>
              <option>A+</option>
              <option>A</option>
              <option>B</option>
              <option>C</option>
              <option>D</option>
              <option>F</option>
            </select>
          </div>
          <div>
            <button type="button" onClick={resetFilters} className="btn btn-danger-200 text-danger-600 w-100">
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

export default ExamGrade
