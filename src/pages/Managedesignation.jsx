import { useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

import { useAuth } from '../context/useAuth'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createDesignation, deleteDesignation, fetchDesignations, updateDesignation } from '../apis/designationsApi'
import { normalizeRole } from '../utils/roles'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  designationId: null,
  designation: '',
  note: '',
}

const STEPS = ['Basic']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Designation: 'ri-award-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'school', label: 'School Name' },
  { key: 'designation', label: 'Designation' },
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

const ManageDesignation = () => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'

  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [headOffices, setHeadOffices] = useState([])
  const [schools, setSchools] = useState([])

  const [scopeSchoolId, setScopeSchoolId] = useState(() => (authSchoolId != null ? String(authSchoolId) : ''))

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [filters, setFilters] = useState({ school: 'All', designation: 'All' })
  const [pendingFilters, setPendingFilters] = useState({ school: 'All', designation: 'All' })
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
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

  const loadLookups = async () => {
    // School admins don't need lookup lists; the school is fixed.
    if (isSchoolAdmin) return

    const tasks = []
    if (isSuperAdmin) {
      tasks.push(
        fetchHeadOfficesPage(0, 500).then((page) => {
          const content = Array.isArray(page?.content) ? page.content : []
          setHeadOffices(content)
        }),
      )
    } else if (isHeadOfficeAdmin) {
      // Still load head office list so we can show the name (optional); ignore failure.
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

  const loadDesignations = async ({ schoolId } = {}) => {
    const effectiveSchoolId = (() => {
      if (isSchoolAdmin) return authSchoolId
      if (isHeadOfficeAdmin) return schoolId ?? null
      if (isSuperAdmin) return schoolId ?? null
      return null
    })()

    // SUPER_ADMIN can list everything without selecting a school.
    if (!effectiveSchoolId && !isSuperAdmin) {
      setRows([])
      return
    }

    const data = await fetchDesignations(isSuperAdmin && !effectiveSchoolId ? {} : { schoolId: effectiveSchoolId })
    const list = Array.isArray(data) ? data : []
    setRows(
      list.map((d) => ({
        id: d?.id,
        schoolId: d?.schoolId ?? effectiveSchoolId,
        schoolName:
          d?.schoolName ||
          resolveSchoolName(
            d?.schoolId ?? effectiveSchoolId,
            isSchoolAdmin ? authSchoolName || (authSchoolId != null ? `School ${authSchoolId}` : '') : '',
          ),
        designation: d?.name ?? d?.designation ?? '',
        note: d?.note ?? '',
      })),
    )
  }

  useEffect(() => {
    if (status !== 'ready') return
    if (!token) return
    setLoadError('')
    setBusy(true)
    Promise.resolve()
      .then(loadLookups)
      .then(() => {
        const initialSchoolId = (() => {
          if (isSchoolAdmin) return authSchoolId
          if (scopeSchoolId) return Number(scopeSchoolId)
          return null
        })()
        return loadDesignations({ schoolId: initialSchoolId })
      })
      .catch((e) => setLoadError(e?.message || 'Failed to load designations'))
      .finally(() => setBusy(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, token, role])

  useEffect(() => {
    if (status !== 'ready') return
    if (!token) return
    if (isSchoolAdmin) return
    if (isSuperAdmin) return
    if (!scopeSchoolId) {
      setRows([])
      return
    }
    setLoadError('')
    setBusy(true)
    loadDesignations({ schoolId: Number(scopeSchoolId) })
      .catch((e) => setLoadError(e?.message || 'Failed to load designations'))
      .finally(() => setBusy(false))
  }, [status, token, isSchoolAdmin, scopeSchoolId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      const matchesSearch = !q || [r.schoolName, r.designation, r.note].join(' ').toLowerCase().includes(q)
      const matchesSchool = filters.school === 'All' || r.schoolName === filters.school
      const matchesDesignation = filters.designation === 'All' || r.designation === filters.designation
      return matchesSearch && matchesSchool && matchesDesignation
    })
  }, [filters, rows, search])
  const schoolOptions = useMemo(() => Array.from(new Set(rows.map((item) => item.schoolName).filter(Boolean))), [rows])
  const designationOptions = useMemo(() => Array.from(new Set(rows.map((item) => item.designation).filter(Boolean))), [rows])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((r) => selectedRows.includes(String(r.id)))

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((r) => String(r.id))])])
    else setSelectedRows((prev) => prev.filter((id) => !paginated.some((r) => String(r.id) === id)))
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({ ...prev, [id]: value }))
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
    setEditForm({
      ...emptyForm,
      designationId: row?.id ?? null,
      headOfficeId: (() => {
        const s = row?.schoolId != null ? schoolsById.get(String(row.schoolId)) : null
        const ho = s?.headOfficeId ?? null
        if (ho != null) return String(ho)
        if (authHeadOfficeId != null) return String(authHeadOfficeId)
        return ''
      })(),
      schoolId: row?.schoolId != null ? String(row.schoolId) : '',
      designation: row?.designation ?? '',
      note: row?.note ?? '',
    })
    setEditStep(0)
    setIsEditOpen(true)
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  const schoolOptionsForForm = useMemo(() => {
    if (isSchoolAdmin) return []

    const selectedHeadOfficeId = (() => {
      if (isSuperAdmin) return formHeadOfficeId(addForm, editForm, isAddOpen, isEditOpen)
      if (isHeadOfficeAdmin) return authHeadOfficeId != null ? String(authHeadOfficeId) : ''
      return ''
    })()

    const list = Array.isArray(schools) ? schools : []
    if (!selectedHeadOfficeId) return list
    return list.filter((s) => String(s?.headOfficeId ?? '') === String(selectedHeadOfficeId))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schools, authHeadOfficeId, isSchoolAdmin, isHeadOfficeAdmin, isSuperAdmin, isAddOpen, isEditOpen, addForm.headOfficeId, editForm.headOfficeId])

  function formHeadOfficeId(addForm, editForm, isAddOpen, isEditOpen) {
    if (isAddOpen) return addForm?.headOfficeId || ''
    if (isEditOpen) return editForm?.headOfficeId || ''
    return ''
  }

  const renderForm = (form, setter) => (
    <>
      <p className="avm-section-title">Basic Information</p>
      <div className="avm-grid">
        {isSuperAdmin ? (
          <FormField label="Head Office" required full>
            <select className="avm-select" id="headOfficeId" value={form.headOfficeId} onChange={(e) => {
              const { id, value } = e.target
              setter((prev) => ({ ...prev, [id]: value, schoolId: '' }))
            }}>
              <option value="">--Select Head Office--</option>
              {headOffices.map((ho) => (
                <option key={ho.id} value={String(ho.id)}>{ho.name}</option>
              ))}
            </select>
          </FormField>
        ) : null}

        {isHeadOfficeAdmin && !isSuperAdmin ? (
          <FormField label="Head Office" required full>
            <input className="avm-input" value={headOfficeName || resolveHeadOfficeName(authHeadOfficeId) || (authHeadOfficeId != null ? `Head Office ${authHeadOfficeId}` : '')} readOnly />
          </FormField>
        ) : null}

        {(isSuperAdmin || isHeadOfficeAdmin) ? (
          <FormField label="School Name" required full>
            <select className="avm-select" id="schoolId" value={form.schoolId} onChange={handleChange(setter)}>
              <option value="">--Select School--</option>
              {schoolOptionsForForm.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.schoolName}</option>
              ))}
            </select>
          </FormField>
        ) : null}

        {isSchoolAdmin ? (
          <FormField label="School Name" required full>
            <input className="avm-input" value={authSchoolName || resolveSchoolName(authSchoolId, authSchoolName) || ''} readOnly />
          </FormField>
        ) : null}

        <FormField label="Designation" required full>
          <input
            type="text"
            className="avm-input"
            id="designation"
            placeholder="Enter designation"
            value={form.designation}
            onChange={handleChange(setter)}
          />
        </FormField>

        <FormField label="Note" full noIcon>
          <div className="avm-input-with-icon" style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '1.15rem',
                color: '#667085',
                fontSize: '0.95rem',
                lineHeight: 1,
                pointerEvents: 'none',
                zIndex: 1,
              }}
            >
              <i className="ri-sticky-note-line" />
            </span>
            <textarea
              rows="4"
              className="avm-input avm-textarea"
              id="note"
              placeholder="Enter note"
              value={form.note}
              onChange={handleChange(setter)}
            />
          </div>
        </FormField>
      </div>
    </>
  )

  return (
    <div className="dashboard-main-body">
      {/* Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Manage Designation</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Manage Designation</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
          {isHeadOfficeAdmin && !isSuperAdmin ? (
            <select
              className="form-select"
              style={{ minWidth: 240 }}
              value={scopeSchoolId}
              onChange={(e) => setScopeSchoolId(e.target.value)}
            >
              <option value="">Select School</option>
              {(Array.isArray(schools) ? schools : [])
                .filter((s) => String(s?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
                .map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.schoolName}</option>
                ))}
            </select>
          ) : null}

          <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <span className="d-flex text-md"><i className="ri-add-large-line" /></span>
            Add Designation
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {loadError ? (
            <div className="px-20 py-12 text-danger">{loadError}</div>
          ) : null}
          {/* Toolbar */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              {/* Export */}
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1" /> Export
                  </span>
                  <span><i className="ri-arrow-down-s-line" /></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
                      <i className="ri-file-3-line" /> PDF
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
                      <i className="ri-file-excel-2-line" /> Excel
                    </button>
                  </li>
                </ul>
              </div>

              {/* Columns */}
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
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
              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line" /></span>
              </button>

              {/* Rows per page */}
              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }}
              >
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Search */}
            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search designation..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line" />
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School Name</th> : null}
                  {visibleColumns.designation ? <th scope="col">Designation</th> : null}
                  {visibleColumns.note ? <th scope="col">Note</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center py-40 text-secondary-light">
                      No designations found.
                    </td>
                  </tr>
                ) : paginated.map((row) => (
                  <tr key={String(row.id)}>
                    <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input type="checkbox" className="form-check-input" checked={selectedRows.includes(String(row.id))} onChange={() => handleSelectRow(String(row.id))} />
                          <label className="form-check-label">{row.id}</label>
                        </div>
                      </td>
                    {visibleColumns.school ? <td>{row.schoolName}</td> : null}
                    {visibleColumns.designation ? <td className="fw-medium text-primary-light">{row.designation}</td> : null}
                    {visibleColumns.note ? <td>{row.note || '-'}</td> : null}
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
                          onClick={async () => {
                            if (!row?.id) return
                            setLoadError('')
                            setBusy(true)
                            try {
                              await deleteDesignation(row.id)
                              const nextSchoolId = isSchoolAdmin ? authSchoolId : row.schoolId
                              await loadDesignations({ schoolId: nextSchoolId })
                            } catch (e) {
                              setLoadError(e?.message || 'Failed to delete designation')
                            } finally {
                              setBusy(false)
                            }
                          }}
                          title="Delete"
                        >
                          <i className="ri-delete-bin-line" />
                        </button>
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
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
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
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Designation Modal */}
      <WizardPopup
        modalWidth="500px"
        open={isAddOpen}
        title="Add Designation"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={async () => {
          setLoadError('')
          if (isSuperAdmin && !String(addForm.headOfficeId || '').trim()) {
            setLoadError('Head office is required')
            return
          }
          const effectiveSchoolId = (() => {
            if (isSchoolAdmin) return authSchoolId
            const v = addForm.schoolId
            return v ? Number(v) : null
          })()
          if (!effectiveSchoolId) {
            setLoadError('School is required')
            return
          }
          const name = (addForm.designation || '').trim()
          if (!name) {
            setLoadError('Designation name is required')
            return
          }
          setBusy(true)
          try {
            await createDesignation({ schoolId: effectiveSchoolId, name, note: addForm.note })
            setIsAddOpen(false)
            await loadDesignations({ schoolId: effectiveSchoolId })
          } catch (e) {
            setLoadError(e?.message || 'Failed to create designation')
          } finally {
            setBusy(false)
          }
        }}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm)}
      </WizardPopup>

      {/* Edit Designation Modal */}
      <WizardPopup
        modalWidth="500px"
        open={isEditOpen}
        title="Edit Designation"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={async () => {
          setLoadError('')
          const id = editForm.designationId
          if (!id) {
            setLoadError('Invalid designation')
            return
          }
          if (isSuperAdmin && !String(editForm.headOfficeId || '').trim()) {
            setLoadError('Head office is required')
            return
          }
          const effectiveSchoolId = (() => {
            if (isSchoolAdmin) return authSchoolId
            const v = editForm.schoolId
            return v ? Number(v) : null
          })()
          if (!effectiveSchoolId) {
            setLoadError('School is required')
            return
          }
          const name = (editForm.designation || '').trim()
          if (!name) {
            setLoadError('Designation name is required')
            return
          }
          setBusy(true)
          try {
            await updateDesignation(id, { schoolId: effectiveSchoolId, name, note: editForm.note })
            setIsEditOpen(false)
            await loadDesignations({ schoolId: effectiveSchoolId })
          } catch (e) {
            setLoadError(e?.message || 'Failed to update designation')
          } finally {
            setBusy(false)
          }
        }}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm)}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Designations"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form
          className="p-20 d-grid grid-cols-2 gap-16"
          onSubmit={(e) => {
            e.preventDefault()
            setFilters(pendingFilters)
            setCurrentPage(1)
            setIsFilterSidebarOpen(false)
          }}
        >
          <div>
            <label htmlFor="filterSchoolDesignation" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
            <select
              id="filterSchoolDesignation"
              className="form-control form-select"
              value={pendingFilters.school}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, school: e.target.value }))}
            >
              <option value="All">All</option>
              {schoolOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filterDesignation" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Designation</label>
            <select
              id="filterDesignation"
              className="form-control form-select"
              value={pendingFilters.designation}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, designation: e.target.value }))}
            >
              <option value="All">All</option>
              {designationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <button
              type="button"
              className="btn btn-danger-200 text-danger-600 w-100"
              onClick={() => {
                const reset = { school: 'All', designation: 'All' }
                setPendingFilters(reset)
                setFilters(reset)
                setCurrentPage(1)
              }}
            >
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

export default ManageDesignation

