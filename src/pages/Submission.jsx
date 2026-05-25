import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import WizardPopup from '../components/WizardPopup'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { deleteSubmission, evaluateSubmission, fetchSubmissions, fetchSubmissionsForAssignment, fetchSubmissionsForStudent } from '../apis/submissionsApi'
import { fetchAssignments, fetchAssignmentsForStudent } from '../apis/assignmentsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchStudentsPage } from '../apis/studentsApi'
import { can } from '../utils/permissions'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import '../assets/css/addModalShared.css'
import RowsPerPageSelect from '../components/RowsPerPageSelect'

const EDIT_STORAGE_KEY = 'edit-submission-row'

const emptyFilters = {
  headOfficeId: 'Select',
  schoolId: 'Select',
  classId: 'Select',
  sectionId: 'Select',
  assignmentId: 'Select',
  studentId: 'Select',
  evaluate: 'Select',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'assignmentTitle', label: 'Assignment' },
  { key: 'className', label: 'Class' },
  { key: 'sectionName', label: 'Section' },
  { key: 'studentName', label: 'Student' },
  { key: 'submittedAt', label: 'Submitted At' },
  { key: 'evaluate', label: 'Evaluate' },
  { key: 'marks', label: 'Marks' },
]

const evaluateBadge = (value) => {
  const v = String(value || '').toLowerCase()
  if (v === 'accepted' || v === 'reviewed') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (v === 'pending') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
}

const Submission = ({ onNavigate }) => {
  const { user, role, schoolId: authSchoolId, schoolName: authSchoolName, studentId, parentChildren, selectedChildId, canAdd, canEdit, canDelete } = useAuth()
  const { activeSchoolId } = useSchool()

  const canSubmit = can(user, ['ASSIGNMENT_SUBMIT', '*'])
  const canEvaluate = can(user, ['SUBMISSION_MANAGE', 'SUBMISSION_EVALUATE_ASSIGNED', '*'])
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : () => {}

  const roleUpper = String(role || '').toUpperCase()
  const isStudent = roleUpper === 'STUDENT'
  const isParent = roleUpper === 'PARENT'

  const selectedChild = useMemo(() => {
    if (!isParent || !selectedChildId) return null
    return (parentChildren || []).find(c => String(c.studentId || c.id) === String(selectedChildId))
  }, [isParent, parentChildren, selectedChildId])

  const fixedStudentId = isStudent ? studentId : isParent ? (selectedChild?.studentId || selectedChild?.id) : null
  const resolvedSchoolId = activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''

  const [submissions, setSubmissions] = useState([])
  const [schools, setSchools] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [assignments, setAssignments] = useState([])
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

  const [isEvalOpen, setIsEvalOpen] = useState(false)
  const [evalRow, setEvalRow] = useState(null)
  const [evalForm, setEvalForm] = useState({ marks: '', feedback: '' })

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      let subs = []
      if (fixedStudentId) {
        subs = await fetchSubmissionsForStudent(fixedStudentId)
      } else if (resolvedSchoolId) {
        subs = await fetchSubmissions({ schoolId: resolvedSchoolId })
      } else {
        subs = await fetchSubmissions()
      }
      
      const [schoolsData, classesData, sectionsData, asgsData] = await Promise.all([
        fetchSchoolsLookup().catch(() => []),
        fetchClasses().catch(() => []),
        fetchSections().catch(() => []),
        fetchAssignments().catch(() => []),
      ])

      setSubmissions(Array.isArray(subs) ? subs : [])
      setSchools(Array.isArray(schoolsData) ? schoolsData : [])
      setClasses(Array.isArray(classesData) ? classesData : [])
      setSections(Array.isArray(sectionsData) ? sectionsData : [])
      setAssignments(Array.isArray(asgsData) ? asgsData : [])
    } catch (e) {
      setSubmissions([])
      setError(e?.message || 'Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [fixedStudentId, resolvedSchoolId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    void fetchHeadOfficesPage(0, 500)
      .then((page) => setHeadOffices(Array.isArray(page?.content) ? page.content : []))
      .catch(() => setHeadOffices([]))
  }, [])

  const nameMaps = useMemo(() => {
    const schoolMap = new Map(schools.map(s => [String(s.id), s.schoolName || s.name]))
    const classMap = new Map(classes.map(c => [String(c.id), c.className]))
    const sectionMap = new Map(sections.map(s => [String(s.id), s.sectionName]))
    const asgMap = new Map(assignments.map(a => [String(a.id), a.title]))
    return { schoolMap, classMap, sectionMap, asgMap }
  }, [schools, classes, sections, assignments])

  const displayRows = useMemo(() => {
    return submissions.map(r => ({
      ...r,
      schoolName: r.schoolName || nameMaps.schoolMap.get(String(r.schoolId)) || r.schoolId,
      className: r.className || nameMaps.classMap.get(String(r.classId)) || r.classId,
      sectionName: r.sectionName || nameMaps.sectionMap.get(String(r.sectionId)) || r.sectionId,
      assignmentTitle: r.assignmentTitle || nameMaps.asgMap.get(String(r.assignmentId)) || r.assignmentId,
    }))
  }, [submissions, nameMaps])

  const schoolOptions = useMemo(() => {
    const filtered = pendingFilters.headOfficeId && pendingFilters.headOfficeId !== 'Select'
      ? schools.filter((school) => String(school?.headOfficeId ?? '') === String(pendingFilters.headOfficeId))
      : schools
    return filtered
      .map((row) => ({ id: row?.id, schoolName: row?.schoolName || row?.name || '' }))
      .filter((row) => row.id != null && row.schoolName)
      .sort((a, b) => String(a.schoolName).localeCompare(String(b.schoolName)))
  }, [schools, pendingFilters.headOfficeId])

  const headOfficeOptions = useMemo(() => {
    return (Array.isArray(headOffices) ? headOffices : [])
      .map((row) => ({ id: row?.id, name: row?.name || row?.headOfficeName || '' }))
      .filter((row) => row.id != null && row.name)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [headOffices])

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault()
    setFilters(pendingFilters)
    setIsFilterSidebarOpen(false)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return displayRows.filter((r) => {
      const matchesSearch = !q || [
        r?.schoolName, r?.assignmentTitle, r?.className, r?.sectionName, r?.studentName, r?.evaluate, r?.marks
      ].filter(Boolean).join(' ').toLowerCase().includes(q)

      const matchesSchool = filters.schoolId === 'Select' || String(r?.schoolId) === String(filters.schoolId)
      const matchesEvaluate = filters.evaluate === 'Select' || String(r?.evaluate || 'Pending') === filters.evaluate

      return matchesSearch && matchesSchool && matchesEvaluate
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
    navigateTo('add-submission')
  }

  const openEdit = (row) => {
    sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row))
    navigateTo('add-submission')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this submission?')) return
    setSaving(true)
    try {
      await deleteSubmission(id)
      loadData()
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const openEvaluate = (row) => {
    setEvalRow(row)
    setEvalForm({ marks: row.marks || '', feedback: row.feedback || '' })
    setIsEvalOpen(true)
  }

  const saveEvaluate = async () => {
    if (!evalRow) return
    setSaving(true)
    try {
      await evaluateSubmission(evalRow.id, {
        marks: Number(evalForm.marks),
        feedback: evalForm.feedback
      })
      setIsEvalOpen(false)
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Submission</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0" onClick={() => navigateTo('dashboard')}>Dashboard</button>
            <span className="text-secondary-light"> / Submission</span>
          </div>
        </div>
        {canSubmit && canAdd('submission') && (
          <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <i className="ri-add-large-line text-md"></i> Submit Assignment
          </button>
        )}
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm"><i className="ri-file-upload-line text-md line-height-1"></i> Export</span>
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
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search submission..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} />
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
                  {visibleColumns.assignmentTitle && <th>Assignment</th>}
                  {visibleColumns.className && <th>Class</th>}
                  {visibleColumns.sectionName && <th>Section</th>}
                  {visibleColumns.studentName && <th>Student</th>}
                  {visibleColumns.submittedAt && <th>Submitted At</th>}
                  {visibleColumns.evaluate && <th>Evaluate</th>}
                  {visibleColumns.marks && <th>Marks</th>}
                  <th style={{ width: 140 }}>Action</th>
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
                      {visibleColumns.assignmentTitle && <td className="fw-medium text-primary-light">{r.assignmentTitle}</td>}
                      {visibleColumns.className && <td>{r.className}</td>}
                      {visibleColumns.sectionName && <td>{r.sectionName}</td>}
                      {visibleColumns.studentName && <td>{r.studentName}</td>}
                      {visibleColumns.submittedAt && <td>{r.submittedAt ? String(r.submittedAt).replace('T', ' ') : '-'}</td>}
                      {visibleColumns.evaluate && (
                        <td>
                          <span className={evaluateBadge(r.evaluate)}>
                            {r.evaluate || 'Pending'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.marks && <td>{r.marks ?? '-'}</td>}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          {r.fileUrl && (
                             <a href={r.fileUrl} target="_blank" rel="noreferrer" className="bg-primary-focus text-primary-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0" title="View File">
                               <i className="ri-eye-line"></i>
                             </a>
                          )}
                          {canEdit('submission') && isStudent && String(r.studentId) === String(studentId) && (
                            <button type="button" className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0" onClick={() => openEdit(r)} title="Edit">
                              <i className="ri-edit-line"></i>
                            </button>
                          )}
                          {canEvaluate && (
                            <button type="button" className="bg-success-focus bg-hover-success-200 text-success-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0" onClick={() => openEvaluate(r)} title="Evaluate">
                              <i className="ri-check-line"></i>
                            </button>
                          )}
                          {canDelete('submission') && (
                            <button type="button" className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0" onClick={() => handleDelete(r.id)} title="Delete">
                              <i className="ri-delete-bin-line"></i>
                            </button>
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

      <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter Submission" onClose={() => setIsFilterSidebarOpen(false)}>
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          <ManualScopeSelectors
            enabled
            headOffices={headOfficeOptions}
            schoolOptions={schoolOptions}
            selectedHeadOfficeId={pendingFilters.headOfficeId}
            onHeadOfficeChange={(value) => setPendingFilters((p) => ({ ...p, headOfficeId: value, schoolId: 'Select' }))}
            selectedSchoolId={pendingFilters.schoolId === 'Select' ? '' : pendingFilters.schoolId}
            onSchoolChange={(value) => setPendingFilters((p) => ({ ...p, schoolId: value || 'Select' }))}
          />
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Evaluate Status</label>
            <select className="form-control form-select" value={pendingFilters.evaluate} onChange={(e) => setPendingFilters(p => ({ ...p, evaluate: e.target.value }))}>
              <option value="Select">All</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Reviewed">Reviewed</option>
            </select>
          </div>
          <div className="d-flex gap-8 mt-12">
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">Reset</button>
            <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
          </div>
        </form>
      </SlideSidebar>

      <WizardPopup title="Evaluate Submission" isOpen={isEvalOpen} onClose={() => setIsEvalOpen(false)} steps={['Evaluate']} currentStep={0} setCurrentStep={() => {}} onSave={saveEvaluate} saving={saving}>
        <div className="row g-20">
           <div className="col-12">
             <label className="form-label fw-semibold text-primary-light">Submission Context</label>
             <div className="p-16 radius-8 border bg-neutral-50">
               <div className="fw-semibold text-primary-light mb-4">{evalRow?.assignmentTitle}</div>
               <div className="text-secondary-light text-sm">
                 {evalRow?.schoolName} • {evalRow?.className} • {evalRow?.sectionName} • {evalRow?.studentName}
               </div>
             </div>
           </div>
           
           <div className="col-12">
             <label className="form-label fw-semibold text-primary-light">Marks</label>
             <div className="position-relative">
               <input type="number" className="form-control ps-40" value={evalForm.marks} onChange={(e) => setEvalForm(p => ({ ...p, marks: e.target.value }))} placeholder="Enter marks" />
               <i className="ri-number-7 position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light"></i>
             </div>
           </div>

           <div className="col-12">
             <label className="form-label fw-semibold text-primary-light">Feedback</label>
             <textarea className="form-control" rows={4} value={evalForm.feedback} onChange={(e) => setEvalForm(p => ({ ...p, feedback: e.target.value }))} placeholder="Enter feedback"></textarea>
           </div>
        </div>
      </WizardPopup>
    </div>
  )
}

export default Submission
