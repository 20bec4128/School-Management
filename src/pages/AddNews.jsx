import { useEffect, useMemo, useState } from 'react'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useSchool } from '../context/useSchool'
import { useAuth } from '../context/useAuth'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createNews, updateNews } from '../apis/newsApi'
import { findSchoolById } from '../utils/schoolScope'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'news-edit-row'

const emptyForm = {
  schoolId: '',
  title: '',
  date: '',
  image: '',
  news: '',
  isViewOnWeb: '',
}

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

const AddNews = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId, schoolName: authSchoolName, headOfficeId: authHeadOfficeId } = useAuth()
  const { activeSchoolId } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = String(role || '').toUpperCase() === 'HEAD_OFFICE_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const [schools, setSchools] = useState([])
  const [form, setForm] = useState(() => {
    const initialEditRow = readEditRow()
    if (initialEditRow) {
      return {
        ...emptyForm,
        ...initialEditRow,
        schoolId: initialEditRow.schoolId != null ? String(initialEditRow.schoolId) : '',
        isViewOnWeb: initialEditRow.isViewOnWeb ? 'Yes' : 'No',
      }
    }
    const listSchoolId = isSuperAdmin ? '' : activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
    return { ...emptyForm, schoolId: listSchoolId }
  })
  const [editingId] = useState(() => {
    const initialEditRow = readEditRow()
    return initialEditRow?.id ?? null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [imagePreview, setImagePreview] = useState(() => {
    const initialEditRow = readEditRow()
    return initialEditRow?.image || ''
  })

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), [])

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

  useEffect(() => {
    const initialEditRow = readEditRow()
    if (!initialEditRow || !isSuperAdmin) return
    const school = findSchoolById(manualScope.schoolOptions, initialEditRow.schoolId)
    if (school?.headOfficeId != null) {
      manualScope.setSelectedScope(String(school.headOfficeId), String(initialEditRow.schoolId ?? ''))
    }
  }, [isSuperAdmin, manualScope])

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions
    const filtered = Array.isArray(schools)
      ? schools.filter((school) => {
          if (isHeadOfficeAdmin && authHeadOfficeId != null) {
            return String(school?.headOfficeId ?? '') === String(authHeadOfficeId)
          }
          return true
        })
      : []
    const fallback = form.schoolId && !filtered.some((school) => String(school.id) === String(form.schoolId)) && authSchoolName
      ? [{ id: authSchoolId, schoolName: authSchoolName }]
      : []
    return [...filtered, ...fallback]
  }, [isSuperAdmin, manualScope.schoolOptions, schools, isHeadOfficeAdmin, authHeadOfficeId, form.schoolId, authSchoolName, authSchoolId])

  const handleChange = (event) => {
    const { id, value } = event.target
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      setForm((prev) => ({ ...prev, image: dataUrl }))
      setImagePreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loading) return
    setError('')
    setSuccess(false)

    if (!form.schoolId || !form.title || !form.date || !form.news) {
      setError('Please fill all required fields')
      return
    }

    setLoading(true)
    try {
      const payload = {
        schoolId: Number(form.schoolId),
        title: String(form.title || '').trim(),
        date: form.date || null,
        image: form.image || '',
        news: String(form.news || '').trim(),
        isViewOnWeb: form.isViewOnWeb === 'Yes',
      }

      if (editingId) {
        await updateNews(editingId, payload)
      } else {
        await createNews(payload)
      }

      setSuccess(true)
      setTimeout(() => onNavigate('news'), 1000)
    } catch (err) {
      setError(err?.message || 'Failed to save news')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">{editingId ? 'Edit News' : 'Add News'}</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / {editingId ? 'Edit News' : 'Add News'}</span>
          </div>
        </div>
        <button type="button" className="btn btn-light border px-20 d-flex align-items-center gap-6" onClick={() => onNavigate('news')}>
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error ? <div className="alert alert-danger d-flex align-items-center gap-8" role="alert"><i className="ri-error-warning-line"></i><span>{error}</span></div> : null}
      {success ? <div className="alert alert-success d-flex align-items-center gap-8" role="alert"><i className="ri-checkbox-circle-line"></i><span>News {editingId ? 'updated' : 'saved'} successfully! Redirecting...</span></div> : null}

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
                    disabled={!isSuperAdmin && !!activeSchoolId}
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
                <input type="text" id="title" className="form-control" placeholder="Enter title" value={form.title} onChange={handleChange} style={{ paddingLeft: '2.5rem' }} />
              </FormField>

              <FormField label="Date" required>
                <input type="date" id="date" className="form-control" value={form.date} onChange={handleChange} style={{ paddingLeft: '2.5rem' }} />
              </FormField>

              <FormField label="Image" full>
                <input type="file" accept=".jpg,.jpeg,.png,.gif" style={{ display: 'none' }} id="newsImageFile" onChange={handleFileChange} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button type="button" className="avm-btn light" onClick={() => document.getElementById('newsImageFile')?.click()}>
                    <i className="ri-upload-2-line"></i> Upload Image
                  </button>
                  {imagePreview ? <img src={imagePreview} alt="preview" style={{ width: 80, height: 54, objectFit: 'cover', borderRadius: 8, border: '1px solid #d0d5dd' }} /> : null}
                </div>
              </FormField>

              <FormField label="News" required full>
                <textarea rows="4" className="form-control" id="news" value={form.news} onChange={handleChange} placeholder="Enter news content" style={{ paddingLeft: '2.5rem', paddingTop: '0.65rem' }} />
              </FormField>

              <FormField label="Is View on Web?" full>
                <select id="isViewOnWeb" className="form-control form-select" value={form.isViewOnWeb} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                  <option value="">--Select--</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </FormField>
            </div>

            <div className="d-flex justify-content-end gap-12 mt-24">
              <button type="button" className="btn btn-light border px-32" onClick={() => onNavigate('news')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-600 px-32" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update News' : 'Save News'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddNews
