import { useMemo, useState, useEffect, useCallback } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { fetchStudentsPage, deleteStudent } from '../apis/studentsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const emptyFilters = {
  schoolId: '',
  className: 'Select',
  section: 'Select',
  group: 'Select',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'photo', label: 'Photo' },
  { key: 'name', label: 'Name' },
  { key: 'group', label: 'Group' },
  { key: 'className', label: 'Class' },
  { key: 'section', label: 'Section' },
  { key: 'rollNo', label: 'Roll No' },
  { key: 'email', label: 'Email' },
]

const StudentList = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId } = useSchool()
  
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [refreshKey, setRefreshKey] = useState(0)
  const [schoolList, setSchoolList] = useState([])

  const scopedSchoolId = activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
  const isSchoolLocked = Boolean(scopedSchoolId) && role !== 'SUPER_ADMIN'
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchStudentsPage(currentPage - 1, rowsPerPage, {
        schoolId: scopedSchoolId || (filters.schoolId && filters.schoolId !== 'Select' ? filters.schoolId : undefined),
        className: filters.className !== 'Select' ? filters.className : undefined,
        section: filters.section !== 'Select' ? filters.section : undefined,
        group: filters.group !== 'Select' ? filters.group : undefined,
        q: search.trim() || undefined,
      })
      setStudents(res.content || [])
      setTotalPages(res.totalPages || 1)
      setTotalElements(res.totalElements || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [currentPage, rowsPerPage, filters, search, scopedSchoolId])

  useEffect(() => {
    void loadData()
  }, [loadData, refreshKey])

  useEffect(() => {
    fetchSchoolsLookup().then(setSchoolList).catch(() => {})
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
    if (!q) return students
    return students.filter((row) =>
      [row.schoolName, row.name, row.group, row.className, row.section, row.rollNo, row.email]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [search, students])

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
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    )
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

  const openAdd = () => {
    sessionStorage.removeItem('edit-student-row')
    onNavigate('add-student')
  }

  const openEdit = (row) => {
    sessionStorage.setItem('edit-student-row', JSON.stringify(row))
    onNavigate('add-student')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return
    try {
      await deleteStudent(id)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      alert(err.message)
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Student List</h1>
          <span className="text-secondary-light">Student / Student List</span>
        </div>
        <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <i className="ri-add-large-line"></i> Add Student
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
                placeholder="Search student..."
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
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.photo ? <th scope="col">Photo</th> : null}
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.group ? <th scope="col">Group</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.section ? <th scope="col">Section</th> : null}
                  {visibleColumns.rollNo ? <th scope="col" style={{ width: 100 }}>Roll No</th> : null}
                  {visibleColumns.email ? <th scope="col">Email</th> : null}
                  <th scope="col" style={{ width: 100 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">Loading...</td></tr>
                ) : displayed.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">No records found.</td></tr>
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
                      {visibleColumns.school ? <td>{row.schoolName || '-'}</td> : null}
                      {visibleColumns.photo ? (
                        <td>
                          <div className="w-40-px h-40-px rounded-circle bg-neutral-100 d-flex align-items-center justify-content-center overflow-hidden">
                            {row.photoUrl ? (
                              <img src={row.photoUrl} alt="student" className="w-100 h-100 object-fit-cover" />
                            ) : (
                              <i className="ri-user-line text-secondary-light text-xl"></i>
                            )}
                          </div>
                        </td>
                      ) : null}
                      {visibleColumns.name ? <td className="fw-medium text-primary-light">{row.name || '-'}</td> : null}
                      {visibleColumns.group ? <td>{row.group || '-'}</td> : null}
                      {visibleColumns.className ? <td>{row.className || '-'}</td> : null}
                      {visibleColumns.section ? <td>{row.section || '-'}</td> : null}
                      {visibleColumns.rollNo ? <td>{row.rollNo || '-'}</td> : null}
                      {visibleColumns.email ? <td>{row.email || '-'}</td> : null}
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
        title="Filter Students"
        onClose={() => setIsFilterSidebarOpen(false)}
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">School</label>
            <select
              id="schoolId"
              className="form-control form-select"
              value={scopedSchoolId || pendingFilters.schoolId}
              onChange={handlePendingFilterChange}
              disabled={isSchoolLocked}
            >
              <option value="">Select School</option>
              {effectiveSchoolList.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.schoolName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Class</label>
            <select id="className" className="form-control form-select" value={pendingFilters.className} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              <option>6</option><option>7</option><option>8</option><option>9</option>
              <option>10</option><option>11</option><option>12</option>
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Section</label>
            <select id="section" className="form-control form-select" value={pendingFilters.section} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              <option>A</option><option>B</option><option>C</option><option>D</option>
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Group</label>
            <select id="group" className="form-control form-select" value={pendingFilters.group} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              <option>Science</option><option>Commerce</option><option>Arts</option>
            </select>
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

export default StudentList
