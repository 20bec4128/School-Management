import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { deleteSalaryGrade, fetchSalaryGradesPage } from '../apis/salaryGradeApi'
import { normalizeRole } from '../utils/roles'
import ExportDropdown from '../components/ExportDropdown'
import ManualScopeSelectors from '../components/ManualScopeSelectors'

const EDIT_STORAGE_KEY = 'edit-salary-grade-row'
const emptyFilters = {
  headOfficeId: 'Select',
  schoolId: 'Select',
  gradeName: '',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'gradeName', label: 'Grade Name' },
  { key: 'basicSalary', label: 'Basic Salary' },
  { key: 'hourlyRate', label: 'Hourly Rate' },
  { key: 'grossSalary', label: 'Gross Salary' },
  { key: 'netSalary', label: 'Net Salary' },
]

const SalaryGrade = ({ onNavigate }) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName, schoolId: authSchoolId, schoolName: authSchoolName, canAdd, canEdit, canDelete } = useAuth()
  const { activeSchoolId } = useSchool()
  const PAGE_SLUG = 'salary-grade'
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const currentSchoolOption = useMemo(() => {
    if (authSchoolId == null) return null
    return {
      id: authSchoolId,
      schoolName: authSchoolName || `School ${authSchoolId}`,
      headOfficeId: authHeadOfficeId ?? '',
    }
  }, [authHeadOfficeId, authSchoolId, authSchoolName])

  const [rows, setRows] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [headOffices, setHeadOffices] = useState([])
  const [schools, setSchools] = useState([])

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolsById = useMemo(() => {
    const map = new Map()
    for (const s of Array.isArray(schools) ? schools : []) {
      if (s?.id == null) continue
      map.set(String(s.id), s)
    }
    return map
  }, [schools])

  const headOfficesById = useMemo(() => {
    const map = new Map()
    for (const ho of Array.isArray(headOffices) ? headOffices : []) {
      if (ho?.id == null) continue
      map.set(String(ho.id), ho)
    }
    return map
  }, [headOffices])

  const resolveSchoolName = (schoolId, fallbackName = '') => {
    if (schoolId == null) return ''
    const row = schoolsById.get(String(schoolId))
    return row?.schoolName || row?.name || fallbackName || ''
  }

  const resolveHeadOfficeName = (headOfficeId) => {
    if (headOfficeId == null) return ''
    const row = headOfficesById.get(String(headOfficeId))
    return row?.name || ''
  }

  const loadLookups = useCallback(async () => {
    const tasks = []
    if (isSuperAdmin) {
      tasks.push(
        fetchHeadOfficesPage(0, 500)
          .then((page) => {
            const content = Array.isArray(page?.content) ? page.content : []
            setHeadOffices(content)
          })
          .catch(() => {}),
      )
    }
    tasks.push(
      (isSchoolAdmin
        ? Promise.resolve(currentSchoolOption ? [currentSchoolOption] : [])
        : fetchSchoolsLookup()
      ).then((list) => setSchools(Array.isArray(list) ? list : [])),
    )
    await Promise.all(tasks)
  }, [currentSchoolOption, isSchoolAdmin, isSuperAdmin, isHeadOfficeAdmin])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  const loadSalaryGrades = async ({ headOfficeId, schoolId, page = 0, size = 10, search = '' } = {}) => {
    const effectiveSchoolId = (() => {
      if (isSchoolAdmin) return authSchoolId || null
      if (schoolId) return schoolId
      if (isHeadOfficeAdmin && activeSchoolId) return Number(activeSchoolId)
      return null
    })()
    const effectiveHeadOfficeId = (() => {
      if (effectiveSchoolId != null) return null
      if (isSuperAdmin) return headOfficeId || null
      if (isHeadOfficeAdmin) return authHeadOfficeId ?? null
      return headOfficeId || null
    })()

    if (!effectiveSchoolId && !effectiveHeadOfficeId && !isSuperAdmin) {
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
      return
    }

    const data = await fetchSalaryGradesPage({ 
      headOfficeId: effectiveHeadOfficeId,
      schoolId: effectiveSchoolId, 
      page: page, 
      size: size,
      search: search
    })
    const list = Array.isArray(data?.content) ? data.content : []
    setRows(list)
    setTotalElements(data?.totalElements ?? 0)
    setTotalPages(data?.totalPages ?? 0)
  }

  const resolvedSchoolHeadOfficeId = useMemo(() => {
    if (isSchoolAdmin) {
      const school = schoolsById.get(String(authSchoolId ?? ''))
      return school?.headOfficeId ?? authHeadOfficeId ?? null
    }
    if (isHeadOfficeAdmin) return authHeadOfficeId ?? null
    return null
  }, [authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, schoolsById])

  const initialSchoolId = useMemo(() => {
    if (isSchoolAdmin) return authSchoolId ?? null
    if (filters.schoolId !== 'Select' && filters.schoolId) return Number(filters.schoolId)
    if (isHeadOfficeAdmin) return activeSchoolId ? Number(activeSchoolId) : null
    return null
  }, [activeSchoolId, authSchoolId, filters.schoolId, isHeadOfficeAdmin, isSchoolAdmin])

  const initialHeadOfficeId = useMemo(() => {
    if (isSuperAdmin && filters.headOfficeId !== 'Select') return Number(filters.headOfficeId)
    if (isHeadOfficeAdmin) return authHeadOfficeId ?? null
    return null
  }, [authHeadOfficeId, filters.headOfficeId, isHeadOfficeAdmin, isSuperAdmin])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    setLoadError('')
    setBusy(true)
    Promise.resolve()
      .then(loadLookups)
      .then(() => {
        return loadSalaryGrades({ 
          headOfficeId: isSchoolAdmin ? null : initialHeadOfficeId,
          schoolId: initialSchoolId,
          page: currentPage - 1,
          size: rowsPerPage,
          search: debouncedSearch
        })
      })
      .catch((e) => setLoadError(e?.message || 'Failed to load salary grades'))
      .finally(() => setBusy(false))
  }, [
    status,
    token,
    currentPage,
    rowsPerPage,
    debouncedSearch,
    filters.headOfficeId,
    filters.schoolId,
    initialHeadOfficeId,
    initialSchoolId,
    loadLookups,
    resolvedSchoolHeadOfficeId,
  ])

  const openAdd = () => {
    onNavigate?.('add-salary-grade')
  }

  const openEdit = (row) => {
    const school = row?.schoolId != null ? schoolsById.get(String(row.schoolId)) : null
    const headOfficeId = row?.headOfficeId ?? school?.headOfficeId ?? authHeadOfficeId ?? ''
    const normalizedRow = {
      ...row,
      headOfficeId: headOfficeId != null ? String(headOfficeId) : '',
      schoolId: row?.schoolId != null ? String(row.schoolId) : '',
    }
    try {
      sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(normalizedRow))
    } catch {}
    onNavigate?.('add-salary-grade')
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...rows.map((row) => String(row.id))])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !rows.some((row) => String(row.id) === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(String(id)) ? prev.filter((rowId) => rowId !== String(id)) : [...prev, String(id)],
    )
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  const selectedFilterHeadOfficeId =
    isSuperAdmin ? filters.headOfficeId : isHeadOfficeAdmin ? String(authHeadOfficeId ?? '') : ''

  const filterSchoolOptions = useMemo(() => {
    const list = Array.isArray(schools) ? schools : []
    return list
      .filter((s) => {
        if (isHeadOfficeAdmin) return String(s?.headOfficeId ?? '') === String(authHeadOfficeId ?? '')
        if (isSuperAdmin && selectedFilterHeadOfficeId !== 'Select' && selectedFilterHeadOfficeId !== '') {
          return String(s?.headOfficeId ?? '') === String(selectedFilterHeadOfficeId)
        }
        return true
      })
      .map((s) => ({ id: s.id, schoolName: s.schoolName || s.name || `School ${s.id}`, headOfficeId: s.headOfficeId ?? null }))
      .sort((a, b) => String(a.schoolName).localeCompare(String(b.schoolName)))
  }, [schools, isHeadOfficeAdmin, authHeadOfficeId, isSuperAdmin, selectedFilterHeadOfficeId])

  const headOfficeOptions = useMemo(
    () =>
      Array.from(
        new Map(
          (Array.isArray(headOffices) ? headOffices : [])
            .filter((item) => item?.id != null)
            .map((item) => [String(item.id), item]),
        ).values(),
      )
        .map((item) => ({ id: item.id, name: item.name || item.headOfficeName || `Head Office ${item.id}` }))
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [headOffices],
  )

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    if (id === 'headOfficeId') {
      setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: 'Select' }))
      return
    }
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const schoolOptionsForForm = (f) => {
    if (isSchoolAdmin) return []
    const selectedHeadOfficeId = isSuperAdmin ? f.headOfficeId : (authHeadOfficeId != null ? String(authHeadOfficeId) : '')
    const list = Array.isArray(schools) ? schools : []
    if (!selectedHeadOfficeId) return []
    return list.filter((s) => String(s?.headOfficeId ?? '') === String(selectedHeadOfficeId))
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

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Salary Grade</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Salary Grade</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
          {canAdd(PAGE_SLUG) && (
            <button
              type="button"
              className="btn btn-primary-600 d-flex align-items-center gap-6"
              onClick={openAdd}
            >
              <span className="d-flex text-md">
                <i className="ri-add-large-line"></i>
              </span>
              Add Salary Grade
            </button>
          )}
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {loadError && <div className="px-20 py-12 text-danger">{loadError}</div>}
          
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFilterSidebarOpen(true)}
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
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
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
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(value) => {
                  setRowsPerPage(value)
                  setCurrentPage(1)
                }}
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search salary grade..."
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

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1000 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={rows.length > 0 && rows.every((r) => selectedRows.includes(String(r.id)))}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.gradeName ? <th scope="col">Grade Name</th> : null}
                  {visibleColumns.basicSalary ? <th scope="col">Basic Salary</th> : null}
                  {visibleColumns.hourlyRate ? <th scope="col">Hourly Rate</th> : null}
                  {visibleColumns.grossSalary ? <th scope="col">Gross Salary</th> : null}
                  {visibleColumns.netSalary ? <th scope="col">Net Salary</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {busy && rows.length === 0 ? (
                   <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 1}
                      className="text-center py-40 text-secondary-light"
                    >
                      {isHeadOfficeAdmin && !activeSchoolId && !filters.schoolId
                        ? 'Select a school from the topbar or filter panel to load salary grades.'
                        : 'No salary grade records found.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(String(row.id))}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.school ? (
                        <td className="fw-medium text-primary-light">{row.schoolName}</td>
                      ) : null}
                      {visibleColumns.gradeName ? <td className="fw-medium">{row.gradeName}</td> : null}
                      {visibleColumns.basicSalary ? (
                        <td className="text-end fw-semibold">₹{row.basicSalary?.toLocaleString()}</td>
                      ) : null}
                      {visibleColumns.hourlyRate ? (
                        <td className="text-end">₹{row.hourlyRate}</td>
                      ) : null}
                      {visibleColumns.grossSalary ? (
                        <td className="text-end fw-semibold text-primary-light">₹{row.grossSalary?.toLocaleString()}</td>
                      ) : null}
                      {visibleColumns.netSalary ? (
                        <td className="text-end fw-semibold text-success-600">₹{row.netSalary?.toLocaleString()}</td>
                      ) : null}
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
                              title="Delete"
                              onClick={async () => {
                                if (!window.confirm('Are you sure?')) return
                                setBusy(true)
                                try {
                                  await deleteSalaryGrade(row.id)
                                  await loadSalaryGrades({
                                    headOfficeId:
                                      isSuperAdmin && filters.headOfficeId !== 'Select'
                                        ? Number(filters.headOfficeId)
                                        : null,
                                    schoolId: initialSchoolId,
                                    page: currentPage - 1,
                                    size: rowsPerPage,
                                    search: debouncedSearch
                                  })
                                } catch (e) { setLoadError(e.message) }
                                finally { setBusy(false) }
                              }}
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
              Showing {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, totalElements)} of {totalElements}
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
                  className={
                    p === currentPage
                      ? 'btn btn-sm btn-primary-600'
                      : 'btn btn-sm btn-light border'
                  }
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

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Salary Grade"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <ManualScopeSelectors
              enabled={isSuperAdmin || isHeadOfficeAdmin}
              headOffices={isSuperAdmin ? headOfficeOptions : []}
              schoolOptions={filterSchoolOptions}
              selectedHeadOfficeId={selectedFilterHeadOfficeId}
              onHeadOfficeChange={(value) =>
                setPendingFilters((prev) => ({ ...prev, headOfficeId: value || 'Select', schoolId: 'Select' }))
              }
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={(value) =>
                setPendingFilters((prev) => ({ ...prev, schoolId: value || 'Select' }))
              }
              showSchoolSelector
              showHeadOfficeSelector={isSuperAdmin}
              compact={false}
            />
          </div>

          <div className="d-flex gap-8 mt-16">
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-danger-200 text-danger-600 w-100"
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

export default SalaryGrade
