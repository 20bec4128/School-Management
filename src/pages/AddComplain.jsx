import { useEffect, useMemo, useState } from 'react'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useSchool } from '../context/useSchool'
import { useAuth } from '../context/useAuth'
import { findSchoolById } from '../utils/schoolScope'
import { fetchAcademicYears } from '../apis/academicYearsApi'
import { fetchComplainTypes } from '../apis/complainTypeApi'
import { createComplain, updateComplain } from '../apis/complainApi'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'manage-complain-edit-row'

const emptyForm = {
  schoolId: '',
  academicYear: '',
  userType: '',
  complainBy: '',
  complainTypeId: '',
  complainDate: '',
  actionDate: '',
  complain: '',
}

const userTypeOptions = ['Student', 'Teacher', 'Employee', 'Parent']

const complainByOptions = {
  Student: ['Alice Brown', 'Bob Wilson', 'Charlie Davis', 'Diana Prince', 'Ethan Hunt'],
  Teacher: ['John Smith', 'Sarah Johnson', 'David Lee', 'Emily Clark', 'Michael Brown'],
  Employee: ['James Carter', 'Linda Brooks', 'Marcus Hill', 'Nina Walsh'],
  Parent: ['Mr. Thompson', 'Mrs. Garcia', 'Mr. Patel', 'Mrs. Lee'],
}

const FormField = ({ label, required, children, full = false }) => (
  <div className={full ? 'col-12 mb-20' : 'col-md-6 mb-20'}>
    <label className="form-label fw-semibold text-primary-light mb-8 d-block">
      {label} {required && <span className="text-danger-600">*</span>}
    </label>
    <div className="avm-input-with-icon" style={{ position: 'relative' }}>
      {children}
    </div>
  </div>
)

const AddComplain = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId } = useAuth()
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const listSchoolId = isSuperAdmin ? (activeSchoolId ? String(activeSchoolId) : '') : activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
  const initialEditRow = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])

  const [form, setForm] = useState(() => (
    initialEditRow
      ? {
          ...emptyForm,
          ...initialEditRow,
          schoolId: initialEditRow.schoolId != null ? String(initialEditRow.schoolId) : '',
          complainTypeId: initialEditRow.complainTypeId != null ? String(initialEditRow.complainTypeId) : '',
        }
      : { ...emptyForm, schoolId: !isSuperAdmin ? listSchoolId : '' }
  ))
  const [academicYears, setAcademicYears] = useState([])
  const [complainTypes, setComplainTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), [])

  useEffect(() => {
    if (!initialEditRow) return
    const school = findSchoolById(manualScope.schoolOptions, initialEditRow.schoolId)
    if (school?.headOfficeId != null) {
      manualScope.setSelectedScope(String(school.headOfficeId), String(initialEditRow.schoolId ?? ''))
    }
  }, [initialEditRow, manualScope])

  useEffect(() => {
    const loadLookups = async () => {
      if (!form.schoolId) {
        setAcademicYears([])
        setComplainTypes([])
        return
      }
      try {
        const [yearList, typeList] = await Promise.all([
          fetchAcademicYears({ schoolId: form.schoolId }),
          fetchComplainTypes(form.schoolId),
        ])
        setAcademicYears(Array.isArray(yearList) ? yearList : [])
        setComplainTypes(Array.isArray(typeList) ? typeList : [])
      } catch (err) {
        console.error('Failed to load complain lookups:', err)
        setAcademicYears([])
        setComplainTypes([])
      }
    }
    void loadLookups()
  }, [form.schoolId])

  const schoolOptions = isSuperAdmin ? manualScope.schoolOptions : contextSchoolOptions

  const academicYearSuggestions = useMemo(
    () => Array.from(new Set(academicYears.map((year) => String(year?.academicYear || '').trim()).filter(Boolean))),
    [academicYears],
  )

  const complainTypeOptions = useMemo(
    () =>
      Array.from(
        new Map(
          (Array.isArray(complainTypes) ? complainTypes : [])
            .map((row) => [String(row.id), { id: String(row.id), label: row.complainType }])
            .filter(([, row]) => row.label),
        ).values(),
      ),
    [complainTypes],
  )

  const availableComplainBy = form.userType ? (complainByOptions[form.userType] || []) : []

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => {
      const next = { ...prev, [id]: value }
      if (id === 'userType') next.complainBy = ''
      if (id === 'schoolId') {
        next.academicYear = ''
        next.complainTypeId = ''
        next.complainBy = ''
      }
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setSuccess(false)

    if (!form.schoolId || !form.academicYear || !form.userType || !form.complainBy || !form.complainTypeId || !form.complainDate || !form.complain) {
      setError('Please fill all required fields')
      return
    }

    setLoading(true)
    try {
      const payload = {
        schoolId: Number(form.schoolId),
        academicYear: form.academicYear || '',
        userType: form.userType || '',
        complainBy: form.complainBy || '',
        complainTypeId: form.complainTypeId ? Number(form.complainTypeId) : null,
        complainDate: form.complainDate || null,
        actionDate: form.actionDate || null,
        complain: form.complain || '',
      }

      if (initialEditRow?.id) {
        await updateComplain(initialEditRow.id, payload)
      } else {
        await createComplain(payload)
      }

      setSuccess(true)
      setTimeout(() => onNavigate('manage-complain'), 1000)
    } catch (err) {
      setError(err?.message || 'Failed to save complain')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {initialEditRow?.id ? 'Edit Complain' : 'Add Complain'}
          </h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / {initialEditRow?.id ? 'Edit Complain' : 'Add Complain'}</span>
          </div>
        </div>
        <button type="button" className="btn btn-light border px-20 d-flex align-items-center gap-6" onClick={() => onNavigate('manage-complain')}>
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error ? <div className="alert alert-danger d-flex align-items-center gap-8" role="alert"><i className="ri-error-warning-line"></i><span>{error}</span></div> : null}
      {success ? <div className="alert alert-success d-flex align-items-center gap-8" role="alert"><i className="ri-checkbox-circle-line"></i><span>Complain {initialEditRow?.id ? 'updated' : 'saved'} successfully! Redirecting...</span></div> : null}

      <div className="card h-100">
        <div className="card-body p-24">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {isSuperAdmin ? (
                <div className="col-12 mb-20">
                  <ManualScopeSelectors
                    enabled={isSuperAdmin}
                    headOffices={manualScope.headOffices}
                    schoolOptions={schoolOptions}
                    selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                    onHeadOfficeChange={(value) => {
                      manualScope.setSelectedHeadOfficeId(value)
                      manualScope.setSelectedSchoolId('')
                      setForm((prev) => ({ ...prev, schoolId: '', academicYear: '', complainTypeId: '', complainBy: '' }))
                    }}
                    selectedSchoolId={form.schoolId}
                    onSchoolChange={(value) => {
                      manualScope.setSelectedSchoolId(value)
                      setForm((prev) => ({ ...prev, schoolId: value }))
                    }}
                    compact
                  />
                </div>
              ) : (
                <FormField label="School Name" required>
                  <select
                    id="schoolId"
                    className="form-control form-select"
                    value={form.schoolId}
                    onChange={handleChange}
                    style={{ paddingLeft: '2.5rem' }}
                    disabled={!isSuperAdmin && !!listSchoolId}
                  >
                    <option value="">--Select School--</option>
                    {schoolOptions.map((s) => (
                      <option key={String(s.id)} value={String(s.id)}>
                        {s.schoolName}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField label="Academic Year" required>
                <input
                  type="text"
                  id="academicYear"
                  className="form-control"
                  list="complain-academic-years"
                  placeholder="Enter academic year"
                  value={form.academicYear}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <datalist id="complain-academic-years">
                  {academicYearSuggestions.map((year) => <option key={year} value={year} />)}
                </datalist>
              </FormField>

              <FormField label="User Type" required>
                <select id="userType" className="form-control form-select" value={form.userType} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                  <option value="">--Select--</option>
                  {userTypeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Complain By" required>
                <select id="complainBy" className="form-control form-select" value={form.complainBy} onChange={handleChange} disabled={!form.userType} style={{ paddingLeft: '2.5rem' }}>
                  <option value="">--Select--</option>
                  {availableComplainBy.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Complain Type" required>
                <select id="complainTypeId" className="form-control form-select" value={form.complainTypeId} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                  <option value="">--Select--</option>
                  {complainTypeOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Complain Date" required>
                <input type="date" id="complainDate" className="form-control" value={form.complainDate} onChange={handleChange} style={{ paddingLeft: '2.5rem' }} />
              </FormField>

              <FormField label="Action Date">
                <input type="date" id="actionDate" className="form-control" value={form.actionDate} onChange={handleChange} style={{ paddingLeft: '2.5rem' }} />
              </FormField>

              <FormField label="Complain" required full>
                <textarea
                  id="complain"
                  rows={4}
                  className="form-control"
                  placeholder="Enter complain details"
                  value={form.complain}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem', paddingTop: '0.65rem' }}
                />
              </FormField>
            </div>

            <div className="d-flex justify-content-end gap-12 mt-24">
              <button type="button" className="btn btn-light border px-32" onClick={() => onNavigate('manage-complain')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-600 px-32" disabled={loading}>
                {loading ? 'Saving...' : initialEditRow?.id ? 'Update Complain' : 'Save Complain'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddComplain
