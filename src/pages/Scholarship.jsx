import { useCallback, useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import ExportDropdown from '../components/ExportDropdown'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import TablePagination from '../components/table/TablePagination'
import '../assets/css/addModalShared.css'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchStudentsByClassSection } from '../apis/studentsApi'
import { createScholarship, deleteScholarship, fetchScholarshipsPage, updateScholarship } from '../apis/scholarshipsApi'

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

const emptyFilters = {
  headOfficeId: 'Select',
  schoolId: 'Select',
  classId: 'Select',
  sectionId: 'Select',
}

const STEPS = ['Basic']

const FIELD_ICONS = {
  Candidate: 'ri-user-3-line',
  Amount: 'ri-money-dollar-circle-line',
  'Payment Date': 'ri-calendar-2-line',
  Note: 'ri-sticky-note-line',
  Class: 'ri-building-line',
  Section: 'ri-layout-grid-line',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'studentName', label: 'Candidate' },
  { key: 'className', label: 'Class' },
  { key: 'sectionName', label: 'Section' },
  { key: 'rollNo', label: 'Roll No' },
  { key: 'amount', label: 'Amount' },
  { key: 'paymentDate', label: 'Payment Date' },
  { key: 'note', label: 'Note' },
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

const unwrapCollection = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.content)) return value.content
  return []
}

const schoolLabel = (row) => row?.schoolName || row?.name || ''
const classLabel = (row) => row?.className || row?.numericName || row?.name || ''
const sectionLabel = (row) => row?.name || row?.sectionName || ''
const studentLabel = (row) => row?.name || row?.studentName || ''

const getSchoolById = (rows, schoolId) =>
  (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(schoolId ?? '')) || null

const formatAmount = (value) => {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(n)) return ''
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n)
}

const Scholarship = () => {
  const [rows, setRows] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [schoolsLookup, setSchoolsLookup] = useState([])
  const [classesLookup, setClassesLookup] = useState([])
  const [sectionsLookup, setSectionsLookup] = useState([])

  const [addStudentOptions, setAddStudentOptions] = useState([])
  const [editStudentOptions, setEditStudentOptions] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [editingId, setEditingId] = useState(null)

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [selectedRows, setSelectedRows] = useState([])

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptionsFor = useCallback(
    (headOfficeId) =>
      schoolsLookup
        .filter((s) => !headOfficeId || String(s?.headOfficeId ?? '') === String(headOfficeId))
        .slice()
        .sort((a, b) => schoolLabel(a).localeCompare(schoolLabel(b))),
    [schoolsLookup],
  )

  const formClassOptions = useCallback(
    (schoolId) =>
      classesLookup
        .filter((row) => !schoolId || String(row?.schoolId ?? '') === String(schoolId))
        .slice()
        .sort((a, b) => classLabel(a).localeCompare(classLabel(b))),
    [classesLookup],
  )

  const formSectionOptions = useCallback(
    (schoolId, classId) =>
      sectionsLookup
        .filter((row) => {
          if (schoolId && String(row?.schoolId ?? '') !== String(schoolId)) return false
          if (classId && String(row?.classId ?? '') !== String(classId)) return false
          return true
        })
        .slice()
        .sort((a, b) => sectionLabel(a).localeCompare(sectionLabel(b))),
    [sectionsLookup],
  )

  const loadLookups = useCallback(async () => {
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
  }, [])

  const loadScholarships = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchScholarshipsPage(currentPage - 1, rowsPerPage, {
        headOfficeId: filters.headOfficeId !== 'Select' ? filters.headOfficeId : undefined,
        schoolId: filters.schoolId !== 'Select' ? filters.schoolId : undefined,
        classId: filters.classId !== 'Select' ? filters.classId : undefined,
        sectionId: filters.sectionId !== 'Select' ? filters.sectionId : undefined,
        search: search.trim(),
      })
      setRows(Array.isArray(data?.content) ? data.content : [])
      setTotalElements(Number.isFinite(data?.totalElements) ? Number(data.totalElements) : 0)
      setTotalPages(Math.max(1, Number.isFinite(data?.totalPages) ? Number(data.totalPages) : 1))
    } catch (e) {
      setRows([])
      setTotalElements(0)
      setTotalPages(1)
      setError(e?.message || 'Failed to load scholarships')
    } finally {
      setLoading(false)
    }
  }, [currentPage, rowsPerPage, filters, search])

  useEffect(() => {
    loadLookups().catch(() => {})
  }, [loadLookups])

  useEffect(() => {
    loadScholarships().catch(() => {})
  }, [loadScholarships, refreshKey])

  useEffect(() => {
    if (!isAddOpen) return
    const schoolId = addForm.schoolId
    if (!schoolId) {
      setAddStudentOptions([])
      return
    }
    fetchStudentsByClassSection({
      schoolId,
      classId: addForm.classId,
      sectionId: addForm.sectionId,
    })
      .then((list) => {
        const sorted = (Array.isArray(list) ? list : []).slice().sort((a, b) => studentLabel(a).localeCompare(studentLabel(b)))
        setAddStudentOptions(sorted)
      })
      .catch(() => setAddStudentOptions([]))
  }, [isAddOpen, addForm.schoolId, addForm.classId, addForm.sectionId])

  useEffect(() => {
    if (!isEditOpen) return
    const schoolId = editForm.schoolId
    if (!schoolId) {
      setEditStudentOptions([])
      return
    }
    fetchStudentsByClassSection({
      schoolId,
      classId: editForm.classId,
      sectionId: editForm.sectionId,
    })
      .then((list) => {
        const sorted = (Array.isArray(list) ? list : []).slice().sort((a, b) => studentLabel(a).localeCompare(studentLabel(b)))
        setEditStudentOptions(sorted)
      })
      .catch(() => setEditStudentOptions([]))
  }, [isEditOpen, editForm.schoolId, editForm.classId, editForm.sectionId])

  const allSelected = rows.length > 0 && rows.every((r) => selectedRows.includes(String(r.id)))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...rows.map((r) => String(r.id))])])
      return
    }
    setSelectedRows((prev) => prev.filter((id) => !rows.some((r) => String(r.id) === id)))
  }

  const handleSelectRow = (id) => setSelectedRows((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

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
    setFilters(pendingFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const openAdd = () => {
    setAddForm(emptyForm)
    setAddStudentOptions([])
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    const school = getSchoolById(schoolsLookup, row?.schoolId)
    setEditingId(row?.id ?? null)
    setEditForm({
      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : '',
      schoolId: row?.schoolId != null ? String(row.schoolId) : '',
      classId: row?.classId != null ? String(row.classId) : '',
      sectionId: row?.sectionId != null ? String(row.sectionId) : '',
      studentId: row?.studentId != null ? String(row.studentId) : '',
      amount: row?.amount != null ? String(row.amount) : '',
      paymentDate: row?.paymentDate ? String(row.paymentDate) : '',
      note: row?.note || '',
    })
    setEditStudentOptions([])
    setEditStep(0)
    setIsEditOpen(true)
  }

  const handleCreate = async () => {
    setSaving(true)
    setError('')
    try {
      await createScholarship({
        schoolId: addForm.schoolId ? Number(addForm.schoolId) : null,
        classId: addForm.classId ? Number(addForm.classId) : null,
        sectionId: addForm.sectionId ? Number(addForm.sectionId) : null,
        studentId: addForm.studentId ? Number(addForm.studentId) : null,
        amount: addForm.amount === '' ? null : Number(addForm.amount),
        paymentDate: addForm.paymentDate || null,
        note: addForm.note || null,
      })
      setIsAddOpen(false)
      setRefreshKey((k) => k + 1)
    } catch (e) {
      setError(e?.message || 'Failed to create scholarship')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (editingId == null) return
    setSaving(true)
    setError('')
    try {
      await updateScholarship(editingId, {
        schoolId: editForm.schoolId ? Number(editForm.schoolId) : null,
        classId: editForm.classId ? Number(editForm.classId) : null,
        sectionId: editForm.sectionId ? Number(editForm.sectionId) : null,
        studentId: editForm.studentId ? Number(editForm.studentId) : null,
        amount: editForm.amount === '' ? null : Number(editForm.amount),
        paymentDate: editForm.paymentDate || null,
        note: editForm.note || null,
      })
      setIsEditOpen(false)
      setEditingId(null)
      setRefreshKey((k) => k + 1)
    } catch (e) {
      setError(e?.message || 'Failed to update scholarship')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (id == null) return
    // eslint-disable-next-line no-alert
    const ok = window.confirm('Delete this scholarship?')
    if (!ok) return
    setSaving(true)
    setError('')
    try {
      await deleteScholarship(id)
      setSelectedRows((prev) => prev.filter((rowId) => String(rowId) !== String(id)))
      setRefreshKey((k) => k + 1)
    } catch (e) {
      setError(e?.message || 'Failed to delete scholarship')
    } finally {
      setSaving(false)
    }
  }

  const pageInfo = useMemo(() => {
    const total = Number.isFinite(totalElements) ? totalElements : 0
    const start = total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
    const end = total === 0 ? 0 : Math.min(currentPage * rowsPerPage, total)
    return `Showing ${start} - ${end} of ${total} entries`
  }, [currentPage, rowsPerPage, totalElements])

  const renderForm = (form, setter, studentOptions) => (
    <>
      <p className="avm-section-title">Basic Information</p>
      <div className="avm-grid">
        <ManualScopeSelectors
          enabled
          headOffices={headOffices}
          schoolOptions={schoolOptionsFor(form.headOfficeId)}
          selectedHeadOfficeId={form.headOfficeId}
          onHeadOfficeChange={(value) =>
            setter((prev) => ({
              ...prev,
              headOfficeId: value || '',
              schoolId: '',
              classId: '',
              sectionId: '',
              studentId: '',
            }))
          }
          selectedSchoolId={form.schoolId}
          onSchoolChange={(value) =>
            setter((prev) => ({
              ...prev,
              schoolId: value || '',
              classId: '',
              sectionId: '',
              studentId: '',
            }))
          }
          schoolLabel="School"
        />

        <FormField label="Class" required full>
          <select
            className="avm-select"
            id="classId"
            value={form.classId}
            onChange={(e) => {
              const value = e.target.value
              setter((prev) => ({ ...prev, classId: value, sectionId: '', studentId: '' }))
            }}
            disabled={!form.schoolId}
          >
            <option value="">{form.schoolId ? '--Select--' : 'Select School First'}</option>
            {formClassOptions(form.schoolId).map((row) => (
              <option key={row.id} value={String(row.id)}>
                {classLabel(row)}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Section" required full>
          <select
            className="avm-select"
            id="sectionId"
            value={form.sectionId}
            onChange={(e) => {
              const value = e.target.value
              setter((prev) => ({ ...prev, sectionId: value, studentId: '' }))
            }}
            disabled={!form.schoolId || !form.classId}
          >
            <option value="">{form.classId ? '--Select--' : 'Select Class First'}</option>
            {formSectionOptions(form.schoolId, form.classId).map((row) => (
              <option key={row.id} value={String(row.id)}>
                {sectionLabel(row)}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Candidate" required full>
          <select
            className="avm-select"
            id="studentId"
            value={form.studentId}
            onChange={handleChange(setter)}
            disabled={!form.schoolId || !form.classId || !form.sectionId}
          >
            <option value="">
              {form.sectionId ? '--Select--' : 'Select School/Class/Section First'}
            </option>
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
            onChange={handleChange(setter)}
            min="0"
          />
        </FormField>

        <FormField label="Payment Date" required>
          <input type="date" className="avm-input" id="paymentDate" value={form.paymentDate} onChange={handleChange(setter)} />
        </FormField>

        <FormField label="Note" full>
          <textarea rows={4} className="avm-input avm-textarea" id="note" placeholder="Note" value={form.note} onChange={handleChange(setter)} />
        </FormField>
      </div>
    </>
  )

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Scholarship</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Scholarship</span>
          </div>
        </div>
        <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <span className="d-flex text-md">
            <i className="ri-add-large-line"></i>
          </span>
          Add Scholarship
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" onClick={() => setIsFilterSidebarOpen(true)}>
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
                        <input type="checkbox" className="form-check-input mt-0" checked={visibleColumns[column.key]} onChange={() => toggleColumn(column.key)} />
                        {column.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <RowsPerPageSelect
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(next) => {
                  setRowsPerPage(next)
                  setCurrentPage(1)
                }}
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search scholarships..."
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
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.schoolName ? <th scope="col">School</th> : null}
                  {visibleColumns.studentName ? <th scope="col">Candidate</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.sectionName ? <th scope="col">Section</th> : null}
                  {visibleColumns.rollNo ? <th scope="col">Roll No</th> : null}
                  {visibleColumns.amount ? <th scope="col">Amount</th> : null}
                  {visibleColumns.paymentDate ? <th scope="col">Payment Date</th> : null}
                  {visibleColumns.note ? <th scope="col">Note</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center py-40 text-secondary-light">
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center py-40 text-danger-600">
                      {error}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center py-40 text-secondary-light">
                      No scholarships found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id ?? idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" checked={selectedRows.includes(String(row.id))} onChange={() => handleSelectRow(String(row.id))} />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.schoolName ? <td>{row.schoolName}</td> : null}
                      {visibleColumns.studentName ? <td className="fw-medium text-primary-light">{row.studentName}</td> : null}
                      {visibleColumns.className ? <td>{row.className}</td> : null}
                      {visibleColumns.sectionName ? <td>{row.sectionName}</td> : null}
                      {visibleColumns.rollNo ? <td>{row.rollNo}</td> : null}
                      {visibleColumns.amount ? (
                        <td>
                          <span className="fw-semibold text-success-600">{formatAmount(row.amount)}</span>
                        </td>
                      ) : null}
                      {visibleColumns.paymentDate ? <td>{row.paymentDate}</td> : null}
                      {visibleColumns.note ? (
                        <td>
                          {row.note ? (
                            <span
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                maxWidth: 200,
                                fontSize: '0.85rem',
                                color: '#5a6472',
                              }}
                            >
                              {row.note}
                            </span>
                          ) : (
                            <span className="text-secondary-light">-</span>
                          )}
                        </td>
                      ) : null}
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
                            onClick={() => handleDelete(row.id)}
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

          <TablePagination
            paginationProps={{
              currentPage,
              totalPages,
              pageInfo,
              onPageChange: (page) => setCurrentPage(Math.min(Math.max(1, page), totalPages)),
            }}
          />
        </div>
      </div>

      <WizardPopup
        modalWidth="760px"
        open={isAddOpen}
        title="Add Scholarship"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleCreate}
        submitLabel={saving ? 'Saving...' : 'Save'}
      >
        {renderForm(addForm, setAddForm, addStudentOptions)}
      </WizardPopup>

      <WizardPopup
        modalWidth="760px"
        open={isEditOpen}
        title="Edit Scholarship"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleUpdate}
        submitLabel={saving ? 'Saving...' : 'Update'}
      >
        {renderForm(editForm, setEditForm, editStudentOptions)}
      </WizardPopup>

      <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter Scholarships" onClose={() => setIsFilterSidebarOpen(false)} className="filter-sidebar">
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <ManualScopeSelectors
              enabled
              headOffices={headOffices}
              schoolOptions={schoolOptionsFor(pendingFilters.headOfficeId === 'Select' ? '' : pendingFilters.headOfficeId)}
              selectedHeadOfficeId={pendingFilters.headOfficeId === 'Select' ? '' : pendingFilters.headOfficeId}
              onHeadOfficeChange={(value) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  headOfficeId: value || 'Select',
                  schoolId: 'Select',
                  classId: 'Select',
                  sectionId: 'Select',
                }))
              }
              selectedSchoolId={pendingFilters.schoolId === 'Select' ? '' : pendingFilters.schoolId}
              onSchoolChange={(value) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  schoolId: value || 'Select',
                  classId: 'Select',
                  sectionId: 'Select',
                }))
              }
              schoolLabel="School"
            />
          </div>

          <div>
            <label htmlFor="classId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class
            </label>
            <select id="classId" className="form-control form-select" value={pendingFilters.classId} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              {classesLookup
                .filter((row) => {
                  const schoolId = pendingFilters.schoolId !== 'Select' ? pendingFilters.schoolId : ''
                  if (schoolId) return String(row?.schoolId ?? '') === String(schoolId)
                  const hoId = pendingFilters.headOfficeId !== 'Select' ? pendingFilters.headOfficeId : ''
                  if (!hoId) return true
                  const schoolIds = new Set(schoolOptionsFor(hoId).map((s) => String(s?.id ?? '')))
                  return schoolIds.has(String(row?.schoolId ?? ''))
                })
                .slice()
                .sort((a, b) => classLabel(a).localeCompare(classLabel(b)))
                .map((row) => (
                  <option key={row.id} value={String(row.id)}>
                    {classLabel(row)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="sectionId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Section
            </label>
            <select id="sectionId" className="form-control form-select" value={pendingFilters.sectionId} onChange={handlePendingFilterChange}>
              <option value="Select">Select</option>
              {sectionsLookup
                .filter((row) => {
                  const schoolId = pendingFilters.schoolId !== 'Select' ? pendingFilters.schoolId : ''
                  if (schoolId && String(row?.schoolId ?? '') !== String(schoolId)) return false
                  const classId = pendingFilters.classId !== 'Select' ? pendingFilters.classId : ''
                  if (classId && String(row?.classId ?? '') !== String(classId)) return false
                  const hoId = pendingFilters.headOfficeId !== 'Select' ? pendingFilters.headOfficeId : ''
                  if (!hoId) return true
                  const schoolIds = new Set(schoolOptionsFor(hoId).map((s) => String(s?.id ?? '')))
                  return schoolIds.has(String(row?.schoolId ?? ''))
                })
                .slice()
                .sort((a, b) => sectionLabel(a).localeCompare(sectionLabel(b)))
                .map((row) => (
                  <option key={row.id} value={String(row.id)}>
                    {sectionLabel(row)}
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

export default Scholarship

