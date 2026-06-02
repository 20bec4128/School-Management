import { useCallback, useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { fetchExamTerms } from '../apis/examTermApi'
import {
  createSuggestion,
  deleteSuggestion,
  fetchSuggestions,
  updateSuggestion,
} from '../apis/suggestionApi'

const STEPS = ['Basic Info', 'Suggestion & Media']

const emptyForm = {
  id: null,
  headOfficeId: '',
  schoolId: '',
  title: '',
  examTerm: '',
  className: '',
  subjectName: '',
  suggestionText: '',
  documentName: '',
  documentPath: '',
  note: '',
  removeDocument: false,
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  examTerm: 'Select',
  className: 'Select',
  subjectName: 'Select',
}

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Title: 'ri-file-list-line',
  'Exam Term': 'ri-calendar-event-line',
  Class: 'ri-graduation-cap-line',
  Subject: 'ri-book-open-line',
  Suggestion: 'ri-lightbulb-line',
  Document: 'ri-file-copy-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'title', label: 'Title' },
  { key: 'examTerm', label: 'Exam Term' },
  { key: 'className', label: 'Class' },
  { key: 'subjectName', label: 'Subject' },
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

const getFileIcon = (fileName) => {
  if (!fileName) return 'ri-file-line'
  const ext = fileName.split('.').pop().toLowerCase()
  if (ext === 'pdf') return 'ri-file-pdf-line'
  if (['doc', 'docx'].includes(ext)) return 'ri-file-word-line'
  if (['ppt', 'pptx'].includes(ext)) return 'ri-slideshow-line'
  if (ext === 'txt') return 'ri-file-text-line'
  return 'ri-file-line'
}

const Suggestion = ({ onNavigate }) => {
  const { role, headOfficeId: authHeadOfficeId, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const normalizedRole = useMemo(() => normalizeRole(role), [role])
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = normalizedRole === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = normalizedRole === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const currentSchoolOption = useMemo(() => {
    if (authSchoolId == null) return null
    return {
      id: authSchoolId,
      schoolName: authSchoolName || `School ${authSchoolId}`,
      headOfficeId: authHeadOfficeId ?? '',
    }
  }, [authHeadOfficeId, authSchoolId, authSchoolName])

  const [rows, setRows] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classOptions, setClassOptions] = useState([])
  const [subjectOptions, setSubjectOptions] = useState([])
  const [examTermOptions, setExamTermOptions] = useState([])
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addDocFile, setAddDocFile] = useState(null)
  const [editDocFile, setEditDocFile] = useState(null)
  const [addDocInputKey, setAddDocInputKey] = useState(0)
  const [editDocInputKey, setEditDocInputKey] = useState(0)
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : null

  const getSchoolById = (schoolId) =>
    (Array.isArray(schoolsLookup) ? schoolsLookup : []).find((school) => String(school?.id ?? '') === String(schoolId ?? '')) || null

  const schoolFormOptions = useMemo(() => {
    const list = Array.isArray(schoolsLookup) ? schoolsLookup : []
    if (isSuperAdmin) return manualScope.schoolOptions || []
    if (isHeadOfficeAdmin) {
      return list.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      const match = list.find((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
      if (match) return [match]
      if (authSchoolId != null) {
        return [{ id: authSchoolId, schoolName: authSchoolName || 'My School', headOfficeId: authHeadOfficeId ?? null }]
      }
      return []
    }
    return list
  }, [schoolsLookup, isSuperAdmin, manualScope.schoolOptions, isHeadOfficeAdmin, isSchoolAdmin, authHeadOfficeId, authSchoolId, authSchoolName])

  const schoolFilterOptions = useMemo(() => {
    const list = Array.isArray(schoolsLookup) ? schoolsLookup : []
    if (pendingFilters.headOfficeId) {
      return list.filter((school) => String(school?.headOfficeId ?? '') === String(pendingFilters.headOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return list.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return list.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return list
  }, [authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, pendingFilters.headOfficeId, schoolsLookup])

  const examTermFilterOptions = useMemo(
    () => uniqueStrings(rows.map((row) => row.examTerm)),
    [rows],
  )

  const classFilterOptions = useMemo(
    () => uniqueStrings(rows.map((row) => row.className)),
    [rows],
  )

  const subjectFilterOptions = useMemo(
    () => uniqueStrings(rows.map((row) => row.subjectName)),
    [rows],
  )

  const filteredData = useMemo(() => {
    let data = [...rows]

    if (filters.headOfficeId) {
      data = data.filter((row) => String(getSchoolById(row.schoolId)?.headOfficeId ?? '') === String(filters.headOfficeId))
    }
    if (filters.schoolId) {
      data = data.filter((row) => String(row.schoolId ?? '') === String(filters.schoolId))
    }
    if (filters.examTerm !== 'Select') {
      data = data.filter((row) => row.examTerm === filters.examTerm)
    }
    if (filters.className !== 'Select') {
      data = data.filter((row) => row.className === filters.className)
    }
    if (filters.subjectName !== 'Select') {
      data = data.filter((row) => row.subjectName === filters.subjectName)
    }
    if (search.trim()) {
      const term = search.toLowerCase()
      data = data.filter((row) => {
        const content = [
          row.schoolName,
          row.title,
          row.examTerm,
          row.className,
          row.subjectName,
          row.suggestionText,
          row.note,
        ]
          .map((value) => String(value ?? '').toLowerCase())
          .join(' ')
        return content.includes(term)
      })
    }
    return data
  }, [rows, filters, search, getSchoolById])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedData = useMemo(
    () => filteredData.slice(startIndex, startIndex + rowsPerPage),
    [filteredData, startIndex, rowsPerPage],
  )

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  useEffect(() => {
    if (isSchoolAdmin) {
      setSchoolsLookup(currentSchoolOption ? [currentSchoolOption] : [])
      return
    }
    fetchSchoolsLookup()
      .then((data) => setSchoolsLookup(Array.isArray(data) ? data : []))
      .catch(() => setSchoolsLookup([]))
  }, [currentSchoolOption, isSchoolAdmin])

  const loadSuggestions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchSuggestions()
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      setRows([])
      setError(err?.message || 'Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSuggestions()
  }, [loadSuggestions])

  useEffect(() => {
    if (!isSuperAdmin) return
    if (!isEditOpen || !editForm.schoolId) return
    const match = schoolsLookup.find((school) => String(school?.id ?? '') === String(editForm.schoolId))
    if (match?.headOfficeId != null) {
      manualScope.setSelectedScope(String(match.headOfficeId), String(editForm.schoolId))
    }
  }, [isSuperAdmin, isEditOpen, editForm.schoolId, schoolsLookup, manualScope])

  useEffect(() => {
    if (isSchoolAdmin && authSchoolId != null) {
      setAddForm((prev) => ({ ...prev, schoolId: String(authSchoolId) }))
      setEditForm((prev) => (prev.schoolId ? prev : { ...prev, schoolId: String(authSchoolId) }))
    }
  }, [isSchoolAdmin, authSchoolId])

  useEffect(() => {
    const selectedSchoolId = isAddOpen
      ? addForm.schoolId
      : isEditOpen
        ? editForm.schoolId
        : ''
    if (!selectedSchoolId) {
      setClassOptions([])
      setSubjectOptions([])
      setExamTermOptions([])
      return
    }

    let cancelled = false
    const loadLookups = async () => {
      try {
        const [classesData, subjectsData, examTermsData] = await Promise.all([
          fetchClasses({ schoolId: selectedSchoolId }).catch(() => []),
          fetchSubjects({ schoolId: selectedSchoolId }).catch(() => []),
          fetchExamTerms({ schoolId: selectedSchoolId }).catch(() => []),
        ])
        if (cancelled) return
        setClassOptions(
          uniqueStrings(
            (Array.isArray(classesData) ? classesData : []).map((item) =>
              String(item?.className ?? item?.name ?? item?.title ?? '').trim(),
            ),
          ),
        )
        setSubjectOptions(
          uniqueStrings(
            (Array.isArray(subjectsData) ? subjectsData : []).map((item) =>
              String(item?.subjectName ?? item?.name ?? item?.title ?? '').trim(),
            ),
          ),
        )
        setExamTermOptions(
          uniqueStrings(
            (Array.isArray(examTermsData) ? examTermsData : []).map((item) =>
              String(item?.examTerm ?? item?.name ?? item?.title ?? item ?? '').trim(),
            ),
          ),
        )
      } catch {
        if (!cancelled) {
          setClassOptions([])
          setSubjectOptions([])
          setExamTermOptions([])
        }
      }
    }

    void loadLookups()
    return () => {
      cancelled = true
    }
  }, [isAddOpen, isEditOpen, addForm.schoolId, editForm.schoolId])

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p += 1) pages.push(p)
    return pages
  }

  const resetForm = (mode) => {
    const baseSchoolId = isSchoolAdmin && authSchoolId != null ? String(authSchoolId) : ''
    const baseHeadOfficeId = isSchoolAdmin ? String(authHeadOfficeId ?? '') : ''
    const next = {
      ...emptyForm,
      headOfficeId: baseHeadOfficeId,
      schoolId: baseSchoolId,
    }
    if (mode === 'add') {
      setAddForm(next)
      setAddDocFile(null)
      setAddDocInputKey((key) => key + 1)
      setAddStep(0)
    } else {
      setEditForm(next)
      setEditDocFile(null)
      setEditDocInputKey((key) => key + 1)
      setEditStep(0)
    }
  }

  const openAdd = () => {
    sessionStorage.removeItem('sm_suggestion_edit_id')
    if (navigateTo) navigateTo('suggestion-create')
  }

  const openEdit = (row) => {
    sessionStorage.setItem('sm_suggestion_edit_id', String(row.id))
    if (navigateTo) navigateTo('suggestion-create')
  }

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({ ...prev, [id]: value }))
  }

  const handleFileChange = (setter, setFile) => (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setter((prev) => ({
      ...prev,
      removeDocument: false,
    }))
    setFile(file)
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleFilterHeadOfficeChange = (value) => {
    setPendingFilters((prev) => ({
      ...prev,
      headOfficeId: value,
      schoolId: '',
    }))
  }

  const handleFilterSchoolChange = (value) => {
    const selectedSchool = getSchoolById(value)
    setPendingFilters((prev) => ({
      ...prev,
      schoolId: value,
      headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
    }))
  }

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(value)
    setCurrentPage(1)
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
    setSearch('')
    setIsFilterSidebarOpen(false)
    setCurrentPage(1)
  }

  const resolveScopeForSubmit = (form) => {
    const selectedSchool = schoolsLookup.find((item) => String(item?.id ?? '') === String(form.schoolId ?? ''))
    const schoolId = form.schoolId ? Number(form.schoolId) : null
    const headOfficeIdFromSchool = selectedSchool?.headOfficeId != null ? Number(selectedSchool.headOfficeId) : null

    if (isSuperAdmin) {
      const selectedHeadOfficeId = manualScope.selectedHeadOfficeId
        ? Number(manualScope.selectedHeadOfficeId)
        : headOfficeIdFromSchool
      return {
        headOfficeId: selectedHeadOfficeId,
        schoolId,
      }
    }

    if (isHeadOfficeAdmin) {
      return {
        headOfficeId: authHeadOfficeId != null ? Number(authHeadOfficeId) : headOfficeIdFromSchool,
        schoolId,
      }
    }

    return {
      headOfficeId: headOfficeIdFromSchool != null ? headOfficeIdFromSchool : authHeadOfficeId != null ? Number(authHeadOfficeId) : null,
      schoolId: schoolId != null ? schoolId : authSchoolId != null ? Number(authSchoolId) : null,
    }
  }

  const validateForm = (form) => {
    if (!form.schoolId) return 'School is required'
    if (!form.title.trim()) return 'Title is required'
    if (!form.examTerm.trim()) return 'Exam term is required'
    if (!form.className.trim()) return 'Class is required'
    if (!form.subjectName.trim()) return 'Subject is required'
    if (!form.suggestionText.trim()) return 'Suggestion is required'
    return ''
  }

  const handleSave = async (mode) => {
    const form = mode === 'add' ? addForm : editForm
    const docFile = mode === 'add' ? addDocFile : editDocFile
    const validation = validateForm(form)
    if (validation) {
      setError(validation)
      return
    }

    const scope = resolveScopeForSubmit(form)
    if (!scope.schoolId) {
      setError('School is required')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        headOfficeId: scope.headOfficeId,
        schoolId: scope.schoolId,
        title: form.title.trim(),
        examTerm: form.examTerm.trim(),
        className: form.className.trim(),
        subjectName: form.subjectName.trim(),
        suggestionText: form.suggestionText.trim(),
        note: form.note.trim(),
        removeDocument: Boolean(form.removeDocument),
      }

      if (mode === 'add') {
        await createSuggestion(payload, docFile)
      } else {
        await updateSuggestion(form.id, payload, docFile)
      }

      setSuccessMessage(`Suggestion ${mode === 'add' ? 'created' : 'updated'} successfully!`)
      setSuccess(true)
      setIsAddOpen(false)
      setIsEditOpen(false)
      resetForm(mode)
      await loadSuggestions()
      setTimeout(() => setSuccess(false), 1000)
    } catch (err) {
      setError(err?.message || 'Failed to save suggestion')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this suggestion?')) return
    setError('')
    try {
      await deleteSuggestion(row.id)
      await loadSuggestions()
      setSuccessMessage('Suggestion deleted successfully!')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 1000)
    } catch (err) {
      setError(err?.message || 'Failed to delete suggestion')
    }
  }

  const renderSchoolField = (form, setter) => {
    if (isSuperAdmin) {
      return (
        <div className="avm-field full">
          <ManualScopeSelectors
            enabled={isSuperAdmin}
            headOffices={manualScope.headOffices}
            schoolOptions={manualScope.schoolOptions}
            selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
            onHeadOfficeChange={(value) => {
              manualScope.setSelectedHeadOfficeId(value)
              manualScope.setSelectedSchoolId('')
              setter((prev) => ({
                ...prev,
                headOfficeId: value,
                schoolId: '',
                className: '',
                subjectName: '',
                examTerm: '',
              }))
            }}
            selectedSchoolId={form.schoolId}
            onSchoolChange={(value) => {
              manualScope.setSelectedSchoolId(value)
              setter((prev) => ({
                ...prev,
                schoolId: value,
                className: '',
                subjectName: '',
                examTerm: '',
              }))
            }}
            schoolLabel="School"
            compact
          />
        </div>
      )
    }

    return (
      <FormField label="School Name" required full>
        <select
          className="avm-select"
          id="schoolId"
          value={form.schoolId}
          onChange={(e) =>
            setter((prev) => ({
              ...prev,
              schoolId: e.target.value,
              className: '',
              subjectName: '',
              examTerm: '',
              removeDocument: prev.removeDocument,
            }))
          }
          disabled={isSchoolAdmin}
        >
          <option value="">--Select School--</option>
          {schoolFormOptions.map((school) => (
            <option key={String(school.id)} value={String(school.id)}>
              {school.schoolName}
            </option>
          ))}
        </select>
      </FormField>
    )
  }

  const renderForm = (form, setter, step, docFile, setDocFile, docInputId, docInputKey, resetDocInput) => (
    <>
      {step === 0 && (
        <>
          <p className="avm-section-title">{STEPS[0]}</p>
          <div className="avm-grid">
            {renderSchoolField(form, setter)}

            <FormField label="Title" required full>
              <input
                type="text"
                className="avm-input"
                id="title"
                placeholder="Title"
                value={form.title}
                onChange={handleChange(setter)}
              />
            </FormField>

            <FormField label="Exam Term" required>
              <select
                className="avm-select"
                id="examTerm"
                value={form.examTerm}
                onChange={handleChange(setter)}
              >
                <option value="">--Select--</option>
                {examTermOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Class" required>
              <select
                className="avm-select"
                id="className"
                value={form.className}
                onChange={handleChange(setter)}
              >
                <option value="">--Select--</option>
                {classOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Subject" required>
              <select
                className="avm-select"
                id="subjectName"
                value={form.subjectName}
                onChange={handleChange(setter)}
              >
                <option value="">--Select--</option>
                {subjectOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <p className="avm-section-title">{STEPS[1]}</p>
          <div className="avm-grid">
            <FormField label="Suggestion" full noIcon>
              <textarea
                rows={5}
                className="avm-input avm-textarea"
                id="suggestionText"
                placeholder="Enter your suggestion..."
                value={form.suggestionText}
                onChange={handleChange(setter)}
              />
            </FormField>

            <div className="avm-field full">
              <label className="avm-label">Document</label>
              <label
                htmlFor={docInputId}
                style={{
                  border: '2px dashed #d0d5dd',
                  borderRadius: '0.75rem',
                  padding: '1.5rem 1.25rem',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#45597a'
                  e.currentTarget.style.background = '#f0f4f8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d0d5dd'
                  e.currentTarget.style.background = '#f8fafc'
                }}
              >
                {docFile || form.documentName ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      background: '#e8edf4',
                      borderRadius: '0.6rem',
                      padding: '0.65rem 1rem',
                      width: '100%',
                    }}
                  >
                    <i
                      className={getFileIcon(docFile?.name || form.documentName)}
                      style={{ fontSize: '1.5rem', color: '#45597a', flexShrink: 0 }}
                    ></i>
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#34393f',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {docFile?.name || form.documentName}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#7a8a9a' }}>
                        {docFile ? `${(docFile.size / 1024).toFixed(1)} KB` : 'Existing file'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        background: '#e8edf4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <i className="ri-upload-cloud-2-line" style={{ fontSize: '1.5rem', color: '#45597a' }}></i>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#45597a' }}>
                        Click to upload document
                      </p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                        Document file format: .pdf, .doc/docx, .ppt/pptx or .txt
                      </p>
                    </div>
                  </>
                )}
                <input
                  key={docInputKey}
                  id={docInputId}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  style={{ display: 'none' }}
                  onChange={handleFileChange(setter, setDocFile)}
                />
              </label>
              {(docFile || form.documentName) && (
                <button
                  type="button"
                  className="avm-btn light sm"
                  style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                  onClick={() => {
                    setter((prev) => ({
                      ...prev,
                      documentName: '',
                      documentPath: '',
                      removeDocument: true,
                    }))
                    setDocFile(null)
                    resetDocInput()
                  }}
                >
                  <i className="ri-delete-bin-line"></i> Remove
                </button>
              )}
            </div>

            <FormField label="Note" full noIcon>
              <textarea
                rows={3}
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Suggestion</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Suggestion</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={openAdd}
        >
          <span className="d-flex text-md">
            <i className="ri-add-large-line"></i>
          </span>
          Add Suggestion
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
          {successMessage}
        </div>
      ) : null}

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

              <RowsPerPageSelect
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search suggestion..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedRows(paginatedData.map((row) => row.id))
                          else setSelectedRows([])
                        }}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.schoolName ? <th scope="col">School</th> : null}
                  {visibleColumns.title ? <th scope="col">Title</th> : null}
                  {visibleColumns.examTerm ? <th scope="col">Exam Term</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.subjectName ? <th scope="col">Subject</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      Loading suggestions...
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => {
                              if (selectedRows.includes(row.id)) {
                                setSelectedRows(selectedRows.filter((id) => id !== row.id))
                              } else {
                                setSelectedRows([...selectedRows, row.id])
                              }
                            }}
                          />
                          <label className="form-check-label">{String(startIndex + index + 1).padStart(2, '0')}</label>
                        </div>
                      </td>
                      {visibleColumns.schoolName ? <td className="fw-medium">{row.schoolName}</td> : null}
                      {visibleColumns.title ? <td>{row.title}</td> : null}
                      {visibleColumns.examTerm ? <td>{row.examTerm}</td> : null}
                      {visibleColumns.className ? <td>{row.className}</td> : null}
                      {visibleColumns.subjectName ? <td>{row.subjectName}</td> : null}
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
                            title="Delete"
                            onClick={() => handleDelete(row)}
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
              Showing {filteredData.length === 0 ? 0 : startIndex + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              {getVisiblePages().map((page) => (
                <button
                  key={page}
                  type="button"
                  className={page === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <WizardPopup
        modalWidth="620px"
        open={isAddOpen}
        title="Add Suggestion"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((step) => Math.max(0, step - 1))}
        onNext={() => setAddStep((step) => Math.min(STEPS.length - 1, step + 1))}
        onSubmit={() => handleSave('add')}
        submitLabel={saving ? 'Saving...' : 'Save'}
      >
        {renderForm(
          addForm,
          setAddForm,
          addStep,
          addDocFile,
          setAddDocFile,
          'addSuggestionDocument',
          addDocInputKey,
          () => setAddDocInputKey((key) => key + 1),
        )}
      </WizardPopup>

      <WizardPopup
        modalWidth="620px"
        open={isEditOpen}
        title="Edit Suggestion"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((step) => Math.max(0, step - 1))}
        onNext={() => setEditStep((step) => Math.min(STEPS.length - 1, step + 1))}
        onSubmit={() => handleSave('edit')}
        submitLabel={saving ? 'Saving...' : 'Update'}
      >
        {renderForm(
          editForm,
          setEditForm,
          editStep,
          editDocFile,
          setEditDocFile,
          'editSuggestionDocument',
          editDocInputKey,
          () => setEditDocInputKey((key) => key + 1),
        )}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        title="Filter Suggestion"
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={manualScope.headOffices}
              schoolOptions={schoolFilterOptions.map((school) => ({
                id: school.id,
                schoolName: school.schoolName || school.name || '',
              }))}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={handleFilterHeadOfficeChange}
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={handleFilterSchoolChange}
              schoolLabel="School"
            />
          ) : (
            <div className="avm-field full">
              <label htmlFor="schoolId" className="avm-label">
                School
              </label>
              <select
                id="schoolId"
                className="avm-select"
                value={pendingFilters.schoolId}
                onChange={(e) => handleFilterSchoolChange(e.target.value)}
              >
                <option value="">All Schools</option>
                {schoolFilterOptions.map((school) => (
                  <option key={String(school.id)} value={String(school.id)}>
                    {school.schoolName || school.name || String(school.id)}
                  </option>
                ))}
              </select>
            </div>
          )}
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
              {examTermFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="className" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class
            </label>
            <select
              id="className"
              className="form-control form-select"
              value={pendingFilters.className}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Class</option>
              {classFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="subjectName" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Subject
            </label>
            <select
              id="subjectName"
              className="form-control form-select"
              value={pendingFilters.subjectName}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Subject</option>
              {subjectFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
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

export default Suggestion
