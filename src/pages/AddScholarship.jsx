import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchStudentsByClassSection } from '../apis/studentsApi'
import { createScholarship, updateScholarship } from '../apis/scholarshipsApi'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-scholarship-row'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  classId: '',
  sectionId: '',
  studentId: '',
  amount: '',
  paymentDate: '',
  note: '',
}

const schoolLabel = (row) => row?.schoolName || row?.name || ''
const classLabel = (row) => row?.className || row?.numericName || row?.name || ''
const sectionLabel = (row) => row?.name || row?.sectionName || ''
const studentLabel = (row) => row?.name || row?.studentName || ''

const unwrapCollection = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.content)) return value.content
  return []
}

const getSchoolById = (rows, schoolId) =>
  (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(schoolId ?? '')) || null

const FormField = ({ label, required, children, full = false }) => (
  <div className={full ? 'col-12 mb-20' : 'col-md-6 mb-20'}>
    <label className="form-label fw-semibold text-primary-light mb-8 d-block">
      {label} {required && <span className="text-danger-600">*</span>}
    </label>
    {children}
  </div>
)

const AddScholarship = ({ onNavigate } = {}) => {
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : () => {}

  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [headOffices, setHeadOffices] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [sectionsLookup, setSectionsLookup] = useState([])
  const [studentOptions, setStudentOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedHeadOfficeId, setSelectedHeadOfficeId] = useState('')

  const loadLookups = useCallback(async () => {
    setLoading(true)
    try {
      const [headOfficesResult, schoolsResult, classesResult, sectionsResult] = await Promise.allSettled([
        fetchHeadOfficesPage(0, 500),
        fetchSchoolsLookup(),
        fetchClasses(),
        fetchSections(),
      ])

      setHeadOffices(
        unwrapCollection(headOfficesResult.status === 'fulfilled' ? headOfficesResult.value : [])
          .map((ho) => ({ id: ho?.id, name: ho?.name || ho?.headOfficeName || '' }))
          .filter((ho) => ho.id != null && ho.name)
          .sort((a, b) => String(a.name).localeCompare(String(b.name))),
      )
      setSchoolsLookup(unwrapCollection(schoolsResult.status === 'fulfilled' ? schoolsResult.value : []))
      setClassesLookup(unwrapCollection(classesResult.status === 'fulfilled' ? classesResult.value : []))
      setSectionsLookup(unwrapCollection(sectionsResult.status === 'fulfilled' ? sectionsResult.value : []))
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(EDIT_STORAGE_KEY)
      if (!stored) return
      const row = JSON.parse(stored)
      if (!row?.id) return

      const school = getSchoolById(schoolsLookup, row.schoolId)
      const resolvedHoId = row.headOfficeId != null ? String(row.headOfficeId) : school?.headOfficeId != null ? String(school.headOfficeId) : ''

      setEditId(row.id)
      setSelectedHeadOfficeId(resolvedHoId)
      setForm({
        headOfficeId: resolvedHoId,
        schoolId: row.schoolId != null ? String(row.schoolId) : '',
        classId: row.classId != null ? String(row.classId) : '',
        sectionId: row.sectionId != null ? String(row.sectionId) : '',
        studentId: row.studentId != null ? String(row.studentId) : '',
        amount: row.amount != null ? String(row.amount) : '',
        paymentDate: row.paymentDate ? String(row.paymentDate) : '',
        note: row.note || '',
      })
    } catch {
      // ignore
    }
  }, [schoolsLookup])

  const schoolOptions = useMemo(() => {
    if (!selectedHeadOfficeId) {
      return [...schoolsLookup].sort((a, b) => schoolLabel(a).localeCompare(schoolLabel(b)))
    }

    return [...schoolsLookup]
      .filter((school) => String(school?.headOfficeId ?? '') === String(selectedHeadOfficeId))
      .sort((a, b) => schoolLabel(a).localeCompare(schoolLabel(b)))
  }, [schoolsLookup, selectedHeadOfficeId])

  const classOptions = useMemo(() => {
    return classesLookup
      .filter((row) => !form.schoolId || String(row?.schoolId ?? '') === String(form.schoolId))
      .slice()
      .sort((a, b) => classLabel(a).localeCompare(classLabel(b)))
  }, [classesLookup, form.schoolId])

  const sectionOptions = useMemo(() => {
    return sectionsLookup
      .filter((row) => {
        if (form.schoolId && String(row?.schoolId ?? '') !== String(form.schoolId)) return false
        if (form.classId && String(row?.classId ?? '') !== String(form.classId)) return false
        return true
      })
      .slice()
      .sort((a, b) => sectionLabel(a).localeCompare(sectionLabel(b)))
  }, [sectionsLookup, form.schoolId, form.classId])

  useEffect(() => {
    if (!form.schoolId || !form.classId || !form.sectionId) {
      setStudentOptions([])
      return
    }

    let cancelled = false
    const run = async () => {
      try {
        const list = await fetchStudentsByClassSection({
          schoolId: form.schoolId,
          classId: form.classId,
          sectionId: form.sectionId,
        })
        if (!cancelled) {
          setStudentOptions((Array.isArray(list) ? list : []).slice().sort((a, b) => studentLabel(a).localeCompare(studentLabel(b))))
        }
      } catch {
        if (!cancelled) setStudentOptions([])
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [form.schoolId, form.classId, form.sectionId])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => {
      const next = { ...prev, [id]: value }
      if (id === 'schoolId') {
        next.classId = ''
        next.sectionId = ''
        next.studentId = ''
      } else if (id === 'classId') {
        next.sectionId = ''
        next.studentId = ''
      } else if (id === 'sectionId') {
        next.studentId = ''
      }
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.schoolId) return setError('Please select a school')
    if (!form.classId) return setError('Please select a Class')
    if (!form.sectionId) return setError('Please select a Section')
    if (!form.studentId) return setError('Please select a Candidate')
    if (form.amount === '') return setError('Please enter Amount')
    if (!form.paymentDate) return setError('Please select Payment Date')

    setSaving(true)
    try {
      const payload = {
        schoolId: form.schoolId ? Number(form.schoolId) : null,
        classId: form.classId ? Number(form.classId) : null,
        sectionId: form.sectionId ? Number(form.sectionId) : null,
        studentId: form.studentId ? Number(form.studentId) : null,
        amount: form.amount === '' ? null : Number(form.amount),
        paymentDate: form.paymentDate || null,
        note: form.note || null,
      }

      if (editId != null) {
        await updateScholarship(editId, payload)
        setSuccess('Scholarship updated successfully!')
      } else {
        await createScholarship(payload)
        setSuccess('Scholarship added successfully!')
      }

      setTimeout(() => {
        try {
          sessionStorage.removeItem(EDIT_STORAGE_KEY)
        } catch {}
        navigateTo('scholarship')
      }, 1000)
    } catch (e) {
      setError(e?.message || 'Failed to save scholarship')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    } catch {}
    navigateTo('scholarship')
  }

  const isEdit = editId != null

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">{isEdit ? 'Edit' : 'Add'} Scholarship</h1>
          <span className="text-secondary-light">Scholarship / {isEdit ? 'Edit' : 'Add'}</span>
        </div>
        <button type="button" className="btn btn-light border px-20 d-flex align-items-center gap-6" onClick={handleCancel}>
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-10 mb-24 radius-8">
          <i className="ri-error-warning-line text-lg" />
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="alert alert-success d-flex align-items-center gap-10 mb-24 radius-8">
          <i className="ri-checkbox-circle-line text-lg" />
          {success}
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-header border-bottom border-neutral-200 px-20 py-0 d-flex gap-0">
          <div
            style={{
              borderBottom: '2px solid var(--primary-600, #4f46e5)',
              color: 'var(--primary-600, #4f46e5)',
              fontWeight: 600,
              padding: '14px 20px',
              fontSize: '0.875rem',
            }}
          >
            Scholarship Details
          </div>
        </div>

        <div className="card-body p-24">
          {loading ? <div className="mb-16 text-secondary-light">Loading lookups...</div> : null}

          <form onSubmit={handleSubmit}>
            <div className="row g-24">
              <div className="col-12">
                <ManualScopeSelectors
                  enabled
                  headOffices={headOffices}
                  schoolOptions={schoolOptions}
                  selectedHeadOfficeId={selectedHeadOfficeId}
                  onHeadOfficeChange={(value) => {
                    setSelectedHeadOfficeId(value)
                    setForm((prev) => ({
                      ...prev,
                      headOfficeId: value,
                      schoolId: '',
                      classId: '',
                      sectionId: '',
                      studentId: '',
                    }))
                  }}
                  selectedSchoolId={form.schoolId}
                  onSchoolChange={(value) => {
                    const matched = schoolsLookup.find((school) => String(school.id) === String(value))
                    setForm((prev) => ({
                      ...prev,
                      schoolId: value,
                      headOfficeId: matched?.headOfficeId != null ? String(matched.headOfficeId) : prev.headOfficeId,
                      classId: '',
                      sectionId: '',
                      studentId: '',
                    }))
                    if (matched?.headOfficeId != null) {
                      setSelectedHeadOfficeId(String(matched.headOfficeId))
                    }
                  }}
                  schoolLabel="School"
                />
              </div>

              <FormField label="Class" required>
                <select
                  className="avm-select"
                  id="classId"
                  value={form.classId}
                  onChange={handleChange}
                  disabled={!form.schoolId}
                >
                  <option value="">{form.schoolId ? '--Select--' : 'Select School First'}</option>
                  {classOptions.map((row) => (
                    <option key={row.id} value={String(row.id)}>
                      {classLabel(row)}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Section" required>
                <select
                  className="avm-select"
                  id="sectionId"
                  value={form.sectionId}
                  onChange={handleChange}
                  disabled={!form.schoolId || !form.classId}
                >
                  <option value="">{form.classId ? '--Select--' : 'Select Class First'}</option>
                  {sectionOptions.map((row) => (
                    <option key={row.id} value={String(row.id)}>
                      {sectionLabel(row)}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Candidate" required>
                <select
                  className="avm-select"
                  id="studentId"
                  value={form.studentId}
                  onChange={handleChange}
                  disabled={!form.schoolId || !form.classId || !form.sectionId}
                >
                  <option value="">{form.sectionId ? '--Select--' : 'Select School/Class/Section First'}</option>
                  {studentOptions.map((row) => (
                    <option key={row.id} value={String(row.id)}>
                      {studentLabel(row)}
                    </option>
                  ))}
                </select>
              </FormField>

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

              <FormField label="Payment Date" required>
                <input
                  type="date"
                  className="avm-input"
                  id="paymentDate"
                  value={form.paymentDate}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="Note" full>
                <textarea
                  rows={4}
                  className="avm-input avm-textarea"
                  id="note"
                  placeholder="Note"
                  value={form.note}
                  onChange={handleChange}
                />
              </FormField>
            </div>

            <div className="d-flex align-items-center justify-content-end gap-12 mt-24 pt-20 border-top border-neutral-200">
              <button type="button" className="btn btn-light border px-24" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-600 px-24" disabled={saving}>
                {saving ? 'Saving...' : isEdit ? 'Update Scholarship' : 'Save Scholarship'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddScholarship
