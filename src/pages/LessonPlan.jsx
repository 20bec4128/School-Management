import { useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import { fetchLessonPlanView } from '../apis/lessonTimelineApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { useAuth } from '../context/useAuth'
import useAcademicYearOptions from '../hooks/useAcademicYearOptions'
import '../assets/css/addModalShared.css'

const emptyFilters = {
  school: 'Select',
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

const LessonPlan = () => {
  const { role, schoolId, studentClassId, selectedChildId, parentChildren } = useAuth()
  const [rows, setRows] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [isFindSidebarOpen, setIsFindSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [findErrors, setFindErrors] = useState({})
  const [hasSearched, setHasSearched] = useState(false)

  const roleUpper = String(role || '').toUpperCase()
  const isStudentScope = roleUpper === 'STUDENT' || roleUpper === 'PARENT'
  const selectedChild = useMemo(
    () => getChildScope(parentChildren, selectedChildId),
    [parentChildren, selectedChildId],
  )
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
  const academicYearOptions = useAcademicYearOptions({
    schoolId:
      isStudentScope
        ? effectiveSchoolId ?? ''
        : pendingFilters.school !== 'Select'
          ? pendingFilters.school
          : '',
    enabled:
      (isStudentScope && Boolean(effectiveSchoolId)) ||
      pendingFilters.school !== 'Select',
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
              setRows([])
              setHasSearched(false)
              setLoading(false)
            }
            return
          }
          const data = await fetchLessonPlanView({
            schoolId: effectiveSchoolId,
            academicYear: defaultAcademicYear,
            classId: effectiveClassId,
          })
          if (ignore) return
          setRows(Array.isArray(data) ? data : [])
          const nextFilters = {
            school: String(effectiveSchoolId),
            academicYear: defaultAcademicYear,
            classId: String(effectiveClassId),
            subjectId: 'Select',
          }
          setPendingFilters(nextFilters)
          setFilters(nextFilters)
          setHasSearched(true)
          return
        }

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
  }, [defaultAcademicYear, effectiveClassId, effectiveSchoolId, isStudentScope])

  const filtered = useMemo(() => {
    if (!hasSearched) return []
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const text = `${r.lessonName || ''} ${r.lessonStartDate || ''} ${r.lessonEndDate || ''} ${r.topicName || ''} ${r.topicStartDate || ''} ${r.topicEndDate || ''}`
      return text.toLowerCase().includes(q)
    })
  }, [rows, search, hasSearched])

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => {
      if (id === 'school') return { ...prev, school: value, academicYear: 'Select', classId: 'Select', subjectId: 'Select' }
      if (id === 'classId') return { ...prev, classId: value, subjectId: 'Select' }
      return { ...prev, [id]: value }
    })
    setFindErrors((prev) => ({ ...prev, [id]: '' }))
  }

  const validateFind = () => {
    const errs = {}
    if (pendingFilters.school === 'Select') errs.school = 'School Name is required.'
    if (pendingFilters.academicYear === 'Select') errs.academicYear = 'Academic Year is required.'
    if (pendingFilters.classId === 'Select') errs.classId = 'Class is required.'
    if (pendingFilters.subjectId === 'Select') errs.subjectId = 'Subject is required.'
    return errs
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
      const data = await fetchLessonPlanView({
        schoolId: pendingFilters.school,
        academicYear: pendingFilters.academicYear,
        classId: pendingFilters.classId,
        subjectId: pendingFilters.subjectId === 'Select' ? null : pendingFilters.subjectId,
      })
      setRows(Array.isArray(data) ? data : [])
      setFilters(pendingFilters)
      setHasSearched(true)
      setIsFindSidebarOpen(false)
    } catch (e2) {
      setError(e2?.message || 'Failed to load lesson plan')
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
    setRows([])
    setSearch('')
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Lesson Plan</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Lesson Plan</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="card mb-16">
          <div className="card-body px-20 py-12 text-danger-600">{error}</div>
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              {!isStudentScope ? (
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
              ) : null}
              {hasSearched && !isStudentScope ? (
                <button type="button" className="btn btn-sm btn-light border" onClick={handleResetFilters}>
                  Reset
                </button>
              ) : null}
            </div>
            <div className="d-flex align-items-center gap-8">
              <input
                type="text"
                className="form-control form-control-sm border border-neutral-300 radius-8"
                placeholder="Search lesson plan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={!hasSearched}
              />
            </div>
          </div>

          {!hasSearched ? (
            <div className="px-20 py-40 text-center">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#7a8a9a' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ri-search-line" style={{ fontSize: '1.5rem', color: '#45597a' }}></i>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#45597a' }}>Lesson Plan</p>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#7a8a9a' }}>
                  Use the <strong>Find</strong> button to select School, Academic Year, Class and Subject to load the read-only plan view.
                </p>
                {!isStudentScope ? (
                  <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={() => setIsFindSidebarOpen(true)}>
                    <i className="ri-filter-3-line"></i> Find Lesson Plan
                  </button>
                ) : null}
              </div>
            </div>
          ) : loading ? (
            <div className="px-20 py-40 text-center text-secondary-light">Loading…</div>
          ) : (
            <div className="table-responsive">
              <table className="table bordered-table mb-0">
                <thead>
                  <tr>
                    <th>Lesson</th>
                    <th style={{ width: 130 }}>Lesson Start</th>
                    <th style={{ width: 130 }}>Lesson End</th>
                    <th>Topic</th>
                    <th style={{ width: 130 }}>Topic Start</th>
                    <th style={{ width: 130 }}>Topic End</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-40 text-secondary-light">
                        No rows found for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r, idx) => (
                      <tr key={`${r.lessonId || 'l'}-${r.topicId || 't'}-${idx}`}>
                        <td className="fw-medium text-primary-light">{r.lessonName || '-'}</td>
                        <td>{r.lessonStartDate || '-'}</td>
                        <td>{r.lessonEndDate || '-'}</td>
                        <td className="fw-medium text-primary-light">{r.topicName || '-'}</td>
                        <td>{r.topicStartDate || '-'}</td>
                        <td>{r.topicEndDate || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {!isStudentScope ? (
        <SlideSidebar
          isOpen={isFindSidebarOpen}
          title="Find Lesson Plan"
          onClose={() => setIsFindSidebarOpen(false)}
          className="filter-sidebar"
        >
          <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="school" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School Name <span className="text-danger-600">*</span>
            </label>
            <select
              id="school"
              className={`form-control form-select${findErrors.school ? ' is-invalid' : ''}`}
              value={pendingFilters.school}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select School--</option>
              {schoolsLookup.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.schoolName}
                </option>
              ))}
            </select>
            {findErrors.school && <div className="text-danger-600 text-sm mt-4">{findErrors.school}</div>}
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
            {findErrors.academicYear && <div className="text-danger-600 text-sm mt-4">{findErrors.academicYear}</div>}
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
              {classesLookup
                .filter((c) => pendingFilters.school === 'Select' || String(c.schoolId) === String(pendingFilters.school))
                .map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.className}
                  </option>
                ))}
            </select>
            {findErrors.classId && <div className="text-danger-600 text-sm mt-4">{findErrors.classId}</div>}
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
              {subjectsLookup
                .filter((s) => {
                  if (pendingFilters.school !== 'Select' && String(s.schoolId) !== String(pendingFilters.school)) return false
                  if (pendingFilters.classId !== 'Select' && String(s.classId) !== String(pendingFilters.classId)) return false
                  return true
                })
                .map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
            </select>
            {findErrors.subjectId && <div className="text-danger-600 text-sm mt-4">{findErrors.subjectId}</div>}
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-sm btn-secondary-600" onClick={handleResetFilters}>
              Reset
            </button>
            <button type="submit" className="btn btn-sm btn-primary-600" disabled={loading}>
              {loading ? 'Loading...' : 'Apply'}
            </button>
          </div>
          </form>
        </SlideSidebar>
      ) : null}
    </div>
  )
}

export default LessonPlan
