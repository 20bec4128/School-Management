import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { createCertificateType, updateCertificateType } from '../apis/certificateTypesApi'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-certificate-type-row'

const INITIAL_FORM = {
  headOfficeId: '',
  schoolId: '',
  certificateName: '',
  schoolNameOnCard: '',
  certificateText: '',
  footerLeftText: '',
  footerMiddleText: '',
  footerRightText: '',
  backgroundUrl: '',
}

const LiveCertificatePreview = ({ form, schoolName }) => {
  const bgUrl = form.backgroundUrl || ''
  
  return (
    <div
      className="rounded-3 overflow-hidden shadow-sm"
      style={{
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto',
        aspectRatio: '1.414', // Standard landscape certificate aspect ratio
        background: bgUrl ? `url(${bgUrl}) no-repeat center/cover` : '#ffffff',
        backgroundColor: '#ffffff',
        position: 'relative',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#1f2937',
        fontFamily: 'Georgia, serif',
        border: '6px double #d4af37', // Premium gold double border
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div 
        style={{ 
          fontSize: '11px', 
          textTransform: 'uppercase', 
          letterSpacing: '0.12em', 
          color: '#4b5563', 
          fontFamily: 'sans-serif',
          fontWeight: 600,
          textAlign: 'center',
          maxWidth: '90%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {form.schoolNameOnCard || schoolName || 'School Name'}
      </div>

      <div 
        style={{ 
          fontSize: '22px', 
          fontWeight: 'bold', 
          margin: '12px 0 4px', 
          color: '#b8860b', 
          letterSpacing: '0.04em',
          textAlign: 'center'
        }}
      >
        {form.certificateName || 'Certificate of Excellence'}
      </div>

      <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#6b7280', margin: '2px 0', fontFamily: 'sans-serif' }}>
        This is proudly presented to
      </div>

      <div 
        style={{ 
          fontSize: '16px', 
          fontWeight: 600, 
          borderBottom: '1px solid #cbd5e1', 
          width: '60%', 
          textAlign: 'center', 
          paddingBottom: '2px', 
          margin: '8px 0', 
          fontFamily: 'Georgia, serif',
          color: '#0f172a'
        }}
      >
        John Doe
      </div>

      <div 
        style={{ 
          fontSize: '10px', 
          color: '#4b5563', 
          textAlign: 'center', 
          maxWidth: '85%', 
          lineHeight: '1.4', 
          margin: '6px 0', 
          fontFamily: 'sans-serif' 
        }}
      >
        {form.certificateText || 'For outstanding achievement and performance in academic pursuits.'}
      </div>

      {/* Footer Grid */}
      <div 
        className="w-100 d-flex justify-content-between align-items-center mt-20 px-12" 
        style={{ 
          fontFamily: 'sans-serif', 
          fontSize: '9px', 
          color: '#4b5563' 
        }}
      >
        <div style={{ textAlign: 'center', minWidth: '90px', borderTop: '1px solid #cbd5e1', paddingTop: '4px' }}>
          {form.footerLeftText || 'Left Signature'}
        </div>
        <div style={{ textAlign: 'center', minWidth: '90px', borderTop: '1px solid #cbd5e1', paddingTop: '4px' }}>
          {form.footerMiddleText || 'Middle Text'}
        </div>
        <div style={{ textAlign: 'center', minWidth: '90px', borderTop: '1px solid #cbd5e1', paddingTop: '4px' }}>
          {form.footerRightText || 'Right Signature'}
        </div>
      </div>
    </div>
  )
}

const CertificateTypeCreate = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId, schoolName: authSchoolName, headOfficeId: authHeadOfficeId, status: authStatus } = useAuth()
  
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : () => {}
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = String(role || '').toUpperCase() === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = String(role || '').toUpperCase() === 'SCHOOL_ADMIN'

  const [form, setForm] = useState(INITIAL_FORM)
  const [editId, setEditId] = useState(null)
  
  const [schools, setSchools] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [selectedHeadOfficeId, setSelectedHeadOfficeId] = useState('')
  
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadSchools = useCallback(async () => {
    try {
      const data = await fetchSchoolsLookup()
      setSchools(Array.isArray(data) ? data : [])
    } catch {
      // ignore
    }
  }, [])

  const loadHeadOffices = useCallback(async () => {
    try {
      const data = await fetchHeadOfficesPage(0, 500)
      const list = Array.isArray(data?.content) ? data.content : []
      setHeadOffices(
        list.map((ho) => ({ id: ho?.id, name: ho?.name || ho?.headOfficeName || '' }))
          .filter((ho) => ho.id != null && ho.name)
          .sort((a, b) => String(a.name).localeCompare(String(b.name)))
      )
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    void loadSchools()
  }, [loadSchools])

  useEffect(() => {
    if (!isSuperAdmin) return
    void loadHeadOffices()
  }, [isSuperAdmin, loadHeadOffices])

  // Get current active school info
  const selectedSchoolInfo = useMemo(() => {
    if (!form.schoolId) return null
    return schools.find((s) => String(s.id) === String(form.schoolId)) || null
  }, [form.schoolId, schools])

  const schoolOptions = useMemo(() => {
    if (isSchoolAdmin) {
      return authSchoolId ? [
        {
          id: authSchoolId,
          schoolName: authSchoolName || `School ${authSchoolId}`,
          headOfficeId: authHeadOfficeId ?? null,
        }
      ] : []
    }

    if (isHeadOfficeAdmin) {
      const targetHeadOfficeId = authHeadOfficeId != null ? String(authHeadOfficeId) : ''
      return [...schools]
        .filter((school) => String(school?.headOfficeId ?? '') === targetHeadOfficeId)
        .sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
    }

    if (selectedHeadOfficeId) {
      return [...schools]
        .filter((school) => String(school?.headOfficeId ?? '') === String(selectedHeadOfficeId))
        .sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
    }

    return [...schools].sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
  }, [authHeadOfficeId, authSchoolId, authSchoolName, isHeadOfficeAdmin, isSchoolAdmin, schools, selectedHeadOfficeId])

  // Setup Form / Edit mode
  useEffect(() => {
    if (authStatus !== 'ready') return

    // Apply defaults
    if (isSchoolAdmin && authSchoolId) {
      setForm((prev) => ({ ...prev, schoolId: String(authSchoolId) }))
    } else if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      setSelectedHeadOfficeId(String(authHeadOfficeId))
      setForm((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
    }

    try {
      const stored = sessionStorage.getItem(EDIT_STORAGE_KEY)
      if (stored) {
        const row = JSON.parse(stored)
        if (row && row.id) {
          setEditId(row.id)
          
          const matchedSchool = schools.find((s) => String(s.id) === String(row.schoolId))
          const resolvedHoId = row.headOfficeId != null ? String(row.headOfficeId) : matchedSchool?.headOfficeId != null ? String(matchedSchool.headOfficeId) : ''
          
          if (resolvedHoId) {
            setSelectedHeadOfficeId(resolvedHoId)
          }

          setForm({
            headOfficeId: resolvedHoId,
            schoolId: row.schoolId != null ? String(row.schoolId) : '',
            certificateName: row.certificateName || '',
            schoolNameOnCard: row.schoolNameOnCard || '',
            certificateText: row.certificateText || '',
            footerLeftText: row.footerLeftText || '',
            footerMiddleText: row.footerMiddleText || '',
            footerRightText: row.footerRightText || '',
            backgroundUrl: row.backgroundUrl || '',
          })
        }
      }
    } catch {
      // ignore
    }
  }, [authHeadOfficeId, authSchoolId, authStatus, isHeadOfficeAdmin, isSchoolAdmin, schools])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setBusy(true)

    const finalHoId = isSchoolAdmin ? (selectedSchoolInfo?.headOfficeId || form.headOfficeId) : (selectedHeadOfficeId || form.headOfficeId)

    if (!form.schoolId) {
      setError('Please select a school')
      setBusy(false)
      return
    }

    if (!form.certificateName.trim()) {
      setError('Certificate Name is required')
      setBusy(false)
      return
    }

    try {
      const payload = {
        headOfficeId: finalHoId ? Number(finalHoId) : null,
        schoolId: Number(form.schoolId),
        certificateName: form.certificateName.trim(),
        schoolNameOnCard: form.schoolNameOnCard ? form.schoolNameOnCard.trim() : null,
        certificateText: form.certificateText ? form.certificateText.trim() : null,
        footerLeftText: form.footerLeftText ? form.footerLeftText.trim() : null,
        footerMiddleText: form.footerMiddleText ? form.footerMiddleText.trim() : null,
        footerRightText: form.footerRightText ? form.footerRightText.trim() : null,
        backgroundUrl: form.backgroundUrl ? form.backgroundUrl.trim() : null,
      }

      if (editId) {
        await updateCertificateType(editId, payload)
        setSuccess('Certificate Type updated successfully!')
      } else {
        await createCertificateType(payload)
        setSuccess('Certificate Type added successfully!')
      }

      setTimeout(() => {
        try {
          sessionStorage.removeItem(EDIT_STORAGE_KEY)
        } catch {}
        navigateTo('certificate-type')
      }, 1500)
    } catch (err) {
      setError(err?.message || 'Failed to save certificate type')
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    } catch {}
    navigateTo('certificate-type')
  }

  const isEdit = !!editId

  const cardStyle = {
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
  }

  const headerStyle = {
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderBottom: '1px solid #e2e8f0',
    padding: '16px 24px',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
  }

  const inputStyle = {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <div className="dashboard-main-body">
      {/* Header & Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {isEdit ? 'Edit Certificate Type' : 'Add Certificate Type'}
          </h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0 text-sm"
              onClick={() => navigateTo('dashboard')}
            >
              Dashboard
            </button>
            <span className="text-secondary-light text-sm"> / </span>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0 text-sm"
              onClick={handleCancel}
            >
              Certificate Type
            </button>
            <span className="text-secondary-light text-sm"> / {isEdit ? 'Edit' : 'Add'}</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            className="btn btn-outline-secondary d-flex align-items-center gap-6"
            onClick={handleCancel}
          >
            <i className="ri-arrow-left-line"></i> Back to List
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-8 mb-20">
          <i className="ri-error-warning-line text-lg"></i>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success d-flex align-items-center gap-8 mb-20">
          <i className="ri-checkbox-circle-line text-lg"></i>
          <span>{success}</span>
        </div>
      )}

      <div className="row g-24">
        {/* Left Side: Form Controls */}
        <div className="col-lg-7 col-xl-8">
          <form onSubmit={handleSubmit} className="d-flex flex-column gap-24">
            
            {/* Scope Selection Card */}
            <div className="card bg-white" style={cardStyle}>
              <div style={headerStyle}>
                <h6 className="fw-semibold text-primary-light mb-0 d-flex align-items-center gap-8">
                  <i className="ri-global-line text-primary-600"></i> Scope & Basic Info
                </h6>
              </div>
              <div className="card-body p-24">
                <div className="row g-20 mb-20">
                  <div className="col-12">
                    <ManualScopeSelectors
                      enabled={!isSchoolAdmin}
                      headOffices={headOffices}
                      schoolOptions={schoolOptions}
                      selectedHeadOfficeId={selectedHeadOfficeId}
                      onHeadOfficeChange={(value) => {
                        setSelectedHeadOfficeId(value)
                        setForm((prev) => ({ ...prev, schoolId: '', headOfficeId: value }))
                      }}
                      selectedSchoolId={form.schoolId}
                      onSchoolChange={(value) => {
                        const matched = schools.find((s) => String(s.id) === String(value))
                        setForm((prev) => ({
                          ...prev,
                          schoolId: value,
                          headOfficeId: matched?.headOfficeId != null ? String(matched.headOfficeId) : prev.headOfficeId,
                        }))
                        if (matched?.headOfficeId != null) {
                          setSelectedHeadOfficeId(String(matched.headOfficeId))
                        }
                      }}
                      showSchoolSelector={true}
                      showHeadOfficeSelector={isSuperAdmin}
                      compact
                    />
                  </div>
                </div>

                <div className="row g-20">
                  <div className="col-md-12 d-flex flex-column gap-8">
                    <label htmlFor="certificateName" className="form-label fw-medium text-primary-light mb-0">Certificate Name *</label>
                    <input
                      type="text"
                      id="certificateName"
                      value={form.certificateName}
                      onChange={handleChange}
                      placeholder="e.g. Certificate of Excellence"
                      className="form-control"
                      style={inputStyle}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Template styling and texts */}
            <div className="card bg-white" style={cardStyle}>
              <div style={headerStyle}>
                <h6 className="fw-semibold text-primary-light mb-0 d-flex align-items-center gap-8">
                  <i className="ri-article-line text-primary-600"></i> Certificate Content & Template
                </h6>
              </div>
              <div className="card-body p-24">
                <div className="row g-20">
                  <div className="col-md-12 d-flex flex-column gap-8">
                    <label htmlFor="schoolNameOnCard" className="form-label fw-medium text-primary-light mb-0">School Name on Card</label>
                    <input
                      type="text"
                      id="schoolNameOnCard"
                      value={form.schoolNameOnCard}
                      onChange={handleChange}
                      placeholder={selectedSchoolInfo?.schoolName || 'Enter school name as it should appear'}
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-12 d-flex flex-column gap-8">
                    <label htmlFor="certificateText" className="form-label fw-medium text-primary-light mb-0">Certificate Text</label>
                    <textarea
                      id="certificateText"
                      value={form.certificateText}
                      onChange={handleChange}
                      placeholder="e.g. For outstanding achievement and performance in academic pursuits during the academic year."
                      className="form-control"
                      style={{ ...inputStyle, minHeight: '120px' }}
                    />
                  </div>

                  <div className="col-md-4 d-flex flex-column gap-8">
                    <label htmlFor="footerLeftText" className="form-label fw-medium text-primary-light mb-0">Footer Left Text</label>
                    <input
                      type="text"
                      id="footerLeftText"
                      value={form.footerLeftText}
                      onChange={handleChange}
                      placeholder="e.g. Principal Signature"
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-4 d-flex flex-column gap-8">
                    <label htmlFor="footerMiddleText" className="form-label fw-medium text-primary-light mb-0">Footer Middle Text</label>
                    <input
                      type="text"
                      id="footerMiddleText"
                      value={form.footerMiddleText}
                      onChange={handleChange}
                      placeholder="e.g. Date"
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-4 d-flex flex-column gap-8">
                    <label htmlFor="footerRightText" className="form-label fw-medium text-primary-light mb-0">Footer Right Text</label>
                    <input
                      type="text"
                      id="footerRightText"
                      value={form.footerRightText}
                      onChange={handleChange}
                      placeholder="e.g. Chairman Signature"
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-12 d-flex flex-column gap-8">
                    <label htmlFor="backgroundUrl" className="form-label fw-medium text-primary-light mb-0">Background Image URL</label>
                    <input
                      type="text"
                      id="backgroundUrl"
                      value={form.backgroundUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/certificate-bg.png"
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="d-flex justify-content-end align-items-center gap-16 py-12">
              <button
                type="button"
                className="btn btn-outline-secondary px-24 py-10 radius-8"
                onClick={handleCancel}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-600 px-32 py-10 radius-8 d-flex align-items-center gap-8"
                disabled={busy}
              >
                {busy && <span className="spinner-border spinner-border-sm" role="status" />}
                {isEdit ? 'Update Certificate' : 'Save Certificate'}
              </button>
            </div>

          </form>
        </div>

        {/* Right Side: Sticky Live Preview */}
        <div className="col-lg-5 col-xl-4">
          <div className="position-sticky" style={{ top: '24px' }}>
            <div className="card bg-white" style={cardStyle}>
              <div style={headerStyle}>
                <h6 className="fw-semibold text-primary-light mb-0 d-flex align-items-center gap-8">
                  <i className="ri-eye-line text-primary-600"></i> Interactive Live Preview
                </h6>
              </div>
              <div className="card-body p-24" style={{ background: '#f1f5f9' }}>
                <LiveCertificatePreview
                  form={form}
                  schoolName={selectedSchoolInfo?.schoolName || authSchoolName || 'Example School Name'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CertificateTypeCreate
