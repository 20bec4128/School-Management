import { useEffect, useMemo, useState } from 'react'
import PhoneCodeField from '../components/PhoneCodeField'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import WizardPopup from '../components/WizardPopup'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createSupplier } from '../apis/suppliersApi'

const DEFAULT_PHONE_CODE = '+91'

const DEFAULT_PHONE_CODE = '+91';

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  vendorName: '',
  email: '',
  phone: '',
  contactName: '',
  address: '',
  note: '',
}

const AssetVendorCreate = ({ onNavigate }) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, schoolId: authSchoolId } = useAuth()
  const { activeSchoolId } = useSchool()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [form, setForm] = useState(emptyForm)
  const [phoneCode, setPhoneCode] = useState(DEFAULT_PHONE_CODE)
  const [headOffices, setHeadOffices] = useState([])
  const [schools, setSchools] = useState([])
  const [lookupLoading, setLookupLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const currentSchoolOptions = useMemo(() => {
    const list = Array.isArray(schools) ? schools : []
    if (isSuperAdmin) {
      if (!form.headOfficeId) return []
      return list.filter((school) => String(school.headOfficeId ?? '') === String(form.headOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return list.filter((school) => String(school.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return list.filter((school) => String(school.id ?? '') === String(authSchoolId ?? ''))
    }
    return list
  }, [authHeadOfficeId, authSchoolId, form.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, schools])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    let cancelled = false

    const loadLookups = async () => {
      setLookupLoading(true)
      try {
        const [headOfficePage, schoolRows] = await Promise.all([
          isSuperAdmin || isHeadOfficeAdmin ? fetchHeadOfficesPage(0, 500) : Promise.resolve({ content: [] }),
          fetchSchoolsLookup(),
        ])
        if (cancelled) return
        setHeadOffices(Array.isArray(headOfficePage?.content) ? headOfficePage.content : [])
        setSchools(Array.isArray(schoolRows) ? schoolRows : [])
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load vendor lookups:', err)
        setHeadOffices([])
        setSchools([])
      } finally {
        if (!cancelled) setLookupLoading(false)
      }
    }

    void loadLookups()
    return () => {
      cancelled = true
    }
  }, [isHeadOfficeAdmin, isSuperAdmin, status, token])

  useEffect(() => {
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      setForm((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
    }
  }, [authHeadOfficeId, isHeadOfficeAdmin])

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return
    const school = schools.find((row) => String(row.id ?? '') === String(authSchoolId))
    setForm((prev) => ({
      ...prev,
      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
      schoolId: String(authSchoolId),
    }))
  }, [authSchoolId, isSchoolAdmin, schools])

  useEffect(() => {
    if (!isSuperAdmin) return
    if (!manualScope.selectedHeadOfficeId) return
    const selectedSchool = manualScope.selectedSchoolId
      ? schools.find((row) => String(row.id ?? '') === String(manualScope.selectedSchoolId))
      : null
    setForm((prev) => ({
      ...prev,
      headOfficeId: String(manualScope.selectedHeadOfficeId),
      schoolId: selectedSchool?.id != null ? String(selectedSchool.id) : prev.schoolId,
    }))
  }, [isSuperAdmin, manualScope.selectedHeadOfficeId, manualScope.selectedSchoolId, schools])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const buildPayload = () => ({
    headOfficeId: form.headOfficeId ? Number(form.headOfficeId) : null,
    schoolId: form.schoolId ? Number(form.schoolId) : null,
    supplierName: String(form.vendorName || '').trim(),
    contactName: String(form.contactName || '').trim(),
    email: String(form.email || '').trim(),
    phone: `${phoneCode}${String(form.phone || '').trim()}`.trim(),
    address: String(form.address || '').trim(),
    note: String(form.note || '').trim(),
  })

  const handleSave = async (e) => {
    e.preventDefault()
    const payload = buildPayload()
    if (!payload.headOfficeId || !payload.schoolId || !payload.supplierName || !payload.contactName || !payload.phone) {
      setError('Head office, school, vendor name, contact name, and phone are required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await createSupplier(payload)
      if (onNavigate) onNavigate('asset-vendor')
    } catch (err) {
      console.error('Failed to create vendor:', err)
      setError(err?.message || 'Failed to create vendor')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Add Asset Vendor</h1>
          <span className="text-secondary-light">Asset Management / Vendor</span>
        </div>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-6"
          onClick={() => (onNavigate ? onNavigate('asset-vendor') : window.history.back())}
        >
          <i className="ri-arrow-left-line" /> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-header border-bottom border-neutral-200">
          <h6 className="text-md fw-semibold mb-0">Vendor Information</h6>
        </div>
        <div className="card-body p-24">
          {error ? <div className="alert alert-danger py-2">{error}</div> : null}
          <form onSubmit={handleSave}>
            <div className="row g-20 mb-32">
              <ManualScopeSelectors
                enabled={isSuperAdmin}
                headOffices={headOffices}
                schoolOptions={currentSchoolOptions}
                selectedHeadOfficeId={form.headOfficeId}
                selectedSchoolId={form.schoolId}
                onHeadOfficeChange={(value) => setForm((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))}
                onSchoolChange={(value) => setForm((prev) => ({ ...prev, schoolId: value }))}
                showSchoolSelector
                schoolLabel="School Name"
                compact
              />

              {!isSuperAdmin ? (
                <>
                  <input type="hidden" value={form.headOfficeId} readOnly />
                  <input type="hidden" value={form.schoolId} readOnly />
                </>
              ) : null}

              <div className="col-md-6">
                <label htmlFor="vendorName" className="form-label fw-semibold text-primary-light">
                  Name <span className="text-danger">*</span>
                </label>
                <input className="form-control" id="vendorName" placeholder="Vendor Name" value={form.vendorName} onChange={handleChange} required />
              </div>

              <div className="col-md-6">
                <label htmlFor="contactName" className="form-label fw-semibold text-primary-light">
                  Contact Name <span className="text-danger">*</span>
                </label>
                <input className="form-control" id="contactName" placeholder="Contact Name" value={form.contactName} onChange={handleChange} required />
              </div>

              <div className="col-md-6">
                <label htmlFor="email" className="form-label fw-semibold text-primary-light">Email</label>
                <input type="email" className="form-control" id="email" placeholder="Email" value={form.email} onChange={handleChange} />
              </div>

              <div className="col-md-6">
                <PhoneCodeField
                  id="phone"
                  label="Phone Number"
                  code={phoneCode}
                  value={form.phone}
                  onCodeChange={setPhoneCode}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, phone: val }))}
                  required
                />
              </div>

              <div className="col-12">
                <label htmlFor="address" className="form-label fw-semibold text-primary-light">Address</label>
                <input className="form-control" id="address" placeholder="Address" value={form.address} onChange={handleChange} />
              </div>

              <div className="col-12">
                <label htmlFor="note" className="form-label fw-semibold text-primary-light">Note</label>
                <textarea className="form-control" id="note" rows="3" placeholder="Note" value={form.note} onChange={handleChange} />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-12">
              <button type="button" className="btn btn-light border px-32" onClick={() => onNavigate?.('asset-vendor')}>Cancel</button>
              <button type="submit" className="btn btn-primary-600 px-32" disabled={saving || lookupLoading}>
                {saving ? 'Saving...' : 'Save Vendor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AssetVendorCreate
