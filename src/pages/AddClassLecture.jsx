import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createClassLecture,
  updateClassLecture,
} from '../apis/classLectureApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { fetchTeachers } from '../apis/teachersApi'
import { fetchLessons } from '../apis/lessonsApi'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { findSchoolById } from '../utils/schoolScope'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import '../assets/css/addModalShared.css'

const EDIT_STORAGE_KEY = 'edit-class-lecture-row'
const STEPS = ['Basic Information']

const emptyForm = {
  schoolId: 'Select',
  school: '',
  title: '',
  classId: 'Select',
  class: '',
  sectionId: 'Select',
  section: '',
  subjectId: 'Select',
  subject: '',
  lessonId: 'Select',
  lesson: '',
  teacherId: 'Select',
  lectureType: 'Select',
  academicYear: '',
  lectureUrl: '',
  note: '',
}

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  Title: 'ri-bookmark-line',
  Class: 'ri-building-3-line',
  Section: 'ri-layout-grid-line',
  Subject: 'ri-book-open-line',
  Lesson: 'ri-file-list-3-line',
  Teacher: 'ri-user-3-line',
  'Lecture Type': 'ri-video-line',
  'Academic Year': 'ri-calendar-line',
  'Lecture URL': 'ri-link',
  Note: 'ri-sticky-note-line',
}

const getBestLabel = (...values) =>
  values
    .map((value) => {
      if (value == null) return ''
      const text = String(value).trim()
      return text === 'null' || text === 'undefined' ? '' : text
    })
    .find(Boolean) || ''

const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()

