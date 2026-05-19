import React, { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ExportDropdown from '../components/ExportDropdown'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { apiUrl, createSlider, deleteSlider, fetchSlidersPage, updateSlider } from '../apis/slidersApi'
import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-subscription-slider-row'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  title: '',
  caption: '',
  image: '',
  status: 'Active',
}

const emptyFilters = {
  schoolId: 'Select',
  status: 'Select',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'image', label: 'Image' },
  { key: 'title', label: 'Title' },
  { key: 'caption', label: 'Caption' },
  { key: 'status', label: 'Status' },
]

const FIELD_ICONS = {
  'Head Office': 'ri-government-line',
  'School Name': 'ri-school-line',
  Title: 'ri-text',
  Caption: 'ri-chat-1-line',
  Image: 'ri-image-line',
  Status: 'ri-toggle-line',
}

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label} {required && <span className="text-danger-600">*</span>}
      </label>
      <div className="avm-input-with-icon" style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: '0.85rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#667085',
            zIndex: 1,
          }}
        >
          <i className={icon} />
        </span>
        {children}
      </div>
    </div>
  )
}

const STEPS = ['Basic Information']

const resolveImageSrc = (value) => {
  const src = String(value || '').trim()
  if (!src) return 'https://via.placeholder.com/100x40'
  if (src.startsWith('data:') || src.startsWith('http')) return src
  return apiUrl(src)
}

const fetchAllPages = async (query) => {
  const firstPage = await fetchSlidersPage({ ...query, page: 0, size: 100 })
  const firstRows = Array.isArray(firstPage?.content) ? firstPage.content : []
  const totalPages = Number(firstPage?.totalPages ?? 1) || 1
  if (totalPages <= 1) return firstRows
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => fetchSlidersPage({ ...query, page: index + 1, size: 100 })),
  )
  return rest.reduce((acc, item) => {
    if (Array.isArray(item?.content)) acc.push(...item.content)
    return acc
  }, [...firstRows])
}

const SubscriptionSlider = () => {
  const { role, headOfficeId: authHeadOfficeId, schoolId: authSchoolId } = useAuth()
  const normalizedRole = normalizeRole(role)
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = normalizedRole === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = normalizedRole === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [allSchools, setAllSchools] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [filters, setFilters] = useState(emptyFilters)
  const [selectedRows, setSelectedRows] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  useEffect(() => {
    let cancelled = false
    const loadSchools = async () => {
      try {
        const list = await fetchSchoolsLookup()
        if (!cancelled) setAllSchools(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setAllSchools([])
      }
    }
    void loadSchools()
    return () => {
      cancelled = true
    }
  }, [])

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return Array.isArray(manualScope.schoolOptions) ? manualScope.schoolOptions : []
    if (isHeadOfficeAdmin) return allSchools.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    if (isSchoolAdmin) return allSchools.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    return allSchools
  }, [allSchools, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.schoolOptions])

  const effectiveHeadOfficeId = useMemo(() => {
    if (isSuperAdmin) return manualScope.selectedHeadOfficeId ? Number(manualScope.selectedHeadOfficeId) : null
    if (isHeadOfficeAdmin) return authHeadOfficeId ?? null
    if (isSchoolAdmin) {
      const school = allSchools.find((item) => String(item?.id ?? '') === String(authSchoolId ?? ''))
      return school?.headOfficeId != null ? Number(school.headOfficeId) : null
    }
    return null
  }, [allSchools, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.selectedHeadOfficeId])

  const effectiveSchoolId = useMemo(() => {
    if (isSuperAdmin) return manualScope.selectedSchoolId ? Number(manualScope.selectedSchoolId) : null
    if (isSchoolAdmin) return authSchoolId ?? null
    return filters.schoolId !== 'Select' ? Number(filters.schoolId) : null
  }, [authSchoolId, filters.schoolId, isSchoolAdmin, isSuperAdmin, manualScope.selectedSchoolId])

  const loadRows = async () => {
    setLoading(true)
    try {
      const result = await fetchSlidersPage({
        headOfficeId: effectiveHeadOfficeId,
        schoolId: effectiveSchoolId,
        status: filters.status !== 'Select' ? filters.status : undefined,
        search,
        page: currentPage - 1,
        size: rowsPerPage,
      })
      setRows(Array.isArray(result?.content) ? result.content : [])
      setTotalElements(Number(result?.totalElements ?? 0))
      setTotalPages(Math.max(1, Number(result?.totalPages ?? 1) || 1))
    } catch {
      setRows([])
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, search, filters.status, effectiveHeadOfficeId, effectiveSchoolId])

  const filteredData = rows
  const paginatedData = useMemo(() => filteredData, [filteredData])

  const handleInputChange = (e) => {
    const { id, value } = e.target
    if (id === 'schoolId' && !isSuperAdmin) {
      const school = allSchools.find((item) => String(item?.id ?? '') === String(value))
      setFormData((prev) => ({ ...prev, schoolId: value, headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : '' }))
      return
    }
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const next = typeof reader.result === 'string' ? reader.result : ''
      setImagePreview(next)
      setFormData((prev) => ({ ...prev, image: next }))
    }
    reader.readAsDataURL(file)
  }

  const openAdd = () => {
    setEditingId(null)
    setFormData({
      ...emptyForm,
      headOfficeId: isSuperAdmin ? manualScope.selectedHeadOfficeId : authHeadOfficeId != null ? String(authHeadOfficeId) : '',
      schoolId: isSuperAdmin ? manualScope.selectedSchoolId : isSchoolAdmin && authSchoolId != null ? String(authSchoolId) : '',
    })
    setImagePreview('')
    setIsModalOpen(true)
  }

  const handleExportExcel = async () => {
    const allRows = await fetchAllPages({
      headOfficeId: effectiveHeadOfficeId,
      schoolId: effectiveSchoolId,
      status: filters.status !== 'Select' ? filters.status : undefined,
      search,
    })
    const ws = XLSX.utils.json_to_sheet(allRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'SubscriptionSliders')
    XLSX.writeFile(wb, 'Subscription_Slider_List.xlsx')
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p += 1) pages.push(p)
    return pages
  }

  const handleSave = async () => {
    const schoolId = isSuperAdmin
      ? manualScope.selectedSchoolId
        ? Number(manualScope.selectedSchoolId)
        : formData.schoolId
          ? Number(formData.schoolId)
          : null
      : formData.schoolId
        ? Number(formData.schoolId)
        : null
    if (!schoolId) return window.alert('School is required')
    if (!formData.image) return window.alert('Image is required')
    if (!formData.title.trim()) return window.alert('Title is required')

    const school = schoolOptions.find((item) => String(item?.id ?? '') === String(schoolId))
    const payload = {
      headOfficeId: isSuperAdmin
        ? manualScope.selectedHeadOfficeId
          ? Number(manualScope.selectedHeadOfficeId)
          : school?.headOfficeId != null
            ? Number(school.headOfficeId)
            : null
        : formData.headOfficeId
          ? Number(formData.headOfficeId)
          : school?.headOfficeId != null
            ? Number(school.headOfficeId)
            : null,
      schoolId,
      title: formData.title.trim(),
      caption: formData.caption.trim(),
      image: formData.image,
      status: formData.status,
    }

    if (editingId) {
      await updateSlider(editingId, payload)
    } else {
      await createSlider(payload)
    }

    setIsModalOpen(false)
    await loadRows()
  }

  const handleEdit = (row) => {
    sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row))
    setEditingId(row.id)
    setFormData({
      headOfficeId: row.headOfficeId != null ? String(row.headOfficeId) : '',
      schoolId: row.schoolId != null ? String(row.schoolId) : '',
      title: row.title || '',
      caption: row.caption || '',
      image: row.image || '',
      status: row.status || 'Active',
    })
    setImagePreview(row.image ? resolveImageSrc(row.image) : '')
    if (isSuperAdmin && row.headOfficeId != null && row.schoolId != null) {
      manualScope.setSelectedScope(String(row.headOfficeId), String(row.schoolId))
    }
    setIsModalOpen(true)
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete slider "${row.title || row.id}"?`)) return
    await deleteSlider(row.id)
    await loadRows()
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Subscription Slider</h1>
          <span className="text-secondary-light">Subscription / Slider Management</span>
        </div>
        <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <i className="ri-add-large-line" /> Add Slider
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={handleExportExcel} />
              <button
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsFilterOpen(true)}
              >
                <span className="text-secondary-light text-sm">Find</span>
                <i className="ri-arrow-right-line" />
              </button>
              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                  data-bs-toggle="dropdown"
                >
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line" />
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
              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
              >
                {[10, 20, 50].map((n) => (
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
                placeholder="Search..."
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
                      <input type="checkbox" className="form-check-input" />
                      <label className="form-check-label">#SL</label>
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
                      Loading...
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr key={row.id ?? idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedRows.includes(row.id)}
                            onChange={() =>
                              setSelectedRows((prev) =>
                                prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id],
                              )
                            }
                          />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {columnOptions.map(
                        (col) =>
                          visibleColumns[col.key] && (
                            <td key={col.key}>
                              {col.key === 'image' ? (
                                <img
                                  src={resolveImageSrc(row.image)}
                                  alt={row.title || 'Slider'}
                                  className="w-100-px h-40-px radius-4 object-fit-cover"
                                />
                              ) : col.key === 'status' ? (
                                <span
                                  className={`px-12 py-4 radius-4 fw-medium text-sm ${
                                    row[col.key] === 'Active'
                                      ? 'bg-success-100 text-success-600'
                                      : 'bg-danger-100 text-danger-600'
                                  }`}
                                >
                                  {row[col.key]}
                                </span>
                              ) : col.key === 'schoolName' || col.key === 'title' ? (
                                <span className="fw-medium text-primary-light">{row[col.key]}</span>
                              ) : (
                                row[col.key]
                              )}
                            </td>
                          ),
                      )}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="text-info-600 bg-info-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            onClick={() => handleEdit(row)}
                          >
                            <i className="ri-edit-line" />
                          </button>
                          <button
                            type="button"
                            className="text-danger-600 bg-danger-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            onClick={() => handleDelete(row)}
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

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, totalElements)} of {totalElements}
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

      <SlideSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Find Slider">
        <form
          className="p-20 d-grid gap-16"
          onSubmit={(e) => {
            e.preventDefault()
            setIsFilterOpen(false)
            setCurrentPage(1)
            void loadRows()
          }}
        >
          {!isSuperAdmin && !isSchoolAdmin ? (
            <div>
              <label className="text-sm fw-semibold text-primary-light mb-8">School</label>
              <select
                className="form-control form-select"
                value={filters.schoolId}
                onChange={(e) => setFilters((prev) => ({ ...prev, schoolId: e.target.value }))}
              >
                <option value="Select">--Select School--</option>
                {schoolOptions.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.schoolName || school.name || String(school.id)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Status</label>
            <select
              className="form-control form-select"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="Select">--Select Status--</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary-600 w-100">
            Apply Filter
          </button>
        </form>
      </SlideSidebar>

      <WizardPopup
        modalWidth="560px"
        open={isModalOpen}
        title={editingId ? 'Edit Slider' : 'Add Slider'}
        steps={STEPS}
        step={0}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        submitLabel={editingId ? 'Update' : 'Save'}
      >
        <div className="avm-grid">
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={manualScope.headOffices}
              schoolOptions={manualScope.schoolOptions}
              selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
              onHeadOfficeChange={manualScope.setSelectedHeadOfficeId}
              selectedSchoolId={manualScope.selectedSchoolId}
              onSchoolChange={manualScope.setSelectedSchoolId}
            />
          ) : (
            <FormField label="School Name" required>
              <select className="avm-input form-select" id="schoolId" value={formData.schoolId} onChange={handleInputChange}>
                <option value="">--Select--</option>
                {schoolOptions.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.schoolName || school.name || String(school.id)}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <FormField label="Image" required full>
            <div className="w-100">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="mb-12 radius-8 object-fit-cover"
                  style={{ width: '100%', maxHeight: '180px' }}
                />
              ) : (
                <div className="mb-12 d-flex align-items-center justify-content-center border border-dashed radius-8 py-20 text-secondary-light">
                  <i className="ri-image-add-line text-40" />
                </div>
              )}
              <input type="file" className="form-control" accept=".jpg,.jpeg,.png,.gif" onChange={handleImageChange} />
            </div>
          </FormField>

          <FormField label="Title" required>
            <input type="text" className="avm-input" id="title" value={formData.title} onChange={handleInputChange} placeholder="Title" />
          </FormField>

          <FormField label="Caption" full>
            <input type="text" className="avm-input" id="caption" value={formData.caption} onChange={handleInputChange} placeholder="Caption" />
          </FormField>

          <FormField label="Status">
            <select className="avm-input form-select" id="status" value={formData.status} onChange={handleInputChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </FormField>
        </div>
      </WizardPopup>
    </div>
  )
}

export default SubscriptionSlider
