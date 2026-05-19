import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { createAdmitCardSetting, updateAdmitCardSetting } from '../apis/admitCardSettingsApi'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-admit-card-setting-row'

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
  admitTitleFontSize: '16',
  admitTitleColor: '#ffffff',
  admitTitleBackground: '#e01ab5',
  titleFontSize: '13',
  titleColor: '#e01ab5',
  valueFontSize: '13',
  valueColor: '#1f2937',
  examTitleFontSize: '14',
  examTitleColor: '#e01ab5',
  subjectFontSize: '12',
  subjectColor: '#e01ab5',
  bottomSignature: 'Authorized Signature',
  signatureBackground: '#1e3a5f',
  signatureColor: '#ffffff',
  signatureAlign: 'center',
  cardLogoUrl: '',
}

const getSafeText = (value, fallback = '--') => {
  const text = String(value ?? '').trim()
  return text || fallback
}

const LivePreviewCard = ({ form, schoolName, headOfficeName }) => {
  const borderColor = form.borderColor || '#e01ab5'
  const topBackground = form.topBackground || borderColor
  const signatureBackground = form.signatureBackground || borderColor
  const signatureColor = form.signatureColor || '#ffffff'
  const align = form.signatureAlign || 'center'
  const admitTitleBackground = form.admitTitleBackground || topBackground
  const admitTitleColor = form.admitTitleColor || '#ffffff'

  return (
    <div
      className="rounded-3 overflow-hidden shadow-sm"
      style={{
        border: `3px solid ${borderColor}`,
        background: '#ffffff',
        width: '100%',
        maxWidth: '460px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        className="p-12 text-white"
        style={{
          background: topBackground,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: Number(form.schoolNameFontSize) || 12,
              color: form.schoolNameColor || '#ffffff',
              fontWeight: 700,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {getSafeText(form.cardSchoolName || schoolName, 'School Name')}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>Admit Card</div>
          <div style={{ fontSize: 11, opacity: 0.9, marginTop: 4 }}>
            {getSafeText(headOfficeName, 'Head Office')}
          </div>
        </div>

        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 8,
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
              style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#ffffff' }}
            />
          ) : (
            <i className="ri-image-line" style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)' }} />
          )}
        </div>
      </div>

      {/* Body info */}
      <div className="p-12" style={{ background: '#f8fafc' }}>
        <div className="rounded-3 p-12 mb-12 bg-white border border-neutral-200">
          <div
            className="rounded px-8 py-6 fw-semibold text-center mb-12"
            style={{
              background: admitTitleBackground,
              color: admitTitleColor,
              fontSize: Number(form.admitTitleFontSize) || 14,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Admit Card
          </div>

          <div className="d-flex align-items-start justify-content-between gap-12 mb-12">
            <div>
              <div className="text-secondary-light" style={{ fontSize: 10 }}>School</div>
              <div className="fw-semibold text-primary-light" style={{ fontSize: 14, lineHeight: 1.2 }}>
                {getSafeText(form.cardSchoolName || schoolName, 'School Name')}
              </div>
              <div className="mt-1" style={{ fontSize: 11, color: form.schoolAddressColor || '#475569' }}>
                {getSafeText(form.schoolAddress, 'School Address')}
              </div>
            </div>
            <div className="text-end">
              <div className="text-secondary-light" style={{ fontSize: 10 }}>Exam</div>
              <div className="fw-semibold" style={{ fontSize: Number(form.examTitleFontSize) || 12, color: form.examTitleColor || borderColor }}>
                Final Exam
              </div>
            </div>
          </div>

          <div className="row g-2">
            <div className="col-6">
              <div className="rounded p-2 bg-light border border-neutral-100">
                <div className="text-secondary-light" style={{ fontSize: 10 }}>Subject</div>
                <div className="fw-semibold" style={{ fontSize: Number(form.subjectFontSize) || 11, color: form.subjectColor || borderColor }}>
                  Mathematics
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="rounded p-2 bg-light border border-neutral-100">
                <div className="text-secondary-light" style={{ fontSize: 10 }}>Roll & Class</div>
                <div className="fw-semibold" style={{ fontSize: Number(form.titleFontSize) || 11, color: form.titleColor || borderColor }}>
                  Roll: <span style={{ color: form.valueColor || '#1f2937', fontSize: Number(form.valueFontSize) || 11 }}>102</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Signature */}
        <div
          className="rounded p-10 text-white"
          style={{
            background: signatureBackground,
            color: signatureColor,
            textAlign: align,
          }}
        >
          <div className="fw-semibold" style={{ fontSize: 13 }}>
            {getSafeText(form.bottomSignature, 'Authorized Signature')}
          </div>
        </div>
      </div>
    </div>
  )
}

const AdmitCardSettingCreate = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId, schoolName: authSchoolName, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, status: authStatus } = useAuth()
  
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : () => {}
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = String(role || '').toUpperCase() === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = String(role || '').toUpperCase() === 'SCHOOL_ADMIN'

  const [form, setForm] = useState(INITIAL_FORM)
  const [editId, setEditId] = useState(null)
  
  const [schools, setSchools] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [selectedHeadOfficeId, setSelectedHeadOfficeId] = useState('')
  
  const [logoPreview, setLogoPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const logoRef = useRef(null)

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

  const selectedHeadOfficeInfo = useMemo(() => {
    const hoId = selectedHeadOfficeId || form.headOfficeId
    if (!hoId) return null
    return headOffices.find((ho) => String(ho.id) === String(hoId)) || null
  }, [selectedHeadOfficeId, form.headOfficeId, headOffices])

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
            admitTitleFontSize: row.admitTitleFontSize || '16',
            admitTitleColor: row.admitTitleColor || '#ffffff',
            admitTitleBackground: row.admitTitleBackground || row.topBackground || '#e01ab5',
            titleFontSize: row.titleFontSize || '13',
            titleColor: row.titleColor || '#e01ab5',
            valueFontSize: row.valueFontSize || '13',
            valueColor: row.valueColor || '#1f2937',
            examTitleFontSize: row.examTitleFontSize || '14',
            examTitleColor: row.examTitleColor || '#e01ab5',
            subjectFontSize: row.subjectFontSize || '12',
            subjectColor: row.subjectColor || '#e01ab5',
            bottomSignature: row.bottomSignature || 'Authorized Signature',
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
    reader.onload = (ev) => {
      const dataUrl = String(ev.target?.result || '')
      setForm((prev) => ({ ...prev, cardLogoUrl: dataUrl }))
      setLogoPreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setForm((prev) => ({ ...prev, cardLogoUrl: '' }))
    setLogoPreview('')
    if (logoRef.current) logoRef.current.value = ''
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

    if (!form.borderColor || !form.topBackground) {
      setError('Border color and top background colors are required')
      setBusy(false)
      return
    }

    if (!form.bottomSignature) {
      setError('Bottom signature is required')
      setBusy(false)
      return
    }

    try {
      const payload = {
        headOfficeId: finalHoId ? Number(finalHoId) : null,
        schoolId: Number(form.schoolId),
        borderColor: form.borderColor,
        topBackground: form.topBackground,
        cardSchoolName: form.cardSchoolName ? form.cardSchoolName.trim() : null,
        schoolNameFontSize: form.schoolNameFontSize ? form.schoolNameFontSize.trim() : null,
        schoolNameColor: form.schoolNameColor ? form.schoolNameColor.trim() : null,
        schoolAddress: form.schoolAddress ? form.schoolAddress.trim() : null,
        schoolAddressColor: form.schoolAddressColor ? form.schoolAddressColor.trim() : null,
        admitTitleFontSize: form.admitTitleFontSize ? form.admitTitleFontSize.trim() : null,
        admitTitleColor: form.admitTitleColor ? form.admitTitleColor.trim() : null,
        admitTitleBackground: form.admitTitleBackground ? form.admitTitleBackground.trim() : null,
        titleFontSize: form.titleFontSize ? form.titleFontSize.trim() : null,
        titleColor: form.titleColor ? form.titleColor.trim() : null,
        valueFontSize: form.valueFontSize ? form.valueFontSize.trim() : null,
        valueColor: form.valueColor ? form.valueColor.trim() : null,
        examTitleFontSize: form.examTitleFontSize ? form.examTitleFontSize.trim() : null,
        examTitleColor: form.examTitleColor ? form.examTitleColor.trim() : null,
        subjectFontSize: form.subjectFontSize ? form.subjectFontSize.trim() : null,
        subjectColor: form.subjectColor ? form.subjectColor.trim() : null,
        bottomSignature: form.bottomSignature.trim(),
        signatureBackground: form.signatureBackground ? form.signatureBackground.trim() : null,
        signatureColor: form.signatureColor ? form.signatureColor.trim() : null,
        signatureAlign: form.signatureAlign ? form.signatureAlign.trim() : null,
        cardLogoUrl: form.cardLogoUrl || null,
      }

      if (editId) {
        await updateAdmitCardSetting(editId, payload)
        setSuccess('Admit card setting updated successfully!')
      } else {
        await createAdmitCardSetting(payload)
        setSuccess('Admit card setting added successfully!')
      }

      setTimeout(() => {
        try {
          sessionStorage.removeItem(EDIT_STORAGE_KEY)
        } catch {}
        navigateTo('admit-card-setting')
      }, 1500)
    } catch (err) {
      setError(err?.message || 'Failed to save admit card setting')
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    } catch {}
    navigateTo('admit-card-setting')
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
            {isEdit ? 'Edit Admit Card Setting' : 'Add Admit Card Setting'}
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
              Admit Card Setting
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
                  <i className="ri-global-line text-primary-600"></i> Scope Selection & Styling
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
                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="borderColor" className="form-label fw-medium text-primary-light mb-0">Border Color *</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="borderColor"
                        value={form.borderColor}
                        onChange={handleChange}
                        className="form-control form-control-color border-neutral-300 rounded-3 cursor-pointer"
                        style={{ width: 44, height: 40, padding: 4 }}
                      />
                      <input
                        type="text"
                        id="borderColor"
                        value={form.borderColor}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="#000000"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="topBackground" className="form-label fw-medium text-primary-light mb-0">Top Background Color *</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="topBackground"
                        value={form.topBackground}
                        onChange={handleChange}
                        className="form-control form-control-color border-neutral-300 rounded-3 cursor-pointer"
                        style={{ width: 44, height: 40, padding: 4 }}
                      />
                      <input
                        type="text"
                        id="topBackground"
                        value={form.topBackground}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="#000000"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* School details on Card */}
            <div className="card bg-white" style={cardStyle}>
              <div style={headerStyle}>
                <h6 className="fw-semibold text-primary-light mb-0 d-flex align-items-center gap-8">
                  <i className="ri-school-line text-primary-600"></i> Card Header & Address
                </h6>
              </div>
              <div className="card-body p-24">
                <div className="row g-20">
                  <div className="col-md-12 d-flex flex-column gap-8">
                    <label htmlFor="cardSchoolName" className="form-label fw-medium text-primary-light mb-0">School Name on Card</label>
                    <input
                      type="text"
                      id="cardSchoolName"
                      value={form.cardSchoolName}
                      onChange={handleChange}
                      placeholder={selectedSchoolInfo?.schoolName || 'Enter custom school name'}
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="schoolNameFontSize" className="form-label fw-medium text-primary-light mb-0">School Name Font Size (px)</label>
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

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="schoolNameColor" className="form-label fw-medium text-primary-light mb-0">School Name Color</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="schoolNameColor"
                        value={form.schoolNameColor}
                        onChange={handleChange}
                        className="form-control form-control-color border-neutral-300 rounded-3 cursor-pointer"
                        style={{ width: 44, height: 40, padding: 4 }}
                      />
                      <input
                        type="text"
                        id="schoolNameColor"
                        value={form.schoolNameColor}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="#000000"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="col-md-12 d-flex flex-column gap-8">
                    <label htmlFor="schoolAddress" className="form-label fw-medium text-primary-light mb-0">School Address</label>
                    <input
                      type="text"
                      id="schoolAddress"
                      value={form.schoolAddress}
                      onChange={handleChange}
                      placeholder="Enter school address"
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="schoolAddressColor" className="form-label fw-medium text-primary-light mb-0">School Address Color</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="schoolAddressColor"
                        value={form.schoolAddressColor}
                        onChange={handleChange}
                        className="form-control form-control-color border-neutral-300 rounded-3 cursor-pointer"
                        style={{ width: 44, height: 40, padding: 4 }}
                      />
                      <input
                        type="text"
                        id="schoolAddressColor"
                        value={form.schoolAddressColor}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="#000000"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Titles & Fields Font Styles */}
            <div className="card bg-white" style={cardStyle}>
              <div style={headerStyle}>
                <h6 className="fw-semibold text-primary-light mb-0 d-flex align-items-center gap-8">
                  <i className="ri-font-color text-primary-600"></i> Admit & Text Styles
                </h6>
              </div>
              <div className="card-body p-24">
                <div className="row g-20">
                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="admitTitleFontSize" className="form-label fw-medium text-primary-light mb-0">Admit Title Font Size</label>
                    <input
                      type="number"
                      id="admitTitleFontSize"
                      value={form.admitTitleFontSize}
                      onChange={handleChange}
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="admitTitleColor" className="form-label fw-medium text-primary-light mb-0">Admit Title Color</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="admitTitleColor"
                        value={form.admitTitleColor}
                        onChange={handleChange}
                        className="form-control form-control-color border-neutral-300 rounded-3 cursor-pointer"
                        style={{ width: 44, height: 40, padding: 4 }}
                      />
                      <input
                        type="text"
                        id="admitTitleColor"
                        value={form.admitTitleColor}
                        onChange={handleChange}
                        className="form-control"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="admitTitleBackground" className="form-label fw-medium text-primary-light mb-0">Admit Title Background</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="admitTitleBackground"
                        value={form.admitTitleBackground}
                        onChange={handleChange}
                        className="form-control form-control-color border-neutral-300 rounded-3 cursor-pointer"
                        style={{ width: 44, height: 40, padding: 4 }}
                      />
                      <input
                        type="text"
                        id="admitTitleBackground"
                        value={form.admitTitleBackground}
                        onChange={handleChange}
                        className="form-control"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="examTitleFontSize" className="form-label fw-medium text-primary-light mb-0">Exam Title Font Size</label>
                    <input
                      type="number"
                      id="examTitleFontSize"
                      value={form.examTitleFontSize}
                      onChange={handleChange}
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="examTitleColor" className="form-label fw-medium text-primary-light mb-0">Exam Title Color</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="examTitleColor"
                        value={form.examTitleColor}
                        onChange={handleChange}
                        className="form-control form-control-color border-neutral-300 rounded-3 cursor-pointer"
                        style={{ width: 44, height: 40, padding: 4 }}
                      />
                      <input
                        type="text"
                        id="examTitleColor"
                        value={form.examTitleColor}
                        onChange={handleChange}
                        className="form-control"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="titleFontSize" className="form-label fw-medium text-primary-light mb-0">Label Font Size</label>
                    <input
                      type="number"
                      id="titleFontSize"
                      value={form.titleFontSize}
                      onChange={handleChange}
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="titleColor" className="form-label fw-medium text-primary-light mb-0">Label Color</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="titleColor"
                        value={form.titleColor}
                        onChange={handleChange}
                        className="form-control form-control-color border-neutral-300 rounded-3 cursor-pointer"
                        style={{ width: 44, height: 40, padding: 4 }}
                      />
                      <input
                        type="text"
                        id="titleColor"
                        value={form.titleColor}
                        onChange={handleChange}
                        className="form-control"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="valueFontSize" className="form-label fw-medium text-primary-light mb-0">Value Font Size</label>
                    <input
                      type="number"
                      id="valueFontSize"
                      value={form.valueFontSize}
                      onChange={handleChange}
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="valueColor" className="form-label fw-medium text-primary-light mb-0">Value Color</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="valueColor"
                        value={form.valueColor}
                        onChange={handleChange}
                        className="form-control form-control-color border-neutral-300 rounded-3 cursor-pointer"
                        style={{ width: 44, height: 40, padding: 4 }}
                      />
                      <input
                        type="text"
                        id="valueColor"
                        value={form.valueColor}
                        onChange={handleChange}
                        className="form-control"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="subjectFontSize" className="form-label fw-medium text-primary-light mb-0">Subject Font Size</label>
                    <input
                      type="number"
                      id="subjectFontSize"
                      value={form.subjectFontSize}
                      onChange={handleChange}
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="subjectColor" className="form-label fw-medium text-primary-light mb-0">Subject Color</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="subjectColor"
                        value={form.subjectColor}
                        onChange={handleChange}
                        className="form-control form-control-color border-neutral-300 rounded-3 cursor-pointer"
                        style={{ width: 44, height: 40, padding: 4 }}
                      />
                      <input
                        type="text"
                        id="subjectColor"
                        value={form.subjectColor}
                        onChange={handleChange}
                        className="form-control"
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
                  <i className="ri-pen-nib-line text-primary-600"></i> Signature & Logo
                </h6>
              </div>
              <div className="card-body p-24">
                <div className="row g-20">
                  <div className="col-md-12 d-flex flex-column gap-8">
                    <label htmlFor="bottomSignature" className="form-label fw-medium text-primary-light mb-0">Bottom Signature Text *</label>
                    <input
                      type="text"
                      id="bottomSignature"
                      value={form.bottomSignature}
                      onChange={handleChange}
                      placeholder="e.g. Authorized Signature"
                      className="form-control"
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="signatureAlign" className="form-label fw-medium text-primary-light mb-0">Signature Alignment</label>
                    <select
                      id="signatureAlign"
                      value={form.signatureAlign}
                      onChange={handleChange}
                      className="form-select"
                      style={inputStyle}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="signatureBackground" className="form-label fw-medium text-primary-light mb-0">Signature Background Color</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="signatureBackground"
                        value={form.signatureBackground}
                        onChange={handleChange}
                        className="form-control form-control-color border-neutral-300 rounded-3 cursor-pointer"
                        style={{ width: 44, height: 40, padding: 4 }}
                      />
                      <input
                        type="text"
                        id="signatureBackground"
                        value={form.signatureBackground}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="#000000"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="signatureColor" className="form-label fw-medium text-primary-light mb-0">Signature Text Color</label>
                    <div className="d-flex align-items-center gap-12">
                      <input
                        type="color"
                        id="signatureColor"
                        value={form.signatureColor}
                        onChange={handleChange}
                        className="form-control form-control-color border-neutral-300 rounded-3 cursor-pointer"
                        style={{ width: 44, height: 40, padding: 4 }}
                      />
                      <input
                        type="text"
                        id="signatureColor"
                        value={form.signatureColor}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="#ffffff"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label className="form-label fw-medium text-primary-light mb-0">Card Logo</label>
                    
                    <div
                      style={{
                        border: '2px dashed #cbd5e1',
                        borderRadius: '12px',
                        padding: '20px',
                        background: '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                      }}
                      onClick={() => logoRef.current?.click()}
                    >
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          style={{
                            maxWidth: 100,
                            maxHeight: 110,
                            objectFit: 'contain',
                            borderRadius: 8,
                            border: '1px solid #cbd5e1',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            background: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <i className="ri-image-add-line" style={{ fontSize: '1.4rem', color: '#475569' }}></i>
                        </div>
                      )}
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                          {logoPreview ? 'Change Logo' : 'Upload Logo'}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                          Dimension:- Max-W: 100px, Max-H: 110px
                        </p>
                      </div>
                      <input
                        ref={logoRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.gif"
                        style={{ display: 'none' }}
                        onChange={handleLogoChange}
                      />
                    </div>

                    {logoPreview ? (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm align-self-start mt-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveLogo()
                        }}
                      >
                        <i className="ri-delete-bin-line"></i> Remove Logo
                      </button>
                    ) : null}
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
                {isEdit ? 'Update Setting' : 'Save Setting'}
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
                  <i className="ri-eye-line text-primary-600"></i> Dynamic Live Preview
                </h6>
              </div>
              <div className="card-body p-24" style={{ background: '#f1f5f9' }}>
                <LivePreviewCard
                  form={form}
                  schoolName={selectedSchoolInfo?.schoolName || authSchoolName || 'Example School'}
                  headOfficeName={selectedHeadOfficeInfo?.name || authHeadOfficeName || 'Example Head Office'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdmitCardSettingCreate
