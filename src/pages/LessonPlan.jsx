import { useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const lessonPlans = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    lesson: 'Chapter 1: Algebra Fundamentals',
    lessonStartDate: '2024-04-01',
    lessonEndDate: '2024-04-30',
    topic: 'Linear Equations',
    topicStartDate: '2024-04-01',
    topicEndDate: '2024-04-10',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    lesson: 'Chapter 2: Newton\'s Laws',
    lessonStartDate: '2024-04-05',
    lessonEndDate: '2024-05-05',
    topic: 'First Law of Motion',
    topicStartDate: '2024-04-05',
    topicEndDate: '2024-04-15',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    lesson: 'Unit 3: English Prose',
    lessonStartDate: '2024-03-15',
    lessonEndDate: '2024-04-15',
    topic: 'Short Story Analysis',
    topicStartDate: '2024-03-15',
    topicEndDate: '2024-03-28',
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    lesson: 'Module 4: Cell Biology',
    lessonStartDate: '2023-11-01',
    lessonEndDate: '2023-11-30',
    topic: 'Cell Structure & Function',
    topicStartDate: '2023-11-01',
    topicEndDate: '2023-11-14',
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    lesson: 'Unit 5: Programming Basics',
    lessonStartDate: '2023-12-01',
    lessonEndDate: '2023-12-31',
    topic: 'Introduction to Python',
    topicStartDate: '2023-12-01',
    topicEndDate: '2023-12-12',
  },
]

const classOptions = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']
const subjectOptions = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'English', 'Computer Science', 'History', 'Geography',
]
const academicYearOptions = ['2024-2025', '2023-2024', '2022-2023']

const emptyFilters = {
  school: 'Select',
  academicYear: 'Select',
  className: 'Select',
  subject: 'Select',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'lesson', label: 'Lesson' },
  { key: 'lessonStartDate', label: 'Start Date' },
  { key: 'lessonEndDate', label: 'End Date' },
  { key: 'topic', label: 'Topic' },
  { key: 'topicStartDate', label: 'Start Date' },
  { key: 'topicEndDate', label: 'End Date' },
]

const LessonPlanDetail = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isFindSidebarOpen, setIsFindSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [findErrors, setFindErrors] = useState({})
  const [hasSearched, setHasSearched] = useState(false)
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(
    () => Array.from(new Set(lessonPlans.map((r) => r.school))),
    [],
  )

  const filtered = useMemo(() => {
    if (!hasSearched) return []
    const q = search.trim().toLowerCase()
    return lessonPlans.filter((r) => {
      const matchesSearch =
        !q ||
        [r.school, r.lesson, r.lessonStartDate, r.lessonEndDate, r.topic, r.topicStartDate, r.topicEndDate]
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesSchool = filters.school === 'Select' || r.school === filters.school
      return matchesSearch && matchesSchool
    })
  }, [search, filters, hasSearched])

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
    setFindErrors((prev) => ({ ...prev, [id]: '' }))
  }

  const validateFind = () => {
    const errs = {}
    if (pendingFilters.school === 'Select') errs.school = 'School Name is required.'
    if (pendingFilters.academicYear === 'Select') errs.academicYear = 'Academic Year is required.'
    if (pendingFilters.className === 'Select') errs.className = 'Class is required.'
    if (pendingFilters.subject === 'Select') errs.subject = 'Subject is required.'
    return errs
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    const errs = validateFind()
    if (Object.keys(errs).length > 0) {
      setFindErrors(errs)
      return
    }
    setFindErrors({})
    setFilters(pendingFilters)
    setCurrentPage(1)
    setHasSearched(true)
    setIsFindSidebarOpen(false)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setFindErrors({})
    setCurrentPage(1)
    setHasSearched(false)
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Lesson Plan</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Lesson Plan</span>
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
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
                      <i className="ri-file-3-line"></i> PDF
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
                      <i className="ri-file-excel-2-line"></i> Excel
                    </button>
                  </li>
                </ul>
              </div>

              {/* Find */}
              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFindSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Find</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              {/* Columns */}
              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
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
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }}
              >
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Search */}
            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search lesson plans..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 950 }}>
              <thead>
                <tr>
                  <th scope="col">
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
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.lesson ? <th scope="col">Lesson</th> : null}
                  {visibleColumns.lessonStartDate ? <th scope="col">Start Date</th> : null}
                  {visibleColumns.lessonEndDate ? <th scope="col">End Date</th> : null}
                  {visibleColumns.topic ? <th scope="col">Topic</th> : null}
                  {visibleColumns.topicStartDate ? <th scope="col">Start Date</th> : null}
                  {visibleColumns.topicEndDate ? <th scope="col">End Date</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {!hasSearched ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="ri-search-line" style={{ fontSize: '1.5rem', color: '#45597a' }}></i>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#45597a' }}>Lesson Plan</p>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#7a8a9a' }}>
                          Use the <strong>Find</strong> button to select School, Academic Year, Class and Subject to load lesson plans.
                        </p>
                        <button
                          type="button"
                          className="btn btn-primary-600 d-flex align-items-center gap-6"
                          style={{ marginTop: '0.25rem' }}
                          onClick={() => setIsFindSidebarOpen(true)}
                        >
                          <i className="ri-filter-3-line"></i> Find Lesson Plans
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      No lesson plans found for the selected criteria.
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
                      {visibleColumns.lesson ? (
                        <td className="fw-medium text-primary-light">
                          <span className="d-flex align-items-center gap-6">
                            <i className="ri-file-list-2-line text-secondary-light"></i>
                            {row.lesson}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.lessonStartDate ? (
                        <td>
                          <span className="d-flex align-items-center gap-4">
                            <i className="ri-calendar-2-line text-secondary-light text-sm"></i>
                            {row.lessonStartDate}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.lessonEndDate ? (
                        <td>
                          <span className="d-flex align-items-center gap-4">
                            <i className="ri-calendar-check-line text-secondary-light text-sm"></i>
                            {row.lessonEndDate}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.topic ? (
                        <td>
                          <span className="bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm">
                            {row.topic}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.topicStartDate ? (
                        <td>
                          <span className="d-flex align-items-center gap-4">
                            <i className="ri-bookmark-line text-secondary-light text-sm"></i>
                            {row.topicStartDate}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.topicEndDate ? (
                        <td>
                          <span className="d-flex align-items-center gap-4">
                            <i className="ri-bookmark-fill text-secondary-light text-sm"></i>
                            {row.topicEndDate}
                          </span>
                        </td>
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

          {/* Pagination — only shown after search */}
          {hasSearched && (
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
          )}
        </div>
      </div>

      {/* Find Sidebar */}
      <SlideSidebar
        isOpen={isFindSidebarOpen}
        title="Find Lesson Plans"
        onClose={() => setIsFindSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="school" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School Name <span className="text-danger-600">*</span>
            </label>
            <select
              id="school"
              className={`form-control form-select${findErrors.school ? ' is-invalid' : ''}`}
              value={pendingFilters.school}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select School--</option>
              {schoolOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {findErrors.school && <div className="text-danger-600 text-sm mt-4">{findErrors.school}</div>}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="academicYear" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Academic Year <span className="text-danger-600">*</span>
            </label>
            <select
              id="academicYear"
              className={`form-control form-select${findErrors.academicYear ? ' is-invalid' : ''}`}
              value={pendingFilters.academicYear}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {academicYearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {findErrors.academicYear && <div className="text-danger-600 text-sm mt-4">{findErrors.academicYear}</div>}
          </div>

          <div>
            <label htmlFor="className" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class <span className="text-danger-600">*</span>
            </label>
            <select
              id="className"
              className={`form-control form-select${findErrors.className ? ' is-invalid' : ''}`}
              value={pendingFilters.className}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {findErrors.className && <div className="text-danger-600 text-sm mt-4">{findErrors.className}</div>}
          </div>

          <div>
            <label htmlFor="subject" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Subject <span className="text-danger-600">*</span>
            </label>
            <select
              id="subject"
              className={`form-control form-select${findErrors.subject ? ' is-invalid' : ''}`}
              value={pendingFilters.subject}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {findErrors.subject && <div className="text-danger-600 text-sm mt-4">{findErrors.subject}</div>}
          </div>

          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
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

export default LessonPlanDetail

