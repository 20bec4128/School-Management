import { useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const salaryPayments = [
  {
    sl: '01',
    photo: null,
    name: 'John Smith',
    month: 'January 2024',
    gradeName: 'Grade A',
    salaryType: 'Monthly',
    totalAllowance: '$500',
    totalDeduction: '$100',
    grossSalary: '$5500',
    netSalary: '$5400',
  },
  {
    sl: '02',
    photo: null,
    name: 'Sarah Johnson',
    month: 'January 2024',
    gradeName: 'Grade B',
    salaryType: 'Monthly',
    totalAllowance: '$400',
    totalDeduction: '$80',
    grossSalary: '$4400',
    netSalary: '$4320',
  },
  {
    sl: '03',
    photo: null,
    name: 'David Lee',
    month: 'February 2024',
    gradeName: 'Grade C',
    salaryType: 'Hourly',
    totalAllowance: '$150',
    totalDeduction: '$30',
    grossSalary: '$2150',
    netSalary: '$2120',
  },
  {
    sl: '04',
    photo: null,
    name: 'Emily Clark',
    month: 'February 2024',
    gradeName: 'Grade A',
    salaryType: 'Monthly',
    totalAllowance: '$550',
    totalDeduction: '$120',
    grossSalary: '$5550',
    netSalary: '$5430',
  },
  {
    sl: '05',
    photo: null,
    name: 'Michael Brown',
    month: 'March 2024',
    gradeName: 'Grade B',
    salaryType: 'Monthly',
    totalAllowance: '$400',
    totalDeduction: '$80',
    grossSalary: '$4400',
    netSalary: '$4320',
  },
]

const emptyFilters = {
  month: 'All',
  gradeName: 'All',
  salaryType: 'All',
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

const SalaryPayment = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const monthOptions = useMemo(
    () => Array.from(new Set(salaryPayments.map((item) => item.month))),
    []
  )
  const gradeNameOptions = useMemo(
    () => Array.from(new Set(salaryPayments.map((item) => item.gradeName))),
    []
  )
  const salaryTypeOptions = useMemo(
    () => Array.from(new Set(salaryPayments.map((item) => item.salaryType))),
    []
  )

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase()
    return salaryPayments.filter((row) => {
      const matchesSearch =
        !q ||
        [row.name, row.month, row.gradeName, row.salaryType]
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesMonth = filters.month === 'All' || row.month === filters.month
      const matchesGrade = filters.gradeName === 'All' || row.gradeName === filters.gradeName
      const matchesType = filters.salaryType === 'All' || row.salaryType === filters.salaryType

      return matchesSearch && matchesMonth && matchesGrade && matchesType
    })
  }, [search, filters])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredData.slice(start, start + rowsPerPage)
  }, [currentPage, filteredData, rowsPerPage])

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows(paginatedData.map((r) => r.sl))
    else setSelectedRows([])
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    )
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters({ ...pendingFilters })
    setIsFilterSidebarOpen(false)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setIsFilterSidebarOpen(false)
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Salary Payment</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Salary Payment</span>
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
                placeholder="Search..."
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
                        className="form-check-input"
                        type="checkbox"
                        checked={
                          selectedRows.length === paginatedData.length &&
                          paginatedData.length > 0
                        }
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
                {paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 1}
                      className="text-center py-40 text-secondary-light"
                    >
                      No records found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
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
                      {visibleColumns.name ? (
                        <td className="fw-medium text-primary-light">{row.name}</td>
                      ) : null}
                      {visibleColumns.month ? <td>{row.month}</td> : null}
                      {visibleColumns.gradeName ? <td>{row.gradeName}</td> : null}
                      {visibleColumns.salaryType ? <td>{row.salaryType}</td> : null}
                      {visibleColumns.totalAllowance ? <td>{row.totalAllowance}</td> : null}
                      {visibleColumns.totalDeduction ? <td>{row.totalDeduction}</td> : null}
                      {visibleColumns.grossSalary ? (
                        <td className="fw-semibold">{row.grossSalary}</td>
                      ) : null}
                      {visibleColumns.netSalary ? (
                        <td className="fw-semibold text-primary-600">{row.netSalary}</td>
                      ) : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            title="View"
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
              Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}
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
        onClose={() => setIsFilterSidebarOpen(false)}
        title="Filter Salary Payment"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
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
              <option value="All">All Months</option>
              {monthOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
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
              <option value="All">All Grades</option>
              {gradeNameOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
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
              <option value="All">All Types</option>
              {salaryTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
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

export default SalaryPayment