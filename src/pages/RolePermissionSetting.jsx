import React, { useState, useEffect, useMemo } from 'react'
import {
  fetchModulesWithFunctions,
  fetchRolePagePermissions,
  saveRolePagePermissions
} from '../apis/pagePermissionApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import '../assets/css/rolePermissionSetting.css'

// ---------------------------------------------------------------------------
// Per-slug action rules.
// Keys are the exact slugs from rbac_functions.
// Values list which of the four actions are allowed for that page.
// Any slug NOT listed here defaults to full CRUD (all four actions).
// ---------------------------------------------------------------------------
const SLUG_ALLOWED_ACTIONS = {
  // ── Dashboards — view only ────────────────────────────────────────────────
  'lms-dashboard':          ['canView'],
  'parent-dashboard':       ['canView'],
  'school-admin-dashboard': ['canView'],
  'student-dashboard':      ['canView'],
  'teacher-dashboard':      ['canView'],
  'super-admin-dashboard':  ['canView'],

  // ── Setting — no delete ───────────────────────────────────────────────────
  'general-settings':       ['canView', 'canAdd', 'canEdit'],
  'payment-setting':        ['canView', 'canAdd', 'canEdit'],
  'payment-setting-create': ['canView', 'canAdd', 'canEdit'],
  'sms-setting':            ['canView', 'canAdd', 'canEdit'],
  'sms-setting-create':     ['canView', 'canAdd', 'canEdit'],
  'email-setting':          ['canView', 'canAdd', 'canEdit'],
  'email-setting-create':   ['canView', 'canAdd', 'canEdit'],
  'opening-hour':           ['canView', 'canAdd', 'canEdit'],
  'add-opening-hour':       ['canView', 'canAdd', 'canEdit'],

  // ── Administrator — mixed ─────────────────────────────────────────────────
  'backup-database':        ['canView'],
  'manage-super-admin':     ['canView', 'canAdd'],           // view + add only
  'add-super-admin':        ['canView', 'canAdd'],

  // ── Class Routine — no delete ─────────────────────────────────────────────
  'class-routine':          ['canView', 'canAdd', 'canEdit'],

  // ── Lesson — no delete ────────────────────────────────────────────────────
  'lesson':                 ['canView', 'canAdd', 'canEdit'],
  'lesson-plan':            ['canView', 'canAdd', 'canEdit'],
  'lesson-status':          ['canView', 'canAdd', 'canEdit'],
  'lesson-timeline':        ['canView', 'canAdd', 'canEdit'],
  'add-lesson':             ['canView', 'canAdd', 'canEdit'],
  'edit-lesson':            ['canView', 'canAdd', 'canEdit'],

  // ── Promotion — view + add only ───────────────────────────────────────────
  'promotion':              ['canView', 'canAdd'],

  // ── Attendance — no delete ────────────────────────────────────────────────
  'attendance':             ['canView', 'canAdd', 'canEdit'],
  'student-attendance':     ['canView', 'canAdd', 'canEdit'],
  'teacher-attendance':     ['canView', 'canAdd', 'canEdit'],
  'employee-attendance':    ['canView', 'canAdd', 'canEdit'],

  // ── Absent notifications — no delete ──────────────────────────────────────
  'absent-email':           ['canView', 'canAdd'],
  'add-absent-email':       ['canView', 'canAdd'],
  'absent-sms':             ['canView', 'canAdd'],

  // ── Exam — mixed ─────────────────────────────────────────────────────────
  'mark-sheet':             ['canView', 'canAdd', 'canEdit'],   // no delete
  'manage-mark':            ['canView', 'canAdd', 'canEdit'],   // no delete
  'mark-send-email':        ['canView', 'canAdd'],
  'mark-send-email-create': ['canView', 'canAdd'],
  'mark-send-sms':          ['canView', 'canAdd'],
  'mark-send-sms-create':   ['canView', 'canAdd'],
  'exam-final-result':      ['canView', 'canAdd', 'canEdit'],   // no delete
  'exam-result':            ['canView', 'canAdd', 'canEdit'],   // no delete
  'exam-term-result':       ['canView', 'canAdd', 'canEdit'],   // no delete
  'result-card':            ['canView'],                        // view only
  'result-email':           ['canView', 'canEdit'],             // view + edit
  'result-email-create':    ['canView', 'canEdit'],
  'result-sms':             ['canView', 'canAdd', 'canEdit', 'canDelete'], // full
  'result-sms-create':      ['canView', 'canAdd', 'canEdit', 'canDelete'],
  'merit-list':             ['canView'],                        // view only

  // ── Reports — view only ───────────────────────────────────────────────────
  'accounting-balance-report':        ['canView'],
  'daily-statement-report':           ['canView'],
  'daily-transaction-report':         ['canView'],
  'due-fee-report':                   ['canView'],
  'employee-attendance-report':       ['canView'],
  'employee-yearly-attendance-report':['canView'],
  'exam-result-report':               ['canView'],
  'expenditure-report':               ['canView'],
  'fee-collection-report':            ['canView'],
  'income-report':                    ['canView'],
  'invoice-report':                   ['canView'],
  'library-report':                   ['canView'],
  'payroll-report':                   ['canView'],
  'student-activity-report':          ['canView'],
  'student-attendance-report':        ['canView'],
  'student-invoice-report':           ['canView'],
  'student-report':                   ['canView'],
  'student-yearly-attendance-report': ['canView'],
  'teacher-attendance-report':        ['canView'],
  'teacher-yearly-attendance-report': ['canView'],
  'asset-report':                     ['canView'],

  // ── Salary / Payroll — no delete ─────────────────────────────────────────
  'salary-history':         ['canView'],                       // view only
  'salary-payment':         ['canView', 'canAdd', 'canEdit'],  // no delete

  // ── Accounting — mixed ────────────────────────────────────────────────────
  'discount':               ['canView', 'canAdd', 'canEdit'],  // no delete
  'due-receipt':            ['canView'],                       // view only
  'paid-receipt':           ['canView'],                       // view only

  // ── Certificate — mixed ───────────────────────────────────────────────────
  'generate-certificate':   ['canView'],                       // view only
  'admit-card-setting':     ['canView', 'canAdd', 'canEdit'],  // no delete
  'admit-card-setting-create': ['canView', 'canAdd', 'canEdit'],
  'id-card-setting':        ['canView', 'canAdd', 'canEdit'],

  // ── Bulk / Import actions — no delete ────────────────────────────────────
  'bulk-admission':         ['canView', 'canAdd'],

  // ── Non-member reports — view only ───────────────────────────────────────
  'non-hostel-member':      ['canView'],
  'non-library-members':    ['canView'],
  'non-transport-member':   ['canView'],

  // ── Subscription (read-heavy) ─────────────────────────────────────────────
  'subscription-faq':       ['canView', 'canAdd', 'canEdit', 'canDelete'],
  'subscription-plans':     ['canView', 'canAdd', 'canEdit', 'canDelete'],
  'subscription-settings':  ['canView', 'canAdd', 'canEdit'],  // no delete
  'subscription-slider':    ['canView', 'canAdd', 'canEdit', 'canDelete'],
}

// Returns the allowed action list for a slug, defaulting to full CRUD.
const getAllowedActions = (slug) =>
  SLUG_ALLOWED_ACTIONS[slug] ?? ['canView', 'canAdd', 'canEdit', 'canDelete']

const RolePermissionSetting = ({ role: propRole, schoolId: propSchoolId, onNavigate }) => {
  const [schools, setSchools] = useState([])
  const [modules, setModules] = useState([])
  const [permissions, setPermissions] = useState({})
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { roleName, schoolId, configError } = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const resolvedRole = propRole || urlParams.get('role') || sessionStorage.getItem('rbac_selected_role')
    const resolvedSchoolId = propSchoolId || urlParams.get('schoolId') || sessionStorage.getItem('rbac_selected_school_id')
    const normalizedRole = String(resolvedRole || '').trim().toUpperCase()

    return {
      roleName: resolvedRole || '',
      schoolId: normalizedRole === 'SUPER_ADMIN' ? null : (resolvedSchoolId ? Number(resolvedSchoolId) : null),
      configError: resolvedRole ? '' : 'No role specified.',
    }
  }, [propRole, propSchoolId])

  // Fetch data
  useEffect(() => {
    if (!roleName || configError) return

    const loadData = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [modulesData, permissionsData, schoolsData] = await Promise.all([
          fetchModulesWithFunctions(),
          fetchRolePagePermissions(roleName, schoolId),
          fetchSchoolsLookup().catch(() => [])
        ])

        setModules(Array.isArray(modulesData) ? modulesData : [])
        setSchools(Array.isArray(schoolsData) ? schoolsData : [])

        // Convert backend list of permissions into a dictionary [slug]: { canView, canAdd, etc }
        const permDict = {}
        if (Array.isArray(permissionsData)) {
          permissionsData.forEach((item) => {
            permDict[item.slug] = {
              canView: item.canView || false,
              canAdd: item.canAdd || false,
              canEdit: item.canEdit || false,
              canDelete: item.canDelete || false
            }
          })
        }
        setPermissions(permDict)
      } catch (err) {
        setError(err.message || 'Failed to load permissions matrix')
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [configError, roleName, schoolId])

  // Lookup School Name
  const schoolName = useMemo(() => {
    if (!schoolId) return ''
    const match = schools.find((s) => Number(s.id) === schoolId)
    return match ? match.schoolName : `School (ID: ${schoolId})`
  }, [schoolId, schools])

  // Handle single checkbox toggle
  const handleToggle = (slug, action) => {
    // Block toggling actions that are not allowed for this slug
    if (!getAllowedActions(slug).includes(action)) return

    setPermissions((prev) => {
      const current = prev[slug] || { canView: false, canAdd: false, canEdit: false, canDelete: false }
      const updatedValue = !current[action]

      const updated = {
        ...current,
        [action]: updatedValue
      }

      // Safeguard: If view is toggled off, we also turn off add, edit, delete
      if (action === 'canView' && !updatedValue) {
        updated.canAdd = false
        updated.canEdit = false
        updated.canDelete = false
      }

      // Safeguard: If add, edit, or delete is toggled on, view must also be toggled on
      if ((action === 'canAdd' || action === 'canEdit' || action === 'canDelete') && updatedValue) {
        updated.canView = true
      }

      return {
        ...prev,
        [slug]: updated
      }
    })
  }

  // Row-wide actions
  const toggleRowAll = (slug, status) => {
    const allowed = getAllowedActions(slug)
    setPermissions((prev) => ({
      ...prev,
      [slug]: {
        canView:   allowed.includes('canView')   ? status : false,
        canAdd:    allowed.includes('canAdd')    ? status : false,
        canEdit:   allowed.includes('canEdit')   ? status : false,
        canDelete: allowed.includes('canDelete') ? status : false,
      }
    }))
  }

  // Module-wide actions
  const toggleModuleColumn = (moduleFunctions, action, status) => {
    setPermissions((prev) => {
      const next = { ...prev }
      moduleFunctions.forEach((func) => {
        const slug = func.slug
        // Skip if this action is not allowed for this slug
        if (!getAllowedActions(slug).includes(action)) return

        const current = next[slug] || { canView: false, canAdd: false, canEdit: false, canDelete: false }
        
        const updated = {
          ...current,
          [action]: status
        }

        // Apply same safeguards
        if (action === 'canView' && !status) {
          updated.canAdd = false
          updated.canEdit = false
          updated.canDelete = false
        }
        if ((action === 'canAdd' || action === 'canEdit' || action === 'canDelete') && status) {
          updated.canView = true
        }

        next[slug] = updated
      })
      return next
    })
  }

  const toggleModuleAll = (moduleFunctions, status) => {
    setPermissions((prev) => {
      const next = { ...prev }
      moduleFunctions.forEach((func) => {
        const allowed = getAllowedActions(func.slug)
        next[func.slug] = {
          canView:   allowed.includes('canView')   ? status : false,
          canAdd:    allowed.includes('canAdd')    ? status : false,
          canEdit:   allowed.includes('canEdit')   ? status : false,
          canDelete: allowed.includes('canDelete') ? status : false,
        }
      })
      return next
    })
  }

  // Matrix-wide bulk actions
  const toggleMatrixAll = (status) => {
    setPermissions((prev) => {
      const next = { ...prev }
      modules.forEach((mod) => {
        if (Array.isArray(mod.functions)) {
          mod.functions.forEach((func) => {
            const allowed = getAllowedActions(func.slug)
            next[func.slug] = {
              canView:   allowed.includes('canView')   ? status : false,
              canAdd:    allowed.includes('canAdd')    ? status : false,
              canEdit:   allowed.includes('canEdit')   ? status : false,
              canDelete: allowed.includes('canDelete') ? status : false,
            }
          })
        }
      })
      return next
    })
  }

  const toggleMatrixColumn = (action, status) => {
    setPermissions((prev) => {
      const next = { ...prev }
      modules.forEach((mod) => {
        if (Array.isArray(mod.functions)) {
          mod.functions.forEach((func) => {
            const slug = func.slug
            // Skip if this action is not allowed for this slug
            if (!getAllowedActions(slug).includes(action)) return

            const current = next[slug] || { canView: false, canAdd: false, canEdit: false, canDelete: false }
            
            const updated = {
              ...current,
              [action]: status
            }

            if (action === 'canView' && !status) {
              updated.canAdd = false
              updated.canEdit = false
              updated.canDelete = false
            }
            if ((action === 'canAdd' || action === 'canEdit' || action === 'canDelete') && status) {
              updated.canView = true
            }

            next[slug] = updated
          })
        }
      })
      return next
    })
  }

  // Save permissions
  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')
    try {
      // Build API request payload list.
      // Clamp any disallowed action to false before sending so stale state
      // never writes a disallowed true value to the backend.
      const list = []
      
      modules.forEach((mod) => {
        if (Array.isArray(mod.functions)) {
          mod.functions.forEach((func) => {
            const perm = permissions[func.slug] || { canView: false, canAdd: false, canEdit: false, canDelete: false }
            const allowed = getAllowedActions(func.slug)
            list.push({
              slug:      func.slug,
              canView:   allowed.includes('canView')   ? perm.canView   : false,
              canAdd:    allowed.includes('canAdd')    ? perm.canAdd    : false,
              canEdit:   allowed.includes('canEdit')   ? perm.canEdit   : false,
              canDelete: allowed.includes('canDelete') ? perm.canDelete : false,
            })
          })
        }
      })

      await saveRolePagePermissions(roleName, list, schoolId)
      
      setSuccess('Permissions saved successfully!')
      // Dispatch refresh event to update active layout permissions
      window.dispatchEvent(new Event('sm:auth-refresh'))
      
      // Auto clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save permissions')
    } finally {
      setIsSaving(false)
    }
  }

  if (configError) {
    return (
      <div className="role-perm-setting-page">
        <button
          type="button"
          className="role-perm-back-btn"
          onClick={() => {
            if (onNavigate) onNavigate('user-role-acl')
          }}
        >
          <i className="ri-arrow-left-line"></i> Back to User Roles
        </button>
        <div className="alert alert-danger mb-4">{configError}</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="role-perm-loading-container">
        <div className="role-perm-spinner"></div>
        <h3>Loading CRUD matrix permissions...</h3>
      </div>
    )
  }

  return (
    <div className="role-perm-setting-page">
      <button 
        type="button" 
        className="role-perm-back-btn" 
        onClick={() => {
          if (onNavigate) onNavigate('user-role-acl')
        }}
      >
        <i className="ri-arrow-left-line"></i> Back to User Roles
      </button>

      <div className="role-perm-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-24">
        <div className="role-perm-title-area">
          <h2 className="fw-semibold h5 mb-0 text-primary-light">CRUD Permission Matrix</h2>
          <div className="text-secondary-light">Configure page-level CRUD accessibility rights.</div>
        </div>
        <div className="d-flex align-items-center gap-12">
          {schoolId ? (
            <span className="px-12 py-6 bg-success-100 text-success-600 fw-semibold text-xs rounded d-flex align-items-center gap-1">
              <i className="ri-school-line"></i> Scope: {schoolName}
            </span>
          ) : (
            <span className="px-12 py-6 bg-primary-100 text-primary-600 fw-semibold text-xs rounded d-flex align-items-center gap-1">
              <i className="ri-global-line"></i> Scope: Global Default Template
            </span>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}
      {success && <div className="alert alert-success mb-4">{success}</div>}

      <div className="role-perm-meta-card">
        <div className="role-perm-meta-item">
          <div className="role-perm-meta-label">Selected Role</div>
          <div className="role-perm-meta-value">{roleName}</div>
        </div>

        <div className="role-perm-meta-item">
          <div className="role-perm-meta-label">Scoping Level</div>
          <div className="role-perm-meta-value">
            {schoolId ? (
              <>
                <span className="role-perm-badge school">School Scope</span>
                <span className="fs-6 text-secondary-light">for {schoolName}</span>
              </>
            ) : (
              <span className="role-perm-badge global">Global Default Template</span>
            )}
          </div>
        </div>

        <div className="role-perm-meta-item">
          <div className="role-perm-meta-label">Actions</div>
          <button 
            type="button" 
            className="role-perm-btn-primary btn-sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Matrix'}
          </button>
        </div>
      </div>

      {/* Matrix Bulk Control Options */}
      <div className="role-perm-bulk-actions">
        <span className="role-perm-bulk-label"><i className="ri-list-settings-line"></i> Global Matrix Controls:</span>
        <button type="button" className="role-perm-bulk-btn" onClick={() => toggleMatrixAll(true)}>
          Check All
        </button>
        <button type="button" className="role-perm-bulk-btn" onClick={() => toggleMatrixAll(false)}>
          Uncheck All
        </button>
        <button type="button" className="role-perm-bulk-btn" onClick={() => toggleMatrixColumn('canView', true)}>
          Enable View Only
        </button>
        <button type="button" className="role-perm-bulk-btn" onClick={() => toggleMatrixColumn('canAdd', true)}>
          Enable Add
        </button>
        <button type="button" className="role-perm-bulk-btn" onClick={() => toggleMatrixColumn('canEdit', true)}>
          Enable Edit
        </button>
        <button type="button" className="role-perm-bulk-btn" onClick={() => toggleMatrixColumn('canDelete', true)}>
          Enable Delete
        </button>
      </div>

      {/* Modules Matrix list */}
      <div className="role-perm-modules-list">
        {modules.map((mod) => {
          const modFuncs = Array.isArray(mod.functions) ? mod.functions : []
          if (modFuncs.length === 0) return null

          return (
            <div key={mod.id} className="role-perm-module-card">
              <div className="role-perm-module-header">
                <div className="role-perm-module-title">
                  <i className="ri-folder-keyhole-line text-primary"></i>
                  <span>{mod.name}</span>
                  <span className="role-perm-badge">{modFuncs.length} functions</span>
                </div>
                <div className="role-perm-module-actions">
                  <button 
                    type="button" 
                    className="role-perm-row-btn"
                    onClick={() => toggleModuleAll(modFuncs, true)}
                  >
                    Check All in Module
                  </button>
                  <button 
                    type="button" 
                    className="role-perm-row-btn"
                    onClick={() => toggleModuleAll(modFuncs, false)}
                  >
                    Uncheck All
                  </button>
                </div>
              </div>

              <div className="role-perm-table-container">
                <table className="role-perm-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Function / Page</th>
                      <th>
                        <div className="role-perm-col-header-content">
                          <span>View</span>
                          <button 
                            type="button" 
                            className="role-perm-col-toggle" 
                            title="Toggle View for all functions in this module"
                            onClick={() => {
                              // If any function is viewable, we toggle off, otherwise toggle on
                              const anyChecked = modFuncs.some(f => permissions[f.slug]?.canView)
                              toggleModuleColumn(modFuncs, 'canView', !anyChecked)
                            }}
                          >
                            <i className="ri-checkbox-multiple-blank-line"></i>
                          </button>
                        </div>
                      </th>
                      <th>
                        <div className="role-perm-col-header-content">
                          <span>Add</span>
                          <button 
                            type="button" 
                            className="role-perm-col-toggle" 
                            title="Toggle Add for all functions in this module"
                            onClick={() => {
                              const anyChecked = modFuncs.some(f => permissions[f.slug]?.canAdd)
                              toggleModuleColumn(modFuncs, 'canAdd', !anyChecked)
                            }}
                          >
                            <i className="ri-checkbox-multiple-blank-line"></i>
                          </button>
                        </div>
                      </th>
                      <th>
                        <div className="role-perm-col-header-content">
                          <span>Edit</span>
                          <button 
                            type="button" 
                            className="role-perm-col-toggle" 
                            title="Toggle Edit for all functions in this module"
                            onClick={() => {
                              const anyChecked = modFuncs.some(f => permissions[f.slug]?.canEdit)
                              toggleModuleColumn(modFuncs, 'canEdit', !anyChecked)
                            }}
                          >
                            <i className="ri-checkbox-multiple-blank-line"></i>
                          </button>
                        </div>
                      </th>
                      <th>
                        <div className="role-perm-col-header-content">
                          <span>Delete</span>
                          <button 
                            type="button" 
                            className="role-perm-col-toggle" 
                            title="Toggle Delete for all functions in this module"
                            onClick={() => {
                              const anyChecked = modFuncs.some(f => permissions[f.slug]?.canDelete)
                              toggleModuleColumn(modFuncs, 'canDelete', !anyChecked)
                            }}
                          >
                            <i className="ri-checkbox-multiple-blank-line"></i>
                          </button>
                        </div>
                      </th>
                      <th style={{ width: '15%' }}>Quick Row Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modFuncs.map((func) => {
                      const perm = permissions[func.slug] || { canView: false, canAdd: false, canEdit: false, canDelete: false }
                      const allowed = getAllowedActions(func.slug)

                      // "All allowed checked" — used to drive the toggle button label
                      const allAllowedChecked = allowed.every((a) => perm[a])

                      // Reusable cell renderer: shows checkbox if allowed, dash if not
                      const renderCell = (action) => {
                        if (allowed.includes(action)) {
                          return (
                            <td key={action}>
                              <label className="role-perm-checkbox-label">
                                <input
                                  type="checkbox"
                                  className="role-perm-checkbox-input"
                                  checked={perm[action]}
                                  onChange={() => handleToggle(func.slug, action)}
                                />
                                <span className="role-perm-checkbox-custom"></span>
                              </label>
                            </td>
                          )
                        }
                        return (
                          <td key={action} style={{ textAlign: 'center', color: 'var(--text-secondary-light, #aaa)', fontSize: '1rem' }}>
                            —
                          </td>
                        )
                      }

                      return (
                        <tr key={func.id}>
                          <td>
                            <div className="role-perm-func-name">{func.name}</div>
                            <div className="role-perm-func-slug">{func.slug}</div>
                          </td>
                          {renderCell('canView')}
                          {renderCell('canAdd')}
                          {renderCell('canEdit')}
                          {renderCell('canDelete')}
                          <td>
                            <div className="role-perm-row-actions">
                              <button
                                type="button"
                                className="role-perm-row-btn"
                                onClick={() => toggleRowAll(func.slug, !allAllowedChecked)}
                              >
                                {allAllowedChecked ? 'Uncheck All' : 'Check All'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      <div className="role-perm-sticky-footer">
        <button 
          type="button" 
          className="role-perm-btn-secondary"
          onClick={() => {
            if (onNavigate) onNavigate('user-role-acl')
          }}
        >
          Cancel
        </button>
        <button 
          type="button" 
          className="role-perm-btn-primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          <i className="ri-save-line"></i> {isSaving ? 'Saving Changes...' : 'Save Matrix'}
        </button>
      </div>
    </div>
  )
}

export default RolePermissionSetting
