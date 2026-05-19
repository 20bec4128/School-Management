import React, { useEffect, useMemo, useState } from 'react'
import '../assets/css/addModalShared.css'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchEmployees } from '../apis/employeesApi'
import { fetchStudentsPage } from '../apis/studentsApi'
import { createTodoTask, updateTodoTask } from '../apis/todoTasksApi'
import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import ManualScopeSelectors from '../components/ManualScopeSelectors'

const EDIT_STORAGE_KEY = 'edit-todo-row'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  userType: 'Staff',
  assignToId: '',
  title: '',
  todoDate: new Date().toISOString().slice(0, 10),
  workStatus: 'Pending',
  description: '',
  comment: '',
}

const FIELD_ICONS = {
  'Head Office': 'ri-government-line',
  'School Name': 'ri-school-line',
  'User Type': 'ri-group-line',
  'Assign To': 'ri-user-line',
  Title: 'ri-text',
  Date: 'ri-calendar-line',
  'Work Status': 'ri-list-check-2',
  Description: 'ri-article-line',
  Comment: 'ri-chat-1-line',
}

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label} {required && <span className="text-danger-600">*</span>}
      </label>
      <div className="avm-input-with-icon" style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#667085', zIndex: 1 }}>
          <i className={icon} />
        </span>
        {children}
      </div>
    </div>
  )
}

const fetchAllStudents = async (schoolId) => {
  if (!schoolId) return []
  const firstPage = await fetchStudentsPage(0, 100, { schoolId })
  const firstRows = Array.isArray(firstPage?.content) ? firstPage.content : []
  const totalPages = Number.isFinite(firstPage?.totalPages) ? firstPage.totalPages : 1
  if (totalPages <= 1) return firstRows
  const requests = []
  for (let page = 1; page < totalPages; page += 1) requests.push(fetchStudentsPage(page, 100, { schoolId }))
  const rest = await Promise.all(requests)
  return rest.reduce((acc, item) => {
    if (Array.isArray(item?.content)) acc.push(...item.content)
    return acc
  }, [...firstRows])
}

