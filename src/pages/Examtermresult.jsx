import { useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const results = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    exam: 'Term 1',
    className: 'Class 10',
    section: 'A',
    rollNo: '001',
    name: 'Alice Johnson',
    photo: null,
    totalSubject: '6',
    examMark: '480',
    obtainMark: '456',
    gpa: '3.8',
    letterGrade: 'A+',
    remark: 'Outstanding',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    exam: 'Term 1',
    className: 'Class 10',
    section: 'A',
    rollNo: '002',
    name: 'Bob Smith',
    photo: null,
    totalSubject: '6',
    examMark: '480',
    obtainMark: '408',
    gpa: '3.4',
    letterGrade: 'A',
    remark: 'Excellent',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    exam: 'Term 1',
    className: 'Class 10',
    section: 'A',
    rollNo: '003',
    name: 'Charlie Davis',
    photo: null,
    totalSubject: '6',
    examMark: '480',
    obtainMark: '360',
    gpa: '3.0',
    letterGrade: 'B',
    remark: 'Good',
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    exam: 'Term 1',
    className: 'Class 10',
    section: 'B',
    rollNo: '101',
    name: 'Diana Wilson',
    photo: null,
    totalSubject: '6',
    examMark: '480',
    obtainMark: '468',
    gpa: '3.9',
    letterGrade: 'A+',
    remark: 'Outstanding',
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    exam: 'Term 1',
    className: 'Class 10',
    section: 'B',
    rollNo: '102',
    name: 'Ethan Brown',
    photo: null,
    totalSubject: '6',
    examMark: '480',
    obtainMark: '300',
    gpa: '2.5',
    letterGrade: 'C',
    remark: 'Average',
  },
]

const examOptions = ['Term 1', 'Term 2', 'Term 3']
const classOptions = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']
const sectionOptions = ['A', 'B', 'C', 'D']

const emptyFilters = {
  school: 'Select',
  exam: 'Select',
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
  { key: 'gpa', label: 'GPA' },
  { key: 'letterGrade', label: 'Letter Grade' },
  { key: 'remark', label: 'Remark' },
]

const gradeBadge = (grade) => {
  if (['A+', 'A'].includes(grade)) return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (grade === 'B') return 'bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (grade === 'C') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
}

const ExamTermResult = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(
    () => Array.from(new Set(results.map((r) => r.school))),
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return results.filter((r) => {
      const matchesSearch = !q || [r.rollNo, r.name, r.exam, r.className, r.section].join(' ').toLowerCase().includes(q)
      const matchesSchool = filters.school === 'Select' || r.school === filters.school
      const matchesExam = filters.exam === 'Select' || r.exam === filters.exam
      const matchesClass = filters.className === 'Select' || r.className === filters.className
      const matchesSection = filters.section === 'Select' || r.section === filters.section
      return matchesSearch && matchesSchool && matchesExam && matchesClass && matchesSection
    })
  }, [search, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((r) => selectedRows.includes(r.sl))

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows(paginated.map((r) => r.sl))
    else setSelectedRows([])
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Exam Term Result</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">Dashboard</button>
            <span className="text-secondary-light"> / Exam Term Result</span>
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

              {/* Filter */}
              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              {/* Columns */}
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  {columnOptions.map((column) => (
                    <li key={column.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input type="checkbox" className="form-check-input mt-0" checked={visibleColumns[column.key]} onChange={() => toggleColumn(column.key)} />
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
                placeholder="Search by roll no, name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light"><i className="ri-search-line"></i></span>
            </div>
          </div>

          {/* Table */}
          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input className="form-check-input" type="checkbox" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.rollNo ? <th scope="col">Roll No</th> : null}
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.photo ? <th scope="col">Photo</th> : null}
                  {visibleColumns.totalSubject ? <th scope="col">Total Subject</th> : null}
                  {visibleColumns.examMark ? <th scope="col">Exam Mark</th> : null}
                  {visibleColumns.obtainMark ? <th scope="col">Obtain Mark</th> : null}
                  {visibleColumns.gpa ? <th scope="col">GPA</th> : null}
                  {visibleColumns.letterGrade ? <th scope="col">Letter Grade</th> : null}
                  {visibleColumns.remark ? <th scope="col">Remark</th> : null}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      No exam results found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row) => (
                    <tr key={row.sl}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" checked={selectedRows.includes(row.sl)} onChange={() => handleSelectRow(row.sl)} />
                          <label className="form-check-label">{row.sl}</label>
                        </div>
                      </td>
                      {visibleColumns.rollNo ? <td>{row.rollNo}</td> : null}
                      {visibleColumns.name ? <td className="fw-medium text-primary-light">{row.name}</td> : null}
                      {visibleColumns.photo ? (
                        <td>
                          <div className="w-40-px h-40-px rounded-circle bg-neutral-200 d-flex align-items-center justify-content-center overflow-hidden" style={{ minWidth: 40 }}>
                            {row.photo ? (
                              <img src={row.photo} alt={row.name} className="w-100 h-100 object-fit-cover" />
                            ) : (
                              <i className="ri-user-line text-secondary-light"></i>
                            )}
                          </div>
                        </td>
                      ) : null}
                      {visibleColumns.totalSubject ? <td>{row.totalSubject}</td> : null}
                      {visibleColumns.examMark ? <td>{row.examMark}</td> : null}
                      {visibleColumns.obtainMark ? <td className="fw-medium text-primary-light">{row.obtainMark}</td> : null}
                      {visibleColumns.gpa ? <td className="fw-semibold text-primary-light">{row.gpa}</td> : null}
                      {visibleColumns.letterGrade ? (
                        <td><span className={gradeBadge(row.letterGrade)}>{row.letterGrade}</span></td>
                      ) : null}
                      {visibleColumns.remark ? <td>{row.remark}</td> : null}
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
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              {getVisiblePages().map((p) => (
                <button key={p} type="button" className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Sidebar */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Exam Results"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="school" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School Name</label>
            <select id="school" className="form-control form-select" value={pendingFilters.school} onChange={handlePendingFilterChange}>
              <option value="Select">--Select School--</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="exam" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Exam</label>
            <select id="exam" className="form-control form-select" value={pendingFilters.exam} onChange={handlePendingFilterChange}>
              <option value="Select">--Select--</option>
              {examOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="className" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Class</label>
            <select id="className" className="form-control form-select" value={pendingFilters.className} onChange={handlePendingFilterChange}>
              <option value="Select">--Select--</option>
              {classOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="section" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Section</label>
            <select id="section" className="form-control form-select" value={pendingFilters.section} onChange={handlePendingFilterChange}>
              <option value="Select">--Select--</option>
              {sectionOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">Reset</button>
          </div>
          <div>
            <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default ExamTermResult