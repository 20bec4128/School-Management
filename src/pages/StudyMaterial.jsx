import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { deleteStudyMaterial, fetchStudyMaterials } from '../apis/studyMaterialsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { can } from '../utils/permissions'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const emptyFilters = {
  schoolId: 'Select',
  classId: 'Select',
  subjectId: 'Select',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'className', label: 'Class' },
  { key: 'subjectName', label: 'Subject' },
  { key: 'title', label: 'Title' },
  { key: 'fileName', label: 'File' },
]

const getFileIcon = (fileName) => {
  if (!fileName) return 'ri-file-line'
  const ext = String(fileName).split('.').pop().toLowerCase()
  if (ext === 'pdf') return 'ri-file-pdf-line'
  if (['doc', 'docx'].includes(ext)) return 'ri-file-word-line'
  if (['ppt', 'pptx'].includes(ext)) return 'ri-slideshow-line'
  if (ext === 'txt') return 'ri-file-text-line'
  return 'ri-file-line'
}

const getStudyMaterialFileUrl = (row) =>
  row?.fileUrl ||
  row?.materialUrl ||
  row?.filePath ||
  row?.attachmentUrl ||
  row?.url ||
  ''

const getStudyMaterialFileName = (row) =>
  row?.fileName ||
  String(getStudyMaterialFileUrl(row))
    .split('/')
    .filter(Boolean)
    .pop() ||
  ''

const getChildScope = (children, selectedChildId) => {
  const list = Array.isArray(children) ? children : []
  const selected =
    selectedChildId != null && selectedChildId !== ''
      ? list.find((child) => String(child?.studentId ?? child?.id ?? child?.student?.id ?? '') === String(selectedChildId))
      : null
  return selected || list[0] || null
}

const StudyMaterial = ({ onNavigate }) => {
  const { user, role, schoolId, selectedChildId, parentChildren, studentClassId } = useAuth()
  const { activeSchoolId } = useSchool()
  const roleUpper = String(role || '').toUpperCase()
  const isStudentScope = roleUpper === 'STUDENT' || roleUpper === 'PARENT'
  const selectedChild = useMemo(() => getChildScope(parentChildren, selectedChildId), [parentChildren, selectedChildId])
  const effectiveSchoolId = roleUpper === 'STUDENT' ? schoolId : roleUpper === 'PARENT' ? selectedChild?.schoolId ?? null : null
  const effectiveClassId = roleUpper === 'STUDENT' ? studentClassId : roleUpper === 'PARENT' ? selectedChild?.classId ?? null : null
  const canManage = !isStudentScope && can(user, ['STUDY_MATERIAL_MANAGE', 'STUDY_MATERIAL_MANAGE_ASSIGNED', '*'])

  const [rows, setRows] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])

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
  const [hasSearched, setHasSearched] = useState(true)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)
  const resolvedSchoolId = activeSchoolId ? String(activeSchoolId) : schoolId ? String(schoolId) : ''

  const loadLookups = useCallback(async () => {
    const [schools, classes, subjects] = await Promise.all([
      fetchSchoolsLookup().catch(() => []),
      fetchClasses().catch(() => []),
      fetchSubjects().catch(() => []),
    ])
    setSchoolsLookup(schools)
    setClassesLookup(classes)
    setSubjectsLookup(subjects)
  }, [])

  const loadRows = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = isStudentScope && effectiveSchoolId && effectiveClassId
        ? { schoolId: effectiveSchoolId, classId: effectiveClassId }
        : resolvedSchoolId ? { schoolId: resolvedSchoolId } : {}
      const data = await fetchStudyMaterials(params)
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setRows([])
      setError(e?.message || 'Failed to load study materials')
    } finally {
      setLoading(false)
    }
  }, [effectiveClassId, effectiveSchoolId, isStudentScope, resolvedSchoolId])

  useEffect(() => {
    if (canManage) loadLookups()
    loadRows()
  }, [canManage, loadLookups, loadRows, refreshKey])

  const classOptions = useMemo(() => {
    return classesLookup
      .filter((c) => pendingFilters.schoolId === 'Select' || String(c.schoolId) === String(pendingFilters.schoolId))
      .sort((a, b) => String(a.className || '').localeCompare(String(b.className || '')))
  }, [classesLookup, pendingFilters.schoolId])

  const subjectOptions = useMemo(() => {
    return subjectsLookup
      .filter((s) => {
        if (pendingFilters.schoolId !== 'Select' && String(s.schoolId) !== String(pendingFilters.schoolId)) return false
        if (pendingFilters.classId !== 'Select' && String(s.classId) !== String(pendingFilters.classId)) return false
        return true
      })
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
  }, [subjectsLookup, pendingFilters.schoolId, pendingFilters.classId])

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault()
    setFilters(pendingFilters)
    setHasSearched(true)
    setIsFilterSidebarOpen(false)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setHasSearched(false)
    setCurrentPage(1)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (!isStudentScope) {
        const matchesScope =
          (filters.schoolId === 'Select' || String(r.schoolId) === String(filters.schoolId)) &&
          (filters.classId === 'Select' || String(r.classId) === String(filters.classId)) &&
          (filters.subjectId === 'Select' || String(r.subjectId) === String(filters.subjectId))
        if (!matchesScope) return false
      }
      if (!q) return true
      return [r.title, r.description, r.fileName, r.schoolName, r.className, r.subjectName].filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [rows, search, filters, isStudentScope])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((r) => selectedRows.includes(r.id))
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((r) => r.id)])])
    else setSelectedRows((prev) => prev.filter((id) => !paginated.some((r) => r.id === id)))
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const openAdd = () => {
    sessionStorage.removeItem('edit-study-material-row')
    onNavigate('add-study-material')
  }

  const openEdit = (row) => {
    sessionStorage.setItem('edit-study-material-row', JSON.stringify(row))
    onNavigate('add-study-material')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this study material?')) return
    try {
      await deleteStudyMaterial(id)
      setRefreshKey(k => k + 1)
    } catch (e) {
      alert(e.message)
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Study Material</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">Dashboard</button>
            <span className="text-secondary-light"> / Study Material</span>
          </div>
        </div>
        {canManage && (
          <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <i className="ri-add-large-line text-md"></i> Add Study Material
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
                  <span><i className="ri-arrow-down-s-line"></i></span>
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

              {!isStudentScope && (
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                  onClick={() => setIsFilterSidebarOpen(true)}
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    Filter
                  </span>
                  <span><i className="ri-arrow-right-line"></i></span>
                </button>
              )}

              <RowsPerPageSelect
                value={rowsPerPage}
                onChange={(v) => {
                  setRowsPerPage(v)
                  setCurrentPage(1)
                }}
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search study material..."
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
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} disabled={loading} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school && <th>School</th>}
                  {visibleColumns.className && <th>Class</th>}
                  {visibleColumns.subjectName && <th>Subject</th>}
                  {visibleColumns.title && <th>Title</th>}
                  {visibleColumns.fileName && <th>File</th>}
                  {canManage && <th style={{ width: 100 }}>Action</th>}
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
                      {visibleColumns.school && <td>{r.schoolName || r.schoolId}</td>}
                      {visibleColumns.className && <td>{r.className || r.classId}</td>}
                      {visibleColumns.subjectName && <td>{r.subjectName || r.subjectId}</td>}
                      {visibleColumns.title && <td className="fw-medium text-primary-light">{r.title}</td>}
                      {visibleColumns.fileName && (
                        <td>
                          {getStudyMaterialFileName(r) ? (
                            <span className="d-inline-flex align-items-center gap-8">
                              <i className={getFileIcon(getStudyMaterialFileName(r))}></i>
                              <span>{getStudyMaterialFileName(r)}</span>
                            </span>
                          ) : <span className="text-secondary-light">-</span>}
                        </td>
                      )}
                      {canManage && (
                        <td>
                          <div className="d-flex align-items-center gap-10">
                            <button type="button" className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0" onClick={() => openEdit(r)} title="Edit">
                              <i className="ri-edit-line"></i>
                            </button>
                            <button type="button" className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0" onClick={() => handleDelete(r.id)} title="Delete">
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              {getVisiblePages().map(p => (
                <button key={p} type="button" className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </div>
      </div>

      {!isStudentScope && (
        <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter Study Material" onClose={() => setIsFilterSidebarOpen(false)}>
          <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
            <div>
              <label className="text-sm fw-semibold text-primary-light mb-8">School <span className="text-danger-600">*</span></label>
              <select className="form-control form-select" value={pendingFilters.schoolId} onChange={e => setPendingFilters(p => ({ ...p, schoolId: e.target.value, classId: 'Select', subjectId: 'Select' }))}>
                <option value="Select">--Select School--</option>
                {schoolsLookup.map(s => <option key={s.id} value={String(s.id)}>{s.schoolName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm fw-semibold text-primary-light mb-8">Class <span className="text-danger-600">*</span></label>
              <select className="form-control form-select" value={pendingFilters.classId} onChange={e => setPendingFilters(p => ({ ...p, classId: e.target.value, subjectId: 'Select' }))}>
                <option value="Select">--Select Class--</option>
                {classOptions.map(c => <option key={c.id} value={String(c.id)}>{c.className}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm fw-semibold text-primary-light mb-8">Subject <span className="text-danger-600">*</span></label>
              <select className="form-control form-select" value={pendingFilters.subjectId} onChange={e => setPendingFilters(p => ({ ...p, subjectId: e.target.value }))}>
                <option value="Select">--Select Subject--</option>
                {subjectOptions.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </select>
            </div>
            <div className="d-flex gap-8 mt-12">
              <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">Reset</button>
              <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
            </div>
          </form>
        </SlideSidebar>
      )}
    </div>
  )
}

export default StudyMaterial
