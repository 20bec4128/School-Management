import { useMemo, useState, useEffect, useCallback } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useSchool } from '../context/useSchool'
import { useAuth } from '../context/useAuth'
import { fetchRowsForSchoolIds, findSchoolById, normalizeSchoolIds, uniqueBy } from '../utils/schoolScope'
import { 
  fetchVisitorPurposes,
  fetchVisitorPurposesPage,
  createVisitorPurpose, 
  updateVisitorPurpose, 
  deleteVisitorPurpose 
} from '../apis/visitorPurposeApi'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'

const emptyForm = {
  schoolId: '',
  purpose: '',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
}

const STEPS = ['Basic']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Visitor Purpose': 'ri-question-answer-line',
}

const columnOptions = [
  { key: 'schoolId', label: 'School Name' },
  { key: 'purpose', label: 'Visitor Purpose' },
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

const VisitorPurpose = () => {
  const { role, schoolId: authSchoolId, schoolName: authSchoolName, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, canAdd, canEdit, canDelete } = useAuth()
  const PAGE_SLUG = 'visitor-purpose'
  const PAGE_PERMISSIONS = {
    add: canAdd(PAGE_SLUG),
    edit: canEdit(PAGE_SLUG),
    delete: canDelete(PAGE_SLUG),
  }
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const [data, setData] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
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
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)
  const schoolOptions = isSuperAdmin
    ? (manualScope.selectedHeadOfficeId ? manualScope.schoolOptions : contextSchoolOptions)
    : contextSchoolOptions
  const currentSchool = useMemo(() => {
    const targetSchoolId = activeSchoolId || authSchoolId || ''
    return (Array.isArray(contextSchoolOptions) ? contextSchoolOptions : []).find((school) => String(school?.id ?? '') === String(targetSchoolId)) || null
  }, [activeSchoolId, authSchoolId, contextSchoolOptions])
  const schoolHeadOfficeId = currentSchool?.headOfficeId != null ? String(currentSchool.headOfficeId) : (authHeadOfficeId != null ? String(authHeadOfficeId) : '')
  const schoolHeadOfficeName = authHeadOfficeName || (schoolHeadOfficeId ? `Head Office ${schoolHeadOfficeId}` : '')
  const scopedSchoolIds = useMemo(() => {
    if (isSuperAdmin) {
      if (filters.schoolId) return [String(filters.schoolId)]
      if (manualScope.selectedSchoolId) return [String(manualScope.selectedSchoolId)]
      if (manualScope.selectedHeadOfficeId) return normalizeSchoolIds(manualScope.schoolOptions)
      return normalizeSchoolIds(contextSchoolOptions)
    }

    const singleSchoolId =
      activeSchoolId || authSchoolId || (schoolOptions.length === 1 ? schoolOptions[0]?.id : '')
    return String(singleSchoolId ?? '').trim() ? [String(singleSchoolId)] : []
  }, [
    activeSchoolId,
    authSchoolId,
    contextSchoolOptions,
    filters.schoolId,
    isSuperAdmin,
    manualScope.schoolOptions,
    manualScope.selectedHeadOfficeId,
    manualScope.selectedSchoolId,
    schoolOptions,
  ])
  const listSchoolId = scopedSchoolIds[0] || ''
  const showSchoolSelector = schoolOptions.length > 1
  const isSchoolLocked = !isSuperAdmin && !!listSchoolId
  const resolveSchoolName = useCallback((schoolId) => {
    const targetSchoolId = String(schoolId ?? '').trim()
    if (!targetSchoolId) return '-'

    const match =
      findSchoolById(manualScope.schoolOptions, targetSchoolId) ||
      findSchoolById(contextSchoolOptions, targetSchoolId)

    if (match?.schoolName) return match.schoolName
    if (String(authSchoolId ?? '') === targetSchoolId) return authSchoolName || `School ${targetSchoolId}`
    return `School ${targetSchoolId}`
  }, [authSchoolId, authSchoolName, contextSchoolOptions, manualScope.schoolOptions])
  const currentStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const currentEnd = totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (scopedSchoolIds.length === 0) {
        setData([])
        setTotalElements(0)
        setTotalPages(1)
        return
      }

      if (scopedSchoolIds.length === 1) {
        const pageData = await fetchVisitorPurposesPage({
          schoolId: scopedSchoolIds[0],
          page: currentPage - 1,
          size: rowsPerPage,
          search,
        })
        setData(Array.isArray(pageData?.content) ? pageData.content : [])
        setTotalElements(Number(pageData?.totalElements ?? 0))
        setTotalPages(Math.max(1, Number(pageData?.totalPages ?? 1)))
        return
      }

      const rows = await fetchRowsForSchoolIds(scopedSchoolIds, fetchVisitorPurposes)
      const normalizedRows = uniqueBy(Array.isArray(rows) ? rows : [], (row) => row?.id)
        .filter((row) => {
          if (!search.trim()) return true
          return String(row?.purpose ?? '').toLowerCase().includes(search.trim().toLowerCase())
        })
        .sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0))
      const start = Math.max(0, (currentPage - 1) * rowsPerPage)
      const end = Math.min(start + rowsPerPage, normalizedRows.length)
      setData(normalizedRows.slice(start, end))
      setTotalElements(normalizedRows.length)
      setTotalPages(Math.max(1, Math.ceil(normalizedRows.length / rowsPerPage)))
    } catch (err) {
      console.error('Failed to fetch visitor purposes:', err)
      setError(err?.message || 'Failed to fetch visitor purposes')
      setData([])
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [currentPage, rowsPerPage, scopedSchoolIds, search])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (listSchoolId) {
      setAddForm((prev) => ({ ...prev, schoolId: listSchoolId }))
    }
  }, [listSchoolId])

  const allSelected = data.length > 0 && data.every((r) => selectedRows.includes(r.id))

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows((prev) => [...new Set([...prev, ...data.map((r) => r.id)])])
    else setSelectedRows((prev) => prev.filter((id) => !data.some((r) => r.id === id)))
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

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
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
  }

  const openAdd = () => {
    setError('')
    setAddForm({ ...emptyForm, schoolId: isSuperAdmin ? '' : listSchoolId || '' })
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setError('')
    if (isSuperAdmin) {
      const school = findSchoolById(manualScope.schoolOptions, row.schoolId)
      if (school?.headOfficeId != null) {
        manualScope.setSelectedScope(String(school.headOfficeId), row.schoolId != null ? String(row.schoolId) : '')
      }
    }
    setEditForm({ id: row.id, schoolId: row.schoolId != null ? String(row.schoolId) : listSchoolId, purpose: row.purpose })
    setEditStep(0)
    setIsEditOpen(true)
  }

  const buildPayload = (form) => ({
    schoolId: form.schoolId ? Number(form.schoolId) : null,
    purpose: form.purpose || '',
  })

  const handleSave = async () => {
    try {
      if (!addForm.schoolId || !addForm.purpose) {
        alert('Please fill all required fields')
        return
      }
      await createVisitorPurpose(buildPayload(addForm))
      setIsAddOpen(false)
      void loadData()
    } catch (err) {
      setError(err?.message || 'Failed to save visitor purpose')
      alert('Failed to save visitor purpose')
    }
  }

  const handleUpdate = async () => {
    try {
      await updateVisitorPurpose(editForm.id, buildPayload(editForm))
      setIsEditOpen(false)
      void loadData()
    } catch (err) {
      setError(err?.message || 'Failed to update visitor purpose')
      alert('Failed to update visitor purpose')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purpose?')) return
    try {
      await deleteVisitorPurpose(id)
      void loadData()
    } catch (err) {
      alert('Failed to delete visitor purpose')
    }
  }

  const renderForm = (form, setter) => (
    <>
      <p className="avm-section-title">Basic Information</p>
      <div className="avm-grid">
        {isSuperAdmin ? (
          <div className="avm-field full">
            <ManualScopeSelectors
              enabled={isSuperAdmin}
              headOffices={manualScope.headOffices}
              schoolOptions={schoolOptions}
              showSchoolSelector={showSchoolSelector}
              selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
              onHeadOfficeChange={(value) => {
                manualScope.setSelectedHeadOfficeId(value)
                manualScope.setSelectedSchoolId('')
                setter((prev) => ({ ...prev, schoolId: '' }))
              }}
              selectedSchoolId={form.schoolId}
              onSchoolChange={(value) => setter((prev) => ({ ...prev, schoolId: value }))}
            />
          </div>
        ) : (
          <FormField label="School Name" required full>
            <select 
              className="avm-select" 
              id="schoolId" 
              value={form.schoolId} 
              onChange={handleChange(setter)}
              disabled={isSchoolLocked}
            >
              <option value="">--Select School--</option>
              {schoolOptions.map(s => (
                <option key={s.id} value={s.id}>{s.schoolName}</option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="Visitor Purpose" required full>
          <input
            type="text"
            className="avm-input"
            id="purpose"
            placeholder="Enter visitor purpose"
            value={form.purpose}
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Visitor Purpose</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">Dashboard</button>
            <span className="text-secondary-light"> / Visitor Purpose</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
          {PAGE_PERMISSIONS.add && (
            <button 
              type="button" 
              className="btn btn-primary-600 d-flex align-items-center gap-6" 
              onClick={openAdd}
              disabled={!isSuperAdmin && !listSchoolId}
              title={!isSuperAdmin && !listSchoolId ? 'Select a school first' : ''}
            >
              <span className="d-flex text-md"><i className="ri-add-large-line"></i></span>
              Add Visitor Purpose
            </button>
          )}
        </div>
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
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  {columnOptions.map((column) => (
                    <li key={column.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input type="checkbox" className="form-check-input mt-0" checked={visibleColumns[column.key]} onChange={() => toggleColumn(column.key)} />
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

            {/* Search */}
            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search visitor purpose..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light"><i className="ri-search-line"></i></span>
            </div>
          </div>

          {/* Table */}
          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.schoolId ? <th scope="col">School Name</th> : null}
                  {visibleColumns.purpose ? <th scope="col">Visitor Purpose</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">Loading...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">No visitor purposes found.</td></tr>
                ) : data.map((row, idx) => (
                  <tr key={row.id}>
                    <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input type="checkbox" className="form-check-input" checked={selectedRows.includes(row.id)} onChange={() => handleSelectRow(row.id)} />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                    {visibleColumns.schoolId ? <td>{resolveSchoolName(row.schoolId)}</td> : null}
                    {visibleColumns.purpose ? <td className="fw-medium text-primary-light">{row.purpose}</td> : null}
                    <td>
                      <div className="d-flex align-items-center gap-10">
                        {PAGE_PERMISSIONS.edit && (
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => openEdit(row)}
                            title="Edit"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                        )}
                        {PAGE_PERMISSIONS.delete && (
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => handleDelete(row.id)}
                            title="Delete"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {currentStart} - {currentEnd} of {totalElements} entries
            </span>
            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || totalPages < 1}
              >
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
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.min(Math.max(1, totalPages), p + 1))}
                disabled={currentPage === totalPages || totalPages < 1}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <WizardPopup
        modalWidth="480px"
        open={isAddOpen}
        title="Add Visitor Purpose"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleSave}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm)}
      </WizardPopup>

      {/* Edit Modal */}
      <WizardPopup
        modalWidth="480px"
        open={isEditOpen}
        title="Edit Visitor Purpose"
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
        title="Filter Visitor Purposes"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
        {isSuperAdmin ? (
          <div className="full">
            <ManualScopeSelectors
              enabled={isSuperAdmin}
              headOffices={manualScope.headOffices}
              schoolOptions={schoolOptions}
              showSchoolSelector={showSchoolSelector}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={(val) => setPendingFilters((p) => ({ ...p, headOfficeId: val, schoolId: '' }))}
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={(val) => setPendingFilters((p) => ({ ...p, schoolId: val }))}
            />
            </div>
          ) : (
            <>
              <div className="full">
                <label htmlFor="headOfficeId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                  Head Office
                </label>
                <input
                  id="headOfficeId"
                  className="form-control"
                  value={schoolHeadOfficeName}
                  readOnly
                />
              </div>
              <div className="full">
                <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                  School
                </label>
                <select
                  id="schoolId"
                  className="form-control form-select"
                  value={pendingFilters.schoolId}
                  onChange={handlePendingFilterChange}
                >
                  <option value="">All Schools</option>
                  {(contextSchoolOptions || []).map((s) => (
                    <option key={String(s.id)} value={String(s.id)}>{s.schoolName}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
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

export default VisitorPurpose

