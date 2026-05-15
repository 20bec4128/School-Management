import { useCallback, useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchCategoriesPage } from '../apis/categoriesApi'
import { fetchProductsPage } from '../apis/productsApi'
import {
  createIssue,
  deleteIssue,
  fetchIssueRecipients,
  fetchIssueRoles,
  fetchIssuesPage,
  updateIssue,
} from '../apis/issuesApi'
import '../assets/css/addModalShared.css'

const toDateInput = (date) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)

const today = new Date()
const DEFAULT_ISSUE_DATE = toDateInput(today)
const DEFAULT_DUE_DATE = toDateInput(addDays(today, 7))

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  userType: '',
  issueToId: '',
  categoryId: '',
  productId: '',
  quantity: '',
  issueDate: DEFAULT_ISSUE_DATE,
  dueDate: DEFAULT_DUE_DATE,
  note: '',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: 'Select',
  userType: 'Select',
}

const STEPS = ['Issue Details']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'User Type': 'ri-user-settings-line',
  'Issue To': 'ri-user-voice-line',
  Category: 'ri-list-settings-line',
  Product: 'ri-shopping-bag-line',
  Quantity: 'ri-equalizer-line',
  'Issue Date': 'ri-calendar-line',
  'Due Date': 'ri-calendar-todo-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'userType', label: 'User Type' },
  { key: 'issueToName', label: 'Issue To' },
  { key: 'categoryName', label: 'Category' },
  { key: 'productName', label: 'Product' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'issueDate', label: 'Issue Date' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'returnDate', label: 'Return Date' },
]

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
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
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <i className={icon}></i>
        </span>
        {children}
      </div>
    </div>
  )
}

const fetchAllPages = async (fetchPage, pageSize = 500) => {
  const firstPage = await fetchPage(0, pageSize)
  const firstContent = Array.isArray(firstPage?.content) ? firstPage.content : []
  const totalPages = Number.isFinite(firstPage?.totalPages) ? firstPage.totalPages : 1
  if (totalPages <= 1) return firstContent

  const pageRequests = []
  for (let page = 1; page < totalPages; page += 1) {
    pageRequests.push(fetchPage(page, pageSize))
  }
  const restPages = await Promise.all(pageRequests)
  return restPages.reduce((acc, item) => {
    if (Array.isArray(item?.content)) acc.push(...item.content)
    return acc
  }, [...firstContent])
}

const normalizeSelectValue = (value) => {
  if (value == null) return undefined
  const trimmed = String(value).trim()
  if (!trimmed || trimmed === 'Select') return undefined
  return trimmed
}

const Issue = () => {
  const {
    status,
    token,
    user,
    role: authRole,
    headOfficeId: authHeadOfficeId,
    schoolId: authSchoolId,
  } = useAuth()
  const role = useMemo(
    () => normalizeRole(authRole || user?.role || user?.userRole || user?.authority),
    [authRole, user],
  )
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'

  const [rows, setRows] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [schools, setSchools] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [roleOptions, setRoleOptions] = useState([])
  const [recipientOptions, setRecipientOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [addForm, setAddForm] = useState(emptyForm)
  const [filters, setFilters] = useState(emptyFilters)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptionsFor = useCallback(
    (list, selectedHeadOfficeId) => {
      const rows = Array.isArray(list) ? list : []
      if (isSuperAdmin) {
        if (!selectedHeadOfficeId) return []
        return rows.filter((school) => String(school?.headOfficeId ?? '') === String(selectedHeadOfficeId))
      }
      if (isHeadOfficeAdmin) {
        return rows.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
      }
      if (isSchoolAdmin) {
        return rows.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
      }
      if (selectedHeadOfficeId) {
        return rows.filter((school) => String(school?.headOfficeId ?? '') === String(selectedHeadOfficeId))
      }
      return rows
    },
    [authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin],
  )

  const schoolOptions = useMemo(() => schoolOptionsFor(schools), [schoolOptionsFor, schools])
  const addSchoolOptions = useMemo(() => schoolOptionsFor(schools, addForm.headOfficeId), [addForm.headOfficeId, schoolOptionsFor, schools])
  const filterSchoolOptions = useMemo(() => schoolOptionsFor(schools, pendingFilters.headOfficeId), [pendingFilters.headOfficeId, schoolOptionsFor, schools])
  const categoryOptions = useMemo(
    () => categories.filter((row) => String(row?.schoolId ?? '') === String(addForm.schoolId)),
    [addForm.schoolId, categories],
  )

  const productOptions = useMemo(
    () =>
      products.filter(
        (row) =>
          String(row?.schoolId ?? '') === String(addForm.schoolId) &&
          (!addForm.categoryId || String(row?.categoryId ?? '') === String(addForm.categoryId)),
      ),
    [addForm.categoryId, addForm.schoolId, products],
  )

  const loadLookups = useCallback(async () => {
    setLookupLoading(true)
    try {
      const [headOfficePage, schoolRows, categoryRows, productRows] = await Promise.all([
        fetchHeadOfficesPage(0, 500),
        fetchSchoolsLookup(),
        fetchAllPages((page, size) => fetchCategoriesPage({ page, size })),
        fetchAllPages((page, size) => fetchProductsPage({ page, size })),
      ])
      setHeadOffices(Array.isArray(headOfficePage?.content) ? headOfficePage.content : [])
      setSchools(Array.isArray(schoolRows) ? schoolRows : [])
      setCategories(Array.isArray(categoryRows) ? categoryRows : [])
      setProducts(Array.isArray(productRows) ? productRows : [])
    } catch (err) {
      console.error('Failed to load issue lookups:', err)
      setHeadOffices([])
      setSchools([])
      setCategories([])
      setProducts([])
    } finally {
      setLookupLoading(false)
    }
  }, [])

  const loadIssues = useCallback(async () => {
    if (status !== 'ready' || !token) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchIssuesPage({
        page: currentPage - 1,
        size: rowsPerPage,
        search: debouncedSearch,
        headOfficeId: normalizeSelectValue(filters.headOfficeId),
        schoolId: normalizeSelectValue(filters.schoolId),
        userType: normalizeSelectValue(filters.userType),
      })
      setRows(Array.isArray(data?.content) ? data.content : [])
      setTotalElements(Number(data?.totalElements ?? 0))
      setTotalPages(Number(data?.totalPages ?? 0))
    } catch (err) {
      console.error('Failed to load issues:', err)
      setError(err?.message || 'Failed to load issues')
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, filters.headOfficeId, filters.schoolId, filters.userType, rowsPerPage, status, token])

  const loadRoles = useCallback(
    async (schoolId) => {
      if (!schoolId) {
        setRoleOptions([])
        return
      }
      try {
        const rows = await fetchIssueRoles({ schoolId: Number(schoolId) })
        setRoleOptions(Array.isArray(rows) ? rows : [])
      } catch (err) {
        console.error('Failed to load issue roles:', err)
        setRoleOptions([])
      }
    },
    [],
  )

  const loadRecipients = useCallback(
    async (schoolId, roleValue) => {
      if (!schoolId || !roleValue) {
        setRecipientOptions([])
        return
      }
      try {
        const rows = await fetchIssueRecipients({ schoolId: Number(schoolId), role: roleValue })
        setRecipientOptions(Array.isArray(rows) ? rows : [])
      } catch (err) {
        console.error('Failed to load issue recipients:', err)
        setRecipientOptions([])
      }
    },
    [],
  )

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    void loadIssues()
  }, [loadIssues, status, token])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    if (isSchoolAdmin && authSchoolId != null) {
      const school = (Array.isArray(schools) ? schools : []).find((row) => String(row?.id ?? '') === String(authSchoolId))
      const schoolId = String(authSchoolId)
      setPendingFilters((prev) => ({ ...prev, schoolId }))
      setFilters((prev) => ({ ...prev, schoolId }))
      setAddForm((prev) => ({
        ...prev,
        headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
        schoolId,
      }))
    }
  }, [authSchoolId, isSchoolAdmin, schools])

  useEffect(() => {
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      const value = String(authHeadOfficeId)
      setPendingFilters((prev) => ({ ...prev, headOfficeId: value }))
      setFilters((prev) => ({ ...prev, headOfficeId: value }))
      setAddForm((prev) => ({ ...prev, headOfficeId: value }))
    }
  }, [authHeadOfficeId, isHeadOfficeAdmin])

  useEffect(() => {
    if (addForm.schoolId) {
      void loadRoles(addForm.schoolId)
    } else {
      setRoleOptions([])
    }
  }, [addForm.schoolId, loadRoles])

  useEffect(() => {
    if (addForm.schoolId && addForm.userType) {
      void loadRecipients(addForm.schoolId, addForm.userType)
    } else {
      setRecipientOptions([])
    }
  }, [addForm.schoolId, addForm.userType, loadRecipients])

  const handleOpenAdd = useCallback(() => {
    setError('')
    setEditingId(null)
    setAddForm({
      ...emptyForm,
      headOfficeId: isHeadOfficeAdmin && authHeadOfficeId != null ? String(authHeadOfficeId) : '',
      schoolId: isSchoolAdmin && authSchoolId != null ? String(authSchoolId) : '',
      issueDate: DEFAULT_ISSUE_DATE,
      dueDate: DEFAULT_DUE_DATE,
    })
    setRoleOptions([])
    setRecipientOptions([])
    setIsAddOpen(true)
  }, [authSchoolId, isSchoolAdmin])

  const handleEdit = useCallback(
    (row) => {
      if (!row) return
      setError('')
      setEditingId(row.id ?? null)
      setAddForm({
        headOfficeId: row.headOfficeId != null ? String(row.headOfficeId) : '',
        schoolId: row.schoolId != null ? String(row.schoolId) : '',
        userType: row.userType || '',
        issueToId: row.issueToId != null ? String(row.issueToId) : '',
        categoryId: row.categoryId != null ? String(row.categoryId) : '',
        productId: row.productId != null ? String(row.productId) : '',
        quantity: row.quantity != null ? String(row.quantity) : '',
        issueDate: row.issueDate ? String(row.issueDate).slice(0, 10) : DEFAULT_ISSUE_DATE,
        dueDate: row.dueDate ? String(row.dueDate).slice(0, 10) : DEFAULT_DUE_DATE,
        note: row.note || '',
      })
      setIsAddOpen(true)
    },
    [],
  )

  const handleHeadOfficeChange = useCallback(
    (value) => {
      setAddForm((prev) => ({
        ...prev,
        headOfficeId: value,
        schoolId: '',
        userType: '',
        issueToId: '',
        categoryId: '',
        productId: '',
      }))
      setRecipientOptions([])
      setRoleOptions([])
    },
    [],
  )

  const handleSave = useCallback(async () => {
    const headOfficeId = addForm.headOfficeId ? Number(addForm.headOfficeId) : null
    const schoolId = addForm.schoolId ? Number(addForm.schoolId) : null
    const userType = String(addForm.userType || '').trim()
    const issueToId = addForm.issueToId ? Number(addForm.issueToId) : null
    const categoryId = addForm.categoryId ? Number(addForm.categoryId) : null
    const productId = addForm.productId ? Number(addForm.productId) : null
    const quantity = addForm.quantity === '' ? null : Number(addForm.quantity)

    if (!schoolId) return setError('School is required.')
    if (!userType) return setError('User type is required.')
    if (!issueToId) return setError('Issue to is required.')
    if (!categoryId) return setError('Category is required.')
    if (!productId) return setError('Product is required.')
    if (quantity == null || Number.isNaN(quantity) || quantity <= 0) return setError('Quantity is required.')
    if (!addForm.issueDate) return setError('Issue date is required.')
    if (!addForm.dueDate) return setError('Due date is required.')

    const selected = (Array.isArray(schools) ? schools : []).find((row) => String(row?.id ?? '') === String(schoolId))
    const resolvedHeadOfficeId = headOfficeId != null && !Number.isNaN(headOfficeId)
      ? headOfficeId
      : selected?.headOfficeId != null
        ? Number(selected.headOfficeId)
        : null
    const payload = {
      headOfficeId: resolvedHeadOfficeId,
      schoolId,
      userType,
      issueToId,
      categoryId,
      productId,
      quantity,
      issueDate: addForm.issueDate,
      dueDate: addForm.dueDate,
      note: String(addForm.note || '').trim(),
    }

    setBusy(true)
    setError('')
    try {
      if (editingId != null) {
        await updateIssue(editingId, payload)
      } else {
        await createIssue(payload)
      }
      setIsAddOpen(false)
      setEditingId(null)
      setAddForm({
        ...emptyForm,
        headOfficeId: isHeadOfficeAdmin && authHeadOfficeId != null ? String(authHeadOfficeId) : '',
        schoolId: isSchoolAdmin && authSchoolId != null ? String(authSchoolId) : '',
        issueDate: DEFAULT_ISSUE_DATE,
        dueDate: DEFAULT_DUE_DATE,
      })
      await loadIssues()
    } catch (err) {
      console.error(`Failed to ${editingId != null ? 'update' : 'create'} issue:`, err)
      setError(err?.message || `Failed to ${editingId != null ? 'update' : 'create'} issue`)
    } finally {
      setBusy(false)
    }
  }, [addForm, authHeadOfficeId, authSchoolId, editingId, isHeadOfficeAdmin, isSchoolAdmin, loadIssues, schools])

  const handleExportRows = useCallback(async () => {
    const data = await fetchAllPages((page, size) =>
      fetchIssuesPage({
        page,
        size,
        search: debouncedSearch,
        headOfficeId: normalizeSelectValue(filters.headOfficeId),
        schoolId: normalizeSelectValue(filters.schoolId),
        userType: normalizeSelectValue(filters.userType),
      }),
    )
    return Array.isArray(data) ? data : []
  }, [debouncedSearch, filters.headOfficeId, filters.schoolId, filters.userType])

  const handleExportExcel = useCallback(async () => {
    try {
      const exportRows = await handleExportRows()
      const worksheet = XLSX.utils.json_to_sheet(exportRows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Issues')
      XLSX.writeFile(workbook, 'Issue_Report.xlsx')
    } catch (err) {
      console.error('Failed to export issues:', err)
      setError(err?.message || 'Failed to export issues')
    }
  }, [handleExportRows])

  const handleExportPDF = useCallback(async () => {
    try {
      const exportRows = await handleExportRows()
      const doc = new jsPDF({ orientation: 'landscape' })
      doc.text('Product Issue Report', 14, 10)
      doc.autoTable({
        head: [['S.L', ...columnOptions.filter((column) => visibleColumns[column.key]).map((column) => column.label)]],
        body: exportRows.map((row, index) => [
          index + 1,
          ...columnOptions.filter((column) => visibleColumns[column.key]).map((column) => row[column.key]),
        ]),
        headStyles: { fillColor: [31, 41, 55] },
      })
      doc.save('Issue_Report.pdf')
    } catch (err) {
      console.error('Failed to export issues:', err)
      setError(err?.message || 'Failed to export issues')
    }
  }, [handleExportRows, visibleColumns])

  const handleSchoolChange = useCallback(
    (value) => {
      const school = (Array.isArray(schools) ? schools : []).find((row) => String(row?.id ?? '') === String(value))
      setAddForm((prev) => ({
        ...prev,
        headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
        schoolId: value,
        userType: '',
        issueToId: '',
        categoryId: '',
        productId: '',
      }))
      setRecipientOptions([])
      setRoleOptions([])
    },
    [schools],
  )

  const handleUserTypeChange = useCallback((value) => {
    setAddForm((prev) => ({
      ...prev,
      userType: value,
      issueToId: '',
    }))
    setRecipientOptions([])
  }, [])

  const renderForm = () => (
    <div className="avm-grid">
      {isSuperAdmin ? (
        <ManualScopeSelectors
          enabled
          headOffices={headOffices.map((row) => ({ id: row.id, name: row.name || row.headOfficeName || '' }))}
          schoolOptions={addSchoolOptions}
          selectedHeadOfficeId={addForm.headOfficeId}
          onHeadOfficeChange={(value) =>
            setAddForm((prev) => ({
              ...prev,
              headOfficeId: value,
              schoolId: '',
              userType: '',
              issueToId: '',
              categoryId: '',
              productId: '',
            }))
          }
          selectedSchoolId={addForm.schoolId}
          onSchoolChange={(value) => handleSchoolChange(value)}
          schoolLabel="School"
        />
      ) : (
        <>
          {isHeadOfficeAdmin ? (
            <FormField label="Head Office" full>
              <input className="avm-input" value={headOffices.find((row) => String(row.id) === String(addForm.headOfficeId))?.name || String(authHeadOfficeId || '')} disabled />
            </FormField>
          ) : null}
          <FormField label="School Name" required full>
            <select
              className="avm-select"
              id="schoolId"
              value={addForm.schoolId}
              onChange={(e) => handleSchoolChange(e.target.value)}
              disabled={isSchoolAdmin}
            >
              <option value="">{isSchoolAdmin ? 'Current School' : '--Select School--'}</option>
              {schoolOptions.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.schoolName}
                </option>
              ))}
            </select>
          </FormField>
        </>
      )}

      <FormField label="User Type" required>
        <select
          className="avm-select"
          id="userType"
          value={addForm.userType}
          onChange={(e) => handleUserTypeChange(e.target.value)}
          disabled={!addForm.schoolId}
        >
          <option value="">{addForm.schoolId ? '--Select Role--' : 'Select School First'}</option>
          {roleOptions.map((roleOption) => (
            <option key={roleOption} value={roleOption}>
              {roleOption}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Issue To" required>
        <select
          className="avm-select"
          id="issueToId"
          value={addForm.issueToId}
          onChange={(e) => setAddForm((prev) => ({ ...prev, issueToId: e.target.value }))}
          disabled={!addForm.userType}
        >
          <option value="">{addForm.userType ? '--Select--' : 'Select Role First'}</option>
          {recipientOptions.map((recipient) => (
            <option key={`${recipient.source}-${recipient.id}`} value={recipient.id}>
              {recipient.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Category" required>
        <select
          className="avm-select"
          id="categoryId"
          value={addForm.categoryId}
          onChange={(e) => setAddForm((prev) => ({ ...prev, categoryId: e.target.value, productId: '' }))}
          disabled={!addForm.schoolId}
        >
          <option value="">{addForm.schoolId ? '--Select--' : 'Select School First'}</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.categoryName}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Product" required>
        <select
          className="avm-select"
          id="productId"
          value={addForm.productId}
          onChange={(e) => setAddForm((prev) => ({ ...prev, productId: e.target.value }))}
          disabled={!addForm.schoolId}
        >
          <option value="">{addForm.schoolId ? '--Select--' : 'Select School First'}</option>
          {productOptions.map((product) => (
            <option key={product.id} value={product.id}>
              {product.productName}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Quantity" required full>
        <input
          type="number"
          className="avm-input"
          id="quantity"
          placeholder="Quantity"
          value={addForm.quantity}
          onChange={(e) => setAddForm((prev) => ({ ...prev, quantity: e.target.value }))}
          min="1"
          step="1"
        />
      </FormField>

      <FormField label="Issue Date" required>
        <input
          type="date"
          className="avm-input"
          id="issueDate"
          value={addForm.issueDate}
          onChange={(e) => setAddForm((prev) => ({ ...prev, issueDate: e.target.value }))}
        />
      </FormField>

      <FormField label="Due Date" required>
        <input
          type="date"
          className="avm-input"
          id="dueDate"
          value={addForm.dueDate}
          onChange={(e) => setAddForm((prev) => ({ ...prev, dueDate: e.target.value }))}
        />
      </FormField>

      <FormField label="Note" full>
        <textarea
          className="avm-input avm-textarea"
          id="note"
          rows="3"
          placeholder="Note"
          value={addForm.note}
          onChange={(e) => setAddForm((prev) => ({ ...prev, note: e.target.value }))}
        />
      </FormField>
    </div>
  )

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Issue</h1>
          <span className="text-secondary-light">Inventory / Issue Management</span>
        </div>
        <button
          type="button"
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={handleOpenAdd}
        >
          <i className="ri-add-large-line"></i> Add Issue
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                  data-bs-toggle="dropdown"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1"></i> Export
                  </span>
                  <span>
                    <i className="ri-arrow-down-s-line"></i>
                  </span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li>
                    <button
                      type="button"
                      className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 d-flex align-items-center gap-10"
                      onClick={handleExportExcel}
                    >
                      <i className="ri-file-text-line"></i> CSV
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 d-flex align-items-center gap-10"
                      onClick={handleExportExcel}
                    >
                      <i className="ri-file-excel-2-line"></i> Excel
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 d-flex align-items-center gap-10"
                      onClick={handleExportPDF}
                    >
                      <i className="ri-file-3-line"></i> PDF
                    </button>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="text-secondary-light text-sm">Find</span>
                <i className="ri-arrow-right-line"></i>
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                  data-bs-toggle="dropdown"
                >
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <ul className="dropdown-menu p-12 border shadow">
                  {columnOptions.map((col) => (
                    <li key={col.key}>
                      <label className="dropdown-item px-12 py-8 rounded d-flex align-items-center gap-8 cursor-pointer">
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
                placeholder="Search issues..."
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

          {lookupLoading ? <div className="px-20 py-12 text-secondary-light">Loading lookups...</div> : null}
          {error ? <div className="px-20 py-12 text-danger-600">{error}</div> : null}

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table">
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {columnOptions.map((col) => visibleColumns[col.key] && <th key={col.key}>{col.label}</th>)}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading issues...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id ?? idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {columnOptions.map(
                        (col) =>
                          visibleColumns[col.key] && (
                            <td key={col.key}>
                              {col.key === 'productName' ? (
                                <span className="fw-medium text-primary-light">{row[col.key] || '--'}</span>
                              ) : (
                                row[col.key] || '--'
                              )}
                            </td>
                          ),
                      )}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => handleEdit(row)}
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={async () => {
                              if (!window.confirm(`Delete issue "${row.issueToName || row.productName || 'this issue'}"?`)) return
                              try {
                                await deleteIssue(row.id)
                                await loadIssues()
                              } catch (err) {
                                console.error('Failed to delete issue:', err)
                                setError(err?.message || 'Failed to delete issue')
                              }
                            }}
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

          <div className="d-flex align-items-center justify-content-between px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, totalElements)} of {totalElements} entries
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
              <button type="button" className="btn btn-sm btn-primary-600">
                {currentPage}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.min(totalPages || 1, p + 1))}
                disabled={currentPage === (totalPages || 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <WizardPopup
        modalWidth="680px"
        open={isAddOpen}
        title={editingId != null ? 'Edit Issue' : 'Add Issue'}
        steps={STEPS}
        step={0}
        onClose={() => {
          setIsAddOpen(false)
          setEditingId(null)
        }}
        onSubmit={handleSave}
        submitLabel={busy ? 'Saving...' : editingId != null ? 'Update Issue' : 'Save'}
      >
        {renderForm()}
      </WizardPopup>

      <SlideSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} title="Find Issue">
        <form
          className="p-20 d-grid gap-16"
          onSubmit={(e) => {
            e.preventDefault()
            setFilters(pendingFilters)
            setCurrentPage(1)
            setIsFilterSidebarOpen(false)
          }}
        >
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={headOffices.map((row) => ({ id: row.id, name: row.name || row.headOfficeName || '' }))}
              schoolOptions={filterSchoolOptions}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={(value) => setPendingFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: 'Select' }))}
              selectedSchoolId={pendingFilters.schoolId === 'Select' ? '' : pendingFilters.schoolId}
              onSchoolChange={(value) => setPendingFilters((prev) => ({ ...prev, schoolId: value }))}
              schoolLabel="School"
            />
          ) : (
            <>
              {isHeadOfficeAdmin ? (
                <div>
                  <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Head Office</label>
                  <input
                    className="avm-input"
                    value={headOffices.find((row) => String(row.id) === String(authHeadOfficeId))?.name || String(authHeadOfficeId || '')}
                    disabled
                  />
                </div>
              ) : null}
              <div>
                <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
                <select
                  className="avm-select"
                  value={pendingFilters.schoolId}
                  onChange={(e) => setPendingFilters({ ...pendingFilters, schoolId: e.target.value })}
                  disabled={isSchoolAdmin}
                >
                  <option value="Select">All Schools</option>
                  {schoolOptions.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">User Type</label>
            <select
              className="avm-select"
              value={pendingFilters.userType}
              onChange={(e) => setPendingFilters({ ...pendingFilters, userType: e.target.value })}
            >
              <option value="Select">All Types</option>
              <option value="STUDENT">STUDENT</option>
              <option value="TEACHER">TEACHER</option>
              <option value="PARENT">PARENT</option>
              <option value="ADMIN">ADMIN</option>
              <option value="STAFF">STAFF</option>
            </select>
          </div>
          <div className="d-flex gap-8 mt-12">
            <button
              type="button"
              className="btn btn-danger-200 text-danger-600 w-100"
              onClick={() => {
                const next = {
                  ...emptyFilters,
                  headOfficeId: isHeadOfficeAdmin && authHeadOfficeId != null ? String(authHeadOfficeId) : '',
                  schoolId: isSchoolAdmin && authSchoolId != null ? String(authSchoolId) : 'Select',
                }
                setPendingFilters(next)
                setFilters(next)
                setCurrentPage(1)
              }}
            >
              Reset
            </button>
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply Filter
            </button>
          </div>
        </form>
      </SlideSidebar>

      <style>{`
        .form-field-icon {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: #667085;
          font-size: 0.95rem;
          line-height: 1;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>
    </div>
  )
}

export default Issue