const TodoCreate = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId, headOfficeId: authHeadOfficeId, schoolName: authSchoolName } = useAuth()
  const normalizedRole = normalizeRole(role)
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = normalizedRole === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = normalizedRole === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [allSchools, setAllSchools] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [assignOptions, setAssignOptions] = useState([])
  const [loadingAssignOptions, setLoadingAssignOptions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [initialEditRow, setInitialEditRow] = useState(null)

  useEffect(() => {
    const raw = sessionStorage.getItem(EDIT_STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        setInitialEditRow(parsed)
        setForm({
          headOfficeId: parsed.headOfficeId != null ? String(parsed.headOfficeId) : '',
          schoolId: parsed.schoolId != null ? String(parsed.schoolId) : '',
          userType: parsed.userType || 'Staff',
          assignToId: parsed.assignToId != null ? String(parsed.assignToId) : '',
          title: parsed.title || '',
          todoDate: parsed.todoDate || new Date().toISOString().slice(0, 10),
          workStatus: parsed.workStatus || 'Pending',
          description: parsed.description || '',
          comment: parsed.comment || '',
        })
        if (isSuperAdmin && parsed.headOfficeId != null && parsed.schoolId != null) {
          manualScope.setSelectedScope(String(parsed.headOfficeId), String(parsed.schoolId))
        }
      }
    } catch {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    }
  }, [isSuperAdmin, manualScope])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const list = await fetchSchoolsLookup()
        if (!cancelled) setAllSchools(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setAllSchools([])
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return Array.isArray(manualScope.schoolOptions) ? manualScope.schoolOptions : []
    if (isHeadOfficeAdmin) return allSchools.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    if (isSchoolAdmin) return allSchools.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    return allSchools
  }, [allSchools, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.schoolOptions])

  const currentSchoolId = useMemo(() => {
    if (isSuperAdmin) return form.schoolId || manualScope.selectedSchoolId || ''
    if (isSchoolAdmin) return authSchoolId != null ? String(authSchoolId) : ''
    return form.schoolId || ''
  }, [authSchoolId, form.schoolId, isSchoolAdmin, isSuperAdmin, manualScope.selectedSchoolId])

  const currentHeadOfficeId = useMemo(() => {
    if (isSuperAdmin) return form.headOfficeId || manualScope.selectedHeadOfficeId || ''
    if (isHeadOfficeAdmin) return authHeadOfficeId != null ? String(authHeadOfficeId) : ''
    const school = schoolOptions.find((item) => String(item.id) === String(currentSchoolId))
    return school?.headOfficeId != null ? String(school.headOfficeId) : ''
  }, [authHeadOfficeId, currentSchoolId, form.headOfficeId, isHeadOfficeAdmin, isSuperAdmin, manualScope.selectedHeadOfficeId, schoolOptions])

  useEffect(() => {
    if (isSchoolAdmin && authSchoolId != null) setForm((prev) => ({ ...prev, schoolId: String(authSchoolId) }))
  }, [authSchoolId, isSchoolAdmin])

  useEffect(() => {
    if (!currentSchoolId || !form.userType) {
      setAssignOptions([])
      return undefined
    }

    let cancelled = false
    const loadAssignOptions = async () => {
      setLoadingAssignOptions(true)
      try {
        const normalizedUserType = String(form.userType || '').toLowerCase()
        const rows = normalizedUserType.includes('student')
          ? await fetchAllStudents(currentSchoolId)
          : await fetchEmployees({ schoolId: currentSchoolId })
        if (cancelled) return
        const mapped = (Array.isArray(rows) ? rows : []).map((row) => ({
          id: row?.id,
          label: row?.name || row?.studentName || row?.employeeName || String(row?.id ?? ''),
        }))
        setAssignOptions(mapped.filter((row) => row.id != null && row.label))
      } catch {
        if (!cancelled) setAssignOptions([])
      } finally {
        if (!cancelled) setLoadingAssignOptions(false)
      }
    }
    void loadAssignOptions()
    return () => {
      cancelled = true
    }
  }, [currentSchoolId, form.userType])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => ({
      ...prev,
      [id]: value,
      ...(id === 'userType' ? { assignToId: '' } : {}),
      ...(id === 'headOfficeId' ? { schoolId: '', assignToId: '' } : {}),
      ...(id === 'schoolId' ? { assignToId: '' } : {}),
    }))
  }

  const handleHeadOfficeChange = (value) => {
    manualScope.setSelectedScope(value, '')
    setForm((prev) => ({ ...prev, headOfficeId: value, schoolId: '', assignToId: '' }))
  }

  const handleSchoolChange = (value) => {
    if (isSuperAdmin) manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value)
    setForm((prev) => ({ ...prev, schoolId: value, assignToId: '' }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const schoolId = currentSchoolId ? Number(currentSchoolId) : null
    const headOfficeId = currentHeadOfficeId ? Number(currentHeadOfficeId) : null
    const assignToId = form.assignToId ? Number(form.assignToId) : null

    if (!schoolId) return setError('School is required')
    if (!form.userType) return setError('User type is required')
    if (!assignToId) return setError('Assign To is required')
    if (!form.title.trim()) return setError('Title is required')
    if (!form.workStatus) return setError('Work status is required')

    const assignToName = assignOptions.find((item) => String(item.id) === String(form.assignToId))?.label || ''
    const payload = {
      headOfficeId,
      schoolId,
      userType: form.userType,
      assignToId,
      assignToName,
      title: form.title.trim(),
      todoDate: form.todoDate || null,
      workStatus: form.workStatus,
      description: form.description.trim(),
      comment: form.comment.trim(),
    }

    try {
      setSaving(true)
      if (initialEditRow?.id != null) {
        await updateTodoTask(initialEditRow.id, payload)
      } else {
        await createTodoTask(payload)
      }
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
      setSuccess('Todo saved successfully')
      setTimeout(() => onNavigate?.('manage-todo'), 900)
    } catch (err) {
      setError(err?.message || 'Failed to save todo')
    } finally {
      setSaving(false)
    }
  }

  const isEditMode = initialEditRow?.id != null

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <h1 className="fw-semibold mb-0 h6 text-primary-light">{isEditMode ? 'Edit Todo' : 'Add New Todo'}</h1>
        <button className="btn btn-outline-neutral border border-neutral-300 radius-8 text-sm" onClick={() => onNavigate?.('manage-todo')}>
          <i className="ri-arrow-left-line" /> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {error ? <div className="alert alert-danger">{error}</div> : null}
          {success ? <div className="alert alert-success">{success}</div> : null}
          <form className="avm-grid" onSubmit={handleSave}>
            {isSuperAdmin ? (
              <ManualScopeSelectors
                enabled
                headOffices={manualScope.headOffices}
                schoolOptions={manualScope.schoolOptions}
                selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                onHeadOfficeChange={handleHeadOfficeChange}
                selectedSchoolId={manualScope.selectedSchoolId}
                onSchoolChange={handleSchoolChange}
              />
            ) : (
              <>
                <FormField label="Head Office" required>
                  <input className="avm-input" value={currentHeadOfficeId || ''} disabled />
                </FormField>
                <FormField label="School Name" required>
                  <select className="avm-select" value={form.schoolId} onChange={handleChange} id="schoolId" disabled={isSchoolAdmin}>
                    <option value="">--Select School--</option>
                    {schoolOptions.map((school) => (
                      <option key={school.id} value={String(school.id)}>
                        {school.schoolName}
                      </option>
                    ))}
                  </select>
                </FormField>
              </>
            )}

            <FormField label="User Type" required>
              <select className="avm-select" id="userType" value={form.userType} onChange={handleChange}>
                <option value="Staff">Staff</option>
                <option value="Teacher">Teacher</option>
                <option value="Student">Student</option>
              </select>
            </FormField>

            <FormField label="Assign To" required>
              <select className="avm-select" id="assignToId" value={form.assignToId} onChange={handleChange} disabled={!currentSchoolId || loadingAssignOptions}>
                <option value="">{loadingAssignOptions ? 'Loading...' : '--Select--'}</option>
                {assignOptions.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Title" required>
              <input type="text" className="avm-input" id="title" placeholder="Todo Title" value={form.title} onChange={handleChange} />
            </FormField>

            <FormField label="Date" required>
              <input type="date" className="avm-input" id="todoDate" value={form.todoDate} onChange={handleChange} />
            </FormField>

            <FormField label="Work Status" required>
              <select className="avm-select" id="workStatus" value={form.workStatus} onChange={handleChange}>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </FormField>

            <FormField label="Description" full>
              <textarea rows={4} className="avm-input avm-textarea" id="description" placeholder="Enter description" value={form.description} onChange={handleChange} style={{ paddingLeft: '2.5rem' }} />
            </FormField>

            <FormField label="Comment" full>
              <textarea rows={4} className="avm-input avm-textarea" id="comment" placeholder="Enter comment" value={form.comment} onChange={handleChange} style={{ paddingLeft: '2.5rem' }} />
            </FormField>

            <div className="d-flex justify-content-end gap-12 mt-24 full">
              <button type="button" className="btn btn-outline-neutral px-24 py-12 radius-8" onClick={() => onNavigate?.('manage-todo')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-600 px-24 py-12 radius-8" disabled={saving}>
                {saving ? 'Saving...' : 'Save Todo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TodoCreate
