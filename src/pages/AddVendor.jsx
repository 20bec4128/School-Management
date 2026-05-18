import { useCallback, useEffect, useMemo, useState } from 'react'
import '../assets/css/addModalShared.css'

import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createSupplier, updateSupplier } from '../apis/suppliersApi'
import { normalizeRole } from '../utils/roles'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import SingleStepFormShell from '../components/SingleStepFormShell'
import PhoneCodeField from '../components/PhoneCodeField'

const EDIT_STORAGE_KEY = 'edit-vendor-row'
const STEPS = ['Vendor Details']

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  vendorName: '',
  contactName: '',
  email: '',
  phoneCode: '+91',
  phone: '',
  address: '',
  note: '',
}

const FIELD_ICONS = {
  Vendor: 'ri-store-2-line',
  'Contact Name': 'ri-user-line',
  Email: 'ri-mail-line',
  Address: 'ri-map-pin-line',
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

const AddVendor = ({ onNavigate } = {}) => {
  const {
    status,
    token,
    user,
    role: authRole,
    headOfficeId: authHeadOfficeId,
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
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : null
  const goToVendorList = useCallback(() => {
    if (navigateTo) {
      navigateTo('asset-vendor')
      return
    }
    window.history.back()
  }, [navigateTo])

  const [initialEditRow] = useState(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const isEditMode = Boolean(initialEditRow?.id)
  const [headOffices, setHeadOffices] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState(() => {
    if (initialEditRow) {
      return {
        ...emptyForm,
        id: initialEditRow?.id != null ? String(initialEditRow.id) : '',
        headOfficeId: initialEditRow?.headOfficeId != null ? String(initialEditRow.headOfficeId) : '',
        schoolId: initialEditRow?.schoolId != null ? String(initialEditRow.schoolId) : '',
        vendorName: initialEditRow?.supplierName || initialEditRow?.vendorName || '',
        contactName: initialEditRow?.contactName || '',
        email: initialEditRow?.email || '',
        phoneCode: initialEditRow?.phoneCode || '+91',
        phone: initialEditRow?.phone || '',
        address: initialEditRow?.address || '',
        note: initialEditRow?.note || '',
      }
    }

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
    for (const school of Array.isArray(allSchools) ? allSchools : []) {
      if (school?.id == null) continue
      map.set(String(school.id), school)
    }
    return map
  }, [allSchools])

  const schoolOptions = useMemo(() => {
    const rows = Array.isArray(allSchools) ? allSchools : []

    if (isSuperAdmin) {
      if (!manualScope.selectedHeadOfficeId) return []
      return rows.filter((school) => String(school?.headOfficeId ?? '') === String(manualScope.selectedHeadOfficeId))
    }

    if (isHeadOfficeAdmin) {
      return rows.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }

    if (isSchoolAdmin) {
      return rows.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }

    return rows
  }, [allSchools, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.selectedHeadOfficeId])

  const loadLookups = useCallback(async () => {
    setLoading(true)
    try {
      const tasks = []

      if (isSuperAdmin || isHeadOfficeAdmin) {
        tasks.push(
          fetchHeadOfficesPage(0, 500)
            .then((page) => {
              const content = Array.isArray(page?.content) ? page.content : []
              setHeadOffices(content)
            })
            .catch(() => setHeadOffices([])),
        )
      }

      tasks.push(
        fetchSchoolsLookup()
          .then((list) => setAllSchools(Array.isArray(list) ? list : []))
          .catch(() => setAllSchools([])),
      )

      await Promise.all(tasks)
    } finally {
      setLoading(false)
    }
  }, [isHeadOfficeAdmin, isSuperAdmin])

  useEffect(() => {
    if (status === 'ready' && token) {
      void loadLookups()
    }
  }, [loadLookups, status, token])

  useEffect(() => {
    if (initialEditRow && schoolsById.size > 0) {
      const school = initialEditRow.schoolId != null ? schoolsById.get(String(initialEditRow.schoolId)) : null
      const headOfficeId =
        initialEditRow.headOfficeId != null
          ? String(initialEditRow.headOfficeId)
          : school?.headOfficeId != null
            ? String(school.headOfficeId)
            : authHeadOfficeId != null
              ? String(authHeadOfficeId)
              : ''

      if (isSuperAdmin) {
        manualScope.setSelectedScope(headOfficeId, initialEditRow.schoolId != null ? String(initialEditRow.schoolId) : '')
      }

      setForm((prev) => ({
        ...prev,
        headOfficeId,
        schoolId: initialEditRow.schoolId != null ? String(initialEditRow.schoolId) : '',
      }))
    }
  }, [authHeadOfficeId, initialEditRow, isSuperAdmin, manualScope, schoolsById])

  useEffect(() => {
    if (isSchoolAdmin && authSchoolId != null) {
      const school = schoolsById.get(String(authSchoolId))
      const schoolId = String(authSchoolId)
      setForm((prev) => ({
        ...prev,
        headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
        schoolId,
      }))
    }
  }, [authSchoolId, isSchoolAdmin, schoolsById])

  useEffect(() => {
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      setForm((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
    }
  }, [authHeadOfficeId, isHeadOfficeAdmin])

  const handleHeadOfficeChange = useCallback(
    (value) => {
      setForm((prev) => ({
        ...prev,
        headOfficeId: value,
        schoolId: '',
      }))

      manualScope.setSelectedScope(value, '')
    },
    [manualScope],
  )

  const handleSchoolChange = useCallback(
    (value) => {
      const school = (Array.isArray(allSchools) ? allSchools : []).find((row) => String(row?.id ?? '') === String(value))
      const headOfficeId = school?.headOfficeId != null ? String(school.headOfficeId) : form.headOfficeId

      setForm((prev) => ({
        ...prev,
        headOfficeId,
        schoolId: value,
      }))

      manualScope.setSelectedScope(headOfficeId, value)
    },
    [allSchools, form.headOfficeId, manualScope],
  )

  const buildPayload = () => {
    const schoolId = isSchoolAdmin ? authSchoolId : form.schoolId ? Number(form.schoolId) : null
    const headOfficeId = form.headOfficeId ? Number(form.headOfficeId) : null

    return {
      headOfficeId:
        headOfficeId != null && !Number.isNaN(headOfficeId)
          ? headOfficeId
          : schoolsById.get(String(schoolId))?.headOfficeId != null
            ? Number(schoolsById.get(String(schoolId)).headOfficeId)
            : null,
      schoolId,
      supplierName: String(form.vendorName || '').trim(),
      contactName: String(form.contactName || '').trim(),
      email: String(form.email || '').trim(),
      phoneCode: String(form.phoneCode || '+91').trim(),
      phone: String(form.phone || '').trim(),
      address: String(form.address || '').trim(),
      note: String(form.note || '').trim(),
    }
  }

  const validate = () => {
    if (isSuperAdmin && !String(form.headOfficeId || '').trim()) return 'Head office is required.'
    if (!String(form.schoolId || '').trim() && !isSchoolAdmin) return 'School is required.'
    if (isSchoolAdmin && !authSchoolId) return 'School is required.'
    if (!String(form.vendorName || '').trim()) return 'Vendor name is required.'
    if (!String(form.contactName || '').trim()) return 'Contact name is required.'
    if (!String(form.phone || '').trim()) return 'Phone is required.'
    return ''
  }

  const handleSave = useCallback(async () => {
    const message = validate()
    if (message) {
      setError(message)
      return
    }

    const payload = buildPayload()
    setSaving(true)
    setError('')

    try {
      if (isEditMode) {
        await updateSupplier(form.id, payload)
      } else {
        await createSupplier(payload)
      }

      setSuccess(true)
      try {
        sessionStorage.removeItem(EDIT_STORAGE_KEY)
      } catch {}

      setTimeout(() => {
        goToVendorList()
      }, 900)
    } catch (err) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} vendor:`, err)
      setError(err?.message || `Failed to ${isEditMode ? 'update' : 'create'} vendor`)
    } finally {
      setSaving(false)
    }
  }, [buildPayload, form.id, goToVendorList, isEditMode])

  useEffect(() => {
    return () => {
      try {
        sessionStorage.removeItem(EDIT_STORAGE_KEY)
      } catch {}
    }
  }, [])

  const footer = (
    <div className="d-flex align-items-center justify-content-end gap-12 w-100">
      <button type="button" className="btn btn-light border px-24" onClick={goToVendorList}>
        Cancel
      </button>
      <button type="button" className="btn btn-primary-600 px-24" onClick={handleSave} disabled={saving || loading || manualScope.loading}>
        {saving ? 'Saving...' : isEditMode ? 'Update Vendor' : 'Save Vendor'}
      </button>
    </div>
  )

  return (
    <SingleStepFormShell
      title={`${isEditMode ? 'Edit' : 'Add'} Vendor`}
      breadcrumbTrail={` / Inventory / Vendor / ${isEditMode ? 'Edit' : 'Add'}`}
      onDashboard={() => navigateTo?.('dashboard')}
      onBack={goToVendorList}
      footer={footer}
      error={error}
      success={success}
      successMessage={`Vendor ${isEditMode ? 'updated' : 'created'} successfully! Redirecting...`}
    >
      {loading || manualScope.loading ? <div className="mb-16 text-secondary-light">Loading lookups...</div> : null}

      <div className="avm-grid">
        {isSuperAdmin ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <ManualScopeSelectors
              enabled
              compact
              headOffices={manualScope.headOffices}
              schoolOptions={schoolOptions}
              selectedHeadOfficeId={form.headOfficeId}
              onHeadOfficeChange={handleHeadOfficeChange}
              selectedSchoolId={form.schoolId}
              onSchoolChange={handleSchoolChange}
              showSchoolSelector
              schoolLabel="School Name"
            />
          </div>
        ) : isHeadOfficeAdmin ? (
          <>
            <FormField label="Head Office" full>
              <input className="avm-input" value={String(authHeadOfficeId || '')} disabled />
            </FormField>

            <FormField label="School Name" required>
              <select className="avm-select" value={form.schoolId} onChange={(e) => handleSchoolChange(e.target.value)}>
                <option value="">--Select School--</option>
                {schoolOptions.map((school) => (
                  <option key={school.id} value={String(school.id)}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </FormField>
          </>
        ) : (
          <FormField label="School Name" required full>
            <input className="avm-input" value={authSchoolName || schoolsById.get(String(authSchoolId))?.schoolName || ''} readOnly />
          </FormField>
        )}

        <FormField label="Vendor" required>
          <input
            className="avm-input"
            value={form.vendorName}
            onChange={(e) => setForm((prev) => ({ ...prev, vendorName: e.target.value }))}
            placeholder="Vendor Name"
          />
        </FormField>

        <FormField label="Contact Name" required>
          <input
            className="avm-input"
            value={form.contactName}
            onChange={(e) => setForm((prev) => ({ ...prev, contactName: e.target.value }))}
            placeholder="Contact Name"
          />
        </FormField>

        <FormField label="Email">
          <input
            className="avm-input"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Email"
          />
        </FormField>

        <FormField label="Phone" required noIcon>
          <PhoneCodeField
            id="vendorPhone"
            label=""
            value={form.phone}
            code={form.phoneCode}
            onCodeChange={(code) => setForm((prev) => ({ ...prev, phoneCode: code }))}
            onValueChange={(digits) => setForm((prev) => ({ ...prev, phone: digits }))}
            onChange={(fullValue) => {
              const [codePart, ...rest] = String(fullValue || '').trim().split(/\s+/)
              setForm((prev) => ({
                ...prev,
                phoneCode: codePart || prev.phoneCode,
                phone: rest.join(' '),
              }))
            }}
            required
          />
        </FormField>

        <FormField label="Address" full>
          <textarea
            className="avm-input avm-textarea"
            rows="3"
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Address"
          />
        </FormField>

        <FormField label="Note" full>
          <textarea
            className="avm-input avm-textarea"
            rows="3"
            value={form.note}
            onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
            placeholder="Note"
          />
        </FormField>
      </div>
    </SingleStepFormShell>
  )
}

export default AddVendor
