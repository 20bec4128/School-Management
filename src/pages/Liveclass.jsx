import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import {
  deleteLiveClass,
  endLiveClass,
  fetchLiveClasses,
  fetchStudentLiveClasses,
  joinLiveClass,
  leaveLiveClass,
  startLiveClass,
} from '../apis/liveClassesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchSubjects } from '../apis/subjectsApi'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { can } from '../utils/permissions'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import '../assets/css/addModalShared.css'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import ExportDropdown from '../components/ExportDropdown'

const emptyFilters = {
  headOfficeId: '',
  schoolId: 'Select',
  classId: 'Select',
  sectionId: 'Select',
  subjectId: 'Select',
  status: 'Select',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'className', label: 'Class' },
  { key: 'sectionName', label: 'Section' },
  { key: 'subjectName', label: 'Subject' },
  { key: 'teacherName', label: 'Teacher' },
  { key: 'classDate', label: 'Class Date' },
  { key: 'startTime', label: 'Start Time' },
  { key: 'endTime', label: 'End Time' },
  { key: 'status', label: 'Status' },
]

const statusBadge = (status) => {
  if (status === 'Live') return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (status === 'Scheduled') return 'bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (status === 'Completed') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (status === 'Cancelled') return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
}

const getChildScope = (children, selectedChildId) => {
  const list = Array.isArray(children) ? children : []
  const selected =
    selectedChildId != null && selectedChildId !== ''
      ? list.find((child) => String(child?.studentId ?? child?.id ?? child?.student?.id ?? '') === String(selectedChildId))
      : null
  return selected || list[0] || null
}

