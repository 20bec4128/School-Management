import { useCallback, useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { fetchRowsForSchoolIds, findSchoolById, normalizeSchoolIds, uniqueBy } from '../utils/schoolScope'
import {
  createComplainType,
  deleteComplainType,
  fetchComplainTypes,
  updateComplainType,
} from '../apis/complainTypeApi'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  complainType: '',
}

const emptyFilters = {
  schoolId: '',
}

const STEPS = ['Basic']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Complain Type': 'ri-error-warning-line',
}

const columnOptions = [
  { key: 'schoolId', label: 'School ID' },
  { key: 'complainType', label: 'Complain Type' },
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

const ComplainType = () => {
  const { role, schoolId: authSchoolId } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const [data, setData] = useState([])
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
  const listSchoolId = isSuperAdmin
    ? (activeSchoolId ? String(activeSchoolId) : '')
    : activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
  const schoolOptions = isSuperAdmin ? (manualScope.selectedHeadOfficeId ? manualScope.schoolOptions : []) : contextSchoolOptions
  const isSchoolLocked = !isSuperAdmin && !!listSchoolId

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isSuperAdmin) {
        if (listSchoolId) {
          const list = await fetchComplainTypes(listSchoolId)
          setData(Array.isArray(list) ? list : [])
        } else {
          const schoolIds = normalizeSchoolIds(contextSchoolOptions)
          const list = await fetchRowsForSchoolIds(schoolIds, (schoolId) => fetchComplainTypes(schoolId))
          setData(uniqueBy(list, (row) => String(row?.id ?? `${row?.schoolId ?? ''}-${row?.complainType ?? ''}`)))
        }
      } else {
        if (!listSchoolId) {
          setData([])
          setError('Select a school before viewing complain types.')
          return
        }
        const list = await fetchComplainTypes(listSchoolId)
        setData(Array.isArray(list) ? list : [])
      }
    } catch (err) {
      console.error('Failed to fetch complain types:', err)
      setError(err?.message || 'Failed to fetch complain types')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [isSuperAdmin, listSchoolId, contextSchoolOptions])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (!isSuperAdmin && listSchoolId) {
      setAddForm((prev) => ({ ...prev, schoolId: listSchoolId }))
    }
  }, [isSuperAdmin, listSchoolId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((row) => {
      const matchesSearch = !q || [String(row.schoolId), row.complainType].join(' ').toLowerCase().includes(q)
      const matchesSchool = !filters.schoolId || String(row.schoolId) === String(filters.schoolId)
      return matchesSearch && matchesSchool
    })
  }, [data, filters, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((row) => selectedRows.includes(row.id))

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((row) => row.id)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !paginated.some((row) => row.id === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const handleChange = (setter) => (event) => {
    const { id, value } = event.target
    setter((prev) => ({ ...prev, [id]: value }))
  }

  const handlePendingFilterChange = (event) => {
    const { id, value } = event.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (event) => {
    event.preventDefault()
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
    setAddForm({ ...emptyForm, headOfficeId: manualScope.selectedHeadOfficeId || '', schoolId: isSuperAdmin ? '' : listSchoolId || '' })
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setError('')
    const school = findSchoolById(manualScope.schoolOptions, row.schoolId)
    if (school?.headOfficeId != null) {
      manualScope.setSelectedScope(String(school.headOfficeId), row.schoolId != null ? String(row.schoolId) : '')
    }
    setEditForm({
      id: row.id,
      headOfficeId:
        row?.headOfficeId != null
          ? String(row.headOfficeId)
          : manualScope.selectedHeadOfficeId || '',
      schoolId: row.schoolId != null ? String(row.schoolId) : listSchoolId,
      complainType: row.complainType || '',
    })
    setEditStep(0)
    setIsEditOpen(true)
  }

  const buildPayload = (form) => ({
    schoolId: form.schoolId ? Number(form.schoolId) : null,
    complainType: form.complainType || '',
  })

  const handleSave = async () => {
    try {
      if (!addForm.schoolId || !addForm.complainType) {
        alert('Please fill all required fields')
        return
      }
      await createComplainType(buildPayload(addForm))
      setIsAddOpen(false)
      void loadData()
    } catch (err) {
      setError(err?.message || 'Failed to save complain type')
      alert('Failed to save complain type')
    }
  }

  const handleUpdate = async () => {
    try {
      await updateComplainType(editForm.id, buildPayload(editForm))
      setIsEditOpen(false)
      void loadData()
    } catch (err) {
      setError(err?.message || 'Failed to update complain type')
      alert('Failed to update complain type')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this complain type?')) return
    try {
      await deleteComplainType(id)
      void loadData()
    } catch (err) {
      alert('Failed to delete complain type')
    }
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let page = start; page <= end; page += 1) pages.push(page)
    return pages
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
              {schoolOptions.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.schoolName}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="Complain Type" required full>
          <input
            type="text"
            className="avm-input"
            id="complainType"
            placeholder="Enter complain type"
            value={form.complainType}
            onChange={handleChange(setter)}
          />
        </FormField>
      </div>
    </>
  )

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Complain Type</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Complain Type</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={openAdd}
            disabled={!isSuperAdmin && !listSchoolId}
            title={!isSuperAdmin && !listSchoolId ? 'Select a school first' : ''}
          >
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add Complain Type
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-8" role="alert">
          <i className="ri-error-warning-line"></i>
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

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value))
                  setCurrentPage(1)
                }}
              >
                {[5, 10, 20, 50].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search complain type..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setCurrentPage(1)
                }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

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
                  {visibleColumns.schoolId ? <th scope="col">School ID</th> : null}
                  {visibleColumns.complainType ? <th scope="col">Complain Type</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      Loading...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      No complain types found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, index) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + index + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.schoolId ? <td>{row.schoolId}</td> : null}
                      {visibleColumns.complainType ? <td className="fw-medium text-primary-light">{row.complainType}</td> : null}
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

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
                Prev
              </button>
              {getVisiblePages().map((page) => (
                <button
                  key={page}
                  type="button"
                  className={page === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <WizardPopup
        modalWidth="480px"
        open={isAddOpen}
        title="Add Complain Type"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((step) => Math.max(0, step - 1))}
        onNext={() => setAddStep((step) => Math.min(STEPS.length - 1, step + 1))}
        onSubmit={handleSave}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm)}
      </WizardPopup>

      <WizardPopup
        modalWidth="480px"
        open={isEditOpen}
        title="Edit Complain Type"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((step) => Math.max(0, step - 1))}
        onNext={() => setEditStep((step) => Math.min(STEPS.length - 1, step + 1))}
        onSubmit={handleUpdate}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm)}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Complain Types"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div className="full">
            <ManualScopeSelectors
              enabled={isSuperAdmin}
              headOffices={manualScope.headOffices}
              schoolOptions={schoolOptions}
              selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
              onHeadOfficeChange={manualScope.setSelectedHeadOfficeId}
              selectedSchoolId={manualScope.selectedSchoolId}
              onSchoolChange={manualScope.setSelectedSchoolId}
              schoolLabel="School"
              showSchoolSelector={false}
            />
          </div>
          <div className="full">
            <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School
            </label>
            <select id="schoolId" className="form-control form-select" value={pendingFilters.schoolId} onChange={handlePendingFilterChange}>
              <option value="">All Schools</option>
              {schoolOptions.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.schoolName}
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
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default ComplainType
