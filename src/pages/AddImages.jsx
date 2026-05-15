import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { fetchGalleries } from '../apis/galleryApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { findSchoolById } from '../utils/schoolScope'
import { createGalleryImage, updateGalleryImage } from '../apis/galleryImageApi'
import '../assets/css/addModalShared.css'

const emptyForm = {
  schoolId: '',
  galleryId: '',
  title: '',
  image: null,
  caption: '',
}

const readEditRow = () => {
  try {
    const raw = sessionStorage.getItem('edit-image-row')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const AddImages = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const imageRef = useRef(null)

  const [initialEditRow] = useState(() => readEditRow())
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
          galleryId: initialEditRow.galleryId ? String(initialEditRow.galleryId) : '',
          image: null 
        }
      : { ...emptyForm, schoolId: !isSuperAdmin ? listSchoolId : '' }
  ))
  const [galleries, setGalleries] = useState([])
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [preview, setPreview] = useState(() => (initialEditRow?.imagePath ? `/uploads/gallery_images/${initialEditRow.imagePath}` : null))
  const [editingId] = useState(() => (initialEditRow ? initialEditRow.id : null))

  useEffect(() => () => sessionStorage.removeItem('edit-image-row'), [])

  useEffect(() => {
    const loadSchools = async () => {
      try {
        const list = await fetchSchoolsLookup()
        setSchools(Array.isArray(list) ? list : [])
      } catch {
        setSchools([])
      }
    }
    void loadSchools()
  }, [])

  const loadGalleries = useCallback(async (schoolId) => {
    if (!schoolId) {
      setGalleries([])
      return
    }
    try {
      const list = await fetchGalleries({ schoolId })
      setGalleries(Array.isArray(list) ? list : [])
    } catch {
      setGalleries([])
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (form.schoolId) void loadGalleries(form.schoolId)
    else setGalleries([])
  }, [form.schoolId, loadGalleries])

  // Sync manual scope for super admin in edit mode
  useEffect(() => {
    if (!initialEditRow || !isSuperAdmin || schools.length === 0) return
    const school = findSchoolById(schools, initialEditRow.schoolId)
    if (school?.headOfficeId != null) {
      manualScope.setSelectedScope(String(school.headOfficeId), String(initialEditRow.schoolId ?? ''))
    }
  }, [initialEditRow, isSuperAdmin, schools, manualScope])

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions
    return contextSchoolOptions || []
  }, [isSuperAdmin, manualScope.schoolOptions, contextSchoolOptions])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm(prev => ({ ...prev, [id]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setForm((prev) => ({ ...prev, image: file }))
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.schoolId || !form.galleryId || !form.title || (!editingId && !form.image)) {
      return alert('Fill all required fields')
    }
    setLoading(true)
    try {
      const payload = {
        schoolId: Number(form.schoolId),
        galleryId: Number(form.galleryId),
        title: form.title,
        caption: form.caption,
      }
      if (editingId) {
        await updateGalleryImage(editingId, payload, form.image)
      } else {
        await createGalleryImage(payload, form.image)
      }
      setSuccess(true)
      setTimeout(() => onNavigate('images'), 1000)
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
          <h1 className="h6 text-primary-light">{editingId ? 'Edit' : 'Add'} Image</h1>
          <span className="text-secondary-light">Gallery / {editingId ? 'Edit' : 'Add'}</span>
        </div>
        <button className="btn btn-light border" onClick={() => onNavigate('images')}>Back to List</button>
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
                  onHeadOfficeChange={(val) => { 
                    manualScope.setSelectedHeadOfficeId(val)
                    manualScope.setSelectedSchoolId('')
                    setForm(p => ({ ...p, schoolId: '', galleryId: '' })) 
                  }}
                  selectedSchoolId={form.schoolId}
                  onSchoolChange={(val) => setForm(p => ({ ...p, schoolId: val, galleryId: '' }))}
                  compact
                />
              </div>
            ) : (
              <div className="avm-field full">
                <label className="avm-label">School Name <span className="req">*</span></label>
                <select className="avm-select" id="schoolId" value={form.schoolId} onChange={(e) => setForm(p => ({ ...p, schoolId: e.target.value, galleryId: '' }))}>
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
              <label className="avm-label">Gallery <span className="req">*</span></label>
              <select className="avm-select" id="galleryId" value={form.galleryId} onChange={handleChange}>
                <option value="">--Select Gallery--</option>
                {galleries.map((g) => (
                  <option key={String(g.id)} value={String(g.id)}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="avm-field full">
              <label className="avm-label">Title <span className="req">*</span></label>
              <input type="text" id="title" className="avm-input" value={form.title} onChange={handleChange} placeholder="Enter title" />
            </div>

            <div className="avm-field full">
              <label className="avm-label">Image {!editingId && <span className="req">*</span>}</label>
              <input ref={imageRef} type="file" accept=".jpg,.jpeg,.png,.gif" style={{ display: 'none' }} onChange={handleImageChange} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button type="button" className="avm-btn light" onClick={() => imageRef.current.click()}>
                  <i className="ri-upload-2-line"></i> Upload Image
                </button>
                {preview && (
                  <img src={preview} alt="preview" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #d0d5dd' }} />
                )}
              </div>
            </div>

            <div className="avm-field full">
              <label className="avm-label">Caption</label>
              <textarea id="caption" rows="4" className="avm-input" value={form.caption} onChange={handleChange} placeholder="Enter caption" />
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

export default AddImages
