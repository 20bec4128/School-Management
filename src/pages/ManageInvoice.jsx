import { useCallback, useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import {
  createFeeCollection,
  deleteFeeCollection,
  fetchFeeCollectionsPage,
  updateFeeCollection,
} from '../apis/feeCollectionApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchFeeTypes } from '../apis/feeTypesApi'
import { fetchDiscounts } from '../apis/discountsApi'
import { fetchStudentsByClassSection } from '../apis/studentsApi'
import { normalizeRole } from '../utils/roles'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import '../assets/css/addModalShared.css'

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
  ...emptyForm,
  studentId: 'all',
}

const emptyFilters = {
  schoolId: '',
  classId: '',
  feeTypeId: '',
  month: 'Select',
  status: 'Select',
}

const monthOptions = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const paidStatusOptions = ['Paid', 'Unpaid', 'Partial']

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

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Class: 'ri-group-line',
  Student: 'ri-user-3-line',
  'Fee Type': 'ri-file-list-line',
  Discount: 'ri-discount-line',
  'Fee Amount': 'ri-coin-line',
  Month: 'ri-calendar-line',
  'Is Applicable Discount?': 'ri-discount-line',
  'Paid Status': 'ri-checkbox-circle-line',
  Note: 'ri-file-text-line',
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
            <i className={icon} />
          </span>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

const formatMoney = (value) => Number(value || 0).toFixed(2)

