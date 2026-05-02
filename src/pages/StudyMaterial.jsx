import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { createStudyMaterial, deleteStudyMaterial, fetchStudyMaterials, updateStudyMaterial } from '../apis/studyMaterialsApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSubjects } from '../apis/subjectsApi'
import { can } from '../utils/permissions'
import { useAuth } from '../context/AuthContext'
import '../assets/css/addModalShared.css'

const ACCEPTED_DOC_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.txt'
const ACCEPTED_DOC_LABEL = '.pdf, .doc/docx, .ppt/pptx or .txt'

const emptyForm = {
  schoolId: 'Select',
  classId: 'Select',
  subjectId: 'Select',
  title: '',
  description: '',
}

const emptyFilters = {
  schoolId: 'Select',
  classId: 'Select',
  subjectId: 'Select',
}

const STEPS = ['Basic Info']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Class: 'ri-building-line',
  Subject: 'ri-book-open-line',
  Title: 'ri-file-list-2-line',
  Description: 'ri-align-left',
  Material: 'ri-attachment-2',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'className', label: 'Class' },
  { key: 'subjectName', label: 'Subject' },
  { key: 'title', label: 'Title' },
  { key: 'fileName', label: 'File' },
]

const getFileIcon = (fileName) => {
  if (!fileName) return 'ri-file-line'
  const ext = String(fileName).split('.').pop().toLowerCase()
  if (ext === 'pdf') return 'ri-file-pdf-line'
  if (['doc', 'docx'].includes(ext)) return 'ri-file-word-line'
  if (['ppt', 'pptx'].includes(ext)) return 'ri-slideshow-line'
  if (ext === 'txt') return 'ri-file-text-line'
  return 'ri-file-line'
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

const StudyMaterial = () => {
  const { user } = useAuth()
  const canManage = can(user, ['STUDY_MATERIAL_MANAGE', 'STUDY_MATERIAL_MANAGE_ASSIGNED', '*'])

  const [rows, setRows] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [subjectsLookup, setSubjectsLookup] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
  const [editingId, setEditingId] = useState(null)
  const [addFile, setAddFile] = useState(null)
  const [editFile, setEditFile] = useState(null)
  const addFileRef = useRef(null)
  const editFileRef = useRef(null)

  const [isFindSidebarOpen, setIsFindSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [findErrors, setFindErrors] = useState({})
  const [hasSearched, setHasSearched] = useState(false)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const loadLookups = useCallback(async () => {
    const [schools, classes, subjects] = await Promise.all([fetchSchoolsLookup(), fetchClasses(), fetchSubjects()])
    setSchoolsLookup(Array.isArray(schools) ? schools : [])
    setClassesLookup(Array.isArray(classes) ? classes : [])
    setSubjectsLookup(Array.isArray(subjects) ? subjects : [])
  }, [])

  const loadRows = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchStudyMaterials()
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setRows([])
      setError(e?.message || 'Failed to load study materials')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLookups()
    void loadRows()
  }, [loadLookups, loadRows])

  const classOptions = useMemo(() => {
    return classesLookup
      .filter((c) => pendingFilters.schoolId === 'Select' || String(c.schoolId) === String(pendingFilters.schoolId))
      .slice()
      .sort((a, b) => String(a.className || '').localeCompare(String(b.className || '')))
  }, [classesLookup, pendingFilters.schoolId])

  const subjectOptions = useMemo(() => {
    return subjectsLookup
      .filter((s) => {
        if (pendingFilters.schoolId !== 'Select' && String(s.schoolId) !== String(pendingFilters.schoolId)) return false
        if (pendingFilters.classId !== 'Select' && String(s.classId) !== String(pendingFilters.classId)) return false
        return true
      })
      .slice()
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
  }, [subjectsLookup, pendingFilters.schoolId, pendingFilters.classId])

  const validateFind = () => {
    const errs = {}
    if (pendingFilters.schoolId === 'Select') errs.schoolId = 'School is required.'
    if (pendingFilters.classId === 'Select') errs.classId = 'Class is required.'
    if (pendingFilters.subjectId === 'Select') errs.subjectId = 'Subject is required.'
    return errs
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    const errs = validateFind()
    if (Object.keys(errs).length > 0) {
      setFindErrors(errs)
      return
    }
    setFindErrors({})
    setFilters(pendingFilters)
    setHasSearched(true)
    setIsFindSidebarOpen(false)
    setCurrentPage(1)
    setSelectedRows([])
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setFindErrors({})
    setHasSearched(false)
    setSearch('')
    setCurrentPage(1)
    setSelectedRows([])
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => {
      if (id === 'schoolId') return { ...prev, schoolId: value, classId: 'Select', subjectId: 'Select' }
      if (id === 'classId') return { ...prev, classId: value, subjectId: 'Select' }
      return { ...prev, [id]: value }
    })
    setFindErrors((prev) => ({ ...prev, [id]: '' }))
  }

  const filtered = useMemo(() => {
    if (!hasSearched) return []
    const q = search.trim().toLowerCase()
    const list = rows.filter((r) => {
      const matchesScope =
        String(r.schoolId) === String(filters.schoolId) &&
        String(r.classId) === String(filters.classId) &&
        String(r.subjectId) === String(filters.subjectId)
      if (!matchesScope) return false
      if (!q) return true
      return [r.title, r.description, r.fileName].filter(Boolean).join(' ').toLowerCase().includes(q)
    })
    return list
  }, [rows, hasSearched, search, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((r) => selectedRows.includes(r.id))

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((r) => r.id)])])
    else setSelectedRows((prev) => prev.filter((id) => !paginated.some((r) => r.id === id)))
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const openAdd = () => {
    setAddForm({ ...emptyForm, ...filters })
    setAddFile(null)
    if (addFileRef.current) addFileRef.current.value = ''
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row?.id ?? null)
    setEditForm({
      schoolId: row?.schoolId != null ? String(row.schoolId) : 'Select',
      classId: row?.classId != null ? String(row.classId) : 'Select',
      subjectId: row?.subjectId != null ? String(row.subjectId) : 'Select',
      title: row?.title || '',
      description: row?.description || '',
    })
    setEditFile(null)
    if (editFileRef.current) editFileRef.current.value = ''
    setEditStep(0)
    setIsEditOpen(true)
  }

  const validateForm = (form) => {
    const errs = {}
    if (!form.schoolId || form.schoolId === 'Select') errs.schoolId = 'School is required.'
    if (!form.classId || form.classId === 'Select') errs.classId = 'Class is required.'
    if (!form.subjectId || form.subjectId === 'Select') errs.subjectId = 'Subject is required.'
    if (!String(form.title || '').trim()) errs.title = 'Title is required.'
    return errs
  }

  const [formErrors, setFormErrors] = useState({})

  const submitAdd = async () => {
    const errs = validateForm(addForm)
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      return
    }
    try {
      setSaving(true)
      setError('')
      await createStudyMaterial(
        {
          schoolId: Number(addForm.schoolId),
          classId: Number(addForm.classId),
          subjectId: Number(addForm.subjectId),
          title: addForm.title,
          description: addForm.description,
        },
        addFile,
      )
      setIsAddOpen(false)
      await loadRows()
    } catch (e) {
      setError(e?.message || 'Failed to create study material')
    } finally {
      setSaving(false)
    }
  }

  const submitEdit = async () => {
    if (!editingId) return
    const errs = validateForm(editForm)
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      return
    }
    try {
      setSaving(true)
      setError('')
      await updateStudyMaterial(
        editingId,
        {
          schoolId: Number(editForm.schoolId),
          classId: Number(editForm.classId),
          subjectId: Number(editForm.subjectId),
          title: editForm.title,
          description: editForm.description,
        },
        editFile,
      )
      setIsEditOpen(false)
      setEditingId(null)
      await loadRows()
    } catch (e) {
      setError(e?.message || 'Failed to update study material')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    const id = row?.id
    if (!id) return
    if (!window.confirm(`Delete study material "${row?.title || id}"?`)) return
    try {
      setSaving(true)
      setError('')
      await deleteStudyMaterial(id)
      await loadRows()
    } catch (e) {
      setError(e?.message || 'Failed to delete study material')
    } finally {
      setSaving(false)
    }
  }

  const renderEntryForm = (form, setForm, fileRef, setFile) => {
    const localClassOptions = classesLookup
      .filter((c) => !form.schoolId || form.schoolId === 'Select' || String(c.schoolId) === String(form.schoolId))
      .slice()
      .sort((a, b) => String(a.className || '').localeCompare(String(b.className || '')))

    const localSubjectOptions = subjectsLookup
      .filter((s) => {
        if (!form.schoolId || form.schoolId === 'Select') return true
        if (String(s.schoolId) !== String(form.schoolId)) return false
        if (form.classId && form.classId !== 'Select' && String(s.classId) !== String(form.classId)) return false
        return true
      })
      .slice()
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))

    const onChange = (e) => {
      const { id, value } = e.target
      setForm((prev) => {
        if (id === 'schoolId') return { ...prev, schoolId: value, classId: 'Select', subjectId: 'Select' }
        if (id === 'classId') return { ...prev, classId: value, subjectId: 'Select' }
        return { ...prev, [id]: value }
      })
      setFormErrors((prev) => ({ ...prev, [id]: '' }))
    }

    return (
      <div className="avm-grid">
        <FormField label="School Name" required>
          <select id="schoolId" className={`form-control form-select ps-44${formErrors.schoolId ? ' is-invalid' : ''}`} value={form.schoolId} onChange={onChange} disabled={saving}>
            <option value="Select">--Select School--</option>
            {schoolsLookup.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.schoolName}
              </option>
            ))}
          </select>
          {formErrors.schoolId ? <div className="text-danger-600 text-sm mt-4">{formErrors.schoolId}</div> : null}
        </FormField>

        <FormField label="Class" required>
          <select id="classId" className={`form-control form-select ps-44${formErrors.classId ? ' is-invalid' : ''}`} value={form.classId} onChange={onChange} disabled={saving}>
            <option value="Select">--Select Class--</option>
            {localClassOptions.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.className}
              </option>
            ))}
          </select>
          {formErrors.classId ? <div className="text-danger-600 text-sm mt-4">{formErrors.classId}</div> : null}
        </FormField>

        <FormField label="Subject" required>
          <select id="subjectId" className={`form-control form-select ps-44${formErrors.subjectId ? ' is-invalid' : ''}`} value={form.subjectId} onChange={onChange} disabled={saving}>
            <option value="Select">--Select Subject--</option>
            {localSubjectOptions.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
          {formErrors.subjectId ? <div className="text-danger-600 text-sm mt-4">{formErrors.subjectId}</div> : null}
        </FormField>

        <FormField label="Title" required full>
          <input id="title" className={`form-control ps-44${formErrors.title ? ' is-invalid' : ''}`} value={form.title} onChange={onChange} disabled={saving} />
          {formErrors.title ? <div className="text-danger-600 text-sm mt-4">{formErrors.title}</div> : null}
        </FormField>

        <FormField label="Description" full>
          <textarea id="description" className="form-control ps-44" rows={3} value={form.description} onChange={onChange} disabled={saving} />
        </FormField>

        <FormField label="Material" full>
          <input ref={fileRef} type="file" accept={ACCEPTED_DOC_TYPES} className="form-control ps-44" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={saving} />
          <div className="text-secondary-light text-sm mt-4">Accepted: {ACCEPTED_DOC_LABEL}</div>
        </FormField>
      </div>
    )
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Study Material</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Study Material</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="card mb-16">
          <div className="card-body px-20 py-12 text-danger-600">{error}</div>
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 p-20">
            <div className="d-flex align-items-center gap-8">
              {canManage ? (
                <button type="button" className="btn btn-primary-600" onClick={openAdd} disabled={saving}>
                  + Add
                </button>
              ) : null}
              <button type="button" className="btn btn-secondary-600" onClick={() => setIsFindSidebarOpen(true)}>
                Find
              </button>
            </div>

            <div className="d-flex align-items-center gap-8">
              <div className="position-relative">
                <input
                  className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                  placeholder="Search..."
                  value={search}
                  disabled={!hasSearched}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                  <i className="ri-search-line"></i>
                </span>
              </div>
              <div className="dropdown">
                <button className="btn btn-light border dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  Columns ({visibleColumnCount})
                </button>
                <ul className="dropdown-menu p-2" style={{ minWidth: 240 }}>
                  {columnOptions.map((col) => (
                    <li key={col.key} className="dropdown-item">
                      <label className="d-flex align-items-center gap-8 m-0">
                        <input type="checkbox" checked={visibleColumns[col.key]} onChange={() => toggleColumn(col.key)} />
                        <span>{col.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {!hasSearched ? (
            <div className="px-20 py-40 text-center text-secondary-light">
              Use <strong>Find</strong> to select School, Class and Subject.
            </div>
          ) : loading ? (
            <div className="px-20 py-40 text-center text-secondary-light">Loading...</div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: 48 }}>
                        <input type="checkbox" checked={allSelected} onChange={handleSelectAll} />
                      </th>
                      {visibleColumns.school && <th>School</th>}
                      {visibleColumns.className && <th>Class</th>}
                      {visibleColumns.subjectName && <th>Subject</th>}
                      {visibleColumns.title && <th>Title</th>}
                      {visibleColumns.fileName && <th>File</th>}
                      <th style={{ width: 160 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-24 text-secondary-light">
                          No materials found.
                        </td>
                      </tr>
                    ) : (
                      paginated.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <input type="checkbox" checked={selectedRows.includes(r.id)} onChange={() => handleSelectRow(r.id)} />
                          </td>
                          {visibleColumns.school && <td>{r.schoolName || r.schoolId}</td>}
                          {visibleColumns.className && <td>{r.className || r.classId}</td>}
                          {visibleColumns.subjectName && <td>{r.subjectName || r.subjectId}</td>}
                          {visibleColumns.title && <td className="fw-medium text-primary-light">{r.title}</td>}
                          {visibleColumns.fileName && (
                            <td>
                              {r.fileName ? (
                                <span className="d-inline-flex align-items-center gap-8">
                                  <i className={getFileIcon(r.fileName)}></i>
                                  <span>{r.fileName}</span>
                                </span>
                              ) : (
                                <span className="text-secondary-light">-</span>
                              )}
                            </td>
                          )}
                          <td>
                            <div className="d-flex gap-8">
                              <button type="button" className="btn btn-sm btn-primary-600" onClick={() => openEdit(r)} disabled={!canManage || saving}>
                                Edit
                              </button>
                              <button type="button" className="btn btn-sm btn-danger-600" onClick={() => handleDelete(r)} disabled={!canManage || saving}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="d-flex align-items-center justify-content-between p-20 flex-wrap gap-16">
                <div className="d-flex align-items-center gap-8">
                  <span className="text-secondary-light">Rows per page:</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 90 }}
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
                <div className="d-flex align-items-center gap-8">
                  <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    Prev
                  </button>
                  <span className="text-secondary-light text-sm">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <WizardPopup
        modalWidth="780px"
        open={isAddOpen}
        title="Add Study Material"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={submitAdd}
        submitLabel={saving ? 'Saving...' : 'Save'}
      >
        {renderEntryForm(addForm, setAddForm, addFileRef, setAddFile)}
      </WizardPopup>

      <WizardPopup
        modalWidth="780px"
        open={isEditOpen}
        title="Edit Study Material"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={submitEdit}
        submitLabel={saving ? 'Updating...' : 'Update'}
      >
        {renderEntryForm(editForm, setEditForm, editFileRef, setEditFile)}
      </WizardPopup>

      <SlideSidebar isOpen={isFindSidebarOpen} title="Find Study Material" onClose={() => setIsFindSidebarOpen(false)} className="filter-sidebar">
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School <span className="text-danger-600">*</span>
            </label>
            <select id="schoolId" className={`form-control form-select${findErrors.schoolId ? ' is-invalid' : ''}`} value={pendingFilters.schoolId} onChange={handlePendingFilterChange}>
              <option value="Select">--Select School--</option>
              {schoolsLookup.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.schoolName}
                </option>
              ))}
            </select>
            {findErrors.schoolId ? <div className="text-danger-600 text-sm mt-4">{findErrors.schoolId}</div> : null}
          </div>

          <div>
            <label htmlFor="classId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class <span className="text-danger-600">*</span>
            </label>
            <select id="classId" className={`form-control form-select${findErrors.classId ? ' is-invalid' : ''}`} value={pendingFilters.classId} onChange={handlePendingFilterChange}>
              <option value="Select">--Select--</option>
              {classOptions.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.className}
                </option>
              ))}
            </select>
            {findErrors.classId ? <div className="text-danger-600 text-sm mt-4">{findErrors.classId}</div> : null}
          </div>

          <div>
            <label htmlFor="subjectId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Subject <span className="text-danger-600">*</span>
            </label>
            <select id="subjectId" className={`form-control form-select${findErrors.subjectId ? ' is-invalid' : ''}`} value={pendingFilters.subjectId} onChange={handlePendingFilterChange}>
              <option value="Select">--Select--</option>
              {subjectOptions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
            {findErrors.subjectId ? <div className="text-danger-600 text-sm mt-4">{findErrors.subjectId}</div> : null}
          </div>

          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
              Reset
            </button>
          </div>
          <div>
            <button type="submit" className="btn btn-primary-600 w-100" disabled={loading}>
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default StudyMaterial

