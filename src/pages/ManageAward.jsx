import React, { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import SlideSidebar from '../components/SlideSidebar'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { TablePagination } from '../components/table'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { deleteAward, fetchAwardsPage } from '../apis/awardsApi'
import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-award-row'

const emptyFilters = {
  userType: 'Select',
  schoolId: 'Select',
}

const columnOptions = [
  { key: 'headOffice', label: 'Head Office' },
  { key: 'schoolName', label: 'School' },
  { key: 'userType', label: 'User Type' },
  { key: 'winnerName', label: 'Winner' },
  { key: 'title', label: 'Title' },
  { key: 'gift', label: 'Gift' },
  { key: 'price', label: 'Price' },
  { key: 'awardDate', label: 'Date' },
  { key: 'note', label: 'Note' },
]

const fetchAllPages = async (baseQuery) => {
  const firstPage = await fetchAwardsPage({ ...baseQuery, page: 0, size: 100 })
  const firstRows = Array.isArray(firstPage?.content) ? firstPage.content : []
  const totalPages = Number.isFinite(firstPage?.totalPages) ? firstPage.totalPages : 1
  if (totalPages <= 1) return firstRows

  const requests = []
  for (let page = 1; page < totalPages; page += 1) {
    requests.push(fetchAwardsPage({ ...baseQuery, page, size: 100 }))
  }

  const restPages = await Promise.all(requests)
  return restPages.reduce((acc, item) => {
    if (Array.isArray(item?.content)) acc.push(...item.content)
    return acc
  }, [...firstRows])
}

const ManageAward = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId, headOfficeId: authHeadOfficeId, canAdd, canEdit, canDelete } = useAuth()
  const PAGE_SLUG = 'award'
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
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  useEffect(() => {
    let cancelled = false
    const loadSchools = async () => {
      try {
        const list = await fetchSchoolsLookup()
        if (!cancelled) {
          setAllSchools(Array.isArray(list) ? list : [])
        }
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
    if (isHeadOfficeAdmin) {
      return allSchools.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return allSchools.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return allSchools
  }, [allSchools, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.schoolOptions])

  const effectiveHeadOfficeId = useMemo(() => {
    if (isSuperAdmin) return manualScope.selectedHeadOfficeId ? Number(manualScope.selectedHeadOfficeId) : null
    if (isHeadOfficeAdmin) return authHeadOfficeId ?? null
    if (isSchoolAdmin) {
      const school = schoolOptions.find((item) => String(item.id) === String(authSchoolId ?? ''))
      return school?.headOfficeId != null ? Number(school.headOfficeId) : null
    }
    return null
  }, [authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.selectedHeadOfficeId, schoolOptions])

  const effectiveSchoolId = useMemo(() => {
    if (isSuperAdmin) return manualScope.selectedSchoolId ? Number(manualScope.selectedSchoolId) : null
    if (isHeadOfficeAdmin || isSchoolAdmin) {
      return filters.schoolId !== 'Select' ? Number(filters.schoolId) : null
    }
    return filters.schoolId !== 'Select' ? Number(filters.schoolId) : null
  }, [filters.schoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.selectedSchoolId])

  const resolveHeadOfficeName = (headOfficeId) => {
    if (headOfficeId == null) return ''
    const match = manualScope.headOffices.find((item) => String(item.id) === String(headOfficeId))
    return match?.name || `Head Office ${headOfficeId}`
  }

  useEffect(() => {
    let cancelled = false
    const loadPage = async () => {
      setLoading(true)
      try {
        const result = await fetchAwardsPage({
          headOfficeId: effectiveHeadOfficeId,
          schoolId: effectiveSchoolId,
          userType: filters.userType !== 'Select' ? filters.userType : undefined,
          search,
          page: currentPage - 1,
          size: rowsPerPage,
        })
        if (cancelled) return
        setRows(Array.isArray(result?.content) ? result.content : [])
        setTotalElements(Number(result?.totalElements ?? 0))
        setTotalPages(Number(result?.totalPages ?? 1) || 1)
        if (currentPage > Number(result?.totalPages ?? 1) && Number(result?.totalPages ?? 1) > 0) {
          setCurrentPage(Number(result.totalPages))
        }
      } catch {
        if (!cancelled) {
          setRows([])
          setTotalElements(0)
          setTotalPages(1)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadPage()
    return () => {
      cancelled = true
    }
  }, [currentPage, effectiveHeadOfficeId, effectiveSchoolId, filters.userType, rowsPerPage, search])

  const paginatedData = rows

  const handleExportExcel = async () => {
    const exportRows = await fetchAllPages({
      headOfficeId: effectiveHeadOfficeId,
      schoolId: effectiveSchoolId,
      userType: filters.userType !== 'Select' ? filters.userType : undefined,
      search,
    })
    const normalized = exportRows.map((row) => ({
      HeadOffice: resolveHeadOfficeName(row.headOfficeId),
      School: row.schoolName || '',
      UserType: row.userType || '',
      Winner: row.winnerName || '',
      Title: row.title || '',
      Gift: row.gift || '',
      Price: row.price ?? '',
      Date: row.awardDate || '',
      Note: row.note || '',
    }))
    const ws = XLSX.utils.json_to_sheet(normalized)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Awards')
    XLSX.writeFile(wb, 'Award_List.xlsx')
  }

  const handleEdit = (row) => {
    sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row))
    onNavigate?.('manage-award-create')
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete award "${row.title}"?`)) return
    await deleteAward(row.id)
    setCurrentPage(1)
    const result = await fetchAwardsPage({
      headOfficeId: effectiveHeadOfficeId,
      schoolId: effectiveSchoolId,
      userType: filters.userType !== 'Select' ? filters.userType : undefined,
      search,
      page: 0,
      size: rowsPerPage,
    })
    setRows(Array.isArray(result?.content) ? result.content : [])
    setTotalElements(Number(result?.totalElements ?? 0))
    setTotalPages(Number(result?.totalPages ?? 1) || 1)
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Manage Award</h1>
          <span className="text-secondary-light">Award / Manage Award</span>
        </div>
        {canAdd(PAGE_SLUG) && (
          <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={() => onNavigate?.('manage-award-create')}>
            <i className="ri-add-large-line" /> Add Award
          </button>
        )}
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={handleExportExcel} />

              <button className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" onClick={() => setIsFilterOpen(true)}>
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
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(next) => {
                  setRowsPerPage(next)
                  setCurrentPage(1)
                }}
              />
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
                      Loading awards...
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
                          <input type="checkbox" className="form-check-input" />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {columnOptions.map((col) => visibleColumns[col.key] && (
                        <td key={col.key}>
                          {col.key === 'title' ? (
                            <span className="fw-medium text-primary-light">{row[col.key]}</span>
                          ) : col.key === 'headOffice' ? (
                            resolveHeadOfficeName(row.headOfficeId)
                          ) : (
                            row[col.key]
                          )}
                        </td>
                      ))}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          {canEdit(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="text-info-600 bg-info-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                              onClick={() => handleEdit(row)}
                            >
                              <i className="ri-edit-line" />
                            </button>
                          )}
                          {canDelete(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="text-danger-600 bg-danger-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                              onClick={() => handleDelete(row)}
                            >
                              <i className="ri-delete-bin-line" />
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

          <div className="px-20 py-16 border-top border-neutral-200">
            <TablePagination
              paginationProps={{
                currentPage,
                totalPages,
                pageInfo: `Showing ${totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, totalElements)} of ${totalElements} entries`,
                onPageChange: (next) => setCurrentPage(Math.min(Math.max(1, Number(next) || 1), totalPages)),
              }}
            />
          </div>
        </div>
      </div>

      <SlideSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Find Award">
        <form
          className="p-20 d-grid gap-16"
          onSubmit={(e) => {
            e.preventDefault()
            setIsFilterOpen(false)
            setCurrentPage(1)
          }}
        >
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={manualScope.headOffices}
              schoolOptions={manualScope.schoolOptions}
              selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
              onHeadOfficeChange={(value) => {
                manualScope.setSelectedScope(value, '')
              }}
              selectedSchoolId={manualScope.selectedSchoolId}
              onSchoolChange={(value) => {
                manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value)
                setFilters((prev) => ({ ...prev, schoolId: value || 'Select' }))
              }}
            />
          ) : isHeadOfficeAdmin ? (
            <div>
              <label className="text-sm fw-semibold text-primary-light mb-8">School</label>
              <select
                className="form-control form-select"
                value={filters.schoolId}
                onChange={(e) => setFilters((prev) => ({ ...prev, schoolId: e.target.value || 'Select' }))}
              >
                <option value="Select">--All Schools--</option>
                {schoolOptions.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </div>
          ) : isSchoolAdmin ? (
            <div>
              <label className="text-sm fw-semibold text-primary-light mb-8">School</label>
              <input className="form-control" value={schoolOptions[0]?.schoolName || 'Current School'} disabled />
            </div>
          ) : null}

          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">User Type</label>
            <select className="form-control form-select" value={filters.userType} onChange={(e) => setFilters((prev) => ({ ...prev, userType: e.target.value }))}>
              <option value="Select">--All Types--</option>
              <option value="Student">Student</option>
              <option value="Employee">Employee</option>
              <option value="Staff">Staff</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary-600 w-100">
            Apply Filter
          </button>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default ManageAward
