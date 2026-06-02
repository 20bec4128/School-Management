import { useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import { TablePagination } from '../components/table'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { fetchLessonTimelines, fetchTopicTimelinesForLesson, updateLessonTimeline, updateTopicTimeline } from '../apis/lessonTimelineApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { can } from '../utils/permissions'
import { useAuth } from '../context/useAuth'
import useAcademicYearOptions from '../hooks/useAcademicYearOptions'
import '../assets/css/addModalShared.css'
import FindEmptyState from '../components/FindEmptyState'

const emptyFilters = {
  schoolId: 'Select',
  academicYear: 'Select',
  classId: 'Select',
  subjectId: 'Select',
}

const lessonColumnOptions = [
  { key: 'lessonName', label: 'Lesson' },
  { key: 'startDate', label: 'Start' },
  { key: 'endDate', label: 'End' },
]

const getChildScope = (children, selectedChildId) => {
  const list = Array.isArray(children) ? children : []
  const selected = selectedChildId != null && selectedChildId !== ''
    ? list.find((child) => String(child?.studentId ?? child?.id ?? child?.student?.id ?? '') === String(selectedChildId))
    : null
  return selected || list[0] || null
}

const toDateInputValue = (d) => (d ? String(d) : '')

const LessonTimeline = () => {
  const { role, schoolId, schoolName, studentClassId, selectedChildId, parentChildren, user, canEdit } = useAuth()
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])

  const [lessons, setLessons] = useState([])
  const [topics, setTopics] = useState([])
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
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(lessonColumnOptions)

  const roleUpper = String(role || '').toUpperCase()
  const isStudentScope = roleUpper === 'STUDENT' || roleUpper === 'PARENT'
  const isSchoolAdmin = roleUpper === 'SCHOOL_ADMIN'
  const isTeacherScope = roleUpper === 'TEACHER'
  const isFixedSchoolScope = isSchoolAdmin || isTeacherScope
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
  const PAGE_SLUG = 'lesson-timeline'
  const canManageTimeline = canEdit(PAGE_SLUG)
  const currentSchoolOption = useMemo(() => {
    if (!isFixedSchoolScope || schoolId == null) return null
    return { id: schoolId, schoolName: schoolName || `School ${schoolId}` }
  }, [isFixedSchoolScope, schoolId, schoolName])
  const fixedSchoolId = currentSchoolOption?.id != null ? String(currentSchoolOption.id) : ''
  const academicYearOptions = useAcademicYearOptions({
    schoolId:
      isStudentScope
        ? effectiveSchoolId ?? ''
        : fixedSchoolId
          ? fixedSchoolId
        : pendingFilters.schoolId !== 'Select'
          ? pendingFilters.schoolId
          : '',
    enabled:
      (isStudentScope && Boolean(effectiveSchoolId)) ||
      Boolean(fixedSchoolId) ||
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
          const nextLessonId = await reloadLessons(nextFilters)
          if (ignore) return
          setPendingFilters(nextFilters)
          setFilters(nextFilters)
          setHasSearched(true)
          setIsFindSidebarOpen(false)
          await reloadTopics(nextLessonId, nextFilters)
          return
        }
        const [schools, classes, subjects] = await Promise.all([
          isFixedSchoolScope ? Promise.resolve(currentSchoolOption ? [currentSchoolOption] : []) : fetchSchoolsLookup(),
          fetchClasses(),
          fetchSubjects(),
        ])
        if (ignore) return
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
  }, [currentSchoolOption, defaultAcademicYear, effectiveClassId, effectiveSchoolId, isFixedSchoolScope, isStudentScope])

  useEffect(() => {
    if (!fixedSchoolId) return
    setPendingFilters((prev) => (prev.schoolId === fixedSchoolId ? prev : { ...prev, schoolId: fixedSchoolId }))
    setFilters((prev) => (prev.schoolId === fixedSchoolId ? prev : { ...prev, schoolId: fixedSchoolId }))
  }, [fixedSchoolId])

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

  const validateFind = () => {
    const errs = {}
    if (pendingFilters.schoolId === 'Select') errs.schoolId = 'School is required.'
    if (pendingFilters.academicYear === 'Select') errs.academicYear = 'Academic Year is required.'
    if (pendingFilters.classId === 'Select') errs.classId = 'Class is required.'
    if (pendingFilters.subjectId === 'Select') errs.subjectId = 'Subject is required.'
    return errs
  }

  const reloadLessons = async (nextFilters = filters) => {
    const data = await fetchLessonTimelines({
      schoolId: nextFilters.schoolId,
      academicYear: nextFilters.academicYear,
      classId: nextFilters.classId,
      subjectId: nextFilters.subjectId,
    })
    const rows = Array.isArray(data) ? data : []
    setLessons(rows)
    if (rows.length === 0) {
      setSelectedLessonId(null)
      setTopics([])
      return
    }
    const keep = rows.some((l) => String(l.lessonId) === String(selectedLessonId))
    const nextLessonId = keep ? selectedLessonId : rows[0].lessonId
    setSelectedLessonId(nextLessonId)
    return nextLessonId
  }

  const reloadTopics = async (lessonId, nextFilters = filters) => {
    if (!lessonId) {
      setTopics([])
      return
    }
    const data = await fetchTopicTimelinesForLesson({
      lessonId,
      schoolId: nextFilters.schoolId,
      academicYear: nextFilters.academicYear,
      classId: nextFilters.classId,
      subjectId: nextFilters.subjectId,
    })
    setTopics(Array.isArray(data) ? data : [])
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
      const nextLessonId = await reloadLessons(pendingFilters)
      setFilters(pendingFilters)
      setHasSearched(true)
      setIsFindSidebarOpen(false)
      await reloadTopics(nextLessonId, pendingFilters)
    } catch (e2) {
      setLessons([])
      setTopics([])
      setSelectedLessonId(null)
      setError(e2?.message || 'Failed to load lesson timeline')
    } finally {
      setLoading(false)
    }
  }

  const handleResetFilters = () => {
    if (isStudentScope) return
    const nextFilters = fixedSchoolId ? { ...emptyFilters, schoolId: fixedSchoolId } : emptyFilters
    setPendingFilters(nextFilters)
    setFilters(nextFilters)
    setFindErrors({})
    setHasSearched(false)
    setLessons([])
    setTopics([])
    setSelectedLessonId(null)
    setSearch('')
    setCurrentPage(1)
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => {
      if (id === 'schoolId') return { ...prev, schoolId: value, academicYear: 'Select', classId: 'Select', subjectId: 'Select' }
      if (id === 'classId') return { ...prev, classId: value, subjectId: 'Select' }
      return { ...prev, [id]: value }
    })
    setFindErrors((prev) => ({ ...prev, [id]: '' }))
  }

  const filteredLessons = useMemo(() => {
    if (!hasSearched) return []
    const q = search.trim().toLowerCase()
    if (!q) return lessons
    return lessons.filter((l) => {
      const text = `${l.lessonName || ''} ${l.startDate || ''} ${l.endDate || ''}`
      return text.toLowerCase().includes(q)
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

  const handleSelectLesson = async (lessonId) => {
    setSelectedLessonId(lessonId)
    try {
      setError('')
      setLoading(true)
      await reloadTopics(lessonId, filters)
    } catch (e) {
      setTopics([])
      setError(e?.message || 'Failed to load topics')
    } finally {
      setLoading(false)
    }
  }

  const patchLesson = (lessonId, patch) => {
    setLessons((prev) => prev.map((l) => (String(l.lessonId) === String(lessonId) ? { ...l, ...patch } : l)))
  }

  const patchTopic = (topicId, patch) => {
    setTopics((prev) => prev.map((t) => (String(t.topicId) === String(topicId) ? { ...t, ...patch } : t)))
  }

  const saveLessonDates = async (lesson) => {
    if (!lesson?.lessonId) return
    try {
      setSaving(true)
      setError('')
      const res = await updateLessonTimeline({
        lessonId: lesson.lessonId,
        startDate: lesson.startDate || null,
        endDate: lesson.endDate || null,
      })
      patchLesson(lesson.lessonId, {
        startDate: res?.startDate ?? null,
        endDate: res?.endDate ?? null,
      })
    } catch (e) {
      setError(e?.message || 'Failed to update lesson dates')
    } finally {
      setSaving(false)
    }
  }

  const saveTopicDates = async (topic) => {
    if (!topic?.topicId) return
    try {
      setSaving(true)
      setError('')
      const res = await updateTopicTimeline({
        topicId: topic.topicId,
        startDate: topic.startDate || null,
        endDate: topic.endDate || null,
      })
      patchTopic(topic.topicId, {
        startDate: res?.startDate ?? null,
        endDate: res?.endDate ?? null,
      })
    } catch (e) {
      setError(e?.message || 'Failed to update topic dates')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Lesson Timeline</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Lesson Timeline</span>
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
                  columns={lessonColumnOptions}
                  visibleColumns={visibleColumns}
                  fileName="Lesson_Timeline"
                  sheetName="Lesson Timeline"
                  pdfTitle="Lesson Timeline"
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
                    {lessonColumnOptions.map((column) => (
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
                placeholder="Search lessons..."
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

          <div className="p-20">
            <div className="row g-16">
              <div className="col-12 col-lg-5">
                <div className="border rounded">
                  <div className="px-16 py-12 border-bottom fw-semibold text-primary-light">Lessons</div>
                  <div className="table-responsive">
                    <table className="table table-striped align-middle mb-0">
                        <thead>
                          <tr>
                            {lessonColumnOptions.map(
                              (col) =>
                                visibleColumns[col.key] && (
                                  <th scope="col" key={col.key}>
                                    {col.label}
                                  </th>
                                ),
                            )}
                            <th style={{ width: 80 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {!hasSearched ? (
                            <tr>
                              <td colSpan={visibleColumnCount + 1} className="text-center py-20 text-secondary-light">
                                <FindEmptyState
                                  title="Lesson Timeline"
                                  description="Use the Find button to select School, Academic Year, Class and Subject to load the timeline."
                                  buttonLabel="Find Lesson Timeline"
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
                              <td colSpan={visibleColumnCount + 1} className="text-center py-20 text-secondary-light">
                                No lessons found.
                              </td>
                            </tr>
                          ) : (
                            paginatedLessons.map((l) => {
                              const isActive = String(l.lessonId) === String(selectedLessonId)
                              return (
                                <tr key={l.lessonId} style={{ background: isActive ? '#f8fafc' : undefined }}>
                                  {visibleColumns.lessonName ? (
                                    <td
                                      className="fw-medium text-primary-light"
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => {
                                        if (!hasSearched || loading) return
                                        handleSelectLesson(l.lessonId)
                                      }}
                                    >
                                      {l.lessonName || `Lesson ${l.lessonId}`}
                                    </td>
                                  ) : null}
                                  {visibleColumns.startDate ? (
                                    <td>
                                      <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={toDateInputValue(l.startDate)}
                                        disabled={!canManageTimeline || saving}
                                        onChange={(e) => patchLesson(l.lessonId, { startDate: e.target.value || null })}
                                      />
                                    </td>
                                  ) : null}
                                  {visibleColumns.endDate ? (
                                    <td>
                                      <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={toDateInputValue(l.endDate)}
                                        disabled={!canManageTimeline || saving}
                                        onChange={(e) => patchLesson(l.lessonId, { endDate: e.target.value || null })}
                                      />
                                    </td>
                                  ) : null}
                                  <td>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-primary-600"
                                      disabled={!canManageTimeline || saving}
                                      onClick={() => saveLessonDates(l)}
                                    >
                                      Save
                                    </button>
                                  </td>
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
                            <th style={{ width: '45%' }}>Topic</th>
                            <th>Start</th>
                            <th>End</th>
                            <th style={{ width: 80 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {!hasSearched ? (
                            <tr>
                              <td colSpan={4} className="text-center py-20 text-secondary-light">
                                <FindEmptyState
                                  title="Lesson Timeline"
                                  description="Use the Find button to select School, Academic Year, Class and Subject to load the timeline."
                                  buttonLabel="Find Lesson Timeline"
                                  onFind={() => setIsFindSidebarOpen(true)}
                                />
                              </td>
                            </tr>
                          ) : loading ? (
                            <tr>
                              <td colSpan={4} className="text-center py-20 text-secondary-light">
                                Loading...
                              </td>
                            </tr>
                          ) : !selectedLessonId ? (
                            <tr>
                              <td colSpan={4} className="text-center py-20 text-secondary-light">
                                Select a lesson to view topics.
                              </td>
                            </tr>
                          ) : topics.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-20 text-secondary-light">
                                No topics under this lesson.
                              </td>
                            </tr>
                          ) : (
                            topics.map((t) => (
                              <tr key={t.topicId}>
                                <td className="fw-medium text-primary-light">{t.topicName || `Topic ${t.topicId}`}</td>
                                <td>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={toDateInputValue(t.startDate)}
                                    disabled={!canManageTimeline || saving}
                                    onChange={(e) => patchTopic(t.topicId, { startDate: e.target.value || null })}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={toDateInputValue(t.endDate)}
                                    disabled={!canManageTimeline || saving}
                                    onChange={(e) => patchTopic(t.topicId, { endDate: e.target.value || null })}
                                  />
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary-600"
                                    disabled={!canManageTimeline || saving}
                                    onClick={() => saveTopicDates(t)}
                                  >
                                    Save
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
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
          </div>
        </div>
      {!isStudentScope ? (
      <SlideSidebar isOpen={isFindSidebarOpen} title="Find Lesson Timeline" onClose={() => setIsFindSidebarOpen(false)} className="filter-sidebar">
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School <span className="text-danger-600">*</span>
            </label>
            {isFixedSchoolScope ? (
              <input
                className="form-control"
                value={currentSchoolOption?.schoolName || schoolName || ''}
                readOnly
              />
            ) : (
              <select
                id="schoolId"
                className={`form-control form-select${findErrors.schoolId ? ' is-invalid' : ''}`}
                value={pendingFilters.schoolId}
                onChange={handlePendingFilterChange}
              >
                <option value="Select">--Select School--</option>
                {schoolsLookup.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.schoolName}
                  </option>
                ))}
              </select>
            )}
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

export default LessonTimeline
