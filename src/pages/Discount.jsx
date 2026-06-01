import { useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createDiscount, deleteDiscount, fetchDiscountsPage, updateDiscount } from '../apis/discountsApi'
import { normalizeRole } from '../utils/roles'
import ExportDropdown from '../components/ExportDropdown'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  title: '',
  discountType: '',
  amount: '',
  note: '',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  discountType: '',
}

const STEPS = ['Basic Information']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Title: 'ri-file-list-line',
  'Discount Type': 'ri-price-tag-3-line',
  Amount: 'ri-coin-line',
  Note: 'ri-file-text-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'title', label: 'Title' },
  { key: 'discountType', label: 'Discount Type' },
  { key: 'amount', label: 'Amount' },
  { key: 'note', label: 'Note' },
]

const discountTypeOptions = ['Percentage', 'Fixed']

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

const Discount = () => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName, schoolId: authSchoolId, schoolName: authSchoolName, canAdd, canEdit, canDelete } = useAuth()
  const { activeSchoolId } = useSchool()
  const PAGE_SLUG = 'discount'
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
      if (s?.id == null) continue
      map.set(String(s.id), s)
    }
    return map
  }, [schools])

  const headOfficesById = useMemo(() => {
    const map = new Map()
    for (const ho of Array.isArray(headOffices) ? headOffices : []) {
      if (ho?.id == null) continue
      map.set(String(ho.id), ho)
    }
    return map
  }, [headOffices])

  const resolveSchoolName = (schoolId, fallbackName = '') => {
    if (schoolId == null) return ''
    const row = schoolsById.get(String(schoolId))
    return row?.schoolName || row?.name || fallbackName || ''
  }

  const resolveHeadOfficeName = (headOfficeId) => {
    if (headOfficeId == null) return ''
    const row = headOfficesById.get(String(headOfficeId))
    return row?.name || ''
  }

  const currentSchoolId = useMemo(() => {
    if (isSchoolAdmin) return authSchoolId != null ? Number(authSchoolId) : null
    if (filters.schoolId) return Number(filters.schoolId)
    if (isHeadOfficeAdmin) return activeSchoolId ? Number(activeSchoolId) : null
    return null
  }, [activeSchoolId, authSchoolId, filters.schoolId, isHeadOfficeAdmin, isSchoolAdmin])

  const loadLookups = async () => {
    if (isSchoolAdmin) return
    const tasks = []
    if (isSuperAdmin) {
      tasks.push(
        fetchHeadOfficesPage(0, 500).then((page) => {
          const content = Array.isArray(page?.content) ? page.content : []
          setHeadOffices(content)
        }).catch(() => {}),
      )
    }
    tasks.push(fetchSchoolsLookup().then((list) => setSchools(Array.isArray(list) ? list : [])))
    await Promise.all(tasks)
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  const loadDiscounts = async ({ schoolId, page = 0, size = 10, search = '' } = {}) => {
    const effectiveSchoolId = (() => {
      if (isSchoolAdmin) return authSchoolId
      return schoolId || null
    })()

    if (!effectiveSchoolId && !isSuperAdmin) {
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
      return
    }

    const data = await fetchDiscountsPage({ 
      schoolId: effectiveSchoolId, 
      page: page, 
      size: size,
      search: search
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
      .then(() => {
        return loadDiscounts({
          schoolId: currentSchoolId,
          page: currentPage - 1,
          size: rowsPerPage,
          search: debouncedSearch
        })
      })
      .catch((e) => setLoadError(e?.message || 'Failed to load discounts'))
      .finally(() => setBusy(false))
  }, [status, token, role, currentPage, rowsPerPage, debouncedSearch, filters, currentSchoolId])

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({ 
      ...prev, 
      [id]: value,
      ...(id === 'headOfficeId' ? { schoolId: '' } : {})
    }))
  }

  const openAdd = () => {
    const base = { ...emptyForm }
    if (isSchoolAdmin) {
      base.schoolId = authSchoolId != null ? String(authSchoolId) : ''
      base.headOfficeId = authHeadOfficeId != null ? String(authHeadOfficeId) : ''
    } else if (isHeadOfficeAdmin) {
      base.headOfficeId = authHeadOfficeId != null ? String(authHeadOfficeId) : ''
    }
    setAddForm(base)
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    const s = row?.schoolId != null ? schoolsById.get(String(row.schoolId)) : null
    setEditForm({
      ...row,
      headOfficeId: s?.headOfficeId != null ? String(s.headOfficeId) : (authHeadOfficeId != null ? String(authHeadOfficeId) : ''),
      schoolId: row?.schoolId != null ? String(row.schoolId) : '',
    })
    setEditStep(0)
    setIsEditOpen(true)
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...rows.map((row) => String(row.id))])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !rows.some((row) => String(row.id) === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(String(id)) ? prev.filter((rowId) => rowId !== String(id)) : [...prev, String(id)],
    )
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  const schoolOptionsForScope = useMemo(() => {
    const list = Array.isArray(schools) ? schools : []
    if (isSuperAdmin) return list
    if (isHeadOfficeAdmin) return list.filter(s => String(s.headOfficeId) === String(authHeadOfficeId))
    return []
  }, [schools, isSuperAdmin, isHeadOfficeAdmin, authHeadOfficeId])

  const schoolOptionsForForm = (form) => {
    if (isSchoolAdmin) return []
    const selectedHeadOfficeId = isSuperAdmin ? form.headOfficeId : (authHeadOfficeId != null ? String(authHeadOfficeId) : '')
    const list = Array.isArray(schools) ? schools : []
    if (!selectedHeadOfficeId) return []
    return list.filter((s) => String(s?.headOfficeId ?? '') === String(selectedHeadOfficeId))
  }

  const renderForm = (form, setter, step) => {
    return (
      <>
        {step === 0 && (
          <>
            <p className="avm-section-title">{STEPS[0]}</p>
            <div className="avm-grid">
              {isSuperAdmin ? (
                <FormField label="Head Office" required full>
                  <select className="avm-select" id="headOfficeId" value={form.headOfficeId} onChange={handleChange(setter)}>
                    <option value="">--Select Head Office--</option>
                    {headOffices.map((ho) => (
                      <option key={ho.id} value={String(ho.id)}>{ho.name}</option>
                    ))}
                  </select>
                </FormField>
              ) : (isHeadOfficeAdmin ? (
                <FormField label="Head Office" required full>
                  <input className="avm-input" value={headOfficeName || resolveHeadOfficeName(authHeadOfficeId) || ''} readOnly />
                </FormField>
              ) : null)}

              {(isSuperAdmin || isHeadOfficeAdmin) ? (
                <FormField label="School Name" required full>
                  <select className="avm-select" id="schoolId" value={form.schoolId} onChange={handleChange(setter)}>
                    <option value="">--Select School--</option>
                    {schoolOptionsForForm(form).map((s) => (
                      <option key={s.id} value={String(s.id)}>{s.schoolName}</option>
                    ))}
                  </select>
                </FormField>
              ) : (isSchoolAdmin ? (
                <FormField label="School Name" required full>
                  <input className="avm-input" value={authSchoolName || resolveSchoolName(authSchoolId, authSchoolName) || ''} readOnly />
                </FormField>
              ) : null)}

              <FormField label="Title" required full>
                <input
                  type="text"
                  className="avm-input"
                  id="title"
                  placeholder="Enter discount title"
                  value={form.title}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Discount Type" required>
                <select
                  className="avm-select"
                  id="discountType"
                  value={form.discountType}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {discountTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Amount" required>
                <input
                  type="number"
                  className="avm-input"
                  id="amount"
                  placeholder="Enter amount"
                  value={form.amount}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Note" full noIcon>
                <textarea
                  rows="3"
                  className="avm-input avm-textarea"
                  id="note"
                  placeholder="Enter note (optional)"
                  value={form.note}
                  onChange={handleChange(setter)}
                />
              </FormField>
            </div>
          </>
        )}
      </>
    )
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

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Discount</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Discount</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
          {canAdd(PAGE_SLUG) && (
            <button
              type="button"
              className="btn btn-primary-600 d-flex align-items-center gap-6"
              onClick={openAdd}
            >
              <span className="d-flex text-md">
                <i className="ri-add-large-line"></i>
              </span>
              Add Discount
            </button>
          )}
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {loadError && <div className="px-20 py-12 text-danger">{loadError}</div>}
          
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

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

              <RowsPerPageSelect
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(value) => {
                  setRowsPerPage(value)
                  setCurrentPage(1)
                }}
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search discount..."
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
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={rows.length > 0 && rows.every((r) => selectedRows.includes(String(r.id)))}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.title ? <th scope="col">Title</th> : null}
                  {visibleColumns.discountType ? <th scope="col">Discount Type</th> : null}
                  {visibleColumns.amount ? <th scope="col">Amount</th> : null}
                  {visibleColumns.note ? <th scope="col">Note</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {busy && rows.length === 0 ? (
                   <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 1}
                      className="text-center py-40 text-secondary-light"
                    >
                      {isHeadOfficeAdmin && !activeSchoolId && !filters.schoolId
                        ? 'Select a school from the topbar or filter panel to load discounts.'
                        : 'No discount records found.'}
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
                        <td className="fw-medium text-primary-light">{row.schoolName}</td>
                      ) : null}
                      {visibleColumns.title ? <td className="fw-medium">{row.title}</td> : null}
                      {visibleColumns.discountType ? (
                        <td>
                          <span className={`px-12 py-4 radius-4 fw-medium text-sm ${
                            row.discountType === 'Percentage' 
                              ? 'bg-info-100 text-info-600' 
                              : 'bg-success-100 text-success-600'
                          }`}>
                            {row.discountType}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.amount ? (
                        <td className="fw-semibold">
                          {row.discountType === 'Percentage' ? `${row.amount}%` : `₹${row.amount.toLocaleString()}`}
                        </td>
                      ) : null}
                      {visibleColumns.note ? <td style={{ maxWidth: 250, whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.note || '-'}</td> : null}
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
                                if (!window.confirm('Are you sure?')) return
                                setBusy(true)
                                try {
                                  await deleteDiscount(row.id)
                                  await loadDiscounts({
                                    schoolId: currentSchoolId,
                                    page: currentPage - 1,
                                    size: rowsPerPage,
                                    search: debouncedSearch
                                  })
                                } catch (e) { setLoadError(e.message) }
                                finally { setBusy(false) }
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

      <WizardPopup
        modalWidth="580px"
        open={isAddOpen}
        title="Add Discount"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={async () => {
          setLoadError('')
          const effectiveSchoolId = isSchoolAdmin ? authSchoolId : (addForm.schoolId ? Number(addForm.schoolId) : null)
          if (!effectiveSchoolId) { setLoadError('School is required'); return }
          if (!addForm.title) { setLoadError('Discount title is required'); return }
          if (!addForm.discountType) { setLoadError('Discount type is required'); return }
          if (!addForm.amount) { setLoadError('Discount amount is required'); return }
          setBusy(true)
          try {
            await createDiscount({ ...addForm, schoolId: effectiveSchoolId })
            setIsAddOpen(false)
            await loadDiscounts({ schoolId: effectiveSchoolId, page: currentPage - 1, size: rowsPerPage, search: debouncedSearch })
          } catch (e) { setLoadError(e.message) }
          finally { setBusy(false) }
        }}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm, addStep)}
      </WizardPopup>

      <WizardPopup
        modalWidth="580px"
        open={isEditOpen}
        title="Edit Discount"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={async () => {
          setLoadError('')
          const effectiveSchoolId = isSchoolAdmin ? authSchoolId : (editForm.schoolId ? Number(editForm.schoolId) : null)
          if (!effectiveSchoolId) { setLoadError('School is required'); return }
          if (!editForm.title) { setLoadError('Discount title is required'); return }
          if (!editForm.discountType) { setLoadError('Discount type is required'); return }
          if (!editForm.amount) { setLoadError('Discount amount is required'); return }
          setBusy(true)
          try {
            await updateDiscount(editForm.id, { ...editForm, schoolId: effectiveSchoolId })
            setIsEditOpen(false)
            await loadDiscounts({ schoolId: effectiveSchoolId, page: currentPage - 1, size: rowsPerPage, search: debouncedSearch })
          } catch (e) { setLoadError(e.message) }
          finally { setBusy(false) }
        }}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm, editStep)}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Discount"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
           {isSuperAdmin && (
             <div>
              <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Head Office</label>
              <select 
                className="form-control form-select" 
                value={pendingFilters.headOfficeId} 
                onChange={(e) => setPendingFilters(p => ({ ...p, headOfficeId: e.target.value, schoolId: '' }))}
              >
                <option value="">All</option>
                {headOffices.map(ho => <option key={ho.id} value={String(ho.id)}>{ho.name}</option>)}
              </select>
            </div>
           )}

           {(isSuperAdmin || isHeadOfficeAdmin) && (
             <div>
              <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
              <select 
                className="form-control form-select" 
                value={pendingFilters.schoolId} 
                onChange={(e) => setPendingFilters(p => ({ ...p, schoolId: e.target.value }))}
              >
                <option value="">All</option>
                {schoolOptionsForForm(pendingFilters).map(s => <option key={s.id} value={String(s.id)}>{s.schoolName}</option>)}
              </select>
            </div>
           )}

          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Discount Type</label>
            <select
              className="form-control form-select"
              value={pendingFilters.discountType}
              onChange={(e) => setPendingFilters(prev => ({ ...prev, discountType: e.target.value }))}
            >
              <option value="">All</option>
              {discountTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="d-flex gap-8 mt-16">
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-danger-200 text-danger-600 w-100"
            >
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

export default Discount
