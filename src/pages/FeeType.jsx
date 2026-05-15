import { useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

import { useAuth } from '../context/useAuth'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createFeeType, deleteFeeType, fetchFeeTypesPage, updateFeeType } from '../apis/feeTypesApi'
import { normalizeRole } from '../utils/roles'
import ExportDropdown from '../components/ExportDropdown'

const FEE_TYPE_OPTIONS = ['General Fee', 'Product Sale', 'Hostel', 'Transport']
const FEE_TYPE_DATALIST_ID = 'fee-type-suggestions'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  feeType: '',
  title: '',
  note: '',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  feeType: '',
}

const STEPS = ['Basic Information']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Fee Type': 'ri-money-dollar-circle-line',
  Title: 'ri-text',
  Note: 'ri-file-text-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'feeType', label: 'Fee Type' },
  { key: 'title', label: 'Title' },
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
          <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#667085', fontSize: '0.95rem', lineHeight: 1, pointerEvents: 'none', zIndex: 1 }}>
            <i className={icon}></i>
          </span>
          {children}
        </div>
      ) : children}
    </div>
  )
}

const FeeType = () => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
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

  const resolveHeadOfficeName = (id) => headOfficesById.get(String(id))?.name || ''

  const schoolOptionsForScope = useMemo(() => {
    const list = Array.isArray(schools) ? schools : []
    if (isSuperAdmin) return list
    if (isHeadOfficeAdmin) return list.filter(s => String(s.headOfficeId) === String(authHeadOfficeId))
    return []
  }, [schools, isSuperAdmin, isHeadOfficeAdmin, authHeadOfficeId])

  const schoolOptionsForForm = (form) => {
    if (isSchoolAdmin) return []
    const hoId = isSuperAdmin ? form.headOfficeId : (authHeadOfficeId != null ? String(authHeadOfficeId) : '')
    if (!hoId) return []
    return (Array.isArray(schools) ? schools : []).filter(s => String(s?.headOfficeId ?? '') === String(hoId))
  }

  const loadLookups = async () => {
    if (isSchoolAdmin) return
    const tasks = []
    if (isSuperAdmin || isHeadOfficeAdmin) {
      tasks.push(
        fetchHeadOfficesPage(0, 500)
          .then(p => setHeadOffices(Array.isArray(p?.content) ? p.content : []))
          .catch(() => {})
      )
    }
    tasks.push(fetchSchoolsLookup().then(list => setSchools(Array.isArray(list) ? list : [])))
    await Promise.all(tasks)
  }

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(t)
  }, [search])

  const loadFeeTypes = async ({ schoolId, page = 0, size = 10, search = '' } = {}) => {
    const effectiveSchoolId = isSchoolAdmin ? authSchoolId : (schoolId || null)
    if (!effectiveSchoolId && !isSuperAdmin) {
      setRows([]); setTotalElements(0); setTotalPages(0)
      return
    }
    const data = await fetchFeeTypesPage({ schoolId: effectiveSchoolId, page, size, search })
    setRows(Array.isArray(data?.content) ? data.content : [])
    setTotalElements(data?.totalElements ?? 0)
    setTotalPages(data?.totalPages ?? 0)
  }

  useEffect(() => {
    if (status !== 'ready' || !token) return
    setLoadError('')
    setBusy(true)
    Promise.resolve()
      .then(loadLookups)
      .then(() => {
        const schoolId = isSchoolAdmin ? authSchoolId : (scopeSchoolId ? Number(scopeSchoolId) : (filters.schoolId ? Number(filters.schoolId) : null))
        return loadFeeTypes({ schoolId, page: currentPage - 1, size: rowsPerPage, search: debouncedSearch })
      })
      .catch(e => setLoadError(e?.message || 'Failed to load fee types'))
      .finally(() => setBusy(false))
  }, [status, token, role, currentPage, rowsPerPage, debouncedSearch, filters])

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter(prev => ({ ...prev, [id]: value, ...(id === 'headOfficeId' ? { schoolId: '' } : {}) }))
  }

  const openAdd = () => {
    const base = { ...emptyForm }
    if (isSchoolAdmin) { base.schoolId = String(authSchoolId ?? ''); base.headOfficeId = String(authHeadOfficeId ?? '') }
    else if (isHeadOfficeAdmin) { base.headOfficeId = String(authHeadOfficeId ?? '') }
    setAddForm(base); setAddStep(0); setIsAddOpen(true)
  }

  const openEdit = (row) => {
    const s = row?.schoolId != null ? schoolsById.get(String(row.schoolId)) : null
    setEditForm({
      ...row,
      headOfficeId: s?.headOfficeId != null ? String(s.headOfficeId) : String(authHeadOfficeId ?? ''),
      schoolId: row?.schoolId != null ? String(row.schoolId) : '',
    })
    setEditStep(0); setIsEditOpen(true)
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows(prev => [...new Set([...prev, ...rows.map(r => String(r.id))])])
    else setSelectedRows(prev => prev.filter(id => !rows.some(r => String(r.id) === id)))
  }

  const handleSelectRow = (id) => {
    setSelectedRows(prev => prev.includes(String(id)) ? prev.filter(x => x !== String(id)) : [...prev, String(id)])
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  const handleApplyFilters = (e) => {
    e.preventDefault(); setFilters(pendingFilters); setCurrentPage(1); setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters); setFilters(emptyFilters); setCurrentPage(1)
  }

  const renderForm = (form, setter, step) => (
    <>
      {step === 0 && (
        <>
          <p className="avm-section-title">{STEPS[0]}</p>
          <div className="avm-grid">
            {isSuperAdmin ? (
              <FormField label="Head Office" required full>
                <select className="avm-select" id="headOfficeId" value={form.headOfficeId} onChange={handleChange(setter)}>
                  <option value="">--Select Head Office--</option>
                  {headOffices.map(ho => <option key={ho.id} value={String(ho.id)}>{ho.name}</option>)}
                </select>
              </FormField>
            ) : isHeadOfficeAdmin ? (
              <FormField label="Head Office" required full>
                <input className="avm-input" value={headOfficeName || resolveHeadOfficeName(authHeadOfficeId) || ''} readOnly />
              </FormField>
            ) : null}

            {(isSuperAdmin || isHeadOfficeAdmin) ? (
              <FormField label="School Name" required full>
                <select className="avm-select" id="schoolId" value={form.schoolId} onChange={handleChange(setter)}>
                  <option value="">--Select School--</option>
                  {schoolOptionsForForm(form).map(s => <option key={s.id} value={String(s.id)}>{s.schoolName}</option>)}
                </select>
              </FormField>
            ) : isSchoolAdmin ? (
              <FormField label="School Name" required full>
                <input className="avm-input" value={authSchoolName || ''} readOnly />
              </FormField>
            ) : null}

            <FormField label="Fee Type" required full>
              <input
                className="avm-input"
                id="feeType"
                list={FEE_TYPE_DATALIST_ID}
                placeholder="Type fee type name"
                value={form.feeType}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Title" required full>
              <input type="text" className="avm-input" id="title" placeholder="Enter title" value={form.title} onChange={handleChange(setter)} />
            </FormField>

            <FormField label="Note" full noIcon>
              <textarea rows="3" className="avm-input avm-textarea" id="note" placeholder="Enter note (optional)" value={form.note} onChange={handleChange(setter)} />
            </FormField>
          </div>
        </>
      )}
    </>
  )

  const currentSchoolId = () => isSchoolAdmin ? authSchoolId : (scopeSchoolId || filters.schoolId || null)

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Fee Type</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">Dashboard</button>
            <span className="text-secondary-light"> / Fee Type</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
          {isHeadOfficeAdmin && (
            <select className="form-select" style={{ minWidth: 240 }} value={scopeSchoolId}
              onChange={e => { setScopeSchoolId(e.target.value); setCurrentPage(1) }}>
              <option value="">Select School</option>
              {schoolOptionsForScope.map(s => <option key={s.id} value={String(s.id)}>{s.schoolName}</option>)}
            </select>
          )}
          <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <span className="d-flex text-md"><i className="ri-add-large-line"></i></span>
            Add Fee Type
          </button>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {loadError && <div className="px-20 py-12 text-danger">{loadError}</div>}

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  {columnOptions.map(col => (
                    <li key={col.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input type="checkbox" className="form-check-input mt-0" checked={visibleColumns[col.key]} onChange={() => toggleColumn(col.key)} />
                        {col.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <RowsPerPageSelect value={rowsPerPage} onChange={v => { setRowsPerPage(v); setCurrentPage(1) }}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light" />
            </div>

            <div className="position-relative">
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search fee type..." value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light"><i className="ri-search-line"></i></span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input"
                        checked={rows.length > 0 && rows.every(r => selectedRows.includes(String(r.id)))}
                        onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school && <th scope="col">School</th>}
                  {visibleColumns.feeType && <th scope="col">Fee Type</th>}
                  {visibleColumns.title && <th scope="col">Title</th>}
                  {visibleColumns.note && <th scope="col">Note</th>}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {busy && rows.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">No fee type records found.</td></tr>
                ) : rows.map((row, idx) => (
                  <tr key={row.id}>
                    <td>
                      <div className="form-check style-check d-flex align-items-center">
                        <input className="form-check-input" type="checkbox"
                          checked={selectedRows.includes(String(row.id))}
                          onChange={() => handleSelectRow(row.id)} />
                        <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                      </div>
                    </td>
                    {visibleColumns.school && <td className="fw-medium text-primary-light">{row.schoolName}</td>}
                    {visibleColumns.feeType && (
                      <td>
                        <span className="px-12 py-4 radius-4 fw-medium text-sm bg-info-100 text-info-600">
                          {row.feeType}
                        </span>
                      </td>
                    )}
                    {visibleColumns.title && <td className="fw-medium">{row.title}</td>}
                    {visibleColumns.note && <td style={{ maxWidth: 250, whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.note || '-'}</td>}
                    <td>
                      <div className="d-flex align-items-center gap-10">
                        <button type="button" className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                          onClick={() => openEdit(row)} title="Edit">
                          <i className="ri-edit-line"></i>
                        </button>
                        <button type="button" className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                          title="Delete"
                          onClick={async () => {
                            if (!window.confirm('Are you sure?')) return
                            setBusy(true)
                            try {
                              await deleteFeeType(row.id)
                              await loadFeeTypes({ schoolId: currentSchoolId(), page: currentPage - 1, size: rowsPerPage, search: debouncedSearch })
                            } catch (e) { setLoadError(e.message) }
                            finally { setBusy(false) }
                          }}>
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, totalElements)} of {totalElements}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              {getVisiblePages().map(p => (
                <button key={p} type="button" className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </div>
      </div>

      <WizardPopup modalWidth="580px" open={isAddOpen} title="Add Fee Type" steps={STEPS} step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep(s => Math.max(0, s - 1))}
        onNext={() => setAddStep(s => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={async () => {
          setLoadError('')
          const schoolId = isSchoolAdmin ? authSchoolId : (addForm.schoolId ? Number(addForm.schoolId) : null)
          if (!schoolId) { setLoadError('School is required'); return }
          if (!addForm.feeType) { setLoadError('Fee type is required'); return }
          if (!addForm.title) { setLoadError('Title is required'); return }
          setBusy(true)
          try {
            await createFeeType({ ...addForm, schoolId })
            setIsAddOpen(false)
            await loadFeeTypes({ schoolId, page: currentPage - 1, size: rowsPerPage, search: debouncedSearch })
          } catch (e) { setLoadError(e.message) }
          finally { setBusy(false) }
        }}
        submitLabel="Save">
        {renderForm(addForm, setAddForm, addStep)}
      </WizardPopup>

      <WizardPopup modalWidth="580px" open={isEditOpen} title="Edit Fee Type" steps={STEPS} step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep(s => Math.max(0, s - 1))}
        onNext={() => setEditStep(s => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={async () => {
          setLoadError('')
          const schoolId = isSchoolAdmin ? authSchoolId : (editForm.schoolId ? Number(editForm.schoolId) : null)
          if (!schoolId) { setLoadError('School is required'); return }
          if (!editForm.feeType) { setLoadError('Fee type is required'); return }
          if (!editForm.title) { setLoadError('Title is required'); return }
          setBusy(true)
          try {
            await updateFeeType(editForm.id, { ...editForm, schoolId })
            setIsEditOpen(false)
            await loadFeeTypes({ schoolId, page: currentPage - 1, size: rowsPerPage, search: debouncedSearch })
          } catch (e) { setLoadError(e.message) }
          finally { setBusy(false) }
        }}
        submitLabel="Update">
        {renderForm(editForm, setEditForm, editStep)}
      </WizardPopup>

      <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter Fee Type" onClose={() => setIsFilterSidebarOpen(false)} className="filter-sidebar">
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin && (
            <div>
              <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Head Office</label>
              <select className="form-control form-select" value={pendingFilters.headOfficeId}
                onChange={e => setPendingFilters(p => ({ ...p, headOfficeId: e.target.value, schoolId: '' }))}>
                <option value="">All</option>
                {headOffices.map(ho => <option key={ho.id} value={String(ho.id)}>{ho.name}</option>)}
              </select>
            </div>
          )}
          {(isSuperAdmin || isHeadOfficeAdmin) && (
            <div>
              <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
              <select className="form-control form-select" value={pendingFilters.schoolId}
                onChange={e => setPendingFilters(p => ({ ...p, schoolId: e.target.value }))}>
                <option value="">All</option>
                {schoolOptionsForForm(pendingFilters).map(s => <option key={s.id} value={String(s.id)}>{s.schoolName}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Fee Type</label>
            <input
              type="text"
              className="form-control"
              list={FEE_TYPE_DATALIST_ID}
              placeholder="Type fee type name"
              value={pendingFilters.feeType}
              onChange={e => setPendingFilters(p => ({ ...p, feeType: e.target.value }))}
            />
          </div>
          <div className="d-flex gap-8 mt-16">
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">Reset</button>
            <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
          </div>
        </form>
      </SlideSidebar>

      <datalist id={FEE_TYPE_DATALIST_ID}>
        {FEE_TYPE_OPTIONS.map((opt) => (
          <option key={opt} value={opt} />
        ))}
        {Array.from(
          new Set(
            (Array.isArray(rows) ? rows : [])
              .map((row) => row?.feeType)
              .filter((value) => typeof value === 'string' && value.trim().length > 0),
          ),
        ).map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
    </div>
  )
}

export default FeeType
