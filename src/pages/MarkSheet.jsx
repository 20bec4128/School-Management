import { useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const markSheetData = [
  {
    sl: '01',
    subject: 'Mathematics',
    writtenMark: '45',
    writtenObtain: '42',
    tutorialMark: '20',
    tutorialObtain: '18',
    practicalMark: '25',
    practicalObtain: '23',
    vivaMark: '10',
    vivaObtain: '9',
    totalMark: '100',
    totalObtain: '92',
    letterGrade: 'A+',
    gradePoint: '5.00',
    lowest: '42',
    height: '92',
    position: '1st',
  },
  {
    sl: '02',
    subject: 'Physics',
    writtenMark: '45',
    writtenObtain: '40',
    tutorialMark: '20',
    tutorialObtain: '17',
    practicalMark: '25',
    practicalObtain: '22',
    vivaMark: '10',
    vivaObtain: '8',
    totalMark: '100',
    totalObtain: '87',
    letterGrade: 'A',
    gradePoint: '4.50',
    lowest: '40',
    height: '87',
    position: '2nd',
  },
  {
    sl: '03',
    subject: 'Chemistry',
    writtenMark: '45',
    writtenObtain: '38',
    tutorialMark: '20',
    tutorialObtain: '16',
    practicalMark: '25',
    practicalObtain: '20',
    vivaMark: '10',
    vivaObtain: '7',
    totalMark: '100',
    totalObtain: '81',
    letterGrade: 'A',
    gradePoint: '4.20',
    lowest: '38',
    height: '81',
    position: '3rd',
  },
  {
    sl: '04',
    subject: 'Biology',
    writtenMark: '45',
    writtenObtain: '41',
    tutorialMark: '20',
    tutorialObtain: '18',
    practicalMark: '25',
    practicalObtain: '24',
    vivaMark: '10',
    vivaObtain: '9',
    totalMark: '100',
    totalObtain: '92',
    letterGrade: 'A+',
    gradePoint: '5.00',
    lowest: '41',
    height: '92',
    position: '1st',
  },
  {
    sl: '05',
    subject: 'English',
    writtenMark: '45',
    writtenObtain: '39',
    tutorialMark: '20',
    tutorialObtain: '16',
    practicalMark: '25',
    practicalObtain: '21',
    vivaMark: '10',
    vivaObtain: '8',
    totalMark: '100',
    totalObtain: '84',
    letterGrade: 'A',
    gradePoint: '4.30',
    lowest: '39',
    height: '84',
    position: '3rd',
  },
  {
    sl: '06',
    subject: 'Computer Science',
    writtenMark: '45',
    writtenObtain: '43',
    tutorialMark: '20',
    tutorialObtain: '19',
    practicalMark: '25',
    practicalObtain: '24',
    vivaMark: '10',
    vivaObtain: '10',
    totalMark: '100',
    totalObtain: '96',
    letterGrade: 'A+',
    gradePoint: '5.00',
    lowest: '43',
    height: '96',
    position: '1st',
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
  { key: 'subject', label: 'Subject' },
  { key: 'written', label: 'Written' },
  { key: 'tutorial', label: 'Tutorial' },
  { key: 'practical', label: 'Practical' },
  { key: 'viva', label: 'Viva' },
  { key: 'total', label: 'Total' },
  { key: 'letterGrade', label: 'Letter Grade' },
  { key: 'gradePoint', label: 'Grade Point' },
  { key: 'lowest', label: 'Lowest' },
  { key: 'height', label: 'Height' },
  { key: 'position', label: 'Position' },
]

const getLetterGradeBadge = (grade) => {
  if (grade === 'A+') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (grade === 'A') return 'bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (grade === 'B+') return 'bg-primary-100 text-primary-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (grade === 'B') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
}

const subHeaderCellClass = 'text-sm text-center border border-neutral-200 bg-neutral-50'

const MarkSheet = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [findErrors, setFindErrors] = useState({})

  const { visibleColumns, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(
    () => ['Windsor Park High School', 'Riverside Academy', 'Sunrise Public School'],
    [],
  )
  const examOptions = useMemo(() => ['Term 1', 'Term 2', 'Term 3', 'Final'], [])
  const classOptions = useMemo(() => ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'], [])
  const sectionOptions = useMemo(() => ['A', 'B', 'C', 'D'], [])
  const subjectOptions = useMemo(
    () => [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'English',
      'Computer Science',
      'History',
      'Geography',
    ],
    [],
  )
  const activeFilters = useMemo(
    () => Object.entries(filters).filter(([, value]) => value && value !== 'Select'),
    [filters],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return markSheetData.filter((r) => {
      const matchesSubject = filters.subject === 'Select' || r.subject === filters.subject
      const matchesSearch =
        !q || [r.subject, r.letterGrade, r.position].join(' ').toLowerCase().includes(q)
      return matchesSubject && matchesSearch
    })
  }, [filters, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((r) => selectedRows.includes(r.sl))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(paginated.map((r) => r.sl))
    } else {
      setSelectedRows([])
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

  // Actual rendered column count — grouped cols count as 2
  const actualColCount = useMemo(() => {
    let count = 1 // SL always
    if (visibleColumns.subject) count += 1
    if (visibleColumns.written) count += 2
    if (visibleColumns.tutorial) count += 2
    if (visibleColumns.practical) count += 2
    if (visibleColumns.viva) count += 2
    if (visibleColumns.total) count += 2
    if (visibleColumns.letterGrade) count += 1
    if (visibleColumns.gradePoint) count += 1
    if (visibleColumns.lowest) count += 1
    if (visibleColumns.height) count += 1
    if (visibleColumns.position) count += 1
    count += 1 // Action always
    return count
  }, [visibleColumns])

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Mark Sheet</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Mark Sheet</span>
          </div>
        </div>
       
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1"></i> Export
                  </span>
                  <span>
                    <i className="ri-arrow-down-s-line"></i>
                  </span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li>
                    <button
                      type="button"
                      className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                    >
                      <i className="ri-file-3-line"></i> PDF
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                    >
                      <i className="ri-file-excel-2-line"></i> Excel
                    </button>
                  </li>
                </ul>
              </div>

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
                placeholder="Search by subject, grade..."
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
                {/* Row 1 — non-grouped cols use rowSpan=2, grouped cols use colSpan=2 */}
                <tr>
                  <th scope="col" rowSpan="2">
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.subject ? <th scope="col" rowSpan="2">Subject</th> : null}
                  {visibleColumns.written ? (
                    <th scope="col" colSpan="2" className="text-center">
                      Written
                    </th>
                  ) : null}
                  {visibleColumns.tutorial ? (
                    <th scope="col" colSpan="2" className="text-center">
                      Tutorial
                    </th>
                  ) : null}
                  {visibleColumns.practical ? (
                    <th scope="col" colSpan="2" className="text-center">
                      Practical
                    </th>
                  ) : null}
                  {visibleColumns.viva ? (
                    <th scope="col" colSpan="2" className="text-center">
                      Viva
                    </th>
                  ) : null}
                  {visibleColumns.total ? (
                    <th scope="col" colSpan="2" className="text-center">
                      Total
                    </th>
                  ) : null}
                  {visibleColumns.letterGrade ? <th scope="col" rowSpan="2">Letter Grade</th> : null}
                  {visibleColumns.gradePoint ? <th scope="col" rowSpan="2">Grade Point</th> : null}
                  {visibleColumns.lowest ? <th scope="col" rowSpan="2">Lowest</th> : null}
                  {visibleColumns.height ? <th scope="col" rowSpan="2">Height</th> : null}
                  {visibleColumns.position ? <th scope="col" rowSpan="2">Position</th> : null}
                  <th scope="col" rowSpan="2">Action</th>
                </tr>
                {/* Row 2 — only Mark/Obtain sub-headers for grouped cols */}
                <tr>
                  {visibleColumns.written ? (
                    <>
                      <th scope="col" className={subHeaderCellClass}>Mark</th>
                      <th scope="col" className={subHeaderCellClass}>Obtain</th>
                    </>
                  ) : null}
                  {visibleColumns.tutorial ? (
                    <>
                      <th scope="col" className={subHeaderCellClass}>Mark</th>
                      <th scope="col" className={subHeaderCellClass}>Obtain</th>
                    </>
                  ) : null}
                  {visibleColumns.practical ? (
                    <>
                      <th scope="col" className={subHeaderCellClass}>Mark</th>
                      <th scope="col" className={subHeaderCellClass}>Obtain</th>
                    </>
                  ) : null}
                  {visibleColumns.viva ? (
                    <>
                      <th scope="col" className={subHeaderCellClass}>Mark</th>
                      <th scope="col" className={subHeaderCellClass}>Obtain</th>
                    </>
                  ) : null}
                  {visibleColumns.total ? (
                    <>
                      <th scope="col" className={subHeaderCellClass}>Mark</th>
                      <th scope="col" className={subHeaderCellClass}>Obtain</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={actualColCount} className="text-center py-40 text-secondary-light">
                      No mark sheet records found.
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
                      {visibleColumns.subject ? <td className="fw-medium text-primary-light">{row.subject}</td> : null}
                      {visibleColumns.written ? (
                        <>
                          <td className="text-center">{row.writtenMark}</td>
                          <td className="text-center fw-semibold text-primary-light">{row.writtenObtain}</td>
                        </>
                      ) : null}
                      {visibleColumns.tutorial ? (
                        <>
                          <td className="text-center">{row.tutorialMark}</td>
                          <td className="text-center fw-semibold text-primary-light">{row.tutorialObtain}</td>
                        </>
                      ) : null}
                      {visibleColumns.practical ? (
                        <>
                          <td className="text-center">{row.practicalMark}</td>
                          <td className="text-center fw-semibold text-primary-light">{row.practicalObtain}</td>
                        </>
                      ) : null}
                      {visibleColumns.viva ? (
                        <>
                          <td className="text-center">{row.vivaMark}</td>
                          <td className="text-center fw-semibold text-primary-light">{row.vivaObtain}</td>
                        </>
                      ) : null}
                      {visibleColumns.total ? (
                        <>
                          <td className="text-center fw-semibold">{row.totalMark}</td>
                          <td className="text-center fw-semibold text-primary-light">{row.totalObtain}</td>
                        </>
                      ) : null}
                      {visibleColumns.letterGrade ? (
                        <td className="text-center">
                          <span className={getLetterGradeBadge(row.letterGrade)}>
                            {row.letterGrade}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.gradePoint ? <td className="text-center">{row.gradePoint}</td> : null}
                      {visibleColumns.lowest ? <td className="text-center fw-semibold">{row.lowest}</td> : null}
                      {visibleColumns.height ? <td className="text-center fw-semibold text-primary-light">{row.height}</td> : null}
                      {visibleColumns.position ? <td className="text-center fw-bold text-primary-light">{row.position}</td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            title="View Details"
                          >
                            <i className="ri-eye-line"></i>
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
        title="Find Mark Sheet"
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

export default MarkSheet
