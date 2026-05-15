import { useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

import { useAuth } from '../context/useAuth'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createExpenditureHead, deleteExpenditureHead, fetchExpenditureHeadsPage, updateExpenditureHead } from '../apis/expenditureHeadsApi'
import { normalizeRole } from '../utils/roles'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  expenditureHead: '',
  note: '',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
}

const STEPS = ['Basic Information']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Expenditure Head': 'ri-money-dollar-box-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'expenditureHead', label: 'Expenditure Head' },
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

const ExpenditureHead = () => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'

  const [rows, setRows] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [headOffices, setHeadOffices] = useState([])
  const [schools, setSchools] = useState([])

  const [scopeSchoolId, setScopeSchoolId] = useState(() => (authSchoolId != null ? String(authSchoolId) : ''))

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

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

  const schoolsById = useMemo(() => {
    const map = new Map()
    for (const s of Array.isArray(schools) ? schools : []) {
      if (s?.id != null) map.set(String(s.id), s)
    }
    return map
  }, [schools])

  const headOfficesById = useMemo(() => {
    const map = new Map()
    for (const ho of Array.isArray(headOffices) ? headOffices : []) {
      if (ho?.id != null) map.set(String(ho.id), ho)
    }
    return map
  }, [headOffices])

  const schoolOptionsForScope = useMemo(() => {
    const list = Array.isArray(schools) ? schools : []
    if (isSuperAdmin) return list
    if (isHeadOfficeAdmin) {
      return list.filter((school) => String(school.headOfficeId ?? '') === String(authHeadOfficeId))
    }
    return []
  }, [authHeadOfficeId, isHeadOfficeAdmin, isSuperAdmin, schools])

  const schoolsForHeadOffice = (headOfficeId) => {
    const list = Array.isArray(schools) ? schools : []
    if (isSuperAdmin) {
      if (!headOfficeId) return list
      return list.filter((school) => String(school.headOfficeId ?? '') === String(headOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return list.filter((school) => String(school.headOfficeId ?? '') === String(authHeadOfficeId))
    }
    return []
  }

  const currentSchoolId = useMemo(() => {
    if (isSchoolAdmin) return authSchoolId ? String(authSchoolId) : ''
    if (filters.schoolId) return String(filters.schoolId)
    if (scopeSchoolId) return String(scopeSchoolId)
    return ''
  }, [authSchoolId, filters.schoolId, isSchoolAdmin, scopeSchoolId])

  const loadLookups = async () => {
    if (isSuperAdmin || isHeadOfficeAdmin) {
      await Promise.all([
        fetchHeadOfficesPage(0, 500)
          .then((page) => setHeadOffices(Array.isArray(page?.content) ? page.content : []))
          .catch(() => {}),
        fetchSchoolsLookup()
          .then((list) => setSchools(Array.isArray(list) ? list : []))
          .catch(() => {}),
      ])
      return
    }
    if (isSchoolAdmin) {
      await fetchSchoolsLookup()
        .then((list) => setSchools(Array.isArray(list) ? list : []))
        .catch(() => {})
    }
  }

  const loadRows = async ({ schoolId, page = 0, size = 10, search = '' } = {}) => {
    const effectiveSchoolId = isSchoolAdmin ? authSchoolId : schoolId || null
    if (!effectiveSchoolId && !isSuperAdmin) {
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
      return
    }

    const data = await fetchExpenditureHeadsPage({
      schoolId: effectiveSchoolId,
      page,
      size,
      search,
    })
    setRows(Array.isArray(data?.content) ? data.content : [])
    setTotalElements(data?.totalElements ?? 0)
    setTotalPages(data?.totalPages ?? 0)
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    setLoadError('')
    setBusy(true)
    Promise.resolve()
      .then(loadLookups)
      .then(() =>
        loadRows({
          schoolId: currentSchoolId || null,
          page: currentPage - 1,
          size: rowsPerPage,
          search: debouncedSearch,
        }),
      )
      .catch((error) => setLoadError(error?.message || 'Failed to load expenditure heads'))
      .finally(() => setBusy(false))
  }, [status, token, role, currentPage, rowsPerPage, debouncedSearch, currentSchoolId])

  const handleInputChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({ ...prev, [id]: value, ...(id === 'headOfficeId' ? { schoolId: '' } : {}) }))
  }

  const openAdd = () => {
    const base = { ...emptyForm }
    if (isSchoolAdmin) {
      base.schoolId = String(authSchoolId ?? '')
    } else if (isHeadOfficeAdmin) {
      base.headOfficeId = String(authHeadOfficeId ?? '')
    }
    setAddForm(base)
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    const school = row?.schoolId != null ? schoolsById.get(String(row.schoolId)) : null
    setEditForm({
      id: row.id,
      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : String(authHeadOfficeId ?? ''),
      schoolId: row?.schoolId != null ? String(row.schoolId) : '',
      expenditureHead: row?.expenditureHead || '',
      note: row?.note || '',
    })
    setEditStep(0)
    setIsEditOpen(true)
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p += 1) pages.push(p)
    return pages
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

  const resolveSchoolName = (schoolId) => {
    if (schoolId == null) return '--'
    return schoolsById.get(String(schoolId))?.schoolName || authSchoolName || `School ${schoolId}`
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Expenditure Head</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Expenditure Head</span>
          </div>
        </div>
        <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <i className="ri-add-line"></i> Add Expenditure Head
        </button>
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
              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown">
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  {columnOptions.map((col) => (
                    <li key={col.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input type="checkbox" className="form-check-input mt-0" checked={visibleColumns[col.key]} onChange={() => toggleColumn(col.key)} />
                        {col.label}
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
                options={[5, 10, 20, 50]}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search expenditure head..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school && <th scope="col">School</th>}
                  {visibleColumns.expenditureHead && <th scope="col">Expenditure Head</th>}
                  {visibleColumns.note && <th scope="col">Note</th>}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {busy && rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No expenditure head records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.school && <td className="fw-medium text-primary-light">{resolveSchoolName(row.schoolId)}</td>}
                      {visibleColumns.expenditureHead && <td className="fw-medium">{row.expenditureHead}</td>}
                      {visibleColumns.note && <td style={{ maxWidth: 250, whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.note || '-'}</td>}
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
                            onClick={async () => {
                              if (!window.confirm('Are you sure you want to delete this expenditure head?')) return
                              setBusy(true)
                              setLoadError('')
                              try {
                                await deleteExpenditureHead(row.id)
                                await loadRows({
                                  schoolId: currentSchoolId || null,
                                  page: currentPage - 1,
                                  size: rowsPerPage,
                                  search: debouncedSearch,
                                })
                              } catch (error) {
                                setLoadError(error?.message || 'Failed to delete expenditure head')
                              } finally {
                                setBusy(false)
                              }
                            }}
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
              Showing {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, totalElements)} of {totalElements}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
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
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <WizardPopup
        modalWidth="620px"
        open={isAddOpen}
        title="Add Expenditure Head"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={async () => {
          setLoadError('')
          const schoolId = isSchoolAdmin ? authSchoolId : (addForm.schoolId ? Number(addForm.schoolId) : null)
          if (!schoolId) {
            setLoadError('School is required')
            return
          }
          if (!addForm.expenditureHead?.trim()) {
            setLoadError('Expenditure head is required')
            return
          }
          setBusy(true)
          try {
            await createExpenditureHead({ ...addForm, schoolId })
            setIsAddOpen(false)
            await loadRows({ schoolId: currentSchoolId || schoolId, page: currentPage - 1, size: rowsPerPage, search: debouncedSearch })
          } catch (error) {
            setLoadError(error?.message || 'Failed to create expenditure head')
          } finally {
            setBusy(false)
          }
        }}
        submitLabel="Save"
      >
        <div className="avm-grid">
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={headOffices}
              schoolOptions={schoolsForHeadOffice(addForm.headOfficeId)}
              selectedHeadOfficeId={addForm.headOfficeId}
              onHeadOfficeChange={(value) => setAddForm((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))}
              selectedSchoolId={addForm.schoolId}
              onSchoolChange={(value) => setAddForm((prev) => ({ ...prev, schoolId: value }))}
              schoolLabel="School"
            />
          ) : isHeadOfficeAdmin ? (
            <FormField label="School Name" required full>
              <select className="avm-select" id="schoolId" value={addForm.schoolId} onChange={handleInputChange(setAddForm)}>
                <option value="">--Select School--</option>
                {schoolOptionsForScope.map((school) => (
                  <option key={school.id} value={String(school.id)}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </FormField>
          ) : (
            <FormField label="School Name" required full>
              <input className="avm-input" value={authSchoolName || ''} readOnly />
            </FormField>
          )}

          <FormField label="Expenditure Head" required full>
            <input
              type="text"
              className="avm-input"
              id="expenditureHead"
              placeholder="Enter Expenditure Head"
              value={addForm.expenditureHead}
              onChange={handleInputChange(setAddForm)}
            />
          </FormField>

          <FormField label="Note" full noIcon>
            <textarea
              className="avm-input avm-textarea"
              id="note"
              rows="4"
              placeholder="Enter Note"
              value={addForm.note}
              onChange={handleInputChange(setAddForm)}
            />
          </FormField>
        </div>
      </WizardPopup>

      <WizardPopup
        modalWidth="620px"
        open={isEditOpen}
        title="Edit Expenditure Head"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={async () => {
          setLoadError('')
          const schoolId = isSchoolAdmin ? authSchoolId : (editForm.schoolId ? Number(editForm.schoolId) : null)
          if (!schoolId) {
            setLoadError('School is required')
            return
          }
          if (!editForm.expenditureHead?.trim()) {
            setLoadError('Expenditure head is required')
            return
          }
          setBusy(true)
          try {
            await updateExpenditureHead(editForm.id, { ...editForm, schoolId })
            setIsEditOpen(false)
            await loadRows({ schoolId: currentSchoolId || schoolId, page: currentPage - 1, size: rowsPerPage, search: debouncedSearch })
          } catch (error) {
            setLoadError(error?.message || 'Failed to update expenditure head')
          } finally {
            setBusy(false)
          }
        }}
        submitLabel="Update"
      >
        <div className="avm-grid">
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={headOffices}
              schoolOptions={schoolsForHeadOffice(editForm.headOfficeId)}
              selectedHeadOfficeId={editForm.headOfficeId}
              onHeadOfficeChange={(value) => setEditForm((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))}
              selectedSchoolId={editForm.schoolId}
              onSchoolChange={(value) => setEditForm((prev) => ({ ...prev, schoolId: value }))}
              schoolLabel="School"
            />
          ) : isHeadOfficeAdmin ? (
            <FormField label="School Name" required full>
              <select className="avm-select" id="schoolId" value={editForm.schoolId} onChange={handleInputChange(setEditForm)}>
                <option value="">--Select School--</option>
                {schoolOptionsForScope.map((school) => (
                  <option key={school.id} value={String(school.id)}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </FormField>
          ) : (
            <FormField label="School Name" required full>
              <input className="avm-input" value={authSchoolName || ''} readOnly />
            </FormField>
          )}

          <FormField label="Expenditure Head" required full>
            <input
              type="text"
              className="avm-input"
              id="expenditureHead"
              placeholder="Enter Expenditure Head"
              value={editForm.expenditureHead}
              onChange={handleInputChange(setEditForm)}
            />
          </FormField>

          <FormField label="Note" full noIcon>
            <textarea
              className="avm-input avm-textarea"
              id="note"
              rows="4"
              placeholder="Enter Note"
              value={editForm.note}
              onChange={handleInputChange(setEditForm)}
            />
          </FormField>
        </div>
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Expenditure Head"
        onClose={() => setIsFilterSidebarOpen(false)}
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={headOffices}
              schoolOptions={schoolsForHeadOffice(pendingFilters.headOfficeId)}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={(value) => setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))}
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={(value) => setPendingFilters((prev) => ({ ...prev, schoolId: value }))}
              schoolLabel="School"
            />
          ) : isHeadOfficeAdmin ? (
            <div>
              <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
              <select
                className="form-control form-select"
                value={pendingFilters.schoolId}
                onChange={(e) => setPendingFilters((prev) => ({ ...prev, schoolId: e.target.value }))}
              >
                <option value="">All Schools</option>
                {schoolOptionsForScope.map((school) => (
                  <option key={school.id} value={String(school.id)}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="d-flex gap-8 mt-12">
            <button type="button" className="btn btn-danger-200 text-danger-600 w-100" onClick={handleResetFilters}>
              Reset
            </button>
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default ExpenditureHead
