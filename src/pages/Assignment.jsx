import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { deleteAssignment, fetchAssignments, fetchAssignmentsForStudent } from '../apis/assignmentsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { can } from '../utils/permissions'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import '../assets/css/addModalShared.css'
import RowsPerPageSelect from '../components/RowsPerPageSelect'

const EDIT_STORAGE_KEY = 'edit-assignment-row'

const emptyFilters = {
  schoolId: 'Select',
  classId: 'Select',
  sectionId: 'Select',
  subjectId: 'Select',
  status: 'Select',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'className', label: 'Class' },
  { key: 'sectionName', label: 'Section' },
  { key: 'subjectName', label: 'Subject' },
  { key: 'title', label: 'Title' },
  { key: 'assignmentDate', label: 'Assignment Date' },
  { key: 'submissionDate', label: 'Submission Date' },
  { key: 'status', label: 'Status' },
  { key: 'assignmentFile', label: 'File' },
]

const statusBadge = (status) => {
  const value = String(status || '').toLowerCase()
  if (value === 'submitted') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (value === 'graded') return 'bg-primary-100 text-primary-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (value === 'pending') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (value === 'overdue') return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
}

const getFileIcon = (fileName) => {
  if (!fileName) return 'ri-file-line'
  const ext = String(fileName).split('.').pop().toLowerCase()
  if (ext === 'pdf') return 'ri-file-pdf-line'
  if (['doc', 'docx'].includes(ext)) return 'ri-file-word-line'
  if (['ppt', 'pptx'].includes(ext)) return 'ri-slideshow-line'
  if (ext === 'txt') return 'ri-file-text-line'
  return 'ri-file-line'
}

const getBestLabel = (...values) =>
  values
    .map((v) => {
      if (v == null) return ''
      const text = String(v).trim()
      return text === 'null' || text === 'undefined' ? '' : text
    })
    .find(Boolean) || ''

const Assignment = ({ onNavigate }) => {
  const { user, role, schoolId: authSchoolId, schoolName: authSchoolName, studentId, selectedChildId, parentChildren } = useAuth()
  const { activeSchoolId } = useSchool()

  const roleUpper = String(role || '').toUpperCase()
  const canManage = can(user, ['ASSIGNMENT_MANAGE', 'ASSIGNMENT_MANAGE_ASSIGNED', '*'])
  const isStudentOrParent = roleUpper === 'STUDENT' || roleUpper === 'PARENT'
  const isParent = roleUpper === 'PARENT'

  const selectedChild = useMemo(() => {
    if (roleUpper !== 'PARENT' || !selectedChildId) return null
    return (parentChildren || []).find(c => String(c.studentId || c.id) === String(selectedChildId))
  }, [roleUpper, parentChildren, selectedChildId])

  const fixedStudentId = roleUpper === 'STUDENT' ? studentId : roleUpper === 'PARENT' ? (selectedChild?.studentId || selectedChild?.id) : null
  const resolvedSchoolId = activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''

  const [rows, setRows] = useState([])
  const [schools, setSchools] = useState([])
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : () => {}

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      let data = []
      if (fixedStudentId) {
        data = await fetchAssignmentsForStudent(fixedStudentId)
      } else if (resolvedSchoolId) {
        data = await fetchAssignments({ schoolId: resolvedSchoolId })
      } else {
        data = await fetchAssignments()
      }
      
      const [schoolsData, classesData, sectionsData, subjectsData] = await Promise.all([
        fetchSchoolsLookup().catch(() => []),
        fetchClasses().catch(() => []),
        fetchSections().catch(() => []),
        fetchSubjects().catch(() => []),
      ])

      setRows(Array.isArray(data) ? data : [])
      setSchools(Array.isArray(schoolsData) ? schoolsData : [])
      setClasses(Array.isArray(classesData) ? classesData : [])
      setSections(Array.isArray(sectionsData) ? sectionsData : [])
      setSubjects(Array.isArray(subjectsData) ? subjectsData : [])
    } catch (e) {
      setRows([])
      setError(e?.message || 'Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }, [fixedStudentId, resolvedSchoolId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const nameMaps = useMemo(() => {
    const schoolMap = new Map(schools.map(s => [String(s.id), s.schoolName || s.name]))
    const classMap = new Map(classes.map(c => [String(c.id), c.className]))
    const sectionMap = new Map(sections.map(s => [String(s.id), s.sectionName]))
    const subjectMap = new Map(subjects.map(s => [String(s.id), s.name || s.subjectName]))
    return { schoolMap, classMap, sectionMap, subjectMap }
  }, [schools, classes, sections, subjects])

  const displayRows = useMemo(() => {
    return rows.map(r => ({
      ...r,
      schoolName: r.schoolName || nameMaps.schoolMap.get(String(r.schoolId)) || r.schoolId,
      className: r.className || nameMaps.classMap.get(String(r.classId)) || r.classId,
      sectionName: r.sectionName || nameMaps.sectionMap.get(String(r.sectionId)) || r.sectionId,
      subjectName: r.subjectName || nameMaps.subjectMap.get(String(r.subjectId)) || r.subjectId,
    }))
  }, [rows, nameMaps])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return displayRows.filter((r) => {
      const matchesSearch = !q || [
        r?.title, r?.schoolName, r?.className, r?.sectionName, r?.subjectName, r?.status
      ].filter(Boolean).join(' ').toLowerCase().includes(q)

      const matchesSchool = filters.schoolId === 'Select' || String(r?.schoolId) === String(filters.schoolId)
      const matchesStatus = filters.status === 'Select' || String(r?.status || 'Pending') === filters.status

      return matchesSearch && matchesSchool && matchesStatus
    })
  }, [displayRows, filters, search])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((r) => r.id)])])
    else setSelectedRows((prev) => prev.filter((id) => !paginated.some((r) => r.id === id)))
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const openAdd = () => {
    sessionStorage.removeItem(EDIT_STORAGE_KEY)
    navigateTo('add-assignment')
  }

  const openEdit = (row) => {
    sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row))
    navigateTo('add-assignment')
  }

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault()
    setFilters(pendingFilters)
    setIsFilterSidebarOpen(false)
    setCurrentPage(1)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return
    setSaving(true)
    try {
      await deleteAssignment(id)
      loadData()
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Assignment</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0" onClick={() => navigateTo('dashboard')}>Dashboard</button>
            <span className="text-secondary-light"> / Assignment</span>
          </div>
        </div>
        {canManage && !isStudentOrParent && (
          <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <i className="ri-add-large-line text-md"></i> Add Assignment
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-8 mb-24">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      )}

      {isParent && !selectedChildId && (
        <div className="alert alert-info d-flex align-items-center gap-8 mb-24">
          <i className="ri-information-line"></i>
          <span>Select a child from the top bar to view assignments.</span>
        </div>
      )}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm"><i className="ri-file-upload-line text-md"></i> Export</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"><i className="ri-file-3-line"></i> PDF</button></li>
                  <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"><i className="ri-file-excel-2-line"></i> Excel</button></li>
                </ul>
              </div>

              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
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
                value={rowsPerPage}
                onChange={(value) => {
                  setRowsPerPage(value)
                  setCurrentPage(1)
                }}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>

            <div className="position-relative">
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search assignment..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light"><i className="ri-search-line"></i></span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={paginated.length > 0 && paginated.every(r => selectedRows.includes(r.id))} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.schoolName && <th>School</th>}
                  {visibleColumns.className && <th>Class</th>}
                  {visibleColumns.sectionName && <th>Section</th>}
                  {visibleColumns.subjectName && <th>Subject</th>}
                  {visibleColumns.title && <th>Title</th>}
                  {visibleColumns.assignmentDate && <th>Assignment Date</th>}
                  {visibleColumns.submissionDate && <th>Submission Date</th>}
                  {visibleColumns.status && <th>Status</th>}
                  {visibleColumns.assignmentFile && <th>File</th>}
                  <th style={{ width: 100 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40">Loading...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">No records found.</td></tr>
                ) : (
                  paginated.map((r, idx) => (
                    <tr key={r.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" checked={selectedRows.includes(r.id)} onChange={() => handleSelectRow(r.id)} />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.schoolName && <td>{r.schoolName}</td>}
                      {visibleColumns.className && <td>{r.className}</td>}
                      {visibleColumns.sectionName && <td>{r.sectionName}</td>}
                      {visibleColumns.subjectName && <td>{r.subjectName}</td>}
                      {visibleColumns.title && <td className="fw-medium text-primary-light">{r.title}</td>}
                      {visibleColumns.assignmentDate && <td>{r.assignmentDate}</td>}
                      {visibleColumns.submissionDate && <td>{r.submissionDate}</td>}
                      {visibleColumns.status && (
                        <td>
                          <span className={statusBadge(r.status)}>
                            {r.status || 'Pending'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.assignmentFile && (
                        <td>
                           {r.assignmentFile ? (
                             <div className="d-flex align-items-center gap-2">
                               <i className={getFileIcon(r.assignmentFile) + " text-primary text-lg"}></i>
                               <span className="text-sm text-secondary-light text-truncate" style={{maxWidth: 150}}>{r.assignmentFile}</span>
                             </div>
                           ) : '-'}
                        </td>
                      )}
                      <td>
                        <div className="d-flex align-items-center gap-8">
                          {canManage && !isStudentOrParent && (
                            <>
                              <button type="button" className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0" onClick={() => openEdit(r)} title="Edit">
                                <i className="ri-edit-line"></i>
                              </button>
                              <button type="button" className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0" onClick={() => handleDelete(r.id)} title="Delete">
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </>
                          )}
                          {isStudentOrParent && r.assignmentFileUrl && (
                             <a href={r.assignmentFileUrl} target="_blank" rel="noreferrer" className="bg-primary-focus text-primary-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0" title="Download">
                               <i className="ri-download-2-line"></i>
                             </a>
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
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length} entries
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 3) }, (_, index) => {
                const base = Math.max(1, currentPage - 1)
                const pageNumber = Math.min(totalPages, base + index)
                return pageNumber > 0 ? (
                  <button key={pageNumber} type="button" className={pageNumber === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'} onClick={() => setCurrentPage(pageNumber)}>
                    {pageNumber}
                  </button>
                ) : null
              })}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter Assignment" onClose={() => setIsFilterSidebarOpen(false)}>
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">School</label>
            <select className="form-control form-select" value={pendingFilters.schoolId} onChange={(e) => setPendingFilters(p => ({ ...p, schoolId: e.target.value }))}>
              <option value="Select">--Select School--</option>
              {schools.map(s => <option key={s.id} value={String(s.id)}>{s.schoolName}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Status</label>
            <select className="form-control form-select" value={pendingFilters.status} onChange={(e) => setPendingFilters(p => ({ ...p, status: e.target.value }))}>
              <option value="Select">All</option>
              <option value="Pending">Pending</option>
              <option value="Submitted">Submitted</option>
              <option value="Graded">Graded</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
          <div className="d-flex gap-8 mt-12">
            <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default Assignment
