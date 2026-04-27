import { useMemo, useState } from 'react'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const ratings = [
  { sl: '01', school: 'Windsor Park High School', photo: null, teacher: 'John Smith', department: 'Mathematics', rating: 5, comment: 'Excellent teaching methods and very helpful.', student: 'Alice Brown' },
  { sl: '02', school: 'Windsor Park High School', photo: null, teacher: 'Sarah Johnson', department: 'Science', rating: 4, comment: 'Very knowledgeable and engaging lessons.', student: 'Bob Wilson' },
  { sl: '03', school: 'Windsor Park High School', photo: null, teacher: 'David Lee', department: 'English', rating: 3, comment: 'Good teacher but needs more interaction.', student: 'Charlie Davis' },
  { sl: '04', school: 'Windsor Park High School', photo: null, teacher: 'Emily Clark', department: 'History', rating: 5, comment: 'Outstanding dedication and support for students.', student: 'Diana Prince' },
  { sl: '05', school: 'Windsor Park High School', photo: null, teacher: 'Michael Brown', department: 'Physics', rating: 4, comment: 'Clear explanations and always available.', student: 'Ethan Hunt' },
]

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'photo', label: 'Photo' },
  { key: 'teacher', label: 'Teacher' },
  { key: 'department', label: 'Department' },
  { key: 'rating', label: 'Rating' },
  { key: 'comment', label: 'Comment' },
  { key: 'student', label: 'Student' },
]

const StarDisplay = ({ value }) => (
  <div className="d-flex align-items-center gap-2">
    {[1, 2, 3, 4, 5].map((star) => (
      <i
        key={star}
        className={star <= value ? 'ri-star-fill' : 'ri-star-line'}
        style={{ fontSize: '0.95rem', color: star <= value ? '#f59e0b' : '#d0d5dd' }}
      />
    ))}
  </div>
)

const Rating = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)
  const schoolOptions = useMemo(() => Array.from(new Set(ratings.map((item) => item.school))), [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ratings
    return ratings.filter((r) =>
      [r.school, r.teacher, r.department, r.comment, r.student].join(' ').toLowerCase().includes(q),
    )
  }, [search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((r) => selectedRows.includes(r.sl))

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((r) => r.sl)])])
    else setSelectedRows((prev) => prev.filter((id) => !paginated.some((r) => r.sl === id)))
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Teacher Rating</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Teacher Rating</span>
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
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1" /> Export
                  </span>
                  <span><i className="ri-arrow-down-s-line" /></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
                      <i className="ri-file-3-line" /> PDF
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
                      <i className="ri-file-excel-2-line" /> Excel
                    </button>
                  </li>
                </ul>
              </div>

              {/* Columns */}
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span><i className="ri-arrow-down-s-line" /></span>
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
                placeholder="Search rating..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line" />
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 900 }}>
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
                  {visibleColumns.teacher ? <th scope="col">Teacher</th> : null}
                  {visibleColumns.department ? <th scope="col">Department</th> : null}
                  {visibleColumns.rating ? <th scope="col">Rating</th> : null}
                  {visibleColumns.comment ? <th scope="col">Comment</th> : null}
                  {visibleColumns.student ? <th scope="col">Student</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center py-40 text-secondary-light">
                      No ratings found.
                    </td>
                  </tr>
                ) : paginated.map((row) => (
                  <tr key={row.sl}>
                    <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input type="checkbox" className="form-check-input" checked={selectedRows.includes(row.sl)} onChange={() => handleSelectRow(row.sl)} />
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
                          {row.photo
                            ? <img src={row.photo} alt={row.teacher} className="w-100 h-100 object-fit-cover" />
                            : <i className="ri-user-line text-secondary-light" />}
                        </div>
                      </td>
                    ) : null}
                    {visibleColumns.teacher ? <td className="fw-medium text-primary-light">{row.teacher}</td> : null}
                    {visibleColumns.department ? <td>{row.department}</td> : null}
                    {visibleColumns.rating ? (
                      <td><StarDisplay value={row.rating} /></td>
                    ) : null}
                    {visibleColumns.comment ? (
                      <td style={{ maxWidth: 220 }}>
                        <span
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontSize: '0.875rem',
                          }}
                        >
                          {row.comment}
                        </span>
                      </td>
                    ) : null}
                    {visibleColumns.student ? <td>{row.student}</td> : null}
                    <td>
                      <div className="d-flex align-items-center gap-10">
                        <button
                          type="button"
                          className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                          title="Delete"
                        >
                          <i className="ri-delete-bin-line" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
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
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

   

    </div>
  )
}

export default Rating

