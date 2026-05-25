import { useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { normalizeRole } from '../utils/roles'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import {
  createExamInstruction,
  deleteExamInstruction,
  fetchExamInstructionsPage,
  updateExamInstruction,
} from '../apis/examInstructionsApi'

const emptyForm = {
  school: '',
  title: '',
  instruction: '',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  status: 'Select',
}

const STEPS = ['Basic']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Title: 'ri-file-list-2-line',
  Instruction: 'ri-information-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'title', label: 'Title' },
  { key: 'instruction', label: 'Instruction' },
  { key: 'status', label: 'Status' },
]

const statusBadge = (status) => {
  if (status === 'Active') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (status === 'Inactive') return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
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

const ExamInstruction = () => {
  const { status, token, role: authRole, user, headOfficeId: authHeadOfficeId, schoolId: authSchoolId, canAdd, canEdit, canDelete } = useAuth()
  const PAGE_SLUG = 'exam-instruction'
  const isSuperAdmin = useMemo(
    () => normalizeRole(authRole || user?.role || user?.userRole || user?.authority) === 'SUPER_ADMIN',
    [authRole, user],
  )
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const [headOffices, setHeadOffices] = useState([])
  const [schools, setSchools] = useState([])
  
  const [rows, setRows] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState({ ...emptyForm, id: null })
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const getSchoolById = (schoolId) =>
    (Array.isArray(schools) ? schools : []).find((school) => String(school?.id ?? '') === String(schoolId ?? '')) || null

  useEffect(() => {
    if (status !== 'ready' || !token) return

    let cancelled = false
    const loadLookups = async () => {
      try {
        const [headOfficePage, schoolList] = await Promise.all([
          fetchHeadOfficesPage(0, 500),
          fetchSchoolsLookup(),
        ])
        if (cancelled) return
        setHeadOffices(Array.isArray(headOfficePage?.content) ? headOfficePage.content : [])
        setSchools(Array.isArray(schoolList) ? schoolList : [])
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load exam instruction lookups:', err)
        setHeadOffices([])
        setSchools([])
      }
    }

    void loadLookups()
    return () => {
      cancelled = true
    }
  }, [status, token])

  const scopeSchoolOptions = useMemo(() => {
    const rows = Array.isArray(schools) ? schools : []
    if (isSuperAdmin) {
      if (!manualScope.selectedHeadOfficeId) return []
      return rows.filter((school) => String(school?.headOfficeId ?? '') === String(manualScope.selectedHeadOfficeId))
    }
    if (authHeadOfficeId != null) {
      return rows.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId))
    }
    return rows
  }, [authHeadOfficeId, isSuperAdmin, manualScope.selectedHeadOfficeId, schools])

  const filterSchoolOptions = useMemo(() => {
    const list = Array.isArray(schools) ? schools : []
    if (filters.headOfficeId) {
      return list.filter((school) => String(school?.headOfficeId ?? '') === String(filters.headOfficeId))
    }
    if (authHeadOfficeId != null) {
      return list.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId))
    }
    if (authSchoolId != null) {
      return list.filter((school) => String(school?.id ?? '') === String(authSchoolId))
    }
    return list
  }, [authHeadOfficeId, authSchoolId, filters.headOfficeId, schools])

  const loadData = async () => {
    if (status !== 'ready' || !token) return
    setBusy(true)
    setLoadError('')
    try {
      const pageData = await fetchExamInstructionsPage({
        headOfficeId: filters.headOfficeId || undefined,
        schoolId: filters.schoolId || undefined,
        status: filters.status !== 'Select' ? filters.status : undefined,
        page: currentPage - 1,
        size: rowsPerPage,
        search: debouncedSearch,
      })
      setRows(Array.isArray(pageData?.content) ? pageData.content : [])
      setTotalElements(pageData?.totalElements || 0)
      setTotalPages(pageData?.totalPages || 0)
    } catch (err) {
      console.error('Failed to load exam instructions:', err)
      setLoadError('Failed to load data. Please try again.')
      setRows([])
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    loadData()
  }, [status, token, currentPage, rowsPerPage, debouncedSearch, filters])

  const allSelected =
    rows.length > 0 && rows.every((r) => selectedRows.includes(r.id))

  const handleSelectAll = (e) => {
    if (e.target.checked)
      setSelectedRows((prev) => [...new Set([...prev, ...rows.map((r) => r.id)])])
    else setSelectedRows((prev) => prev.filter((id) => !rows.some((r) => r.id === id)))
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

  const openAdd = () => {
    setAddForm(emptyForm)
    setAddStep(0)
    manualScope.setSelectedScope('', '')
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditForm({
      id: row.id,
      school: String(row.schoolId || ''),
      title: row.title,
      instruction: row.instruction,
    })
    setEditStep(0)
    const s = schools.find(item => String(item.id) === String(row.schoolId))
    manualScope.setSelectedScope(String(s?.headOfficeId || ''), String(row.schoolId || ''))
    setIsEditOpen(true)
  }

  const handleSave = async (form, setter, close) => {
    try {
      const payload = {
        ...form,
        schoolId: Number(form.school),
      }
      if (form.id) {
        await updateExamInstruction(form.id, payload)
      } else {
        await createExamInstruction(payload)
      }
      loadData()
      close()
    } catch (err) {
      console.error('Failed to save exam instruction:', err)
      alert('Failed to save. Please check your inputs.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this instruction?')) return
    try {
      await deleteExamInstruction(id)
      loadData()
    } catch (err) {
      console.error('Failed to delete:', err)
      alert('Failed to delete.')
    }
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
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

  const renderForm = (form, setter) => (
    <>
      <p className="avm-section-title">Basic Information</p>
      <div className="avm-grid">
        {isSuperAdmin ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <ManualScopeSelectors
              enabled
              headOffices={(Array.isArray(manualScope.headOffices) && manualScope.headOffices.length > 0
                ? manualScope.headOffices
                : headOffices.map((ho) => ({ id: ho.id, name: ho.name || ho.headOfficeName || '' }))).filter((ho) => ho.id != null && ho.name)}
              schoolOptions={scopeSchoolOptions.map((school) => ({ id: school.id, schoolName: school.schoolName || school.name || '' }))}
              selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
              onHeadOfficeChange={(value) => {
                manualScope.setSelectedScope(value, '')
                setter((prev) => ({ ...prev, headOfficeId: value, school: '' }))
              }}
              selectedSchoolId={form.school}
              onSchoolChange={(value) => {
                manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value)
                setter((prev) => ({ ...prev, headOfficeId: manualScope.selectedHeadOfficeId, school: value }))
              }}
              schoolLabel="School Name"
            />
          </div>
        ) : (
          <>
            <FormField label="Head Office" required full>
              <input className="avm-input" value={authHeadOfficeName || ''} readOnly />
            </FormField>

            <FormField label="School Name" required full>
              <select
                className="avm-select"
                id="school"
                value={form.school}
                onChange={handleChange(setter)}
              >
                <option value="">--Select School--</option>
                {scopeSchoolOptions.map((school) => (
                  <option key={school.id} value={String(school.id)}>
                    {school.schoolName || school.name}
                  </option>
                ))}
              </select>
            </FormField>
          </>
        )}

        <FormField label="Title" required full>
          <input
            type="text"
            className="avm-input"
            id="title"
            placeholder="Title"
            value={form.title}
            onChange={handleChange(setter)}
          />
        </FormField>

        <FormField label="Instruction" required full noIcon>
          <textarea
            rows={6}
            className="avm-input avm-textarea"
            id="instruction"
            placeholder="Instruction"
            value={form.instruction}
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Exam Instruction</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Exam Instruction</span>
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
            Add Exam Instruction
          </button>
        )}
      </div>

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
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

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
                placeholder="Search exam instructions..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.title ? <th scope="col">Title</th> : null}
                  {visibleColumns.instruction ? <th scope="col">Instruction</th> : null}
                  {visibleColumns.status ? <th scope="col">Status</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {busy && rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      No exam instructions found.
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
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.school ? <td>{row.schoolName || row.name}</td> : null}
                      {visibleColumns.title ? (
                        <td className="fw-medium text-primary-light">{row.title}</td>
                      ) : null}
                      {visibleColumns.instruction ? (
                        <td>
                          <span
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              maxWidth: 320,
                              fontSize: '0.85rem',
                              color: '#5a6472',
                            }}
                          >
                            {row.instruction}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.status ? (
                        <td>
                          <span className={statusBadge(row.status)}>{row.status}</span>
                        </td>
                      ) : null}
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
                              onClick={() => handleDelete(row.id)}
                              title="Delete"
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
        modalWidth="540px"
        open={isAddOpen}
        title="Add Exam Instruction"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onSubmit={() => handleSave(addForm, setAddForm, () => setIsAddOpen(false))}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm)}
      </WizardPopup>

      <WizardPopup
        modalWidth="540px"
        open={isEditOpen}
        title="Edit Exam Instruction"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onSubmit={() => handleSave(editForm, setEditForm, () => setIsEditOpen(false))}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm)}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Exam Instructions"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
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
              schoolLabel="School Name"
            />
          ) : (
            <div className="avm-field full">
              <label htmlFor="schoolId" className="avm-label">
                School Name
              </label>
              <select
                id="schoolId"
                className="avm-select"
                value={pendingFilters.schoolId}
                onChange={(e) => {
                  const value = e.target.value
                  const selectedSchool = getSchoolById(value)
                  setPendingFilters((prev) => ({
                    ...prev,
                    schoolId: value,
                    headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
                  }))
                }}
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

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="status" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Status
            </label>
            <select
              id="status"
              className="form-control form-select"
              value={pendingFilters.status}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="Select">Select</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
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

export default ExamInstruction
