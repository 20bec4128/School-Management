import { useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchDesignations } from '../apis/designationsApi'
import { fetchSchoolRoles } from '../apis/schoolRbacApi'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import {
  createLeaveType,
  deleteLeaveType,
  fetchLeaveTypes,
  updateLeaveType,
} from '../apis/leaveTypeApi'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import { TablePagination } from '../components/table'

const makeEmptyForm = (defaultSchoolId = '', defaultApplicantType = '') => ({
  headOfficeId: '',
  schoolId: defaultSchoolId ? String(defaultSchoolId) : '',
  applicantType: defaultApplicantType,
  designationId: '',
  leaveType: '',
  allowedLeavesPerYear: '',
})

const emptyFilters = {
  headOfficeId: 'Select',
  schoolId: 'Select',
  applicantType: 'Select',
  designation: 'Select',
}

const STEPS = ['Basic Information']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Applicant Type': 'ri-user-3-line',
  Designation: 'ri-award-line',
  'Leave Type': 'ri-calendar-line',
  'Allowed Leaves count/year': 'ri-number-1',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'applicantType', label: 'Applicant Type' },
  { key: 'designationName', label: 'Designation' },
  { key: 'leaveType', label: 'Leave Type' },
  { key: 'allowedLeavesPerYear', label: 'Allowed Leaves count/year' },
]

const normalizeApplicantType = (value) => String(value || '').trim().toUpperCase()

const formatRoleLabel = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase())

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

const EDIT_STORAGE_KEY = 'edit-leave-type-row'

const LeaveType = ({ onNavigate } = {}) => {
  const {
    status,
    token,
    user,
    role: authRole,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    headOfficeId: authHeadOfficeId,
  } = useAuth()
  const role = useMemo(
    () => normalizeRole(authRole || user?.role || user?.userRole || user?.authority),
    [authRole, user],
  )
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const isStudentRole = role === 'STUDENT'
  const isFixedSchoolRole = isSchoolAdmin || isStudentRole
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : null

  const [rows, setRows] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [schools, setSchools] = useState([])
  const [applicantRoles, setApplicantRoles] = useState([])
  const [designations, setDesignations] = useState([])
  const [scopeSchoolId, setScopeSchoolId] = useState(() =>
    isFixedSchoolRole && authSchoolId != null ? String(authSchoolId) : '',
  )

  const [busy, setBusy] = useState(false)
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
  const [editingId, setEditingId] = useState(null)
  const [addForm, setAddForm] = useState(makeEmptyForm())
  const [editForm, setEditForm] = useState(makeEmptyForm())

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolsById = useMemo(() => {
    const map = new Map()
    for (const item of Array.isArray(schools) ? schools : []) {
      if (item?.id == null) continue
      map.set(String(item.id), item)
    }
    return map
  }, [schools])

  const headOfficesById = useMemo(() => {
    const map = new Map()
    for (const item of Array.isArray(headOffices) ? headOffices : []) {
      if (item?.id == null) continue
      map.set(String(item.id), item)
    }
    return map
  }, [headOffices])

  const designationsById = useMemo(() => {
    const map = new Map()
    for (const item of Array.isArray(designations) ? designations : []) {
      if (item?.id == null) continue
      map.set(String(item.id), item)
    }
    return map
  }, [designations])

  const resolveSchoolName = (schoolId, fallback = '') => {
    if (schoolId == null) return fallback || ''
    const row = schoolsById.get(String(schoolId))
    return row?.schoolName || row?.name || fallback || (schoolId === authSchoolId ? authSchoolName : '') || ''
  }

  const resolveHeadOfficeName = (headOfficeId, fallback = '') => {
    if (headOfficeId == null) return fallback || ''
    const row = headOfficesById.get(String(headOfficeId))
    return row?.name || row?.headOfficeName || fallback || `Head Office ${headOfficeId}`
  }

  const resolveDesignationName = (designationId, fallback = '') => {
    if (designationId == null) return fallback || ''
    const row = designationsById.get(String(designationId))
    return row?.name || row?.designation || fallback || ''
  }

  const availableApplicantRoles = useMemo(
    () =>
      (Array.isArray(applicantRoles) ? applicantRoles : []).filter((item) => {
        const roleName = normalizeApplicantType(item?.name)
        return roleName && roleName !== 'SUPER_ADMIN' && roleName !== 'HEAD_OFFICE_ADMIN'
      }),
    [applicantRoles],
  )

  const loadApplicantRolesForSchool = async (schoolId) => {
    if (!schoolId || String(schoolId).trim() === '') {
      setApplicantRoles([])
      return
    }
    const data = await fetchSchoolRoles({ schoolId: Number(schoolId) })
    setApplicantRoles(Array.isArray(data) ? data : [])
  }

  const filterSchoolOptions = useMemo(() => {
    const values = []
    const seen = new Set()
    const selectedHeadOfficeId =
      isSuperAdmin && pendingFilters.headOfficeId !== 'Select' ? String(pendingFilters.headOfficeId) : ''

    const push = (schoolId, schoolName, headOfficeId) => {
      if (schoolId == null) return
      if (selectedHeadOfficeId && String(headOfficeId ?? '') !== selectedHeadOfficeId) return
      if (isHeadOfficeAdmin && String(headOfficeId ?? '') !== String(authHeadOfficeId ?? '')) return
      const id = String(schoolId)
      if (seen.has(id)) return
      seen.add(id)
      values.push({
        id,
        schoolName: schoolName || `School ${schoolId}`,
      })
    }

    for (const item of schools) {
      push(item?.id, item?.schoolName || item?.name, item?.headOfficeId)
    }

    for (const row of rows) {
      push(
        row.schoolId,
        row.schoolName,
        row.headOfficeId ?? schoolsById.get(String(row.schoolId ?? ''))?.headOfficeId ?? null,
      )
    }

    if (isFixedSchoolRole && authSchoolId != null) {
      push(authSchoolId, authSchoolName || `School ${authSchoolId}`, authHeadOfficeId)
    }

    return values.sort((a, b) => a.schoolName.localeCompare(b.schoolName))
  }, [
    rows,
    schools,
    schoolsById,
    pendingFilters.headOfficeId,
    isSuperAdmin,
    isHeadOfficeAdmin,
    isFixedSchoolRole,
    authHeadOfficeId,
    authSchoolId,
    authSchoolName,
  ])

  const designationOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((item) => item.designationName).filter(Boolean).map((value) => String(value).trim())),
      ).sort((a, b) => a.localeCompare(b)),
    [rows],
  )

  const applicantTypeFilterOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((item) => item.applicantType).filter(Boolean).map((value) => String(value).trim())),
      ).sort((a, b) => a.localeCompare(b)),
    [rows],
  )

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        [
          row.schoolName,
          row.applicantType,
          row.designationName,
          row.leaveType,
          String(row.allowedLeavesPerYear ?? ''),
        ]
          .join(' ')
          .toLowerCase()
          .includes(q)
      const rowHeadOfficeId = row.headOfficeId ?? schoolsById.get(String(row.schoolId ?? ''))?.headOfficeId ?? null
      const matchesHeadOffice =
        filters.headOfficeId === 'Select' || String(rowHeadOfficeId ?? '') === String(filters.headOfficeId)
      const matchesSchool =
        filters.schoolId === 'Select' || String(row.schoolId ?? '') === String(filters.schoolId)
      const matchesApplicantType =
        filters.applicantType === 'Select' || row.applicantType === filters.applicantType
      const matchesDesignation =
        filters.designation === 'Select' || row.designationName === filters.designation
      return matchesSearch && matchesHeadOffice && matchesSchool && matchesApplicantType && matchesDesignation
    })
  }, [rows, search, filters, schoolsById])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [currentPage, filteredRows, rowsPerPage])

  const allSelected = paginatedRows.length > 0 && paginatedRows.every((row) => selectedRows.includes(String(row.id)))

  const getListingSchoolIdNumber = () => {
    if (isFixedSchoolRole) return authSchoolId
    if (isHeadOfficeAdmin) return scopeSchoolId ? Number(scopeSchoolId) : null
    return null
  }

  const loadSchools = async () => {
    if (!isSuperAdmin && !isHeadOfficeAdmin) {
      setSchools([])
      setHeadOffices([])
      return
    }
    try {
      const [schoolList, headOfficePage] = await Promise.all([
        fetchSchoolsLookup(),
        isSuperAdmin ? fetchHeadOfficesPage(0, 500) : Promise.resolve({ content: [] }),
      ])
      setSchools(Array.isArray(schoolList) ? schoolList : [])
      setHeadOffices(
        Array.isArray(headOfficePage?.content)
          ? headOfficePage.content.map((item) => ({
              ...item,
              name: item?.name || item?.headOfficeName || '',
            }))
          : [],
      )
    } catch {
      setSchools([])
      setHeadOffices([])
    }
  }

  const loadDesignationsForSchool = async (schoolId, applicantType) => {
    const normalizedApplicantType = normalizeApplicantType(applicantType)
    if (
      !schoolId ||
      String(schoolId).trim() === '' ||
      !normalizedApplicantType ||
      normalizedApplicantType === 'STUDENT'
    ) {
      setDesignations([])
      return
    }
    const matchesApplicantType = (item) =>
      normalizeApplicantType(item?.role || item?.applicantType || item?.designationType || '') === normalizedApplicantType

    const primary = await fetchDesignations({
      schoolId: Number(schoolId),
      role: normalizedApplicantType,
    }).catch(() => [])
    const primaryList = Array.isArray(primary) ? primary.filter(matchesApplicantType) : []

    if (primaryList.length > 0) {
      setDesignations(primaryList)
      return
    }

    const fallback = await fetchDesignations({
      schoolId: Number(schoolId),
    }).catch(() => [])
    setDesignations(Array.isArray(fallback) ? fallback.filter(matchesApplicantType) : [])
  }

  const loadRows = async (schoolId = null) => {
    if (isHeadOfficeAdmin && !schoolId) {
      setRows([])
      return
    }

    const querySchoolId = isFixedSchoolRole
      ? authSchoolId
      : isHeadOfficeAdmin
        ? schoolId
        : schoolId

    const data = await fetchLeaveTypes(querySchoolId != null ? { schoolId: querySchoolId } : {})
    const list = Array.isArray(data) ? data : []
    setRows(
      list.map((item) => ({
        id: item?.id,
        schoolId: item?.schoolId ?? querySchoolId ?? null,
        schoolName: item?.schoolName || resolveSchoolName(item?.schoolId ?? querySchoolId, ''),
        designationId: item?.designationId ?? null,
        designationName: item?.designationName || resolveDesignationName(item?.designationId, ''),
        applicantType: item?.applicantType || '',
        leaveType: item?.leaveType || '',
        allowedLeavesPerYear: item?.allowedLeavesPerYear ?? '',
      })),
    )
  }

  useEffect(() => {
    if (isFixedSchoolRole && authSchoolId != null) {
      setScopeSchoolId(String(authSchoolId))
    }
  }, [isFixedSchoolRole, authSchoolId])

  useEffect(() => {
    if (status !== 'ready' || !token) return

    let active = true
    const run = async () => {
      setError('')
      setBusy(true)
      try {
        await loadSchools()
        const initialSchoolId = (() => {
          if (isFixedSchoolRole) return authSchoolId
          if (isHeadOfficeAdmin) return scopeSchoolId ? Number(scopeSchoolId) : null
          return null
        })()
        if (initialSchoolId) {
          await loadApplicantRolesForSchool(initialSchoolId)
        } else {
          setApplicantRoles([])
        }
        if (isFixedSchoolRole) {
          await loadRows(authSchoolId)
        } else if (isSuperAdmin) {
          await loadRows()
        } else if (isHeadOfficeAdmin) {
          if (scopeSchoolId) {
            await loadRows(Number(scopeSchoolId))
          } else if (active) {
            setRows([])
          }
        }
      } catch (e) {
        if (active) setError(e?.message || 'Failed to load leave types')
      } finally {
        if (active) setBusy(false)
      }
    }

    run()
    return () => {
      active = false
    }
  }, [status, token, role, authSchoolId])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    if (!isHeadOfficeAdmin) return

    let active = true
    const run = async () => {
      if (!scopeSchoolId) {
        setRows([])
        setApplicantRoles([])
        return
      }
      setError('')
      setBusy(true)
      try {
        await loadApplicantRolesForSchool(Number(scopeSchoolId))
        await loadRows(Number(scopeSchoolId))
      } catch (e) {
        if (active) setError(e?.message || 'Failed to load leave types')
      } finally {
        if (active) setBusy(false)
      }
    }

    run()
    return () => {
      active = false
    }
  }, [status, token, isHeadOfficeAdmin, scopeSchoolId])

  const handleFormChange = (form, setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => {
      const next = { ...prev, [id]: value }
      if (id === 'headOfficeId') {
        next.schoolId = ''
        next.applicantType = ''
        next.designationId = ''
      }
      if (id === 'schoolId') {
        next.applicantType = ''
        next.designationId = ''
      }
      if (id === 'applicantType') {
        next.designationId = ''
      }
      return next
    })

    if (id === 'headOfficeId') {
      setApplicantRoles([])
      setDesignations([])
      return
    }

    if (id === 'schoolId') {
      void loadApplicantRolesForSchool(value)
      void loadDesignationsForSchool(value, '')
      return
    }

    if (id === 'applicantType') {
      void loadDesignationsForSchool(form.schoolId, value)
    }
  }

  const openAdd = () => {
    if (navigateTo) {
      try {
        sessionStorage.removeItem(EDIT_STORAGE_KEY)
      } catch {}
      navigateTo('add-leave-type')
      return
    }

    const defaultSchoolId = isFixedSchoolRole
      ? authSchoolId
      : isHeadOfficeAdmin
        ? scopeSchoolId || ''
        : ''
    const nextForm = makeEmptyForm(defaultSchoolId, '')
    setAddForm(nextForm)
    setAddStep(0)
    setIsAddOpen(true)
    if (nextForm.schoolId) {
      void loadApplicantRolesForSchool(nextForm.schoolId)
      void loadDesignationsForSchool(nextForm.schoolId, nextForm.applicantType)
    } else {
      setApplicantRoles([])
      setDesignations([])
    }
  }

  const openEdit = (row) => {
    if (navigateTo) {
      try {
        sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row))
      } catch {}
      navigateTo('add-leave-type')
      return
    }

    const rowSchool = row.schoolId != null ? schoolsById.get(String(row.schoolId)) : null
    const nextForm = {
      headOfficeId: rowSchool?.headOfficeId != null ? String(rowSchool.headOfficeId) : '',
      schoolId: row.schoolId != null ? String(row.schoolId) : '',
      applicantType: row.applicantType || '',
      designationId:
        normalizeApplicantType(row.applicantType) === 'STUDENT' || row.designationId == null
          ? ''
          : String(row.designationId),
      leaveType: row.leaveType || '',
      allowedLeavesPerYear:
        row.allowedLeavesPerYear == null ? '' : String(row.allowedLeavesPerYear),
    }
    setEditForm(nextForm)
    setEditingId(row.id)
    setEditStep(0)
    setIsEditOpen(true)
    if (nextForm.schoolId) {
      void loadApplicantRolesForSchool(nextForm.schoolId)
      void loadDesignationsForSchool(nextForm.schoolId, nextForm.applicantType)
    } else {
      setApplicantRoles([])
      setDesignations([])
    }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...paginatedRows.map((row) => String(row.id))])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !paginatedRows.some((row) => String(row.id) === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    if (id === 'headOfficeId') {
      setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: 'Select' }))
      return
    }
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
  }

  const validateForm = (form) => {
    const schoolId = isFixedSchoolRole ? authSchoolId : form.schoolId
    if (!schoolId) return 'School is required.'
    if (!form.applicantType || !String(form.applicantType).trim()) return 'Applicant type is required.'
    if (!form.leaveType || !String(form.leaveType).trim()) return 'Leave type is required.'
    if (form.allowedLeavesPerYear === '' || form.allowedLeavesPerYear == null) {
      return 'Allowed leaves count/year is required.'
    }
    const parsedAllowedLeaves = Number(form.allowedLeavesPerYear)
    if (Number.isNaN(parsedAllowedLeaves) || parsedAllowedLeaves < 0) {
      return 'Allowed leaves count/year must be zero or greater.'
    }
    if (normalizeApplicantType(form.applicantType) !== 'STUDENT' && !form.designationId) {
      return 'Designation is required for non-student applicant types.'
    }
    return ''
  }

  const buildPayload = (form) => {
    const schoolId = isFixedSchoolRole ? authSchoolId : Number(form.schoolId)
    const applicantType = normalizeApplicantType(form.applicantType)
    const isStudentApplicant = applicantType === 'STUDENT'
    return {
      schoolId: Number(schoolId),
      designationId: isStudentApplicant || !form.designationId ? null : Number(form.designationId),
      applicantType,
      leaveType: String(form.leaveType || '').trim(),
      allowedLeavesPerYear: Number(form.allowedLeavesPerYear),
    }
  }

  const refreshRows = async () => {
    await loadRows(getListingSchoolIdNumber())
  }

  const handleCreate = async () => {
    const validationError = validateForm(addForm)
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError('')
    try {
      await createLeaveType(buildPayload(addForm))
      setIsAddOpen(false)
      setAddForm(makeEmptyForm(isFixedSchoolRole ? authSchoolId : '', ''))
      setDesignations([])
      setApplicantRoles([])
      await refreshRows()
    } catch (e) {
      setError(e?.message || 'Failed to create leave type')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    const validationError = validateForm(editForm)
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError('')
    try {
      if (editingId == null) throw new Error('Unable to determine the record to update')
      await updateLeaveType(editingId, buildPayload(editForm))
      setIsEditOpen(false)
      setEditForm(makeEmptyForm(isFixedSchoolRole ? authSchoolId : '', ''))
      setEditingId(null)
      setDesignations([])
      setApplicantRoles([])
      await refreshRows()
    } catch (e) {
      setError(e?.message || 'Failed to update leave type')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this leave type? This cannot be undone.')) return

    setSaving(true)
    setError('')
    try {
      await deleteLeaveType(row.id)
      setSelectedRows((prev) => prev.filter((id) => String(id) !== String(row.id)))
      await refreshRows()
    } catch (e) {
      setError(e?.message || 'Failed to delete leave type')
    } finally {
      setSaving(false)
    }
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p += 1) pages.push(p)
    return pages
  }

  const renderApplicantTypeField = (form, setter) => {
    return (
      <FormField label="Applicant Type" required>
        <select
          className="avm-select"
          id="applicantType"
          value={form.applicantType}
          onChange={handleFormChange(form, setter)}
          disabled={!form.schoolId && !isFixedSchoolRole}
        >
          <option value="">--Select Applicant Type--</option>
          {availableApplicantRoles.map((option) => (
            <option key={option.name} value={option.name}>
              {formatRoleLabel(option.name)}
            </option>
          ))}
        </select>
      </FormField>
    )
  }

  const renderSchoolField = (form, setter) => {
    if (isFixedSchoolRole) {
      return (
        <FormField label="School Name" required full>
          <input className="avm-input" value={authSchoolName || (authSchoolId != null ? `School ${authSchoolId}` : '')} readOnly />
        </FormField>
      )
    }

    const selectedHeadOfficeId = isSuperAdmin
      ? form.headOfficeId
      : isHeadOfficeAdmin && authHeadOfficeId != null
        ? String(authHeadOfficeId)
        : ''

    const schoolSelectOptions =
      isSuperAdmin && selectedHeadOfficeId
        ? schools.filter((item) => String(item?.headOfficeId ?? '') === String(selectedHeadOfficeId))
        : isHeadOfficeAdmin && authHeadOfficeId != null
          ? schools.filter((item) => String(item?.headOfficeId ?? '') === String(authHeadOfficeId))
        : schools

    return (
      <div className="avm-grid">
        {isSuperAdmin ? (
          <FormField label="Head Office" required full>
            <select
              className="avm-select"
              id="headOfficeId"
              value={form.headOfficeId}
              onChange={handleFormChange(form, setter)}
            >
              <option value="">--Select Head Office--</option>
              {headOffices.map((option) => (
                <option key={option.id} value={String(option.id)}>
                  {option.name || option.headOfficeName}
                </option>
              ))}
            </select>
          </FormField>
        ) : null}

        <FormField label="School Name" required full>
          <select
            className="avm-select"
            id="schoolId"
            value={form.schoolId}
            onChange={handleFormChange(form, setter)}
            disabled={isSuperAdmin && !form.headOfficeId}
          >
            <option value="">
              {isSuperAdmin && !form.headOfficeId
                ? '--Select Head Office First--'
                : '--Select School--'}
            </option>
            {schoolSelectOptions.map((option) => (
              <option key={option.id} value={String(option.id)}>
                {option.schoolName}
              </option>
            ))}
          </select>
        </FormField>
      </div>
    )
  }

  const renderDesignationField = (form, setter) => {
    const applicantType = normalizeApplicantType(form.applicantType)
    if (applicantType === 'STUDENT') return null

    const schoolId = isFixedSchoolRole ? authSchoolId : form.schoolId
    const disabled = !schoolId || !applicantType

    return (
      <FormField label="Designation" required full noIcon>
        <div
          className="avm-input-with-icon"
          style={{ position: 'relative', minHeight: '44px' }}
        >
          <span
            aria-hidden="true"
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
            <i className="ri-award-line"></i>
          </span>
          <select
            className="avm-select"
            id="designationId"
            value={form.designationId}
            onChange={handleFormChange(form, setter)}
            disabled={disabled}
          >
            <option value="">--Select Designation--</option>
            {designations.map((option) => (
              <option key={option.id} value={String(option.id)}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ minHeight: '1.1rem', marginTop: '0.35rem' }}>
          {!disabled && designations.length === 0 ? (
            <small className="text-secondary-light d-block">
              No designations found for the selected role and school.
            </small>
          ) : null}
        </div>
      </FormField>
    )
  }

  const renderForm = (form, setter) => {
    return (
      <>
        <p className="avm-section-title">{STEPS[0]}</p>
        <div className="avm-grid">
          {renderSchoolField(form, setter)}
          {renderApplicantTypeField(form, setter)}
          {renderDesignationField(form, setter)}
          <FormField label="Leave Type" required full>
            <input
              type="text"
              className="avm-input"
              id="leaveType"
              placeholder="Enter leave type"
              value={form.leaveType}
              onChange={handleFormChange(form, setter)}
            />
          </FormField>
          <FormField label="Allowed Leaves count/year" required>
            <input
              type="number"
              min="0"
              className="avm-input"
              id="allowedLeavesPerYear"
              placeholder="Enter allowed leaves count/year"
              value={form.allowedLeavesPerYear}
              onChange={handleFormChange(form, setter)}
            />
          </FormField>
        </div>
      </>
    )
  }

  const canCreate = !isHeadOfficeAdmin || !!scopeSchoolId
  const selectedFilterHeadOfficeId =
    isSuperAdmin ? pendingFilters.headOfficeId : isHeadOfficeAdmin ? String(authHeadOfficeId ?? '') : ''

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Leave Type</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Leave Type</span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-12 flex-wrap">
          {isHeadOfficeAdmin ? (
            <select
              className="form-select border border-neutral-300 radius-8 text-secondary-light"
              style={{ minWidth: 240 }}
              value={scopeSchoolId}
              onChange={(e) => setScopeSchoolId(e.target.value)}
            >
              <option value="">Select School</option>
              {schools
                .filter((item) => item?.headOfficeId == null || String(item.headOfficeId) === String(authHeadOfficeId))
                .map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.schoolName}
                  </option>
                ))}
            </select>
          ) : null}
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={openAdd}
            disabled={!canCreate || saving}
          >
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add Leave Type
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger mb-16" role="alert">
          {error}
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
                onChange={(v) => {
                  setRowsPerPage(v)
                  setCurrentPage(1)
                }}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search leave type..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1020 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={allSelected}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label">ID</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.applicantType ? <th scope="col">Applicant Type</th> : null}
                  {visibleColumns.designationName ? <th scope="col">Designation</th> : null}
                  {visibleColumns.leaveType ? <th scope="col">Leave Type</th> : null}
                  {visibleColumns.allowedLeavesPerYear ? <th scope="col">Allowed Leaves count/year</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {busy ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 2}
                      className="text-center py-40 text-secondary-light"
                    >
                      Loading leave types...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 2}
                      className="text-center py-40 text-secondary-light"
                    >
                      {isHeadOfficeAdmin && !scopeSchoolId
                        ? 'Select a school to view leave types.'
                        : 'No leave type records found.'}
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(String(row.id))}
                            onChange={() => handleSelectRow(String(row.id))}
                          />
                          <label className="form-check-label">{row.id}</label>
                        </div>
                      </td>
                      {visibleColumns.school ? (
                        <td className="fw-medium text-primary-light">{row.schoolName || '-'}</td>
                      ) : null}
                      {visibleColumns.applicantType ? <td>{formatRoleLabel(row.applicantType) || '-'}</td> : null}
                      {visibleColumns.designationName ? <td>{row.designationName || '-'}</td> : null}
                      {visibleColumns.leaveType ? <td className="fw-medium">{row.leaveType || '-'}</td> : null}
                      {visibleColumns.allowedLeavesPerYear ? (
                        <td className="text-center fw-semibold">{row.allowedLeavesPerYear ?? '-'}</td>
                      ) : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => openEdit(row)}
                            title="Edit"
                            disabled={saving}
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            title="Delete"
                            onClick={() => handleDelete(row)}
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

          <div className="px-20 py-16 border-top border-neutral-200">
            <TablePagination
              paginationProps={{
                currentPage,
                totalPages,
                totalRecords: filteredRows.length,
                rowsPerPage,
                pageInfo: `Showing ${filteredRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, filteredRows.length)} of ${filteredRows.length} entries`,
                onPageChange: (next) => setCurrentPage(Math.min(Math.max(1, Number(next) || 1), totalPages)),
              }}
            />
          </div>
        </div>
      </div>

      <WizardPopup
        modalWidth="620px"
        open={isAddOpen}
        title="Add Leave Type"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleCreate}
        submitLabel={saving ? 'Saving...' : 'Save'}
      >
        {renderForm(addForm, setAddForm)}
      </WizardPopup>

      <WizardPopup
        modalWidth="620px"
        open={isEditOpen}
        title="Edit Leave Type"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleUpdate}
        submitLabel={saving ? 'Updating...' : 'Update'}
      >
        {renderForm(editForm, setEditForm)}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Leave Type"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <ManualScopeSelectors
              enabled={isSuperAdmin || isHeadOfficeAdmin}
              headOffices={isSuperAdmin ? headOffices : []}
              schoolOptions={filterSchoolOptions}
              selectedHeadOfficeId={selectedFilterHeadOfficeId}
              onHeadOfficeChange={(value) =>
                setPendingFilters((prev) => ({ ...prev, headOfficeId: value || 'Select', schoolId: 'Select' }))
              }
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={(value) =>
                setPendingFilters((prev) => ({ ...prev, schoolId: value || 'Select' }))
              }
              showSchoolSelector
              showHeadOfficeSelector={isSuperAdmin}
              compact={false}
            />
          </div>

          <div>
            <label
              htmlFor="applicantType"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Applicant Type
            </label>
            <select
              id="applicantType"
              className="form-control form-select"
              value={pendingFilters.applicantType}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Applicant Type</option>
              {applicantTypeFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {formatRoleLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="designation"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Designation
            </label>
            <select
              id="designation"
              className="form-control form-select"
              value={pendingFilters.designation}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Designation</option>
              {designationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-danger-200 text-danger-600 w-100"
            >
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

export default LeaveType
