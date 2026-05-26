import { useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import useAcademicYearOptions from '../hooks/useAcademicYearOptions'
import { useAuth } from '../context/useAuth'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const meritListData = [
  {
    sl: '01',
    rollNo: '2024001',
    name: 'Alice Johnson',
    photo: null,
    totalSubject: 6,
    examMark: 600,
    obtainMark: 578,
    percentage: 96.33,
    gpa: 5.0,
    letterGrade: 'A+',
    status: 'Pass',
    positionInClass: 1,
    remark: 'Outstanding Performance',
  },
  {
    sl: '02',
    rollNo: '2024002',
    name: 'Bob Smith',
    photo: null,
    totalSubject: 6,
    examMark: 600,
    obtainMark: 562,
    percentage: 93.67,
    gpa: 5.0,
    letterGrade: 'A+',
    status: 'Pass',
    positionInClass: 2,
    remark: 'Excellent',
  },
  {
    sl: '03',
    rollNo: '2024003',
    name: 'Charlie Davis',
    photo: null,
    totalSubject: 6,
    examMark: 600,
    obtainMark: 548,
    percentage: 91.33,
    gpa: 4.8,
    letterGrade: 'A',
    status: 'Pass',
    positionInClass: 3,
    remark: 'Very Good',
  },
  {
    sl: '04',
    rollNo: '2024004',
    name: 'Diana Wilson',
    photo: null,
    totalSubject: 6,
    examMark: 600,
    obtainMark: 535,
    percentage: 89.17,
    gpa: 4.6,
    letterGrade: 'A',
    status: 'Pass',
    positionInClass: 4,
    remark: 'Good',
  },
  {
    sl: '05',
    rollNo: '2024005',
    name: 'Ethan Brown',
    photo: null,
    totalSubject: 6,
    examMark: 600,
    obtainMark: 520,
    percentage: 86.67,
    gpa: 4.4,
    letterGrade: 'B+',
    status: 'Pass',
    positionInClass: 5,
    remark: 'Satisfactory',
  },
  {
    sl: '06',
    rollNo: '2024006',
    name: 'Sophia Lee',
    photo: null,
    totalSubject: 6,
    examMark: 600,
    obtainMark: 508,
    percentage: 84.67,
    gpa: 4.2,
    letterGrade: 'B+',
    status: 'Pass',
    positionInClass: 6,
    remark: '',
  },
  {
    sl: '07',
    rollNo: '2024007',
    name: 'Michael Chen',
    photo: null,
    totalSubject: 6,
    examMark: 600,
    obtainMark: 495,
    percentage: 82.50,
    gpa: 4.0,
    letterGrade: 'B',
    status: 'Pass',
    positionInClass: 7,
    remark: '',
  },
  {
    sl: '08',
    rollNo: '2024008',
    name: 'Olivia Martinez',
    photo: null,
    totalSubject: 6,
    examMark: 600,
    obtainMark: 345,
    percentage: 57.50,
    gpa: 2.8,
    letterGrade: 'D',
    status: 'Fail',
    positionInClass: 8,
    remark: 'Needs Improvement',
  },
]

const emptyFilters = {
  school: 'Select',
  academicYear: 'Select',
  className: 'Select',
  section: 'Select',
}

const columnOptions = [
  { key: 'rollNo', label: 'Roll No' },
  { key: 'name', label: 'Name' },
  { key: 'photo', label: 'Photo' },
  { key: 'totalSubject', label: 'Total Subject' },
  { key: 'examMark', label: 'Exam Mark' },
  { key: 'obtainMark', label: 'Obtain Mark' },
  { key: 'percentage', label: 'Percentage' },
  { key: 'gpa', label: 'GPA' },
  { key: 'letterGrade', label: 'Letter Grade' },
  { key: 'status', label: 'Status' },
  { key: 'positionInClass', label: 'Position in Class' },
  { key: 'remark', label: 'Remark' },
]

const getStatusBadge = (status) => {
  if (status === 'Pass') {
    return <span className="bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm">Pass</span>
  }
  return <span className="bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm">Fail</span>
}

const getLetterGradeBadge = (grade) => {
  if (grade === 'A+') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (grade === 'A') return 'bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (grade === 'B+') return 'bg-primary-100 text-primary-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (grade === 'B') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
}

const MeritList = () => {
  const { canAdd, canEdit, canDelete } = useAuth()
  const PAGE_SLUG = 'merit-list'
  const PAGE_PERMISSIONS = {
    add: canAdd(PAGE_SLUG),
    edit: canEdit(PAGE_SLUG),
    delete: canDelete(PAGE_SLUG),
  }
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [findErrors, setFindErrors] = useState({})

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(
    () => ['Windsor Park High School', 'Riverside Academy', 'Sunrise Public School'],
    [],
  )
  const academicYearOptions = useAcademicYearOptions()
  const classOptions = useMemo(() => ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'], [])
  const sectionOptions = useMemo(() => ['A', 'B', 'C'], [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return meritListData.filter((r) => {
      const matchesSearch =
        !q ||
        [r.rollNo, r.name, r.letterGrade, r.status, String(r.positionInClass)]
          .join(' ')
          .toLowerCase()
          .includes(q)
      return matchesSearch
    })
  }, [search])

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
    if (pendingFilters.academicYear === 'Select') errs.academicYear = 'Academic Year is required.'
    if (pendingFilters.className === 'Select') errs.className = 'Class is required.'
    return errs
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    const errors = validateFind()
    if (Object.keys(errors).length > 0) {
      setFindErrors(errors)
      return
    }
    // Filters applied successfully - you can add API call here
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
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

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Merit List</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Merit List</span>
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
                placeholder="Search by roll no, name..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1300 }}>
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
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.photo ? <th scope="col">Photo</th> : null}
                  {visibleColumns.totalSubject ? <th scope="col">Total Subject</th> : null}
                  {visibleColumns.examMark ? <th scope="col">Exam Mark</th> : null}
                  {visibleColumns.obtainMark ? <th scope="col">Obtain Mark</th> : null}
                  {visibleColumns.percentage ? <th scope="col">Percentage</th> : null}
                  {visibleColumns.gpa ? <th scope="col">GPA</th> : null}
                  {visibleColumns.letterGrade ? <th scope="col">Letter Grade</th> : null}
                  {visibleColumns.status ? <th scope="col">Status</th> : null}
                  {visibleColumns.positionInClass ? <th scope="col">Position in Class</th> : null}
                  {visibleColumns.remark ? <th scope="col">Remark</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No merit list records found.
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
                      {visibleColumns.rollNo ? (
                        <td className="fw-medium text-primary-light">{row.rollNo}</td>
                      ) : null}
                      {visibleColumns.name ? <td className="fw-medium">{row.name}</td> : null}
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
                      {visibleColumns.totalSubject ? (
                        <td className="text-center">{row.totalSubject}</td>
                      ) : null}
                      {visibleColumns.examMark ? (
                        <td className="text-center">{row.examMark}</td>
                      ) : null}
                      {visibleColumns.obtainMark ? (
                        <td className="text-center fw-semibold text-primary-light">
                          {row.obtainMark}
                        </td>
                      ) : null}
                      {visibleColumns.percentage ? (
                        <td className="text-center fw-semibold">{row.percentage}%</td>
                      ) : null}
                      {visibleColumns.gpa ? <td className="text-center">{row.gpa}</td> : null}
                      {visibleColumns.letterGrade ? (
                        <td>
                          <span className={getLetterGradeBadge(row.letterGrade)}>
                            {row.letterGrade}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.status ? (
                        <td>{getStatusBadge(row.status)}</td>
                      ) : null}
                      {visibleColumns.positionInClass ? (
                        <td className="text-center fw-bold text-primary-light">{row.positionInClass}</td>
                      ) : null}
                      {visibleColumns.remark ? (
                        <td style={{ maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {row.remark || '-'}
                        </td>
                      ) : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            title="View Details"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                          {PAGE_PERMISSIONS.delete && (
                            <button
                              type="button"
                              className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                              title="Delete"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          )}
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
        title="Find Merit List"
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

          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="academicYear"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Academic Year <span className="text-danger-600">*</span>
            </label>
            <select
              id="academicYear"
              className={`form-control form-select ${findErrors.academicYear ? 'border-danger-600' : ''}`}
              value={pendingFilters.academicYear}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {academicYearOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {findErrors.academicYear && (
              <div className="text-danger-600 text-sm mt-4">{findErrors.academicYear}</div>
            )}
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

export default MeritList
