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
import { fetchCategoriesPage } from '../apis/categoriesApi'
import { fetchWarehousesPage } from '../apis/warehousesApi'
import { createProduct, deleteProduct, fetchProductsPage, updateProduct } from '../apis/productsApi'
import '../assets/css/addModalShared.css'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  categoryId: '',
  warehouseId: '',
  productName: '',
  productCode: '',
  note: '',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: '',
  categoryId: '',
  warehouseId: '',
}

const STEPS = ['Basic Information']

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  Category: 'ri-list-settings-line',
  Name: 'ri-shopping-bag-line',
  'Product Code': 'ri-barcode-line',
  Warehouse: 'ri-home-gear-line',
  Note: 'ri-sticky-note-line',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'categoryName', label: 'Category' },
  { key: 'warehouseName', label: 'Warehouse' },
  { key: 'productName', label: 'Name' },
  { key: 'productCode', label: 'Product Code' },
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

const Product = () => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName, canAdd, canEdit, canDelete } = useAuth()
  const PAGE_SLUG = 'product'
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'

  const [rows, setRows] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const [allWarehouses, setAllWarehouses] = useState([])
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

  const currentSchoolOption = useMemo(() => {
    if (authSchoolId == null) return null
    return {
      id: authSchoolId,
      schoolName: authSchoolName || `School ${authSchoolId}`,
      headOfficeId: authHeadOfficeId ?? '',
    }
  }, [authHeadOfficeId, authSchoolId, authSchoolName])

  const loadLookups = useCallback(async () => {
    setLookupLoading(true)
    try {
      const [headOfficePage, schools, categories, warehouses] = await Promise.all([
        isSuperAdmin ? fetchHeadOfficesPage(0, 500) : Promise.resolve({ content: [] }),
        isSchoolAdmin ? Promise.resolve(currentSchoolOption ? [currentSchoolOption] : []) : fetchSchoolsLookup(),
        fetchAllPages((page, size) => fetchCategoriesPage({ page, size })),
        fetchAllPages((page, size) => fetchWarehousesPage({ page, size })),
      ])
      setHeadOffices(Array.isArray(headOfficePage?.content) ? headOfficePage.content : [])
      setAllSchools(Array.isArray(schools) ? schools : [])
      setAllCategories(Array.isArray(categories) ? categories : [])
      setAllWarehouses(Array.isArray(warehouses) ? warehouses : [])
    } catch (err) {
      console.error('Failed to load product lookups:', err)
      setHeadOffices([])
      setAllSchools([])
      setAllCategories([])
      setAllWarehouses([])
    } finally {
      setLookupLoading(false)
    }
  }, [currentSchoolOption, isSchoolAdmin, isSuperAdmin])

  const loadProducts = useCallback(async () => {
    if (status !== 'ready' || !token) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchProductsPage({
        page: currentPage - 1,
        size: rowsPerPage,
        search: debouncedSearch,
        headOfficeId: filters.headOfficeId || undefined,
        schoolId: filters.schoolId || undefined,
        categoryId: filters.categoryId || undefined,
        warehouseId: filters.warehouseId || undefined,
      })
      setRows(Array.isArray(data?.content) ? data.content : [])
      setTotalElements(Number(data?.totalElements ?? 0))
      setTotalPages(Number(data?.totalPages ?? 0))
    } catch (err) {
      console.error('Failed to load products:', err)
      setError(err?.message || 'Failed to load products')
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, filters.categoryId, filters.headOfficeId, filters.schoolId, filters.warehouseId, rowsPerPage, status, token])

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    void loadProducts()
  }, [loadProducts, status, token])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      setAddForm((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
      setEditForm((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
      setPendingFilters((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
      setFilters((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
    }
  }, [authHeadOfficeId, isHeadOfficeAdmin])

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return
    const school = getById(allSchools, authSchoolId)
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
    setPendingFilters((prev) => ({ ...prev, schoolId: String(authSchoolId) }))
    setFilters((prev) => ({ ...prev, schoolId: String(authSchoolId) }))
  }, [allSchools, authSchoolId, isSchoolAdmin])

  useEffect(() => {
    if (currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const resolveSchoolName = useCallback(
    (schoolId) => {
      if (schoolId == null) return ''
      const match = getById(allSchools, schoolId)
      return match?.schoolName || (String(schoolId) === String(authSchoolId ?? '') ? authSchoolName || '' : '')
    },
    [allSchools, authSchoolId, authSchoolName],
  )

  const resolveCategoryName = useCallback(
    (categoryId) => getById(allCategories, categoryId)?.categoryName || '',
    [allCategories],
  )

  const resolveWarehouseName = useCallback(
    (warehouseId) => getById(allWarehouses, warehouseId)?.warehouseName || '',
    [allWarehouses],
  )

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
        return currentSchoolOption ? [currentSchoolOption] : []
      }
      return list
    },
    [allSchools, authHeadOfficeId, currentSchoolOption, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin],
  )

  const categoryOptionsFor = useCallback(
    (schoolId) => {
      const list = Array.isArray(allCategories) ? allCategories : []
      if (!schoolId) return []
      return list.filter((row) => String(row?.schoolId ?? '') === String(schoolId))
    },
    [allCategories],
  )

  const warehouseOptionsFor = useCallback(
    (schoolId) => {
      const list = Array.isArray(allWarehouses) ? allWarehouses : []
      if (!schoolId) return []
      return list.filter((row) => String(row?.schoolId ?? '') === String(schoolId))
    },
    [allWarehouses],
  )

  const addSchoolOptions = useMemo(() => schoolOptionsFor(addForm.headOfficeId), [addForm.headOfficeId, schoolOptionsFor])
  const editSchoolOptions = useMemo(() => schoolOptionsFor(editForm.headOfficeId), [editForm.headOfficeId, schoolOptionsFor])
  const filterSchoolOptions = useMemo(() => schoolOptionsFor(pendingFilters.headOfficeId), [pendingFilters.headOfficeId, schoolOptionsFor])

  const addCategoryOptions = useMemo(() => categoryOptionsFor(addForm.schoolId), [addForm.schoolId, categoryOptionsFor])
  const editCategoryOptions = useMemo(() => categoryOptionsFor(editForm.schoolId), [editForm.schoolId, categoryOptionsFor])
  const filterCategoryOptions = useMemo(() => categoryOptionsFor(pendingFilters.schoolId), [pendingFilters.schoolId, categoryOptionsFor])

  const addWarehouseOptions = useMemo(() => warehouseOptionsFor(addForm.schoolId), [addForm.schoolId, warehouseOptionsFor])
  const editWarehouseOptions = useMemo(() => warehouseOptionsFor(editForm.schoolId), [editForm.schoolId, warehouseOptionsFor])
  const filterWarehouseOptions = useMemo(() => warehouseOptionsFor(pendingFilters.schoolId), [pendingFilters.schoolId, warehouseOptionsFor])

  const normalizedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        schoolName: row.schoolName || resolveSchoolName(row.schoolId),
        categoryName: row.categoryName || resolveCategoryName(row.categoryId),
        warehouseName: row.warehouseName || resolveWarehouseName(row.warehouseId),
      })),
    [resolveCategoryName, resolveSchoolName, resolveWarehouseName, rows],
  )

  const currentStart = totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const currentEnd = totalElements === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalElements)

  const buildPayload = (form) => ({
    headOfficeId: form.headOfficeId ? Number(form.headOfficeId) : null,
    schoolId: form.schoolId ? Number(form.schoolId) : null,
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    warehouseId: form.warehouseId ? Number(form.warehouseId) : null,
    productName: String(form.productName || '').trim(),
    productCode: String(form.productCode || '').trim(),
    note: String(form.note || '').trim(),
  })

  const openAdd = () => {
    const base = { ...emptyForm }
    if (isHeadOfficeAdmin && authHeadOfficeId != null) base.headOfficeId = String(authHeadOfficeId)
    if (isSchoolAdmin && authSchoolId != null) {
      const school = getById(allSchools, authSchoolId)
      base.schoolId = String(authSchoolId)
      base.headOfficeId = school?.headOfficeId != null ? String(school.headOfficeId) : ''
    }
    setAddForm(base)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    const school = getById(allSchools, row?.schoolId)
    setEditForm({
      id: row?.id != null ? String(row.id) : '',
      headOfficeId: row?.headOfficeId != null ? String(row.headOfficeId) : school?.headOfficeId != null ? String(school.headOfficeId) : '',
      schoolId: row?.schoolId != null ? String(row.schoolId) : '',
      categoryId: row?.categoryId != null ? String(row.categoryId) : '',
      warehouseId: row?.warehouseId != null ? String(row.warehouseId) : '',
      productName: row?.productName || '',
      productCode: row?.productCode || '',
      note: row?.note || '',
    })
    setIsEditOpen(true)
  }

  const handleHeadOfficeChange = (setter, value) => {
    setter((prev) => ({
      ...prev,
      headOfficeId: value,
      schoolId: '',
      categoryId: '',
      warehouseId: '',
    }))
  }

  const handleSchoolChange = (setter, value) => {
    const selectedSchool = getById(allSchools, value)
    setter((prev) => ({
      ...prev,
      schoolId: value,
      headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
      categoryId: '',
      warehouseId: '',
    }))
  }

  const handleSaveAdd = async () => {
    const payload = buildPayload(addForm)
    if (!payload.productName || !payload.productCode || !payload.schoolId || !payload.categoryId || !payload.warehouseId) {
      setError('Product name, code, school, category, and warehouse are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createProduct(payload)
      setIsAddOpen(false)
      setAddForm(emptyForm)
      await loadProducts()
    } catch (err) {
      console.error('Failed to create product:', err)
      setError(err?.message || 'Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    const payload = buildPayload(editForm)
    if (!payload.productName || !payload.productCode || !payload.schoolId || !payload.categoryId || !payload.warehouseId) {
      setError('Product name, code, school, category, and warehouse are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateProduct(editForm.id, payload)
      setIsEditOpen(false)
      await loadProducts()
    } catch (err) {
      console.error('Failed to update product:', err)
      setError(err?.message || 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete product "${row?.productName || 'this product'}"?`)) return
    setSaving(true)
    setError('')
    try {
      await deleteProduct(row.id)
      await loadProducts()
    } catch (err) {
      console.error('Failed to delete product:', err)
      setError(err?.message || 'Failed to delete product')
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
      categoryId: '',
      warehouseId: '',
    }
    setPendingFilters(next)
    setFilters(next)
    setCurrentPage(1)
  }

  const exportRows = async () => {
    const size = Math.max(totalElements, rowsPerPage, 1)
    const data = await fetchProductsPage({
      page: 0,
      size,
      search: debouncedSearch,
      headOfficeId: filters.headOfficeId || undefined,
      schoolId: filters.schoolId || undefined,
      categoryId: filters.categoryId || undefined,
      warehouseId: filters.warehouseId || undefined,
    })
    return Array.isArray(data?.content) ? data.content : []
  }

  const mapExportRow = useCallback(
    (row) => ({
      ...row,
      schoolName: row.schoolName || resolveSchoolName(row.schoolId),
      categoryName: row.categoryName || resolveCategoryName(row.categoryId),
      warehouseName: row.warehouseName || resolveWarehouseName(row.warehouseId),
    }),
    [resolveCategoryName, resolveSchoolName, resolveWarehouseName],
  )

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Product</h1>
          <span className="text-secondary-light">Inventory / Product Management</span>
        </div>
        {canAdd(PAGE_SLUG) && (
          <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
            <i className="ri-add-large-line"></i> Add Product
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
                fileName="Product_List"
                sheetName="Products"
                pdfTitle="Product Report"
              />

              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="text-secondary-light text-sm">Find</span>
                <i className="ri-arrow-right-line"></i>
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown">
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
                placeholder="Search products..."
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
                      Loading products...
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
                          <label className="form-check-label">{currentStart + idx}</label>
                        </div>
                      </td>
                      {columnOptions.map(
                        (col) =>
                          visibleColumns[col.key] && (
                            <td key={col.key}>
                              {col.key === 'productName' ? (
                                <span className="fw-medium text-primary-light">{row.productName}</span>
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
        modalWidth="760px"
        open={isAddOpen}
        title="Add Product"
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

              <FormField label="School Name" required full>
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

          <FormField label="Category" required full>
            <select
              className="avm-select"
              value={addForm.categoryId}
              onChange={(e) => setAddForm((prev) => ({ ...prev, categoryId: e.target.value }))}
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

          <FormField label="Warehouse" required full>
            <select
              className="avm-select"
              value={addForm.warehouseId}
              onChange={(e) => setAddForm((prev) => ({ ...prev, warehouseId: e.target.value }))}
              disabled={!addForm.schoolId}
            >
              <option value="">{addForm.schoolId ? '--Select Warehouse--' : 'Select School First'}</option>
              {addWarehouseOptions.map((warehouse) => (
                <option key={String(warehouse.id)} value={String(warehouse.id)}>
                  {warehouse.warehouseName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Name" required full>
            <input
              type="text"
              className="avm-input"
              placeholder="Name"
              value={addForm.productName}
              onChange={(e) => setAddForm((prev) => ({ ...prev, productName: e.target.value }))}
            />
          </FormField>

          <FormField label="Product Code" required full>
            <input
              type="text"
              className="avm-input"
              placeholder="Product Code"
              value={addForm.productCode}
              onChange={(e) => setAddForm((prev) => ({ ...prev, productCode: e.target.value }))}
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
        modalWidth="760px"
        open={isEditOpen}
        title="Edit Product"
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

          <FormField label="Category" required full>
            <select
              className="avm-select"
              value={editForm.categoryId}
              onChange={(e) => setEditForm((prev) => ({ ...prev, categoryId: e.target.value }))}
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

          <FormField label="Warehouse" required full>
            <select
              className="avm-select"
              value={editForm.warehouseId}
              onChange={(e) => setEditForm((prev) => ({ ...prev, warehouseId: e.target.value }))}
              disabled={!editForm.schoolId}
            >
              <option value="">{editForm.schoolId ? '--Select Warehouse--' : 'Select School First'}</option>
              {editWarehouseOptions.map((warehouse) => (
                <option key={String(warehouse.id)} value={String(warehouse.id)}>
                  {warehouse.warehouseName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Name" required full>
            <input
              type="text"
              className="avm-input"
              placeholder="Name"
              value={editForm.productName}
              onChange={(e) => setEditForm((prev) => ({ ...prev, productName: e.target.value }))}
            />
          </FormField>

          <FormField label="Product Code" required full>
            <input
              type="text"
              className="avm-input"
              placeholder="Product Code"
              value={editForm.productCode}
              onChange={(e) => setEditForm((prev) => ({ ...prev, productCode: e.target.value }))}
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

      <SlideSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} title="Find Product">
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
                  categoryId: '',
                  warehouseId: '',
                }))
              }
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={(value) => {
                const selectedSchool = getById(allSchools, value)
                setPendingFilters((prev) => ({
                  ...prev,
                  schoolId: value,
                  headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
                  categoryId: '',
                  warehouseId: '',
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
                      categoryId: '',
                      warehouseId: '',
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

          <FormField label="Category" full>
            <select
              className="avm-select"
              value={pendingFilters.categoryId}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, categoryId: e.target.value }))}
            >
              <option value="">All Categories</option>
              {filterCategoryOptions.map((category) => (
                <option key={String(category.id)} value={String(category.id)}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Warehouse" full>
            <select
              className="avm-select"
              value={pendingFilters.warehouseId}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, warehouseId: e.target.value }))}
            >
              <option value="">All Warehouses</option>
              {filterWarehouseOptions.map((warehouse) => (
                <option key={String(warehouse.id)} value={String(warehouse.id)}>
                  {warehouse.warehouseName}
                </option>
              ))}
            </select>
          </FormField>

          <div className="d-flex gap-8 mt-12">
            <button type="button" className="btn btn-danger-200 text-danger-600 w-100" onClick={handleResetFilters}>
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

export default Product
