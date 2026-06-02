import { useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchExpenditureHeads } from '../apis/expenditureHeadsApi'
import { createExpenditure, deleteExpenditure, fetchExpendituresPage, updateExpenditure } from '../apis/expendituresApi'
import { normalizeRole } from '../utils/roles'
import ExportDropdown from '../components/ExportDropdown'

const EDIT_STORAGE_KEY = 'edit-expenditure-row'

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  expenditureHeadId: '',
  expenditureMethod: '',
}

const STEPS = ['Basic Information']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Expenditure Head': 'ri-money-dollar-box-line',
  'Expenditure Method': 'ri-bank-card-line',
  Reference: 'ri-hashtag',
  Amount: 'ri-money-dollar-circle-line',
  Date: 'ri-calendar-line',
  Note: 'ri-sticky-note-line',
}

const EXPENDITURE_METHOD_OPTIONS = ['Cash', 'Bank', 'Online', 'Cheque', 'Mobile Banking', 'Other']

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'expenditureHead', label: 'Expenditure Head' },
  { key: 'expenditureMethod', label: 'Expenditure Method' },
  { key: 'reference', label: 'Reference' },
  { key: 'amount', label: 'Amount' },
  { key: 'expenditureDate', label: 'Date' },
  { key: 'note', label: 'Note' },
]

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

const Expenditure = ({ onNavigate } = {}) => {
  const {
    status,
    token,
    user,
    role: authRole,
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    canAdd,
    canEdit,
    canDelete,
  } = useAuth()
  const { activeSchoolId } = useSchool()
  const PAGE_SLUG = 'expenditure'
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : null
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
  const [expenditureHeads, setExpenditureHeads] = useState([])

  const [scopeHeadOfficeId, setScopeHeadOfficeId] = useState(() => (authHeadOfficeId != null ? String(authHeadOfficeId) : ''))
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolsById = useMemo(() => {
    const map = new Map()
    for (const school of Array.isArray(schools) ? schools : []) {
      if (school?.id != null) map.set(String(school.id), school)
    }
    return map
  }, [schools])

  const expenditureHeadsById = useMemo(() => {
    const map = new Map()
    for (const head of Array.isArray(expenditureHeads) ? expenditureHeads : []) {
      if (head?.id != null) map.set(String(head.id), head)
    }
    return map
  }, [expenditureHeads])

  const schoolOptionsForScope = useMemo(() => {
    const list = Array.isArray(schools) ? schools : []
    if (isSuperAdmin) {
      if (!scopeHeadOfficeId) return list
      return list.filter((school) => String(school.headOfficeId ?? '') === String(scopeHeadOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return list.filter((school) => String(school.headOfficeId ?? '') === String(authHeadOfficeId))
    }
    return []
  }, [authHeadOfficeId, isHeadOfficeAdmin, isSuperAdmin, schools, scopeHeadOfficeId])

  const schoolsForHeadOffice = (headOfficeId) => {
    const list = Array.isArray(schools) ? schools : []
    if (isSuperAdmin) {
      if (!headOfficeId) return list
      return list.filter((school) => String(school.headOfficeId ?? '') === String(headOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return list.filter((school) => String(school.headOfficeId ?? '') === String(authHeadOfficeId))
    }
    return []
  }

  const currentSchoolId = useMemo(() => {
    if (isSchoolAdmin) return authSchoolId ? String(authSchoolId) : ''
    if (filters.schoolId) return String(filters.schoolId)
    if (isHeadOfficeAdmin) return activeSchoolId ? String(activeSchoolId) : ''
    return ''
  }, [activeSchoolId, authSchoolId, filters.schoolId, isHeadOfficeAdmin, isSchoolAdmin])

  const currentExpenditureHeadId = useMemo(() => {
    if (filters.expenditureHeadId) return String(filters.expenditureHeadId)
    return ''
  }, [filters.expenditureHeadId])

  const loadLookups = async () => {
    if (isSuperAdmin) {
      await Promise.all([
        fetchHeadOfficesPage(0, 500)
          .then((page) => setHeadOffices(Array.isArray(page?.content) ? page.content : []))
          .catch(() => {}),
        Promise.resolve(
          isSchoolAdmin ? (currentSchoolOption ? [currentSchoolOption] : []) : fetchSchoolsLookup(),
        )
          .then((list) => setSchools(Array.isArray(list) ? list : []))
          .catch(() => {}),
      ])
      return
    }
    if (isSchoolAdmin) {
      setSchools(currentSchoolOption ? [currentSchoolOption] : [])
    }
  }

  const loadExpenditureHeads = async (schoolId) => {
    if (!schoolId) {
      if (!isSuperAdmin) {
        setExpenditureHeads([])
        return
      }
      const list = await fetchExpenditureHeads()
      setExpenditureHeads(Array.isArray(list) ? list : [])
      return
    }
    const list = await fetchExpenditureHeads({ schoolId })
    setExpenditureHeads(Array.isArray(list) ? list : [])
  }

  const loadRows = async ({ schoolId, expenditureHeadId, expenditureMethod, page = 0, size = 10, search = '' } = {}) => {
    const effectiveSchoolId = isSchoolAdmin ? authSchoolId : schoolId || null
    if (!effectiveSchoolId && !isSuperAdmin) {
      setExpenditureHeads([])
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
      return
    }

    const data = await fetchExpendituresPage({
      schoolId: effectiveSchoolId,
      expenditureHeadId: expenditureHeadId || null,
      expenditureMethod: expenditureMethod || null,
      page,
      size,
      search,
    })
    setRows(Array.isArray(data?.content) ? data.content : [])
    setTotalElements(data?.totalElements ?? 0)
    setTotalPages(data?.totalPages ?? 0)
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    setLoadError('')
    setBusy(true)
    Promise.resolve()
      .then(loadLookups)
      .then(async () => {
        const schoolId = currentSchoolId || null
        await loadExpenditureHeads(schoolId)
        await loadRows({
          schoolId,
          expenditureHeadId: currentExpenditureHeadId || null,
          expenditureMethod: filters.expenditureMethod || null,
          page: currentPage - 1,
          size: rowsPerPage,
          search: debouncedSearch,
        })
      })
      .catch((error) => setLoadError(error?.message || 'Failed to load expenditures'))
      .finally(() => setBusy(false))
  }, [status, token, currentPage, rowsPerPage, debouncedSearch, currentSchoolId, currentExpenditureHeadId, filters.expenditureMethod, role])

  useEffect(() => {
    const schoolId = currentSchoolId || null
    if (!schoolId) {
      setExpenditureHeads([])
      return
    }
    loadExpenditureHeads(schoolId).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSchoolId])

  const handleInputChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({
      ...prev,
      [id]: value,
      ...(id === 'headOfficeId' ? { schoolId: '', expenditureHeadId: '' } : {}),
      ...(id === 'schoolId' ? { expenditureHeadId: '' } : {}),
    }))
  }

  const openAdd = () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    } catch {}
    navigateTo?.('add-expenditure')
  }

  const openEdit = (row) => {
    const school = row?.schoolId != null ? schoolsById.get(String(row.schoolId)) : null
    const headOfficeId = school?.headOfficeId != null ? String(school.headOfficeId) : String(authHeadOfficeId ?? '')
    
    try {
      sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify({
        ...row,
        headOfficeId
      }))
    } catch {}
    navigateTo?.('add-expenditure')
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p += 1) pages.push(p)
    return pages
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

  const resolveSchoolName = (schoolId) => {
    if (schoolId == null) return '--'
    return schoolsById.get(String(schoolId))?.schoolName || authSchoolName || `School ${schoolId}`
  }

  const resolveExpenditureHeadName = (expenditureHeadId) => {
    if (expenditureHeadId == null) return '--'
    return expenditureHeadsById.get(String(expenditureHeadId))?.expenditureHead || `Head ${expenditureHeadId}`
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Expenditure</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Expenditure</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
          {canAdd(PAGE_SLUG) && (
            <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
              <span className="d-flex text-md"><i className="ri-add-large-line"></i></span>
              Add Expenditure
            </button>
          )}
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {loadError ? <div className="px-20 py-12 text-danger">{loadError}</div> : null}

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />
              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown">
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
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
                placeholder="Search expenditure..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1200 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school && <th scope="col">School</th>}
                  {visibleColumns.expenditureHead && <th scope="col">Expenditure Head</th>}
                  {visibleColumns.expenditureMethod && <th scope="col">Expenditure Method</th>}
                  {visibleColumns.reference && <th scope="col">Reference</th>}
                  {visibleColumns.amount && <th scope="col">Amount</th>}
                  {visibleColumns.expenditureDate && <th scope="col">Date</th>}
                  {visibleColumns.note && <th scope="col">Note</th>}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {busy && rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      {isHeadOfficeAdmin && !activeSchoolId && !filters.schoolId
                        ? 'Select a school from the topbar or filter panel to load expenditures.'
                        : 'No expenditure records found.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.school && <td className="fw-medium text-primary-light">{resolveSchoolName(row.schoolId)}</td>}
                      {visibleColumns.expenditureHead && <td className="fw-medium">{resolveExpenditureHeadName(row.expenditureHeadId)}</td>}
                      {visibleColumns.expenditureMethod && <td>{row.expenditureMethod || '--'}</td>}
                      {visibleColumns.reference && <td>{row.reference || '--'}</td>}
                      {visibleColumns.amount && <td>{row.amount != null ? `Rs. ${Number(row.amount).toFixed(2)}` : '--'}</td>}
                      {visibleColumns.expenditureDate && <td>{row.expenditureDate || '--'}</td>}
                      {visibleColumns.note && <td style={{ maxWidth: 250, whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.note || '-'}</td>}
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
                                if (!window.confirm('Are you sure you want to delete this expenditure?')) return
                                setBusy(true)
                                setLoadError('')
                                try {
                                  await deleteExpenditure(row.id)
                                  await loadRows({
                                    schoolId: currentSchoolId || null,
                                    expenditureHeadId: currentExpenditureHeadId || null,
                                    expenditureMethod: filters.expenditureMethod || null,
                                    page: currentPage - 1,
                                    size: rowsPerPage,
                                    search: debouncedSearch,
                                  })
                                } catch (error) {
                                  setLoadError(error?.message || 'Failed to delete expenditure')
                                } finally {
                                  setBusy(false)
                                }
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
              Showing {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, totalElements)} of {totalElements}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                Prev
              </button>
              {getVisiblePages().map((page) => (
                <button
                  key={page}
                  type="button"
                  className={page === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Expenditure"
        onClose={() => setIsFilterSidebarOpen(false)}
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={headOffices}
              schoolOptions={schoolsForHeadOffice(pendingFilters.headOfficeId)}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={(value) => setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: '', expenditureHeadId: '' }))}
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={(value) => setPendingFilters((prev) => ({ ...prev, schoolId: value, expenditureHeadId: '' }))}
              schoolLabel="School"
            />
          ) : isHeadOfficeAdmin ? (
            <div>
              <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
              <select
                className="form-control form-select"
                value={pendingFilters.schoolId}
                onChange={(e) => setPendingFilters((prev) => ({ ...prev, schoolId: e.target.value, expenditureHeadId: '' }))}
              >
                <option value="">All Schools</option>
                {schoolOptionsForScope.map((school) => (
                  <option key={school.id} value={String(school.id)}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Expenditure Head</label>
            <select
              className="form-control form-select"
              value={pendingFilters.expenditureHeadId}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, expenditureHeadId: e.target.value }))}
            >
              <option value="">All Heads</option>
              {expenditureHeads.map((head) => (
                <option key={head.id} value={String(head.id)}>
                  {head.expenditureHead}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Method</label>
            <select
              className="form-control form-select"
              value={pendingFilters.expenditureMethod}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, expenditureMethod: e.target.value }))}
            >
              <option value="">All Methods</option>
              {EXPENDITURE_METHOD_OPTIONS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

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

export default Expenditure

