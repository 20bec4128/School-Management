import { useCallback, useEffect, useMemo, useState } from 'react'
import '../assets/css/addModalShared.css'

import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchSuppliersPage } from '../apis/suppliersApi'
import { fetchCategoriesPage } from '../apis/categoriesApi'
import { fetchProductsPage } from '../apis/productsApi'
import { fetchEmployees } from '../apis/employeesApi'
import { createPurchase, updatePurchase } from '../apis/purchasesApi'
import { normalizeRole } from '../utils/roles'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import SingleStepFormShell from '../components/SingleStepFormShell'

const EDIT_STORAGE_KEY = 'edit-purchase-row'
const STEPS = ['Purchase Details']

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

const getById = (rows, id) =>
  (Array.isArray(rows) ? rows : []).find((row) => String(row?.id ?? '') === String(id ?? '')) || null

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
  return restPages.reduce((acc, item) => acc.concat(Array.isArray(item?.content) ? item.content : []), firstContent)
}

const buildUnitLabel = (unitType, customUnitType) =>
  unitType === 'OTHER' ? String(customUnitType || '').trim() || 'Other' : String(unitType || '').trim()

const AddPurchase = ({ onNavigate } = {}) => {
  const {
    status,
    token,
    user,
    role: authRole,
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
  } = useAuth()

  const role = useMemo(
    () => normalizeRole(authRole || user?.role || user?.userRole || user?.authority),
    [authRole, user],
  )
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)
  const navigateTo = typeof onNavigate === 'function' ? onNavigate : null

  const [initialEditRow] = useState(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const isEditMode = Boolean(initialEditRow?.id)

  const [headOffices, setHeadOffices] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [allSuppliers, setAllSuppliers] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState(() => {
    if (initialEditRow) {
      return {
        ...emptyForm,
        id: initialEditRow?.id != null ? String(initialEditRow.id) : '',
        headOfficeId: initialEditRow?.headOfficeId != null ? String(initialEditRow.headOfficeId) : '',
        schoolId: initialEditRow?.schoolId != null ? String(initialEditRow.schoolId) : '',
        supplierId: initialEditRow?.supplierId != null ? String(initialEditRow.supplierId) : '',
        categoryId: initialEditRow?.categoryId != null ? String(initialEditRow.categoryId) : '',
        productId: initialEditRow?.productId != null ? String(initialEditRow.productId) : '',
        purchaseById: initialEditRow?.purchaseById != null ? String(initialEditRow.purchaseById) : '',
        quantity: initialEditRow?.quantity != null ? String(initialEditRow.quantity) : '',
        unitType: initialEditRow?.unitType || '',
        customUnitType: initialEditRow?.customUnitType || '',
        unitPrice: initialEditRow?.unitPrice != null ? String(initialEditRow.unitPrice) : '',
        purchaseDate: initialEditRow?.purchaseDate || '',
        expireDate: initialEditRow?.expireDate || '',
        note: initialEditRow?.note || '',
      }
    }

    const base = { ...emptyForm }
    if (isSchoolAdmin) {
      base.headOfficeId = authHeadOfficeId != null ? String(authHeadOfficeId) : ''
      base.schoolId = authSchoolId != null ? String(authSchoolId) : ''
    } else if (isHeadOfficeAdmin) {
      base.headOfficeId = authHeadOfficeId != null ? String(authHeadOfficeId) : ''
    }
    return base
  })

  const schoolsById = useMemo(() => {
    const map = new Map()
    for (const school of Array.isArray(allSchools) ? allSchools : []) {
      if (school?.id == null) continue
      map.set(String(school.id), school)
    }
    return map
  }, [allSchools])

  const currentSchoolId = isSchoolAdmin ? authSchoolId : form.schoolId

  const schoolOptions = useMemo(() => {
    const rows = Array.isArray(allSchools) ? allSchools : []

    if (isSuperAdmin) {
      if (!manualScope.selectedHeadOfficeId) return []
      return rows.filter((school) => String(school.headOfficeId ?? '') === String(manualScope.selectedHeadOfficeId))
    }

    if (isHeadOfficeAdmin) {
      return rows.filter((school) => String(school.headOfficeId ?? '') === String(authHeadOfficeId))
    }

    if (isSchoolAdmin) {
      return rows.filter((school) => String(school.id ?? '') === String(authSchoolId))
    }

    return rows
  }, [allSchools, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.selectedHeadOfficeId])

  const supplierOptions = useMemo(() => {
    const rows = Array.isArray(allSuppliers) ? allSuppliers : []
    if (!currentSchoolId) return []
    return rows.filter((row) => String(row?.schoolId ?? '') === String(currentSchoolId))
  }, [allSuppliers, currentSchoolId])

  const categoryOptions = useMemo(() => {
    const rows = Array.isArray(allCategories) ? allCategories : []
    if (!currentSchoolId) return []
    return rows.filter((row) => String(row?.schoolId ?? '') === String(currentSchoolId))
  }, [allCategories, currentSchoolId])

  const productOptions = useMemo(() => {
    const rows = Array.isArray(allProducts) ? allProducts : []
    if (!currentSchoolId) return []
    return rows.filter(
      (row) =>
        String(row?.schoolId ?? '') === String(currentSchoolId) &&
        (!form.categoryId || String(row?.categoryId ?? '') === String(form.categoryId)),
    )
  }, [allProducts, currentSchoolId, form.categoryId])

  const employeeOptions = useMemo(() => (Array.isArray(employees) ? employees : []), [employees])

  const validate = () => {
    if (isSuperAdmin && !String(form.headOfficeId || '').trim()) return 'Head office is required.'
    if (!String(currentSchoolId || '').trim()) return 'School is required.'
    if (!String(form.supplierId || '').trim()) return 'Supplier is required.'
    if (!String(form.categoryId || '').trim()) return 'Category is required.'
    if (!String(form.productId || '').trim()) return 'Product is required.'
    if (!String(form.purchaseById || '').trim()) return 'Purchase by is required.'
    if (!String(form.quantity || '').trim()) return 'Quantity is required.'
    if (!String(form.unitType || '').trim()) return 'Unit type is required.'
    if (String(form.unitType || '').trim().toUpperCase() === 'OTHER' && !String(form.customUnitType || '').trim()) {
      return 'Custom unit type is required.'
    }
    if (!String(form.unitPrice || '').trim() && Number(form.unitPrice) !== 0) return 'Unit price is required.'
    if (!String(form.purchaseDate || '').trim()) return 'Purchase date is required.'
    return ''
  }

  const loadLookups = useCallback(async () => {
    setLoading(true)
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
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    void loadLookups()
  }, [loadLookups, status, token])

  useEffect(() => () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    } catch {}
  }, [])

  useEffect(() => {
    if (!isSuperAdmin) return
    if (manualScope.selectedHeadOfficeId && manualScope.selectedSchoolId) return
    if (!form.schoolId) return

    const school = schoolsById.get(String(form.schoolId))
    if (school?.headOfficeId == null) return

    setForm((prev) => ({
      ...prev,
      headOfficeId: String(school.headOfficeId),
    }))
  }, [form.schoolId, isSuperAdmin, manualScope.selectedHeadOfficeId, manualScope.selectedSchoolId, schoolsById])

  useEffect(() => {
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      setForm((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
    }
  }, [authHeadOfficeId, isHeadOfficeAdmin])

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return
    const school = schoolsById.get(String(authSchoolId))
    setForm((prev) => ({
      ...prev,
      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
      schoolId: String(authSchoolId),
    }))
  }, [authSchoolId, isSchoolAdmin, schoolsById])

  useEffect(() => {
    if (!currentSchoolId) {
      setEmployees([])
      return
    }

    let active = true
    void (async () => {
      try {
        const list = await fetchEmployees({ schoolId: Number(currentSchoolId) })
        if (!active) return
        setEmployees(Array.isArray(list) ? list : [])
      } catch (err) {
        console.error('Failed to load purchase employees:', err)
        if (active) setEmployees([])
      }
    })()

    return () => {
      active = false
    }
  }, [currentSchoolId])

  useEffect(() => {
    if (!initialEditRow || !schoolsById.size) return
    const school = form.schoolId ? schoolsById.get(String(form.schoolId)) : null
    if (!school?.headOfficeId && initialEditRow?.schoolId != null) {
      const selected = schoolsById.get(String(initialEditRow.schoolId))
      if (selected?.headOfficeId != null) {
        setForm((prev) => ({ ...prev, headOfficeId: String(selected.headOfficeId) }))
      }
    }
  }, [form.schoolId, initialEditRow, schoolsById])

  const handleChange = (id, value) => {
    setForm((prev) => ({
      ...prev,
      [id]: value,
      ...(id === 'headOfficeId' ? { schoolId: '', supplierId: '', categoryId: '', productId: '', purchaseById: '' } : {}),
      ...(id === 'schoolId' ? { supplierId: '', categoryId: '', productId: '', purchaseById: '' } : {}),
      ...(id === 'categoryId' ? { productId: '' } : {}),
    }))

    if (id === 'headOfficeId' && isSuperAdmin) {
      manualScope.setSelectedScope(value, '')
    }

    if (id === 'schoolId' && isSuperAdmin) {
      manualScope.setSelectedScope(form.headOfficeId, value)
    }
  }

  const buildPayload = () => ({
    headOfficeId: form.headOfficeId ? Number(form.headOfficeId) : null,
    schoolId: Number(currentSchoolId),
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

  const save = async () => {
    const message = validate()
    if (message) {
      setError(message)
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = buildPayload()
      if (isEditMode) {
        await updatePurchase(form.id, payload)
      } else {
        await createPurchase(payload)
      }
      setSuccess(true)
      setTimeout(() => {
        navigateTo?.('purchase')
      }, 900)
    } catch (err) {
      setError(err?.message || (isEditMode ? 'Failed to update purchase' : 'Failed to create purchase'))
    } finally {
      setSaving(false)
    }
  }

  const footer = (
    <>
      <button type="button" className="btn btn-light border px-24" onClick={() => navigateTo?.('purchase')}>
        Cancel
      </button>
      <button type="button" className="btn btn-primary-600 px-24 d-flex align-items-center gap-8" onClick={save} disabled={saving || loading}>
        {saving ? (
          <>
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            Processing...
          </>
        ) : (
          <>
            <i className="ri-save-line" />
            {isEditMode ? 'Update Purchase' : 'Save Purchase'}
          </>
        )}
      </button>
    </>
  )

  return (
    <SingleStepFormShell
      title={`${isEditMode ? 'Edit' : 'Add'} Purchase`}
      breadcrumbTrail={` / Inventory / Purchase / ${isEditMode ? 'Edit' : 'Add'}`}
      onDashboard={() => navigateTo?.('dashboard')}
      onBack={() => navigateTo?.('purchase')}
      footer={footer}
      error={error}
      success={success}
      successMessage={`Purchase ${isEditMode ? 'updated' : 'created'} successfully! Redirecting...`}
    >
      <div className="avm-grid">
        {isSuperAdmin ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <ManualScopeSelectors
              enabled
              compact
              headOffices={headOffices.map((row) => ({ id: row.id, name: row.name || row.headOfficeName || '' }))}
              schoolOptions={schoolOptions}
              selectedHeadOfficeId={form.headOfficeId}
              onHeadOfficeChange={(value) => handleChange('headOfficeId', value)}
              selectedSchoolId={form.schoolId}
              onSchoolChange={(value) => handleChange('schoolId', value)}
              schoolLabel="School"
            />
          </div>
        ) : isHeadOfficeAdmin ? (
          <>
            <FormField label="Head Office" full>
              <input className="avm-input" value={authHeadOfficeName || String(authHeadOfficeId || '')} disabled />
            </FormField>

            <FormField label="School Name" required>
              <select
                className="avm-select"
                value={form.schoolId}
                onChange={(e) => handleChange('schoolId', e.target.value)}
                disabled={isSchoolAdmin}
              >
                <option value="">--Select School--</option>
                {schoolOptions.map((school) => (
                  <option key={String(school.id)} value={String(school.id)}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </FormField>
          </>
        ) : (
          <>
            <FormField label="Head Office" full>
              <input className="avm-input" value={authHeadOfficeName || ''} readOnly />
            </FormField>

            <FormField label="School Name" required full>
              <input className="avm-input" value={authSchoolName || ''} readOnly />
            </FormField>
          </>
        )}

        <FormField label="Supplier" required>
          <select className="avm-select" value={form.supplierId} onChange={(e) => handleChange('supplierId', e.target.value)} disabled={!currentSchoolId}>
            <option value="">{currentSchoolId ? '--Select Supplier--' : 'Select School First'}</option>
            {supplierOptions.map((supplier) => (
              <option key={String(supplier.id)} value={String(supplier.id)}>
                {supplier.supplierName}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Category" required>
          <select className="avm-select" value={form.categoryId} onChange={(e) => handleChange('categoryId', e.target.value)} disabled={!currentSchoolId}>
            <option value="">{currentSchoolId ? '--Select Category--' : 'Select School First'}</option>
            {categoryOptions.map((category) => (
              <option key={String(category.id)} value={String(category.id)}>
                {category.categoryName}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Product" required>
          <select className="avm-select" value={form.productId} onChange={(e) => handleChange('productId', e.target.value)} disabled={!currentSchoolId || !form.categoryId}>
            <option value="">{form.categoryId ? '--Select Product--' : 'Select Category First'}</option>
            {productOptions.map((product) => (
              <option key={String(product.id)} value={String(product.id)}>
                {product.productName}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Purchase By" required>
          <select className="avm-select" value={form.purchaseById} onChange={(e) => handleChange('purchaseById', e.target.value)} disabled={!currentSchoolId}>
            <option value="">{currentSchoolId ? '--Select Employee--' : 'Select School First'}</option>
            {employeeOptions.map((employee) => (
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
            value={form.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
          />
        </FormField>

        <FormField label="Unit Type" required>
          <select className="avm-select" value={form.unitType} onChange={(e) => handleChange('unitType', e.target.value)}>
            <option value="">--Select--</option>
            {UNIT_TYPES.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </FormField>

        {form.unitType === 'OTHER' ? (
          <FormField label="Custom Unit Type" required full>
            <input
              type="text"
              className="avm-input"
              placeholder="Enter custom unit type"
              value={form.customUnitType}
              onChange={(e) => handleChange('customUnitType', e.target.value)}
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
            value={form.unitPrice}
            onChange={(e) => handleChange('unitPrice', e.target.value)}
          />
        </FormField>

        <FormField label="Purchase Date" required>
          <input
            type="date"
            className="avm-input"
            value={form.purchaseDate}
            onChange={(e) => handleChange('purchaseDate', e.target.value)}
          />
        </FormField>

        <FormField label="Expire Date">
          <input
            type="date"
            className="avm-input"
            value={form.expireDate}
            onChange={(e) => handleChange('expireDate', e.target.value)}
          />
        </FormField>

        <FormField label="Note" full noIcon>
          <textarea
            className="avm-input avm-textarea"
            rows="3"
            placeholder="Note"
            value={form.note}
            onChange={(e) => handleChange('note', e.target.value)}
          />
        </FormField>
      </div>
    </SingleStepFormShell>
  )
}

export default AddPurchase
