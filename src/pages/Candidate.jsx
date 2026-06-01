import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/useAuth'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import ExportDropdown from '../components/ExportDropdown'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import '../assets/css/addModalShared.css'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchAcademicYears } from '../apis/academicYearsApi'
import {
  deleteCandidate,
  fetchCandidatesPage,
} from '../apis/candidatesApi'

const emptyFilters = {
  headOfficeId: 'Select',
  school: 'Select',
  academicYear: 'Select',
  classId: 'Select',
  sectionId: 'Select',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'academicYear', label: 'Academic Year' },
  { key: 'className', label: 'Class' },
  { key: 'sectionName', label: 'Section' },
  { key: 'studentName', label: 'Student' },
  { key: 'note', label: 'Note' },
]

const unwrapCollection = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.content)) return value.content
  return []
}

const schoolLabel = (row) => row?.schoolName || row?.name || ''
const classLabel = (row) => row?.className || row?.numericName || row?.name || row?.label || ''
const sectionLabel = (row) => row?.name || row?.sectionName || ''
const getSchoolById = (rows, schoolId) =>
  (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(schoolId ?? '')) || null

const Candidate = ({ onNavigate }) => {
  const {
    role,
    headOfficeId: authHeadOfficeId,
    schoolId: authSchoolId,
    canAdd,
    canEdit,
    canDelete,
  } = useAuth()
  const PAGE_SLUG = 'candidate'
  const normalizedRole = String(role || '').toUpperCase()
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = normalizedRole === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = normalizedRole === 'SCHOOL_ADMIN'
  const [rows, setRows] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [sectionsLookup, setSectionsLookup] = useState([])
  const [academicYearsLookup, setAcademicYearsLookup] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [selectedRows, setSelectedRows] = useState([])

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptionsFor = useCallback(
    (headOfficeId) =>
      [...schoolsLookup]
        .filter((school) => {
          if (isSchoolAdmin && authSchoolId != null) {
            return String(school?.id ?? '') === String(authSchoolId)
          }
          if (isHeadOfficeAdmin && authHeadOfficeId != null) {
            return String(school?.headOfficeId ?? '') === String(authHeadOfficeId)
          }
          return !headOfficeId || String(school?.headOfficeId ?? '') === String(headOfficeId)
        })
        .sort((a, b) => schoolLabel(a).localeCompare(schoolLabel(b))),
    [authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, schoolsLookup],
  )

  const fixedHeadOfficeId = !isSuperAdmin && authHeadOfficeId != null ? String(authHeadOfficeId) : ''
  const fixedSchoolId = isSchoolAdmin && authSchoolId != null ? String(authSchoolId) : ''
  const pendingHeadOfficeId = isSuperAdmin
    ? (pendingFilters.headOfficeId === 'Select' ? '' : pendingFilters.headOfficeId)
    : fixedHeadOfficeId
  const pendingSchoolId = isSuperAdmin
    ? (pendingFilters.school === 'Select' ? '' : pendingFilters.school)
    : fixedSchoolId || (pendingFilters.school === 'Select' ? '' : pendingFilters.school)

  const getDefaultFilters = useCallback(() => {
    if (isSuperAdmin) return { ...emptyFilters }
    return {
      headOfficeId: fixedHeadOfficeId || 'Select',
      school: fixedSchoolId || 'Select',
      academicYear: 'Select',
      classId: 'Select',
      sectionId: 'Select',
    }
  }, [fixedHeadOfficeId, fixedSchoolId, isSuperAdmin])

  const academicYearOptions = useMemo(
    () =>
      Array.from(
        new Set(
          academicYearsLookup
            .map((item) => String(item?.academicYear || '').trim())
            .filter(Boolean),
        ),
      ).sort().reverse(),
    [academicYearsLookup],
  )

  const pendingSchoolSet = useMemo(() => {
    const ids = new Set(
      schoolOptionsFor(pendingHeadOfficeId).map((school) => String(school?.id ?? '')),
    )
    return ids
  }, [pendingHeadOfficeId, schoolOptionsFor])

  const filterClassOptions = useMemo(() => {
    return classesLookup
      .filter((row) => {
        const rowSchoolId = String(row?.schoolId ?? '')
        if (pendingSchoolId) return rowSchoolId === String(pendingSchoolId)
        if (pendingHeadOfficeId) return pendingSchoolSet.has(rowSchoolId)
        return true
      })
      .slice()
      .sort((a, b) => classLabel(a).localeCompare(classLabel(b)))
  }, [classesLookup, pendingHeadOfficeId, pendingSchoolId, pendingSchoolSet])

  const filterSectionOptions = useMemo(() => {
    return sectionsLookup
      .filter((row) => {
        const rowSchoolId = String(row?.schoolId ?? '')
        if (pendingSchoolId && rowSchoolId !== String(pendingSchoolId)) return false
        if (pendingHeadOfficeId && !pendingSchoolSet.has(rowSchoolId)) return false
        if (pendingFilters.classId !== 'Select' && String(row?.classId) !== String(pendingFilters.classId)) {
          return false
        }
        return true
      })
      .slice()
      .sort((a, b) => sectionLabel(a).localeCompare(sectionLabel(b)))
  }, [sectionsLookup, pendingFilters.classId, pendingHeadOfficeId, pendingSchoolId, pendingSchoolSet])

  const formClassOptions = useCallback(
    (schoolId) =>
      classesLookup
        .filter((row) => !schoolId || String(row?.schoolId) === String(schoolId))
        .slice()
        .sort((a, b) => classLabel(a).localeCompare(classLabel(b))),
    [classesLookup],
  )

  const formSectionOptions = useCallback(
    (schoolId, classId) =>
      sectionsLookup
        .filter((row) => {
          if (schoolId && String(row?.schoolId) !== String(schoolId)) return false
          if (classId && String(row?.classId) !== String(classId)) return false
          return true
        })
        .slice()
        .sort((a, b) => sectionLabel(a).localeCompare(sectionLabel(b))),
    [sectionsLookup],
  )

  const loadLookups = useCallback(async () => {
    const [headOfficesResult, schoolsResult, classesResult, sectionsResult, academicYearsResult] = await Promise.allSettled([
      isSuperAdmin ? fetchHeadOfficesPage(0, 500) : Promise.resolve({ content: [] }),
      fetchSchoolsLookup(),
      fetchClasses(),
      fetchSections(),
      fetchAcademicYears(),
    ])

    setHeadOffices(
      isSuperAdmin
        ? unwrapCollection(headOfficesResult.status === 'fulfilled' ? headOfficesResult.value : [])
            .map((ho) => ({ id: ho?.id, name: ho?.name || ho?.headOfficeName || '' }))
            .filter((ho) => ho.id != null && ho.name)
            .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        : [],
    )
    setSchoolsLookup(unwrapCollection(schoolsResult.status === 'fulfilled' ? schoolsResult.value : []))
    setClassesLookup(unwrapCollection(classesResult.status === 'fulfilled' ? classesResult.value : []))
    setSectionsLookup(unwrapCollection(sectionsResult.status === 'fulfilled' ? sectionsResult.value : []))
    setAcademicYearsLookup(unwrapCollection(academicYearsResult.status === 'fulfilled' ? academicYearsResult.value : []))
  }, [isSuperAdmin])

  const loadCandidates = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const effectiveHeadOfficeId = isSuperAdmin
        ? (filters.headOfficeId !== 'Select' ? filters.headOfficeId : undefined)
        : fixedHeadOfficeId || undefined
      const effectiveSchoolId = isSuperAdmin
        ? (filters.school !== 'Select' ? filters.school : undefined)
        : fixedSchoolId || (filters.school !== 'Select' ? filters.school : undefined)
      const data = await fetchCandidatesPage(currentPage - 1, rowsPerPage, {
        headOfficeId: effectiveHeadOfficeId,
        schoolId: effectiveSchoolId,
        classId: filters.classId !== 'Select' ? filters.classId : undefined,
        sectionId: filters.sectionId !== 'Select' ? filters.sectionId : undefined,
        academicYear: filters.academicYear !== 'Select' ? filters.academicYear : undefined,
        search: search.trim(),
      })
      setRows(Array.isArray(data?.content) ? data.content : [])
      setTotalElements(Number.isFinite(data?.totalElements) ? Number(data.totalElements) : 0)
      setTotalPages(Math.max(1, Number.isFinite(data?.totalPages) ? Number(data.totalPages) : 1))
    } catch (e) {
      setRows([])
      setTotalElements(0)
      setTotalPages(1)
      setError(e?.message || 'Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }, [currentPage, filters.academicYear, filters.classId, filters.headOfficeId, filters.school, filters.sectionId, fixedHeadOfficeId, fixedSchoolId, isSuperAdmin, rowsPerPage, search])

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

  useEffect(() => {
    void loadCandidates()
  }, [loadCandidates, refreshKey])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    if (isSuperAdmin) return
    const defaults = getDefaultFilters()
    setPendingFilters(defaults)
    setFilters(defaults)
  }, [getDefaultFilters, isSuperAdmin])



  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...rows.map((row) => row.id)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !rows.some((row) => row.id === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    )
  }



  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => {
      if (id === 'headOfficeId') {
        return { ...prev, headOfficeId: value, school: 'Select', classId: 'Select', sectionId: 'Select' }
      }
      if (id === 'school') {
        return { ...prev, school: value, classId: 'Select', sectionId: 'Select' }
      }
      if (id === 'classId') {
        return { ...prev, classId: value, sectionId: 'Select' }
      }
      return { ...prev, [id]: value }
    })
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    const defaults = getDefaultFilters()
    setPendingFilters(defaults)
    setFilters(defaults)
    setCurrentPage(1)
  }

  const openAdd = () => {
    try {
      sessionStorage.removeItem('edit-candidate-row')
    } catch {}
    if (typeof onNavigate === 'function') {
      onNavigate('candidate-create')
    }
  }

  const openEdit = (row) => {
    try {
      sessionStorage.setItem('edit-candidate-row', JSON.stringify(row))
    } catch {}
    if (typeof onNavigate === 'function') {
      onNavigate('candidate-create')
    }
  }

  const handleDelete = async (id) => {
    if (!id) return
    if (!window.confirm('Delete this candidate? This cannot be undone.')) return
    setSaving(true)
    setError('')
    try {
      await deleteCandidate(id)
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id))
      setRefreshKey((k) => k + 1)
    } catch (e) {
      setError(e?.message || 'Failed to delete candidate')
    } finally {
      setSaving(false)
    }
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p += 1) pages.push(p)
    return pages
  }



  const allSelected = rows.length > 0 && rows.every((row) => selectedRows.includes(row.id))

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Candidate</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Candidate</span>
          </div>
        </div>
        {canAdd(PAGE_SLUG) && (
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={openAdd}
          >
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add Candidate
          </button>
        )}
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-8" role="alert">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

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
                onChange={(value) => {
                  setRowsPerPage(value)
                  setCurrentPage(1)
                }}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search candidates..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
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
                  {visibleColumns.schoolName ? <th scope="col">School</th> : null}
                  {visibleColumns.academicYear ? <th scope="col">Academic Year</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.sectionName ? <th scope="col">Section</th> : null}
                  {visibleColumns.studentName ? <th scope="col">Student</th> : null}
                  {visibleColumns.note ? <th scope="col">Note</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading candidates...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No candidates found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">
                            {(currentPage - 1) * rowsPerPage + idx + 1}
                          </label>
                        </div>
                      </td>
                      {visibleColumns.schoolName ? <td>{row.schoolName || '--'}</td> : null}
                      {visibleColumns.academicYear ? (
                        <td className="fw-medium text-primary-light">{row.academicYear || '--'}</td>
                      ) : null}
                      {visibleColumns.className ? <td>{row.className || '--'}</td> : null}
                      {visibleColumns.sectionName ? <td>{row.sectionName || '--'}</td> : null}
                      {visibleColumns.studentName ? (
                        <td className="fw-medium text-primary-light">{row.studentName || '--'}</td>
                      ) : null}
                      {visibleColumns.note ? (
                        <td>
                          {row.note ? (
                            <span
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                maxWidth: 220,
                                fontSize: '0.85rem',
                                color: '#5a6472',
                              }}
                            >
                              {row.note}
                            </span>
                          ) : (
                            <span className="text-secondary-light">--</span>
                          )}
                        </td>
                      ) : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          {canEdit(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                              onClick={() => openEdit(row)}
                              title="Edit"
                              disabled={saving}
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                          )}
                          {canDelete(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                              title="Delete"
                              onClick={() => handleDelete(row.id)}
                              disabled={saving}
                            >
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
              Showing {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)} of {totalElements} entries
            </span>
            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              {getVisiblePages().map((p) => (
                <button
                  key={p}
                  type="button"
                  className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Candidates"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            {isSuperAdmin ? (
              <ManualScopeSelectors
                enabled
                headOffices={headOffices}
                schoolOptions={schoolOptionsFor(pendingHeadOfficeId)}
                selectedHeadOfficeId={pendingHeadOfficeId}
                onHeadOfficeChange={(value) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    headOfficeId: value || 'Select',
                    school: 'Select',
                    classId: 'Select',
                    sectionId: 'Select',
                  }))
                }
                selectedSchoolId={pendingSchoolId}
                onSchoolChange={(value) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    school: value || 'Select',
                    classId: 'Select',
                    sectionId: 'Select',
                  }))
                }
                schoolLabel="School"
              />
            ) : (
              <ManualScopeSelectors
                enabled
                headOffices={[]}
                schoolOptions={schoolOptionsFor(fixedHeadOfficeId)}
                selectedSchoolId={pendingSchoolId}
                onSchoolChange={(value) =>
                  !isSchoolAdmin &&
                  setPendingFilters((prev) => ({
                    ...prev,
                    school: value || 'Select',
                    classId: 'Select',
                    sectionId: 'Select',
                  }))
                }
                schoolLabel="School"
                showHeadOfficeSelector={false}
                disabled={isSchoolAdmin}
              />
            )}
          </div>

          <div>
            <label htmlFor="academicYear" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Academic Year
            </label>
            <select
              id="academicYear"
              className="form-control form-select"
              value={pendingFilters.academicYear}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select</option>
              {academicYearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="classId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class
            </label>
            <select
              id="classId"
              className="form-control form-select"
              value={pendingFilters.classId}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select</option>
              {filterClassOptions.map((row) => (
                <option key={row.id} value={String(row.id)}>
                  {classLabel(row)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sectionId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Section
            </label>
            <select
              id="sectionId"
              className="form-control form-select"
              value={pendingFilters.sectionId}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select</option>
              {filterSectionOptions.map((row) => (
                <option key={row.id} value={String(row.id)}>
                  {sectionLabel(row)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
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
    </div>
  )
}

export default Candidate
