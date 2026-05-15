import { useState, useEffect } from 'react'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useSchool } from '../context/useSchool'
import { useAuth } from '../context/useAuth'
import { findSchoolById } from '../utils/schoolScope'
import { createPostalDispatch, updatePostalDispatch } from '../apis/postalApi'
import '../assets/css/addModalShared.css'

const emptyForm = {
  schoolId: '',
  toTitle: '',
  referenceNo: '',
  address: '',
  fromTitle: '',
  date: new Date().toISOString().split('T')[0],
  note: '',
}

const readEditRow = () => {
  try {
    const raw = sessionStorage.getItem('edit-postal-dispatch-row')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const AddPostalDispatch = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const listSchoolId = isSuperAdmin ? '' : activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
  const schoolOptions = isSuperAdmin ? (manualScope.selectedHeadOfficeId ? manualScope.schoolOptions : []) : contextSchoolOptions
  const initialEditRow = readEditRow()
  
  const [form, setForm] = useState(() => (
    initialEditRow
      ? { ...initialEditRow, schoolId: String(initialEditRow.schoolId ?? '') }
      : { ...emptyForm, schoolId: !isSuperAdmin ? listSchoolId : '' }
  ))
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [editingId] = useState(() => (initialEditRow ? initialEditRow.id : null))

  useEffect(() => () => sessionStorage.removeItem('edit-postal-dispatch-row'), [])

  useEffect(() => {
    if (!isSuperAdmin || !initialEditRow || contextSchoolOptions.length === 0) return
    const school = findSchoolById(contextSchoolOptions, initialEditRow.schoolId)
    if (school?.headOfficeId != null) {
      manualScope.setSelectedScope(String(school.headOfficeId), String(initialEditRow.schoolId ?? ''))
    }
  }, [contextSchoolOptions, initialEditRow, isSuperAdmin, manualScope])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.schoolId || !form.toTitle || !form.fromTitle || !form.date) return alert('Fill all required fields')
    setLoading(true)
    try {
      const payload = { ...form, schoolId: Number(form.schoolId) }
      if (editingId) {
        await updatePostalDispatch(editingId, payload)
      } else {
        await createPostalDispatch(payload)
      }
      setSuccess(true)
      setTimeout(() => onNavigate('postal-dispatch'), 1000)
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
          <h1 className="h6 text-primary-light">{editingId ? 'Edit' : 'Add'} Postal Dispatch</h1>
          <span className="text-secondary-light">Postal Dispatch / {editingId ? 'Edit' : 'Add'}</span>
        </div>
        <button className="btn btn-light border" onClick={() => onNavigate('postal-dispatch')}>Back to List</button>
      </div>

      {success && <div className="alert alert-success">{editingId ? 'Updated' : 'Saved'} successfully! Redirecting...</div>}

      <div className="card h-100">
        <form className="card-body p-24" onSubmit={handleSubmit}>
          <div className="avm-grid">
            {isSuperAdmin && (
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
            )}
            <div className="avm-field"><label className="avm-label">To Title <span className="req">*</span></label>
              <input type="text" id="toTitle" className="avm-input" value={form.toTitle} onChange={handleChange} />
            </div>
            <div className="avm-field"><label className="avm-label">Reference</label>
              <input type="text" id="referenceNo" className="avm-input" value={form.referenceNo} onChange={handleChange} />
            </div>
            <div className="avm-field full"><label className="avm-label">Address <span className="req">*</span></label>
              <textarea id="address" rows="3" className="avm-input" value={form.address} onChange={handleChange} />
            </div>
            <div className="avm-field"><label className="avm-label">From Title <span className="req">*</span></label>
              <input type="text" id="fromTitle" className="avm-input" value={form.fromTitle} onChange={handleChange} />
            </div>
            <div className="avm-field"><label className="avm-label">Dispatch Date <span className="req">*</span></label>
              <input type="date" id="date" className="avm-input" value={form.date} onChange={handleChange} />
            </div>
            <div className="avm-field full"><label className="avm-label">Note</label>
              <textarea id="note" rows="3" className="avm-input" value={form.note} onChange={handleChange} />
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

export default AddPostalDispatch
