import { useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const feeCollectionData = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    invoiceNumber: 'INV-2024-001',
    studentSaleTo: 'Alice Johnson',
    month: 'January 2024',
    grossAmount: 15000,
    discount: 1500,
    netAmount: 13500,
    dueAmount: 0,
    status: 'Paid',
  },
  {
    sl: '02',
    school: 'Windsor Park High School',
    invoiceNumber: 'INV-2024-002',
    studentSaleTo: 'Bob Smith',
    month: 'January 2024',
    grossAmount: 15000,
    discount: 0,
    netAmount: 15000,
    dueAmount: 5000,
    status: 'Partial',
  },
  {
    sl: '03',
    school: 'Windsor Park High School',
    invoiceNumber: 'INV-2024-003',
    studentSaleTo: 'Charlie Davis',
    month: 'February 2024',
    grossAmount: 15000,
    discount: 1500,
    netAmount: 13500,
    dueAmount: 13500,
    status: 'Unpaid',
  },
  {
    sl: '04',
    school: 'Windsor Park High School',
    invoiceNumber: 'INV-2024-004',
    studentSaleTo: 'Diana Wilson',
    month: 'February 2024',
    grossAmount: 15000,
    discount: 0,
    netAmount: 15000,
    dueAmount: 0,
    status: 'Paid',
  },
  {
    sl: '05',
    school: 'Windsor Park High School',
    invoiceNumber: 'INV-2024-005',
    studentSaleTo: 'Ethan Brown',
    month: 'March 2024',
    grossAmount: 15000,
    discount: 1500,
    netAmount: 13500,
    dueAmount: 2000,
    status: 'Partial',
  },
]

const emptyForm = {
  school: '',
  className: '',
  student: '',
  feeType: '',
  feeAmount: '0.00',
  month: '',
  isApplicableDiscount: '',
  paidStatus: '',
  note: '',
}

const emptyBulkForm = {
  school: '',
  className: '',
  feeType: '',
  feeAmount: '0.00',
  student: '',
  isApplicableDiscount: '',
  month: '',
  paidStatus: '',
  note: '',
}

const emptyFilters = {
  school: 'Select',
  status: 'Select',
  month: 'Select',
}

const INVOICE_STEPS = ['Basic Information', 'Fee Details', 'Payment Details']
const BULK_STEPS = ['Basic Information', 'Fee Details', 'Payment Details']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Class: 'ri-group-line',
  Student: 'ri-user-3-line',
  'Fee Type': 'ri-file-list-line',
  'Fee Amount': 'ri-coin-line',
  Month: 'ri-calendar-line',
  'Is Applicable Discount?': 'ri-discount-line',
  'Paid Status': 'ri-checkbox-circle-line',
  Note: 'ri-file-text-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'invoiceNumber', label: 'Invoice Number' },
  { key: 'studentSaleTo', label: 'Student/Sale To' },
  { key: 'month', label: 'Month' },
  { key: 'grossAmount', label: 'Gross Amount' },
  { key: 'discount', label: 'Discount' },
  { key: 'netAmount', label: 'Net Amount' },
  { key: 'dueAmount', label: 'Due Amount' },
  { key: 'status', label: 'Status' },
]

const feeTypeOptions = ['Tuition Fee', 'Admission Fee', 'Exam Fee', 'Library Fee', 'Sports Fee', 'Transport Fee']
const monthOptions = ['January 2024', 'February 2024', 'March 2024', 'April 2024', 'May 2024', 'June 2024']
const classOptions = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10']
const studentOptions = ['Alice Johnson', 'Bob Smith', 'Charlie Davis', 'Diana Wilson', 'Ethan Brown']
const discountOptions = ['Yes', 'No']
const paidStatusOptions = ['Paid', 'Unpaid', 'Partial']

const getStatusBadge = (status) => {
  if (status === 'Paid') {
    return <span className="bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm">Paid</span>
  }
  if (status === 'Partial') {
    return <span className="bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm">Partial</span>
  }
  return <span className="bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm">Unpaid</span>
}

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

const FeeCollection = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [bulkStep, setBulkStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [addForm, setAddForm] = useState(emptyForm)
  const [bulkForm, setBulkForm] = useState(emptyBulkForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(
    () => ['Windsor Park High School', 'Riverside Academy', 'Sunrise Public School'],
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return feeCollectionData.filter((row) => {
      const matchesSearch =
        !q ||
        [row.school, row.invoiceNumber, row.studentSaleTo, row.month, row.status]
          .join(' ')
          .toLowerCase()
          .includes(q)

      const matchesSchool = filters.school === 'Select' || row.school === filters.school
      const matchesStatus = filters.status === 'Select' || row.status === filters.status
      const matchesMonth = filters.month === 'Select' || row.month === filters.month

      return matchesSearch && matchesSchool && matchesStatus && matchesMonth
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

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({ ...prev, [id]: value }))
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

  const openBulk = () => {
    setBulkForm(emptyBulkForm)
    setBulkStep(0)
    setIsBulkOpen(true)
  }

  const openEdit = (row) => {
    setEditForm({
      school: row.school,
      className: '',
      student: row.studentSaleTo,
      feeType: '',
      feeAmount: row.netAmount,
      month: row.month,
      isApplicableDiscount: row.discount > 0 ? 'Yes' : 'No',
      paidStatus: row.status,
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

  const renderInvoiceForm = (form, setter, step) => {
    return (
      <>
        {step === 0 && (
          <>
            <p className="avm-section-title">{INVOICE_STEPS[0]}</p>
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

              <FormField label="Class" required>
                <select
                  className="avm-select"
                  id="className"
                  value={form.className}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {classOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Student" required>
                <select
                  className="avm-select"
                  id="student"
                  value={form.student}
                  onChange={handleChange(setter)}
                  disabled={!form.className}
                >
                  <option value="">--Select--</option>
                  {studentOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="avm-section-title">{INVOICE_STEPS[1]}</p>
            <div className="avm-grid">
              <FormField label="Fee Type" required>
                <select
                  className="avm-select"
                  id="feeType"
                  value={form.feeType}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {feeTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Fee Amount" required>
                <input
                  type="number"
                  className="avm-input"
                  id="feeAmount"
                  value={form.feeAmount}
                  onChange={handleChange(setter)}
                  step="0.01"
                />
              </FormField>

              <FormField label="Month" required>
                <select
                  className="avm-select"
                  id="month"
                  value={form.month}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {monthOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="avm-section-title">{INVOICE_STEPS[2]}</p>
            <div className="avm-grid">
              <FormField label="Is Applicable Discount?" required>
                <select
                  className="avm-select"
                  id="isApplicableDiscount"
                  value={form.isApplicableDiscount}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {discountOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Paid Status" required>
                <select
                  className="avm-select"
                  id="paidStatus"
                  value={form.paidStatus}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {paidStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

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

  const renderBulkForm = (form, setter, step) => {
    return (
      <>
        {step === 0 && (
          <>
            <p className="avm-section-title">{BULK_STEPS[0]}</p>
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

              <FormField label="Class" required full>
                <select
                  className="avm-select"
                  id="className"
                  value={form.className}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {classOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="avm-section-title">{BULK_STEPS[1]}</p>
            <div className="avm-grid">
              <FormField label="Fee Type" required>
                <select
                  className="avm-select"
                  id="feeType"
                  value={form.feeType}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {feeTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Fee Amount" required>
                <input
                  type="number"
                  className="avm-input"
                  id="feeAmount"
                  value={form.feeAmount}
                  onChange={handleChange(setter)}
                  step="0.01"
                />
              </FormField>

              <FormField label="Month" required>
                <select
                  className="avm-select"
                  id="month"
                  value={form.month}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {monthOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="avm-section-title">{BULK_STEPS[2]}</p>
            <div className="avm-grid">
              <FormField label="Is Applicable Discount?" required>
                <select
                  className="avm-select"
                  id="isApplicableDiscount"
                  value={form.isApplicableDiscount}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {discountOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Paid Status" required>
                <select
                  className="avm-select"
                  id="paidStatus"
                  value={form.paidStatus}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {paidStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Fee Collection</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Fee Collection</span>
          </div>
        </div>
        <div className="d-flex gap-10">
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={openAdd}
          >
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Create Invoice
          </button>
          <button
            type="button"
            className="btn btn-secondary-600 d-flex align-items-center gap-6"
            onClick={openBulk}
          >
            <span className="d-flex text-md">
              <i className="ri-file-copy-line"></i>
            </span>
            Bulk Invoice
          </button>
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
                placeholder="Search fee collection..."
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
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.invoiceNumber ? <th scope="col">Invoice Number</th> : null}
                  {visibleColumns.studentSaleTo ? <th scope="col">Student/Sale To</th> : null}
                  {visibleColumns.month ? <th scope="col">Month</th> : null}
                  {visibleColumns.grossAmount ? <th scope="col">Gross Amount</th> : null}
                  {visibleColumns.discount ? <th scope="col">Discount</th> : null}
                  {visibleColumns.netAmount ? <th scope="col">Net Amount</th> : null}
                  {visibleColumns.dueAmount ? <th scope="col">Due Amount</th> : null}
                  {visibleColumns.status ? <th scope="col">Status</th> : null}
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
                      No fee collection records found.
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
                      {visibleColumns.invoiceNumber ? (
                        <td className="fw-medium">{row.invoiceNumber}</td>
                      ) : null}
                      {visibleColumns.studentSaleTo ? <td className="fw-medium">{row.studentSaleTo}</td> : null}
                      {visibleColumns.month ? <td>{row.month}</td> : null}
                      {visibleColumns.grossAmount ? (
                        <td className="text-end fw-semibold">₹{row.grossAmount.toLocaleString()}</td>
                      ) : null}
                      {visibleColumns.discount ? (
                        <td className="text-end text-danger-600">-₹{row.discount.toLocaleString()}</td>
                      ) : null}
                      {visibleColumns.netAmount ? (
                        <td className="text-end fw-semibold">₹{row.netAmount.toLocaleString()}</td>
                      ) : null}
                      {visibleColumns.dueAmount ? (
                        <td className={`text-end fw-semibold ${row.dueAmount > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                          ₹{row.dueAmount.toLocaleString()}
                        </td>
                      ) : null}
                      {visibleColumns.status ? <td>{getStatusBadge(row.status)}</td> : null}
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

      {/* Create Invoice Modal */}
      <WizardPopup
        modalWidth="620px"
        open={isAddOpen}
        title="Create Invoice"
        steps={INVOICE_STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(INVOICE_STEPS.length - 1, s + 1))}
        onSubmit={() => setIsAddOpen(false)}
        submitLabel="Create Invoice"
      >
        {renderInvoiceForm(addForm, setAddForm, addStep)}
      </WizardPopup>

      {/* Bulk Invoice Modal */}
      <WizardPopup
        modalWidth="620px"
        open={isBulkOpen}
        title="Bulk Invoice"
        steps={BULK_STEPS}
        step={bulkStep}
        onClose={() => setIsBulkOpen(false)}
        onBack={() => setBulkStep((s) => Math.max(0, s - 1))}
        onNext={() => setBulkStep((s) => Math.min(BULK_STEPS.length - 1, s + 1))}
        onSubmit={() => setIsBulkOpen(false)}
        submitLabel="Create Bulk Invoice"
      >
        {renderBulkForm(bulkForm, setBulkForm, bulkStep)}
      </WizardPopup>

      {/* Edit Invoice Modal */}
      <WizardPopup
        modalWidth="620px"
        open={isEditOpen}
        title="Edit Invoice"
        steps={INVOICE_STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(INVOICE_STEPS.length - 1, s + 1))}
        onSubmit={() => setIsEditOpen(false)}
        submitLabel="Update"
      >
        {renderInvoiceForm(editForm, setEditForm, editStep)}
      </WizardPopup>

      {/* Filter Sidebar */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Fee Collection"
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
              htmlFor="status"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Status
            </label>
            <select
              id="status"
              className="form-control form-select"
              value={pendingFilters.status}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Status</option>
              {paidStatusOptions.map((option) => (
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

export default FeeCollection
