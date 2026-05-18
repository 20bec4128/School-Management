import { useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import {
  createSchedule,
  deleteSchedule,
  fetchSchedulesBySchool,
  updateSchedule,
} from '../apis/scheduleApi'

const STEPS = ['Schedule Information']

const DEFAULT_EXAM_TERMS = ['First Term', 'Second Term', 'Final Term']

const emptyForm = {
  id: null,
  school: '',
  examTerm: '',
  class: '',
  subject: '',
  examDate: '',
  startTime: '',
  endTime: '',
  roomNo: '',
  note: '',
}

const emptyFilters = {
  school: 'Select',
  examTerm: 'Select',
  class: 'Select',
  subject: 'Select',
}

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Exam Term': 'ri-calendar-event-line',
  Class: 'ri-graduation-cap-line',
  Subject: 'ri-book-open-line',
  'Exam Date': 'ri-calendar-2-line',
  'Start Time': 'ri-time-line',
  'End Time': 'ri-time-line',
  'Room No': 'ri-door-open-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'examTerm', label: 'Exam Term' },
  { key: 'class', label: 'Class' },
  { key: 'subject', label: 'Subject' },
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'roomNo', label: 'Room No' },
]

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

const uniqueStrings = (items) =>
  Array.from(
    new Set(
      (Array.isArray(items) ? items : [])
        .map((item) => String(item ?? '').trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b))

const extractClassName = (item) =>
  String(item?.className ?? item?.name ?? item?.numericName ?? item?.title ?? '').trim()

const extractSubjectName = (item) =>
  String(item?.subjectName ?? item?.name ?? item?.subject ?? item?.title ?? '').trim()

const normalizeTimeInput = (value) => {
  if (value == null) return ''
  const text = String(value).trim()
  if (!text) return ''

  const directMatch = text.match(/^(\d{1,2}):(\d{2})$/)
  if (directMatch) {
    return `${String(Number(directMatch[1])).padStart(2, '0')}:${directMatch[2]}`
  }

  const twentyFourHourMatch = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (twentyFourHourMatch) {
    return `${String(Number(twentyFourHourMatch[1])).padStart(2, '0')}:${twentyFourHourMatch[2]}`
  }

  const twelveHourMatch = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!twelveHourMatch) return ''

  let hour = Number(twelveHourMatch[1])
  const minute = twelveHourMatch[2]
  const meridiem = twelveHourMatch[3].toUpperCase()
  if (meridiem === 'PM' && hour !== 12) hour += 12
  if (meridiem === 'AM' && hour === 12) hour = 0
  return `${String(hour).padStart(2, '0')}:${minute}`
}

const formatDisplayTime = (value) => {
  const normalized = normalizeTimeInput(value)
  if (!normalized) return String(value ?? '').trim()

  const [hourText, minuteText] = normalized.split(':')
  let hour = Number(hourText)
  const minute = Number(minuteText)
  const meridiem = hour >= 12 ? 'PM' : 'AM'
  hour %= 12
  if (hour === 0) hour = 12
  return `${hour}:${String(minute).padStart(2, '0')} ${meridiem}`
}

const Schedule = ({ onNavigate }) => {
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
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'

  const [rows, setRows] = useState([])
  const [schools, setSchools] = useState([])
  const [classOptions, setClassOptions] = useState([])
  const [subjectOptions, setSubjectOptions] = useState([])
  const [busy, setBusy] = useState(false)

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState({ ...emptyForm })

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(() => {
    const list = Array.isArray(schools) ? schools : []
    if (isHeadOfficeAdmin) {
      return list.filter((s) => String(s?.headOfficeId ?? '') === String(authHeadOfficeId))
    }
    if (isSchoolAdmin) {
      return list.length > 0
        ? list
        : authSchoolId != null
          ? [{ id: authSchoolId, schoolName: authSchoolName || 'My School', headOfficeId: null }]
          : []
    }
    return list
  }, [schools, isHeadOfficeAdmin, isSchoolAdmin, authHeadOfficeId, authSchoolId, authSchoolName])

  const schoolByNameMap = useMemo(() => {
    const map = new Map()
    for (const school of schoolOptions) {
      if (!school?.schoolName) continue
      map.set(String(school.schoolName), school)
    }
    return map
  }, [schoolOptions])

  const examTermOptions = useMemo(() => {
    return uniqueStrings([
      ...DEFAULT_EXAM_TERMS,
      ...rows.map((row) => row.examTerm),
      pendingFilters.examTerm !== 'Select' ? pendingFilters.examTerm : '',
      filters.examTerm !== 'Select' ? filters.examTerm : '',
    ])
  }, [rows, filters.examTerm, pendingFilters.examTerm])

  const normalizeScheduleRow = (row, index, schoolsById) => {
    const schoolId = row?.schoolId ?? null
    const schoolName = row?.schoolName || schoolsById.get(String(schoolId))?.schoolName || ''
    const startTime = normalizeTimeInput(row?.startTime)
    const endTime = normalizeTimeInput(row?.endTime)
    const displayTime = [formatDisplayTime(startTime), formatDisplayTime(endTime)]
      .filter(Boolean)
      .join(' - ')

    return {
      id: row?.id,
      sl: String(index + 1).padStart(2, '0'),
      schoolId,
      school: schoolName,
      examTerm: String(row?.examTerm ?? '').trim(),
      class: String(row?.className ?? row?.class ?? '').trim(),
      subject: String(row?.subjectName ?? row?.subject ?? '').trim(),
      date: String(row?.examDate ?? '').trim(),
      time: displayTime,
      startTime,
      endTime,
      roomNo: String(row?.roomNo ?? '').trim(),
      note: String(row?.note ?? '').trim(),
    }
  }

  const loadPageData = async () => {
    if (isSchoolAdmin) {
      const singleSchool = authSchoolId != null
        ? [{ id: Number(authSchoolId), schoolName: authSchoolName || 'My School', headOfficeId: null }]
        : []
      setSchools(singleSchool)

      const schoolMapById = new Map(singleSchool.map((school) => [String(school.id), school]))
      const [classResults, subjectResults, scheduleResults] = await Promise.all([
        Promise.all(singleSchool.map((school) => fetchClasses({ schoolId: school.id }).catch(() => []))),
        Promise.all(singleSchool.map((school) => fetchSubjects({ schoolId: school.id }).catch(() => []))),
        Promise.all(singleSchool.map((school) => fetchSchedulesBySchool(school.id).catch(() => []))),
      ])

      setClassOptions(uniqueStrings(classResults.flat().map(extractClassName)))
      setSubjectOptions(uniqueStrings(subjectResults.flat().map(extractSubjectName)))

      const mergedRows = scheduleResults
        .flat()
        .map((row, index) => normalizeScheduleRow(row, index, schoolMapById))
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

      setRows(mergedRows)
      setSelectedRows([])
      return
    }

    const allSchools = await fetchSchoolsLookup()
    const accessibleSchools = isHeadOfficeAdmin
      ? allSchools.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId))
      : allSchools

    setSchools(accessibleSchools)

    const schoolsById = new Map(
      accessibleSchools
        .filter((school) => school?.id != null && school?.schoolName)
        .map((school) => [String(school.id), school]),
    )

    const schoolIds = accessibleSchools
      .map((school) => school?.id)
      .filter((id) => id != null && String(id).trim() !== '')

    if (schoolIds.length === 0) {
      setClassOptions([])
      setSubjectOptions([])
      setRows([])
      setSelectedRows([])
      return
    }

    const [classResults, subjectResults, scheduleResults] = await Promise.all([
      Promise.all(schoolIds.map((schoolId) => fetchClasses({ schoolId }).catch(() => []))),
      Promise.all(schoolIds.map((schoolId) => fetchSubjects({ schoolId }).catch(() => []))),
      Promise.all(schoolIds.map((schoolId) => fetchSchedulesBySchool(schoolId).catch(() => []))),
    ])

    setClassOptions(uniqueStrings(classResults.flat().map(extractClassName)))
    setSubjectOptions(uniqueStrings(subjectResults.flat().map(extractSubjectName)))

    const mergedRows = scheduleResults
      .flat()
      .map((row, index) => normalizeScheduleRow(row, index, schoolsById))
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

    setRows(mergedRows)
    setSelectedRows([])
  }

  useEffect(() => {
    if (status !== 'ready' || !token) return
    setBusy(true)
    Promise.resolve()
      .then(loadPageData)
      .catch((error) => {
        console.error(error)
        setRows([])
        setClassOptions([])
        setSubjectOptions([])
      })
      .finally(() => setBusy(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, token, role, authSchoolId, authSchoolName, authHeadOfficeId])

  const filteredData = useMemo(() => {
    let data = [...rows]
    if (filters.school !== 'Select') data = data.filter((row) => row.school === filters.school)
    if (filters.examTerm !== 'Select') data = data.filter((row) => row.examTerm === filters.examTerm)
    if (filters.class !== 'Select') data = data.filter((row) => row.class === filters.class)
    if (filters.subject !== 'Select') data = data.filter((row) => row.subject === filters.subject)

    const term = search.trim().toLowerCase()
    if (term) {
      data = data.filter(
        (row) =>
          row.school.toLowerCase().includes(term) ||
          row.examTerm.toLowerCase().includes(term) ||
          row.class.toLowerCase().includes(term) ||
          row.subject.toLowerCase().includes(term) ||
          row.roomNo.toLowerCase().includes(term) ||
          row.date.toLowerCase().includes(term) ||
          row.time.toLowerCase().includes(term) ||
          row.note.toLowerCase().includes(term),
      )
    }
    return data
  }, [rows, filters, search])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredData.slice(start, start + rowsPerPage)
  }, [filteredData, currentPage, rowsPerPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p += 1) pages.push(p)
    return pages
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows(paginatedData.map((row) => String(row.id)))
    else setSelectedRows([])
  }

  const handleSelectRow = (id) => {
    const key = String(id)
    if (selectedRows.includes(key)) setSelectedRows(selectedRows.filter((rowId) => rowId !== key))
    else setSelectedRows([...selectedRows, key])
  }

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({ ...prev, [id]: value }))
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters({ ...pendingFilters })
    setIsFilterSidebarOpen(false)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setIsFilterSidebarOpen(false)
    setCurrentPage(1)
  }

  const openAdd = () => {
    sessionStorage.removeItem('sm_schedule_edit_id')
    const defaultSchool = schoolOptions[0]?.schoolName || authSchoolName || ''
    setAddForm({
      ...emptyForm,
      school: defaultSchool,
    })
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditForm({
      id: row.id,
      school: row.school,
      examTerm: row.examTerm,
      class: row.class,
      subject: row.subject,
      examDate: row.date,
      startTime: row.startTime,
      endTime: row.endTime,
      roomNo: row.roomNo,
      note: row.note || '',
    })
    setEditStep(0)
    setIsEditOpen(true)
  }

  const validateForm = (form) => {
    if (!form.school) return 'School is required'
    if (!form.examTerm) return 'Exam Term is required'
    if (!form.class) return 'Class is required'
    if (!form.subject) return 'Subject is required'
    if (!form.examDate) return 'Exam Date is required'
    if (!form.startTime) return 'Start Time is required'
    if (!form.endTime) return 'End Time is required'
    if (!form.roomNo) return 'Room No is required'

    const start = normalizeTimeInput(form.startTime)
    const end = normalizeTimeInput(form.endTime)
    if (!start) return 'Start Time is invalid'
    if (!end) return 'End Time is invalid'
    if (start > end) return 'Start Time cannot be greater than End Time'
    return ''
  }

  const reloadData = async () => {
    await loadPageData()
  }

  const submitForm = async (form, closeModal) => {
    const err = validateForm(form)
    if (err) {
      window.alert(err)
      return
    }

    const selectedSchool = schoolByNameMap.get(form.school) || null
    const schoolId = selectedSchool?.id ?? (isSchoolAdmin ? authSchoolId : null)

    if (schoolId == null || String(schoolId).trim() === '') {
      window.alert('School is required')
      return
    }

    setBusy(true)
    try {
      const payload = {
        schoolId: Number(schoolId),
        examTerm: form.examTerm.trim(),
        className: form.class.trim(),
        subjectName: form.subject.trim(),
        examDate: form.examDate,
        startTime: normalizeTimeInput(form.startTime),
        endTime: normalizeTimeInput(form.endTime),
        roomNo: form.roomNo.trim(),
        note: form.note?.trim() || null,
      }

      if (form.id) {
        await updateSchedule(form.id, payload)
      } else {
        await createSchedule(payload)
      }

      closeModal()
      await reloadData()
    } catch (error) {
      window.alert(error?.message || 'Failed to save schedule')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete schedule for ${row.subject}?`)) return
    setBusy(true)
    try {
      await deleteSchedule(row.id)
      await reloadData()
    } catch (error) {
      window.alert(error?.message || 'Failed to delete schedule')
    } finally {
      setBusy(false)
    }
  }

  const renderForm = (form, setter, step) => (
    <>
      {step === 0 && (
        <>
          <p className="avm-section-title">{STEPS[0]}</p>
          <div className="avm-grid">
            <FormField label="School Name" required full>
              <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
                <option value="">--Select School--</option>
                {schoolOptions.map((school) => (
                  <option key={school.id} value={school.schoolName}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Exam Term" required>
              <select className="avm-select" id="examTerm" value={form.examTerm} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                {examTermOptions.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Class" required>
              <select className="avm-select" id="class" value={form.class} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                {classOptions.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Subject" required>
              <select className="avm-select" id="subject" value={form.subject} onChange={handleChange(setter)}>
                <option value="">--Select--</option>
                {subjectOptions.map((subjectName) => (
                  <option key={subjectName} value={subjectName}>
                    {subjectName}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Exam Date" required>
              <input
                type="date"
                className="avm-input"
                id="examDate"
                value={form.examDate}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Start Time" required>
              <input
                type="time"
                className="avm-input"
                id="startTime"
                value={form.startTime}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="End Time" required>
              <input
                type="time"
                className="avm-input"
                id="endTime"
                value={form.endTime}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Room No" required>
              <input
                type="text"
                className="avm-input"
                id="roomNo"
                placeholder="Room No"
                value={form.roomNo}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Note" full noIcon>
              <textarea
                rows={4}
                className="avm-input avm-textarea"
                id="note"
                placeholder="Note"
                value={form.note}
                onChange={handleChange(setter)}
              />
            </FormField>
          </div>
        </>
      )}
    </>
  )

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Schedule</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Schedule</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={() => {
            sessionStorage.removeItem('sm_schedule_edit_id')
            if (typeof onNavigate === 'function') {
              onNavigate('schedule-create')
              return
            }
            openAdd()
          }}
          disabled={busy}
        >
          <span className="d-flex text-md">
            <i className="ri-add-large-line"></i>
          </span>
          Add Schedule
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span>
                  <i className="ri-arrow-right-line"></i>
                </span>
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span>
                    <i className="ri-arrow-down-s-line"></i>
                  </span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  {columnOptions.map((column) => (
                    <li key={column.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={visibleColumns[column.key]}
                          onChange={() => toggleColumn(column.key)}
                        />
                        {column.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search schedule..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1000 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.examTerm ? <th scope="col">Exam Term</th> : null}
                  {visibleColumns.class ? <th scope="col">Class</th> : null}
                  {visibleColumns.subject ? <th scope="col">Subject</th> : null}
                  {visibleColumns.date ? <th scope="col">Date</th> : null}
                  {visibleColumns.time ? <th scope="col">Time</th> : null}
                  {visibleColumns.roomNo ? <th scope="col">Room No</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(String(row.id))}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">{row.sl}</label>
                        </div>
                      </td>
                      {visibleColumns.school ? <td className="fw-medium">{row.school}</td> : null}
                      {visibleColumns.examTerm ? <td>{row.examTerm}</td> : null}
                      {visibleColumns.class ? <td>{row.class}</td> : null}
                      {visibleColumns.subject ? <td>{row.subject}</td> : null}
                      {visibleColumns.date ? <td>{row.date}</td> : null}
                      {visibleColumns.time ? <td>{row.time}</td> : null}
                      {visibleColumns.roomNo ? <td>{row.roomNo}</td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                      <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => {
                              sessionStorage.setItem('sm_schedule_edit_id', String(row.id))
                              if (typeof onNavigate === 'function') {
                                onNavigate('schedule-create')
                                return
                              }
                              openEdit(row)
                            }}
                            title="Edit"
                            disabled={busy}
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            title="Delete"
                            onClick={() => handleDelete(row)}
                            disabled={busy}
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              {getVisiblePages().map((p) => (
                <button
                  key={p}
                  type="button"
                  className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <WizardPopup
        modalWidth="580px"
        open={isAddOpen}
        title="Add Schedule"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => submitForm(addForm, () => setIsAddOpen(false))}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm, addStep)}
      </WizardPopup>

      <WizardPopup
        modalWidth="580px"
        open={isEditOpen}
        title="Edit Schedule"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => submitForm(editForm, () => setIsEditOpen(false))}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm, editStep)}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        title="Filter Schedule"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label htmlFor="school" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School
            </label>
            <select
              id="school"
              className="form-control form-select"
              value={pendingFilters.school}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select School</option>
              {schoolOptions.map((school) => (
                <option key={school.id} value={school.schoolName}>
                  {school.schoolName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="examTerm" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Exam Term
            </label>
            <select
              id="examTerm"
              className="form-control form-select"
              value={pendingFilters.examTerm}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Term</option>
              {examTermOptions.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="class" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class
            </label>
            <select
              id="class"
              className="form-control form-select"
              value={pendingFilters.class}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Class</option>
              {classOptions.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="subject" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Subject
            </label>
            <select
              id="subject"
              className="form-control form-select"
              value={pendingFilters.subject}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Subject</option>
              {subjectOptions.map((subjectName) => (
                <option key={subjectName} value={subjectName}>
                  {subjectName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
              Reset
            </button>
          </div>
          <div>
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default Schedule
