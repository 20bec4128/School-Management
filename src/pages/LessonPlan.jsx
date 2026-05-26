import { useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import { TablePagination } from '../components/table'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { fetchLessonPlanView } from '../apis/lessonTimelineApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { useAuth } from '../context/useAuth'
import useAcademicYearOptions from '../hooks/useAcademicYearOptions'
import '../assets/css/addModalShared.css'

const emptyFilters = {
  headOfficeId: 'Select',
  school: 'Select',
  academicYear: 'Select',
  classId: 'Select',
  subjectId: 'Select',
}

const columnOptions = [
  { key: 'lessonName', label: 'Lesson' },
  { key: 'lessonStartDate', label: 'Lesson Start' },
  { key: 'lessonEndDate', label: 'Lesson End' },
  { key: 'topicName', label: 'Topic' },
  { key: 'topicStartDate', label: 'Topic Start' },
  { key: 'topicEndDate', label: 'Topic End' },
]

const getChildScope = (children, selectedChildId) => {
  const list = Array.isArray(children) ? children : []
  const selected = selectedChildId != null && selectedChildId !== ''
    ? list.find((child) => String(child?.studentId ?? child?.id ?? child?.student?.id ?? '') === String(selectedChildId))
    : null
  return selected || list[0] || null
}

const LessonPlan = () => {
  const { role, schoolId, studentClassId, selectedChildId, parentChildren, canAdd, canEdit, canDelete } = useAuth()
  const PAGE_SLUG = 'lesson-plan'
  const [rows, setRows] = useState([])
  const [headOfficesLookup, setHeadOfficesLookup] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [isFindSidebarOpen, setIsFindSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [findErrors, setFindErrors] = useState({})
  const [hasSearched, setHasSearched] = useState(false)
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

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
  const headOfficeOptions = useMemo(() => {
    const list = Array.isArray(headOfficesLookup) ? headOfficesLookup : []
    return list
      .map((row) => ({
        id: row?.id,
        name: row?.name || row?.headOfficeName || '',
      }))
      .filter((row) => row.id != null && row.name)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [headOfficesLookup])

  const schoolOptions = useMemo(() => {
    const list = Array.isArray(schoolsLookup) ? schoolsLookup : []
    if (roleUpper === 'SUPER_ADMIN' && pendingFilters.headOfficeId !== 'Select') {
      return list.filter((school) => String(school?.headOfficeId ?? '') === String(pendingFilters.headOfficeId))
    }
    return list
  }, [pendingFilters.headOfficeId, roleUpper, schoolsLookup])

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
          setHasSearched(true)
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

  const filtered = useMemo(() => {
    if (!hasSearched) return []
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const text = `${r.lessonName || ''} ${r.lessonStartDate || ''} ${r.lessonEndDate || ''} ${r.topicName || ''} ${r.topicStartDate || ''} ${r.topicEndDate || ''}`
      return text.toLowerCase().includes(q)
    })
  }, [rows, search, hasSearched])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => {
      if (id === 'headOfficeId') return { ...prev, headOfficeId: value, school: 'Select', academicYear: 'Select', classId: 'Select', subjectId: 'Select' }
      if (id === 'school') return { ...prev, school: value, academicYear: 'Select', classId: 'Select', subjectId: 'Select' }
      if (id === 'classId') return { ...prev, classId: value, subjectId: 'Select' }
      return { ...prev, [id]: value }
    })
    setFindErrors((prev) => ({ ...prev, [id]: '' }))
  }

  const validateFind = () => {
    const errs = {}
    if (roleUpper === 'SUPER_ADMIN' && pendingFilters.headOfficeId === 'Select') errs.headOfficeId = 'Head Office is required.'
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
      setHasSearched(true)
      setIsFindSidebarOpen(false)
      setCurrentPage(1)
    } catch (e2) {
      setError(e2?.message || 'Failed to load lesson plan')
    } finally {
      setLoading(false)
    }
  }

  const handleResetFilters = () => {
    if (isStudentScope) return
    setPendingFilters(emptyFilters)
    setFindErrors({})
    setHasSearched(false)
    setRows([])
    setSearch('')
    setCurrentPage(1)
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
              <ExportDropdown
                rows={filtered}
                columns={columnOptions}
                visibleColumns={visibleColumns}
                fileName="Lesson_Plan"
                sheetName="Lesson Plan"
                pdfTitle="Lesson Plan"
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
              {hasSearched && !isStudentScope ? (
                <button type="button" className="btn btn-sm btn-light border" onClick={handleResetFilters}>
                  Reset
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
                placeholder="Search lesson plan..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                disabled={!hasSearched}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
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
            <div className="px-20 py-40 text-center text-secondary-light">Loading...</div>
          ) : (
            <div className="table-responsive">
              <table className="table bordered-table mb-0 data-table">
                <thead>
                  <tr>
                    <th scope="col">
                      <div className="form-check style-check d-flex align-items-center">
                        <input type="checkbox" className="form-check-input" />
                        <label className="form-check-label">S.L</label>
                      </div>
                    </th>
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
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                        No rows found for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((r, idx) => (
                      <tr key={`${r.lessonId || 'l'}-${r.topicId || 't'}-${idx}`}>
                        <td>
                          <div className="form-check style-check d-flex align-items-center">
                            <input className="form-check-input" type="checkbox" />
                            <label className="form-check-label">
                              {(currentPage - 1) * rowsPerPage + idx + 1}
                            </label>
                          </div>
                        </td>
                        {visibleColumns.lessonName ? <td className="fw-medium text-primary-light">{r.lessonName || '-'}</td> : null}
                        {visibleColumns.lessonStartDate ? <td>{r.lessonStartDate || '-'}</td> : null}
                        {visibleColumns.lessonEndDate ? <td>{r.lessonEndDate || '-'}</td> : null}
                        {visibleColumns.topicName ? <td className="fw-medium text-primary-light">{r.topicName || '-'}</td> : null}
                        {visibleColumns.topicStartDate ? <td>{r.topicStartDate || '-'}</td> : null}
                        {visibleColumns.topicEndDate ? <td>{r.topicEndDate || '-'}</td> : null}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-20 py-16 border-top border-neutral-200">
            <TablePagination
              paginationProps={{
                currentPage,
                totalPages,
                pageInfo: `Showing ${filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, filtered.length)} of ${filtered.length} entries`,
                onPageChange: (next) => setCurrentPage(Math.min(Math.max(1, Number(next) || 1), totalPages)),
              }}
            />
          </div>
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
                {findErrors.headOfficeId && <div className="text-danger-600 text-sm mt-4">{findErrors.headOfficeId}</div>}
              </div>
            ) : null}

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
                {schoolOptions.map((s) => (
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
