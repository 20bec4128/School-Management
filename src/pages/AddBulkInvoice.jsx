import { useCallback, useEffect, useMemo, useState } from 'react'
import '../assets/css/addModalShared.css'

import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchStudentsByClassSection } from '../apis/studentsApi'
import { fetchFeeTypes } from '../apis/feeTypesApi'
import { fetchDiscounts } from '../apis/discountsApi'
import { createFeeCollection } from '../apis/feeCollectionApi'
import { normalizeRole } from '../utils/roles'
import ManualScopeSelectors from '../components/ManualScopeSelectors'

const STEPS = ['Basic Information', 'Fee Details', 'Payment Details']

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  classId: '',
  feeTypeId: '',
  discountId: '',
  feeAmount: '0.00',
  isApplicableDiscount: 'No',
  month: '',
  paidStatus: 'Unpaid',
  note: '',
  grossAmount: '0.00',
  discount: '0.00',
  netAmount: '0.00',
  dueAmount: '0.00',
}

const monthOptions = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const applicableDiscountOptions = ['Yes', 'No']
const paidStatusOptions = ['Paid', 'Unpaid', 'Partial']

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  Class: 'ri-group-line',
  'Fee Type': 'ri-file-list-line',
  'Fee Amount': 'ri-coin-line',
  Month: 'ri-calendar-line',
  'Is Applicable Discount?': 'ri-discount-line',
  'Discount Type': 'ri-price-tag-3-line',
  'Paid Status': 'ri-checkbox-circle-line',
  Note: 'ri-file-text-line',
}

const FormField = ({ label, required, children, full = false, noIcon = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'

  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>

      {!noIcon ? (
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
              lineHeight: 1,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <i className={icon} />
          </span>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

const AddBulkInvoice = ({ onNavigate } = {}) => {
  const {
    status,
    token,
    user,
    role: authRole,
    headOfficeId: authHeadOfficeId,
    headOfficeName,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
  } = useAuth()

  const role = useMemo(
    () => normalizeRole(authRole || user?.role || user?.userRole || user?.authority),
    [authRole, user],
  )

  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : null
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [headOffices, setHeadOffices] = useState([])
  const [schools, setSchools] = useState([])
  const [classes, setClasses] = useState([])
  const [feeTypes, setFeeTypes] = useState([])
  const [discounts, setDiscounts] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [form, setForm] = useState(() => {
    const base = { ...emptyForm }

    if (isSchoolAdmin) {
      base.headOfficeId = authHeadOfficeId != null ? String(authHeadOfficeId) : ''
      base.schoolId = authSchoolId != null ? String(authSchoolId) : ''
    } else if (isHeadOfficeAdmin) {
      base.headOfficeId = authHeadOfficeId != null ? String(authHeadOfficeId) : ''
    }

    return base
  })

  const schoolsById = useMemo(() => {
    const map = new Map()
    for (const school of Array.isArray(schools) ? schools : []) {
      if (school?.id == null) continue
      map.set(String(school.id), school)
    }
    return map
  }, [schools])

  const currentSchoolId = isSchoolAdmin ? authSchoolId : form.schoolId

  const schoolOptions = useMemo(() => {
    const rows = Array.isArray(schools) ? schools : []

    if (isSuperAdmin) {
      if (!manualScope.selectedHeadOfficeId) return []
      return rows.filter((school) => String(school.headOfficeId ?? '') === String(manualScope.selectedHeadOfficeId))
    }

    if (isHeadOfficeAdmin) {
      return rows.filter((school) => String(school.headOfficeId ?? '') === String(authHeadOfficeId))
    }

    if (isSchoolAdmin) {
      return rows.filter((school) => String(school.id ?? '') === String(authSchoolId))
    }

    return rows
  }, [schools, isSuperAdmin, isHeadOfficeAdmin, isSchoolAdmin, manualScope.selectedHeadOfficeId, authHeadOfficeId, authSchoolId])

  const classOptions = useMemo(() => {
    const rows = Array.isArray(classes) ? classes : []
    if (!currentSchoolId) return []
    return rows.filter((row) => String(row?.schoolId ?? '') === String(currentSchoolId))
  }, [classes, currentSchoolId])

  const feeTypeOptions = useMemo(() => {
    const rows = Array.isArray(feeTypes) ? feeTypes : []
    if (!currentSchoolId) return []
    return rows.filter((row) => String(row?.schoolId ?? '') === String(currentSchoolId))
  }, [feeTypes, currentSchoolId])

  const discountOptions = useMemo(() => {
    const rows = Array.isArray(discounts) ? discounts : []
    if (!currentSchoolId) return []
    return rows.filter((row) => String(row?.schoolId ?? '') === String(currentSchoolId))
  }, [discounts, currentSchoolId])

  const calculateDiscountAmount = useCallback(
    (draftForm, discountId) => {
      const selected = discountOptions.find((item) => String(item?.id ?? '') === String(discountId))
      if (!selected || draftForm?.isApplicableDiscount !== 'Yes') return 0

      const feeAmount = Number(draftForm?.feeAmount || 0)
      const baseAmount = Number(selected?.amount || 0)

      if (String(selected?.discountType || '').toLowerCase() === 'percentage') {
        return (feeAmount * baseAmount) / 100
      }

      return baseAmount
    },
    [discountOptions],
  )

  const recalcTotals = useCallback(
    (draftForm, nextDiscountId = draftForm?.discountId) => {
      const feeAmount = Number(draftForm?.feeAmount || 0)
      const discountAmount =
        draftForm?.isApplicableDiscount === 'Yes' ? calculateDiscountAmount(draftForm, nextDiscountId) : 0
      const netAmount = Math.max(feeAmount - discountAmount, 0)
      const dueAmount = draftForm?.paidStatus === 'Paid' ? 0 : netAmount

      return {
        discountId: draftForm?.isApplicableDiscount === 'Yes' ? (nextDiscountId || '') : '',
        grossAmount: feeAmount.toFixed(2),
        discount: discountAmount.toFixed(2),
        netAmount: netAmount.toFixed(2),
        dueAmount: dueAmount.toFixed(2),
      }
    },
    [calculateDiscountAmount],
  )

  const validateStep = useCallback(
    (step) => {
      if (step === 0) {
        if (isSuperAdmin && !String(form.headOfficeId || '').trim()) return 'Head office is required.'
        if (!String(currentSchoolId || '').trim()) return 'School is required.'
        if (!String(form.classId || '').trim()) return 'Class is required.'
      }
      if (step === 1) {
        if (!String(form.feeTypeId || '').trim()) return 'Fee type is required.'
        if (!String(form.feeAmount || '').trim()) return 'Fee amount is required.'
        if (!String(form.month || '').trim()) return 'Month is required.'
      }
      if (step === 2) {
        if (!String(form.isApplicableDiscount || '').trim()) return 'Discount selection is required.'
        if (form.isApplicableDiscount === 'Yes' && !String(form.discountId || '').trim()) return 'Discount type is required.'
        if (!String(form.paidStatus || '').trim()) return 'Paid status is required.'
      }
      return ''
    },
    [currentSchoolId, form, isSuperAdmin],
  )

  const handleChange = (e) => {
    const { id, value } = e.target

    setForm((prev) => ({
      ...prev,
      [id]: value,
      ...(id === 'headOfficeId' ? { schoolId: '', classId: '', feeTypeId: '', discountId: '' } : {}),
      ...(id === 'schoolId' ? { classId: '', feeTypeId: '', discountId: '' } : {}),
      ...(id === 'classId' ? { feeTypeId: '', discountId: '' } : {}),
      ...(id === 'discountId' ? recalcTotals({ ...prev, [id]: value, isApplicableDiscount: 'Yes' }, value) : {}),
      ...((id === 'feeAmount' || id === 'isApplicableDiscount' || id === 'paidStatus')
        ? recalcTotals({ ...prev, [id]: value }, prev.discountId)
        : {}),
    }))

    if (id === 'headOfficeId' && isSuperAdmin) {
      manualScope.setSelectedScope(value, '')
    }

    if (id === 'schoolId' && isSuperAdmin) {
      manualScope.setSelectedScope(form.headOfficeId, value)
    }
  }

  useEffect(() => () => {
    try {
      sessionStorage.removeItem('edit-bulk-invoice-row')
    } catch {}
  }, [])

  useEffect(() => {
    if (status !== 'ready' || !token) return

    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const promises = []

        if (isSuperAdmin || isHeadOfficeAdmin) {
          promises.push(
            fetchHeadOfficesPage(0, 500)
              .then((page) => setHeadOffices(Array.isArray(page?.content) ? page.content : []))
              .catch(() => setHeadOffices([])),
          )
        }

        promises.push(
          fetchSchoolsLookup()
            .then((list) => setSchools(Array.isArray(list) ? list : []))
            .catch(() => setSchools([])),
        )

        promises.push(
          fetchClasses()
            .then((list) => setClasses(Array.isArray(list) ? list : []))
            .catch(() => setClasses([])),
        )

        await Promise.all(promises)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [status, token, isSuperAdmin, isHeadOfficeAdmin])

  useEffect(() => {
    if (!currentSchoolId) {
      setFeeTypes([])
      setDiscounts([])
      return
    }

    fetchFeeTypes({ schoolId: currentSchoolId })
      .then((data) => setFeeTypes(Array.isArray(data) ? data : []))
      .catch(() => setFeeTypes([]))

    fetchDiscounts({ schoolId: currentSchoolId })
      .then((data) => setDiscounts(Array.isArray(data) ? data : []))
      .catch(() => setDiscounts([]))
  }, [currentSchoolId])

  useEffect(() => {
    if (!currentSchoolId || !form.classId) {
      setStudents([])
      return
    }

    fetchStudentsByClassSection({ schoolId: currentSchoolId, classId: form.classId })
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .catch(() => setStudents([]))
  }, [currentSchoolId, form.classId])

  useEffect(() => {
    if (!isSuperAdmin) return
    if (manualScope.selectedHeadOfficeId && manualScope.selectedSchoolId) return

    if (form.schoolId && !form.headOfficeId) {
      const school = schoolsById.get(String(form.schoolId))
      if (school?.headOfficeId != null) {
        setForm((prev) => ({ ...prev, headOfficeId: String(school.headOfficeId) }))
      }
    }
  }, [isSuperAdmin, manualScope.selectedHeadOfficeId, manualScope.selectedSchoolId, form.schoolId, form.headOfficeId, schoolsById])

  const schoolLabel = isSchoolAdmin ? (authSchoolName || 'School') : 'School'

  const goToStep = (nextStep) => {
    if (nextStep <= activeStep) {
      setActiveStep(nextStep)
      return
    }

    const message = validateStep(activeStep)
    if (message) {
      setError(message)
      return
    }

    setError('')
    setActiveStep(nextStep)
  }

  const handleNext = () => {
    const message = validateStep(activeStep)
    if (message) {
      setError(message)
      return
    }

    setError('')
    setActiveStep((prev) => Math.min(STEPS.length - 1, prev + 1))
  }

  const handleBack = () => {
    setError('')
    setActiveStep((prev) => Math.max(0, prev - 1))
  }

  const buildPayload = (studentId) => {
    const feeAmount = Number(form.feeAmount || 0)
    const discountAmount = form.isApplicableDiscount === 'Yes' ? calculateDiscountAmount(form, form.discountId) : 0
    const netAmount = Math.max(feeAmount - discountAmount, 0)
    const dueAmount = form.paidStatus === 'Paid' ? 0 : netAmount

    return {
      headOfficeId: form.headOfficeId ? Number(form.headOfficeId) : null,
      schoolId: Number(currentSchoolId),
      classId: Number(form.classId),
      studentId: Number(studentId),
      feeTypeId: Number(form.feeTypeId),
      discountId: form.isApplicableDiscount === 'Yes' && form.discountId ? Number(form.discountId) : null,
      feeAmount,
      month: String(form.month || ''),
      isApplicableDiscount: form.isApplicableDiscount === 'Yes',
      paidStatus: String(form.paidStatus || 'Unpaid'),
      note: form.note || '',
      grossAmount: feeAmount,
      netAmount,
      discount: discountAmount,
      dueAmount,
    }
  }

  const save = async () => {
    const message = validateStep(activeStep)
    if (message) {
      setError(message)
      return
    }

    const classStudents = students.length > 0
      ? students
      : await fetchStudentsByClassSection({ schoolId: Number(currentSchoolId), classId: Number(form.classId) })
          .then((list) => (Array.isArray(list) ? list : []))
          .catch(() => [])

    if (!classStudents.length) {
      setError('No students found for the selected class.')
      return
    }

    setSaving(true)
    setError('')

    try {
      await Promise.all(
        classStudents.map((student) => createFeeCollection(buildPayload(student.id))),
      )

      setSuccess(true)
      setTimeout(() => {
        navigateTo?.('fee-collection')
      }, 900)
    } catch (err) {
      setError(err?.message || 'Failed to create bulk invoices')
    } finally {
      setSaving(false)
    }
  }

  const renderStep = () => {
    if (activeStep === 0) {
      return (
        <div className="avm-grid">
          {isSuperAdmin ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <ManualScopeSelectors
                enabled
                compact
                headOffices={headOffices}
                schoolOptions={schoolOptions}
                selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                onHeadOfficeChange={(val) => {
                  manualScope.setSelectedScope(val, '')
                  setForm((prev) => ({
                    ...prev,
                    headOfficeId: val,
                    schoolId: '',
                    classId: '',
                    feeTypeId: '',
                    discountId: '',
                  }))
                }}
                selectedSchoolId={form.schoolId}
                onSchoolChange={(val) => {
                  manualScope.setSelectedScope(form.headOfficeId, val)
                  setForm((prev) => ({
                    ...prev,
                    schoolId: val,
                    classId: '',
                    feeTypeId: '',
                    discountId: '',
                  }))
                }}
                schoolLabel={schoolLabel}
              />
            </div>
          ) : isHeadOfficeAdmin ? (
            <>
              <FormField label="Head Office" required full>
                <input className="avm-input" value={headOfficeName || ''} readOnly />
              </FormField>
              <FormField label="School Name" required full>
                <select className="avm-select" id="schoolId" value={form.schoolId} onChange={handleChange} disabled>
                  <option value="">--Select School--</option>
                  {schoolOptions.map((option) => (
                    <option key={option.id} value={String(option.id)}>
                      {option.schoolName}
                    </option>
                  ))}
                </select>
              </FormField>
            </>
          ) : isSchoolAdmin ? (
            <>
              <FormField label="Head Office" required full>
                <input className="avm-input" value={headOfficeName || ''} readOnly />
              </FormField>
              <FormField label="School Name" required full>
                <input className="avm-input" value={authSchoolName || ''} readOnly />
              </FormField>
            </>
          ) : null}

          <FormField label="Class" required>
            <select className="avm-select" id="classId" value={form.classId} onChange={handleChange} disabled={!currentSchoolId}>
              <option value="">--Select--</option>
              {classOptions.map((option) => (
                <option key={option.id} value={String(option.id)}>
                  {option.className}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      )
    }

    if (activeStep === 1) {
      return (
        <div className="avm-grid">
          <FormField label="Fee Type" required>
            <select className="avm-select" id="feeTypeId" value={form.feeTypeId} onChange={handleChange} disabled={!currentSchoolId}>
              <option value="">--Select--</option>
              {feeTypeOptions.map((option) => (
                <option key={option.id} value={String(option.id)}>
                  {option.title || option.feeType}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Fee Amount" required>
            <input type="number" className="avm-input" id="feeAmount" value={form.feeAmount} onChange={handleChange} step="0.01" />
          </FormField>

          <FormField label="Month" required>
            <select className="avm-select" id="month" value={form.month} onChange={handleChange}>
              <option value="">--Select--</option>
              {monthOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      )
    }

    if (activeStep === 2) {
      return (
        <div className="avm-grid">
          <FormField label="Is Applicable Discount?" required>
            <select className="avm-select" id="isApplicableDiscount" value={form.isApplicableDiscount} onChange={handleChange}>
              <option value="">--Select--</option>
              {applicableDiscountOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          {form.isApplicableDiscount === 'Yes' ? (
            <FormField label="Discount Type" required>
              <select className="avm-select" id="discountId" value={form.discountId} onChange={handleChange} disabled={!currentSchoolId}>
                <option value="">--Select Discount Type--</option>
                {discountOptions.map((option) => (
                  <option key={option.id} value={String(option.id)}>
                    {option.title} (
                    {option.discountType === 'Percentage'
                      ? `${option.amount}%`
                      : `₹${Number(option.amount || 0).toFixed(2)}`}
                    )
                  </option>
                ))}
              </select>
            </FormField>
          ) : null}

          <FormField label="Paid Status" required>
            <select className="avm-select" id="paidStatus" value={form.paidStatus} onChange={handleChange}>
              <option value="">--Select--</option>
              {paidStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Note" full noIcon>
            <textarea
              rows="3"
              className="avm-input avm-textarea"
              id="note"
              placeholder="Enter note (optional)"
              value={form.note}
              onChange={handleChange}
            />
          </FormField>
        </div>
      )
    }

    return null
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Bulk Invoice</h1>

          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
              onClick={() => navigateTo?.('dashboard')}
            >
              Dashboard
            </button>

            <span className="text-secondary-light"> / Fee Collection / Bulk Invoice</span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-6"
          onClick={() => navigateTo?.('fee-collection')}
        >
          <i className="ri-arrow-left-line" /> Back to List
        </button>
      </div>

      <div className="card h-100">
        <div className="card-header border-bottom border-neutral-200 px-20 py-0 d-flex gap-0 scroll-x-mobile">
          {STEPS.map((tab, idx) => (
            <button
              key={tab}
              type="button"
              onClick={() => goToStep(idx)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeStep === idx ? '2px solid var(--primary-600, #4f46e5)' : '2px solid transparent',
                color: activeStep === idx ? 'var(--primary-600, #4f46e5)' : 'var(--secondary-light, #667085)',
                fontWeight: activeStep === idx ? 600 : 400,
                padding: '14px 20px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="card-body p-24">
          {error ? (
            <div className="alert alert-danger d-flex align-items-center gap-10 mb-24 radius-8">
              <i className="ri-error-warning-line text-lg" />
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="alert alert-success d-flex align-items-center gap-10 mb-24 radius-8">
              <i className="ri-checkbox-circle-line text-lg" />
              Bulk invoices created successfully! Redirecting...
            </div>
          ) : null}

          <div className="tab-content">{renderStep()}</div>

          <div className="d-flex align-items-center justify-content-end gap-10 mt-24 pt-20 border-top border-neutral-200">
            {activeStep > 0 ? (
              <button type="button" className="btn btn-light border px-24" onClick={handleBack}>
                Back
              </button>
            ) : null}

            <button type="button" className="btn btn-light border px-24" onClick={() => navigateTo?.('fee-collection')}>
              Cancel
            </button>

            {activeStep < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary-600 px-24" onClick={handleNext}>
                Next Step
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary-600 px-24 d-flex align-items-center gap-8"
                onClick={save}
                disabled={saving || loading}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line" />
                    Create Bulk Invoice
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddBulkInvoice
