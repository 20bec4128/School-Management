import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchGalleries } from '../apis/galleryApi'
import { createGalleryVideo, updateGalleryVideo } from '../apis/galleryVideoApi'
import { findSchoolById } from '../utils/schoolScope'
import VideoEditorForm from '../components/VideoEditorForm'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-video-row'

const emptyForm = {
  schoolId: '',
  galleryId: '',
  title: '',
  videoPath: '',
  videoFile: null,
  caption: '',
}

const readEditRow = () => {
  try {
    const raw = sessionStorage.getItem(EDIT_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const AddVideos = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const videoRef = useRef(null)

  const [initialEditRow] = useState(() => readEditRow())
  const [schools, setSchools] = useState([])
  const [galleries, setGalleries] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

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
          ...emptyForm,
          ...initialEditRow,
          schoolId: initialEditRow.schoolId != null ? String(initialEditRow.schoolId) : '',
          galleryId: initialEditRow.galleryId != null ? String(initialEditRow.galleryId) : '',
          videoFile: null,
        }
      : { ...emptyForm, schoolId: !isSuperAdmin ? listSchoolId : '' }
  ))

  const [editingId] = useState(() => (initialEditRow ? initialEditRow.id : null))

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), [])

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

  useEffect(() => {
    if (!initialEditRow || !isSuperAdmin || schools.length === 0) return
    const school = findSchoolById(schools, initialEditRow.schoolId)
    if (school?.headOfficeId != null) {
      manualScope.setSelectedScope(String(school.headOfficeId), String(initialEditRow.schoolId ?? ''))
    }
  }, [initialEditRow, isSuperAdmin, schools, manualScope])

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions
    const filtered = Array.isArray(contextSchoolOptions) ? contextSchoolOptions : []
    const fallback =
      form.schoolId &&
      authSchoolName &&
      !filtered.some((school) => String(school.id) === String(form.schoolId))
        ? [{ id: form.schoolId, schoolName: authSchoolName }]
        : []
    return [...filtered, ...fallback]
  }, [isSuperAdmin, manualScope.schoolOptions, contextSchoolOptions, form.schoolId, authSchoolName])

  useEffect(() => {
    let cancelled = false
    const loadGalleries = async () => {
      if (!form.schoolId) {
        setGalleries([])
        return
      }
      try {
        const list = await fetchGalleries({ schoolId: form.schoolId })
        if (!cancelled) setGalleries(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setGalleries([])
      }
    }
    void loadGalleries()
    return () => {
      cancelled = true
    }
  }, [form.schoolId])

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleHeadOfficeChange = (value) => {
    manualScope.setSelectedHeadOfficeId(value)
    manualScope.setSelectedSchoolId('')
    setForm((prev) => ({ ...prev, schoolId: '', galleryId: '' }))
    setGalleries([])
  }

  const handleSchoolChange = (value) => {
    if (isSuperAdmin) manualScope.setSelectedSchoolId(value)
    setForm((prev) => ({ ...prev, schoolId: value, galleryId: '' }))
  }

  const handleGalleryChange = (value) => {
    setForm((prev) => ({ ...prev, galleryId: value }))
  }

  const handleVideoFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setForm((prev) => ({ ...prev, videoFile: file, videoPath: file.name }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loading) return
    setError('')
    setSuccess(false)

    setLoading(true)
    try {
      const payload = {
        schoolId: form.schoolId ? Number(form.schoolId) : null,
        galleryId: form.galleryId ? Number(form.galleryId) : null,
        title: String(form.title || '').trim(),
        caption: String(form.caption || '').trim(),
        videoPath: String(form.videoPath || '').trim(),
      }

      if (editingId) {
        await updateGalleryVideo(editingId, payload, form.videoFile)
      } else {
        await createGalleryVideo(payload, form.videoFile)
      }

      setSuccess(true)
      setTimeout(() => onNavigate('videos'), 1000)
    } catch (err) {
      setError(err?.message || 'Failed to save video')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">{editingId ? 'Edit Videos' : 'Add Videos'}</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / {editingId ? 'Edit Videos' : 'Add Videos'}</span>
          </div>
        </div>
        <button type="button" className="btn btn-light border px-20 d-flex align-items-center gap-6" onClick={() => onNavigate('videos')}>
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error ? <div className="alert alert-danger d-flex align-items-center gap-8" role="alert"><i className="ri-error-warning-line"></i><span>{error}</span></div> : null}
      {success ? <div className="alert alert-success d-flex align-items-center gap-8" role="alert"><i className="ri-checkbox-circle-line"></i><span>Video {editingId ? 'updated' : 'saved'} successfully! Redirecting...</span></div> : null}

      <div className="card h-100">
        <div className="card-body p-24">
          <form onSubmit={handleSubmit}>
            <VideoEditorForm
              isSuperAdmin={isSuperAdmin}
              manualScope={manualScope}
              schoolOptions={schoolOptions}
              form={form}
              galleries={galleries}
              videoRef={videoRef}
              onHeadOfficeChange={handleHeadOfficeChange}
              onSchoolChange={handleSchoolChange}
              onGalleryChange={handleGalleryChange}
              onFieldChange={handleFieldChange}
              onVideoFileChange={handleVideoFileChange}
            />

            <div className="d-flex justify-content-end mt-24">
              <button type="submit" className="btn btn-primary-600" disabled={loading}>
                {loading ? 'Processing...' : (editingId ? 'Update' : 'Submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddVideos
