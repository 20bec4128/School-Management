import { useCallback, useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ExportDropdown from '../components/ExportDropdown'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createSupplier, deleteSupplier, fetchSuppliersPage, updateSupplier } from '../apis/suppliersApi'
import '../assets/css/addModalShared.css'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  vendorName: '',
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

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'supplierName', label: 'Vendor' },
  { key: 'contactName', label: 'Contact Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
]

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  Vendor: 'ri-store-2-line',
  'Contact Name': 'ri-user-line',
  Email: 'ri-mail-line',
  Phone: 'ri-phone-line',
  Address: 'ri-map-pin-line',
  Note: 'ri-sticky-note-line',
}

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
          <i className={icon} />
        </span>
        {children}
      </div>
    </div>
  )
}

const getSchoolById = (rows, schoolId) =>
  (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(schoolId ?? '')) || null

const Vendor = ({ onNavigate }) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId } = useSchool()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [rows, setRows] = useState([])
  const [headOffices, setHeadOffices] = useState([])
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

  const currentScopeSchoolId = isSuperAdmin
    ? (manualScope.selectedSchoolId ? String(manualScope.selectedSchoolId) : activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : '')
    : activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''

  const currentScopeHeadOfficeId = isSuperAdmin
    ? (manualScope.selectedHeadOfficeId ? String(manualScope.selectedHeadOfficeId) : '')
    : authHeadOfficeId != null
      ? String(authHeadOfficeId)
      : ''

  const filterSchoolOptions = useMemo(() => {
    const list = Array.isArray(allSchools) ? allSchools : []
    if (filters.headOfficeId) {
      return list.filter((school) => String(school.headOfficeId ?? '') === String(filters.headOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return list.filter((school) => String(school.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return list.filter((school) => String(school.id ?? '') === String(authSchoolId ?? ''))
    }
    return list
  }, [allSchools, authHeadOfficeId, authSchoolId, filters.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin])

  const addSchoolOptions = useMemo(() => {
    const list = Array.isArray(allSchools) ? allSchools : []
    if (isSuperAdmin) {
      if (!addForm.headOfficeId) return []
      return list.filter((school) => String(school.headOfficeId ?? '') === String(addForm.headOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return list.filter((school) => String(school.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return list.filter((school) => String(school.id ?? '') === String(authSchoolId ?? ''))
    }
    return list
  }, [addForm.headOfficeId, allSchools, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin])

  const editSchoolOptions = useMemo(() => {
    const list = Array.isArray(allSchools) ? allSchools : []
    if (isSuperAdmin) {
      if (!editForm.headOfficeId) return []
      return list.filter((school) => String(school.headOfficeId ?? '') === String(editForm.headOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return list.filter((school) => String(school.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return list.filter((school) => String(school.id ?? '') === String(authSchoolId ?? ''))
    }
    return list
  }, [allSchools, authHeadOfficeId, authSchoolId, editForm.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin])

  const resolveSchoolName = useCallback(
    (schoolId) => getSchoolById(allSchools, schoolId)?.schoolName || (String(schoolId ?? '') === String(authSchoolId ?? '') ? authSchoolName || '' : ''),
    [allSchools, authSchoolId, authSchoolName],
  )

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    let cancelled = false

    const loadLookups = async () => {
      setLookupLoading(true)
      try {
        const [headOfficePage, schools] = await Promise.all([
          isSuperAdmin || isHeadOfficeAdmin ? fetchHeadOfficesPage(0, 500) : Promise.resolve({ content: [] }),
          fetchSchoolsLookup(),
        ])
        if (cancelled) return
        setHeadOffices(Array.isArray(headOfficePage?.content) ? headOfficePage.content : [])
        setAllSchools(Array.isArray(schools) ? schools : [])
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load vendor lookups:', err)
        setAllSchools([])
      } finally {
        if (!cancelled) setLookupLoading(false)
      }
    }

    void loadLookups()
    return () => {
      cancelled = true
    }
  }, [isHeadOfficeAdmin, isSuperAdmin, status, token])

  const loadRows = useCallback(async () => {
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
      console.error('Failed to load vendors:', err)
      setError(err?.message || 'Failed to load vendors')
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, filters.headOfficeId, filters.schoolId, rowsPerPage, status, token])

  useEffect(() => {
    void loadRows()
  }, [loadRows])

  useEffect(() => {
    if (!isSuperAdmin) return
    const selectedSchool = manualScope.selectedSchoolId ? getSchoolById(allSchools, manualScope.selectedSchoolId) : null
    if (selectedSchool?.headOfficeId == null) return
    setAddForm((prev) => ({
      ...prev,
      headOfficeId: String(selectedSchool.headOfficeId),
      schoolId: String(manualScope.selectedSchoolId || ''),
    }))
  }, [allSchools, isSuperAdmin, manualScope.selectedSchoolId])

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

  const buildPayload = (form) => ({
    headOfficeId: form.headOfficeId ? Number(form.headOfficeId) : null,
    schoolId: form.schoolId ? Number(form.schoolId) : null,
    supplierName: String(form.vendorName || '').trim(),
    contactName: String(form.contactName || '').trim(),
    email: String(form.email || '').trim(),
    phone: String(form.phone || '').trim(),
    address: String(form.address || '').trim(),
    note: String(form.note || '').trim(),
  })

  const openAdd = () => {
    const base = { ...emptyForm }
    if (isHeadOfficeAdmin && authHeadOfficeId != null) base.headOfficeId = String(authHeadOfficeId)
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
    setEditForm({
      id: row?.id != null ? String(row.id) : '',
      headOfficeId: row?.headOfficeId != null ? String(row.headOfficeId) : '',
      schoolId: row?.schoolId != null ? String(row.schoolId) : '',
      vendorName: row?.supplierName || '',
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
      setError('Vendor name, contact name, phone, and school are required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await createSupplier(payload)
      setIsAddOpen(false)
      setAddForm(emptyForm)
      await loadRows()
    } catch (err) {
      console.error('Failed to create vendor:', err)
      setError(err?.message || 'Failed to create vendor')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    const payload = buildPayload(editForm)
    if (!payload.supplierName || !payload.contactName || !payload.phone || !payload.schoolId) {
      setError('Vendor name, contact name, phone, and school are required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await updateSupplier(editForm.id, payload)
      setIsEditOpen(false)
      await loadRows()
    } catch (err) {
      console.error('Failed to update vendor:', err)
      setError(err?.message || 'Failed to update vendor')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete vendor "${row?.supplierName || 'this vendor'}"?`)) return
    setSaving(true)
    setError('')
    try {
      await deleteSupplier(row.id)
      await loadRows()
    } catch (err) {
      console.error('Failed to delete vendor:', err)
      setError(err?.message || 'Failed to delete vendor')
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

  const currentStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const currentEnd = totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Vendor</h1>
          <span className="text-secondary-light">Inventory / Vendor Management</span>
        </div>
        <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd} type="button">
          <i className="ri-add-large-line" /> Add Vendor
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {error ? <div className="px-20 py-12 text-danger">{error}</div> : null}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown
                rows={rows}
                columns={columnOptions}
                visibleColumns={visibleColumns}
                loadRows={loadExportRows}
                mapRow={mapExportRow}
                fileName="Vendor_List"
                sheetName="Vendors"
                pdfTitle="Vendor Report"
              />

              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="text-secondary-light text-sm">Find</span>
                <i className="ri-arrow-right-line" />
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown">
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line" />
                </button>
                <ul className="dropdown-menu p-12 border shadow">
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
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search vendors..."
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

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table">
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" readOnly />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {columnOptions.map((col) => visibleColumns[col.key] && <th key={col.key}>{col.label}</th>)}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">Loading vendors...</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">No records found.</td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id ?? idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" readOnly />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {columnOptions.map((col) => visibleColumns[col.key] && (
                        <td key={col.key}>
                          {col.key === 'supplierName' ? (
                            <span className="fw-medium text-primary-light">{row[col.key] || '--'}</span>
                          ) : (
                            row[col.key] || '--'
                          )}
                        </td>
                      ))}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => openEdit(row)}
                          >
                            <i className="ri-edit-line" />
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => void handleDelete(row)}
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

          <div className="d-flex align-items-center justify-content-between px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {currentStart} - {currentEnd} of {totalElements} entries
            </span>
            <div className="d-flex align-items-center gap-8">
              <button className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              <button className="btn btn-sm btn-primary-600">{currentPage}</button>
              <button className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} title="Find Vendor">
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          <ManualScopeSelectors
            enabled={isSuperAdmin}
            headOffices={headOffices}
            schoolOptions={filterSchoolOptions}
            selectedHeadOfficeId={filters.headOfficeId}
            selectedSchoolId={filters.schoolId}
            onHeadOfficeChange={(value) => setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))}
            onSchoolChange={(value) => setPendingFilters((prev) => ({ ...prev, schoolId: value }))}
            showSchoolSelector
            schoolLabel="School Name"
          />
          <div className="d-flex gap-8 mt-12">
            <button type="button" className="btn btn-danger-200 text-danger-600 w-100" onClick={handleResetFilters}>Reset</button>
            <button type="submit" className="btn btn-primary-600 w-100">Apply Filter</button>
          </div>
        </form>
      </SlideSidebar>

      <WizardPopup
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Vendor"
        onSave={() => void handleSaveAdd()}
        saving={saving}
        steps={['Basic Information']}
        activeStep={0}
        onStepChange={() => {}}
      >
        <div className="row g-20">
          <ManualScopeSelectors
            enabled={isSuperAdmin}
            headOffices={headOffices}
            schoolOptions={addSchoolOptions}
            selectedHeadOfficeId={addForm.headOfficeId}
            selectedSchoolId={addForm.schoolId}
            onHeadOfficeChange={(value) => setAddForm((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))}
            onSchoolChange={(value) => setAddForm((prev) => ({ ...prev, schoolId: value }))}
            showSchoolSelector
            schoolLabel="School Name"
            loading={lookupLoading}
          />
          <div className="col-md-6">
            <FormField label="Vendor" required>
              <input className="avm-input" id="vendorName" value={addForm.vendorName} onChange={(e) => setAddForm((prev) => ({ ...prev, vendorName: e.target.value }))} placeholder="Vendor Name" />
            </FormField>
          </div>
          <div className="col-md-6">
            <FormField label="Contact Name" required>
              <input className="avm-input" id="contactName" value={addForm.contactName} onChange={(e) => setAddForm((prev) => ({ ...prev, contactName: e.target.value }))} placeholder="Contact Name" />
            </FormField>
          </div>
          <div className="col-md-6">
            <FormField label="Email">
              <input className="avm-input" id="email" value={addForm.email} onChange={(e) => setAddForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" />
            </FormField>
          </div>
          <div className="col-md-6">
            <FormField label="Phone" required>
              <input className="avm-input" id="phone" value={addForm.phone} onChange={(e) => setAddForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Phone" />
            </FormField>
          </div>
          <div className="col-12">
            <FormField label="Address" full>
              <textarea className="avm-input avm-textarea" id="address" rows="3" value={addForm.address} onChange={(e) => setAddForm((prev) => ({ ...prev, address: e.target.value }))} placeholder="Address" />
            </FormField>
          </div>
          <div className="col-12">
            <FormField label="Note" full>
              <textarea className="avm-input avm-textarea" id="note" rows="3" value={addForm.note} onChange={(e) => setAddForm((prev) => ({ ...prev, note: e.target.value }))} placeholder="Note" />
            </FormField>
          </div>
        </div>
      </WizardPopup>

      <WizardPopup
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Vendor"
        onSave={() => void handleSaveEdit()}
        saving={saving}
        steps={['Basic Information']}
        activeStep={0}
        onStepChange={() => {}}
      >
        <div className="row g-20">
          <ManualScopeSelectors
            enabled={isSuperAdmin}
            headOffices={headOffices}
            schoolOptions={editSchoolOptions}
            selectedHeadOfficeId={editForm.headOfficeId}
            selectedSchoolId={editForm.schoolId}
            onHeadOfficeChange={(value) => setEditForm((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))}
            onSchoolChange={(value) => setEditForm((prev) => ({ ...prev, schoolId: value }))}
            showSchoolSelector
            schoolLabel="School Name"
            loading={lookupLoading}
          />
          <div className="col-md-6">
            <FormField label="Vendor" required>
              <input className="avm-input" id="vendorName" value={editForm.vendorName} onChange={(e) => setEditForm((prev) => ({ ...prev, vendorName: e.target.value }))} placeholder="Vendor Name" />
            </FormField>
          </div>
          <div className="col-md-6">
            <FormField label="Contact Name" required>
              <input className="avm-input" id="contactName" value={editForm.contactName} onChange={(e) => setEditForm((prev) => ({ ...prev, contactName: e.target.value }))} placeholder="Contact Name" />
            </FormField>
          </div>
          <div className="col-md-6">
            <FormField label="Email">
              <input className="avm-input" id="email" value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" />
            </FormField>
          </div>
          <div className="col-md-6">
            <FormField label="Phone" required>
              <input className="avm-input" id="phone" value={editForm.phone} onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Phone" />
            </FormField>
          </div>
          <div className="col-12">
            <FormField label="Address" full>
              <textarea className="avm-input avm-textarea" id="address" rows="3" value={editForm.address} onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))} placeholder="Address" />
            </FormField>
          </div>
          <div className="col-12">
            <FormField label="Note" full>
              <textarea className="avm-input avm-textarea" id="note" rows="3" value={editForm.note} onChange={(e) => setEditForm((prev) => ({ ...prev, note: e.target.value }))} placeholder="Note" />
            </FormField>
          </div>
        </div>
      </WizardPopup>
    </div>
  )
}

export default Vendor
