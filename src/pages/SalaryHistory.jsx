import { useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const salaryHistoryData = [
  {
    sl: '01',
    photo: null,
    name: 'Alice Johnson',
    month: 'January 2024',
    gradeName: 'Grade A',
    salaryType: 'Monthly',
    totalAllowance: 15000,
    totalDeduction: 5000,
    grossSalary: 65000,
    netSalary: 60000,
  },
  {
    sl: '02',
    photo: null,
    name: 'Bob Smith',
    month: 'January 2024',
    gradeName: 'Grade B',
    salaryType: 'Monthly',
    totalAllowance: 12000,
    totalDeduction: 4000,
    grossSalary: 52000,
    netSalary: 48000,
  },
  {
    sl: '03',
    photo: null,
    name: 'Charlie Davis',
    month: 'February 2024',
    gradeName: 'Grade A',
    salaryType: 'Monthly',
    totalAllowance: 15000,
    totalDeduction: 5000,
    grossSalary: 65000,
    netSalary: 60000,
  },
  {
    sl: '04',
    photo: null,
    name: 'Diana Wilson',
    month: 'February 2024',
    gradeName: 'Grade C',
    salaryType: 'Hourly',
    totalAllowance: 9000,
    totalDeduction: 3000,
    grossSalary: 39000,
    netSalary: 36000,
  },
  {
    sl: '05',
    photo: null,
    name: 'Ethan Brown',
    month: 'March 2024',
    gradeName: 'Grade B',
    salaryType: 'Monthly',
    totalAllowance: 12000,
    totalDeduction: 4000,
    grossSalary: 52000,
    netSalary: 48000,
  },
]

const emptyFilters = {
  school: 'Select',
  month: 'Select',
  gradeName: 'Select',
  salaryType: 'Select',
}

const columnOptions = [
  { key: 'photo', label: 'Photo' },
  { key: 'name', label: 'Name' },
  { key: 'month', label: 'Month' },
  { key: 'gradeName', label: 'Grade Name' },
  { key: 'salaryType', label: 'Salary Type' },
  { key: 'totalAllowance', label: 'Total Allowance' },
  { key: 'totalDeduction', label: 'Total Deduction' },
  { key: 'grossSalary', label: 'Gross Salary' },
  { key: 'netSalary', label: 'Net Salary' },
]

const SalaryHistory = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(
    () => ['Windsor Park High School', 'Riverside Academy', 'Sunrise Public School'],
    [],
  )
  const monthOptions = useMemo(
    () => ['January 2024', 'February 2024', 'March 2024', 'April 2024', 'May 2024', 'June 2024'],
    [],
  )
  const gradeNameOptions = useMemo(
    () => ['Grade A', 'Grade B', 'Grade C', 'Grade D', 'Grade E'],
    [],
  )
  const salaryTypeOptions = useMemo(() => ['Monthly', 'Hourly', 'Contractual'], [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return salaryHistoryData.filter((row) => {
      const matchesSearch =
        !q ||
        [row.name, row.month, row.gradeName, row.salaryType]
          .join(' ')
          .toLowerCase()
          .includes(q)

      const matchesMonth = filters.month === 'Select' || row.month === filters.month
      const matchesGradeName = filters.gradeName === 'Select' || row.gradeName === filters.gradeName
      const matchesSalaryType = filters.salaryType === 'Select' || row.salaryType === filters.salaryType

      return matchesSearch && matchesMonth && matchesGradeName && matchesSalaryType
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

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Salary History</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Salary History</span>
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
                placeholder="Search salary history..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1200 }}>
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
                  {visibleColumns.photo ? <th scope="col">Photo</th> : null}
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.month ? <th scope="col">Month</th> : null}
                  {visibleColumns.gradeName ? <th scope="col">Grade Name</th> : null}
                  {visibleColumns.salaryType ? <th scope="col">Salary Type</th> : null}
                  {visibleColumns.totalAllowance ? <th scope="col">Total Allowance</th> : null}
                  {visibleColumns.totalDeduction ? <th scope="col">Total Deduction</th> : null}
                  {visibleColumns.grossSalary ? <th scope="col">Gross Salary</th> : null}
                  {visibleColumns.netSalary ? <th scope="col">Net Salary</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 1}
                      className="text-center py-40 text-secondary-light"
                    >
                      No salary history records found.
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
                      {visibleColumns.name ? <td className="fw-medium">{row.name}</td> : null}
                      {visibleColumns.month ? <td className="fw-medium text-primary-light">{row.month}</td> : null}
                      {visibleColumns.gradeName ? <td>{row.gradeName}</td> : null}
                      {visibleColumns.salaryType ? (
                        <td>
                          <span className="bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm">
                            {row.salaryType}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.totalAllowance ? (
                        <td className="text-end fw-semibold">₹{row.totalAllowance.toLocaleString()}</td>
                      ) : null}
                      {visibleColumns.totalDeduction ? (
                        <td className="text-end text-danger-600">-₹{row.totalDeduction.toLocaleString()}</td>
                      ) : null}
                      {visibleColumns.grossSalary ? (
                        <td className="text-end fw-semibold">₹{row.grossSalary.toLocaleString()}</td>
                      ) : null}
                      {visibleColumns.netSalary ? (
                        <td className="text-end fw-semibold text-success-600">₹{row.netSalary.toLocaleString()}</td>
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
        title="Filter Salary History"
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
              htmlFor="month"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Month
            </label>
            <select
              id="month"
              className="form-control form-select"
              value={pendingFilters.month}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Month</option>
              {monthOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="gradeName"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Grade Name
            </label>
            <select
              id="gradeName"
              className="form-control form-select"
              value={pendingFilters.gradeName}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Grade Name</option>
              {gradeNameOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="salaryType"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Salary Type
            </label>
            <select
              id="salaryType"
              className="form-control form-select"
              value={pendingFilters.salaryType}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Salary Type</option>
              {salaryTypeOptions.map((option) => (
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

export default SalaryHistory
