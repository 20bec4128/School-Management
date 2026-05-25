import { useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import { TablePagination } from '../components/table'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { fetchLessonStatusPageData, updateLessonStatus, updateTopicStatus } from '../apis/lessonStatusApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { can } from '../utils/permissions'
import { useAuth } from '../context/useAuth'
import useAcademicYearOptions from '../hooks/useAcademicYearOptions'
import '../assets/css/addModalShared.css'
import FindEmptyState from '../components/FindEmptyState'

const columnOptions = [
  { key: 'lessonName', label: 'Lesson' },
  { key: 'lessonStatus', label: 'Status' },
]

const STATUS_OPTIONS = [
  { value: 'YET_TO_START', label: 'Yet To Start' },
  { value: 'GOING_ON', label: 'On Progress' },
  { value: 'COMPLETED', label: 'Completed' },
]

const emptyFilters = {
  headOfficeId: 'Select',
  schoolId: 'Select',
  academicYear: 'Select',
  classId: 'Select',
  subjectId: 'Select',
}

const getChildScope = (children, selectedChildId) => {
  const list = Array.isArray(children) ? children : []
  const selected = selectedChildId != null && selectedChildId !== ''
    ? list.find((child) => String(child?.studentId ?? child?.id ?? child?.student?.id ?? '') === String(selectedChildId))
    : null
  return selected || list[0] || null
}

const statusMeta = (status) => {
  const v = String(status || 'YET_TO_START')
  if (v === 'COMPLETED') return { label: 'Completed', cls: 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm' }
  if (v === 'GOING_ON') return { label: 'On Progress', cls: 'bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm' }
  return { label: 'Yet To Start', cls: 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm' }
}

const canCompleteLesson = (lesson) => {
  const topics = Array.isArray(lesson?.topics) ? lesson.topics : []
  return topics.every((t) => String(t?.topicStatus || 'YET_TO_START') === 'COMPLETED')
}

const LessonStatus = () => {
  const { role, schoolId, studentClassId, selectedChildId, parentChildren, user, canEdit } = useAuth()
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])

  const [lessons, setLessons] = useState([])
  const [selectedLessonId, setSelectedLessonId] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [isFindSidebarOpen, setIsFindSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [findErrors, setFindErrors] = useState({})
  const [hasSearched, setHasSearched] = useState(false)
  const [headOfficesLookup, setHeadOfficesLookup] = useState([])
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const roleUpper = String(role || '').toUpperCase()
  const isStudentScope = roleUpper === 'STUDENT' || roleUpper === 'PARENT'
  const selectedChild = useMemo(() => getChildScope(parentChildren, selectedChildId), [parentChildren, selectedChildId])
  const effectiveSchoolId = roleUpper === 'STUDENT'
    ? schoolId
    : roleUpper === 'PARENT'
      ? selectedChild?.schoolId ?? null
      : null
  const effectiveClassId = roleUpper === 'STUDENT'
    ? studentClassId
    : roleUpper === 'PARENT'
      ? selectedChild?.classId ?? null
      : null
  const PAGE_SLUG = 'lesson-status'
  const canManageLessonStatus = canEdit(PAGE_SLUG)
  const academicYearOptions = useAcademicYearOptions({
    schoolId:
      isStudentScope
        ? effectiveSchoolId ?? ''
        : pendingFilters.schoolId !== 'Select'
          ? pendingFilters.schoolId
          : '',
    enabled:
      (isStudentScope && Boolean(effectiveSchoolId)) ||
      pendingFilters.schoolId !== 'Select',
  })
  const defaultAcademicYear = academicYearOptions[0] || 'Select'

  useEffect(() => {
    let ignore = false
    const run = async () => {
      try {
        setLoading(true)
        setError('')
        if (isStudentScope) {
          if (!effectiveSchoolId || !effectiveClassId || defaultAcademicYear === 'Select') {
            if (!ignore) {
              setSchoolsLookup([])
              setClassesLookup([])
              setSubjectsLookup([])
              setLoading(false)
            }
            return
          }
          const nextFilters = {
            schoolId: String(effectiveSchoolId),
            academicYear: defaultAcademicYear,
            classId: String(effectiveClassId),
            subjectId: 'Select',
          }
          setPendingFilters(nextFilters)
          setFilters(nextFilters)
          setHasSearched(true)
          setIsFindSidebarOpen(false)
          await reloadPageData(nextFilters)
          return
        }
        const [headOffices, schools, classes, subjects] = await Promise.all([
          fetchHeadOfficesPage(0, 500),
          fetchSchoolsLookup(),
          fetchClasses(),
          fetchSubjects(),
        ])
        if (ignore) return
        setHeadOfficesLookup(Array.isArray(headOffices?.content) ? headOffices.content : [])
        setSchoolsLookup(Array.isArray(schools) ? schools : [])
        setClassesLookup(Array.isArray(classes) ? classes : [])
        setSubjectsLookup(Array.isArray(subjects) ? subjects : [])
      } catch (e) {
        if (!ignore) setError(e?.message || 'Failed to load lookups')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void run()
    return () => {
      ignore = true
    }
  }, [defaultAcademicYear, effectiveClassId, effectiveSchoolId, isStudentScope])

  const filteredLessons = useMemo(() => {
    if (!hasSearched) return []
    const q = search.trim().toLowerCase()
    if (!q) return lessons
    return lessons.filter((l) => {
      const lessonText = `${l.lessonName || ''} ${l.lessonStatus || ''}`
      const topicText = Array.isArray(l.topics) ? l.topics.map((t) => `${t.topicName || ''} ${t.topicStatus || ''}`).join(' ') : ''
      return `${lessonText} ${topicText}`.toLowerCase().includes(q)
    })
  }, [lessons, search, hasSearched])

  const totalPages = Math.max(1, Math.ceil(filteredLessons.length / rowsPerPage))

  const paginatedLessons = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredLessons.slice(start, start + rowsPerPage)
  }, [currentPage, filteredLessons, rowsPerPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const selectedLesson = useMemo(() => {
    return lessons.find((l) => String(l.lessonId) === String(selectedLessonId)) || null
  }, [lessons, selectedLessonId])

  const validateFind = () => {
    const errs = {}
    if (roleUpper === 'SUPER_ADMIN' && pendingFilters.headOfficeId === 'Select') errs.headOfficeId = 'Head Office is required.'
    if (pendingFilters.schoolId === 'Select') errs.schoolId = 'School is required.'
    if (pendingFilters.academicYear === 'Select') errs.academicYear = 'Academic Year is required.'
    if (pendingFilters.classId === 'Select') errs.classId = 'Class is required.'
    if (pendingFilters.subjectId === 'Select') errs.subjectId = 'Subject is required.'
    return errs
  }

  const reloadPageData = async (nextFilters = filters) => {
    const data = await fetchLessonStatusPageData({
      schoolId: nextFilters.schoolId,
      academicYear: nextFilters.academicYear,
      classId: nextFilters.classId,
      subjectId: nextFilters.subjectId,
    })
    const nextLessons = Array.isArray(data?.lessons) ? data.lessons : []
    setLessons(nextLessons)
    if (nextLessons.length > 0) {
      const keep = nextLessons.some((l) => String(l.lessonId) === String(selectedLessonId))
      setSelectedLessonId(keep ? selectedLessonId : nextLessons[0].lessonId)
    } else {
      setSelectedLessonId(null)
    }
  }

  const handleApplyFilters = async (e) => {
    e.preventDefault()
    if (isStudentScope) return
    const errs = validateFind()
    if (Object.keys(errs).length > 0) {
      setFindErrors(errs)
      return
    }
    try {
      setFindErrors({})
      setError('')
      setLoading(true)
      const next = { ...pendingFilters }
      setFilters(next)
      setHasSearched(true)
      setIsFindSidebarOpen(false)
      await reloadPageData(next)
    } catch (e2) {
      setError(e2?.message || 'Failed to load lesson status')
    } finally {
      setLoading(false)
    }
  }

  const handleResetFilters = () => {
    if (isStudentScope) return
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setFindErrors({})
    setHasSearched(false)
    setLessons([])
    setSelectedLessonId(null)
    setSearch('')
    setCurrentPage(1)
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => {
      if (id === 'headOfficeId') return { ...prev, headOfficeId: value, schoolId: 'Select', academicYear: 'Select', classId: 'Select', subjectId: 'Select' }
      if (id === 'schoolId') return { ...prev, schoolId: value, academicYear: 'Select', classId: 'Select', subjectId: 'Select' }
      if (id === 'classId') return { ...prev, classId: value, subjectId: 'Select' }
      return { ...prev, [id]: value }
    })
    setFindErrors((prev) => ({ ...prev, [id]: '' }))
  }

  const updateLessonInState = (lessonId, patch) => {
    setLessons((prev) => prev.map((l) => (String(l.lessonId) === String(lessonId) ? { ...l, ...patch } : l)))
  }

  const updateTopicInState = (topicId, patch) => {
    setLessons((prev) =>
      prev.map((l) => {
        const topics = Array.isArray(l.topics) ? l.topics : []
        if (!topics.some((t) => String(t.topicId) === String(topicId))) return l
        return { ...l, topics: topics.map((t) => (String(t.topicId) === String(topicId) ? { ...t, ...patch } : t)) }
      }),
    )
  }

  const handleTopicStatusChange = async (topic, nextStatus) => {
    if (!topic?.topicId) return
    try {
      setSaving(true)
      setError('')
      const res = await updateTopicStatus({ topicId: topic.topicId, status: nextStatus })
      updateTopicInState(topic.topicId, { topicStatus: res?.topicStatus || nextStatus })
      if (res?.lessonId && res?.lessonStatus) {
        updateLessonInState(res.lessonId, { lessonStatus: res.lessonStatus })
      } else if (selectedLessonId) {
        await reloadPageData(filters)
      }
    } catch (e) {
      setError(e?.message || 'Failed to update topic status')
    } finally {
      setSaving(false)
    }
  }

  const handleLessonStatusChange = async (lesson, nextStatus) => {
    if (!lesson?.lessonId) return
    if (nextStatus === 'COMPLETED' && !canCompleteLesson(lesson)) return
    try {
      setSaving(true)
      setError('')
      const res = await updateLessonStatus({ lessonId: lesson.lessonId, status: nextStatus })
      updateLessonInState(lesson.lessonId, { lessonStatus: res?.lessonStatus || nextStatus })
    } catch (e) {
      setError(e?.message || 'Failed to update lesson status')
    } finally {
      setSaving(false)
    }
  }

  const classOptions = useMemo(() => {
    return classesLookup
      .filter((c) => pendingFilters.schoolId === 'Select' || String(c.schoolId) === String(pendingFilters.schoolId))
      .slice()
      .sort((a, b) => String(a.className || '').localeCompare(String(b.className || '')))
  }, [classesLookup, pendingFilters.schoolId])

  const subjectOptions = useMemo(() => {
    return subjectsLookup
      .filter((s) => {
        if (pendingFilters.schoolId !== 'Select' && String(s.schoolId) !== String(pendingFilters.schoolId)) return false
        if (pendingFilters.classId !== 'Select' && String(s.classId) !== String(pendingFilters.classId)) return false
        return true
      })
      .slice()
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
  }, [subjectsLookup, pendingFilters.schoolId, pendingFilters.classId])

  const headOfficeOptions = useMemo(() => {
    return (Array.isArray(headOfficesLookup) ? headOfficesLookup : [])
      .map((row) => ({ id: row?.id, name: row?.name || row?.headOfficeName || '' }))
      .filter((row) => row.id != null && row.name)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [headOfficesLookup])

  const schoolOptions = useMemo(() => {
    const rows = Array.isArray(schoolsLookup) ? schoolsLookup : []
    if (roleUpper === 'SUPER_ADMIN' && pendingFilters.headOfficeId !== 'Select') {
      return rows.filter((school) => String(school?.headOfficeId ?? '') === String(pendingFilters.headOfficeId))
    }
    return rows
  }, [pendingFilters.headOfficeId, roleUpper, schoolsLookup])

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Lesson Status</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Lesson Status</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="card mb-16">
          <div className="card-body px-20 py-12 text-danger-600">{error}</div>
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-0">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown
                rows={filteredLessons}
                columns={columnOptions}
                visibleColumns={visibleColumns}
                fileName="Lesson_Status"
                sheetName="Lesson Status"
                pdfTitle="Lesson Status"
              />
              {!isStudentScope ? (
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                  onClick={() => setIsFindSidebarOpen(true)}
                >
                  <span className="text-secondary-light text-sm">Find</span>
                  <i className="ri-arrow-right-line"></i>
                </button>
              ) : null}
              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                  data-bs-toggle="dropdown"
                >
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <ul className="dropdown-menu p-12 border shadow">
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
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(v) => {
                  setRowsPerPage(Number(v))
                  setCurrentPage(1)
                }}
              />
            </div>
            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search lessons/topics..."
                value={search}
                disabled={!hasSearched}
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

          <div className="p-20">
            <div className="row g-16">
              <div className="col-12 col-lg-5">
                <div className="border rounded">
                  <div className="px-16 py-12 border-bottom fw-semibold text-primary-light">Lessons</div>
                  <div className="table-responsive">
                    <table className="table table-striped align-middle mb-0">
                      <thead>
                        <tr>
                          {columnOptions.map(
                            (col) =>
                              visibleColumns[col.key] && (
                                <th scope="col" key={col.key}>
                                  {col.label}
                                </th>
                              ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {!hasSearched ? (
                          <tr>
                            <td colSpan={visibleColumnCount + 1} className="text-center py-20 text-secondary-light">
                              <FindEmptyState
                                title="Lesson Status"
                                description="Use the Find button to select School, Academic Year, Class and Subject to load lesson statuses."
                                buttonLabel="Find Lesson Status"
                                onFind={() => setIsFindSidebarOpen(true)}
                              />
                            </td>
                          </tr>
                        ) : loading ? (
                          <tr>
                            <td colSpan={visibleColumnCount + 1} className="text-center py-20 text-secondary-light">
                              Loading...
                            </td>
                          </tr>
                        ) : filteredLessons.length === 0 ? (
                          <tr>
                            <td colSpan={visibleColumnCount} className="text-center py-20 text-secondary-light">
                              No lessons found.
                            </td>
                          </tr>
                        ) : (
                          paginatedLessons.map((l) => {
                            const isActive = String(l.lessonId) === String(selectedLessonId)
                            const allowComplete = canCompleteLesson(l)
                            return (
                              <tr
                                key={l.lessonId}
                                onClick={() => {
                                  if (!hasSearched || loading) return
                                  setSelectedLessonId(l.lessonId)
                                }}
                                style={{ cursor: 'pointer', background: isActive ? '#f8fafc' : undefined }}
                              >
                                {visibleColumns.lessonName ? (
                                  <td className="fw-medium text-primary-light">{l.lessonName || `Lesson ${l.lessonId}`}</td>
                                ) : null}
                                {visibleColumns.lessonStatus ? (
                                  <td>
                                    <select
                                      className="form-select form-select-sm"
                                      value={l.lessonStatus || 'YET_TO_START'}
                                      disabled={!canManageLessonStatus || saving}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => handleLessonStatusChange(l, e.target.value)}
                                    >
                                      {STATUS_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value} disabled={o.value === 'COMPLETED' && !allowComplete}>
                                          {o.label}
                                        </option>
                                      ))}
                                    </select>
                                    {!allowComplete && String(l.lessonStatus || 'YET_TO_START') !== 'COMPLETED' ? (
                                      <div className="text-secondary-light text-xs mt-4">Complete all topics first.</div>
                                    ) : null}
                                  </td>
                                ) : null}
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-7">
                <div className="border rounded">
                  <div className="px-16 py-12 border-bottom fw-semibold text-primary-light">
                    Topics {selectedLesson ? <span className="text-secondary-light">/ {selectedLesson.lessonName}</span> : null}
                  </div>
                  <div className="table-responsive">
                    <table className="table table-striped align-middle mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: '60%' }}>Topic</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!hasSearched ? (
                          <tr>
                            <td colSpan={2} className="text-center py-20 text-secondary-light">
                              <FindEmptyState
                                title="Lesson Status"
                                description="Use the Find button to select School, Academic Year, Class and Subject to load lesson statuses."
                                buttonLabel="Find Lesson Status"
                                onFind={() => setIsFindSidebarOpen(true)}
                              />
                            </td>
                          </tr>
                        ) : loading ? (
                          <tr>
                            <td colSpan={2} className="text-center py-20 text-secondary-light">
                              Loading...
                            </td>
                          </tr>
                        ) : !selectedLesson ? (
                          <tr>
                            <td colSpan={2} className="text-center py-20 text-secondary-light">
                              Select a lesson to view topics.
                            </td>
                          </tr>
                        ) : (selectedLesson.topics || []).length === 0 ? (
                          <tr>
                            <td colSpan={2} className="text-center py-20 text-secondary-light">
                              No topics under this lesson.
                            </td>
                          </tr>
                        ) : (
                          (selectedLesson.topics || []).map((t) => (
                            <tr key={t.topicId}>
                              <td className="fw-medium text-primary-light">{t.topicName || `Topic ${t.topicId}`}</td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={t.topicStatus || 'YET_TO_START'}
                                  disabled={!canManageLessonStatus || saving}
                                  onChange={(e) => handleTopicStatusChange(t, e.target.value)}
                                >
                                  {STATUS_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                      {o.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-16 py-12 border-top border-neutral-200">
            <TablePagination
              paginationProps={{
                currentPage,
                totalPages,
                pageInfo: `Showing ${filteredLessons.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, filteredLessons.length)} of ${filteredLessons.length} entries`,
                onPageChange: (next) => setCurrentPage(Math.min(Math.max(1, Number(next) || 1), totalPages)),
              }}
            />
          </div>
        </div>
      </div>

      {!isStudentScope ? (
        <SlideSidebar
          isOpen={isFindSidebarOpen}
          title="Find Lesson Status"
          onClose={() => setIsFindSidebarOpen(false)}
          className="filter-sidebar"
        >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          {roleUpper === 'SUPER_ADMIN' ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="headOfficeId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                Head Office <span className="text-danger-600">*</span>
              </label>
              <select
                id="headOfficeId"
                className={`form-control form-select${findErrors.headOfficeId ? ' is-invalid' : ''}`}
                value={pendingFilters.headOfficeId}
                onChange={handlePendingFilterChange}
              >
                <option value="Select">--Select Head Office--</option>
                {headOfficeOptions.map((headOffice) => (
                  <option key={headOffice.id} value={String(headOffice.id)}>
                    {headOffice.name}
                  </option>
                ))}
              </select>
              {findErrors.headOfficeId ? <div className="text-danger-600 text-sm mt-4">{findErrors.headOfficeId}</div> : null}
            </div>
          ) : null}

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School <span className="text-danger-600">*</span>
            </label>
            <select
              id="schoolId"
              className={`form-control form-select${findErrors.schoolId ? ' is-invalid' : ''}`}
              value={pendingFilters.schoolId}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select School--</option>
              {schoolOptions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.schoolName}
                </option>
              ))}
            </select>
            {findErrors.schoolId ? <div className="text-danger-600 text-sm mt-4">{findErrors.schoolId}</div> : null}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="academicYear" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Academic Year <span className="text-danger-600">*</span>
            </label>
            <select
              id="academicYear"
              className={`form-control form-select${findErrors.academicYear ? ' is-invalid' : ''}`}
              value={pendingFilters.academicYear}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {academicYearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {findErrors.academicYear ? <div className="text-danger-600 text-sm mt-4">{findErrors.academicYear}</div> : null}
          </div>

          <div>
            <label htmlFor="classId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class <span className="text-danger-600">*</span>
            </label>
            <select
              id="classId"
              className={`form-control form-select${findErrors.classId ? ' is-invalid' : ''}`}
              value={pendingFilters.classId}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {classOptions.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.className}
                </option>
              ))}
            </select>
            {findErrors.classId ? <div className="text-danger-600 text-sm mt-4">{findErrors.classId}</div> : null}
          </div>

          <div>
            <label htmlFor="subjectId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Subject <span className="text-danger-600">*</span>
            </label>
            <select
              id="subjectId"
              className={`form-control form-select${findErrors.subjectId ? ' is-invalid' : ''}`}
              value={pendingFilters.subjectId}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {subjectOptions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
            {findErrors.subjectId ? <div className="text-danger-600 text-sm mt-4">{findErrors.subjectId}</div> : null}
          </div>

          <div></div>

          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
              Reset
            </button>
          </div>
          <div>
            <button type="submit" className="btn btn-primary-600 w-100" disabled={loading}>
              Apply
            </button>
          </div>
          </form>
        </SlideSidebar>
      ) : null}
    </div>
  )
}

export default LessonStatus
