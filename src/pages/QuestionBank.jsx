import { useMemo, useState, useEffect } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import { fetchQuestionBanksPage, deleteQuestionBank } from '../apis/questionBankApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import RowsPerPageSelect from '../components/RowsPerPageSelect'

const EDIT_STORAGE_KEY = 'edit-question-bank-row'

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  className: 'Select',
  subject: 'Select',
  questionType: 'Select',
  questionLevel: 'Select',
  status: 'Select',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'className', label: 'Class' },
  { key: 'subject', label: 'Subject' },
  { key: 'questionType', label: 'Question Type' },
  { key: 'questionLevel', label: 'Question Level' },
  { key: 'question', label: 'Question' },
  { key: 'status', label: 'Status' },
]

const levelBadge = (level) => {
  if (level === 'Easy') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (level === 'Medium') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (level === 'Hard') return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
}

const typeBadge = (type) => {
  if (type === 'Single Answer') return 'bg-primary-100 text-primary-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (type === 'Multi Answer') return 'bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (type === 'Fill in Blank') return 'bg-violet-100 text-violet-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (type === 'TRUE/FALSE') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
}

const statusBadge = (status) => {
  if (status === 'Active') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (status === 'Inactive') return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
}

const QuestionBank = ({ onNavigate } = {}) => {
  const { status: authStatus, token, role: authRole, user, schoolId: authSchoolId, headOfficeId: authHeadOfficeId } = useAuth()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const navigateTo = typeof onNavigate === 'function' ? onNavigate : null
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [rows, setRows] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [schools, setSchools] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const getSchoolById = (schoolId) =>
    (Array.isArray(schools) ? schools : []).find((school) => String(school?.id ?? '') === String(schoolId ?? '')) || null

  useEffect(() => {
    if (authStatus === 'ready' && token) {
      Promise.all([
        fetchHeadOfficesPage(0, 500),
        fetchSchoolsLookup(),
      ])
        .then(([headOfficePage, schoolRows]) => {
          setHeadOffices(Array.isArray(headOfficePage?.content) ? headOfficePage.content : [])
          setSchools(Array.isArray(schoolRows) ? schoolRows : [])
        })
        .catch((err) => {
          console.error('Failed to load question bank lookups', err)
          setHeadOffices([])
          setSchools([])
        })
    }
  }, [authStatus, token])

  const filterSchoolId = useMemo(() => {
    if (pendingFilters.schoolId) return pendingFilters.schoolId
    if (isSchoolAdmin) return authSchoolId
    return undefined
  }, [authSchoolId, isSchoolAdmin, pendingFilters.schoolId])

  const filterSchoolOptions = useMemo(() => {
    const list = Array.isArray(schools) ? schools : []
    if (pendingFilters.headOfficeId) {
      return list.filter((school) => String(school?.headOfficeId ?? '') === String(pendingFilters.headOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return list.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return list.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return list
  }, [authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, pendingFilters.headOfficeId, schools])

  useEffect(() => {
    if (authStatus !== 'ready' || !token) return

    if (!filterSchoolId) {
      setClassesLookup([])
      return
    }

    let cancelled = false
    fetchClasses({ schoolId: filterSchoolId })
      .then((data) => {
        if (!cancelled) setClassesLookup(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setClassesLookup([])
      })

    return () => {
      cancelled = true
    }
  }, [authStatus, filterSchoolId, token])

  useEffect(() => {
    if (authStatus !== 'ready' || !token) return

    if (!filterSchoolId) {
      setSubjectsLookup([])
      return
    }

    let cancelled = false
    fetchSubjects({ schoolId: filterSchoolId })
      .then((data) => {
        if (!cancelled) setSubjectsLookup(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setSubjectsLookup([])
      })

    return () => {
      cancelled = true
    }
  }, [authStatus, filterSchoolId, token])

  const loadData = async () => {
    if (authStatus !== 'ready' || !token) return
    setBusy(true)
    setLoadError('')
    try {
      const pageData = await fetchQuestionBanksPage({
        headOfficeId: filters.headOfficeId || undefined,
        ...(filters.headOfficeId ? {} : isHeadOfficeAdmin ? { headOfficeId: authHeadOfficeId } : {}),
        schoolId: filters.schoolId || (isSchoolAdmin ? authSchoolId : undefined),
        classId: filters.className !== 'Select' ? classesLookup.find((c) => c.className === filters.className)?.id : undefined,
        subjectId: filters.subject !== 'Select' ? subjectsLookup.find((s) => s.subjectName === filters.subject || s.name === filters.subject)?.id : undefined,
        questionType: filters.questionType !== 'Select' ? filters.questionType : undefined,
        questionLevel: filters.questionLevel !== 'Select' ? filters.questionLevel : undefined,
        status: filters.status !== 'Select' ? filters.status : undefined,
        page: currentPage - 1,
        size: rowsPerPage,
        search: debouncedSearch,
      })
      setRows(Array.isArray(pageData?.content) ? pageData.content : [])
      setTotalElements(pageData?.totalElements || 0)
      setTotalPages(pageData?.totalPages || 0)
    } catch (err) {
      console.error('Failed to load questions:', err)
      setLoadError('Failed to load data.')
      setRows([])
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    loadData()
  }, [authStatus, token, currentPage, rowsPerPage, debouncedSearch, filters])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return
    try {
      await deleteQuestionBank(id)
      loadData()
    } catch (err) {
      console.error('Failed to delete:', err)
      alert('Failed to delete.')
    }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows(rows.map((r) => r.id))
    else setSelectedRows([])
  }

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) setSelectedRows(selectedRows.filter(rid => rid !== id))
    else setSelectedRows([...selectedRows, id])
  }

  const handleFilterHeadOfficeChange = (value) => {
    setPendingFilters((prev) => ({
      ...prev,
      headOfficeId: value,
      schoolId: '',
      className: 'Select',
      subject: 'Select',
    }))
  }

  const handleFilterSchoolChange = (value) => {
    const selectedSchool = getSchoolById(value)
    setPendingFilters((prev) => ({
      ...prev,
      schoolId: value,
      headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
      className: 'Select',
      subject: 'Select',
    }))
  }

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(value)
    setCurrentPage(1)
  }

  const openAdd = () => {
    try { sessionStorage.removeItem(EDIT_STORAGE_KEY) } catch {}
    if (navigateTo) navigateTo('add-question-bank')
  }

  const openEdit = (row) => {
    try { sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row)) } catch {}
    if (navigateTo) navigateTo('add-question-bank')
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    setIsFilterSidebarOpen(false)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setIsFilterSidebarOpen(false)
    setCurrentPage(1)
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Question Bank</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Question Bank</span>
          </div>
        </div>
        <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <span className="d-flex text-md"><i className="ri-add-large-line"></i></span>
          Add Question
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />
              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  {columnOptions.map((c) => (
                    <li key={c.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input type="checkbox" className="form-check-input mt-0" checked={visibleColumns[c.key]} onChange={() => toggleColumn(c.key)} />
                        {c.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
              <RowsPerPageSelect
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>
            <div className="position-relative">
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search questions..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light"><i className="ri-search-line"></i></span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 950 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input className="form-check-input" type="checkbox" checked={selectedRows.length === rows.length && rows.length > 0} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.subject ? <th scope="col">Subject</th> : null}
                  {visibleColumns.questionType ? <th scope="col">Question Type</th> : null}
                  {visibleColumns.questionLevel ? <th scope="col">Question Level</th> : null}
                  {visibleColumns.question ? <th scope="col">Question</th> : null}
                  {visibleColumns.status ? <th scope="col">Status</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {busy ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40"><div className="spinner-border text-primary"></div></td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">{loadError || 'No records found.'}</td></tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" checked={selectedRows.includes(row.id)} onChange={() => handleSelectRow(row.id)} />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + index + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.school ? <td>{row.schoolName}</td> : null}
                      {visibleColumns.className ? <td className="fw-medium text-primary-light">{row.className}</td> : null}
                      {visibleColumns.subject ? <td><span className="bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm">{row.subjectName}</span></td> : null}
                      {visibleColumns.questionType ? <td><span className={typeBadge(row.questionType)}>{row.questionType}</span></td> : null}
                      {visibleColumns.questionLevel ? <td><span className={levelBadge(row.questionLevel)}>{row.questionLevel}</span></td> : null}
                      {visibleColumns.question ? <td><span className="text-sm text-secondary-light text-truncate d-inline-block" style={{ maxWidth: 250 }}>{row.question}</span></td> : null}
                      {visibleColumns.status ? <td><span className={statusBadge(row.status)}>{row.status}</span></td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button type="button" className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" onClick={() => openEdit(row)} title="Edit"><i className="ri-edit-line"></i></button>
                          <button type="button" className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" onClick={() => handleDelete(row.id)} title="Delete"><i className="ri-delete-bin-line"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">Showing {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, totalElements)} of {totalElements}</span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              {getVisiblePages().map(p => <button key={p} type="button" className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'} onClick={() => setCurrentPage(p)}>{p}</button>)}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next</button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} title="Filter Question Bank">
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={(Array.isArray(manualScope.headOffices) && manualScope.headOffices.length > 0
                ? manualScope.headOffices
                : headOffices.map((ho) => ({ id: ho.id, name: ho.name || ho.headOfficeName || '' }))).filter((ho) => ho.id != null && ho.name)}
              schoolOptions={filterSchoolOptions.map((school) => ({ id: school.id, schoolName: school.schoolName || school.name || '' }))}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={handleFilterHeadOfficeChange}
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={handleFilterSchoolChange}
              schoolLabel="School"
            />
          ) : (
            <div className="avm-field full">
              <label className="avm-label" htmlFor="schoolId">School</label>
              <select
                id="schoolId"
                className="avm-select"
                value={pendingFilters.schoolId}
                onChange={(e) => handleFilterSchoolChange(e.target.value)}
              >
                <option value="">All Schools</option>
                {filterSchoolOptions.map((school) => (
                  <option key={String(school.id)} value={String(school.id)}>
                    {school.schoolName || school.name || String(school.id)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Class</label>
            <select
              className="form-control form-select"
              value={pendingFilters.className}
              onChange={(e) => setPendingFilters((p) => ({ ...p, className: e.target.value }))}
            >
              <option value="Select">Select Class</option>
              {classesLookup.map((c) => <option key={c.id} value={c.className}>{c.className || c.name || c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Subject</label>
            <select
              className="form-control form-select"
              value={pendingFilters.subject}
              onChange={(e) => setPendingFilters((p) => ({ ...p, subject: e.target.value }))}
            >
              <option value="Select">Select Subject</option>
              {subjectsLookup.map((s) => <option key={s.id} value={s.subjectName || s.name}>{s.subjectName || s.name}</option>)}
            </select>
          </div>
          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100 mt-8">Reset</button>
            <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default QuestionBank
