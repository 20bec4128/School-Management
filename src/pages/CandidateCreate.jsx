import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchAcademicYears } from '../apis/academicYearsApi'
import { fetchStudentsByClassSection } from '../apis/studentsApi'
import { createCandidate, updateCandidate } from '../apis/candidatesApi'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-candidate-row'
const INITIAL_FORM = {
  headOfficeId: '',
  schoolId: '',
  academicYear: '',
  classId: '',
  sectionId: '',
  studentId: '',
  note: '',
}

const classLabel = (row) => row?.className || row?.numericName || row?.name || row?.label || ''
const sectionLabel = (row) => row?.name || row?.sectionName || ''

const CandidateCreate = ({ onNavigate }) => {
  const {
    role,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    headOfficeId: authHeadOfficeId,
    status: authStatus,
  } = useAuth()

  const navigateTo = typeof onNavigate === 'function' ? onNavigate : () => {}
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = String(role || '').toUpperCase() === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = String(role || '').toUpperCase() === 'SCHOOL_ADMIN'

  const [form, setForm] = useState(INITIAL_FORM)
  const [editId, setEditId] = useState(null)

  const [schools, setSchools] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [sectionsLookup, setSectionsLookup] = useState([])
  const [academicYearsLookup, setAcademicYearsLookup] = useState([])
  const [studentOptions, setStudentOptions] = useState([])

  const [selectedHeadOfficeId, setSelectedHeadOfficeId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadLookups = useCallback(async () => {
    try {
      const [schoolsData, headOfficesData, classesData, sectionsData, academicYearsData] = await Promise.allSettled([
        fetchSchoolsLookup(),
        fetchHeadOfficesPage(0, 500),
        fetchClasses(),
        fetchSections(),
        fetchAcademicYears(),
      ])

      if (schoolsData.status === 'fulfilled') {
        setSchools(Array.isArray(schoolsData.value) ? schoolsData.value : [])
      }
      if (headOfficesData.status === 'fulfilled') {
        const list = Array.isArray(headOfficesData.value?.content) ? headOfficesData.value.content : []
        setHeadOffices(
          list
            .map((ho) => ({ id: ho?.id, name: ho?.name || ho?.headOfficeName || '' }))
            .filter((ho) => ho.id != null && ho.name)
            .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        )
      }
      if (classesData.status === 'fulfilled') {
        const val = classesData.value
        setClassesLookup(Array.isArray(val) ? val : (Array.isArray(val?.content) ? val.content : []))
      }
      if (sectionsData.status === 'fulfilled') {
        const val = sectionsData.value
        setSectionsLookup(Array.isArray(val) ? val : (Array.isArray(val?.content) ? val.content : []))
      }
      if (academicYearsData.status === 'fulfilled') {
        const val = academicYearsData.value
        setAcademicYearsLookup(Array.isArray(val) ? val : (Array.isArray(val?.content) ? val.content : []))
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

  // Get current active school info
  const selectedSchoolInfo = useMemo(() => {
    if (!form.schoolId) return null
    return schools.find((s) => String(s.id) === String(form.schoolId)) || null
  }, [form.schoolId, schools])

  const schoolOptions = useMemo(() => {
    if (isSchoolAdmin) {
      return authSchoolId ? [
        {
          id: authSchoolId,
          schoolName: authSchoolName || `School ${authSchoolId}`,
          headOfficeId: authHeadOfficeId ?? null,
        }
      ] : []
    }

    if (isHeadOfficeAdmin) {
      const targetHeadOfficeId = authHeadOfficeId != null ? String(authHeadOfficeId) : ''
      return [...schools]
        .filter((school) => String(school?.headOfficeId ?? '') === targetHeadOfficeId)
        .sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
    }

    if (selectedHeadOfficeId) {
      return [...schools]
        .filter((school) => String(school?.headOfficeId ?? '') === String(selectedHeadOfficeId))
        .sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
    }

    return [...schools].sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
  }, [authHeadOfficeId, authSchoolId, authSchoolName, isHeadOfficeAdmin, isSchoolAdmin, schools, selectedHeadOfficeId])

  const classOptions = useMemo(() => {
    return classesLookup
      .filter((row) => !form.schoolId || String(row?.schoolId) === String(form.schoolId))
      .slice()
      .sort((a, b) => classLabel(a).localeCompare(classLabel(b)))
  }, [classesLookup, form.schoolId])

  const sectionOptions = useMemo(() => {
    return sectionsLookup
      .filter((row) => {
        if (form.schoolId && String(row?.schoolId) !== String(form.schoolId)) return false
        if (form.classId && String(row?.classId) !== String(form.classId)) return false
        return true
      })
      .slice()
      .sort((a, b) => sectionLabel(a).localeCompare(sectionLabel(b)))
  }, [sectionsLookup, form.schoolId, form.classId])

  const academicYearOptions = useMemo(() => {
    return Array.from(
      new Set(
        academicYearsLookup
          .map((item) => String(item?.academicYear || '').trim())
          .filter(Boolean),
      ),
    ).sort().reverse()
  }, [academicYearsLookup])

  // Setup Form / Edit mode
  useEffect(() => {
    if (authStatus !== 'ready') return

    // Apply defaults
    if (isSchoolAdmin && authSchoolId) {
      setForm((prev) => ({ ...prev, schoolId: String(authSchoolId) }))
    } else if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      setSelectedHeadOfficeId(String(authHeadOfficeId))
      setForm((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
    }

    try {
      const stored = sessionStorage.getItem(EDIT_STORAGE_KEY)
      if (stored) {
        const row = JSON.parse(stored)
        if (row && row.id) {
          setEditId(row.id)

          const matchedSchool = schools.find((s) => String(s.id) === String(row.schoolId))
          const resolvedHoId = row.headOfficeId != null ? String(row.headOfficeId) : matchedSchool?.headOfficeId != null ? String(matchedSchool.headOfficeId) : ''

          if (resolvedHoId) {
            setSelectedHeadOfficeId(resolvedHoId)
          }

          setForm({
            headOfficeId: resolvedHoId,
            schoolId: row.schoolId != null ? String(row.schoolId) : '',
            academicYear: row.academicYear || '',
            classId: row.classId != null ? String(row.classId) : '',
            sectionId: row.sectionId != null ? String(row.sectionId) : '',
            studentId: row.studentId != null ? String(row.studentId) : '',
            note: row.note || '',
          })
        }
      }
    } catch {
      // ignore
    }
  }, [authHeadOfficeId, authSchoolId, authStatus, isHeadOfficeAdmin, isSchoolAdmin, schools])

  // Load students based on selected school, class, section
  useEffect(() => {
    if (!form.schoolId || !form.classId || !form.sectionId) {
      setStudentOptions([])
      return
    }

    let cancelled = false
    const run = async () => {
      try {
        const data = await fetchStudentsByClassSection({
          schoolId: form.schoolId,
          classId: form.classId,
          sectionId: form.sectionId,
        })
        if (!cancelled) {
          setStudentOptions(Array.isArray(data) ? data : [])
        }
      } catch {
        if (!cancelled) {
          setStudentOptions([])
        }
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

  const handleSubmit = async () => {
    setError('')
    setSuccess('')
    setBusy(true)

    const finalHoId = isSchoolAdmin
      ? (selectedSchoolInfo?.headOfficeId || form.headOfficeId)
      : (selectedHeadOfficeId || form.headOfficeId)

    if (!form.schoolId) {
      setError('Please select a school')
      setBusy(false)
      return
    }

    if (!form.academicYear) {
      setError('Please select an Academic Year')
      setBusy(false)
      return
    }

    if (!form.classId) {
      setError('Please select a Class')
      setBusy(false)
      return
    }

    if (!form.sectionId) {
      setError('Please select a Section')
      setBusy(false)
      return
    }

    if (!form.studentId) {
      setError('Please select a Student')
      setBusy(false)
      return
    }

    try {
      const payload = {
        schoolId: Number(form.schoolId),
        classId: Number(form.classId),
        sectionId: Number(form.sectionId),
        studentId: Number(form.studentId),
        academicYear: form.academicYear,
        note: form.note || '',
      }

      if (editId) {
        await updateCandidate(editId, payload)
        setSuccess('Candidate updated successfully!')
      } else {
        await createCandidate(payload)
        setSuccess('Candidate added successfully!')
      }

      setTimeout(() => {
        try {
          sessionStorage.removeItem(EDIT_STORAGE_KEY)
        } catch {}
        navigateTo('candidate')
      }, 1500)
    } catch (err) {
      setError(err?.message || 'Failed to save candidate')
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    } catch {}
    navigateTo('candidate')
  }

  const isEdit = !!editId
  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">{isEdit ? 'Edit' : 'Add'} Candidate</h1>
          <span className="text-secondary-light">Candidate / {isEdit ? 'Edit' : 'Add'}</span>
        </div>
        <button
          type="button"
          className="btn btn-light border px-20 d-flex align-items-center gap-6"
          onClick={handleCancel}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-10 mb-24 radius-8">
          <i className="ri-error-warning-line text-lg" />
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success d-flex align-items-center gap-10 mb-24 radius-8">
          <i className="ri-checkbox-circle-line text-lg" />
          Candidate {isEdit ? 'updated' : 'added'} successfully! Redirecting...
        </div>
      )}

      <div className="row g-24">
        <div className="col-12">
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
                Candidate Details
              </div>
            </div>

            <div className="card-body p-24">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleSubmit()
                }}
              >
                <div className="row g-24">
                  <div className="col-12 mb-8">
                    <ManualScopeSelectors
                      enabled={!isSchoolAdmin}
                      headOffices={headOffices}
                      schoolOptions={schoolOptions}
                      selectedHeadOfficeId={selectedHeadOfficeId}
                      onHeadOfficeChange={(value) => {
                        setSelectedHeadOfficeId(value)
                        setForm((prev) => ({
                          ...prev,
                          schoolId: '',
                          headOfficeId: value,
                          classId: '',
                          sectionId: '',
                          studentId: '',
                        }))
                      }}
                      selectedSchoolId={form.schoolId}
                      onSchoolChange={(value) => {
                        const matched = schools.find((s) => String(s.id) === String(value))
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
                      showSchoolSelector={true}
                      showHeadOfficeSelector={isSuperAdmin}
                      compact
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-10">
                    <label htmlFor="academicYear" className="form-label fw-medium text-primary-light mb-0">
                      Academic Year <span className="text-danger">*</span>
                    </label>
                    <select
                      id="academicYear"
                      value={form.academicYear}
                      onChange={handleChange}
                      className="form-select form-control"
                      required
                    >
                      <option value="">--Select--</option>
                      {academicYearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-10">
                    <label htmlFor="classId" className="form-label fw-medium text-primary-light mb-0">
                      Class <span className="text-danger">*</span>
                    </label>
                    <select
                      id="classId"
                      value={form.classId}
                      onChange={handleChange}
                      className="form-select form-control"
                      required
                      disabled={!form.schoolId}
                    >
                      <option value="">--Select--</option>
                      {classOptions.map((row) => (
                        <option key={row.id} value={String(row.id)}>
                          {classLabel(row)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-10">
                    <label htmlFor="sectionId" className="form-label fw-medium text-primary-light mb-0">
                      Section <span className="text-danger">*</span>
                    </label>
                    <select
                      id="sectionId"
                      value={form.sectionId}
                      onChange={handleChange}
                      className="form-select form-control"
                      required
                      disabled={!form.classId}
                    >
                      <option value="">--Select--</option>
                      {sectionOptions.map((row) => (
                        <option key={row.id} value={String(row.id)}>
                          {sectionLabel(row)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 d-flex flex-column gap-10">
                    <label htmlFor="studentId" className="form-label fw-medium text-primary-light mb-0">
                      Student <span className="text-danger">*</span>
                    </label>
                    <select
                      id="studentId"
                      value={form.studentId}
                      onChange={handleChange}
                      className="form-select form-control"
                      required
                      disabled={!form.sectionId}
                    >
                      <option value="">{form.sectionId ? '--Select--' : 'Select Section First'}</option>
                      {studentOptions.map((student) => (
                        <option key={student.id} value={String(student.id)}>
                          {student.name || student.studentName || `Student ${student.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 d-flex flex-column gap-10">
                    <label htmlFor="note" className="form-label fw-medium text-primary-light mb-0">
                      Note
                    </label>
                    <textarea
                      id="note"
                      value={form.note}
                      onChange={handleChange}
                      placeholder="Enter note or description here..."
                      className="form-control"
                      rows={4}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-end gap-12 mt-24 pt-20 border-top border-neutral-200">
                  <button
                    type="button"
                    className="btn btn-light border px-24"
                    onClick={handleCancel}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-600 px-24" disabled={busy}>
                    {busy ? 'Saving...' : isEdit ? 'Update Candidate' : 'Save Candidate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CandidateCreate
