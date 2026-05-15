import { useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const promotionData = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    runningSession: '2024-2025',
    promoteToSession: '2025-2026',
    currentClass: 'Class 9',
    promoteToClass: 'Class 10',
    name: 'Alice Brown',
    phone: '+1 234 567 8901',
    rollNo: '101',
    photo: null,
    totalMark: 500,
    obtainMark: 460,
    gpa: '5.00',
    result: 'Pass',
    position: '1st',
    classOption: '10-A',
    nextRollNo: '201',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    runningSession: '2024-2025',
    promoteToSession: '2025-2026',
    currentClass: 'Class 9',
    promoteToClass: 'Class 10',
    name: 'Bob Wilson',
    phone: '+1 234 567 8902',
    rollNo: '102',
    photo: null,
    totalMark: 500,
    obtainMark: 410,
    gpa: '4.50',
    result: 'Pass',
    position: '2nd',
    classOption: '10-A',
    nextRollNo: '202',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    runningSession: '2024-2025',
    promoteToSession: '2025-2026',
    currentClass: 'Class 9',
    promoteToClass: 'Class 10',
    name: 'Charlie Davis',
    phone: '+1 234 567 8903',
    rollNo: '103',
    photo: null,
    totalMark: 500,
    obtainMark: 320,
    gpa: '3.50',
    result: 'Pass',
    position: '3rd',
    classOption: '10-B',
    nextRollNo: '203',
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    runningSession: '2024-2025',
    promoteToSession: '2025-2026',
    currentClass: 'Class 9',
    promoteToClass: 'Class 10',
    name: 'Diana Prince',
    phone: '+1 234 567 8904',
    rollNo: '104',
    photo: null,
    totalMark: 500,
    obtainMark: 210,
    gpa: '2.00',
    result: 'Fail',
    position: '-',
    classOption: '10-B',
    nextRollNo: '104',
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    runningSession: '2024-2025',
    promoteToSession: '2025-2026',
    currentClass: 'Class 9',
    promoteToClass: 'Class 10',
    name: 'Ethan Hunt',
    phone: '+1 234 567 8905',
    rollNo: '105',
    photo: null,
    totalMark: 500,
    obtainMark: 390,
    gpa: '4.00',
    result: 'Pass',
    position: '4th',
    classOption: '10-A',
    nextRollNo: '205',
  },
]

const emptyFilters = {
  school: 'Select',
  runningSession: 'Select',
  promoteToSession: 'Select',
  currentClass: 'Select',
  promoteToClass: 'Select',
}

const columnOptions = [
  { key: 'namePhone', label: 'Name / Phone' },
  { key: 'rollNo', label: 'Roll No' },
  { key: 'photo', label: 'Photo' },
  { key: 'totalMark', label: 'Total Mark' },
  { key: 'obtainMark', label: 'Obtain Mark' },
  { key: 'gpa', label: 'GPA' },
  { key: 'result', label: 'Result' },
  { key: 'position', label: 'Position' },
  { key: 'classOption', label: 'Class Option' },
  { key: 'nextRollNo', label: 'Next Roll No' },
]

const resultBadge = (result) => {
  if (result === 'Pass') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (result === 'Fail') return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
}

const sessionOptions = ['2023-2024', '2024-2025', '2025-2026']
const classOptions = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']
const schoolOptions = ['Windsor Park High School']

const Promotion = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isFindSidebarOpen, setIsFindSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return promotionData.filter((r) => {
      const matchesSearch =
        !q ||
        [r.school, r.name, r.phone, r.rollNo, r.result, r.position, r.classOption, r.nextRollNo]
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesSchool = filters.school === 'Select' || r.school === filters.school
      const matchesRunningSession =
        filters.runningSession === 'Select' || r.runningSession === filters.runningSession
      const matchesPromoteToSession =
        filters.promoteToSession === 'Select' || r.promoteToSession === filters.promoteToSession
      const matchesCurrentClass =
        filters.currentClass === 'Select' || r.currentClass === filters.currentClass
      const matchesPromoteToClass =
        filters.promoteToClass === 'Select' || r.promoteToClass === filters.promoteToClass

      return (
        matchesSearch &&
        matchesSchool &&
        matchesRunningSession &&
        matchesPromoteToSession &&
        matchesCurrentClass &&
        matchesPromoteToClass
      )
    })
  }, [filters, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected =
    paginated.length > 0 && paginated.every((r) => selectedRows.includes(r.sl))

  const handleSelectAll = (e) => {
    if (e.target.checked)
      setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((r) => r.sl)])])
    else setSelectedRows((prev) => prev.filter((id) => !paginated.some((r) => r.sl === id)))
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
    setIsFindSidebarOpen(false)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
    setIsFindSidebarOpen(false)
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
      {/* Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Promotion</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Promotion</span>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {/* Toolbar */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              {/* Export */}
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              {/* Find */}
              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFindSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                  Find
                </span>
                <span>
                  <i className="ri-arrow-right-line"></i>
                </span>
              </button>

              {/* Columns */}
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

              {/* Rows per page */}
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

            {/* Search */}
            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search promotion..."
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

          {/* Table */}
          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1000 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.namePhone ? <th scope="col">Name / Phone</th> : null}
                  {visibleColumns.rollNo ? <th scope="col">Roll No</th> : null}
                  {visibleColumns.photo ? <th scope="col">Photo</th> : null}
                  {visibleColumns.totalMark ? <th scope="col">Total Mark</th> : null}
                  {visibleColumns.obtainMark ? <th scope="col">Obtain Mark</th> : null}
                  {visibleColumns.gpa ? <th scope="col">GPA</th> : null}
                  {visibleColumns.result ? <th scope="col">Result</th> : null}
                  {visibleColumns.position ? <th scope="col">Position</th> : null}
                  {visibleColumns.classOption ? <th scope="col">Class Option</th> : null}
                  {visibleColumns.nextRollNo ? <th scope="col">Next Roll No</th> : null}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount}
                      className="text-center py-40 text-secondary-light"
                    >
                      No promotion records found.
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
                      {visibleColumns.namePhone ? (
                        <td>
                          <span className="fw-medium text-primary-light d-block">
                            {row.name}
                          </span>
                          <span className="text-secondary-light text-sm">{row.phone}</span>
                        </td>
                      ) : null}
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
                      {visibleColumns.totalMark ? <td>{row.totalMark}</td> : null}
                      {visibleColumns.obtainMark ? <td>{row.obtainMark}</td> : null}
                      {visibleColumns.gpa ? (
                        <td>
                          <span className="fw-semibold text-primary-light">{row.gpa}</span>
                        </td>
                      ) : null}
                      {visibleColumns.result ? (
                        <td>
                          <span className={resultBadge(row.result)}>{row.result}</span>
                        </td>
                      ) : null}
                      {visibleColumns.position ? <td>{row.position}</td> : null}
                      {visibleColumns.classOption ? <td>{row.classOption}</td> : null}
                      {visibleColumns.nextRollNo ? <td>{row.nextRollNo}</td> : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
                    p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'
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

      {/* Find Sidebar */}
      <SlideSidebar
        isOpen={isFindSidebarOpen}
        title="Find Promotion"
        onClose={() => setIsFindSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div className="grid-cols-2" style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="school"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              School Name <span className="text-danger-600">*</span>
            </label>
            <select
              id="school"
              className="form-control form-select"
              value={pendingFilters.school}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select School--</option>
              {schoolOptions.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="runningSession"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Running Session <span className="text-danger-600">*</span>
            </label>
            <select
              id="runningSession"
              className="form-control form-select"
              value={pendingFilters.runningSession}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {sessionOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="promoteToSession"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Promote to Session <span className="text-danger-600">*</span>
            </label>
            <select
              id="promoteToSession"
              className="form-control form-select"
              value={pendingFilters.promoteToSession}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {sessionOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="currentClass"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Current Class <span className="text-danger-600">*</span>
            </label>
            <select
              id="currentClass"
              className="form-control form-select"
              value={pendingFilters.currentClass}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="promoteToClass"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Promote To Class
            </label>
            <select
              id="promoteToClass"
              className="form-control form-select"
              value={pendingFilters.promoteToClass}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
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

export default Promotion