const LiveClass = ({ onNavigate }) => {
  const { user, role, schoolId, studentClassId, studentSectionId, selectedChildId, parentChildren, canAdd, canEdit, canDelete } = useAuth()
  const { activeSchoolId } = useSchool()
  const roleUpper = String(role || '').toUpperCase()
  const isStudentScope = roleUpper === 'STUDENT' || roleUpper === 'PARENT'
  const selectedChild = useMemo(() => getChildScope(parentChildren, selectedChildId), [parentChildren, selectedChildId])
  const effectiveSchoolId = roleUpper === 'STUDENT' ? schoolId : roleUpper === 'PARENT' ? selectedChild?.schoolId ?? null : null
  const effectiveClassId = roleUpper === 'STUDENT' ? studentClassId : roleUpper === 'PARENT' ? selectedChild?.classId ?? null : null
  const effectiveSectionId = roleUpper === 'STUDENT' ? studentSectionId : roleUpper === 'PARENT' ? selectedChild?.sectionId ?? null : null
  const canManage = canAdd('live-class') || canEdit('live-class') || canDelete('live-class')
  const canJoin = !isStudentScope && can(user, ['LIVE_CLASS_JOIN', 'LIVE_CLASS_MANAGE', 'LIVE_CLASS_MANAGE_ASSIGNED', '*'])

  const [rows, setRows] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [headOfficesLookup, setHeadOfficesLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [sectionsLookup, setSectionsLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [hasSearched, setHasSearched] = useState(isStudentScope)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)
  const resolvedSchoolId = activeSchoolId ? String(activeSchoolId) : schoolId ? String(schoolId) : ''

  const loadLookups = useCallback(async () => {
    if (isStudentScope) return
    const [headOffices, schools, classes, sections, subjects] = await Promise.all([
      fetchHeadOfficesPage(0, 500).catch(() => ({ content: [] })),
      fetchSchoolsLookup().catch(() => []),
      fetchClasses().catch(() => []),
      fetchSections().catch(() => []),
      fetchSubjects().catch(() => []),
    ])
    setHeadOfficesLookup(Array.isArray(headOffices?.content) ? headOffices.content : [])
    setSchoolsLookup(schools)
    setClassesLookup(classes)
    setSectionsLookup(sections)
    setSubjectsLookup(subjects)
  }, [isStudentScope])

  const loadRows = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = isStudentScope && effectiveClassId && effectiveSectionId
        ? await fetchStudentLiveClasses({ classId: effectiveClassId, sectionId: effectiveSectionId })
        : await fetchLiveClasses(resolvedSchoolId ? { schoolId: resolvedSchoolId } : {})
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setRows([])
      setError(e?.message || 'Failed to load live classes')
    } finally {
      setLoading(false)
    }
  }, [effectiveClassId, effectiveSectionId, isStudentScope, resolvedSchoolId])

  useEffect(() => {
    if (!isStudentScope) loadLookups()
    loadRows()
  }, [isStudentScope, loadLookups, loadRows])

  const classOptions = useMemo(() => {
    return classesLookup
      .filter((c) => pendingFilters.schoolId === 'Select' || String(c.schoolId) === String(pendingFilters.schoolId))
      .sort((a, b) => String(a.className || '').localeCompare(String(b.className || '')))
  }, [classesLookup, pendingFilters.schoolId])

  const headOfficeOptions = useMemo(() => {
    return (Array.isArray(headOfficesLookup) ? headOfficesLookup : [])
      .map((row) => ({ id: row?.id, name: row?.name || row?.headOfficeName || '' }))
      .filter((row) => row.id != null && row.name)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [headOfficesLookup])

  const schoolOptions = useMemo(() => {
    const rows = Array.isArray(schoolsLookup) ? schoolsLookup : []
    const scoped = pendingFilters.headOfficeId
      ? rows.filter((school) => String(school?.headOfficeId ?? '') === String(pendingFilters.headOfficeId))
      : rows
    return scoped
      .map((row) => ({ id: row?.id, schoolName: row?.schoolName || row?.name || '' }))
      .filter((row) => row.id != null && row.schoolName)
      .sort((a, b) => String(a.schoolName).localeCompare(String(b.schoolName)))
  }, [schoolsLookup, pendingFilters.headOfficeId])

  const sectionOptions = useMemo(() => {
    return sectionsLookup
      .filter((s) => {
        if (pendingFilters.schoolId !== 'Select' && String(s.schoolId) !== String(pendingFilters.schoolId)) return false
        if (pendingFilters.classId !== 'Select' && String(s.classId) !== String(pendingFilters.classId)) return false
        return true
      })
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
  }, [sectionsLookup, pendingFilters.schoolId, pendingFilters.classId])

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
    if (!hasSearched) return []
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (!isStudentScope) {
        const scopeOk =
          (filters.schoolId === 'Select' || String(r.schoolId) === String(filters.schoolId)) &&
          (filters.classId === 'Select' || String(r.classId) === String(filters.classId)) &&
          (filters.sectionId === 'Select' || String(r.sectionId) === String(filters.sectionId)) &&
          (filters.subjectId === 'Select' || String(r.subjectId) === String(filters.subjectId)) &&
          (filters.status === 'Select' || String(r.status) === String(filters.status))
        if (!scopeOk) return false
      }
      if (!q) return true
      return [r.teacherName, r.liveClassType, r.classDate, r.status, r.schoolName, r.className, r.sectionName, r.subjectName]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [rows, hasSearched, search, filters, isStudentScope])

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
    sessionStorage.removeItem('edit-live-class-row')
    onNavigate('add-live-class')
  }

  const openEdit = (row) => {
    sessionStorage.setItem('edit-live-class-row', JSON.stringify(row))
    onNavigate('add-live-class')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this live class?')) return
    setSaving(true)
    try {
      await deleteLiveClass(id)
      loadRows()
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleStart = async (id) => {
    try {
      await startLiveClass(id)
      loadRows()
    } catch (e) {
      alert(e.message)
    }
  }

  const handleEnd = async (id) => {
    try {
      await endLiveClass(id)
      loadRows()
    } catch (e) {
      alert(e.message)
    }
  }

  const handleJoin = async (row) => {
    try {
      const res = await joinLiveClass(row.id)
      const url = res?.meetingRoomUrl || res?.url || res?.meetingLink || row.meetingLink
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Live Class</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">Dashboard</button>
            <span className="text-secondary-light"> / Live Class</span>
          </div>
        </div>
        {!isStudentScope && canAdd('live-class') && (
          <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <i className="ri-add-large-line text-md"></i> Add Live Class
          </button>
        )}
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              {!isStudentScope && (
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" onClick={() => setIsFilterSidebarOpen(true)}>
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                  <span><i className="ri-arrow-right-line"></i></span>
                </button>
              )}

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown" aria-expanded="false">
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
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search live class..."
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
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} disabled={!hasSearched || loading} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school && <th>School</th>}
                  {visibleColumns.className && <th>Class</th>}
                  {visibleColumns.sectionName && <th>Section</th>}
                  {visibleColumns.subjectName && <th>Subject</th>}
                  {visibleColumns.teacherName && <th>Teacher</th>}
                  {visibleColumns.classDate && <th>Date</th>}
                  {visibleColumns.startTime && <th>Start</th>}
                  {visibleColumns.endTime && <th>End</th>}
                  {visibleColumns.status && <th>Status</th>}
                  <th style={{ width: 100 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40">Loading...</td></tr>
                ) : !hasSearched ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      {isStudentScope ? 'Loading live classes...' : 'Use Filter to select School, Class, Section and Subject.'}
                    </td>
                  </tr>
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
                      {visibleColumns.sectionName && <td>{r.sectionName || r.sectionId}</td>}
                      {visibleColumns.subjectName && <td>{r.subjectName || r.subjectId}</td>}
                      {visibleColumns.teacherName && <td>{r.teacherName || r.teacherId}</td>}
                      {visibleColumns.classDate && <td>{r.classDate}</td>}
                      {visibleColumns.startTime && <td>{String(r.startTime || '').slice(0, 5)}</td>}
                      {visibleColumns.endTime && <td>{String(r.endTime || '').slice(0, 5)}</td>}
                      {visibleColumns.status && <td><span className={statusBadge(r.status)}>{r.status}</span></td>}
                      <td>
                        <div className="d-flex align-items-center gap-8">
                          {!isStudentScope && (
                            <>
                              {canEdit('live-class') && (
                              <button type="button" className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0" onClick={() => openEdit(r)} title="Edit">
                                <i className="ri-edit-line"></i>
                              </button>
                              )}
                              {canDelete('live-class') && (
                              <button type="button" className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0" onClick={() => handleDelete(r.id)} title="Delete">
                                <i className="ri-delete-bin-line"></i>
                              </button>
                              )}
                            </>
                          )}
                          <div className="dropdown">
                            <button className="bg-neutral-100 text-secondary-light w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0" type="button" data-bs-toggle="dropdown">
                              <i className="ri-more-2-fill"></i>
                            </button>
                            <ul className="dropdown-menu shadow">
                              {canManage && r.status === 'Scheduled' && <li><button className="dropdown-item" onClick={() => handleStart(r.id)}>Start</button></li>}
                              {canJoin && (r.status === 'Live' || r.status === 'Scheduled') && <li><button className="dropdown-item text-primary" onClick={() => handleJoin(r)}>Join</button></li>}
                              {canManage && r.status === 'Live' && <li><button className="dropdown-item text-danger" onClick={() => handleEnd(r.id)}>End</button></li>}
                            </ul>
                          </div>
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
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={!hasSearched || currentPage === 1}>
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
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={!hasSearched || currentPage === totalPages}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {!isStudentScope && (
        <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter Live Class" onClose={() => setIsFilterSidebarOpen(false)}>
          <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
            <ManualScopeSelectors
              enabled
              headOffices={headOfficeOptions}
              schoolOptions={schoolOptions}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={(value) => setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: 'Select', classId: 'Select', sectionId: 'Select', subjectId: 'Select' }))}
              selectedSchoolId={pendingFilters.schoolId === 'Select' ? '' : pendingFilters.schoolId}
              onSchoolChange={(value) => setPendingFilters((prev) => ({ ...prev, schoolId: value || 'Select', classId: 'Select', sectionId: 'Select', subjectId: 'Select' }))}
            />
            <div>
              <label className="text-sm fw-semibold text-primary-light mb-8">Class <span className="text-danger-600">*</span></label>
              <select className="form-control form-select" value={pendingFilters.classId} onChange={(e) => { const v = e.target.value; setPendingFilters(p => ({ ...p, classId: v, sectionId: 'Select', subjectId: 'Select' })) }} disabled={pendingFilters.schoolId === 'Select'}>
                <option value="Select">--Select Class--</option>
                {classOptions.map(c => <option key={c.id} value={String(c.id)}>{c.className}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm fw-semibold text-primary-light mb-8">Section <span className="text-danger-600">*</span></label>
              <select className="form-control form-select" value={pendingFilters.sectionId} onChange={(e) => setPendingFilters(p => ({ ...p, sectionId: e.target.value }))} disabled={pendingFilters.classId === 'Select'}>
                <option value="Select">--Select Section--</option>
                {sectionOptions.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm fw-semibold text-primary-light mb-8">Subject <span className="text-danger-600">*</span></label>
              <select className="form-control form-select" value={pendingFilters.subjectId} onChange={(e) => setPendingFilters(p => ({ ...p, subjectId: e.target.value }))} disabled={pendingFilters.classId === 'Select'}>
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

export default LiveClass
