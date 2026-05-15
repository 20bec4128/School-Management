import { useEffect, useMemo, useState, useCallback } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import {
  deleteStudentActivity,
  fetchStudentActivitiesPage,
} from '../apis/studentActivityApi'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const emptyFilters = {
  schoolId: 'Select',
  className: 'Select',
  section: 'Select',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'studentName', label: 'Student' },
  { key: 'className', label: 'Class' },
  { key: 'section', label: 'Section' },
  { key: 'activity', label: 'Activity' },
  { key: 'date', label: 'Date' },
]

const StudentActivity = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId } = useAuth()
  const { activeSchoolId } = useSchool()
  
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [selectedRows, setSelectedRows] = useState([])
  
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [schoolList, setSchoolList] = useState([])

  const scopedSchoolId = activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
  const isSchoolLocked = Boolean(scopedSchoolId) && role !== 'SUPER_ADMIN'
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const apiFilters = {
        schoolId: scopedSchoolId || (filters.schoolId !== 'Select' ? filters.schoolId : null),
        className: filters.className !== 'Select' ? filters.className : null,
        section: filters.section !== 'Select' ? filters.section : null,
        q: search.trim() || undefined,
      }
      const data = await fetchStudentActivitiesPage(currentPage - 1, rowsPerPage, apiFilters)
      if (Array.isArray(data)) {
        setActivities(data)
        setTotalElements(data.length)
        setTotalPages(1)
      } else {
        setActivities(Array.isArray(data?.content) ? data.content : [])
        setTotalElements(data?.totalElements || 0)
        setTotalPages(data?.totalPages || 1)
      }
    } catch (e) {
      setActivities([])
      setError(e?.message || 'Failed to load student activities')
    } finally {
      setLoading(false)
    }
  }, [currentPage, rowsPerPage, filters, search, scopedSchoolId])

  useEffect(() => {
    void loadData()
  }, [loadData, refreshKey])

  useEffect(() => {
    fetchSchoolsLookup().then(setSchoolList).catch(() => setSchoolList([]))
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    setSelectedRows([])
  }, [scopedSchoolId])

  const effectiveSchoolList = useMemo(() => {
    const list = Array.isArray(schoolList) ? schoolList.slice() : []
    if (!scopedSchoolId) return list
    const selected = list.find((s) => String(s?.id) === String(scopedSchoolId))
    return selected ? [selected] : list
  }, [schoolList, scopedSchoolId])

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return activities
    return activities.filter((row) =>
      [row.schoolName, row.studentName, row.className, row.section, row.activity, row.date]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [search, activities])

  const allSelected = displayed.length > 0 && displayed.every((row) => selectedRows.includes(row.id))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...displayed.map((row) => row.id)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !displayed.some((row) => row.id === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    )
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

  const openAdd = () => {
    sessionStorage.removeItem('edit-student-activity-row')
    onNavigate('add-student-activity')
  }

  const openEdit = (row) => {
    sessionStorage.setItem('edit-student-activity-row', JSON.stringify(row))
    onNavigate('add-student-activity')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student activity?')) return
    try {
      await deleteStudentActivity(id)
      setRefreshKey((k) => k + 1)
    } catch (e) {
      alert(e.message)
    }
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Student Activity</h1>
          <span className="text-secondary-light">Student / Student Activity</span>
        </div>
        <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <i className="ri-add-large-line"></i> Add Activity
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

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

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                  Filter
                </span>
                <span>
                  <i className="ri-arrow-right-line"></i>
                </span>
              </button>

              <RowsPerPageSelect value={rowsPerPage} onChange={(v) => { setRowsPerPage(v); setCurrentPage(1) }} />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search activity..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ width: 80 }}>
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.schoolName && <th scope="col">School</th>}
                  {visibleColumns.studentName && <th scope="col">Student</th>}
                  {visibleColumns.className && <th scope="col">Class</th>}
                  {visibleColumns.section && <th scope="col">Section</th>}
                  {visibleColumns.activity && <th scope="col">Activity</th>}
                  {visibleColumns.date && <th scope="col">Date</th>}
                  <th scope="col" style={{ width: 100 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40">Loading...</td></tr>
                ) : displayed.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40">No records found.</td></tr>
                ) : (
                  displayed.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.schoolName && <td>{row.schoolName || '-'}</td>}
                      {visibleColumns.studentName && <td className="fw-medium text-primary-light">{row.studentName || '-'}</td>}
                      {visibleColumns.className && <td>{row.className || '-'}</td>}
                      {visibleColumns.section && <td>{row.section || '-'}</td>}
                      {visibleColumns.activity && <td>{row.activity || '-'}</td>}
                      {visibleColumns.date && <td>{row.date || '-'}</td>}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            onClick={() => openEdit(row)}
                            title="Edit"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
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
              Showing {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, totalElements)} of {totalElements}
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
        title="Filter Activity"
        onClose={() => setIsFilterSidebarOpen(false)}
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">School</label>
            <select
              id="schoolId"
              className="form-control form-select"
              value={scopedSchoolId || pendingFilters.schoolId}
              onChange={(e) => setPendingFilters(p => ({ ...p, schoolId: e.target.value }))}
              disabled={isSchoolLocked}
            >
              <option value="Select">Select School</option>
              {effectiveSchoolList.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.schoolName || s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Class</label>
            <input
              type="text"
              id="className"
              className="form-control"
              placeholder="Class name"
              value={pendingFilters.className === 'Select' ? '' : pendingFilters.className}
              onChange={(e) => setPendingFilters(p => ({ ...p, className: e.target.value || 'Select' }))}
            />
          </div>

          <div className="d-flex gap-8 mt-12">
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">Reset</button>
            <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default StudentActivity
