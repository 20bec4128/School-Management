import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import PhoneField from '../components/PhoneField'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { createEmployee, deleteEmployee, fetchEmployees, fetchEmployeesPage, updateEmployee } from '../apis/employeesApi'
import { fetchDesignations } from '../apis/designationsApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolRoles } from '../apis/schoolRbacApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import '../assets/css/addModalShared.css'

const emptyForm = {
  id: null,
  headOfficeId: '',
  schoolId: '',
  designationId: '',
  name: '',
  nationalId: '',
  phone: '',
  gender: '',
  bloodGroup: '',
  religion: '',
  birthDate: '',
  presentAddress: '',
  permanentAddress: '',
  email: '',
  username: '',
  password: '',
  salaryGrade: '',
  salaryType: '',
  role: '',
  joiningDate: '',
  resume: null,
  isViewOnWeb: '',
  facebookUrl: '',
  linkedinUrl: '',
  twitterUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  pinterestUrl: '',
  otherInfo: '',
  photo: null,
}

const STEPS = ['School & Basic Information', 'Address Info', 'Academic Info', 'Other Info']

const FIELD_ICONS = {
  'Head Office': 'ri-government-line',
  'School Name': 'ri-school-line',
  Name: 'ri-user-3-line',
  'National ID': 'ri-fingerprint-line',
  Designation: 'ri-award-line',
  Gender: 'ri-user-settings-line',
  'Blood Group': 'ri-heart-pulse-line',
  Religion: 'ri-bookmark-3-line',
  'Birth Date': 'ri-calendar-2-line',
  'Present Address': 'ri-map-pin-2-line',
  'Permanent Address': 'ri-home-4-line',
  Email: 'ri-mail-line',
  Username: 'ri-at-line',
  Password: 'ri-lock-2-line',
  'Salary Grade': 'ri-medal-line',
  'Salary Type': 'ri-money-dollar-circle-line',
  Role: 'ri-shield-user-line',
  'Joining Date': 'ri-calendar-check-line',
  Resume: 'ri-file-text-line',
  'Is View on Web?': 'ri-global-line',
  'Facebook URL': 'ri-facebook-circle-line',
  'LinkedIn URL': 'ri-linkedin-box-line',
  'Twitter URL': 'ri-twitter-x-line',
  'Instagram URL': 'ri-instagram-line',
  'Youtube URL': 'ri-youtube-line',
  'Pinterest URL': 'ri-pinterest-line',
  'Other Info': 'ri-information-line',
  Photo: 'ri-image-2-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'photo', label: 'Photo' },
  { key: 'name', label: 'Name' },
  { key: 'designation', label: 'Designation' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'joiningDate', label: 'Joining Date' },
  { key: 'isViewOnWeb', label: 'Is View on Web?' },
  { key: 'displayOrder', label: 'Display Order' },
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

const trimOrNull = (value) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const toNumberOrNull = (value) => {
  const text = String(value ?? '').trim()
  if (!text) return null
  const num = Number(text)
  return Number.isFinite(num) ? num : null
}

const formatRoleLabel = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase())

const getRowSchoolName = (row, schoolById, fallbackSchoolName) => {
  if (!row) return ''
  if (row.schoolName) return row.schoolName
  const schoolId = row.schoolId != null ? String(row.schoolId) : ''
  const lookup = schoolById.get(schoolId)
  return lookup?.schoolName || fallbackSchoolName || (schoolId ? `School ${schoolId}` : '')
}

const ManageEmployee = () => {
  const { status, role, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId, setActiveSchoolId } = useSchool()

  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = String(role || '').toUpperCase() === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = String(role || '').toUpperCase() === 'SCHOOL_ADMIN'

  const [rows, setRows] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedRows, setSelectedRows] = useState([])

  const [headOffices, setHeadOffices] = useState([])
  const [schools, setSchools] = useState([])
  const [designations, setDesignations] = useState([])
  const [roles, setRoles] = useState([])
  const [designationCache, setDesignationCache] = useState({})

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    name: '',
    school: 'All',
    designation: 'All',
    email: '',
    joiningDate: '',
    isViewOnWeb: 'All',
  })
  const [pendingFilters, setPendingFilters] = useState({
    name: '',
    school: 'All',
    designation: 'All',
    email: '',
    joiningDate: '',
    isViewOnWeb: 'All',
  })

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const photoRef = useRef()
  const editPhotoRef = useRef()
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const currentSchoolOption = useMemo(() => {
    if (!authSchoolId) return null
    return {
      id: authSchoolId,
      schoolName: authSchoolName || `School ${authSchoolId}`,
      headOfficeId: authHeadOfficeId ?? null,
    }
  }, [authHeadOfficeId, authSchoolId, authSchoolName])

  const schoolById = useMemo(() => {
    const map = new Map()
    for (const item of schools) {
      if (item?.id == null) continue
      map.set(String(item.id), item)
    }
    if (currentSchoolOption?.id != null && !map.has(String(currentSchoolOption.id))) {
      map.set(String(currentSchoolOption.id), currentSchoolOption)
    }
    return map
  }, [currentSchoolOption, schools])

  const headOfficeById = useMemo(() => {
    const map = new Map()
    for (const item of headOffices) {
      if (item?.id == null) continue
      map.set(String(item.id), item)
    }
    if (authHeadOfficeId != null && !map.has(String(authHeadOfficeId))) {
      map.set(String(authHeadOfficeId), {
        id: authHeadOfficeId,
        name: authHeadOfficeName || `Head Office ${authHeadOfficeId}`,
      })
    }
    return map
  }, [authHeadOfficeId, authHeadOfficeName, headOffices])

  const schoolPickerOptions = useMemo(() => {
    if (isSchoolAdmin) {
      return currentSchoolOption ? [currentSchoolOption] : []
    }
    if (isHeadOfficeAdmin) {
      const targetHeadOfficeId = authHeadOfficeId != null ? String(authHeadOfficeId) : ''
      return schools
        .filter((school) => String(school?.headOfficeId ?? '') === targetHeadOfficeId)
        .sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
    }
    return []
  }, [authHeadOfficeId, currentSchoolOption, isHeadOfficeAdmin, isSchoolAdmin, schools])

  const modalSchoolId = isSchoolAdmin
    ? authSchoolId != null
      ? String(authSchoolId)
      : ''
    : isEditOpen
      ? String(editForm.schoolId || '')
      : isAddOpen
        ? String(addForm.schoolId || '')
        : ''

  const modalHeadOfficeId = isSchoolAdmin
    ? authHeadOfficeId != null
      ? String(authHeadOfficeId)
      : ''
    : isHeadOfficeAdmin
      ? authHeadOfficeId != null
        ? String(authHeadOfficeId)
        : ''
      : isEditOpen
        ? String(editForm.headOfficeId || '')
        : isAddOpen
          ? String(addForm.headOfficeId || '')
          : ''

  const modalSchools = useMemo(() => {
    if (isSchoolAdmin) {
      return currentSchoolOption ? [currentSchoolOption] : []
    }
    if (isHeadOfficeAdmin) {
      const targetHeadOfficeId = authHeadOfficeId != null ? String(authHeadOfficeId) : ''
      return schools
        .filter((school) => String(school?.headOfficeId ?? '') === targetHeadOfficeId)
        .sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
    }
    if (!modalHeadOfficeId) return []
    return schools
      .filter((school) => String(school?.headOfficeId ?? '') === String(modalHeadOfficeId))
      .sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
  }, [authHeadOfficeId, currentSchoolOption, isHeadOfficeAdmin, isSchoolAdmin, modalHeadOfficeId, schools])

  const activeDesignationRows = useMemo(() => {
    if (!modalSchoolId) return []
    return designations.length > 0 ? designations : designationCache[String(modalSchoolId)] || []
  }, [designationCache, designations, modalSchoolId])

  const modalSchoolName = useMemo(() => {
    if (!modalSchoolId) return ''
    return schoolById.get(String(modalSchoolId))?.schoolName || currentSchoolOption?.schoolName || `School ${modalSchoolId}`
  }, [currentSchoolOption?.schoolName, modalSchoolId, schoolById])

  const modalRole = useMemo(() => {
    if (isEditOpen) return String(editForm.role || '').trim()
    if (isAddOpen) return String(addForm.role || '').trim()
    return ''
  }, [addForm.role, editForm.role, isAddOpen, isEditOpen])

  const modalHeadOfficeName = useMemo(() => {
    if (isSchoolAdmin || isHeadOfficeAdmin) {
      return authHeadOfficeName || headOfficeById.get(String(authHeadOfficeId || ''))?.name || (authHeadOfficeId != null ? `Head Office ${authHeadOfficeId}` : '')
    }

    if (!modalSchoolId) {
      return modalHeadOfficeId
        ? headOfficeById.get(String(modalHeadOfficeId))?.name || `Head Office ${modalHeadOfficeId}`
        : ''
    }

    const school = schoolById.get(String(modalSchoolId))
    if (!school?.headOfficeId) {
      return modalHeadOfficeId
        ? headOfficeById.get(String(modalHeadOfficeId))?.name || `Head Office ${modalHeadOfficeId}`
        : ''
    }
    return headOfficeById.get(String(school.headOfficeId))?.name || `Head Office ${school.headOfficeId}`
  }, [authHeadOfficeId, authHeadOfficeName, headOfficeById, isHeadOfficeAdmin, isSchoolAdmin, modalHeadOfficeId, modalSchoolId, schoolById])

  const loadDesignationCacheForSchools = useCallback(async (schoolIds) => {
    const uniqueIds = Array.from(
      new Set(
        (Array.isArray(schoolIds) ? schoolIds : [])
          .map((id) => String(id ?? '').trim())
          .filter(Boolean),
      ),
    )
    if (uniqueIds.length === 0) return

    const results = await Promise.allSettled(uniqueIds.map((schoolId) => fetchDesignations({ schoolId })))
    setDesignationCache((prev) => {
      const next = { ...prev }
      uniqueIds.forEach((schoolId, index) => {
        const result = results[index]
        if (result?.status === 'fulfilled') {
          next[schoolId] = Array.isArray(result.value) ? result.value : []
        }
      })
      return next
    })
  }, [])

  const loadScopeLookups = useCallback(async () => {
    if (status !== 'ready') return

    try {
      if (isSuperAdmin) {
        const [headOfficePage, schoolList] = await Promise.all([
          fetchHeadOfficesPage(0, 500),
          fetchSchoolsLookup(),
        ])
        setHeadOffices(Array.isArray(headOfficePage?.content) ? headOfficePage.content : [])
        setSchools(Array.isArray(schoolList) ? schoolList : [])
      } else if (isHeadOfficeAdmin) {
        const schoolList = await fetchSchoolsLookup()
        const targetHeadOfficeId = authHeadOfficeId != null ? String(authHeadOfficeId) : ''
        const filteredSchools = (Array.isArray(schoolList) ? schoolList : [])
          .filter((school) => String(school?.headOfficeId ?? '') === targetHeadOfficeId)
        setSchools(filteredSchools)
        setHeadOffices([])
      } else if (isSchoolAdmin) {
        setSchools(currentSchoolOption ? [currentSchoolOption] : [])
        setHeadOffices(authHeadOfficeId != null ? [{ id: authHeadOfficeId, name: authHeadOfficeName || `Head Office ${authHeadOfficeId}` }] : [])
      } else {
        setHeadOffices([])
        setSchools([])
      }
    } catch {
      setHeadOffices([])
      setSchools(isSchoolAdmin && currentSchoolOption ? [currentSchoolOption] : [])
    }
  }, [authHeadOfficeId, authHeadOfficeName, currentSchoolOption, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, status])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  const loadRows = useCallback(async () => {
    if (status !== 'ready') return

    if (isHeadOfficeAdmin && !activeSchoolId) {
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
      setBusy(false)
      setError('')
      setSelectedRows([])
      return
    }

    const effectiveSchoolId = isSchoolAdmin
      ? authSchoolId != null
        ? String(authSchoolId)
        : ''
      : isHeadOfficeAdmin
        ? activeSchoolId
          ? String(activeSchoolId)
          : ''
        : ''

    setBusy(true)
    setError('')
    try {
      const data = await fetchEmployeesPage({ 
        schoolId: effectiveSchoolId, 
        page: currentPage - 1, 
        size: rowsPerPage === -1 ? 999999 : rowsPerPage,
        search: debouncedSearch
      })
      const normalizedRows = Array.isArray(data?.content) ? data.content : []
      setRows(normalizedRows)
      setTotalElements(data?.totalElements ?? 0)
      setTotalPages(data?.totalPages ?? 0)
      setSelectedRows([])

      const schoolIdsToPrime = isSuperAdmin
        ? normalizedRows
            .map((row) => row?.schoolId)
            .filter((id) => id != null)
        : effectiveSchoolId
          ? [effectiveSchoolId]
          : []
      void loadDesignationCacheForSchools(schoolIdsToPrime)
    } catch (e) {
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
      setSelectedRows([])
      setError(e?.message || 'Failed to load employees')
    } finally {
      setBusy(false)
    }
  }, [activeSchoolId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, loadDesignationCacheForSchools, status, currentPage, rowsPerPage, debouncedSearch])

  useEffect(() => {
    void loadScopeLookups()
  }, [loadScopeLookups])

  useEffect(() => {
    void loadRows()
  }, [loadRows])

  useEffect(() => {
    if (!isAddOpen && !isEditOpen) {
      setDesignations([])
      setRoles([])
      return
    }

    if (!modalSchoolId) {
      setDesignations([])
      setRoles([])
      return
    }

    let cancelled = false
    const run = async () => {
      try {
        const [designationRows, roleRows] = await Promise.all([
          modalRole ? fetchDesignations({ schoolId: modalSchoolId, role: modalRole }) : Promise.resolve([]),
          fetchSchoolRoles({ schoolId: modalSchoolId }),
        ])
        if (cancelled) return
        const normalizedDesignations = Array.isArray(designationRows) ? designationRows : []
        const normalizedRoles = Array.isArray(roleRows)
          ? roleRows.map((item) => String(item?.name || '').trim()).filter(Boolean)
          : []
        setDesignations(normalizedDesignations)
        setRoles(normalizedRoles)
        setDesignationCache((prev) => ({
          ...prev,
          [String(modalSchoolId)]: normalizedDesignations,
        }))
      } catch {
        if (cancelled) return
        setDesignations([])
        setRoles([])
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [isAddOpen, isEditOpen, modalSchoolId, modalRole])

  const displayRows = useMemo(() => {
    return rows.map((row) => {
      const schoolId = row?.schoolId != null ? String(row.schoolId) : ''
      const designationId = row?.designationId != null ? String(row.designationId) : ''
      const schoolName = getRowSchoolName(row, schoolById, currentSchoolOption?.schoolName || authSchoolName || '')
      const designationName =
        row?.designationName ||
        (schoolId && designationId && designationCache[schoolId]
          ? designationCache[schoolId].find((item) => String(item?.id) === designationId)?.name || ''
          : '') ||
        ''

      return {
        ...row,
        schoolId,
        schoolName,
        designationId,
        designationName,
      }
    })
  }, [authSchoolName, currentSchoolOption?.schoolName, designationCache, rows, schoolById])

  const schoolOptionsForFilter = useMemo(() => {
    const map = new Map()
    for (const row of displayRows) {
      if (!row.schoolId) continue
      if (!map.has(row.schoolId)) {
        map.set(row.schoolId, row.schoolName || `School ${row.schoolId}`)
      }
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => String(a.label).localeCompare(String(b.label)))
  }, [displayRows])

  const designationOptionsForFilter = useMemo(() => {
    const map = new Map()
    for (const row of displayRows) {
      const key = String(row.designationName || '').trim()
      if (!key) continue
      if (!map.has(key)) map.set(key, key)
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => String(a.label).localeCompare(String(b.label)))
  }, [displayRows])

  const schoolsToRender = displayRows

  const allSelected = schoolsToRender.length > 0 && schoolsToRender.every((row) => selectedRows.includes(row.id))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...schoolsToRender.map((row) => row.id)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !schoolsToRender.some((row) => row.id === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    )
  }

  const openAdd = () => {
    setError('')
    setEditingId(null)
    setAddStep(0)
    setPhotoPreview(null)
    setAddForm({
      ...emptyForm,
      headOfficeId: isSchoolAdmin
        ? authHeadOfficeId != null
          ? String(authHeadOfficeId)
          : ''
        : isHeadOfficeAdmin
          ? authHeadOfficeId != null
            ? String(authHeadOfficeId)
            : ''
          : '',
      schoolId: isSchoolAdmin
        ? authSchoolId != null
          ? String(authSchoolId)
          : ''
        : isHeadOfficeAdmin && activeSchoolId
          ? String(activeSchoolId)
          : '',
    })
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setError('')
    setEditingId(row?.id ?? null)
    setEditStep(0)
    setEditPhotoPreview(row?.photoUrl || null)

    const rowSchoolId = row?.schoolId != null ? String(row.schoolId) : ''
    const rowSchool = rowSchoolId ? schoolById.get(rowSchoolId) : null

    setEditForm({
      ...emptyForm,
      id: row?.id ?? null,
      headOfficeId:
        isSchoolAdmin
          ? authHeadOfficeId != null
            ? String(authHeadOfficeId)
            : ''
          : rowSchool?.headOfficeId != null
            ? String(rowSchool.headOfficeId)
            : '',
      schoolId: isSchoolAdmin
        ? authSchoolId != null
          ? String(authSchoolId)
          : ''
        : rowSchoolId,
      designationId: row?.designationId != null ? String(row.designationId) : '',
      name: row?.name || '',
      nationalId: row?.nationalId || '',
      phone: row?.phone || '',
      gender: row?.gender || '',
      bloodGroup: row?.bloodGroup || '',
      religion: row?.religion || '',
      birthDate: row?.birthDate || '',
      presentAddress: row?.presentAddress || '',
      permanentAddress: row?.permanentAddress || '',
      email: row?.email || '',
      username: row?.username || '',
      password: '',
      salaryGrade: row?.salaryGrade || '',
      salaryType: row?.salaryType || '',
      role: row?.role || '',
      joiningDate: row?.joiningDate || '',
      resume: null,
      isViewOnWeb: row?.isViewOnWeb || '',
      facebookUrl: row?.facebookUrl || '',
      linkedinUrl: row?.linkedinUrl || '',
      twitterUrl: row?.twitterUrl || '',
      instagramUrl: row?.instagramUrl || '',
      youtubeUrl: row?.youtubeUrl || '',
      pinterestUrl: row?.pinterestUrl || '',
      otherInfo: row?.otherInfo || '',
      photo: null,
    })
    setIsEditOpen(true)
  }

  const handleModalFileChange = (e, setPreview, setter) => {
    const file = e.target.files?.[0]
    if (!file) return
    setter((prev) => ({ ...prev, photo: file }))
    setPreview(URL.createObjectURL(file))
  }

  const buildPayload = (form, schoolId, includePassword) => {
    const payload = {
      schoolId: toNumberOrNull(schoolId),
      designationId: toNumberOrNull(form.designationId),
      role: trimOrNull(form.role),
      name: trimOrNull(form.name),
      nationalId: trimOrNull(form.nationalId),
      phone: trimOrNull(form.phone),
      gender: trimOrNull(form.gender),
      bloodGroup: trimOrNull(form.bloodGroup),
      religion: trimOrNull(form.religion),
      birthDate: form.birthDate || null,
      presentAddress: trimOrNull(form.presentAddress),
      permanentAddress: trimOrNull(form.permanentAddress),
      email: trimOrNull(form.email),
      username: trimOrNull(form.username),
      salaryGrade: trimOrNull(form.salaryGrade),
      salaryType: trimOrNull(form.salaryType),
      joiningDate: form.joiningDate || null,
      isViewOnWeb: trimOrNull(form.isViewOnWeb),
      facebookUrl: trimOrNull(form.facebookUrl),
      linkedinUrl: trimOrNull(form.linkedinUrl),
      twitterUrl: trimOrNull(form.twitterUrl),
      instagramUrl: trimOrNull(form.instagramUrl),
      youtubeUrl: trimOrNull(form.youtubeUrl),
      pinterestUrl: trimOrNull(form.pinterestUrl),
      otherInfo: trimOrNull(form.otherInfo),
    }

    if (includePassword && String(form.password || '').trim()) {
      payload.password = String(form.password).trim()
    }

    return payload
  }

  const resolveSubmissionSchoolId = (form) => {
    if (isSchoolAdmin) return authSchoolId != null ? String(authSchoolId) : ''
    return String(form.schoolId || '')
  }

  const validateForm = (form, mode) => {
    const schoolId = resolveSubmissionSchoolId(form)
    if ((isSuperAdmin || isHeadOfficeAdmin) && !schoolId) return 'Please select a school.'
    if (isSuperAdmin && !String(form.headOfficeId || '').trim()) return 'Please select a head office.'
    if (!String(form.name || '').trim()) return 'Name is required.'
    if (!String(form.phone || '').trim()) return 'Phone is required.'
    if (!String(form.birthDate || '').trim()) return 'Birth date is required.'
    if (!String(form.username || '').trim()) return 'Username is required.'
    if (mode === 'create' && !String(form.password || '').trim()) return 'Password is required.'
    if (!String(form.designationId || '').trim()) return 'Designation is required.'
    if (!String(form.role || '').trim()) return 'Role is required.'
    if (!String(form.joiningDate || '').trim()) return 'Joining date is required.'
    if (!String(form.gender || '').trim()) return 'Gender is required.'
    return ''
  }

  const refreshRows = useCallback(async () => {
    await loadRows()
  }, [loadRows])

  const handleCreate = async () => {
    if (saving) return
    const message = validateForm(addForm, 'create')
    if (message) {
      setError(message)
      return
    }

    const schoolId = resolveSubmissionSchoolId(addForm)
    setSaving(true)
    setError('')
    try {
      const payload = buildPayload(addForm, schoolId, true)
      await createEmployee(payload, { photo: addForm.photo, resume: addForm.resume })
      setIsAddOpen(false)
      setAddForm(emptyForm)
      setAddStep(0)
      setPhotoPreview(null)
      setCurrentPage(1)
      await refreshRows()
    } catch (e) {
      setError(e?.message || 'Failed to create employee')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (saving) return
    if (!editingId) {
      setError('No employee selected for update')
      return
    }

    const message = validateForm(editForm, 'update')
    if (message) {
      setError(message)
      return
    }

    const schoolId = resolveSubmissionSchoolId(editForm)
    setSaving(true)
    setError('')
    try {
      const payload = buildPayload(editForm, schoolId, false)
      if (String(editForm.password || '').trim()) {
        payload.password = String(editForm.password).trim()
      }
      await updateEmployee(editingId, payload, { photo: editForm.photo, resume: editForm.resume })
      setIsEditOpen(false)
      setEditForm(emptyForm)
      setEditStep(0)
      setEditPhotoPreview(null)
      setEditingId(null)
      setCurrentPage(1)
      await refreshRows()
    } catch (e) {
      setError(e?.message || 'Failed to update employee')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!id) return
    const ok = window.confirm('Delete this employee? This cannot be undone.')
    if (!ok) return

    setSaving(true)
    setError('')
    try {
      await deleteEmployee(id)
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id))
      await refreshRows()
    } catch (e) {
      setError(e?.message || 'Failed to delete employee')
    } finally {
      setSaving(false)
    }
  }

  const renderStep = (step, form, setter, previewUrl, setPreviewUrl, fileRef, mode) => {
    const isAddMode = mode === 'create'
    const editableSchoolName = isSchoolAdmin ? currentSchoolOption?.schoolName || modalSchoolName : null

    if (step === 0) {
      return (
        <>
          <p className="avm-section-title">School & Basic Information</p>
          <div className="avm-grid">
            {isSuperAdmin ? (
              <FormField label="Head Office" required full>
                <select
                  className="avm-select"
                  id="headOfficeId"
                  value={form.headOfficeId}
                  onChange={(e) =>
                    setter((prev) => ({
                      ...prev,
                      headOfficeId: e.target.value,
                      schoolId: '',
                      designationId: '',
                      role: '',
                    }))
                  }
                >
                  <option value="">--Select Head Office--</option>
                  {headOffices.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.name || item.headOfficeName || `Head Office ${item.id}`}
                    </option>
                  ))}
                </select>
              </FormField>
            ) : (
              <FormField label="Head Office" required full>
                <input
                  className="avm-input"
                  value={modalHeadOfficeName || `Head Office ${authHeadOfficeId ?? ''}`}
                  readOnly
                />
              </FormField>
            )}

            {isSuperAdmin ? (
              <FormField label="School Name" required full>
                <select
                  className="avm-select"
                  id="schoolId"
                  value={form.schoolId}
                  onChange={(e) =>
                    setter((prev) => ({
                      ...prev,
                      schoolId: e.target.value,
                      designationId: '',
                      role: '',
                    }))
                  }
                  disabled={!form.headOfficeId}
                >
                  <option value="">--Select School--</option>
                  {modalSchools.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.schoolName}
                    </option>
                  ))}
                </select>
              </FormField>
            ) : isHeadOfficeAdmin ? (
              <FormField label="School Name" required full>
                <select
                  className="avm-select"
                  id="schoolId"
                  value={form.schoolId}
                  onChange={(e) =>
                    setter((prev) => ({
                      ...prev,
                      schoolId: e.target.value,
                      designationId: '',
                      role: '',
                    }))
                  }
                >
                  <option value="">--Select School--</option>
                  {modalSchools.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.schoolName}
                    </option>
                  ))}
                </select>
              </FormField>
            ) : (
              <FormField label="School Name" required full>
                <input
                  className="avm-input"
                  value={editableSchoolName || modalSchoolName || `School ${authSchoolId ?? ''}`}
                  readOnly
                />
              </FormField>
            )}

           

            <FormField label="Name" required>
              <input
                type="text"
                className="avm-input"
                id="name"
                placeholder="Enter name"
                value={form.name}
                onChange={(e) => setter((prev) => ({ ...prev, name: e.target.value }))}
              />
            </FormField>

            <FormField label="National ID">
              <input
                type="text"
                className="avm-input"
                id="nationalId"
                placeholder="Enter national ID"
                value={form.nationalId}
                onChange={(e) => setter((prev) => ({ ...prev, nationalId: e.target.value }))}
              />
            </FormField>
             <FormField label="Role" required>
              <select
                className="avm-select"
                id="role"
                value={form.role}
                onChange={(e) =>
                  setter((prev) => ({
                    ...prev,
                    role: e.target.value,
                    designationId: '',
                  }))
                }
                disabled={!modalSchoolId}
              >
                <option value="">--Select--</option>
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {formatRoleLabel(item)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Designation" required>
              <select
                className="avm-select"
                id="designationId"
                value={form.designationId}
                onChange={(e) => setter((prev) => ({ ...prev, designationId: e.target.value }))}
                disabled={!modalSchoolId || !form.role}
              >
                <option value="">--Select--</option>
                {activeDesignationRows.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.name}
                  </option>
                ))}
              </select>
            </FormField>

            <PhoneField
              id="phone"
              label="Phone number"
              required
              value={form.phone}
              onChange={(fullValue) => setter((prev) => ({ ...prev, phone: fullValue }))}
            />

            <FormField label="Gender" required>
              <select
                className="avm-select"
                id="gender"
                value={form.gender}
                onChange={(e) => setter((prev) => ({ ...prev, gender: e.target.value }))}
              >
                <option value="">--Select--</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </FormField>

            <FormField label="Blood Group">
              <select
                className="avm-select"
                id="bloodGroup"
                value={form.bloodGroup}
                onChange={(e) => setter((prev) => ({ ...prev, bloodGroup: e.target.value }))}
              >
                <option value="">--Select--</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>O+</option>
                <option>O-</option>
                <option>AB+</option>
                <option>AB-</option>
              </select>
            </FormField>

            <FormField label="Religion">
              <input
                type="text"
                className="avm-input"
                id="religion"
                placeholder="Enter religion"
                value={form.religion}
                onChange={(e) => setter((prev) => ({ ...prev, religion: e.target.value }))}
              />
            </FormField>

            <FormField label="Birth Date" required>
              <input
                type="date"
                className="avm-input"
                id="birthDate"
                value={form.birthDate}
                onChange={(e) => setter((prev) => ({ ...prev, birthDate: e.target.value }))}
              />
            </FormField>
          </div>
        </>
      )
    }

    if (step === 1) {
      return (
        <>
          <p className="avm-section-title">Address Information</p>
          <div className="avm-grid">
            <FormField label="Present Address" full>
              <textarea
                rows="3"
                className="avm-input"
                id="presentAddress"
                placeholder="Enter present address"
                value={form.presentAddress}
                onChange={(e) => setter((prev) => ({ ...prev, presentAddress: e.target.value }))}
              />
            </FormField>
            <FormField label="Permanent Address" full>
              <textarea
                rows="3"
                className="avm-input"
                id="permanentAddress"
                placeholder="Enter permanent address"
                value={form.permanentAddress}
                onChange={(e) => setter((prev) => ({ ...prev, permanentAddress: e.target.value }))}
              />
            </FormField>
          </div>
        </>
      )
    }

    if (step === 2) {
      return (
        <>
          <p className="avm-section-title">Academic Information</p>
          <div className="avm-grid">
            <FormField label="Email">
              <input
                type="email"
                className="avm-input"
                id="email"
                placeholder="Enter email"
                value={form.email}
                onChange={(e) => setter((prev) => ({ ...prev, email: e.target.value }))}
              />
            </FormField>

            <FormField label="Username" required>
              <input
                type="text"
                className="avm-input"
                id="username"
                placeholder="Enter username"
                value={form.username}
                onChange={(e) => setter((prev) => ({ ...prev, username: e.target.value }))}
              />
            </FormField>

            <FormField label="Password" required={isAddMode}>
              <input
                type="password"
                className="avm-input"
                id="password"
                placeholder={isAddMode ? 'Enter password' : 'Leave blank to keep existing password'}
                value={form.password}
                onChange={(e) => setter((prev) => ({ ...prev, password: e.target.value }))}
              />
            </FormField>

            <FormField label="Salary Grade" required>
              <select
                className="avm-select"
                id="salaryGrade"
                value={form.salaryGrade}
                onChange={(e) => setter((prev) => ({ ...prev, salaryGrade: e.target.value }))}
              >
                <option value="">--Select--</option>
                <option>Grade A</option>
                <option>Grade B</option>
                <option>Grade C</option>
              </select>
            </FormField>

            <FormField label="Salary Type" required>
              <select
                className="avm-select"
                id="salaryType"
                value={form.salaryType}
                onChange={(e) => setter((prev) => ({ ...prev, salaryType: e.target.value }))}
              >
                <option value="">--Select--</option>
                <option>Monthly</option>
                <option>Hourly</option>
              </select>
            </FormField>

            <FormField label="Joining Date" required>
              <input
                type="date"
                className="avm-input"
                id="joiningDate"
                value={form.joiningDate}
                onChange={(e) => setter((prev) => ({ ...prev, joiningDate: e.target.value }))}
              />
            </FormField>

            <FormField label="Resume" full noIcon>
              <input
                type="file"
                className="avm-input"
                id="resume"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                onChange={(e) => setter((prev) => ({ ...prev, resume: e.target.files?.[0] || null }))}
                style={{ padding: '0.45rem 1rem' }}
              />
              <span style={{ fontSize: '0.78rem', color: '#7a8a9a', marginTop: 4 }}>
                File format: .pdf, .doc/docx, .ppt/pptx or .txt
              </span>
            </FormField>
          </div>
        </>
      )
    }

    if (step === 3) {
      return (
        <>
          <p className="avm-section-title">Other Information</p>
          <div className="avm-grid">
            <FormField label="Is View on Web?">
              <select
                className="avm-select"
                id="isViewOnWeb"
                value={form.isViewOnWeb}
                onChange={(e) => setter((prev) => ({ ...prev, isViewOnWeb: e.target.value }))}
              >
                <option value="">--Select--</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </FormField>
            <FormField label="Facebook URL">
              <input
                type="url"
                className="avm-input"
                id="facebookUrl"
                placeholder="https://facebook.com/..."
                value={form.facebookUrl}
                onChange={(e) => setter((prev) => ({ ...prev, facebookUrl: e.target.value }))}
              />
            </FormField>
            <FormField label="LinkedIn URL">
              <input
                type="url"
                className="avm-input"
                id="linkedinUrl"
                placeholder="https://linkedin.com/..."
                value={form.linkedinUrl}
                onChange={(e) => setter((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
              />
            </FormField>
            <FormField label="Twitter URL">
              <input
                type="url"
                className="avm-input"
                id="twitterUrl"
                placeholder="https://twitter.com/..."
                value={form.twitterUrl}
                onChange={(e) => setter((prev) => ({ ...prev, twitterUrl: e.target.value }))}
              />
            </FormField>
            <FormField label="Instagram URL">
              <input
                type="url"
                className="avm-input"
                id="instagramUrl"
                placeholder="https://instagram.com/..."
                value={form.instagramUrl}
                onChange={(e) => setter((prev) => ({ ...prev, instagramUrl: e.target.value }))}
              />
            </FormField>
            <FormField label="Youtube URL">
              <input
                type="url"
                className="avm-input"
                id="youtubeUrl"
                placeholder="https://youtube.com/..."
                value={form.youtubeUrl}
                onChange={(e) => setter((prev) => ({ ...prev, youtubeUrl: e.target.value }))}
              />
            </FormField>
            <FormField label="Pinterest URL">
              <input
                type="url"
                className="avm-input"
                id="pinterestUrl"
                placeholder="https://pinterest.com/..."
                value={form.pinterestUrl}
                onChange={(e) => setter((prev) => ({ ...prev, pinterestUrl: e.target.value }))}
              />
            </FormField>
            <FormField label="Other Info" full>
              <input
                type="text"
                className="avm-input"
                id="otherInfo"
                placeholder="Any other info"
                value={form.otherInfo}
                onChange={(e) => setter((prev) => ({ ...prev, otherInfo: e.target.value }))}
              />
            </FormField>
            <FormField label="Photo" full noIcon>
              <input
                ref={fileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif"
                style={{ display: 'none' }}
                onChange={(e) => handleModalFileChange(e, setPreviewUrl, setter)}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button type="button" className="avm-btn light" onClick={() => fileRef.current?.click()}>
                  <i className="ri-upload-2-line"></i> Upload Photo
                </button>
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="preview"
                    style={{ width: 60, height: 65, objectFit: 'cover', borderRadius: 8, border: '1px solid #d0d5dd' }}
                  />
                )}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#7a8a9a', marginTop: 4 }}>
                Max-W: 120px, Max-H: 130px - .jpg, .jpeg, .png or .gif
              </span>
            </FormField>
          </div>
          <div className="avm-grid" style={{ marginTop: '1rem' }}>
            <div className="full" style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="ri-information-line" style={{ color: '#d97706', fontSize: '1rem', flexShrink: 0 }}></i>
              <span style={{ fontSize: '0.82rem', color: '#92400e' }}>
                Designations and roles load after a school is selected.
              </span>
            </div>
          </div>
        </>
      )
    }

    return null
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p += 1) pages.push(p)
    return pages
  }

  const emptyMessage =
    isHeadOfficeAdmin && !activeSchoolId
      ? 'Select a school to view employees.'
      : busy
        ? 'Loading employees...'
        : 'No employees found.'

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Manage Employee</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Manage Employee</span>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-12">
          {isHeadOfficeAdmin ? (
            <select
              className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              value={activeSchoolId || ''}
              onChange={(e) => setActiveSchoolId(e.target.value || null)}
            >
              <option value="">Select School</option>
              {schoolPickerOptions.map((school) => (
                <option key={school.id} value={String(school.id)}>
                  {school.schoolName}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={openAdd}
            disabled={isHeadOfficeAdmin && !activeSchoolId}
          >
            <span className="d-flex text-md"><i className="ri-add-large-line"></i></span>
            Add Employee
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-8" role="alert">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      ) : null}

      {isHeadOfficeAdmin && !activeSchoolId ? (
        <div className="alert alert-info d-flex align-items-center gap-8 mb-16" role="alert">
          <i className="ri-information-line"></i>
          <span>Please choose a school to load and manage employees.</span>
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm"><i className="ri-file-upload-line text-md line-height-1"></i> Export</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"><i className="ri-file-3-line"></i> PDF</button></li>
                  <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"><i className="ri-file-excel-2-line"></i> Excel</button></li>
                </ul>
              </div>
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
              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>
              <RowsPerPageSelect
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(value) => {
                  setRowsPerPage(value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light"><i className="ri-search-line"></i></span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={allSelected} onChange={handleSelectAll} />
                      <label className="form-check-label">ID</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.photo ? <th scope="col">Photo</th> : null}
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.designation ? <th scope="col">Designation</th> : null}
                  {visibleColumns.phone ? <th scope="col">Phone</th> : null}
                  {visibleColumns.email ? <th scope="col">Email</th> : null}
                  {visibleColumns.joiningDate ? <th scope="col">Joining Date</th> : null}
                  {visibleColumns.isViewOnWeb ? <th scope="col">Is View on Web?</th> : null}
                  {visibleColumns.displayOrder ? <th scope="col">Display Order</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {busy || (!activeSchoolId && isHeadOfficeAdmin) ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : schoolsToRender.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  schoolsToRender.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">{row.id}</label>
                        </div>
                      </td>
                      {visibleColumns.school ? <td>{row.schoolName || '-'}</td> : null}
                      {visibleColumns.photo ? (
                        <td>
                          <div className="w-40-px h-40-px rounded-circle bg-neutral-200 d-flex align-items-center justify-content-center overflow-hidden" style={{ minWidth: 40 }}>
                            {row.photoUrl ? <img src={row.photoUrl} alt={row.name} className="w-100 h-100 object-fit-cover" /> : <i className="ri-user-line text-secondary-light"></i>}
                          </div>
                        </td>
                      ) : null}
                      {visibleColumns.name ? <td className="fw-medium text-primary-light">{row.name || '-'}</td> : null}
                      {visibleColumns.designation ? <td>{row.designationName || '-'}</td> : null}
                      {visibleColumns.phone ? <td>{row.phone || '-'}</td> : null}
                      {visibleColumns.email ? <td>{row.email || '-'}</td> : null}
                      {visibleColumns.joiningDate ? <td>{row.joiningDate || '-'}</td> : null}
                      {visibleColumns.isViewOnWeb ? (
                        <td>
                          <div className="form-check form-switch d-flex justify-content-center mb-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={String(row.isViewOnWeb || '').toLowerCase() === 'yes'}
                              readOnly
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                      ) : null}
                      {visibleColumns.displayOrder ? <td className="text-center">{row.displayOrder ?? '-'}</td> : null}
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

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {rowsPerPage === -1 ? totalElements : Math.min(currentPage * rowsPerPage, totalElements)} of {totalElements}
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

      <WizardPopup
        modalWidth="570px"
        open={isAddOpen}
        title="Add Employee"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleCreate}
        submitLabel={saving ? 'Saving...' : 'Save'}
      >
        {renderStep(addStep, addForm, setAddForm, photoPreview, setPhotoPreview, photoRef, 'create')}
      </WizardPopup>

      <WizardPopup
        modalWidth="570px"
        open={isEditOpen}
        title="Edit Employee"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleUpdate}
        submitLabel={saving ? 'Saving...' : 'Update'}
      >
        {renderStep(editStep, editForm, setEditForm, editPhotoPreview, setEditPhotoPreview, editPhotoRef, 'update')}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Employees"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form
          className="p-20 d-grid grid-cols-2 gap-16"
          onSubmit={(e) => {
            e.preventDefault()
            setFilters(pendingFilters)
            setCurrentPage(1)
            setIsFilterSidebarOpen(false)
          }}
        >
          <div>
            <label htmlFor="filterEmployeeName" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Name</label>
            <input
              id="filterEmployeeName"
              type="text"
              className="form-control"
              value={pendingFilters.name}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Search by name"
            />
          </div>
          <div>
            <label htmlFor="filterEmployeeSchool" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
            <select
              id="filterEmployeeSchool"
              className="form-control form-select"
              value={pendingFilters.school}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, school: e.target.value }))}
            >
              <option value="All">All</option>
              {schoolOptionsForFilter.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filterEmployeeDesignation" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Designation</label>
            <select
              id="filterEmployeeDesignation"
              className="form-control form-select"
              value={pendingFilters.designation}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, designation: e.target.value }))}
            >
              <option value="All">All</option>
              {designationOptionsForFilter.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filterEmployeeEmail" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Email</label>
            <input
              id="filterEmployeeEmail"
              type="text"
              className="form-control"
              value={pendingFilters.email}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Search by email"
            />
          </div>
          <div>
            <label htmlFor="filterEmployeeJoiningDate" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Joining Date</label>
            <input
              id="filterEmployeeJoiningDate"
              type="date"
              className="form-control"
              value={pendingFilters.joiningDate}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, joiningDate: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="filterEmployeeWeb" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Is View on Web?</label>
            <select
              id="filterEmployeeWeb"
              className="form-control form-select"
              value={pendingFilters.isViewOnWeb}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, isViewOnWeb: e.target.value }))}
            >
              <option value="All">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div>
            <button
              type="button"
              className="btn btn-danger-200 text-danger-600 w-100"
              onClick={() => {
                const reset = { name: '', school: 'All', designation: 'All', email: '', joiningDate: '', isViewOnWeb: 'All' }
                setPendingFilters(reset)
                setFilters(reset)
                setCurrentPage(1)
              }}
            >
              Reset
            </button>
          </div>
          <div>
            <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default ManageEmployee
