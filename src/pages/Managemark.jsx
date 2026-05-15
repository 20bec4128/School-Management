import { useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const marks = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    exam: 'Term 1',
    className: 'Class 10',
    section: 'A',
    subject: 'Mathematics',
    rollNo: '001',
    name: 'Alice Johnson',
    photo: null,
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
    remark: 'Outstanding',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    exam: 'Term 1',
    className: 'Class 10',
    section: 'A',
    subject: 'Mathematics',
    rollNo: '002',
    name: 'Bob Smith',
    photo: null,
    writtenMark: '45',
    writtenObtain: '38',
    tutorialMark: '20',
    tutorialObtain: '16',
    practicalMark: '25',
    practicalObtain: '20',
    vivaMark: '10',
    vivaObtain: '8',
    totalMark: '100',
    totalObtain: '82',
    letterGrade: 'A',
    remark: 'Excellent',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    exam: 'Term 1',
    className: 'Class 10',
    section: 'A',
    subject: 'Mathematics',
    rollNo: '003',
    name: 'Charlie Davis',
    photo: null,
    writtenMark: '45',
    writtenObtain: '35',
    tutorialMark: '20',
    tutorialObtain: '14',
    practicalMark: '25',
    practicalObtain: '18',
    vivaMark: '10',
    vivaObtain: '7',
    totalMark: '100',
    totalObtain: '74',
    letterGrade: 'B',
    remark: 'Good',
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    exam: 'Term 1',
    className: 'Class 10',
    section: 'A',
    subject: 'Mathematics',
    rollNo: '004',
    name: 'Diana Wilson',
    photo: null,
    writtenMark: '45',
    writtenObtain: '42',
    tutorialMark: '20',
    tutorialObtain: '19',
    practicalMark: '25',
    practicalObtain: '24',
    vivaMark: '10',
    vivaObtain: '9',
    totalMark: '100',
    totalObtain: '94',
    letterGrade: 'A+',
    remark: 'Outstanding',
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    exam: 'Term 1',
    className: 'Class 10',
    section: 'A',
    subject: 'Mathematics',
    rollNo: '005',
    name: 'Ethan Brown',
    photo: null,
    writtenMark: '45',
    writtenObtain: '28',
    tutorialMark: '20',
    tutorialObtain: '12',
    practicalMark: '25',
    practicalObtain: '15',
    vivaMark: '10',
    vivaObtain: '5',
    totalMark: '100',
    totalObtain: '60',
    letterGrade: 'C',
    remark: 'Average',
  },
]

const examOptions = ['Term 1', 'Term 2', 'Term 3']
const classOptions = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']
const sectionOptions = ['A', 'B', 'C', 'D']
const subjectOptions = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'English', 'Computer Science', 'History', 'Geography',
]

const emptyFilters = {
  school: 'Select',
  exam: 'Select',
  className: 'Select',
  section: 'Select',
  subject: 'Select',
}

const columnOptions = [
  { key: 'rollNo', label: 'Roll No' },
  { key: 'name', label: 'Name' },
  { key: 'photo', label: 'Photo' },
  { key: 'written', label: 'Written' },
  { key: 'tutorial', label: 'Tutorial' },
  { key: 'practical', label: 'Practical' },
  { key: 'viva', label: 'Viva' },
  { key: 'total', label: 'Total' },
  { key: 'letterGrade', label: 'Letter Grade' },
  { key: 'remark', label: 'Remark' },
]

const gradeBadge = (grade) => {
  if (['A+', 'A'].includes(grade)) return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (grade === 'B') return 'bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (grade === 'C') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
}

const subHeaderCellClass = 'text-sm text-center border border-neutral-200 bg-neutral-50'

const ManageMark = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [marksData, setMarksData] = useState(marks)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(() => Array.from(new Set(marksData.map((r) => r.school))), [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return marksData.filter((r) => {
      const matchesSearch = !q || [r.rollNo, r.name, r.exam, r.className, r.section, r.subject].join(' ').toLowerCase().includes(q)
      const matchesSchool = filters.school === 'Select' || r.school === filters.school
      const matchesExam = filters.exam === 'Select' || r.exam === filters.exam
      const matchesClass = filters.className === 'Select' || r.className === filters.className
      const matchesSection = filters.section === 'Select' || r.section === filters.section
      const matchesSubject = filters.subject === 'Select' || r.subject === filters.subject
      return matchesSearch && matchesSchool && matchesExam && matchesClass && matchesSection && matchesSubject
    })
  }, [search, filters, marksData])

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

  const handleMarkChange = (sl, field, value) => {
    setMarksData((prev) =>
      prev.map((row) => {
        if (row.sl === sl) {
          const updatedRow = { ...row, [field]: value }
          if (['writtenObtain', 'tutorialObtain', 'practicalObtain', 'vivaObtain'].includes(field)) {
            const written = parseInt(updatedRow.writtenObtain) || 0
            const tutorial = parseInt(updatedRow.tutorialObtain) || 0
            const practical = parseInt(updatedRow.practicalObtain) || 0
            const viva = parseInt(updatedRow.vivaObtain) || 0
            updatedRow.totalObtain = written + tutorial + practical + viva
          }
          return updatedRow
        }
        return row
      }),
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

  // Actual rendered column count — grouped cols count as 2
  const actualColCount = useMemo(() => {
    let count = 1 // SL always
    if (visibleColumns.rollNo) count += 1
    if (visibleColumns.name) count += 1
    if (visibleColumns.photo) count += 1
    if (visibleColumns.written) count += 2
    if (visibleColumns.tutorial) count += 2
    if (visibleColumns.practical) count += 2
    if (visibleColumns.viva) count += 2
    if (visibleColumns.total) count += 2
    if (visibleColumns.letterGrade) count += 1
    if (visibleColumns.remark) count += 1
    count += 1 // Action always
    return count
  }, [visibleColumns])

  return (
    <div className="dashboard-main-body">
      {/* Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Manage Mark</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Manage Mark</span>
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
              <select className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light" value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }}>
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Search */}
            <div className="position-relative">
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search by roll no, name..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light"><i className="ri-search-line"></i></span>
            </div>
          </div>

          {/* Table */}
          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1400 }}>
              <thead>
                {/* Row 1 — non-grouped cols use rowSpan=2, grouped cols use colSpan=2 */}
                <tr>
                  <th scope="col" rowSpan="2">
                    <div className="form-check style-check d-flex align-items-center">
                      <input className="form-check-input" type="checkbox" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.rollNo ? <th scope="col" rowSpan="2">Roll No</th> : null}
                  {visibleColumns.name ? <th scope="col" rowSpan="2">Name</th> : null}
                  {visibleColumns.photo ? <th scope="col" rowSpan="2">Photo</th> : null}
                  {visibleColumns.written ? <th scope="col" colSpan="2" className="text-center">Written</th> : null}
                  {visibleColumns.tutorial ? <th scope="col" colSpan="2" className="text-center">Tutorial</th> : null}
                  {visibleColumns.practical ? <th scope="col" colSpan="2" className="text-center">Practical</th> : null}
                  {visibleColumns.viva ? <th scope="col" colSpan="2" className="text-center">Viva</th> : null}
                  {visibleColumns.total ? <th scope="col" colSpan="2" className="text-center">Total</th> : null}
                  {visibleColumns.letterGrade ? <th scope="col" rowSpan="2">Letter Grade</th> : null}
                  {visibleColumns.remark ? <th scope="col" rowSpan="2">Remark</th> : null}
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
                      No marks found.
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
                      {visibleColumns.rollNo ? <td className="fw-medium text-primary-light">{row.rollNo}</td> : null}
                      {visibleColumns.name ? <td className="fw-medium">{row.name}</td> : null}
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
                      {visibleColumns.written ? (
                        <>
                          <td>
                            <input type="number" className="avm-input" style={{ width: '70px' }} value={row.writtenMark} onChange={(e) => handleMarkChange(row.sl, 'writtenMark', e.target.value)} />
                          </td>
                          <td>
                            <input type="number" className="avm-input" style={{ width: '70px' }} value={row.writtenObtain} onChange={(e) => handleMarkChange(row.sl, 'writtenObtain', e.target.value)} />
                          </td>
                        </>
                      ) : null}
                      {visibleColumns.tutorial ? (
                        <>
                          <td>
                            <input type="number" className="avm-input" style={{ width: '70px' }} value={row.tutorialMark} onChange={(e) => handleMarkChange(row.sl, 'tutorialMark', e.target.value)} />
                          </td>
                          <td>
                            <input type="number" className="avm-input" style={{ width: '70px' }} value={row.tutorialObtain} onChange={(e) => handleMarkChange(row.sl, 'tutorialObtain', e.target.value)} />
                          </td>
                        </>
                      ) : null}
                      {visibleColumns.practical ? (
                        <>
                          <td>
                            <input type="number" className="avm-input" style={{ width: '70px' }} value={row.practicalMark} onChange={(e) => handleMarkChange(row.sl, 'practicalMark', e.target.value)} />
                          </td>
                          <td>
                            <input type="number" className="avm-input" style={{ width: '70px' }} value={row.practicalObtain} onChange={(e) => handleMarkChange(row.sl, 'practicalObtain', e.target.value)} />
                          </td>
                        </>
                      ) : null}
                      {visibleColumns.viva ? (
                        <>
                          <td>
                            <input type="number" className="avm-input" style={{ width: '70px' }} value={row.vivaMark} onChange={(e) => handleMarkChange(row.sl, 'vivaMark', e.target.value)} />
                          </td>
                          <td>
                            <input type="number" className="avm-input" style={{ width: '70px' }} value={row.vivaObtain} onChange={(e) => handleMarkChange(row.sl, 'vivaObtain', e.target.value)} />
                          </td>
                        </>
                      ) : null}
                      {visibleColumns.total ? (
                        <>
                          <td className="fw-semibold">{row.totalMark}</td>
                          <td className="fw-semibold text-primary-light">{row.totalObtain}</td>
                        </>
                      ) : null}
                      {visibleColumns.letterGrade ? (
                        <td><span className={gradeBadge(row.letterGrade)}>{row.letterGrade}</span></td>
                      ) : null}
                      {visibleColumns.remark ? <td>{row.remark || '-'}</td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button type="button" className="bg-success-focus bg-hover-success-200 text-success-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" title="Save">
                            <i className="ri-save-line"></i>
                          </button>
                          <button type="button" className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" title="Delete">
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
      <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter Marks" onClose={() => setIsFilterSidebarOpen(false)} className="filter-sidebar">
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="school" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
            <select id="school" className="form-control form-select" value={pendingFilters.school} onChange={handlePendingFilterChange}>
              <option value="Select">Select School</option>
              {schoolOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="exam" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Exam</label>
            <select id="exam" className="form-control form-select" value={pendingFilters.exam} onChange={handlePendingFilterChange}>
              <option value="Select">--Select--</option>
              {examOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="className" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Class</label>
            <select id="className" className="form-control form-select" value={pendingFilters.className} onChange={handlePendingFilterChange}>
              <option value="Select">--Select--</option>
              {classOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="section" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Section</label>
            <select id="section" className="form-control form-select" value={pendingFilters.section} onChange={handlePendingFilterChange}>
              <option value="Select">--Select--</option>
              {sectionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="subject" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Subject</label>
            <select id="subject" className="form-control form-select" value={pendingFilters.subject} onChange={handlePendingFilterChange}>
              <option value="Select">--Select--</option>
              {subjectOptions.map((option) => <option key={option} value={option}>{option}</option>)}
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

export default ManageMark
