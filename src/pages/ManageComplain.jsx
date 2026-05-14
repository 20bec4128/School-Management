import { useCallback, useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { fetchAcademicYears } from '../apis/academicYearsApi'
import { fetchComplainTypes } from '../apis/complainTypeApi'
import { createComplain, deleteComplain, fetchComplains, updateComplain } from '../apis/complainApi'
import { fetchRowsForSchoolIds, findSchoolById, normalizeSchoolIds, uniqueBy, uniqueStrings } from '../utils/schoolScope'
import '../assets/css/addModalShared.css'

const emptyForm = {
  schoolId: '',
  academicYear: '',
  userType: '',
  complainBy: '',
  complainTypeId: '',
  complainDate: '',
  actionDate: '',
  complain: '',
}

const emptyFilters = {
  schoolId: '',
  academicYear: 'Select',
  complainTypeId: 'Select',
  userType: 'Select',
}

const ADD_STEPS = ['Basic Info', 'Other Info']
const EDIT_STEPS = ['Basic Info', 'Other Info']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Academic Year': 'ri-calendar-2-line',
  'User Type': 'ri-user-settings-line',
  'Complain By': 'ri-user-3-line',
  'Complain Type': 'ri-error-warning-line',
  'Complain Date': 'ri-calendar-check-line',
  'Action Date': 'ri-calendar-event-line',
  Complain: 'ri-chat-3-line',
}

const columnOptions = [
  { key: 'schoolId', label: 'School ID' },
  { key: 'academicYear', label: 'Academic Year' },
  { key: 'userType', label: 'User Type' },
  { key: 'complainBy', label: 'Complain By' },
  { key: 'complainTypeName', label: 'Complain Type' },
  { key: 'complainDate', label: 'Complain Date' },
  { key: 'actionDate', label: 'Action Date' },
]

const userTypeOptions = ['Student', 'Teacher', 'Employee', 'Parent']
const complainByOptions = {
  Student: ['Alice Brown', 'Bob Wilson', 'Charlie Davis', 'Diana Prince', 'Ethan Hunt'],
  Teacher: ['John Smith', 'Sarah Johnson', 'David Lee', 'Emily Clark', 'Michael Brown'],
  Employee: ['James Carter', 'Linda Brooks', 'Marcus Hill', 'Nina Walsh'],
  Parent: ['Mr. Thompson', 'Mrs. Garcia', 'Mr. Patel', 'Mrs. Lee'],
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

const ManageComplain = () => {
  const { role, schoolId: authSchoolId } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const [data, setData] = useState([])
  const [complainTypes, setComplainTypes] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
  const listSchoolId = isSuperAdmin
    ? (activeSchoolId ? String(activeSchoolId) : '')
    : activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
  const schoolOptions = isSuperAdmin ? (manualScope.selectedHeadOfficeId ? manualScope.schoolOptions : []) : contextSchoolOptions
  const isSchoolLocked = !isSuperAdmin && !!listSchoolId

  const academicYearSuggestions = useMemo(
    () => uniqueStrings(academicYears.map((year) => year?.academicYear)),
    [academicYears],
  )

  const complainTypeOptions = useMemo(
    () => uniqueBy(complainTypes, (row) => row.id)
      .map((row) => ({ id: String(row.id), label: row.complainType }))
      .filter((row) => row.label),
    [complainTypes],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isSuperAdmin) {
        if (listSchoolId) {
          const [complainList, typeList, yearList] = await Promise.all([
            fetchComplains(listSchoolId),
            fetchComplainTypes(listSchoolId),
            fetchAcademicYears({ schoolId: listSchoolId }),
          ])
          setData(Array.isArray(complainList) ? complainList : [])
          setComplainTypes(Array.isArray(typeList) ? typeList : [])
          setAcademicYears(Array.isArray(yearList) ? yearList : [])
        } else {
          const schoolIds = normalizeSchoolIds(contextSchoolOptions)
          const [complainList, typeList, yearList] = await Promise.all([
            fetchRowsForSchoolIds(schoolIds, (schoolId) => fetchComplains(schoolId)),
            fetchRowsForSchoolIds(schoolIds, (schoolId) => fetchComplainTypes(schoolId)),
            fetchRowsForSchoolIds(schoolIds, (schoolId) => fetchAcademicYears({ schoolId })),
          ])
          setData(uniqueBy(complainList, (row) => String(row?.id ?? `${row?.schoolId ?? ''}-${row?.complainDate ?? ''}-${row?.complainBy ?? ''}`)))
          setComplainTypes(uniqueBy(typeList, (row) => String(row?.id ?? `${row?.schoolId ?? ''}-${row?.complainType ?? ''}`)))
          setAcademicYears(Array.isArray(yearList) ? yearList : [])
        }
      } else {
        if (!listSchoolId) {
          setData([])
          setComplainTypes([])
          setAcademicYears([])
          setError('Select a school before viewing complains.')
          return
        }
        const [complainList, typeList, yearList] = await Promise.all([
          fetchComplains(listSchoolId),
          fetchComplainTypes(listSchoolId),
          fetchAcademicYears({ schoolId: listSchoolId }),
        ])
        setData(Array.isArray(complainList) ? complainList : [])
        setComplainTypes(Array.isArray(typeList) ? typeList : [])
        setAcademicYears(Array.isArray(yearList) ? yearList : [])
      }
    } catch (err) {
      console.error('Failed to fetch complain data:', err)
      setError(err?.message || 'Failed to fetch complains')
      setData([])
      setComplainTypes([])
      setAcademicYears([])
    } finally {
      setLoading(false)
    }
  }, [isSuperAdmin, listSchoolId, contextSchoolOptions])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (!isSuperAdmin && listSchoolId) {
      setAddForm((prev) => ({ ...prev, schoolId: listSchoolId }))
    }
  }, [isSuperAdmin, listSchoolId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((row) => {
      const matchesSearch =
        !q ||
        [String(row.schoolId), row.academicYear, row.userType, row.complainBy, row.complainTypeName, row.complainDate, row.actionDate, row.complain]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesSchool = !filters.schoolId || String(row.schoolId) === String(filters.schoolId)
      const matchesAcademicYear = filters.academicYear === 'Select' || row.academicYear === filters.academicYear
      const matchesUserType = filters.userType === 'Select' || row.userType === filters.userType
      const matchesComplainType =
        filters.complainTypeId === 'Select' || String(row.complainTypeId || '') === String(filters.complainTypeId)
      return matchesSearch && matchesSchool && matchesAcademicYear && matchesUserType && matchesComplainType
    })
  }, [data, filters, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((row) => selectedRows.includes(row.id))

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((row) => row.id)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !paginated.some((row) => row.id === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const handleChange = (setter) => (event) => {
    const { id, value } = event.target
    setter((prev) => {
      const next = { ...prev, [id]: value }
      if (id === 'userType') next.complainBy = ''
      return next
    })
  }

  const handlePendingFilterChange = (event) => {
    const { id, value } = event.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (event) => {
    event.preventDefault()
    setFilters(pendingFilters)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
  }

  const openAdd = () => {
    setError('')
    setAddForm({
      ...emptyForm,
      schoolId: isSuperAdmin ? '' : listSchoolId || '',
      academicYear: academicYearSuggestions[0] || '',
    })
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setError('')
    if (isSuperAdmin) {
      const school = findSchoolById(manualScope.schoolOptions, row.schoolId)
      if (school?.headOfficeId != null) {
        manualScope.setSelectedScope(String(school.headOfficeId), row.schoolId != null ? String(row.schoolId) : '')
      }
    }
    setEditForm({
      id: row.id,
      schoolId: row.schoolId != null ? String(row.schoolId) : listSchoolId,
      academicYear: row.academicYear || '',
      userType: row.userType || '',
      complainBy: row.complainBy || '',
      complainTypeId: row.complainTypeId != null ? String(row.complainTypeId) : '',
      complainDate: row.complainDate || '',
      actionDate: row.actionDate || '',
      complain: row.complain || '',
    })
    setEditStep(0)
    setIsEditOpen(true)
  }

  const buildPayload = (form) => ({
    schoolId: form.schoolId ? Number(form.schoolId) : null,
    academicYear: form.academicYear || '',
    userType: form.userType || '',
    complainBy: form.complainBy || '',
    complainTypeId: form.complainTypeId ? Number(form.complainTypeId) : null,
    complainDate: form.complainDate || null,
    actionDate: form.actionDate || null,
    complain: form.complain || '',
  })

  const handleSave = async () => {
    try {
      if (!addForm.schoolId || !addForm.academicYear || !addForm.userType || !addForm.complainBy || !addForm.complainTypeId || !addForm.complainDate || !addForm.complain) {
        alert('Please fill all required fields')
        return
      }
      await createComplain(buildPayload(addForm))
      setIsAddOpen(false)
      void loadData()
    } catch (err) {
      setError(err?.message || 'Failed to save complain')
      alert('Failed to save complain')
    }
  }

  const handleUpdate = async () => {
    try {
      await updateComplain(editForm.id, buildPayload(editForm))
      setIsEditOpen(false)
      void loadData()
    } catch (err) {
      setError(err?.message || 'Failed to update complain')
      alert('Failed to update complain')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this complain?')) return
    try {
      await deleteComplain(id)
      void loadData()
    } catch (err) {
      alert('Failed to delete complain')
    }
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let page = start; page <= end; page += 1) pages.push(page)
    return pages
  }

  const renderForm = (form, setter, step = 0) => {
    const availableComplainBy = form.userType ? (complainByOptions[form.userType] || []) : []
    const selectedAcademicYear = form.academicYear || ''

    return (
      <>
        <p className="avm-section-title">{step === 0 ? 'Basic Information' : 'Other Information'}</p>
        <div className="avm-grid">
          {step === 0 ? (
            <>
              {isSuperAdmin ? (
                <div className="avm-field full">
                  <ManualScopeSelectors
                    enabled={isSuperAdmin}
                    headOffices={manualScope.headOffices}
                    schoolOptions={schoolOptions}
                    selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                    onHeadOfficeChange={(value) => {
                      manualScope.setSelectedHeadOfficeId(value)
                      manualScope.setSelectedSchoolId('')
                      setter((prev) => ({ ...prev, schoolId: '' }))
                    }}
                    selectedSchoolId={form.schoolId}
                    onSchoolChange={(value) => setter((prev) => ({ ...prev, schoolId: value }))}
                  />
                </div>
              ) : (
                <FormField label="School Name" required full>
                  <select
                    className="avm-select"
                    id="schoolId"
                    value={form.schoolId}
                    onChange={handleChange(setter)}
                    disabled={isSchoolLocked}
                  >
                    <option value="">--Select School--</option>
                    {schoolOptions.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.schoolName}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField label="Academic Year" required>
                <input
                  type="text"
                  className="avm-input"
                  id="academicYear"
                  list="complain-academic-years"
                  placeholder="Enter academic year"
                  value={selectedAcademicYear}
                  onChange={handleChange(setter)}
                />
                <datalist id="complain-academic-years">
                  {academicYearSuggestions.map((year) => (
                    <option key={year} value={year} />
                  ))}
                </datalist>
              </FormField>

              <FormField label="User Type" required>
                <select className="avm-select" id="userType" value={form.userType} onChange={handleChange(setter)}>
                  <option value="">--Select--</option>
                  {userTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Complain By" required>
                <select className="avm-select" id="complainBy" value={form.complainBy} onChange={handleChange(setter)} disabled={!form.userType}>
                  <option value="">--Select--</option>
                  {availableComplainBy.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Complain Type" required>
                <select className="avm-select" id="complainTypeId" value={form.complainTypeId} onChange={handleChange(setter)}>
                  <option value="">--Select--</option>
                  {complainTypeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Complain Date" required full>
                <input
                  type="date"
                  className="avm-input"
                  id="complainDate"
                  value={form.complainDate}
                  onChange={handleChange(setter)}
                />
              </FormField>
            </>
          ) : (
            <>
              <FormField label="Action Date" full>
                <input
                  type="date"
                  className="avm-input"
                  id="actionDate"
                  value={form.actionDate}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Complain" required full>
                <textarea
                  rows="4"
                  className="avm-input avm-textarea"
                  id="complain"
                  placeholder="Enter complain details"
                  value={form.complain}
                  onChange={handleChange(setter)}
                />
              </FormField>
            </>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Manage Complain</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Manage Complain</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={openAdd}
            disabled={!isSuperAdmin && !listSchoolId}
            title={!isSuperAdmin && !listSchoolId ? 'Select a school first' : ''}
          >
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add Complain
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-8" role="alert">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1"></i> Export
                  </span>
                  <span>
                    <i className="ri-arrow-down-s-line"></i>
                  </span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
                      <i className="ri-file-3-line"></i> PDF
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
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
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
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
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value))
                  setCurrentPage(1)
                }}
              >
                {[5, 10, 20, 50].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search complain..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setCurrentPage(1)
                }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.schoolId ? <th scope="col">School ID</th> : null}
                  {visibleColumns.academicYear ? <th scope="col">Academic Year</th> : null}
                  {visibleColumns.userType ? <th scope="col">User Type</th> : null}
                  {visibleColumns.complainBy ? <th scope="col">Complain By</th> : null}
                  {visibleColumns.complainTypeName ? <th scope="col">Complain Type</th> : null}
                  {visibleColumns.complainDate ? <th scope="col">Complain Date</th> : null}
                  {visibleColumns.actionDate ? <th scope="col">Action Date</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      Loading...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      No complains found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, index) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + index + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.schoolId ? <td>{row.schoolId}</td> : null}
                      {visibleColumns.academicYear ? <td>{row.academicYear}</td> : null}
                      {visibleColumns.userType ? <td>{row.userType}</td> : null}
                      {visibleColumns.complainBy ? <td className="fw-medium text-primary-light">{row.complainBy}</td> : null}
                      {visibleColumns.complainTypeName ? <td>{row.complainTypeName || '-'}</td> : null}
                      {visibleColumns.complainDate ? <td>{row.complainDate}</td> : null}
                      {visibleColumns.actionDate ? <td>{row.actionDate || '-'}</td> : null}
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
                            onClick={() => handleDelete(row.id)}
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
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
                Prev
              </button>
              {getVisiblePages().map((page) => (
                <button
                  key={page}
                  type="button"
                  className={page === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <WizardPopup
        modalWidth="560px"
        open={isAddOpen}
        title="Add Complain"
        steps={ADD_STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((step) => Math.max(0, step - 1))}
        onNext={() => setAddStep((step) => Math.min(ADD_STEPS.length - 1, step + 1))}
        onSubmit={handleSave}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm, addStep)}
      </WizardPopup>

      <WizardPopup
        modalWidth="560px"
        open={isEditOpen}
        title="Edit Complain"
        steps={EDIT_STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((step) => Math.max(0, step - 1))}
        onNext={() => setEditStep((step) => Math.min(EDIT_STEPS.length - 1, step + 1))}
        onSubmit={handleUpdate}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm, editStep)}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Complains"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div className="full">
            <ManualScopeSelectors
              enabled={isSuperAdmin}
              headOffices={manualScope.headOffices}
              schoolOptions={schoolOptions}
              selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
              onHeadOfficeChange={manualScope.setSelectedHeadOfficeId}
              selectedSchoolId={manualScope.selectedSchoolId}
              onSchoolChange={manualScope.setSelectedSchoolId}
              schoolLabel="School"
              showSchoolSelector={false}
            />
          </div>
          <div className="full">
            <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School
            </label>
            <select id="schoolId" className="form-control form-select" value={pendingFilters.schoolId} onChange={handlePendingFilterChange}>
              <option value="">All Schools</option>
              {schoolOptions.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.schoolName}
                </option>
              ))}
            </select>
          </div>

          <div className="full">
            <label htmlFor="academicYear" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Academic Year
            </label>
            <select id="academicYear" className="form-control form-select" value={pendingFilters.academicYear} onChange={handlePendingFilterChange}>
              <option value="Select">All Academic Years</option>
              {academicYearSuggestions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="full">
            <label htmlFor="complainTypeId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Complain Type
            </label>
            <select id="complainTypeId" className="form-control form-select" value={pendingFilters.complainTypeId} onChange={handlePendingFilterChange}>
              <option value="Select">All Complain Types</option>
              {complainTypeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="full">
            <label htmlFor="userType" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              User Type
            </label>
            <select id="userType" className="form-control form-select" value={pendingFilters.userType} onChange={handlePendingFilterChange}>
              <option value="Select">All User Types</option>
              {userTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
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

export default ManageComplain
