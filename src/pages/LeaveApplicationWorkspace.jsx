import { useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchSchoolRoles } from '../apis/schoolRbacApi'
import { fetchDesignations } from '../apis/designationsApi'
import { fetchEmployees } from '../apis/employeesApi'
import { fetchStudentsPage } from '../apis/studentsApi'
import { fetchLeaveTypes } from '../apis/leaveTypeApi'
import {
  createLeaveApplication,
  deleteLeaveApplication,
  fetchLeaveApplications,
  updateLeaveApplication,
  updateLeaveApplicationStatus,
} from '../apis/leaveApplicationsApi'
import '../assets/css/addModalShared.css'

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]
const LEAVE_APPLICATION_STEPS = ['Basic Information', 'Leave Details']

const todayValue = () => new Date().toISOString().slice(0, 10)

const createEmptyForm = (defaults = {}) => ({
  headOfficeId: defaults.headOfficeId != null ? String(defaults.headOfficeId) : '',
  schoolId: defaults.schoolId != null ? String(defaults.schoolId) : '',
  applicantType: '',
  designationId: '',
  applicantId: '',
  leaveTypeId: '',
  applicationDate: todayValue(),
  leaveFrom: '',
  leaveTo: '',
  leaveReason: '',
})

const emptyFilters = {
  school: 'Select',
  academicYear: 'Select',
  applicantType: 'Select',
  leaveType: 'Select',
}

const formatRoleLabel = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase())

const normalizeApplicantType = (value) => String(value || '').trim().toUpperCase()

const normalizeStatus = (value) => String(value || '').trim().toUpperCase()

const statusBadgeClass = (status) => {
  const normalized = normalizeStatus(status)
  if (normalized === 'APPROVED') return 'bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm'
  if (normalized === 'DECLINED' || normalized === 'REJECTED') {
    return 'bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm'
  }
  if (normalized === 'PENDING') return 'bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm'
  return 'bg-neutral-100 text-secondary-light px-12 py-4 radius-4 fw-medium text-sm'
}

const statusLabel = (status) => {
  const normalized = normalizeStatus(status)
  if (normalized === 'DECLINED') return 'Declined'
  if (normalized === 'REJECTED') return 'Rejected'
  if (normalized === 'APPROVED') return 'Approved'
  if (normalized === 'PENDING') return 'Pending'
  return status || '-'
}

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  'Applicant Type': 'ri-user-3-line',
  Designation: 'ri-award-line',
  Applicant: 'ri-user-2-line',
  'Leave Type': 'ri-file-list-3-line',
  'Application Date': 'ri-calendar-2-line',
  'Leave From': 'ri-calendar-event-line',
  'Leave To': 'ri-calendar-event-line',
  'Leave Reason': 'ri-file-text-line',
}

const FormField = ({ label, required, children, full = false, noIcon = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label}
        {required ? <span className="req"> *</span> : null}
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

const LeaveApplicationWorkspace = ({
  pageTitle,
  breadcrumbLabel,
  statusFilter = null,
  showCreateButton = true,
  showForm = true,
  actionMode = 'crud', // crud | review | view
  showStatusColumn = true,
}) => {
  const { status, token, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const role = useMemo(() => normalizeRole(authRole), [authRole])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const isFixedSchoolRole = isSchoolAdmin || role === 'TEACHER' || role === 'STUDENT' || role === 'PARENT'

  const [rows, setRows] = useState([])
  const [schools, setSchools] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [roles, setRoles] = useState([])
  const [designations, setDesignations] = useState([])
  const [applicants, setApplicants] = useState([])
  const [leaveTypes, setLeaveTypes] = useState([])
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [addForm, setAddForm] = useState(createEmptyForm())
  const [editForm, setEditForm] = useState(createEmptyForm())
  const [addAttachment, setAddAttachment] = useState(null)
  const [editAttachment, setEditAttachment] = useState(null)
  const [scopeSchoolId, setScopeSchoolId] = useState(() => (isFixedSchoolRole && authSchoolId != null ? String(authSchoolId) : ''))

  const columnOptions = useMemo(() => {
    const columns = [
      { key: 'school', label: 'School' },
      { key: 'academicYear', label: 'Academic Year' },
      { key: 'applicantType', label: 'Applicant Type' },
      { key: 'designationName', label: 'Designation' },
      { key: 'leaveTypeName', label: 'Leave Type' },
      { key: 'applicantName', label: 'Applicant' },
      { key: 'leaveFrom', label: 'Leave From' },
      { key: 'leaveTo', label: 'Leave To' },
    ]
    if (showStatusColumn) columns.push({ key: 'status', label: 'Status' })
    return columns
  }, [showStatusColumn])

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolsById = useMemo(() => {
    const map = new Map()
    for (const item of schools) {
      if (item?.id == null) continue
      map.set(String(item.id), item)
    }
    return map
  }, [schools])

  const headOfficesById = useMemo(() => {
    const map = new Map()
    for (const item of headOffices) {
      if (item?.id == null) continue
      map.set(String(item.id), item)
    }
    return map
  }, [headOffices])

  const rolesByName = useMemo(() => {
    const map = new Map()
    for (const item of roles) {
      if (!item?.name) continue
      map.set(String(item.name).toUpperCase(), item)
    }
    return map
  }, [roles])

  const designationsById = useMemo(() => {
    const map = new Map()
    for (const item of designations) {
      if (item?.id == null) continue
      map.set(String(item.id), item)
    }
    return map
  }, [designations])

  const applicantsById = useMemo(() => {
    const map = new Map()
    for (const item of applicants) {
      if (item?.id == null) continue
      map.set(String(item.id), item)
    }
    return map
  }, [applicants])

  const leaveTypesById = useMemo(() => {
    const map = new Map()
    for (const item of leaveTypes) {
      if (item?.id == null) continue
      map.set(String(item.id), item)
    }
    return map
  }, [leaveTypes])

  const formSchoolId = (form) => {
    if (isFixedSchoolRole) return authSchoolId != null ? String(authSchoolId) : ''
    return form.schoolId || ''
  }

  const formHeadOfficeId = (form) => {
    if (isSchoolAdmin || role === 'TEACHER' || role === 'STUDENT' || role === 'PARENT') {
      if (authHeadOfficeId != null) return String(authHeadOfficeId)
      const school = schoolsById.get(String(authSchoolId || ''))
      return school?.headOfficeId != null ? String(school.headOfficeId) : ''
    }
    if (isHeadOfficeAdmin) return authHeadOfficeId != null ? String(authHeadOfficeId) : ''
    return form.headOfficeId || ''
  }

  const getListingSchoolId = () => {
    if (isFixedSchoolRole) return authSchoolId
    if (isHeadOfficeAdmin) return scopeSchoolId ? Number(scopeSchoolId) : null
    return null
  }

  const resolveSchoolName = (schoolId) => {
    if (schoolId == null) return ''
    const row = schoolsById.get(String(schoolId))
    if (row?.schoolName) return row.schoolName
    if (String(schoolId) === String(authSchoolId || '')) return authSchoolName || ''
    return `School ${schoolId}`
  }

  const resolveHeadOfficeName = (headOfficeId) => {
    if (headOfficeId == null) return ''
    const row = headOfficesById.get(String(headOfficeId))
    if (row?.name) return row.name
    if (String(headOfficeId) === String(authHeadOfficeId || '')) return headOfficeName || ''
    return `Head Office ${headOfficeId}`
  }

  const resolveDesignationName = (designationId) => {
    if (designationId == null) return ''
    return designationsById.get(String(designationId))?.name || ''
  }

  const resolveApplicantName = (row) => {
    if (row?.applicantName) return row.applicantName
    const applicant = applicantsById.get(String(row?.applicantId ?? ''))
    return applicant?.name || ''
  }

  const resolveLeaveTypeName = (row) => {
    if (row?.leaveTypeName) return row.leaveTypeName
    return leaveTypesById.get(String(row?.leaveTypeId ?? ''))?.leaveType || ''
  }

  const mappedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        schoolName: row.schoolName || resolveSchoolName(row.schoolId),
        headOfficeName: row.headOfficeName || resolveHeadOfficeName(row.headOfficeId),
        designationName: row.designationName || resolveDesignationName(row.designationId),
        applicantName: row.applicantName || resolveApplicantName(row),
        leaveTypeName: row.leaveTypeName || resolveLeaveTypeName(row),
      })),
    [rows, schoolsById, headOfficesById, designationsById, applicantsById, leaveTypesById],
  )

  const schoolOptions = useMemo(() => {
    const items = []
    const seen = new Set()
    const push = (schoolId, name) => {
      if (schoolId == null) return
      const label = String(name || '').trim()
      if (!label || seen.has(label)) return
      seen.add(label)
      items.push({ id: schoolId, name: label })
    }

    for (const row of mappedRows) push(row.schoolId, row.schoolName)
    for (const item of schools) {
      if (isHeadOfficeAdmin && String(item?.headOfficeId ?? '') !== String(authHeadOfficeId ?? '')) continue
      push(item?.id, item?.schoolName)
    }
    if (isFixedSchoolRole && authSchoolId != null) {
      push(authSchoolId, authSchoolName || `School ${authSchoolId}`)
    }
    items.sort((a, b) => a.name.localeCompare(b.name))
    return items
  }, [mappedRows, schools, isHeadOfficeAdmin, authHeadOfficeId, isFixedSchoolRole, authSchoolId, authSchoolName])

  const academicYearOptions = useMemo(
    () => Array.from(new Set(mappedRows.map((row) => row.academicYear).filter(Boolean))).sort(),
    [mappedRows],
  )
  const applicantTypeOptions = useMemo(
    () => Array.from(new Set(mappedRows.map((row) => row.applicantType).filter(Boolean))).sort(),
    [mappedRows],
  )
  const leaveTypeOptions = useMemo(
    () => Array.from(new Set(mappedRows.map((row) => row.leaveTypeName).filter(Boolean))).sort(),
    [mappedRows],
  )

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return mappedRows.filter((row) => {
      const searchText = [
        row.schoolName,
        row.headOfficeName,
        row.academicYear,
        row.applicantType,
        row.designationName,
        row.applicantName,
        row.leaveTypeName,
        row.leaveReason,
        row.status,
      ]
        .join(' ')
        .toLowerCase()
      const matchesSearch = !q || searchText.includes(q)
      const matchesSchool = filters.school === 'Select' || row.schoolName === filters.school
      const matchesYear = filters.academicYear === 'Select' || row.academicYear === filters.academicYear
      const matchesType = filters.applicantType === 'Select' || row.applicantType === filters.applicantType
      const matchesLeave = filters.leaveType === 'Select' || row.leaveTypeName === filters.leaveType
      return matchesSearch && matchesSchool && matchesYear && matchesType && matchesLeave
    })
  }, [mappedRows, search, filters])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [currentPage, filteredRows, rowsPerPage])

  const allSelected = paginatedRows.length > 0 && paginatedRows.every((row) => selectedRows.includes(String(row.id)))

  const refreshRows = async (schoolId = getListingSchoolId()) => {
    const data = await fetchLeaveApplications({ schoolId, status: statusFilter })
    setRows(Array.isArray(data) ? data : [])
  }

  const loadSchoolsAndHeadOffices = async () => {
    if (!isSuperAdmin && !isHeadOfficeAdmin) {
      setSchools([])
      setHeadOffices([])
      return
    }
    const [schoolList, headOfficePage] = await Promise.all([
      fetchSchoolsLookup().catch(() => []),
      fetchHeadOfficesPage(0, 500).catch(() => ({ content: [] })),
    ])
    setSchools(Array.isArray(schoolList) ? schoolList : [])
    const content = Array.isArray(headOfficePage?.content) ? headOfficePage.content : []
    setHeadOffices(
      content
        .filter((item) => String(item?.status || '').toUpperCase() === 'ACTIVE' || !item?.status)
        .map((item) => ({ id: item?.id, name: item?.name || item?.headOfficeName || '' }))
        .filter((item) => item.id != null && item.name),
    )
  }

  const loadRolesForSchool = async (schoolId) => {
    if (!schoolId) {
      setRoles([])
      return []
    }
    const data = await fetchSchoolRoles({ schoolId: Number(schoolId) })
    const list = Array.isArray(data) ? data : []
    const normalized = []
    const seen = new Set()
    for (const item of list) {
      const name = normalizeApplicantType(item?.name)
      if (!name || name === 'SUPER_ADMIN' || name === 'HEAD_OFFICE_ADMIN') continue
      if (seen.has(name)) continue
      seen.add(name)
      normalized.push({ ...item, name })
    }
    if (!seen.has('STUDENT')) normalized.push({ name: 'STUDENT', description: 'Student', permissions: [] })
    normalized.sort((a, b) => a.name.localeCompare(b.name))
    setRoles(normalized)
    return normalized
  }

  const loadDesignationsForForm = async (schoolId, applicantType) => {
    const normalizedRoleName = normalizeApplicantType(applicantType)
    if (!schoolId || !normalizedRoleName || normalizedRoleName === 'STUDENT') {
      setDesignations([])
      return []
    }
    const data = await fetchDesignations({ schoolId: Number(schoolId), role: normalizedRoleName })
    const list = Array.isArray(data) ? data : []
    setDesignations(list)
    return list
  }

  const loadApplicantsForForm = async (schoolId, applicantType, designationId) => {
    const normalizedRoleName = normalizeApplicantType(applicantType)
    if (!schoolId || !normalizedRoleName) {
      setApplicants([])
      return []
    }
    if (normalizedRoleName === 'STUDENT') {
      const page = await fetchStudentsPage(0, 1000, { schoolId: Number(schoolId) })
      const list = Array.isArray(page?.content) ? page.content : []
      const rowsList = list.map((item) => ({
        id: item?.id,
        name: item?.name || item?.studentName || '',
        schoolId: item?.schoolId ?? schoolId,
      })).filter((item) => item.id != null && item.name)
      setApplicants(rowsList)
      return rowsList
    }

    if (!designationId) {
      setApplicants([])
      return []
    }

    const list = await fetchEmployees({ schoolId: Number(schoolId) })
    const filtered = (Array.isArray(list) ? list : [])
      .filter((item) => normalizeApplicantType(item?.role) === normalizedRoleName)
      .filter((item) => String(item?.designationId ?? '') === String(designationId))
      .map((item) => ({
        id: item?.id,
        name: item?.name || '',
        role: normalizeApplicantType(item?.role),
        designationId: item?.designationId ?? null,
      }))
      .filter((item) => item.id != null && item.name)
    setApplicants(filtered)
    return filtered
  }

  const loadLeaveTypesForForm = async (schoolId, applicantType, designationId) => {
    const normalizedRoleName = normalizeApplicantType(applicantType)
    if (!schoolId || !normalizedRoleName) {
      setLeaveTypes([])
      return []
    }
    if (normalizedRoleName !== 'STUDENT' && !designationId) {
      setLeaveTypes([])
      return []
    }
    const data = await fetchLeaveTypes({
      schoolId: Number(schoolId),
      role: normalizedRoleName,
      designationId: normalizedRoleName === 'STUDENT' ? null : designationId,
    })
    const list = Array.isArray(data) ? data : []
    setLeaveTypes(list)
    return list
  }

  const loadRowData = async () => {
    if (isHeadOfficeAdmin && !scopeSchoolId) {
      setRows([])
      return
    }
    const schoolId = getListingSchoolId()
    await refreshRows(schoolId)
  }

  useEffect(() => {
    if (status !== 'ready' || !token) return
    let active = true
    const run = async () => {
      setBusy(true)
      setError('')
      try {
        await loadSchoolsAndHeadOffices()
        if (isFixedSchoolRole && authSchoolId != null) {
          await refreshRows(authSchoolId)
        } else if (isSuperAdmin) {
          await refreshRows(null)
        } else if (isHeadOfficeAdmin) {
          if (scopeSchoolId) await refreshRows(Number(scopeSchoolId))
          else setRows([])
        } else {
          await refreshRows(authSchoolId)
        }
      } catch (e) {
        if (active) setError(e?.message || 'Failed to load leave applications')
      } finally {
        if (active) setBusy(false)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [status, token, role, authSchoolId, scopeSchoolId, statusFilter])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    if (!isHeadOfficeAdmin) return
    void loadRowData()
  }, [scopeSchoolId, status, token, isHeadOfficeAdmin])

  const resetFormLookups = () => {
    setRoles([])
    setDesignations([])
    setApplicants([])
    setLeaveTypes([])
  }

  const syncFormLookups = async (form) => {
    const schoolId = formSchoolId(form)
    const applicantType = normalizeApplicantType(form.applicantType)
    const designationId = form.designationId ? String(form.designationId) : ''
    if (!schoolId) {
      resetFormLookups()
      return
    }
    await loadRolesForSchool(Number(schoolId))
    if (!applicantType) {
      setDesignations([])
      setApplicants([])
      setLeaveTypes([])
      return
    }
    if (applicantType === 'STUDENT') {
      await Promise.all([
        loadDesignationsForForm(Number(schoolId), applicantType),
        loadApplicantsForForm(Number(schoolId), applicantType, null),
        loadLeaveTypesForForm(Number(schoolId), applicantType, null),
      ])
      return
    }
    if (!designationId) {
      await loadDesignationsForForm(Number(schoolId), applicantType)
      setApplicants([])
      setLeaveTypes([])
      return
    }
    await Promise.all([
      loadDesignationsForForm(Number(schoolId), applicantType),
      loadApplicantsForForm(Number(schoolId), applicantType, designationId),
      loadLeaveTypesForForm(Number(schoolId), applicantType, designationId),
    ])
  }

  const handleFormChange = (form, setter, setAttachment) => (e) => {
    const { id, value } = e.target
    setter((prev) => {
      const next = { ...prev, [id]: value }
      if (id === 'headOfficeId') {
        next.schoolId = ''
        next.applicantType = ''
        next.designationId = ''
        next.applicantId = ''
        next.leaveTypeId = ''
      }
      if (id === 'schoolId') {
        next.applicantType = ''
        next.designationId = ''
        next.applicantId = ''
        next.leaveTypeId = ''
      }
      if (id === 'applicantType') {
        next.designationId = ''
        next.applicantId = ''
        next.leaveTypeId = ''
      }
      if (id === 'designationId') {
        next.applicantId = ''
        next.leaveTypeId = ''
      }
      return next
    })
    if (id === 'headOfficeId' || id === 'schoolId' || id === 'applicantType' || id === 'designationId') {
      const next = {
        ...form,
        [id]: value,
      }
      if (id === 'headOfficeId') {
        next.schoolId = ''
        next.applicantType = ''
        next.designationId = ''
        next.applicantId = ''
        next.leaveTypeId = ''
      }
      if (id === 'schoolId') {
        next.applicantType = ''
        next.designationId = ''
        next.applicantId = ''
        next.leaveTypeId = ''
      }
      if (id === 'applicantType') {
        next.designationId = ''
        next.applicantId = ''
        next.leaveTypeId = ''
      }
      if (id === 'designationId') {
        next.applicantId = ''
        next.leaveTypeId = ''
      }
      void syncFormLookups(next).catch(() => {})
    }
    if (id === 'leaveFrom' || id === 'leaveTo' || id === 'leaveReason' || id === 'applicationDate' || id === 'applicantId' || id === 'leaveTypeId') {
      return
    }
  }

  const handleFileChange = (isAdd, e) => {
    const file = e.target.files?.[0] || null
    if (isAdd) setAddAttachment(file)
    else setEditAttachment(file)
  }

  const openAdd = async () => {
    if (!showForm) return
    const defaults = {
      headOfficeId: isSchoolAdmin || role === 'TEACHER' || role === 'STUDENT' || role === 'PARENT'
        ? authHeadOfficeId
        : isHeadOfficeAdmin
          ? authHeadOfficeId
          : '',
      schoolId: isFixedSchoolRole ? authSchoolId : isHeadOfficeAdmin ? scopeSchoolId || '' : '',
    }
    const nextForm = createEmptyForm(defaults)
    setAddForm(nextForm)
    setAddAttachment(null)
    setAddStep(0)
    setIsAddOpen(true)
    await syncFormLookups(nextForm).catch(() => {})
  }

  const openEdit = async (row) => {
    if (!showForm) return
    const nextForm = {
      headOfficeId: row.headOfficeId != null ? String(row.headOfficeId) : '',
      schoolId: row.schoolId != null ? String(row.schoolId) : '',
      applicantType: row.applicantType || '',
      designationId: row.designationId != null ? String(row.designationId) : '',
      applicantId: row.applicantId != null ? String(row.applicantId) : '',
      leaveTypeId: row.leaveTypeId != null ? String(row.leaveTypeId) : '',
      applicationDate: row.applicationDate || todayValue(),
      leaveFrom: row.leaveFrom || '',
      leaveTo: row.leaveTo || '',
      leaveReason: row.leaveReason || '',
    }
    setEditForm(nextForm)
    setEditAttachment(null)
    setEditingId(row.id)
    setEditStep(0)
    setIsEditOpen(true)
    await syncFormLookups(nextForm).catch(() => {})
  }

  const buildPayload = (form) => {
    const schoolId = Number(formSchoolId(form))
    const applicantType = normalizeApplicantType(form.applicantType)
    const designationId = applicantType === 'STUDENT' || !form.designationId ? null : Number(form.designationId)
    return {
      headOfficeId: formHeadOfficeId(form) ? Number(formHeadOfficeId(form)) : null,
      schoolId,
      applicantType,
      designationId,
      applicantId: Number(form.applicantId),
      leaveTypeId: Number(form.leaveTypeId),
      applicationDate: form.applicationDate || null,
      leaveFrom: form.leaveFrom || null,
      leaveTo: form.leaveTo || null,
      leaveReason: form.leaveReason || '',
    }
  }

  const validateForm = (form) => {
    const schoolId = formSchoolId(form)
    if (!schoolId) return 'School is required.'
    const applicantType = normalizeApplicantType(form.applicantType)
    if (!applicantType) return 'Applicant type is required.'
    if (applicantType !== 'STUDENT' && !form.designationId) return 'Designation is required for non-student applicant types.'
    if (!form.applicantId) return 'Applicant is required.'
    if (!form.leaveTypeId) return 'Leave type is required.'
    if (!form.applicationDate) return 'Application date is required.'
    if (!form.leaveFrom) return 'Leave from date is required.'
    if (!form.leaveTo) return 'Leave to date is required.'
    if (!form.leaveReason || !String(form.leaveReason).trim()) return 'Leave reason is required.'
    return ''
  }

  const handleCreate = async () => {
    const validation = validateForm(addForm)
    if (validation) {
      setError(validation)
      return
    }
    setSaving(true)
    setError('')
    try {
      await createLeaveApplication(buildPayload(addForm), addAttachment)
      setIsAddOpen(false)
      setAddForm(createEmptyForm({
        headOfficeId: isSchoolAdmin || role === 'TEACHER' || role === 'STUDENT' || role === 'PARENT'
          ? authHeadOfficeId
          : isHeadOfficeAdmin
            ? authHeadOfficeId
            : '',
        schoolId: isFixedSchoolRole ? authSchoolId : isHeadOfficeAdmin ? scopeSchoolId || '' : '',
      }))
      setAddAttachment(null)
      await refreshRows()
    } catch (e) {
      setError(e?.message || 'Failed to create leave application')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    const validation = validateForm(editForm)
    if (validation) {
      setError(validation)
      return
    }
    if (editingId == null) {
      setError('Unable to determine the selected leave application.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateLeaveApplication(editingId, buildPayload(editForm), editAttachment)
      setIsEditOpen(false)
      setEditForm(createEmptyForm({
        headOfficeId: isSchoolAdmin || role === 'TEACHER' || role === 'STUDENT' || role === 'PARENT'
          ? authHeadOfficeId
          : isHeadOfficeAdmin
            ? authHeadOfficeId
            : '',
        schoolId: isFixedSchoolRole ? authSchoolId : isHeadOfficeAdmin ? scopeSchoolId || '' : '',
      }))
      setEditAttachment(null)
      setEditingId(null)
      await refreshRows()
    } catch (e) {
      setError(e?.message || 'Failed to update leave application')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this leave application? This cannot be undone.')) return
    setSaving(true)
    setError('')
    try {
      await deleteLeaveApplication(row.id)
      setSelectedRows((prev) => prev.filter((id) => String(id) !== String(row.id)))
      await refreshRows()
    } catch (e) {
      setError(e?.message || 'Failed to delete leave application')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (row) => {
    if (!window.confirm('Approve this leave application?')) return
    setSaving(true)
    setError('')
    try {
      await updateLeaveApplicationStatus(row.id, 'APPROVED')
      await refreshRows()
    } catch (e) {
      setError(e?.message || 'Failed to approve leave application')
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async (row) => {
    if (!window.confirm('Reject this leave application?')) return
    setSaving(true)
    setError('')
    try {
      await updateLeaveApplicationStatus(row.id, 'DECLINED')
      await refreshRows()
    } catch (e) {
      setError(e?.message || 'Failed to reject leave application')
    } finally {
      setSaving(false)
    }
  }

  const handleView = (row) => {
    window.alert(
      [
        `Applicant: ${row.applicantName || '-'}`,
        `School: ${row.schoolName || '-'}`,
        `Applicant Type: ${formatRoleLabel(row.applicantType) || '-'}`,
        `Designation: ${row.designationName || '-'}`,
        `Leave Type: ${row.leaveTypeName || '-'}`,
        `Status: ${statusLabel(row.status)}`,
        `From: ${row.leaveFrom || '-'}`,
        `To: ${row.leaveTo || '-'}`,
        `Reason: ${row.leaveReason || '-'}`,
      ].join('\n'),
    )
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
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters({ ...pendingFilters })
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p += 1) pages.push(p)
    return pages
  }

  const schoolSelectOptions = useMemo(() => {
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      return schools.filter((item) => String(item?.headOfficeId ?? '') === String(authHeadOfficeId))
    }
    if (isSuperAdmin) return schools
    if (isFixedSchoolRole && authSchoolId != null) {
      return [{ id: authSchoolId, schoolName: authSchoolName || `School ${authSchoolId}`, headOfficeId: authHeadOfficeId }]
    }
    return schools
  }, [schools, isHeadOfficeAdmin, authHeadOfficeId, isSuperAdmin, isFixedSchoolRole, authSchoolId, authSchoolName])

  const formSchoolOptions = (form) => {
    if (isSuperAdmin) {
      const selectedHeadOfficeId = form.headOfficeId || ''
      if (!selectedHeadOfficeId) return []
      return schools.filter((item) => String(item?.headOfficeId ?? '') === String(selectedHeadOfficeId))
    }
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      return schools.filter((item) => String(item?.headOfficeId ?? '') === String(authHeadOfficeId))
    }
    if (isFixedSchoolRole && authSchoolId != null) {
      return [{ id: authSchoolId, schoolName: authSchoolName || `School ${authSchoolId}`, headOfficeId: authHeadOfficeId }]
    }
    return schools
  }

  const renderApplicantTypeOptions = () =>
    roles.map((item) => (
      <option key={item.name} value={item.name}>
        {formatRoleLabel(item.name)}
      </option>
    ))

  const validateApplicantStep = (form) => {
    const schoolId = formSchoolId(form)
    if (!schoolId) return 'School is required.'
    const applicantType = normalizeApplicantType(form.applicantType)
    if (!applicantType) return 'Applicant type is required.'
    if (applicantType !== 'STUDENT' && !form.designationId) return 'Designation is required for non-student applicant types.'
    if (!form.applicantId) return 'Applicant is required.'
    if (!form.leaveTypeId) return 'Leave type is required.'
    return ''
  }

  const renderForm = (form, setter, isAdd, step) => {
    const attachment = isAdd ? addAttachment : editAttachment
    const schoolId = formSchoolId(form)
    const applicantType = normalizeApplicantType(form.applicantType)
    const designationRequired = applicantType && applicantType !== 'STUDENT'
    const applicantDisabled = !schoolId || !applicantType || (designationRequired && !form.designationId)
    const leaveTypeDisabled = !schoolId || !applicantType || (designationRequired && !form.designationId)

    return (
      <>
        {step === 0 ? (
          <>
            <p className="avm-section-title">Basic Information</p>
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
                {headOffices.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.name}
                  </option>
                ))}
              </select>
            </FormField>
          ) : (
            <FormField label="Head Office" required full>
              <input
                className="avm-input"
                value={resolveHeadOfficeName(formHeadOfficeId(form)) || 'Head office fixed'}
                readOnly
              />
            </FormField>
          )}

          {isSuperAdmin || isHeadOfficeAdmin ? (
            <FormField label="School Name" required full>
              <select
                className="avm-select"
                id="schoolId"
                value={form.schoolId}
                onChange={handleFormChange(form, setter)}
                disabled={isSuperAdmin && !form.headOfficeId}
              >
                <option value="">--Select School--</option>
                {formSchoolOptions(form).map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.schoolName}
                  </option>
                ))}
              </select>
            </FormField>
          ) : (
            <FormField label="School Name" required full>
              <input className="avm-input" value={resolveSchoolName(formSchoolId(form)) || 'School fixed'} readOnly />
            </FormField>
          )}

          <FormField label="Applicant Type" required full>
            <select
              className="avm-select"
              id="applicantType"
              value={form.applicantType}
              onChange={handleFormChange(form, setter)}
              disabled={!schoolId}
            >
              <option value="">--Select Applicant Type--</option>
              {renderApplicantTypeOptions()}
            </select>
          </FormField>

          {designationRequired ? (
            <FormField label="Designation" required full>
              <select
                className="avm-select"
                id="designationId"
                value={form.designationId}
                onChange={handleFormChange(form, setter)}
                disabled={!schoolId || !applicantType}
              >
                <option value="">--Select Designation--</option>
                {designations.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.name}
                  </option>
                ))}
              </select>
              {!(!schoolId || !applicantType) && designations.length === 0 ? (
                <small className="text-secondary-light d-block mt-8">
                  No designations found for the selected role and school.
                </small>
              ) : null}
            </FormField>
          ) : null}

          <FormField label="Applicant" required full>
            <select
              className="avm-select"
              id="applicantId"
              value={form.applicantId}
              onChange={handleFormChange(form, setter)}
              disabled={applicantDisabled}
            >
              <option value="">--Select Applicant--</option>
              {applicants.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.name}
                </option>
              ))}
            </select>
            {!applicantDisabled && applicants.length === 0 ? (
              <small className="text-secondary-light d-block mt-8">
                No applicants found for the selected role and designation.
              </small>
            ) : null}
          </FormField>

          <FormField label="Leave Type" required full>
            <select
              className="avm-select"
              id="leaveTypeId"
              value={form.leaveTypeId}
              onChange={handleFormChange(form, setter)}
              disabled={leaveTypeDisabled}
            >
              <option value="">--Select Leave Type--</option>
              {leaveTypes.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.leaveType || item.leaveTypeName || `Leave Type ${item.id}`}
                </option>
              ))}
            </select>
            {!leaveTypeDisabled && leaveTypes.length === 0 ? (
              <small className="text-secondary-light d-block mt-8">
                No leave types found for the selected role and designation.
              </small>
            ) : null}
          </FormField>
        </div>
          </>
        ) : (
          <>
            <p className="avm-section-title">Leave Details</p>
            <div className="avm-grid">
          <FormField label="Application Date" required full>
            <input
              type="date"
              className="avm-input"
              id="applicationDate"
              value={form.applicationDate}
              onChange={handleFormChange(form, setter)}
            />
          </FormField>
          <FormField label="Leave From" required>
            <input
              type="date"
              className="avm-input"
              id="leaveFrom"
              value={form.leaveFrom}
              onChange={handleFormChange(form, setter)}
            />
          </FormField>
          <FormField label="Leave To" required>
            <input
              type="date"
              className="avm-input"
              id="leaveTo"
              value={form.leaveTo}
              onChange={handleFormChange(form, setter)}
            />
          </FormField>
          <FormField label="Leave Reason" required full>
            <textarea
              rows="3"
              className="avm-input avm-textarea"
              id="leaveReason"
              placeholder="Reason for leave..."
              value={form.leaveReason}
              onChange={handleFormChange(form, setter)}
            />
          </FormField>
          <div className="avm-field full">
            <label className="avm-label">Attachment</label>
            <div
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
              }}
              onClick={() => document.getElementById(isAdd ? 'leaveAttachmentAdd' : 'leaveAttachmentEdit')?.click()}
            >
              {attachment ? (
                <div style={{ width: '100%' }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>{attachment.name}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    {(attachment.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#45597a' }}>Click to upload attachment</p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                    Optional .pdf, .doc, .docx, .png or .jpg file
                  </p>
                </div>
              )}
              <input
                id={isAdd ? 'leaveAttachmentAdd' : 'leaveAttachmentEdit'}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(isAdd, e)}
              />
            </div>
          </div>
        </div>
          </>
        )}
      </>
    )
  }

  const canCreate = !isHeadOfficeAdmin || !!scopeSchoolId

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">{pageTitle}</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / {breadcrumbLabel}</span>
          </div>
        </div>
        {showCreateButton ? (
          <div className="d-flex align-items-center gap-12 flex-wrap">
            {isHeadOfficeAdmin ? (
              <select
                className="form-select border border-neutral-300 radius-8 text-secondary-light"
                style={{ minWidth: 240 }}
                value={scopeSchoolId}
                onChange={(e) => setScopeSchoolId(e.target.value)}
              >
                <option value="">Select School</option>
                {schoolSelectOptions.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.schoolName}
                  </option>
                ))}
              </select>
            ) : null}
            {showForm ? (
              <button
                type="button"
                className="btn btn-primary-600 d-flex align-items-center gap-6"
                onClick={openAdd}
                disabled={!canCreate || saving}
              >
                <span className="d-flex text-md"><i className="ri-add-large-line"></i></span>
                Add Leave
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? <div className="alert alert-danger mb-16" role="alert">{error}</div> : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1"></i> Export
                  </span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"><i className="ri-file-3-line"></i> PDF</button></li>
                  <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"><i className="ri-file-excel-2-line"></i> Excel</button></li>
                </ul>
              </div>

              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
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

              <select className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light" value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }}>
                {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="position-relative">
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search leave applications..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light"><i className="ri-search-line"></i></span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1200 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input className="form-check-input" type="checkbox" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.academicYear ? <th scope="col">Academic Year</th> : null}
                  {visibleColumns.applicantType ? <th scope="col">Applicant Type</th> : null}
                  {visibleColumns.designationName ? <th scope="col">Designation</th> : null}
                  {visibleColumns.leaveTypeName ? <th scope="col">Leave Type</th> : null}
                  {visibleColumns.applicantName ? <th scope="col">Applicant</th> : null}
                  {visibleColumns.leaveFrom ? <th scope="col">Leave From</th> : null}
                  {visibleColumns.leaveTo ? <th scope="col">Leave To</th> : null}
                  {showStatusColumn && visibleColumns.status ? <th scope="col">Status</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {busy ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">Loading leave applications...</td></tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      {isHeadOfficeAdmin && !scopeSchoolId ? 'Select a school to view leave applications.' : 'No leave applications found.'}
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" checked={selectedRows.includes(String(row.id))} onChange={() => handleSelectRow(String(row.id))} />
                          <label className="form-check-label">{row.id}</label>
                        </div>
                      </td>
                      {visibleColumns.school ? <td className="fw-medium text-primary-light">{row.schoolName || '-'}</td> : null}
                      {visibleColumns.academicYear ? <td>{row.academicYear || '-'}</td> : null}
                      {visibleColumns.applicantType ? <td>{formatRoleLabel(row.applicantType) || '-'}</td> : null}
                      {visibleColumns.designationName ? <td>{row.designationName || '-'}</td> : null}
                      {visibleColumns.leaveTypeName ? <td>{row.leaveTypeName || '-'}</td> : null}
                      {visibleColumns.applicantName ? <td className="fw-medium">{row.applicantName || '-'}</td> : null}
                      {visibleColumns.leaveFrom ? <td>{row.leaveFrom || '-'}</td> : null}
                      {visibleColumns.leaveTo ? <td>{row.leaveTo || '-'}</td> : null}
                      {showStatusColumn && visibleColumns.status ? <td><span className={statusBadgeClass(row.status)}>{statusLabel(row.status)}</span></td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          {actionMode === 'crud' ? (
                            <>
                              <button type="button" className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" onClick={() => openEdit(row)} title="Edit" disabled={saving}>
                                <i className="ri-edit-line"></i>
                              </button>
                              <button type="button" className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" title="Delete" onClick={() => handleDelete(row)} disabled={saving}>
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </>
                          ) : null}

                          {actionMode === 'review' ? (
                            <>
                              <button type="button" className="bg-success-focus bg-hover-success-200 text-success-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" onClick={() => handleApprove(row)} title="Approve" disabled={saving}>
                                <i className="ri-check-line"></i>
                              </button>
                              <button type="button" className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" onClick={() => handleReject(row)} title="Reject" disabled={saving}>
                                <i className="ri-close-line"></i>
                              </button>
                              <button type="button" className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" onClick={() => handleView(row)} title="View Details">
                                <i className="ri-eye-line"></i>
                              </button>
                            </>
                          ) : null}

                          {actionMode === 'view' ? (
                            <>
                              <button type="button" className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" onClick={() => handleView(row)} title="View Details">
                                <i className="ri-eye-line"></i>
                              </button>
                              <button type="button" className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" title="Delete" onClick={() => handleDelete(row)} disabled={saving}>
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </>
                          ) : null}
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
              Showing {filteredRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredRows.length)} of {filteredRows.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              {getVisiblePages().map((p) => (
                <button key={p} type="button" className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </div>
      </div>

      {showForm ? (
        <>
          <WizardPopup
            modalWidth="680px"
            open={isAddOpen}
            title="Add Leave Application"
            steps={LEAVE_APPLICATION_STEPS}
            step={addStep}
            onClose={() => setIsAddOpen(false)}
            onBack={() => setAddStep((s) => Math.max(0, s - 1))}
            onNext={() => {
              setError('')
              const validation = validateApplicantStep(addForm)
              if (validation) {
                setError(validation)
                return
              }
              setAddStep((s) => Math.min(LEAVE_APPLICATION_STEPS.length - 1, s + 1))
            }}
            onSubmit={handleCreate}
            submitLabel={saving ? 'Saving...' : 'Save'}
          >
            {renderForm(addForm, setAddForm, true, addStep)}
          </WizardPopup>

          <WizardPopup
            modalWidth="680px"
            open={isEditOpen}
            title="Edit Leave Application"
            steps={LEAVE_APPLICATION_STEPS}
            step={editStep}
            onClose={() => setIsEditOpen(false)}
            onBack={() => setEditStep((s) => Math.max(0, s - 1))}
            onNext={() => {
              setError('')
              const validation = validateApplicantStep(editForm)
              if (validation) {
                setError(validation)
                return
              }
              setEditStep((s) => Math.min(LEAVE_APPLICATION_STEPS.length - 1, s + 1))
            }}
            onSubmit={handleUpdate}
            submitLabel={saving ? 'Updating...' : 'Update'}
          >
            {renderForm(editForm, setEditForm, false, editStep)}
          </WizardPopup>
        </>
      ) : null}

      <SlideSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} title={`Filter ${pageTitle}`}>
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="school" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
            <select id="school" className="form-control form-select" value={pendingFilters.school} onChange={handlePendingFilterChange}>
              <option value="Select">Select School</option>
              {schoolOptions.map((option) => (
                <option key={option.id} value={option.name}>{option.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="academicYear" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Academic Year</label>
            <select id="academicYear" className="form-control form-select" value={pendingFilters.academicYear} onChange={handlePendingFilterChange}>
              <option value="Select">Select Academic Year</option>
              {academicYearOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="applicantType" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Applicant Type</label>
            <select id="applicantType" className="form-control form-select" value={pendingFilters.applicantType} onChange={handlePendingFilterChange}>
              <option value="Select">Select Applicant Type</option>
              {applicantTypeOptions.map((opt) => <option key={opt} value={opt}>{formatRoleLabel(opt)}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="leaveType" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Leave Type</label>
            <select id="leaveType" className="form-control form-select" value={pendingFilters.leaveType} onChange={handlePendingFilterChange}>
              <option value="Select">Select Leave Type</option>
              {leaveTypeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">Reset</button>
          </div>
          <div>
            <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default LeaveApplicationWorkspace
