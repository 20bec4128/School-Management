import { useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import ExportDropdown from '../components/ExportDropdown'
import { fetchOnlineExamsPage, deleteOnlineExam } from '../apis/onlineExamsApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import RowsPerPageSelect from '../components/RowsPerPageSelect'

const EDIT_STORAGE_KEY = 'edit-online-exam-row'

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  className: 'Select',
  subject: 'Select',
  isPublish: 'Select',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'examTitle', label: 'Exam Title' },
  { key: 'className', label: 'Class' },
  { key: 'subject', label: 'Subject' },
  { key: 'totalQuestion', label: 'Total Question' },
  { key: 'isPublish', label: 'Is Publish?' },
]

const getClassLabel = (row) => row?.className || row?.numericName || row?.name || row?.label || ''
const getSubjectLabel = (row) => row?.subjectName || row?.name || row?.label || ''

const OnlineExam = ({ onNavigate } = {}) => {
  const { status, token, role: authRole, user, schoolId: authSchoolId, headOfficeId: authHeadOfficeId, canAdd, canEdit, canDelete } = useAuth()
  const PAGE_SLUG = 'online-exam'
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : null
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [schools, setSchools] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])
  const [rows, setRows] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const getSchoolById = (schoolId) =>
    (Array.isArray(schools) ? schools : []).find((school) => String(school?.id ?? '') === String(schoolId ?? '')) || null

  useEffect(() => {
    if (status !== 'ready' || !token) return
    Promise.all([
      fetchHeadOfficesPage(0, 500),
      fetchSchoolsLookup(),
    ])
      .then(([headOfficePage, rowsData]) => {
        setHeadOffices(Array.isArray(headOfficePage?.content) ? headOfficePage.content : [])
        setSchools(Array.isArray(rowsData) ? rowsData : [])
      })
      .catch((err) => {
        console.error('Failed to load online exam lookups', err)
        setHeadOffices([])
        setSchools([])
      })
  }, [status, token])

  const selectedSchoolId = useMemo(() => {
    if (pendingFilters.schoolId) return String(pendingFilters.schoolId)
    if (isSchoolAdmin) return authSchoolId ? String(authSchoolId) : ''
    return ''
  }, [authSchoolId, isSchoolAdmin, pendingFilters.schoolId])

  const filterSchoolOptions = useMemo(() => {
    const list = Array.isArray(schools) ? schools : []
    if (pendingFilters.headOfficeId) {
      return list.filter((school) => String(school?.headOfficeId ?? '') === String(pendingFilters.headOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return list.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return list.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return list
  }, [authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, pendingFilters.headOfficeId, schools])

  useEffect(() => {
    if (!selectedSchoolId) {
      setClassesLookup([])
      setSubjectsLookup([])
      return
    }

    let cancelled = false
    Promise.all([
      fetchClasses({ schoolId: selectedSchoolId }),
      fetchSubjects({ schoolId: selectedSchoolId }),
    ])
      .then(([classRows, subjectRows]) => {
        if (cancelled) return
        setClassesLookup(Array.isArray(classRows) ? classRows : [])
        setSubjectsLookup(Array.isArray(subjectRows) ? subjectRows : [])
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load class/subject filters', err)
        setClassesLookup([])
        setSubjectsLookup([])
      })

    return () => {
      cancelled = true
    }
  }, [selectedSchoolId])

  const loadData = async () => {
    if (status !== 'ready' || !token) return
    setBusy(true)
    setLoadError('')
    try {
      const pageData = await fetchOnlineExamsPage({
        headOfficeId: filters.headOfficeId || undefined,
        ...(filters.headOfficeId ? {} : isHeadOfficeAdmin ? { headOfficeId: authHeadOfficeId } : {}),
        schoolId: filters.schoolId || (isSchoolAdmin ? authSchoolId : undefined),
        classId: filters.className !== 'Select' ? classesLookup.find((item) => getClassLabel(item) === filters.className)?.id : undefined,
        subjectId: filters.subject !== 'Select' ? subjectsLookup.find((item) => getSubjectLabel(item) === filters.subject)?.id : undefined,
        isPublish: filters.isPublish !== 'Select' ? filters.isPublish : undefined,
        page: currentPage - 1,
        size: rowsPerPage,
        search: debouncedSearch,
      })
      setRows(Array.isArray(pageData?.content) ? pageData.content : [])
      setTotalElements(pageData?.totalElements || 0)
      setTotalPages(pageData?.totalPages || 0)
    } catch (err) {
      console.error('Failed to load online exams:', err)
      setLoadError('Failed to load data. Please try again.')
      setRows([])
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, token, currentPage, rowsPerPage, debouncedSearch, filters])

  const openAdd = () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    } catch {
      // ignore
    }
    navigateTo?.('add-online-exam')
  }

  const openEdit = (row) => {
    try {
      sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row))
    } catch {
      // ignore
    }
    navigateTo?.('add-online-exam')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this online exam?')) return
    try {
      await deleteOnlineExam(id)
      loadData()
    } catch (err) {
      console.error('Failed to delete:', err)
      alert('Failed to delete.')
    }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows(rows.map((row) => row.id))
    else setSelectedRows([])
  }

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) setSelectedRows(selectedRows.filter((rid) => rid !== id))
    else setSelectedRows([...selectedRows, id])
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters({ ...pendingFilters })
    setIsFilterSidebarOpen(false)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setIsFilterSidebarOpen(false)
    setCurrentPage(1)
  }

  const handleFilterHeadOfficeChange = (value) => {
    setPendingFilters((prev) => ({
      ...prev,
      headOfficeId: value,
      schoolId: '',
      className: 'Select',
      subject: 'Select',
    }))
  }

  const handleFilterSchoolChange = (value) => {
    const selectedSchool = getSchoolById(value)
    setPendingFilters((prev) => ({
      ...prev,
      schoolId: value,
      headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
      className: 'Select',
      subject: 'Select',
    }))
  }

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(value)
    setCurrentPage(1)
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p += 1) pages.push(p)
    return pages
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Online Exam</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Online Exam</span>
          </div>
        </div>
        {canAdd(PAGE_SLUG) && (
          <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add Exam
          </button>
        )}
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
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search exam..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={selectedRows.length === rows.length && rows.length > 0}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.examTitle ? <th scope="col">Exam Title</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.subject ? <th scope="col">Subject</th> : null}
                  {visibleColumns.totalQuestion ? <th scope="col">Total Question</th> : null}
                  {visibleColumns.isPublish ? <th scope="col">Is Publish?</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {busy ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40">
                      <div className="spinner-border text-primary" role="status" />
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      {loadError || 'No records found.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + index + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.school ? <td>{row.schoolName}</td> : null}
                      {visibleColumns.examTitle ? <td>{row.examTitle}</td> : null}
                      {visibleColumns.className ? <td>{row.className}</td> : null}
                      {visibleColumns.subject ? <td>{row.subjectName}</td> : null}
                      {visibleColumns.totalQuestion ? <td>{row.totalQuestion || 0}</td> : null}
                      {visibleColumns.isPublish ? (
                        <td>
                          <span
                            className={
                              row.isPublish === 'Yes'
                                ? 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
                                : 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
                            }
                          >
                            {row.isPublish === 'Yes' ? 'Published' : 'Draft'}
                          </span>
                        </td>
                      ) : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          {canEdit(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                              onClick={() => openEdit(row)}
                              title="Edit"
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                          )}
                          {canDelete(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                              onClick={() => handleDelete(row.id)}
                              title="Delete"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          )}
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
              Showing {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, totalElements)} of {totalElements}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        title="Filter Online Exam"
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={(Array.isArray(manualScope.headOffices) && manualScope.headOffices.length > 0
                ? manualScope.headOffices
                : headOffices.map((ho) => ({ id: ho.id, name: ho.name || ho.headOfficeName || '' }))).filter((ho) => ho.id != null && ho.name)}
              schoolOptions={filterSchoolOptions.map((school) => ({ id: school.id, schoolName: school.schoolName || school.name || '' }))}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={handleFilterHeadOfficeChange}
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={handleFilterSchoolChange}
              schoolLabel="School"
            />
          ) : (
            <div className="avm-field full">
              <label htmlFor="schoolId" className="avm-label">
                School
              </label>
              <select
                id="schoolId"
                className="avm-select"
                value={pendingFilters.schoolId}
                onChange={(e) => handleFilterSchoolChange(e.target.value)}
              >
                <option value="">All Schools</option>
                {filterSchoolOptions.map((school) => (
                  <option key={String(school.id)} value={String(school.id)}>
                    {school.schoolName || school.name || String(school.id)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="className" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class
            </label>
            <select
              id="className"
              className="form-control form-select"
              value={pendingFilters.className}
              onChange={(e) => setPendingFilters((prev) => ({
                ...prev,
                className: e.target.value,
                subject: 'Select',
              }))}
            >
              <option value="Select">Select Class</option>
              {classesLookup.map((item) => (
                <option key={item.id} value={getClassLabel(item)}>
                  {getClassLabel(item)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="subject" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Subject
            </label>
            <select
              id="subject"
              className="form-control form-select"
              value={pendingFilters.subject}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, subject: e.target.value }))}
            >
              <option value="Select">Select Subject</option>
              {subjectsLookup.map((item) => (
                <option key={item.id} value={getSubjectLabel(item)}>
                  {getSubjectLabel(item)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="isPublish" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Is Publish?
            </label>
            <select
              id="isPublish"
              className="form-control form-select"
              value={pendingFilters.isPublish}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, isPublish: e.target.value }))}
            >
              <option value="Select">Select</option>
              <option value="Yes">Published</option>
              <option value="No">Draft</option>
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

export default OnlineExam
