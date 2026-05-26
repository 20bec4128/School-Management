import { useCallback, useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import RoomFormFields from '../components/RoomFormFields'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchHostels } from '../apis/hostelsApi'
import { fetchRoomsPage, updateRoom, deleteRoom } from '../apis/roomsApi'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const emptyFilters = {
  headOfficeId: '',
  schoolId: 'Select',
  roomType: 'Select',
}

const emptyEditForm = {
  id: '',
  headOfficeId: '',
  schoolId: '',
  hostelId: '',
  roomNo: '',
  roomType: '',
  seatTotal: '',
  costPerSeat: '',
  note: '',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'hostel', label: 'Hostel' },
  { key: 'roomNo', label: 'Room No' },
  { key: 'roomType', label: 'Room Type' },
  { key: 'seatTotal', label: 'Seat Total' },
  { key: 'costPerSeat', label: 'Cost per Seat' },
]

const ManageRoom = ({ onNavigate }) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName, canAdd, canEdit, canDelete } = useAuth()
  const PAGE_SLUG = 'manage-room'
  const { activeSchoolId } = useSchool()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [rows, setRows] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [hostelOptions, setHostelOptions] = useState([])
  const [loadingLookups, setLoadingLookups] = useState(false)
  const [loadingHostels, setLoadingHostels] = useState(false)
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
      if (!currentHeadOfficeId) return []
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

  const loadHostelsForSchool = useCallback(async (schoolId) => {
    if (!schoolId) {
      setHostelOptions([])
      return
    }
    setLoadingHostels(true)
    try {
      const data = await fetchHostels({
        headOfficeId: currentHeadOfficeId || undefined,
        schoolId,
      })
      setHostelOptions(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load hostel options:', err)
      setHostelOptions([])
    } finally {
      setLoadingHostels(false)
    }
  }, [currentHeadOfficeId])

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
        console.error('Failed to load room lookups:', err)
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
    const schoolId = isSchoolAdmin
      ? authSchoolId != null
        ? String(authSchoolId)
        : ''
      : filters.schoolId && filters.schoolId !== 'Select'
        ? String(filters.schoolId)
        : currentSchoolId
    void loadHostelsForSchool(schoolId)
  }, [authSchoolId, currentSchoolId, filters.schoolId, isSchoolAdmin, loadHostelsForSchool])

  const loadRows = useCallback(async () => {
    if (status !== 'ready' || !token) return

    setLoading(true)
    setError('')
    try {
      const selectedSchoolId = filters.schoolId && filters.schoolId !== 'Select'
        ? String(filters.schoolId)
        : ''
      const selectedHeadOfficeId = filters.headOfficeId || ''
      const selectedRoomType = filters.roomType && filters.roomType !== 'Select'
        ? String(filters.roomType)
        : ''
      const effectiveSchoolId = isSchoolAdmin
        ? authSchoolId != null
          ? String(authSchoolId)
          : ''
        : selectedSchoolId || currentSchoolId || ''
      const pageData = await fetchRoomsPage({
        headOfficeId: selectedHeadOfficeId || undefined,
        schoolId: effectiveSchoolId || undefined,
        roomType: selectedRoomType || undefined,
        search: debouncedSearch,
        page: currentPage - 1,
        size: rowsPerPage,
      })
      setRows(Array.isArray(pageData?.content) ? pageData.content : [])
      setTotalElements(Number(pageData?.totalElements ?? 0))
      setTotalPages(Number(pageData?.totalPages ?? 0))
    } catch (err) {
      console.error('Failed to load rooms:', err)
      setError(err?.message || 'Failed to load rooms')
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [authSchoolId, currentSchoolId, debouncedSearch, filters.headOfficeId, filters.roomType, filters.schoolId, isSchoolAdmin, currentPage, rowsPerPage, status, token])

  useEffect(() => {
    void loadRows()
  }, [loadRows])

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
      hostelId: row.hostelId != null ? String(row.hostelId) : '',
      roomNo: row.roomNo || '',
      roomType: row.roomType || '',
      seatTotal: row.seatTotal != null ? String(row.seatTotal) : '',
      costPerSeat: row.costPerSeat != null ? String(row.costPerSeat) : '',
      note: row.note || '',
    })
    setIsEditOpen(true)
  }

  useEffect(() => {
    if (!isEditOpen) return
    const schoolId = editForm.schoolId ? String(editForm.schoolId) : ''
    void loadHostelsForSchool(schoolId)
  }, [editForm.schoolId, isEditOpen, loadHostelsForSchool])

  const buildPayload = (form) => ({
    headOfficeId: form.headOfficeId ? Number(form.headOfficeId) : null,
    schoolId: Number(form.schoolId),
    hostelId: Number(form.hostelId),
    roomNo: String(form.roomNo || '').trim(),
    roomType: String(form.roomType || '').trim(),
    seatTotal: form.seatTotal === '' || form.seatTotal == null ? null : Number(form.seatTotal),
    costPerSeat: form.costPerSeat === '' || form.costPerSeat == null ? null : Number(form.costPerSeat),
    note: form.note,
  })

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editForm.id) return
    if (!editForm.schoolId || !editForm.hostelId || !editForm.roomNo || !editForm.roomType || !editForm.seatTotal) {
      setError('School, hostel, room no, room type, and seat total are required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await updateRoom(editForm.id, buildPayload(editForm))
      setIsEditOpen(false)
      void loadRows()
    } catch (err) {
      console.error('Failed to update room:', err)
      setError(err?.message || 'Failed to update room')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return
    try {
      await deleteRoom(row.id)
      void loadRows()
    } catch (err) {
      console.error('Failed to delete room:', err)
      setError(err?.message || 'Failed to delete room')
    }
  }

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      rows.map((row) => ({
        School: row.schoolName || '',
        Hostel: row.hostelName || row.hostel || '',
        'Room No': row.roomNo || '',
        'Room Type': row.roomType || '',
        'Seat Total': row.seatTotal || '',
        'Cost per Seat': row.costPerSeat || '',
      })),
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rooms')
    XLSX.writeFile(workbook, 'Room_List.xlsx')
  }

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.text('Room Report', 14, 10)
    doc.autoTable({
      head: [['S.L', ...columnOptions.filter((column) => visibleColumns[column.key]).map((column) => column.label)]],
      body: rows.map((row, index) => [
        index + 1,
        ...(columnOptions.filter((column) => visibleColumns[column.key]).map((column) => {
          if (column.key === 'school') return row.schoolName || '--'
          if (column.key === 'hostel') return row.hostelName || row.hostel || '--'
          return row[column.key] || '--'
        })),
      ]),
      headStyles: { fillColor: [31, 41, 55] },
    })
    doc.save('Room_List.pdf')
  }

  const renderCell = (row, column) => {
    if (column.key === 'school') return row.schoolName || '--'
    if (column.key === 'hostel') return row.hostelName || row.hostel || '--'
    return row?.[column.key] || '--'
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Manage Room</h1>
          <span className="text-secondary-light">Hostel / Manage Room</span>
        </div>
        {canAdd(PAGE_SLUG) && (
          <button
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={() => onNavigate?.('add-room')}
            type="button"
          >
            <i className="ri-add-large-line"></i> Add Room
          </button>
        )}
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown
                rows={rows}
                columns={columnOptions}
                visibleColumns={visibleColumns}
                fileName="Room_List"
                sheetName="Rooms"
                pdfTitle="Room Report"
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
              />

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
                placeholder="Search room..."
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
                      <input type="checkbox" className="form-check-input" checked={false} readOnly />
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
                      Loading rooms...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No rooms found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" readOnly />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + index + 1}</label>
                        </div>
                      </td>
                      {columnOptions.map((column) => (visibleColumns[column.key] ? (
                        <td key={column.key} className={column.key === 'roomNo' ? 'fw-medium text-primary-light' : ''}>
                          {renderCell(row, column)}
                        </td>
                      ) : null))}
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
                              onClick={() => handleDelete(row)}
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
              Showing {rows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min((currentPage - 1) * rowsPerPage + rows.length, totalElements)} of {totalElements}
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
        modalWidth="560px"
        open={isEditOpen}
        title="Edit Room"
        steps={['Basic Info']}
        step={0}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
        submitLabel={saving ? 'Updating...' : 'Update Room'}
      >
        <RoomFormFields
          form={editForm}
          setForm={setEditForm}
          isSuperAdmin={isSuperAdmin}
          isHeadOfficeAdmin={isHeadOfficeAdmin}
          isSchoolAdmin={isSchoolAdmin}
          headOffices={headOffices}
          schoolOptions={schoolOptions}
          hostelOptions={hostelOptions}
          selectedHeadOfficeId={editForm.headOfficeId}
          selectedSchoolId={editForm.schoolId}
          onHeadOfficeChange={(value) => {
            setEditForm((prev) => ({
              ...prev,
              headOfficeId: value,
              schoolId: '',
              hostelId: '',
            }))
            if (isSuperAdmin) {
              manualScope.setSelectedScope(value, '')
            }
          }}
          onSchoolChange={(value) => {
            setEditForm((prev) => ({
              ...prev,
              schoolId: value,
              hostelId: '',
            }))
            if (isSuperAdmin) {
              manualScope.setSelectedScope(editForm.headOfficeId, value)
            }
          }}
          headOfficeName={authHeadOfficeName || ''}
          schoolName={currentEditSchoolName}
          hostelLoading={loadingHostels || loadingLookups}
        />
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        title="Find Room"
      >
        <form
          className="p-20 d-grid gap-16"
          onSubmit={(e) => {
            e.preventDefault()
            setFilters(pendingFilters)
            setCurrentPage(1)
            setIsFilterSidebarOpen(false)
          }}
        >
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

          <div>
            <label htmlFor="roomType" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Room Type
            </label>
            <select
              id="roomType"
              className="form-control form-select"
              value={pendingFilters.roomType}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, roomType: e.target.value }))}
            >
              <option value="Select">All Types</option>
              <option value="AC">AC</option>
              <option value="Non AC">Non AC</option>
              <option value="Dormitory">Dormitory</option>
            </select>
          </div>

          <div className="d-flex gap-8 mt-12">
            <button
              type="button"
              className="btn btn-danger-200 text-danger-600 w-100"
              onClick={() => {
                const reset = { headOfficeId: '', schoolId: 'Select', roomType: 'Select' }
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

export default ManageRoom
