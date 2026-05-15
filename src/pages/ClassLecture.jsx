import { useCallback, useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import useColumnVisibility from '../hooks/useColumnVisibility'
import {
  createClassLecture,
  deleteClassLecture,
  fetchClassLectures,
  updateClassLecture,
} from '../apis/classLectureApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { fetchTeachers } from '../apis/teachersApi'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const emptyForm = {
  schoolId: '',
  school: '',
  title: '',
  classId: '',
  class: '',
  sectionId: '',
  section: '',
  subjectId: '',
  subject: '',
  teacherId: '',
  lectureType: '',
  academicYear: '',
  lectureUrl: '',
  note: '',
}

const STEPS = ['Basic']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Title: 'ri-bookmark-line',
  Class: 'ri-building-3-line',
  Section: 'ri-layout-grid-line',
  Subject: 'ri-book-open-line',
  Teacher: 'ri-user-3-line',
  'Lecture Type': 'ri-video-line',
  'Academic Year': 'ri-calendar-line',
  'Lecture URL': 'ri-link',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'title', label: 'Title' },
  { key: 'class', label: 'Class' },
  { key: 'section', label: 'Section' },
  { key: 'subject', label: 'Subject' },
  { key: 'teacher', label: 'Teacher' },
  { key: 'classLecture', label: 'Class Lecture' },
  { key: 'academicYear', label: 'Academic Year' },
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
          <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#667085', fontSize: '0.95rem', lineHeight: 1, pointerEvents: 'none', zIndex: 1 }}>
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

