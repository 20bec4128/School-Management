import React, { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { fetchRoles } from '../apis/rbacApi'
import { fetchSchoolRoles } from '../apis/schoolRbacApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { normalizeRole } from '../utils/roles'
import useColumnVisibility from '../hooks/useColumnVisibility'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import ExportDropdown from '../components/ExportDropdown'

const columnOptions = [
  { key: 'roleName', label: 'Role/Name' },
  { key: 'description', label: 'Note' },
  { key: 'isDefault', label: 'Is Default?' },
]

const ROLE_PICKER_SCHOOL_KEY = 'sm_user_roles_school_id'
const ROLE_PICKER_HEAD_OFFICE_KEY = 'sm_user_roles_head_office_id'

const RoleTable = ({ onNavigate }) => {
  const { user, headOfficeId } = useAuth()
  const { activeSchoolId, schoolOptions } = useSchool()
  
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const currentRole = normalizeRole(user?.role)
  const isSuperAdmin = currentRole === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = currentRole === 'HEAD_OFFICE_ADMIN'

  // Local Scope Overrides
  const [localHeadOfficeId, setLocalHeadOfficeId] = useState(() => {
    try { return localStorage.getItem(ROLE_PICKER_HEAD_OFFICE_KEY) || ''; } catch { return ''; }
  })
  const [localSchoolId, setLocalSchoolId] = useState(() => {
    try { return localStorage.getItem(ROLE_PICKER_SCHOOL_KEY) || ''; } catch { return ''; }
  })

  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [headOfficesLookup, setHeadOfficesLookup] = useState([])

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  // Fetch Lookups
  useEffect(() => {
    if (isSuperAdmin || isHeadOfficeAdmin) {
      fetchSchoolsLookup()
        .then((list) => setSchoolsLookup(Array.isArray(list) ? list : []))
        .catch(() => setSchoolsLookup([]))
    }
  }, [isSuperAdmin, isHeadOfficeAdmin])

  useEffect(() => {
    if (isSuperAdmin) {
      fetchHeadOfficesPage(0, 500)
        .then((page) => {
          const list = Array.isArray(page?.content) ? page.content : []
          const normalized = list
            .map((ho) => ({ id: ho?.id, name: ho?.name || ho?.headOfficeName }))
            .filter((ho) => ho.id != null && ho.name)
          setHeadOfficesLookup(normalized)
        })
        .catch(() => setHeadOfficesLookup([]))
    }
  }, [isSuperAdmin])

  // Sync Local Scope with Dashboard selection if local selection is not manually set yet
  useEffect(() => {
    if (activeSchoolId && schoolsLookup.length > 0 && !localSchoolId) {
      const match = schoolsLookup.find((s) => String(s.id) === String(activeSchoolId))
      if (match) {
        setLocalSchoolId(String(match.id))
        if (match.headOfficeId) {
          setLocalHeadOfficeId(String(match.headOfficeId))
        }
      }
    }
  }, [activeSchoolId, schoolsLookup, localSchoolId])

  // Filter schools based on selection
  const filteredSchools = useMemo(() => {
    const list = Array.isArray(schoolsLookup) ? schoolsLookup : []
    if (isSuperAdmin && localHeadOfficeId) {
      return list.filter((s) => String(s.headOfficeId) === String(localHeadOfficeId))
    }
    if (isHeadOfficeAdmin && headOfficeId) {
      return list.filter((s) => String(s.headOfficeId) === String(headOfficeId))
    }
    return list
  }, [schoolsLookup, localHeadOfficeId, isSuperAdmin, isHeadOfficeAdmin, headOfficeId])

  // Resolve scope school ID
  const effectiveSchoolId = localSchoolId || activeSchoolId

  // Fetch roles matching scope
  useEffect(() => {
    const loadRoles = async () => {
      setLoading(true)
      setError('')
      try {
        let roleList = []
        if (effectiveSchoolId) {
          const schoolRoles = await fetchSchoolRoles({ schoolId: effectiveSchoolId })
          roleList = schoolRoles.map((r) => ({
            ...r,
            isDefault: r.source === 'BUILT_IN' || r.isDefault === true || String(r.source).toUpperCase() === 'BUILT_IN',
          }))
        } else if (localHeadOfficeId) {
          const schoolRoles = await fetchSchoolRoles({ headOfficeId: localHeadOfficeId })
          roleList = schoolRoles
        } else {
          const globalRoles = await fetchRoles()
          roleList = globalRoles.map((r) => ({
            ...r,
            source: r.source || 'BUILT_IN',
            isDefault: r.isDefault !== false,
          }))
        }

        setRoles(roleList)
      } catch (err) {
        setError(err.message || 'Failed to load roles')
      } finally {
        setLoading(false)
      }
    }
    void loadRoles()
  }, [effectiveSchoolId, localHeadOfficeId])

  // Resolve active school name
  const schoolName = useMemo(() => {
    const targetId = effectiveSchoolId
    if (!targetId) return ''
    const match = schoolOptions.find((s) => String(s.id) === String(targetId))
    if (match) return match.schoolName
    const matchLookup = schoolsLookup.find((s) => String(s.id) === String(targetId))
    return matchLookup ? matchLookup.schoolName : `School (ID: ${targetId})`
  }, [effectiveSchoolId, schoolOptions, schoolsLookup])

  // Filtered roles
  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roles
    return roles.filter(
      (role) =>
        String(role.name || '').toLowerCase().includes(q) ||
        String(role.description || '').toLowerCase().includes(q)
    )
  }, [search, roles])

  // Paginated roles
  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredRoles.slice(start, start + rowsPerPage)
  }, [filteredRoles, currentPage, rowsPerPage])

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / rowsPerPage))

  const handleMatrixClick = (roleName) => {
    const params = new URLSearchParams()
    params.set('role', roleName)
    if (effectiveSchoolId) {
      params.set('schoolId', effectiveSchoolId)
    }
    if (onNavigate) onNavigate(`role-permission-setting?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="dashboard-main-body d-flex align-items-center justify-content-center" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-main-body">
      {/* Breadcrumbs Header */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">User Roles</h1>
          <span className="text-secondary-light">Dashboard / User Roles</span>
        </div>

        {/* Display Current Resolved Scope & Selectors */}
        <div className="d-flex flex-wrap align-items-center gap-16">
          {(isSuperAdmin || isHeadOfficeAdmin) && (
            <div className="d-flex align-items-center gap-12 flex-wrap">
              {/* Head Office Selector for Super Admin */}
              {isSuperAdmin && (
                <div className="d-flex align-items-center gap-8">
                  <span className="text-xs fw-bold text-neutral-500 mb-0 d-flex align-items-center gap-1">
                    <i className="ri-building-4-line"></i> HO:
                  </span>
                  <select
                    className="form-select form-select-sm py-4-px"
                    style={{ minWidth: '160px', borderRadius: '6px', fontSize: '0.82rem' }}
                    value={localHeadOfficeId}
                    onChange={(e) => {
                      const val = e.target.value
                      setLocalHeadOfficeId(val)
                      setLocalSchoolId('') // Reset school selection when HO changes
                      try { localStorage.setItem(ROLE_PICKER_HEAD_OFFICE_KEY, val); } catch {}
                    }}
                  >
                    <option value="">-- Global Template --</option>
                    {headOfficesLookup.map((ho) => (
                      <option key={ho.id} value={String(ho.id)}>
                        {ho.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* School Selector for Super Admin & Head Office Admin */}
              <div className="d-flex align-items-center gap-8">
                <span className="text-xs fw-bold text-neutral-500 mb-0 d-flex align-items-center gap-1">
                  <i className="ri-school-line"></i> SCHOOL:
                </span>
                <select
                  className="form-select form-select-sm py-4-px"
                  style={{ minWidth: '180px', borderRadius: '6px', fontSize: '0.82rem' }}
                  value={localSchoolId}
                  onChange={(e) => {
                    const val = e.target.value
                    setLocalSchoolId(val)
                    try { localStorage.setItem(ROLE_PICKER_SCHOOL_KEY, val); } catch {}
                  }}
                >
                  <option value="">-- Default / All --</option>
                  {filteredSchools.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.schoolName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {effectiveSchoolId ? (
            <span className="px-12 py-6 bg-success-100 text-success-600 fw-semibold text-xs rounded d-flex align-items-center gap-1">
              Scope: {schoolName}
            </span>
          ) : (
            <span className="px-12 py-6 bg-primary-100 text-primary-600 fw-semibold text-xs rounded d-flex align-items-center gap-1">
              Scope: Global Template
            </span>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {/* Table Toolbar controls */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              {/* Columns Visibility Selector */}
              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line" />
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

              {/* Rows Per Page dropdown */}
              <RowsPerPageSelect
                value={rowsPerPage}
                onChange={(v) => {
                  setRowsPerPage(v)
                  setCurrentPage(1)
                }}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>

            {/* Toolbar Search Input */}
            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search roles..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line" />
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ width: '80px' }}>#SL</th>
                  {visibleColumns.roleName ? <th scope="col">Role/Name</th> : null}
                  {visibleColumns.description ? <th scope="col">Note</th> : null}
                  {visibleColumns.isDefault ? <th scope="col">Is Default?</th> : null}
                  <th scope="col" style={{ width: '220px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRoles.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No roles found.
                    </td>
                  </tr>
                ) : (
                  paginatedRoles.map((role, idx) => (
                    <tr key={role.name}>
                      <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                      {visibleColumns.roleName ? (
                        <td className="fw-medium text-primary-light">{role.name}</td>
                      ) : null}
                      {visibleColumns.description ? (
                        <td>{role.description || '—'}</td>
                      ) : null}
                      {visibleColumns.isDefault ? (
                        <td>
                          <span
                            className={`px-12 py-4 radius-4 fw-medium text-sm ${
                              role.isDefault
                                ? 'bg-success-100 text-success-600'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {role.isDefault ? 'Yes' : 'No'}
                          </span>
                        </td>
                      ) : null}
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary-600 d-inline-flex align-items-center gap-1 px-16 py-8"
                          onClick={() => handleMatrixClick(role.name)}
                        >
                          <i className="ri-settings-5-line"></i>{' '}
                          Role Permission Setting
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredRoles.length > 0 && (
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 px-20 py-16 border-top border-neutral-200">
              <span className="text-secondary-light text-sm">
                Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredRoles.length)} of {filteredRoles.length} entries
              </span>
              <div className="d-flex align-items-center gap-8">
                <button
                  type="button"
                  className="btn btn-outline-neutral btn-sm px-12 py-6 radius-4"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`btn btn-sm px-12 py-6 radius-4 ${
                      currentPage === p ? 'btn-primary-600' : 'btn-outline-neutral'
                    }`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-outline-neutral btn-sm px-12 py-6 radius-4"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoleTable
