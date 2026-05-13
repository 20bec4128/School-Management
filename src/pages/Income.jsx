import { useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const emptyForm = {
  school: '',
  incomeHead: '',
  incomeMethod: '',
  amount: '',
  date: '',
  note: '',
}

const emptyFilters = {
  school: 'Select',
  incomeHead: 'Select',
  incomeMethod: 'Select',
}

const STEPS = ['Basic Information']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Income Head': 'ri-wallet-line',
  'Income Method': 'ri-bank-card-line',
  Amount: 'ri-money-dollar-circle-line',
  Date: 'ri-calendar-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'sessionYear', label: 'Session Year' },
  { key: 'incomeHead', label: 'Income Head' },
  { key: 'amount', label: 'Amount' },
  { key: 'date', label: 'Date' },
]

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
      <div className="avm-input-with-icon" style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: '0.85rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#667085',
            fontSize: '0.95rem',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <i className={icon}></i>
        </span>
        {children}
      </div>
    </div>
  )
}

const Income = () => {
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addForm, setAddForm] = useState(emptyForm)
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
      const matchesHead = filters.incomeHead === 'Select' || row.incomeHead === filters.incomeHead
      const matchesMethod = filters.incomeMethod === 'Select' || row.incomeMethod === filters.incomeMethod

      return matchesSearch && matchesSchool && matchesHead && matchesMethod
    })
  }, [data, search, filters])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setAddForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    setIsFilterSidebarOpen(false)
    setCurrentPage(1)
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Income</h1>
          <span className="text-secondary-light">Dashboard / Income</span>
        </div>
        <button
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={() => {
            setAddForm(emptyForm)
            setIsAddOpen(true)
          }}
        >
          <i className="ri-add-line"></i> Add Income
        </button>
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

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                >
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  {columnOptions.map((col) => (
                    <li key={col.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={visibleColumns[col.key]}
                          onChange={() => toggleColumn(col.key)}
                        />
                        {col.label}
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
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search income..."
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
                      <input type="checkbox" className="form-check-input" />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {columnOptions.map((col) => visibleColumns[col.key] && <th scope="col" key={col.key}>{col.label}</th>)}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {columnOptions.map((col) => visibleColumns[col.key] && <td key={col.key}>{row[col.key] || '--'}</td>)}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button className="bg-info-focus text-info-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle">
                            <i className="ri-edit-line"></i>
                          </button>
                          <button className="bg-danger-focus text-danger-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle">
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
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} –{' '}
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
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, currentPage - 2), currentPage + 1)
                .map((p) => (
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
        </div>
      </div>

      <WizardPopup
        open={isAddOpen}
        title="Add Income"
        steps={STEPS}
        step={0}
        onClose={() => setIsAddOpen(false)}
        onSubmit={() => setIsAddOpen(false)}
        modalWidth="620px"
      >
        <div className="avm-grid">
          <FormField label="School Name" required full>
            <select className="avm-select" id="school" value={addForm.school} onChange={handleInputChange}>
              <option value="">--Select School--</option>
              <option value="Windsor Park High School">Windsor Park High School</option>
            </select>
          </FormField>
          
          <FormField label="Income Head" required>
            <select className="avm-select" id="incomeHead" value={addForm.incomeHead} onChange={handleInputChange}>
              <option value="">--Select--</option>
            </select>
          </FormField>

          <FormField label="Income Method" required>
            <select className="avm-select" id="incomeMethod" value={addForm.incomeMethod} onChange={handleInputChange}>
              <option value="">--Select--</option>
            </select>
          </FormField>

          <FormField label="Amount" required>
            <input
              type="number"
              className="avm-input"
              id="amount"
              placeholder="Enter Amount"
              value={addForm.amount}
              onChange={handleInputChange}
            />
          </FormField>

          <FormField label="Date" required>
            <input
              type="date"
              className="avm-input"
              id="date"
              value={addForm.date}
              onChange={handleInputChange}
            />
          </FormField>

          <FormField label="Note" full>
            <textarea
              className="avm-input avm-textarea"
              id="note"
              rows="3"
              placeholder="Enter Note"
              value={addForm.note}
              onChange={handleInputChange}
            />
          </FormField>
        </div>
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Income"
        onClose={() => setIsFilterSidebarOpen(false)}
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
            <select
              className="form-control form-select"
              value={pendingFilters.school}
              onChange={(e) => setPendingFilters((p) => ({ ...p, school: e.target.value }))}
            >
              <option value="Select">All Schools</option>
              <option value="Windsor Park High School">Windsor Park High School</option>
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Income Head</label>
            <select
              className="form-control form-select"
              value={pendingFilters.incomeHead}
              onChange={(e) => setPendingFilters((p) => ({ ...p, incomeHead: e.target.value }))}
            >
              <option value="Select">All Heads</option>
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Method</label>
            <select
              className="form-control form-select"
              value={pendingFilters.incomeMethod}
              onChange={(e) => setPendingFilters((p) => ({ ...p, incomeMethod: e.target.value }))}
            >
              <option value="Select">All Methods</option>
            </select>
          </div>
          <div className="d-flex gap-8 mt-12">
            <button
              type="button"
              className="btn btn-danger-200 text-danger-600 w-100"
              onClick={() => setPendingFilters(emptyFilters)}
            >
              Reset
            </button>
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default Income