import { useCallback, useEffect, useMemo, useState } from 'react'
import AbsentEmailForm from '../components/AbsentEmailForm'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { absentEmailTemplateOptions } from '../constants/absentEmail'
import {
  createAbsentEmailSetting,
  fetchAbsentEmailSettings,
  updateAbsentEmailSetting,
} from '../apis/absentEmailSettingsApi'
import '../assets/css/addModalShared.css'

const DEFAULT_SUBJECT = absentEmailTemplateOptions['Absent Alert Template']?.subject || 'Absent Notification for {student_name}'
const DEFAULT_BODY =
  absentEmailTemplateOptions['Absent Alert Template']?.emailBody ||
  'Dear {receiver_name},\n\nThis is to inform you that {student_name} was absent on {absent_date} in {class_name} - {section_name}.\n\nRegards,\n{school_name}'

const normalizeText = (value) => String(value ?? '').trim()

const AddAbsentEmail = ({ onNavigate }) => {
  const {
    role,
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    schoolId: authSchoolId,
  } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()

  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = String(role || '').toUpperCase() === 'HEAD_OFFICE_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const scopeSchoolOptions = useMemo(() => {
    const rows = Array.isArray(contextSchoolOptions) ? contextSchoolOptions : []
    if (isSuperAdmin) return manualScope.schoolOptions || []
    if (authHeadOfficeId != null) {
      return rows.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId))
    }
    return rows
  }, [authHeadOfficeId, contextSchoolOptions, isSuperAdmin, manualScope.schoolOptions])

  const headOfficeOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.headOffices || []
    if (authHeadOfficeId != null) {
      return [{ id: authHeadOfficeId, name: authHeadOfficeName || `Head Office ${authHeadOfficeId}` }]
    }
    return []
  }, [authHeadOfficeId, authHeadOfficeName, isSuperAdmin, manualScope.headOffices])

  const buildDefaultForm = useCallback(() => {
    const schoolId = !isSuperAdmin && !isHeadOfficeAdmin ? String(activeSchoolId || authSchoolId || '') : ''
    const headOfficeId =
      isHeadOfficeAdmin || (!isSuperAdmin && authHeadOfficeId != null) ? String(authHeadOfficeId ?? '') : ''

    return {
      id: null,
      headOfficeId,
      schoolId,
      enabled: true,
      receiverType: 'Student',
      subjectTemplate: DEFAULT_SUBJECT,
      emailBodyTemplate: DEFAULT_BODY,
    }
  }, [activeSchoolId, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSuperAdmin])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(() => buildDefaultForm())

  const loadSetting = useCallback(async () => {
    const schoolId = normalizeText(form.schoolId)
    if (!schoolId) return
    setLoading(true)
    setError('')
    try {
      const rows = await fetchAbsentEmailSettings({
        headOfficeId: normalizeText(form.headOfficeId) || undefined,
        schoolId,
      })
      const existing = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
      if (existing?.id) {
        setForm((prev) => ({
          ...prev,
          id: existing.id,
          headOfficeId: existing.headOfficeId != null ? String(existing.headOfficeId) : prev.headOfficeId,
          schoolId: existing.schoolId != null ? String(existing.schoolId) : prev.schoolId,
          enabled: existing.enabled !== false,
          receiverType: existing.receiverType || 'Student',
          subjectTemplate: existing.subjectTemplate || DEFAULT_SUBJECT,
          emailBodyTemplate: existing.emailBodyTemplate || DEFAULT_BODY,
        }))
      } else {
        setForm((prev) => ({
          ...prev,
          id: null,
          subjectTemplate: prev.subjectTemplate || DEFAULT_SUBJECT,
          emailBodyTemplate: prev.emailBodyTemplate || DEFAULT_BODY,
        }))
      }
    } catch (e) {
      setError(e?.message || 'Failed to load absent email settings')
    } finally {
      setLoading(false)
    }
  }, [form.headOfficeId, form.schoolId])

  useEffect(() => {
    void loadSetting()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.schoolId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if ((isSuperAdmin || isHeadOfficeAdmin) && !normalizeText(form.headOfficeId)) return setError('Head Office is required')
    if (!normalizeText(form.schoolId)) return setError('School is required')
    if (!normalizeText(form.subjectTemplate)) return setError('Subject template is required')
    if (!normalizeText(form.emailBodyTemplate)) return setError('Email body template is required')

    setSaving(true)
    try {
      const payload = {
        headOfficeId: normalizeText(form.headOfficeId) ? Number(form.headOfficeId) : null,
        schoolId: Number(form.schoolId),
        enabled: Boolean(form.enabled),
        receiverType: 'Student',
        subjectTemplate: form.subjectTemplate,
        emailBodyTemplate: form.emailBodyTemplate,
      }

      if (form.id) {
        await updateAbsentEmailSetting(form.id, payload)
      } else {
        const created = await createAbsentEmailSetting(payload)
        if (created?.id) {
          setForm((prev) => ({ ...prev, id: created.id }))
        }
      }

      setSuccess(true)
      setTimeout(() => onNavigate('absent-email'), 700)
    } catch (err) {
      setError(err?.message || 'Failed to save absent email settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Absent Email Settings</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Absent Email Settings</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border px-20 d-flex align-items-center gap-6"
          onClick={() => onNavigate('absent-email')}
        >
          <i className="ri-arrow-left-line"></i> Back to History
        </button>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-8" role="alert">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      ) : null}
      {success ? (
        <div className="alert alert-success d-flex align-items-center gap-8" role="alert">
          <i className="ri-checkbox-circle-line"></i>
          <span>Absent email settings saved successfully! Redirecting...</span>
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-24">
          {loading ? (
            <div className="text-secondary-light">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <AbsentEmailForm
                form={form}
                setForm={setForm}
                isSuperAdmin={isSuperAdmin}
                isHeadOfficeAdmin={isHeadOfficeAdmin}
                headOfficeOptions={headOfficeOptions}
                schoolOptions={scopeSchoolOptions}
              />
              <div className="d-flex justify-content-end mt-24">
                <button type="submit" className="btn btn-primary-600" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddAbsentEmail

