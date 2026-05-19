import React, { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import { TablePagination } from '../components/table'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { createSubscriptionPlan, deleteSubscriptionPlan, fetchSubscriptionPlansPage, updateSubscriptionPlan } from '../apis/subscriptionPlansApi'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-subscription-plan-row'

const STEPS = ['Plan Details']

const emptyForm = {
  planName: '',
  price: '',
  studentLimit: '',
  guardianLimit: '',
  teacherLimit: '',
  employeeLimit: '',
  status: 'Active',
}

const emptyFilters = { status: 'Select' }

const FIELD_ICONS = {
  'Plan Name': 'ri-medal-line',
  Price: 'ri-money-dollar-circle-line',
  'Student Limit': 'ri-user-star-line',
  'Guardian Limit': 'ri-parent-line',
  'Teacher Limit': 'ri-user-voice-line',
  'Employee Limit': 'ri-team-line',
  Status: 'ri-toggle-line',
}

const columnOptions = [
  { key: 'planName', label: 'Plan Name' },
  { key: 'price', label: 'Price' },
  { key: 'studentLimit', label: 'Student Limit' },
  { key: 'guardianLimit', label: 'Guardian Limit' },
  { key: 'teacherLimit', label: 'Teacher Limit' },
  { key: 'employeeLimit', label: 'Employee Limit' },
  { key: 'status', label: 'Status' },
]

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">{label} {required && <span className="text-danger-600">*</span>}</label>
      <div className="avm-input-with-icon" style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#667085', zIndex: 1 }}>
          <i className={icon} />
        </span>
        {children}
      </div>
    </div>
  )
}

const SubscriptionPlan = () => {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [filters, setFilters] = useState(emptyFilters)
  const [selectedRows, setSelectedRows] = useState([])
  const [editingId, setEditingId] = useState(null)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const loadRows = async () => {
    const result = await fetchSubscriptionPlansPage({
      status: filters.status !== 'Select' ? filters.status : undefined,
      search,
      page: currentPage - 1,
      size: rowsPerPage,
    })
    setRows(Array.isArray(result?.content) ? result.content : [])
    setTotalElements(Number(result?.totalElements ?? 0))
    setTotalPages(Number(result?.totalPages ?? 1) || 1)
  }

  useEffect(() => { void loadRows() // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, search, filters.status])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const filteredData = rows

  const paginatedData = useMemo(() => filteredData, [filteredData])

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const openAdd = () => {
    setEditingId(null)
    setFormData(emptyForm)
    setIsModalOpen(true)
  }

  const handleExportExcel = async () => {
    const ws = XLSX.utils.json_to_sheet(filteredData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'SubscriptionPlans')
    XLSX.writeFile(wb, 'Subscription_Plan_List.xlsx')
  }

  const handleSave = async () => {
    const payload = {
      planName: formData.planName.trim(),
      price: formData.price === '' ? null : Number(formData.price),
      studentLimit: formData.studentLimit.trim(),
      guardianLimit: formData.guardianLimit.trim(),
      teacherLimit: formData.teacherLimit.trim(),
      employeeLimit: formData.employeeLimit.trim(),
      status: formData.status,
    }
    if (!payload.planName) return alert('Plan name is required')
    if (editingId) {
      await updateSubscriptionPlan(editingId, payload)
    } else {
      await createSubscriptionPlan(payload)
    }
    setIsModalOpen(false)
    await loadRows()
  }

  const handleEdit = (row) => {
    sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row))
    setEditingId(row.id)
    setFormData({
      planName: row.planName || '',
      price: row.price != null ? String(row.price) : '',
      studentLimit: row.studentLimit || '',
      guardianLimit: row.guardianLimit || '',
      teacherLimit: row.teacherLimit || '',
      employeeLimit: row.employeeLimit || '',
      status: row.status || 'Active',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete subscription plan "${row.planName}"?`)) return
    await deleteSubscriptionPlan(row.id)
    await loadRows()
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Subscription Plan</h1>
          <span className="text-secondary-light">Subscription / Plan Management</span>
        </div>
        <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <i className="ri-add-large-line" /> Add Plan
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={handleExportExcel} />
              <button className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" onClick={() => setIsFilterOpen(true)}>
                <span className="text-secondary-light text-sm">Find</span><i className="ri-arrow-right-line" />
              </button>
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown">
                  <span className="text-secondary-light text-sm">Columns</span><i className="ri-arrow-down-s-line" />
                </button>
                <ul className="dropdown-menu p-12 border shadow">
                  {columnOptions.map((col) => (
                    <li key={col.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input type="checkbox" className="form-check-input mt-0" checked={visibleColumns[col.key]} onChange={() => toggleColumn(col.key)} />
                        {col.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
              <RowsPerPageSelect
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(next) => {
                  setRowsPerPage(next)
                  setCurrentPage(1)
                }}
              />
            </div>
            <div className="position-relative">
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light"><i className="ri-search-line" /></span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table">
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" />
                      <label className="form-check-label">#SL</label>
                    </div>
                  </th>
                  {columnOptions.map((col) => visibleColumns[col.key] && <th key={col.key}>{col.label}</th>)}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">No records found.</td></tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr key={row.id ?? idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input type="checkbox" className="form-check-input" checked={selectedRows.includes(row.id)} onChange={() => setSelectedRows((prev) => prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id])} />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {columnOptions.map((col) => visibleColumns[col.key] && (
                        <td key={col.key}>
                          {col.key === 'status' ? (
                            <span className={`px-12 py-4 radius-4 fw-medium text-sm ${row[col.key] === 'Active' ? 'bg-success-100 text-success-600' : 'bg-danger-100 text-danger-600'}`}>
                              {row[col.key]}
                            </span>
                          ) : col.key === 'planName' ? (
                            <span className="fw-medium text-primary-light">{row[col.key]}</span>
                          ) : row[col.key]}
                        </td>
                      ))}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button type="button" className="text-info-600 bg-info-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0" onClick={() => handleEdit(row)}><i className="ri-edit-line" /></button>
                          <button type="button" className="text-danger-600 bg-danger-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0" onClick={() => handleDelete(row)}><i className="ri-delete-bin-line" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-20 py-16 border-top border-neutral-200">
            <TablePagination
              paginationProps={{
                currentPage,
                totalPages,
                pageInfo: `Showing ${totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, totalElements)} of ${totalElements} entries`,
                onPageChange: (next) => setCurrentPage(Math.min(Math.max(1, Number(next) || 1), totalPages)),
              }}
            />
          </div>
        </div>
      </div>

      <WizardPopup
        modalWidth="700px"
        open={isModalOpen}
        title={editingId ? 'Edit Plan' : 'Add Plan'}
        steps={STEPS}
        step={0}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        submitLabel={editingId ? 'Update' : 'Save'}
      >
        <div className="avm-grid">
          <FormField label="Plan Name" required full>
            <input type="text" className="avm-input" id="planName" placeholder="Enter plan name" value={formData.planName} onChange={handleInputChange} />
          </FormField>
          <FormField label="Price" required>
            <input type="number" className="avm-input" id="price" placeholder="Enter price" value={formData.price} onChange={handleInputChange} />
          </FormField>
          <FormField label="Student Limit" required>
            <input type="text" className="avm-input" id="studentLimit" placeholder="Enter student limit" value={formData.studentLimit} onChange={handleInputChange} />
          </FormField>
          <FormField label="Guardian Limit" required>
            <input type="text" className="avm-input" id="guardianLimit" placeholder="Enter guardian limit" value={formData.guardianLimit} onChange={handleInputChange} />
          </FormField>
          <FormField label="Teacher Limit" required>
            <input type="text" className="avm-input" id="teacherLimit" placeholder="Enter teacher limit" value={formData.teacherLimit} onChange={handleInputChange} />
          </FormField>
          <FormField label="Employee Limit" required>
            <input type="text" className="avm-input" id="employeeLimit" placeholder="Enter employee limit" value={formData.employeeLimit} onChange={handleInputChange} />
          </FormField>
          <FormField label="Status" required>
            <select className="avm-input form-select" id="status" value={formData.status} onChange={handleInputChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </FormField>
        </div>
      </WizardPopup>

      <SlideSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Find Plan">
        <form className="p-20 d-grid gap-16" onSubmit={(e) => { e.preventDefault(); setIsFilterOpen(false); setCurrentPage(1); }}>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Status</label>
            <select className="form-control form-select" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
              <option value="Select">--Select Status--</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary-600 w-100">Apply Filter</button>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default SubscriptionPlan
