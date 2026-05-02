import { useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import { fetchLessonStatusPageData, updateTopicStatus } from '../apis/lessonStatusApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { can } from '../utils/permissions'
import '../assets/css/addModalShared.css'

const ACADEMIC_YEAR_OPTIONS = ['2025-2026', '2024-2025', '2023-2024', '2022-2023']

const STATUS_OPTIONS = [
  { value: 'YET_TO_START', label: 'Yet To Start' },
  { value: 'GOING_ON', label: 'On Progress' },
  { value: 'COMPLETED', label: 'Completed' },
]

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

const statusMeta = (status) => {
  const v = String(status || 'YET_TO_START')
  if (v === 'COMPLETED') return { label: 'Completed', cls: 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm' }
  if (v === 'GOING_ON') return { label: 'On Progress', cls: 'bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm' }
  return { label: 'Yet To Start', cls: 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm' }
}

const LessonStatus = () => {
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])

  const [lessons, setLessons] = useState([])
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
  const canManageLessonStatus = can(user, ['LESSON_PLAN_MANAGE', 'LESSON_PLAN_MANAGE_ASSIGNED', '*'])

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

  const selectedLesson = useMemo(() => {
    return lessons.find((l) => String(l.lessonId) === String(selectedLessonId)) || null
  }, [lessons, selectedLessonId])

  const validateFind = () => {
    const errs = {}
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
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setFindErrors({})
    setHasSearched(false)
    setLessons([])
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
              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFindSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Find</span>
                <span>
                  <i className="ri-arrow-right-line"></i>
                </span>
              </button>
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search lessons/topics..."
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
            <div className="px-20 py-40 text-center text-secondary-light">Loading…</div>
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
                            <th style={{ width: '70%' }}>Lesson</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLessons.length === 0 ? (
                            <tr>
                              <td colSpan={2} className="text-center py-20 text-secondary-light">
                                No lessons found.
                              </td>
                            </tr>
                          ) : (
                            filteredLessons.map((l) => {
                              const isActive = String(l.lessonId) === String(selectedLessonId)
                              const meta = statusMeta(l.lessonStatus)
                              return (
                                <tr
                                  key={l.lessonId}
                                  onClick={() => setSelectedLessonId(l.lessonId)}
                                  style={{ cursor: 'pointer', background: isActive ? '#f8fafc' : undefined }}
                                >
                                  <td className="fw-medium text-primary-light">{l.lessonName || `Lesson ${l.lessonId}`}</td>
                                  <td>
                                    <span className={meta.cls}>{meta.label}</span>
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
                            <th style={{ width: '60%' }}>Topic</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!selectedLesson ? (
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
          )}
        </div>
      </div>

      <SlideSidebar
        isOpen={isFindSidebarOpen}
        title="Find Lesson Status"
        onClose={() => setIsFindSidebarOpen(false)}
        className="filter-sidebar"
      >
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

export default LessonStatus

