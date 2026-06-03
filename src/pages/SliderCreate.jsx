import React, { useEffect, useMemo, useState } from 'react'
import '../assets/css/addModalShared.css'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createSlider, updateSlider } from '../apis/slidersApi'
import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import ManualScopeSelectors from '../components/ManualScopeSelectors'

const EDIT_STORAGE_KEY = 'edit-slider-row'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  title: '',
  caption: '',
  image: '',
  status: 'Active',
}

const FIELD_ICONS = {
  'Head Office': 'ri-government-line',
  'School Name': 'ri-school-line',
  Title: 'ri-text',
  Caption: 'ri-chat-1-line',
  Image: 'ri-image-line',
  Status: 'ri-toggle-line',
}

const FormField = ({ label, required, children, full = false, helpText = '' }) => {
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
      {helpText ? <p className="text-xs text-secondary-light mt-4">{helpText}</p> : null}
    </div>
  )
}

const SliderCreate = ({ onNavigate }) => {
  const { role, headOfficeId: authHeadOfficeId, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
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

  const [schools, setSchools] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [initialEditRow, setInitialEditRow] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [imagePreview, setImagePreview] = useState('')

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
          title: parsed.title || '',
          caption: parsed.caption || '',
          image: parsed.image || '',
          status: parsed.status || 'Active',
        })
        setImagePreview(parsed.image || '')
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
          if (!cancelled) setSchools(currentSchoolOption ? [currentSchoolOption] : [])
          return
        }
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
  }, [currentSchoolOption, isSchoolAdmin])

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return Array.isArray(manualScope.schoolOptions) ? manualScope.schoolOptions : []
    if (isHeadOfficeAdmin) return schools.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    if (isSchoolAdmin) {
      return currentSchoolOption ? [currentSchoolOption] : []
    }
    return schools
  }, [currentSchoolOption, schools, authHeadOfficeId, authSchoolId, authSchoolName, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.schoolOptions])

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
    if (isSchoolAdmin && authSchoolId != null) {
      setForm((prev) => ({ ...prev, schoolId: String(authSchoolId) }))
    }
  }, [authSchoolId, isSchoolAdmin])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => ({
      ...prev,
      [id]: value,
      ...(id === 'headOfficeId' ? { schoolId: '' } : {}),
      ...(id === 'schoolId' ? {} : {}),
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      setImagePreview(dataUrl)
      setForm((prev) => ({ ...prev, image: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const schoolId = currentSchoolId ? Number(currentSchoolId) : null
    const headOfficeId = currentHeadOfficeId ? Number(currentHeadOfficeId) : null
    if (!schoolId) return setError('School is required')
    if (!form.title.trim()) return setError('Title is required')
    if (!form.image) return setError('Image is required')

    const payload = {
      headOfficeId,
      schoolId,
      title: form.title.trim(),
      caption: form.caption.trim(),
      image: form.image,
      status: form.status,
    }

    try {
      setSaving(true)
      if (initialEditRow?.id != null) {
        await updateSlider(initialEditRow.id, payload)
      } else {
        await createSlider(payload)
      }
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
      setSuccess('Slider saved successfully')
      setTimeout(() => onNavigate?.('slider'), 900)
    } catch (err) {
      setError(err?.message || 'Failed to save slider')
    } finally {
      setSaving(false)
    }
  }

  const isEditMode = initialEditRow?.id != null

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <h1 className="fw-semibold mb-0 h6 text-primary-light">{isEditMode ? 'Edit Slider' : 'Add New Slider'}</h1>
        <button className="btn btn-outline-neutral border border-neutral-300 radius-8 text-sm" type="button" onClick={() => onNavigate?.('slider')}>
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
                onHeadOfficeChange={(value) => manualScope.setSelectedScope(value, '')}
                selectedSchoolId={manualScope.selectedSchoolId}
                onSchoolChange={(value) => manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value)}
              />
            ) : (
              <>
                <FormField label="Head Office" required>
                  <input className="avm-input" value={currentHeadOfficeId || authHeadOfficeId || ''} disabled />
                </FormField>
                <FormField label="School Name" required>
                  <select className="avm-select" id="schoolId" value={form.schoolId} onChange={handleChange} disabled={isSchoolAdmin}>
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

            <FormField label="Title" required full>
              <input type="text" className="avm-input" id="title" placeholder="Slider Title" value={form.title} onChange={handleChange} />
            </FormField>

            <FormField label="Caption" full>
              <input type="text" className="avm-input" id="caption" placeholder="Slider Caption" value={form.caption} onChange={handleChange} />
            </FormField>

            <FormField label="Status">
              <select className="avm-select" id="status" value={form.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </FormField>

            <div className="avm-field full">
              <label className="avm-label">Image <span className="text-danger-600">*</span></label>
              <div className="upload-container border border-neutral-300 radius-8 p-20 text-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="mb-12 radius-8" style={{ maxHeight: '200px', width: 'auto' }} />
                ) : (
                  <div className="mb-12"><i className="ri-image-add-line text-40 text-secondary-light" /></div>
                )}
                <input type="file" className="form-control" accept=".jpg,.jpeg,.png,.gif" onChange={handleImageChange} />
                <div className="mt-8">
                  <p className="text-xs text-secondary-light mb-2">Dimension:- Max-W: 1920px, Max-H: 800px</p>
                  <p className="text-xs text-secondary-light">Image file format: .jpg, .jpeg, .png or .gif</p>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-12 mt-24 full">
              <button type="button" className="btn btn-outline-neutral px-24 py-12 radius-8" onClick={() => onNavigate?.('slider')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-600 px-24 py-12 radius-8" disabled={saving}>
                {saving ? 'Saving...' : 'Save Slider'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SliderCreate
