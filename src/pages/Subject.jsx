import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import { TablePagination } from '../components/table'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { fetchSubjects, deleteSubject } from '../apis/subjectsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const emptyFilters = {
  headOfficeId: 'Select',
  school: 'Select',
  className: 'Select',
  type: 'Select',
  teacher: 'Select',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'name', label: 'Name' },
  { key: 'subjectCode', label: 'Subject Code' },
  { key: 'className', label: 'Class' },
  { key: 'teacher', label: 'Teacher' },
]

const typeBadge = (type) => {
  if (type === 'Core') return 'bg-primary-100 text-primary-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (type === 'Elective') return 'bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (type === 'Optional') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
}

const SubjectList = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId } = useAuth()
  const { activeSchoolId } = useSchool()
  
  const [subjects, setSubjects] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [headOfficesLookup, setHeadOfficesLookup] = useState([])

  const scopedSchoolId = activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
  const isSchoolLocked = Boolean(scopedSchoolId) && role !== 'SUPER_ADMIN'
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const roleUpper = String(role || '').toUpperCase()
  const canAddSubject = roleUpper !== 'STUDENT' && roleUpper !== 'PARENT'

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchSubjects()
      setSubjects(Array.isArray(data) ? data : [])
    } catch (e) {
      setSubjects([])
      setError(e?.message || 'Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData, refreshKey])

  useEffect(() => {
    fetchSchoolsLookup().then(setSchoolsLookup).catch(() => setSchoolsLookup([]))
  }, [])

  useEffect(() => {
    void fetchHeadOfficesPage(0, 500)
      .then((page) => setHeadOfficesLookup(Array.isArray(page?.content) ? page.content : []))
      .catch(() => setHeadOfficesLookup([]))
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    setSelectedRows([])
  }, [scopedSchoolId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return subjects.filter((r) => {
      const matchesSearch =
        !q ||
        [r?.school, r?.name, r?.subjectCode, r?.className, r?.teacher, r?.type]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesSchool = filters.school === 'Select' || r?.school === filters.school
      const matchesClass = filters.className === 'Select' || r?.className === filters.className
      const matchesType = filters.type === 'Select' || r?.type === filters.type
      const matchesTeacher = filters.teacher === 'Select' || r?.teacher === filters.teacher
      return matchesSearch && matchesSchool && matchesClass && matchesType && matchesTeacher
    })
  }, [subjects, search, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((r) => selectedRows.includes(r.id))

  const handleSelectAll = (e) => {
    if (e.target.checked)
      setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((r) => r.id)])])
    else setSelectedRows((prev) => prev.filter((id) => !paginated.some((r) => r.id === id)))
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
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

  const openAdd = () => {
    if (!canAddSubject) return
    sessionStorage.removeItem('edit-subject-row')
    onNavigate('add-subject')
  }

  const openEdit = (row) => {
    sessionStorage.setItem('edit-subject-row', JSON.stringify(row))
    onNavigate('add-subject')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject?')) return
    try {
      await deleteSubject(id)
      setRefreshKey((k) => k + 1)
    } catch (e) {
      alert(e.message)
    }
  }

  const schoolOptions = useMemo(() => {
    const rows = Array.isArray(schoolsLookup) ? schoolsLookup : []
    const filtered = pendingFilters.headOfficeId && pendingFilters.headOfficeId !== 'Select'
      ? rows.filter((school) => String(school?.headOfficeId ?? '') === String(pendingFilters.headOfficeId))
      : rows
    const fromRows = filtered.map((r) => r?.schoolName || r?.name).filter(Boolean)
    return Array.from(new Set(fromRows)).sort()
  }, [schoolsLookup, pendingFilters.headOfficeId])

  const teacherFilterOptions = useMemo(() => {
    const fromRows = subjects.map((r) => r?.teacher).filter(Boolean)
    return Array.from(new Set(fromRows)).sort()
  }, [subjects])

  const classFilterOptions = useMemo(() => {
    const fromRows = subjects.map((r) => r?.className).filter(Boolean)
    return Array.from(new Set(fromRows)).sort()
  }, [subjects])

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Subject</h1>
          <span className="text-secondary-light">Academic / Subject</span>
        </div>
        {canAddSubject && (
          <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <i className="ri-add-large-line"></i> Add Subject
          </button>
        )}
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
                            <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />
              
              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
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

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                  Filter
                </span>
                <span>
                  <i className="ri-arrow-right-line"></i>
                </span>
              </button>

              <RowsPerPageSelect
                value={rowsPerPage}
                onChange={(v) => {
                  setRowsPerPage(v)
                  setCurrentPage(1)
                }}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search subjects..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: 80 }}>
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school && <th scope="col">School</th>}
                  {visibleColumns.name && <th scope="col">Name</th>}
                  {visibleColumns.subjectCode && <th scope="col">Subject Code</th>}
                  {visibleColumns.className && <th scope="col">Class</th>}
                  {visibleColumns.teacher && <th scope="col">Teacher</th>}
                  <th scope="col" style={{ width: 100 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40">Loading...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40">No records found.</td></tr>
                ) : (
                  paginated.map((row, idx) => (
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
                      {visibleColumns.school && <td>{row.school || '-'}</td>}
                      {visibleColumns.name && (
                        <td>
                          <span className="fw-medium text-primary-light d-block">{row.name}</span>
                          {row.type && (
                            <span className={typeBadge(row.type)} style={{ marginTop: 4, display: 'inline-block' }}>
                              {row.type}
                            </span>
                          )}
                        </td>
                      )}
                      {visibleColumns.subjectCode && (
                        <td>
                          <span className="bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm">
                            {row.subjectCode || '-'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.className && <td>{row.className || '-'}</td>}
                      {visibleColumns.teacher && <td>{row.teacher || '-'}</td>}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            onClick={() => openEdit(row)}
                            title="Edit"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
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

          <div className="px-20 py-16 border-top border-neutral-200">
            <TablePagination
              paginationProps={{
                currentPage,
                totalPages,
                totalRecords: filtered.length,
                rowsPerPage,
                pageInfo: `Showing ${filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, filtered.length)} of ${filtered.length} entries`,
                onPageChange: (next) => setCurrentPage(Math.min(Math.max(1, Number(next) || 1), totalPages)),
              }}
            />
          </div>
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Subjects"
        onClose={() => setIsFilterSidebarOpen(false)}
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Head Office</label>
            <select
              className="form-control form-select"
              value={pendingFilters.headOfficeId}
              onChange={(e) => setPendingFilters((p) => ({ ...p, headOfficeId: e.target.value, school: 'Select' }))}
            >
              <option value="Select">Select Head Office</option>
              {headOfficesLookup.map((ho) => (
                <option key={String(ho.id)} value={String(ho.id)}>
                  {ho.name || ho.headOfficeName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">School</label>
            <select
              className="form-control form-select"
              value={filters.school}
              onChange={(e) => setPendingFilters(p => ({ ...p, school: e.target.value }))}
            >
              <option value="Select">Select School</option>
              {schoolOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Class</label>
            <select
              className="form-control form-select"
              value={filters.className}
              onChange={(e) => setPendingFilters(p => ({ ...p, className: e.target.value }))}
            >
              <option value="Select">Select Class</option>
              {classFilterOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Teacher</label>
            <select
              className="form-control form-select"
              value={filters.teacher}
              onChange={(e) => setPendingFilters(p => ({ ...p, teacher: e.target.value }))}
            >
              <option value="Select">Select Teacher</option>
              {teacherFilterOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="d-flex gap-8 mt-12">
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">Reset</button>
            <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default SubjectList
