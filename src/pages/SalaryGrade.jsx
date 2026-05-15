import { useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

import { useAuth } from '../context/useAuth'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createSalaryGrade, deleteSalaryGrade, fetchSalaryGradesPage, updateSalaryGrade } from '../apis/salaryGradeApi'
import { normalizeRole } from '../utils/roles'
import ExportDropdown from '../components/ExportDropdown'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
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
  headOfficeId: '',
  schoolId: '',
  gradeName: '',
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
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'

  const [rows, setRows] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [headOffices, setHeadOffices] = useState([])
  const [schools, setSchools] = useState([])

  const [scopeSchoolId, setScopeSchoolId] = useState(() => (authSchoolId != null ? String(authSchoolId) : ''))

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
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

  const schoolsById = useMemo(() => {
    const map = new Map()
    for (const s of Array.isArray(schools) ? schools : []) {
      if (s?.id == null) continue
      map.set(String(s.id), s)
    }
    return map
  }, [schools])

  const headOfficesById = useMemo(() => {
    const map = new Map()
    for (const ho of Array.isArray(headOffices) ? headOffices : []) {
      if (ho?.id == null) continue
      map.set(String(ho.id), ho)
    }
    return map
  }, [headOffices])

  const resolveSchoolName = (schoolId, fallbackName = '') => {
    if (schoolId == null) return ''
    const row = schoolsById.get(String(schoolId))
    return row?.schoolName || row?.name || fallbackName || ''
  }

  const resolveHeadOfficeName = (headOfficeId) => {
    if (headOfficeId == null) return ''
    const row = headOfficesById.get(String(headOfficeId))
    return row?.name || ''
  }

  const loadLookups = async () => {
    if (isSchoolAdmin) return
    const tasks = []
    if (isSuperAdmin || isHeadOfficeAdmin) {
      tasks.push(
        fetchHeadOfficesPage(0, 500).then((page) => {
          const content = Array.isArray(page?.content) ? page.content : []
          setHeadOffices(content)
        }).catch(() => {}),
      )
    }
    tasks.push(fetchSchoolsLookup().then((list) => setSchools(Array.isArray(list) ? list : [])))
    await Promise.all(tasks)
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  const loadSalaryGrades = async ({ schoolId, page = 0, size = 10, search = '' } = {}) => {
    const effectiveSchoolId = (() => {
      if (isSchoolAdmin) return authSchoolId
      return schoolId || null
    })()

    if (!effectiveSchoolId && !isSuperAdmin) {
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
      return
    }

    const data = await fetchSalaryGradesPage({ 
      schoolId: effectiveSchoolId, 
      page: page, 
      size: size,
      search: search
    })
    const list = Array.isArray(data?.content) ? data.content : []
    setRows(list)
    setTotalElements(data?.totalElements ?? 0)
    setTotalPages(data?.totalPages ?? 0)
  }

  useEffect(() => {
    if (status !== 'ready' || !token) return
    setLoadError('')
    setBusy(true)
    Promise.resolve()
      .then(loadLookups)
      .then(() => {
        const initialSchoolId = isSchoolAdmin ? authSchoolId : (scopeSchoolId ? Number(scopeSchoolId) : (filters.schoolId ? Number(filters.schoolId) : null))
        return loadSalaryGrades({ 
          schoolId: initialSchoolId,
          page: currentPage - 1,
          size: rowsPerPage,
          search: debouncedSearch
        })
      })
      .catch((e) => setLoadError(e?.message || 'Failed to load salary grades'))
      .finally(() => setBusy(false))
  }, [status, token, role, currentPage, rowsPerPage, debouncedSearch, filters])

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
      const updated = { 
        ...prev, 
        [id]: value,
        ...(id === 'headOfficeId' ? { schoolId: '' } : {})
      }
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

  const openAdd = () => {
    const base = { ...emptyForm }
    if (isSchoolAdmin) {
      base.schoolId = authSchoolId != null ? String(authSchoolId) : ''
      base.headOfficeId = authHeadOfficeId != null ? String(authHeadOfficeId) : ''
    } else if (isHeadOfficeAdmin) {
      base.headOfficeId = authHeadOfficeId != null ? String(authHeadOfficeId) : ''
    }
    setAddForm(base)
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    const s = row?.schoolId != null ? schoolsById.get(String(row.schoolId)) : null
    setEditForm({
      ...row,
      headOfficeId: s?.headOfficeId != null ? String(s.headOfficeId) : (authHeadOfficeId != null ? String(authHeadOfficeId) : ''),
      schoolId: row?.schoolId != null ? String(row.schoolId) : '',
    })
    setEditStep(0)
    setIsEditOpen(true)
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...rows.map((row) => String(row.id))])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !rows.some((row) => String(row.id) === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(String(id)) ? prev.filter((rowId) => rowId !== String(id)) : [...prev, String(id)],
    )
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  const schoolOptionsForScope = useMemo(() => {
    const list = Array.isArray(schools) ? schools : []
    if (isSuperAdmin) return list
    if (isHeadOfficeAdmin) return list.filter(s => String(s.headOfficeId) === String(authHeadOfficeId))
    return []
  }, [schools, isSuperAdmin, isHeadOfficeAdmin, authHeadOfficeId])

  const schoolOptionsForForm = (form) => {
    if (isSchoolAdmin) return []
    const selectedHeadOfficeId = isSuperAdmin ? form.headOfficeId : (authHeadOfficeId != null ? String(authHeadOfficeId) : '')
    const list = Array.isArray(schools) ? schools : []
    if (!selectedHeadOfficeId) return []
    return list.filter((s) => String(s?.headOfficeId ?? '') === String(selectedHeadOfficeId))
  }

  const renderForm = (form, setter, step) => {
    return (
      <>
        {step === 0 && (
          <>
            <p className="avm-section-title">{STEPS[0]}</p>
            <div className="avm-grid">
              {isSuperAdmin ? (
                <FormField label="Head Office" required full>
                  <select className="avm-select" id="headOfficeId" value={form.headOfficeId} onChange={handleChange(setter)}>
                    <option value="">--Select Head Office--</option>
                    {headOffices.map((ho) => (
                      <option key={ho.id} value={String(ho.id)}>{ho.name}</option>
                    ))}
                  </select>
                </FormField>
              ) : (isHeadOfficeAdmin ? (
                <FormField label="Head Office" required full>
                  <input className="avm-input" value={headOfficeName || resolveHeadOfficeName(authHeadOfficeId) || ''} readOnly />
                </FormField>
              ) : null)}

              {(isSuperAdmin || isHeadOfficeAdmin) ? (
                <FormField label="School Name" required full>
                  <select className="avm-select" id="schoolId" value={form.schoolId} onChange={handleChange(setter)}>
                    <option value="">--Select School--</option>
                    {schoolOptionsForForm(form).map((s) => (
                      <option key={s.id} value={String(s.id)}>{s.schoolName}</option>
                    ))}
                  </select>
                </FormField>
              ) : (isSchoolAdmin ? (
                <FormField label="School Name" required full>
                  <input className="avm-input" value={authSchoolName || resolveSchoolName(authSchoolId, authSchoolName) || ''} readOnly />
                </FormField>
              ) : null)}

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
        <div className="d-flex flex-wrap align-items-center gap-12">
          {isHeadOfficeAdmin && !isSuperAdmin ? (
            <select
              className="form-select"
              style={{ minWidth: 240 }}
              value={scopeSchoolId}
              onChange={(e) => {
                setScopeSchoolId(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">Select School</option>
              {schoolOptionsForScope.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.schoolName}</option>
              ))}
            </select>
          ) : null}

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
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {loadError && <div className="px-20 py-12 text-danger">{loadError}</div>}
          
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

              <RowsPerPageSelect
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(value) => {
                  setRowsPerPage(value)
                  setCurrentPage(1)
                }}
              />
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
                        checked={rows.length > 0 && rows.every((r) => selectedRows.includes(String(r.id)))}
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
                {busy && rows.length === 0 ? (
                   <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 1}
                      className="text-center py-40 text-secondary-light"
                    >
                      No salary grade records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(String(row.id))}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.school ? (
                        <td className="fw-medium text-primary-light">{row.schoolName}</td>
                      ) : null}
                      {visibleColumns.gradeName ? <td className="fw-medium">{row.gradeName}</td> : null}
                      {visibleColumns.basicSalary ? (
                        <td className="text-end fw-semibold">₹{row.basicSalary?.toLocaleString()}</td>
                      ) : null}
                      {visibleColumns.hourlyRate ? (
                        <td className="text-end">₹{row.hourlyRate}</td>
                      ) : null}
                      {visibleColumns.grossSalary ? (
                        <td className="text-end fw-semibold text-primary-light">₹{row.grossSalary?.toLocaleString()}</td>
                      ) : null}
                      {visibleColumns.netSalary ? (
                        <td className="text-end fw-semibold text-success-600">₹{row.netSalary?.toLocaleString()}</td>
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
                            onClick={async () => {
                              if (!window.confirm('Are you sure?')) return
                              setBusy(true)
                              try {
                                await deleteSalaryGrade(row.id)
                                await loadSalaryGrades({
                                  schoolId: isSchoolAdmin ? authSchoolId : (scopeSchoolId || filters.schoolId || null),
                                  page: currentPage - 1,
                                  size: rowsPerPage,
                                  search: debouncedSearch
                                })
                              } catch (e) { setLoadError(e.message) }
                              finally { setBusy(false) }
                            }}
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
              Showing {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, totalElements)} of {totalElements}
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
        onSubmit={async () => {
          setLoadError('')
          const effectiveSchoolId = isSchoolAdmin ? authSchoolId : (addForm.schoolId ? Number(addForm.schoolId) : null)
          if (!effectiveSchoolId) { setLoadError('School is required'); return }
          if (!addForm.gradeName) { setLoadError('Grade name is required'); return }
          setBusy(true)
          try {
            await createSalaryGrade({ ...addForm, schoolId: effectiveSchoolId })
            setIsAddOpen(false)
            await loadSalaryGrades({ schoolId: effectiveSchoolId, page: currentPage - 1, size: rowsPerPage, search: debouncedSearch })
          } catch (e) { setLoadError(e.message) }
          finally { setBusy(false) }
        }}
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
        onSubmit={async () => {
          setLoadError('')
          const effectiveSchoolId = isSchoolAdmin ? authSchoolId : (editForm.schoolId ? Number(editForm.schoolId) : null)
          if (!effectiveSchoolId) { setLoadError('School is required'); return }
          if (!editForm.gradeName) { setLoadError('Grade name is required'); return }
          setBusy(true)
          try {
            await updateSalaryGrade(editForm.id, { ...editForm, schoolId: effectiveSchoolId })
            setIsEditOpen(false)
            await loadSalaryGrades({ schoolId: effectiveSchoolId, page: currentPage - 1, size: rowsPerPage, search: debouncedSearch })
          } catch (e) { setLoadError(e.message) }
          finally { setBusy(false) }
        }}
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
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
           {isSuperAdmin && (
             <div>
              <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Head Office</label>
              <select 
                className="form-control form-select" 
                value={pendingFilters.headOfficeId} 
                onChange={(e) => setPendingFilters(p => ({ ...p, headOfficeId: e.target.value, schoolId: '' }))}
              >
                <option value="">All</option>
                {headOffices.map(ho => <option key={ho.id} value={String(ho.id)}>{ho.name}</option>)}
              </select>
            </div>
           )}

           {(isSuperAdmin || isHeadOfficeAdmin) && (
             <div>
              <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
              <select 
                className="form-control form-select" 
                value={pendingFilters.schoolId} 
                onChange={(e) => setPendingFilters(p => ({ ...p, schoolId: e.target.value }))}
              >
                <option value="">All</option>
                {schoolOptionsForForm(pendingFilters).map(s => <option key={s.id} value={String(s.id)}>{s.schoolName}</option>)}
              </select>
            </div>
           )}

          <div className="d-flex gap-8 mt-16">
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-danger-200 text-danger-600 w-100"
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

export default SalaryGrade
