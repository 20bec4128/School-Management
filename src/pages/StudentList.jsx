import { useMemo, useState, useEffect, useCallback } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { TablePagination } from '../components/table'
import { fetchStudentsPage, deleteStudent } from '../apis/studentsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const emptyFilters = {
  headOfficeId: '',
  schoolId: 'All',
  className: 'Select',
  section: 'Select',
  group: 'Select',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'photo', label: 'Photo' },
  { key: 'name', label: 'Name' },
  { key: 'group', label: 'Group' },
  { key: 'className', label: 'Class' },
  { key: 'section', label: 'Section' },
  { key: 'rollNo', label: 'Roll No' },
  { key: 'email', label: 'Email' },
]

const StudentList = ({ onNavigate }) => {
  const {
    role,
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
  } = useAuth()
  const { activeSchoolId } = useSchool()
  
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [refreshKey, setRefreshKey] = useState(0)
  const [schoolList, setSchoolList] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [classOptions, setClassOptions] = useState([])
  const [sectionOptions, setSectionOptions] = useState([])

  const scopedSchoolId = activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const isHeadOfficeScoped = String(role || '').toUpperCase() === 'HEAD_OFFICE_ADMIN'
  const isSchoolScoped = String(role || '').toUpperCase() === 'SCHOOL_ADMIN'
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const selectedSchoolIdForLookups = useMemo(() => {
    if (isSchoolScoped && scopedSchoolId) return scopedSchoolId
    if (pendingFilters.schoolId && pendingFilters.schoolId !== 'All') return pendingFilters.schoolId
    return ''
  }, [isSchoolScoped, scopedSchoolId, pendingFilters.schoolId])

  const selectedClassLookup = useMemo(() => {
    const target = String(pendingFilters.className || '')
    if (!target || target === 'Select') return null
    return Array.isArray(classOptions)
      ? classOptions.find((item) =>
          String(item?.className || item?.numericName || item?.name || '') === target,
        ) || null
      : null
  }, [classOptions, pendingFilters.className])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const effectiveHeadOfficeId = isSchoolScoped
        ? undefined
        : isHeadOfficeScoped && authHeadOfficeId != null
          ? String(authHeadOfficeId)
          : filters.headOfficeId !== 'All' && filters.headOfficeId !== ''
            ? filters.headOfficeId
            : undefined
      const effectiveSchoolId = isSchoolScoped && scopedSchoolId
        ? scopedSchoolId
        : filters.schoolId && filters.schoolId !== 'Select' && filters.schoolId !== 'All'
          ? filters.schoolId
          : undefined
      const res = await fetchStudentsPage(currentPage - 1, rowsPerPage, {
        headOfficeId: effectiveHeadOfficeId,
        schoolId: effectiveSchoolId,
        className: filters.className !== 'Select' ? filters.className : undefined,
        section: filters.section !== 'Select' ? filters.section : undefined,
        group: filters.group !== 'Select' ? filters.group : undefined,
        q: search.trim() || undefined,
      })
      setStudents(res.content || [])
      setTotalPages(res.totalPages || 1)
      setTotalElements(res.totalElements || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [currentPage, rowsPerPage, filters, search, scopedSchoolId, authHeadOfficeId, isHeadOfficeScoped, isSchoolScoped])

  useEffect(() => {
    void loadData()
  }, [loadData, refreshKey])

  useEffect(() => {
    fetchSchoolsLookup().then(setSchoolList).catch(() => {})
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    setSelectedRows([])
  }, [scopedSchoolId])

  useEffect(() => {
    void fetchHeadOfficesPage(0, 500)
      .then((page) => setHeadOffices(Array.isArray(page?.content) ? page.content : []))
      .catch(() => setHeadOffices([]))
  }, [])

  useEffect(() => {
    if (!selectedSchoolIdForLookups) {
      setClassOptions([])
      setSectionOptions([])
      return
    }

    let cancelled = false
    void fetchClasses({ schoolId: selectedSchoolIdForLookups })
      .then((rows) => {
        if (cancelled) return
        setClassOptions(Array.isArray(rows) ? rows : [])
      })
      .catch(() => {
        if (cancelled) return
        setClassOptions([])
      })

    return () => {
      cancelled = true
    }
  }, [selectedSchoolIdForLookups])

  useEffect(() => {
    if (!selectedSchoolIdForLookups || !selectedClassLookup?.id) {
      setSectionOptions([])
      return
    }

    let cancelled = false
    void fetchSections({
      schoolId: selectedSchoolIdForLookups,
      classId: selectedClassLookup.id,
    })
      .then((rows) => {
        if (cancelled) return
        setSectionOptions(Array.isArray(rows) ? rows : [])
      })
      .catch(() => {
        if (cancelled) return
        setSectionOptions([])
      })

    return () => {
      cancelled = true
    }
  }, [selectedClassLookup, selectedSchoolIdForLookups])

  useEffect(() => {
    if (pendingFilters.section === 'Select') return
    const exists = sectionOptions.some((item) =>
      String(item?.sectionName || item?.name || '').trim() === String(pendingFilters.section).trim(),
    )
    if (!exists && sectionOptions.length > 0) {
      setPendingFilters((prev) => ({ ...prev, section: 'Select' }))
      setFilters((prev) => ({ ...prev, section: 'Select' }))
    }
  }, [pendingFilters.section, sectionOptions])

  const schoolOptions = useMemo(() => {
    const list = Array.isArray(schoolList) ? schoolList.slice() : []
    const filtered = pendingFilters.headOfficeId
      ? list.filter((s) => String(s?.headOfficeId ?? '') === String(pendingFilters.headOfficeId))
      : isHeadOfficeScoped && authHeadOfficeId != null
        ? list.filter((s) => String(s?.headOfficeId ?? '') === String(authHeadOfficeId))
        : isSchoolScoped && scopedSchoolId
          ? list.filter((s) => String(s?.id ?? '') === String(scopedSchoolId))
          : list
    return filtered.sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
  }, [schoolList, pendingFilters.headOfficeId, isHeadOfficeScoped, authHeadOfficeId, isSchoolScoped, scopedSchoolId])

  const headOfficeOptions = useMemo(() => {
    const normalized = (Array.isArray(headOffices) ? headOffices : [])
      .map((row) => ({ id: row?.id, name: row?.name || row?.headOfficeName || '' }))
      .filter((row) => row.id != null && row.name)
    if (isHeadOfficeScoped && authHeadOfficeId != null && authHeadOfficeName) {
      const exists = normalized.some((row) => String(row.id) === String(authHeadOfficeId))
      if (!exists) normalized.unshift({ id: authHeadOfficeId, name: authHeadOfficeName })
    }
    return normalized.sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [authHeadOfficeId, authHeadOfficeName, headOffices, isHeadOfficeScoped])

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return students
    return students.filter((row) =>
      [row.schoolName, row.name, row.group, row.className, row.section, row.rollNo, row.email]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [search, students])

  const allSelected = displayed.length > 0 && displayed.every((row) => selectedRows.includes(row.id))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...displayed.map((row) => row.id)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !displayed.some((row) => row.id === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    )
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    const reset = isSuperAdmin
      ? { ...emptyFilters }
      : {
          headOfficeId: isHeadOfficeScoped && authHeadOfficeId != null ? String(authHeadOfficeId) : '',
          schoolId: isSchoolScoped && scopedSchoolId ? String(scopedSchoolId) : 'All',
          className: 'Select',
          section: 'Select',
          group: 'Select',
        }
    setPendingFilters(reset)
    setFilters(reset)
    setCurrentPage(1)
  }

  useEffect(() => {
    if (isSuperAdmin) return
    const nextFilters = {
      headOfficeId: isHeadOfficeScoped && authHeadOfficeId != null ? String(authHeadOfficeId) : '',
      schoolId: isSchoolScoped && scopedSchoolId ? String(scopedSchoolId) : 'All',
      className: 'Select',
      section: 'Select',
      group: 'Select',
    }
    setPendingFilters(nextFilters)
    setFilters(nextFilters)
  }, [authHeadOfficeId, isHeadOfficeScoped, isSchoolScoped, isSuperAdmin, scopedSchoolId])

  useEffect(() => {
    const hasSelectedClass = selectedClassLookup != null
    if (pendingFilters.className === 'Select') return
    if (classOptions.length > 0 && !hasSelectedClass) {
      setPendingFilters((prev) => ({ ...prev, className: 'Select', section: 'Select' }))
      setFilters((prev) => ({ ...prev, className: 'Select', section: 'Select' }))
    }
  }, [classOptions.length, pendingFilters.className, selectedClassLookup])

  const openAdd = () => {
    sessionStorage.removeItem('edit-student-row')
    onNavigate('add-student')
  }

  const openEdit = (row) => {
    sessionStorage.setItem('edit-student-row', JSON.stringify(row))
    onNavigate('add-student')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return
    try {
      await deleteStudent(id)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Student List</h1>
          <span className="text-secondary-light">Student / Student List</span>
        </div>
        <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <i className="ri-add-large-line"></i> Add Student
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
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
                  {columnOptions.map((col) => (
                    <li key={col.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={visibleColumns[col.key]}
                          onChange={() => toggleColumn(col.key)}
                        />
                        {col.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                  Filter
                </span>
                <span>
                  <i className="ri-arrow-right-line"></i>
                </span>
              </button>

              <RowsPerPageSelect
                value={rowsPerPage}
                onChange={(v) => { setRowsPerPage(v); setCurrentPage(1) }}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search student..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ width: 80 }}>
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.photo ? <th scope="col">Photo</th> : null}
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.group ? <th scope="col">Group</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.section ? <th scope="col">Section</th> : null}
                  {visibleColumns.rollNo ? <th scope="col" style={{ width: 100 }}>Roll No</th> : null}
                  {visibleColumns.email ? <th scope="col">Email</th> : null}
                  <th scope="col" style={{ width: 100 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">Loading...</td></tr>
                ) : displayed.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">No records found.</td></tr>
                ) : (
                  displayed.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.school ? <td>{row.schoolName || '-'}</td> : null}
                      {visibleColumns.photo ? (
                        <td>
                          <div className="w-40-px h-40-px rounded-circle bg-neutral-100 d-flex align-items-center justify-content-center overflow-hidden">
                            {row.photoUrl ? (
                              <img src={row.photoUrl} alt="student" className="w-100 h-100 object-fit-cover" />
                            ) : (
                              <i className="ri-user-line text-secondary-light text-xl"></i>
                            )}
                          </div>
                        </td>
                      ) : null}
                      {visibleColumns.name ? <td className="fw-medium text-primary-light">{row.name || '-'}</td> : null}
                      {visibleColumns.group ? <td>{row.group || '-'}</td> : null}
                      {visibleColumns.className ? <td>{row.className || '-'}</td> : null}
                      {visibleColumns.section ? <td>{row.section || '-'}</td> : null}
                      {visibleColumns.rollNo ? <td>{row.rollNo || '-'}</td> : null}
                      {visibleColumns.email ? <td>{row.email || '-'}</td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            onClick={() => openEdit(row)}
                            title="Edit"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            onClick={() => handleDelete(row.id)}
                            title="Delete"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            className="px-20 py-16 border-top border-neutral-200"
            paginationProps={{
              currentPage,
              totalPages,
              setCurrentPage,
              rowsPerPage,
              pageInfo: `Showing ${totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, totalElements)} of ${totalElements} entries`,
            }}
          />
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Students"
        onClose={() => setIsFilterSidebarOpen(false)}
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
              <ManualScopeSelectors
                enabled
                headOffices={headOfficeOptions}
                schoolOptions={schoolOptions}
                selectedHeadOfficeId={pendingFilters.headOfficeId}
                onHeadOfficeChange={(value) => {
                setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: 'All', className: 'Select', section: 'Select' }))
                }}
                selectedSchoolId={pendingFilters.schoolId === 'All' ? '' : pendingFilters.schoolId}
              onSchoolChange={(value) => setPendingFilters((prev) => ({ ...prev, schoolId: value || 'All', className: 'Select', section: 'Select' }))}
            />
          ) : (
            <>
              {isHeadOfficeScoped ? (
                <div>
                  <label className="text-sm fw-semibold text-primary-light mb-8">Head Office</label>
                  <input className="form-control" value={authHeadOfficeName || ''} readOnly />
                </div>
              ) : null}
              {isSchoolScoped ? (
                <div>
                  <label className="text-sm fw-semibold text-primary-light mb-8">School</label>
                  <input className="form-control" value={authSchoolName || schoolOptions[0]?.schoolName || ''} readOnly />
                </div>
              ) : (
                <div>
                  <label className="text-sm fw-semibold text-primary-light mb-8">School</label>
                  <select
                    id="schoolId"
                    className="form-control form-select"
                    value={pendingFilters.schoolId}
                    onChange={(e) => setPendingFilters((prev) => ({ ...prev, schoolId: e.target.value, className: 'Select', section: 'Select' }))}
                  >
                    <option value="All">All Schools</option>
                    {schoolOptions.map((s) => (
                      <option key={s.id} value={String(s.id)}>{s.schoolName || s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm fw-semibold text-primary-light mb-8">Class</label>
                <select
                  id="className"
                  className="form-control form-select"
                  value={pendingFilters.className}
                  onChange={(e) =>
                    setPendingFilters((prev) => ({
                      ...prev,
                      className: e.target.value,
                      section: 'Select',
                    }))
                  }
                  disabled={!selectedSchoolIdForLookups}
                >
                  <option value="Select">Select</option>
                  {classOptions.map((item) => {
                    const label = item?.className || item?.numericName || item?.name || String(item?.id || '')
                    return (
                      <option key={String(item?.id ?? label)} value={label}>
                        {label}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="text-sm fw-semibold text-primary-light mb-8">Section</label>
                <select
                  id="section"
                  className="form-control form-select"
                  value={pendingFilters.section}
                  onChange={handlePendingFilterChange}
                  disabled={!selectedSchoolIdForLookups || pendingFilters.className === 'Select'}
                >
                  <option value="Select">Select</option>
                  {sectionOptions.map((item) => {
                    const label = item?.sectionName || item?.name || String(item?.id || '')
                    return (
                      <option key={String(item?.id ?? label)} value={label}>
                        {label}
                      </option>
                    )
                  })}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Group</label>
            <select id="group" className="form-control form-select" value={pendingFilters.group} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              <option>Science</option><option>Commerce</option><option>Arts</option>
            </select>
          </div>

          <div className="d-flex gap-8 mt-12">
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">Reset</button>
            <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default StudentList