const FormField = ({
  label,
  required,
  children,
  full = false,
  noIcon = false,
}) => {
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

const AddClassLecture = ({ onNavigate }) => {
  const {
    role,
    headOfficeName: authHeadOfficeName,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
  } = useAuth()

  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool()

  const roleUpper = String(role || '').toUpperCase()
  const isSuperAdmin = roleUpper === 'SUPER_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [initialEditRow] = useState(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const editingId = initialEditRow?.id ?? null

  const fixedSchoolId = activeSchoolId || authSchoolId || ''

  const [form, setForm] = useState(() => {
    if (initialEditRow) {
      return {
        schoolId: 'Select',
        school: initialEditRow.school || '',
        title: initialEditRow.title || '',
        classId: 'Select',
        class: initialEditRow.class || '',
        sectionId: 'Select',
        section: initialEditRow.section || '',
        subjectId: 'Select',
        subject: initialEditRow.subject || '',
        lessonId: initialEditRow.lessonId != null ? String(initialEditRow.lessonId) : 'Select',
        lesson: initialEditRow.lesson || '',
        teacherId:
          initialEditRow.teacherId != null
            ? String(initialEditRow.teacherId)
            : 'Select',
        lectureType: initialEditRow.classLecture || 'Select',
        academicYear: initialEditRow.academicYear || '',
        lectureUrl: initialEditRow.lectureUrl || '',
        note: initialEditRow.note || '',
      }
    }

    return {
      ...emptyForm,
      schoolId: fixedSchoolId ? String(fixedSchoolId) : 'Select',
      school: authSchoolName || '',
    }
  })

  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [sectionsLookup, setSectionsLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])
  const [lessonsLookup, setLessonsLookup] = useState([])
  const [teachersLookup, setTeachersLookup] = useState([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [activeStep] = useState(0)

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), [])

  const loadSchoolsLookup = useCallback(async () => {
    try {
      const schools = await fetchSchoolsLookup()
      setSchoolsLookup(Array.isArray(schools) ? schools : [])
    } catch {
      setSchoolsLookup([])
    }
  }, [])

  const loadTeachersLookup = useCallback(async () => {
    try {
      const teachers = await fetchTeachers()
      const rows = Array.isArray(teachers) ? teachers : []

      setTeachersLookup(
        rows
          .map((teacher) => ({
            id: teacher?.id,
            name: teacher?.name || teacher?.fullName,
            schoolId: teacher?.schoolId ?? teacher?.school?.id ?? null,
          }))
          .filter((teacher) => teacher.id != null && teacher.name)
          .sort((a, b) => a.name.localeCompare(b.name)),
      )
    } catch {
      setTeachersLookup([])
    }
  }, [])

  const loadSubjectsLookup = useCallback(async () => {
    try {
      const subjects =
        form.schoolId !== 'Select'
          ? await fetchSubjects({ schoolId: form.schoolId })
          : []
      setSubjectsLookup(Array.isArray(subjects) ? subjects : [])
    } catch {
      setSubjectsLookup([])
    }
  }, [form.schoolId])

  const loadClassesForSchool = useCallback(async (schoolId) => {
    if (!schoolId || schoolId === 'Select') {
      setClassesLookup([])
      return []
    }

    try {
      const data = await fetchClasses({ schoolId })
      const rows = Array.isArray(data) ? data : []
      setClassesLookup(rows)
      return rows
    } catch {
      setClassesLookup([])
      return []
    }
  }, [])

  const loadSectionsForClass = useCallback(async ({ schoolId, classId }) => {
    if (!classId || classId === 'Select') {
      setSectionsLookup([])
      return []
    }

    try {
      const data = await fetchSections({ schoolId, classId })
      const rows = Array.isArray(data) ? data : []
      setSectionsLookup(rows)
      return rows
    } catch {
      setSectionsLookup([])
      return []
    }
  }, [])

  useEffect(() => {
    void loadSchoolsLookup()
    void loadTeachersLookup()
    void loadSubjectsLookup()
  }, [loadSchoolsLookup, loadSubjectsLookup, loadTeachersLookup])

  useEffect(() => {
    if (
      form.schoolId === 'Select' ||
      form.classId === 'Select' ||
      form.subjectId === 'Select' ||
      !String(form.academicYear || '').trim()
    ) {
      setLessonsLookup([])
      return
    }

    let cancelled = false

    const loadLessons = async () => {
      try {
        const data = await fetchLessons({
          schoolId: form.schoolId,
          academicYear: form.academicYear,
          classId: form.classId,
          subjectId: form.subjectId,
        })

        if (!cancelled) {
          setLessonsLookup(Array.isArray(data) ? data : [])
        }
      } catch {
        if (!cancelled) setLessonsLookup([])
      }
    }

    void loadLessons()

    return () => {
      cancelled = true
    }
  }, [form.academicYear, form.classId, form.schoolId, form.subjectId])

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions

    if (Array.isArray(contextSchoolOptions) && contextSchoolOptions.length > 0) {
      return contextSchoolOptions
    }

    return Array.isArray(schoolsLookup) ? schoolsLookup : []
  }, [
    contextSchoolOptions,
    isSuperAdmin,
    manualScope.schoolOptions,
    schoolsLookup,
  ])

  useEffect(() => {
    if (!initialEditRow || schoolsLookup.length === 0) return

    const matchedSchool =
      schoolsLookup.find(
        (school) =>
          normalizeText(school.schoolName || school.name) ===
          normalizeText(initialEditRow.school),
      ) || null

    if (!matchedSchool) return

    const schoolId = String(matchedSchool.id)

    setForm((prev) => ({
      ...prev,
      schoolId,
      school: matchedSchool.schoolName || matchedSchool.name || prev.school,
    }))

    if (isSuperAdmin) {
      const foundSchool = findSchoolById(schoolsLookup, schoolId)
      const headOfficeId =
        initialEditRow.headOfficeId != null
          ? String(initialEditRow.headOfficeId)
          : foundSchool?.headOfficeId != null
            ? String(foundSchool.headOfficeId)
            : ''

      if (headOfficeId) {
        manualScope.setSelectedScope(headOfficeId, schoolId)
      }
    }
  }, [initialEditRow, isSuperAdmin, manualScope, schoolsLookup])

  useEffect(() => {
    if (form.schoolId === 'Select') {
      setClassesLookup([])
      setSectionsLookup([])
      return
    }

    void loadClassesForSchool(form.schoolId)
  }, [form.schoolId, loadClassesForSchool])

  useEffect(() => {
    if (
      !initialEditRow ||
      classesLookup.length === 0 ||
      form.classId !== 'Select'
    ) {
      return
    }

    const matchedClass =
      classesLookup.find(
        (item) =>
          normalizeText(item.className || item.name) ===
          normalizeText(initialEditRow.class),
      ) || null

    if (!matchedClass) return

    setForm((prev) => ({
      ...prev,
      classId: String(matchedClass.id),
      class: matchedClass.className || matchedClass.name || prev.class,
    }))
  }, [classesLookup, form.classId, initialEditRow])

  useEffect(() => {
    if (form.classId === 'Select') {
      setSectionsLookup([])
      return
    }

    void loadSectionsForClass({
      schoolId: form.schoolId,
      classId: form.classId,
    })
  }, [form.classId, form.schoolId, loadSectionsForClass])

  useEffect(() => {
    if (
      !initialEditRow ||
      sectionsLookup.length === 0 ||
      form.sectionId !== 'Select'
    ) {
      return
    }

    const matchedSection =
      sectionsLookup.find(
        (item) =>
          normalizeText(item.sectionName || item.name || item.label) ===
          normalizeText(initialEditRow.section),
      ) || null

    if (!matchedSection) return

    setForm((prev) => ({
      ...prev,
      sectionId: String(matchedSection.id),
      section:
        matchedSection.sectionName ||
        matchedSection.name ||
        matchedSection.label ||
        prev.section,
    }))
  }, [form.sectionId, initialEditRow, sectionsLookup])

  const availableSubjects = useMemo(() => {
    return subjectsLookup.filter((subject) => {
      const subjectSchoolId = subject?.schoolId ?? subject?.school?.id ?? null
      const subjectClassId =
        subject?.classId ?? subject?.schoolClass?.id ?? null

      const matchesSchool =
        form.schoolId === 'Select' ||
        subjectSchoolId == null ||
        String(subjectSchoolId) === String(form.schoolId)

      const matchesClass =
        form.classId === 'Select' ||
        subjectClassId == null ||
        String(subjectClassId) === String(form.classId)

      return matchesSchool && matchesClass
    })
  }, [form.classId, form.schoolId, subjectsLookup])

  const availableTeachers = useMemo(() => {
    return teachersLookup.filter((teacher) => {
      if (form.schoolId === 'Select') return true
      const teacherSchoolId = teacher?.schoolId ?? null
      return teacherSchoolId == null || String(teacherSchoolId) === String(form.schoolId)
    })
  }, [form.schoolId, teachersLookup])

  const availableLessons = useMemo(() => {
    return lessonsLookup.filter((lesson) => {
      const lessonSchoolId = lesson?.schoolId ?? lesson?.school?.id ?? null
      const lessonClassId = lesson?.classId ?? lesson?.schoolClass?.id ?? null
      const lessonSubjectId = lesson?.subjectId ?? lesson?.subject?.id ?? null
      const lessonYear = lesson?.academicYear ?? ''

      const matchesSchool =
        form.schoolId === 'Select' ||
        lessonSchoolId == null ||
        String(lessonSchoolId) === String(form.schoolId)
      const matchesClass =
        form.classId === 'Select' ||
        lessonClassId == null ||
        String(lessonClassId) === String(form.classId)
      const matchesSubject =
        form.subjectId === 'Select' ||
        lessonSubjectId == null ||
        String(lessonSubjectId) === String(form.subjectId)
      const matchesYear =
        !String(form.academicYear || '').trim() ||
        !String(lessonYear || '').trim() ||
        String(lessonYear) === String(form.academicYear)

      return matchesSchool && matchesClass && matchesSubject && matchesYear
    })
  }, [form.academicYear, form.classId, form.schoolId, form.subjectId, lessonsLookup])

  useEffect(() => {
    if (
      !initialEditRow ||
      availableSubjects.length === 0 ||
      form.subjectId !== 'Select'
    ) {
      return
    }

    const matchedSubject =
      availableSubjects.find(
        (subject) =>
          normalizeText(subject.name || subject.subjectName || subject.label) ===
          normalizeText(initialEditRow.subject),
      ) || null

    if (!matchedSubject) return

    setForm((prev) => ({
      ...prev,
      subjectId: String(matchedSubject.id),
      subject:
        matchedSubject.name ||
        matchedSubject.subjectName ||
        matchedSubject.label ||
        prev.subject,
    }))
  }, [availableSubjects, form.subjectId, initialEditRow])

  useEffect(() => {
    if (!initialEditRow || teachersLookup.length === 0) return

    if (form.teacherId !== 'Select') return

    const matchedTeacher =
      teachersLookup.find(
        (teacher) =>
          normalizeText(teacher.name) === normalizeText(initialEditRow.teacher),
      ) || null

    if (!matchedTeacher) return

    setForm((prev) => ({
      ...prev,
      teacherId: String(matchedTeacher.id),
    }))
  }, [form.teacherId, initialEditRow, teachersLookup])

  useEffect(() => {
    if (
      !initialEditRow ||
      availableLessons.length === 0 ||
      form.lessonId !== 'Select'
    ) {
      return
    }

    const matchedLesson =
      availableLessons.find(
        (lesson) =>
          normalizeText(lesson.lesson || lesson.name || lesson.label) ===
          normalizeText(initialEditRow.lesson),
      ) || null

    if (!matchedLesson) return

    setForm((prev) => ({
      ...prev,
      lessonId: String(matchedLesson.id),
      lesson:
        matchedLesson.lesson ||
        matchedLesson.name ||
        matchedLesson.label ||
        prev.lesson,
    }))
  }, [availableLessons, form.lessonId, initialEditRow])

  const selectedSchoolName = useMemo(() => {
    if (form.schoolId === 'Select') return authSchoolName || ''

    return (
      schoolOptions.find((school) => String(school.id) === String(form.schoolId))
        ?.schoolName ||
      schoolOptions.find((school) => String(school.id) === String(form.schoolId))
        ?.name ||
      form.school ||
      authSchoolName ||
      ''
    )
  }, [authSchoolName, form.school, form.schoolId, schoolOptions])

  const handleChange = (id, value) => {
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleSchoolChange = async (value) => {
    const selectedSchool = schoolOptions.find(
      (school) => String(school.id) === String(value),
    )

    setForm((prev) => ({
      ...prev,
      schoolId: value || 'Select',
      school: selectedSchool?.schoolName || selectedSchool?.name || '',
      classId: 'Select',
      class: '',
      sectionId: 'Select',
      section: '',
      subjectId: 'Select',
      subject: '',
      lessonId: 'Select',
      lesson: '',
      teacherId: 'Select',
    }))

    setSectionsLookup([])
    setLessonsLookup([])

    if (value && value !== 'Select') {
      await loadClassesForSchool(value)
    }
  }

  const handleClassChange = async (value) => {
    const selectedClass = classesLookup.find(
      (item) => String(item.id) === String(value),
    )

    setForm((prev) => ({
      ...prev,
      classId: value || 'Select',
      class: selectedClass?.className || selectedClass?.name || '',
      sectionId: 'Select',
      section: '',
      subjectId: 'Select',
      subject: '',
      lessonId: 'Select',
      lesson: '',
    }))

    setLessonsLookup([])

    if (value && value !== 'Select') {
      await loadSectionsForClass({
        schoolId: form.schoolId,
        classId: value,
      })
    }
  }

  const handleSectionChange = (value) => {
    const selectedSection = sectionsLookup.find(
      (item) => String(item.id) === String(value),
    )

    setForm((prev) => ({
      ...prev,
      sectionId: value || 'Select',
      section: getBestLabel(
        selectedSection?.sectionName,
        selectedSection?.name,
        selectedSection?.label,
      ),
    }))
  }

  const handleSubjectChange = (value) => {
    const selectedSubject = availableSubjects.find(
      (subject) => String(subject.id) === String(value),
    )

    setForm((prev) => ({
      ...prev,
      subjectId: value || 'Select',
      subject: getBestLabel(
        selectedSubject?.name,
        selectedSubject?.subjectName,
        selectedSubject?.label,
      ),
      lessonId: 'Select',
      lesson: '',
    }))

    setLessonsLookup([])
  }

  const handleLessonChange = (value) => {
    const selectedLesson = availableLessons.find(
      (lesson) => String(lesson.id) === String(value),
    )

    setForm((prev) => ({
      ...prev,
      lessonId: value || 'Select',
      lesson: getBestLabel(
        selectedLesson?.lesson,
        selectedLesson?.name,
        selectedLesson?.label,
      ),
    }))
  }

  const validate = () => {
    if (form.schoolId === 'Select') return 'School is required.'
    if (!String(form.title || '').trim()) return 'Title is required.'
    if (form.classId === 'Select') return 'Class is required.'
    if (form.sectionId === 'Select') return 'Section is required.'
    if (form.subjectId === 'Select') return 'Subject is required.'
    if (form.lessonId === 'Select') return 'Lesson is required.'
    if (form.teacherId === 'Select') return 'Teacher is required.'
    if (form.lectureType === 'Select') return 'Lecture type is required.'
    if (!String(form.academicYear || '').trim())
      return 'Academic year is required.'

    return ''
  }

  const buildPayload = () => ({
    school: form.school || selectedSchoolName || '',
    title: form.title || '',
    class: form.class || '',
    section: form.section || '',
    subject: form.subject || '',
    lessonId: form.lessonId !== 'Select' ? Number(form.lessonId) : null,
    lesson: form.lesson || '',
    teacherId: form.teacherId !== 'Select' ? Number(form.teacherId) : null,
    classLecture: form.lectureType !== 'Select' ? form.lectureType : '',
    academicYear: form.academicYear || '',
    lectureUrl: form.lectureUrl || '',
    note: form.note || '',
  })

  const save = async () => {
    const message = validate()

    if (message) {
      setError(message)
      return
    }

    setSaving(true)
    setLoading(true)
    setError('')

    try {
      const payload = buildPayload()

      if (editingId) {
        await updateClassLecture(editingId, payload)
      } else {
        await createClassLecture(payload)
      }

      setSuccess(true)

      setTimeout(() => {
        onNavigate?.('class-lecture')
      }, 900)
    } catch (err) {
      setError(
        err?.message ||
          (editingId
            ? 'Failed to update class lecture'
            : 'Failed to create class lecture'),
      )
    } finally {
      setSaving(false)
      setLoading(false)
    }
  }

  const renderStep = () => {
    if (activeStep !== 0) return null

    return (
      <div className="row g-20">
        {isSuperAdmin ? (
          <div className="col-12 mb-20">
            <ManualScopeSelectors
              enabled={isSuperAdmin}
              headOffices={manualScope.headOffices}
              schoolOptions={schoolOptions}
              selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
              onHeadOfficeChange={(value) => {
                manualScope.setSelectedScope(value, '')
                handleSchoolChange('Select')
              }}
              selectedSchoolId={form.schoolId}
              onSchoolChange={(value) => handleSchoolChange(value)}
              compact
            />
          </div>
        ) : fixedSchoolId ? (
          <div className="col-12 avm-grid">
            <FormField label="Head Office" required>
              <input
                className="form-control avm-input ps-44"
                value={authHeadOfficeName || ''}
                readOnly
              />
            </FormField>

            <FormField label="School Name" required>
              <input
                className="form-control avm-input ps-44"
                value={selectedSchoolName}
                readOnly
              />
            </FormField>
          </div>
        ) : (
          <div className="col-12 avm-grid">
            <FormField label="School Name" required full>
              <select
                className="form-select avm-input ps-44"
                value={form.schoolId}
                onChange={(e) => handleSchoolChange(e.target.value)}
              >
                <option value="Select">Select School</option>
                {schoolOptions.map((school) => (
                  <option key={school.id} value={String(school.id)}>
                    {school.schoolName || school.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        )}

        <div className="col-12 avm-grid">
          <FormField label="Title" required full>
            <input
              type="text"
              className="form-control avm-input ps-44"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter lecture title"
            />
          </FormField>

          <FormField label="Class" required>
            <select
              className="form-select avm-input ps-44"
              value={form.classId}
              onChange={(e) => handleClassChange(e.target.value)}
              disabled={form.schoolId === 'Select'}
            >
              <option value="Select">Select Class</option>
              {classesLookup.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {getBestLabel(item.className, item.name, item.label)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Section" required>
            <select
              className="form-select avm-input ps-44"
              value={form.sectionId}
              onChange={(e) => handleSectionChange(e.target.value)}
              disabled={form.classId === 'Select'}
            >
              <option value="Select">Select Section</option>
              {sectionsLookup.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {getBestLabel(item.sectionName, item.name, item.label)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Subject" required>
            <select
              className="form-select avm-input ps-44"
              value={form.subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              disabled={form.classId === 'Select'}
            >
              <option value="Select">Select Subject</option>
              {availableSubjects.map((subject) => (
                <option key={subject.id} value={String(subject.id)}>
                  {getBestLabel(subject.name, subject.subjectName, subject.label)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Academic Year" required>
            <input
              type="text"
              className="form-control avm-input ps-44"
              value={form.academicYear}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  academicYear: e.target.value,
                  lessonId: 'Select',
                  lesson: '',
                }))
              }
              placeholder="2026-2027"
            />
          </FormField>

          <FormField label="Lesson" required>
            <select
              className="form-select avm-input ps-44"
              value={form.lessonId}
              onChange={(e) => handleLessonChange(e.target.value)}
              disabled={
                form.schoolId === 'Select' ||
                form.classId === 'Select' ||
                form.subjectId === 'Select' ||
                !String(form.academicYear || '').trim()
              }
            >
              <option value="Select">Select Lesson</option>
              {availableLessons.map((lesson) => (
                <option key={lesson.id} value={String(lesson.id)}>
                  {getBestLabel(lesson.lesson, lesson.name, lesson.label)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Teacher" required>
            <select
              className="form-select avm-input ps-44"
              value={form.teacherId}
              onChange={(e) => handleChange('teacherId', e.target.value)}
              disabled={form.schoolId === 'Select'}
            >
              <option value="Select">Select Teacher</option>
              {availableTeachers.map((teacher) => (
                <option key={teacher.id} value={String(teacher.id)}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Lecture Type" required>
            <select
              className="form-select avm-input ps-44"
              value={form.lectureType}
              onChange={(e) => handleChange('lectureType', e.target.value)}
            >
              <option value="Select">Select Lecture Type</option>
              <option value="Youtube">Youtube</option>
              <option value="Vimeo">Vimeo</option>
              <option value="Power Point">Power Point</option>
            </select>
          </FormField>

          <FormField label="Lecture URL" full>
            <input
              type="url"
              className="form-control avm-input ps-44"
              value={form.lectureUrl}
              onChange={(e) => handleChange('lectureUrl', e.target.value)}
              placeholder="https://..."
            />
          </FormField>

          <FormField label="Note" full noIcon>
            <textarea
              rows="4"
              className="form-control avm-input avm-textarea"
              value={form.note}
              onChange={(e) => handleChange('note', e.target.value)}
              placeholder="Enter note"
            />
          </FormField>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {editingId ? 'Edit' : 'Add'} Class Lecture
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
              / Class Lecture / {editingId ? 'Edit' : 'Add'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-6"
          onClick={() => onNavigate?.('class-lecture')}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

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
            {STEPS[0]}
          </div>
        </div>

        <div className="card-body p-24">
          {error ? (
            <div className="alert alert-danger d-flex align-items-center gap-10 mb-24 radius-8">
              <i className="ri-error-warning-line text-lg" />
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="alert alert-success d-flex align-items-center gap-10 mb-24 radius-8">
              <i className="ri-checkbox-circle-line text-lg" />
              Class lecture {editingId ? 'updated' : 'created'} successfully!
              Redirecting...
            </div>
          ) : null}

          <div className="tab-content">{renderStep()}</div>

          <div className="d-flex align-items-center justify-content-end gap-10 mt-24 pt-20 border-top border-neutral-200">
            <button
              type="button"
              className="btn btn-light border px-24"
              onClick={() => onNavigate?.('class-lecture')}
            >
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
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>{' '}
                  Processing...
                </>
              ) : (
                <>
                  <i className="ri-save-line" />{' '}
                  {editingId ? 'Update' : 'Save'} Class Lecture
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddClassLecture
