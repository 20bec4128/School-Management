import { useEffect, useMemo, useState } from 'react'
import '../assets/css/addModalShared.css'

import { useAuth } from '../context/useAuth'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createSalaryGrade, updateSalaryGrade } from '../apis/salaryGradeApi'
import { normalizeRole } from '../utils/roles'
import SingleStepFormShell from '../components/SingleStepFormShell'

const EDIT_STORAGE_KEY = 'edit-salary-grade-row'

const STEPS = ['Basic Information', 'Allowances', 'Salary Summary']

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  gradeName: '',
  basicSalary: '',
  houseRent: '',
  transportAllowance: '',
  medicalAllowance: '',
  overTimeHourlyRate: '',
  providentFund: '',
  hourlyRate: '',
  totalAllowance: 0,
  totalDeduction: 0,
  grossSalary: 0,
  netSalary: 0,
  note: '',
}

const FIELD_ICONS = {
  'Head Office': 'ri-government-line',
  'School Name': 'ri-school-line',
  'Grade Name': 'ri-medal-line',
  'Basic Salary': 'ri-coin-line',
  'House Rent': 'ri-home-line',
  'Transport Allowance': 'ri-bus-line',
  'Medical Allowance': 'ri-heart-pulse-line',
  'Over Time Hourly Rate': 'ri-time-line',
  'Provident Fund': 'ri-funds-line',
  'Hourly Rate': 'ri-calculator-line',
  'Total Allowance': 'ri-add-circle-line',
  'Total Deduction': 'ri-subtract-line',
  'Gross Salary': 'ri-bank-card-line',
  'Net Salary': 'ri-wallet-line',
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
            <i className={icon}></i>
          </span>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

const AddSalaryGrade = ({ onNavigate }) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'

  const [initialEditRow] = useState(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_STORAGE_KEY)
      if (raw) {
        // Clear it after reading to satisfy Rule #9 (not relying only on it)
        // But wait, Rule #10 says keep prefill working. We can clear on unmount.
        return JSON.parse(raw)
      }
      return null
    } catch { return null }
  })

  useEffect(() => {
    return () => {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    }
  }, [])

  const isEditMode = Boolean(initialEditRow?.id)
  const [activeStep, setActiveStep] = useState(0)
  const [headOffices, setHeadOffices] = useState([])
  const [schools, setSchools] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const calculateTotals = (formData) => {
    const basicSalary = parseFloat(formData.basicSalary) || 0
    const houseRent = parseFloat(formData.houseRent) || 0
    const transportAllowance = parseFloat(formData.transportAllowance) || 0
    const medicalAllowance = parseFloat(formData.medicalAllowance) || 0
    const overTimeHourlyRate = parseFloat(formData.overTimeHourlyRate) || 0
    const providentFund = parseFloat(formData.providentFund) || 0
    
    const totalAllowance = houseRent + transportAllowance + medicalAllowance + overTimeHourlyRate
    const totalDeduction = providentFund
    const grossSalary = basicSalary + totalAllowance
    const netSalary = grossSalary - totalDeduction

    return {
      totalAllowance,
      totalDeduction,
      grossSalary,
      netSalary,
    }
  }

  const [form, setForm] = useState(() => {
    if (initialEditRow) {
      const totals = calculateTotals(initialEditRow)
      return {
        ...emptyForm,
        ...initialEditRow,
        headOfficeId: initialEditRow.headOfficeId != null ? String(initialEditRow.headOfficeId) : '',
        schoolId: initialEditRow.schoolId != null ? String(initialEditRow.schoolId) : '',
        ...totals
      }
    }
    return {
      ...emptyForm,
      headOfficeId: isSchoolAdmin ? (authHeadOfficeId != null ? String(authHeadOfficeId) : '') : (isHeadOfficeAdmin ? (authHeadOfficeId != null ? String(authHeadOfficeId) : '') : ''),
      schoolId: isSchoolAdmin ? (authSchoolId != null ? String(authSchoolId) : '') : '',
    }
  })

  const loadLookups = async () => {
    const tasks = []
    if (isSuperAdmin || isHeadOfficeAdmin) {
      tasks.push(
        fetchHeadOfficesPage(0, 500).then((page) => {
          const content = Array.isArray(page?.content) ? page.content : []
          setHeadOffices(content)
        }).catch(() => {}),
      )
    }
    tasks.push(fetchSchoolsLookup().then((list) => setSchools(Array.isArray(list) ? list : [])))
    await Promise.all(tasks)
  }

  useEffect(() => {
    if (status === 'ready' && token) {
      loadLookups()
    }
  }, [status, token])

  // Rule #8: Recover missing scope from related fields like schoolId
  useEffect(() => {
    if (isSuperAdmin && form.schoolId && !form.headOfficeId && schools.length > 0) {
      const s = schools.find(item => String(item.id) === String(form.schoolId))
      if (s?.headOfficeId) {
        setForm(prev => ({ ...prev, headOfficeId: String(s.headOfficeId) }))
      }
    }
  }, [schools, form.schoolId, form.headOfficeId, isSuperAdmin])

  const schoolOptions = useMemo(() => {
    if (isSchoolAdmin) return []
    const selectedHeadOfficeId = isSuperAdmin ? form.headOfficeId : (authHeadOfficeId != null ? String(authHeadOfficeId) : '')
    const list = Array.isArray(schools) ? schools : []
    if (!selectedHeadOfficeId) return []
    return list.filter((s) => String(s?.headOfficeId ?? '') === String(selectedHeadOfficeId))
  }, [schools, form.headOfficeId, isSuperAdmin, isHeadOfficeAdmin, authHeadOfficeId])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => {
      const updated = { 
        ...prev, 
        [id]: value,
        ...(id === 'headOfficeId' ? { schoolId: '' } : {})
      }
      const totals = calculateTotals(updated)
      return {
        ...updated,
        ...totals
      }
    })
  }

  const validateStep = (step) => {
    if (step === 0) {
      if ((isSuperAdmin || isHeadOfficeAdmin) && !form.schoolId) return 'School is required'
      if (!form.gradeName) return 'Grade Name is required'
      if (!form.basicSalary) return 'Basic Salary is required'
    }
    if (step === 1) {
      if (!form.hourlyRate) return 'Hourly Rate is required'
    }
    return ''
  }

  const handleSave = async () => {
    const err = validateStep(activeStep) || (activeStep === 2 ? '' : validateStep(0) || validateStep(1))
    if (err) {
      setError(err)
      return
    }

    setBusy(true)
    setError('')
    try {
      const payload = { ...form, schoolId: Number(form.schoolId) }
      if (isEditMode) {
        await updateSalaryGrade(form.id, payload)
      } else {
        await createSalaryGrade(payload)
      }
      setSuccess(true)
      setTimeout(() => onNavigate?.('salary-grade'), 1000)
    } catch (e) {
      setError(e.message || 'Failed to save salary grade')
    } finally {
      setBusy(false)
    }
  }

  const stepTabs = (
    <div className="d-flex gap-0 scroll-x-mobile">
      {STEPS.map((step, index) => (
        <button
          key={step}
          type="button"
          onClick={() => {
            // Rule #6: Prevent moving to future step unless current validates
            if (index > activeStep) {
              const err = validateStep(activeStep)
              if (err) {
                setError(err)
                return
              }
            }
            setError('')
            setActiveStep(index)
          }}
          style={{
            border: 'none',
            background: 'none',
            borderBottom: activeStep === index ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeStep === index ? 'var(--primary-600)' : 'var(--text-secondary-light)',
            fontWeight: activeStep === index ? 600 : 500,
            padding: '14px 20px',
            fontSize: '0.875rem'
          }}
        >
          {step}
        </button>
      ))}
    </div>
  )

  const footer = (
    <div className="d-flex align-items-center justify-content-between w-100">
      <button
        type="button"
        className="btn btn-light border px-24"
        onClick={() => setActiveStep(s => Math.max(0, s - 1))}
        disabled={activeStep === 0}
      >
        Back
      </button>

      <div className="d-flex align-items-center gap-12">
        <button
          type="button"
          className="btn btn-light border px-24"
          onClick={() => onNavigate?.('salary-grade')}
        >
          Cancel
        </button>

        {activeStep < STEPS.length - 1 ? (
          <button
            type="button"
            className="btn btn-primary-600 px-24"
            onClick={() => {
              const err = validateStep(activeStep)
              if (err) {
                setError(err)
                return
              }
              setError('')
              setActiveStep(s => Math.min(STEPS.length - 1, s + 1))
            }}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary-600 px-24"
            onClick={handleSave}
            disabled={busy}
          >
            {busy ? 'Saving...' : (isEditMode ? 'Update' : 'Save')}
          </button>
        )}
      </div>
    </div>
  )

  const renderContent = () => {
    if (activeStep === 0) {
      return (
        <div className="avm-grid">
          {isSuperAdmin ? (
            <FormField label="Head Office" required full>
              <select className="avm-select" id="headOfficeId" value={form.headOfficeId} onChange={handleChange}>
                <option value="">--Select Head Office--</option>
                {headOffices.map((ho) => (
                  <option key={ho.id} value={String(ho.id)}>{ho.name}</option>
                ))}
              </select>
            </FormField>
          ) : (isHeadOfficeAdmin ? (
            <FormField label="Head Office" required full>
              <input className="avm-input" value={headOfficeName || ''} readOnly />
            </FormField>
          ) : null)}

          {(isSuperAdmin || isHeadOfficeAdmin) ? (
            <FormField label="School Name" required full>
              <select className="avm-select" id="schoolId" value={form.schoolId} onChange={handleChange}>
                <option value="">--Select School--</option>
                {schoolOptions.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.schoolName}</option>
                ))}
              </select>
            </FormField>
          ) : (isSchoolAdmin ? (
            <FormField label="School Name" required full>
              <input className="avm-input" value={authSchoolName || ''} readOnly />
            </FormField>
          ) : null)}

          <FormField label="Grade Name" required full>
            <input
              type="text"
              className="avm-input"
              id="gradeName"
              placeholder="Enter grade name"
              value={form.gradeName}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Basic Salary" required>
            <input
              type="number"
              className="avm-input"
              id="basicSalary"
              placeholder="Enter basic salary"
              value={form.basicSalary}
              onChange={handleChange}
            />
          </FormField>
        </div>
      )
    }

    if (activeStep === 1) {
      return (
        <div className="avm-grid">
          <FormField label="House Rent">
            <input type="number" className="avm-input" id="houseRent" value={form.houseRent} onChange={handleChange} />
          </FormField>
          <FormField label="Transport Allowance">
            <input type="number" className="avm-input" id="transportAllowance" value={form.transportAllowance} onChange={handleChange} />
          </FormField>
          <FormField label="Medical Allowance">
            <input type="number" className="avm-input" id="medicalAllowance" value={form.medicalAllowance} onChange={handleChange} />
          </FormField>
          <FormField label="Over Time Hourly Rate">
            <input type="number" className="avm-input" id="overTimeHourlyRate" value={form.overTimeHourlyRate} onChange={handleChange} />
          </FormField>
          <FormField label="Provident Fund">
            <input type="number" className="avm-input" id="providentFund" value={form.providentFund} onChange={handleChange} />
          </FormField>
          <FormField label="Hourly Rate" required>
            <input type="number" className="avm-input" id="hourlyRate" value={form.hourlyRate} onChange={handleChange} />
          </FormField>
        </div>
      )
    }

    if (activeStep === 2) {
      return (
        <div className="avm-grid">
          <div className="avm-field">
            <label className="avm-label">Total Allowance</label>
            <div className="avm-input" style={{ background: '#f8fafc', fontWeight: 600 }}>{form.totalAllowance}</div>
          </div>
          <div className="avm-field">
            <label className="avm-label">Total Deduction</label>
            <div className="avm-input" style={{ background: '#f8fafc', fontWeight: 600 }}>{form.totalDeduction}</div>
          </div>
          <div className="avm-field">
            <label className="avm-label">Gross Salary</label>
            <div className="avm-input" style={{ background: '#e8f0fe', fontWeight: 600 }}>{form.grossSalary}</div>
          </div>
          <div className="avm-field">
            <label className="avm-label">Net Salary</label>
            <div className="avm-input" style={{ background: '#e8f0fe', fontWeight: 600 }}>{form.netSalary}</div>
          </div>
          <FormField label="Note" full noIcon>
            <textarea rows="3" className="avm-input avm-textarea" id="note" value={form.note} onChange={handleChange} />
          </FormField>
        </div>
      )
    }
  }

  return (
    <SingleStepFormShell
      title={`${isEditMode ? 'Edit' : 'Add'} Salary Grade`}
      breadcrumbTrail={` / Salary Grade / ${isEditMode ? 'Edit' : 'Add'}`}
      onDashboard={() => onNavigate?.('dashboard')}
      onBack={() => onNavigate?.('salary-grade')}
      footer={footer}
      error={error}
      success={success}
      successMessage={`Salary Grade ${isEditMode ? 'updated' : 'created'} successfully! Redirecting...`}
    >
      {stepTabs}
      <div className="pt-24">{renderContent()}</div>
    </SingleStepFormShell>
  )
}

export default AddSalaryGrade
