import { useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import {
  createStudentType,
  deleteStudentType,
  fetchStudentTypesPage,
  updateStudentType,
} from '../apis/studentTypeApi'
import { normalizeRole } from '../utils/roles'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  studentType: '',
  note: '',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: 'All',
  studentType: 'Select',
}

const STEPS = ['Basic']

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
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
            <i className={icon} />
          </span>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

const getSchoolById = (rows, schoolId) =>
  (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(schoolId ?? '')) || null

const StudentType = () => {
  const { role, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId } = useSchool()
  const manualScope = useManualSchoolScope(normalizeRole(role) === 'SUPER_ADMIN')

  const [studentTypes, setStudentTypes] = useState([])
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
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

  const roleUpper = normalizeRole(role)
  const isSuperAdmin = roleUpper === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = roleUpper === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = roleUpper === 'SCHOOL_ADMIN'
  const isTeacherScope = roleUpper === 'TEACHER'

  const resolvedSchoolId = activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
  const resolvedSchoolLabel = authSchoolName || (resolvedSchoolId ? `School ${resolvedSchoolId}` : '')

  const schoolOptions = useMemo(() => {
    const rows = Array.isArray(schools) ? schools : []
    if (isSuperAdmin) {
      return manualScope.selectedHeadOfficeId
        ? manualScope.schoolOptions
        : []
    }
    if (isHeadOfficeAdmin) {
      return rows.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin || isTeacherScope) {
      return rows.filter((school) => String(school?.id ?? '') === String(resolvedSchoolId))
    }
    return rows
  }, [authHeadOfficeId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, isTeacherScope, manualScope.schoolOptions, manualScope.selectedHeadOfficeId, resolvedSchoolId, schools])

  const studentTypeOptions = useMemo(
    () => Array.from(new Set(studentTypes.map((item) => item.studentType))).filter(Boolean).sort(),
    [studentTypes],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return studentTypes.filter((row) => {
      const schoolName = row.schoolName || row.school || ''
      const matchesSearch =
        !q || [schoolName, row.studentType, row.note].join(' ').toLowerCase().includes(q)
      const matchesStudentType =
        filters.studentType === 'Select' || row.studentType === filters.studentType
      return matchesSearch && matchesStudentType
    })
  }, [filters.studentType, search, studentTypes])

  const allSelected = filtered.length > 0 && filtered.every((row) => selectedRows.includes(row.id))

  const loadSchools = async () => {
    const list = await fetchSchoolsLookup()
    setSchools(Array.isArray(list) ? list : [])
  }

  const loadRows = async () => {
    setLoading(true)
    setError('')
    try {
      const headOfficeId = isSuperAdmin
        ? (filters.headOfficeId || undefined)
        : isHeadOfficeAdmin
          ? (authHeadOfficeId != null ? String(authHeadOfficeId) : undefined)
          : undefined
      const schoolId = isSchoolAdmin || isTeacherScope
        ? (resolvedSchoolId || undefined)
        : filters.schoolId !== 'All'
          ? filters.schoolId
          : undefined

      const data = await fetchStudentTypesPage({
        headOfficeId,
        schoolId,
        page: currentPage - 1,
        size: rowsPerPage,
      })

      setStudentTypes(Array.isArray(data?.content) ? data.content : [])
      setTotalElements(Number(data?.totalElements ?? 0))
      setTotalPages(Math.max(1, Number(data?.totalPages ?? 1)))
    } catch (e) {
      setStudentTypes([])
      setTotalElements(0)
      setTotalPages(1)
      setError(e?.message || 'Failed to load student types')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        await loadSchools()
      } catch {
        if (!cancelled) setSchools([])
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (isSuperAdmin) return
    const nextFilters = {
      headOfficeId: isHeadOfficeAdmin && authHeadOfficeId != null ? String(authHeadOfficeId) : '',
      schoolId: (isSchoolAdmin || isTeacherScope) && resolvedSchoolId ? String(resolvedSchoolId) : 'All',
      studentType: 'Select',
    }
    setFilters(nextFilters)
    setPendingFilters(nextFilters)
  }, [authHeadOfficeId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, isTeacherScope, resolvedSchoolId])

  useEffect(() => {
    void loadRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, refreshKey, filters.headOfficeId, filters.schoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin])

  useEffect(() => {
    if (!isTeacherScope || !resolvedSchoolLabel) return
    setPendingFilters((prev) => (prev.schoolId === 'All' ? { ...prev, schoolId: resolvedSchoolId } : prev))
    setFilters((prev) => (prev.schoolId === 'All' ? { ...prev, schoolId: resolvedSchoolId } : prev))
  }, [isTeacherScope, resolvedSchoolId, resolvedSchoolLabel])

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...filtered.map((row) => row.id)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !filtered.some((row) => row.id === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
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
    const next = isSuperAdmin
      ? { ...emptyFilters }
      : {
          headOfficeId: isHeadOfficeAdmin && authHeadOfficeId != null ? String(authHeadOfficeId) : '',
          schoolId: (isSchoolAdmin || isTeacherScope) && resolvedSchoolId ? String(resolvedSchoolId) : 'All',
          studentType: 'Select',
        }
    setPendingFilters(next)
    setFilters(next)
    setCurrentPage(1)
    if (isSuperAdmin) {
      manualScope.setSelectedScope('', '')
    }
  }

  const openAdd = () => {
    setError('')
    setEditingId(null)
    const schoolId = (isSchoolAdmin || isTeacherScope) && resolvedSchoolId ? resolvedSchoolId : ''
    const school = getSchoolById(schools, schoolId)
    const headOfficeId = isSuperAdmin
      ? (manualScope.selectedHeadOfficeId || filters.headOfficeId || '')
      : isHeadOfficeAdmin
        ? (authHeadOfficeId != null ? String(authHeadOfficeId) : '')
        : school?.headOfficeId != null
          ? String(school.headOfficeId)
          : ''

    setAddForm({
      headOfficeId,
      schoolId,
      studentType: '',
      note: '',
    })

    if (isSuperAdmin && headOfficeId) {
      manualScope.setSelectedScope(headOfficeId, '')
    }
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setError('')
    setEditingId(row.id)
    const school = getSchoolById(schools, row.schoolId)
    const headOfficeId = school?.headOfficeId != null ? String(school.headOfficeId) : ''
    setEditForm({
      headOfficeId,
      schoolId: row.schoolId != null ? String(row.schoolId) : '',
      studentType: row.studentType || '',
      note: row.note || '',
    })
    if (isSuperAdmin && headOfficeId) {
      manualScope.setSelectedScope(headOfficeId, row.schoolId != null ? String(row.schoolId) : '')
    }
    setEditStep(0)
    setIsEditOpen(true)
  }

  const buildPayload = (form) => {
    const school = getSchoolById(schools, form.schoolId)
    return {
      headOfficeId: form.headOfficeId ? Number(form.headOfficeId) : school?.headOfficeId != null ? Number(school.headOfficeId) : null,
      schoolId: form.schoolId ? Number(form.schoolId) : null,
      studentType: form.studentType || '',
      note: form.note || '',
    }
  }

  const handleCreate = async () => {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await createStudentType(buildPayload(addForm))
      setIsAddOpen(false)
      setAddForm(emptyForm)
      setAddStep(0)
      setCurrentPage(1)
      setRefreshKey((k) => k + 1)
    } catch (e) {
      setError(e?.message || 'Failed to create student type')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (saving) return
    if (!editingId) {
      setError('No record selected for update')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateStudentType(editingId, buildPayload(editForm))
      setIsEditOpen(false)
      setEditForm(emptyForm)
      setEditStep(0)
      setEditingId(null)
      setRefreshKey((k) => k + 1)
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
      setRefreshKey((k) => k + 1)
    } catch (e) {
      setError(e?.message || 'Failed to delete student type')
    } finally {
      setSaving(false)
    }
  }

  const schoolNameById = useMemo(() => {
    const map = {}
    schools.forEach((s) => {
      map[s.id] = s.schoolName
    })
    return map
  }, [schools])

  const teacherSchoolName = resolvedSchoolLabel || schoolNameById[resolvedSchoolId] || ''

  const getSchoolName = (row) => row.schoolName || row.school || schoolNameById[row.schoolId] || '-'

  const renderForm = (form, setter) => (
    <>
      <p className="avm-section-title">Basic Information</p>
      <div className="avm-grid">
        {isSuperAdmin ? (
          <ManualScopeSelectors
            enabled
            headOffices={manualScope.headOffices}
            schoolOptions={manualScope.schoolOptions}
            selectedHeadOfficeId={form.headOfficeId}
            onHeadOfficeChange={(value) => {
              setter((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))
              manualScope.setSelectedScope(value, '')
            }}
            selectedSchoolId={form.schoolId}
            onSchoolChange={(value) => {
              const school = getSchoolById(schools, value)
              const nextHeadOfficeId = school?.headOfficeId != null ? String(school.headOfficeId) : form.headOfficeId
              setter((prev) => ({
                ...prev,
                headOfficeId: nextHeadOfficeId,
                schoolId: value,
              }))
              if (nextHeadOfficeId) {
                manualScope.setSelectedScope(nextHeadOfficeId, value)
              }
            }}
          />
        ) : (
          <>
            {isHeadOfficeAdmin ? (
              <FormField label="Head Office" required full>
                <input className="avm-input" value={authHeadOfficeName || ''} readOnly />
              </FormField>
            ) : null}

            <FormField label="School Name" required full>
              {(isSchoolAdmin || isTeacherScope) ? (
                <input type="text" className="avm-input" value={teacherSchoolName} readOnly />
              ) : (
                <select className="avm-select" id="schoolId" value={form.schoolId} onChange={handleChange(setter)}>
                  <option value="">-- Select School --</option>
                  {schoolOptions.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.schoolName}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
          </>
        )}

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

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({ ...prev, [id]: value }))
  }

  const currentStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const currentEnd = totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Student Type</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Student Type</span>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-12">
          <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <span className="d-flex text-md">
              <i className="ri-add-large-line" />
            </span>
            Add Student Type
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-8" role="alert">
          <i className="ri-error-warning-line" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line" /></span>
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span><i className="ri-arrow-down-s-line" /></span>
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
                onChange={(value) => {
                  setRowsPerPage(value)
                  setCurrentPage(1)
                }}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search student type..."
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
                      {visibleColumns.studentType && <td className="fw-medium text-primary-light">{row.studentType}</td>}
                      {visibleColumns.note && <td>{row.note}</td>}
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
                            onClick={() => handleDelete(row.id)}
                            title="Delete"
                            disabled={saving}
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
              Showing {currentStart} - {currentEnd} of {totalElements} entries
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 3) }, (_, index) => {
                const base = Math.max(1, currentPage - 1)
                const pageNumber = Math.min(totalPages, base + index)
                return pageNumber > 0 ? (
                  <button
                    key={pageNumber}
                    type="button"
                    className={pageNumber === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'}
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ) : null
              })}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

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

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Student Type"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={manualScope.headOffices}
              schoolOptions={manualScope.schoolOptions}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={(value) => {
                setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: 'All' }))
                manualScope.setSelectedScope(value, '')
              }}
              selectedSchoolId={pendingFilters.schoolId === 'All' ? '' : pendingFilters.schoolId}
              onSchoolChange={(value) => setPendingFilters((prev) => ({ ...prev, schoolId: value || 'All' }))}
            />
          ) : (
            <>
              {isHeadOfficeAdmin ? (
                <div>
                  <label htmlFor="studentTypeFilterHeadOffice" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                    Head Office
                  </label>
                  <input id="studentTypeFilterHeadOffice" className="form-control" value={authHeadOfficeName || ''} readOnly />
                </div>
              ) : null}

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
                  <option value="All">All Schools</option>
                  {schoolOptions.map((school) => (
                    <option key={school.id} value={String(school.id)}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

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
                <option key={option} value={option}>
                  {option}
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
            <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default StudentType
