import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createEvent, deleteEvent, fetchEvents, updateEvent } from '../apis/eventApi'
import { findSchoolById } from '../utils/schoolScope'
import '../assets/css/addModalShared.css'

const emptyForm = {
  schoolId: '',
  title: '',
  eventFor: '',
  eventPlace: '',
  fromDate: '',
  toDate: '',
  image: '',
  note: '',
  isViewOnWeb: '',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  eventFor: 'Select',
  isViewOnWeb: 'Select',
}

const ADD_STEPS = ['Basic Info', 'Other Info']
const EDIT_STEPS = ['Basic Info', 'Other Info']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Title: 'ri-calendar-event-line',
  'Event for': 'ri-group-line',
  'Event Place': 'ri-map-pin-line',
  'From Date': 'ri-calendar-2-line',
  'To Date': 'ri-calendar-check-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'title', label: 'Title' },
  { key: 'eventFor', label: 'Event for' },
  { key: 'eventPlace', label: 'Event Place' },
  { key: 'fromDate', label: 'From Date' },
  { key: 'toDate', label: 'To Date' },
  { key: 'image', label: 'Image' },
  { key: 'isViewOnWeb', label: 'Is View on Web?' },
]

const eventForOptions = ['Students', 'Parents', 'Staff', 'All']

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

const eventForBadge = (val) => {
  if (val === 'Students') return 'bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (val === 'Parents') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (val === 'Staff') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
}

const Event = () => {
  const { role, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const listSchoolId = isSuperAdmin
    ? (activeSchoolId ? String(activeSchoolId) : '')
    : activeSchoolId
      ? String(activeSchoolId)
      : authSchoolId
        ? String(authSchoolId)
        : ''

  const [rows, setRows] = useState([])
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [addPreview, setAddPreview] = useState('')
  const [editPreview, setEditPreview] = useState('')
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const addPhotoRef = useRef(null)
  const editPhotoRef = useRef(null)
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(() => {
    const list = Array.isArray(schools) ? schools : []
    if (isSuperAdmin) return manualScope.selectedHeadOfficeId ? manualScope.schoolOptions : []
    const fallback =
      listSchoolId && authSchoolName && !list.some((school) => String(school.id) === listSchoolId)
        ? [{ id: listSchoolId, schoolName: authSchoolName }]
        : []
    return [...list, ...fallback]
  }, [schools, listSchoolId, authSchoolName, isSuperAdmin, manualScope.selectedHeadOfficeId, manualScope.schoolOptions])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        [row.schoolName, row.title, row.eventFor, row.eventPlace, row.fromDate, row.toDate, row.note]
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesSchool = !filters.schoolId || String(row.schoolId ?? '') === String(filters.schoolId)
      const matchesEventFor = filters.eventFor === 'Select' || row.eventFor === filters.eventFor
      const matchesViewOnWeb =
        filters.isViewOnWeb === 'Select' ||
        (filters.isViewOnWeb === 'Yes' ? row.isViewOnWeb : !row.isViewOnWeb)
      return matchesSearch && matchesSchool && matchesEventFor && matchesViewOnWeb
    })
  }, [rows, search, filters])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [currentPage, filteredRows, rowsPerPage])

  const allSelected = paginatedRows.length > 0 && paginatedRows.every((row) => selectedRows.includes(String(row.id)))

  const loadSchools = useCallback(async () => {
    try {
      const list = await fetchSchoolsLookup()
      setSchools(Array.isArray(list) ? list : [])
    } catch {
      setSchools([])
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isSuperAdmin) {
        const list = await fetchEvents(listSchoolId ? { schoolId: listSchoolId } : {})
        setRows(
          Array.isArray(list)
            ? list.map((item) => ({
                id: item?.id,
                schoolId: item?.schoolId ?? null,
                schoolName: item?.schoolName || '',
                title: item?.title || '',
                eventFor: item?.eventFor || '',
                eventPlace: item?.eventPlace || '',
                fromDate: item?.fromDate || '',
                toDate: item?.toDate || '',
                image: item?.image || '',
                note: item?.note || '',
                isViewOnWeb: Boolean(item?.isViewOnWeb),
              }))
            : [],
        )
        return
      }
      if (!listSchoolId) {
        setRows([])
        setError('Select a school before viewing events.')
        return
      }
      const list = await fetchEvents({ schoolId: listSchoolId })
      setRows(
        Array.isArray(list)
          ? list.map((item) => ({
              id: item?.id,
              schoolId: item?.schoolId ?? null,
              schoolName: item?.schoolName || '',
              title: item?.title || '',
              eventFor: item?.eventFor || '',
              eventPlace: item?.eventPlace || '',
              fromDate: item?.fromDate || '',
              toDate: item?.toDate || '',
              image: item?.image || '',
              note: item?.note || '',
              isViewOnWeb: Boolean(item?.isViewOnWeb),
            }))
          : [],
      )
    } catch (err) {
      setRows([])
      setError(err?.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [listSchoolId, isSuperAdmin])

  useEffect(() => {
    void loadSchools()
  }, [loadSchools])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (!isSuperAdmin && listSchoolId) setAddForm((prev) => ({ ...prev, schoolId: listSchoolId }))
  }, [isSuperAdmin, listSchoolId])

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows((prev) => [...new Set([...prev, ...paginatedRows.map((row) => String(row.id))])])
    else setSelectedRows((prev) => prev.filter((id) => !paginatedRows.some((row) => String(row.id) === id)))
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({ ...prev, [id]: value }))
  }

  const handlePhotoChange = (e, setPreview, setter) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      setter((prev) => ({ ...prev, image: dataUrl }))
      setPreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
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

  const handleSave = async (form, isEdit = false) => {
    const payload = {
      schoolId: form.schoolId ? Number(form.schoolId) : null,
      title: form.title,
      eventFor: form.eventFor,
      eventPlace: form.eventPlace,
      fromDate: form.fromDate,
      toDate: form.toDate,
      image: form.image,
      note: form.note,
      isViewOnWeb: form.isViewOnWeb === 'Yes',
    }
    if (isEdit) await updateEvent(editingId, payload)
    else await createEvent(payload)
    await loadData()
    setIsAddOpen(false)
    setIsEditOpen(false)
  }

  const openAdd = () => {
    setEditingId(null)
    setAddForm({
      ...emptyForm,
      schoolId: isSuperAdmin ? '' : listSchoolId || '',
    })
    setAddPreview('')
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    if (isSuperAdmin) {
      const school = findSchoolById(schools, row.schoolId)
      if (school?.headOfficeId != null) {
        manualScope.setSelectedScope(String(school.headOfficeId), row.schoolId != null ? String(row.schoolId) : '')
      }
    }
    setEditForm({
      schoolId: row.schoolId ? String(row.schoolId) : '',
      title: row.title,
      eventFor: row.eventFor,
      eventPlace: row.eventPlace,
      fromDate: row.fromDate,
      toDate: row.toDate,
      image: row.image || '',
      note: row.note || '',
      isViewOnWeb: row.isViewOnWeb ? 'Yes' : 'No',
    })
    setEditPreview(row.image || '')
    setEditStep(0)
    setIsEditOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return
    await deleteEvent(id)
    await loadData()
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let page = start; page <= end; page += 1) pages.push(page)
    return pages
  }

  const renderForm = (form, setter, photoRef, preview, setPreview, step = 0) => (
    <>
      <p className="avm-section-title">{step === 0 ? 'Basic Information' : 'Other Information'}</p>
      <div className="avm-grid">
        {step === 0 ? (
          <>
            {isSuperAdmin ? (
              <div className="avm-field full">
                <ManualScopeSelectors
                  enabled={isSuperAdmin}
                  headOffices={manualScope.headOffices}
                  schoolOptions={schoolOptions}
                  selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                  onHeadOfficeChange={(value) => {
                    manualScope.setSelectedHeadOfficeId(value)
                    manualScope.setSelectedSchoolId('')
                    setter((prev) => ({ ...prev, schoolId: '' }))
                  }}
                  selectedSchoolId={form.schoolId}
                  onSchoolChange={(value) => setter((prev) => ({ ...prev, schoolId: value }))}
                />
              </div>
            ) : (
              <FormField label="School Name" required full>
                <select className="avm-select" id="schoolId" value={form.schoolId} onChange={handleChange(setter)}>
                  <option value="">--Select School--</option>
                  {schoolOptions.map((school) => (
                    <option key={String(school.id)} value={String(school.id)}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </FormField>
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

            <FormField label="Event for" required>
              <select className="avm-select" id="eventFor" value={form.eventFor} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                {eventForOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Event Place" required>
              <input
                type="text"
                className="avm-input"
                id="eventPlace"
                placeholder="Event Place"
                value={form.eventPlace}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="From Date" required>
              <input type="date" className="avm-input" id="fromDate" value={form.fromDate} onChange={handleChange(setter)} />
            </FormField>

            <FormField label="To Date" required>
              <input type="date" className="avm-input" id="toDate" value={form.toDate} onChange={handleChange(setter)} />
            </FormField>
          </>
        ) : (
          <>
            <div className="avm-field full">
              <label className="avm-label">Image</label>
              <input
                ref={photoRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif"
                style={{ display: 'none' }}
                onChange={(e) => handlePhotoChange(e, setPreview, setter)}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button type="button" className="avm-btn light" onClick={() => photoRef.current.click()}>
                  <i className="ri-upload-2-line"></i> Upload Image
                </button>
                {preview ? (
                  <img
                    src={preview}
                    alt="preview"
                    style={{ width: 80, height: 54, objectFit: 'cover', borderRadius: 8, border: '1px solid #d0d5dd' }}
                  />
                ) : null}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#7a8a9a', marginTop: 4 }}>
                Dimension:- Max-W: 750px, Max-H: 500px — .jpg, .jpeg, .png or .gif
              </span>
            </div>

            <FormField label="Note" full>
              <textarea
                rows="4"
                className="avm-input avm-textarea"
                id="note"
                placeholder="Note"
                value={form.note}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Is View on Web?" required full noIcon>
              <select className="avm-select" id="isViewOnWeb" value={form.isViewOnWeb} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </FormField>
          </>
        )}
      </div>
    </>
  )

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Event</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Event</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={openAdd}
            disabled={!isSuperAdmin && !listSchoolId}
            title={!isSuperAdmin && !listSchoolId ? 'Select a school first' : ''}
          >
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add Event
          </button>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1"></i> Export
                  </span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
                      <i className="ri-file-3-line"></i> PDF
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
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
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  {columnOptions.map((column) => (
                    <li key={column.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input type="checkbox" className="form-check-input mt-0" checked={visibleColumns[column.key]} onChange={() => toggleColumn(column.key)} />
                        {column.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search events..."
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

          {error ? <div className="px-20 pt-16 text-danger-600">{error}</div> : null}
          {loading ? <div className="px-20 pt-16 text-secondary-light">Loading events...</div> : null}

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.schoolName ? <th scope="col">School</th> : null}
                  {visibleColumns.title ? <th scope="col">Title</th> : null}
                  {visibleColumns.eventFor ? <th scope="col">Event for</th> : null}
                  {visibleColumns.eventPlace ? <th scope="col">Event Place</th> : null}
                  {visibleColumns.fromDate ? <th scope="col">From Date</th> : null}
                  {visibleColumns.toDate ? <th scope="col">To Date</th> : null}
                  {visibleColumns.image ? <th scope="col">Image</th> : null}
                  {visibleColumns.isViewOnWeb ? <th scope="col">Is View on Web?</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No events found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedRows.includes(String(row.id))}
                            onChange={() => handleSelectRow(String(row.id))}
                          />
                          <label className="form-check-label">{String(row.id).padStart(2, '0')}</label>
                        </div>
                      </td>
                      {visibleColumns.schoolName ? <td>{row.schoolName}</td> : null}
                      {visibleColumns.title ? <td className="fw-medium text-primary-light">{row.title}</td> : null}
                      {visibleColumns.eventFor ? (
                        <td>
                          <span className={eventForBadge(row.eventFor)}>{row.eventFor}</span>
                        </td>
                      ) : null}
                      {visibleColumns.eventPlace ? <td>{row.eventPlace}</td> : null}
                      {visibleColumns.fromDate ? <td>{row.fromDate}</td> : null}
                      {visibleColumns.toDate ? <td>{row.toDate}</td> : null}
                      {visibleColumns.image ? (
                        <td>
                          {row.image ? (
                            <img src={row.image} alt="event" style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                          ) : (
                            <span className="text-secondary-light text-sm">—</span>
                          )}
                        </td>
                      ) : null}
                      {visibleColumns.isViewOnWeb ? (
                        <td>
                          <div className="form-check form-switch d-flex justify-content-center mb-0">
                            <input className="form-check-input" type="checkbox" defaultChecked={row.isViewOnWeb} style={{ cursor: 'pointer' }} />
                          </div>
                        </td>
                      ) : null}
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
                            onClick={() => handleDelete(row.id)}
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
              Showing {filteredRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredRows.length)} of {filteredRows.length}
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

      <WizardPopup
        modalWidth="540px"
        open={isAddOpen}
        title="Add Event"
        steps={ADD_STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(ADD_STEPS.length - 1, s + 1))}
        onSubmit={() => handleSave(addForm, false)}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm, addPhotoRef, addPreview, setAddPreview, addStep)}
      </WizardPopup>

      <WizardPopup
        modalWidth="540px"
        open={isEditOpen}
        title="Edit Event"
        steps={EDIT_STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(EDIT_STEPS.length - 1, s + 1))}
        onSubmit={() => handleSave(editForm, true)}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm, editPhotoRef, editPreview, setEditPreview, editStep)}
      </WizardPopup>

      <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter Events" onClose={() => setIsFilterSidebarOpen(false)} className="filter-sidebar">
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled={isSuperAdmin}
              headOffices={manualScope.headOffices}
              schoolOptions={schoolOptions}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={(value) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  headOfficeId: value,
                  schoolId: '',
                }))
              }
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={(value) => setPendingFilters((prev) => ({ ...prev, schoolId: value }))}
            />
          ) : (
            <div>
              <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                School
              </label>
              <select id="schoolId" className="form-control form-select" value={pendingFilters.schoolId} onChange={handlePendingFilterChange}>
                <option value="">Select School</option>
                {schoolOptions.map((option) => (
                  <option key={String(option.id)} value={String(option.id)}>
                    {option.schoolName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="eventFor" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Event for
            </label>
            <select id="eventFor" className="form-control form-select" value={pendingFilters.eventFor} onChange={handlePendingFilterChange}>
              <option value="Select">Select Event for</option>
              {eventForOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="isViewOnWeb" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Is View on Web?
            </label>
            <select id="isViewOnWeb" className="form-control form-select" value={pendingFilters.isViewOnWeb} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
              Reset
            </button>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn btn-primary-600 w-100" onClick={() => setIsFilterSidebarOpen(false)}>
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default Event
