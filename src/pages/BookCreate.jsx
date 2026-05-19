import { useEffect, useMemo, useRef, useState } from 'react'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import { createBook, updateBook } from '../apis/booksApi'
import { apiUrl } from '../apis/apiClient'
import '../assets/css/addModalShared.css'

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  Title: 'ri-book-line',
  'Book ID': 'ri-hashtag',
  'ISBN No': 'ri-barcode-line',
  Edition: 'ri-bookmark-line',
  Author: 'ri-user-follow-line',
  Language: 'ri-global-line',
  Price: 'ri-money-dollar-circle-line',
  Quantity: 'ri-equalizer-line',
  'Almira No': 'ri-layout-grid-line',
}

const emptyForm = {
  id: null,
  headOfficeId: '',
  schoolId: '',
  title: '',
  bookId: '',
  isbnNo: '',
  edition: '',
  author: '',
  language: '',
  price: '',
  quantity: '',
  almiraNo: '',
  bookCover: '',
}

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
      <div className="avm-input-with-icon" style={{ position: 'relative' }}>
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '0.85rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#667085',
            fontSize: '0.95rem',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <i className={icon} />
        </span>
        {children}
      </div>
    </div>
  )
}

const getSchoolById = (rows, schoolId) =>
  (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(schoolId ?? '')) || null

const resolveMediaUrl = (value) => {
  const src = String(value || '').trim()
  if (!src) return ''
  return apiUrl(src)
}

const BookCreate = ({ onNavigate }) => {
  const { role: authRole, headOfficeId: authHeadOfficeId, schoolId: authSchoolId } = useAuth()
  const { activeSchoolId } = useSchool()
  const role = useMemo(() => normalizeRole(authRole), [authRole])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(true)

  const [form, setForm] = useState(() => {
    try {
      const raw = sessionStorage.getItem('edit-book-row')
      if (!raw) return emptyForm
      const row = JSON.parse(raw)
      return {
        ...emptyForm,
        id: row?.id ?? null,
        headOfficeId: row?.headOfficeId != null ? String(row.headOfficeId) : '',
        schoolId: row?.schoolId != null ? String(row.schoolId) : '',
        title: row?.title || '',
        bookId: row?.bookId || '',
        isbnNo: row?.isbnNo || '',
        edition: row?.edition || '',
        author: row?.author || '',
        language: row?.language || '',
        price: row?.price != null ? String(row.price) : '',
        quantity: row?.quantity != null ? String(row.quantity) : '',
        almiraNo: row?.almiraNo || '',
        bookCover: row?.bookCover || '',
      }
    } catch {
      return emptyForm
    }
  })
  const [imagePreview, setImagePreview] = useState(() => resolveMediaUrl(form.bookCover))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const redirectTimerRef = useRef(null)

  const selectedSchool = useMemo(
    () => getSchoolById(manualScope.schoolOptions, form.schoolId),
    [form.schoolId, manualScope.schoolOptions],
  )

  const isEditing = Boolean(form.id)

  const selectedHeadOfficeName = useMemo(
    () => manualScope.headOffices.find((row) => String(row?.id ?? '') === String(form.headOfficeId))?.name || '',
    [form.headOfficeId, manualScope.headOffices],
  )

  const scopedSchoolOptions = useMemo(() => {
    const rows = Array.isArray(manualScope.schoolOptions) ? manualScope.schoolOptions : []
    if (isSuperAdmin) {
      if (!form.headOfficeId) return rows
      return rows.filter((school) => String(school?.headOfficeId ?? '') === String(form.headOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return rows.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return rows.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return rows
  }, [authHeadOfficeId, authSchoolId, form.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.schoolOptions])

  useEffect(() => {
    if (isSuperAdmin && activeSchoolId) {
      const school = getSchoolById(manualScope.schoolOptions, activeSchoolId)
      if (school?.headOfficeId != null) {
        manualScope.setSelectedScope(String(school.headOfficeId), String(activeSchoolId))
      }
    }
  }, [activeSchoolId, isSuperAdmin, manualScope])

  useEffect(() => {
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      manualScope.setSelectedScope(String(authHeadOfficeId), String(authSchoolId ?? ''))
      setForm((prev) => ({
        ...prev,
        headOfficeId: String(authHeadOfficeId),
        schoolId: authSchoolId != null ? String(authSchoolId) : prev.schoolId,
      }))
    }
  }, [authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, manualScope])

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return
    const school = getSchoolById(manualScope.schoolOptions, authSchoolId)
    manualScope.setSelectedScope(school?.headOfficeId != null ? String(school.headOfficeId) : '', String(authSchoolId))
    setForm((prev) => ({
      ...prev,
      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
      schoolId: String(authSchoolId),
    }))
  }, [authSchoolId, isSchoolAdmin, manualScope])

  const handleSchoolChange = (value) => {
    const school = getSchoolById(manualScope.schoolOptions, value)
    setForm((prev) => ({
      ...prev,
      schoolId: value,
      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
    }))
    manualScope.setSelectedScope(school?.headOfficeId != null ? String(school.headOfficeId) : form.headOfficeId, value)
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      setImagePreview(dataUrl)
      setForm((prev) => ({ ...prev, bookCover: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    const school = selectedSchool || getSchoolById(manualScope.schoolOptions, form.schoolId)
    const headOfficeId = form.headOfficeId
      ? Number(form.headOfficeId)
      : school?.headOfficeId != null
        ? Number(school.headOfficeId)
        : null

    if (!headOfficeId) return setError('Head office is required.')
    if (!form.schoolId) return setError('School is required.')
    if (!form.title.trim()) return setError('Title is required.')
    if (!form.bookId.trim()) return setError('Book ID is required.')
    if (!form.quantity || Number(form.quantity) <= 0) return setError('Quantity is required.')

    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const payload = {
        headOfficeId,
        schoolId: Number(form.schoolId),
        title: form.title.trim(),
        bookId: form.bookId.trim(),
        isbnNo: form.isbnNo.trim() || null,
        edition: form.edition.trim() || null,
        author: form.author.trim() || null,
        language: form.language.trim() || null,
        price: form.price === '' ? null : Number(form.price),
        quantity: Number(form.quantity),
        almiraNo: form.almiraNo.trim() || null,
        bookCover: form.bookCover || null,
      }
      if (isEditing) {
        await updateBook(form.id, payload)
      } else {
        await createBook(payload)
      }
      setSuccess(true)
      sessionStorage.removeItem('edit-book-row')
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current)
      }
      redirectTimerRef.current = setTimeout(() => {
        onNavigate?.('book')
      }, 1000)
    } catch (err) {
      console.error('Failed to save book:', err)
      setError(err?.message || 'Failed to save book')
    } finally {
      setSaving(false)
    }
  }

  useEffect(
    () => () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current)
      }
    },
    [],
  )

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <h1 className="fw-semibold mb-0 h6 text-primary-light">Add New Book</h1>
        <button
          className="btn btn-outline-neutral border border-neutral-300 radius-8 text-sm"
          type="button"
          onClick={() => onNavigate?.('book')}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <form
            className="avm-grid"
            onSubmit={(e) => {
              e.preventDefault()
              void handleSave()
            }}
          >
            {error ? <div className="full text-danger">{error}</div> : null}
            {success ? (
              <div className="full alert alert-success d-flex align-items-center gap-8">
                <i className="ri-checkbox-circle-line"></i>
                Book saved successfully! Redirecting...
              </div>
            ) : null}
            {isSuperAdmin ? (
              <ManualScopeSelectors
                enabled
                headOffices={manualScope.headOffices}
                schoolOptions={scopedSchoolOptions}
                selectedHeadOfficeId={form.headOfficeId}
                onHeadOfficeChange={(value) => {
                  setForm((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))
                  manualScope.setSelectedScope(value, '')
                }}
                selectedSchoolId={form.schoolId}
                onSchoolChange={handleSchoolChange}
                schoolLabel="School"
              />
            ) : (
              <>
                {isHeadOfficeAdmin ? (
                  <FormField label="Head Office" full>
                    <input className="avm-input" value={selectedHeadOfficeName || String(authHeadOfficeId ?? '')} disabled />
                  </FormField>
                ) : null}
                <FormField label="School Name" required full>
                  <select
                    className="avm-select"
                    value={form.schoolId}
                    onChange={(e) => handleSchoolChange(e.target.value)}
                    disabled={isSchoolAdmin}
                  >
                    <option value="">{isSchoolAdmin ? 'Current School' : '--Select School--'}</option>
                    {scopedSchoolOptions.map((school) => (
                      <option key={String(school.id)} value={String(school.id)}>
                        {school.schoolName}
                      </option>
                    ))}
                  </select>
                </FormField>
              </>
            )}

            <FormField label="Title" required full>
              <input type="text" className="avm-input" placeholder="Title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            </FormField>

            <FormField label="Book ID" required>
              <input type="text" className="avm-input" placeholder="Book ID" value={form.bookId} onChange={(e) => setForm((prev) => ({ ...prev, bookId: e.target.value }))} />
            </FormField>

            <FormField label="ISBN No">
              <input type="text" className="avm-input" placeholder="ISBN No" value={form.isbnNo} onChange={(e) => setForm((prev) => ({ ...prev, isbnNo: e.target.value }))} />
            </FormField>

            <FormField label="Edition">
              <input type="text" className="avm-input" placeholder="Edition" value={form.edition} onChange={(e) => setForm((prev) => ({ ...prev, edition: e.target.value }))} />
            </FormField>

            <FormField label="Author">
              <input type="text" className="avm-input" placeholder="Author" value={form.author} onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))} />
            </FormField>

            <FormField label="Language">
              <input type="text" className="avm-input" placeholder="Language" value={form.language} onChange={(e) => setForm((prev) => ({ ...prev, language: e.target.value }))} />
            </FormField>

            <FormField label="Price">
              <input type="number" className="avm-input" placeholder="Price" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} />
            </FormField>

            <FormField label="Quantity" required>
              <input type="number" className="avm-input" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))} />
            </FormField>

            <FormField label="Almira No">
              <input type="text" className="avm-input" placeholder="Almira No" value={form.almiraNo} onChange={(e) => setForm((prev) => ({ ...prev, almiraNo: e.target.value }))} />
            </FormField>

              <div className="avm-field full">
                <label className="avm-label">Book Cover</label>
                <div className="upload-container border border-neutral-300 radius-8 p-20 text-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="mb-12 radius-8" style={{ maxHeight: '200px' }} />
                  ) : (
                    <div className="mb-12">
                      <i className="ri-image-add-line text-40 text-secondary-light"></i>
                    </div>
                  )}
                <input type="file" className="form-control" accept=".jpg,.jpeg,.png,.gif" onChange={handleImageChange} />
                <p className="text-xs text-secondary-light mt-8">Max-W: 600px, Max-H: 800px (.jpg, .jpeg, .png, .gif)</p>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-12 mt-24 full">
              <button
                type="button"
                className="btn btn-outline-neutral px-24 py-12 radius-8"
                onClick={() => {
                  sessionStorage.removeItem('edit-book-row')
                  onNavigate ? onNavigate('book') : window.history.back()
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-600 px-24 py-12 radius-8" disabled={saving}>
                {saving ? 'Saving...' : isEditing ? 'Update Book' : 'Save Book'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default BookCreate
