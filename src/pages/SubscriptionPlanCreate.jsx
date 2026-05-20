import { useEffect, useState } from 'react'
import { createSubscriptionPlan, updateSubscriptionPlan } from '../apis/subscriptionPlansApi'
import { useAuth } from '../context/useAuth'

const EDIT_STORAGE_KEY = 'edit-subscription-plan-row'

const INITIAL_FORM = {
  planName: '',
  price: '',
  studentLimit: '',
  guardianLimit: '',
  teacherLimit: '',
  employeeLimit: '',
  status: 'Active',
}

const LivePlanPreview = ({ form }) => {
  return (
    <div
      className="card shadow-sm border border-neutral-200 overflow-hidden"
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        maxWidth: '350px',
        margin: '0 auto',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div 
        className="text-center p-24 text-white"
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
        }}
      >
        <span className="badge bg-white-100 text-white mb-8 px-12 py-4 rounded-pill text-xs fw-semibold uppercase" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
          {form.status || 'Active'}
        </span>
        <h4 className="fw-bold mb-4 text-white">{form.planName || 'Plan Name'}</h4>
        <div className="d-flex align-items-center justify-content-center mt-12">
          <span className="text-sm align-self-start fw-medium">$</span>
          <span className="display-6 fw-bold text-white leading-none">
            {form.price || '0'}
          </span>
          <span className="text-xs align-self-end ms-4 opacity-75">/mo</span>
        </div>
      </div>
      <div className="p-24 bg-white">
        <ul className="d-flex flex-column gap-16 list-unstyled mb-0">
          <li className="d-flex align-items-center gap-12 text-sm text-secondary-light">
            <span className="w-24-px h-24-px rounded-circle bg-success-100 text-success-600 d-flex align-items-center justify-content-center text-xs">
              <i className="ri-check-line"></i>
            </span>
            <span>Students Limit: <strong className="text-primary-light">{form.studentLimit || '0'}</strong></span>
          </li>
          <li className="d-flex align-items-center gap-12 text-sm text-secondary-light">
            <span className="w-24-px h-24-px rounded-circle bg-success-100 text-success-600 d-flex align-items-center justify-content-center text-xs">
              <i className="ri-check-line"></i>
            </span>
            <span>Guardians Limit: <strong className="text-primary-light">{form.guardianLimit || '0'}</strong></span>
          </li>
          <li className="d-flex align-items-center gap-12 text-sm text-secondary-light">
            <span className="w-24-px h-24-px rounded-circle bg-success-100 text-success-600 d-flex align-items-center justify-content-center text-xs">
              <i className="ri-check-line"></i>
            </span>
            <span>Teachers Limit: <strong className="text-primary-light">{form.teacherLimit || '0'}</strong></span>
          </li>
          <li className="d-flex align-items-center gap-12 text-sm text-secondary-light">
            <span className="w-24-px h-24-px rounded-circle bg-success-100 text-success-600 d-flex align-items-center justify-content-center text-xs">
              <i className="ri-check-line"></i>
            </span>
            <span>Employees Limit: <strong className="text-primary-light">{form.employeeLimit || '0'}</strong></span>
          </li>
        </ul>
      </div>
    </div>
  )
}

const SubscriptionPlanCreate = ({ onNavigate }) => {
  const { status: authStatus } = useAuth()
  
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : () => {}

  const [form, setForm] = useState(INITIAL_FORM)
  const [editId, setEditId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (authStatus !== 'ready') return

    try {
      const stored = sessionStorage.getItem(EDIT_STORAGE_KEY)
      if (stored) {
        const row = JSON.parse(stored)
        if (row && row.id) {
          setEditId(row.id)
          setForm({
            planName: row.planName || '',
            price: row.price != null ? String(row.price) : '',
            studentLimit: row.studentLimit || '',
            guardianLimit: row.guardianLimit || '',
            teacherLimit: row.teacherLimit || '',
            employeeLimit: row.employeeLimit || '',
            status: row.status || 'Active',
          })
        }
      }
    } catch {
      // ignore
    }
  }, [authStatus])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setBusy(true)

    if (!form.planName.trim()) {
      setError('Plan Name is required')
      setBusy(false)
      return
    }

    if (!form.price.trim()) {
      setError('Price is required')
      setBusy(false)
      return
    }

    try {
      const payload = {
        planName: form.planName.trim(),
        price: form.price === '' ? null : Number(form.price),
        studentLimit: form.studentLimit.trim(),
        guardianLimit: form.guardianLimit.trim(),
        teacherLimit: form.teacherLimit.trim(),
        employeeLimit: form.employeeLimit.trim(),
        status: form.status,
      }

      if (editId) {
        await updateSubscriptionPlan(editId, payload)
        setSuccess('Plan updated successfully!')
      } else {
        await createSubscriptionPlan(payload)
        setSuccess('Plan added successfully!')
      }

      setTimeout(() => {
        try {
          sessionStorage.removeItem(EDIT_STORAGE_KEY)
        } catch {}
        navigateTo('subscription-plans')
      }, 1500)
    } catch (err) {
      setError(err?.message || 'Failed to save subscription plan')
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    } catch {}
    navigateTo('subscription-plans')
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
            {isEdit ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
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
              Subscription Plans
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
            
            {/* Plan Details Card */}
            <div className="card bg-white" style={cardStyle}>
              <div style={headerStyle}>
                <h6 className="fw-semibold text-primary-light mb-0 d-flex align-items-center gap-8">
                  <i className="ri-medal-line text-primary-600"></i> Plan Specifications
                </h6>
              </div>
              <div className="card-body p-24">
                <div className="row g-20">
                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="planName" className="form-label fw-medium text-primary-light mb-0">Plan Name *</label>
                    <input
                      type="text"
                      id="planName"
                      value={form.planName}
                      onChange={handleChange}
                      placeholder="e.g. Gold Tier"
                      className="form-control"
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="price" className="form-label fw-medium text-primary-light mb-0">Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      id="price"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="Price per month"
                      className="form-control"
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="studentLimit" className="form-label fw-medium text-primary-light mb-0">Student Limit *</label>
                    <input
                      type="text"
                      id="studentLimit"
                      value={form.studentLimit}
                      onChange={handleChange}
                      placeholder="e.g. 500"
                      className="form-control"
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="guardianLimit" className="form-label fw-medium text-primary-light mb-0">Guardian Limit *</label>
                    <input
                      type="text"
                      id="guardianLimit"
                      value={form.guardianLimit}
                      onChange={handleChange}
                      placeholder="e.g. 1000"
                      className="form-control"
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="teacherLimit" className="form-label fw-medium text-primary-light mb-0">Teacher Limit *</label>
                    <input
                      type="text"
                      id="teacherLimit"
                      value={form.teacherLimit}
                      onChange={handleChange}
                      placeholder="e.g. 50"
                      className="form-control"
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="employeeLimit" className="form-label fw-medium text-primary-light mb-0">Employee Limit *</label>
                    <input
                      type="text"
                      id="employeeLimit"
                      value={form.employeeLimit}
                      onChange={handleChange}
                      placeholder="e.g. 20"
                      className="form-control"
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-8">
                    <label htmlFor="status" className="form-label fw-medium text-primary-light mb-0">Status</label>
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
                {isEdit ? 'Update Plan' : 'Save Plan'}
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
                  <i className="ri-eye-line text-primary-600"></i> Plan Card Preview
                </h6>
              </div>
              <div className="card-body p-24" style={{ background: '#f1f5f9' }}>
                <LivePlanPreview form={form} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPlanCreate
