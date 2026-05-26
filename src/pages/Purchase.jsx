import { useCallback, useEffect, useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ExportDropdown from '../components/ExportDropdown'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchSuppliersPage } from '../apis/suppliersApi'
import { fetchCategoriesPage } from '../apis/categoriesApi'
import { fetchProductsPage } from '../apis/productsApi'
import { fetchEmployees } from '../apis/employeesApi'
import { createPurchase, deletePurchase, fetchPurchasesPage, updatePurchase } from '../apis/purchasesApi'
import '../assets/css/addModalShared.css'

const UNIT_TYPES = ['BOX', 'LITER', 'KG', 'PIECE', 'SET', 'OTHER']

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  supplierId: '',
  categoryId: '',
  productId: '',
  purchaseById: '',
  quantity: '',
  unitType: '',
  customUnitType: '',
  unitPrice: '',
  purchaseDate: '',
  expireDate: '',
  note: '',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  supplierId: '',
  categoryId: '',
  productId: '',
}

const STEPS = ['Purchase Details']

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  Supplier: 'ri-truck-line',
  Category: 'ri-list-settings-line',
  Product: 'ri-shopping-bag-line',
  Quantity: 'ri-equalizer-line',
  'Unit Type': 'ri-flask-line',
  'Custom Unit Type': 'ri-pencil-line',
  'Unit Price': 'ri-money-dollar-circle-line',
  'Purchase Date': 'ri-calendar-line',
  'Expire Date': 'ri-calendar-event-line',
  'Purchase By': 'ri-user-received-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'supplierName', label: 'Supplier' },
  { key: 'categoryName', label: 'Category' },
  { key: 'productName', label: 'Product' },
  { key: 'purchaseByName', label: 'Purchase By' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'unitTypeLabel', label: 'Unit Type' },
  { key: 'unitPrice', label: 'Unit Price' },
  { key: 'totalPrice', label: 'Total Price' },
  { key: 'purchaseDate', label: 'Purchase Date' },
  { key: 'expireDate', label: 'Expire Date' },
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

const getById = (rows, id) => (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(id ?? '')) || null

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

const EDIT_STORAGE_KEY = 'edit-purchase-row'

const Purchase = ({ onNavigate } = {}) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName, canAdd, canEdit, canDelete } = useAuth()
  const PAGE_SLUG = 'purchase'
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : null

  const [rows, setRows] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [allSuppliers, setAllSuppliers] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [addEmployees, setAddEmployees] = useState([])
  const [editEmployees, setEditEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [filters, setFilters] = useState(emptyFilters)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const loadLookups = useCallback(async () => {
    setLookupLoading(true)
    try {
      const [headOfficePage, schools, suppliers, categories, products] = await Promise.all([
        fetchHeadOfficesPage(0, 500),
        fetchSchoolsLookup(),
        fetchAllPages((page, size) => fetchSuppliersPage({ page, size })),
        fetchAllPages((page, size) => fetchCategoriesPage({ page, size })),
        fetchAllPages((page, size) => fetchProductsPage({ page, size })),
      ])
      setHeadOffices(Array.isArray(headOfficePage?.content) ? headOfficePage.content : [])
      setAllSchools(Array.isArray(schools) ? schools : [])
      setAllSuppliers(Array.isArray(suppliers) ? suppliers : [])
      setAllCategories(Array.isArray(categories) ? categories : [])
      setAllProducts(Array.isArray(products) ? products : [])
    } catch (err) {
      console.error('Failed to load purchase lookups:', err)
      setHeadOffices([])
      setAllSchools([])
      setAllSuppliers([])
      setAllCategories([])
      setAllProducts([])
    } finally {
      setLookupLoading(false)
    }
  }, [])

  const loadPurchases = useCallback(async () => {
    if (status !== 'ready' || !token) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchPurchasesPage({
        page: currentPage - 1,
        size: rowsPerPage,
        search: debouncedSearch,
        headOfficeId: filters.headOfficeId || undefined,
        schoolId: filters.schoolId || undefined,
        supplierId: filters.supplierId || undefined,
        categoryId: filters.categoryId || undefined,
        productId: filters.productId || undefined,
      })
      setRows(Array.isArray(data?.content) ? data.content : [])
      setTotalElements(Number(data?.totalElements ?? 0))
      setTotalPages(Number(data?.totalPages ?? 0))
    } catch (err) {
      console.error('Failed to load purchases:', err)
      setError(err?.message || 'Failed to load purchases')
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, filters.categoryId, filters.headOfficeId, filters.productId, filters.schoolId, filters.supplierId, rowsPerPage, status, token])

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    void loadPurchases()
  }, [loadPurchases, status, token])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      const value = String(authHeadOfficeId)
      setAddForm((prev) => ({ ...prev, headOfficeId: value }))
      setEditForm((prev) => ({ ...prev, headOfficeId: value }))
      setPendingFilters((prev) => ({ ...prev, headOfficeId: value }))
      setFilters((prev) => ({ ...prev, headOfficeId: value }))
    }
  }, [authHeadOfficeId, isHeadOfficeAdmin])

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return
    const school = getById(allSchools, authSchoolId)
    const headOfficeId = school?.headOfficeId != null ? String(school.headOfficeId) : ''
    const schoolId = String(authSchoolId)
    setAddForm((prev) => ({ ...prev, headOfficeId, schoolId }))
    setEditForm((prev) => ({ ...prev, headOfficeId, schoolId }))
    setPendingFilters((prev) => ({ ...prev, headOfficeId, schoolId }))
    setFilters((prev) => ({ ...prev, headOfficeId, schoolId }))
  }, [allSchools, authSchoolId, isSchoolAdmin])

  useEffect(() => {
    if (currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    const schoolId = addForm.schoolId
    if (!schoolId) {
      setAddEmployees([])
      return
    }
    let active = true
    void (async () => {
      try {
        const list = await fetchEmployees({ schoolId: Number(schoolId) })
        if (!active) return
        setAddEmployees(Array.isArray(list) ? list : [])
      } catch (err) {
        console.error('Failed to load purchase employees for add form:', err)
        if (active) setAddEmployees([])
      }
    })()
    return () => {
      active = false
    }
  }, [addForm.schoolId])

  useEffect(() => {
    const schoolId = editForm.schoolId
    if (!schoolId) {
      setEditEmployees([])
      return
    }
    let active = true
    void (async () => {
      try {
        const list = await fetchEmployees({ schoolId: Number(schoolId) })
        if (!active) return
        setEditEmployees(Array.isArray(list) ? list : [])
      } catch (err) {
        console.error('Failed to load purchase employees for edit form:', err)
        if (active) setEditEmployees([])
      }
    })()
    return () => {
      active = false
    }
  }, [editForm.schoolId])

  const resolveSchoolName = useCallback(
    (schoolId) => {
      if (schoolId == null) return ''
      const match = getById(allSchools, schoolId)
      return match?.schoolName || (String(schoolId) === String(authSchoolId ?? '') ? authSchoolName || '' : '')
    },
    [allSchools, authSchoolId, authSchoolName],
  )

  const resolveSupplierName = useCallback((supplierId) => getById(allSuppliers, supplierId)?.supplierName || '', [allSuppliers])
  const resolveCategoryName = useCallback((categoryId) => getById(allCategories, categoryId)?.categoryName || '', [allCategories])
  const resolveProductName = useCallback((productId) => getById(allProducts, productId)?.productName || '', [allProducts])
  const resolveEmployeeName = useCallback((employeeId) => getById([...addEmployees, ...editEmployees], employeeId)?.name || '', [addEmployees, editEmployees])

  const schoolOptionsFor = useCallback(
    (headOfficeId) => {
      const list = Array.isArray(allSchools) ? allSchools : []
      if (isSuperAdmin) {
        if (!headOfficeId) return []
        return list.filter((school) => String(school?.headOfficeId ?? '') === String(headOfficeId))
      }
      if (isHeadOfficeAdmin) {
        return list.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
      }
      if (isSchoolAdmin) {
        return list.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
      }
      return list
    },
    [allSchools, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin],
  )

  const suppliersFor = useCallback(
    (schoolId) => {
      const list = Array.isArray(allSuppliers) ? allSuppliers : []
      if (!schoolId) return []
      return list.filter((row) => String(row?.schoolId ?? '') === String(schoolId))
    },
    [allSuppliers],
  )

  const categoriesFor = useCallback(
    (schoolId) => {
      const list = Array.isArray(allCategories) ? allCategories : []
      if (!schoolId) return []
      return list.filter((row) => String(row?.schoolId ?? '') === String(schoolId))
    },
    [allCategories],
  )

  const productsFor = useCallback(
    (schoolId, categoryId = '') => {
      const list = Array.isArray(allProducts) ? allProducts : []
      if (!schoolId) return []
      return list.filter(
        (row) =>
          String(row?.schoolId ?? '') === String(schoolId) &&
          (!categoryId || String(row?.categoryId ?? '') === String(categoryId)),
      )
    },
    [allProducts],
  )

  const addSchoolOptions = useMemo(() => schoolOptionsFor(addForm.headOfficeId), [addForm.headOfficeId, schoolOptionsFor])
  const editSchoolOptions = useMemo(() => schoolOptionsFor(editForm.headOfficeId), [editForm.headOfficeId, schoolOptionsFor])
  const filterSchoolOptions = useMemo(() => schoolOptionsFor(pendingFilters.headOfficeId), [pendingFilters.headOfficeId, schoolOptionsFor])

  const addSupplierOptions = useMemo(() => suppliersFor(addForm.schoolId), [addForm.schoolId, suppliersFor])
  const editSupplierOptions = useMemo(() => suppliersFor(editForm.schoolId), [editForm.schoolId, suppliersFor])
  const filterSupplierOptions = useMemo(() => suppliersFor(pendingFilters.schoolId), [pendingFilters.schoolId, suppliersFor])

  const addCategoryOptions = useMemo(() => categoriesFor(addForm.schoolId), [addForm.schoolId, categoriesFor])
  const editCategoryOptions = useMemo(() => categoriesFor(editForm.schoolId), [editForm.schoolId, categoriesFor])
  const filterCategoryOptions = useMemo(() => categoriesFor(pendingFilters.schoolId), [pendingFilters.schoolId, categoriesFor])

  const addProductOptions = useMemo(() => productsFor(addForm.schoolId, addForm.categoryId), [addForm.categoryId, addForm.schoolId, productsFor])
  const editProductOptions = useMemo(() => productsFor(editForm.schoolId, editForm.categoryId), [editForm.categoryId, editForm.schoolId, productsFor])
  const filterProductOptions = useMemo(() => productsFor(pendingFilters.schoolId, pendingFilters.categoryId), [pendingFilters.categoryId, pendingFilters.schoolId, productsFor])

  const normalizedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        schoolName: row.schoolName || resolveSchoolName(row.schoolId),
        supplierName: row.supplierName || resolveSupplierName(row.supplierId),
        categoryName: row.categoryName || resolveCategoryName(row.categoryId),
        productName: row.productName || resolveProductName(row.productId),
        purchaseByName: row.purchaseByName || resolveEmployeeName(row.purchaseById),
        unitTypeLabel: row.unitType === 'OTHER' ? row.customUnitType || 'Other' : row.unitType,
      })),
    [resolveCategoryName, resolveEmployeeName, resolveProductName, resolveSchoolName, resolveSupplierName, rows],
  )

  const currentStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const currentEnd = totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)

  const buildPayload = (form) => ({
    headOfficeId: form.headOfficeId ? Number(form.headOfficeId) : null,
    schoolId: form.schoolId ? Number(form.schoolId) : null,
    supplierId: form.supplierId ? Number(form.supplierId) : null,
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    productId: form.productId ? Number(form.productId) : null,
    purchaseById: form.purchaseById ? Number(form.purchaseById) : null,
    quantity: form.quantity ? Number(form.quantity) : null,
    unitType: String(form.unitType || '').trim().toUpperCase(),
    customUnitType: form.unitType === 'OTHER' ? String(form.customUnitType || '').trim() : null,
    unitPrice: form.unitPrice ? Number(form.unitPrice) : null,
    purchaseDate: form.purchaseDate || null,
    expireDate: form.expireDate || null,
    note: String(form.note || '').trim(),
  })

  const openAdd = () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    } catch {}
    navigateTo?.('add-purchase')
  }

  const openEdit = (row) => {
    const school = getById(allSchools, row?.schoolId)
    const normalizedRow = {
      ...row,
      id: row?.id != null ? String(row.id) : '',
      headOfficeId:
        row?.headOfficeId != null
          ? String(row.headOfficeId)
          : school?.headOfficeId != null
            ? String(school.headOfficeId)
            : authHeadOfficeId != null
              ? String(authHeadOfficeId)
              : '',
      schoolId: row?.schoolId != null ? String(row.schoolId) : '',
      supplierId: row?.supplierId != null ? String(row.supplierId) : '',
      categoryId: row?.categoryId != null ? String(row.categoryId) : '',
      productId: row?.productId != null ? String(row.productId) : '',
      purchaseById: row?.purchaseById != null ? String(row.purchaseById) : '',
      quantity: row?.quantity != null ? String(row.quantity) : '',
      unitType: row?.unitType || '',
      customUnitType: row?.customUnitType || '',
      unitPrice: row?.unitPrice != null ? String(row.unitPrice) : '',
      purchaseDate: row?.purchaseDate || '',
      expireDate: row?.expireDate || '',
      note: row?.note || '',
    }

    try {
      sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(normalizedRow))
    } catch {}
    navigateTo?.('add-purchase')
  }

  const handleHeadOfficeChange = (setter, value) => {
    setter((prev) => ({
      ...prev,
      headOfficeId: value,
      schoolId: '',
      supplierId: '',
      categoryId: '',
      productId: '',
      purchaseById: '',
    }))
  }

  const handleSchoolChange = (setter, value) => {
    const selectedSchool = getById(allSchools, value)
    setter((prev) => ({
      ...prev,
      schoolId: value,
      headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
      supplierId: '',
      categoryId: '',
      productId: '',
      purchaseById: '',
    }))
  }

  const handleCategoryChange = (setter, value) => {
    setter((prev) => ({
      ...prev,
      categoryId: value,
      productId: '',
    }))
  }

  const validateForm = (form) => {
    if (!form.productId || !form.schoolId || !form.supplierId || !form.categoryId || !form.purchaseById) {
      return 'School, supplier, category, product, and purchase by are required.'
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      return 'Quantity must be greater than 0.'
    }
    if (!form.unitPrice && Number(form.unitPrice) !== 0) {
      return 'Unit price is required.'
    }
    if (!form.unitType) {
      return 'Unit type is required.'
    }
    if (String(form.unitType).toUpperCase() === 'OTHER' && !String(form.customUnitType || '').trim()) {
      return 'Custom unit type is required when Unit Type is Other.'
    }
    if (!form.purchaseDate) {
      return 'Purchase date is required.'
    }
    return ''
  }

  const handleSaveAdd = async () => {
    const payload = buildPayload(addForm)
    const validationError = validateForm(addForm)
    if (validationError) {
      setError(validationError)
      return
    }
    setSaving(true)
    setError('')
    try {
      await createPurchase(payload)
      setIsAddOpen(false)
      setAddForm(emptyForm)
      await loadPurchases()
    } catch (err) {
      console.error('Failed to create purchase:', err)
      setError(err?.message || 'Failed to create purchase')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    const payload = buildPayload(editForm)
    const validationError = validateForm(editForm)
    if (validationError) {
      setError(validationError)
      return
    }
    setSaving(true)
    setError('')
    try {
      await updatePurchase(editForm.id, payload)
      setIsEditOpen(false)
      await loadPurchases()
    } catch (err) {
      console.error('Failed to update purchase:', err)
      setError(err?.message || 'Failed to update purchase')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete purchase "${row?.productName || 'this purchase'}"?`)) return
    setSaving(true)
    setError('')
    try {
      await deletePurchase(row.id)
      await loadPurchases()
    } catch (err) {
      console.error('Failed to delete purchase:', err)
      setError(err?.message || 'Failed to delete purchase')
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
    const next = {
      headOfficeId: isHeadOfficeAdmin ? String(authHeadOfficeId ?? '') : '',
      schoolId: isSchoolAdmin ? String(authSchoolId ?? '') : '',
      supplierId: '',
      categoryId: '',
      productId: '',
    }
    setPendingFilters(next)
    setFilters(next)
    setCurrentPage(1)
  }

  const exportRows = async () => {
    const size = Math.max(totalElements, rowsPerPage, 1)
    const data = await fetchPurchasesPage({
      page: 0,
      size,
      search: debouncedSearch,
      headOfficeId: filters.headOfficeId || undefined,
      schoolId: filters.schoolId || undefined,
      supplierId: filters.supplierId || undefined,
      categoryId: filters.categoryId || undefined,
      productId: filters.productId || undefined,
    })
    return Array.isArray(data?.content) ? data.content : []
  }

  const mapExportRow = useCallback(
    (row) => ({
      ...row,
      schoolName: row.schoolName || resolveSchoolName(row.schoolId),
      supplierName: row.supplierName || resolveSupplierName(row.supplierId),
      categoryName: row.categoryName || resolveCategoryName(row.categoryId),
      productName: row.productName || resolveProductName(row.productId),
      purchaseByName: row.purchaseByName || resolveEmployeeName(row.purchaseById),
      unitTypeLabel: row.unitType === 'OTHER' ? row.customUnitType || 'Other' : row.unitType || '',
    }),
    [resolveCategoryName, resolveEmployeeName, resolveProductName, resolveSchoolName, resolveSupplierName],
  )

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Purchase</h1>
          <span className="text-secondary-light">Inventory / Purchase Management</span>
        </div>
        {canAdd(PAGE_SLUG) && (
          <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <i className="ri-add-large-line"></i> Add Purchase
          </button>
        )}
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown
                rows={normalizedRows}
                columns={columnOptions}
                visibleColumns={visibleColumns}
                loadRows={exportRows}
                mapRow={mapExportRow}
                fileName="Purchase_Report"
                sheetName="Purchases"
                pdfTitle="Purchase Report"
              />

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
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input type="checkbox" className="form-check-input mt-0" checked={visibleColumns[col.key]} onChange={() => toggleColumn(col.key)} />
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
                placeholder="Search purchases..."
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
                      Loading purchases...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  normalizedRows.map((row, idx) => (
                    <tr key={row.id ?? idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" />
                          <label className="form-check-label">{currentStart + idx}</label>
                        </div>
                      </td>
                      {columnOptions.map(
                        (col) =>
                          visibleColumns[col.key] && (
                            <td key={col.key}>
                              {col.key === 'productName' ? (
                                <span className="fw-medium text-primary-light">{row.productName}</span>
                              ) : col.key === 'totalPrice' ? (
                                row.totalPrice ?? '--'
                              ) : col.key === 'unitTypeLabel' ? (
                                row.unitTypeLabel || '--'
                              ) : (
                                row[col.key] || '--'
                              )}
                            </td>
                          ),
                      )}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          {canEdit(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="bg-info-focus bg-hover-info-200 text-info-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                              onClick={() => openEdit(row)}
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                          )}
                          {canDelete(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="bg-danger-focus bg-hover-danger-200 text-danger-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                              onClick={() => handleDelete(row)}
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
              Showing {totalElements === 0 ? 0 : currentStart} - {totalElements === 0 ? 0 : currentEnd} of {totalElements} entries
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
              <button type="button" className="btn btn-sm btn-primary-600">
                {currentPage}
              </button>
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

      <WizardPopup
        modalWidth="860px"
        open={isAddOpen}
        title="Add Purchase"
        steps={STEPS}
        step={0}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleSaveAdd}
        submitLabel={saving ? 'Saving...' : 'Save'}
      >
        <div className="avm-grid">
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={headOffices.map((row) => ({ id: row.id, name: row.name || row.headOfficeName || '' }))}
              schoolOptions={addSchoolOptions}
              selectedHeadOfficeId={addForm.headOfficeId}
              onHeadOfficeChange={(value) => handleHeadOfficeChange(setAddForm, value)}
              selectedSchoolId={addForm.schoolId}
              onSchoolChange={(value) => handleSchoolChange(setAddForm, value)}
              schoolLabel="School"
            />
          ) : (
            <>
              {isHeadOfficeAdmin ? (
                <FormField label="Head Office" full>
                  <input className="avm-input" value={authHeadOfficeName || String(authHeadOfficeId || '')} disabled />
                </FormField>
              ) : null}

              <FormField label="School Name" required >
                <select
                  className="avm-select"
                  value={addForm.schoolId}
                  onChange={(e) => handleSchoolChange(setAddForm, e.target.value)}
                  disabled={isSchoolAdmin}
                >
                  <option value="">--Select School--</option>
                  {addSchoolOptions.map((school) => (
                    <option key={String(school.id)} value={String(school.id)}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </FormField>
            </>
          )}

          <FormField label="Supplier" required >
            <select
              className="avm-select"
              value={addForm.supplierId}
              onChange={(e) => setAddForm((prev) => ({ ...prev, supplierId: e.target.value }))}
              disabled={!addForm.schoolId}
            >
              <option value="">{addForm.schoolId ? '--Select Supplier--' : 'Select School First'}</option>
              {addSupplierOptions.map((supplier) => (
                <option key={String(supplier.id)} value={String(supplier.id)}>
                  {supplier.supplierName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Category" required >
            <select
              className="avm-select"
              value={addForm.categoryId}
              onChange={(e) => handleCategoryChange(setAddForm, e.target.value)}
              disabled={!addForm.schoolId}
            >
              <option value="">{addForm.schoolId ? '--Select Category--' : 'Select School First'}</option>
              {addCategoryOptions.map((category) => (
                <option key={String(category.id)} value={String(category.id)}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Product" required >
            <select
              className="avm-select"
              value={addForm.productId}
              onChange={(e) => setAddForm((prev) => ({ ...prev, productId: e.target.value }))}
              disabled={!addForm.schoolId || !addForm.categoryId}
            >
              <option value="">{addForm.categoryId ? '--Select Product--' : 'Select Category First'}</option>
              {addProductOptions.map((product) => (
                <option key={String(product.id)} value={String(product.id)}>
                  {product.productName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Purchase By" required >
            <select
              className="avm-select"
              value={addForm.purchaseById}
              onChange={(e) => setAddForm((prev) => ({ ...prev, purchaseById: e.target.value }))}
              disabled={!addForm.schoolId}
            >
              <option value="">{addForm.schoolId ? '--Select Employee--' : 'Select School First'}</option>
              {addEmployees.map((employee) => (
                <option key={String(employee.id)} value={String(employee.id)}>
                  {employee.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Quantity" required>
            <input
              type="number"
              className="avm-input"
              placeholder="Quantity"
              min="0"
              step="any"
              value={addForm.quantity}
              onChange={(e) => setAddForm((prev) => ({ ...prev, quantity: e.target.value }))}
            />
          </FormField>

          <FormField label="Unit Type" required>
            <select
              className="avm-select"
              value={addForm.unitType}
              onChange={(e) => setAddForm((prev) => ({ ...prev, unitType: e.target.value, customUnitType: e.target.value === 'OTHER' ? prev.customUnitType : '' }))}
            >
              <option value="">--Select--</option>
              {UNIT_TYPES.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </FormField>

          {addForm.unitType === 'OTHER' ? (
            <FormField label="Custom Unit Type" required full>
              <input
                type="text"
                className="avm-input"
                placeholder="Enter custom unit type"
                value={addForm.customUnitType}
                onChange={(e) => setAddForm((prev) => ({ ...prev, customUnitType: e.target.value }))}
              />
            </FormField>
          ) : null}

          <FormField label="Unit Price" required>
            <input
              type="number"
              className="avm-input"
              placeholder="Unit Price"
              min="0"
              step="any"
              value={addForm.unitPrice}
              onChange={(e) => setAddForm((prev) => ({ ...prev, unitPrice: e.target.value }))}
            />
          </FormField>

          <FormField label="Purchase Date" required>
            <input
              type="date"
              className="avm-input"
              value={addForm.purchaseDate}
              onChange={(e) => setAddForm((prev) => ({ ...prev, purchaseDate: e.target.value }))}
            />
          </FormField>

          <FormField label="Expire Date (Optional)" >
            <input
              type="date"
              className="avm-input"
              value={addForm.expireDate}
              onChange={(e) => setAddForm((prev) => ({ ...prev, expireDate: e.target.value }))}
            />
          </FormField>

          <FormField label="Note" full>
            <textarea
              className="avm-input avm-textarea"
              rows="3"
              placeholder="Note"
              value={addForm.note}
              onChange={(e) => setAddForm((prev) => ({ ...prev, note: e.target.value }))}
            ></textarea>
          </FormField>
        </div>
      </WizardPopup>

      <WizardPopup
        modalWidth="860px"
        open={isEditOpen}
        title="Edit Purchase"
        steps={STEPS}
        step={0}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleSaveEdit}
        submitLabel={saving ? 'Updating...' : 'Update'}
      >
        <div className="avm-grid">
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={headOffices.map((row) => ({ id: row.id, name: row.name || row.headOfficeName || '' }))}
              schoolOptions={editSchoolOptions}
              selectedHeadOfficeId={editForm.headOfficeId}
              onHeadOfficeChange={(value) => handleHeadOfficeChange(setEditForm, value)}
              selectedSchoolId={editForm.schoolId}
              onSchoolChange={(value) => handleSchoolChange(setEditForm, value)}
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
                  value={editForm.schoolId}
                  onChange={(e) => handleSchoolChange(setEditForm, e.target.value)}
                  disabled={isSchoolAdmin}
                >
                  <option value="">--Select School--</option>
                  {editSchoolOptions.map((school) => (
                    <option key={String(school.id)} value={String(school.id)}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </FormField>
            </>
          )}

          <FormField label="Supplier" required full>
            <select
              className="avm-select"
              value={editForm.supplierId}
              onChange={(e) => setEditForm((prev) => ({ ...prev, supplierId: e.target.value }))}
              disabled={!editForm.schoolId}
            >
              <option value="">{editForm.schoolId ? '--Select Supplier--' : 'Select School First'}</option>
              {editSupplierOptions.map((supplier) => (
                <option key={String(supplier.id)} value={String(supplier.id)}>
                  {supplier.supplierName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Category" required full>
            <select
              className="avm-select"
              value={editForm.categoryId}
              onChange={(e) => handleCategoryChange(setEditForm, e.target.value)}
              disabled={!editForm.schoolId}
            >
              <option value="">{editForm.schoolId ? '--Select Category--' : 'Select School First'}</option>
              {editCategoryOptions.map((category) => (
                <option key={String(category.id)} value={String(category.id)}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Product" required full>
            <select
              className="avm-select"
              value={editForm.productId}
              onChange={(e) => setEditForm((prev) => ({ ...prev, productId: e.target.value }))}
              disabled={!editForm.schoolId || !editForm.categoryId}
            >
              <option value="">{editForm.categoryId ? '--Select Product--' : 'Select Category First'}</option>
              {editProductOptions.map((product) => (
                <option key={String(product.id)} value={String(product.id)}>
                  {product.productName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Purchase By" required full>
            <select
              className="avm-select"
              value={editForm.purchaseById}
              onChange={(e) => setEditForm((prev) => ({ ...prev, purchaseById: e.target.value }))}
              disabled={!editForm.schoolId}
            >
              <option value="">{editForm.schoolId ? '--Select Employee--' : 'Select School First'}</option>
              {editEmployees.map((employee) => (
                <option key={String(employee.id)} value={String(employee.id)}>
                  {employee.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Quantity" required>
            <input
              type="number"
              className="avm-input"
              placeholder="Quantity"
              min="0"
              step="any"
              value={editForm.quantity}
              onChange={(e) => setEditForm((prev) => ({ ...prev, quantity: e.target.value }))}
            />
          </FormField>

          <FormField label="Unit Type" required>
            <select
              className="avm-select"
              value={editForm.unitType}
              onChange={(e) => setEditForm((prev) => ({ ...prev, unitType: e.target.value, customUnitType: e.target.value === 'OTHER' ? prev.customUnitType : '' }))}
            >
              <option value="">--Select--</option>
              {UNIT_TYPES.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </FormField>

          {editForm.unitType === 'OTHER' ? (
            <FormField label="Custom Unit Type" required full>
              <input
                type="text"
                className="avm-input"
                placeholder="Enter custom unit type"
                value={editForm.customUnitType}
                onChange={(e) => setEditForm((prev) => ({ ...prev, customUnitType: e.target.value }))}
              />
            </FormField>
          ) : null}

          <FormField label="Unit Price" required>
            <input
              type="number"
              className="avm-input"
              placeholder="Unit Price"
              min="0"
              step="any"
              value={editForm.unitPrice}
              onChange={(e) => setEditForm((prev) => ({ ...prev, unitPrice: e.target.value }))}
            />
          </FormField>

          <FormField label="Purchase Date" required>
            <input
              type="date"
              className="avm-input"
              value={editForm.purchaseDate}
              onChange={(e) => setEditForm((prev) => ({ ...prev, purchaseDate: e.target.value }))}
            />
          </FormField>

          <FormField label="Expire Date" full>
            <input
              type="date"
              className="avm-input"
              value={editForm.expireDate}
              onChange={(e) => setEditForm((prev) => ({ ...prev, expireDate: e.target.value }))}
            />
          </FormField>

          <FormField label="Note" full>
            <textarea
              className="avm-input avm-textarea"
              rows="3"
              placeholder="Note"
              value={editForm.note}
              onChange={(e) => setEditForm((prev) => ({ ...prev, note: e.target.value }))}
            ></textarea>
          </FormField>
        </div>
      </WizardPopup>

      <SlideSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} title="Find Purchase">
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={headOffices.map((row) => ({ id: row.id, name: row.name || row.headOfficeName || '' }))}
              schoolOptions={filterSchoolOptions}
              selectedHeadOfficeId={pendingFilters.headOfficeId}
              onHeadOfficeChange={(value) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  headOfficeId: value,
                  schoolId: '',
                  supplierId: '',
                  categoryId: '',
                  productId: '',
                }))
              }
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={(value) => {
                const selectedSchool = getById(allSchools, value)
                setPendingFilters((prev) => ({
                  ...prev,
                  schoolId: value,
                  headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
                  supplierId: '',
                  categoryId: '',
                  productId: '',
                }))
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

              <FormField label="School Name" full>
                <select
                  className="avm-select"
                  value={pendingFilters.schoolId}
                  onChange={(e) =>
                    setPendingFilters((prev) => ({
                      ...prev,
                      schoolId: e.target.value,
                      supplierId: '',
                      categoryId: '',
                      productId: '',
                    }))
                  }
                  disabled={isSchoolAdmin}
                >
                  <option value="">All Schools</option>
                  {filterSchoolOptions.map((school) => (
                    <option key={String(school.id)} value={String(school.id)}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </FormField>
            </>
          )}

          <FormField label="Supplier" full>
            <select
              className="avm-select"
              value={pendingFilters.supplierId}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, supplierId: e.target.value }))}
              disabled={!pendingFilters.schoolId}
            >
              <option value="">All Suppliers</option>
              {filterSupplierOptions.map((supplier) => (
                <option key={String(supplier.id)} value={String(supplier.id)}>
                  {supplier.supplierName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Category" full>
            <select
              className="avm-select"
              value={pendingFilters.categoryId}
              onChange={(e) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  categoryId: e.target.value,
                  productId: '',
                }))
              }
              disabled={!pendingFilters.schoolId}
            >
              <option value="">All Categories</option>
              {filterCategoryOptions.map((category) => (
                <option key={String(category.id)} value={String(category.id)}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Product" full>
            <select
              className="avm-select"
              value={pendingFilters.productId}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, productId: e.target.value }))}
              disabled={!pendingFilters.schoolId}
            >
              <option value="">All Products</option>
              {filterProductOptions.map((product) => (
                <option key={String(product.id)} value={String(product.id)}>
                  {product.productName}
                </option>
              ))}
            </select>
          </FormField>

          <div className="d-flex gap-8 mt-12">
            <button type="button" className="btn btn-danger-200 text-danger-600 w-100" onClick={handleResetFilters}>
              Reset
            </button>
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply Filter
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default Purchase
