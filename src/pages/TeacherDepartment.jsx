import { useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import WizardPopup from '../components/WizardPopup'
import '../css/addModalShared.css'

const departments = [
  { sl: '01', school: 'ABC School', title: 'Principal', note: 'Main admin', status: 'Active' },
  { sl: '02', school: 'XYZ School', title: 'Vice Principal', note: 'Operations lead', status: 'Active' },
  { sl: '03', school: 'DEF Academy', title: 'Head Teacher', note: 'Department head', status: 'Inactive' },
  { sl: '04', school: 'GHI College', title: 'Senior Teacher', note: 'Experienced staff', status: 'Active' },
  { sl: '05', school: 'JKL High School', title: 'Teacher', note: '', status: 'Inactive' },
  { sl: '06', school: 'MNO School', title: 'Assistant Teacher', note: 'Primary section', status: 'Active' },
]

const emptyFilters = {
  school: 'Select',
  title: 'Select',
  status: 'Select',
}

const emptySidebarForm = {
  departmentTitle: '',
  note: '',
}

const TeacherDepartment = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [isAddSidebarOpen, setIsAddSidebarOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [isEditSidebarOpen, setIsEditSidebarOpen] = useState(false)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [addForm, setAddForm] = useState(emptySidebarForm)
  const [editForm, setEditForm] = useState(emptySidebarForm)

  const schoolOptions = useMemo(
    () => Array.from(new Set(departments.map((item) => item.school))),
    [],
  )
  const titleOptions = useMemo(
    () => Array.from(new Set(departments.map((item) => item.title))),
    [],
  )

  const filteredDepartments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return departments.filter((row) => {
      const matchesSearch =
        normalizedSearch === '' ||
        [row.school, row.title, row.note, row.status]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)

      const matchesSchool = filters.school === 'Select' || row.school === filters.school
      const matchesTitle = filters.title === 'Select' || row.title === filters.title
      const matchesStatus = filters.status === 'Select' || row.status === filters.status

      return matchesSearch && matchesSchool && matchesTitle && matchesStatus
    })
  }, [filters, search])

  const totalPages = Math.max(1, Math.ceil(filteredDepartments.length / rowsPerPage))

  const paginatedDepartments = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredDepartments.slice(start, start + rowsPerPage)
  }, [currentPage, filteredDepartments, rowsPerPage])

  const allVisibleSelected =
    paginatedDepartments.length > 0 &&
    paginatedDepartments.every((row) => selectedRows.includes(row.sl))

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

  const handleSidebarInputChange = (event, mode) => {
    const { id, value } = event.target
    if (mode === 'add') {
      setAddForm((current) => ({ ...current, [id]: value }))
      return
    }
    setEditForm((current) => ({ ...current, [id]: value }))
  }

  const openAddSidebar = () => {
    setAddForm(emptySidebarForm)
    setAddStep(0)
    setIsAddSidebarOpen(true)
  }

  const closeAddSidebar = () => {
    setIsAddSidebarOpen(false)
    setAddForm(emptySidebarForm)
  }

  const openEditSidebar = (row) => {
    setEditForm({
      departmentTitle: row.title,
      note: row.note || '',
    })
    setIsEditSidebarOpen(true)
  }

  const closeEditSidebar = () => {
    setIsEditSidebarOpen(false)
    setEditForm(emptySidebarForm)
  }

  const closeAllSidebars = () => {
    closeAddSidebar()
    closeEditSidebar()
    setIsFilterSidebarOpen(false)
  }

  const handleAddSubmit = (event) => {
    event?.preventDefault?.()
    closeAddSidebar()
  }

  const handleEditSubmit = (event) => {
    event.preventDefault()
    closeEditSidebar()
  }

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows((current) => [
        ...new Set([...current, ...paginatedDepartments.map((row) => row.sl)]),
      ])
      return
    }

    setSelectedRows((current) =>
      current.filter((id) => !paginatedDepartments.some((row) => row.sl === id)),
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
        <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAddSidebar}>
          <span className="d-flex text-md">
            <i className="ri-add-large-line"></i>
          </span>
          Add Department
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
                    <i className="ri-file-upload-line text-md line-height-1"></i>
                    Export
                  </span>
                  <span>
                    <i className="ri-arrow-down-s-line"></i>
                  </span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
                      <i className="ri-file-3-line"></i>
                      PDF
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10">
                      <i className="ri-file-excel-line"></i>
                      Excel
                    </button>
                  </li>
                </ul>
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
            </div>

            <div className="d-flex align-items-center gap-8 text-secondary-light">
              <span>Rows per page:</span>
              <div className="dt-length">
                <select
                  name="dataTable_length"
                  className="dt-input form-control form-select"
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
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
                  <th scope="col">School</th>
                  <th scope="col">Title</th>
                  <th scope="col">Note</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDepartments.map((row) => (
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
                    <td>{row.school}</td>
                    <td>{row.title}</td>
                    <td>{row.note || '-'}</td>
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
                    <td>
                      <div className="btn-group">
                        <button
                          type="button"
                          className="text-primary-light text-xl border-0 bg-transparent"
                          data-bs-toggle="dropdown"
                          data-bs-display="static"
                          aria-expanded="false"
                        >
                          <iconify-icon icon="tabler:dots-vertical"></iconify-icon>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-lg-end border p-12">
                          <li>
                            <button
                              type="button"
                              className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6"
                              onClick={() => openEditSidebar(row)}
                            >
                              <i className="ri-edit-2-line"></i>
                              Edit
                            </button>
                          </li>
                          <li>
                            <button type="button" className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6">
                              <i className="ri-delete-bin-6-line"></i>
                              Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedDepartments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-24 text-secondary-light">
                      No departments found for the current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filteredDepartments.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
              {' '}-{' '}
              {Math.min(currentPage * rowsPerPage, filteredDepartments.length)} of {filteredDepartments.length}
            </span>

            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
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

      <div
        className={`overlay bg-black bg-opacity-50 w-100 h-100 position-fixed z-9 visibility-hidden opacity-0 duration-300 ${
          isAddSidebarOpen || isEditSidebarOpen || isFilterSidebarOpen ? 'active' : ''
        }`}
        onClick={closeAllSidebars}
      ></div>

      <WizardPopup
        open={isAddSidebarOpen}
        title="Add Teacher Department"
        steps={['Basic']}
        step={addStep}
        onClose={closeAddSidebar}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(1, s + 1))}
        onSubmit={handleAddSubmit}
        submitLabel="Save"
      >
        
          <div className="avm-grid">
            <div className="avm-field full">
              <label htmlFor="departmentTitle" className="avm-label">
                Department Title
              </label>
              <input
                type="text"
                className="avm-input"
                id="departmentTitle"
                placeholder="Enter Department Title"
                value={addForm.departmentTitle}
                onChange={(event) => handleSidebarInputChange(event, 'add')}
              />
            </div>
          </div>
        
          <div className="avm-grid">
            <div className="avm-field full">
              <label htmlFor="note" className="avm-label">
                Note
              </label>
              <textarea
                type="text"
                rows='4'
                className="avm-input"
                id="note"
                placeholder="Enter Note"
                value={addForm.note}
                onChange={(event) => handleSidebarInputChange(event, 'add')}
              />
            </div>
          </div>
      
      </WizardPopup>

      <SlideSidebar
        isOpen={isEditSidebarOpen}
        title="Edit Department"
        onClose={closeEditSidebar}
        className="edit-sidebar"
      >
        <form className="d-flex flex-column p-20" onSubmit={handleEditSubmit}>
          <div className="row g-3">
            <div className="col-sm-12">
              <label htmlFor="departmentTitle" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                Department Title
              </label>
              <input
                type="text"
                className="form-control"
                id="departmentTitle"
                placeholder="Enter Department Title"
                value={editForm.departmentTitle}
                onChange={(event) => handleSidebarInputChange(event, 'edit')}
              />
            </div>
            <div className="col-sm-12">
              <label htmlFor="note" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                Note
              </label>
              <input
                type="text"
                className="form-control"
                id="note"
                placeholder="Enter Note"
                value={editForm.note}
                onChange={(event) => handleSidebarInputChange(event, 'edit')}
              />
            </div>
            <div className="col-12">
              <div className="d-flex align-items-center justify-content-center gap-3 mt-8">
                <button
                  type="button"
                  className="border border-danger-600 bg-hover-danger-200 text-danger-600 text-md px-50 py-11 radius-8"
                  onClick={closeEditSidebar}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary-600 border border-primary-600 text-md px-28 py-12 radius-8 max-w-156-px w-100"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </form>
      </SlideSidebar>

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
