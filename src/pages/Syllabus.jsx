import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { deleteSyllabus, fetchSyllabuses } from '../apis/syllabusApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import { TablePagination } from '../components/table'
import { can } from '../utils/permissions'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const sessionYearOptions = ['2024-2025', '2023-2024', '2022-2023']

const emptyFilters = {
  school: 'Select',
  className: 'Select',
  subject: 'Select',
  sessionYear: 'Select',
}

const normalizeSyllabus = (row) => ({
  id: row?.id,
  schoolId: row?.schoolId != null ? String(row.schoolId) : '',
  school: row?.school || '',
  classId: row?.classId != null ? String(row.classId) : '',
  className: row?.className || '',
  subjectId: row?.subjectId != null ? String(row.subjectId) : '',
  subject: row?.subject || '',
  title: row?.title || '',
  sessionYear: row?.sessionYear || '',
  note: row?.note || '',
  fileName: row?.fileName || '',
  fileType: row?.fileType || '',
  fileUrl: row?.fileUrl || '',
})

const getChildScope = (children, selectedChildId) => {
  const list = Array.isArray(children) ? children : []
  const selected =
    selectedChildId != null && selectedChildId !== ''
      ? list.find((child) => String(
        child?.studentId ??
        child?.id ??
        child?.childId ??
        child?.student?.id ??
        child?.student?.studentId ??
        child?.student?.childId ??
        ''
      ) === String(selectedChildId))
      : null
  return selected || list[0] || null
}

const getChildSchoolId = (child) =>
  child?.schoolId ??
  child?.school?.id ??
  child?.student?.schoolId ??
  child?.student?.school?.id ??
  child?.student?.school?.schoolId ??
  child?.school?.schoolId ??
  null

const getChildClassId = (child) =>
  child?.classId ??
  child?.schoolClassId ??
  child?.schoolClass?.id ??
  child?.student?.classId ??
  child?.student?.schoolClassId ??
  child?.student?.schoolClass?.id ??
  child?.schoolClass?.id ??
  null

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'title', label: 'Title' },
  { key: 'className', label: 'Class' },
  { key: 'subject', label: 'Subject' },
  { key: 'sessionYear', label: 'Session Year' },
  { key: 'file', label: 'File' },
]

const getFileIcon = (fileName) => {
  if (!fileName) return 'ri-file-line'
  const ext = String(fileName).split('.').pop().toLowerCase()
  if (ext === 'pdf') return 'ri-file-pdf-line'
  if (ext === 'doc' || ext === 'docx') return 'ri-file-word-line'
  if (ext === 'ppt' || ext === 'pptx') return 'ri-slideshow-line'
  if (ext === 'txt') return 'ri-file-text-line'
  return 'ri-file-line'
}

const Syllabus = ({ onNavigate }) => {
  const { user, role, schoolId, schoolName, studentClassId, selectedChildId, parentChildren } = useAuth()
  const { activeSchoolId, isSchoolSelectionEnabled } = useSchool()
  const canManage = can(user, ['SYLLABUS_MANAGE', 'SYLLABUS_MANAGE_ASSIGNED', '*'])

  const [syllabuses, setSyllabuses] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])
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
  const roleUpper = String(role || '').toUpperCase()
  const isStudentScope = roleUpper === 'STUDENT' || roleUpper === 'PARENT'
  const isTeacherScope = roleUpper === 'TEACHER'
  const selectedChild = useMemo(() => getChildScope(parentChildren, selectedChildId), [parentChildren, selectedChildId])
  const effectiveSchoolId =
    roleUpper === 'STUDENT'
      ? (schoolId ?? activeSchoolId ?? null)
      : roleUpper === 'PARENT'
        ? getChildSchoolId(selectedChild)
        : null
  const effectiveClassId =
    roleUpper === 'STUDENT'
      ? studentClassId ?? null
      : roleUpper === 'PARENT'
        ? getChildClassId(selectedChild)
        : null
  const resolvedSchoolId = activeSchoolId ? String(activeSchoolId) : schoolId ? String(schoolId) : ''
  const resolvedSchoolName = schoolName || ''
  const resolvedSchoolLabel = resolvedSchoolName || (resolvedSchoolId ? `School ${resolvedSchoolId}` : '')

  const effectiveSchoolsLookup = useMemo(() => {
    const byId = new Map((Array.isArray(schoolsLookup) ? schoolsLookup : []).map((row) => [String(row?.id), row]))
    if (resolvedSchoolId && !byId.has(String(resolvedSchoolId))) {
      byId.set(String(resolvedSchoolId), {
        id: resolvedSchoolId,
        schoolName: resolvedSchoolName || `School ${resolvedSchoolId}`,
      })
    }
    return Array.from(byId.values()).sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
  }, [resolvedSchoolId, resolvedSchoolName, schoolsLookup])

  const loadLookups = useCallback(async () => {
    if (!canManage) {
      setSchoolsLookup([])
      setClassesLookup([])
      setSubjectsLookup([])
      return
    }

    const [schoolsResult, classesResult, subjectsResult] = await Promise.allSettled([
      fetchSchoolsLookup(),
      fetchClasses(),
      fetchSubjects(),
    ])
    const schools = schoolsResult.status === 'fulfilled' ? schoolsResult.value : []
    const classes = classesResult.status === 'fulfilled' ? classesResult.value : []
    const subjects = subjectsResult.status === 'fulfilled' ? subjectsResult.value : []
    setSchoolsLookup(Array.isArray(schools) ? schools : [])
    setClassesLookup(Array.isArray(classes) ? classes : [])
    setSubjectsLookup(Array.isArray(subjects) ? subjects : [])
  }, [canManage])

  const loadSyllabuses = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const scopedParams = isStudentScope
        ? (effectiveSchoolId && effectiveClassId
            ? { schoolId: effectiveSchoolId, classId: effectiveClassId }
            : null)
        : isSchoolSelectionEnabled && activeSchoolId
          ? { schoolId: activeSchoolId }
          : resolvedSchoolId
            ? { schoolId: resolvedSchoolId }
            : {}

      if (isStudentScope && !scopedParams) {
        setSyllabuses([])
        setError(roleUpper === 'PARENT' && !selectedChildId ? 'Please select a child first.' : 'Unable to determine your class scope.')
        return
      }

      const data = await fetchSyllabuses(scopedParams || {})
      setSyllabuses(Array.isArray(data) ? data.map(normalizeSyllabus) : [])
    } catch (e) {
      if (String(e?.message || '').toLowerCase().includes('403') || String(e?.message || '').toLowerCase().includes('forbidden')) {
        setSyllabuses([])
        setError(isStudentScope ? 'Select a child to view syllabuses.' : 'You are not allowed to view syllabuses.')
      } else {
        setSyllabuses([])
        setError(e?.message || 'Failed to load syllabuses')
      }
    } finally {
      setLoading(false)
    }
  }, [activeSchoolId, effectiveClassId, effectiveSchoolId, isSchoolSelectionEnabled, isStudentScope, resolvedSchoolId, roleUpper, selectedChildId])

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

  useEffect(() => {
    void loadSyllabuses()
  }, [loadSyllabuses])

  useEffect(() => {
    if (!isTeacherScope || !resolvedSchoolId) return
    setPendingFilters((prev) => (prev.school === 'Select' ? { ...prev, school: resolvedSchoolLabel } : prev))
    setFilters((prev) => (prev.school === 'Select' ? { ...prev, school: resolvedSchoolLabel } : prev))
  }, [isTeacherScope, resolvedSchoolId, resolvedSchoolLabel])

  const schoolFilterOptions = useMemo(() => {
    const source = schoolsLookup.length > 0 ? schoolsLookup.map((s) => s?.schoolName) : syllabuses.map((row) => row?.school)
    return Array.from(new Set(source.filter(Boolean))).sort()
  }, [schoolsLookup, syllabuses])

  const classFilterOptions = useMemo(() => {
    const source = classesLookup.length > 0 ? classesLookup.map((c) => c?.className) : syllabuses.map((row) => row?.className)
    return Array.from(new Set(source.filter(Boolean))).sort()
  }, [classesLookup, syllabuses])

  const subjectFilterOptions = useMemo(() => {
    const source = subjectsLookup.length > 0 ? subjectsLookup.map((s) => s?.subject || s?.name) : syllabuses.map((row) => row?.subject)
    return Array.from(new Set(source.filter(Boolean))).sort()
  }, [subjectsLookup, syllabuses])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return syllabuses.filter((row) => {
      const matchesSearch =
        !q ||
        [row?.school, row?.title, row?.className, row?.subject, row?.sessionYear, row?.note, row?.fileName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)

      const matchesSchool = filters.school === 'Select' || row?.school === filters.school
      const matchesClass = filters.className === 'Select' || row?.className === filters.className
      const matchesSubject = filters.subject === 'Select' || row?.subject === filters.subject
      const matchesSession = filters.sessionYear === 'Select' || row?.sessionYear === filters.sessionYear

      return matchesSearch && matchesSchool && matchesClass && matchesSubject && matchesSession
    })
  }, [syllabuses, search, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const allSelected = paginated.length > 0 && paginated.every((row) => selectedRows.includes(row.id))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((row) => row.id)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !paginated.some((row) => row.id === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    )
  }

  const handlePendingFilterChange = (e) => {
    if (isStudentScope) return
    if (isTeacherScope && e.target.id === 'school') return
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    if (isStudentScope) return
    setFilters(isTeacherScope ? { ...pendingFilters, school: resolvedSchoolLabel } : pendingFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    if (isStudentScope) return
    const next = isTeacherScope
      ? { ...emptyFilters, school: resolvedSchoolLabel || 'Select' }
      : emptyFilters
    setPendingFilters(next)
    setFilters(next)
    setCurrentPage(1)
  }

  const handleAdd = () => {
    if (!canManage) return
    try {
      sessionStorage.removeItem('edit-syllabus-row')
    } catch {
      // ignore session storage failures
    }
    onNavigate?.('add-syllabus')
  }

  const handleEdit = (row) => {
    if (!canManage) return
    try {
      sessionStorage.setItem('edit-syllabus-row', JSON.stringify(row))
    } catch {
      // ignore session storage failures
    }
    onNavigate?.('add-syllabus')
  }

  const handleDelete = async (id) => {
    if (!canManage) return
    if (!id) return
    const confirmed = window.confirm('Delete this syllabus? This cannot be undone.')
    if (!confirmed) return

    setSaving(true)
    setError('')
    try {
      await deleteSyllabus(id)
      setSyllabuses((prev) => prev.filter((row) => row.id !== id))
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id))
    } catch (e) {
      setError(e?.message || 'Failed to delete syllabus')
    } finally {
      setSaving(false)
    }
  }

  const getClassesForSchool = (schoolIdValue) => {
    const rows = classesLookup.filter((row) => !schoolIdValue || String(row?.schoolId) === String(schoolIdValue))
    return rows.sort((a, b) => (a?.className || '').localeCompare(b?.className || ''))
  }

  const getSubjectsForSchool = (schoolIdValue, classIdValue) => {
    const rows = subjectsLookup.filter((row) => {
      const matchesSchool = !schoolIdValue || String(row?.schoolId) === String(schoolIdValue)
      const matchesClass = !classIdValue || String(row?.classId) === String(classIdValue)
      return matchesSchool && matchesClass
    })
    return rows.sort((a, b) => (a?.subject || a?.name || '').localeCompare(b?.subject || b?.name || ''))
  }

  const schoolNameById = useMemo(() => {
    const map = {}
    effectiveSchoolsLookup.forEach((school) => {
      map[String(school.id)] = school.schoolName
    })
    return map
  }, [effectiveSchoolsLookup])

  const teacherSchoolName = resolvedSchoolLabel || schoolNameById[resolvedSchoolId] || ''
  const getSchoolName = (row) => row.school || schoolNameById[row.schoolId] || '-'

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Syllabus</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Syllabus</span>
          </div>
        </div>
        {canManage ? (
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={handleAdd}
          >
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add Syllabus
          </button>
        ) : (
          <span className="text-secondary-light fw-medium">View only</span>
        )}
      </div>

      {error ? (
        <div className="alert alert-danger mb-20" role="alert">
          {error}
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              {!isStudentScope ? (
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
              ) : null}

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
                placeholder="Search syllabus..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 980 }}>
              <thead>
                <tr>
                  {canManage ? (
                    <th scope="col">
                      <div className="form-check style-check d-flex align-items-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={allSelected}
                          onChange={handleSelectAll}
                        />
                        <label className="form-check-label">S.L</label>
                      </div>
                    </th>
                  ) : null}
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.title ? <th scope="col">Title</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.subject ? <th scope="col">Subject</th> : null}
                  {visibleColumns.sessionYear ? <th scope="col">Session Year</th> : null}
                  {visibleColumns.file ? <th scope="col">File</th> : null}
                  {canManage ? <th scope="col">Action</th> : null}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + (canManage ? 2 : 0)}
                      className="text-center py-40 text-secondary-light"
                    >
                      Loading syllabus records...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + (canManage ? 2 : 0)}
                      className="text-center py-40 text-secondary-light"
                    >
                      No syllabus records found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, index) => (
                    <tr key={row.id}>
                      {canManage ? (
                        <td>
                          <div className="form-check style-check d-flex align-items-center">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={selectedRows.includes(row.id)}
                              onChange={() => handleSelectRow(row.id)}
                            />
                            <label className="form-check-label">
                              {(currentPage - 1) * rowsPerPage + index + 1}
                            </label>
                          </div>
                        </td>
                      ) : null}
                      {visibleColumns.school ? <td>{getSchoolName(row)}</td> : null}
                      {visibleColumns.title ? (
                        <td>
                          <span className="fw-medium text-primary-light d-flex align-items-center gap-6">
                            <i className="ri-file-list-2-line text-secondary-light"></i>
                            {row.title}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.className ? <td>{row.className}</td> : null}
                      {visibleColumns.subject ? (
                        <td>
                          <span className="bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm">
                            {row.subject}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.sessionYear ? (
                        <td>
                          <span className="bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm">
                            {row.sessionYear}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.file ? (
                        <td>
                          {row.fileUrl ? (
                            <a
                              href={row.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary-600 fw-medium d-inline-flex align-items-center gap-6"
                            >
                              <i className={getFileIcon(row.fileName)}></i>
                              {row.fileName || 'Download'}
                            </a>
                          ) : (
                            <span className="text-secondary-light">No file</span>
                          )}
                        </td>
                      ) : null}
                      {canManage ? (
                        <td>
                          <div className="d-flex align-items-center gap-10">
                            <button
                              type="button"
                              className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                              onClick={() => handleEdit(row)}
                              title="Edit"
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                            <button
                              type="button"
                              className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                              onClick={() => handleDelete(row.id)}
                              title="Delete"
                              disabled={saving}
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        </td>
                      ) : (
                        <td>
                          <span className="text-secondary-light">Read only</span>
                        </td>
                      )}
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

      {!isStudentScope ? (
        <SlideSidebar
          isOpen={isFilterSidebarOpen}
          title="Filter Syllabus"
          onClose={() => setIsFilterSidebarOpen(false)}
          className="filter-sidebar"
        >
          <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                htmlFor="school"
                className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
              >
                School
              </label>
              {isTeacherScope ? (
                <input
                  id="school"
                  className="form-control"
                  value={teacherSchoolName}
                  readOnly
                />
              ) : (
                <select
                  id="school"
                  className="form-control form-select"
                  value={pendingFilters.school}
                  onChange={handlePendingFilterChange}
                >
                  <option value="Select">Select School</option>
                  {schoolFilterOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label
                htmlFor="className"
                className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
              >
                Class
              </label>
              <select
                id="className"
                className="form-control form-select"
                value={pendingFilters.className}
                onChange={handlePendingFilterChange}
              >
                <option value="Select">Select</option>
                {classFilterOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="subject"
                className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
              >
                Subject
              </label>
              <select
                id="subject"
                className="form-control form-select"
                value={pendingFilters.subject}
                onChange={handlePendingFilterChange}
              >
                <option value="Select">Select</option>
                {subjectFilterOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label
                htmlFor="sessionYear"
                className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
              >
                Session Year
              </label>
              <select
                id="sessionYear"
                className="form-control form-select"
                value={pendingFilters.sessionYear}
                onChange={handlePendingFilterChange}
              >
                <option value="Select">Select</option>
                {sessionYearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-danger-200 text-danger-600 w-100"
              >
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
      ) : null}
    </div>
  )
}

export default Syllabus
