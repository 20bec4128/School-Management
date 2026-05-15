import { useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const finalResults = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    exam: 'Final Exam 2025',
    className: 'Class 10',
    section: 'A',
    session: '2025-2026',
    rollNo: '1001',
    name: 'Alice Johnson',
    photo: null,
    totalSubject: '6',
    totalMark: '600',
    obtainMark: '552',
    percentage: '92%',
    gpa: '5.00',
    grade: 'A+',
    result: 'Pass',
    meritPosition: '1',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    exam: 'Final Exam 2025',
    className: 'Class 10',
    section: 'A',
    session: '2025-2026',
    rollNo: '1002',
    name: 'Bob Smith',
    photo: null,
    totalSubject: '6',
    totalMark: '600',
    obtainMark: '498',
    percentage: '83%',
    gpa: '4.40',
    grade: 'A',
    result: 'Pass',
    meritPosition: '4',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    exam: 'Final Exam 2025',
    className: 'Class 10',
    section: 'B',
    session: '2025-2026',
    rollNo: '1011',
    name: 'Charlie Davis',
    photo: null,
    totalSubject: '6',
    totalMark: '600',
    obtainMark: '438',
    percentage: '73%',
    gpa: '3.70',
    grade: 'B+',
    result: 'Pass',
    meritPosition: '8',
  },
  {
    sl: '04',
    school: 'Riverside Academy',
    exam: 'Final Exam 2025',
    className: 'Class 9',
    section: 'A',
    session: '2025-2026',
    rollNo: '901',
    name: 'Diana Wilson',
    photo: null,
    totalSubject: '7',
    totalMark: '700',
    obtainMark: '651',
    percentage: '93%',
    gpa: '5.00',
    grade: 'A+',
    result: 'Pass',
    meritPosition: '1',
  },
  {
    sl: '05',
    school: 'Riverside Academy',
    exam: 'Final Exam 2025',
    className: 'Class 9',
    section: 'B',
    session: '2025-2026',
    rollNo: '917',
    name: 'Emma Brown',
    photo: null,
    totalSubject: '7',
    totalMark: '700',
    obtainMark: '294',
    percentage: '42%',
    gpa: '1.90',
    grade: 'D',
    result: 'Fail',
    meritPosition: '-',
  },
]

const emptyFilters = {
  school: 'Select',
  exam: 'Select',
  className: 'Select',
  section: 'Select',
  session: 'Select',
  result: 'Select',
}

const columnOptions = [
  { key: 'rollNo', label: 'Roll No' },
  { key: 'name', label: 'Student Name' },
  { key: 'photo', label: 'Photo' },
  { key: 'totalSubject', label: 'Total Subject' },
  { key: 'totalMark', label: 'Total Mark' },
  { key: 'obtainMark', label: 'Obtain Mark' },
  { key: 'percentage', label: 'Percentage' },
  { key: 'gpa', label: 'GPA' },
  { key: 'grade', label: 'Grade' },
  { key: 'result', label: 'Result' },
  { key: 'meritPosition', label: 'Merit Position' },
]

const getBadgeClass = (value, type) => {
  if (type === 'result') {
    if (value === 'Pass') {
      return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
    }
    if (value === 'Fail') {
      return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
    }
  }

  if (['A+', 'A'].includes(value)) {
    return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  }
  if (['B+', 'B'].includes(value)) {
    return 'bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm'
  }
  return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
}

const ExamFinalResult = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(
    () => Array.from(new Set(finalResults.map((row) => row.school))),
    [],
  )
  const examOptions = useMemo(
    () => Array.from(new Set(finalResults.map((row) => row.exam))),
    [],
  )
  const classOptions = useMemo(
    () => Array.from(new Set(finalResults.map((row) => row.className))),
    [],
  )
  const sectionOptions = useMemo(
    () => Array.from(new Set(finalResults.map((row) => row.section))),
    [],
  )
  const sessionOptions = useMemo(
    () => Array.from(new Set(finalResults.map((row) => row.session))),
    [],
  )
  const resultOptions = useMemo(
    () => Array.from(new Set(finalResults.map((row) => row.result))),
    [],
  )
  const activeFilters = useMemo(
    () => Object.entries(filters).filter(([, value]) => value && value !== 'Select'),
    [filters],
  )

  const filteredResults = useMemo(() => {
    const term = search.trim().toLowerCase()

    return finalResults.filter((row) => {
      const matchesSearch =
        !term ||
        [row.rollNo, row.name, row.school, row.exam, row.className, row.section, row.session]
          .join(' ')
          .toLowerCase()
          .includes(term)

      const matchesSchool = filters.school === 'Select' || row.school === filters.school
      const matchesExam = filters.exam === 'Select' || row.exam === filters.exam
      const matchesClass = filters.className === 'Select' || row.className === filters.className
      const matchesSection = filters.section === 'Select' || row.section === filters.section
      const matchesSession = filters.session === 'Select' || row.session === filters.session
      const matchesResult = filters.result === 'Select' || row.result === filters.result

      return (
        matchesSearch &&
        matchesSchool &&
        matchesExam &&
        matchesClass &&
        matchesSection &&
        matchesSession &&
        matchesResult
      )
    })
  }, [filters, search])

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / rowsPerPage))

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredResults.slice(start, start + rowsPerPage)
  }, [currentPage, filteredResults, rowsPerPage])

  const allSelected =
    paginatedResults.length > 0 && paginatedResults.every((row) => selectedRows.includes(row.sl))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(paginatedResults.map((row) => row.sl))
      return
    }
    setSelectedRows([])
  }

  const handleSelectRow = (sl) => {
    setSelectedRows((prev) =>
      prev.includes(sl) ? prev.filter((id) => id !== sl) : [...prev, sl],
    )
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters({ ...pendingFilters })
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let page = start; page <= end; page += 1) pages.push(page)
    return pages
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Exam Final Result</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Exam Final Result</span>
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
                {[5, 10, 20, 50].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search final result..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1400 }}>
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
                  {visibleColumns.rollNo ? <th scope="col">Roll No</th> : null}
                  {visibleColumns.name ? <th scope="col">Student Name</th> : null}
                  {visibleColumns.photo ? <th scope="col">Photo</th> : null}
                  {visibleColumns.totalSubject ? <th scope="col">Total Subject</th> : null}
                  {visibleColumns.totalMark ? <th scope="col">Total Mark</th> : null}
                  {visibleColumns.obtainMark ? <th scope="col">Obtain Mark</th> : null}
                  {visibleColumns.percentage ? <th scope="col">Percentage</th> : null}
                  {visibleColumns.gpa ? <th scope="col">GPA</th> : null}
                  {visibleColumns.grade ? <th scope="col">Grade</th> : null}
                  {visibleColumns.result ? <th scope="col">Result</th> : null}
                  {visibleColumns.meritPosition ? <th scope="col">Merit Position</th> : null}
                </tr>
              </thead>
              <tbody>
                {paginatedResults.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 1}
                      className="text-center py-40 text-secondary-light"
                    >
                      No final results found.
                    </td>
                  </tr>
                ) : (
                  paginatedResults.map((row) => (
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
                      {visibleColumns.rollNo ? (
                        <td className="fw-medium text-primary-light">{row.rollNo}</td>
                      ) : null}
                      {visibleColumns.name ? <td>{row.name}</td> : null}
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
                      {visibleColumns.totalSubject ? <td>{row.totalSubject}</td> : null}
                      {visibleColumns.totalMark ? <td>{row.totalMark}</td> : null}
                      {visibleColumns.obtainMark ? <td>{row.obtainMark}</td> : null}
                      {visibleColumns.percentage ? <td>{row.percentage}</td> : null}
                      {visibleColumns.gpa ? <td>{row.gpa}</td> : null}
                      {visibleColumns.grade ? (
                        <td>
                          <span className={getBadgeClass(row.grade, 'grade')}>{row.grade}</span>
                        </td>
                      ) : null}
                      {visibleColumns.result ? (
                        <td>
                          <span className={getBadgeClass(row.result, 'result')}>{row.result}</span>
                        </td>
                      ) : null}
                      {visibleColumns.meritPosition ? <td>{row.meritPosition}</td> : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filteredResults.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, filteredResults.length)} of{' '}
              {filteredResults.length}
            </span>

            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              {getVisiblePages().map((page) => (
                <button
                  key={page}
                  type="button"
                  className={
                    page === currentPage
                      ? 'btn btn-sm btn-primary-600'
                      : 'btn btn-sm btn-light border'
                  }
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
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
        title="Filter Final Result"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="school"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              School
            </label>
            <select
              id="school"
              className="form-control form-select"
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
          </div>

          <div>
            <label
              htmlFor="exam"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Exam
            </label>
            <select
              id="exam"
              className="form-control form-select"
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
          </div>

          <div>
            <label
              htmlFor="className"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Class
            </label>
            <select
              id="className"
              className="form-control form-select"
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

          <div>
            <label
              htmlFor="session"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Session
            </label>
            <select
              id="session"
              className="form-control form-select"
              value={pendingFilters.session}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {sessionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="result"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Result
            </label>
            <select
              id="result"
              className="form-control form-select"
              value={pendingFilters.result}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {resultOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
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

export default ExamFinalResult
