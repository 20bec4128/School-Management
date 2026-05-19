import { useEffect, useMemo, useState } from 'react'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchStudentsByClassSection } from '../apis/studentsApi'
import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import '../assets/css/addModalShared.css'
import {
  createMarkSendSms,
  fetchMarkSendSmsById,
  updateMarkSendSms,
} from '../apis/markSendSmsApi'

const EDIT_STORAGE_KEY = 'MARK_SEND_SMS_EDIT_ID'
const STEPS = ['Basic Information', 'SMS Content']

const DEFAULT_EXAM_TERMS = ['First Term', 'Second Term', 'Final Term']
const RECEIVER_TYPE_OPTIONS = ['Student', 'Parent', 'Guardian']
const TEMPLATE_OPTIONS = {
  'Default Mark SMS': 'Hello [name], your exam mark is [exam_mark].',
  'Exam Result SMS': 'Dear [name], your exam result is [exam_mark].',
  'Parent Notification SMS': 'Dear parent, [name] scored [exam_mark] in the exam.',
}
const GATEWAY_OPTIONS = ['Twilio', 'Fast2SMS', 'TextLocal']
const DYNAMIC_TAGS = ['[name]', '[phone]', '[exam_mark]', '[school]']

const FIELD_ICONS = {
  'Head Office': 'ri-building-line',
  'School Name': 'ri-school-line',
  'Exam Term': 'ri-calendar-event-line',
  'Receiver Type': 'ri-group-line',
  Receiver: 'ri-user-line',
  Template: 'ri-file-list-line',
  Gateway: 'ri-global-line',
  SMS: 'ri-message-2-line',
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

const emptyForm = {
  id: null,
  headOfficeId: '',
  schoolId: '',
  classId: '',
  examTerm: '',
  receiverType: '',
  receiver: '',
  template: '',
  sms: '',
  gateway: '',
  sendDate: '',
}

const MarkSendBySMSCreate = ({ onNavigate }) => {
  const {
    role: authRole,
    user,
    headOfficeId: authHeadOfficeId,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
  } = useAuth()

  const role = useMemo(
    () =>
      normalizeRole(
        authRole || user?.role || user?.userRole || user?.authority,
      ),
    [authRole, user],
  )
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [schools, setSchools] = useState([])
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const editId = useMemo(() => sessionStorage.getItem(EDIT_STORAGE_KEY), [])
  const isEditMode = Boolean(editId)

  const schoolOptions = useMemo(() => {
    const list = Array.isArray(schools) ? schools : []
    if (isSuperAdmin) return manualScope.schoolOptions || []
    if (isHeadOfficeAdmin) {
      return list.filter(
        (school) =>
          String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''),
      )
    }
    if (isSchoolAdmin) {
      const match = list.find(
        (school) => String(school?.id ?? '') === String(authSchoolId ?? ''),
      )
      if (match) return [match]
      if (authSchoolId != null) {
        return [
          {
            id: authSchoolId,
            schoolName: authSchoolName || 'My School',
            headOfficeId: authHeadOfficeId ?? null,
          },
        ]
      }
      return []
    }
    return list
  }, [
    schools,
    isSuperAdmin,
    manualScope.schoolOptions,
    isHeadOfficeAdmin,
    isSchoolAdmin,
    authHeadOfficeId,
    authSchoolId,
    authSchoolName,
  ])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const lookupData = await fetchSchoolsLookup()
        if (cancelled) return
        setSchools(Array.isArray(lookupData) ? lookupData : [])

        if (isEditMode && editId) {
          const existing = await fetchMarkSendSmsById(editId)
          if (cancelled || !existing) return
          setForm({
            id: existing.id ?? null,
            headOfficeId:
              existing.headOfficeId != null ? String(existing.headOfficeId) : '',
            schoolId: existing.schoolId != null ? String(existing.schoolId) : '',
            classId: existing.classId != null ? String(existing.classId) : '',
            examTerm: existing.examTerm ?? '',
            receiverType: existing.receiverType ?? '',
            receiver: existing.receiver ?? '',
            template: existing.template ?? '',
            sms: existing.sms ?? '',
            gateway: existing.gateway ?? '',
            sendDate: existing.sendDate ?? '',
          })

          if (isSuperAdmin && existing.schoolId != null) {
            const match = Array.isArray(lookupData)
              ? lookupData.find(
                  (school) =>
                    String(school?.id ?? '') === String(existing.schoolId),
                )
              : null
            manualScope.setSelectedScope(
              match?.headOfficeId != null ? String(match.headOfficeId) : '',
              String(existing.schoolId),
            )
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load SMS form data.')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [editId, isEditMode, isSuperAdmin])

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return
    setForm((prev) => ({ ...prev, schoolId: String(authSchoolId) }))
  }, [authSchoolId, isSchoolAdmin])

  useEffect(() => {
    const loadClasses = async () => {
      if (!form.schoolId) {
        setClasses([])
        return
      }

      try {
        const data = await fetchClasses({ schoolId: form.schoolId })
        setClasses(Array.isArray(data) ? data : [])
      } catch {
        setClasses([])
      }
    }

    void loadClasses()
  }, [form.schoolId])

  useEffect(() => {
    if (!isSuperAdmin || isEditMode || !manualScope.selectedSchoolId) return
    setForm((prev) => ({ ...prev, schoolId: String(manualScope.selectedSchoolId) }))
  }, [isSuperAdmin, isEditMode, manualScope.selectedSchoolId])

  useEffect(() => {
    if (!form.schoolId || !form.classId) {
      setStudents([])
      return
    }

    const loadStudents = async () => {
      setLoadingStudents(true)
      try {
        const data = await fetchStudentsByClassSection({
          schoolId: form.schoolId,
          classId: form.classId,
        })
        setStudents(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to load students:', err)
        setStudents([])
      } finally {
        setLoadingStudents(false)
      }
    }

    void loadStudents()
  }, [form.schoolId, form.classId])

  const resolveSchoolName = () => {
    const match = schoolOptions.find((school) => String(school.id) === String(form.schoolId))
    return match ? match.schoolName : 'Selected School'
  }

  const resolveHeadOfficeId = () => {
    const selectedSchool = schoolOptions.find(
      (school) => String(school.id) === String(form.schoolId),
    )
    if (selectedSchool?.headOfficeId != null) return Number(selectedSchool.headOfficeId)
    if (form.headOfficeId) return Number(form.headOfficeId)
    if (manualScope.selectedHeadOfficeId) return Number(manualScope.selectedHeadOfficeId)
    if (authHeadOfficeId != null) return Number(authHeadOfficeId)
    return null
  }

  const buildReceiverLabel = (student, receiverType) => {
    const studentName = student?.name || student?.studentName || student?.fullName || 'Unnamed Student'
    const rollNo = student?.rollNo ? ` - Roll No: ${student.rollNo}` : ''
    const className = student?.className ? ` - Class: ${student.className}` : ''
    const section = student?.section ? ` - Section: ${student.section}` : ''

    if (receiverType === 'Parent') {
      const parentName =
        student?.fatherName ||
        student?.motherName ||
        student?.parentName ||
        student?.parentUsername ||
        studentName
      return `${parentName}${rollNo}${className}${section}`
    }

    if (receiverType === 'Guardian') {
      const guardianName =
        student?.guardianName ||
        student?.guardianUsername ||
        student?.fatherName ||
        student?.motherName ||
        student?.parentUsername ||
        studentName
      return `${guardianName}${rollNo}${className}${section}`
    }

    return `${studentName}${rollNo}${className}${section}`
  }

  const receiverOptions = useMemo(() => {
    if (!form.receiverType || !form.classId) return []

    return (Array.isArray(students) ? students : [])
      .map((student) => {
        const value =
          form.receiverType === 'Student'
            ? student?.name || student?.studentName || student?.fullName || ''
            : form.receiverType === 'Parent'
              ? student?.fatherName ||
                student?.motherName ||
                student?.parentName ||
                student?.parentUsername ||
                ''
              : student?.guardianName ||
                student?.guardianUsername ||
                student?.fatherName ||
                student?.motherName ||
                student?.parentUsername ||
                ''

        if (!value) return null

        return {
          value,
          label: buildReceiverLabel(student, form.receiverType),
        }
      })
      .filter(Boolean)
      .filter(
        (item, index, array) =>
          index === array.findIndex((candidate) => candidate.value === item.value),
      )
  }, [form.receiverType, form.classId, students])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => {
      if (id === 'template') {
        return {
          ...prev,
          template: value,
          sms: value && TEMPLATE_OPTIONS[value] ? TEMPLATE_OPTIONS[value] : prev.sms,
        }
      }
      if (id === 'classId') {
        return {
          ...prev,
          classId: value,
          receiver: '',
        }
      }
      if (id === 'receiverType') {
        return {
          ...prev,
          receiverType: value,
          receiver: '',
        }
      }
      return { ...prev, [id]: value }
    })
  }

  const handleHeadOfficeChange = (value) => {
    manualScope.setSelectedScope(value, '')
    setForm((prev) => ({
      ...prev,
      headOfficeId: value,
      schoolId: '',
      classId: '',
      receiver: '',
    }))
  }

  const handleSchoolChange = (value) => {
    setForm((prev) => ({ ...prev, schoolId: value, classId: '', receiver: '' }))
    if (isSuperAdmin) {
      manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value)
    }
  }

  const validate = () => {
    if (!form.schoolId) return 'School is required'
    if (!form.classId) return 'Class is required'
    if (!form.examTerm) return 'Exam Term is required'
    if (!form.receiverType) return 'Receiver Type is required'
    if (!form.receiver) return 'Receiver is required'
    if (!form.gateway) return 'Gateway is required'
    if (!form.sms.trim()) return 'SMS is required'
    return ''
  }

  const validateStep = (targetStep) => {
    if (targetStep === 0) {
      if (!form.schoolId) return 'School is required'
      if (!form.classId) return 'Class is required'
      if (!form.examTerm) return 'Exam Term is required'
      if (!form.receiverType) return 'Receiver Type is required'
      if (!form.receiver) return 'Receiver is required'
      if (!form.gateway) return 'Gateway is required'
    }
    return ''
  }

  const handleSubmit = async () => {
    const validation = validate()
    if (validation) {
      setError(validation)
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      headOfficeId: resolveHeadOfficeId(),
      schoolId: Number(form.schoolId),
      schoolName: resolveSchoolName(),
      classId: form.classId ? Number(form.classId) : null,
      examTerm: form.examTerm,
      receiverType: form.receiverType,
      receiver: form.receiver,
      template: form.template,
      sms: form.sms.trim(),
      gateway: form.gateway,
      sendDate: form.sendDate || null,
    }

    try {
      if (isEditMode) {
        await updateMarkSendSms(editId, payload)
      } else {
        await createMarkSendSms(payload)
      }

      setSuccessMessage(
        `SMS ${isEditMode ? 'updated' : 'sent'} successfully! Redirecting...`,
      )
      setSuccess(true)
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
      setTimeout(() => onNavigate?.('mark-send-sms'), 1000)
    } catch (err) {
      setError(err?.message || 'Failed to save SMS record.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {isEditMode ? 'Edit Send SMS' : 'Add Send SMS'}
          </h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
              onClick={() => onNavigate?.('dashboard')}
            >
              Dashboard
            </button>
            <span className="text-secondary-light">
              {' '}
              / Mark Send By SMS / {isEditMode ? 'Edit' : 'Add'}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border px-20 d-flex align-items-center gap-6"
          onClick={() => onNavigate?.('mark-send-sms')}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error ? <div className="alert alert-danger mb-24 radius-8">{error}</div> : null}
      {success ? <div className="alert alert-success mb-24 radius-8">{successMessage}</div> : null}

      <div className="card h-100">
        <div className="card-header border-bottom border-neutral-200 px-20 py-0 d-flex gap-0">
          {STEPS.map((tab, index) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                if (index > step) {
                  const validation = validateStep(step)
                  if (validation) {
                    setError(validation)
                    return
                  }
                }
                setError('')
                setStep(index)
              }}
              style={{
                background: 'none',
                border: 'none',
                borderBottom:
                  step === index
                    ? '2px solid var(--primary-600, #4f46e5)'
                    : '2px solid transparent',
                color:
                  step === index
                    ? 'var(--primary-600, #4f46e5)'
                    : 'var(--secondary-light, #667085)',
                fontWeight: step === index ? 600 : 400,
                padding: '14px 20px',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="card-body p-24">
          <form onSubmit={(e) => e.preventDefault()}>
            {step === 0 ? (
              <div className="avm-grid">
                {isSuperAdmin ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <ManualScopeSelectors
                      enabled={isSuperAdmin}
                      headOffices={manualScope.headOffices}
                      schoolOptions={schoolOptions}
                      selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                      onHeadOfficeChange={handleHeadOfficeChange}
                      selectedSchoolId={form.schoolId}
                      onSchoolChange={handleSchoolChange}
                      compact
                    />
                  </div>
                ) : (
                  <FormField label="School Name" required full>
                    <select
                      className="form-control form-select ps-40"
                      id="schoolId"
                      value={form.schoolId}
                      onChange={(e) => handleSchoolChange(e.target.value)}
                      disabled={isSchoolAdmin}
                    >
                      <option value="">--Select School--</option>
                      {schoolOptions.map((school) => (
                        <option key={String(school.id)} value={String(school.id)}>
                          {school.schoolName}
                        </option>
                      ))}
                    </select>
                  </FormField>
                )}

                <FormField label="Class" required full>
                  <select
                    className="form-control form-select ps-40"
                    id="classId"
                    value={form.classId}
                    onChange={handleChange}
                    disabled={!form.schoolId}
                  >
                    <option value="">
                      {form.schoolId ? '--Select Class--' : 'Select School First'}
                    </option>
                    {classes.map((option) => (
                      <option key={String(option.id)} value={String(option.id)}>
                        {option.className || option.name || String(option.id)}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Exam Term" required>
                  <select
                    className="form-control form-select ps-40"
                    id="examTerm"
                    value={form.examTerm}
                    onChange={handleChange}
                  >
                    <option value="">--Select--</option>
                    {DEFAULT_EXAM_TERMS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Receiver Type" required>
                  <select
                    className="form-control form-select ps-40"
                    id="receiverType"
                    value={form.receiverType}
                    onChange={handleChange}
                  >
                    <option value="">--Select--</option>
                    {RECEIVER_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Receiver" required>
                  <select
                    className="form-control form-select ps-40"
                    id="receiver"
                    value={form.receiver}
                    onChange={handleChange}
                    disabled={!form.receiverType || !form.classId || loadingStudents}
                  >
                    <option value="">
                      {loadingStudents
                        ? 'Loading...'
                        : form.classId
                          ? '--Select--'
                          : 'Select Class First'}
                    </option>
                    {receiverOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Template" full>
                  <select
                    className="form-control form-select ps-40"
                    id="template"
                    value={form.template}
                    onChange={handleChange}
                  >
                    <option value="">--Select--</option>
                    {Object.keys(TEMPLATE_OPTIONS).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Gateway" required full>
                  <select
                    className="form-control form-select ps-40"
                    id="gateway"
                    value={form.gateway}
                    onChange={handleChange}
                  >
                    <option value="">--Select--</option>
                    {GATEWAY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            ) : (
              <div className="avm-grid">
                <FormField label="SMS" required full noIcon>
                  <textarea
                    rows={7}
                    className="form-control"
                    id="sms"
                    placeholder="SMS"
                    value={form.sms}
                    onChange={handleChange}
                    style={{ borderRadius: '8px' }}
                    maxLength={160}
                  />
                </FormField>

                <div className="avm-field full">
                  <label className="avm-label">Dynamic Tag</label>
                  <div
                    style={{
                      border: '1px solid #d0d5dd',
                      borderRadius: '0.9rem',
                      padding: '0.9rem',
                      background: '#f8fafc',
                    }}
                  >
                    <div className="avm-chip-wrap" style={{ marginTop: 0 }}>
                      {DYNAMIC_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className="avm-chip"
                          style={{ border: 'none', cursor: 'pointer' }}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              sms: prev.sms ? `${prev.sms} ${tag}` : tag,
                            }))
                          }
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center mt-24">
              <div>
                {step > 0 ? (
                  <button
                    type="button"
                    className="btn btn-light border"
                    onClick={() => setStep((value) => Math.max(0, value - 1))}
                  >
                    Back
                  </button>
                ) : null}
              </div>
              <div className="d-flex gap-10">
                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={() => onNavigate?.('mark-send-sms')}
                >
                  Cancel
                </button>
                {step === 1 ? (
                  <button
                    type="button"
                    className="btn btn-primary-600"
                    disabled={saving}
                    onClick={handleSubmit}
                  >
                    {saving ? 'Saving...' : isEditMode ? 'Update' : 'Send'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary-600"
                    onClick={() => {
                      const validation = validateStep(step)
                      if (validation) {
                        setError(validation)
                        return
                      }
                      setError('')
                      setSuccess(false)
                      setSuccessMessage('')
                      setStep((value) => Math.min(STEPS.length - 1, value + 1))
                    }}
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default MarkSendBySMSCreate
