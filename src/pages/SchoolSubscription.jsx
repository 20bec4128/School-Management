import React, { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { TablePagination } from '../components/table'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import {
  createSchoolSubscription,
  deleteSchoolSubscription,
  fetchSchoolSubscriptionsPage,
  updateSchoolSubscription,
} from '../apis/schoolSubscriptionsApi'
import { fetchSubscriptionPlans } from '../apis/subscriptionPlansApi'
import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-school-subscription-row'

const STEPS = ['Subscription Details']

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  planId: '',
  planName: '',
  price: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  startDate: '',
  endDate: '',
  status: 'Active',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: 'Select',
  status: 'Select',
}

const FIELD_ICONS = {
  'Head Office': 'ri-government-line',
  'School Name': 'ri-school-line',
  'Plan': 'ri-medal-line',
  'Plan Name': 'ri-medal-line',
  Price: 'ri-money-dollar-circle-line',
  Name: 'ri-user-line',
  Email: 'ri-mail-line',
  Phone: 'ri-phone-line',
  Address: 'ri-map-pin-line',
  'Start Date': 'ri-calendar-line',
  'End Date': 'ri-calendar-check-line',
  Status: 'ri-toggle-line',
}

const columnOptions = [
  { key: 'schoolName', label: 'School Name' },
  { key: 'planName', label: 'Plan Name' },
  { key: 'price', label: 'Price' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'startDate', label: 'Start Date' },
  { key: 'endDate', label: 'End Date' },
  { key: 'status', label: 'Status' },
]

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label} {required && <span className="text-danger-600">*</span>}
      </label>
      <div className="avm-input-with-icon" style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: '0.85rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#667085',
            zIndex: 1,
          }}
        >
          <i className={icon} />
        </span>
        {children}
      </div>
    </div>
  )
}

const SchoolSubscription = () => {
  const { role, headOfficeId: authHeadOfficeId, schoolId: authSchoolId } = useAuth()
  const normalizedRole = normalizeRole(role)
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = normalizedRole === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = normalizedRole === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [allSchools, setAllSchools] = useState([])
  const [plans, setPlans] = useState([])
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
  const [loading, setLoading] = useState(false)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  useEffect(() => {
    let cancelled = false
    const loadLookups = async () => {
      try {
        const [schoolList, planList] = await Promise.all([fetchSchoolsLookup(), fetchSubscriptionPlans()])
        if (cancelled) return
        setAllSchools(Array.isArray(schoolList) ? schoolList : [])
        setPlans(Array.isArray(planList) ? planList : [])
      } catch {
        if (cancelled) return
        setAllSchools([])
        setPlans([])
      }
    }
    void loadLookups()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedHeadOfficeId = useMemo(() => {
    if (filters.headOfficeId && filters.headOfficeId !== 'Select') return String(filters.headOfficeId)
    if (isSuperAdmin) return manualScope.selectedHeadOfficeId ? String(manualScope.selectedHeadOfficeId) : ''
    if (isHeadOfficeAdmin) return authHeadOfficeId != null ? String(authHeadOfficeId) : ''
    if (isSchoolAdmin) {
      const school = allSchools.find((item) => String(item?.id ?? '') === String(authSchoolId ?? ''))
      return school?.headOfficeId != null ? String(school.headOfficeId) : ''
    }
    return ''
  }, [allSchools, authHeadOfficeId, authSchoolId, filters.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.selectedHeadOfficeId])

  const selectedSchoolId = useMemo(() => {
    if (filters.schoolId && filters.schoolId !== 'Select') return String(filters.schoolId)
    if (isSuperAdmin) return manualScope.selectedSchoolId ? String(manualScope.selectedSchoolId) : ''
    if (isSchoolAdmin) return authSchoolId != null ? String(authSchoolId) : ''
    return ''
  }, [authSchoolId, filters.schoolId, isSchoolAdmin, isSuperAdmin, manualScope.selectedSchoolId])

  const schoolOptions = useMemo(() => {
    const rowsList = Array.isArray(allSchools) ? allSchools : []
    if (isSuperAdmin && selectedHeadOfficeId) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(selectedHeadOfficeId))
    }
    if (isSuperAdmin) return Array.isArray(manualScope.schoolOptions) ? manualScope.schoolOptions : rowsList
    if (isHeadOfficeAdmin) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return rowsList.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return rowsList
  }, [allSchools, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.schoolOptions, selectedHeadOfficeId])

  const loadRows = async () => {
    setLoading(true)
    try {
      const result = await fetchSchoolSubscriptionsPage({
        headOfficeId: selectedHeadOfficeId || undefined,
        schoolId: selectedSchoolId || undefined,
        status: filters.status !== 'Select' ? filters.status : undefined,
        search,
        page: currentPage - 1,
        size: rowsPerPage,
      })
      setRows(Array.isArray(result?.content) ? result.content : [])
      setTotalElements(Number(result?.totalElements ?? 0))
      setTotalPages(Math.max(1, Number(result?.totalPages ?? 1) || 1))
    } catch {
      setRows([])
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, search, filters.status, selectedHeadOfficeId, selectedSchoolId])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const filteredData = rows
  const paginatedData = useMemo(() => filteredData, [filteredData])

  const getPlanById = (planId) => plans.find((plan) => String(plan?.id ?? '') === String(planId ?? ''))
  const getSchoolById = (schoolId) => allSchools.find((school) => String(school?.id ?? '') === String(schoolId ?? ''))

  const handleInputChange = (e) => {
    const { id, value } = e.target
    if (id === 'planId') {
      const plan = getPlanById(value)
      setFormData((prev) => ({
        ...prev,
        planId: value,
        planName: plan?.planName || '',
        price: plan?.price != null ? String(plan.price) : '',
      }))
      return
    }
    if (id === 'schoolId' && !isSuperAdmin) {
      const school = getSchoolById(value)
      setFormData((prev) => ({ ...prev, schoolId: value, headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : '' }))
      return
    }
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const openAdd = () => {
    setEditingId(null)
    setFormData({
      ...emptyForm,
      headOfficeId: isSuperAdmin ? manualScope.selectedHeadOfficeId : authHeadOfficeId != null ? String(authHeadOfficeId) : '',
      schoolId: isSuperAdmin ? manualScope.selectedSchoolId : isSchoolAdmin && authSchoolId != null ? String(authSchoolId) : '',
    })
    setIsModalOpen(true)
  }

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'SchoolSubscriptions')
    XLSX.writeFile(wb, 'School_Subscription_List.xlsx')
  }

  const handleSave = async () => {
    const schoolId = isSuperAdmin
      ? manualScope.selectedSchoolId
        ? Number(manualScope.selectedSchoolId)
        : formData.schoolId
          ? Number(formData.schoolId)
          : null
      : formData.schoolId
        ? Number(formData.schoolId)
        : null
    const planId = formData.planId ? Number(formData.planId) : null
    if (!schoolId) return window.alert('School is required')
    if (!planId && !formData.planName.trim()) return window.alert('Plan is required')

    const school = getSchoolById(schoolId)
    const plan = getPlanById(planId)
    const payload = {
      headOfficeId: isSuperAdmin
        ? manualScope.selectedHeadOfficeId
          ? Number(manualScope.selectedHeadOfficeId)
          : school?.headOfficeId != null
            ? Number(school.headOfficeId)
            : null
        : formData.headOfficeId
          ? Number(formData.headOfficeId)
          : school?.headOfficeId != null
            ? Number(school.headOfficeId)
            : null,
      schoolId,
      planId,
      planName: plan?.planName || formData.planName.trim(),
      price: formData.price === '' ? null : Number(formData.price),
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      status: formData.status,
    }

    if (editingId) {
      await updateSchoolSubscription(editingId, payload)
    } else {
      await createSchoolSubscription(payload)
    }

    setIsModalOpen(false)
    await loadRows()
  }

  const handleEdit = (row) => {
    sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row))
    setEditingId(row.id)
    setFormData({
      headOfficeId: row.headOfficeId != null ? String(row.headOfficeId) : '',
      schoolId: row.schoolId != null ? String(row.schoolId) : '',
      planId: row.planId != null ? String(row.planId) : '',
      planName: row.planName || '',
      price: row.price != null ? String(row.price) : '',
      name: row.name || '',
      email: row.email || '',
      phone: row.phone || '',
      address: row.address || '',
      startDate: row.startDate || '',
      endDate: row.endDate || '',
      status: row.status || 'Active',
    })
    if (isSuperAdmin && row.headOfficeId != null && row.schoolId != null) {
      manualScope.setSelectedScope(String(row.headOfficeId), String(row.schoolId))
    }
    setIsModalOpen(true)
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete subscription "${row.planName || row.name || row.id}"?`)) return
    await deleteSchoolSubscription(row.id)
    await loadRows()
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">School Subscription</h1>
          <span className="text-secondary-light">Subscription / School Management</span>
        </div>
        <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <i className="ri-add-large-line" /> Add Subscription
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={handleExportExcel} />
              <button
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsFilterOpen(true)}
              >
                <span className="text-secondary-light text-sm">Find</span>
                <i className="ri-arrow-right-line" />
              </button>
              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                  data-bs-toggle="dropdown"
                >
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line" />
                </button>
                <ul className="dropdown-menu p-12 border shadow">
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
                <i className="ri-search-line" />
              </span>
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
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading...
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr key={row.id ?? idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedRows.includes(row.id)}
                            onChange={() =>
                              setSelectedRows((prev) =>
                                prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id],
                              )
                            }
                          />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {columnOptions.map(
                        (col) =>
                          visibleColumns[col.key] && (
                            <td key={col.key}>
                              {col.key === 'status' ? (
                                <span
                                  className={`px-12 py-4 radius-4 fw-medium text-sm ${
                                    row[col.key] === 'Active'
                                      ? 'bg-success-100 text-success-600'
                                      : 'bg-danger-100 text-danger-600'
                                  }`}
                                >
                                  {row[col.key]}
                                </span>
                              ) : col.key === 'schoolName' || col.key === 'planName' ? (
                                <span className="fw-medium text-primary-light">{row[col.key]}</span>
                              ) : (
                                row[col.key]
                              )}
                            </td>
                          ),
                      )}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="text-info-600 bg-info-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            onClick={() => handleEdit(row)}
                          >
                            <i className="ri-edit-line" />
                          </button>
                          <button
                            type="button"
                            className="text-danger-600 bg-danger-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            onClick={() => handleDelete(row)}
                          >
                            <i className="ri-delete-bin-line" />
                          </button>
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
        modalWidth="840px"
        open={isModalOpen}
        title={editingId ? 'Edit Subscription' : 'Add Subscription'}
        steps={STEPS}
        step={0}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        submitLabel={editingId ? 'Update' : 'Save'}
      >
        <div className="avm-grid">
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={manualScope.headOffices}
              schoolOptions={manualScope.schoolOptions}
              selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
              onHeadOfficeChange={manualScope.setSelectedHeadOfficeId}
              selectedSchoolId={manualScope.selectedSchoolId}
              onSchoolChange={manualScope.setSelectedSchoolId}
            />
          ) : (
            <FormField label="School Name" required>
              <select className="avm-input form-select" id="schoolId" value={formData.schoolId} onChange={handleInputChange}>
                <option value="">--Select--</option>
                {schoolOptions.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.schoolName || school.name || String(school.id)}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <FormField label="Plan" required>
            <select className="avm-input form-select" id="planId" value={formData.planId} onChange={handleInputChange}>
              <option value="">--Select--</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.planName || String(plan.id)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Plan Name">
            <input type="text" className="avm-input" id="planName" value={formData.planName} onChange={handleInputChange} placeholder="Plan name" />
          </FormField>

          <FormField label="Price">
            <input type="number" className="avm-input" id="price" value={formData.price} onChange={handleInputChange} placeholder="Price" />
          </FormField>

          <FormField label="Name" required>
            <input type="text" className="avm-input" id="name" value={formData.name} onChange={handleInputChange} placeholder="Name" />
          </FormField>

          <FormField label="Email">
            <input type="email" className="avm-input" id="email" value={formData.email} onChange={handleInputChange} placeholder="Email" />
          </FormField>

          <FormField label="Phone">
            <input type="text" className="avm-input" id="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone" />
          </FormField>

          <FormField label="Address" full>
            <input type="text" className="avm-input" id="address" value={formData.address} onChange={handleInputChange} placeholder="Address" />
          </FormField>

          <FormField label="Start Date">
            <input type="date" className="avm-input" id="startDate" value={formData.startDate} onChange={handleInputChange} />
          </FormField>

          <FormField label="End Date">
            <input type="date" className="avm-input" id="endDate" value={formData.endDate} onChange={handleInputChange} />
          </FormField>

          <FormField label="Status">
            <select className="avm-input form-select" id="status" value={formData.status} onChange={handleInputChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </FormField>
        </div>
      </WizardPopup>

      <SlideSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Find Subscription">
        <form
          className="p-20 d-grid gap-16"
          onSubmit={(e) => {
            e.preventDefault()
            setIsFilterOpen(false)
            setCurrentPage(1)
            void loadRows()
          }}
        >
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={manualScope.headOffices}
              schoolOptions={manualScope.schoolOptions}
              selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
              onHeadOfficeChange={(value) => {
                manualScope.setSelectedScope(value, '')
                setFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: 'Select' }))
              }}
              selectedSchoolId={manualScope.selectedSchoolId}
              onSchoolChange={(value) => {
                manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value)
                setFilters((prev) => ({ ...prev, schoolId: value || 'Select' }))
              }}
              schoolLabel="School"
            />
          ) : !isSchoolAdmin ? (
            <div>
              <label className="text-sm fw-semibold text-primary-light mb-8">School</label>
              <select
                className="form-control form-select"
                value={filters.schoolId || 'Select'}
                onChange={(e) => setFilters((prev) => ({ ...prev, schoolId: e.target.value, headOfficeId: '' }))}
              >
                <option value="Select">--Select School--</option>
                {schoolOptions.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.schoolName || school.name || String(school.id)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Status</label>
            <select
              className="form-control form-select"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="Select">--Select Status--</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary-600 w-100">
            Apply Filter
          </button>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default SchoolSubscription
