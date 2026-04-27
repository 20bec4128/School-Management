import { useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const waitingApplicationData = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    academicYear: '2024-2025',
    applicantType: 'Student',
    leaveType: 'Sick Leave',
    applicant: 'Alice Johnson',
    status: 'Pending',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    academicYear: '2024-2025',
    applicantType: 'Student',
    leaveType: 'Casual Leave',
    applicant: 'Bob Smith',
    status: 'Pending',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    academicYear: '2024-2025',
    applicantType: 'Teacher',
    leaveType: 'Sick Leave',
    applicant: 'Prof. James Wilson',
    status: 'Pending',
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    academicYear: '2025-2026',
    applicantType: 'Staff',
    leaveType: 'Annual Leave',
    applicant: 'Sarah Parker',
    status: 'Pending',
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    academicYear: '2025-2026',
    applicantType: 'Student',
    leaveType: 'Medical Leave',
    applicant: 'Emma Davis',
    status: 'Pending',
  },
]

const emptyFilters = {
  school: 'Select',
  academicYear: 'Select',
  applicantType: 'Select',
  leaveType: 'Select',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'academicYear', label: 'Academic Year' },
  { key: 'applicantType', label: 'Applicant Type' },
  { key: 'leaveType', label: 'Leave Type' },
  { key: 'applicant', label: 'Applicant' },
]

const getStatusBadge = (status) => {
  if (status === 'Pending') {
    return <span className="bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm">Pending</span>
  }
  if (status === 'Approved') {
    return <span className="bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm">Approved</span>
  }
  if (status === 'Rejected') {
    return <span className="bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm">Rejected</span>
  }
  return <span className="bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm">{status}</span>
}

const WaitingApplication = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(
    () => Array.from(new Set(waitingApplicationData.map((item) => item.school))),
    [],
  )
  const academicYearOptions = useMemo(
    () => Array.from(new Set(waitingApplicationData.map((item) => item.academicYear))),
    [],
  )
  const applicantTypeOptions = useMemo(
    () => Array.from(new Set(waitingApplicationData.map((item) => item.applicantType))),
    [],
  )
  const leaveTypeOptions = useMemo(
    () => Array.from(new Set(waitingApplicationData.map((item) => item.leaveType))),
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return waitingApplicationData.filter((row) => {
      const matchesSearch =
        !q ||
        [row.school, row.academicYear, row.applicantType, row.leaveType, row.applicant]
          .join(' ')
          .toLowerCase()
          .includes(q)

      const matchesSchool = filters.school === 'Select' || row.school === filters.school
      const matchesAcademicYear = filters.academicYear === 'Select' || row.academicYear === filters.academicYear
      const matchesApplicantType = filters.applicantType === 'Select' || row.applicantType === filters.applicantType
      const matchesLeaveType = filters.leaveType === 'Select' || row.leaveType === filters.leaveType

      return matchesSearch && matchesSchool && matchesAcademicYear && matchesApplicantType && matchesLeaveType
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

  const handleApprove = (sl) => {
    console.log('Approve application:', sl)
  }

  const handleReject = (sl) => {
    console.log('Reject application:', sl)
  }

  const handleViewDetails = (row) => {
    console.log('View details:', row)
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Waiting Application</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Waiting Application</span>
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
                placeholder="Search waiting applications..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1000 }}>
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
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.academicYear ? <th scope="col">Academic Year</th> : null}
                  {visibleColumns.applicantType ? <th scope="col">Applicant Type</th> : null}
                  {visibleColumns.leaveType ? <th scope="col">Leave Type</th> : null}
                  {visibleColumns.applicant ? <th scope="col">Applicant</th> : null}
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 2}
                      className="text-center py-40 text-secondary-light"
                    >
                      No waiting applications found.
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
                      {visibleColumns.school ? (
                        <td className="fw-medium text-primary-light">{row.school}</td>
                      ) : null}
                      {visibleColumns.academicYear ? <td>{row.academicYear}</td> : null}
                      {visibleColumns.applicantType ? <td>{row.applicantType}</td> : null}
                      {visibleColumns.leaveType ? <td>{row.leaveType}</td> : null}
                      {visibleColumns.applicant ? <td className="fw-medium">{row.applicant}</td> : null}
                      <td>{getStatusBadge(row.status)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-success-focus bg-hover-success-200 text-success-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => handleApprove(row.sl)}
                            title="Approve"
                          >
                            <i className="ri-check-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => handleReject(row.sl)}
                            title="Reject"
                          >
                            <i className="ri-close-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => handleViewDetails(row)}
                            title="View Details"
                          >
                            <i className="ri-eye-line"></i>
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
        title="Filter Waiting Application"
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
              <option value="Select">Select School</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="academicYear"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Academic Year
            </label>
            <select
              id="academicYear"
              className="form-control form-select"
              value={pendingFilters.academicYear}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Academic Year</option>
              {academicYearOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="applicantType"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Applicant Type
            </label>
            <select
              id="applicantType"
              className="form-control form-select"
              value={pendingFilters.applicantType}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Applicant Type</option>
              {applicantTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="leaveType"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Leave Type
            </label>
            <select
              id="leaveType"
              className="form-control form-select"
              value={pendingFilters.leaveType}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Leave Type</option>
              {leaveTypeOptions.map((option) => (
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

export default WaitingApplication
