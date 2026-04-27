import { useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const salaryGradeData = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    gradeName: 'Grade A',
    basicSalary: 50000,
    hourlyRate: 500,
    grossSalary: 65000,
    netSalary: 58000,
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    gradeName: 'Grade B',
    basicSalary: 40000,
    hourlyRate: 400,
    grossSalary: 52000,
    netSalary: 46500,
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    gradeName: 'Grade C',
    basicSalary: 30000,
    hourlyRate: 300,
    grossSalary: 39000,
    netSalary: 35000,
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    gradeName: 'Grade D',
    basicSalary: 25000,
    hourlyRate: 250,
    grossSalary: 32500,
    netSalary: 29250,
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    gradeName: 'Grade E',
    basicSalary: 20000,
    hourlyRate: 200,
    grossSalary: 26000,
    netSalary: 23400,
  },
]

const emptyForm = {
  school: '',
  gradeName: '',
  basicSalary: '',
  houseRent: '',
  transportAllowance: '',
  medicalAllowance: '',
  overTimeHourlyRate: '',
  providentFund: '',
  hourlyRate: '',
  totalAllowance: 0,
  totalDeduction: 0,
  grossSalary: 0,
  netSalary: 0,
  note: '',
}

const emptyFilters = {
  school: 'Select',
  gradeName: 'Select',
}

const STEPS = ['Basic Information', 'Allowances', 'Salary Summary']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Grade Name': 'ri-medal-line',
  'Basic Salary': 'ri-coin-line',
  'House Rent': 'ri-home-line',
  'Transport Allowance': 'ri-bus-line',
  'Medical Allowance': 'ri-heart-pulse-line',
  'Over Time Hourly Rate': 'ri-time-line',
  'Provident Fund': 'ri-funds-line',
  'Hourly Rate': 'ri-calculator-line',
  'Total Allowance': 'ri-add-circle-line',
  'Total Deduction': 'ri-subtract-line',
  'Gross Salary': 'ri-bank-card-line',
  'Net Salary': 'ri-wallet-line',
  Note: 'ri-file-text-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'gradeName', label: 'Grade Name' },
  { key: 'basicSalary', label: 'Basic Salary' },
  { key: 'hourlyRate', label: 'Hourly Rate' },
  { key: 'grossSalary', label: 'Gross Salary' },
  { key: 'netSalary', label: 'Net Salary' },
]

const FormField = ({ label, required, children, full = false, noIcon = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
      {!noIcon ? (
        <div className="avm-input-with-icon" style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#667085',
              fontSize: '0.95rem',
              lineHeight: 1,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <i className={icon}></i>
          </span>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

const SalaryGrade = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(
    () => Array.from(new Set(salaryGradeData.map((item) => item.school))),
    [],
  )
  const gradeNameOptions = useMemo(
    () => Array.from(new Set(salaryGradeData.map((item) => item.gradeName))),
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return salaryGradeData.filter((row) => {
      const matchesSearch =
        !q ||
        [row.school, row.gradeName, String(row.basicSalary), String(row.grossSalary), String(row.netSalary)]
          .join(' ')
          .toLowerCase()
          .includes(q)

      const matchesSchool = filters.school === 'Select' || row.school === filters.school
      const matchesGradeName = filters.gradeName === 'Select' || row.gradeName === filters.gradeName

      return matchesSearch && matchesSchool && matchesGradeName
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

  const calculateTotals = (formData) => {
    const basicSalary = parseFloat(formData.basicSalary) || 0
    const houseRent = parseFloat(formData.houseRent) || 0
    const transportAllowance = parseFloat(formData.transportAllowance) || 0
    const medicalAllowance = parseFloat(formData.medicalAllowance) || 0
    const overTimeHourlyRate = parseFloat(formData.overTimeHourlyRate) || 0
    const providentFund = parseFloat(formData.providentFund) || 0
    
    const totalAllowance = houseRent + transportAllowance + medicalAllowance + overTimeHourlyRate
    const totalDeduction = providentFund
    const grossSalary = basicSalary + totalAllowance
    const netSalary = grossSalary - totalDeduction

    return {
      totalAllowance,
      totalDeduction,
      grossSalary,
      netSalary,
    }
  }

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => {
      const updated = { ...prev, [id]: value }
      const totals = calculateTotals(updated)
      return {
        ...updated,
        totalAllowance: totals.totalAllowance,
        totalDeduction: totals.totalDeduction,
        grossSalary: totals.grossSalary,
        netSalary: totals.netSalary,
      }
    })
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

  const openAdd = () => {
    setAddForm(emptyForm)
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditForm({
      school: row.school,
      gradeName: row.gradeName,
      basicSalary: row.basicSalary,
      houseRent: '',
      transportAllowance: '',
      medicalAllowance: '',
      overTimeHourlyRate: '',
      providentFund: '',
      hourlyRate: row.hourlyRate,
      totalAllowance: 0,
      totalDeduction: 0,
      grossSalary: row.grossSalary,
      netSalary: row.netSalary,
      note: '',
    })
    setEditStep(0)
    setIsEditOpen(true)
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  const renderForm = (form, setter, step) => {
    return (
      <>
        {step === 0 && (
          <>
            <p className="avm-section-title">{STEPS[0]}</p>
            <div className="avm-grid">
              <FormField label="School Name" required full>
                <select
                  className="avm-select"
                  id="school"
                  value={form.school}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select School--</option>
                  {schoolOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Grade Name" required full>
                <input
                  type="text"
                  className="avm-input"
                  id="gradeName"
                  placeholder="Enter grade name"
                  value={form.gradeName}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Basic Salary" required>
                <input
                  type="number"
                  className="avm-input"
                  id="basicSalary"
                  placeholder="Enter basic salary"
                  value={form.basicSalary}
                  onChange={handleChange(setter)}
                />
              </FormField>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="avm-section-title">{STEPS[1]}</p>
            <div className="avm-grid">
              <FormField label="House Rent">
                <input
                  type="number"
                  className="avm-input"
                  id="houseRent"
                  placeholder="Enter house rent"
                  value={form.houseRent}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Transport Allowance">
                <input
                  type="number"
                  className="avm-input"
                  id="transportAllowance"
                  placeholder="Enter transport allowance"
                  value={form.transportAllowance}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Medical Allowance">
                <input
                  type="number"
                  className="avm-input"
                  id="medicalAllowance"
                  placeholder="Enter medical allowance"
                  value={form.medicalAllowance}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Over Time Hourly Rate">
                <input
                  type="number"
                  className="avm-input"
                  id="overTimeHourlyRate"
                  placeholder="Enter over time hourly rate"
                  value={form.overTimeHourlyRate}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Provident Fund">
                <input
                  type="number"
                  className="avm-input"
                  id="providentFund"
                  placeholder="Enter provident fund"
                  value={form.providentFund}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Hourly Rate" required>
                <input
                  type="number"
                  className="avm-input"
                  id="hourlyRate"
                  placeholder="Enter hourly rate"
                  value={form.hourlyRate}
                  onChange={handleChange(setter)}
                />
              </FormField>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="avm-section-title">{STEPS[2]}</p>
            <div className="avm-grid">
              <div className="avm-field">
                <label className="avm-label">Total Allowance</label>
                <div className="avm-input" style={{ background: '#f8fafc', fontWeight: 600 }}>
                  {form.totalAllowance}
                </div>
              </div>

              <div className="avm-field">
                <label className="avm-label">Total Deduction</label>
                <div className="avm-input" style={{ background: '#f8fafc', fontWeight: 600 }}>
                  {form.totalDeduction}
                </div>
              </div>

              <div className="avm-field">
                <label className="avm-label">Gross Salary</label>
                <div className="avm-input" style={{ background: '#e8f0fe', fontWeight: 600, color: '#45597a' }}>
                  {form.grossSalary}
                </div>
              </div>

              <div className="avm-field">
                <label className="avm-label">Net Salary</label>
                <div className="avm-input" style={{ background: '#e8f0fe', fontWeight: 600, color: '#45597a' }}>
                  {form.netSalary}
                </div>
              </div>

              <FormField label="Note" full noIcon>
                <textarea
                  rows="3"
                  className="avm-input avm-textarea"
                  id="note"
                  placeholder="Enter note (optional)"
                  value={form.note}
                  onChange={handleChange(setter)}
                />
              </FormField>
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Salary Grade</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Salary Grade</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={openAdd}
        >
          <span className="d-flex text-md">
            <i className="ri-add-large-line"></i>
          </span>
          Add Salary Grade
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
                placeholder="Search salary grade..."
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
                  {visibleColumns.gradeName ? <th scope="col">Grade Name</th> : null}
                  {visibleColumns.basicSalary ? <th scope="col">Basic Salary</th> : null}
                  {visibleColumns.hourlyRate ? <th scope="col">Hourly Rate</th> : null}
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
                      No salary grade records found.
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
                      {visibleColumns.gradeName ? <td className="fw-medium">{row.gradeName}</td> : null}
                      {visibleColumns.basicSalary ? (
                        <td className="text-end fw-semibold">â‚¹{row.basicSalary.toLocaleString()}</td>
                      ) : null}
                      {visibleColumns.hourlyRate ? (
                        <td className="text-end">â‚¹{row.hourlyRate}</td>
                      ) : null}
                      {visibleColumns.grossSalary ? (
                        <td className="text-end fw-semibold text-primary-light">â‚¹{row.grossSalary.toLocaleString()}</td>
                      ) : null}
                      {visibleColumns.netSalary ? (
                        <td className="text-end fw-semibold text-success-600">â‚¹{row.netSalary.toLocaleString()}</td>
                      ) : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => openEdit(row)}
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

      <WizardPopup
        modalWidth="620px"
        open={isAddOpen}
        title="Add Salary Grade"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsAddOpen(false)}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm, addStep)}
      </WizardPopup>

      <WizardPopup
        modalWidth="620px"
        open={isEditOpen}
        title="Edit Salary Grade"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsEditOpen(false)}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm, editStep)}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Salary Grade"
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
              <option value="Select">Select Grade Name</option>
              {gradeNameOptions.map((option) => (
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

export default SalaryGrade


