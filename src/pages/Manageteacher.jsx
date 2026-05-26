import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { deleteTeacher, fetchTeachers } from '../apis/teachersApi'
import { fetchAllDepartments } from '../apis/departmentsApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import { TablePagination } from '../components/table'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const emptyFilters = {
  headOfficeId: 'Select',
  name: '',
  department: 'All',
  email: '',
  joiningDate: '',
  isViewOnWeb: 'All',
  schoolId: 'Select',
}

const columnOptions = [
  { key: 'photo', label: 'Photo' },
  { key: 'name', label: 'Name' },
  { key: 'designation', label: 'Designation' },
  { key: 'department', label: 'Department' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'joiningDate', label: 'Joining Date' },
  { key: 'isViewOnWeb', label: 'Is View on Web?' },
  { key: 'displayOrder', label: 'Display Order' },
]

const ManageTeacher = ({ onNavigate }) => {
  const { role, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName, canAdd, canEdit, canDelete } = useAuth()
  const PAGE_SLUG = 'manage-teacher'
  const { activeSchoolId } = useSchool()
  const [teachers, setTeachers] = useState([])
  const [departments, setDepartments] = useState([])
  const [schools, setSchools] = useState([])
  const [headOffices, setHeadOffices] = useState([])
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
  const [hasSearched, setHasSearched] = useState(true)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)
  const roleUpper = String(role || '').toUpperCase()
  const isSuperAdmin = roleUpper === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = roleUpper === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = roleUpper === 'SCHOOL_ADMIN'
  const resolvedSchoolId = activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''

  const schoolsById = useMemo(() => {
    const map = new Map()
    for (const school of Array.isArray(schools) ? schools : []) {
      if (school?.id == null) continue
      map.set(String(school.id), school)
    }
    return map
  }, [schools])

  const headOfficeOptions = useMemo(() => {
    const list = (Array.isArray(headOffices) ? headOffices : [])
      .map((row) => ({ id: row?.id, name: row?.name || row?.headOfficeName || '' }))
      .filter((row) => row.id != null && row.name)
    if (isHeadOfficeAdmin && authHeadOfficeId != null && authHeadOfficeName) {
      const exists = list.some((row) => String(row.id) === String(authHeadOfficeId))
      if (!exists) list.unshift({ id: authHeadOfficeId, name: authHeadOfficeName })
    }
    return list.sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [authHeadOfficeId, authHeadOfficeName, headOffices, isHeadOfficeAdmin])

  const selectedSchoolHeadOfficeId = useMemo(() => {
    if (filters.schoolId && filters.schoolId !== 'Select') {
      return String(schoolsById.get(String(filters.schoolId))?.headOfficeId ?? '')
    }
    return ''
  }, [filters.schoolId, schoolsById])

  const filterSchoolOptions = useMemo(() => {
    const list = Array.isArray(schools) ? schools.slice() : []
    const selectedHeadOfficeId =
      filters.headOfficeId && filters.headOfficeId !== 'Select'
        ? String(filters.headOfficeId)
        : isHeadOfficeAdmin && authHeadOfficeId != null
          ? String(authHeadOfficeId)
          : ''
    const filtered = selectedHeadOfficeId
      ? list.filter((school) => String(school?.headOfficeId ?? '') === selectedHeadOfficeId)
      : isSchoolAdmin && resolvedSchoolId
        ? list.filter((school) => String(school?.id ?? '') === String(resolvedSchoolId))
        : list
    return filtered
      .map((row) => ({ id: row?.id, schoolName: row?.schoolName || row?.name || '' }))
      .filter((row) => row.id != null && row.schoolName)
      .sort((a, b) => String(a.schoolName).localeCompare(String(b.schoolName)))
  }, [authHeadOfficeId, filters.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin, resolvedSchoolId, schools])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [teacherData, deptResult, schoolResult] = await Promise.allSettled([
        fetchTeachers(resolvedSchoolId ? { schoolId: resolvedSchoolId } : {}),
        fetchAllDepartments(),
        fetchSchoolsLookup(),
      ])

      if (teacherData.status === 'rejected') throw teacherData.reason
      
      setTeachers(Array.isArray(teacherData.value) ? teacherData.value : [])
      setDepartments(deptResult.status === 'fulfilled' && Array.isArray(deptResult.value) ? deptResult.value : [])
      setSchools(schoolResult.status === 'fulfilled' && Array.isArray(schoolResult.value) ? schoolResult.value : [])
    } catch (e) {
      setTeachers([])
      setError(e?.message || 'Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }, [resolvedSchoolId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    let ignore = false
    const run = async () => {
      try {
        const page = await fetchHeadOfficesPage(0, 500)
        if (!ignore) setHeadOffices(Array.isArray(page?.content) ? page.content : [])
      } catch {
        if (!ignore) setHeadOffices([])
      }
    }
    void run()
    return () => {
      ignore = true
    }
  }, [])

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault()
    setFilters(pendingFilters)
    setHasSearched(true)
    setIsFilterSidebarOpen(false)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
  }

  const handleScopeChange = (field, value) => {
    setPendingFilters((current) => {
      if (field === 'headOfficeId') {
        return { ...current, headOfficeId: value || 'Select', schoolId: 'Select' }
      }
      if (field === 'schoolId') {
        return { ...current, schoolId: value || 'Select' }
      }
      return current
    })
  }

  useEffect(() => {
    setPendingFilters((prev) => {
      if (isSuperAdmin) return prev
      const next = {
        ...prev,
        headOfficeId: isHeadOfficeAdmin && authHeadOfficeId != null ? String(authHeadOfficeId) : 'Select',
        schoolId: isSchoolAdmin && resolvedSchoolId ? String(resolvedSchoolId) : 'Select',
      }
      return next
    })
    setFilters((prev) => {
      if (isSuperAdmin) return prev
      return {
        ...prev,
        headOfficeId: isHeadOfficeAdmin && authHeadOfficeId != null ? String(authHeadOfficeId) : 'Select',
        schoolId: isSchoolAdmin && resolvedSchoolId ? String(resolvedSchoolId) : 'Select',
      }
    })
  }, [authHeadOfficeId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, resolvedSchoolId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return teachers.filter((r) => {
      const teacherSchool = r?.schoolId != null ? schoolsById.get(String(r.schoolId)) : null
      const teacherHeadOfficeId = String(r?.headOfficeId ?? r?.headOffice?.id ?? teacherSchool?.headOfficeId ?? '')
      const matchesSearch = !q || [r?.name, r?.designationName, r?.department, r?.phone, r?.email]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
      
      const matchesName = !filters.name || String(r?.name || '').toLowerCase().includes(filters.name.toLowerCase())
      const matchesDepartment = filters.department === 'All' || r?.department === filters.department
      const matchesEmail = !filters.email || String(r?.email || '').toLowerCase().includes(filters.email.toLowerCase())
      const matchesJoiningDate = !filters.joiningDate || r?.joiningDate === filters.joiningDate
      const matchesViewOnWeb = filters.isViewOnWeb === 'All' || (filters.isViewOnWeb === 'Yes' ? r?.isViewOnWeb === 'Yes' : r?.isViewOnWeb === 'No')
      const matchesHeadOffice = filters.headOfficeId === 'Select' || teacherHeadOfficeId === String(filters.headOfficeId)
      const matchesSchool = filters.schoolId === 'Select' || String(r?.schoolId) === String(filters.schoolId)

      return matchesSearch && matchesName && matchesDepartment && matchesEmail && matchesJoiningDate && matchesViewOnWeb && matchesHeadOffice && matchesSchool
    })
  }, [schoolsById, teachers, filters, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((r) => selectedRows.includes(r.id))
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((r) => r.id)])])
    else setSelectedRows((prev) => prev.filter((id) => !paginated.some((r) => r.id === id)))
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const openAdd = () => {
    sessionStorage.removeItem('edit-teacher-row')
    onNavigate('add-teacher')
  }

  const openEdit = (row) => {
    const school = row?.schoolId != null ? schoolsById.get(String(row.schoolId)) : null
    const headOfficeId = row?.headOfficeId ?? row?.headOffice?.id ?? school?.headOfficeId ?? null
    sessionStorage.setItem(
      'edit-teacher-row',
      JSON.stringify({
        ...row,
        schoolId: row?.schoolId ?? school?.id ?? '',
        headOfficeId,
      }),
    )
    onNavigate('add-teacher')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this teacher?')) return
    setSaving(true)
    try {
      await deleteTeacher(id)
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Manage Teacher</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">Dashboard</button>
            <span className="text-secondary-light"> / Manage Teacher</span>
          </div>
        </div>
        {canAdd(PAGE_SLUG) && (
          <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <i className="ri-add-large-line text-md"></i> Add Teacher
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-8 mb-24" role="alert">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      )}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown" aria-expanded="false">
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
                onChange={(v) => {
                  setRowsPerPage(v)
                  setCurrentPage(1)
                }}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search teacher..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: 80 }}>
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} disabled={loading} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.photo && <th>Photo</th>}
                  {visibleColumns.name && <th>Name</th>}
                  {visibleColumns.designation && <th>Designation</th>}
                  {visibleColumns.department && <th>Department</th>}
                  {visibleColumns.phone && <th>Phone</th>}
                  {visibleColumns.email && <th>Email</th>}
                  {visibleColumns.joiningDate && <th>Joining Date</th>}
                  {visibleColumns.isViewOnWeb && <th>View on Web</th>}
                  {visibleColumns.displayOrder && <th>Order</th>}
                  <th style={{ width: 100 }}>Action</th>
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
                      {visibleColumns.photo && (
                        <td>
                          <img src={r.photoUrl || 'assets/images/user-grid/user-grid-img13.png'} alt="" className="w-40-px h-40-px rounded-circle object-fit-cover" />
                        </td>
                      )}
                      {visibleColumns.name && <td>{r.name}</td>}
                      {visibleColumns.designation && <td>{r.designationName}</td>}
                      {visibleColumns.department && <td>{r.department}</td>}
                      {visibleColumns.phone && <td>{r.phone}</td>}
                      {visibleColumns.email && <td>{r.email}</td>}
                      {visibleColumns.joiningDate && <td>{r.joiningDate}</td>}
                      {visibleColumns.isViewOnWeb && (
                        <td>
                          <span className={r.isViewOnWeb === 'Yes' ? 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm' : 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'}>
                            {r.isViewOnWeb}
                          </span>
                        </td>
                      )}
                      {visibleColumns.displayOrder && <td>{r.displayOrder}</td>}
                      <td>
                        <div className="d-flex align-items-center gap-8">
                          {canEdit(PAGE_SLUG) && (
                            <button type="button" className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0" onClick={() => openEdit(r)} title="Edit">
                              <i className="ri-edit-line"></i>
                            </button>
                          )}
                          {canDelete(PAGE_SLUG) && (
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

          <div className="px-20 py-16 border-top border-neutral-200">
            <TablePagination
              paginationProps={{
                currentPage,
                totalPages,
                totalRecords: filtered.length,
                rowsPerPage,
                pageInfo: `Showing ${filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, filtered.length)} of ${filtered.length} entries`,
                onPageChange: (next) => setCurrentPage(Math.min(Math.max(1, Number(next) || 1), totalPages)),
              }}
            />
          </div>
        </div>
      </div>

      <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter Teacher" onClose={() => setIsFilterSidebarOpen(false)}>
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {(isSuperAdmin || isHeadOfficeAdmin) ? (
            <ManualScopeSelectors
              enabled
              headOffices={headOfficeOptions}
              schoolOptions={filterSchoolOptions}
              selectedHeadOfficeId={pendingFilters.headOfficeId === 'Select' ? '' : pendingFilters.headOfficeId}
              onHeadOfficeChange={(value) => handleScopeChange('headOfficeId', value)}
              selectedSchoolId={pendingFilters.schoolId === 'Select' ? '' : pendingFilters.schoolId}
              onSchoolChange={(value) => handleScopeChange('schoolId', value)}
              showHeadOfficeSelector={isSuperAdmin}
            />
          ) : (
            <div>
              <label className="text-sm fw-semibold text-primary-light mb-8">School</label>
              <input className="form-control" value={scopedSchoolId ? (schoolsById.get(String(scopedSchoolId))?.schoolName || authSchoolName || '') : ''} readOnly />
            </div>
          )}
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Department</label>
            <select className="form-control form-select" value={pendingFilters.department} onChange={(e) => setPendingFilters(p => ({ ...p, department: e.target.value }))}>
              <option value="All">All</option>
              {departments.map(d => <option key={d.id} value={d.title}>{d.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Name</label>
            <input type="text" className="form-control" placeholder="Search by name" value={pendingFilters.name} onChange={(e) => setPendingFilters(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Email</label>
            <input type="email" className="form-control" placeholder="Search by email" value={pendingFilters.email} onChange={(e) => setPendingFilters(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">View on Web</label>
            <select className="form-control form-select" value={pendingFilters.isViewOnWeb} onChange={(e) => setPendingFilters(p => ({ ...p, isViewOnWeb: e.target.value }))}>
              <option value="All">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
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

export default ManageTeacher
