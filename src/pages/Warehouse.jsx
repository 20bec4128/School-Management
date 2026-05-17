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
import { normalizeRole } from '../utils/roles'
import { fetchEmployees } from '../apis/employeesApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createWarehouse, deleteWarehouse, fetchWarehousesPage, updateWarehouse } from '../apis/warehousesApi'
import '../assets/css/addModalShared.css'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  warehouseName: '',
  warehouseKeeper: '',
  warehouseKeeperId: '',
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
  Warehouse: 'ri-home-gear-line',
  'Warehouse Keeper': 'ri-user-settings-line',
  Email: 'ri-mail-line',
  Phone: 'ri-phone-line',
  Address: 'ri-map-pin-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'warehouseName', label: 'Warehouse' },
  { key: 'warehouseKeeper', label: 'Keeper' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'address', label: 'Address' },
]

const FormField = ({ label, required, children, full = false, noIcon = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
      {noIcon ? (
        children
      ) : (
        <div className="avm-input-with-icon" style={{ position: 'relative' }}>
          <span
            aria-hidden="true"
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
      )}
    </div>
  )
}

const getById = (rows, id) => (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(id ?? '')) || null

const Warehouse = () => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId } = useSchool()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'

  const [rows, setRows] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [addKeeperOptions, setAddKeeperOptions] = useState([])
  const [editKeeperOptions, setEditKeeperOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [saving, setSaving] = useState(false)
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

  const loadLookups = useCallback(async () => {
    setLookupLoading(true)
    try {
      const [headOfficePage, schools] = await Promise.all([
        fetchHeadOfficesPage(0, 500),
        fetchSchoolsLookup(),
      ])
      setHeadOffices(Array.isArray(headOfficePage?.content) ? headOfficePage.content : [])
      setAllSchools(Array.isArray(schools) ? schools : [])
    } catch (err) {
      console.error('Failed to load warehouse lookups:', err)
      setHeadOffices([])
      setAllSchools([])
    } finally {
      setLookupLoading(false)
    }
  }, [])

  const loadWarehouseKeepers = useCallback(async (schoolId, setOptions) => {
    if (!schoolId) {
      setOptions([])
      return
    }
    try {
      const rows = await fetchEmployees({ schoolId: Number(schoolId) })
      const keepers = (Array.isArray(rows) ? rows : []).filter((employee) => {
        const role = String(employee?.role || '').trim().toUpperCase()
        return role === 'WAREHOUSE_KEEPER'
      })
      setOptions(keepers)
    } catch (err) {
      console.error('Failed to load warehouse keeper employees:', err)
      setOptions([])
    }
  }, [])

  const resolveSchoolName = useCallback(
    (schoolId) => {
      if (schoolId == null) return ''
      const match = getById(allSchools, schoolId)
      return match?.schoolName || (String(schoolId) === String(authSchoolId ?? '') ? authSchoolName || '' : '')
    },
    [allSchools, authSchoolId, authSchoolName],
  )

  const schoolOptionsFor = useCallback(
    (headOfficeId, fallbackSchoolId) => {
      const rowsList = Array.isArray(allSchools) ? allSchools : []
      if (isSuperAdmin) {
        if (!headOfficeId) return []
        return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(headOfficeId))
      }
      if (isHeadOfficeAdmin) {
        return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
      }
      if (isSchoolAdmin) {
        return rowsList.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? fallbackSchoolId ?? ''))
      }
      return rowsList
    },
    [allSchools, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin],
  )

  const addSchoolOptions = useMemo(
    () => schoolOptionsFor(addForm.headOfficeId, addForm.schoolId),
    [addForm.headOfficeId, addForm.schoolId, schoolOptionsFor],
  )

  const editSchoolOptions = useMemo(
    () => schoolOptionsFor(editForm.headOfficeId, editForm.schoolId),
    [editForm.headOfficeId, editForm.schoolId, schoolOptionsFor],
  )

  const filterSchoolOptions = useMemo(
    () => schoolOptionsFor(pendingFilters.headOfficeId, pendingFilters.schoolId),
    [pendingFilters.headOfficeId, pendingFilters.schoolId, schoolOptionsFor],
  )

  const loadWarehouses = useCallback(async () => {
    if (status !== 'ready' || !token) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchWarehousesPage({
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
      console.error('Failed to load warehouses:', err)
      setError(err?.message || 'Failed to load warehouses')
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
    void loadWarehouses()
  }, [loadWarehouses, status, token])

  useEffect(() => {
    if (!isSuperAdmin) return
    if (!activeSchoolId) return
    const school = getById(allSchools, activeSchoolId)
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
      setPendingFilters((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
      setFilters((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
    }
  }, [authHeadOfficeId, isHeadOfficeAdmin])

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return
    const school = getById(allSchools, authSchoolId)
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
    setPendingFilters((prev) => ({ ...prev, schoolId: String(authSchoolId) }))
    setFilters((prev) => ({ ...prev, schoolId: String(authSchoolId) }))
  }, [allSchools, authSchoolId, isSchoolAdmin])

  useEffect(() => {
    if (addForm.schoolId) {
      void loadWarehouseKeepers(addForm.schoolId, setAddKeeperOptions)
    } else {
      setAddKeeperOptions([])
    }
  }, [addForm.schoolId, loadWarehouseKeepers])

  useEffect(() => {
    if (editForm.schoolId) {
      void loadWarehouseKeepers(editForm.schoolId, setEditKeeperOptions)
    } else {
      setEditKeeperOptions([])
    }
  }, [editForm.schoolId, loadWarehouseKeepers])

  useEffect(() => {
    if (editForm.warehouseKeeperId || !editForm.warehouseKeeper || editKeeperOptions.length === 0) return
    const match = editKeeperOptions.find((employee) => {
      const employeeName = String(employee?.name || '').trim().toLowerCase()
      const keeperName = String(editForm.warehouseKeeper || '').trim().toLowerCase()
      return employeeName && keeperName && employeeName === keeperName
    })
    if (!match) return
    setEditForm((prev) => ({
      ...prev,
      warehouseKeeperId: String(match.id),
    }))
  }, [editForm.warehouseKeeper, editForm.warehouseKeeperId, editKeeperOptions])

  useEffect(() => {
    if (currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const buildPayload = (form) => ({
    headOfficeId: form.headOfficeId ? Number(form.headOfficeId) : null,
    schoolId: form.schoolId ? Number(form.schoolId) : null,
    warehouseName: String(form.warehouseName || '').trim(),
    warehouseKeeperId: form.warehouseKeeperId ? Number(form.warehouseKeeperId) : null,
    warehouseKeeper: String(form.warehouseKeeper || '').trim(),
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
      const school = getById(allSchools, authSchoolId)
      base.schoolId = String(authSchoolId)
      base.headOfficeId = school?.headOfficeId != null ? String(school.headOfficeId) : ''
    }
    if (isSuperAdmin && activeSchoolId) {
      const school = getById(allSchools, activeSchoolId)
      if (school?.headOfficeId != null) {
        base.headOfficeId = String(school.headOfficeId)
        base.schoolId = String(activeSchoolId)
      }
    }
    setAddForm(base)
    setAddKeeperOptions([])
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    const school = getById(allSchools, row?.schoolId)
    setEditForm({
      id: row?.id != null ? String(row.id) : '',
      headOfficeId: row?.headOfficeId != null ? String(row.headOfficeId) : school?.headOfficeId != null ? String(school.headOfficeId) : '',
      schoolId: row?.schoolId != null ? String(row.schoolId) : '',
      warehouseName: row?.warehouseName || '',
      warehouseKeeper: row?.warehouseKeeper || '',
      warehouseKeeperId: row?.warehouseKeeperId != null ? String(row.warehouseKeeperId) : '',
      email: row?.email || '',
      phone: row?.phone || '',
      address: row?.address || '',
      note: row?.note || '',
    })
    setEditKeeperOptions([])
    setIsEditOpen(true)
  }

  const handleSaveAdd = async () => {
    const payload = buildPayload(addForm)
    if (!payload.warehouseName || !payload.schoolId) {
      setError('Warehouse name and school are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createWarehouse(payload)
      setIsAddOpen(false)
      setAddForm(emptyForm)
      await loadWarehouses()
    } catch (err) {
      console.error('Failed to create warehouse:', err)
      setError(err?.message || 'Failed to create warehouse')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    const payload = buildPayload(editForm)
    if (!payload.warehouseName || !payload.schoolId) {
      setError('Warehouse name and school are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateWarehouse(editForm.id, payload)
      setIsEditOpen(false)
      await loadWarehouses()
    } catch (err) {
      console.error('Failed to update warehouse:', err)
      setError(err?.message || 'Failed to update warehouse')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete warehouse "${row?.warehouseName || 'this warehouse'}"?`)) return
    setSaving(true)
    setError('')
    try {
      await deleteWarehouse(row.id)
      await loadWarehouses()
    } catch (err) {
      console.error('Failed to delete warehouse:', err)
      setError(err?.message || 'Failed to delete warehouse')
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
    const next = {
      headOfficeId: isHeadOfficeAdmin ? String(authHeadOfficeId ?? '') : '',
      schoolId: isSchoolAdmin ? String(authSchoolId ?? '') : '',
    }
    setPendingFilters(next)
    setFilters(next)
    setCurrentPage(1)
  }

  const exportRows = async () => {
    const size = Math.max(totalElements, rowsPerPage, 1)
    const data = await fetchWarehousesPage({
      page: 0,
      size,
      search: debouncedSearch,
      headOfficeId: filters.headOfficeId || undefined,
      schoolId: filters.schoolId || undefined,
    })
    return Array.isArray(data?.content) ? data.content : []
  }

  const mapExportRow = useCallback(
    (row) => ({
      ...row,
      schoolName: row.schoolName || resolveSchoolName(row.schoolId),
    }),
    [resolveSchoolName],
  )

  const handleSchoolChange = (setter, value) => {
    const selectedSchool = getById(allSchools, value)
    setter((prev) => ({
      ...prev,
      schoolId: value,
      headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
      warehouseKeeperId: '',
      warehouseKeeper: '',
    }))
  }

  const handleKeeperChange = (setter, options, value) => {
    const keeper = getById(options, value)
    setter((prev) => ({
      ...prev,
      warehouseKeeperId: value,
      warehouseKeeper: keeper?.name || '',
    }))
  }

  const handleHeadOfficeChange = (setter, value) => {
    setter((prev) => ({
      ...prev,
      headOfficeId: value,
      schoolId: '',
      warehouseKeeperId: '',
      warehouseKeeper: '',
    }))
  }

  const currentStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const currentEnd = totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Warehouse</h1>
          <span className="text-secondary-light">Inventory / Warehouse Management</span>
        </div>
        <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <i className="ri-add-large-line"></i> Add Warehouse
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
                loadRows={exportRows}
                mapRow={mapExportRow}
                fileName="Warehouse_List"
                sheetName="Warehouses"
                pdfTitle="Warehouse Report"
              />

              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="text-secondary-light text-sm">Find</span>
                <i className="ri-arrow-right-line"></i>
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown">
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line"></i>
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
                placeholder="Search warehouses..."
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
                  {columnOptions.map((col) => visibleColumns[col.key] && <th key={col.key}>{col.label}</th>)}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading warehouses...
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
                          <label className="form-check-label">{currentStart + idx}</label>
                        </div>
                      </td>
                      {columnOptions.map(
                        (col) =>
                          visibleColumns[col.key] && (
                            <td key={col.key}>
                              {col.key === 'warehouseName' ? (
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
              Showing {totalElements === 0 ? 0 : currentStart} - {totalElements === 0 ? 0 : Math.min(currentEnd, totalElements)} of {totalElements} entries
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
              {Array.from({ length: Math.min(totalPages || 0, 3) }, (_, index) => {
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
        title="Add Warehouse"
        steps={STEPS}
        step={0}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleSaveAdd}
        submitLabel={saving ? 'Saving...' : 'Save'}
      >
        <div className="avm-grid">
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={headOffices.map((row) => ({ id: row.id, name: row.name || row.headOfficeName || '' }))}
              schoolOptions={addSchoolOptions}
              selectedHeadOfficeId={addForm.headOfficeId}
              onHeadOfficeChange={(value) => handleHeadOfficeChange(setAddForm, value)}
              selectedSchoolId={addForm.schoolId}
              onSchoolChange={(value) => handleSchoolChange(setAddForm, value)}
              schoolLabel="School"
            />
          ) : (
            <>
              {isHeadOfficeAdmin ? (
                <FormField label="Head Office" full>
                  <input className="avm-input" value={authHeadOfficeName || String(authHeadOfficeId || '')} disabled />
                </FormField>
              ) : null}

              <FormField label="School Name" required full>
                <select
                  className="avm-select"
                  value={addForm.schoolId}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, schoolId: e.target.value }))}
                  disabled={isSchoolAdmin}
                >
                  <option value="">--Select School--</option>
                  {addSchoolOptions.map((school) => (
                    <option key={String(school.id)} value={String(school.id)}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </FormField>
            </>
          )}

          <FormField label="Warehouse" required >
            <input
              type="text"
              className="avm-input"
              id="warehouseName"
              placeholder="Warehouse"
              value={addForm.warehouseName}
              onChange={(e) => setAddForm((prev) => ({ ...prev, warehouseName: e.target.value }))}
            />
          </FormField>

          <FormField label="Warehouse Keeper">
            <select
              className="avm-select"
              id="warehouseKeeperId"
              value={addForm.warehouseKeeperId}
              onChange={(e) => handleKeeperChange(setAddForm, addKeeperOptions, e.target.value)}
              disabled={!addForm.schoolId}
            >
              <option value="">{addForm.schoolId ? '--Select Keeper--' : 'Select School First'}</option>
              {addKeeperOptions.map((employee) => (
                <option key={String(employee.id)} value={String(employee.id)}>
                  {employee.name}
                </option>
              ))}
            </select>
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

          <FormField label="Phone" noIcon>
            <PhoneField
              id="phone"
              label=""
              value={addForm.phone}
              onChange={(value) => setAddForm((prev) => ({ ...prev, phone: value }))}
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
        title="Edit Warehouse"
        steps={STEPS}
        step={0}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleSaveEdit}
        submitLabel={saving ? 'Updating...' : 'Update'}
      >
        <div className="avm-grid">
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={headOffices.map((row) => ({ id: row.id, name: row.name || row.headOfficeName || '' }))}
              schoolOptions={editSchoolOptions}
              selectedHeadOfficeId={editForm.headOfficeId}
              onHeadOfficeChange={(value) => handleHeadOfficeChange(setEditForm, value)}
              selectedSchoolId={editForm.schoolId}
              onSchoolChange={(value) => handleSchoolChange(setEditForm, value)}
              schoolLabel="School"
            />
          ) : (
            <>
              {isHeadOfficeAdmin ? (
                <FormField label="Head Office" full>
                  <input className="avm-input" value={authHeadOfficeName || String(authHeadOfficeId || '')} disabled />
                </FormField>
              ) : null}

              <FormField label="School Name" required full>
                <select
                  className="avm-select"
                  value={editForm.schoolId}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, schoolId: e.target.value }))}
                  disabled={isSchoolAdmin}
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

          <FormField label="Warehouse" required full>
            <input
              type="text"
              className="avm-input"
              id="warehouseName"
              placeholder="Warehouse"
              value={editForm.warehouseName}
              onChange={(e) => setEditForm((prev) => ({ ...prev, warehouseName: e.target.value }))}
            />
          </FormField>

          <FormField label="Warehouse Keeper">
            <select
              className="avm-select"
              id="warehouseKeeperId"
              value={editForm.warehouseKeeperId}
              onChange={(e) => handleKeeperChange(setEditForm, editKeeperOptions, e.target.value)}
              disabled={!editForm.schoolId}
            >
              <option value="">{editForm.schoolId ? '--Select Keeper--' : 'Select School First'}</option>
              {editKeeperOptions.map((employee) => (
                <option key={String(employee.id)} value={String(employee.id)}>
                  {employee.name}
                </option>
              ))}
            </select>
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

          <FormField label="Phone" noIcon>
            <PhoneField
              id="phone"
              label=""
              value={editForm.phone}
              onChange={(value) => setEditForm((prev) => ({ ...prev, phone: value }))}
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

      <SlideSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} title="Find Warehouse">
        <form
          className="p-20 d-grid gap-16"
          onSubmit={handleApplyFilters}
        >
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={headOffices.map((row) => ({ id: row.id, name: row.name || row.headOfficeName || '' }))}
              schoolOptions={filterSchoolOptions}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={(value) => setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))}
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={(value) => handleSchoolChange(setPendingFilters, value)}
              schoolLabel="School"
            />
          ) : (
            <>
              {isHeadOfficeAdmin ? (
                <FormField label="Head Office" full>
                  <input className="avm-input" value={authHeadOfficeName || String(authHeadOfficeId || '')} disabled />
                </FormField>
              ) : null}

              <FormField label="School Name" full>
                <select
                  className="avm-select"
                  value={pendingFilters.schoolId}
                  onChange={(e) => setPendingFilters((prev) => ({ ...prev, schoolId: e.target.value }))}
                  disabled={isSchoolAdmin}
                >
                  <option value="">All Schools</option>
                  {filterSchoolOptions.map((school) => (
                    <option key={String(school.id)} value={String(school.id)}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </FormField>
            </>
          )}

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

export default Warehouse
