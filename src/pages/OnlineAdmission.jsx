import { useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const students = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    photo: null,
    name: 'Alice Brown',
    className: '10',
    status: 'Active',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    photo: null,
    name: 'Michael Brown',
    className: '8',
    status: 'Inactive',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    photo: null,
    name: 'Sophia Wilson',
    className: '9',
    status: 'Active',
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    photo: null,
    name: 'David Johnson',
    className: '7',
    status: 'Pending',
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    photo: null,
    name: 'Emma Davis',
    className: '6',
    status: 'Active',
  },
]

const emptyFilters = {
  school: 'Select',
  className: 'Select',
  status: 'Select',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'photo', label: 'Photo' },
  { key: 'name', label: 'Name' },
  { key: 'className', label: 'Class' },
  { key: 'status', label: 'Status' },
]

const statusBadgeClass = (status) => {
  if (status === 'Active') {
    return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  }
  if (status === 'Inactive') {
    return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
  }
  return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
}

const STEPS = ['Basic']

const StudentStatusList = () => {
  const { role, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId } = useSchool()
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editStep, setEditStep] = useState(0)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [editForm, setEditForm] = useState({
    school: '',
    name: '',
    className: '',
    status: 'Pending',
  })

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)
  const roleUpper = String(role || '').toUpperCase()
  const isTeacherScope = roleUpper === 'TEACHER'
  const resolvedSchoolId = activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
  const resolvedSchoolLabel = authSchoolName || (resolvedSchoolId ? `School ${resolvedSchoolId}` : '')

  const schoolOptions = useMemo(() => Array.from(new Set(students.map((item) => item.school))), [])
  const classOptions = useMemo(() => Array.from(new Set(students.map((item) => item.className))), [])

  useEffect(() => {
    if (!isTeacherScope || !resolvedSchoolLabel) return
    setPendingFilters((prev) => (prev.school === 'Select' ? { ...prev, school: resolvedSchoolLabel } : prev))
    setFilters((prev) => (prev.school === 'Select' ? { ...prev, school: resolvedSchoolLabel } : prev))
  }, [isTeacherScope, resolvedSchoolLabel])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return students.filter((row) => {
      const matchesSearch =
        !q ||
        [row.school, row.name, row.className, row.status].join(' ').toLowerCase().includes(q)

      const matchesSchool = filters.school === 'Select' || row.school === filters.school
      const matchesClass = filters.className === 'Select' || row.className === filters.className
      const matchesStatus = filters.status === 'Select' || row.status === filters.status

      return matchesSearch && matchesSchool && matchesClass && matchesStatus
    })
  }, [search, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((row) => selectedRows.includes(row.sl))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((row) => row.sl)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !paginated.some((row) => row.sl === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    )
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    if (isTeacherScope && id === 'school') return
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    const next = isTeacherScope
      ? { ...emptyFilters, school: resolvedSchoolLabel || 'Select' }
      : emptyFilters
    setPendingFilters(next)
    setFilters(next)
    setCurrentPage(1)
  }

  const handleEditChange = (e) => {
    const { id, value } = e.target
    setEditForm((prev) => ({ ...prev, [id]: value }))
  }

  const openEdit = (row) => {
    setEditForm({
      school: isTeacherScope ? (resolvedSchoolLabel || row.school) : row.school,
      name: row.name,
      className: row.className,
      status: row.status,
    })
    setEditStep(0)
    setIsEditOpen(true)
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)

    for (let page = start; page <= end; page++) {
      pages.push(page)
    }

    return pages
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Online Admission</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Online Admission</span>
          </div>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
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
                placeholder="Search student..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 950 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.photo ? <th scope="col">Photo</th> : null}
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.status ? <th scope="col">Status</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount}
                      className="text-center py-40 text-secondary-light"
                    >
                      No students found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row) => (
                    <tr key={row.sl}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(row.sl)}
                            onChange={() => handleSelectRow(row.sl)}
                          />
                          <label className="form-check-label">{row.sl}</label>
                        </div>
                      </td>
                      {visibleColumns.school ? <td>{row.school}</td> : null}
                      {visibleColumns.photo ? (
                        <td>
                          <div
                            className="w-40-px h-40-px rounded-circle bg-neutral-200 d-flex align-items-center justify-content-center overflow-hidden"
                            style={{ minWidth: 40 }}
                          >
                            {row.photo ? (
                              <img
                                src={row.photo}
                                alt={row.name}
                                className="w-100 h-100 object-fit-cover"
                              />
                            ) : (
                              <i className="ri-user-line text-secondary-light"></i>
                            )}
                          </div>
                        </td>
                      ) : null}
                      {visibleColumns.name ? (
                        <td className="fw-medium text-primary-light">{row.name}</td>
                      ) : null}
                      {visibleColumns.className ? <td>{row.className}</td> : null}
                      {visibleColumns.status ? (
                        <td>
                          <span className={statusBadgeClass(row.status)}>{row.status}</span>
                        </td>
                      ) : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            title="Edit"
                            onClick={() => openEdit(row)}
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
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
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
            </span>

            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
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

              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <WizardPopup
        modalWidth="620px"
        open={isEditOpen}
        title="Edit Online Admission"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsEditOpen(false)}
        submitLabel="Update"
      >
        <>
          <p className="avm-section-title">Basic Information</p>
          <div className="avm-grid">
            <div className="avm-field">
              <label className="avm-label">School</label>
              {isTeacherScope ? (
                <input type="text" className="avm-input" value={resolvedSchoolLabel || editForm.school} readOnly />
              ) : (
                <input
                  type="text"
                  id="school"
                  className="avm-input"
                  value={editForm.school}
                  onChange={handleEditChange}
                />
              )}
            </div>

            <div className="avm-field">
              <label className="avm-label">Student Name</label>
              <input
                type="text"
                id="name"
                className="avm-input"
                value={editForm.name}
                onChange={handleEditChange}
              />
            </div>

            <div className="avm-field">
              <label className="avm-label">Class</label>
              <select
                id="className"
                className="avm-select"
                value={editForm.className}
                onChange={handleEditChange}
              >
                {classOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="avm-field">
              <label className="avm-label">Status</label>
              <select
                id="status"
                className="avm-select"
                value={editForm.status}
                onChange={handleEditChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </>
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Students"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label htmlFor="school" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School
            </label>
            {isTeacherScope ? (
              <input type="text" className="form-control" value={resolvedSchoolLabel} readOnly />
            ) : (
              <select
                id="school"
                className="form-control form-select"
                value={pendingFilters.school}
                onChange={handlePendingFilterChange}
              >
                <option value="Select">Select School</option>
                {schoolOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="className" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class
            </label>
            <select
              id="className"
              className="form-control form-select"
              value={pendingFilters.className}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Class</option>
              {classOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Status
            </label>
            <select
              id="status"
              className="form-control form-select"
              value={pendingFilters.status}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

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

export default StudentStatusList