const ManageInvoice = () => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName, schoolId: authSchoolId, schoolName: authSchoolName, canAdd, canEdit, canDelete } = useAuth()
  const PAGE_SLUG = 'manage-invoice'
  const { activeSchoolId } = useSchool()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const currentSchoolOption = useMemo(() => {
    if (authSchoolId == null) return null
    return {
      id: authSchoolId,
      schoolName: authSchoolName || `School ${authSchoolId}`,
      headOfficeId: authHeadOfficeId ?? '',
    }
  }, [authHeadOfficeId, authSchoolId, authSchoolName])

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [addForm, setAddForm] = useState(emptyForm)
  const [bulkForm, setBulkForm] = useState(emptyBulkForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [feeCollections, setFeeCollections] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [schools, setSchools] = useState([])
  const [classes, setClasses] = useState([])
  const [feeTypes, setFeeTypes] = useState([])
  const [discounts, setDiscounts] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const currentScopeSchoolId = isSuperAdmin
    ? (manualScope.selectedSchoolId ? String(manualScope.selectedSchoolId) : activeSchoolId ? String(activeSchoolId) : '')
    : activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''

  const currentScopeHeadOfficeId = isSuperAdmin
    ? (manualScope.selectedHeadOfficeId ? String(manualScope.selectedHeadOfficeId) : '')
    : authHeadOfficeId != null
      ? String(authHeadOfficeId)
      : ''

  const filterSchoolId = isSuperAdmin
    ? (manualScope.selectedSchoolId ? String(manualScope.selectedSchoolId) : currentScopeSchoolId)
    : (pendingFilters.schoolId || currentScopeSchoolId)

  const schoolOptions = useMemo(() => {
    const rows = Array.isArray(schools) ? schools : []
    if (isSuperAdmin) {
      if (!manualScope.selectedHeadOfficeId) return []
      return rows.filter((school) => String(school.headOfficeId ?? '') === String(manualScope.selectedHeadOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return rows.filter((school) => String(school.headOfficeId ?? '') === String(authHeadOfficeId))
    }
    if (isSchoolAdmin) {
      return currentSchoolOption ? [currentSchoolOption] : []
    }
    return rows
  }, [currentSchoolOption, schools, isSuperAdmin, isHeadOfficeAdmin, isSchoolAdmin, manualScope.selectedHeadOfficeId, authHeadOfficeId])

  const formSchoolOptions = isSuperAdmin ? manualScope.schoolOptions : schoolOptions

  const currentForm = isEditOpen ? editForm : isBulkOpen ? bulkForm : addForm
  const currentFormSchoolId = currentForm.schoolId
  const currentFormClassId = currentForm.classId

  const currentFormClassOptions = useMemo(() => {
    const rows = Array.isArray(classes) ? classes : []
    if (!currentFormSchoolId) return []
    return rows.filter((row) => String(row?.schoolId ?? '') === String(currentFormSchoolId))
  }, [classes, currentFormSchoolId])

  const currentFormFeeTypeOptions = useMemo(() => {
    const rows = Array.isArray(feeTypes) ? feeTypes : []
    if (!currentFormSchoolId) return []
    return rows.filter((row) => String(row?.schoolId ?? '') === String(currentFormSchoolId))
  }, [feeTypes, currentFormSchoolId])

  const currentFormDiscountOptions = useMemo(() => {
    const rows = Array.isArray(discounts) ? discounts : []
    if (!currentFormSchoolId) return []
    return rows.filter((row) => String(row?.schoolId ?? '') === String(currentFormSchoolId))
  }, [discounts, currentFormSchoolId])

  const currentFormStudentOptions = useMemo(() => (Array.isArray(students) ? students : []), [students])

  const filterClassOptions = useMemo(() => {
    const rows = Array.isArray(classes) ? classes : []
    if (!filterSchoolId) return rows
    return rows.filter((row) => String(row?.schoolId ?? '') === String(filterSchoolId))
  }, [classes, filterSchoolId])

  const filterFeeTypeOptions = useMemo(() => {
    const rows = Array.isArray(feeTypes) ? feeTypes : []
    if (!filterSchoolId) return rows
    return rows.filter((row) => String(row?.schoolId ?? '') === String(filterSchoolId))
  }, [feeTypes, filterSchoolId])

  const calculateDiscountAmount = useCallback((form, discountId) => {
    const selected = currentFormDiscountOptions.find((item) => String(item?.id ?? '') === String(discountId))
    if (!selected || form?.isApplicableDiscount !== 'Yes') return 0
    const feeAmount = Number(form?.feeAmount || 0)
    const baseAmount = Number(selected?.amount || 0)
    if (String(selected?.discountType || '').toLowerCase() === 'percentage') {
      return (feeAmount * baseAmount) / 100
    }
    return baseAmount
  }, [currentFormDiscountOptions])

  const recalcTotals = useCallback((form, nextDiscountId = form?.discountId) => {
    const feeAmount = Number(form?.feeAmount || 0)
    const discountAmount = form?.isApplicableDiscount === 'Yes' ? calculateDiscountAmount(form, nextDiscountId) : 0
    const netAmount = Math.max(feeAmount - discountAmount, 0)
    const dueAmount = form?.paidStatus === 'Paid' ? 0 : netAmount
    return {
      discountId: form?.isApplicableDiscount === 'Yes' ? (nextDiscountId || '') : '',
      grossAmount: formatMoney(feeAmount),
      discount: formatMoney(discountAmount),
      netAmount: formatMoney(netAmount),
      dueAmount: formatMoney(dueAmount),
    }
  }, [calculateDiscountAmount])

  const loadData = useCallback(async () => {
    if (status !== 'ready' || !token) return
    setLoading(true)
    setError('')
    try {
      const querySchoolId = filters.schoolId || currentScopeSchoolId || null
      const [schoolsData, classesData, feeTypesData, discountsData] = await Promise.all([
        isSchoolAdmin ? Promise.resolve(currentSchoolOption ? [currentSchoolOption] : []) : fetchSchoolsLookup(),
        fetchClasses(),
        querySchoolId ? fetchFeeTypes({ schoolId: querySchoolId }) : Promise.resolve([]),
        querySchoolId ? fetchDiscounts({ schoolId: querySchoolId }) : Promise.resolve([]),
      ])
      setSchools(Array.isArray(schoolsData) ? schoolsData : [])
      setClasses(Array.isArray(classesData) ? classesData : [])
      setFeeTypes(Array.isArray(feeTypesData) ? feeTypesData : [])
      setDiscounts(Array.isArray(discountsData) ? discountsData : [])

      const pageData = await fetchFeeCollectionsPage({
        schoolId: querySchoolId,
        classId: filters.classId,
        feeTypeId: filters.feeTypeId,
        status: filters.status,
        month: filters.month,
        search: debouncedSearch,
        page: currentPage - 1,
        size: rowsPerPage,
      })

      setFeeCollections(Array.isArray(pageData?.content) ? pageData.content : [])
      setTotalElements(Number(pageData?.totalElements ?? 0))
      setTotalPages(Number(pageData?.totalPages ?? 0))
      setSelectedRows([])
    } catch (err) {
      console.error('Failed to load invoices:', err)
      setError('Failed to load invoices')
      setFeeCollections([])
      setTotalElements(0)
      setTotalPages(0)
      setSelectedRows([])
    } finally {
      setLoading(false)
    }
  }, [currentPage, currentScopeSchoolId, currentSchoolOption, debouncedSearch, filters.classId, filters.feeTypeId, filters.month, filters.schoolId, filters.status, isSchoolAdmin, rowsPerPage, status, token])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (currentScopeSchoolId) setCurrentPage(1)
  }, [currentScopeSchoolId])

  useEffect(() => {
    if (!currentFormSchoolId || !currentFormClassId) {
      setStudents([])
      return
    }
    fetchStudentsByClassSection({ schoolId: currentFormSchoolId, classId: currentFormClassId })
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .catch(() => setStudents([]))
  }, [currentFormSchoolId, currentFormClassId])

  useEffect(() => {
    if (isSuperAdmin) return
    if (!currentScopeSchoolId) return
    setAddForm((prev) => ({
      ...prev,
      headOfficeId: currentScopeHeadOfficeId || prev.headOfficeId,
      schoolId: currentScopeSchoolId,
    }))
    setBulkForm((prev) => ({
      ...prev,
      headOfficeId: currentScopeHeadOfficeId || prev.headOfficeId,
      schoolId: currentScopeSchoolId,
    }))
  }, [isSuperAdmin, currentScopeSchoolId, currentScopeHeadOfficeId])

  const buildPayload = useCallback((form, studentIdOverride = form.studentId) => ({
    schoolId: Number(form.schoolId),
    classId: Number(form.classId),
    studentId: Number(studentIdOverride),
    feeTypeId: Number(form.feeTypeId),
    discountId: form.discountId ? Number(form.discountId) : null,
    feeAmount: Number(form.feeAmount),
    isApplicableDiscount: form.isApplicableDiscount === 'Yes',
    grossAmount: Number(form.grossAmount || form.feeAmount || 0),
    netAmount: Number(form.netAmount || form.feeAmount || 0),
    discount: Number(form.discount || 0),
    dueAmount: Number(form.dueAmount || 0),
    month: form.month,
    paidStatus: form.paidStatus,
    note: form.note,
  }), [])

  const handleFormChange = (setter) => (e) => {
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

  const openAdd = () => {
    const base = { ...emptyForm }
    if (isSchoolAdmin) {
      base.headOfficeId = currentScopeHeadOfficeId
      base.schoolId = currentScopeSchoolId
    } else if (isHeadOfficeAdmin) {
      base.headOfficeId = currentScopeHeadOfficeId
    } else if (isSuperAdmin) {
      base.headOfficeId = manualScope.selectedHeadOfficeId || ''
      base.schoolId = manualScope.selectedSchoolId || ''
    }
    Object.assign(base, recalcTotals(base, base.discountId))
    setAddForm(base)
    setIsAddOpen(true)
  }

  const openBulk = () => {
    const base = { ...emptyBulkForm }
    if (isSchoolAdmin) {
      base.headOfficeId = currentScopeHeadOfficeId
      base.schoolId = currentScopeSchoolId
    } else if (isHeadOfficeAdmin) {
      base.headOfficeId = currentScopeHeadOfficeId
    } else if (isSuperAdmin) {
      base.headOfficeId = manualScope.selectedHeadOfficeId || ''
      base.schoolId = manualScope.selectedSchoolId || ''
    }
    Object.assign(base, recalcTotals(base, base.discountId))
    setBulkForm(base)
    setIsBulkOpen(true)
  }

  const openEdit = (row) => {
    const school = row?.schoolId != null ? schools.find((item) => String(item.id) === String(row.schoolId)) : null
    if (isSuperAdmin && school?.headOfficeId != null) {
      manualScope.setSelectedScope(String(school.headOfficeId), row.schoolId != null ? String(row.schoolId) : '')
    }
    setEditForm({
      id: row.id,
      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : currentScopeHeadOfficeId,
      schoolId: row.schoolId != null ? String(row.schoolId) : currentScopeSchoolId,
      classId: row.classId != null ? String(row.classId) : '',
      studentId: row.studentId != null ? String(row.studentId) : '',
      feeTypeId: row.feeTypeId != null ? String(row.feeTypeId) : '',
      discountId: '',
      feeAmount: row.feeAmount != null ? String(row.feeAmount) : '0.00',
      month: row.month || '',
      isApplicableDiscount: row.isApplicableDiscount ? 'Yes' : 'No',
      paidStatus: row.paidStatus || 'Unpaid',
      note: row.note || '',
      grossAmount: row.grossAmount != null ? String(row.grossAmount) : String(row.feeAmount || '0.00'),
      discount: row.discount != null ? String(row.discount) : '0.00',
      netAmount: row.netAmount != null ? String(row.netAmount) : String(row.feeAmount || '0.00'),
      dueAmount: row.dueAmount != null ? String(row.dueAmount) : '0.00',
    })
    setIsEditOpen(true)
  }

  const handleCreate = async () => {
    const form = isBulkOpen ? bulkForm : addForm
    if (!form.schoolId || !form.classId || !form.feeTypeId || !form.month) {
      setError('School, class, fee type, and month are required.')
      return
    }
    if (!isBulkOpen && !form.studentId) {
      setError('Student is required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const basePayload = buildPayload(form)
      if (isBulkOpen && form.studentId === 'all') {
        const studentRows = await fetchStudentsByClassSection({
          schoolId: form.schoolId,
          classId: form.classId,
        })
        if (!Array.isArray(studentRows) || studentRows.length === 0) {
          throw new Error('No students found for the selected class.')
        }
        await Promise.all(studentRows.map((student) => createFeeCollection({
          ...basePayload,
          studentId: Number(student.id),
        })))
      } else {
        await createFeeCollection(basePayload)
      }
      setIsAddOpen(false)
      setIsBulkOpen(false)
      loadData()
    } catch (err) {
      console.error('Failed to create invoice:', err)
      setError('Failed to create invoice')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editForm.id) return
    if (!editForm.schoolId || !editForm.classId || !editForm.feeTypeId || !editForm.month) {
      setError('School, class, fee type, and month are required.')
      return
    }
    if (!editForm.studentId) {
      setError('Student is required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await updateFeeCollection(editForm.id, buildPayload(editForm))
      setIsEditOpen(false)
      loadData()
    } catch (err) {
      console.error('Failed to update invoice:', err)
      setError('Failed to update invoice')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return
    try {
      await deleteFeeCollection(row.id)
      loadData()
    } catch (err) {
      console.error('Failed to delete invoice:', err)
      setError('Failed to delete invoice')
    }
  }

  const handleDownloadInvoice = (row) => {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('INVOICE', 105, 20, { align: 'center' })

    doc.setFontSize(12)
    doc.text(`School: ${row.schoolName || '--'}`, 20, 40)
    doc.text(`Invoice No: ${row.invoiceNumber || '--'}`, 20, 50)
    doc.text(`Date: ${row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '--'}`, 20, 60)

    doc.text(`Student: ${row.studentName || '--'}`, 20, 80)
    doc.text(`Class: ${row.className || '--'}`, 20, 90)
    doc.text(`Fee Type: ${row.feeTypeTitle || '--'}`, 20, 100)
    doc.text(`Month: ${row.month || '--'}`, 20, 110)

    autoTable(doc, {
      startY: 120,
      head: [['Fee Type', 'Amount']],
      body: [
        ['Fee Amount', `Rs. ${formatMoney(row.feeAmount)}`],
        ['Gross Amount', `Rs. ${formatMoney(row.grossAmount)}`],
        ['Discount', `Rs. ${formatMoney(row.discount)}`],
        ['Net Amount', `Rs. ${formatMoney(row.netAmount)}`],
        ['Paid Status', row.paidStatus || '--'],
        ['Due Amount', `Rs. ${formatMoney(row.dueAmount)}`],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [31, 41, 55] },
    })

    if (row.note) {
      const y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 12 : 160
      doc.text(`Note: ${row.note}`, 20, y)
    }

    doc.save(`Invoice_${row.invoiceNumber || row.id || 'invoice'}.pdf`)
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({
      ...prev,
      [id]: value,
      ...(id === 'schoolId' ? { classId: '', feeTypeId: '' } : {}),
      ...(id === 'classId' ? { feeTypeId: '' } : {}),
    }))
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    const nextFilters = isSuperAdmin
      ? {
          ...pendingFilters,
          schoolId: manualScope.selectedSchoolId ? String(manualScope.selectedSchoolId) : '',
        }
      : pendingFilters
    setFilters(nextFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
  }

  const getVisiblePages = () => {
    if (totalPages < 1) return []
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p += 1) pages.push(p)
    return pages
  }

  const getStatusBadge = (value) => {
    const s = String(value || '').toLowerCase()
    if (s === 'paid') return <span className="bg-success-100 text-success-600 px-12 py-4 radius-4 fw-medium text-sm">Paid</span>
    if (s === 'partial') return <span className="bg-warning-100 text-warning-600 px-12 py-4 radius-4 fw-medium text-sm">Partial</span>
    return <span className="bg-danger-100 text-danger-600 px-12 py-4 radius-4 fw-medium text-sm">Unpaid</span>
  }

  const renderInvoiceForm = (form, setter, isBulk = false) => (
    <div className="avm-grid">
      {isSuperAdmin ? (
        <ManualScopeSelectors
          enabled
          headOffices={manualScope.headOffices}
          schoolOptions={manualScope.schoolOptions}
          selectedHeadOfficeId={form.headOfficeId}
          onHeadOfficeChange={(val) => {
            manualScope.setSelectedScope(val, '')
            setter((prev) => ({
              ...prev,
              headOfficeId: val,
              schoolId: '',
              classId: '',
              studentId: '',
              feeTypeId: '',
              discountId: '',
            }))
          }}
          selectedSchoolId={form.schoolId}
          onSchoolChange={(val) => {
            manualScope.setSelectedSchoolId(val)
            setter((prev) => ({
              ...prev,
              schoolId: val,
              classId: '',
              studentId: '',
              feeTypeId: '',
              discountId: '',
            }))
          }}
        />
      ) : isHeadOfficeAdmin ? (
        <FormField label="School Name" required full>
          <select
            className="avm-select"
            id="schoolId"
            value={form.schoolId}
            onChange={handleFormChange(setter)}
          >
            <option value="">--Select School--</option>
            {formSchoolOptions.map((school) => (
              <option key={String(school.id)} value={String(school.id)}>
                {school.schoolName}
              </option>
            ))}
          </select>
        </FormField>
      ) : (
        <FormField label="School Name" required full>
          <input className="avm-input" value={authSchoolName || ''} readOnly />
        </FormField>
      )}

      <FormField label="Class" required>
        <select
          className="avm-select"
          id="classId"
          value={form.classId}
          onChange={handleFormChange(setter)}
          disabled={!form.schoolId}
        >
          <option value="">--Select--</option>
          {currentFormClassOptions.map((option) => (
            <option key={String(option.id)} value={String(option.id)}>
              {option.className}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Student" required={!isBulk}>
        <select
          className="avm-select"
          id="studentId"
          value={form.studentId}
          onChange={handleFormChange(setter)}
          disabled={!form.classId}
        >
          <option value="">--Select--</option>
          {isBulk ? <option value="all">All Students</option> : null}
          {currentFormStudentOptions.map((student) => (
            <option key={String(student.id)} value={String(student.id)}>
              {student.name || student.studentName || `Student ${student.id}`}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Fee Type" required>
        <select
          className="avm-select"
          id="feeTypeId"
          value={form.feeTypeId}
          onChange={handleFormChange(setter)}
          disabled={!form.schoolId}
        >
          <option value="">--Select--</option>
          {currentFormFeeTypeOptions.map((option) => (
            <option key={String(option.id)} value={String(option.id)}>
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
          onChange={handleFormChange(setter)}
          min="0"
          step="0.01"
        />
      </FormField>

      <FormField label="Month" required>
        <select
          className="avm-select"
          id="month"
          value={form.month}
          onChange={handleFormChange(setter)}
        >
          <option value="">--Select--</option>
          {monthOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Is Applicable Discount?" required>
        <select
          className="avm-select"
          id="isApplicableDiscount"
          value={form.isApplicableDiscount}
          onChange={handleFormChange(setter)}
        >
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      </FormField>

      <FormField label="Discount" required>
        <select
          className="avm-select"
          id="discountId"
          value={form.discountId}
          onChange={handleFormChange(setter)}
          disabled={form.isApplicableDiscount !== 'Yes'}
        >
          <option value="">--Select Discount--</option>
          {currentFormDiscountOptions.map((option) => (
            <option key={String(option.id)} value={String(option.id)}>
              {option.title}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Paid Status" required>
        <select
          className="avm-select"
          id="paidStatus"
          value={form.paidStatus}
          onChange={handleFormChange(setter)}
        >
          {paidStatusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Note" full>
        <textarea
          className="avm-input avm-textarea"
          id="note"
          rows="3"
          value={form.note}
          onChange={handleFormChange(setter)}
          placeholder="Note"
        />
      </FormField>
    </div>
  )

  const renderCell = (row, column) => {
    const value = row?.[column.key]
    if (column.key === 'status') return getStatusBadge(row?.paidStatus)
    if (column.key === 'invoiceNumber') return <span className="fw-medium text-primary-light">{value || '--'}</span>
    if (column.key === 'grossAmount' || column.key === 'discount' || column.key === 'netAmount' || column.key === 'dueAmount') {
      return <span className="fw-medium">{value != null ? `Rs. ${Number(value).toLocaleString()}` : '--'}</span>
    }
    return value || '--'
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Manage Invoice</h1>
          <span className="text-secondary-light">Dashboard / Manage Invoice</span>
        </div>
        <div className="d-flex gap-12 flex-wrap">
          {canAdd(PAGE_SLUG) && (
            <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
              <i className="ri-add-line" /> Create Invoice
            </button>
          )}
          {canAdd(PAGE_SLUG) && (
            <button type="button" className="btn btn-warning-600 d-flex align-items-center gap-6" onClick={openBulk}>
              <i className="ri-file-list-3-line" /> Create Bulk Invoice
            </button>
          )}
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => {
                  setPendingFilters(filters)
                  setIsFilterSidebarOpen(true)
                }}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line" /></span>
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span><i className="ri-arrow-down-s-line" /></span>
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
                placeholder="Search invoice..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line" />
              </span>
            </div>
          </div>

          {error ? <div className="px-20 pt-16 text-danger-600 text-sm">{error}</div> : null}

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={feeCollections.length > 0 && feeCollections.every((row) => selectedRows.includes(row.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows(feeCollections.map((row) => row.id))
                          } else {
                            setSelectedRows([])
                          }
                        }}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {columnOptions.map((column) => (visibleColumns[column.key] ? <th scope="col" key={column.key}>{column.label}</th> : null))}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading invoices...
                    </td>
                  </tr>
                ) : feeCollections.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  feeCollections.map((row, index) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => {
                              setSelectedRows((prev) => (
                                prev.includes(row.id)
                                  ? prev.filter((value) => value !== row.id)
                                  : [...prev, row.id]
                              ))
                            }}
                          />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + index + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.school ? <td className="fw-medium text-primary-light">{row.schoolName}</td> : null}
                      {visibleColumns.invoiceNumber ? <td className="fw-medium">{row.invoiceNumber}</td> : null}
                      {visibleColumns.studentSaleTo ? <td className="fw-medium">{row.studentName}</td> : null}
                      {visibleColumns.month ? <td>{row.month}</td> : null}
                      {visibleColumns.grossAmount ? <td className="text-end fw-semibold">Rs. {formatMoney(row.grossAmount)}</td> : null}
                      {visibleColumns.discount ? <td className="text-end text-danger-600">-Rs. {formatMoney(row.discount)}</td> : null}
                      {visibleColumns.netAmount ? <td className="text-end fw-semibold">Rs. {formatMoney(row.netAmount)}</td> : null}
                      {visibleColumns.dueAmount ? (
                        <td className={`text-end fw-semibold ${Number(row.dueAmount || 0) > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                          Rs. {formatMoney(row.dueAmount)}
                        </td>
                      ) : null}
                      {visibleColumns.status ? <td>{getStatusBadge(row.paidStatus)}</td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-primary-focus bg-hover-primary-200 text-primary-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => handleDownloadInvoice(row)}
                            title="Download PDF"
                          >
                            <i className="ri-download-2-line" />
                          </button>
                          {canEdit(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                              onClick={() => openEdit(row)}
                              title="Edit"
                            >
                              <i className="ri-edit-line" />
                            </button>
                          )}
                          {canDelete(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                              onClick={() => handleDelete(row)}
                              title="Delete"
                            >
                              <i className="ri-delete-bin-line" />
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
              Showing {feeCollections.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min((currentPage - 1) * rowsPerPage + feeCollections.length, totalElements)} of {totalElements}
            </span>

            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1 || totalPages < 1}
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
                onClick={() => setCurrentPage((page) => Math.min(Math.max(1, totalPages), page + 1))}
                disabled={currentPage === totalPages || totalPages < 1}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <WizardPopup
        modalWidth="720px"
        open={isAddOpen}
        title="Create Invoice"
        steps={['Invoice Details']}
        step={0}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleCreate}
        submitLabel={saving ? 'Creating...' : 'Create Invoice'}
      >
        {renderInvoiceForm(addForm, setAddForm, false)}
      </WizardPopup>

      <WizardPopup
        modalWidth="720px"
        open={isBulkOpen}
        title="Create Bulk Invoice"
        steps={['Invoice Details']}
        step={0}
        onClose={() => setIsBulkOpen(false)}
        onSubmit={handleCreate}
        submitLabel={saving ? 'Creating...' : 'Create Bulk Invoice'}
      >
        {renderInvoiceForm(bulkForm, setBulkForm, true)}
      </WizardPopup>

      <WizardPopup
        modalWidth="720px"
        open={isEditOpen}
        title="Edit Invoice"
        steps={['Invoice Details']}
        step={0}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
        submitLabel={saving ? 'Updating...' : 'Update Invoice'}
      >
        {renderInvoiceForm(editForm, setEditForm, false)}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Invoice"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={manualScope.headOffices}
              schoolOptions={manualScope.schoolOptions}
              selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
              onHeadOfficeChange={(val) => {
                manualScope.setSelectedScope(val, '')
                setPendingFilters((prev) => ({
                  ...prev,
                  classId: '',
                  feeTypeId: '',
                }))
              }}
              selectedSchoolId={manualScope.selectedSchoolId}
              onSchoolChange={(val) => {
                manualScope.setSelectedSchoolId(val)
                setPendingFilters((prev) => ({
                  ...prev,
                  classId: '',
                  feeTypeId: '',
                }))
              }}
            />
          ) : (
            <div>
              <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
                School
              </label>
              <select
                className="form-control form-select"
                id="schoolId"
                value={pendingFilters.schoolId || currentScopeSchoolId}
                onChange={handlePendingFilterChange}
              >
                <option value="">All Schools</option>
                {schoolOptions.map((school) => (
                  <option key={String(school.id)} value={String(school.id)}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class
            </label>
            <select
              className="form-control form-select"
              id="classId"
              value={pendingFilters.classId}
              onChange={handlePendingFilterChange}
            >
              <option value="">All Classes</option>
              {filterClassOptions.map((option) => (
                <option key={String(option.id)} value={String(option.id)}>
                  {option.className}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Fee Type
            </label>
            <select
              className="form-control form-select"
              id="feeTypeId"
              value={pendingFilters.feeTypeId}
              onChange={handlePendingFilterChange}
            >
              <option value="">All Fee Types</option>
              {filterFeeTypeOptions.map((option) => (
                <option key={String(option.id)} value={String(option.id)}>
                  {option.title || option.feeType}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Month
            </label>
            <select
              className="form-control form-select"
              id="month"
              value={pendingFilters.month}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">All Months</option>
              {monthOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Paid Status
            </label>
            <select
              className="form-control form-select"
              id="status"
              value={pendingFilters.status}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">All Status</option>
              {paidStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="d-flex gap-8 mt-12">
            <button
              type="button"
              className="btn btn-danger-200 text-danger-600 w-100"
              onClick={handleResetFilters}
            >
              Reset
            </button>
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default ManageInvoice
