import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ExportDropdown from '../components/ExportDropdown'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import {
  createAdmitCardSetting,
  deleteAdmitCardSetting,
  fetchAdmitCardSettingsPage,
  updateAdmitCardSetting,
} from '../apis/admitCardSettingsApi'
import '../assets/css/addModalShared.css'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  borderColor: '#e01ab5',
  topBackground: '#3b82f6',
  cardSchoolName: '',
  schoolNameFontSize: '',
  schoolNameColor: '#1f2937',
  schoolAddress: '',
  schoolAddressColor: '#374151',
  admitTitleFontSize: '',
  admitTitleColor: '#e01ab5',
  admitTitleBackground: '#3b82f6',
  titleFontSize: '',
  titleColor: '#e01ab5',
  valueFontSize: '',
  valueColor: '#e01ab5',
  examTitleFontSize: '',
  examTitleColor: '#e01ab5',
  subjectFontSize: '',
  subjectColor: '#e01ab5',
  bottomSignature: '',
  signatureBackground: '#1e3a5f',
  signatureColor: '#ffffff',
  signatureAlign: '',
  cardLogoUrl: '',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
}

const STEPS = ['Card Style', 'Text & Title Style', 'Signature & Logo']

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  'Card School Name': 'ri-font-size',
  'School Name Font Size': 'ri-text-spacing',
  'School Address': 'ri-map-pin-2-line',
  'Admit Title Font Size': 'ri-article-line',
  'Title Font Size': 'ri-heading',
  'Value Font Size': 'ri-list-check',
  'Exam Title Font Size': 'ri-file-list-3-line',
  'Subject Font Size': 'ri-book-open-line',
  'Bottom Signature': 'ri-pen-nib-line',
}

const columnOptions = [
  { key: 'headOfficeName', label: 'Head Office' },
  { key: 'schoolName', label: 'School' },
  { key: 'borderColor', label: 'Border Color' },
  { key: 'topBackground', label: 'Top Background' },
  { key: 'bottomSignature', label: 'Bottom Signature' },
  { key: 'signatureBackground', label: 'Signature Background' },
]

const ColorSwatch = ({ color }) => {
  const swatchColor = color || '#e5e7eb'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.85rem',
        color: '#34393f',
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          background: swatchColor,
          border: '1px solid rgba(0,0,0,0.12)',
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {color || '--'}
    </span>
  )
}

const getSafeText = (value, fallback = '--') => {
  const text = String(value ?? '').trim()
  return text || fallback
}

const AdmitCardPreview = ({ row, schoolName, headOfficeName }) => {
  const borderColor = row?.borderColor || '#e01ab5'
  const topBackground = row?.topBackground || borderColor
  const signatureBackground = row?.signatureBackground || borderColor
  const signatureColor = row?.signatureColor || '#ffffff'
  const align = row?.signatureAlign || 'center'

  const admitTitleBackground = row?.admitTitleBackground || topBackground
  const admitTitleColor = row?.admitTitleColor || '#ffffff'

  return (
    <div
      className="rounded-4 overflow-hidden shadow-sm"
      style={{
        border: `3px solid ${borderColor}`,
        background: '#fff',
        width: '100%',
        maxWidth: 560,
        margin: '0 auto',
      }}
    >
      <div
        className="p-16 text-white"
        style={{
          background: topBackground,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', opacity: 0.9, textTransform: 'uppercase' }}>
            {getSafeText(row?.cardSchoolName || schoolName, schoolName || 'School Name')}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1, marginTop: 6 }}>
            Admit Card
          </div>
          <div style={{ fontSize: 12, marginTop: 8, opacity: 0.95 }}>
            {getSafeText(headOfficeName, 'Head Office')}
          </div>
        </div>

        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {row?.cardLogoUrl ? (
            <img
              src={row.cardLogoUrl}
              alt={`${schoolName || 'School'} logo`}
              style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'rgba(255,255,255,0.92)' }}
            />
          ) : (
            <i className="ri-image-line" style={{ fontSize: 30, color: 'rgba(255,255,255,0.9)' }} />
          )}
        </div>
      </div>

      <div className="p-16" style={{ background: '#f8fafc' }}>
        <div
          className="rounded-4 p-16 mb-16 bg-white border"
          style={{ borderColor: `${borderColor}26`, boxShadow: '0 6px 24px rgba(15, 23, 42, 0.06)' }}
        >
          <div
            className="rounded-3 px-12 py-10 fw-semibold text-center mb-16"
            style={{
              background: admitTitleBackground,
              color: admitTitleColor,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Admit Card
          </div>

          <div className="d-flex align-items-start justify-content-between gap-12 mb-14">
            <div>
              <div className="text-secondary-light" style={{ fontSize: 12, letterSpacing: '0.08em' }}>School</div>
              <div className="fw-semibold text-primary-light" style={{ fontSize: 18, lineHeight: 1.2 }}>
                {getSafeText(row?.cardSchoolName || schoolName, schoolName || 'School Name')}
              </div>
              <div className="text-secondary-light mt-1" style={{ fontSize: 12 }}>
                {getSafeText(row?.schoolAddress, 'School address')}
              </div>
            </div>
            <div className="text-end">
              <div className="text-secondary-light" style={{ fontSize: 12 }}>Exam</div>
              <div className="fw-semibold" style={{ color: row?.examTitleColor || borderColor }}>
                {getSafeText(row?.examTitleFontSize ? `Font ${row.examTitleFontSize}` : '', 'Final Term')}
              </div>
            </div>
          </div>

          <div className="row g-2">
            <div className="col-6">
              <div className="rounded-3 p-3 bg-light border h-100">
                <div className="text-secondary-light" style={{ fontSize: 12 }}>Subject</div>
                <div className="fw-semibold" style={{ color: row?.subjectColor || borderColor }}>
                  {getSafeText(row?.subjectFontSize ? `Font ${row.subjectFontSize}` : '', 'All Subjects')}
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="rounded-3 p-3 bg-light border h-100">
                <div className="text-secondary-light" style={{ fontSize: 12 }}>Title / Value</div>
                <div className="fw-semibold" style={{ color: row?.titleColor || borderColor }}>
                  {getSafeText(row?.titleFontSize ? `T${row.titleFontSize}` : '', 'Roll No')}
                  <span style={{ marginLeft: 10, color: row?.valueColor || '#0f172a' }}>
                    {getSafeText(row?.valueFontSize ? `V${row.valueFontSize}` : '', '0001')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-3 p-16 text-white"
          style={{
            background: signatureBackground,
            color: signatureColor,
            textAlign: align,
          }}
        >
          <div className="fw-semibold" style={{ fontSize: 15 }}>
            {getSafeText(row?.bottomSignature, 'Authorized Signature')}
          </div>
          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>
            {`Align: ${align}`}
          </div>
        </div>
      </div>
    </div>
  )
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

const ColorField = ({ label, required, id, value, onChange, full = false }) => (
  <div className={`avm-field${full ? ' full' : ''}`}>
    <label className="avm-label">
      {label}
      {required ? <span className="req"> *</span> : null}
    </label>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <input
        type="color"
        id={id}
        value={value}
        onChange={onChange}
        style={{
          width: 38,
          height: 38,
          border: '1px solid #d0d5dd',
          borderRadius: '0.5rem',
          padding: 2,
          cursor: 'pointer',
          background: '#fff',
          flexShrink: 0,
        }}
      />
      <input
        type="text"
        className="avm-input"
        value={value}
        onChange={onChange}
        id={id}
        placeholder="#000000"
        style={{ flex: 1 }}
      />
    </div>
  </div>
)

const getSchoolById = (rows, schoolId) =>
  (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(schoolId ?? '')) || null

const AdmitCardSetting = () => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId } = useSchool()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [rows, setRows] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [previewRow, setPreviewRow] = useState(null)
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [addLogoPreview, setAddLogoPreview] = useState('')
  const [editLogoPreview, setEditLogoPreview] = useState('')
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const addLogoRef = useRef(null)
  const editLogoRef = useRef(null)

  const resolveSchoolById = useCallback((schoolId) => getSchoolById(allSchools, schoolId), [allSchools])

  const resolveHeadOfficeName = useCallback(
    (headOfficeId) => {
      if (headOfficeId == null) return ''
      const row = manualScope.headOffices.find((ho) => String(ho.id) === String(headOfficeId))
      return row?.name || `Head Office ${headOfficeId}`
    },
    [manualScope.headOffices],
  )

  const resolveSchoolName = useCallback(
    (schoolId) => resolveSchoolById(schoolId)?.schoolName || (String(schoolId ?? '') === String(authSchoolId ?? '') ? authSchoolName || '' : ''),
    [authSchoolId, authSchoolName, resolveSchoolById],
  )

  const schoolOptions = useMemo(() => {
    const rowsList = Array.isArray(allSchools) ? allSchools : []
    if (isSuperAdmin) {
      const headOfficeId = String(addForm.headOfficeId || '').trim()
      if (!headOfficeId) return []
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === headOfficeId)
    }
    if (isHeadOfficeAdmin) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return rowsList.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return rowsList
  }, [allSchools, addForm.headOfficeId, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin])

  const editSchoolOptions = useMemo(() => {
    const rowsList = Array.isArray(allSchools) ? allSchools : []
    if (isSuperAdmin) {
      const headOfficeId = String(editForm.headOfficeId || '').trim()
      if (!headOfficeId) return []
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === headOfficeId)
    }
    if (isHeadOfficeAdmin) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return rowsList.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return rowsList
  }, [allSchools, authHeadOfficeId, authSchoolId, editForm.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin])

  const filterSchoolOptions = useMemo(() => {
    const rowsList = Array.isArray(allSchools) ? allSchools : []
    if (pendingFilters.headOfficeId) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(pendingFilters.headOfficeId))
    }
    if (filters.headOfficeId) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(filters.headOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }
    if (isSchoolAdmin) {
      return rowsList.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }
    return rowsList
  }, [allSchools, authHeadOfficeId, authSchoolId, filters.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin, pendingFilters.headOfficeId])

  const loadLookups = useCallback(async () => {
    setLookupLoading(true)
    try {
      const schools = await fetchSchoolsLookup()
      setAllSchools(Array.isArray(schools) ? schools : [])
    } catch (err) {
      console.error('Failed to load admit card lookups:', err)
      setAllSchools([])
    } finally {
      setLookupLoading(false)
    }
  }, [])

  const loadAdmitCardSettings = useCallback(async () => {
    if (status !== 'ready' || !token) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchAdmitCardSettingsPage({
        page: currentPage - 1,
        size: rowsPerPage,
        search: debouncedSearch,
        headOfficeId: filters.headOfficeId || undefined,
        schoolId: filters.schoolId || undefined,
      })
      setRows(Array.isArray(data?.content) ? data.content : [])
      setTotalElements(Number(data?.totalElements ?? 0))
      setTotalPages(Number(data?.totalPages ?? 0))
    } catch (err) {
      console.error('Failed to load admit card settings:', err)
      setError(err?.message || 'Failed to load admit card settings')
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, filters.headOfficeId, filters.schoolId, rowsPerPage, status, token])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    void loadLookups()
  }, [loadLookups, status, token])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    void loadAdmitCardSettings()
  }, [loadAdmitCardSettings, status, token])

  useEffect(() => {
    if (!isSuperAdmin) return
    if (!activeSchoolId) return
    const school = getSchoolById(allSchools, activeSchoolId)
    if (school?.headOfficeId == null) return
    setAddForm((prev) => ({
      ...prev,
      headOfficeId: String(school.headOfficeId),
      schoolId: String(activeSchoolId),
    }))
  }, [activeSchoolId, allSchools, isSuperAdmin])

  useEffect(() => {
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      setAddForm((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
      setEditForm((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
    }
  }, [authHeadOfficeId, isHeadOfficeAdmin])

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return
    const school = getSchoolById(allSchools, authSchoolId)
    setAddForm((prev) => ({
      ...prev,
      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
      schoolId: String(authSchoolId),
    }))
    setEditForm((prev) => ({
      ...prev,
      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
      schoolId: String(authSchoolId),
    }))
  }, [allSchools, authSchoolId, isSchoolAdmin])

  useEffect(() => {
    if (currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const buildPayload = (form) => ({
    headOfficeId: form.headOfficeId ? Number(form.headOfficeId) : null,
    schoolId: form.schoolId ? Number(form.schoolId) : null,
    borderColor: String(form.borderColor || '').trim(),
    topBackground: String(form.topBackground || '').trim(),
    cardSchoolName: String(form.cardSchoolName || '').trim(),
    schoolNameFontSize: String(form.schoolNameFontSize || '').trim(),
    schoolNameColor: String(form.schoolNameColor || '').trim(),
    schoolAddress: String(form.schoolAddress || '').trim(),
    schoolAddressColor: String(form.schoolAddressColor || '').trim(),
    admitTitleFontSize: String(form.admitTitleFontSize || '').trim(),
    admitTitleColor: String(form.admitTitleColor || '').trim(),
    admitTitleBackground: String(form.admitTitleBackground || '').trim(),
    titleFontSize: String(form.titleFontSize || '').trim(),
    titleColor: String(form.titleColor || '').trim(),
    valueFontSize: String(form.valueFontSize || '').trim(),
    valueColor: String(form.valueColor || '').trim(),
    examTitleFontSize: String(form.examTitleFontSize || '').trim(),
    examTitleColor: String(form.examTitleColor || '').trim(),
    subjectFontSize: String(form.subjectFontSize || '').trim(),
    subjectColor: String(form.subjectColor || '').trim(),
    bottomSignature: String(form.bottomSignature || '').trim(),
    signatureBackground: String(form.signatureBackground || '').trim(),
    signatureColor: String(form.signatureColor || '').trim(),
    signatureAlign: String(form.signatureAlign || '').trim(),
    cardLogoUrl: String(form.cardLogoUrl || '').trim(),
  })

  const syncScopeSelection = (headOfficeId, schoolId) => {
    manualScope.setSelectedScope(headOfficeId, schoolId)
  }

  const openAdd = () => {
    const base = { ...emptyForm }
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      base.headOfficeId = String(authHeadOfficeId)
    }
    if (isSchoolAdmin && authSchoolId != null) {
      const school = getSchoolById(allSchools, authSchoolId)
      base.schoolId = String(authSchoolId)
      base.headOfficeId = school?.headOfficeId != null ? String(school.headOfficeId) : ''
    }
    if (isSuperAdmin && manualScope.selectedHeadOfficeId) {
      base.headOfficeId = String(manualScope.selectedHeadOfficeId)
      base.schoolId = String(manualScope.selectedSchoolId || '')
    }
    setAddForm(base)
    setAddLogoPreview(base.cardLogoUrl || '')
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    const school = getSchoolById(allSchools, row?.schoolId)
    const headOfficeId = row?.headOfficeId != null ? String(row.headOfficeId) : school?.headOfficeId != null ? String(school.headOfficeId) : ''
    const schoolId = row?.schoolId != null ? String(row.schoolId) : ''
    const nextForm = {
      id: row?.id != null ? String(row.id) : '',
      headOfficeId,
      schoolId,
      borderColor: row?.borderColor || '#e01ab5',
      topBackground: row?.topBackground || '#3b82f6',
      cardSchoolName: row?.cardSchoolName || '',
      schoolNameFontSize: row?.schoolNameFontSize || '',
      schoolNameColor: row?.schoolNameColor || '#1f2937',
      schoolAddress: row?.schoolAddress || '',
      schoolAddressColor: row?.schoolAddressColor || '#374151',
      admitTitleFontSize: row?.admitTitleFontSize || '',
      admitTitleColor: row?.admitTitleColor || '#e01ab5',
      admitTitleBackground: row?.admitTitleBackground || row?.topBackground || '#3b82f6',
      titleFontSize: row?.titleFontSize || '',
      titleColor: row?.titleColor || '#e01ab5',
      valueFontSize: row?.valueFontSize || '',
      valueColor: row?.valueColor || '#e01ab5',
      examTitleFontSize: row?.examTitleFontSize || '',
      examTitleColor: row?.examTitleColor || '#e01ab5',
      subjectFontSize: row?.subjectFontSize || '',
      subjectColor: row?.subjectColor || '#e01ab5',
      bottomSignature: row?.bottomSignature || '',
      signatureBackground: row?.signatureBackground || '#1e3a5f',
      signatureColor: row?.signatureColor || '#ffffff',
      signatureAlign: row?.signatureAlign || '',
      cardLogoUrl: row?.cardLogoUrl || '',
    }
    setEditForm(nextForm)
    setEditLogoPreview(nextForm.cardLogoUrl || '')
    setEditStep(0)
    setIsEditOpen(true)
    if (isSuperAdmin) {
      syncScopeSelection(nextForm.headOfficeId, nextForm.schoolId)
    }
  }

  const openPreview = (row) => {
    setPreviewRow(row)
  }

  const handleSaveAdd = async () => {
    const payload = buildPayload(addForm)
    if (!payload.headOfficeId || !payload.schoolId || !payload.borderColor || !payload.topBackground || !payload.bottomSignature || !payload.signatureBackground) {
      setError('Head office, school, border color, top background, bottom signature, and signature background are required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await createAdmitCardSetting(payload)
      setIsAddOpen(false)
      setAddForm(emptyForm)
      setAddLogoPreview('')
      await loadAdmitCardSettings()
    } catch (err) {
      console.error('Failed to create admit card setting:', err)
      setError(err?.message || 'Failed to create admit card setting')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    const payload = buildPayload(editForm)
    if (!payload.headOfficeId || !payload.schoolId || !payload.borderColor || !payload.topBackground || !payload.bottomSignature || !payload.signatureBackground) {
      setError('Head office, school, border color, top background, bottom signature, and signature background are required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await updateAdmitCardSetting(editForm.id, payload)
      setIsEditOpen(false)
      await loadAdmitCardSettings()
    } catch (err) {
      console.error('Failed to update admit card setting:', err)
      setError(err?.message || 'Failed to update admit card setting')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete admit card setting for "${row?.schoolName || 'this school'}"?`)) return
    setSaving(true)
    setError('')
    try {
      await deleteAdmitCardSetting(row.id)
      await loadAdmitCardSettings()
    } catch (err) {
      console.error('Failed to delete admit card setting:', err)
      setError(err?.message || 'Failed to delete admit card setting')
    } finally {
      setSaving(false)
    }
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

  const loadExportRows = useCallback(async () => {
    const size = Math.max(totalElements, rowsPerPage, 1)
    const data = await fetchAdmitCardSettingsPage({
      page: 0,
      size,
      search: debouncedSearch,
      headOfficeId: filters.headOfficeId || undefined,
      schoolId: filters.schoolId || undefined,
    })
    return Array.isArray(data?.content) ? data.content : []
  }, [debouncedSearch, filters.headOfficeId, filters.schoolId, rowsPerPage, totalElements])

  const mapExportRow = useCallback(
    (row) => ({
      ...row,
      headOfficeName: row.headOfficeName || resolveHeadOfficeName(row.headOfficeId),
      schoolName: row.schoolName || resolveSchoolName(row.schoolId),
    }),
    [resolveHeadOfficeName, resolveSchoolName],
  )

  const handleLogoChange = (setter, setPreview) => (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const value = String(event.target?.result || '')
      setter((prev) => ({ ...prev, cardLogoUrl: value }))
      setPreview(value)
    }
    reader.readAsDataURL(file)
  }

  const clearLogo = (setter, setPreview, ref) => {
    setter((prev) => ({ ...prev, cardLogoUrl: '' }))
    setPreview('')
    if (ref.current) ref.current.value = ''
  }

  const handleFieldChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({ ...prev, [id]: value }))
  }

  const currentStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const currentEnd = totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)
  const pageCount = Math.max(1, totalPages)

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(pageCount, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  const renderForm = (form, setter, logoPreview, setLogoPreview, logoRef, step, schoolList) => (
    <>
      <p className="avm-section-title">{STEPS[step]}</p>
      <div className="avm-grid">
        {step === 0 ? (
          <>
            {isSuperAdmin ? (
              <ManualScopeSelectors
                enabled
                headOffices={manualScope.headOffices}
                schoolOptions={schoolOptions}
                selectedHeadOfficeId={form.headOfficeId}
                onHeadOfficeChange={(value) => {
                  setter((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))
                  syncScopeSelection(value, '')
                }}
                selectedSchoolId={form.schoolId}
                onSchoolChange={(value) => {
                  const selectedSchool = getSchoolById(allSchools, value)
                  setter((prev) => ({
                    ...prev,
                    schoolId: value,
                    headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
                  }))
                  syncScopeSelection(selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : form.headOfficeId, value)
                }}
                schoolLabel="School"
              />
            ) : (
              <>
                {isHeadOfficeAdmin ? (
                  <FormField label="Head Office" full>
                    <input className="avm-input" value={authHeadOfficeName || String(authHeadOfficeId || '')} disabled />
                  </FormField>
                ) : null}

                <FormField label="School Name" required full>
                  <select
                    className="avm-select"
                    id="schoolId"
                    value={form.schoolId}
                    onChange={(e) => {
                      const value = e.target.value
                      const selectedSchool = getSchoolById(schoolList, value)
                      setter((prev) => ({
                        ...prev,
                        schoolId: value,
                        headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
                      }))
                    }}
                  >
                    <option value="">--Select School--</option>
                    {schoolList.map((school) => (
                      <option key={String(school.id)} value={String(school.id)}>
                        {school.schoolName}
                      </option>
                    ))}
                  </select>
                </FormField>
              </>
            )}

            <ColorField label="Border Color" id="borderColor" value={form.borderColor} onChange={handleFieldChange(setter)} />
            <ColorField label="Top Background" id="topBackground" value={form.topBackground} onChange={handleFieldChange(setter)} />

            <FormField label="Card School Name" full>
              <input
                type="text"
                className="avm-input"
                id="cardSchoolName"
                placeholder="Card School Name"
                value={form.cardSchoolName}
                onChange={handleFieldChange(setter)}
              />
            </FormField>

            <FormField label="School Name Font Size">
              <input
                type="number"
                className="avm-input"
                id="schoolNameFontSize"
                placeholder="e.g. 14"
                value={form.schoolNameFontSize}
                onChange={handleFieldChange(setter)}
              />
            </FormField>
            <ColorField label="School Name Color" id="schoolNameColor" value={form.schoolNameColor} onChange={handleFieldChange(setter)} />

            <FormField label="School Address" full>
              <input
                type="text"
                className="avm-input"
                id="schoolAddress"
                placeholder="School Address"
                value={form.schoolAddress}
                onChange={handleFieldChange(setter)}
              />
            </FormField>
            <ColorField label="School Address Color" id="schoolAddressColor" value={form.schoolAddressColor} onChange={handleFieldChange(setter)} />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <FormField label="Admit Title Font Size">
              <input
                type="number"
                className="avm-input"
                id="admitTitleFontSize"
                placeholder="e.g. 16"
                value={form.admitTitleFontSize}
                onChange={handleFieldChange(setter)}
              />
            </FormField>
            <ColorField label="Admit Title Color" id="admitTitleColor" value={form.admitTitleColor} onChange={handleFieldChange(setter)} />
            <ColorField label="Admit Title Background" id="admitTitleBackground" value={form.admitTitleBackground} onChange={handleFieldChange(setter)} full />

            <FormField label="Title Font Size">
              <input
                type="number"
                className="avm-input"
                id="titleFontSize"
                placeholder="e.g. 13"
                value={form.titleFontSize}
                onChange={handleFieldChange(setter)}
              />
            </FormField>
            <ColorField label="Title Color" id="titleColor" value={form.titleColor} onChange={handleFieldChange(setter)} />

            <FormField label="Value Font Size">
              <input
                type="number"
                className="avm-input"
                id="valueFontSize"
                placeholder="e.g. 13"
                value={form.valueFontSize}
                onChange={handleFieldChange(setter)}
              />
            </FormField>
            <ColorField label="Value Color" id="valueColor" value={form.valueColor} onChange={handleFieldChange(setter)} />

            <FormField label="Exam Title Font Size">
              <input
                type="number"
                className="avm-input"
                id="examTitleFontSize"
                placeholder="e.g. 14"
                value={form.examTitleFontSize}
                onChange={handleFieldChange(setter)}
              />
            </FormField>
            <ColorField label="Exam Title Color" id="examTitleColor" value={form.examTitleColor} onChange={handleFieldChange(setter)} />

            <FormField label="Subject Font Size">
              <input
                type="number"
                className="avm-input"
                id="subjectFontSize"
                placeholder="e.g. 12"
                value={form.subjectFontSize}
                onChange={handleFieldChange(setter)}
              />
            </FormField>
            <ColorField label="Subject Color" id="subjectColor" value={form.subjectColor} onChange={handleFieldChange(setter)} />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <FormField label="Bottom Signature" required full>
              <input
                type="text"
                className="avm-input"
                id="bottomSignature"
                placeholder="Bottom Signature"
                value={form.bottomSignature}
                onChange={handleFieldChange(setter)}
              />
            </FormField>

            <ColorField label="Signature Background" id="signatureBackground" value={form.signatureBackground} onChange={handleFieldChange(setter)} />
            <ColorField label="Signature Color" id="signatureColor" value={form.signatureColor} onChange={handleFieldChange(setter)} />

            <FormField label="Signature Align" noIcon>
              <select className="avm-select" id="signatureAlign" value={form.signatureAlign} onChange={handleFieldChange(setter)}>
                <option value="">--Select--</option>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </FormField>

            <div className="avm-field full">
              <label className="avm-label">Card Logo</label>
              <div
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
                }}
                onClick={() => logoRef.current?.click()}
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Card Logo Preview"
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
                    {logoPreview ? 'Change Logo' : 'Upload Card Logo'}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                    Dimension:- Max-W: 100px, Max-H: 110px
                  </p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#7a8a9a' }}>
                    Image file format: .jpg, .jpeg, .png or .gif
                  </p>
                </div>
                <input
                  ref={logoRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif"
                  style={{ display: 'none' }}
                  onChange={handleLogoChange(setter, setLogoPreview)}
                />
              </div>
              {logoPreview ? (
                <button
                  type="button"
                  className="avm-btn light sm"
                  style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                  onClick={() => clearLogo(setter, setLogoPreview, logoRef)}
                >
                  <i className="ri-delete-bin-line"></i> Remove
                </button>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </>
  )

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Admit Card Setting</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / Admit Card Setting</span>
          </div>
        </div>
        <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <span className="d-flex text-md">
            <i className="ri-add-large-line"></i>
          </span>
          Add Admit Card Setting
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown
                rows={rows}
                columns={columnOptions}
                visibleColumns={visibleColumns}
                loadRows={loadExportRows}
                mapRow={mapExportRow}
                fileName="Admit_Card_Settings"
                sheetName="Admit Card Settings"
                pdfTitle="Admit Card Settings Report"
              />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="text-secondary-light text-sm">Filter</span>
                <i className="ri-arrow-right-line"></i>
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <ul className="dropdown-menu p-12 border shadow">
                  {columnOptions.map((col) => (
                    <li key={col.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={visibleColumns[col.key]}
                          onChange={() => toggleColumn(col.key)}
                        />
                        {col.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <RowsPerPageSelect
                value={rowsPerPage}
                onChange={(value) => {
                  setRowsPerPage(value)
                  setCurrentPage(1)
                }}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search admit card settings..."
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

          {error ? <div className="px-20 py-12 text-danger">{error}</div> : null}
          {lookupLoading ? <div className="px-20 py-12 text-secondary-light">Loading lookups...</div> : null}

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th scope="col">S.L</th>
                  {columnOptions.map((column) => (visibleColumns[column.key] ? <th key={column.key} scope="col">{column.label}</th> : null))}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading admit card settings...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No admit card settings found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id ?? idx}>
                      <td>
                        <span className="fw-medium text-primary-light">{currentStart + idx}</span>
                      </td>
                      {visibleColumns.headOfficeName ? <td>{row.headOfficeName || resolveHeadOfficeName(row.headOfficeId) || '--'}</td> : null}
                      {visibleColumns.schoolName ? <td className="fw-medium text-primary-light">{row.schoolName || resolveSchoolName(row.schoolId) || '--'}</td> : null}
                      {visibleColumns.borderColor ? <td><ColorSwatch color={row.borderColor || '--'} /></td> : null}
                      {visibleColumns.topBackground ? <td><ColorSwatch color={row.topBackground || '--'} /></td> : null}
                      {visibleColumns.bottomSignature ? <td>{row.bottomSignature || '--'}</td> : null}
                      {visibleColumns.signatureBackground ? <td><ColorSwatch color={row.signatureBackground || '--'} /></td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-primary-focus bg-hover-primary-200 text-primary-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => openPreview(row)}
                            title="Preview"
                            aria-label="Preview admit card"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
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
              Showing {totalElements === 0 ? 0 : currentStart} - {currentEnd} of {totalElements}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                Prev
              </button>
              {getVisiblePages().map((p) => (
                <button key={p} type="button" className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'} onClick={() => setCurrentPage(p)}>
                  {p}
                </button>
              ))}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))} disabled={currentPage === pageCount}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {previewRow ? (
        <div
          role="presentation"
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.72)', zIndex: 1060, padding: '24px' }}
          onClick={() => setPreviewRow(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white radius-16 shadow-lg p-16 position-relative"
            style={{ maxWidth: '900px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn btn-light border position-absolute top-0 end-0 m-12 rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '36px', height: '36px' }}
              onClick={() => setPreviewRow(null)}
              aria-label="Close preview"
            >
              <i className="ri-close-line"></i>
            </button>
            <div className="d-flex align-items-center justify-content-between mb-12 pe-40">
              <h6 className="mb-0 fw-semibold text-primary-light">
                {previewRow.schoolName || resolveSchoolName(previewRow.schoolId) || 'Admit Card Preview'}
              </h6>
              <span className="badge text-bg-light border text-secondary-light">Read-only preview</span>
            </div>
            <div className="bg-light radius-12 p-16">
              <AdmitCardPreview
                row={previewRow}
                schoolName={resolveSchoolName(previewRow.schoolId)}
                headOfficeName={resolveHeadOfficeName(previewRow.headOfficeId)}
              />
            </div>
          </div>
        </div>
      ) : null}

      <WizardPopup
        modalWidth="760px"
        open={isAddOpen}
        title="Add Admit Card Setting"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleSaveAdd}
        submitLabel="Save"
        saving={saving}
      >
        {renderForm(addForm, setAddForm, addLogoPreview, setAddLogoPreview, addLogoRef, addStep, schoolOptions)}
      </WizardPopup>

      <WizardPopup
        modalWidth="760px"
        open={isEditOpen}
        title="Edit Admit Card Setting"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={handleSaveEdit}
        submitLabel="Update"
        saving={saving}
      >
        {renderForm(editForm, setEditForm, editLogoPreview, setEditLogoPreview, editLogoRef, editStep, editSchoolOptions)}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Admit Card Settings"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <ManualScopeSelectors
                enabled
                headOffices={manualScope.headOffices}
                schoolOptions={filterSchoolOptions}
                selectedHeadOfficeId={pendingFilters.headOfficeId}
                onHeadOfficeChange={(value) => setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: '' }))}
                selectedSchoolId={pendingFilters.schoolId}
                onSchoolChange={(value) => setPendingFilters((prev) => ({ ...prev, schoolId: value }))}
                schoolLabel="School"
              />
            </div>
          ) : (
            <>
              {isHeadOfficeAdmin ? (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="filterHeadOffice" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                    Head Office
                  </label>
                  <input id="filterHeadOffice" className="form-control" value={authHeadOfficeName || String(authHeadOfficeId || '')} disabled />
                </div>
              ) : null}

              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="filterSchool" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                  School
                </label>
                <select
                  id="filterSchool"
                  className="form-control form-select"
                  value={pendingFilters.schoolId}
                  onChange={(e) => setPendingFilters((prev) => ({ ...prev, schoolId: e.target.value }))}
                >
                  <option value="">All Schools</option>
                  {filterSchoolOptions.map((school) => (
                    <option key={String(school.id)} value={String(school.id)}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

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

export default AdmitCardSetting
