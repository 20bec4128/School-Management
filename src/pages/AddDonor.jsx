import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '../assets/css/addModalShared.css'

import SingleStepFormShell from '../components/SingleStepFormShell'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import PhoneCodeField from '../components/PhoneCodeField'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchAcademicYears } from '../apis/academicYearsApi'
import { createDonor, updateDonor } from '../apis/donorsApi'

const EDIT_STORAGE_KEY = 'edit-donor-row'
const STEPS = ['Basic Info', 'Contact & Details']
const DEFAULT_PHONE_CODE = '+91'

const donorTypeOptions = ['Individual', 'Organization', 'Foundation', 'Corporate', 'Government']

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  academicYear: '',
  donorType: '',
  donorName: '',
  contactName: '',
  email: '',
  phone: '',
  amount: '',
  address: '',
  note: '',
}

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Academic Year': 'ri-calendar-line',
  'Donor Type': 'ri-group-line',
  'Donor Name': 'ri-user-3-line',
  'Contact Name': 'ri-contacts-line',
  Email: 'ri-mail-line',
  Amount: 'ri-money-dollar-circle-line',
  Address: 'ri-map-pin-2-line',
  Note: 'ri-sticky-note-line',
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

const unwrapCollection = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.content)) return value.content
  return []
}

const splitPhoneValue = (fullValue) => {
  const trimmed = String(fullValue || '').trim()
  if (!trimmed) return { code: DEFAULT_PHONE_CODE, number: '' }
  if (!trimmed.startsWith('+')) return { code: DEFAULT_PHONE_CODE, number: trimmed.replace(/\D/g, '') }
  const parts = trimmed.split(/\s+/)
  const code = parts[0] || DEFAULT_PHONE_CODE
  const number = parts.slice(1).join('').replace(/\D/g, '')
  return { code, number }
}

const schoolLabel = (row) => row?.schoolName || row?.name || ''
const getSchoolById = (rows, schoolId) =>
  (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(schoolId ?? '')) || null

const AddDonor = ({ onNavigate } = {}) => {
  const [initialEditRow] = useState(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const isEditMode = Boolean(initialEditRow?.id)

  const [form, setForm] = useState(() => {
    if (!initialEditRow) return emptyForm
    return {
      ...emptyForm,
      headOfficeId: initialEditRow?.headOfficeId != null ? String(initialEditRow.headOfficeId) : '',
      schoolId: initialEditRow?.schoolId != null ? String(initialEditRow.schoolId) : '',
      academicYear: initialEditRow?.academicYear || '',
      donorType: initialEditRow?.donorType || '',
      donorName: initialEditRow?.donorName || '',
      contactName: initialEditRow?.contactName || '',
      email: initialEditRow?.email || '',
      phoneCode: splitPhoneValue(initialEditRow?.phone).code,
      phone: splitPhoneValue(initialEditRow?.phone).number,
      amount: initialEditRow?.amount != null ? String(initialEditRow.amount) : '',
      address: initialEditRow?.address || '',
      note: initialEditRow?.note || '',
    }
  })

  const [headOffices, setHeadOffices] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [academicYearsLookup, setAcademicYearsLookup] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  const hydratedRef = useRef(false)

  const schoolsById = useMemo(() => {
    const map = new Map()
    for (const school of Array.isArray(schoolsLookup) ? schoolsLookup : []) {
      if (school?.id == null) continue
      map.set(String(school.id), school)
    }
    return map
  }, [schoolsLookup])

  const schoolOptions = useMemo(() => {
    const rows = Array.isArray(schoolsLookup) ? schoolsLookup : []
    if (!form.headOfficeId) return rows
    return rows.filter((school) => String(school?.headOfficeId ?? '') === String(form.headOfficeId))
  }, [form.headOfficeId, schoolsLookup])

  const academicYearOptions = useMemo(
    () =>
      Array.from(
        new Set(academicYearsLookup.map((item) => String(item?.academicYear || '').trim()).filter(Boolean)),
      )
        .sort()
        .reverse(),
    [academicYearsLookup],
  )

  const loadLookups = useCallback(async () => {
    setLoading(true)
    try {
      const tasks = await Promise.allSettled([
        fetchHeadOfficesPage(0, 500),
        fetchSchoolsLookup(),
        fetchAcademicYears(),
      ])

      setHeadOffices(
        unwrapCollection(tasks[0].status === 'fulfilled' ? tasks[0].value : [])
          .map((ho) => ({ id: ho?.id, name: ho?.name || ho?.headOfficeName || '' }))
          .filter((ho) => ho.id != null && ho.name)
          .sort((a, b) => String(a.name).localeCompare(String(b.name))),
      )
      setSchoolsLookup(unwrapCollection(tasks[1].status === 'fulfilled' ? tasks[1].value : []))
      setAcademicYearsLookup(unwrapCollection(tasks[2].status === 'fulfilled' ? tasks[2].value : []))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

  useEffect(() => {
    if (!initialEditRow || hydratedRef.current || schoolsById.size === 0) return

    const school = initialEditRow.schoolId != null ? schoolsById.get(String(initialEditRow.schoolId)) : null
    const headOfficeId =
      initialEditRow.headOfficeId != null
        ? String(initialEditRow.headOfficeId)
        : school?.headOfficeId != null
          ? String(school.headOfficeId)
          : ''

    setForm((prev) => ({
      ...prev,
      headOfficeId,
      schoolId: initialEditRow.schoolId != null ? String(initialEditRow.schoolId) : '',
      academicYear: initialEditRow?.academicYear || '',
      donorType: initialEditRow?.donorType || '',
      donorName: initialEditRow?.donorName || '',
      contactName: initialEditRow?.contactName || '',
      email: initialEditRow?.email || '',
      phoneCode: splitPhoneValue(initialEditRow?.phone).code,
      phone: splitPhoneValue(initialEditRow?.phone).number,
      amount: initialEditRow?.amount != null ? String(initialEditRow.amount) : '',
      address: initialEditRow?.address || '',
      note: initialEditRow?.note || '',
    }))
    hydratedRef.current = true
  }, [initialEditRow, schoolsById])

  useEffect(() => {
    return () => {
      try {
        sessionStorage.removeItem(EDIT_STORAGE_KEY)
      } catch {}
    }
  }, [])

  const goToDonorList = useCallback(() => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    } catch {}
    onNavigate?.('donar')
  }, [onNavigate])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleHeadOfficeChange = useCallback((value) => {
    setForm((prev) => ({
      ...prev,
      headOfficeId: value,
      schoolId: '',
    }))
  }, [])

  const handleSchoolChange = useCallback(
    (value) => {
      const school = (Array.isArray(schoolsLookup) ? schoolsLookup : []).find((row) => String(row?.id ?? '') === String(value))
      const headOfficeId = school?.headOfficeId != null ? String(school.headOfficeId) : form.headOfficeId

      setForm((prev) => ({
        ...prev,
        headOfficeId,
        schoolId: value,
      }))
    },
    [form.headOfficeId, schoolsLookup],
  )

  const validateStep = (step) => {
    if (!String(form.schoolId || '').trim()) return 'School is required.'
    if (!String(form.donorType || '').trim()) return 'Donor type is required.'
    if (!String(form.donorName || '').trim()) return 'Donor name is required.'

    if (step >= 1) {
      if (!String(form.phone || '').trim()) return 'Phone is required.'
      if (!String(form.amount || '').trim()) return 'Amount is required.'
      if (!Number.isFinite(Number(form.amount))) return 'Amount must be a valid number.'
      if (Number(form.amount) < 0) return 'Amount must be greater than or equal to 0.'
    }

    return ''
  }

  const buildPayload = () => {
    const schoolId = form.schoolId ? Number(form.schoolId) : null
    const school = schoolId != null ? schoolsById.get(String(schoolId)) : null
    const headOfficeId =
      form.headOfficeId && !Number.isNaN(Number(form.headOfficeId))
        ? Number(form.headOfficeId)
        : school?.headOfficeId != null
          ? Number(school.headOfficeId)
          : null

    return {
      headOfficeId,
      schoolId,
      academicYear: form.academicYear || null,
      donorType: form.donorType || null,
      donorName: form.donorName || null,
      contactName: form.contactName || null,
      email: form.email || null,
      phone: form.phone ? `${form.phoneCode || DEFAULT_PHONE_CODE} ${form.phone}` : null,
      amount: form.amount === '' ? null : Number(form.amount),
      address: form.address || null,
      note: form.note || null,
    }
  }

  const handleSave = useCallback(async () => {
    const message = validateStep(1)
    if (message) {
      setError(message)
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = buildPayload()
      if (isEditMode) {
        await updateDonor(initialEditRow.id, payload)
      } else {
        await createDonor(payload)
      }

      setSuccess(true)
      try {
        sessionStorage.removeItem(EDIT_STORAGE_KEY)
      } catch {}

      setTimeout(() => {
        goToDonorList()
      }, 900)
    } catch (err) {
      setError(err?.message || `Failed to ${isEditMode ? 'update' : 'create'} donor`)
    } finally {
      setSaving(false)
    }
  }, [buildPayload, goToDonorList, initialEditRow, isEditMode, validateStep])

  const renderForm = (step) => (
    <>
      <div className="avm-grid">
        {step === 0 ? (
          <>
            <div style={{ gridColumn: '1 / -1' }}>
              <ManualScopeSelectors
                enabled
                compact
                headOffices={headOffices}
                schoolOptions={schoolOptions}
                selectedHeadOfficeId={form.headOfficeId}
                onHeadOfficeChange={handleHeadOfficeChange}
                selectedSchoolId={form.schoolId}
                onSchoolChange={handleSchoolChange}
                schoolLabel="School"
              />
            </div>

            <FormField label="Academic Year" full>
              <select className="avm-select" id="academicYear" value={form.academicYear} onChange={handleChange}>
                <option value="">--Select--</option>
                {academicYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Donor Type" required full>
              <select className="avm-select" id="donorType" value={form.donorType} onChange={handleChange}>
                <option value="">--Select--</option>
                {donorTypeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Donor Name" required full>
              <input
                type="text"
                className="avm-input"
                id="donorName"
                placeholder="Donor Name"
                value={form.donorName}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Contact Name" full>
              <input
                type="text"
                className="avm-input"
                id="contactName"
                placeholder="Contact Name"
                value={form.contactName}
                onChange={handleChange}
              />
            </FormField>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <FormField label="Email" full>
              <input
                type="email"
                className="avm-input"
                id="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
              />
            </FormField>

            <PhoneCodeField
              id="phone"
              label="Phone"
              required
              code={form.phoneCode || DEFAULT_PHONE_CODE}
              value={form.phone}
              onCodeChange={(code) => setForm((prev) => ({ ...prev, phoneCode: code }))}
              onValueChange={(digits) => setForm((prev) => ({ ...prev, phone: digits }))}
            />

            <FormField label="Amount" required>
              <input
                type="number"
                className="avm-input"
                id="amount"
                placeholder="Amount"
                value={form.amount}
                onChange={handleChange}
                min="0"
              />
            </FormField>

            <FormField label="Address" full>
              <textarea
                rows={3}
                className="avm-input avm-textarea"
                id="address"
                placeholder="Address"
                value={form.address}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Note" full>
              <textarea
                rows={3}
                className="avm-input avm-textarea"
                id="note"
                placeholder="Note"
                value={form.note}
                onChange={handleChange}
              />
            </FormField>
          </>
        ) : null}
      </div>
    </>
  )

  return (
    <SingleStepFormShell
      title={`${isEditMode ? 'Edit' : 'Add'} Donor`}
      breadcrumbTrail={` / Donor / ${isEditMode ? 'Edit' : 'Add'}`}
      onDashboard={() => onNavigate?.('dashboard')}
      onBack={goToDonorList}
      backLabel="Back to Donor"
      steps={STEPS}
      activeStep={activeStep}
      onStepChange={(index) => {
        if (index > activeStep) {
          const message = validateStep(activeStep)
          if (message) {
            setError(message)
            return
          }
        }
        setError('')
        setActiveStep(index)
      }}
      error={error}
      success={success}
      successMessage={`Donor ${isEditMode ? 'updated' : 'created'} successfully! Redirecting...`}
      footer={
        <div className="d-flex align-items-center gap-12 w-100 justify-content-end">
          <button type="button" className="btn btn-light border px-24" onClick={goToDonorList}>
            Cancel
          </button>
          {activeStep > 0 ? (
            <button
              type="button"
              className="btn btn-light border px-24"
              onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
            >
              Back
            </button>
          ) : null}
          {activeStep < STEPS.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary-600 px-24"
              onClick={() => {
                const message = validateStep(activeStep)
                if (message) {
                  setError(message)
                  return
                }
                setError('')
                setActiveStep((step) => Math.min(STEPS.length - 1, step + 1))
              }}
              disabled={loading}
            >
              Next
            </button>
          ) : (
            <button type="button" className="btn btn-primary-600 px-24" onClick={handleSave} disabled={saving || loading}>
              {saving ? 'Saving...' : isEditMode ? 'Update Donor' : 'Save Donor'}
            </button>
          )}
        </div>
      }
    >
      {loading ? <div className="mb-16 text-secondary-light">Loading lookups...</div> : null}
      {renderForm(activeStep)}
    </SingleStepFormShell>
  )
}

export default AddDonor
