import { useEffect, useMemo, useState } from 'react'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createGallery, updateGallery } from '../apis/galleryApi'
import { findSchoolById } from '../utils/schoolScope'
import '../assets/css/addModalShared.css'

const emptyForm = {
  schoolId: '',
  title: '',
  note: '',
  isViewOnWeb: '',
}

const readEditRow = () => {
  try {
    const raw = sessionStorage.getItem('edit-gallery-row')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const AddGallery = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [initialEditRow] = useState(() => readEditRow())
  const [schools, setSchools] = useState([])
  const listSchoolId = isSuperAdmin
    ? (activeSchoolId ? String(activeSchoolId) : '')
    : activeSchoolId
      ? String(activeSchoolId)
      : authSchoolId
        ? String(authSchoolId)
        : ''

  const [form, setForm] = useState(() => (
    initialEditRow
      ? { 
          ...initialEditRow, 
          schoolId: initialEditRow.schoolId ? String(initialEditRow.schoolId) : '',
          isViewOnWeb: initialEditRow.isViewOnWeb ? 'Yes' : 'No'
        }
      : { ...emptyForm, schoolId: !isSuperAdmin ? listSchoolId : '' }
  ))
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [editingId] = useState(() => (initialEditRow ? initialEditRow.id : null))

  useEffect(() => {
    let cancelled = false
    const loadSchools = async () => {
      try {
        const list = await fetchSchoolsLookup()
        if (!cancelled) setSchools(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setSchools([])
      }
    }
    void loadSchools()
    return () => {
      cancelled = true
    }
  }, [])

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.selectedHeadOfficeId ? manualScope.schoolOptions : []
    return contextSchoolOptions || []
  }, [isSuperAdmin, manualScope.schoolOptions, contextSchoolOptions, manualScope.selectedHeadOfficeId])

  useEffect(() => () => sessionStorage.removeItem('edit-gallery-row'), [])

  useEffect(() => {
    if (!initialEditRow || !isSuperAdmin || schools.length === 0) return
    const school = findSchoolById(schools, initialEditRow.schoolId)
    if (school?.headOfficeId != null) {
      manualScope.setSelectedScope(String(school.headOfficeId), String(initialEditRow.schoolId ?? ''))
    }
  }, [initialEditRow, isSuperAdmin, schools, manualScope])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.schoolId || !form.title || !form.isViewOnWeb) return alert('Fill all required fields')
    setLoading(true)
    try {
      const payload = {
        schoolId: form.schoolId ? Number(form.schoolId) : null,
        title: form.title,
        note: form.note,
        isViewOnWeb: form.isViewOnWeb === 'Yes',
      }
      if (editingId) {
        await updateGallery(editingId, payload)
      } else {
        await createGallery(payload)
      }
      setSuccess(true)
      setTimeout(() => onNavigate('gallery'), 1000)
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
          <h1 className="h6 text-primary-light">{editingId ? 'Edit' : 'Add'} Gallery</h1>
          <span className="text-secondary-light">Gallery / {editingId ? 'Edit' : 'Add'}</span>
        </div>
        <button className="btn btn-light border" onClick={() => onNavigate('gallery')}>Back to List</button>
      </div>

      {success && <div className="alert alert-success">{editingId ? 'Updated' : 'Saved'} successfully! Redirecting...</div>}

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
              <div className="avm-field full">
                <label className="avm-label">School Name <span className="req">*</span></label>
                <select className="avm-select" id="schoolId" value={form.schoolId} onChange={handleChange}>
                  <option value="">--Select School--</option>
                  {schoolOptions.map((school) => (
                    <option key={String(school.id)} value={String(school.id)}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="avm-field full">
              <label className="avm-label">Title <span className="req">*</span></label>
              <input type="text" id="title" className="avm-input" value={form.title} onChange={handleChange} placeholder="Enter title" />
            </div>

            <div className="avm-field full">
              <label className="avm-label">Note</label>
              <textarea id="note" rows="4" className="avm-input" value={form.note} onChange={handleChange} placeholder="Enter note" />
            </div>

            <div className="avm-field full">
              <label className="avm-label">Is View on Web? <span className="req">*</span></label>
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

export default AddGallery
