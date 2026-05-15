import { useCallback, useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import TransportRouteFormFields from '../components/TransportRouteFormFields'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchVehicles } from '../apis/vehiclesApi'
import { fetchTransportRoutesPage, updateTransportRoute, deleteTransportRoute } from '../apis/transportRoutesApi'
import '../assets/css/addModalShared.css'

const emptyFilters = {
  headOfficeId: '',
  schoolId: 'Select',
}

const emptyEditForm = {
  id: '',
  headOfficeId: '',
  schoolId: '',
  routeName: '',
  routeStart: '',
  routeEnd: '',
  vehicleId: '',
  note: '',
  stops: [{ stopName: '', stopKm: '', stopFare: '' }],
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'routeName', label: 'Route Name' },
  { key: 'routeStart', label: 'Start' },
  { key: 'routeEnd', label: 'End' },
  { key: 'vehicleDisplay', label: 'Vehicle' },
  { key: 'stopCount', label: 'Stops' },
]

const getVehicleDisplay = (row) => {
  if (!row) return '--'
  if (row.vehicleName) return row.vehicleName
  if (row.vehicleNumber && row.vehicleModel) return `${row.vehicleNumber} - ${row.vehicleModel}`
  if (row.vehicleNumber) return row.vehicleNumber
  return '--'
}

const TransportRoute = ({ onNavigate }) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId } = useSchool()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [routes, setRoutes] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [vehicleOptions, setVehicleOptions] = useState([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [loadingLookups, setLoadingLookups] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(emptyEditForm)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const currentSchoolId = isSuperAdmin
    ? (manualScope.selectedSchoolId ? String(manualScope.selectedSchoolId) : activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : '')
    : activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''

  const currentHeadOfficeId = isSuperAdmin
    ? (manualScope.selectedHeadOfficeId ? String(manualScope.selectedHeadOfficeId) : '')
    : authHeadOfficeId != null
      ? String(authHeadOfficeId)
      : ''

  const schoolOptions = useMemo(() => {
    const rows = Array.isArray(allSchools) ? allSchools : []
    if (isSuperAdmin) {
      if (!currentHeadOfficeId) return rows
      return rows.filter((school) => String(school.headOfficeId ?? '') === String(currentHeadOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return rows.filter((school) => String(school.headOfficeId ?? '') === String(authHeadOfficeId))
    }
    if (isSchoolAdmin) {
      return rows.filter((school) => String(school.id ?? '') === String(authSchoolId))
    }
    return rows
  }, [allSchools, isSuperAdmin, isHeadOfficeAdmin, isSchoolAdmin, currentHeadOfficeId, authHeadOfficeId, authSchoolId])

  const currentEditSchool = useMemo(() => {
    const match = Array.isArray(allSchools)
      ? allSchools.find((school) => String(school.id ?? '') === String(editForm.schoolId))
      : null
    return match || null
  }, [allSchools, editForm.schoolId])

  const currentEditSchoolName = currentEditSchool?.schoolName || authSchoolName || ''

  const fetchVehiclesForSchool = useCallback(async (schoolId) => {
    if (!schoolId) {
      setVehicleOptions([])
      return
    }
    setLoadingVehicles(true)
    try {
      const rows = await fetchVehicles({ schoolId })
      setVehicleOptions(Array.isArray(rows) ? rows : [])
    } catch (err) {
      console.error('Failed to load transport vehicles:', err)
      setVehicleOptions([])
    } finally {
      setLoadingVehicles(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    let cancelled = false

    const loadLookups = async () => {
      setLoadingLookups(true)
      try {
        const [headOfficePage, schoolsData] = await Promise.all([
          isSuperAdmin || isHeadOfficeAdmin ? fetchHeadOfficesPage(0, 500) : Promise.resolve({ content: [] }),
          fetchSchoolsLookup(),
        ])
        if (cancelled) return
        setHeadOffices(Array.isArray(headOfficePage?.content) ? headOfficePage.content : [])
        setAllSchools(Array.isArray(schoolsData) ? schoolsData : [])
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load transport route lookups:', err)
        setHeadOffices([])
        setAllSchools([])
      } finally {
        if (!cancelled) setLoadingLookups(false)
      }
    }

    void loadLookups()
    return () => {
      cancelled = true
    }
  }, [status, token, isSuperAdmin, isHeadOfficeAdmin])

  useEffect(() => {
    if (!isEditOpen) return
    if (!editForm.schoolId) {
      setVehicleOptions([])
      return
    }
    void fetchVehiclesForSchool(editForm.schoolId)
  }, [editForm.schoolId, fetchVehiclesForSchool, isEditOpen])

  useEffect(() => {
    if (!isSchoolAdmin) return
    if (authSchoolId == null) return
    setPendingFilters((prev) => ({
      ...prev,
      schoolId: String(authSchoolId),
    }))
  }, [authSchoolId, isSchoolAdmin])

  const loadRoutes = useCallback(async () => {
    if (status !== 'ready' || !token) return

    setLoading(true)
    setError('')
    try {
      const selectedSchoolId = filters.schoolId && filters.schoolId !== 'Select'
        ? String(filters.schoolId)
        : ''
      const selectedHeadOfficeId = filters.headOfficeId || ''
      const effectiveSchoolId = isSchoolAdmin
        ? authSchoolId != null
          ? String(authSchoolId)
          : ''
        : selectedSchoolId || currentSchoolId || ''
      const pageData = await fetchTransportRoutesPage({
        headOfficeId: selectedHeadOfficeId || undefined,
        schoolId: effectiveSchoolId || undefined,
        search: debouncedSearch,
        page: currentPage - 1,
        size: rowsPerPage,
      })
      setRoutes(Array.isArray(pageData?.content) ? pageData.content : [])
      setTotalElements(Number(pageData?.totalElements ?? 0))
      setTotalPages(Number(pageData?.totalPages ?? 0))
    } catch (err) {
      console.error('Failed to load transport routes:', err)
      setError(err?.message || 'Failed to load transport routes')
      setRoutes([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [authSchoolId, currentSchoolId, debouncedSearch, filters.headOfficeId, filters.schoolId, isSchoolAdmin, currentPage, rowsPerPage, status, token])

  useEffect(() => {
    void loadRoutes()
  }, [loadRoutes])

  const currentEditVehicleOptions = useMemo(() => vehicleOptions, [vehicleOptions])

  const openEdit = (row) => {
    const school = row?.schoolId != null
      ? allSchools.find((item) => String(item.id) === String(row.schoolId))
      : null
    const headOfficeId = school?.headOfficeId != null
      ? String(school.headOfficeId)
      : authHeadOfficeId != null
        ? String(authHeadOfficeId)
        : ''
    if (isSuperAdmin && headOfficeId) {
      manualScope.setSelectedScope(headOfficeId, row.schoolId != null ? String(row.schoolId) : '')
    }
    setEditForm({
      id: row.id,
      headOfficeId,
      schoolId: row.schoolId != null ? String(row.schoolId) : currentSchoolId,
      routeName: row.routeName || '',
      routeStart: row.routeStart || '',
      routeEnd: row.routeEnd || '',
      vehicleId: row.vehicleId != null ? String(row.vehicleId) : '',
      note: row.note || '',
      stops: Array.isArray(row.stops) && row.stops.length > 0
        ? row.stops.map((stop) => ({
            stopName: stop.stopName || '',
            stopKm: stop.stopKm ?? '',
            stopFare: stop.stopFare ?? '',
          }))
        : [{ stopName: '', stopKm: '', stopFare: '' }],
    })
    setIsEditOpen(true)
    void fetchVehiclesForSchool(row?.schoolId != null ? String(row.schoolId) : currentSchoolId)
  }

  const buildPayload = (form) => ({
    headOfficeId: form.headOfficeId ? Number(form.headOfficeId) : null,
    schoolId: Number(form.schoolId),
    routeName: String(form.routeName || '').trim(),
    routeStart: String(form.routeStart || '').trim(),
    routeEnd: String(form.routeEnd || '').trim(),
    vehicleId: Number(form.vehicleId),
    note: form.note,
    stops: Array.isArray(form.stops)
      ? form.stops.map((stop) => ({
          stopName: String(stop.stopName || '').trim(),
          stopKm: stop.stopKm === '' || stop.stopKm == null ? null : Number(stop.stopKm),
          stopFare: stop.stopFare === '' || stop.stopFare == null ? null : Number(stop.stopFare),
        }))
      : [],
  })

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editForm.id) return
    if (!editForm.schoolId || !editForm.routeName || !editForm.routeStart || !editForm.routeEnd || !editForm.vehicleId) {
      setError('School, route name, route start, route end, and vehicle are required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await updateTransportRoute(editForm.id, buildPayload(editForm))
      setIsEditOpen(false)
      void loadRoutes()
    } catch (err) {
      console.error('Failed to update transport route:', err)
      setError(err?.message || 'Failed to update transport route')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm('Are you sure you want to delete this transport route?')) return
    try {
      await deleteTransportRoute(row.id)
      void loadRoutes()
    } catch (err) {
      console.error('Failed to delete transport route:', err)
      setError(err?.message || 'Failed to delete transport route')
    }
  }

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      routes.map((row) => ({
        School: row.schoolName || '',
        'Route Name': row.routeName || '',
        Start: row.routeStart || '',
        End: row.routeEnd || '',
        Vehicle: getVehicleDisplay(row),
        Stops: Array.isArray(row.stops) ? row.stops.length : row.stopCount || 0,
      })),
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'TransportRoutes')
    XLSX.writeFile(workbook, 'Transport_Route_List.xlsx')
  }

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.text('Transport Route Report', 14, 10)
    doc.autoTable({
      head: [['S.L', ...columnOptions.filter((column) => visibleColumns[column.key]).map((column) => column.label)]],
      body: routes.map((row, index) => [
        index + 1,
        ...(columnOptions.filter((column) => visibleColumns[column.key]).map((column) => {
          if (column.key === 'vehicleDisplay') return getVehicleDisplay(row) || '--'
          if (column.key === 'stopCount') return Array.isArray(row.stops) ? row.stops.length : row.stopCount || 0
          return row[column.key] || '--'
        })),
      ]),
      headStyles: { fillColor: [31, 41, 55] },
    })
    doc.save('Transport_Route_List.pdf')
  }

  const renderCell = (row, column) => {
    if (column.key === 'vehicleDisplay') return getVehicleDisplay(row)
    if (column.key === 'stopCount') return Array.isArray(row.stops) ? row.stops.length : row.stopCount || 0
    return row?.[column.key] || '--'
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Transport Route</h1>
          <span className="text-secondary-light">Transport / Route Management</span>
        </div>
        <button
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={() => onNavigate?.('transport-route-create')}
          type="button"
        >
          <i className="ri-add-large-line"></i> Add Route
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1"></i> Export
                  </span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li>
                    <button
                      type="button"
                      className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                      onClick={handleExportExcel}
                    >
                      <i className="ri-file-excel-2-line"></i> Excel
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                      onClick={handleExportPDF}
                    >
                      <i className="ri-file-3-line"></i> PDF
                    </button>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="text-secondary-light text-sm">Filter</span>
                <i className="ri-arrow-right-line"></i>
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <ul className="dropdown-menu p-12 border shadow">
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
                placeholder="Search transport route..."
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

          {error ? <div className="px-20 pt-16 text-danger-600 text-sm">{error}</div> : null}

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={false}
                        readOnly
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {columnOptions.map((column) => (visibleColumns[column.key] ? <th key={column.key} scope="col">{column.label}</th> : null))}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading transport routes...
                    </td>
                  </tr>
                ) : routes.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No transport routes found.
                    </td>
                  </tr>
                ) : (
                  routes.map((row, index) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" readOnly />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + index + 1}</label>
                        </div>
                      </td>
                      {columnOptions.map((column) => (visibleColumns[column.key] ? (
                        <td key={column.key} className={column.key === 'routeName' ? 'fw-medium text-primary-light' : ''}>
                          {renderCell(row, column)}
                        </td>
                      ) : null))}
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
                            onClick={() => handleDelete(row)}
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
              Showing {routes.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min((currentPage - 1) * rowsPerPage + routes.length, totalElements)} of {totalElements}
            </span>

            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
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
                onClick={() => setCurrentPage((page) => Math.min(Math.max(1, totalPages), page + 1))}
                disabled={currentPage === totalPages || totalPages < 1}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <WizardPopup
        modalWidth="860px"
        open={isEditOpen}
        title="Edit Transport Route"
        steps={['Route Information']}
        step={0}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
        submitLabel={saving ? 'Updating...' : 'Update Route'}
      >
        <TransportRouteFormFields
          form={editForm}
          setForm={setEditForm}
          isSuperAdmin={isSuperAdmin}
          isHeadOfficeAdmin={isHeadOfficeAdmin}
          isSchoolAdmin={isSchoolAdmin}
          headOffices={headOffices}
          schoolOptions={schoolOptions}
          vehicleOptions={currentEditVehicleOptions}
          selectedHeadOfficeId={editForm.headOfficeId}
          selectedSchoolId={editForm.schoolId}
          onHeadOfficeChange={(value) => {
            setEditForm((prev) => ({
              ...prev,
              headOfficeId: value,
              schoolId: '',
              vehicleId: '',
            }))
            if (isSuperAdmin) {
              manualScope.setSelectedScope(value, '')
            }
          }}
          onSchoolChange={(value) => {
            setEditForm((prev) => ({
              ...prev,
              schoolId: value,
              vehicleId: '',
            }))
            if (isSuperAdmin) {
              manualScope.setSelectedScope(editForm.headOfficeId, value)
            }
            void fetchVehiclesForSchool(value)
          }}
          headOfficeName={authHeadOfficeName || ''}
          schoolName={currentEditSchoolName}
          vehicleLoading={loadingVehicles}
        />
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        title="Find Transport Route"
      >
        <form className="p-20 d-grid gap-16" onSubmit={(e) => {
          e.preventDefault()
          setFilters(pendingFilters)
          setCurrentPage(1)
          setIsFilterSidebarOpen(false)
        }}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={headOffices}
              schoolOptions={schoolOptions}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={(value) => {
                setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: 'Select' }))
              }}
              selectedSchoolId={pendingFilters.schoolId === 'Select' ? '' : pendingFilters.schoolId}
              onSchoolChange={(value) => {
                setPendingFilters((prev) => ({ ...prev, schoolId: value || 'Select' }))
              }}
            />
          ) : (
            <>
              {isHeadOfficeAdmin ? (
                <div>
                  <label htmlFor="headOfficeId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                    Head Office
                  </label>
                  <input className="form-control" value={authHeadOfficeName || ''} readOnly />
                </div>
              ) : null}

              <div>
                <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                  School
                </label>
                <select
                  id="schoolId"
                  className="form-control form-select"
                  value={pendingFilters.schoolId}
                  onChange={(e) => setPendingFilters((prev) => ({ ...prev, schoolId: e.target.value }))}
                >
                  <option value="Select">All Schools</option>
                  {schoolOptions.map((school) => (
                    <option key={String(school.id)} value={String(school.id)}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="d-flex gap-8 mt-12">
            <button
              type="button"
              className="btn btn-danger-200 text-danger-600 w-100"
              onClick={() => {
                const reset = { headOfficeId: '', schoolId: 'Select' }
                setPendingFilters(reset)
                setFilters(reset)
                setCurrentPage(1)
              }}
            >
              Reset
            </button>
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply Filter
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default TransportRoute
