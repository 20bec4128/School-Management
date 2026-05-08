/* eslint-disable react-hooks/set-state-in-effect */
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
import { PAGE_GROUPS } from '../constants/pageAccess'
import '../assets/css/userRoleAcl.css'

const normalizeRoleName = (value) => String(value || '').trim().toUpperCase()
const normalizePermCode = (value) => String(value || '').trim().toUpperCase()

const ROLE_PICKER_SCHOOL_KEY = 'sm_user_roles_school_id'
const ROLE_PICKER_HEAD_OFFICE_KEY = 'sm_user_roles_head_office_id'

const ORDERED_GROUPS = PAGE_GROUPS.map((group) => ({
  key: group.key,
  label: group.label,
}))

const GROUP_MATCHERS = {
  'core-system': (code) => /^(DASHBOARD_VIEW|PROFILE_VIEW|PROFILE_UPDATE_LIMITED)$/.test(code),
  administrator: (code) =>
    /^(SCHOOL_MANAGE|RBAC_MANAGE|SCHOOL_RBAC_MANAGE|HEAD_OFFICE_MANAGE|HEAD_OFFICE_SCHOOL_MANAGE)$/.test(code),
  'student-management': (code) => /^(STUDENT_MANAGE|CHILD_PROFILE_VIEW)$/.test(code),
  'teacher-management': (code) =>
    /^(TEACHER_MANAGE|CLASS_VIEW_ASSIGNED|SECTION_VIEW_ASSIGNED|SUBJECT_VIEW_ASSIGNED|SUBJECT_MANAGE_ASSIGNED|SYLLABUS_MANAGE_ASSIGNED|STUDY_MATERIAL_MANAGE_ASSIGNED|LIVE_CLASS_MANAGE_ASSIGNED|ASSIGNMENT_MANAGE_ASSIGNED|SUBMISSION_VIEW_ASSIGNED|SUBMISSION_EVALUATE_ASSIGNED|LESSON_MANAGE_ASSIGNED|TOPIC_MANAGE_ASSIGNED|LESSON_PLAN_MANAGE_ASSIGNED)$/.test(code),
  'lesson-plan': (code) =>
    /^(LESSON_MANAGE|TOPIC_MANAGE|LESSON_PLAN_MANAGE|LESSON_VIEW_OWN|LESSON_VIEW_CHILD|TOPIC_VIEW_OWN|TOPIC_VIEW_CHILD|LESSON_PLAN_VIEW_OWN|LESSON_PLAN_VIEW_CHILD|CLASS_ROUTINE_VIEW|CLASS_ROUTINE_MANAGE)$/.test(code),
  'academic-management': (code) =>
    /^(CLASS_MANAGE|SECTION_MANAGE|SUBJECT_MANAGE|SYLLABUS_MANAGE|STUDY_MATERIAL_MANAGE|LIVE_CLASS_MANAGE|ASSIGNMENT_MANAGE|SUBMISSION_MANAGE)$/.test(code),
  hr: (code) => /^(ADMIN_USER_MANAGE|DEPARTMENT_MANAGE|TEACHER_MANAGE)$/.test(code),
  examination: (code) =>
    /^(ATTENDANCE_VIEW_OWN|ATTENDANCE_VIEW_CHILD|EXAM_VIEW_OWN|EXAM_VIEW_CHILD|EXAM_MARK_VIEW_OWN|EXAM_MARK_VIEW_CHILD|RESULT_VIEW_OWN|RESULT_VIEW_CHILD|REPORT_CARD_VIEW_OWN|REPORT_CARD_VIEW_CHILD)$/.test(code),
  finance: (code) => /^(FEES_VIEW_OWN|FEES_VIEW_CHILD|FEES_PAYMENT_VIEW_OWN|FEES_PAYMENT_VIEW_CHILD)$/.test(code),
  communication: (code) =>
    /^(NOTICE_VIEW|NEWS_VIEW|HOLIDAY_VIEW|EVENT_VIEW|GALLERY_VIEW|NOTIFICATION_VIEW_OWN|NOTIFICATION_VIEW_CHILD|ANNOUNCEMENT_VIEW|COMPLAINT_CREATE|COMPLAINT_VIEW_OWN|COMPLAINT_VIEW_CHILD)$/.test(code),
  certificates: (code) =>
    /^(ID_CARD_SETTING|ADMIT_CARD_SETTING|CERTIFICATE_TYPE|GENERATE_CERTIFICATE|CANDIDATE|DONAR|SCHOLARSHIP|GUARDIAN)$/.test(code),
}

const getGroupKeyForPermission = (permission) => {
  const code = normalizePermCode(permission?.code)
  if (!code) return 'other'

  for (const group of ORDERED_GROUPS) {
    const matcher = GROUP_MATCHERS[group.key]
    if (matcher && matcher(code, permission)) return group.key
  }

  return 'other'
}

const formatLabelFromCode = (code) =>
  String(code || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const groupPermissions = (permissions) => {
  const buckets = new Map()
  for (const group of ORDERED_GROUPS) buckets.set(group.key, [])
  buckets.set('other', [])

  for (const permission of Array.isArray(permissions) ? permissions : []) {
    const key = getGroupKeyForPermission(permission)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(permission)
  }

  return [...buckets.entries()]
    .map(([key, items]) => {
      const meta = key === 'other' ? { key: 'other', label: 'Other' } : ORDERED_GROUPS.find((group) => group.key === key)
      return {
        key,
        label: meta?.label || 'Other',
        items: items.sort((a, b) => {
          const left = String(a?.description || a?.code || '')
          const right = String(b?.description || b?.code || '')
          return left.localeCompare(right)
        }),
      }
    })
    .filter((group) => group.items.length > 0)
}

const hasAllSelected = (codes, selected) => {
  if (!Array.isArray(codes) || codes.length === 0) return false
  return codes.every((code) => selected.has(code))
}

const hasAnySelected = (codes, selected) => {
  if (!Array.isArray(codes) || codes.length === 0) return false
  return codes.some((code) => selected.has(code))
}

const CreateRoleModal = ({ open, isSuperAdminMode, headOfficeOptions, onClose, onCreate, selectedHeadOfficeId, selectedSchoolId }) => {
  const [roleName, setRoleName] = useState('')
  const [description, setDescription] = useState('')
  const [headOfficeId, setHeadOfficeId] = useState('')

  useEffect(() => {
    if (!open) return
    setRoleName('')
    setDescription('')
    setHeadOfficeId(selectedHeadOfficeId || '')
  }, [open, selectedHeadOfficeId])

  if (!open) return null

  const canSubmit = roleName.trim() && (!isSuperAdminMode || headOfficeId)

  return (
    <div className="user-role-acl-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="user-role-acl-modal-card" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="user-role-acl-modal-header">
          <div>
            <h3 className="user-role-acl-modal-title">Add Role</h3>
            <p className="user-role-acl-modal-subtitle">Create a new role before assigning access.</p>
          </div>
          <button type="button" className="user-role-acl-icon-btn" onClick={onClose} aria-label="Close">
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="user-role-acl-modal-body">
          <label className="user-role-acl-field">
            <span>Role name</span>
            <input
              className="form-control"
              value={roleName}
              onChange={(e) => setRoleName(normalizeRoleName(e.target.value))}
              placeholder="E.g. LIBRARIAN"
              autoComplete="off"
            />
          </label>

          <label className="user-role-acl-field">
            <span>Description</span>
            <input
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              autoComplete="off"
            />
          </label>

          {isSuperAdminMode ? (
            <label className="user-role-acl-field">
              <span>Head office</span>
              <select className="form-select" value={headOfficeId} onChange={(e) => setHeadOfficeId(e.target.value)}>
                <option value="">-- Select Head Office --</option>
                {(Array.isArray(headOfficeOptions) ? headOfficeOptions : []).map((ho) => (
                  <option key={ho.id} value={String(ho.id)}>
                    {ho.name}
                  </option>
                ))}
              </select>
              <small className="text-muted">The role will be created across schools under this head office.</small>
            </label>
          ) : null}

          {!isSuperAdminMode && selectedSchoolId ? (
            <div className="user-role-acl-inline-note">
              This role will be created in the selected school scope.
            </div>
          ) : null}
        </div>

        <div className="user-role-acl-modal-footer">
          <button type="button" className="btn btn-light" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canSubmit}
            onClick={() =>
              onCreate({
                name: roleName,
                description,
                headOfficeId: headOfficeId ? Number(headOfficeId) : null,
              })
            }
          >
            Create Role
          </button>
        </div>
      </div>
    </div>
  )
}

const PERMISSION_FILTER_MODES = [
  { key: 'all', label: 'All' },
  { key: 'selected', label: 'Selected Only' },
  { key: 'unselected', label: 'Unselected Only' },
]

const FilterTabs = ({ value, onChange }) => (
  <div className="user-role-acl-filter-tabs" role="tablist" aria-label="Permission filters">
    {PERMISSION_FILTER_MODES.map((mode) => (
      <button
        key={mode.key}
        type="button"
        className={`user-role-acl-filter-tab ${value === mode.key ? 'active' : ''}`}
        onClick={() => onChange(mode.key)}
      >
        {mode.label}
      </button>
    ))}
  </div>
)

const PermissionGroupCard = ({
  group,
  selected,
  onToggle,
  expanded,
  onToggleExpanded,
  disabled,
}) => {
  const codes = group.items.map((item) => normalizePermCode(item.code)).filter(Boolean)
  const selectedCount = codes.filter((code) => selected.has(code)).length
  const allSelected = hasAllSelected(codes, selected)
  const someSelected = !allSelected && hasAnySelected(codes, selected)

  return (
    <section className={`user-role-acl-group-card ${expanded ? 'is-expanded' : ''}`}>
      <div className="user-role-acl-group-header" role="group" aria-label={`${group.label} section`}>
        <button
          type="button"
          className="user-role-acl-group-header-main"
          onClick={() => onToggleExpanded(group.key)}
          aria-expanded={expanded}
        >
          <div className="user-role-acl-group-title-wrap">
            <span className="user-role-acl-group-title">{group.label}</span>
            <span className="user-role-acl-group-count">{group.items.length}</span>
          </div>
          <span className={`user-role-acl-group-select-state ${allSelected || someSelected ? 'active' : ''}`}>
            {selectedCount}/{group.items.length} selected
          </span>
        </button>

        <div className="user-role-acl-group-header-actions">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={(e) => {
              e.stopPropagation()
              onToggle({ mode: 'set', values: codes })
            }}
            disabled={disabled || codes.length === 0}
          >
            Select All
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={(e) => {
              e.stopPropagation()
              onToggle({ mode: 'clear', values: codes })
            }}
            disabled={disabled || codes.length === 0}
          >
            Clear
          </button>
          <button
            type="button"
            className="user-role-acl-icon-btn"
            onClick={() => onToggleExpanded(group.key)}
            aria-label={expanded ? `Collapse ${group.label}` : `Expand ${group.label}`}
          >
            <i className={expanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="user-role-acl-group-body">
          <div className="user-role-acl-permission-list">
            {group.items.map((permission) => {
              const code = normalizePermCode(permission.code)
              const checked = selected.has(code)
              const label = permission.description || formatLabelFromCode(code)
              return (
                <label
                  key={code}
                  className={`user-role-acl-permission-row ${checked ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => onToggle({ mode: 'toggle', value: code })}
                  />
                  <div className="user-role-acl-permission-copy">
                    <div className="user-role-acl-permission-code">{code}</div>
                    <div className="user-role-acl-permission-desc">{label}</div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      ) : null}
    </section>
  )
}

const UserRoleAcl = () => {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [permissions, setPermissions] = useState([])
  const [roles, setRoles] = useState([])
  const [editableRoles, setEditableRoles] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [headOfficesLookup, setHeadOfficesLookup] = useState([])
  const [selectedSchoolId, setSelectedSchoolId] = useState(() => {
    try {
      const raw = localStorage.getItem(ROLE_PICKER_SCHOOL_KEY)
      return raw ? String(raw) : ''
    } catch {
      return ''
    }
  })
  const [selectedHeadOfficeId, setSelectedHeadOfficeId] = useState(() => {
    try {
      const raw = localStorage.getItem(ROLE_PICKER_HEAD_OFFICE_KEY)
      return raw ? String(raw) : ''
    } catch {
      return ''
    }
  })
  const [selectedRoleName, setSelectedRoleName] = useState('')
  const [draftPermissions, setDraftPermissions] = useState(new Set())
  const [permissionSearch, setPermissionSearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState(() => new Set([ORDERED_GROUPS[0]?.key].filter(Boolean)))
  const [isSaving, setIsSaving] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [roleSearch, setRoleSearch] = useState('')
  const [permissionFilterMode, setPermissionFilterMode] = useState('all')

  const currentRole = normalizeRole(getCurrentRole())
  const currentUser = getCurrentUser()
  const isSuperAdminMode = currentRole === 'SUPER_ADMIN'
  const isAdminMode = currentRole === 'HEAD_OFFICE_ADMIN'
  const canManageRoles = can(currentUser, ['RBAC_MANAGE', 'SCHOOL_RBAC_MANAGE'])

  const rawOwnedPerms = currentUser?.permissions
  const ownsAllPermissions = rawOwnedPerms === '*' || (Array.isArray(rawOwnedPerms) && rawOwnedPerms.includes('*'))
  const ownedPermissions = useMemo(() => {
    if (ownsAllPermissions) return new Set(['*'])
    const list = Array.isArray(rawOwnedPerms) ? rawOwnedPerms : []
    return new Set(list.map(normalizePermCode).filter(Boolean))
  }, [ownsAllPermissions, rawOwnedPerms])

  const visiblePermissions = useMemo(() => {
    const list = Array.isArray(permissions) ? permissions : []
    if (ownsAllPermissions) return list
    return list.filter((permission) => ownedPermissions.has(normalizePermCode(permission?.code)))
  }, [ownsAllPermissions, ownedPermissions, permissions])

  const permissionSearchFiltered = useMemo(() => {
    const q = String(permissionSearch || '').trim().toLowerCase()
    if (!q) return visiblePermissions
    return visiblePermissions.filter((permission) => {
      const code = String(permission?.code || '').toLowerCase()
      const desc = String(permission?.description || '').toLowerCase()
      return code.includes(q) || desc.includes(q)
    })
  }, [permissionSearch, visiblePermissions])

  const filteredPermissions = useMemo(() => {
    const selectedSet = draftPermissions
    return permissionSearchFiltered.filter((permission) => {
      const code = normalizePermCode(permission?.code)
      if (!code) return false
      if (permissionFilterMode === 'selected') return selectedSet.has(code)
      if (permissionFilterMode === 'unselected') return !selectedSet.has(code)
      return true
    })
  }, [draftPermissions, permissionFilterMode, permissionSearchFiltered])

  const groupedPermissions = useMemo(() => groupPermissions(filteredPermissions), [filteredPermissions])

  const selectedPermissionCount = draftPermissions.size
  const visiblePermissionCodes = useMemo(
    () => filteredPermissions.map((permission) => normalizePermCode(permission.code)).filter(Boolean),
    [filteredPermissions]
  )
  const visibleSelectedCount = useMemo(
    () => visiblePermissionCodes.filter((code) => draftPermissions.has(code)).length,
    [draftPermissions, visiblePermissionCodes]
  )
  const visibleSelectedText =
    permissionFilterMode === 'selected'
      ? `${visibleSelectedCount}/${visiblePermissionCodes.length || 0} selected`
      : permissionFilterMode === 'unselected'
        ? `${visiblePermissionCodes.length - visibleSelectedCount}/${visiblePermissionCodes.length || 0} unselected`
        : `${visibleSelectedCount}/${visiblePermissionCodes.length || 0} visible selected`

  const selectedRole = useMemo(
    () => roles.find((role) => normalizeRoleName(role?.name) === normalizeRoleName(selectedRoleName)) || null,
    [roles, selectedRoleName]
  )
  const selectedRoleNameNormalized = normalizeRoleName(selectedRole?.name)
  const selectedRoleIsSelf = selectedRoleNameNormalized === currentRole
  const selectedRoleEditable = Boolean(selectedRole) && selectedRole?.editable !== false && selectedRoleNameNormalized !== 'SUPER_ADMIN' && !selectedRoleIsSelf
  const selectedRoleDescription = selectedRole?.description || 'No description provided'
  const isDirty = useMemo(() => {
    const original = new Set((Array.isArray(selectedRole?.permissions) ? selectedRole.permissions : []).map(normalizePermCode).filter(Boolean))
    if (original.size !== draftPermissions.size) return true
    for (const code of original) {
      if (!draftPermissions.has(code)) return true
    }
    return false
  }, [draftPermissions, selectedRole])

  const loadData = async () => {
    setStatus('loading')
    setError('')
    try {
      const editable = await fetchEditableRoles()
      setEditableRoles(Array.isArray(editable) ? editable : [])
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

      const rolesPromise = isAdminMode
        ? fetchSchoolRoles({ schoolId: selectedSchoolId })
        : isSuperAdminMode
          ? fetchSchoolRoles({ headOfficeId: selectedHeadOfficeId })
          : fetchSchoolRoles()

      const [perms, roleList] = await Promise.all([permsPromise, rolesPromise])
      setPermissions(Array.isArray(perms) ? perms : [])
      setRoles(Array.isArray(roleList) ? roleList : [])
      setStatus('ready')
      return { permissions: perms, roles: roleList }
    } catch (e) {
      setStatus('error')
      setError(e?.message || 'Failed to load RBAC data')
      return null
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isAdminMode) return
    ;(async () => {
      try {
        const list = await fetchSchoolsLookup()
        const normalized = Array.isArray(list) ? list : []
        setSchoolsLookup(normalized)
        if (!selectedSchoolId && normalized.length > 0) {
          const first = normalized.find((item) => item?.id != null)
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
  }, [isAdminMode, selectedSchoolId])

  useEffect(() => {
    if (!isSuperAdminMode) return
    ;(async () => {
      try {
        const page = await fetchHeadOfficesPage(0, 500)
        const list = Array.isArray(page?.content) ? page.content : []
        const normalized = list
          .map((ho) => ({ id: ho?.id, name: ho?.name }))
          .filter((ho) => ho.id != null && ho.name)
        setHeadOfficesLookup(normalized)
        if (!selectedHeadOfficeId && normalized.length > 0) {
          const first = normalized[0]
          const value = String(first.id)
          setSelectedHeadOfficeId(value)
          try {
            localStorage.setItem(ROLE_PICKER_HEAD_OFFICE_KEY, value)
          } catch {
            // ignore
          }
        }
      } catch {
        setHeadOfficesLookup([])
      }
    })()
  }, [isSuperAdminMode, selectedHeadOfficeId])

  useEffect(() => {
    if (!isSuperAdminMode) return
    if (!selectedHeadOfficeId) return
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdminMode, selectedHeadOfficeId])

  useEffect(() => {
    if (!isAdminMode) return
    if (!selectedSchoolId) return
    try {
      localStorage.setItem(ROLE_PICKER_SCHOOL_KEY, String(selectedSchoolId))
    } catch {
      // ignore
    }
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminMode, selectedSchoolId])

  useEffect(() => {
    if (!Array.isArray(roles) || roles.length === 0) {
      setSelectedRoleName('')
      setDraftPermissions(new Set())
      return
    }

    const normalizedCurrent = normalizeRoleName(selectedRoleName)
    const existing = roles.find((role) => normalizeRoleName(role?.name) === normalizedCurrent)
    if (existing) return

    const nextRole =
      roles.find((role) => {
        const name = normalizeRoleName(role?.name)
        return name && name !== 'SUPER_ADMIN' && name !== currentRole && role?.editable !== false
      }) ||
      roles.find((role) => normalizeRoleName(role?.name) !== 'SUPER_ADMIN') ||
      roles[0]

    if (nextRole?.name) {
      setSelectedRoleName(nextRole.name)
    }
  }, [currentRole, roles, selectedRoleName])

  useEffect(() => {
    if (!selectedRole) {
      setDraftPermissions(new Set())
      return
    }

    const next = new Set(
      (Array.isArray(selectedRole.permissions) ? selectedRole.permissions : [])
        .map(normalizePermCode)
        .filter(Boolean)
    )
    setDraftPermissions(next)
    setPermissionSearch('')
    setExpandedGroups(new Set([ORDERED_GROUPS[0]?.key].filter(Boolean)))
  }, [selectedRole])

  const confirmRoleSwitch = (nextRoleName) => {
    if (normalizeRoleName(nextRoleName) === normalizeRoleName(selectedRoleName)) return true
    if (!isDirty) return true
    return window.confirm('You have unsaved changes. Discard them and switch roles?')
  }

  const handleSelectRole = (roleName) => {
    if (!confirmRoleSwitch(roleName)) return
    setSelectedRoleName(roleName)
  }

  const handleTogglePermission = ({ mode, value, values }) => {
    if (!selectedRoleEditable) return
    setDraftPermissions((prev) => {
      const next = new Set(prev)
      if (mode === 'toggle' && value) {
        if (next.has(value)) next.delete(value)
        else next.add(value)
      } else if (mode === 'set' && Array.isArray(values)) {
        for (const code of values) next.add(code)
      } else if (mode === 'clear' && Array.isArray(values)) {
        for (const code of values) next.delete(code)
      } else if (mode === 'select_all') {
        for (const code of visiblePermissionCodes) next.add(code)
      } else if (mode === 'clear_all') {
        next.clear()
      }
      return next
    })
  }

  const handleToggleExpanded = (groupKey) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupKey)) next.delete(groupKey)
      else next.add(groupKey)
      return next
    })
  }

  const selectAllVisible = () => handleTogglePermission({ mode: 'select_all' })
  const clearAll = () => handleTogglePermission({ mode: 'clear_all' })
  const saveAccess = async () => {
    if (!selectedRole || !selectedRoleEditable || isSaving) return
    setIsSaving(true)
    setError('')
    try {
      const filteredSelected = ownsAllPermissions
        ? Array.from(draftPermissions)
        : Array.from(draftPermissions).filter((code) => ownedPermissions.has(code))

      await updateSchoolRolePermissions(selectedRole.name, filteredSelected.sort(), {
        schoolId: isAdminMode ? selectedSchoolId : undefined,
        headOfficeId: isSuperAdminMode ? selectedHeadOfficeId : undefined,
      })
      window.dispatchEvent(new Event('sm:auth-refresh'))
      await loadData()
    } catch (e) {
      setStatus('error')
      setError(e?.message || 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  const createRole = async ({ name, description, headOfficeId }) => {
    try {
      await createSchoolRole({
        name,
        description,
        permissions: [],
        schoolId: isAdminMode ? selectedSchoolId : undefined,
        headOfficeId: isSuperAdminMode ? headOfficeId : undefined,
      })
      setIsCreateOpen(false)
      await loadData()
      setSelectedRoleName(normalizeRoleName(name))
    } catch (e) {
      setStatus('error')
      setError(e?.message || 'Create failed')
    }
  }

  const handleDelete = async (role) => {
    const name = normalizeRoleName(role?.name)
    if (!name) return
    if (!role?.editable || name === 'SUPER_ADMIN' || name === currentRole) return

    const ok = window.confirm(`Delete role ${name}? Users assigned to it will fall back to TEACHER.`)
    if (!ok) return

    try {
      const source = String(role?.source || '').toUpperCase()
      await deleteSchoolRole(name, {
        schoolId: source === 'SCHOOL' ? (isAdminMode || isSuperAdminMode ? selectedSchoolId : undefined) : undefined,
        headOfficeId: source === 'HEAD_OFFICE' && isSuperAdminMode ? selectedHeadOfficeId : undefined,
      })
      await loadData()
    } catch (e) {
      setStatus('error')
      setError(e?.message || 'Delete failed')
    }
  }

  const sortedRoles = useMemo(() => {
    const list = Array.isArray(roles) ? [...roles] : []
    return list
      .filter((role) => {
        const name = normalizeRoleName(role?.name)
        if (!name) return false
        if (name === 'SUPER_ADMIN') return false
        if (name === currentRole) return false
        return true
      })
      .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
  }, [roles, currentRole])

  const visibleRoles = useMemo(() => {
    const q = String(roleSearch || '').trim().toLowerCase()
    if (!q) return sortedRoles
    return sortedRoles.filter((role) => {
      const name = String(role?.name || '').toLowerCase()
      const desc = String(role?.description || '').toLowerCase()
      const source = String(role?.source || '').toLowerCase()
      return name.includes(q) || desc.includes(q) || source.includes(q)
    })
  }, [roleSearch, sortedRoles])

  const roleSummaryScope = isSuperAdminMode
    ? headOfficesLookup.find((ho) => String(ho.id) === String(selectedHeadOfficeId))?.name || 'Select a head office'
    : isAdminMode
      ? schoolsLookup.find((school) => String(school.id) === String(selectedSchoolId))?.schoolName || 'Select a school'
      : 'Current scope'

  return (
    <div className="dashboard-main-body user-role-acl-page">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">User Roles</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / User Roles</span>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-12">
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={() => setIsCreateOpen(true)}
            disabled={
              !canManageRoles ||
              (isAdminMode && !selectedSchoolId) ||
              (isSuperAdminMode && !selectedHeadOfficeId)
            }
          >
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add Role
          </button>

          <button
            type="button"
            className="btn btn-primary-600"
            onClick={saveAccess}
            disabled={!selectedRoleEditable || !isDirty || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Access'}
          </button>
        </div>
      </div>

      {status === 'error' && error ? <div className="alert alert-danger">{error}</div> : null}
      {Array.isArray(editableRoles) && editableRoles.length === 0 ? (
        <div className="alert alert-warning">Not authorized to manage role permissions.</div>
      ) : null}

      <div className="user-role-acl-shell">
        <aside className="user-role-acl-sidebar card">
          <div className="user-role-acl-sidebar-header">
            <div>
              <div className="user-role-acl-sidebar-label">Roles</div>
              <div className="user-role-acl-sidebar-summary">{roleSummaryScope}</div>
            </div>
          </div>

          <div className="user-role-acl-scope-panel">
            {isAdminMode ? (
              <label className="user-role-acl-field">
                <span>School</span>
                <select className="form-select" value={selectedSchoolId} onChange={(e) => setSelectedSchoolId(e.target.value)}>
                  <option value="">-- Select School --</option>
                  {schoolsLookup.map((school) => (
                    <option key={school.id} value={String(school.id)}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {isSuperAdminMode ? (
              <label className="user-role-acl-field">
                <span>Head Office</span>
                <select
                  className="form-select"
                  value={selectedHeadOfficeId}
                  onChange={(e) => setSelectedHeadOfficeId(e.target.value)}
                >
                  <option value="">-- Select Head Office --</option>
                  {headOfficesLookup.map((ho) => (
                    <option key={ho.id} value={String(ho.id)}>
                      {ho.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="user-role-acl-role-search-wrap">
              <input
                className="form-control user-role-acl-role-search"
                placeholder="Search role..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="user-role-acl-role-list">
            {status === 'loading' ? <div className="user-role-acl-loading">Loading roles...</div> : null}
            {visibleRoles.map((role) => {
              const roleName = normalizeRoleName(role?.name)
              const selected = roleName === normalizeRoleName(selectedRoleName)
              const editable = role?.editable !== false && roleName !== 'SUPER_ADMIN' && roleName !== currentRole
              const permCount = Array.isArray(role?.permissions) ? role.permissions.length : 0
              const source = String(role?.source || 'BUILT_IN').toUpperCase()
              return (
                <div
                  key={roleName}
                  className={`user-role-acl-role-item ${selected ? 'is-selected' : ''}`}
                  onClick={() => handleSelectRole(role?.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSelectRole(role?.name)
                    }
                  }}
                >
                  <div className="user-role-acl-role-item-main">
                    <div className="user-role-acl-role-item-top">
                      <span className="user-role-acl-role-name">{roleName}</span>
                      <span className="user-role-acl-role-count">{permCount}</span>
                    </div>
                    <div className="user-role-acl-role-meta">
                      <span>{role?.description || 'No description'}</span>
                      <span>{source}</span>
                    </div>
                  </div>
                  <div className="user-role-acl-role-actions">
                    <button
                      type="button"
                      className="user-role-acl-role-action-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectRole(role?.name)
                      }}
                      disabled={!editable}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="user-role-acl-icon-btn danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleDelete(role)
                      }}
                      disabled={!editable}
                      aria-label={`Delete ${roleName}`}
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              )
            })}
            {!sortedRoles.length && status !== 'loading' ? <div className="user-role-acl-empty">No roles found.</div> : null}
            {!visibleRoles.length && sortedRoles.length > 0 && status !== 'loading' ? (
              <div className="user-role-acl-empty">No roles match your search.</div>
            ) : null}
          </div>
        </aside>

        <section className="user-role-acl-main card">
          <div className="user-role-acl-main-header">
            <div>
              <div className="user-role-acl-main-label">Page Visibility</div>
              <h3 className="user-role-acl-main-title">
                {selectedRole?.name ? `Edit Role: ${selectedRole.name}` : 'Select a role'}
              </h3>
              {/* <p className="user-role-acl-main-subtitle">
                {selectedRole?.name
                  ? selectedRoleDescription
                  : 'Pick a role from the list on the left to review and adjust its permissions.'}
              </p> */}
            </div>
            <div className="user-role-acl-stats">
              <span className="user-role-acl-stat">{selectedPermissionCount} permissions selected</span>
              <span className="user-role-acl-stat">{groupedPermissions.length} sections</span>
            </div>
          </div>

          <div className="user-role-acl-toolbar">
            <div className="user-role-acl-toolbar-left">
              <input
                className="form-control user-role-acl-search"
                placeholder="Search permissions..."
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
              />
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={selectAllVisible} disabled={!selectedRoleEditable}>
                Select All
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearAll} disabled={!selectedRoleEditable}>
                Clear
              </button>
            </div>

            <div className="user-role-acl-toolbar-right">
              <FilterTabs value={permissionFilterMode} onChange={setPermissionFilterMode} />
              <div className="user-role-acl-mini-chip">{visibleSelectedText}</div>
            </div>
          </div>

          {!selectedRole ? (
            <div className="user-role-acl-empty-state">
              <div className="user-role-acl-empty-state-icon">
                <i className="ri-shield-keyhole-line"></i>
              </div>
              <h3>Select a role to continue</h3>
              <p>Choose a role from the left panel to view the grouped page permissions.</p>
            </div>
          ) : !selectedRoleEditable ? (
            <div className="alert alert-info mb-0">This role is locked for your account and cannot be edited.</div>
          ) : status === 'loading' ? (
            <div className="user-role-acl-loading-panel">Loading permissions...</div>
          ) : groupedPermissions.length === 0 ? (
            <div className="user-role-acl-empty-state">
              <div className="user-role-acl-empty-state-icon">
                <i className="ri-search-line"></i>
              </div>
              <h3>No permissions found</h3>
              <p>Try a different search term or clear the filter to see all available access cards.</p>
            </div>
          ) : (
            <div className="user-role-acl-grid">
              {groupedPermissions.map((group) => {
                const expanded = expandedGroups.has(group.key)
                return (
                  <PermissionGroupCard
                    key={group.key}
                    group={group}
                    selected={draftPermissions}
                    onToggle={handleTogglePermission}
                    expanded={expanded}
                    onToggleExpanded={handleToggleExpanded}
                    disabled={!selectedRoleEditable}
                  />
                )
              })}
            </div>
          )}
        </section>
      </div>

      <CreateRoleModal
        open={isCreateOpen}
        isSuperAdminMode={isSuperAdminMode}
        headOfficeOptions={headOfficesLookup}
        selectedHeadOfficeId={selectedHeadOfficeId}
        selectedSchoolId={selectedSchoolId}
        onClose={() => setIsCreateOpen(false)}
        onCreate={createRole}
      />
    </div>
  )
}

export default UserRoleAcl
