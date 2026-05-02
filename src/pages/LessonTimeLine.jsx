import { useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import { fetchLessonTimelines, fetchTopicTimelinesForLesson, updateLessonTimeline, updateTopicTimeline } from '../apis/lessonTimelineApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { can } from '../utils/permissions'
import '../assets/css/addModalShared.css'

const ACADEMIC_YEAR_OPTIONS = ['2025-2026', '2024-2025', '2023-2024', '2022-2023']

const emptyFilters = {
  schoolId: 'Select',
  academicYear: 'Select',
  classId: 'Select',
  subjectId: 'Select',
}

const readCurrentUser = () => {
  try {
    const raw = localStorage.getItem('sm_user')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const toDateInputValue = (d) => (d ? String(d) : '')

const LessonTimeline = () => {
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
  const [isFindSidebarOpen, setIsFindSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [findErrors, setFindErrors] = useState({})
  const [hasSearched, setHasSearched] = useState(false)

  const user = readCurrentUser()
  const canManageTimeline = can(user, ['LESSON_PLAN_MANAGE', 'LESSON_PLAN_MANAGE_ASSIGNED', '*'])

  useEffect(() => {
    let ignore = false
    const run = async () => {
      try {
        setLoading(true)
        setError('')
        const [schools, classes, subjects] = await Promise.all([fetchSchoolsLookup(), fetchClasses(), fetchSubjects()])
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
  }, [])

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
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setFindErrors({})
    setHasSearched(false)
    setLessons([])
    setTopics([])
    setSelectedLessonId(null)
    setSearch('')
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => {
      if (id === 'schoolId') return { ...prev, schoolId: value, classId: 'Select', subjectId: 'Select' }
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
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 p-20 border-bottom">
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-secondary-600" onClick={() => setIsFindSidebarOpen(true)}>
                Find
              </button>
            </div>

            <div className="position-relative">
              <input
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search lessons..."
                value={search}
                disabled={!hasSearched}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          {!hasSearched ? (
            <div className="px-20 py-40 text-center text-secondary-light">
              Use <strong>Find</strong> to select School, Academic Year, Class and Subject.
            </div>
          ) : loading ? (
            <div className="px-20 py-40 text-center text-secondary-light">Loading...</div>
          ) : (
            <div className="p-20">
              <div className="row g-16">
                <div className="col-12 col-lg-5">
                  <div className="border rounded">
                    <div className="px-16 py-12 border-bottom fw-semibold text-primary-light">Lessons</div>
                    <div className="table-responsive">
                      <table className="table mb-0">
                        <thead>
                          <tr>
                            <th style={{ width: '42%' }}>Lesson</th>
                            <th>Start</th>
                            <th>End</th>
                            <th style={{ width: 80 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLessons.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-20 text-secondary-light">
                                No lessons found.
                              </td>
                            </tr>
                          ) : (
                            filteredLessons.map((l) => {
                              const isActive = String(l.lessonId) === String(selectedLessonId)
                              return (
                                <tr key={l.lessonId} style={{ background: isActive ? '#f8fafc' : undefined }}>
                                  <td
                                    className="fw-medium text-primary-light"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleSelectLesson(l.lessonId)}
                                  >
                                    {l.lessonName || `Lesson ${l.lessonId}`}
                                  </td>
                                  <td>
                                    <input
                                      type="date"
                                      className="form-control form-control-sm"
                                      value={toDateInputValue(l.startDate)}
                                      disabled={!canManageTimeline || saving}
                                      onChange={(e) => patchLesson(l.lessonId, { startDate: e.target.value || null })}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="date"
                                      className="form-control form-control-sm"
                                      value={toDateInputValue(l.endDate)}
                                      disabled={!canManageTimeline || saving}
                                      onChange={(e) => patchLesson(l.lessonId, { endDate: e.target.value || null })}
                                    />
                                  </td>
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
                      <table className="table mb-0">
                        <thead>
                          <tr>
                            <th style={{ width: '45%' }}>Topic</th>
                            <th>Start</th>
                            <th>End</th>
                            <th style={{ width: 80 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {!selectedLessonId ? (
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
              </div>
            </div>
          )}
        </div>
      </div>

      <SlideSidebar isOpen={isFindSidebarOpen} title="Find Lesson Timeline" onClose={() => setIsFindSidebarOpen(false)} className="filter-sidebar">
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
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
              {schoolsLookup.map((s) => (
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
              {ACADEMIC_YEAR_OPTIONS.map((y) => (
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
    </div>
  )
}

export default LessonTimeline

