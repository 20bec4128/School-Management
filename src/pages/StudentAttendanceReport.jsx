import { useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const emptyFilters = {
  school: 'Select',
  academicYear: 'Select',
  className: 'Select',
  section: 'Select',
  month: 'Select',
}

// Generating 1-31 date columns
const dateColumns = Array.from({ length: 31 }, (_, i) => ({
  key: `day_${i + 1}`,
  label: `${i + 1}`,
}))

const columnOptions = [
  { key: 'studentName', label: 'Student' },
  ...dateColumns,
]

const StudentAttendanceReport = () => {
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((row) => {
      const matchesSearch =
        !q || Object.values(row).some((v) => String(v).toLowerCase().includes(q))
      
      const matchesSchool = filters.school === 'Select' || row.school === filters.school
      const matchesClass = filters.className === 'Select' || row.className === filters.className
      const matchesMonth = filters.month === 'Select' || row.month === filters.month

      return matchesSearch && matchesSchool && matchesClass && matchesMonth
    })
  }, [data, search, filters])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    setIsFilterSidebarOpen(false)
    setCurrentPage(1)
  }

  const renderAttendanceTag = (status) => {
    const statusMap = {
      P: { class: 'bg-success-100 text-success-600', label: 'P' },
      A: { class: 'bg-danger-100 text-danger-600', label: 'A' },
      L: { class: 'bg-warning-100 text-warning-600', label: 'L' },
      H: { class: 'bg-info-100 text-info-600', label: 'H' },
    }
    const current = statusMap[status] || { class: 'text-secondary-light', label: '-' }
    return (
      <span className={`d-flex align-items-center justify-content-center radius-4 fw-bold text-xs`} style={{ width: '24px', height: '24px', ... (status ? {} : {border: '1px dashed #e3e6e9'}) }}>
        <span className={current.class} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
          {current.label}
        </span>
      </span>
    )
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Student Attendance Report</h1>
          <span className="text-secondary-light">Dashboard / Attendance Report</span>
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
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1"></i> Export
                  </span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li><button className="dropdown-item px-16 py-8 rounded text-secondary-light d-flex align-items-center gap-10"><i className="ri-file-text-line"></i> CSV</button></li>
                  <li><button className="dropdown-item px-16 py-8 rounded text-secondary-light d-flex align-items-center gap-10"><i className="ri-file-excel-2-line"></i> Excel</button></li>
                  <li><button className="dropdown-item px-16 py-8 rounded text-secondary-light d-flex align-items-center gap-10"><i className="ri-file-3-line"></i> PDF</button></li>
                </ul>
              </div>

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search student..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table attendance-table" style={{ minWidth: 1500 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 2 }}>
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  <th scope="col" style={{ position: 'sticky', left: '70px', background: '#fff', zIndex: 2, minWidth: '180px' }}>Student Name</th>
                  {dateColumns.map((col) => (
                    <th scope="col" key={col.key} className="text-center" style={{ minWidth: '40px' }}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={33} className="text-center py-40 text-secondary-light">No attendance records found.</td>
                  </tr>
                ) : (
                  paginated.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      <td style={{ position: 'sticky', left: '70px', background: '#fff', zIndex: 1 }} className="fw-medium text-primary-light">
                        {row.studentName || 'Student ' + (idx + 1)}
                      </td>
                      {dateColumns.map((dateCol) => (
                        <td key={dateCol.key} className="text-center">
                          {renderAttendanceTag(row[dateCol.key])}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} –{' '}
              {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, currentPage - 2), currentPage + 1)
                .map((p) => (
                  <button key={p} type="button" className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'} onClick={() => setCurrentPage(p)}>{p}</button>
                ))}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter Attendance" onClose={() => setIsFilterSidebarOpen(false)}>
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
            <select className="form-control form-select" value={pendingFilters.school} onChange={(e) => setPendingFilters(p => ({ ...p, school: e.target.value }))}>
              <option value="Select">All Schools</option>
              <option>Windsor Park High School</option>
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Class</label>
            <select className="form-control form-select" value={pendingFilters.className} onChange={(e) => setPendingFilters(p => ({ ...p, className: e.target.value }))}>
              <option value="Select">Select Class</option>
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Month</label>
            <select className="form-control form-select" value={pendingFilters.month} onChange={(e) => setPendingFilters(p => ({ ...p, month: e.target.value }))}>
              <option value="Select">Select Month</option>
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="d-flex gap-8 mt-12">
            <button type="button" className="btn btn-danger-200 text-danger-600 w-100" onClick={() => setPendingFilters(emptyFilters)}>Reset</button>
            <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
          </div>
        </form>
      </SlideSidebar>

      <style dangerouslySetInnerHTML={{ __html: `
        .attendance-table th, .attendance-table td {
          padding: 10px 8px !important;
          vertical-align: middle;
          border-right: 1px solid #edeff2;
        }
        .attendance-table thead th {
          background-color: #f8fafc;
        }
      `}} />
    </div>
  )
}

export default StudentAttendanceReport