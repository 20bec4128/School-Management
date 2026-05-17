import { useCallback, useEffect, useMemo, useState } from 'react'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchBooksPage } from '../apis/booksApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchEmployees } from '../apis/employeesApi'
import { fetchStudentsByClassSection } from '../apis/studentsApi'
import { createLibraryIssue } from '../apis/libraryIssuesApi'
import { apiUrl } from '../apis/apiClient'
import '../assets/css/addModalShared.css'

const toDateInput = (date) => {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)

const DEFAULT_ISSUE_DATE = toDateInput(new Date())
const DEFAULT_DUE_DATE = toDateInput(addDays(new Date(), 7))

const buildEmptyForm = () => ({
  headOfficeId: '',
  schoolId: '',
  borrowerType: 'Student',
  bookId: '',
  classId: '',
  studentId: '',
  employeeRole: '',
  employeeId: '',
  issueDate: DEFAULT_ISSUE_DATE,
  dueDate: DEFAULT_DUE_DATE,
  note: '',
})

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  'Borrower Type': 'ri-user-3-line',
  'Borrower Role': 'ri-user-star-line',
  Class: 'ri-book-mark-line',
  Student: 'ri-user-line',
  Employee: 'ri-team-line',
  Book: 'ri-book-line',
  'Issue Date': 'ri-calendar-line',
  'Due Date': 'ri-calendar-todo-line',
  Note: 'ri-sticky-note-line',
}

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
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
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <i className={icon} />
        </span>
        {children}
      </div>
    </div>
  )
}

const getSchoolById = (rows, schoolId) =>
  (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(schoolId ?? '')) || null

const resolveMediaUrl = (value) => {
  const src = String(value || '').trim()
  if (!src) return ''
  return apiUrl(src)
}

const fetchAllPages = async (fetchPage, pageSize = 500) => {
  const firstPage = await fetchPage(0, pageSize)
  const firstContent = Array.isArray(firstPage?.content) ? firstPage.content : []
  const totalPages = Number.isFinite(firstPage?.totalPages) ? firstPage.totalPages : 1
  if (totalPages <= 1) return firstContent

  const pageRequests = []
  for (let page = 1; page < totalPages; page += 1) {
    pageRequests.push(fetchPage(page, pageSize))
  }
  const restPages = await Promise.all(pageRequests)
  return restPages.reduce((acc, item) => {
    if (Array.isArray(item?.content)) acc.push(...item.content)
    return acc
  }, [...firstContent])
}

const uniqueRoles = (rows) => {
  const seen = new Map()
  for (const row of Array.isArray(rows) ? rows : []) {
    const role = String(row?.role || '').trim()
    if (!role) continue
    const key = role.toLowerCase()
    if (!seen.has(key)) seen.set(key, role)
  }
  return Array.from(seen.values())
}

const IssueBookCreate = ({ onNavigate }) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, schoolId: authSchoolId } = useAuth()
  const { activeSchoolId } = useSchool()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [form, setForm] = useState(buildEmptyForm)
  const [allSchools, setAllSchools] = useState([])
  const [bookOptions, setBookOptions] = useState([])
  const [classOptions, setClassOptions] = useState([])
  const [studentOptions, setStudentOptions] = useState([])
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [lookupLoading, setLookupLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filterSchoolOptions = useMemo(() => {
    const rowsList = Array.isArray(allSchools) ? allSchools : []
    if (form.headOfficeId) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(form.headOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return rowsList.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return rowsList
  }, [allSchools, authHeadOfficeId, authSchoolId, form.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin])

  const selectedBook = useMemo(
    () => (Array.isArray(bookOptions) ? bookOptions : []).find((row) => String(row?.id ?? '') === String(form.bookId)) || null,
    [bookOptions, form.bookId],
  )
  const selectedBorrower = useMemo(() => {
    if (form.borrowerType === 'Employee') {
      return (Array.isArray(employeeOptions) ? employeeOptions : []).find((row) => String(row?.id ?? '') === String(form.employeeId)) || null
    }
    return (Array.isArray(studentOptions) ? studentOptions : []).find((row) => String(row?.id ?? '') === String(form.studentId)) || null
  }, [employeeOptions, form.borrowerType, form.employeeId, form.studentId, studentOptions])
  const selectedHeadOfficeName = useMemo(
    () => manualScope.headOffices.find((row) => String(row?.id ?? '') === String(form.headOfficeId))?.name || String(form.headOfficeId || authHeadOfficeId || ''),
    [authHeadOfficeId, form.headOfficeId, manualScope.headOffices],
  )
  const selectedBookCover = useMemo(() => resolveMediaUrl(selectedBook?.bookCover), [selectedBook?.bookCover])
  const selectedBorrowerPhoto = useMemo(
    () => resolveMediaUrl(selectedBorrower?.photoUrl || selectedBorrower?.studentPhoto || selectedBorrower?.employeePhoto),
    [selectedBorrower?.employeePhoto, selectedBorrower?.photoUrl, selectedBorrower?.studentPhoto],
  )

  const loadLookups = useCallback(async () => {
    if (status !== 'ready' || !token) return
    setLookupLoading(true)
    try {
      const schools = await fetchSchoolsLookup()
      setAllSchools(Array.isArray(schools) ? schools : [])
    } catch (err) {
      console.error('Failed to load issue lookups:', err)
      setAllSchools([])
    } finally {
      setLookupLoading(false)
    }
  }, [status, token])

  const refreshBookOptions = useCallback(async () => {
    if (!form.schoolId) return
    try {
      const books = await fetchAllPages((page, size) =>
        fetchBooksPage({
          page,
          size,
          schoolId: form.schoolId,
          headOfficeId: form.headOfficeId || undefined,
        }),
      )
      setBookOptions(Array.isArray(books) ? books : [])
    } catch (err) {
      console.error('Failed to refresh book availability:', err)
    }
  }, [form.headOfficeId, form.schoolId])

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

  useEffect(() => {
    if (!isSuperAdmin) return
    if (!activeSchoolId) return
    const school = getSchoolById(allSchools, activeSchoolId)
    if (!school) return
    setForm((prev) => ({
      ...prev,
      headOfficeId: school.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
      schoolId: String(activeSchoolId),
    }))
  }, [activeSchoolId, allSchools, isSuperAdmin])

  useEffect(() => {
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      setForm((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
    }
  }, [authHeadOfficeId, isHeadOfficeAdmin])

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return
    const school = getSchoolById(allSchools, authSchoolId)
    setForm((prev) => ({
      ...prev,
      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
      schoolId: String(authSchoolId),
    }))
  }, [allSchools, authSchoolId, isSchoolAdmin])

  useEffect(() => {
    if (!form.schoolId) {
      setBookOptions([])
      setClassOptions([])
      setStudentOptions([])
      setEmployeeOptions([])
      return
    }

    let cancelled = false
    const loadSchoolData = async () => {
      setLookupLoading(true)
      try {
        const booksPromise = fetchAllPages((page, size) =>
          fetchBooksPage({
            page,
            size,
            schoolId: form.schoolId,
            headOfficeId: form.headOfficeId || undefined,
          }),
        )
        const classesPromise = form.borrowerType === 'Student' ? fetchClasses({ schoolId: form.schoolId }) : Promise.resolve([])
        const employeesPromise = form.borrowerType === 'Employee' ? fetchEmployees({ schoolId: form.schoolId }) : Promise.resolve([])

        const [books, classes, employees] = await Promise.all([booksPromise, classesPromise, employeesPromise])
        if (cancelled) return

        setBookOptions(Array.isArray(books) ? books : [])
        setClassOptions(Array.isArray(classes) ? classes : [])
        setEmployeeOptions(Array.isArray(employees) ? employees : [])
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load issue form data:', err)
        setBookOptions([])
        setClassOptions([])
        setEmployeeOptions([])
      } finally {
        if (!cancelled) setLookupLoading(false)
      }
    }

    void loadSchoolData()
    return () => {
      cancelled = true
    }
  }, [form.borrowerType, form.headOfficeId, form.schoolId])

  useEffect(() => {
    if (form.borrowerType !== 'Student' || !form.schoolId || !form.classId) {
      setStudentOptions([])
      return
    }

    let cancelled = false
    const loadStudents = async () => {
      setLookupLoading(true)
      try {
        const students = await fetchStudentsByClassSection({
          schoolId: form.schoolId,
          classId: form.classId,
        })
        if (cancelled) return
        setStudentOptions(Array.isArray(students) ? students : [])
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load students for issue form:', err)
        setStudentOptions([])
      } finally {
        if (!cancelled) setLookupLoading(false)
      }
    }

    void loadStudents()
    return () => {
      cancelled = true
    }
  }, [form.borrowerType, form.classId, form.schoolId])

  const roleOptions = useMemo(() => uniqueRoles(employeeOptions), [employeeOptions])
  const filteredEmployeeOptions = useMemo(() => {
    if (form.borrowerType !== 'Employee') return []
    if (!form.employeeRole) return employeeOptions
    const target = String(form.employeeRole).trim().toLowerCase()
    return (Array.isArray(employeeOptions) ? employeeOptions : []).filter((employee) => String(employee?.role || '').trim().toLowerCase() === target)
  }, [employeeOptions, form.borrowerType, form.employeeRole])

  const handleSchoolChange = useCallback(
    (value) => {
      const school = getSchoolById(allSchools, value)
      setForm((prev) => ({
        ...prev,
        headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
        schoolId: value,
        bookId: '',
        borrowerType: prev.borrowerType || 'Student',
        classId: '',
        studentId: '',
        employeeRole: '',
        employeeId: '',
      }))
      setBookOptions([])
      setClassOptions([])
      setStudentOptions([])
      setEmployeeOptions([])
    },
    [allSchools],
  )

  const handleBorrowerTypeChange = useCallback((value) => {
    setForm((prev) => ({
      ...prev,
      borrowerType: value,
      classId: '',
      studentId: '',
      employeeRole: '',
      employeeId: '',
    }))
    setClassOptions([])
    setStudentOptions([])
    setEmployeeOptions([])
  }, [])

  const handleSave = useCallback(async () => {
    const schoolId = form.schoolId ? Number(form.schoolId) : null
    const bookId = form.bookId ? Number(form.bookId) : null
    const borrowerType = String(form.borrowerType || '').trim()
    const classId = form.classId ? Number(form.classId) : null
    const studentId = form.studentId ? Number(form.studentId) : null
    const employeeId = form.employeeId ? Number(form.employeeId) : null

    if (!schoolId) return setError('School is required.')
    if (!bookId) return setError('Book is required.')
    if (!borrowerType) return setError('Borrower type is required.')
    if (!form.issueDate) return setError('Issue date is required.')
    if (!form.dueDate) return setError('Due date is required.')

    if (borrowerType === 'Student') {
      if (!classId) return setError('Class is required.')
      if (!studentId) return setError('Student is required.')
    } else if (borrowerType === 'Employee') {
      if (!form.employeeRole) return setError('Employee role is required.')
      if (!employeeId) return setError('Employee is required.')
    } else {
      return setError('Borrower type is invalid.')
    }

    const school = getSchoolById(allSchools, schoolId)
    const resolvedHeadOfficeId = form.headOfficeId
      ? Number(form.headOfficeId)
      : school?.headOfficeId != null
        ? Number(school.headOfficeId)
        : null

    if (!resolvedHeadOfficeId) return setError('Head office is required.')

    const payload = {
      headOfficeId: resolvedHeadOfficeId,
      schoolId,
      bookId,
      borrowerType: borrowerType.toUpperCase(),
      classId: borrowerType === 'Student' ? classId : null,
      studentId: borrowerType === 'Student' ? studentId : null,
      employeeId: borrowerType === 'Employee' ? employeeId : null,
      employeeRole: borrowerType === 'Employee' ? form.employeeRole : null,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      note: String(form.note || '').trim(),
    }

    setSaving(true)
    setError('')
    try {
      await createLibraryIssue(payload)
      await refreshBookOptions()
      window.dispatchEvent(new Event('library-book-stock-updated'))
      onNavigate?.('issue-return')
    } catch (err) {
      console.error('Failed to create library issue:', err)
      setError(err?.message || 'Failed to create issue record')
    } finally {
      setSaving(false)
    }
  }, [allSchools, form, onNavigate, refreshBookOptions])

  const borrowerLabel = form.borrowerType === 'Employee' ? 'Employee' : 'Student'
  const borrowerName = selectedBorrower?.name || selectedBorrower?.fullName || '--'
  const borrowerId = form.borrowerType === 'Employee'
    ? selectedBorrower?.id || '--'
    : selectedBorrower?.studentId || selectedBorrower?.admissionNo || selectedBorrower?.id || '--'
  const borrowerContext = form.borrowerType === 'Employee'
    ? selectedBorrower?.role || '--'
    : selectedBorrower?.className || selectedBorrower?.schoolClass?.className || '--'

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Issue New Book</h1>
          <span className="text-secondary-light">Library / Issue &amp; Return / Add</span>
        </div>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-6"
          onClick={() => (onNavigate ? onNavigate('issue-return') : window.history.back())}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-header border-bottom border-neutral-200">
          <h6 className="text-md fw-semibold mb-0">Issue Information</h6>
        </div>
        <div className="card-body p-24">
          {error ? <div className="mb-20 text-danger">{error}</div> : null}
          {lookupLoading ? <div className="mb-20 text-secondary-light">Loading lookup data...</div> : null}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleSave()
            }}
          >
            <div className="row g-20 mb-32">
              {isSuperAdmin ? (
                <div className="col-12">
                  <ManualScopeSelectors
                    enabled
                    headOffices={manualScope.headOffices}
                    schoolOptions={filterSchoolOptions}
                    selectedHeadOfficeId={form.headOfficeId}
                    onHeadOfficeChange={(value) => {
                      setForm((prev) => ({
                        ...prev,
                        headOfficeId: value,
                        schoolId: '',
                        bookId: '',
                        classId: '',
                        studentId: '',
                        employeeRole: '',
                        employeeId: '',
                      }))
                      setBookOptions([])
                      setClassOptions([])
                      setStudentOptions([])
                      setEmployeeOptions([])
                    }}
                    selectedSchoolId={form.schoolId}
                    onSchoolChange={handleSchoolChange}
                    schoolLabel="School"
                  />
                </div>
              ) : (
                <>
                  {isHeadOfficeAdmin ? (
                    <div className="col-12">
                      <FormField label="Head Office" full>
                        <input className="avm-input" value={selectedHeadOfficeName} disabled />
                      </FormField>
                    </div>
                  ) : null}

                  <div className="col-12">
                    <FormField label="School Name" required full>
                      <select
                        className="avm-select"
                        value={form.schoolId}
                        onChange={(e) => handleSchoolChange(e.target.value)}
                        disabled={isSchoolAdmin}
                      >
                        <option value="">{isSchoolAdmin ? 'Current School' : '--Select School--'}</option>
                        {filterSchoolOptions.map((school) => (
                          <option key={String(school.id)} value={String(school.id)}>
                            {school.schoolName}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                </>
              )}

              <div className="col-md-6">
                <FormField label="Borrower Type" required>
                  <select
                    className="avm-select"
                    value={form.borrowerType}
                    onChange={(e) => handleBorrowerTypeChange(e.target.value)}
                    disabled={!form.schoolId}
                  >
                    <option value="">--Select Type--</option>
                    <option value="Student">Student</option>
                    <option value="Employee">Employee</option>
                  </select>
                </FormField>
              </div>

              <div className="col-md-6">
                <FormField label="Book" required>
                  <select
                    className="avm-select"
                    value={form.bookId}
                    onChange={(e) => setForm((prev) => ({ ...prev, bookId: e.target.value }))}
                    disabled={!form.schoolId}
                  >
                    <option value="">{form.schoolId ? '--Select Book--' : 'Select School First'}</option>
                    {bookOptions.map((book) => (
                      <option key={String(book.id)} value={String(book.id)}>
                        {book.title} {book.bookId ? `(${book.bookId})` : ''}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {form.borrowerType === 'Employee' ? (
                <>
                  <div className="col-md-6">
                    <FormField label="Borrower Role" required>
                      <select
                        className="avm-select"
                        value={form.employeeRole}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            employeeRole: e.target.value,
                            employeeId: '',
                          }))
                        }
                        disabled={!form.schoolId}
                      >
                        <option value="">{form.schoolId ? '--Select Role--' : 'Select School First'}</option>
                        {roleOptions.map((roleItem) => (
                          <option key={roleItem} value={roleItem}>
                            {roleItem}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <div className="col-md-6">
                    <FormField label="Employee" required>
                      <select
                        className="avm-select"
                        value={form.employeeId}
                        onChange={(e) => setForm((prev) => ({ ...prev, employeeId: e.target.value }))}
                        disabled={!form.employeeRole}
                      >
                        <option value="">{form.employeeRole ? '--Select Employee--' : 'Select Role First'}</option>
                        {filteredEmployeeOptions.map((employee) => (
                          <option key={String(employee.id)} value={String(employee.id)}>
                            {employee.name || 'Employee'} {employee.role ? `(${employee.role})` : ''}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-md-6">
                    <FormField label="Class" required>
                      <select
                        className="avm-select"
                        value={form.classId}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            classId: e.target.value,
                            studentId: '',
                          }))
                        }
                        disabled={!form.schoolId}
                      >
                        <option value="">{form.schoolId ? '--Select Class--' : 'Select School First'}</option>
                        {classOptions.map((schoolClass) => (
                          <option key={String(schoolClass.id)} value={String(schoolClass.id)}>
                            {schoolClass.className || schoolClass.numericName || `Class ${schoolClass.id}`}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <div className="col-md-6">
                    <FormField label="Student" required>
                      <select
                        className="avm-select"
                        value={form.studentId}
                        onChange={(e) => setForm((prev) => ({ ...prev, studentId: e.target.value }))}
                        disabled={!form.classId}
                      >
                        <option value="">{form.classId ? '--Select Student--' : 'Select Class First'}</option>
                        {studentOptions.map((student) => (
                          <option key={String(student.id)} value={String(student.id)}>
                            {student.name || 'Student'} {student.rollNo ? `(${student.rollNo})` : ''}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                </>
              )}

              <div className="col-12">
                <p
                  className="fw-semibold text-secondary-light mb-0"
                  style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  Auto-filled details
                </p>
                <hr className="mt-4 mb-0" />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary-light">Book ID</label>
                <input className="form-control bg-light" readOnly value={selectedBook?.bookId || '—'} />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary-light">ISBN No</label>
                <input className="form-control bg-light" readOnly value={selectedBook?.isbnNo || '—'} />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary-light">Language</label>
                <input className="form-control bg-light" readOnly value={selectedBook?.language || '—'} />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary-light">Author</label>
                <input className="form-control bg-light" readOnly value={selectedBook?.author || '—'} />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary-light">Edition</label>
                <input className="form-control bg-light" readOnly value={selectedBook?.edition || '—'} />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary-light">Available Qty</label>
                <input className="form-control bg-light" readOnly value={selectedBook?.quantity ?? '—'} />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary-light">{borrowerLabel} Name</label>
                <input className="form-control bg-light" readOnly value={borrowerName} />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary-light">{borrowerLabel} ID</label>
                <input className="form-control bg-light" readOnly value={borrowerId} />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary-light">
                  {form.borrowerType === 'Employee' ? 'Role' : 'Class'}
                </label>
                <input className="form-control bg-light" readOnly value={borrowerContext} />
              </div>

              <div className="col-md-6">
                <FormField label="Issue Date" required>
                  <input
                    type="date"
                    className="avm-input"
                    value={form.issueDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, issueDate: e.target.value }))}
                  />
                </FormField>
              </div>

              <div className="col-md-6">
                <FormField label="Due Date" required>
                  <input
                    type="date"
                    className="avm-input"
                    value={form.dueDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  />
                </FormField>
              </div>

              <div className="col-12">
                <FormField label="Note" full>
                  <textarea
                    className="avm-input avm-textarea"
                    rows="3"
                    placeholder="Note"
                    value={form.note}
                    onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                  />
                </FormField>
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold text-primary-light">Book Cover</label>
                <div className="d-flex align-items-center justify-content-center p-20 border rounded bg-light" style={{ minHeight: '140px' }}>
                  {selectedBookCover ? (
                    <img
                      src={selectedBookCover}
                      alt={selectedBook?.title || 'Book cover'}
                      className="radius-8 object-fit-cover"
                      style={{ maxHeight: '120px', maxWidth: '100%' }}
                    />
                  ) : (
                    <span className="text-secondary-light">
                      <i className="ri-image-line me-8"></i>Cover will appear after selecting a book
                    </span>
                  )}
                </div>
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold text-primary-light">{borrowerLabel} Photo</label>
                <div className="d-flex align-items-center justify-content-center p-20 border rounded bg-light" style={{ minHeight: '140px' }}>
                  {selectedBorrowerPhoto ? (
                    <img
                      src={selectedBorrowerPhoto}
                      alt={borrowerName || `${borrowerLabel} photo`}
                      className="rounded-circle object-fit-cover"
                      style={{ width: '96px', height: '96px' }}
                    />
                  ) : (
                    <span className="text-secondary-light">
                      <i className="ri-user-line me-8"></i>Photo will appear after selecting a borrower
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-12">
              <button
                type="button"
                className="btn btn-light border px-32"
                onClick={() => onNavigate?.('issue-return')}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-600 px-32" disabled={saving}>
                {saving ? 'Issuing...' : 'Issue Book'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default IssueBookCreate
