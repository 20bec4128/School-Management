import { useCallback, useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import PhoneField from '../components/PhoneField'
import useColumnVisibility from '../hooks/useColumnVisibility'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import ExportDropdown from '../components/ExportDropdown'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import TablePagination from '../components/table/TablePagination'
import '../assets/css/addModalShared.css'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchAcademicYears } from '../apis/academicYearsApi'
import { createDonor, deleteDonor, fetchDonorsPage, updateDonor } from '../apis/donorsApi'

const donorTypeOptions = ['Individual', 'Organization', 'Foundation', 'Corporate', 'Government']

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  academicYear: '',
  donorType: '',
  donorName: '',
  contactName: '',
  email: '',
  phone: '',
  amount: '',
  address: '',
  note: '',
}

const emptyFilters = {
  headOfficeId: 'Select',
  schoolId: 'Select',
  academicYear: 'Select',
  donorType: 'Select',
}

const STEPS = ['Basic Info', 'Contact & Details']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Academic Year': 'ri-calendar-line',
  'Donor Type': 'ri-group-line',
  'Donor Name': 'ri-user-3-line',
  'Contact Name': 'ri-contacts-line',
  Email: 'ri-mail-line',
  Amount: 'ri-money-dollar-circle-line',
  Address: 'ri-map-pin-2-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'academicYear', label: 'Academic Year' },
  { key: 'donorName', label: 'Donor Name' },
  { key: 'contactName', label: 'Contact Name' },
  { key: 'amount', label: 'Amount' },
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

const unwrapCollection = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.content)) return value.content
  return []
}

const schoolLabel = (row) => row?.schoolName || row?.name || ''
const getSchoolById = (rows, schoolId) =>
  (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(schoolId ?? '')) || null

const formatAmount = (value) => {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(n)) return ''
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n)
}

const Donor = () => {
  const [rows, setRows] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [academicYearsLookup, setAcademicYearsLookup] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [editingId, setEditingId] = useState(null)

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
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

  const schoolOptionsFor = useCallback(
    (headOfficeId) =>
      schoolsLookup
        .filter((s) => !headOfficeId || String(s?.headOfficeId ?? '') === String(headOfficeId))
        .slice()
        .sort((a, b) => schoolLabel(a).localeCompare(schoolLabel(b))),
    [schoolsLookup],
  )

  const academicYearOptions = useMemo(
    () =>
      Array.from(
        new Set(academicYearsLookup.map((item) => String(item?.academicYear || '').trim()).filter(Boolean)),
      )
        .sort()
        .reverse(),
    [academicYearsLookup],
  )

  const loadLookups = useCallback(async () => {
    const [headOfficesResult, schoolsResult, academicYearsResult] = await Promise.allSettled([
      fetchHeadOfficesPage(0, 500),
      fetchSchoolsLookup(),
      fetchAcademicYears(),
    ])

    setHeadOffices(
      unwrapCollection(headOfficesResult.status === 'fulfilled' ? headOfficesResult.value : [])
        .map((ho) => ({ id: ho?.id, name: ho?.name || ho?.headOfficeName || '' }))
        .filter((ho) => ho.id != null && ho.name)
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    )
    setSchoolsLookup(unwrapCollection(schoolsResult.status === 'fulfilled' ? schoolsResult.value : []))
    setAcademicYearsLookup(unwrapCollection(academicYearsResult.status === 'fulfilled' ? academicYearsResult.value : []))
  }, [])

  const loadDonors = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchDonorsPage(currentPage - 1, rowsPerPage, {
        headOfficeId: filters.headOfficeId !== 'Select' ? filters.headOfficeId : undefined,
        schoolId: filters.schoolId !== 'Select' ? filters.schoolId : undefined,
        academicYear: filters.academicYear !== 'Select' ? filters.academicYear : undefined,
        donorType: filters.donorType !== 'Select' ? filters.donorType : undefined,
        search: search.trim(),
      })
      setRows(Array.isArray(data?.content) ? data.content : [])
      setTotalElements(Number.isFinite(data?.totalElements) ? Number(data.totalElements) : 0)
      setTotalPages(Math.max(1, Number.isFinite(data?.totalPages) ? Number(data.totalPages) : 1))
    } catch (e) {
      setRows([])
      setTotalElements(0)
      setTotalPages(1)
      setError(e?.message || 'Failed to load donors')
    } finally {
      setLoading(false)
    }
  }, [currentPage, rowsPerPage, filters, search])

  useEffect(() => {
    loadLookups().catch(() => {})
  }, [loadLookups])

  useEffect(() => {
    loadDonors().catch(() => {})
  }, [loadDonors, refreshKey])

  const allSelected = rows.length > 0 && rows.every((r) => selectedRows.includes(String(r.id)))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...rows.map((r) => String(r.id))])])
      return
    }
    setSelectedRows((prev) => prev.filter((id) => !rows.some((r) => String(r.id) === id)))
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
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
    setIsFilterSidebarOpen(false)
  }

  const openAdd = () => {
    setAddForm(emptyForm)
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    const school = getSchoolById(schoolsLookup, row?.schoolId)
    setEditingId(row?.id ?? null)
    setEditForm({
      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : '',
      schoolId: row?.schoolId != null ? String(row.schoolId) : '',
      academicYear: row?.academicYear || '',
      donorType: row?.donorType || '',
      donorName: row?.donorName || '',
      contactName: row?.contactName || '',
      email: row?.email || '',
      phone: row?.phone || '',
      amount: row?.amount != null ? String(row.amount) : '',
      address: row?.address || '',
      note: row?.note || '',
    })
    setEditStep(0)
    setIsEditOpen(true)
  }

  const handleCreate = async () => {
    setSaving(true)
    setError('')
    try {
      await createDonor({
        schoolId: addForm.schoolId ? Number(addForm.schoolId) : null,
        academicYear: addForm.academicYear || null,
        donorType: addForm.donorType || null,
        donorName: addForm.donorName || null,
        contactName: addForm.contactName || null,
        email: addForm.email || null,
        phone: addForm.phone || null,
        amount: addForm.amount === '' ? null : Number(addForm.amount),
        address: addForm.address || null,
        note: addForm.note || null,
      })
      setIsAddOpen(false)
      setRefreshKey((k) => k + 1)
    } catch (e) {
      setError(e?.message || 'Failed to create donor')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (editingId == null) return
    setSaving(true)
    setError('')
    try {
      await updateDonor(editingId, {
        schoolId: editForm.schoolId ? Number(editForm.schoolId) : null,
        academicYear: editForm.academicYear || null,
        donorType: editForm.donorType || null,
        donorName: editForm.donorName || null,
        contactName: editForm.contactName || null,
        email: editForm.email || null,
        phone: editForm.phone || null,
        amount: editForm.amount === '' ? null : Number(editForm.amount),
        address: editForm.address || null,
        note: editForm.note || null,
      })
      setIsEditOpen(false)
      setEditingId(null)
      setRefreshKey((k) => k + 1)
    } catch (e) {
      setError(e?.message || 'Failed to update donor')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (id == null) return
    // eslint-disable-next-line no-alert
    const ok = window.confirm('Delete this donor?')
    if (!ok) return

    setSaving(true)
    setError('')
    try {
      await deleteDonor(id)
      setSelectedRows((prev) => prev.filter((rowId) => String(rowId) !== String(id)))
      setRefreshKey((k) => k + 1)
    } catch (e) {
      setError(e?.message || 'Failed to delete donor')
    } finally {
      setSaving(false)
    }
  }

  const pageInfo = useMemo(() => {
    const total = Number.isFinite(totalElements) ? totalElements : 0
    const start = total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
    const end = total === 0 ? 0 : Math.min(currentPage * rowsPerPage, total)
    return `Showing ${start} - ${end} of ${total} entries`
  }, [currentPage, rowsPerPage, totalElements])

  const renderForm = (form, setter, step) => (
    <>
      <p className="avm-section-title">{STEPS[step]}</p>
      <div className="avm-grid">
        {step === 0 ? (
          <>
            <ManualScopeSelectors
              enabled
              headOffices={headOffices}
              schoolOptions={schoolOptionsFor(form.headOfficeId)}
              selectedHeadOfficeId={form.headOfficeId}
              onHeadOfficeChange={(value) => setter((prev) => ({ ...prev, headOfficeId: value || '', schoolId: '' }))}
              selectedSchoolId={form.schoolId}
              onSchoolChange={(value) => setter((prev) => ({ ...prev, schoolId: value || '' }))}
              schoolLabel="School"
            />

            <FormField label="Academic Year" full>
              <select className="avm-select" id="academicYear" value={form.academicYear} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                {academicYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Donor Type" required full>
              <select className="avm-select" id="donorType" value={form.donorType} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                {donorTypeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Donor Name" required full>
              <input
                type="text"
                className="avm-input"
                id="donorName"
                placeholder="Donor Name"
                value={form.donorName}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Contact Name" full>
              <input
                type="text"
                className="avm-input"
                id="contactName"
                placeholder="Contact Name"
                value={form.contactName}
                onChange={handleChange(setter)}
              />
            </FormField>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <FormField label="Email" full>
              <input
                type="email"
                className="avm-input"
                id="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange(setter)}
              />
            </FormField>

            <PhoneField
              id="phone"
              label="Phone"
              required
              value={form.phone}
              onChange={(fullValue) => setter((prev) => ({ ...prev, phone: fullValue }))}
            />

            <FormField label="Amount" required>
              <input
                type="number"
                className="avm-input"
                id="amount"
                placeholder="Amount"
                value={form.amount}
                onChange={handleChange(setter)}
                min="0"
              />
            </FormField>

            <FormField label="Address" full>
              <textarea
                rows={3}
                className="avm-input avm-textarea"
                id="address"
                placeholder="Address"
                value={form.address}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Note" full>
              <textarea
                rows={3}
                className="avm-input avm-textarea"
                id="note"
                placeholder="Note"
                value={form.note}
                onChange={handleChange(setter)}
              />
            </FormField>
          </>
        ) : null}
      </div>
    </>
  )

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Donor</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Donor</span>
          </div>
        </div>
        <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <span className="d-flex text-md">
            <i className="ri-add-large-line"></i>
          </span>
          Add Donor
        </button>
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
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
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
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
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
                placeholder="Search donors..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.schoolName ? <th scope="col">School</th> : null}
                  {visibleColumns.academicYear ? <th scope="col">Academic Year</th> : null}
                  {visibleColumns.donorName ? <th scope="col">Donor Name</th> : null}
                  {visibleColumns.contactName ? <th scope="col">Contact Name</th> : null}
                  {visibleColumns.amount ? <th scope="col">Amount</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center py-40 text-secondary-light">
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center py-40 text-danger-600">
                      {error}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center py-40 text-secondary-light">
                      No donors found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id ?? idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(String(row.id))}
                            onChange={() => handleSelectRow(String(row.id))}
                          />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.schoolName ? <td>{row.schoolName}</td> : null}
                      {visibleColumns.academicYear ? <td>{row.academicYear}</td> : null}
                      {visibleColumns.donorName ? <td className="fw-medium text-primary-light">{row.donorName}</td> : null}
                      {visibleColumns.contactName ? <td>{row.contactName}</td> : null}
                      {visibleColumns.amount ? (
                        <td>
                          <span className="fw-semibold text-success-600">{formatAmount(row.amount)}</span>
                        </td>
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
                            onClick={() => handleDelete(row.id)}
                            disabled={saving}
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

          <TablePagination
            paginationProps={{
              currentPage,
              totalPages,
              pageInfo,
              onPageChange: (page) => setCurrentPage(Math.min(Math.max(1, page), totalPages)),
            }}
          />
        </div>
      </div>

      <WizardPopup
        modalWidth="560px"
        open={isAddOpen}
        title="Add Donor"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleCreate}
        submitLabel={saving ? 'Saving...' : 'Save'}
      >
        {renderForm(addForm, setAddForm, addStep)}
      </WizardPopup>

      <WizardPopup
        modalWidth="560px"
        open={isEditOpen}
        title="Edit Donor"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleUpdate}
        submitLabel={saving ? 'Saving...' : 'Update'}
      >
        {renderForm(editForm, setEditForm, editStep)}
      </WizardPopup>

      <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter Donors" onClose={() => setIsFilterSidebarOpen(false)} className="filter-sidebar">
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <ManualScopeSelectors
              enabled
              headOffices={headOffices}
              schoolOptions={schoolOptionsFor(pendingFilters.headOfficeId === 'Select' ? '' : pendingFilters.headOfficeId)}
              selectedHeadOfficeId={pendingFilters.headOfficeId === 'Select' ? '' : pendingFilters.headOfficeId}
              onHeadOfficeChange={(value) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  headOfficeId: value || 'Select',
                  schoolId: 'Select',
                }))
              }
              selectedSchoolId={pendingFilters.schoolId === 'Select' ? '' : pendingFilters.schoolId}
              onSchoolChange={(value) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  schoolId: value || 'Select',
                }))
              }
              schoolLabel="School"
            />
          </div>

          <div>
            <label htmlFor="academicYear" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Academic Year
            </label>
            <select id="academicYear" className="form-control form-select" value={pendingFilters.academicYear} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              {academicYearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="donorType" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Donor Type
            </label>
            <select id="donorType" className="form-control form-select" value={pendingFilters.donorType} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              {donorTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
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

export default Donor

