import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import {
  deleteIdCardSetting,
  fetchIdCardSettingsPage,
} from '../apis/idCardSettingsApi'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-id-card-setting-row'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  borderColor: '#e01ab5',
  topBackground: '#3b82f6',
  cardSchoolName: '',
  schoolNameFontSize: '',
  schoolNameColor: '#1f2937',
  schoolAddress: '',
  schoolAddressColor: '#374151',
  idNoFontSize: '',
  idNoColor: '#e01ab5',
  idNoBackground: '#e01ab5',
  titleFontSize: '',
  titleColor: '#e01ab5',
  valueFontSize: '',
  valueColor: '#e01ab5',
  bottomSignature: '',
  signatureBackground: '#1e3a5f',
  signatureColor: '#ffffff',
  signatureAlign: '',
  cardLogoUrl: '',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
}



const columnOptions = [
  { key: 'headOfficeName', label: 'Head Office' },
  { key: 'schoolName', label: 'School' },
  { key: 'borderColor', label: 'Border Color' },
  { key: 'topBackground', label: 'Top Background' },
  { key: 'bottomSignature', label: 'Bottom Signature' },
  { key: 'signatureBackground', label: 'Signature Background' },
]

const ColorSwatch = ({ color }) => {
  const swatchColor = color || '#e5e7eb'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.85rem',
        color: '#34393f',
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          background: swatchColor,
          border: '1px solid rgba(0,0,0,0.12)',
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {color || '--'}
    </span>
  )
}

const getSafeText = (value, fallback = '--') => {
  const text = String(value ?? '').trim()
  return text || fallback
}

const IdCardPreview = ({ row, schoolName, headOfficeName }) => {
  const borderColor = row?.borderColor || '#e01ab5'
  const topBackground = row?.topBackground || borderColor
  const signatureBackground = row?.signatureBackground || borderColor
  const signatureColor = row?.signatureColor || '#ffffff'
  const align = row?.signatureAlign || 'center'
  const idNumber = `ID-${String(row?.id ?? '0001').padStart(4, '0')}`

  return (
    <div
      className="rounded-4 overflow-hidden shadow-sm"
      style={{
        border: `3px solid ${borderColor}`,
        background: '#fff',
        width: '100%',
        maxWidth: 500,
        margin: '0 auto',
      }}
    >
      <div
        className="p-16 text-white"
        style={{
          background: topBackground,
          minHeight: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', opacity: 0.9, textTransform: 'uppercase' }}>
            {getSafeText(row?.cardSchoolName || schoolName, schoolName || 'School Name')}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1, marginTop: 6 }}>
            ID Card
          </div>
          <div style={{ fontSize: 12, marginTop: 8, opacity: 0.95 }}>
            {getSafeText(headOfficeName, 'Head Office')}
          </div>
        </div>

        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {row?.cardLogoUrl ? (
            <img
              src={row.cardLogoUrl}
              alt={`${schoolName || 'School'} logo`}
              style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'rgba(255,255,255,0.92)' }}
            />
          ) : (
            <i className="ri-image-line" style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)' }} />
          )}
        </div>
      </div>

      <div className="p-16" style={{ background: '#f8fafc' }}>
        <div
          className="rounded-4 p-16 mb-16 bg-white border"
          style={{ borderColor: `${borderColor}26`, boxShadow: '0 6px 24px rgba(15, 23, 42, 0.06)' }}
        >
          <div className="d-flex align-items-start justify-content-between gap-12 mb-16">
            <div>
              <div className="text-secondary-light" style={{ fontSize: 12, letterSpacing: '0.08em' }}>School Name</div>
              <div className="fw-semibold text-primary-light" style={{ fontSize: 18, lineHeight: 1.2 }}>
                {getSafeText(row?.cardSchoolName || schoolName, schoolName || 'School Name')}
              </div>
              <div className="text-secondary-light mt-1" style={{ fontSize: 12 }}>
                {getSafeText(headOfficeName, 'Head Office')}
              </div>
            </div>
            <div
              className="rounded-3 px-3 py-2 fw-semibold"
              style={{
                background: `${borderColor}14`,
                color: borderColor,
                fontSize: 12,
                minWidth: 88,
                textAlign: 'center',
              }}
            >
              {idNumber}
            </div>
          </div>

          <div className="d-flex align-items-center gap-12 mb-16">
            <div
              className="rounded-circle overflow-hidden border bg-light"
              style={{ width: 84, height: 84, borderColor: `${borderColor}33`, flexShrink: 0 }}
            >
              {row?.cardLogoUrl ? (
                <img
                  src={row.cardLogoUrl}
                  alt={`${schoolName || 'School'} logo`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }}
                />
              ) : (
                <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary-light">
                  <i className="ri-image-line" style={{ fontSize: 28 }} />
                </div>
              )}
            </div>

            <div className="flex-grow-1">
              <div className="text-secondary-light" style={{ fontSize: 12 }}>School Address</div>
              <div className="fw-medium" style={{ color: '#334155', lineHeight: 1.4 }}>
                {getSafeText(row?.schoolAddress, 'School address')}
              </div>
            </div>
          </div>

          <div className="row g-2">
            <div className="col-6">
              <div className="rounded-3 p-3 bg-light border h-100">
                <div className="text-secondary-light" style={{ fontSize: 12 }}>Border Color</div>
                <div className="fw-semibold" style={{ color: borderColor }}>
                  {getSafeText(row?.borderColor, borderColor)}
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="rounded-3 p-3 bg-light border h-100">
                <div className="text-secondary-light" style={{ fontSize: 12 }}>Top Background</div>
                <div className="fw-semibold" style={{ color: topBackground }}>
                  {getSafeText(row?.topBackground, topBackground)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-3 p-16 text-center text-white"
          style={{
            background: signatureBackground,
            color: signatureColor,
            textAlign: align,
          }}
        >
          <div className="fw-semibold" style={{ fontSize: 15 }}>
            {getSafeText(row?.bottomSignature, 'Authorized Signature')}
          </div>
          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>
            {`Align: ${align}`}
          </div>
        </div>
      </div>
    </div>
  )
}



const getSchoolById = (rows, schoolId) =>
  (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(schoolId ?? '')) || null

const IdCardSetting = ({ onNavigate }) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName, canAdd, canEdit, canDelete } = useAuth()
  const PAGE_SLUG = 'id-card-setting'
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
  const [previewRow, setPreviewRow] = useState(null)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)
  const currentSchoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.selectedHeadOfficeId ? manualScope.schoolOptions : []
    if (isHeadOfficeAdmin || isSchoolAdmin) {
      return [{ id: authSchoolId, schoolName: authSchoolName, headOfficeId: authHeadOfficeId }]
    }
    return []
  }, [authHeadOfficeId, authSchoolId, authSchoolName, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.schoolOptions, manualScope.selectedHeadOfficeId])

  const resolveSchoolById = useCallback(
    (schoolId) => getSchoolById(allSchools.length > 0 ? allSchools : currentSchoolOptions, schoolId),
    [allSchools, currentSchoolOptions],
  )

  const resolveHeadOfficeName = useCallback(
    (headOfficeId) => {
      if (headOfficeId == null) return ''
      const row = manualScope.headOffices.find((ho) => String(ho.id) === String(headOfficeId))
      return row?.name || `Head Office ${headOfficeId}`
    },
    [manualScope.headOffices],
  )

  const resolveSchoolName = useCallback(
    (schoolId) => resolveSchoolById(schoolId)?.schoolName || (String(schoolId ?? '') === String(authSchoolId ?? '') ? authSchoolName || '' : ''),
    [authSchoolId, authSchoolName, resolveSchoolById],
  )



  const filterSchoolOptions = useMemo(() => {
    const rowsList = Array.isArray(allSchools) && allSchools.length > 0 ? allSchools : currentSchoolOptions
    if (pendingFilters.headOfficeId) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(pendingFilters.headOfficeId))
    }
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
  }, [allSchools, authHeadOfficeId, authSchoolId, currentSchoolOptions, filters.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin, pendingFilters.headOfficeId])

  const loadIdCardSettings = useCallback(async () => {
    if (status !== 'ready' || !token) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchIdCardSettingsPage({
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
      console.error('Failed to load ID card settings:', err)
      setError(err?.message || 'Failed to load ID card settings')
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
    setLookupLoading(false)
    setAllSchools(currentSchoolOptions)
  }, [currentSchoolOptions, status, token])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    void loadIdCardSettings()
  }, [loadIdCardSettings, status, token])

  useEffect(() => {
    if (!isSuperAdmin) return
    if (!activeSchoolId) return
    const school = getSchoolById(allSchools.length > 0 ? allSchools : currentSchoolOptions, activeSchoolId)
    if (school?.headOfficeId == null) return
    setPendingFilters((prev) => ({
      ...prev,
      headOfficeId: String(school.headOfficeId),
      schoolId: String(activeSchoolId),
    }))
    setFilters((prev) => ({
      ...prev,
      headOfficeId: String(school.headOfficeId),
      schoolId: String(activeSchoolId),
    }))
  }, [activeSchoolId, allSchools, currentSchoolOptions, isSuperAdmin])

  useEffect(() => {
    if (!isHeadOfficeAdmin || authHeadOfficeId == null) return
    setPendingFilters((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
    setFilters((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
  }, [authHeadOfficeId, isHeadOfficeAdmin])

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return
    const school = getSchoolById(allSchools.length > 0 ? allSchools : currentSchoolOptions, authSchoolId)
    const nextHeadOfficeId = school?.headOfficeId != null ? String(school.headOfficeId) : ''
    setPendingFilters((prev) => ({
      ...prev,
      headOfficeId: nextHeadOfficeId || prev.headOfficeId,
      schoolId: String(authSchoolId),
    }))
    setFilters((prev) => ({
      ...prev,
      headOfficeId: nextHeadOfficeId || prev.headOfficeId,
      schoolId: String(authSchoolId),
    }))
  }, [allSchools, authSchoolId, currentSchoolOptions, isSchoolAdmin])

  useEffect(() => {
    if (currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])


  const openAdd = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('id-card-setting-create')
    }
  }

  const openEdit = (row) => {
    try {
      const school = getSchoolById(allSchools.length > 0 ? allSchools : currentSchoolOptions, row?.schoolId)
      const headOfficeId = row?.headOfficeId != null ? String(row.headOfficeId) : school?.headOfficeId != null ? String(school.headOfficeId) : ''
      const payload = { ...row, headOfficeId }
      sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // ignore
    }
    if (typeof onNavigate === 'function') {
      onNavigate('id-card-setting-create')
    }
  }



  const handleDelete = async (row) => {
    if (!window.confirm(`Delete ID card setting for "${row?.schoolName || 'this school'}"?`)) return
    setSaving(true)
    setError('')
    try {
      await deleteIdCardSetting(row.id)
      await loadIdCardSettings()
    } catch (err) {
      console.error('Failed to delete ID card setting:', err)
      setError(err?.message || 'Failed to delete ID card setting')
    } finally {
      setSaving(false)
    }
  }

  const openPreview = (row) => {
    setPreviewRow(row)
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
    setIsFilterSidebarOpen(false)
  }

  const loadExportRows = useCallback(async () => {
    const size = Math.max(totalElements, rowsPerPage, 1)
    const data = await fetchIdCardSettingsPage({
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
      headOfficeName: row.headOfficeName || resolveHeadOfficeName(row.headOfficeId),
      schoolName: row.schoolName || resolveSchoolName(row.schoolId),
    }),
    [resolveHeadOfficeName, resolveSchoolName],
  )

  const handleLogoChange = (setter, setPreview) => (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const value = String(event.target?.result || '')
      setter((prev) => ({ ...prev, cardLogoUrl: value }))
      setPreview(value)
    }
    reader.readAsDataURL(file)
  }

  const clearLogo = (setter, setPreview, ref) => {
    setter((prev) => ({ ...prev, cardLogoUrl: '' }))
    setPreview('')
    if (ref.current) ref.current.value = ''
  }

  const handleFieldChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({ ...prev, [id]: value }))
  }

  const currentStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const currentEnd = totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)
  const pageCount = Math.max(1, totalPages)

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(pageCount, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }


  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">ID Card Setting</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / ID Card Setting</span>
          </div>
        </div>
        {canAdd(PAGE_SLUG) && (
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={openAdd}
          >
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add ID Card Setting
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
                loadRows={loadExportRows}
                mapRow={mapExportRow}
                fileName="ID_Card_Settings"
                sheetName="ID Card Settings"
                pdfTitle="ID Card Settings Report"
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
                placeholder="Search ID card settings..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th scope="col">S.L</th>
                  {columnOptions.map((column) =>
                    visibleColumns[column.key] ? <th key={column.key} scope="col">{column.label}</th> : null,
                  )}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading ID card settings...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No ID card settings found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id ?? idx}>
                      <td>
                        <span className="fw-medium text-primary-light">{currentStart + idx}</span>
                      </td>
                      {visibleColumns.headOfficeName ? <td>{row.headOfficeName || resolveHeadOfficeName(row.headOfficeId) || '--'}</td> : null}
                      {visibleColumns.schoolName ? <td className="fw-medium text-primary-light">{row.schoolName || resolveSchoolName(row.schoolId) || '--'}</td> : null}
                      {visibleColumns.borderColor ? <td><ColorSwatch color={row.borderColor || '--'} /></td> : null}
                      {visibleColumns.topBackground ? <td><ColorSwatch color={row.topBackground || '--'} /></td> : null}
                      {visibleColumns.bottomSignature ? <td>{row.bottomSignature || '--'}</td> : null}
                      {visibleColumns.signatureBackground ? <td><ColorSwatch color={row.signatureBackground || '--'} /></td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-primary-focus bg-hover-primary-200 text-primary-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => openPreview(row)}
                            title="Preview"
                            aria-label="Preview ID card"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
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
                              onClick={() => handleDelete(row)}
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
              Showing {totalElements === 0 ? 0 : currentStart} - {currentEnd} of {totalElements}
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
                  className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {previewRow ? (
        <div
          role="presentation"
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.72)', zIndex: 1060, padding: '24px' }}
          onClick={() => setPreviewRow(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white radius-16 shadow-lg p-16 position-relative"
            style={{ maxWidth: '860px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn btn-light border position-absolute top-0 end-0 m-12 rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '36px', height: '36px' }}
              onClick={() => setPreviewRow(null)}
              aria-label="Close preview"
            >
              <i className="ri-close-line"></i>
            </button>
            <div className="d-flex align-items-center justify-content-between mb-12 pe-40">
              <h6 className="mb-0 fw-semibold text-primary-light">
                {previewRow.schoolName || resolveSchoolName(previewRow.schoolId) || 'ID Card Preview'}
              </h6>
              <span className="badge text-bg-light border text-secondary-light">Read-only preview</span>
            </div>
            <div className="bg-light radius-12 p-16">
              <IdCardPreview
                row={previewRow}
                schoolName={resolveSchoolName(previewRow.schoolId)}
                headOfficeName={resolveHeadOfficeName(previewRow.headOfficeId)}
              />
            </div>
          </div>
        </div>
      ) : null}


      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter ID Card Settings"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <div style={{ gridColumn: '1 / -1' }}>
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
                  setPendingFilters((prev) => ({ ...prev, schoolId: value }))
                }}
                schoolLabel="School"
              />
            </div>
          ) : (
            <>
              {isHeadOfficeAdmin ? (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="filterHeadOffice" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                    Head Office
                  </label>
                  <input
                    id="filterHeadOffice"
                    className="form-control"
                    value={authHeadOfficeName || String(authHeadOfficeId || '')}
                    disabled
                  />
                </div>
              ) : null}

              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="filterSchool" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                  School
                </label>
                <select
                  id="filterSchool"
                  className="form-control form-select"
                  value={pendingFilters.schoolId}
                  onChange={(e) => setPendingFilters((prev) => ({ ...prev, schoolId: e.target.value }))}
                >
                  <option value="">All Schools</option>
                  {filterSchoolOptions.map((school) => (
                    <option key={String(school.id)} value={String(school.id)}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-danger-200 text-danger-600 w-100"
            >
              Reset
            </button>
          </div>
          <div>
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default IdCardSetting
