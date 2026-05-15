import { useCallback, useEffect, useMemo, useState } from 'react'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createHoliday, updateHoliday } from '../apis/holidayApi'
import { findSchoolById } from '../utils/schoolScope'
import '../assets/css/addModalShared.css'

const emptyForm = {
  schoolId: '',
  title: '',
  fromDate: '',
  toDate: '',
  note: '',
  isViewOnWeb: '',
}

const readEditRow = () => {
  try {
    const raw = sessionStorage.getItem('edit-holiday-row')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const AddHoliday = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId, schoolName: authSchoolName, headOfficeId: authHeadOfficeId } = useAuth()
  const { activeSchoolId } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = String(role || '').toUpperCase() === 'HEAD_OFFICE_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [initialEditRow] = useState(() => readEditRow())

  const listSchoolId = isSuperAdmin
    ? (activeSchoolId ? String(activeSchoolId) : '')
    : activeSchoolId
      ? String(activeSchoolId)
      : authSchoolId
        ? String(authSchoolId)
        : ''
  const canChooseSchool = isSuperAdmin || isHeadOfficeAdmin
  const isSchoolLocked = !canChooseSchool && !!listSchoolId

  const [form, setForm] = useState(() => (
    initialEditRow
      ? { ...initialEditRow, schoolId: String(initialEditRow.schoolId ?? '') }
      : { ...emptyForm, schoolId: !isSuperAdmin ? listSchoolId : '' }
  ))
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [editingId] = useState(() => (initialEditRow ? initialEditRow.id : null))

  useEffect(() => () => sessionStorage.removeItem('edit-holiday-row'), [])

  const loadSchools = useCallback(async () => {
    try {
      const list = await fetchSchoolsLookup()
      setSchools(Array.isArray(list) ? list : [])
    } catch {
      setSchools([])
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSchools()
  }, [loadSchools])

  useEffect(() => {
    if (!initialEditRow || !isSuperAdmin || schools.length === 0) return
    const school = findSchoolById(schools, initialEditRow.schoolId)
    if (school?.headOfficeId != null) {
      manualScope.setSelectedScope(String(school.headOfficeId), String(initialEditRow.schoolId ?? ''))
    }
  }, [initialEditRow, isSuperAdmin, schools, manualScope])

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.selectedHeadOfficeId ? manualScope.schoolOptions : []
    const filtered = Array.isArray(schools)
      ? schools.filter((school) => {
          if (isHeadOfficeAdmin && authHeadOfficeId != null) {
            return String(school?.headOfficeId ?? '') === String(authHeadOfficeId)
          }
          return true
        })
      : []
    const fallback = listSchoolId && !filtered.some((school) => String(school.id) === listSchoolId) && authSchoolName
      ? [{ id: authSchoolId, schoolName: authSchoolName }]
      : []
    return [...filtered, ...fallback]
  }, [isSuperAdmin, manualScope.schoolOptions, manualScope.selectedHeadOfficeId, schools, isHeadOfficeAdmin, authHeadOfficeId, listSchoolId, authSchoolName, authSchoolId])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm(prev => ({ ...prev, [id]: value }))
  }

  const buildPayload = (f) => ({
    schoolId: f.schoolId ? Number(f.schoolId) : null,
    title: String(f.title || '').trim(),
    fromDate: f.fromDate || null,
    toDate: f.toDate || null,
    note: String(f.note || '').trim(),
    isViewOnWeb: f.isViewOnWeb === 'Yes',
  })

  const validateForm = (f) => {
    if (!f.schoolId) return 'School is required.'
    if (!f.title || !String(f.title).trim()) return 'Title is required.'
    if (!f.fromDate) return 'From date is required.'
    if (!f.toDate) return 'To date is required.'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const validationError = validateForm(form)
    if (validationError) {
      return alert(validationError)
    }
    setLoading(true)
    try {
      const payload = buildPayload(form)
      if (editingId) {
        await updateHoliday(editingId, payload)
      } else {
        await createHoliday(payload)
      }
      setSuccess(true)
      setTimeout(() => onNavigate('holiday'), 1000)
    } catch (err) {
      alert(err.message || 'Error processing request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex align-items-center justify-content-between mb-24">
        <div>
          <h1 className="h6 text-primary-light">{editingId ? 'Edit' : 'Add'} Holiday</h1>
          <span className="text-secondary-light">Holiday / {editingId ? 'Edit' : 'Add'}</span>
        </div>
        <button className="btn btn-light border" onClick={() => onNavigate('holiday')}>Back to List</button>
      </div>

      {success && <div className="alert alert-success">{editingId ? 'Updated' : 'Saved'} successfully! Redirecting...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card h-100">
        <form className="card-body p-24" onSubmit={handleSubmit}>
          <div className="avm-grid">
            {isSuperAdmin ? (
              <div className="avm-field full">
                <ManualScopeSelectors
                  enabled={isSuperAdmin}
                  headOffices={manualScope.headOffices}
                  schoolOptions={schoolOptions}
                  selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                  onHeadOfficeChange={(val) => { manualScope.setSelectedHeadOfficeId(val); setForm(p => ({ ...p, schoolId: '' })) }}
                  selectedSchoolId={form.schoolId}
                  onSchoolChange={(val) => setForm(p => ({ ...p, schoolId: val }))}
                  compact
                />
              </div>
            ) : (
              <div className="avm-field full"><label className="avm-label">School Name <span className="req">*</span></label>
                <select className="avm-select" id="schoolId" value={form.schoolId} onChange={handleChange} disabled={isSchoolLocked}>
                  <option value="">--Select School--</option>
                  {schoolOptions.map((school) => (
                    <option key={String(school.id)} value={String(school.id)}>{school.schoolName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="avm-field full"><label className="avm-label">Title <span className="req">*</span></label>
              <input type="text" className="avm-input" id="title" value={form.title} onChange={handleChange} placeholder="Enter title" />
            </div>

            <div className="avm-field"><label className="avm-label">From Date <span className="req">*</span></label>
              <input type="date" className="avm-input" id="fromDate" value={form.fromDate} onChange={handleChange} />
            </div>

            <div className="avm-field"><label className="avm-label">To Date <span className="req">*</span></label>
              <input type="date" className="avm-input" id="toDate" value={form.toDate} onChange={handleChange} />
            </div>

            <div className="avm-field full"><label className="avm-label">Note</label>
              <textarea rows="4" className="avm-input avm-textarea" id="note" value={form.note} onChange={handleChange} placeholder="Enter note" />
            </div>

            <div className="avm-field full"><label className="avm-label">Is View on Web?</label>
              <select className="avm-select" id="isViewOnWeb" value={form.isViewOnWeb} onChange={handleChange}>
                <option value="">--Select--</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-24">
            <button type="submit" className="btn btn-primary-600" disabled={loading}>
              {loading ? 'Processing...' : (editingId ? 'Update' : 'Submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddHoliday
