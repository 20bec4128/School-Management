import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSubscriptionPlans } from '../apis/subscriptionPlansApi'
import { createSchoolSubscription, updateSchoolSubscription } from '../apis/schoolSubscriptionsApi'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import PhoneCodeField from '../components/PhoneCodeField'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-school-subscription-row'

const INITIAL_FORM = {
  headOfficeId: '',
  schoolId: '',
  planId: '',
  planName: '',
  price: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  startDate: '',
  endDate: '',
  status: 'Active',
}

const LiveSubscriptionPreview = ({ form, planName, schoolName }) => {
  return (
    <div
      className="rounded-3 overflow-hidden shadow-sm border border-neutral-200"
      style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '380px',
        margin: '0 auto',
        padding: '24px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-16 pb-12 border-bottom">
        <div>
          <span 
            className={`badge px-10 py-4 text-xs font-semibold uppercase ${
              form.status === 'Active' ? 'bg-success-100 text-success-600' : 'bg-danger-100 text-danger-600'
            }`}
          >
            {form.status || 'Active'}
          </span>
        </div>
        <div className="text-end">
          <div className="text-secondary-light text-xs">Price</div>
          <div className="fw-bold text-primary-light text-lg">
            {form.price ? `$${Number(form.price).toFixed(2)}` : '$0.00'}
          </div>
        </div>
      </div>

      <div className="mb-16">
        <div className="text-secondary-light text-xs mb-4">School</div>
        <div className="fw-semibold text-primary-light text-sm">
          {schoolName || 'Not Selected'}
        </div>
      </div>

      <div className="mb-16">
        <div className="text-secondary-light text-xs mb-4">Plan Package</div>
        <div className="fw-bold text-primary-600 text-sm">
          {form.planName || planName || 'No Plan Selected'}
        </div>
      </div>

      <div className="mb-16">
        <div className="text-secondary-light text-xs mb-4">Subscriber Details</div>
        <div className="fw-semibold text-primary-light text-sm">
          {form.name || 'Not Provided'}
        </div>
        {form.email && (
          <div className="text-secondary-light text-xs mt-1">
            <i className="ri-mail-line me-4"></i>{form.email}
          </div>
        )}
        {form.phone && (
          <div className="text-secondary-light text-xs">
            <i className="ri-phone-line me-4"></i>{form.phone}
          </div>
        )}
      </div>

      <div className="row g-2 pt-12 border-top">
        <div className="col-6">
          <div className="text-secondary-light text-xs">Start Date</div>
          <div className="fw-semibold text-primary-light text-xs">
            {form.startDate || 'YYYY-MM-DD'}
          </div>
        </div>
        <div className="col-6 text-end">
          <div className="text-secondary-light text-xs">End Date</div>
          <div className="fw-semibold text-primary-light text-xs">
            {form.endDate || 'YYYY-MM-DD'}
          </div>
        </div>
      </div>
    </div>
  )
}

const SchoolSubscriptionCreate = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId, schoolName: authSchoolName, headOfficeId: authHeadOfficeId, status: authStatus, pagePermissions, isSuperAdminRole } = useAuth()
  
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : () => {}
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = String(role || '').toUpperCase() === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = String(role || '').toUpperCase() === 'SCHOOL_ADMIN'
  const canViewSubscriptionPlans = authStatus === 'ready' && (isSuperAdminRole || pagePermissions?.['subscription-plans']?.view === true)
  const currentSchoolOption = useMemo(() => {
    if (!isSchoolAdmin || authSchoolId == null) return null
    return {
      id: authSchoolId,
      schoolName: authSchoolName || `School ${authSchoolId}`,
      headOfficeId: authHeadOfficeId ?? null,
    }
  }, [authHeadOfficeId, authSchoolId, authSchoolName, isSchoolAdmin])

  const [form, setForm] = useState(INITIAL_FORM)
  const [editId, setEditId] = useState(null)
  
  const [schools, setSchools] = useState([])
  const [plans, setPlans] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [selectedHeadOfficeId, setSelectedHeadOfficeId] = useState('')
  
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadSchoolsAndPlans = useCallback(async () => {
    try {
      if (isSchoolAdmin) {
        setSchools(currentSchoolOption ? [currentSchoolOption] : [])
        setPlans(canViewSubscriptionPlans ? await fetchSubscriptionPlans() : [])
        return
      }
      const [schoolList, planList] = await Promise.all([
        fetchSchoolsLookup(),
        canViewSubscriptionPlans ? fetchSubscriptionPlans() : Promise.resolve([]),
      ])
      setSchools(Array.isArray(schoolList) ? schoolList : [])
      setPlans(Array.isArray(planList) ? planList : [])
    } catch {
      // ignore
    }
  }, [canViewSubscriptionPlans, currentSchoolOption, isSchoolAdmin])

  const loadHeadOffices = useCallback(async () => {
    try {
      const data = await fetchHeadOfficesPage(0, 500)
      const list = Array.isArray(data?.content) ? data.content : []
      setHeadOffices(
        list
          .map((ho) => ({ id: ho?.id, name: ho?.name || ho?.headOfficeName || '' }))
          .filter((ho) => ho.id != null && ho.name)
          .sort((a, b) => String(a.name).localeCompare(String(b.name))),
      )
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    void loadSchoolsAndPlans()
    if (isSuperAdmin) {
      void loadHeadOffices()
    }
  }, [loadSchoolsAndPlans, loadHeadOffices, isSuperAdmin])

  // Get current active school info
  const selectedSchoolInfo = useMemo(() => {
    if (!form.schoolId) return null
    return schools.find((s) => String(s.id) === String(form.schoolId)) || null
  }, [form.schoolId, schools])

  // Resolve plan name
  const selectedPlanName = useMemo(() => {
    if (!form.planId) return ''
    const found = plans.find((p) => String(p.id) === String(form.planId))
    return found?.planName || ''
  }, [form.planId, plans])

  const schoolOptions = useMemo(() => {
    if (isSchoolAdmin) {
      return currentSchoolOption ? [currentSchoolOption] : []
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
  }, [authHeadOfficeId, authSchoolId, authSchoolName, currentSchoolOption, isHeadOfficeAdmin, isSchoolAdmin, schools, selectedHeadOfficeId])

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
            planId: row.planId != null ? String(row.planId) : '',
            planName: row.planName || '',
            price: row.price != null ? String(row.price) : '',
            name: row.name || '',
            email: row.email || '',
            phone: row.phone || '',
            address: row.address || '',
            startDate: row.startDate || '',
            endDate: row.endDate || '',
            status: row.status || 'Active',
          })
        }
      }
    } catch {
      // ignore
    }
  }, [authHeadOfficeId, authSchoolId, authStatus, isHeadOfficeAdmin, isSchoolAdmin, schools])

  const handleChange = (e) => {
    const { id, value } = e.target
    if (id === 'planId') {
      const foundPlan = plans.find((p) => String(p.id) === String(value))
      setForm((prev) => ({
        ...prev,
        planId: value,
        planName: foundPlan?.planName || '',
        price: foundPlan?.price != null ? String(foundPlan.price) : '',
      }))
      return
    }
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

    if (!form.planId && !form.planName.trim()) {
      setError('Please select or specify a Plan')
      setBusy(false)
      return
    }

    if (!form.name.trim()) {
      setError('Subscriber Name is required')
      setBusy(false)
      return
    }

    try {
      const payload = {
        headOfficeId: finalHoId ? Number(finalHoId) : null,
        schoolId: Number(form.schoolId),
        planId: form.planId ? Number(form.planId) : null,
        planName: form.planName ? form.planName.trim() : (selectedPlanName || ''),
        price: form.price === '' ? null : Number(form.price),
        name: form.name.trim(),
        email: form.email ? form.email.trim() : '',
        phone: form.phone ? form.phone.trim() : '',
        address: form.address ? form.address.trim() : '',
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        status: form.status,
      }

      if (editId) {
        await updateSchoolSubscription(editId, payload)
        setSuccess('Subscription updated successfully!')
      } else {
        await createSchoolSubscription(payload)
        setSuccess('Subscription added successfully!')
      }

      setTimeout(() => {
        try {
          sessionStorage.removeItem(EDIT_STORAGE_KEY)
        } catch {}
        navigateTo('school-subscription')
      }, 1500)
    } catch (err) {
      setError(err?.message || 'Failed to save subscription')
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    } catch {}
    navigateTo('school-subscription')
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
            {isEdit ? 'Edit School Subscription' : 'Add School Subscription'}
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
              School Subscription
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
                  <i className="ri-global-line text-primary-600"></i> Scope & School Information
                </h6>
              </div>
              <div className="card-body p-24">
                <div className="row g-20">
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
              </div>
            </div>

            {/* Plan Details Card */}
            <div className="card bg-white" style={cardStyle}>
              <div style={headerStyle}>
                <h6 className="fw-semibold text-primary-light mb-0 d-flex align-items-center gap-8">
                  <i className="ri-medal-line text-primary-600"></i> Subscription Plan Details
                </h6>
              </div>
              <div className="card-body p-24">
                <div className="row g-20">
                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="planId" className="form-label fw-medium text-primary-light mb-0">Select Plan *</label>
                    <select
                      id="planId"
                      value={form.planId}
                      onChange={handleChange}
                      className="form-select"
                      style={inputStyle}
                    >
                      <option value="">--Select Plan--</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.planName} (${p.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="planName" className="form-label fw-medium text-primary-light mb-0">Plan Custom Name</label>
                    <input
                      type="text"
                      id="planName"
                      value={form.planName}
                      onChange={handleChange}
                      placeholder="e.g. Platinum Premium"
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="price" className="form-label fw-medium text-primary-light mb-0">Plan Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      id="price"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="status" className="form-label fw-medium text-primary-light mb-0">Subscription Status</label>
                    <select
                      id="status"
                      value={form.status}
                      onChange={handleChange}
                      className="form-select"
                      style={inputStyle}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscriber Details Card */}
            <div className="card bg-white" style={cardStyle}>
              <div style={headerStyle}>
                <h6 className="fw-semibold text-primary-light mb-0 d-flex align-items-center gap-8">
                  <i className="ri-user-line text-primary-600"></i> Subscriber & Contact Information
                </h6>
              </div>
              <div className="card-body p-24">
                <div className="row g-20">
                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="name" className="form-label fw-medium text-primary-light mb-0">Subscriber Name *</label>
                    <input
                      type="text"
                      id="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Full Name"
                      className="form-control"
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="email" className="form-label fw-medium text-primary-light mb-0">Subscriber Email</label>
                    <input
                      type="email"
                      id="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <PhoneCodeField
                      id="phone"
                      label="Subscriber Phone"
                      value={form.phone}
                      onChange={(val) => setForm((prev) => ({ ...prev, phone: val }))}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="address" className="form-label fw-medium text-primary-light mb-0">Subscriber Address</label>
                    <input
                      type="text"
                      id="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Full Address"
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="startDate" className="form-label fw-medium text-primary-light mb-0">Start Date</label>
                    <input
                      type="date"
                      id="startDate"
                      value={form.startDate}
                      onChange={handleChange}
                      className="form-control"
                      style={inputStyle}
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="endDate" className="form-label fw-medium text-primary-light mb-0">End Date</label>
                    <input
                      type="date"
                      id="endDate"
                      value={form.endDate}
                      onChange={handleChange}
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
                {isEdit ? 'Update Subscription' : 'Save Subscription'}
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
                  <i className="ri-eye-line text-primary-600"></i> Subscription Summary
                </h6>
              </div>
              <div className="card-body p-24" style={{ background: '#f1f5f9' }}>
                <LiveSubscriptionPreview
                  form={form}
                  planName={selectedPlanName}
                  schoolName={selectedSchoolInfo?.schoolName || authSchoolName || 'Not Selected'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SchoolSubscriptionCreate
