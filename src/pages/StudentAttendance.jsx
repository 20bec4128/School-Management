import { useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const studentAttendanceRows = [
  {
    sl: '01',
    photo: null,
    name: 'Alice Brown',
    email: 'alice.brown@school.com',
    phone: '+1 234 567 8901',
    rollNo: '101',
    presentAll: 22,
    lateAll: 1,
    absentAll: 0,
    school: 'Windsor Park High School',
    className: '10',
    section: 'A',
    date: '2024-03-15',
  },
  {
    sl: '02',
    photo: null,
    name: 'Michael Brown',
    email: 'michael.brown@school.com',
    phone: '+1 234 567 8902',
    rollNo: '102',
    presentAll: 20,
    lateAll: 2,
    absentAll: 1,
    school: 'Windsor Park High School',
    className: '10',
    section: 'A',
    date: '2024-03-15',
  },
  {
    sl: '03',
    photo: null,
    name: 'Sophia Wilson',
    email: 'sophia.wilson@school.com',
    phone: '+1 234 567 8903',
    rollNo: '201',
    presentAll: 21,
    lateAll: 0,
    absentAll: 2,
    school: 'Windsor Park High School',
    className: '9',
    section: 'B',
    date: '2024-03-15',
  },
  {
    sl: '04',
    photo: null,
    name: 'David Johnson',
    email: 'david.johnson@school.com',
    phone: '+1 234 567 8904',
    rollNo: '301',
    presentAll: 19,
    lateAll: 3,
    absentAll: 1,
    school: 'Windsor Park High School',
    className: '8',
    section: 'A',
    date: '2024-03-15',
  },
  {
    sl: '05',
    photo: null,
    name: 'Emma Davis',
    email: 'emma.davis@school.com',
    phone: '+1 234 567 8905',
    rollNo: '401',
    presentAll: 23,
    lateAll: 0,
    absentAll: 0,
    school: 'Windsor Park High School',
    className: '7',
    section: 'C',
    date: '2024-03-15',
  },
]

const schoolHierarchy = {
  'Windsor Park High School': {
    '10': ['A', 'B'],
    '9': ['A', 'B'],
    '8': ['A', 'C'],
    '7': ['B', 'C'],
  },
}

const emptyFilters = {
  school: '',
  className: '',
  section: '',
  date: '',
}

const columnOptions = [
  { key: 'photo', label: 'Photo' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'rollNo', label: 'Roll No' },
  { key: 'presentAll', label: 'Present All' },
  { key: 'lateAll', label: 'Late All' },
  { key: 'absentAll', label: 'Absent All' },
]

const StudentAttendance = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(() => Object.keys(schoolHierarchy), [])

  const classOptions = useMemo(() => {
    if (!pendingFilters.school || !schoolHierarchy[pendingFilters.school]) return []
    return Object.keys(schoolHierarchy[pendingFilters.school])
  }, [pendingFilters.school])

  const sectionOptions = useMemo(() => {
    if (!pendingFilters.school || !pendingFilters.className) return []
    return schoolHierarchy[pendingFilters.school]?.[pendingFilters.className] || []
  }, [pendingFilters.school, pendingFilters.className])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return studentAttendanceRows.filter((row) => {
      const matchesSearch =
        !q ||
        [
          row.name,
          row.email,
          row.phone,
          row.rollNo,
          row.school,
          row.className,
          row.section,
          row.presentAll,
          row.lateAll,
          row.absentAll,
        ]
          .join(' ')
          .toLowerCase()
          .includes(q)

      const matchesSchool = !filters.school || row.school === filters.school
      const matchesClass = !filters.className || row.className === filters.className
      const matchesSection = !filters.section || row.section === filters.section
      const matchesDate = !filters.date || row.date === filters.date

      return matchesSearch && matchesSchool && matchesClass && matchesSection && matchesDate
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

    setPendingFilters((prev) => {
      if (id === 'school') {
        return {
          ...prev,
          school: value,
          className: '',
          section: '',
        }
      }

      if (id === 'className') {
        return {
          ...prev,
          className: value,
          section: '',
        }
      }

      return { ...prev, [id]: value }
    })
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Student Attendance</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Student Attendance</span>
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
                  Find
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

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1200 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.photo ? <th scope="col">Photo</th> : null}
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.email ? <th scope="col">Email</th> : null}
                  {visibleColumns.phone ? <th scope="col">Phone</th> : null}
                  {visibleColumns.rollNo ? <th scope="col">Roll No</th> : null}
                  {visibleColumns.presentAll ? <th scope="col">Present All</th> : null}
                  {visibleColumns.lateAll ? <th scope="col">Late All</th> : null}
                  {visibleColumns.absentAll ? <th scope="col">Absent All</th> : null}
                </tr>
              </thead>

              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount}
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
                      {visibleColumns.name ? <td className="fw-medium text-primary-light">{row.name}</td> : null}
                      {visibleColumns.email ? <td>{row.email}</td> : null}
                      {visibleColumns.phone ? <td>{row.phone}</td> : null}
                      {visibleColumns.rollNo ? <td>{row.rollNo}</td> : null}
                      {visibleColumns.presentAll ? <td>{row.presentAll}</td> : null}
                      {visibleColumns.lateAll ? <td>{row.lateAll}</td> : null}
                      {visibleColumns.absentAll ? <td>{row.absentAll}</td> : null}
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
        title="Find Attendance"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div className="full">
            <label htmlFor="school" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School Name <span className="text-danger-600">*</span>
            </label>
            <select
              id="school"
              className="form-control form-select"
              value={pendingFilters.school}
              onChange={handlePendingFilterChange}
            >
              <option value="">--Select School--</option>
              {schoolOptions.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>
            {!pendingFilters.school ? (
              <span className="text-danger-600 text-xs mt-6 d-inline-block">This field is required.</span>
            ) : null}
          </div>

          <div>
            <label htmlFor="className" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class <span className="text-danger-600">*</span>
            </label>
            <select
              id="className"
              className="form-control form-select"
              value={pendingFilters.className}
              onChange={handlePendingFilterChange}
              disabled={!pendingFilters.school}
            >
              <option value="">--Select--</option>
              {classOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {!pendingFilters.className ? (
              <span className="text-danger-600 text-xs mt-6 d-inline-block">This field is required.</span>
            ) : null}
          </div>

          <div>
            <label htmlFor="section" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Section
            </label>
            <select
              id="section"
              className="form-control form-select"
              value={pendingFilters.section}
              onChange={handlePendingFilterChange}
              disabled={!pendingFilters.className}
            >
              <option value="">--Select--</option>
              {sectionOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="full">
            <label htmlFor="date" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Date <span className="text-danger-600">*</span>
            </label>
            <input
              id="date"
              type="date"
              className="form-control"
              value={pendingFilters.date}
              onChange={handlePendingFilterChange}
            />
            {!pendingFilters.date ? (
              <span className="text-danger-600 text-xs mt-6 d-inline-block">This field is required.</span>
            ) : null}
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
            <button
              type="submit"
              className="btn btn-primary-600 w-100"
              disabled={!pendingFilters.school || !pendingFilters.className || !pendingFilters.date}
            >
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default StudentAttendance