const ClassLecture = () => {
  const [lectures, setLectures] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [sectionsLookup, setSectionsLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])
  const [teachersLookup, setTeachersLookup] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingLectureId, setEditingLectureId] = useState(null)

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [filters, setFilters] = useState({ class: 'All', subject: 'All', lectureType: 'All' })
  const [pendingFilters, setPendingFilters] = useState({ class: 'All', subject: 'All', lectureType: 'All' })
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const loadSchoolsLookup = useCallback(async () => {
    const schools = await fetchSchoolsLookup()
    setSchoolsLookup(Array.isArray(schools) ? schools : [])
  }, [])

  const loadTeachersLookup = useCallback(async () => {
    const teachers = await fetchTeachers()
    const rows = Array.isArray(teachers) ? teachers : []
    setTeachersLookup(
      rows
        .map((t) => ({ id: t?.id, name: t?.name }))
        .filter((t) => t.id != null && t.name)
        .sort((a, b) => a.name.localeCompare(b.name)),
    )
  }, [])

  const loadSubjectsLookup = useCallback(async () => {
    const subjects = await fetchSubjects()
    setSubjectsLookup(Array.isArray(subjects) ? subjects : [])
  }, [])

  const loadClassesForSchool = useCallback(async (schoolId) => {
    if (!schoolId) {
      setClassesLookup([])
      return []
    }
    const data = await fetchClasses({ schoolId })
    const rows = Array.isArray(data) ? data : []
    setClassesLookup(rows)
    return rows
  }, [])

  const loadSectionsForClass = useCallback(async ({ schoolId, classId }) => {
    if (!classId) {
      setSectionsLookup([])
      return []
    }
    const data = await fetchSections({ schoolId, classId })
    const rows = Array.isArray(data) ? data : []
    setSectionsLookup(rows)
    return rows
  }, [])

  const loadLectures = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchClassLectures()
      setLectures(Array.isArray(data) ? data : [])
    } catch (e) {
      setLectures([])
      setError(e?.message || 'Failed to load class lectures')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSchoolsLookup()
  }, [loadSchoolsLookup])

  useEffect(() => {
    void loadTeachersLookup()
  }, [loadTeachersLookup])

  useEffect(() => {
    void loadSubjectsLookup()
  }, [loadSubjectsLookup])

  useEffect(() => {
    void loadLectures()
  }, [loadLectures])

  const getAvailableSubjects = useCallback(
    (form) =>
      subjectsLookup.filter((subject) => {
        const matchesSchool =
          !form.schoolId || String(subject?.schoolId ?? '') === String(form.schoolId)
        const matchesClass =
          !form.classId || String(subject?.classId ?? '') === String(form.classId)
        return matchesSchool && matchesClass
      }),
    [subjectsLookup],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return lectures.filter((r) => {
      const matchesSearch =
        !q ||
        [r?.school, r?.title, r?.class, r?.section, r?.subject, r?.teacher, r?.classLecture, r?.academicYear]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesClass = filters.class === 'All' || r?.class === filters.class
      const matchesSubject = filters.subject === 'All' || r?.subject === filters.subject
      const matchesLectureType = filters.lectureType === 'All' || r?.classLecture === filters.lectureType
      return matchesSearch && matchesClass && matchesSubject && matchesLectureType
    })
  }, [lectures, filters, search])

  const schoolOptions = useMemo(() => Array.from(new Set(lectures.map((item) => item?.school).filter(Boolean))), [lectures])
  const classOptions = useMemo(() => Array.from(new Set(lectures.map((item) => item?.class).filter(Boolean))), [lectures])
  const subjectOptions = useMemo(() => Array.from(new Set(lectures.map((item) => item?.subject).filter(Boolean))), [lectures])
  const lectureTypeOptions = useMemo(() => Array.from(new Set(lectures.map((item) => item?.classLecture).filter(Boolean))), [lectures])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const allSelected = paginated.length > 0 && paginated.every((r) => selectedRows.includes(r.id))

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((r) => r.id)])])
    else setSelectedRows((prev) => prev.filter((id) => !paginated.some((r) => r.id === id)))
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({ ...prev, [id]: value }))
  }

  const handleSchoolChange = (setter) => async (e) => {
    const schoolId = e.target.value
    const selectedSchool = schoolsLookup.find((s) => String(s.id) === String(schoolId))
    setter((prev) => ({
      ...prev,
      schoolId,
      school: selectedSchool?.schoolName || '',
      classId: '',
      class: '',
      sectionId: '',
      section: '',
      subjectId: '',
      subject: '',
    }))
    setSectionsLookup([])
    await loadClassesForSchool(schoolId)
  }

  const handleClassChange = (setter, getForm) => async (e) => {
    const classId = e.target.value
    const selectedClass = classesLookup.find((c) => String(c.id) === String(classId))
    const schoolId = getForm().schoolId
    setter((prev) => ({
      ...prev,
      classId,
      class: selectedClass?.className || '',
      sectionId: '',
      section: '',
      subjectId: '',
      subject: '',
    }))
    await loadSectionsForClass({ schoolId, classId })
  }

  const handleSectionChange = (setter) => (e) => {
    const sectionId = e.target.value
    const selectedSection = sectionsLookup.find((s) => String(s.id) === String(sectionId))
    setter((prev) => ({
      ...prev,
      sectionId,
      section: selectedSection?.name || '',
    }))
  }

  const handleSubjectChange = (setter, getForm) => (e) => {
    const subjectId = e.target.value
    const selectedSubject = getAvailableSubjects(getForm()).find(
      (subject) => String(subject?.id) === String(subjectId),
    )
    setter((prev) => ({
      ...prev,
      subjectId,
      subject: selectedSubject?.name || '',
    }))
  }

  const openAdd = () => {
    setError('')
    setEditingLectureId(null)
    setAddForm(emptyForm)
    setAddStep(0)
    setIsAddOpen(true)
    setClassesLookup([])
    setSectionsLookup([])
  }
  const openEdit = (row) => {
    setError('')
    setEditingLectureId(row?.id ?? null)
    const selectedSchool = schoolsLookup.find((s) => s.schoolName === row?.school)
    const schoolId = selectedSchool?.id != null ? String(selectedSchool.id) : ''
    const selectedSubject = subjectsLookup.find((subject) => {
      const matchesSchool =
        schoolId && subject?.schoolId != null
          ? String(subject.schoolId) === schoolId
          : true
      return matchesSchool && subject?.name === row?.subject
    })

    setEditForm({
      schoolId,
      school: row?.school || '',
      title: row?.title || '',
      classId: '',
      class: row?.class || '',
      sectionId: '',
      section: row?.section || '',
      subjectId: selectedSubject?.id != null ? String(selectedSubject.id) : '',
      subject: row?.subject || '',
      teacherId: row?.teacherId != null ? String(row.teacherId) : '',
      lectureType: row?.classLecture || '',
      academicYear: row?.academicYear || '',
      lectureUrl: row?.lectureUrl || '',
      note: row?.note || '',
    })

    void (async () => {
      if (!schoolId) {
        setClassesLookup([])
        setSectionsLookup([])
        return
      }
      const classRows = await loadClassesForSchool(schoolId)
      const classId =
        classRows.find((c) => c.className === row?.class)?.id != null
          ? String(classRows.find((c) => c.className === row?.class).id)
          : ''

      setEditForm((prev) => ({ ...prev, classId }))

      const sectionRows = await loadSectionsForClass({ schoolId, classId })
      const sectionId =
        sectionRows.find((s) => s.name === row?.section)?.id != null
          ? String(sectionRows.find((s) => s.name === row?.section).id)
          : ''
      const matchingSubject = subjectsLookup.find((subject) => {
        const matchesSchool =
          schoolId && subject?.schoolId != null
            ? String(subject.schoolId) === schoolId
            : true
        const matchesClass =
          classId && subject?.classId != null
            ? String(subject.classId) === classId
            : true
        return matchesSchool && matchesClass && subject?.name === row?.subject
      })

      setEditForm((prev) => ({
        ...prev,
        sectionId,
        subjectId: matchingSubject?.id != null ? String(matchingSubject.id) : prev.subjectId,
      }))
    })()
    setEditStep(0)
    setIsEditOpen(true)
  }

  const buildPayload = (form) => ({
    school: form.school || '',
    title: form.title || '',
    class: form.class || '',
    section: form.section || '',
    subject: form.subject || '',
    teacherId: form.teacherId ? Number(form.teacherId) : null,
    classLecture: form.lectureType || '',
    academicYear: form.academicYear || '',
    lectureUrl: form.lectureUrl || '',
    note: form.note || '',
  })

  const handleCreateLecture = async () => {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      const created = await createClassLecture(buildPayload(addForm))
      setLectures((prev) => [created, ...prev])
      setIsAddOpen(false)
      setAddForm(emptyForm)
      setAddStep(0)
      setCurrentPage(1)
    } catch (e) {
      setError(e?.message || 'Failed to create class lecture')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateLecture = async () => {
    if (saving) return
    if (!editingLectureId) {
      setError('No class lecture selected for update')
      return
    }
    setSaving(true)
    setError('')
    try {
      const updated = await updateClassLecture(editingLectureId, buildPayload(editForm))
      setLectures((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
      setIsEditOpen(false)
      setEditForm(emptyForm)
      setEditStep(0)
      setEditingLectureId(null)
    } catch (e) {
      setError(e?.message || 'Failed to update class lecture')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLecture = async (lectureId) => {
    if (!lectureId) return
    const confirmed = window.confirm('Delete this class lecture? This cannot be undone.')
    if (!confirmed) return

    setSaving(true)
    setError('')
    try {
      await deleteClassLecture(lectureId)
      setLectures((prev) => prev.filter((l) => l.id !== lectureId))
      setSelectedRows((prev) => prev.filter((id) => id !== lectureId))
    } catch (e) {
      setError(e?.message || 'Failed to delete class lecture')
    } finally {
      setSaving(false)
    }
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  const lectureTypeBadge = (type) => {
    const map = {
      Youtube: 'bg-danger-100 text-danger-600',
      Vimeo: 'bg-info-100 text-info-600',
      'Power Point': 'bg-warning-100 text-warning-600',
    }
    return map[type] || 'bg-neutral-100 text-secondary-light'
  }

  const renderForm = (form, setter) => {
    const availableSubjects = getAvailableSubjects(form)

    return (
      <>
      <p className="avm-section-title">Basic Information</p>
      <div className="avm-grid">
        <FormField label="School Name" required full>
          <select className="avm-select" id="schoolId" value={form.schoolId} onChange={handleSchoolChange(setter)}>
            <option value="">--Select School--</option>
            {schoolsLookup.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.schoolName}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Title" required full>
          <input
            type="text"
            className="avm-input"
            id="title"
            placeholder="Enter lecture title"
            value={form.title}
            onChange={handleChange(setter)}
          />
        </FormField>

        <FormField label="Class" required>
          <select
            className="avm-select"
            id="classId"
            value={form.classId}
            onChange={handleClassChange(setter, () => form)}
            disabled={!form.schoolId}
          >
            <option value="">--Select--</option>
            {classesLookup.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.className}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Section" required>
          <select
            className="avm-select"
            id="sectionId"
            value={form.sectionId}
            onChange={handleSectionChange(setter)}
            disabled={!form.classId}
          >
            <option value="">--Select--</option>
            {sectionsLookup.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Subject" required>
          <select
            className="avm-select"
            id="subjectId"
            value={form.subjectId}
            onChange={handleSubjectChange(setter, () => form)}
            disabled={!form.classId}
          >
            <option value="">--Select--</option>
            {availableSubjects.map((subject) => (
              <option key={subject.id} value={String(subject.id)}>
                {subject.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Teacher" required full>
          <select className="avm-select" id="teacherId" value={form.teacherId} onChange={handleChange(setter)}>
            <option value="">--Select Teacher--</option>
            {teachersLookup.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Lecture Type" required>
          <select className="avm-select" id="lectureType" value={form.lectureType} onChange={handleChange(setter)}>
            <option value="">--Select--</option>
            <option>Youtube</option>
            <option>Vimeo</option>
            <option>Power Point</option>
          </select>
        </FormField>

        <FormField label="Academic Year" required>
          <input
            type="text"
            className="avm-input"
            id="academicYear"
            placeholder="2026-2027"
            value={form.academicYear}
            onChange={handleChange(setter)}
          />
        </FormField>

        <FormField label="Lecture URL" full>
          <input
            type="url"
            className="avm-input"
            id="lectureUrl"
            placeholder="https://..."
            value={form.lectureUrl}
            onChange={handleChange(setter)}
          />
        </FormField>

        <FormField label="Note" full noIcon>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.85rem', top: '1.15rem', color: '#667085', fontSize: '0.95rem', lineHeight: 1, pointerEvents: 'none', zIndex: 1 }}>
              <i className="ri-sticky-note-line"></i>
            </span>
            <textarea
              rows="4"
              className="avm-input avm-textarea"
              id="note"
              placeholder="Enter note"
              value={form.note}
              onChange={handleChange(setter)}
              style={{ paddingLeft: '2.35rem' }}
            />
          </div>
        </FormField>
      </div>
    </>
    )
  }

  return (
    <div className="dashboard-main-body">
      {/* Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Class Lecture</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Class Lecture</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
          <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <span className="d-flex text-md"><i className="ri-add-large-line"></i></span>
            Add Class Lecture
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-8" role="alert">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      ) : null}

      {/* Table Card */}
      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {/* Toolbar */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              {/* Export */}
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              {/* Columns */}
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
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

              {/* Filter */}
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <div className="dropdown-menu p-12 border bg-base shadow" style={{ minWidth: 280 }}>
                  <div className="mb-10">
                    <label htmlFor="filterClass" className="text-sm fw-semibold text-primary-light d-inline-block mb-6">Class</label>
                    <select
                      id="filterClass"
                      className="form-control form-select"
                      value={pendingFilters.class}
                      onChange={(e) => setPendingFilters((prev) => ({ ...prev, class: e.target.value }))}
                    >
                      <option value="All">All</option>
                      {classOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="mb-10">
                    <label htmlFor="filterSubject" className="text-sm fw-semibold text-primary-light d-inline-block mb-6">Subject</label>
                    <select
                      id="filterSubject"
                      className="form-control form-select"
                      value={pendingFilters.subject}
                      onChange={(e) => setPendingFilters((prev) => ({ ...prev, subject: e.target.value }))}
                    >
                      <option value="All">All</option>
                      {subjectOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="mb-12">
                    <label htmlFor="filterLectureType" className="text-sm fw-semibold text-primary-light d-inline-block mb-6">Lecture Type</label>
                    <select
                      id="filterLectureType"
                      className="form-control form-select"
                      value={pendingFilters.lectureType}
                      onChange={(e) => setPendingFilters((prev) => ({ ...prev, lectureType: e.target.value }))}
                    >
                      <option value="All">All</option>
                      {lectureTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="d-flex gap-8">
                    <button
                      type="button"
                      className="btn btn-sm btn-light border w-100"
                      onClick={() => {
                        const reset = { class: 'All', subject: 'All', lectureType: 'All' }
                        setPendingFilters(reset)
                        setFilters(reset)
                        setCurrentPage(1)
                      }}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary-600 w-100"
                      onClick={() => {
                        setFilters(pendingFilters)
                        setCurrentPage(1)
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* Rows per page */}
              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }}
              >
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Search */}
            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search lecture..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school && <th scope="col">School</th>}
                  {visibleColumns.title && <th scope="col">Title</th>}
                  {visibleColumns.class && <th scope="col">Class</th>}
                  {visibleColumns.section && <th scope="col">Section</th>}
                  {visibleColumns.subject && <th scope="col">Subject</th>}
                  {visibleColumns.teacher && <th scope="col">Teacher</th>}
                  {visibleColumns.classLecture && <th scope="col">Class Lecture</th>}
                  {visibleColumns.academicYear && <th scope="col">Academic Year</th>}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading class lectures...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No class lectures found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.school && <td>{row.school}</td>}
                      {visibleColumns.title && <td>{row.title}</td>}
                      {visibleColumns.class && <td>{row.class}</td>}
                      {visibleColumns.section && <td className="text-center">{row.section}</td>}
                      {visibleColumns.subject && <td>{row.subject}</td>}
                      {visibleColumns.teacher && <td className="fw-medium text-primary-light">{row.teacher}</td>}
                      {visibleColumns.classLecture && (
                        <td>
                          {row.lectureUrl ? (
                            <a href={row.lectureUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                              <span className={`px-12 py-4 radius-4 fw-medium text-sm ${lectureTypeBadge(row.classLecture)}`}>
                                {row.classLecture}
                              </span>
                            </a>
                          ) : (
                            <span className={`px-12 py-4 radius-4 fw-medium text-sm ${lectureTypeBadge(row.classLecture)}`}>
                              {row.classLecture}
                            </span>
                          )}
                        </td>
                      )}
                      {visibleColumns.academicYear && <td>{row.academicYear}</td>}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => openEdit(row)}
                            title="Edit"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => handleDeleteLecture(row.id)}
                            title="Delete"
                            disabled={saving}
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

          {/* Pagination */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
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
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <WizardPopup
        modalWidth="540px"
        open={isAddOpen}
        title="Add Class Lecture"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleCreateLecture}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm)}
      </WizardPopup>

      {/* Edit Modal */}
      <WizardPopup
        modalWidth="540px"
        open={isEditOpen}
        title="Edit Class Lecture"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleUpdateLecture}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm)}
      </WizardPopup>
    </div>
  )
}

export default ClassLecture

