import { useCallback, useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import PhoneField from '../components/PhoneField'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { fetchSubscriptionPlans } from '../apis/subscriptionPlansApi'
import { createSchoolWithAdmin, deleteSchool, fetchSchoolsLookup, fetchSchoolsPage, updateSchool } from '../apis/schoolsApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { useAuth } from '../context/useAuth'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const emptyForm = {
  // Basic Information
  schoolUrl: '',
  schoolCode: '',
  schoolName: '',
  subscription: '',
  isDemo: 'No',
  status: 'Active',
  adminUsername: '',
  adminPassword: '',
  currentAdminUsername: '',
  headOfficeId: '',
  address: '',
  phone: '',
  registrationDate: '',
  email: '',
  fax: '',
  footer: '',
  // Setting Information
  currency: '',
  currencySymbol: '',
  enableFrontend: 'Yes',
  examFinalResult: 'Average of All Exam',
  language: '',
  theme: '',
  onlineAdmission: '',
  enableRTL: 'No',
  zoomApiKey: '',
  zoomSecret: '',
  googleMapUrl: '',
  // Social Information
  facebookUrl: '',
  twitterUrl: '',
  linkedinUrl: '',
  youtubeUrl: '',
  instagramUrl: '',
  pinterestUrl: '',
  // Other Information
  frontendLogo: null,
  adminLogo: null,
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: 'All',
  status: 'Select',
}

const STEPS = ['Basic Information', 'Setting Information', 'Social Information', 'Other Information', 'Preview']

const FIELD_ICONS = {
  'School URL': 'ri-link',
  'School Code': 'ri-barcode-box-line',
  'School Name': 'ri-school-line',
  Address: 'ri-map-pin-line',
  Phone: 'ri-phone-line',
  'Registration Date': 'ri-calendar-line',
  Email: 'ri-mail-line',
  Fax: 'ri-printer-line',
  Footer: 'ri-file-text-line',
  Currency: 'ri-coin-line',
  'Currency Symbol': 'ri-money-dollar-circle-line',
  'Enable Frontend': 'ri-global-line',
  'Exam final result': 'ri-bar-chart-2-line',
  Language: 'ri-translate',
  Theme: 'ri-palette-line',
  'Online Admission': 'ri-computer-line',
  'Enable RTL': 'ri-layout-right-line',
  'Zoom Api Key': 'ri-vidicon-line',
  'Zoom Secret': 'ri-lock-password-line',
  'Google Map Url': 'ri-map-2-line',
  'Facebook URL': 'ri-facebook-box-line',
  'Twitter URL': 'ri-twitter-x-line',
  'Linkedin URL': 'ri-linkedin-box-line',
  'Youtube URL': 'ri-youtube-line',
  'Instagram URL': 'ri-instagram-line',
  'Pinterest URL': 'ri-pinterest-line',
  'Frontend Logo': 'ri-image-line',
  'Admin Logo': 'ri-image-2-line',
  'School Admin Username': 'ri-user-3-line',
  'School Admin Password': 'ri-lock-password-line',
}

const columnOptions = [
  { key: 'schoolName', label: 'School Name' },
  { key: 'subscription', label: 'Subscription' },
  { key: 'isDemo', label: 'Is Demo?' },
  { key: 'address', label: 'Address' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'adminLogoUrl', label: 'Admin Logo' },
  { key: 'status', label: 'Status' },
]

const demoOptions = ['Yes', 'No']
const statusOptions = ['Active', 'Inactive']
const languageOptions = ['English', 'Spanish', 'French', 'German', 'Arabic', 'Hindi']
const themeOptions = ['Default', 'Light', 'Dark', 'Modern', 'Classic']
const onlineAdmissionOptions = ['Yes', 'No']
const examResultOptions = ['Average of All Exam', 'Highest Mark', 'Lowest Mark', 'Grade Only']

const getStatusBadge = (status) => {
  const v = String(status || '').trim().toUpperCase()
  if (v === 'ACTIVE' || status === 'Active') {
    return <span className="bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm">Active</span>
  }
  return <span className="bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm">Inactive</span>
}

const toUiStatus = (status) => {
  const v = String(status || '').trim().toUpperCase()
  if (v === 'ACTIVE') return 'Active'
  if (v === 'INACTIVE') return 'Inactive'
  return status || 'Active'
}

const toApiStatus = (status) => {
  const v = String(status || '').trim().toUpperCase()
  if (v === 'ACTIVE' || v === 'INACTIVE') return v
  if (String(status || '').trim() === 'Active') return 'ACTIVE'
  if (String(status || '').trim() === 'Inactive') return 'INACTIVE'
  return v || 'ACTIVE'
}

const getIsDemoBadge = (isDemo) => {
  if (isDemo === 'Yes') {
    return <span className="bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm">Demo</span>
  }
  return <span className="bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm">Live</span>
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

const ManageSchool = ({ onNavigate }) => {
  const {
    role,
    headOfficeId: currentHeadOfficeId,
    headOfficeName: currentHeadOfficeName,
    schoolId: currentSchoolId,
    schoolName: currentSchoolName,
    canAdd,
    canEdit,
    canDelete,
  } = useAuth()
  const PAGE_SLUG = 'manage-school'
  const [schools, setSchools] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [subscriptionPlans, setSubscriptionPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingSchoolId, setEditingSchoolId] = useState(null)

  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [selectedRows, setSelectedRows] = useState([])
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editStep, setEditStep] = useState(0)
  const [editForm, setEditForm] = useState(emptyForm)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [editFrontendLogoPreview, setEditFrontendLogoPreview] = useState(null)
  const [editAdminLogoPreview, setEditAdminLogoPreview] = useState(null)

  const [editFrontendLogoInputKey, setEditFrontendLogoInputKey] = useState(0)
  const [editAdminLogoInputKey, setEditAdminLogoInputKey] = useState(0)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)
  const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN'
  const isHeadOfficeScoped = String(role || '').toUpperCase() === 'HEAD_OFFICE_ADMIN'
  const isSchoolScoped = String(role || '').toUpperCase() === 'SCHOOL_ADMIN'

  const schoolLookupOptions = useMemo(() => {
    const rows = Array.isArray(allSchools) ? allSchools : []
    const scopedRows = pendingFilters.headOfficeId
      ? rows.filter((school) => String(school?.headOfficeId ?? '') === String(pendingFilters.headOfficeId))
      : isHeadOfficeScoped && currentHeadOfficeId != null
        ? rows.filter((school) => String(school?.headOfficeId ?? '') === String(currentHeadOfficeId))
        : isSchoolScoped && currentSchoolId != null
          ? rows.filter((school) => String(school?.id ?? '') === String(currentSchoolId))
        : rows
    return scopedRows
      .slice()
      .sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
  }, [allSchools, currentHeadOfficeId, currentSchoolId, isHeadOfficeScoped, isSchoolScoped, pendingFilters.headOfficeId])

  const headOfficeOptions = useMemo(() => {
    const fromApi = Array.isArray(headOffices) ? headOffices : []
    const normalized = fromApi
      .map((row) => ({ id: row?.id, name: row?.name || row?.headOfficeName || '' }))
      .filter((row) => row.id != null && row.name)
    if (isHeadOfficeScoped && currentHeadOfficeId != null && currentHeadOfficeName) {
      const exists = normalized.some((row) => String(row.id) === String(currentHeadOfficeId))
      if (!exists) normalized.unshift({ id: currentHeadOfficeId, name: currentHeadOfficeName })
    }
    return normalized.sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [currentHeadOfficeId, currentHeadOfficeName, headOffices, isHeadOfficeScoped])

  const subscriptionOptions = useMemo(() => {
    return Array.isArray(subscriptionPlans) ? subscriptionPlans : []
  }, [subscriptionPlans])

  const selectedSubscriptionValue = useMemo(() => {
    return editForm.subscription || ''
  }, [editForm.subscription])

  const schoolsToRender = useMemo(() => schools, [schools])

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

  const handleChange = (setter) => (e) => {
    const { id, value, type, checked } = e.target
    setter((prev) => ({ ...prev, [id]: type === 'checkbox' ? (checked ? 'Yes' : 'No') : value }))
  }

  const handleFrontendLogoChange = (setter, setPreview) => (e) => {
    const file = e.target.files[0]
    if (!file) return
    setter((prev) => ({ ...prev, frontendLogo: file }))
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleAdminLogoChange = (setter, setPreview) => (e) => {
    const file = e.target.files[0]
    if (!file) return
    setter((prev) => ({ ...prev, adminLogo: file }))
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(file)
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
    const reset = isSuperAdmin
      ? { ...emptyFilters }
      : {
          headOfficeId: isHeadOfficeScoped && currentHeadOfficeId != null ? String(currentHeadOfficeId) : '',
          schoolId: isSchoolScoped && currentSchoolId != null ? String(currentSchoolId) : 'All',
          status: 'Select',
        }
    setPendingFilters(reset)
    setFilters(reset)
    setCurrentPage(1)
  }

  const openAdd = () => {
    onNavigate('add-school')
  }

  const openEdit = (row) => {
    if (!row?.id) return
    sessionStorage.setItem(
      'manage-school-edit-row',
      JSON.stringify({
        id: row.id,
        schoolUrl: row.schoolUrl || '',
        schoolCode: row.schoolCode || '',
        schoolName: row.schoolName || '',
        subscription: row.subscription || '',
        isDemo: row.isDemo || 'No',
        status: toUiStatus(row.status),
        address: row.address || '',
        phone: row.phone || '',
        registrationDate: row.registrationDate || '',
        email: row.email || '',
        fax: row.fax || '',
        footer: row.footer || '',
        currency: row.currency || '',
        currencySymbol: row.currencySymbol || '',
        enableFrontend: row.enableFrontend || 'Yes',
        examFinalResult: row.examFinalResult || 'Average of All Exam',
        language: row.language || '',
        theme: row.theme || '',
        onlineAdmission: row.onlineAdmission || '',
        enableRTL: row.enableRTL || 'No',
        zoomApiKey: row.zoomApiKey || '',
        zoomSecret: row.zoomSecret || '',
        googleMapUrl: row.googleMapUrl || '',
        facebookUrl: row.facebookUrl || '',
        twitterUrl: row.twitterUrl || '',
        linkedinUrl: row.linkedinUrl || '',
        youtubeUrl: row.youtubeUrl || '',
        instagramUrl: row.instagramUrl || '',
        pinterestUrl: row.pinterestUrl || '',
        headOfficeId:
          row.headOfficeId != null
            ? String(row.headOfficeId)
            : isHeadOfficeScoped && currentHeadOfficeId != null
              ? String(currentHeadOfficeId)
              : '',
        adminUsername: '',
        currentAdminUsername: row.adminUsername || '',
        frontendLogoUrl: row.frontendLogoUrl || '',
        adminLogoUrl: row.adminLogoUrl || '',
      }),
    )
    onNavigate('add-school')
  }

  const loadSchools = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const effectiveSchoolId = isSchoolScoped && currentSchoolId != null
        ? String(currentSchoolId)
        : filters.schoolId !== 'All'
          ? filters.schoolId
          : undefined
      const data = await fetchSchoolsPage({
        page: currentPage - 1,
        size: rowsPerPage,
        search,
        statusFilter: filters.status,
        headOfficeId: filters.headOfficeId || undefined,
        schoolId: effectiveSchoolId,
      })
      const normalizeRows = (rows) =>
        (Array.isArray(rows) ? rows : []).map((r) => ({ ...r, status: toUiStatus(r?.status) }))

      if (Array.isArray(data)) {
        setSchools(normalizeRows(data))
        setTotalElements(data.length)
        const nextTotalPages = 1
        setTotalPages(nextTotalPages)
        setCurrentPage((prev) => (prev > nextTotalPages ? nextTotalPages : prev))
      } else {
        setSchools(normalizeRows(Array.isArray(data?.content) ? data.content : []))
        setTotalElements(Number.isFinite(data?.totalElements) ? data.totalElements : 0)
        const nextTotalPages = Math.max(1, Number.isFinite(data?.totalPages) ? data.totalPages : 1)
        setTotalPages(nextTotalPages)
        setCurrentPage((prev) => (prev > nextTotalPages ? nextTotalPages : prev))
      }
    } catch (e) {
      setSchools([])
      setTotalElements(0)
      setTotalPages(1)
      setError(e?.message || 'Failed to load schools')
      setCurrentPage((prev) => (prev !== 1 ? 1 : prev))
    } finally {
      setLoading(false)
    }
  }, [currentPage, currentSchoolId, isSchoolScoped, rowsPerPage, search, filters])

  const loadHeadOffices = useCallback(async () => {
    if (!isSuperAdmin) {
      if (isHeadOfficeScoped && currentHeadOfficeId != null && currentHeadOfficeName) {
        setHeadOffices([{ id: currentHeadOfficeId, name: currentHeadOfficeName }])
      }
      return
    }
    try {
      const page = await fetchHeadOfficesPage(0, 500)
      setHeadOffices(Array.isArray(page?.content) ? page.content : [])
    } catch {
      setHeadOffices([])
    }
  }, [currentHeadOfficeId, currentHeadOfficeName, isHeadOfficeScoped, isSuperAdmin])

  const loadSubscriptionPlans = useCallback(async () => {
    try {
      const plans = await fetchSubscriptionPlans()
      setSubscriptionPlans(Array.isArray(plans) ? plans : [])
    } catch {
      setSubscriptionPlans([])
    }
  }, [])

  const loadAllSchools = useCallback(async () => {
    try {
      const list = await fetchSchoolsLookup()
      setAllSchools(Array.isArray(list) ? list : [])
    } catch {
      setAllSchools([])
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([loadSchools(), loadAllSchools()])
    }
    void fetchData()
  }, [currentPage, rowsPerPage, loadAllSchools, loadSchools])

  useEffect(() => {
    void loadSubscriptionPlans()
  }, [loadSubscriptionPlans])

  useEffect(() => {
    void loadHeadOffices()
  }, [loadHeadOffices])

  useEffect(() => {
    if (isSuperAdmin) return
    const nextFilters = {
      headOfficeId: isHeadOfficeScoped && currentHeadOfficeId != null ? String(currentHeadOfficeId) : '',
      schoolId: isSchoolScoped && currentSchoolId != null ? String(currentSchoolId) : 'All',
      status: 'Select',
    }
    setFilters(nextFilters)
    setPendingFilters(nextFilters)
  }, [currentHeadOfficeId, currentSchoolId, isHeadOfficeScoped, isSchoolScoped, isSuperAdmin])

  const buildSchoolPayload = (form) => ({
    schoolUrl: form.schoolUrl || '',
    schoolCode: form.schoolCode || '',
    schoolName: form.schoolName || '',
    subscription: form.subscription || '',
    isDemo: form.isDemo || 'No',
    status: toApiStatus(form.status),
    address: form.address || '',
    phone: form.phone || '',
    registrationDate: form.registrationDate || '',
    email: form.email || '',
    fax: form.fax || '',
    footer: form.footer || '',
    currency: form.currency || '',
    currencySymbol: form.currencySymbol || '',
    enableFrontend: form.enableFrontend || 'Yes',
    examFinalResult: form.examFinalResult || 'Average of All Exam',
    language: form.language || '',
    theme: form.theme || '',
    onlineAdmission: form.onlineAdmission || '',
    enableRTL: form.enableRTL || 'No',
    zoomApiKey: form.zoomApiKey || '',
    zoomSecret: form.zoomSecret || '',
    googleMapUrl: form.googleMapUrl || '',
    facebookUrl: form.facebookUrl || '',
    twitterUrl: form.twitterUrl || '',
    linkedinUrl: form.linkedinUrl || '',
    youtubeUrl: form.youtubeUrl || '',
    instagramUrl: form.instagramUrl || '',
    pinterestUrl: form.pinterestUrl || '',
    headOfficeId: form.headOfficeId ? Number(form.headOfficeId) : null,
    adminUsername: form.adminUsername || '',
    adminPassword: form.adminPassword || '',
  })


  const handleUpdateSchool = async () => {
    if (saving) return
    if (!editingSchoolId) {
      setError('No school selected for update')
      return
    }
    if (!String(editForm.subscription || '').trim()) {
      setError('Subscription is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = buildSchoolPayload(editForm)
      await updateSchool(editingSchoolId, payload, editForm)
      setIsEditOpen(false)
      setEditForm(emptyForm)
      setEditStep(0)
      setEditingSchoolId(null)
      await loadSchools()
    } catch (e) {
      setError(e?.message || 'Failed to update school')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSchool = async (schoolId) => {
    if (!schoolId) return
    const confirmed = window.confirm('Delete this school? This cannot be undone.')
    if (!confirmed) return

    setSaving(true)
    setError('')
    try {
      await deleteSchool(schoolId)
      setSelectedRows((prev) => prev.filter((id) => id !== schoolId))
      await loadSchools()
    } catch (e) {
      setError(e?.message || 'Failed to delete school')
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

  const renderForm = (
    form,
    setter,
    step,
    frontendLogoPreview,
    setFrontendLogoPreview,
    adminLogoPreview,
    setAdminLogoPreview,
    frontendLogoInput,
    adminLogoInput,
  ) => {
    return (
      <>
        {step === 0 && (
          <>
            <p className="avm-section-title">{STEPS[0]}</p>
            <div className="avm-grid">
              <FormField label="School URL" required full>
                <input
                  type="text"
                  className="avm-input"
                  id="schoolUrl"
                  placeholder="School URL (No Space, No Capital Letter, No Special Character. Ex: south-point OR liverpool)"
                  value={form.schoolUrl}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="School Code" full>
                <input
                  type="text"
                  className="avm-input"
                  id="schoolCode"
                  placeholder="School Code"
                  value={form.schoolCode}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="School Name" required full>
                <input
                  type="text"
                  className="avm-input"
                  id="schoolName"
                  placeholder="School Name"
                  value={form.schoolName}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Subscription" required>
                <select
                  id="subscription"
                  className="avm-input"
                  value={form.subscription}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select Plan--</option>
                  {subscriptionOptions.map((plan) => (
                    <option key={plan.id} value={plan.planName}>
                      {plan.planName}
                    </option>
                  ))}
                  {selectedSubscriptionValue && !subscriptionOptions.some((plan) => plan.planName === selectedSubscriptionValue) ? (
                    <option value={selectedSubscriptionValue}>{selectedSubscriptionValue} (Legacy)</option>
                  ) : null}
                </select>
              </FormField>

              <FormField label="Is Demo?" required>
                <select id="isDemo" className="avm-input" value={form.isDemo} onChange={handleChange(setter)}>
                  {demoOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Status" required>
                <select id="status" className="avm-input" value={form.status} onChange={handleChange(setter)}>
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <ManualScopeSelectors
                enabled={isSuperAdmin}
                headOffices={headOfficeOptions}
                selectedHeadOfficeId={form.headOfficeId || ''}
                onHeadOfficeChange={(value) => setter((prev) => ({ ...prev, headOfficeId: value }))}
                showSchoolSelector={false}
              />

              {!isSuperAdmin ? (
                <FormField label="Head Office" required full>
                  <input
                    type="text"
                    className="avm-input"
                    value={currentHeadOfficeName || 'Linked automatically'}
                    disabled
                  />
                </FormField>
              ) : null}

              {setter === setEditForm ? (
                <>
                  <FormField label="School Admin Username" full>
                    <input
                      type="text"
                      className="avm-input"
                      id="adminUsername"
                      placeholder="Leave blank to keep current username"
                      value={form.adminUsername || ''}
                      onChange={handleChange(setter)}
                      autoComplete="off"
                    />
                    {form.currentAdminUsername ? (
                      <small className="text-secondary-light d-block mt-8">
                        Current username: {form.currentAdminUsername}
                      </small>
                    ) : null}
                  </FormField>

                  <FormField label="School Admin Password" full>
                    <input
                      type="password"
                      className="avm-input"
                      id="adminPassword"
                      placeholder="Leave blank to keep current password"
                      value={form.adminPassword || ''}
                      onChange={handleChange(setter)}
                      autoComplete="new-password"
                    />
                  </FormField>
                </>
              ) : null}

              <FormField label="Address" required full>
                <textarea
                  rows="2"
                  className="avm-input avm-textarea"
                  id="address"
                  placeholder="Address"
                  value={form.address}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <PhoneField
                id="phone"
                label="Phone number"
                required
                value={form.phone}
                onChange={(fullValue) => setter((prev) => ({ ...prev, phone: fullValue }))}
              />

              <FormField label="Registration Date">
                <input
                  type="date"
                  className="avm-input"
                  id="registrationDate"
                  value={form.registrationDate}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Email" required full>
                <input
                  type="email"
                  className="avm-input"
                  id="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Fax">
                <input
                  type="text"
                  className="avm-input"
                  id="fax"
                  placeholder="Fax"
                  value={form.fax}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Footer" full noIcon>
                <textarea
                  rows="3"
                  className="avm-input avm-textarea"
                  id="footer"
                  placeholder="Footer"
                  value={form.footer}
                  onChange={handleChange(setter)}
                />
              </FormField>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="avm-section-title">{STEPS[1]}</p>
            <div className="avm-grid">
              <FormField label="Currency">
                <input
                  type="text"
                  className="avm-input"
                  id="currency"
                  placeholder="Currency (e.g., USD, EUR, GBP)"
                  value={form.currency}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Currency Symbol">
                <input
                  type="text"
                  className="avm-input"
                  id="currencySymbol"
                  placeholder="$"
                  value={form.currencySymbol}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Enable Frontend">
                <select
                  className="avm-select"
                  id="enableFrontend"
                  value={form.enableFrontend}
                  onChange={handleChange(setter)}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </FormField>

              <FormField label="Exam final result" full>
                <select
                  className="avm-select"
                  id="examFinalResult"
                  value={form.examFinalResult}
                  onChange={handleChange(setter)}
                >
                  {examResultOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Language">
                <select
                  className="avm-select"
                  id="language"
                  value={form.language}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {languageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Theme">
                <select
                  className="avm-select"
                  id="theme"
                  value={form.theme}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {themeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Online Admission">
                <select
                  className="avm-select"
                  id="onlineAdmission"
                  value={form.onlineAdmission}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {onlineAdmissionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Enable RTL" noIcon>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      id="enableRTL"
                      checked={form.enableRTL === 'Yes'}
                      onChange={(e) => setter((prev) => ({ ...prev, enableRTL: e.target.checked ? 'Yes' : 'No' }))}
                      style={{ width: 18, height: 18 }}
                    />
                    <span>Enable RTL (Right to Left)</span>
                  </label>
                </div>
              </FormField>

              <FormField label="Zoom Api Key" full>
                <input
                  type="text"
                  className="avm-input"
                  id="zoomApiKey"
                  placeholder="Zoom Api Key"
                  value={form.zoomApiKey}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Zoom Secret" full>
                <input
                  type="text"
                  className="avm-input"
                  id="zoomSecret"
                  placeholder="Zoom Secret"
                  value={form.zoomSecret}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Google Map Url" full>
                <input
                  type="text"
                  className="avm-input"
                  id="googleMapUrl"
                  placeholder="Google Map URL"
                  value={form.googleMapUrl}
                  onChange={handleChange(setter)}
                />
              </FormField>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="avm-section-title">{STEPS[2]}</p>
            <div className="avm-grid">
              <FormField label="Facebook URL" full>
                <input
                  type="url"
                  className="avm-input"
                  id="facebookUrl"
                  placeholder="https://facebook.com/your-school"
                  value={form.facebookUrl}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Twitter URL" full>
                <input
                  type="url"
                  className="avm-input"
                  id="twitterUrl"
                  placeholder="https://twitter.com/your-school"
                  value={form.twitterUrl}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Linkedin URL" full>
                <input
                  type="url"
                  className="avm-input"
                  id="linkedinUrl"
                  placeholder="https://linkedin.com/company/your-school"
                  value={form.linkedinUrl}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Youtube URL" full>
                <input
                  type="url"
                  className="avm-input"
                  id="youtubeUrl"
                  placeholder="https://youtube.com/your-school"
                  value={form.youtubeUrl}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Instagram URL" full>
                <input
                  type="url"
                  className="avm-input"
                  id="instagramUrl"
                  placeholder="https://instagram.com/your-school"
                  value={form.instagramUrl}
                  onChange={handleChange(setter)}
                />
              </FormField>

              <FormField label="Pinterest URL" full>
                <input
                  type="url"
                  className="avm-input"
                  id="pinterestUrl"
                  placeholder="https://pinterest.com/your-school"
                  value={form.pinterestUrl}
                  onChange={handleChange(setter)}
                />
              </FormField>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className="avm-section-title">{STEPS[3]}</p>
            <div className="avm-grid">
              {/* Frontend Logo Upload */}
              <div className="avm-field full">
                <label className="avm-label">Frontend Logo</label>
                <label
                  htmlFor={frontendLogoInput.id}
                  style={{
                    border: '2px dashed #d0d5dd',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
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
                  {frontendLogoPreview ? (
                    <img
                      src={frontendLogoPreview}
                      alt="Frontend Logo Preview"
                      style={{
                        maxWidth: 150,
                        maxHeight: 90,
                        objectFit: 'contain',
                        borderRadius: 6,
                        border: '1px solid #e0e0e0',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: '#e8edf4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <i className="ri-image-add-line" style={{ fontSize: '1.6rem', color: '#45597a' }}></i>
                    </div>
                  )}
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#45597a' }}>
                      {frontendLogoPreview ? 'Change Logo' : 'Upload Frontend Logo'}
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                      Dimension:- Max-W: 150px, Max-H: 90px
                    </p>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                      Image file format: .jpg, .jpeg, .png or .gif
                    </p>
                  </div>
                  <input
                    key={frontendLogoInput.key}
                    id={frontendLogoInput.id}
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif"
                    style={{ display: 'none' }}
                    onChange={handleFrontendLogoChange(setter, setFrontendLogoPreview)}
                  />
                </label>
                {frontendLogoPreview && (
                  <button
                    type="button"
                    className="avm-btn light sm"
                    style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                    onClick={() => {
                      setter((prev) => ({ ...prev, frontendLogo: null }))
                      setFrontendLogoPreview(null)
                      frontendLogoInput.reset()
                    }}
                  >
                    <i className="ri-delete-bin-line"></i> Remove
                  </button>
                )}
              </div>

              {/* Admin Logo Upload */}
              <div className="avm-field full">
                <label className="avm-label">Admin Logo</label>
                <label
                  htmlFor={adminLogoInput.id}
                  style={{
                    border: '2px dashed #d0d5dd',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
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
                  {adminLogoPreview ? (
                    <img
                      src={adminLogoPreview}
                      alt="Admin Logo Preview"
                      style={{
                        maxWidth: 100,
                        maxHeight: 110,
                        objectFit: 'contain',
                        borderRadius: 6,
                        border: '1px solid #e0e0e0',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: '#e8edf4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <i className="ri-image-add-line" style={{ fontSize: '1.6rem', color: '#45597a' }}></i>
                    </div>
                  )}
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#45597a' }}>
                      {adminLogoPreview ? 'Change Logo' : 'Upload Admin Logo'}
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                      Dimension:- Max-W: 100px, Max-H: 110px
                    </p>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                      Image file format: .jpg, .jpeg, .png or .gif
                    </p>
                  </div>
                  <input
                    key={adminLogoInput.key}
                    id={adminLogoInput.id}
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif"
                    style={{ display: 'none' }}
                    onChange={handleAdminLogoChange(setter, setAdminLogoPreview)}
                  />
                </label>
                {adminLogoPreview && (
                  <button
                    type="button"
                    className="avm-btn light sm"
                    style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                    onClick={() => {
                      setter((prev) => ({ ...prev, adminLogo: null }))
                      setAdminLogoPreview(null)
                      adminLogoInput.reset()
                    }}
                  >
                    <i className="ri-delete-bin-line"></i> Remove
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <p className="avm-section-title">{STEPS[4]}</p>
            <div className="avm-grid">
              <div className="full" style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ fontSize: '0.9rem', color: '#667085' }}>Review your information before submitting</p>
                <div style={{ 
                  background: '#f8fafc', 
                  borderRadius: '0.75rem', 
                  padding: '1.5rem',
                  textAlign: 'left',
                  marginTop: '1rem'
                }}>
                  <p><strong>School Name:</strong> {form.schoolName || '-'}</p>
                  <p><strong>School URL:</strong> {form.schoolUrl || '-'}</p>
                  <p><strong>Email:</strong> {form.email || '-'}</p>
                  <p><strong>Phone:</strong> {form.phone || '-'}</p>
                  <p><strong>Address:</strong> {form.address || '-'}</p>
                  <p><strong>Currency:</strong> {form.currency || '-'} ({form.currencySymbol || '-'})</p>
                  <p><strong>Language:</strong> {form.language || '-'}</p>
                  <p><strong>Theme:</strong> {form.theme || '-'}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Manage School</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Manage School</span>
          </div>
        </div>
        {canAdd(PAGE_SLUG) && (
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={openAdd}
          >
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add School
          </button>
        )}
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-8" role="alert">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
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
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                  Filter
                </span>
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
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    Columns
                  </span>
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
                placeholder="Search school..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1200 }}>
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
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.schoolName ? <th scope="col">School Name</th> : null}
                  {visibleColumns.subscription ? <th scope="col">Subscription</th> : null}
                  {visibleColumns.isDemo ? <th scope="col">Is Demo?</th> : null}
                  {visibleColumns.address ? <th scope="col">Address</th> : null}
                  {visibleColumns.phone ? <th scope="col">Phone</th> : null}
                  {visibleColumns.email ? <th scope="col">Email</th> : null}
                  {visibleColumns.adminLogoUrl ? <th scope="col">Admin Logo</th> : null}
                  {visibleColumns.status ? <th scope="col">Status</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading schools...
                    </td>
                  </tr>
                ) : schoolsToRender.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 2}
                      className="text-center py-40 text-secondary-light"
                    >
                      No school records found.
                    </td>
                  </tr>
                ) : (
                  schoolsToRender.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">
                            {(currentPage - 1) * rowsPerPage + idx + 1}
                          </label>
                        </div>
                      </td>
                      {visibleColumns.schoolName ? (
                        <td className="fw-medium text-primary-light">{row.schoolName}</td>
                      ) : null}
                      {visibleColumns.subscription ? (
                        <td>
                          <span className="bg-primary-100 text-primary-600 px-12 py-4 radius-4 fw-medium text-sm">
                            {row.subscription}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.isDemo ? <td>{getIsDemoBadge(row.isDemo)}</td> : null}
                      {visibleColumns.address ? <td>{row.address}</td> : null}
                      {visibleColumns.phone ? <td>{row.phone}</td> : null}
                      {visibleColumns.email ? <td>{row.email}</td> : null}
                      {visibleColumns.adminLogoUrl ? (
                        <td>
                          <div
                            className="w-40-px h-40-px rounded-circle bg-neutral-200 d-flex align-items-center justify-content-center overflow-hidden"
                            style={{ minWidth: 40 }}
                          >
                            {row.adminLogoUrl ? (
                              <img
                                src={row.adminLogoUrl}
                                alt={row.schoolName}
                                className="w-100 h-100 object-fit-cover"
                              />
                            ) : (
                              <i className="ri-building-line text-secondary-light"></i>
                            )}
                          </div>
                        </td>
                      ) : null}
                      {visibleColumns.status ? <td>{getStatusBadge(row.status)}</td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          {canEdit(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                              onClick={() => openEdit(row)}
                              title="Edit"
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                          )}
                          {canDelete(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                              onClick={() => handleDeleteSchool(row.id)}
                              title="Delete"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          )}
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
              Showing {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {totalElements === 0
                ? 0
                : Math.min((currentPage - 1) * rowsPerPage + schoolsToRender.length, totalElements)} of {totalElements}
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
                  className={
                    p === currentPage
                      ? 'btn btn-sm btn-primary-600'
                      : 'btn btn-sm btn-light border'
                  }
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


      {/* Edit School Modal */}
      <WizardPopup
        modalWidth="650px"
        open={isEditOpen}
        title="Edit School"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleUpdateSchool}
        submitLabel="Update School"
      >
        {renderForm(
          editForm,
          setEditForm,
          editStep,
          editFrontendLogoPreview,
          setEditFrontendLogoPreview,
          editAdminLogoPreview,
          setEditAdminLogoPreview,
          {
            id: 'edit-frontend-logo',
            key: editFrontendLogoInputKey,
            reset: () => setEditFrontendLogoInputKey((k) => k + 1),
          },
          {
            id: 'edit-admin-logo',
            key: editAdminLogoInputKey,
            reset: () => setEditAdminLogoInputKey((k) => k + 1),
          },
        )}
      </WizardPopup>

      {/* Filter Sidebar */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter School"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <ManualScopeSelectors
                enabled
                headOffices={headOfficeOptions}
                schoolOptions={schoolLookupOptions}
                selectedHeadOfficeId={pendingFilters.headOfficeId}
                onHeadOfficeChange={(value) => {
                  setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: 'All' }))
                }}
                selectedSchoolId={pendingFilters.schoolId === 'All' ? '' : pendingFilters.schoolId}
                onSchoolChange={(value) => setPendingFilters((prev) => ({ ...prev, schoolId: value || 'All' }))}
              />
            </div>
          ) : (
            <>
              {isHeadOfficeScoped ? (
                <div>
                  <label
                    htmlFor="manageSchoolFilterHeadOffice"
                    className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
                  >
                    Head Office
                  </label>
                  <input
                    id="manageSchoolFilterHeadOffice"
                    className="form-control"
                    value={currentHeadOfficeName || ''}
                    readOnly
                  />
                </div>
              ) : null}

              {isSchoolScoped ? (
                <div>
                  <label
                    htmlFor="manageSchoolFilterSchool"
                    className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
                  >
                    School
                  </label>
                  <input
                    id="manageSchoolFilterSchool"
                    className="form-control"
                    value={currentSchoolName || schoolLookupOptions[0]?.schoolName || ''}
                    readOnly
                  />
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="schoolId"
                    className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
                  >
                    School
                  </label>
                  <select
                    id="schoolId"
                    className="form-control form-select"
                    value={pendingFilters.schoolId}
                    onChange={handlePendingFilterChange}
                  >
                    <option value="All">All Schools</option>
                    {schoolLookupOptions.map((option) => (
                      <option key={String(option.id)} value={String(option.id)}>
                        {option.schoolName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <div>
            <label
              htmlFor="status"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Status
            </label>
            <select
              id="status"
              className="form-control form-select"
              value={pendingFilters.status}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Status</option>
              {statusOptions.map((option) => (
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

export default ManageSchool
