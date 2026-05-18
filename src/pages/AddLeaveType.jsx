import { useEffect, useMemo, useState } from 'react'
import '../assets/css/addModalShared.css'

import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchDesignations } from '../apis/designationsApi'
import { fetchSchoolRoles } from '../apis/schoolRbacApi'
import { createLeaveType, updateLeaveType } from '../apis/leaveTypeApi'
import SingleStepFormShell from '../components/SingleStepFormShell'

const EDIT_STORAGE_KEY = 'edit-leave-type-row'
const STEPS = ['Basic Information']

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  applicantType: '',
  designationId: '',
  leaveType: '',
  allowedLeavesPerYear: '',
}

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  'Applicant Type': 'ri-user-3-line',
  Designation: 'ri-award-line',
  'Leave Type': 'ri-calendar-line',
  'Allowed Leaves count/year': 'ri-number-1',
}

const formatRoleLabel = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase())

const normalizeApplicantType = (value) => String(value || '').trim().toUpperCase()

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

const AddLeaveType = ({ onNavigate }) => {
  const {
    status,
    token,
    user,
    role: authRole,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    headOfficeId: authHeadOfficeId,
  } = useAuth()

  const role = useMemo(
    () => normalizeRole(authRole || user?.role || user?.userRole || user?.authority),
    [authRole, user],
  )
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const isStudentRole = role === 'STUDENT'
  const isFixedSchoolRole = isSchoolAdmin || isStudentRole
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : null

  const [initialEditRow] = useState(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const editingId = initialEditRow?.id ?? null

  const [headOffices, setHeadOffices] = useState([])
  const [schools, setSchools] = useState([])
  const [applicantRoles, setApplicantRoles] = useState([])
  const [designations, setDesignations] = useState([])
  const [form, setForm] = useState(() => {
    if (initialEditRow) {
      return {
        ...emptyForm,
        headOfficeId: initialEditRow?.headOfficeId != null ? String(initialEditRow.headOfficeId) : '',
        schoolId: initialEditRow?.schoolId != null ? String(initialEditRow.schoolId) : '',
        applicantType: initialEditRow?.applicantType || '',
        designationId: initialEditRow?.designationId != null ? String(initialEditRow.designationId) : '',
        leaveType: initialEditRow?.leaveType || '',
        allowedLeavesPerYear:
          initialEditRow?.allowedLeavesPerYear == null ? '' : String(initialEditRow.allowedLeavesPerYear),
      }
    }

    return {
      ...emptyForm,
      headOfficeId: isSchoolAdmin || isFixedSchoolRole || isHeadOfficeAdmin
        ? authHeadOfficeId != null
          ? String(authHeadOfficeId)
          : ''
        : '',
      schoolId: isSchoolAdmin
        ? authSchoolId != null
          ? String(authSchoolId)
          : ''
        : '',
    }
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [activeStep] = useState(0)

  useEffect(() => () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    } catch {}
  }, [])

  const schoolsById = useMemo(() => {
    const map = new Map()
    for (const item of Array.isArray(schools) ? schools : []) {
      if (item?.id == null) continue
      map.set(String(item.id), item)
    }
    return map
  }, [schools])

  const headOfficesById = useMemo(() => {
    const map = new Map()
    for (const item of Array.isArray(headOffices) ? headOffices : []) {
      if (item?.id == null) continue
      map.set(String(item.id), item)
    }
    return map
  }, [headOffices])

  const availableApplicantRoles = useMemo(
    () =>
      (Array.isArray(applicantRoles) ? applicantRoles : []).filter((item) => {
        const roleName = normalizeApplicantType(item?.name)
        return roleName && roleName !== 'SUPER_ADMIN' && roleName !== 'HEAD_OFFICE_ADMIN'
      }),
    [applicantRoles],
  )

  const selectedSchool = useMemo(
    () => (form.schoolId ? schoolsById.get(String(form.schoolId)) : null),
    [form.schoolId, schoolsById],
  )

  const selectedHeadOfficeName = useMemo(() => {
    const headOfficeId = form.headOfficeId || selectedSchool?.headOfficeId || authHeadOfficeId
    if (headOfficeId == null) return ''
    return headOfficesById.get(String(headOfficeId))?.name || `Head Office ${headOfficeId}`
  }, [authHeadOfficeId, form.headOfficeId, headOfficesById, selectedSchool?.headOfficeId])

  const schoolOptions = useMemo(() => {
    if (isFixedSchoolRole) {
      return schools.filter((item) => String(item?.id ?? '') === String(authSchoolId ?? ''))
    }

    if (isSuperAdmin) {
      if (!form.headOfficeId) return []
      return schools.filter((item) => String(item?.headOfficeId ?? '') === String(form.headOfficeId))
    }

    if (isHeadOfficeAdmin) {
      return schools.filter((item) => String(item?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }

    return schools
  }, [authHeadOfficeId, authSchoolId, form.headOfficeId, isFixedSchoolRole, isHeadOfficeAdmin, isSuperAdmin, schools])

  const loadLookups = async () => {
    setLoading(true)
    try {
      const [schoolList, headOfficePage] = await Promise.all([
        fetchSchoolsLookup(),
        isSuperAdmin ? fetchHeadOfficesPage(0, 500) : Promise.resolve({ content: [] }),
      ])
      setSchools(Array.isArray(schoolList) ? schoolList : [])
      setHeadOffices(Array.isArray(headOfficePage?.content) ? headOfficePage.content.map((item) => ({
        ...item,
        name: item?.name || item?.headOfficeName || '',
      })) : [])
    } catch {
      setSchools([])
      setHeadOffices([])
    } finally {
      setLoading(false)
    }
  }

  const loadApplicantRolesForSchool = async (schoolId) => {
    if (!schoolId) {
      setApplicantRoles([])
      return
    }
    try {
      const data = await fetchSchoolRoles({ schoolId: Number(schoolId) })
      setApplicantRoles(Array.isArray(data) ? data : [])
    } catch {
      setApplicantRoles([])
    }
  }

  const loadDesignationsForSchool = async (schoolId, applicantType) => {
    const normalizedApplicantType = normalizeApplicantType(applicantType)
    if (!schoolId || !normalizedApplicantType || normalizedApplicantType === 'STUDENT') {
      setDesignations([])
      return
    }

    const matchesApplicantType = (item) =>
      normalizeApplicantType(item?.role || item?.applicantType || item?.designationType || '') === normalizedApplicantType

    const primary = await fetchDesignations({
      schoolId: Number(schoolId),
      role: normalizedApplicantType,
    }).catch(() => [])
    const primaryList = Array.isArray(primary) ? primary.filter(matchesApplicantType) : []
    if (primaryList.length > 0) {
      setDesignations(primaryList)
      return
    }

    const fallback = await fetchDesignations({ schoolId: Number(schoolId) }).catch(() => [])
    setDesignations(Array.isArray(fallback) ? fallback.filter(matchesApplicantType) : [])
  }

  useEffect(() => {
    if (status !== 'ready' || !token) return
    void loadLookups()
  }, [status, token, isSuperAdmin])

  useEffect(() => {
    if (form.schoolId) {
      void loadApplicantRolesForSchool(form.schoolId)
      void loadDesignationsForSchool(form.schoolId, form.applicantType)
    } else {
      setApplicantRoles([])
      setDesignations([])
    }
  }, [form.schoolId])

  useEffect(() => {
    if (form.applicantType && form.schoolId) {
      void loadDesignationsForSchool(form.schoolId, form.applicantType)
    }
  }, [form.applicantType, form.schoolId])

  const handleChange = (id, value) => {
    setForm((prev) => ({
      ...prev,
      [id]: value,
      ...(id === 'headOfficeId' ? { schoolId: '', applicantType: '', designationId: '' } : {}),
      ...(id === 'schoolId' ? { applicantType: '', designationId: '' } : {}),
      ...(id === 'applicantType' ? { designationId: '' } : {}),
    }))

    if (id === 'headOfficeId') {
      setApplicantRoles([])
      setDesignations([])
      return
    }
    if (id === 'schoolId') {
      void loadApplicantRolesForSchool(value)
      void loadDesignationsForSchool(value, '')
      return
    }
    if (id === 'applicantType') {
      void loadDesignationsForSchool(form.schoolId, value)
    }
  }

  const validate = () => {
    const schoolId = isFixedSchoolRole ? authSchoolId : form.schoolId
    if (isSuperAdmin && !String(form.headOfficeId || '').trim()) return 'Head office is required.'
    if (!schoolId) return 'School is required.'
    if (!String(form.applicantType || '').trim()) return 'Applicant type is required.'
    if (normalizeApplicantType(form.applicantType) !== 'STUDENT' && !form.designationId) {
      return 'Designation is required for non-student applicant types.'
    }
    if (!String(form.leaveType || '').trim()) return 'Leave type is required.'
    if (form.allowedLeavesPerYear === '' || form.allowedLeavesPerYear == null) return 'Allowed leaves count/year is required.'
    const parsed = Number(form.allowedLeavesPerYear)
    if (Number.isNaN(parsed) || parsed < 0) return 'Allowed leaves count/year must be zero or greater.'
    return ''
  }

  const buildPayload = () => {
    const schoolId = isFixedSchoolRole ? authSchoolId : form.schoolId
    const applicantType = normalizeApplicantType(form.applicantType)
    return {
      schoolId: Number(schoolId),
      designationId: applicantType === 'STUDENT' || !form.designationId ? null : Number(form.designationId),
      applicantType,
      leaveType: String(form.leaveType || '').trim(),
      allowedLeavesPerYear: Number(form.allowedLeavesPerYear),
    }
  }

  const save = async () => {
    const validation = validate()
    if (validation) {
      setError(validation)
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = buildPayload()
      if (editingId) {
        await updateLeaveType(editingId, payload)
      } else {
        await createLeaveType(payload)
      }

      setSuccess(true)
      setTimeout(() => {
        navigateTo?.('leave-type')
      }, 900)
    } catch (e) {
      setError(e?.message || (editingId ? 'Failed to update leave type' : 'Failed to create leave type'))
    } finally {
      setSaving(false)
    }
  }

  const renderBody = () => (
    <div className="avm-grid">
      {isSuperAdmin ? (
        <FormField label="Head Office" required >
          <select
            className="avm-select"
            id="headOfficeId"
            value={form.headOfficeId}
            onChange={(e) => handleChange('headOfficeId', e.target.value)}
          >
            <option value="">--Select Head Office--</option>
            {headOffices.map((option) => (
              <option key={option.id} value={String(option.id)}>
                {option.name || option.headOfficeName}
              </option>
            ))}
          </select>
        </FormField>
      ) : null}

      <FormField label="School Name" required >
        {isFixedSchoolRole ? (
          <input
            className="avm-input"
            value={authSchoolName || (authSchoolId != null ? `School ${authSchoolId}` : '')}
            readOnly
          />
        ) : (
          <select
            className="avm-select"
            id="schoolId"
            value={form.schoolId}
            onChange={(e) => handleChange('schoolId', e.target.value)}
            disabled={isSuperAdmin && !form.headOfficeId}
          >
            <option value="">
              {isSuperAdmin && !form.headOfficeId ? '--Select Head Office First--' : '--Select School--'}
            </option>
            {schoolOptions.map((option) => (
              <option key={option.id} value={String(option.id)}>
                {option.schoolName}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <FormField label="Applicant Type" required>
        <select
          className="avm-select"
          id="applicantType"
          value={form.applicantType}
          onChange={(e) => handleChange('applicantType', e.target.value)}
          disabled={!form.schoolId && !isFixedSchoolRole}
        >
          <option value="">--Select Applicant Type--</option>
          {availableApplicantRoles.map((option) => (
            <option key={option.name} value={option.name}>
              {formatRoleLabel(option.name)}
            </option>
          ))}
        </select>
      </FormField>

      {normalizeApplicantType(form.applicantType) !== 'STUDENT' ? (
        <FormField label="Designation" required noIcon>
          <div className="avm-input-with-icon" style={{ position: 'relative', minHeight: '44px' }}>
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
              <i className="ri-award-line" />
            </span>
            <select
              className="avm-select"
              id="designationId"
              value={form.designationId}
              onChange={(e) => handleChange('designationId', e.target.value)}
              disabled={!form.schoolId || !form.applicantType}
            >
              <option value="">
                {!form.schoolId || !form.applicantType
                  ? '--Select Designation--'
                  : designations.length === 0
                    ? 'No designations found for the selected role and school.'
                    : '--Select Designation--'}
              </option>
              {designations.map((option) => (
                <option key={option.id} value={String(option.id)}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </FormField>
      ) : null}

      <FormField label="Leave Type" required >
        <input
          type="text"
          className="avm-input"
          value={form.leaveType}
          onChange={(e) => handleChange('leaveType', e.target.value)}
          placeholder="Enter leave type"
        />
      </FormField>

      <FormField label="Allowed Leaves count/year" required>
        <input
          type="number"
          min="0"
          className="avm-input"
          value={form.allowedLeavesPerYear}
          onChange={(e) => handleChange('allowedLeavesPerYear', e.target.value)}
          placeholder="Enter allowed leaves count/year"
        />
      </FormField>
    </div>
  )

  return (
    <SingleStepFormShell
      title={`${editingId ? 'Edit' : 'Add'} Leave Type`}
      breadcrumbTrail={` / Leave Type / ${editingId ? 'Edit' : 'Add'}`}
      onDashboard={() => navigateTo?.('dashboard')}
      onBack={() => navigateTo?.('leave-type')}
      stepLabel={STEPS[0]}
      error={error}
      success={success}
      successMessage={`Leave type ${editingId ? 'updated' : 'created'} successfully! Redirecting...`}
      footer={
        <>
          <button type="button" className="btn btn-light border px-24" onClick={() => navigateTo?.('leave-type')}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary-600 px-24 d-flex align-items-center gap-8"
            onClick={save}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> Processing...
              </>
            ) : (
              <>
                <i className="ri-save-line" /> {editingId ? 'Update' : 'Save'} Leave Type
              </>
            )}
          </button>
        </>
      }
    >
      {renderBody()}
    </SingleStepFormShell>
  )
}

export default AddLeaveType
