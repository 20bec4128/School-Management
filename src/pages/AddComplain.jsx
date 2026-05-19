import { useEffect, useMemo, useState } from 'react'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { useSchool } from '../context/useSchool'
import { useAuth } from '../context/useAuth'
import { findSchoolById } from '../utils/schoolScope'
import { fetchAcademicYears } from '../apis/academicYearsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchComplainTypes } from '../apis/complainTypeApi'
import { fetchStudentsByClassSection } from '../apis/studentsApi'
import { fetchTeachers } from '../apis/teachersApi'
import { createComplain, updateComplain } from '../apis/complainApi'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'manage-complain-edit-row'

const emptyForm = {
  schoolId: '',
  classId: '',
  academicYear: '',
  userType: '',
  complainBy: '',
  studentId: '',
  teacherId: '',
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
          classId: initialEditRow.studentClassId != null
            ? String(initialEditRow.studentClassId)
            : initialEditRow.classId != null
              ? String(initialEditRow.classId)
              : '',
          studentId: initialEditRow.studentId != null ? String(initialEditRow.studentId) : '',
          teacherId: initialEditRow.teacherId != null ? String(initialEditRow.teacherId) : '',
          complainTypeId: initialEditRow.complainTypeId != null ? String(initialEditRow.complainTypeId) : '',
        }
      : { ...emptyForm, schoolId: !isSuperAdmin ? listSchoolId : '' }
  ))
  const [classes, setClasses] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [complainTypes, setComplainTypes] = useState([])
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingTeachers, setLoadingTeachers] = useState(false)
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
        setClasses([])
        setAcademicYears([])
        setComplainTypes([])
        setStudents([])
        setTeachers([])
        setLoadingStudents(false)
        setLoadingTeachers(false)
        return
      }
      try {
        setLoadingStudents(true)
        setLoadingTeachers(true)
        const [classList, yearList, typeList, teacherList] = await Promise.all([
          fetchClasses({ schoolId: form.schoolId }),
          fetchAcademicYears({ schoolId: form.schoolId }),
          fetchComplainTypes(form.schoolId),
          fetchTeachers(),
        ])
        setClasses(Array.isArray(classList) ? classList : [])
        setAcademicYears(Array.isArray(yearList) ? yearList : [])
        setComplainTypes(Array.isArray(typeList) ? typeList : [])
        setTeachers(
          Array.isArray(teacherList)
            ? teacherList.filter((teacher) => String(teacher?.schoolId ?? '') === String(form.schoolId))
            : [],
        )
      } catch (err) {
        console.error('Failed to load complain lookups:', err)
        setClasses([])
        setAcademicYears([])
        setComplainTypes([])
        setStudents([])
        setTeachers([])
      } finally {
        setLoadingStudents(false)
        setLoadingTeachers(false)
      }
    }
    void loadLookups()
  }, [form.schoolId])

  useEffect(() => {
    const loadStudents = async () => {
      if (!form.schoolId || form.userType !== 'Student' || !form.classId) {
        setStudents([])
        return
      }

      try {
        setLoadingStudents(true)
        const rows = await fetchStudentsByClassSection({
          schoolId: form.schoolId,
          classId: form.classId,
        })
        setStudents(Array.isArray(rows) ? rows : [])
      } catch (err) {
        console.error('Failed to load students:', err)
        setStudents([])
      } finally {
        setLoadingStudents(false)
      }
    }

    void loadStudents()
  }, [form.classId, form.schoolId, form.userType])

  const schoolOptions = isSuperAdmin ? manualScope.schoolOptions : contextSchoolOptions

  const academicYearSuggestions = useMemo(
    () => Array.from(new Set(academicYears.map((year) => String(year?.academicYear || '').trim()).filter(Boolean))),
    [academicYears],
  )

  const classOptions = useMemo(
    () =>
      (Array.isArray(classes) ? classes : [])
        .map((row) => {
          const id = row?.id != null ? String(row.id) : ''
          const label = row?.className || row?.numericName || row?.name || ''
          if (!id || !label) return null
          return { id, label }
        })
        .filter(Boolean),
    [classes],
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

  const studentOptions = useMemo(
    () =>
      (Array.isArray(students) ? students : [])
        .map((student) => {
          const id = student?.id != null ? String(student.id) : ''
          const name = student?.name || student?.studentName || student?.fullName || ''
          if (!id || !name) return null
          const className = student?.className || student?.schoolClass?.className || student?.schoolClassName || ''
          const rollNo = student?.rollNo ? ` - Roll No: ${student.rollNo}` : ''
          const section = student?.section ? ` - Section: ${student.section}` : ''
          const classSuffix = className ? ` - Class: ${className}` : ''
          return { id, name, label: `${name}${rollNo}${classSuffix}${section}` }
        })
        .filter(Boolean),
    [students],
  )

  const teacherOptions = useMemo(
    () =>
      (Array.isArray(teachers) ? teachers : [])
        .map((teacher) => {
          const id = teacher?.id != null ? String(teacher.id) : ''
          const name = teacher?.name || teacher?.teacherName || teacher?.fullName || ''
          if (!id || !name) return null
          const designation = teacher?.designationName ? ` - ${teacher.designationName}` : ''
          return { id, name, label: `${name}${designation}` }
        })
        .filter(Boolean),
    [teachers],
  )

  const availableComplainBy = form.userType ? (complainByOptions[form.userType] || []) : []

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => {
      const next = { ...prev, [id]: value }
      if (id === 'userType') {
        next.complainBy = ''
        next.classId = ''
        next.studentId = ''
        next.teacherId = ''
      }
      if (id === 'schoolId') {
        next.academicYear = ''
        next.complainTypeId = ''
        next.complainBy = ''
        next.classId = ''
        next.studentId = ''
        next.teacherId = ''
      }
      if (id === 'classId') {
        next.studentId = ''
        next.complainBy = ''
      }
      if (id === 'studentId') {
        const selectedStudent = studentOptions.find((option) => option.id === value)
        next.complainBy = selectedStudent?.name || ''
      }
      if (id === 'teacherId') {
        const selectedTeacher = teacherOptions.find((option) => option.id === value)
        next.complainBy = selectedTeacher?.name || ''
      }
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setSuccess(false)

    const complainByValue = String(form.complainBy || '').trim()
    const requiresStudent = form.userType === 'Student'
    const requiresTeacher = form.userType === 'Teacher'

    if (
      !form.schoolId ||
      !form.academicYear ||
      !form.userType ||
      (requiresStudent && !form.classId) ||
      (requiresStudent && !form.studentId) ||
      (requiresTeacher && !form.teacherId) ||
      !complainByValue ||
      !form.complainTypeId ||
      !form.complainDate ||
      !form.complain
    ) {
      setError('Please fill all required fields')
      return
    }

    setLoading(true)
    try {
      const payload = {
        schoolId: Number(form.schoolId),
        studentClassId: form.classId ? Number(form.classId) : null,
        academicYear: form.academicYear || '',
        userType: form.userType || '',
        complainBy: complainByValue,
        studentId: form.studentId ? Number(form.studentId) : null,
        teacherId: form.teacherId ? Number(form.teacherId) : null,
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
                      setForm((prev) => ({ ...prev, schoolId: '', academicYear: '', complainTypeId: '', complainBy: '', studentId: '', teacherId: '' }))
                    }}
                    selectedSchoolId={form.schoolId}
                    onSchoolChange={(value) => {
                      manualScope.setSelectedSchoolId(value)
                      setForm((prev) => ({ ...prev, schoolId: value, academicYear: '', complainTypeId: '', complainBy: '', studentId: '', teacherId: '' }))
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
                <select
                  id="academicYear"
                  className="form-control form-select"
                  value={form.academicYear}
                  onChange={handleChange}
                  disabled={!form.schoolId}
                  style={{ paddingLeft: '2.5rem' }}
                >
                  <option value="">{form.schoolId ? '--Select Academic Year--' : 'Select School First'}</option>
                  {academicYearSuggestions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="User Type" required>
                <select id="userType" className="form-control form-select" value={form.userType} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                  <option value="">--Select--</option>
                  {userTypeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </FormField>

              {form.userType === 'Student' ? (
                <FormField label="Class" required>
                  <select
                    id="classId"
                    className="form-control form-select"
                    value={form.classId}
                    onChange={handleChange}
                    disabled={!form.schoolId}
                    style={{ paddingLeft: '2.5rem' }}
                  >
                    <option value="">{form.schoolId ? '--Select Class--' : 'Select School First'}</option>
                    {classOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              ) : null}

              <FormField label="Complain By" required>
                {form.userType === 'Student' ? (
                  <select
                    id="studentId"
                    className="form-control form-select"
                    value={form.studentId}
                    onChange={handleChange}
                    disabled={!form.schoolId || !form.classId || loadingStudents}
                    style={{ paddingLeft: '2.5rem' }}
                  >
                    <option value="">
                      {!form.classId
                        ? 'Select Class First'
                        : loadingStudents
                          ? 'Loading students...'
                          : '--Select Student--'}
                    </option>
                    {studentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : form.userType === 'Teacher' ? (
                  <select
                    id="teacherId"
                    className="form-control form-select"
                    value={form.teacherId}
                    onChange={handleChange}
                    disabled={!form.schoolId || loadingTeachers}
                    style={{ paddingLeft: '2.5rem' }}
                  >
                    <option value="">{loadingTeachers ? 'Loading teachers...' : '--Select Teacher--'}</option>
                    {teacherOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select id="complainBy" className="form-control form-select" value={form.complainBy} onChange={handleChange} disabled={!form.userType} style={{ paddingLeft: '2.5rem' }}>
                    <option value="">--Select--</option>
                    {availableComplainBy.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                )}
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
