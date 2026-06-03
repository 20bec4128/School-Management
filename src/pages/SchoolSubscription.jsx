import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import SlideSidebar from '../components/SlideSidebar'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { TablePagination } from '../components/table'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import {
  deleteSchoolSubscription,
  fetchSchoolSubscriptionsPage,
} from '../apis/schoolSubscriptionsApi'
import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-school-subscription-row'

const emptyFilters = {
  headOfficeId: '',
  schoolId: 'Select',
  status: 'Select',
}

const columnOptions = [
  { key: 'schoolName', label: 'School Name' },
  { key: 'planName', label: 'Plan Name' },
  { key: 'price', label: 'Price' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'startDate', label: 'Start Date' },
  { key: 'endDate', label: 'End Date' },
  { key: 'status', label: 'Status' },
]

const SchoolSubscription = ({ onNavigate }) => {
  const { role, headOfficeId: authHeadOfficeId, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const normalizedRole = normalizeRole(role)
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = normalizedRole === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = normalizedRole === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const currentSchoolOption = useMemo(() => {
    if (!isSchoolAdmin || authSchoolId == null) return null
    return {
      id: authSchoolId,
      schoolName: authSchoolName || `School ${authSchoolId}`,
      headOfficeId: authHeadOfficeId ?? null,
    }
  }, [authHeadOfficeId, authSchoolId, authSchoolName, isSchoolAdmin])

  const [allSchools, setAllSchools] = useState([])
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState(emptyFilters)
  const [selectedRows, setSelectedRows] = useState([])
  const [loading, setLoading] = useState(false)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  useEffect(() => {
    let cancelled = false
    const loadLookups = async () => {
      try {
        if (isSchoolAdmin) {
          if (!cancelled) setAllSchools(currentSchoolOption ? [currentSchoolOption] : [])
          return
        }
        const schoolList = await fetchSchoolsLookup()
        if (cancelled) return
        setAllSchools(Array.isArray(schoolList) ? schoolList : [])
      } catch {
        if (cancelled) return
        setAllSchools([])
      }
    }
    void loadLookups()
    return () => {
      cancelled = true
    }
  }, [currentSchoolOption, isSchoolAdmin])

  const selectedHeadOfficeId = useMemo(() => {
    if (filters.headOfficeId && filters.headOfficeId !== 'Select') return String(filters.headOfficeId)
    if (isSuperAdmin) return manualScope.selectedHeadOfficeId ? String(manualScope.selectedHeadOfficeId) : ''
    if (isHeadOfficeAdmin) return authHeadOfficeId != null ? String(authHeadOfficeId) : ''
    if (isSchoolAdmin) {
      const school = allSchools.find((item) => String(item?.id ?? '') === String(authSchoolId ?? ''))
      return school?.headOfficeId != null ? String(school.headOfficeId) : ''
    }
    return ''
  }, [allSchools, authHeadOfficeId, authSchoolId, filters.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.selectedHeadOfficeId])

  const selectedSchoolId = useMemo(() => {
    if (filters.schoolId && filters.schoolId !== 'Select') return String(filters.schoolId)
    if (isSuperAdmin) return manualScope.selectedSchoolId ? String(manualScope.selectedSchoolId) : ''
    if (isSchoolAdmin) return authSchoolId != null ? String(authSchoolId) : ''
    return ''
  }, [authSchoolId, filters.schoolId, isSchoolAdmin, isSuperAdmin, manualScope.selectedSchoolId])

  const schoolOptions = useMemo(() => {
    const rowsList = Array.isArray(allSchools) ? allSchools : []
    if (isSuperAdmin && selectedHeadOfficeId) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(selectedHeadOfficeId))
    }
    if (isSuperAdmin) return Array.isArray(manualScope.schoolOptions) ? manualScope.schoolOptions : rowsList
    if (isHeadOfficeAdmin) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return currentSchoolOption ? [currentSchoolOption] : []
    }
    return rowsList
  }, [allSchools, authHeadOfficeId, authSchoolId, currentSchoolOption, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.schoolOptions, selectedHeadOfficeId])

  const loadRows = async () => {
    setLoading(true)
    try {
      const result = await fetchSchoolSubscriptionsPage({
        headOfficeId: selectedHeadOfficeId || undefined,
        schoolId: selectedSchoolId || undefined,
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
  }, [currentPage, rowsPerPage, search, filters.status, selectedHeadOfficeId, selectedSchoolId])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const openAdd = () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    } catch {}
    onNavigate('school-subscription-create')
  }

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'SchoolSubscriptions')
    XLSX.writeFile(wb, 'School_Subscription_List.xlsx')
  }

  const handleEdit = (row) => {
    try {
      sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row))
    } catch {}
    onNavigate('school-subscription-create')
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete subscription "${row.planName || row.name || row.id}"?`)) return
    await deleteSchoolSubscription(row.id)
    await loadRows()
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">School Subscription</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0 text-sm"
              onClick={() => onNavigate('dashboard')}
            >
              Dashboard
            </button>
            <span className="text-secondary-light text-sm"> / School Subscription</span>
          </div>
        </div>
        <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <i className="ri-add-large-line" /> Add Subscription
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
              <RowsPerPageSelect
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light bg-white"
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
                              {col.key === 'status' ? (
                                <span
                                  className={`px-12 py-4 radius-4 fw-medium text-sm ${
                                    row[col.key] === 'Active'
                                      ? 'bg-success-100 text-success-600'
                                      : 'bg-danger-100 text-danger-600'
                                  }`}
                                >
                                  {row[col.key]}
                                </span>
                              ) : col.key === 'schoolName' || col.key === 'planName' ? (
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

      <SlideSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Find Subscription">
        <form
          className="p-20 d-grid gap-16"
          onSubmit={(e) => {
            e.preventDefault()
            setIsFilterOpen(false)
            setCurrentPage(1)
            void loadRows()
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
                setFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: 'Select' }))
              }}
              selectedSchoolId={manualScope.selectedSchoolId}
              onSchoolChange={(value) => {
                manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value)
                setFilters((prev) => ({ ...prev, schoolId: value || 'Select' }))
              }}
              schoolLabel="School"
            />
          ) : !isSchoolAdmin ? (
            <div>
              <label className="text-sm fw-semibold text-primary-light mb-8">School</label>
              <select
                className="form-control form-select bg-white"
                value={filters.schoolId || 'Select'}
                onChange={(e) => setFilters((prev) => ({ ...prev, schoolId: e.target.value, headOfficeId: '' }))}
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
              className="form-control form-select bg-white"
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
    </div>
  )
}

export default SchoolSubscription
