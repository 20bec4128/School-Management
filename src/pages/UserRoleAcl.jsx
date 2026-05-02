import React, { useEffect, useMemo, useState } from 'react'
import {
  createSchoolRole,
  deleteSchoolRole,
  fetchEditableRoles,
  fetchSchoolPermissions,
  fetchSchoolRoles,
  updateSchoolRolePermissions,
} from '../apis/schoolRbacApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { getCurrentRole, getCurrentUser } from '../utils/currentUser'
import { can } from '../utils/permissions'
import { normalizeRole } from '../utils/roles'
import '../assets/css/addModalShared.css'

const normalizeRoleName = (value) => String(value || '').trim().toUpperCase()
const ROLE_PICKER_SCHOOL_KEY = 'sm_user_roles_school_id'
const normalizePermCode = (value) => String(value || '').trim().toUpperCase()

const PermissionChecklist = ({ permissions, selected, onToggle, search, onSearch }) => {
  const filtered = useMemo(() => {
    const q = String(search || '').trim().toLowerCase()
    if (!q) return permissions
    return permissions.filter((p) => {
      const code = String(p.code || '').toLowerCase()
      const desc = String(p.description || '').toLowerCase()
      return code.includes(q) || desc.includes(q)
    })
  }, [permissions, search])

  return (
    <>
      <div className="d-flex gap-2 align-items-center mb-3">
        <input
          className="form-control"
          placeholder="Search permissions..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => {
            const all = permissions.map((p) => p.code).filter(Boolean)
            onToggle({ mode: 'set_all', values: all })
          }}
        >
          Select All
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => onToggle({ mode: 'clear_all' })}
        >
          Clear
        </button>
      </div>

      <div style={{ maxHeight: 340, overflow: 'auto' }} className="border rounded p-2">
        {filtered.map((p) => {
          const code = p.code
          const checked = selected.has(code)
          return (
            <label key={code} className="d-flex align-items-start gap-2 py-1">
              <input
                type="checkbox"
                className="form-check-input mt-1"
                checked={checked}
                onChange={() => onToggle({ mode: 'toggle', value: code })}
              />
              <div>
                <div className="fw-semibold">{code}</div>
                {p.description ? <div className="text-muted small">{p.description}</div> : null}
              </div>
            </label>
          )
        })}
        {filtered.length === 0 ? <div className="text-muted small">No permissions found.</div> : null}
      </div>
    </>
  )
}

const RoleModal = ({
  open,
  mode,
  allPermissions,
  initialRole,
  initialDescription,
  initialSelectedPermissions,
  headOfficeOptions,
  showHeadOfficePicker,
  onClose,
  onSave,
}) => {
  const [roleName, setRoleName] = useState('')
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [permSearch, setPermSearch] = useState('')
  const [headOfficeId, setHeadOfficeId] = useState('')

  useEffect(() => {
    if (!open) return
    setRoleName(mode === 'create' ? '' : initialRole || '')
    setDescription(mode === 'create' ? '' : initialDescription || '')
    setSelected(new Set(initialSelectedPermissions || []))
    setPermSearch('')
    setHeadOfficeId('')
  }, [open, mode, initialRole, initialDescription, initialSelectedPermissions])

  if (!open) return null

  const isSuperAdmin = normalizeRoleName(roleName || initialRole) === 'SUPER_ADMIN'
  const title = mode === 'create' ? 'Add Role' : `Edit Role: ${initialRole}`
  const requiresHeadOffice = mode === 'create' && showHeadOfficePicker
  const disableSave = isSuperAdmin || (requiresHeadOffice && !headOfficeId)

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {mode === 'create' ? (
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">Role name</label>
                  <input
                    className="form-control"
                    placeholder="E.g. LIBRARIAN"
                    value={roleName}
                    onChange={(e) => setRoleName(normalizeRoleName(e.target.value))}
                  />
                  <div className="text-muted small mt-1">Use uppercase letters, numbers, underscore.</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Description (optional)</label>
                  <input
                    className="form-control"
                    placeholder="Short description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                {showHeadOfficePicker ? (
                  <div className="col-md-12">
                    <label className="form-label">Head Office</label>
                    <select className="form-select" value={headOfficeId} onChange={(e) => setHeadOfficeId(e.target.value)}>
                      <option value="">-- Select Head Office --</option>
                      {(Array.isArray(headOfficeOptions) ? headOfficeOptions : []).map((ho) => (
                        <option key={ho.id} value={String(ho.id)}>
                          {ho.name}
                        </option>
                      ))}
                    </select>
                    <div className="text-muted small mt-1">This role will be added to all schools under the selected head office.</div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mb-3">
                <div className="fw-semibold">Role</div>
                <div className="text-muted">{initialRole}</div>
              </div>
            )}

            {isSuperAdmin ? (
              <div className="alert alert-info mb-0">SUPER_ADMIN always has full access and can’t be edited.</div>
            ) : (
              <PermissionChecklist
                permissions={allPermissions}
                selected={selected}
                search={permSearch}
                onSearch={setPermSearch}
                onToggle={(action) => {
                  setSelected((prev) => {
                    const next = new Set(prev)
                    if (action.mode === 'toggle') {
                      if (next.has(action.value)) next.delete(action.value)
                      else next.add(action.value)
                    } else if (action.mode === 'set_all') {
                      next.clear()
                      for (const v of action.values) next.add(v)
                    } else if (action.mode === 'clear_all') {
                      next.clear()
                    }
                    return next
                  })
                }}
              />
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={disableSave}
              onClick={() => {
                const payload = {
                  name: normalizeRoleName(roleName || initialRole),
                  description,
                  permissions: Array.from(selected).sort(),
                  headOfficeId: headOfficeId ? Number(headOfficeId) : null,
                }
                onSave(payload)
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const UserRoleAcl = () => {
  const [status, setStatus] = useState('idle') // idle | loading | ready | error
  const [error, setError] = useState('')
  const [permissions, setPermissions] = useState([])
  const [roles, setRoles] = useState([])
  const currentRole = normalizeRole(getCurrentRole())
  const currentUser = getCurrentUser()
  const isSuperAdminMode = currentRole === 'SUPER_ADMIN'
  const isAdminMode = currentRole === 'HEAD_OFFICE_ADMIN'
  const canAddRole = can(currentUser, ['RBAC_MANAGE', 'SCHOOL_RBAC_MANAGE'])
  const rawOwnedPerms = currentUser?.permissions
  const ownsAllPermissions = rawOwnedPerms === '*' || (Array.isArray(rawOwnedPerms) && rawOwnedPerms.includes('*'))
  const ownedPermissions = useMemo(() => {
    if (ownsAllPermissions) return new Set(['*'])
    const list = Array.isArray(rawOwnedPerms) ? rawOwnedPerms : []
    return new Set(list.map(normalizePermCode).filter(Boolean))
  }, [ownsAllPermissions, rawOwnedPerms])

  const [editableRoles, setEditableRoles] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [headOfficesLookup, setHeadOfficesLookup] = useState([])
  const [selectedHeadOfficeId, setSelectedHeadOfficeId] = useState('')
  const [selectedSchoolId, setSelectedSchoolId] = useState(() => {
    try {
      const raw = localStorage.getItem(ROLE_PICKER_SCHOOL_KEY)
      return raw ? String(raw) : ''
    } catch {
      return ''
    }
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [modalRole, setModalRole] = useState(null)

  const visiblePermissions = useMemo(() => {
    if (ownsAllPermissions) return permissions
    const list = Array.isArray(permissions) ? permissions : []
    return list.filter((p) => ownedPermissions.has(normalizePermCode(p?.code)))
  }, [ownsAllPermissions, ownedPermissions, permissions])

  const refresh = async () => {
    setStatus('loading')
    setError('')
    try {
      const editable = await fetchEditableRoles()
      setEditableRoles(editable)
      if (!Array.isArray(editable) || editable.length === 0) {
        setPermissions([])
        setRoles([])
        setStatus('ready')
        return
      }

      const permsPromise = fetchSchoolPermissions()

      if (isAdminMode && !selectedSchoolId) {
        const perms = await permsPromise
        setPermissions(perms)
        setRoles([])
        setStatus('ready')
        return
      }

      if (isSuperAdminMode && !selectedHeadOfficeId) {
        const perms = await permsPromise
        setPermissions(perms)
        setRoles([])
        setStatus('ready')
        return
      }

      const rolesPromise =
        isAdminMode
          ? fetchSchoolRoles({ schoolId: selectedSchoolId })
          : isSuperAdminMode
            ? fetchSchoolRoles({ headOfficeId: selectedHeadOfficeId })
            : fetchSchoolRoles()

      const [perms, roleList] = await Promise.all([permsPromise, rolesPromise])
      setPermissions(perms)
      setRoles(roleList)
      setStatus('ready')
    } catch (e) {
      setStatus('error')
      setError(e?.message || 'Failed to load RBAC data')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  useEffect(() => {
    if (!isSuperAdminMode) return
    ;(async () => {
      try {
        const page = await fetchHeadOfficesPage(0, 500)
        const list = Array.isArray(page?.content) ? page.content : []
        setHeadOfficesLookup(
          list
            .map((ho) => ({ id: ho?.id, name: ho?.name }))
            .filter((ho) => ho.id != null && ho.name)
        )
      } catch {
        setHeadOfficesLookup([])
      }
    })()
  }, [isSuperAdminMode])

  useEffect(() => {
    if (!isAdminMode) return
    ;(async () => {
      try {
        const list = await fetchSchoolsLookup()
        const normalized = Array.isArray(list) ? list : []
        setSchoolsLookup(normalized)

        if ((!selectedSchoolId || selectedSchoolId === '') && normalized.length > 0) {
          const first = normalized.find((s) => s?.id != null)
          if (first?.id != null) {
            const value = String(first.id)
            setSelectedSchoolId(value)
            try {
              localStorage.setItem(ROLE_PICKER_SCHOOL_KEY, value)
            } catch {
              // ignore
            }
          }
        }
      } catch {
        setSchoolsLookup([])
      }
    })()
  }, [isAdminMode])

  useEffect(() => {
    if (!isSuperAdminMode) return
    ;(async () => {
      try {
        const list = await fetchSchoolsLookup()
        setSchoolsLookup(Array.isArray(list) ? list : [])
      } catch {
        setSchoolsLookup([])
      }
    })()
  }, [isSuperAdminMode])

  useEffect(() => {
    if (!isSuperAdminMode) return
    if (!selectedHeadOfficeId) return
    void refresh()
  }, [isSuperAdminMode, selectedHeadOfficeId])

  useEffect(() => {
    if (!isAdminMode) return
    if (!selectedSchoolId) return
    try {
      localStorage.setItem(ROLE_PICKER_SCHOOL_KEY, String(selectedSchoolId))
    } catch {
      // ignore
    }
    void refresh()
  }, [isAdminMode, selectedSchoolId])

  const openCreate = () => {
    if (!canAddRole) return
    setModalMode('create')
    setModalRole(null)
    setModalOpen(true)
  }

  const openEdit = (role) => {
    setModalMode('edit')
    setModalRole(role)
    setModalOpen(true)
  }

  const saveModal = async ({ name, description, permissions: selectedPermissions, headOfficeId }) => {
    try {
      const filteredSelected = ownsAllPermissions
        ? selectedPermissions
        : (Array.isArray(selectedPermissions) ? selectedPermissions : [])
            .map(normalizePermCode)
            .filter((p) => ownedPermissions.has(p))

      if (modalMode === 'create') {
        await createSchoolRole({
          name,
          description,
          permissions: filteredSelected,
          schoolId: isAdminMode ? selectedSchoolId : undefined,
          headOfficeId: isSuperAdminMode ? headOfficeId : undefined,
        })
      } else {
        await updateSchoolRolePermissions(name, filteredSelected, {
          schoolId: isAdminMode ? selectedSchoolId : undefined,
          headOfficeId: isSuperAdminMode ? selectedHeadOfficeId : undefined,
        })
      }
      setModalOpen(false)
      window.dispatchEvent(new Event('sm:auth-refresh'))
      await refresh()
    } catch (e) {
      setError(e?.message || 'Save failed')
      setStatus('error')
    }
  }

  const handleDelete = async (role) => {
    const name = normalizeRoleName(role?.name)
    if (!name) return
    const ok = window.confirm(`Delete role ${name}? Users assigned to it will fall back to TEACHER.`)
    if (!ok) return
    try {
      const source = String(role?.source || '').toUpperCase()
      await deleteSchoolRole(name, {
        schoolId: source === 'SCHOOL' ? (isAdminMode || isSuperAdminMode ? selectedSchoolId : undefined) : undefined,
        headOfficeId: source === 'HEAD_OFFICE' && isSuperAdminMode ? selectedHeadOfficeId : undefined,
      })
      await refresh()
    } catch (e) {
      setError(e?.message || 'Delete failed')
      setStatus('error')
    }
  }

  const sortedRoles = useMemo(() => {
    const list = Array.isArray(roles) ? [...roles] : []
    const selfRole = normalizeRoleName(currentRole)
    const filtered = list.filter((r) => {
      const name = normalizeRoleName(r?.name)
      if (!name) return false
      if (name === 'SUPER_ADMIN') return false
      if (name === selfRole) return false
      return true
    })
    filtered.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    return filtered
  }, [roles, currentRole])

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-1">User Roles</h4>
          <div className="text-muted small">
            {canAddRole ? 'Manage roles and assign permissions within your scope.' : 'View role permissions for your scope only.'}
          </div>
        </div>
        {canAddRole ? (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            Add Role
          </button>
        ) : null}
      </div>

      {status === 'error' && error ? <div className="alert alert-danger">{error}</div> : null}
      {Array.isArray(editableRoles) && editableRoles.length === 0 ? (
        <div className="alert alert-warning">Not authorized to manage role permissions.</div>
      ) : null}

      <div className="card">
        <div className="card-body">
          {!isSuperAdminMode && isAdminMode ? (
            <div className="mb-3">
              <label className="form-label">School</label>
              <select
                className="form-select"
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
              >
                <option value="">-- Select School --</option>
                {schoolsLookup.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.schoolName}
                  </option>
                ))}
              </select>
              <div className="text-muted small mt-1">
                Head-office scoped ADMIN can manage role permissions per selected school.
              </div>
            </div>
          ) : null}

          {isSuperAdminMode ? (
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">Head Office</label>
                <select
                  className="form-select"
                  value={selectedHeadOfficeId}
                  onChange={(e) => {
                    setSelectedHeadOfficeId(e.target.value)
                  }}
                >
                  <option value="">-- Select Head Office --</option>
                  {headOfficesLookup.map((ho) => (
                    <option key={ho.id} value={String(ho.id)}>
                      {ho.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 d-flex align-items-end">
                <div className="text-muted small">
                  Head-office roles apply to all schools under the selected head office (edit syncs everywhere).
                </div>
              </div>
            </div>
          ) : null}
          {status === 'loading' ? <div>Loading...</div> : null}
          {status === 'ready' ? (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th style={{ width: 220 }}>Role</th>
                    <th>Description</th>
                    <th style={{ width: 140 }}>Permissions</th>
                    <th style={{ width: 140 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRoles.map((r) => {
                    const name = r.name
                    const perms = Array.isArray(r.permissions) ? r.permissions : []
                    const isSuperAdmin = normalizeRoleName(name) === 'SUPER_ADMIN'
                    const source = String(r.source || 'BUILT_IN')
                    const editable = r.editable !== false
                    const canDelete = editable && source !== 'BUILT_IN'
                    return (
                      <tr key={name}>
                        <td className="fw-semibold">{name}</td>
                        <td className="text-muted">{r.description || '-'}</td>
                        <td>{perms.includes('*') ? 'ALL' : perms.length}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            disabled={isSuperAdmin || !editable}
                            onClick={() => openEdit(r)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger ms-2"
                            disabled={isSuperAdmin || !canDelete}
                            onClick={() => handleDelete(r)}
                            title={source === 'HEAD_OFFICE' ? 'Deletes template and all school copies' : 'Deletes role in this school'}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {sortedRoles.length === 0 ? <div className="text-muted">No roles found.</div> : null}
            </div>
          ) : null}
        </div>
      </div>

      <RoleModal
        open={modalOpen}
        mode={modalMode}
        allPermissions={visiblePermissions}
        initialRole={modalRole?.name || ''}
        initialDescription={modalRole?.description || ''}
        initialSelectedPermissions={
          ownsAllPermissions
            ? (modalRole?.permissions || [])
            : (Array.isArray(modalRole?.permissions) ? modalRole.permissions : [])
                .map(normalizePermCode)
                .filter((p) => ownedPermissions.has(p))
        }
        showHeadOfficePicker={isSuperAdminMode && modalMode === 'create'}
        headOfficeOptions={headOfficesLookup}
        onClose={() => setModalOpen(false)}
        onSave={saveModal}
      />
    </div>
  )
}

export default UserRoleAcl
