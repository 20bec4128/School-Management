import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import WizardPopup from '../components/WizardPopup'
import AddDepartmentModal from '../components/AddDepartmentModal'
import useColumnVisibility from '../hooks/useColumnVisibility'
import {
  deleteDepartment,
  fetchDepartmentsPage,
  updateDepartment,
} from '../apis/departmentsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import { TablePagination } from '../components/table'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const emptyFilters = {
  school: 'Select',
  title: 'Select',
  status: 'Select',
}

const emptySidebarForm = {
  schoolId: '',
  departmentTitle: '',
  isViewOnWeb: 'Yes',
  status: 'Active',
  note: '',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'title', label: 'Title' },
  { key: 'note', label: 'Note' },
  { key: 'status', label: 'Status' },
]

const TeacherDepartment = () => {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingDepartmentId, setEditingDepartmentId] = useState(null)

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [isAddSidebarOpen, setIsAddSidebarOpen] = useState(false)
  const [isEditSidebarOpen, setIsEditSidebarOpen] = useState(false)
  const [editStep, setEditStep] = useState(0)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [editForm, setEditForm] = useState(emptySidebarForm)
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(
    () => schoolsLookup.map((s) => s.schoolName),
    [schoolsLookup],
  )
  const titleOptions = useMemo(
    () => Array.from(new Set(departments.map((item) => item.title).filter(Boolean))).sort(),
    [departments],
  )

  const filteredDepartments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return departments.filter((row) => {
      const matchesSearch =
        normalizedSearch === '' ||
        [row.schoolName, row.title, row.note, row.status]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)

      const matchesSchool = filters.school === 'Select' || row.schoolName === filters.school
      const matchesTitle = filters.title === 'Select' || row.title === filters.title
      const matchesStatus = filters.status === 'Select' || row.status === filters.status

      return matchesSearch && matchesSchool && matchesTitle && matchesStatus
    })
  }, [departments, filters, search])

  const paginatedDepartments = useMemo(() => filteredDepartments, [filteredDepartments])

  const allVisibleSelected =
    paginatedDepartments.length > 0 &&
    paginatedDepartments.every((row) => selectedRows.includes(row.id))

  const loadDepartments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchDepartmentsPage(currentPage - 1, rowsPerPage)
      if (Array.isArray(data)) {
        setDepartments(data)
        setTotalElements(data.length)
        setTotalPages(1)
      } else {
        setDepartments(Array.isArray(data?.content) ? data.content : [])
        setTotalElements(Number.isFinite(data?.totalElements) ? data.totalElements : 0)
        setTotalPages(Math.max(1, Number.isFinite(data?.totalPages) ? data.totalPages : 1))
      }
    } catch (e) {
      setDepartments([])
      setTotalElements(0)
      setTotalPages(1)
      setError(e?.message || 'Failed to load departments')
    } finally {
      setLoading(false)
    }
  }, [currentPage, rowsPerPage])

  const loadSchoolsLookup = useCallback(async () => {
    try {
      const rows = await fetchSchoolsLookup()
      setSchoolsLookup(rows)
    } catch {
      setSchoolsLookup([])
    }
  }, [])

  useEffect(() => {
    void loadDepartments()
  }, [loadDepartments])

  useEffect(() => {
    void loadSchoolsLookup()
  }, [loadSchoolsLookup])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleSearchChange = (event) => {
    setSearch(event.target.value)
    setCurrentPage(1)
  }

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(Number(event.target.value))
    setCurrentPage(1)
  }

  const handlePendingFilterChange = (event) => {
    const { id, value } = event.target
    setPendingFilters((current) => ({ ...current, [id]: value }))
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

  const handleSidebarInputChange = (event) => {
    const { id, value } = event.target
    setEditForm((current) => ({ ...current, [id]: value }))
  }

  const openAddSidebar = () => {
    setError('')
    setIsAddSidebarOpen(true)
  }

  const closeAddSidebar = () => {
    setIsAddSidebarOpen(false)
  }

  const openEditSidebar = (row) => {
    setError('')
    setEditingDepartmentId(row.id)
    setEditForm({
      schoolId: row.schoolId != null ? String(row.schoolId) : '',
      departmentTitle: row.title || '',
      isViewOnWeb: row.isViewOnWeb || 'Yes',
      status: row.status || 'Active',
      note: row.note || '',
    })
    setEditStep(0)
    setIsEditSidebarOpen(true)
  }

  const closeEditSidebar = () => {
    setIsEditSidebarOpen(false)
    setEditForm(emptySidebarForm)
    setEditStep(0)
    setEditingDepartmentId(null)
  }

  const closeAllSidebars = () => {
    closeAddSidebar()
    closeEditSidebar()
    setIsFilterSidebarOpen(false)
  }

  const handleAddSuccess = async () => {
    if (currentPage !== 1) setCurrentPage(1)
    else await loadDepartments()
  }

  const mapFormToPayload = (form) => ({
    schoolId: form.schoolId ? Number(form.schoolId) : null,
    title: form.departmentTitle || '',
    note: form.note || '',
    isViewOnWeb: form.isViewOnWeb || 'Yes',
    status: form.status || 'Active',
  })

  const handleEditSubmit = async () => {
    if (saving) return
    if (!editingDepartmentId) {
      setError('No department selected for update')
      return
    }

    setSaving(true)
    setError('')
    try {
      await updateDepartment(editingDepartmentId, mapFormToPayload(editForm))
      closeEditSidebar()
      await loadDepartments()
    } catch (e) {
      setError(e?.message || 'Failed to update department')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDepartment = async (departmentId) => {
    if (!departmentId) return
    const confirmed = window.confirm('Delete this department? This cannot be undone.')
    if (!confirmed) return

    setSaving(true)
    setError('')
    try {
      await deleteDepartment(departmentId)
      setSelectedRows((current) => current.filter((id) => id !== departmentId))
      await loadDepartments()
    } catch (e) {
      setError(e?.message || 'Failed to delete department')
    } finally {
      setSaving(false)
    }
  }

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows((current) => [
        ...new Set([...current, ...paginatedDepartments.map((row) => row.id)]),
      ])
      return
    }

    setSelectedRows((current) =>
      current.filter((id) => !paginatedDepartments.some((row) => row.id === id)),
    )
  }

  const handleSelectRow = (id) => {
    setSelectedRows((current) =>
      current.includes(id) ? current.filter((rowId) => rowId !== id) : [...current, id],
    )
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let page = start; page <= end; page += 1) pages.push(page)
    return pages
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Teacher Department</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Teacher Department</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
          <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAddSidebar}>
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add Department
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
              value={rowsPerPage}
              onChange={(v) => {
                setRowsPerPage(v)
                setCurrentPage(1)
              }}
              className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
            />
            </div>
<form className="navbar-search dt-search m-0" onSubmit={(event) => event.preventDefault()}>
                <input
                  type="text"
                  className="dt-input bg-transparent radius-4"
                  name="search"
                  placeholder="Search..."
                  value={search}
                  onChange={handleSearchChange}
                />
                <iconify-icon icon="ion:search-outline" className="icon"></iconify-icon>
              </form>
            
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" id="teacherDepartmentTable">
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input className="form-check-input" type="checkbox" checked={allVisibleSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.title ? <th scope="col">Title</th> : null}
                  {visibleColumns.note ? <th scope="col">Note</th> : null}
                  {visibleColumns.status ? <th scope="col">Status</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-24 text-secondary-light">
                      Loading departments...
                    </td>
                  </tr>
                ) : paginatedDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-24 text-secondary-light">
                      No departments found for the current filters.
                    </td>
                  </tr>
                ) : (
                  paginatedDepartments.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.school ? <td>{row.schoolName}</td> : null}
                      {visibleColumns.title ? <td>{row.title}</td> : null}
                      {visibleColumns.note ? <td>{row.note || '-'}</td> : null}
                      {visibleColumns.status ? (
                        <td>
                          <span
                            className={
                              row.status === 'Active'
                                ? 'bg-success-100 text-success-600 px-24 py-4 radius-4 fw-medium text-sm'
                                : 'bg-danger-100 text-danger-600 px-24 py-4 radius-4 fw-medium text-sm'
                            }
                          >
                            {row.status}
                          </span>
                        </td>
                      ) : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => openEditSidebar(row)}
                            title="Edit"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => handleDeleteDepartment(row.id)}
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

          <div className="px-20 py-16 border-top border-neutral-200">
            <TablePagination
              paginationProps={{
                currentPage,
                totalPages,
                totalRecords: totalElements,
                rowsPerPage,
                pageInfo: `Showing ${totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - ${totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)} of ${totalElements} entries`,
                onPageChange: (next) => setCurrentPage(Math.min(Math.max(1, Number(next) || 1), totalPages)),
              }}
            />
          </div>
        </div>
      </div>

      <div
        className={`overlay bg-black bg-opacity-50 w-100 h-100 position-fixed z-9 visibility-hidden opacity-0 duration-300 ${
          isAddSidebarOpen || isEditSidebarOpen || isFilterSidebarOpen ? 'active' : ''
        }`}
        onClick={closeAllSidebars}
      ></div>

      <AddDepartmentModal
        open={isAddSidebarOpen}
        onClose={closeAddSidebar}
        schoolsLookup={schoolsLookup}
        onSuccess={handleAddSuccess}
      />

      <WizardPopup
        modalWidth="500px"
        open={isEditSidebarOpen}
        title="Edit Teacher Department"
        steps={['Basic']}
        step={editStep}
        onClose={closeEditSidebar}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(1, s + 1))}
        onSubmit={handleEditSubmit}
        submitLabel="Update"
      >
        <div>
          <div className="avm-grid">
            <div className="avm-field full">
              <label htmlFor="schoolId" className="avm-label">
                School Name
              </label>
              <div className="avm-input-with-icon" style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#667085', fontSize: '0.95rem', lineHeight: 1, pointerEvents: 'none', zIndex: 1 }}>
                  <i className="ri-school-line"></i>
                </span>
                <select
                  id="schoolId"
                  className="avm-select"
                  value={editForm.schoolId}
                  onChange={(event) => handleSidebarInputChange(event)}
                >
                  <option value="">Select School</option>
                  {schoolsLookup.map((row) => (
                    <option key={row.id} value={String(row.id)}>
                      {row.schoolName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="avm-field full">
              <label htmlFor="departmentTitle" className="avm-label">
                Department Title
              </label>
              <div className="avm-input-with-icon" style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#667085', fontSize: '0.95rem', lineHeight: 1, pointerEvents: 'none', zIndex: 1 }}>
                  <i className="ri-bookmark-line"></i>
                </span>
                <input
                  type="text"
                  className="avm-input"
                  id="departmentTitle"
                  placeholder="Enter Department Title"
                  value={editForm.departmentTitle}
                  onChange={(event) => handleSidebarInputChange(event)}
                />
              </div>
            </div>
            <div className="avm-field full">
              <label htmlFor="status" className="avm-label">
                Status
              </label>
              <div className="avm-input-with-icon" style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#667085', fontSize: '0.95rem', lineHeight: 1, pointerEvents: 'none', zIndex: 1 }}>
                  <i className="ri-checkbox-circle-line"></i>
                </span>
                <select
                  id="status"
                  className="avm-select"
                  value={editForm.status}
                  onChange={(event) => handleSidebarInputChange(event)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="avm-grid">
            <div className="avm-field full">
              <label htmlFor="note" className="avm-label">
                Note
              </label>
              <div className="avm-input-with-icon" style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.85rem', top: '1.2rem', color: '#667085', fontSize: '0.95rem', lineHeight: 1, pointerEvents: 'none', zIndex: 1 }}>
                  <i className="ri-sticky-note-line"></i>
                </span>
                <textarea
                  rows="4"
                  className="avm-input"
                  id="note"
                  placeholder="Enter Note"
                  value={editForm.note}
                  onChange={(event) => handleSidebarInputChange(event)}
                />
              </div>
            </div>
          </div>
        </div>
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Departments"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label htmlFor="school" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
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
            <label htmlFor="title" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Title
            </label>
            <select
              id="title"
              className="form-control form-select"
              value={pendingFilters.title}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Title</option>
              {titleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Status
            </label>
            <select
              id="status"
              className="form-control form-select"
              value={pendingFilters.status}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
              Reset
            </button>
          </div>
          <div>
            <button
              type="submit"
              className="btn btn-primary-600 w-100"
              onClick={() => setIsFilterSidebarOpen(false)}
            >
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default TeacherDepartment
