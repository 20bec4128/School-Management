import { useEffect, useMemo, useState } from 'react'
import WizardPopup from './WizardPopup'
import { createDepartment } from '../apis/departmentsApi'
import ManualScopeSelectors from './ManualScopeSelectors'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'

const emptyForm = { headOfficeId: 'Select', schoolId: '', departmentTitle: '', isViewOnWeb: 'Yes', status: 'Active', note: '' }

const iconSpan = (cls) => (
  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#667085', fontSize: '0.95rem', lineHeight: 1, pointerEvents: 'none', zIndex: 1 }}>
    <i className={cls}></i>
  </span>
)

const AddDepartmentModal = ({ open, onClose, schoolsLookup = [], headOfficesLookup = [], onSuccess }) => {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { role, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId } = useSchool()
  const roleUpper = String(role || '').toUpperCase()
  const isSuperAdmin = roleUpper === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = roleUpper === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = roleUpper === 'SCHOOL_ADMIN'
  const scopedSchoolId = activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
  const scopedSchoolName = authSchoolName || ''

  const headOfficeOptions = useMemo(() => {
    const items = (Array.isArray(headOfficesLookup) ? headOfficesLookup : [])
      .map((row) => ({ id: row?.id, name: row?.name || row?.headOfficeName || '' }))
      .filter((row) => row.id != null && row.name)
    if (isHeadOfficeAdmin && authHeadOfficeId != null && authHeadOfficeName) {
      const exists = items.some((row) => String(row.id) === String(authHeadOfficeId))
      if (!exists) items.unshift({ id: authHeadOfficeId, name: authHeadOfficeName })
    }
    return items.sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [authHeadOfficeId, authHeadOfficeName, headOfficesLookup, isHeadOfficeAdmin])

  const schoolOptions = useMemo(() => {
    const selectedHeadOfficeId =
      form.headOfficeId && form.headOfficeId !== 'Select'
        ? String(form.headOfficeId)
        : isHeadOfficeAdmin && authHeadOfficeId != null
          ? String(authHeadOfficeId)
          : ''
    const filtered = Array.isArray(schoolsLookup) ? schoolsLookup.filter((school) => {
      if (selectedHeadOfficeId) return String(school?.headOfficeId ?? '') === selectedHeadOfficeId
      if (isSchoolAdmin && scopedSchoolId) return String(school?.id ?? '') === String(scopedSchoolId)
      return true
    }) : []
    return filtered
      .map((row) => ({ id: row?.id, schoolName: row?.schoolName || row?.name || '' }))
      .filter((row) => row.id != null && row.schoolName)
      .sort((a, b) => String(a.schoolName).localeCompare(String(b.schoolName)))
  }, [authHeadOfficeId, form.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin, scopedSchoolId, schoolsLookup])

  useEffect(() => {
    if (!open) return
    setForm({
      headOfficeId: isSuperAdmin ? 'Select' : isHeadOfficeAdmin && authHeadOfficeId != null ? String(authHeadOfficeId) : 'Select',
      schoolId: isSchoolAdmin && scopedSchoolId ? String(scopedSchoolId) : '',
      departmentTitle: '',
      isViewOnWeb: 'Yes',
      status: 'Active',
      note: '',
    })
    setError('')
  }, [open, authHeadOfficeId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, scopedSchoolId])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => {
      if (id === 'headOfficeId') {
        return { ...prev, headOfficeId: value, schoolId: '' }
      }
      return { ...prev, [id]: value }
    })
  }

  const handleClose = () => {
    setForm(emptyForm)
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (saving) return
    if (!form.schoolId) {
      setError('School is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const created = await createDepartment({
        schoolId: form.schoolId ? Number(form.schoolId) : null,
        title: form.departmentTitle || '',
        note: form.note || '',
        isViewOnWeb: form.isViewOnWeb || 'Yes',
        status: form.status || 'Active',
      })
      setForm(emptyForm)
      onSuccess?.(created)
      onClose()
    } catch (e) {
      setError(e?.message || 'Failed to create department')
    } finally {
      setSaving(false)
    }
  }

  return (
    <WizardPopup
      modalWidth="500px"
      open={open}
      title="Add Teacher Department"
      steps={['Basic']}
      step={0}
      onClose={handleClose}
      onBack={() => {}}
      onNext={() => {}}
      onSubmit={handleSubmit}
      submitLabel={saving ? 'Saving...' : 'Save'}
    >
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-8 mb-12" role="alert">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      )}
      <div className="avm-grid">
        {isSuperAdmin || isHeadOfficeAdmin ? (
          <ManualScopeSelectors
            enabled
            headOffices={headOfficeOptions}
            schoolOptions={schoolOptions}
            selectedHeadOfficeId={form.headOfficeId === 'Select' ? '' : form.headOfficeId}
            onHeadOfficeChange={(value) => setForm((prev) => ({ ...prev, headOfficeId: value || 'Select', schoolId: '' }))}
            selectedSchoolId={form.schoolId}
            onSchoolChange={(value) => setForm((prev) => ({ ...prev, schoolId: value || '' }))}
            showHeadOfficeSelector={isSuperAdmin}
          />
        ) : (
          <div className="avm-field full">
            <label htmlFor="schoolId" className="avm-label">School Name</label>
            <div className="avm-input-with-icon" style={{ position: 'relative' }}>
              {iconSpan('ri-school-line')}
              <input className="avm-input" value={scopedSchoolName || schoolOptions[0]?.schoolName || ''} readOnly />
            </div>
          </div>
        )}
        <div className="avm-field full">
          <label htmlFor="departmentTitle" className="avm-label">Department Title</label>
          <div className="avm-input-with-icon" style={{ position: 'relative' }}>
            {iconSpan('ri-bookmark-line')}
            <input type="text" className="avm-input" id="departmentTitle" placeholder="Enter Department Title" value={form.departmentTitle} onChange={handleChange} />
          </div>
        </div>
        <div className="avm-field full">
          <label htmlFor="status" className="avm-label">Status</label>
          <div className="avm-input-with-icon" style={{ position: 'relative' }}>
            {iconSpan('ri-checkbox-circle-line')}
            <select id="status" className="avm-select" value={form.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
      <div className="avm-grid">
        <div className="avm-field full">
          <label htmlFor="note" className="avm-label">Note</label>
          <div className="avm-input-with-icon" style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.85rem', top: '1.2rem', color: '#667085', fontSize: '0.95rem', lineHeight: 1, pointerEvents: 'none', zIndex: 1 }}>
              <i className="ri-sticky-note-line"></i>
            </span>
            <textarea rows="4" className="avm-input" id="note" placeholder="Enter Note" value={form.note} onChange={handleChange} />
          </div>
        </div>
      </div>
    </WizardPopup>
  )
}

export default AddDepartmentModal
