import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import TablePagination from '../components/table/TablePagination'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import {
  deleteCertificateType,
  fetchCertificateTypesPage,
} from '../apis/certificateTypesApi'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-certificate-type-row'

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'certificateName', label: 'Certificate Name' },
  { key: 'schoolNameOnCard', label: 'School Name on Card' },
  { key: 'certificateText', label: 'Certificate Text' },
  { key: 'footerText', label: 'Footer Text' },
  { key: 'backgroundUrl', label: 'Background URL' },
]

const fetchAllPages = async (fetchPage, pageSize = 500) => {
  const firstPage = await fetchPage(0, pageSize)
  const firstContent = Array.isArray(firstPage?.content) ? firstPage.content : []
  const totalPages = Number.isFinite(firstPage?.totalPages) ? firstPage.totalPages : 1
  if (totalPages <= 1) return firstContent

  const pageRequests = []
  for (let page = 1; page < totalPages; page += 1) {
    pageRequests.push(fetchPage(page, pageSize))
  }
  const restPages = await Promise.all(pageRequests)
  return restPages.reduce((acc, item) => {
    if (Array.isArray(item?.content)) acc.push(...item.content)
    return acc
  }, [...firstContent])
}

const getSchoolById = (rows, schoolId) =>
  (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(schoolId ?? '')) || null

const joinFooter = (row) =>
  [row?.footerLeftText, row?.footerMiddleText, row?.footerRightText].filter(Boolean).join(' | ') || '-'

const CertificateType = ({ onNavigate }) => {
  const {
    status,
    token,
    user,
    role: authRole,
    headOfficeId: authHeadOfficeId,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
  } = useAuth()

  const role = useMemo(
    () => normalizeRole(authRole || user?.role || user?.userRole || user?.authority),
    [authRole, user],
  )
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'

  const [rows, setRows] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedRows, setSelectedRows] = useState([])
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptionsFor = useCallback(
    (headOfficeId) => {
      const list = Array.isArray(allSchools) ? allSchools : []
      if (isSuperAdmin) {
        const normalized = String(headOfficeId || '').trim()
        if (!normalized) return []
        return list.filter((school) => String(school?.headOfficeId ?? '') === normalized)
      }
      if (isHeadOfficeAdmin) {
        return list.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
      }
      if (isSchoolAdmin) {
        return list.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
      }
      return list
    },
    [allSchools, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin],
  )

  const filterSchoolOptions = useMemo(() => {
    if (isSuperAdmin) return schoolOptionsFor(filters.headOfficeId)
    if (isHeadOfficeAdmin) return schoolOptionsFor(authHeadOfficeId)
    if (isSchoolAdmin) return schoolOptionsFor(authSchoolId)
    return schoolOptionsFor('')
  }, [authHeadOfficeId, authSchoolId, filters.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, schoolOptionsFor])

  const loadLookups = useCallback(async () => {
    try {
      const [headOfficePage, schools] = await Promise.all([
        fetchHeadOfficesPage(0, 500),
        fetchSchoolsLookup(),
      ])
      setHeadOffices(
        Array.isArray(headOfficePage?.content)
          ? headOfficePage.content
              .map((ho) => ({
                id: ho?.id,
                name: ho?.name || ho?.headOfficeName || '',
              }))
              .filter((ho) => ho.id != null && ho.name)
              .sort((a, b) => String(a.name).localeCompare(String(b.name)))
          : [],
      )
      setAllSchools(Array.isArray(schools) ? schools : [])
    } catch (err) {
      console.error('Failed to load certificate lookups:', err)
      setHeadOffices([])
      setAllSchools([])
    }
  }, [])

  const loadCertificateTypes = useCallback(async () => {
    if (status !== 'ready' || !token) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchCertificateTypesPage({
        page: currentPage - 1,
        size: rowsPerPage,
        search: debouncedSearch,
        headOfficeId: filters.headOfficeId || undefined,
        schoolId: filters.schoolId || undefined,
      })
      const content = Array.isArray(data?.content) ? data.content : []
      setRows(
        content.map((row) => ({
          ...row,
          footerText: joinFooter(row),
        })),
      )
      setTotalElements(Number(data?.totalElements ?? 0))
      setTotalPages(Number(data?.totalPages ?? 0))
    } catch (err) {
      console.error('Failed to load certificate types:', err)
      setError(err?.message || 'Failed to load certificate types')
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
    void loadLookups()
  }, [loadLookups])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    void loadCertificateTypes()
  }, [loadCertificateTypes, status, token])

  useEffect(() => {
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      const value = String(authHeadOfficeId)
      setPendingFilters((prev) => ({ ...prev, headOfficeId: value }))
      setFilters((prev) => ({ ...prev, headOfficeId: value }))
    }
  }, [authHeadOfficeId, isHeadOfficeAdmin])

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return
    const school = getSchoolById(allSchools, authSchoolId)
    const headOfficeId = school?.headOfficeId != null ? String(school.headOfficeId) : ''
    const schoolId = String(authSchoolId)
    setPendingFilters((prev) => ({ ...prev, headOfficeId, schoolId }))
    setFilters((prev) => ({ ...prev, headOfficeId, schoolId }))
  }, [allSchools, authSchoolId, isSchoolAdmin])

  useEffect(() => {
    if (currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const openAdd = () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    } catch {}
    onNavigate('certificate-type-create')
  }

  const openEdit = (row) => {
    try {
      sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row))
    } catch {}
    onNavigate('certificate-type-create')
  }

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...rows.map((row) => row.id)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !rows.some((row) => row.id === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete certificate type "${row?.certificateName || 'this certificate type'}"?`)) return
    setSaving(true)
    setError('')
    try {
      await deleteCertificateType(row.id)
      await loadCertificateTypes()
    } catch (err) {
      console.error('Failed to delete certificate type:', err)
      setError(err?.message || 'Failed to delete certificate type')
    } finally {
      setSaving(false)
    }
  }

  const handlePendingFilterChange = (event) => {
    const { id, value } = event.target
    setPendingFilters((prev) => {
      if (id === 'headOfficeId') {
        return { ...prev, headOfficeId: value, schoolId: '' }
      }
      return { ...prev, [id]: value }
    })
  }

  const handleApplyFilters = (event) => {
    event.preventDefault()
    setFilters(pendingFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    const next = isHeadOfficeAdmin
      ? { headOfficeId: String(authHeadOfficeId ?? ''), schoolId: '' }
      : isSchoolAdmin
        ? {
            headOfficeId: String(getSchoolById(allSchools, authSchoolId)?.headOfficeId ?? ''),
            schoolId: String(authSchoolId ?? ''),
          }
        : emptyFilters
    setPendingFilters(next)
    setFilters(next)
    setCurrentPage(1)
  }

  const exportRows = useCallback(async () => {
    const data = await fetchAllPages(
      (page, size) =>
        fetchCertificateTypesPage({
          page,
          size,
          search: debouncedSearch,
          headOfficeId: filters.headOfficeId || undefined,
          schoolId: filters.schoolId || undefined,
        }),
    )
    return data.map((row) => ({
      ...row,
      footerText: joinFooter(row),
      backgroundUrl: row?.backgroundUrl || '-',
    }))
  }, [debouncedSearch, filters.headOfficeId, filters.schoolId])

  const exportColumns = useMemo(
    () => [
      { key: 'schoolName', label: 'School' },
      { key: 'certificateName', label: 'Certificate Name' },
      { key: 'schoolNameOnCard', label: 'School Name on Card' },
      { key: 'certificateText', label: 'Certificate Text' },
      { key: 'footerText', label: 'Footer Text' },
      { key: 'backgroundUrl', label: 'Background URL' },
    ],
    [],
  )

  const pageInfo = useMemo(() => {
    const total = Number(totalElements || 0)
    if (!total) return 'Showing 0 - 0 of 0'
    const start = (currentPage - 1) * rowsPerPage + 1
    const end = Math.min(currentPage * rowsPerPage, total)
    return `Showing ${start} - ${end} of ${total}`
  }, [currentPage, rowsPerPage, totalElements])

  const safeTotalPages = Math.max(1, totalPages)
  const allSelected = rows.length > 0 && rows.every((row) => selectedRows.includes(row.id))

  const tableRows = rows.map((row) => ({
    ...row,
    footerText: joinFooter(row),
    backgroundUrl: row?.backgroundUrl || '-',
  }))

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Certificate Type</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0 text-sm"
              onClick={() => onNavigate('dashboard')}
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Certificate Type</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary-600 d-flex align-items-center gap-6 animate-up"
          onClick={openAdd}
        >
          <span className="d-flex text-md">
            <i className="ri-add-large-line"></i>
          </span>
          Add Certificate Type
        </button>
      </div>

      {error ? <div className="alert alert-danger border-0 radius-8 mb-16">{error}</div> : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown
                rows={tableRows}
                loadRows={exportRows}
                columns={exportColumns}
                visibleColumns={visibleColumns}
                mapRow={(row) => ({
                  ...row,
                  footerText: joinFooter(row),
                  backgroundUrl: row?.backgroundUrl || '-',
                })}
                fileName="Certificate_Type_List"
                sheetName="CertificateTypes"
                pdfTitle="Certificate Type Report"
              />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => {
                  setPendingFilters(filters)
                  setIsFilterSidebarOpen(true)
                }}
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
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
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
                value={rowsPerPage}
                onChange={(value) => {
                  setRowsPerPage(value)
                  setCurrentPage(1)
                }}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light bg-white"
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search certificate types..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setCurrentPage(1)
                }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.schoolName ? <th scope="col">School</th> : null}
                  {visibleColumns.certificateName ? <th scope="col">Certificate Name</th> : null}
                  {visibleColumns.schoolNameOnCard ? <th scope="col">School Name on Card</th> : null}
                  {visibleColumns.certificateText ? <th scope="col">Certificate Text</th> : null}
                  {visibleColumns.footerText ? <th scope="col">Footer Text</th> : null}
                  {visibleColumns.backgroundUrl ? <th scope="col">Background URL</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading certificate types...
                    </td>
                  </tr>
                ) : tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No certificate types found.
                    </td>
                  </tr>
                ) : (
                  tableRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">{row.id}</label>
                        </div>
                      </td>
                      {visibleColumns.schoolName ? <td className="fw-medium text-primary-light">{row.schoolName}</td> : null}
                      {visibleColumns.certificateName ? <td>{row.certificateName}</td> : null}
                      {visibleColumns.schoolNameOnCard ? <td>{row.schoolNameOnCard || '-'}</td> : null}
                      {visibleColumns.certificateText ? (
                        <td>
                          <span
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              maxWidth: 260,
                              fontSize: '0.85rem',
                              color: '#5a6472',
                            }}
                          >
                            {row.certificateText || '-'}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.footerText ? <td>{row.footerText}</td> : null}
                      {visibleColumns.backgroundUrl ? (
                        <td>
                          {row.backgroundUrl && row.backgroundUrl !== '-' ? (
                            <span
                              title={row.backgroundUrl}
                              style={{
                                display: 'inline-block',
                                maxWidth: 220,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {row.backgroundUrl}
                            </span>
                          ) : (
                            <span className="text-secondary-light text-sm">-</span>
                          )}
                        </td>
                      ) : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            onClick={() => openEdit(row)}
                            title="Edit"
                            disabled={saving}
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            title="Delete"
                            onClick={() => handleDelete(row)}
                            disabled={saving}
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

          <div className="px-20 py-16 border-top border-neutral-200 bg-white">
            <TablePagination
              paginationProps={{
                currentPage,
                totalPages: safeTotalPages,
                totalRecords: totalElements,
                rowsPerPage,
                pageInfo,
                onPageChange: (page) => {
                  const nextPage = Math.max(1, Math.min(safeTotalPages, page))
                  setCurrentPage(nextPage)
                },
              }}
            />
          </div>
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Certificate Types"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <ManualScopeSelectors
                enabled
                compact
                headOffices={headOffices}
                schoolOptions={filterSchoolOptions}
                selectedHeadOfficeId={pendingFilters.headOfficeId}
                onHeadOfficeChange={(value) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    headOfficeId: value,
                    schoolId: '',
                  }))
                }
                selectedSchoolId={pendingFilters.schoolId}
                onSchoolChange={(value) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    schoolId: value,
                  }))
                }
                schoolLabel="School"
              />
            </div>
          ) : isHeadOfficeAdmin ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                htmlFor="schoolId"
                className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
              >
                School
              </label>
              <select
                id="schoolId"
                className="form-control form-select bg-white"
                value={pendingFilters.schoolId}
                onChange={handlePendingFilterChange}
              >
                <option value="">All Schools</option>
                {filterSchoolOptions.map((school) => (
                  <option key={String(school.id)} value={String(school.id)}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ gridColumn: '1 / -1' }} className="text-sm text-secondary-light">
              Scoped to {authSchoolName || 'your school'}.
            </div>
          )}

          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
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

export default CertificateType
