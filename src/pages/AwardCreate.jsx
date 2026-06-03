import React, { useEffect, useMemo, useState } from 'react'
import '../assets/css/addModalShared.css'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchStudentsPage } from '../apis/studentsApi'
import { fetchEmployees } from '../apis/employeesApi'
import { createAward, updateAward } from '../apis/awardsApi'
import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import ManualScopeSelectors from '../components/ManualScopeSelectors'

const EDIT_STORAGE_KEY = 'edit-award-row'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  userType: 'Student',
  winnerId: '',
  title: '',
  gift: '',
  price: '',
  awardDate: new Date().toISOString().slice(0, 10),
  note: '',
}

const FIELD_ICONS = {
  'Head Office': 'ri-government-line',
  'School Name': 'ri-school-line',
  'User Type': 'ri-group-line',
  Winner: 'ri-user-star-line',
  Title: 'ri-medal-line',
  Gift: 'ri-gift-line',
  Price: 'ri-money-dollar-circle-line',
  Date: 'ri-calendar-line',
  Note: 'ri-sticky-note-line',
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
  for (let page = 1; page < totalPages; page += 1) {
    requests.push(fetchStudentsPage(page, 100, { schoolId }))
  }

  const restPages = await Promise.all(requests)
  return restPages.reduce((acc, item) => {
    if (Array.isArray(item?.content)) acc.push(...item.content)
    return acc
  }, [...firstRows])
}

const AwardCreate = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId, headOfficeId: authHeadOfficeId, schoolName: authSchoolName } = useAuth()
  const normalizedRole = normalizeRole(role)
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = normalizedRole === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = normalizedRole === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const currentSchoolOption = useMemo(() => {
    if (!isSchoolAdmin || authSchoolId == null) return null
    return {
      id: authSchoolId,
      schoolName: authSchoolName || `School ${authSchoolId}`,
      headOfficeId: authHeadOfficeId ?? null,
    }
  }, [authHeadOfficeId, authSchoolId, authSchoolName, isSchoolAdmin])

  const [allSchools, setAllSchools] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [winnerOptions, setWinnerOptions] = useState([])
  const [loadingWinners, setLoadingWinners] = useState(false)
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
          userType: parsed.userType || 'Student',
          winnerId: parsed.winnerId != null ? String(parsed.winnerId) : '',
          title: parsed.title || '',
          gift: parsed.gift || '',
          price: parsed.price != null ? String(parsed.price) : '',
          awardDate: parsed.awardDate || new Date().toISOString().slice(0, 10),
          note: parsed.note || '',
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
    const loadSchools = async () => {
      try {
        if (isSchoolAdmin) {
          if (!cancelled) setAllSchools(currentSchoolOption ? [currentSchoolOption] : [])
          return
        }
        const list = await fetchSchoolsLookup()
        if (!cancelled) setAllSchools(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setAllSchools([])
      }
    }
    void loadSchools()
    return () => {
      cancelled = true
    }
  }, [currentSchoolOption, isSchoolAdmin])

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return Array.isArray(manualScope.schoolOptions) ? manualScope.schoolOptions : []
    if (isHeadOfficeAdmin) {
      return allSchools.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return currentSchoolOption ? [currentSchoolOption] : []
    }
    return allSchools
  }, [allSchools, authHeadOfficeId, authSchoolId, currentSchoolOption, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.schoolOptions])

  const currentSchoolId = useMemo(() => {
    if (isSuperAdmin) return form.schoolId || manualScope.selectedSchoolId || ''
    if (isSchoolAdmin) return authSchoolId != null ? String(authSchoolId) : ''
    if (isHeadOfficeAdmin) return form.schoolId || ''
    return form.schoolId || ''
  }, [authSchoolId, form.schoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.selectedSchoolId])

  const currentHeadOfficeId = useMemo(() => {
    if (isSuperAdmin) return form.headOfficeId || manualScope.selectedHeadOfficeId || ''
    if (isHeadOfficeAdmin) return authHeadOfficeId != null ? String(authHeadOfficeId) : ''
    const school = schoolOptions.find((item) => String(item.id) === String(currentSchoolId))
    return school?.headOfficeId != null ? String(school.headOfficeId) : ''
  }, [authHeadOfficeId, currentSchoolId, form.headOfficeId, isHeadOfficeAdmin, isSuperAdmin, manualScope.selectedHeadOfficeId, schoolOptions])

  useEffect(() => {
    if (isSuperAdmin) return
    if (isSchoolAdmin && authSchoolId != null) {
      setForm((prev) => ({ ...prev, schoolId: String(authSchoolId) }))
      return
    }
    if (isHeadOfficeAdmin && !form.schoolId && schoolOptions.length === 1) {
      setForm((prev) => ({ ...prev, schoolId: String(schoolOptions[0].id) }))
    }
  }, [authSchoolId, form.schoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, schoolOptions])

  useEffect(() => {
    if (!currentSchoolId || !form.userType) {
      setWinnerOptions([])
      return undefined
    }

    let cancelled = false
    const loadWinners = async () => {
      setLoadingWinners(true)
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
        setWinnerOptions(mapped.filter((row) => row.id != null && row.label))
      } catch {
        if (!cancelled) setWinnerOptions([])
      } finally {
        if (!cancelled) setLoadingWinners(false)
      }
    }
    void loadWinners()
    return () => {
      cancelled = true
    }
  }, [currentSchoolId, form.userType])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => ({
      ...prev,
      [id]: value,
      ...(id === 'userType' ? { winnerId: '' } : {}),
      ...(id === 'headOfficeId' ? { schoolId: '', winnerId: '' } : {}),
      ...(id === 'schoolId' ? { winnerId: '' } : {}),
    }))
  }

  const handleHeadOfficeChange = (value) => {
    manualScope.setSelectedScope(value, '')
    setForm((prev) => ({ ...prev, headOfficeId: value, schoolId: '', winnerId: '' }))
  }

  const handleSchoolChange = (value) => {
    if (isSuperAdmin) {
      manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value)
    }
    setForm((prev) => ({ ...prev, schoolId: value, winnerId: '' }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const schoolId = currentSchoolId ? Number(currentSchoolId) : null
    const headOfficeId = currentHeadOfficeId ? Number(currentHeadOfficeId) : null

    if (!schoolId) {
      setError('School is required')
      return
    }
    if (!form.userType) {
      setError('User type is required')
      return
    }
    if (!form.winnerId) {
      setError('Winner is required')
      return
    }
    if (!form.title.trim()) {
      setError('Title is required')
      return
    }

    const winnerLabel = winnerOptions.find((item) => String(item.id) === String(form.winnerId))?.label || ''
    const payload = {
      headOfficeId,
      schoolId,
      userType: form.userType,
      winnerId: form.winnerId ? Number(form.winnerId) : null,
      winnerName: winnerLabel,
      title: form.title.trim(),
      gift: form.gift.trim(),
      price: form.price === '' ? null : Number(form.price),
      awardDate: form.awardDate || null,
      note: form.note.trim(),
    }

    try {
      setSaving(true)
      if (initialEditRow?.id != null) {
        await updateAward(initialEditRow.id, payload)
      } else {
        await createAward(payload)
      }
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
      setSuccess('Award saved successfully')
      setTimeout(() => onNavigate?.('manage-award'), 900)
    } catch (err) {
      setError(err?.message || 'Failed to save award')
    } finally {
      setSaving(false)
    }
  }

  const isEditMode = initialEditRow?.id != null

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <h1 className="fw-semibold mb-0 h6 text-primary-light">{isEditMode ? 'Edit Award' : 'Add New Award'}</h1>
        <button className="btn btn-outline-neutral border border-neutral-300 radius-8 text-sm" onClick={() => onNavigate?.('manage-award')}>
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
                <option value="Student">Student</option>
                <option value="Employee">Employee</option>
                <option value="Staff">Staff</option>
              </select>
            </FormField>

            <FormField label="Winner" required>
              <select className="avm-select" id="winnerId" value={form.winnerId} onChange={handleChange} disabled={!currentSchoolId || loadingWinners}>
                <option value="">{loadingWinners ? 'Loading...' : '--Select Winner--'}</option>
                {winnerOptions.map((winner) => (
                  <option key={winner.id} value={String(winner.id)}>
                    {winner.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Title" required>
              <input type="text" className="avm-input" id="title" value={form.title} onChange={handleChange} placeholder="Award Title" />
            </FormField>

            <FormField label="Gift">
              <input type="text" className="avm-input" id="gift" value={form.gift} onChange={handleChange} placeholder="Gift Name" />
            </FormField>

            <FormField label="Price">
              <input type="number" className="avm-input" id="price" value={form.price} onChange={handleChange} placeholder="0.00" />
            </FormField>

            <FormField label="Date" required>
              <input type="date" className="avm-input" id="awardDate" value={form.awardDate} onChange={handleChange} />
            </FormField>

            <FormField label="Note" full>
              <textarea rows={4} className="avm-input avm-textarea" id="note" value={form.note} onChange={handleChange} placeholder="Note" style={{ paddingLeft: '2.5rem' }} />
            </FormField>

            <div className="d-flex justify-content-end gap-12 mt-24 full">
              <button type="button" className="btn btn-outline-neutral px-24 py-12 radius-8" onClick={() => onNavigate?.('manage-award')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-600 px-24 py-12 radius-8" disabled={saving}>
                {saving ? 'Saving...' : 'Save Award'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AwardCreate
