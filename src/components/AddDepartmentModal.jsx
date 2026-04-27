import { useState } from 'react'
import WizardPopup from './WizardPopup'
import { createDepartment } from '../apis/departmentsApi'

const emptyForm = { schoolId: '', departmentTitle: '', isViewOnWeb: 'Yes', status: 'Active', note: '' }

const iconSpan = (cls) => (
  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#667085', fontSize: '0.95rem', lineHeight: 1, pointerEvents: 'none', zIndex: 1 }}>
    <i className={cls}></i>
  </span>
)

const AddDepartmentModal = ({ open, onClose, schoolsLookup = [], onSuccess }) => {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleClose = () => {
    setForm(emptyForm)
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (saving) return
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
        <div className="avm-field full">
          <label htmlFor="schoolId" className="avm-label">School Name</label>
          <div className="avm-input-with-icon" style={{ position: 'relative' }}>
            {iconSpan('ri-school-line')}
            <select id="schoolId" className="avm-select" value={form.schoolId} onChange={handleChange}>
              <option value="">Select School</option>
              {schoolsLookup.map((s) => <option key={s.id} value={String(s.id)}>{s.schoolName}</option>)}
            </select>
          </div>
        </div>
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
