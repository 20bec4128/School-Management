import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { createIdCardSetting, updateIdCardSetting } from '../apis/idCardSettingsApi'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-id-card-setting-row'

const INITIAL_FORM = {
  headOfficeId: '',
  schoolId: '',
  borderColor: '#e01ab5',
  topBackground: '#3b82f6',
  cardSchoolName: '',
  schoolNameFontSize: '14',
  schoolNameColor: '#1f2937',
  schoolAddress: '',
  schoolAddressColor: '#374151',
  idNoFontSize: '12',
  idNoColor: '#ffffff',
  idNoBackground: '#e01ab5',
  titleFontSize: '13',
  titleColor: '#e01ab5',
  valueFontSize: '13',
  valueColor: '#1f2937',
  bottomSignature: '',
  signatureBackground: '#1e3a5f',
  signatureColor: '#ffffff',
  signatureAlign: 'center',
  cardLogoUrl: '',
}

const getSafeText = (value, fallback = '--') => {
  const text = String(value ?? '').trim()
  return text || fallback
}

const LiveIdCardPreview = ({ form, schoolName, headOfficeName }) => {
  const borderColor = form.borderColor || '#e01ab5'
  const topBackground = form.topBackground || borderColor
  const signatureBackground = form.signatureBackground || borderColor
  const signatureColor = form.signatureColor || '#ffffff'
  const align = form.signatureAlign || 'center'
  const idNumber = 'ID-0001'

  return (
    <div
      className="rounded-4 overflow-hidden shadow-sm border-0"
      style={{
        border: `3px solid ${borderColor}`,
        background: '#fff',
        width: '100%',
        maxWidth: '380px',
        margin: '0 auto',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
        borderRadius: '12px',
      }}
    >
      <div
        className="p-16 text-white"
        style={{
          background: topBackground,
          minHeight: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: `${form.schoolNameFontSize || 14}px`,
              color: form.schoolNameColor || '#ffffff',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {getSafeText(form.cardSchoolName || schoolName, schoolName || 'School Name')}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1.1, marginTop: '4px' }}>
            ID Card
          </div>
          <div style={{ fontSize: '11px', marginTop: '6px', opacity: 0.9 }}>
            {getSafeText(headOfficeName, 'Head Office')}
          </div>
        </div>

        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {form.cardLogoUrl ? (
            <img
              src={form.cardLogoUrl}
              alt="Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }}
            />
          ) : (
            <i className="ri-image-line" style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)' }} />
          )}
        </div>
      </div>

      <div className="p-16" style={{ background: '#f8fafc' }}>
        <div
          className="rounded-3 p-12 mb-12 bg-white border"
          style={{ borderColor: `${borderColor}26`, boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}
        >
          <div className="d-flex align-items-center justify-content-between gap-12 mb-12">
            <div
              className="rounded-3 px-8 py-4 fw-bold"
              style={{
                background: form.idNoBackground || `${borderColor}14`,
                color: form.idNoColor || borderColor,
                fontSize: `${form.idNoFontSize || 11}px`,
                minWidth: '70px',
                textAlign: 'center',
              }}
            >
              {idNumber}
            </div>
          </div>

          <div className="d-flex align-items-center gap-12 mb-12">
            <div
              className="rounded-circle overflow-hidden border bg-light"
              style={{ width: '60px', height: '60px', borderColor: `${borderColor}33`, flexShrink: 0 }}
            >
              {form.cardLogoUrl ? (
                <img
                  src={form.cardLogoUrl}
                  alt="Student Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }}
                />
              ) : (
                <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary-light">
                  <i className="ri-user-line" style={{ fontSize: '20px' }} />
                </div>
              )}
            </div>

            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Student Name</div>
              <div className="fw-bold text-primary-light" style={{ fontSize: '14px', lineHeight: 1.2 }}>
                Jane Doe
              </div>
              <div style={{ fontSize: `${form.titleFontSize || 12}px`, color: form.titleColor || '#64748b', marginTop: '4px' }}>
                Class: <span style={{ fontSize: `${form.valueFontSize || 12}px`, color: form.valueColor || '#1e293b', fontWeight: 600 }}>Grade 5</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Address</div>
            <div style={{ fontSize: '12px', color: form.schoolAddressColor || '#334155', fontWeight: 500, lineHeight: 1.3 }}>
              {getSafeText(form.schoolAddress, 'School Address Here')}
            </div>
          </div>
        </div>

        <div
          className="rounded-3 p-8 text-white"
          style={{
            background: signatureBackground,
            color: signatureColor,
            textAlign: align,
          }}
        >
          <div className="fw-bold" style={{ fontSize: '12px' }}>
            {getSafeText(form.bottomSignature, 'Authorized Signature')}
          </div>
        </div>
      </div>
    </div>
  )
}

const IdCardSettingCreate = ({ onNavigate }) => {
  const {
    role,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    status: authStatus,
  } = useAuth()
  
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : () => {}
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = String(role || '').toUpperCase() === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = String(role || '').toUpperCase() === 'SCHOOL_ADMIN'

  const [form, setForm] = useState(INITIAL_FORM)
  const [logoPreview, setLogoPreview] = useState('')
  const [editId, setEditId] = useState(null)
  
  const [schools, setSchools] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [selectedHeadOfficeId, setSelectedHeadOfficeId] = useState('')
  
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const logoInputRef = useRef(null)

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
            borderColor: row.borderColor || '#e01ab5',
            topBackground: row.topBackground || '#3b82f6',
            cardSchoolName: row.cardSchoolName || '',
            schoolNameFontSize: row.schoolNameFontSize || '14',
            schoolNameColor: row.schoolNameColor || '#1f2937',
            schoolAddress: row.schoolAddress || '',
            schoolAddressColor: row.schoolAddressColor || '#374151',
            idNoFontSize: row.idNoFontSize || '12',
            idNoColor: row.idNoColor || '#ffffff',
            idNoBackground: row.idNoBackground || '#e01ab5',
            titleFontSize: row.titleFontSize || '13',
            titleColor: row.titleColor || '#e01ab5',
            valueFontSize: row.valueFontSize || '13',
            valueColor: row.valueColor || '#1f2937',
            bottomSignature: row.bottomSignature || '',
            signatureBackground: row.signatureBackground || '#1e3a5f',
            signatureColor: row.signatureColor || '#ffffff',
            signatureAlign: row.signatureAlign || 'center',
            cardLogoUrl: row.cardLogoUrl || '',
          })
          setLogoPreview(row.cardLogoUrl || '')
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

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const value = String(event.target?.result || '')
      setForm((prev) => ({ ...prev, cardLogoUrl: value }))
      setLogoPreview(value)
    }
    reader.readAsDataURL(file)
  }

  const clearLogo = () => {
    setForm((prev) => ({ ...prev, cardLogoUrl: '' }))
    setLogoPreview('')
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
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

    if (!form.bottomSignature.trim()) {
      setError('Authorized Signature / Bottom Signature is required')
      setBusy(false)
      return
    }

    try {
      const payload = {
        headOfficeId: finalHoId ? Number(finalHoId) : null,
        schoolId: Number(form.schoolId),
        borderColor: form.borderColor,
        topBackground: form.topBackground,
        cardSchoolName: form.cardSchoolName.trim() || null,
        schoolNameFontSize: form.schoolNameFontSize || null,
        schoolNameColor: form.schoolNameColor || null,
        schoolAddress: form.schoolAddress.trim() || null,
        schoolAddressColor: form.schoolAddressColor || null,
        idNoFontSize: form.idNoFontSize || null,
        idNoColor: form.idNoColor || null,
        idNoBackground: form.idNoBackground || null,
        titleFontSize: form.titleFontSize || null,
        titleColor: form.titleColor || null,
        valueFontSize: form.valueFontSize || null,
        valueColor: form.valueColor || null,
        bottomSignature: form.bottomSignature.trim(),
        signatureBackground: form.signatureBackground,
        signatureColor: form.signatureColor || null,
        signatureAlign: form.signatureAlign || null,
        cardLogoUrl: form.cardLogoUrl || null,
      }

      if (editId) {
        await updateIdCardSetting(editId, payload)
        setSuccess('ID Card Setting updated successfully!')
      } else {
        await createIdCardSetting(payload)
        setSuccess('ID Card Setting added successfully!')
      }

      setTimeout(() => {
        try {
          sessionStorage.removeItem(EDIT_STORAGE_KEY)
        } catch {}
        navigateTo('id-card-setting')
      }, 1500)
    } catch (err) {
      setError(err?.message || 'Failed to save ID card setting')
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    } catch {}
    navigateTo('id-card-setting')
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
  }

  return (
    <div className="dashboard-main-body">
      {/* Header & Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {isEdit ? 'Edit ID Card Setting' : 'Add ID Card Setting'}
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
              ID Card Setting
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
                    <label htmlFor="cardSchoolName" className="form-label fw-medium text-primary-light mb-0">School Name on ID Card</label>
                    <input
                      type="text"
                      id="cardSchoolName"
                      value={form.cardSchoolName}
                      onChange={handleChange}
                      placeholder={selectedSchoolInfo?.schoolName || 'Enter school name as it should appear on card'}
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Layout Styling Card */}
            <div className="card bg-white" style={cardStyle}>
              <div style={headerStyle}>
                <h6 className="fw-semibold text-primary-light mb-0 d-flex align-items-center gap-8">
                  <i className="ri-palette-line text-primary-600"></i> Color & Style Configuration
                </h6>
              </div>
              <div className="card-body p-24">
                <div className="row g-20">
                  
                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="borderColor" className="form-label fw-medium text-primary-light mb-0">Border Color</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="borderColor"
                        value={form.borderColor}
                        onChange={handleChange}
                        className="form-control form-control-color"
                        style={{ width: '45px', height: '40px', padding: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        id="borderColor"
                        value={form.borderColor}
                        onChange={handleChange}
                        placeholder="#e01ab5"
                        className="form-control flex-grow-1"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="topBackground" className="form-label fw-medium text-primary-light mb-0">Header Top Background Color</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="topBackground"
                        value={form.topBackground}
                        onChange={handleChange}
                        className="form-control form-control-color"
                        style={{ width: '45px', height: '40px', padding: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        id="topBackground"
                        value={form.topBackground}
                        onChange={handleChange}
                        placeholder="#3b82f6"
                        className="form-control flex-grow-1"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="col-md-4 d-flex flex-column gap-8">
                    <label htmlFor="schoolNameFontSize" className="form-label fw-medium text-primary-light mb-0">School Font Size (px)</label>
                    <input
                      type="number"
                      id="schoolNameFontSize"
                      value={form.schoolNameFontSize}
                      onChange={handleChange}
                      placeholder="e.g. 14"
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-8 d-flex flex-column gap-8">
                    <label htmlFor="schoolNameColor" className="form-label fw-medium text-primary-light mb-0">School Name Text Color</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="schoolNameColor"
                        value={form.schoolNameColor}
                        onChange={handleChange}
                        className="form-control form-control-color"
                        style={{ width: '45px', height: '40px', padding: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        id="schoolNameColor"
                        value={form.schoolNameColor}
                        onChange={handleChange}
                        placeholder="#ffffff"
                        className="form-control flex-grow-1"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Address & ID Details Card */}
            <div className="card bg-white" style={cardStyle}>
              <div style={headerStyle}>
                <h6 className="fw-semibold text-primary-light mb-0 d-flex align-items-center gap-8">
                  <i className="ri-file-text-line text-primary-600"></i> Address & Info Styling
                </h6>
              </div>
              <div className="card-body p-24">
                <div className="row g-20">
                  
                  <div className="col-md-12 d-flex flex-column gap-8">
                    <label htmlFor="schoolAddress" className="form-label fw-medium text-primary-light mb-0">School Address</label>
                    <input
                      type="text"
                      id="schoolAddress"
                      value={form.schoolAddress}
                      onChange={handleChange}
                      placeholder="Enter the school address to print on the card"
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="schoolAddressColor" className="form-label fw-medium text-primary-light mb-0">Address Text Color</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="schoolAddressColor"
                        value={form.schoolAddressColor}
                        onChange={handleChange}
                        className="form-control form-control-color"
                        style={{ width: '45px', height: '40px', padding: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        id="schoolAddressColor"
                        value={form.schoolAddressColor}
                        onChange={handleChange}
                        placeholder="#374151"
                        className="form-control flex-grow-1"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="col-md-3 d-flex flex-column gap-8">
                    <label htmlFor="idNoFontSize" className="form-label fw-medium text-primary-light mb-0">ID Number Font Size (px)</label>
                    <input
                      type="number"
                      id="idNoFontSize"
                      value={form.idNoFontSize}
                      onChange={handleChange}
                      placeholder="e.g. 12"
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-3 d-flex flex-column gap-8">
                    <label htmlFor="titleFontSize" className="form-label fw-medium text-primary-light mb-0">Label Font Size (px)</label>
                    <input
                      type="number"
                      id="titleFontSize"
                      value={form.titleFontSize}
                      onChange={handleChange}
                      placeholder="e.g. 13"
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="idNoBackground" className="form-label fw-medium text-primary-light mb-0">ID Badge Background Color</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="idNoBackground"
                        value={form.idNoBackground}
                        onChange={handleChange}
                        className="form-control form-control-color"
                        style={{ width: '45px', height: '40px', padding: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        id="idNoBackground"
                        value={form.idNoBackground}
                        onChange={handleChange}
                        placeholder="#e01ab5"
                        className="form-control flex-grow-1"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="idNoColor" className="form-label fw-medium text-primary-light mb-0">ID Badge Text Color</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="idNoColor"
                        value={form.idNoColor}
                        onChange={handleChange}
                        className="form-control form-control-color"
                        style={{ width: '45px', height: '40px', padding: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        id="idNoColor"
                        value={form.idNoColor}
                        onChange={handleChange}
                        placeholder="#ffffff"
                        className="form-control flex-grow-1"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="titleColor" className="form-label fw-medium text-primary-light mb-0">Labels Text Color (e.g. Class:)</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="titleColor"
                        value={form.titleColor}
                        onChange={handleChange}
                        className="form-control form-control-color"
                        style={{ width: '45px', height: '40px', padding: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        id="titleColor"
                        value={form.titleColor}
                        onChange={handleChange}
                        placeholder="#e01ab5"
                        className="form-control flex-grow-1"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="valueColor" className="form-label fw-medium text-primary-light mb-0">Values Text Color (e.g. Grade 5)</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="valueColor"
                        value={form.valueColor}
                        onChange={handleChange}
                        className="form-control form-control-color"
                        style={{ width: '45px', height: '40px', padding: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        id="valueColor"
                        value={form.valueColor}
                        onChange={handleChange}
                        placeholder="#1f2937"
                        className="form-control flex-grow-1"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Signature & Logo Card */}
            <div className="card bg-white" style={cardStyle}>
              <div style={headerStyle}>
                <h6 className="fw-semibold text-primary-light mb-0 d-flex align-items-center gap-8">
                  <i className="ri-pen-nib-line text-primary-600"></i> Logo & Signature Setup
                </h6>
              </div>
              <div className="card-body p-24">
                <div className="row g-20">
                  
                  <div className="col-md-12 d-flex flex-column gap-8">
                    <label htmlFor="bottomSignature" className="form-label fw-medium text-primary-light mb-0">Authorized Signature / Bottom Signature *</label>
                    <input
                      type="text"
                      id="bottomSignature"
                      value={form.bottomSignature}
                      onChange={handleChange}
                      placeholder="e.g. Principal Signature"
                      className="form-control"
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div className="col-md-4 d-flex flex-column gap-8">
                    <label htmlFor="signatureAlign" className="form-label fw-medium text-primary-light mb-0">Signature Alignment</label>
                    <select
                      id="signatureAlign"
                      value={form.signatureAlign}
                      onChange={handleChange}
                      className="form-select form-control"
                      style={inputStyle}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>

                  <div className="col-md-8 d-flex flex-column gap-8">
                    <label htmlFor="signatureBackground" className="form-label fw-medium text-primary-light mb-0">Signature Band Background Color</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="signatureBackground"
                        value={form.signatureBackground}
                        onChange={handleChange}
                        className="form-control form-control-color"
                        style={{ width: '45px', height: '40px', padding: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        id="signatureBackground"
                        value={form.signatureBackground}
                        onChange={handleChange}
                        placeholder="#1e3a5f"
                        className="form-control flex-grow-1"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="col-12 d-flex flex-column gap-8">
                    <label className="form-label fw-medium text-primary-light mb-0">Upload Card Logo</label>
                    <div
                      style={{
                        border: '2px dashed #cbd5e1',
                        borderRadius: '12px',
                        padding: '24px',
                        background: '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                      }}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Card Logo Preview"
                          style={{
                            maxWidth: '120px',
                            maxHeight: '120px',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <i className="ri-image-add-line" style={{ fontSize: '24px', color: '#475569' }}></i>
                        </div>
                      )}
                      <div className="text-center">
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                          {logoPreview ? 'Change Logo Image' : 'Select Card Logo'}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                          Recommended: Max 100px width & 110px height (.png, .jpg, .gif)
                        </p>
                      </div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleLogoChange}
                      />
                    </div>
                    {logoPreview && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger mt-8 align-self-start d-flex align-items-center gap-6"
                        onClick={clearLogo}
                      >
                        <i className="ri-delete-bin-line"></i> Remove Logo
                      </button>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="d-flex justify-content-end align-items-center gap-16 py-12 mb-40">
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
                {isEdit ? 'Update ID Card Setting' : 'Save ID Card Setting'}
              </button>
            </div>

          </form>
        </div>

        {/* Right Side: Sticky Live Preview */}
        <div className="col-lg-5 col-xl-4">
          <div className="position-sticky" style={{ top: '24px' }}>
            <div className="card bg-white animate-fade-in" style={cardStyle}>
              <div style={headerStyle}>
                <h6 className="fw-semibold text-primary-light mb-0 d-flex align-items-center gap-8">
                  <i className="ri-eye-line text-primary-600"></i> Interactive Live Preview
                </h6>
              </div>
              <div className="card-body p-24" style={{ background: '#f1f5f9' }}>
                <LiveIdCardPreview
                  form={form}
                  schoolName={selectedSchoolInfo?.schoolName || authSchoolName || 'Example School Name'}
                  headOfficeName={selectedSchoolInfo?.headOfficeId ? headOffices.find(ho => String(ho.id) === String(selectedSchoolInfo.headOfficeId))?.name : (authHeadOfficeName || 'Example Head Office')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IdCardSettingCreate
