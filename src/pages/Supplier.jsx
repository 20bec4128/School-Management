import { useCallback, useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ExportDropdown from '../components/ExportDropdown'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import PhoneField from '../components/PhoneField'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createSupplier, deleteSupplier, fetchSuppliersPage, updateSupplier } from '../apis/suppliersApi'
import '../assets/css/addModalShared.css'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  supplierName: '',
  contactName: '',
  email: '',
  phone: '',
  address: '',
  note: '',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
}

const STEPS = ['Basic Information']

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  Supplier: 'ri-truck-line',
  'Contact Name': 'ri-user-line',
  Email: 'ri-mail-line',
  Phone: 'ri-phone-line',
  Address: 'ri-map-pin-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'supplierName', label: 'Supplier' },
  { key: 'contactName', label: 'Contact Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
]

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
      <div className="avm-input-with-icon" style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: '0.85rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#667085',
            fontSize: '0.95rem',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <i className={icon}></i>
        </span>
        {children}
      </div>
    </div>
  )
}

const getSchoolById = (rows, schoolId) =>
  (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(schoolId ?? '')) || null

const Supplier = () => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId } = useSchool()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [rows, setRows] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(() => {
    const rowsList = Array.isArray(allSchools) ? allSchools : []
    if (isSuperAdmin) {
      const headOfficeId = String(addForm.headOfficeId || '').trim()
      if (!headOfficeId) return []
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === headOfficeId)
    }
    if (isHeadOfficeAdmin) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return rowsList.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return rowsList
  }, [allSchools, addForm.headOfficeId, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin])

  const editSchoolOptions = useMemo(() => {
    const rowsList = Array.isArray(allSchools) ? allSchools : []
    if (isSuperAdmin) {
      const headOfficeId = String(editForm.headOfficeId || '').trim()
      if (!headOfficeId) return []
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === headOfficeId)
    }
    if (isHeadOfficeAdmin) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return rowsList.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return rowsList
  }, [allSchools, authHeadOfficeId, authSchoolId, editForm.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin])

  const filterSchoolOptions = useMemo(() => {
    const rowsList = Array.isArray(allSchools) ? allSchools : []
    if (filters.headOfficeId) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(filters.headOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return rowsList.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return rowsList
  }, [allSchools, authHeadOfficeId, authSchoolId, filters.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin])

  const resolveSchoolName = useCallback(
    (schoolId) => getSchoolById(allSchools, schoolId)?.schoolName || (String(schoolId ?? '') === String(authSchoolId ?? '') ? authSchoolName || '' : ''),
    [allSchools, authSchoolId, authSchoolName],
  )

  const loadLookups = useCallback(async () => {
    setLookupLoading(true)
    try {
      const schools = await fetchSchoolsLookup()
      setAllSchools(Array.isArray(schools) ? schools : [])
    } catch (err) {
      console.error('Failed to load supplier lookups:', err)
      setAllSchools([])
    } finally {
      setLookupLoading(false)
    }
  }, [])

  const loadSuppliers = useCallback(async () => {
    if (status !== 'ready' || !token) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchSuppliersPage({
        page: currentPage - 1,
        size: rowsPerPage,
        search: debouncedSearch,
        headOfficeId: filters.headOfficeId || undefined,
        schoolId: filters.schoolId || undefined,
      })
      setRows(Array.isArray(data?.content) ? data.content : [])
      setTotalElements(Number(data?.totalElements ?? 0))
      setTotalPages(Number(data?.totalPages ?? 0))
    } catch (err) {
      console.error('Failed to load suppliers:', err)
      setError(err?.message || 'Failed to load suppliers')
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, filters.headOfficeId, filters.schoolId, rowsPerPage, status, token])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    void loadLookups()
  }, [loadLookups, status, token])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    void loadSuppliers()
  }, [loadSuppliers, status, token])

  useEffect(() => {
    if (!isSuperAdmin) return
    if (!activeSchoolId) return
    const school = getSchoolById(allSchools, activeSchoolId)
    if (school?.headOfficeId == null) return
    setAddForm((prev) => ({
      ...prev,
      headOfficeId: String(school.headOfficeId),
      schoolId: String(activeSchoolId),
    }))
  }, [activeSchoolId, allSchools, isSuperAdmin])

  useEffect(() => {
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      setAddForm((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
      setEditForm((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
    }
  }, [authHeadOfficeId, isHeadOfficeAdmin])

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return
    const school = getSchoolById(allSchools, authSchoolId)
    setAddForm((prev) => ({
      ...prev,
      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
      schoolId: String(authSchoolId),
    }))
    setEditForm((prev) => ({
      ...prev,
      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
      schoolId: String(authSchoolId),
    }))
  }, [allSchools, authSchoolId, isSchoolAdmin])

  useEffect(() => {
    if (currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const buildPayload = (form) => ({
    headOfficeId: form.headOfficeId ? Number(form.headOfficeId) : null,
    schoolId: form.schoolId ? Number(form.schoolId) : null,
    supplierName: String(form.supplierName || '').trim(),
    contactName: String(form.contactName || '').trim(),
    email: String(form.email || '').trim(),
    phone: String(form.phone || '').trim(),
    address: String(form.address || '').trim(),
    note: String(form.note || '').trim(),
  })

  const openAdd = () => {
    const base = { ...emptyForm }
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      base.headOfficeId = String(authHeadOfficeId)
    }
    if (isSchoolAdmin && authSchoolId != null) {
      const school = getSchoolById(allSchools, authSchoolId)
      base.schoolId = String(authSchoolId)
      base.headOfficeId = school?.headOfficeId != null ? String(school.headOfficeId) : ''
    }
    if (isSuperAdmin && manualScope.selectedHeadOfficeId) {
      base.headOfficeId = String(manualScope.selectedHeadOfficeId)
      base.schoolId = String(manualScope.selectedSchoolId || '')
    }
    setAddForm(base)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    const school = getSchoolById(allSchools, row?.schoolId)
    setEditForm({
      id: row?.id != null ? String(row.id) : '',
      headOfficeId: row?.headOfficeId != null ? String(row.headOfficeId) : school?.headOfficeId != null ? String(school.headOfficeId) : '',
      schoolId: row?.schoolId != null ? String(row.schoolId) : '',
      supplierName: row?.supplierName || '',
      contactName: row?.contactName || '',
      email: row?.email || '',
      phone: row?.phone || '',
      address: row?.address || '',
      note: row?.note || '',
    })
    setIsEditOpen(true)
  }

  const handleSaveAdd = async () => {
    const payload = buildPayload(addForm)
    if (!payload.supplierName || !payload.contactName || !payload.phone || !payload.schoolId) {
      setError('Supplier name, contact name, phone, and school are required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await createSupplier(payload)
      setIsAddOpen(false)
      setAddForm(emptyForm)
      await loadSuppliers()
    } catch (err) {
      console.error('Failed to create supplier:', err)
      setError(err?.message || 'Failed to create supplier')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    const payload = buildPayload(editForm)
    if (!payload.supplierName || !payload.contactName || !payload.phone || !payload.schoolId) {
      setError('Supplier name, contact name, phone, and school are required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await updateSupplier(editForm.id, payload)
      setIsEditOpen(false)
      await loadSuppliers()
    } catch (err) {
      console.error('Failed to update supplier:', err)
      setError(err?.message || 'Failed to update supplier')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete supplier "${row?.supplierName || 'this supplier'}"?`)) return
    setSaving(true)
    setError('')
    try {
      await deleteSupplier(row.id)
      await loadSuppliers()
    } catch (err) {
      console.error('Failed to delete supplier:', err)
      setError(err?.message || 'Failed to delete supplier')
    } finally {
      setSaving(false)
    }
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

  const loadExportRows = useCallback(async () => {
    const size = Math.max(totalElements, rowsPerPage, 1)
    const data = await fetchSuppliersPage({
      page: 0,
      size,
      search: debouncedSearch,
      headOfficeId: filters.headOfficeId || undefined,
      schoolId: filters.schoolId || undefined,
    })
    return Array.isArray(data?.content) ? data.content : []
  }, [debouncedSearch, filters.headOfficeId, filters.schoolId, rowsPerPage, totalElements])

  const mapExportRow = useCallback(
    (row) => ({
      ...row,
      schoolName: row.schoolName || resolveSchoolName(row.schoolId),
    }),
    [resolveSchoolName],
  )

  const handleHeadOfficeChange = (setter, value) => {
    setter((prev) => ({
      ...prev,
      headOfficeId: value,
      schoolId: '',
    }))
  }

  const handleSchoolChange = (setter, value) => {
    const selectedSchool = getSchoolById(allSchools, value)
    setter((prev) => ({
      ...prev,
      schoolId: value,
      headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
    }))
  }

  const currentStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const currentEnd = totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Supplier</h1>
          <span className="text-secondary-light">Inventory / Supplier Management</span>
        </div>
        <button
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={openAdd}
        >
          <i className="ri-add-large-line"></i> Add Supplier
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown
                rows={rows}
                columns={columnOptions}
                visibleColumns={visibleColumns}
                loadRows={loadExportRows}
                mapRow={mapExportRow}
                fileName="Supplier_List"
                sheetName="Suppliers"
                pdfTitle="Supplier Report"
              />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="text-secondary-light text-sm">Find</span>
                <i className="ri-arrow-right-line"></i>
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                  data-bs-toggle="dropdown"
                >
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <ul className="dropdown-menu p-12 border shadow">
                  {columnOptions.map((col) => (
                    <li key={col.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={visibleColumns[col.key]}
                          onChange={() => toggleColumn(col.key)}
                        />
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
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search suppliers..."
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

          {error ? <div className="px-20 py-12 text-danger">{error}</div> : null}
          {lookupLoading ? <div className="px-20 py-12 text-secondary-light">Loading lookups...</div> : null}

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table">
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {columnOptions.map(
                    (col) =>
                      visibleColumns[col.key] && (
                        <th key={col.key}>{col.label}</th>
                      ),
                  )}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading suppliers...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id ?? idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" />
                          <label className="form-check-label">
                            {currentStart + idx}
                          </label>
                        </div>
                      </td>
                      {columnOptions.map(
                        (col) =>
                          visibleColumns[col.key] && (
                            <td key={col.key}>
                              {col.key === 'supplierName' ? (
                                <span className="fw-medium text-primary-light">{row[col.key]}</span>
                              ) : col.key === 'schoolName' ? (
                                resolveSchoolName(row.schoolId) || row.schoolName || '--'
                              ) : (
                                row[col.key] || '--'
                              )}
                            </td>
                          ),
                      )}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => openEdit(row)}
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => handleDelete(row)}
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
              Showing {rows.length === 0 ? 0 : currentStart} - {Math.min(currentEnd, totalElements)} of {totalElements} entries
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

      <WizardPopup
        modalWidth="760px"
        open={isAddOpen}
        title="Add Supplier"
        steps={STEPS}
        step={0}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleSaveAdd}
        submitLabel="Save"
      >
        <div className="avm-grid">
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={manualScope.headOffices}
              schoolOptions={schoolOptions}
              selectedHeadOfficeId={addForm.headOfficeId}
              onHeadOfficeChange={(value) => {
                setAddForm((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))
              }}
              selectedSchoolId={addForm.schoolId}
              onSchoolChange={(value) => {
                const selectedSchool = getSchoolById(allSchools, value)
                setAddForm((prev) => ({
                  ...prev,
                  schoolId: value,
                  headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
                }))
              }}
              schoolLabel="School"
            />
          ) : (
            <>
              {isHeadOfficeAdmin ? (
                <FormField label="Head Office" full>
                  <input
                    className="avm-input"
                    value={authHeadOfficeName || String(authHeadOfficeId || '')}
                    disabled
                  />
                </FormField>
              ) : null}

              <FormField label="School Name" required full>
                <select
                  className="avm-select"
                  id="schoolId"
                  value={addForm.schoolId}
                  onChange={(e) => {
                    const value = e.target.value
                    const selectedSchool = getSchoolById(allSchools, value)
                    setAddForm((prev) => ({
                      ...prev,
                      schoolId: value,
                      headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
                    }))
                  }}
                >
                  <option value="">--Select School--</option>
                  {schoolOptions.map((school) => (
                    <option key={String(school.id)} value={String(school.id)}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </FormField>
            </>
          )}

          <FormField label="Supplier" required>
            <input
              type="text"
              className="avm-input"
              id="supplierName"
              placeholder="Supplier"
              value={addForm.supplierName}
              onChange={(e) => setAddForm((prev) => ({ ...prev, supplierName: e.target.value }))}
            />
          </FormField>

          <FormField label="Contact Name" required>
            <input
              type="text"
              className="avm-input"
              id="contactName"
              placeholder="Contact Name"
              value={addForm.contactName}
              onChange={(e) => setAddForm((prev) => ({ ...prev, contactName: e.target.value }))}
            />
          </FormField>

          <FormField label="Email">
            <input
              type="email"
              className="avm-input"
              id="email"
              placeholder="Email"
              value={addForm.email}
              onChange={(e) => setAddForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </FormField>

          <FormField label="Phone" required>
            <PhoneField
              id="phone"
              label=""
              value={addForm.phone}
              onChange={(value) => setAddForm((prev) => ({ ...prev, phone: value }))}
              required
            />
          </FormField>

          <FormField label="Address" full>
            <input
              type="text"
              className="avm-input"
              id="address"
              placeholder="Address"
              value={addForm.address}
              onChange={(e) => setAddForm((prev) => ({ ...prev, address: e.target.value }))}
            />
          </FormField>

          <FormField label="Note" full>
            <textarea
              className="avm-input avm-textarea"
              id="note"
              rows="3"
              placeholder="Note"
              value={addForm.note}
              onChange={(e) => setAddForm((prev) => ({ ...prev, note: e.target.value }))}
            ></textarea>
          </FormField>
        </div>
      </WizardPopup>

      <WizardPopup
        modalWidth="760px"
        open={isEditOpen}
        title="Edit Supplier"
        steps={STEPS}
        step={0}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleSaveEdit}
        submitLabel="Update"
      >
        <div className="avm-grid">
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={manualScope.headOffices}
              schoolOptions={editSchoolOptions}
              selectedHeadOfficeId={editForm.headOfficeId}
              onHeadOfficeChange={(value) => {
                setEditForm((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))
              }}
              selectedSchoolId={editForm.schoolId}
              onSchoolChange={(value) => {
                const selectedSchool = getSchoolById(allSchools, value)
                setEditForm((prev) => ({
                  ...prev,
                  schoolId: value,
                  headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
                }))
              }}
              schoolLabel="School"
            />
          ) : (
            <>
              {isHeadOfficeAdmin ? (
                <FormField label="Head Office" full>
                  <input
                    className="avm-input"
                    value={authHeadOfficeName || String(authHeadOfficeId || '')}
                    disabled
                  />
                </FormField>
              ) : null}

              <FormField label="School Name" required full>
                <select
                  className="avm-select"
                  id="schoolId"
                  value={editForm.schoolId}
                  onChange={(e) => {
                    const value = e.target.value
                    const selectedSchool = getSchoolById(allSchools, value)
                    setEditForm((prev) => ({
                      ...prev,
                      schoolId: value,
                      headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
                    }))
                  }}
                >
                  <option value="">--Select School--</option>
                  {editSchoolOptions.map((school) => (
                    <option key={String(school.id)} value={String(school.id)}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </FormField>
            </>
          )}

          <FormField label="Supplier" required>
            <input
              type="text"
              className="avm-input"
              id="supplierName"
              placeholder="Supplier"
              value={editForm.supplierName}
              onChange={(e) => setEditForm((prev) => ({ ...prev, supplierName: e.target.value }))}
            />
          </FormField>

          <FormField label="Contact Name" required>
            <input
              type="text"
              className="avm-input"
              id="contactName"
              placeholder="Contact Name"
              value={editForm.contactName}
              onChange={(e) => setEditForm((prev) => ({ ...prev, contactName: e.target.value }))}
            />
          </FormField>

          <FormField label="Email">
            <input
              type="email"
              className="avm-input"
              id="email"
              placeholder="Email"
              value={editForm.email}
              onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </FormField>

          <FormField label="Phone" required>
            <PhoneField
              id="phone"
              label=""
              value={editForm.phone}
              onChange={(value) => setEditForm((prev) => ({ ...prev, phone: value }))}
              required
            />
          </FormField>

          <FormField label="Address" full>
            <input
              type="text"
              className="avm-input"
              id="address"
              placeholder="Address"
              value={editForm.address}
              onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
            />
          </FormField>

          <FormField label="Note" full>
            <textarea
              className="avm-input avm-textarea"
              id="note"
              rows="3"
              placeholder="Note"
              value={editForm.note}
              onChange={(e) => setEditForm((prev) => ({ ...prev, note: e.target.value }))}
            ></textarea>
          </FormField>
        </div>
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        title="Find Supplier"
      >
        <form
          className="p-20 d-grid gap-16"
          onSubmit={handleApplyFilters}
        >
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={manualScope.headOffices}
              schoolOptions={filterSchoolOptions}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={(value) => {
                setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))
              }}
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={(value) => {
                const selectedSchool = getSchoolById(allSchools, value)
                setPendingFilters((prev) => ({
                  ...prev,
                  schoolId: value,
                  headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
                }))
              }}
              schoolLabel="School"
            />
          ) : (
            <FormField label="School Name" full>
              <select
                className="avm-select"
                value={pendingFilters.schoolId}
                onChange={(e) => {
                  const value = e.target.value
                  setPendingFilters((prev) => ({ ...prev, schoolId: value }))
                }}
              >
                <option value="">All Schools</option>
                {filterSchoolOptions.map((school) => (
                  <option key={String(school.id)} value={String(school.id)}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <div className="d-flex gap-8 mt-12">
            <button
              type="button"
              className="btn btn-danger-200 text-danger-600 w-100"
              onClick={handleResetFilters}
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

export default Supplier
