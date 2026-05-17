import { useMemo, useState, useEffect, useCallback } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import {
  fetchFeeCollectionsPage,
  createFeeCollection,
  deleteFeeCollection,
  updateFeeCollection,
} from '../apis/feeCollectionApi'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchStudentsByClassSection } from '../apis/studentsApi'
import { fetchFeeTypes } from '../apis/feeTypesApi'
import { fetchDiscounts } from '../apis/discountsApi'
import { normalizeRole } from '../utils/roles'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

// Removed dummy data
const EDIT_STORAGE_KEY = 'edit-fee-collection-row'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  classId: '',
  studentId: '',
  feeTypeId: '',
  discountId: '',
  feeAmount: '0.00',
  month: '',
  isApplicableDiscount: 'No',
  paidStatus: 'Unpaid',
  note: '',
  grossAmount: '0.00',
  discount: '0.00',
  netAmount: '0.00',
  dueAmount: '0.00',
}

const emptyBulkForm = {
  headOfficeId: '',
  schoolId: '',
  classId: '',
  feeTypeId: '',
  discountId: '',
  feeAmount: '0.00',
  studentId: '',
  isApplicableDiscount: 'No',
  month: '',
  paidStatus: 'Unpaid',
  note: '',
}

const emptyFilters = {
  school: 'Select',
  status: 'Select',
  month: 'Select',
}

const INVOICE_STEPS = ['Basic Information', 'Fee Details', 'Payment Details']
const BULK_STEPS = ['Basic Information', 'Fee Details', 'Payment Details']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Class: 'ri-group-line',
  Student: 'ri-user-3-line',
  'Fee Type': 'ri-file-list-line',
  'Fee Amount': 'ri-coin-line',
  Month: 'ri-calendar-line',
  'Is Applicable Discount?': 'ri-discount-line',
  'Paid Status': 'ri-checkbox-circle-line',
  Note: 'ri-file-text-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'invoiceNumber', label: 'Invoice Number' },
  { key: 'studentSaleTo', label: 'Student/Sale To' },
  { key: 'month', label: 'Month' },
  { key: 'grossAmount', label: 'Gross Amount' },
  { key: 'discount', label: 'Discount' },
  { key: 'netAmount', label: 'Net Amount' },
  { key: 'dueAmount', label: 'Due Amount' },
  { key: 'status', label: 'Status' },
]

const monthOptions = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const applicableDiscountOptions = ['Yes', 'No']
const paidStatusOptions = ['Paid', 'Unpaid', 'Partial']

const getStatusBadge = (status) => {
  if (status === 'Paid') {
    return <span className="bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm">Paid</span>
  }
  if (status === 'Partial') {
    return <span className="bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm">Partial</span>
  }
  return <span className="bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm">Unpaid</span>
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

const FeeCollection = ({ onNavigate } = {}) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName, schoolId: authSchoolId } = useAuth()
  const { activeSchoolId } = useSchool()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : null
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [addStep, setAddStep] = useState(0)
  const [bulkStep, setBulkStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  const [addForm, setAddForm] = useState(emptyForm)
  const [bulkForm, setBulkForm] = useState(emptyBulkForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [feeCollections, setFeeCollections] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [headOffices, setHeadOffices] = useState([])
  const [schools, setSchools] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [formSchoolOptions, setFormSchoolOptions] = useState([])
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [feeTypes, setFeeTypes] = useState([])
  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)
  const currentForm = isEditOpen ? editForm : (isBulkOpen ? bulkForm : addForm)
  const currentFormHeadOfficeId = currentForm.headOfficeId
  const currentFormSchoolId = currentForm.schoolId
  const currentFormClassId = currentForm.classId
  const listSchoolId = isSuperAdmin
    ? (manualScope.selectedSchoolId ? String(manualScope.selectedSchoolId) : activeSchoolId ? String(activeSchoolId) : '')
    : activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''
  const resolveSchoolIdFromName = useCallback((schoolName) => {
    if (!schoolName || schoolName === 'Select') return null
    const match = (Array.isArray(schools) ? schools : []).find((school) => school.schoolName === schoolName)
    return match?.id != null ? String(match.id) : null
  }, [schools])
  const schoolOptions = useMemo(() => (Array.isArray(schools) ? schools : []), [schools])
  const classOptions = useMemo(() => {
    const list = Array.isArray(classes) ? classes : []
    if (!currentFormSchoolId) return list
    return list.filter((row) => String(row?.schoolId ?? '') === String(currentFormSchoolId))
  }, [classes, currentFormSchoolId])
  const feeTypeOptions = useMemo(() => (Array.isArray(feeTypes) ? feeTypes : []), [feeTypes])
  const discountMasterOptions = useMemo(() => (Array.isArray(discounts) ? discounts : []), [discounts])

  const calculateDiscountAmount = useCallback((form, discountId) => {
    const selected = discountMasterOptions.find((item) => String(item?.id ?? '') === String(discountId))
    if (!selected || form?.isApplicableDiscount !== 'Yes') return 0
    const feeAmount = Number(form?.feeAmount || 0)
    const baseAmount = Number(selected?.amount || 0)
    if (String(selected?.discountType || '').toLowerCase() === 'percentage') {
      return (feeAmount * baseAmount) / 100
    }
    return baseAmount
  }, [discountMasterOptions])

  const recalcTotals = useCallback((form, nextDiscountId = form?.discountId) => {
    const feeAmount = Number(form?.feeAmount || 0)
    const discountAmount = form?.isApplicableDiscount === 'Yes' ? calculateDiscountAmount(form, nextDiscountId) : 0
    const netAmount = Math.max(feeAmount - discountAmount, 0)
    const dueAmount = form?.paidStatus === 'Paid' ? 0 : netAmount
    return {
      discountId: form?.isApplicableDiscount === 'Yes' ? (nextDiscountId || '') : '',
      grossAmount: feeAmount.toFixed(2),
      discount: discountAmount.toFixed(2),
      netAmount: netAmount.toFixed(2),
      dueAmount: dueAmount.toFixed(2),
    }
  }, [calculateDiscountAmount])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const filterSchoolId = resolveSchoolIdFromName(filters.school)
      const effectiveSchoolId = filterSchoolId || listSchoolId || null
      const pageData = await fetchFeeCollectionsPage({
        schoolId: effectiveSchoolId,
        status: filters.status,
        month: filters.month,
        search: debouncedSearch,
        page: currentPage - 1,
        size: rowsPerPage,
      })
      setFeeCollections(Array.isArray(pageData?.content) ? pageData.content : [])
      setTotalElements(Number(pageData?.totalElements ?? 0))
      setTotalPages(Number(pageData?.totalPages ?? 0))
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load fee collections')
      setFeeCollections([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, currentPage, filters.month, filters.school, filters.status, listSchoolId, resolveSchoolIdFromName, rowsPerPage])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    let cancelled = false

    const loadLookupData = async () => {
      try {
        const [schoolsData, classesData] = await Promise.all([
          fetchSchoolsLookup(),
          fetchClasses(),
        ])
        if (cancelled) return
        const nextSchools = Array.isArray(schoolsData) ? schoolsData : []
        setSchools(nextSchools)
        setAllSchools(nextSchools)
        setClasses(Array.isArray(classesData) ? classesData : [])
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load school/class options:', err)
        setSchools([])
        setAllSchools([])
        setClasses([])
      }
    }

    void loadLookupData()
    return () => {
      cancelled = true
    }
  }, [status, token, isSuperAdmin, isHeadOfficeAdmin, isSchoolAdmin])

  useEffect(() => {
    const rows = Array.isArray(allSchools) ? allSchools : []
    if (isSuperAdmin) {
      if (!currentFormHeadOfficeId) {
        setFormSchoolOptions([])
        return
      }
      setFormSchoolOptions(rows.filter((school) => String(school.headOfficeId ?? '') === String(currentFormHeadOfficeId)))
      return
    }
    if (isHeadOfficeAdmin) {
      setFormSchoolOptions(rows.filter((school) => String(school.headOfficeId ?? '') === String(authHeadOfficeId)))
      return
    }
    if (isSchoolAdmin) {
      setFormSchoolOptions(rows.filter((school) => String(school.id ?? '') === String(authSchoolId)))
      return
    }
    setFormSchoolOptions(rows)
  }, [allSchools, isSuperAdmin, isHeadOfficeAdmin, isSchoolAdmin, currentFormHeadOfficeId, authHeadOfficeId, authSchoolId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    if (isSchoolAdmin) return
    const tasks = []
    if (isSuperAdmin || isHeadOfficeAdmin) {
      tasks.push(
        fetchHeadOfficesPage(0, 500)
          .then((page) => {
            const content = Array.isArray(page?.content) ? page.content : []
            setHeadOffices(content)
          })
          .catch(() => {}),
      )
    }
    Promise.all(tasks).catch(() => {})
  }, [status, token, isSuperAdmin, isHeadOfficeAdmin, isSchoolAdmin])

  useEffect(() => {
    if (!isSuperAdmin && listSchoolId) {
      setAddForm((prev) => ({ ...prev, headOfficeId: authHeadOfficeId != null ? String(authHeadOfficeId) : prev.headOfficeId, schoolId: listSchoolId }))
      setBulkForm((prev) => ({ ...prev, headOfficeId: authHeadOfficeId != null ? String(authHeadOfficeId) : prev.headOfficeId, schoolId: listSchoolId }))
    }
  }, [isSuperAdmin, listSchoolId, authHeadOfficeId])

  useEffect(() => {
    if (!currentFormSchoolId) {
      setFeeTypes([])
      setDiscounts([])
      return
    }
    fetchFeeTypes({ schoolId: currentFormSchoolId }).then(data => setFeeTypes(Array.isArray(data) ? data : []))
  }, [currentFormSchoolId])

  useEffect(() => {
    if (!currentFormSchoolId) {
      setDiscounts([])
      return
    }
    fetchDiscounts({ schoolId: currentFormSchoolId })
      .then((data) => setDiscounts(Array.isArray(data) ? data : []))
      .catch(() => setDiscounts([]))
  }, [currentFormSchoolId])

  useEffect(() => {
    if (!currentFormSchoolId || !currentFormClassId) {
      setStudents([])
      return
    }
    fetchStudentsByClassSection({ schoolId: currentFormSchoolId, classId: currentFormClassId })
      .then(data => setStudents(Array.isArray(data) ? data : []))
  }, [currentFormSchoolId, currentFormClassId])

  const paginated = feeCollections

  const allSelected = paginated.length > 0 && paginated.every((row) => selectedRows.includes(row.id))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((row) => row.id)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !paginated.some((row) => row.id === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    )
  }

  const handleDownloadInvoice = (row) => {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('INVOICE', 105, 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text(`School: ${row.schoolName}`, 20, 40)
    doc.text(`Invoice No: ${row.invoiceNumber}`, 20, 50)
    doc.text(`Date: ${new Date(row.createdAt).toLocaleDateString()}`, 20, 60)
    
    doc.text(`Student: ${row.studentName}`, 20, 80)
    doc.text(`Class: ${row.className}`, 20, 90)
    doc.text(`Month: ${row.month}`, 20, 100)

    const tableData = [
      ['Fee Type', 'Amount'],
      [row.feeTypeTitle || 'School Fee', `$${row.feeAmount.toFixed(2)}`],
      ['Gross Amount', `$${row.grossAmount.toFixed(2)}`],
      ['Discount', `$${row.discount.toFixed(2)}`],
      ['Net Amount', `$${row.netAmount.toFixed(2)}`],
      ['Paid Status', row.paidStatus],
      ['Due Amount', `$${row.dueAmount.toFixed(2)}`],
    ]

    autoTable(doc, {
      startY: 110,
      head: [tableData[0]],
      body: tableData.slice(1),
    })

    doc.save(`Invoice_${row.invoiceNumber}.pdf`)
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      const payload = {
        ...addForm,
        schoolId: Number(addForm.schoolId),
        classId: Number(addForm.classId),
        studentId: Number(addForm.studentId),
        feeTypeId: Number(addForm.feeTypeId),
        discountId: addForm.discountId ? Number(addForm.discountId) : null,
        feeAmount: Number(addForm.feeAmount),
        isApplicableDiscount: addForm.isApplicableDiscount === 'Yes',
        grossAmount: Number(addForm.grossAmount || addForm.feeAmount || 0),
        netAmount: Number(addForm.netAmount || addForm.feeAmount || 0),
        discount: Number(addForm.discount || 0),
        dueAmount: Number(addForm.dueAmount || 0),
      }
      await createFeeCollection(payload)
      setIsAddOpen(false)
      loadData()
    } catch (err) {
      console.error('Failed to create:', err)
      setError('Failed to create invoice')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({
      ...prev,
      [id]: value,
      ...(id === 'headOfficeId' ? { schoolId: '', classId: '', studentId: '', feeTypeId: '', discountId: '' } : {}),
      ...(id === 'schoolId' ? { classId: '', studentId: '', feeTypeId: '', discountId: '' } : {}),
      ...(id === 'classId' ? { studentId: '' } : {}),
      ...(id === 'discountId' ? recalcTotals({ ...prev, [id]: value, isApplicableDiscount: 'Yes' }, value) : {}),
      ...((id === 'feeAmount' || id === 'isApplicableDiscount' || id === 'paidStatus')
        ? recalcTotals({ ...prev, [id]: value }, prev.discountId)
        : {}),
    }))
    if (id === 'headOfficeId' && isSuperAdmin) {
      manualScope.setSelectedScope(value, '')
    }
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
  }

  const openAdd = () => {
    navigateTo?.('add-fee-collection')
  }

  const openBulk = () => {
    navigateTo?.('add-bulk-invoice')
  }

  const openEdit = (row) => {
    const s = row?.schoolId != null ? schools.find((item) => String(item.id) === String(row.schoolId)) : null
    if (isSuperAdmin && s?.headOfficeId != null) {
      manualScope.setSelectedScope(String(s.headOfficeId), row.schoolId != null ? String(row.schoolId) : '')
    }
    const normalizedRow = {
      id: row.id,
      headOfficeId: s?.headOfficeId != null ? String(s.headOfficeId) : (authHeadOfficeId != null ? String(authHeadOfficeId) : ''),
      schoolId: row.schoolId != null ? String(row.schoolId) : '',
      classId: row.classId != null ? String(row.classId) : '',
      studentId: row.studentId != null ? String(row.studentId) : '',
      feeTypeId: row.feeTypeId != null ? String(row.feeTypeId) : '',
      discountId: row.discountId != null ? String(row.discountId) : '',
      feeAmount: row.feeAmount != null ? String(row.feeAmount) : '0.00',
      month: row.month || '',
      isApplicableDiscount: row.isApplicableDiscount ? 'Yes' : 'No',
      paidStatus: row.paidStatus || 'Unpaid',
      note: row.note || '',
      grossAmount: row.grossAmount != null ? String(row.grossAmount) : '0.00',
      discount: row.discount != null ? String(row.discount) : '0.00',
      netAmount: row.netAmount != null ? String(row.netAmount) : '0.00',
      dueAmount: row.dueAmount != null ? String(row.dueAmount) : '0.00',
    }
    try {
      sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(normalizedRow))
    } catch {}
    navigateTo?.('add-fee-collection')
  }

  const getVisiblePages = () => {
    if (totalPages < 1) return []
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  const renderInvoiceForm = (form, setter, step) => {
    return (
      <>
        {step === 0 && (
          <>
            <p className="avm-section-title">{INVOICE_STEPS[0]}</p>
            <div className="avm-grid">
              {isSuperAdmin ? (
                <div style={{ gridColumn: '1 / -1' }}>
                  <ManualScopeSelectors
                    enabled
                    compact
                    headOffices={headOffices}
                    schoolOptions={formSchoolOptions}
                    selectedHeadOfficeId={form.headOfficeId}
                    onHeadOfficeChange={(val) => handleChange(setter)({ target: { id: 'headOfficeId', value: val } })}
                    selectedSchoolId={form.schoolId}
                    onSchoolChange={(val) => handleChange(setter)({ target: { id: 'schoolId', value: val } })}
                  />
                </div>
              ) : isHeadOfficeAdmin ? (
                <>
                  <FormField label="Head Office" required full>
                    <input className="avm-input" value={headOfficeName || ''} readOnly />
                  </FormField>
                  <FormField label="School Name" required full>
                    <select
                      className="avm-select"
                      id="schoolId"
                      value={form.schoolId}
                      onChange={handleChange(setter)}
                      disabled
                    >
                      <option value="">--Select School--</option>
                      {formSchoolOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.schoolName}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </>
              ) : isSchoolAdmin ? (
                <>
                  <FormField label="Head Office" required full>
                    <input className="avm-input" value={headOfficeName || ''} readOnly />
                  </FormField>
                  <FormField label="School Name" required full>
                    <input className="avm-input" value={authSchoolName || ''} readOnly />
                  </FormField>
                </>
              ) : null}

              <FormField label="Class" required>
                <select
                  className="avm-select"
                  id="classId"
                  value={form.classId}
                  onChange={handleChange(setter)}
                  disabled={!form.schoolId}
                >
                  <option value="">--Select--</option>
                  {classOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.className}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Student" required>
                <select
                  className="avm-select"
                  id="studentId"
                  value={form.studentId}
                  onChange={handleChange(setter)}
                  disabled={!form.classId}
                >
                  <option value="">--Select--</option>
                  {students.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="avm-section-title">{INVOICE_STEPS[1]}</p>
            <div className="avm-grid">
              <FormField label="Fee Type" required>
                <select
                  className="avm-select"
                  id="feeTypeId"
                  value={form.feeTypeId}
                  onChange={handleChange(setter)}
                  disabled={!form.schoolId}
                >
                  <option value="">--Select--</option>
                  {feeTypeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title || option.feeType}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Fee Amount" required>
                <input
                  type="number"
                  className="avm-input"
                  id="feeAmount"
                  value={form.feeAmount}
                  onChange={handleChange(setter)}
                  step="0.01"
                />
              </FormField>

              <FormField label="Month" required>
                <select
                  className="avm-select"
                  id="month"
                  value={form.month}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {monthOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="avm-section-title">{INVOICE_STEPS[2]}</p>
            <div className="avm-grid">
              <FormField label="Is Applicable Discount?" required>
                <select
                  className="avm-select"
                  id="isApplicableDiscount"
                  value={form.isApplicableDiscount}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {applicableDiscountOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              {form.isApplicableDiscount === 'Yes' ? (
                <FormField label="Discount Type" required>
                  <select
                    className="avm-select"
                    id="discountId"
                    value={form.discountId}
                    onChange={handleChange(setter)}
                    disabled={!form.schoolId}
                  >
                    <option value="">--Select Discount Type--</option>
                    {discountMasterOptions.map((option) => (
                      <option key={option.id} value={String(option.id)}>
                        {option.title} ({option.discountType === 'Percentage' ? `${option.amount}%` : `₹${Number(option.amount || 0).toFixed(2)}`})
                      </option>
                    ))}
                  </select>
                </FormField>
              ) : null}

              <FormField label="Paid Status" required>
                <select
                  className="avm-select"
                  id="paidStatus"
                  value={form.paidStatus}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {paidStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Note" full noIcon>
                <textarea
                  rows="3"
                  className="avm-input avm-textarea"
                  id="note"
                  placeholder="Enter note (optional)"
                  value={form.note}
                  onChange={handleChange(setter)}
                />
              </FormField>
            </div>
          </>
        )}
      </>
    )
  }

  const renderBulkForm = (form, setter, step) => {
    return (
      <>
        {step === 0 && (
          <>
            <p className="avm-section-title">{BULK_STEPS[0]}</p>
            <div className="avm-grid">
              {isSuperAdmin ? (
                <ManualScopeSelectors
                  enabled
                  headOffices={headOffices}
                  schoolOptions={formSchoolOptions}
                  selectedHeadOfficeId={form.headOfficeId}
                  onHeadOfficeChange={(val) => handleChange(setter)({ target: { id: 'headOfficeId', value: val } })}
                  selectedSchoolId={form.schoolId}
                  onSchoolChange={(val) => handleChange(setter)({ target: { id: 'schoolId', value: val } })}
                />
              ) : isHeadOfficeAdmin ? (
                <>
                  <FormField label="Head Office" required full>
                    <input className="avm-input" value={headOfficeName || ''} readOnly />
                  </FormField>
                  <FormField label="School Name" required full>
                    <select
                      className="avm-select"
                      id="schoolId"
                      value={form.schoolId}
                      onChange={handleChange(setter)}
                      disabled
                    >
                      <option value="">--Select School--</option>
                      {formSchoolOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.schoolName}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </>
              ) : isSchoolAdmin ? (
                <>
                  <FormField label="Head Office" required full>
                    <input className="avm-input" value={headOfficeName || ''} readOnly />
                  </FormField>
                  <FormField label="School Name" required full>
                    <input className="avm-input" value={authSchoolName || ''} readOnly />
                  </FormField>
                </>
              ) : null}

              <FormField label="Class" required full>
                <select
                  className="avm-select"
                  id="classId"
                  value={form.classId}
                  onChange={handleChange(setter)}
                  disabled={!form.schoolId}
                >
                  <option value="">--Select--</option>
                  {classOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.className}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="avm-section-title">{BULK_STEPS[1]}</p>
            <div className="avm-grid">
              <FormField label="Fee Type" required>
                <select
                  className="avm-select"
                  id="feeTypeId"
                  value={form.feeTypeId}
                  onChange={handleChange(setter)}
                  disabled={!form.schoolId}
                >
                  <option value="">--Select--</option>
                  {feeTypeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title || option.feeType}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Fee Amount" required>
                <input
                  type="number"
                  className="avm-input"
                  id="feeAmount"
                  value={form.feeAmount}
                  onChange={handleChange(setter)}
                  step="0.01"
                />
              </FormField>

              <FormField label="Month" required>
                <select
                  className="avm-select"
                  id="month"
                  value={form.month}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {monthOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="avm-section-title">{BULK_STEPS[2]}</p>
            <div className="avm-grid">
              <FormField label="Is Applicable Discount?" required>
                <select
                  className="avm-select"
                  id="isApplicableDiscount"
                  value={form.isApplicableDiscount}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {applicableDiscountOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              {form.isApplicableDiscount === 'Yes' ? (
                <FormField label="Discount Type" required>
                  <select
                    className="avm-select"
                    id="discountId"
                    value={form.discountId}
                    onChange={handleChange(setter)}
                    disabled={!form.schoolId}
                  >
                    <option value="">--Select Discount Type--</option>
                    {discountMasterOptions.map((option) => (
                      <option key={option.id} value={String(option.id)}>
                        {option.title} ({option.discountType === 'Percentage' ? `${option.amount}%` : `₹${Number(option.amount || 0).toFixed(2)}`})
                      </option>
                    ))}
                  </select>
                </FormField>
              ) : null}

              <FormField label="Paid Status" required>
                <select
                  className="avm-select"
                  id="paidStatus"
                  value={form.paidStatus}
                  onChange={handleChange(setter)}
                >
                  <option value="">--Select--</option>
                  {paidStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Note" full noIcon>
                <textarea
                  rows="3"
                  className="avm-input avm-textarea"
                  id="note"
                  placeholder="Enter note (optional)"
                  value={form.note}
                  onChange={handleChange(setter)}
                />
              </FormField>
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Fee Collection</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Fee Collection</span>
          </div>
        </div>
        <div className="d-flex gap-10">
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={openAdd}
          >
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Create Invoice
          </button>
          <button
            type="button"
            className="btn btn-secondary-600 d-flex align-items-center gap-6"
            onClick={openBulk}
          >
            <span className="d-flex text-md">
              <i className="ri-file-copy-line"></i>
            </span>
            Bulk Invoice
          </button>
        </div>
      </div>

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
                placeholder="Search fee collection..."
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
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.invoiceNumber ? <th scope="col">Invoice Number</th> : null}
                  {visibleColumns.studentSaleTo ? <th scope="col">Student/Sale To</th> : null}
                  {visibleColumns.month ? <th scope="col">Month</th> : null}
                  {visibleColumns.grossAmount ? <th scope="col">Gross Amount</th> : null}
                  {visibleColumns.discount ? <th scope="col">Discount</th> : null}
                  {visibleColumns.netAmount ? <th scope="col">Net Amount</th> : null}
                  {visibleColumns.dueAmount ? <th scope="col">Due Amount</th> : null}
                  {visibleColumns.status ? <th scope="col">Status</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 1}
                      className="text-center py-40 text-secondary-light"
                    >
                      No fee collection records found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, index) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + index + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.school ? (
                        <td className="fw-medium text-primary-light">{row.schoolName}</td>
                      ) : null}
                      {visibleColumns.invoiceNumber ? (
                        <td className="fw-medium">{row.invoiceNumber}</td>
                      ) : null}
                      {visibleColumns.studentSaleTo ? <td className="fw-medium">{row.studentName}</td> : null}
                      {visibleColumns.month ? <td>{row.month}</td> : null}
                      {visibleColumns.grossAmount ? (
                        <td className="text-end fw-semibold">₹{row.grossAmount?.toLocaleString()}</td>
                      ) : null}
                      {visibleColumns.discount ? (
                        <td className="text-end text-danger-600">-₹{row.discount?.toLocaleString()}</td>
                      ) : null}
                      {visibleColumns.netAmount ? (
                        <td className="text-end fw-semibold">₹{row.netAmount?.toLocaleString()}</td>
                      ) : null}
                      {visibleColumns.dueAmount ? (
                        <td className={`text-end fw-semibold ${row.dueAmount > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                          ₹{row.dueAmount?.toLocaleString()}
                        </td>
                      ) : null}
                      {visibleColumns.status ? <td>{getStatusBadge(row.paidStatus)}</td> : null}
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
                            className="bg-success-focus bg-hover-success-200 text-success-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => handleDownloadInvoice(row)}
                            title="Download Invoice"
                          >
                            <i className="ri-download-2-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this invoice?')) {
                                await deleteFeeCollection(row.id)
                                loadData()
                              }
                            }}
                            title="Delete"
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
              Showing {paginated.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min((currentPage - 1) * rowsPerPage + paginated.length, totalElements)} of {totalElements}
            </span>

            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || totalPages < 1}
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
                onClick={() => setCurrentPage((p) => Math.min(Math.max(1, totalPages), p + 1))}
                disabled={currentPage === totalPages || totalPages < 1}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <WizardPopup
        modalWidth="620px"
        open={isAddOpen}
        title="Create Invoice"
        steps={INVOICE_STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(INVOICE_STEPS.length - 1, s + 1))}
        onSubmit={handleCreate}
        submitLabel={saving ? 'Creating...' : 'Create Invoice'}
      >
        {renderInvoiceForm(addForm, setAddForm, addStep)}
      </WizardPopup>

      {/* Bulk Invoice Modal */}
      <WizardPopup
        modalWidth="620px"
        open={isBulkOpen}
        title="Bulk Invoice"
        steps={BULK_STEPS}
        step={bulkStep}
        onClose={() => setIsBulkOpen(false)}
        onBack={() => setBulkStep((s) => Math.max(0, s - 1))}
        onNext={() => setBulkStep((s) => Math.min(BULK_STEPS.length - 1, s + 1))}
        onSubmit={() => setIsBulkOpen(false)}
        submitLabel="Create Bulk Invoice"
      >
        {renderBulkForm(bulkForm, setBulkForm, bulkStep)}
      </WizardPopup>

      {/* Edit Invoice Modal */}
      <WizardPopup
        modalWidth="620px"
        open={isEditOpen}
        title="Edit Invoice"
        steps={INVOICE_STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(INVOICE_STEPS.length - 1, s + 1))}
        onSubmit={() => setIsEditOpen(false)}
        submitLabel="Update"
      >
        {renderInvoiceForm(editForm, setEditForm, editStep)}
      </WizardPopup>

      {/* Filter Sidebar */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Fee Collection"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <ManualScopeSelectors
                enabled
                headOffices={manualScope.headOffices}
                schoolOptions={manualScope.schoolOptions}
                selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                onHeadOfficeChange={(val) => manualScope.setSelectedScope(val, '')}
                selectedSchoolId={manualScope.selectedSchoolId}
                onSchoolChange={(val) => manualScope.setSelectedSchoolId(val)}
              />
            </div>
          ) : null}

          {!isSuperAdmin ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                htmlFor="school"
                className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
              >
                School
              </label>
              <select
                id="school"
                className="form-control form-select"
                value={pendingFilters.school}
                onChange={handlePendingFilterChange}
              >
                <option value="Select">Select School</option>
                {schools.map((option) => (
                  <option key={option.id} value={option.schoolName}>
                    {option.schoolName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

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
              {paidStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="month"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Month
            </label>
            <select
              id="month"
              className="form-control form-select"
              value={pendingFilters.month}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Month</option>
              {monthOptions.map((option) => (
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

export default FeeCollection
