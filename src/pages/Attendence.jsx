import { useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const attendanceRecords = [
  {
    sl: '01',
    name: 'Alice Brown',
    phone: '+1 555-0101',
    rollNo: '2024001',
    photo: null,
    attendAll: 'Present',
  },
  {
    sl: '02',
    name: 'Michael Brown',
    phone: '+1 555-0102',
    rollNo: '2024002',
    photo: null,
    attendAll: 'Absent',
  },
  {
    sl: '03',
    name: 'Sophia Wilson',
    phone: '+1 555-0103',
    rollNo: '2024003',
    photo: null,
    attendAll: 'Present',
  },
  {
    sl: '04',
    name: 'David Johnson',
    phone: '+1 555-0104',
    rollNo: '2024004',
    photo: null,
    attendAll: 'Late',
  },
  {
    sl: '05',
    name: 'Emma Davis',
    phone: '+1 555-0105',
    rollNo: '2024005',
    photo: null,
    attendAll: 'Present',
  },
]

const emptyFilters = {
  school: 'Select',
  exam: 'Select',
  className: 'Select',
  section: 'Select',
  subject: 'Select',
}

const columnOptions = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'rollNo', label: 'Roll No' },
  { key: 'photo', label: 'Photo' },
  { key: 'attendAll', label: 'Attend All' },
]

const Attendance = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [findErrors, setFindErrors] = useState({})

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(
    () => ['Windsor Park High School', 'Riverside Academy', 'Sunrise Public School'],
    [],
  )
  const examOptions = useMemo(() => ['Mid Term', 'Final Term', 'Unit Test'], [])
  const classOptions = useMemo(() => ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'], [])
  const sectionOptions = useMemo(() => ['A', 'B', 'C'], [])
  const subjectOptions = useMemo(() => ['Mathematics', 'Science', 'English', 'Social Studies'], [])
  const activeFilters = useMemo(
    () =>
      Object.entries(filters).filter(([, value]) => value && value !== 'Select'),
    [filters],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return attendanceRecords.filter((row) => {
      const matchesSearch =
        !q ||
        [row.name, row.phone, row.rollNo, row.attendAll].join(' ').toLowerCase().includes(q)

      return matchesSearch
    })
  }, [search])

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
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
    setFindErrors((prev) => ({ ...prev, [id]: '' }))
  }

  const validateFind = () => {
    const errs = {}
    if (pendingFilters.school === 'Select') errs.school = 'School Name is required.'
    if (pendingFilters.exam === 'Select') errs.exam = 'Exam is required.'
    if (pendingFilters.className === 'Select') errs.className = 'Class is required.'
    if (pendingFilters.subject === 'Select') errs.subject = 'Subject is required.'
    return errs
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    const errors = validateFind()
    if (Object.keys(errors).length > 0) {
      setFindErrors(errors)
      return
    }
    setFilters(pendingFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setFindErrors({})
    setCurrentPage(1)
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  const getAttendAllBadge = (status) => {
    switch (status) {
      case 'Present':
        return (
          <span className="bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm">
            Present
          </span>
        )
      case 'Absent':
        return (
          <span className="bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm">
            Absent
          </span>
        )
      case 'Late':
        return (
          <span className="bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm">
            Late
          </span>
        )
      default:
        return (
          <span className="bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Attendance</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Attendance</span>
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
                placeholder="Search attendance..."
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

          {activeFilters.length > 0 ? (
            <div className="px-20 py-12 border-bottom border-neutral-200 d-flex flex-wrap align-items-center gap-8">
              <span className="text-sm text-secondary-light">Applied filters:</span>
              {activeFilters.map(([key, value]) => (
                <span
                  key={key}
                  className="px-10 py-4 bg-primary-50 text-primary-600 radius-8 text-sm fw-medium"
                >
                  {key === 'className' ? 'Class' : key}: {value}
                </span>
              ))}
            </div>
          ) : null}

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={allSelected}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.phone ? <th scope="col">Phone</th> : null}
                  {visibleColumns.rollNo ? <th scope="col">Roll No</th> : null}
                  {visibleColumns.photo ? <th scope="col">Photo</th> : null}
                  {visibleColumns.attendAll ? <th scope="col">Attend All</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 1}
                      className="text-center py-40 text-secondary-light"
                    >
                      No attendance records found.
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
                      {visibleColumns.name ? (
                        <td className="fw-medium text-primary-light">{row.name}</td>
                      ) : null}
                      {visibleColumns.phone ? <td>{row.phone}</td> : null}
                      {visibleColumns.rollNo ? <td>{row.rollNo}</td> : null}
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
                      {visibleColumns.attendAll ? (
                        <td>{getAttendAllBadge(row.attendAll)}</td>
                      ) : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            title="Edit"
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
        title="Find Attendance"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="school"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              School Name <span className="text-danger-600">*</span>
            </label>
            <select
              id="school"
              className={`form-control form-select ${findErrors.school ? 'border-danger-600' : ''}`}
              value={pendingFilters.school}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select School--</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {findErrors.school && (
              <div className="text-danger-600 text-sm mt-4">{findErrors.school}</div>
            )}
          </div>

          <div>
            <label
              htmlFor="exam"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Exam <span className="text-danger-600">*</span>
            </label>
            <select
              id="exam"
              className={`form-control form-select ${findErrors.exam ? 'border-danger-600' : ''}`}
              value={pendingFilters.exam}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {examOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {findErrors.exam && <div className="text-danger-600 text-sm mt-4">{findErrors.exam}</div>}
          </div>

          <div>
            <label
              htmlFor="className"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Class <span className="text-danger-600">*</span>
            </label>
            <select
              id="className"
              className={`form-control form-select ${findErrors.className ? 'border-danger-600' : ''}`}
              value={pendingFilters.className}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {classOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {findErrors.className && (
              <div className="text-danger-600 text-sm mt-4">{findErrors.className}</div>
            )}
          </div>

          <div>
            <label
              htmlFor="section"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Section
            </label>
            <select
              id="section"
              className="form-control form-select"
              value={pendingFilters.section}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {sectionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="subject"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Subject <span className="text-danger-600">*</span>
            </label>
            <select
              id="subject"
              className={`form-control form-select ${findErrors.subject ? 'border-danger-600' : ''}`}
              value={pendingFilters.subject}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {subjectOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {findErrors.subject && (
              <div className="text-danger-600 text-sm mt-4">{findErrors.subject}</div>
            )}
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

export default Attendance
