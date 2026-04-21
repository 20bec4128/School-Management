import { useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import '../css/addModalShared.css'

const students = [
  { sl: '01', admissionNo: 'AD52365', name: 'Kathryn Murphy', rollNo: '12', image: '/assets/images/thumbs/avatar-img1.png', className: 'Class 1 (A)', classGroup: 'Primary', section: 'Arts', dob: '05 May 2012', gender: 'Male', mobile: '209.555.0104', category: 'General', status: 'Active' },
  { sl: '02', admissionNo: 'AD52365', name: 'Floyd Miles', rollNo: '1', image: '/assets/images/thumbs/avatar-img2.png', className: 'Class 2 (B)', classGroup: 'Primary', section: 'Science', dob: '05 May 2012', gender: 'Female', mobile: '209.555.0104', category: 'Special', status: 'Inactive' },
  { sl: '03', admissionNo: 'AD52367', name: 'Cody Fisher', rollNo: '7', image: '/assets/images/thumbs/avatar-img3.png', className: 'Class 3 (A)', classGroup: 'SSC', section: 'Commerce', dob: '12 Feb 2013', gender: 'Male', mobile: '207.445.9821', category: 'OBC', status: 'Active' },
  { sl: '04', admissionNo: 'AD52368', name: 'Jane Cooper', rollNo: '8', image: '/assets/images/thumbs/avatar-img4.png', className: 'Class 4 (C)', classGroup: 'SSC', section: 'Arts', dob: '17 Mar 2014', gender: 'Female', mobile: '204.658.4421', category: 'Special', status: 'Inactive' },
  { sl: '05', admissionNo: 'AD52369', name: 'Esther Howard', rollNo: '15', image: '/assets/images/thumbs/avatar-img5.png', className: 'Class 5 (B)', classGroup: 'HSC', section: 'Science', dob: '25 Jul 2013', gender: 'Female', mobile: '209.875.9987', category: 'General', status: 'Active' },
  { sl: '06', admissionNo: 'AD52370', name: 'Albert Flores', rollNo: '3', image: '/assets/images/thumbs/avatar-img6.png', className: 'Class 6 (A)', classGroup: 'HSC', section: 'Commerce', dob: '08 Dec 2011', gender: 'Male', mobile: '208.324.1110', category: 'OBC', status: 'Inactive' },
  { sl: '07', admissionNo: 'AD52371', name: 'Jenny Wilson', rollNo: '9', image: '/assets/images/thumbs/avatar-img7.png', className: 'Class 7 (C)', classGroup: 'Hons', section: 'Arts', dob: '19 Sep 2010', gender: 'Female', mobile: '206.211.4567', category: 'General', status: 'Active' },
  { sl: '08', admissionNo: 'AD52367', name: 'Jane Cooper', rollNo: '5', image: '/assets/images/thumbs/avatar-img3.png', className: 'Class 3 (A)', classGroup: 'SSC', section: 'Science', dob: '12 Jan 2013', gender: 'Female', mobile: '202.444.0089', category: 'OBC', status: 'Active' },
  { sl: '09', admissionNo: 'AD52368', name: 'Cameron Williamson', rollNo: '23', image: '/assets/images/thumbs/avatar-img4.png', className: 'Class 4 (C)', classGroup: 'SSC', section: 'Commerce', dob: '08 Jul 2011', gender: 'Male', mobile: '203.111.0456', category: 'SC', status: 'Inactive' },
  { sl: '10', admissionNo: 'AD52369', name: 'Theresa Webb', rollNo: '10', image: '/assets/images/thumbs/avatar-img5.png', className: 'Class 5 (A)', classGroup: 'HSC', section: 'Arts', dob: '18 Nov 2010', gender: 'Female', mobile: '205.777.0190', category: 'General', status: 'Active' },
  { sl: '11', admissionNo: 'AD52370', name: 'Marvin McKinney', rollNo: '7', image: '/assets/images/thumbs/avatar-img6.png', className: 'Class 6 (B)', classGroup: 'HSC', section: 'Science', dob: '21 Mar 2011', gender: 'Male', mobile: '209.660.0912', category: 'General', status: 'Active' },
  { sl: '12', admissionNo: 'AD52371', name: 'Courtney Henry', rollNo: '15', image: '/assets/images/thumbs/avatar-img7.png', className: 'Class 7 (A)', classGroup: 'Hons', section: 'Commerce', dob: '10 Feb 2009', gender: 'Female', mobile: '204.120.0023', category: 'OBC', status: 'Inactive' },
]

const emptyFilters = {
  classGroup: 'Select',
  section: 'Select',
  gender: 'Select',
  status: 'Select',
}

const emptySidebarForm = {
  roleName: '',
  enterDate: '',
}

const StudentList = () => {
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

  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return students.filter((student) => {
      const matchesSearch =
        normalizedSearch === '' ||
        [
          student.admissionNo,
          student.name,
          student.className,
          student.dob,
          student.gender,
          student.mobile,
          student.category,
          student.status,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)

      const matchesClass =
        filters.classGroup === 'Select' || student.classGroup === filters.classGroup
      const matchesSection =
        filters.section === 'Select' || student.section === filters.section
      const matchesGender =
        filters.gender === 'Select' || student.gender === filters.gender
      const matchesStatus =
        filters.status === 'Select' || student.status === filters.status

      return (
        matchesSearch &&
        matchesClass &&
        matchesSection &&
        matchesGender &&
        matchesStatus
      )
    })
  }, [filters, search])

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage))

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredStudents.slice(start, start + rowsPerPage)
  }, [currentPage, filteredStudents, rowsPerPage])

  const allVisibleSelected =
    paginatedStudents.length > 0 &&
    paginatedStudents.every((student) => selectedRows.includes(student.sl))

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

  const openEditSidebar = (student) => {
    setEditForm({
      roleName: student.name,
      enterDate: '',
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
        ...new Set([...current, ...paginatedStudents.map((student) => student.sl)]),
      ])
      return
    }

    setSelectedRows((current) =>
      current.filter((id) => !paginatedStudents.some((student) => student.sl === id)),
    )
  }

  const handleSelectRow = (studentId) => {
    setSelectedRows((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    )
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)

    for (let page = start; page <= end; page += 1) {
      pages.push(page)
    }

    return pages
  }

  return (
    <>
      <div className="dashboard-main-body">
        <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
          <div>
            <h1 className="fw-semibold mb-4 h6 text-primary-light">Student List</h1>
            <div>
              <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
                Dashboard
              </button>
              <span className="text-secondary-light"> / Student List</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={openAddSidebar}
          >
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add Student
          </button>
        </div>

        <div className="mt-24">
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
                        <button
                          type="button"
                          className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                        >
                          <i className="ri-file-3-line"></i>
                          PDF
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                        >
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
                    <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                      Filter
                    </span>
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
                <table className="table bordered-table mb-0 data-table" id="dataTable">
                  <thead>
                    <tr>
                      <th scope="col">
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" checked={allVisibleSelected} onChange={handleSelectAll} />
                          <label className="form-check-label">S.L</label>
                        </div>
                      </th>
                      <th scope="col">Admission No</th>
                      <th scope="col">Name</th>
                      <th scope="col">Class</th>
                      <th scope="col">Date of Birth</th>
                      <th scope="col">Gender</th>
                      <th scope="col">Mobile Number</th>
                      <th scope="col">Category</th>
                      <th scope="col">Status</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map((student) => (
                      <tr key={student.sl}>
                        <td>
                          <div className="form-check style-check d-flex align-items-center">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={selectedRows.includes(student.sl)}
                              onChange={() => handleSelectRow(student.sl)}
                            />
                            <label className="form-check-label">{student.sl}</label>
                          </div>
                        </td>
                        <td>
                          <span className="text-primary-600">{student.admissionNo}</span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={student.image}
                              alt={student.name}
                              className="flex-shrink-0 me-12 radius-8"
                            />
                            <div>
                              <h6 className="text-md mb-0 fw-medium flex-grow-1">{student.name}</h6>
                              <span>
                                Roll No: <span className="fw-semibold">{student.rollNo}</span>
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>{student.className}</td>
                        <td>{student.dob}</td>
                        <td>{student.gender}</td>
                        <td>{student.mobile}</td>
                        <td>{student.category}</td>
                        <td>
                          <span
                            className={
                              student.status === 'Active'
                                ? 'bg-success-100 text-success-600 px-24 py-4 radius-4 fw-medium text-sm'
                                : 'bg-danger-100 text-danger-600 px-24 py-4 radius-4 fw-medium text-sm'
                            }
                          >
                            {student.status}
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
                                >
                                  <i className="ri-user-3-line"></i>
                                  View Teacher
                                </button>
                              </li>
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6"
                                  onClick={() => openEditSidebar(student)}
                                >
                                  <i className="ri-edit-2-line"></i>
                                  Edit
                                </button>
                              </li>
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6"
                                >
                                  <i className="ri-money-dollar-box-line"></i>
                                  Collect Fees
                                </button>
                              </li>
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6"
                                >
                                  <i className="ri-error-warning-line"></i>
                                  Inactive
                                </button>
                              </li>
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6"
                                >
                                  <i className="ri-delete-bin-6-line"></i>
                                  Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="text-center py-24 text-secondary-light">
                          No students found for the current filters.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
                <span className="text-sm text-secondary-light">
                  Showing {filteredStudents.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
                  {' '}-{' '}
                  {Math.min(currentPage * rowsPerPage, filteredStudents.length)} of {filteredStudents.length}
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
        </div>
      </div>

      <footer className="d-footer">
        <div>
          <p className="mb-0 text-center">
            &copy; {new Date().getFullYear()} Made With &#10084; by Wowtheme7.
          </p>
        </div>
      </footer>

      <div
        className={`overlay bg-black bg-opacity-50 w-100 h-100 position-fixed z-9 visibility-hidden opacity-0 duration-300 ${isAddSidebarOpen || isEditSidebarOpen || isFilterSidebarOpen ? 'active' : ''
          }`}
        onClick={closeAllSidebars}
      ></div>

      <WizardPopup
        open={isAddSidebarOpen}
        title="Add Student"
        steps={['Basic', 'Date']}
        step={addStep}
        onClose={closeAddSidebar}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(1, s + 1))}
        onSubmit={handleAddSubmit}
        submitLabel="Save"
      >
        {addStep === 0 ? (
          <div className="avm-grid">
            <div className="avm-field full">
              <label htmlFor="roleName" className="avm-label">
                Role Name
              </label>
              <input
                type="text"
                className="avm-input"
                id="roleName"
                placeholder="Enter Role Name"
                value={addForm.roleName}
                onChange={(event) => handleSidebarInputChange(event, 'add')}
              />
            </div>
          </div>
        ) : (
          <div className="avm-grid">
            <div className="avm-field full">
              <label htmlFor="enterDate" className="avm-label">
                Date
              </label>
              <input
                type="date"
                className="avm-input"
                id="enterDate"
                value={addForm.enterDate}
                onChange={(event) => handleSidebarInputChange(event, 'add')}
              />
            </div>
          </div>
        )}
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
              <label
                htmlFor="roleName"
                className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
              >
                Role Name
              </label>
              <input
                type="text"
                className="form-control"
                id="roleName"
                placeholder="Enter Role Name"
                value={editForm.roleName}
                onChange={(event) => handleSidebarInputChange(event, 'edit')}
              />
            </div>
            <div className="col-sm-12">
              <label
                htmlFor="enterDate"
                className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
              >
                Date
              </label>
              <input
                type="date"
                className="form-control"
                id="enterDate"
                value={editForm.enterDate}
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
        title="Filter Students"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label htmlFor="classGroup" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class
            </label>
            <select
              id="classGroup"
              className="form-control form-select"
              value={pendingFilters.classGroup}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Class</option>
              <option value="Primary">Primary</option>
              <option value="SSC">SSC</option>
              <option value="HSC">HSC</option>
              <option value="Hons">Hons</option>
              <option value="Masters">Masters</option>
            </select>
          </div>
          <div>
            <label htmlFor="section" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Section
            </label>
            <select
              id="section"
              className="form-control form-select"
              value={pendingFilters.section}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Section</option>
              <option value="Arts">Arts</option>
              <option value="Science">Science</option>
              <option value="Commerce">Commerce</option>
            </select>
          </div>
          <div>
            <label htmlFor="gender" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Gender
            </label>
            <select
              id="gender"
              className="form-control form-select"
              value={pendingFilters.gender}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
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
    </>
  )
}

export default StudentList
