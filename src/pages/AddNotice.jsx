import { useEffect, useState } from 'react'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useSchool } from '../context/useSchool'
import { useAuth } from '../context/useAuth'
import { findSchoolById } from '../utils/schoolScope'
import { createNotice, updateNotice } from '../apis/noticeApi'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'notice-edit-row'

const emptyForm = {
  schoolId: '',
  title: '',
  date: '',
  noticeFor: '',
  notice: '',
  isViewOnWeb: '',
}

const noticeForOptions = ['All', 'Student', 'Teacher', 'Employee', 'Parent']

const FormField = ({ label, required, children, full = false }) => (
  <div className={full ? 'col-12 mb-20' : 'col-md-6 mb-20'}>
    <label className="form-label fw-semibold text-primary-light mb-8 d-block">
      {label} {required && <span className="text-danger-600">*</span>}
    </label>
    <div className="avm-input-with-icon" style={{ position: 'relative' }}>
      {children}
    </div>
  </div>
)

const readEditRow = () => {
  try {
    const raw = sessionStorage.getItem(EDIT_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const AddNotice = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const listSchoolId = isSuperAdmin ? '' : activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
  const [initialEditRow] = useState(() => readEditRow())

  const [form, setForm] = useState(() => (
    initialEditRow
      ? {
          ...emptyForm,
          ...initialEditRow,
          schoolId: initialEditRow.schoolId != null ? String(initialEditRow.schoolId) : '',
          isViewOnWeb: initialEditRow.isViewOnWeb ? 'Yes' : 'No',
        }
      : { ...emptyForm, schoolId: !isSuperAdmin ? listSchoolId : '' }
  ))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [editingId] = useState(() => (initialEditRow ? initialEditRow.id : null))

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), [])

  useEffect(() => {
    if (!initialEditRow || !isSuperAdmin) return
    const school = findSchoolById(manualScope.schoolOptions, initialEditRow.schoolId)
    if (school?.headOfficeId != null) {
      manualScope.setSelectedScope(String(school.headOfficeId), String(initialEditRow.schoolId ?? ''))
    }
  }, [initialEditRow, isSuperAdmin, manualScope])

  const schoolOptions = isSuperAdmin ? manualScope.schoolOptions : contextSchoolOptions

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setSuccess(false)

    if (!form.schoolId || !form.title || !form.date || !form.notice || !form.noticeFor) {
      setError('Please fill all required fields')
      return
    }

    setLoading(true)
    try {
      const payload = {
        schoolId: Number(form.schoolId),
        title: String(form.title || '').trim(),
        date: form.date || null,
        noticeFor: String(form.noticeFor || '').trim(),
        notice: String(form.notice || '').trim(),
        isViewOnWeb: form.isViewOnWeb === 'Yes',
      }

      if (editingId) {
        await updateNotice(editingId, payload)
      } else {
        await createNotice(payload)
      }

      setSuccess(true)
      setTimeout(() => onNavigate('notice'), 1000)
    } catch (err) {
      setError(err?.message || 'Failed to save notice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {editingId ? 'Edit Notice' : 'Add Notice'}
          </h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / {editingId ? 'Edit Notice' : 'Add Notice'}</span>
          </div>
        </div>
        <button type="button" className="btn btn-light border px-20 d-flex align-items-center gap-6" onClick={() => onNavigate('notice')}>
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error ? <div className="alert alert-danger d-flex align-items-center gap-8" role="alert"><i className="ri-error-warning-line"></i><span>{error}</span></div> : null}
      {success ? <div className="alert alert-success d-flex align-items-center gap-8" role="alert"><i className="ri-checkbox-circle-line"></i><span>Notice {editingId ? 'updated' : 'saved'} successfully! Redirecting...</span></div> : null}

      <div className="card h-100">
        <div className="card-body p-24">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {isSuperAdmin ? (
                <div className="col-12 mb-20">
                  <ManualScopeSelectors
                    enabled={isSuperAdmin}
                    headOffices={manualScope.headOffices}
                    schoolOptions={schoolOptions}
                    selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                    onHeadOfficeChange={(value) => {
                      manualScope.setSelectedHeadOfficeId(value)
                      manualScope.setSelectedSchoolId('')
                      setForm((prev) => ({ ...prev, schoolId: '' }))
                    }}
                    selectedSchoolId={form.schoolId}
                    onSchoolChange={(value) => setForm((prev) => ({ ...prev, schoolId: value }))}
                    compact
                  />
                </div>
              ) : (
                <FormField label="School Name" required>
                  <select
                    id="schoolId"
                    className="form-control form-select"
                    value={form.schoolId}
                    onChange={handleChange}
                    style={{ paddingLeft: '2.5rem' }}
                    disabled={!isSuperAdmin && !!listSchoolId}
                  >
                    <option value="">--Select School--</option>
                    {schoolOptions.map((school) => (
                      <option key={String(school.id)} value={String(school.id)}>
                        {school.schoolName}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField label="Title" required>
                <input
                  type="text"
                  id="title"
                  className="form-control"
                  placeholder="Enter title"
                  value={form.title}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </FormField>

              <FormField label="Date" required>
                <input type="date" id="date" className="form-control" value={form.date} onChange={handleChange} style={{ paddingLeft: '2.5rem' }} />
              </FormField>

              <FormField label="Notice for" required>
                <select id="noticeFor" className="form-control form-select" value={form.noticeFor} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                  <option value="">--Select--</option>
                  {noticeForOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Is View on Web?">
                <select id="isViewOnWeb" className="form-control form-select" value={form.isViewOnWeb} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                  <option value="">--Select--</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </FormField>

              <FormField label="Notice" required full>
                <textarea
                  id="notice"
                  rows={4}
                  className="form-control"
                  placeholder="Enter notice details"
                  value={form.notice}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem', paddingTop: '0.65rem' }}
                />
              </FormField>
            </div>

            <div className="d-flex justify-content-end gap-12 mt-24">
              <button type="button" className="btn btn-light border px-32" onClick={() => onNavigate('notice')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-600 px-32" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update Notice' : 'Save Notice'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddNotice
