import { useCallback, useEffect, useMemo, useState } from 'react'
import '../assets/css/addModalShared.css'
import WizardPopup from '../components/WizardPopup'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchIncomeHeadsPage } from '../apis/incomeHeadsApi'
import { fetchCategoriesPage } from '../apis/categoriesApi'
import { fetchProductsPage } from '../apis/productsApi'
import { createSale, fetchSaleById, fetchSaleRecipients, fetchSaleRoles, updateSale } from '../apis/salesApi'

const EDIT_STORAGE_KEY = 'sale-edit-row'

const emptySaleInfo = {
  headOfficeId: '',
  schoolId: '',
  userType: '',
  saleToId: '',
  incomeHeadId: '',
  invoiceNumber: '',
  saleDate: new Date().toISOString().split('T')[0],
  status: 'PAID',
  discountAmount: '',
  note: '',
}

const emptyItem = {
  categoryId: '',
  productId: '',
  quantity: '',
  unitPrice: '',
}

const STEPS = ['Sale Details']

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  'User Type': 'ri-user-settings-line',
  'Sale To': 'ri-user-3-line',
  'Income Head': 'ri-wallet-3-line',
  'Sale Date': 'ri-calendar-line',
  'Invoice Number': 'ri-bill-line',
  'Discount': 'ri-discount-line',
  'Status': 'ri-checkbox-circle-line',
  'Category': 'ri-list-settings-line',
  'Product': 'ri-shopping-bag-line',
  'Quantity': 'ri-equalizer-line',
  'Unit Price': 'ri-money-dollar-circle-line',
  'Note': 'ri-sticky-note-line',
}

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

const SaleCreate = ({ onNavigate }) => {
  const { role: authRole, user, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'

  const [initialEditRow] = useState(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch (error) {
      console.error('Failed to parse sale edit row:', error)
      return null
    }
  })
  const [editingId] = useState(() => (initialEditRow?.id ?? null))
  const [saleInfo, setSaleInfo] = useState(emptySaleInfo)
  const [items, setItems] = useState([{ ...emptyItem, id: Date.now() }])
  const [headOffices, setHeadOffices] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [incomeHeads, setIncomeHeads] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [roleOptions, setRoleOptions] = useState([])
  const [recipientOptions, setRecipientOptions] = useState([])
  const [busy, setBusy] = useState(false)
  const [lookupBusy, setLookupBusy] = useState(false)
  const [initializingEdit, setInitializingEdit] = useState(false)
  const [error, setError] = useState('')

  const totalGross = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0)
  }, [items])

  const totalDiscount = Number(saleInfo.discountAmount) || 0
  const totalNet = totalGross - totalDiscount

  const loadLookups = useCallback(async () => {
    setLookupBusy(true)
    try {
      const [headOfficePage, schools, categoriesRows, productsRows] = await Promise.all([
        fetchHeadOfficesPage(0, 500),
        fetchSchoolsLookup(),
        fetchAllPages((page, size) => fetchCategoriesPage({ page, size })),
        fetchAllPages((page, size) => fetchProductsPage({ page, size })),
      ])
      setHeadOffices(Array.isArray(headOfficePage?.content) ? headOfficePage.content : [])
      setAllSchools(Array.isArray(schools) ? schools : [])
      setCategories(Array.isArray(categoriesRows) ? categoriesRows : [])
      setProducts(Array.isArray(productsRows) ? productsRows : [])
    } catch (err) {
      console.error('Failed to load sale lookups:', err)
      setHeadOffices([])
      setAllSchools([])
      setCategories([])
      setProducts([])
    } finally {
      setLookupBusy(false)
    }
  }, [])

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

  const categoryOptionsFor = useCallback(
    (schoolId) => {
      const list = Array.isArray(categories) ? categories : []
      if (!schoolId) return []
      return list.filter((row) => String(row?.schoolId ?? '') === String(schoolId))
    },
    [categories],
  )

  const productOptionsFor = useCallback(
    (schoolId, categoryId) => {
      const list = Array.isArray(products) ? products : []
      if (!schoolId) return []
      return list.filter((row) => String(row?.schoolId ?? '') === String(schoolId) && (!categoryId || String(row?.categoryId ?? '') === String(categoryId)))
    },
    [products],
  )

  const schoolOptions = useMemo(() => schoolOptionsFor(saleInfo.headOfficeId), [saleInfo.headOfficeId, schoolOptionsFor])
  const categoryOptions = useMemo(() => categoryOptionsFor(saleInfo.schoolId), [saleInfo.schoolId, categoryOptionsFor])
  const productOptionsByRow = useCallback((item) => productOptionsFor(saleInfo.schoolId, item.categoryId), [productOptionsFor, saleInfo.schoolId])

  const loadIncomeHeads = useCallback(async (schoolId) => {
    if (!schoolId) {
      setIncomeHeads([])
      return
    }
    try {
      const page = await fetchIncomeHeadsPage({ schoolId: Number(schoolId), page: 0, size: 500 })
      setIncomeHeads(Array.isArray(page?.content) ? page.content : [])
    } catch (err) {
      console.error('Failed to load income heads:', err)
      setIncomeHeads([])
    }
  }, [])

  const loadRoles = useCallback(async (schoolId) => {
    if (!schoolId) {
      setRoleOptions([])
      setRecipientOptions([])
      return
    }
    try {
      const roles = await fetchSaleRoles({ schoolId: Number(schoolId) })
      setRoleOptions(Array.isArray(roles) ? roles : [])
    } catch (err) {
      console.error('Failed to load sale roles:', err)
      setRoleOptions([])
    }
    setRecipientOptions([])
  }, [])

  const loadRecipients = useCallback(async (schoolId, roleValue) => {
    if (!schoolId || !roleValue) {
      setRecipientOptions([])
      return
    }
    try {
      const rows = await fetchSaleRecipients({ schoolId: Number(schoolId), role: roleValue })
      setRecipientOptions(Array.isArray(rows) ? rows : [])
    } catch (err) {
      console.error('Failed to load sale recipients:', err)
      setRecipientOptions([])
    }
  }, [])

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), [])

  useEffect(() => {
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      setSaleInfo((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
    }
  }, [authHeadOfficeId, isHeadOfficeAdmin])

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return
    const school = getById(allSchools, authSchoolId)
    setSaleInfo((prev) => ({
      ...prev,
      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
      schoolId: String(authSchoolId),
    }))
  }, [allSchools, authSchoolId, isSchoolAdmin])

  useEffect(() => {
    if (!editingId) return
    let active = true

    const loadSale = async () => {
      setInitializingEdit(true)
      setError('')
      try {
        const sale = await fetchSaleById(editingId)
        if (!active || !sale) return
        setSaleInfo({
          headOfficeId: sale.headOfficeId != null ? String(sale.headOfficeId) : '',
          schoolId: sale.schoolId != null ? String(sale.schoolId) : '',
          userType: sale.userType || '',
          saleToId: sale.saleToId != null ? String(sale.saleToId) : '',
          incomeHeadId: sale.incomeHeadId != null ? String(sale.incomeHeadId) : '',
          invoiceNumber: sale.invoiceNumber || '',
          saleDate: sale.saleDate ? String(sale.saleDate).slice(0, 10) : emptySaleInfo.saleDate,
          status: sale.status || 'PAID',
          discountAmount: sale.discountAmount != null ? String(sale.discountAmount) : '',
          note: sale.note || '',
        })
        setItems(
          Array.isArray(sale.items) && sale.items.length > 0
            ? sale.items.map((item) => ({
                id: item.id ?? `${item.productId ?? 'sale-item'}-${Math.random()}`,
                categoryId: item.categoryId != null ? String(item.categoryId) : '',
                productId: item.productId != null ? String(item.productId) : '',
                quantity: item.quantity != null ? String(item.quantity) : '',
                unitPrice: item.unitPrice != null ? String(item.unitPrice) : '',
              }))
            : [{ ...emptyItem, id: Date.now() }],
        )
      } catch (err) {
        console.error('Failed to load sale for edit:', err)
        if (active) setError(err?.message || 'Failed to load sale for edit')
      } finally {
        if (active) setInitializingEdit(false)
      }
    }

    void loadSale()
    return () => {
      active = false
    }
  }, [editingId])

  useEffect(() => {
    if (saleInfo.schoolId) {
      void loadIncomeHeads(saleInfo.schoolId)
      void loadRoles(saleInfo.schoolId)
    } else {
      setIncomeHeads([])
      setRoleOptions([])
      setRecipientOptions([])
    }
  }, [loadIncomeHeads, loadRoles, saleInfo.schoolId])

  useEffect(() => {
    if (saleInfo.schoolId && saleInfo.userType) {
      void loadRecipients(saleInfo.schoolId, saleInfo.userType)
    }
  }, [loadRecipients, saleInfo.schoolId, saleInfo.userType])

  const addItem = () => {
    setItems((prev) => [...prev, { ...emptyItem, id: Date.now() + Math.random() }])
  }

  const removeItem = (id) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev))
  }

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const next = { ...item, [field]: value }
        if (field === 'categoryId') next.productId = ''
        return next
      }),
    )
  }

  const handleHeadOfficeChange = (value) => {
    setSaleInfo((prev) => ({
      ...prev,
      headOfficeId: value,
      schoolId: '',
      userType: '',
      saleToId: '',
      incomeHeadId: '',
    }))
    setItems([{ ...emptyItem, id: Date.now() }])
    setIncomeHeads([])
    setRoleOptions([])
    setRecipientOptions([])
  }

  const handleSchoolChange = (value) => {
    const selectedSchool = getById(allSchools, value)
    setSaleInfo((prev) => ({
      ...prev,
      schoolId: value,
      headOfficeId: selectedSchool?.headOfficeId != null ? String(selectedSchool.headOfficeId) : prev.headOfficeId,
      userType: '',
      saleToId: '',
      incomeHeadId: '',
    }))
    setItems([{ ...emptyItem, id: Date.now() }])
    setIncomeHeads([])
    setRoleOptions([])
    setRecipientOptions([])
  }

  const validate = () => {
    if (!saleInfo.schoolId) return 'School is required.'
    if (!saleInfo.userType) return 'User type is required.'
    if (!saleInfo.saleToId) return 'Sale to is required.'
    if (!saleInfo.incomeHeadId) return 'Income head is required.'
    if (!items.length) return 'At least one item is required.'
    for (const item of items) {
      if (!item.categoryId || !item.productId) return 'Category and product are required for each item.'
      if (item.quantity === '' || Number.isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) return 'Quantity must be greater than 0.'
      if (item.unitPrice === '' || Number.isNaN(Number(item.unitPrice)) || Number(item.unitPrice) < 0) return 'Unit price is required for each item.'
    }
    return ''
  }

  const handleSave = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setBusy(true)
    setError('')
    try {
      const payload = {
        headOfficeId: saleInfo.headOfficeId ? Number(saleInfo.headOfficeId) : null,
        schoolId: saleInfo.schoolId ? Number(saleInfo.schoolId) : null,
        invoiceNumber: String(saleInfo.invoiceNumber || '').trim(),
        userType: String(saleInfo.userType || '').trim(),
        saleToId: Number(saleInfo.saleToId),
        incomeHeadId: Number(saleInfo.incomeHeadId),
        saleDate: saleInfo.saleDate,
        discountAmount: saleInfo.discountAmount === '' ? 0 : Number(saleInfo.discountAmount),
        status: saleInfo.status,
        note: String(saleInfo.note || '').trim(),
        items: items.map((item) => ({
          categoryId: Number(item.categoryId),
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      }
      if (editingId) {
        await updateSale(editingId, payload)
      } else {
        await createSale(payload)
      }
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
      if (onNavigate) onNavigate('sale')
      else window.history.back()
    } catch (err) {
      console.error(`Failed to ${editingId ? 'update' : 'create'} sale:`, err)
      setError(err?.message || `Failed to ${editingId ? 'update' : 'create'} sale`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
          <h1 className="fw-semibold mb-0 h6 text-primary-light">{editingId ? 'Edit Sale' : 'Add New Sale'}</h1>
        <button
          type="button"
          className="btn btn-outline-neutral border border-neutral-300 radius-8 text-sm"
          onClick={() => (onNavigate ? onNavigate('sale') : window.history.back())}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error ? <div className="mb-16 text-danger">{error}</div> : null}
      {lookupBusy ? <div className="mb-16 text-secondary-light">Loading lookups...</div> : null}
      {initializingEdit ? <div className="mb-16 text-secondary-light">Loading sale data...</div> : null}

      <div className="card mb-24">
        <div className="card-header border-bottom border-neutral-200">
          <h6 className="text-md fw-semibold mb-0">Sale Information</h6>
        </div>
        <div className="card-body">
          <div className="avm-grid">
            {isSuperAdmin ? (
              <ManualScopeSelectors
                enabled
                headOffices={headOffices.map((row) => ({ id: row.id, name: row.name || row.headOfficeName || '' }))}
                schoolOptions={schoolOptions}
                selectedHeadOfficeId={saleInfo.headOfficeId}
                onHeadOfficeChange={(value) => handleHeadOfficeChange(value)}
                selectedSchoolId={saleInfo.schoolId}
                onSchoolChange={(value) => handleSchoolChange(value)}
                schoolLabel="School"
              />
            ) : (
              <>
                {isHeadOfficeAdmin ? (
                  <FormField label="Head Office" >
                    <input className="avm-input" value={authHeadOfficeName || String(authHeadOfficeId || '')} disabled />
                  </FormField>
                ) : null}
                <FormField label="School Name" required full>
                  <select className="avm-select" value={saleInfo.schoolId} onChange={(e) => handleSchoolChange(e.target.value)} disabled={isSchoolAdmin}>
                    <option value="">--Select School--</option>
                    {schoolOptions.map((school) => (
                      <option key={String(school.id)} value={String(school.id)}>
                        {school.schoolName}
                      </option>
                    ))}
                  </select>
                </FormField>
              </>
            )}

            <FormField label="User Type" required >
              <select
                className="avm-select"
                value={saleInfo.userType}
                onChange={(e) => setSaleInfo((prev) => ({ ...prev, userType: e.target.value, saleToId: '' }))}
                disabled={!saleInfo.schoolId}
              >
                <option value="">{saleInfo.schoolId ? '--Select Role--' : 'Select School First'}</option>
                {roleOptions.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {roleOption}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Sale To" required >
              <select
                className="avm-select"
                value={saleInfo.saleToId}
                onChange={(e) => setSaleInfo((prev) => ({ ...prev, saleToId: e.target.value }))}
                disabled={!saleInfo.userType}
              >
                <option value="">{saleInfo.userType ? '--Select--' : 'Select Role First'}</option>
                {recipientOptions.map((recipient) => (
                  <option key={`${recipient.source}-${recipient.id}`} value={String(recipient.id)}>
                    {recipient.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Income Head" required >
              <select
                className="avm-select"
                value={saleInfo.incomeHeadId}
                onChange={(e) => setSaleInfo((prev) => ({ ...prev, incomeHeadId: e.target.value }))}
                disabled={!saleInfo.schoolId}
              >
                <option value="">{saleInfo.schoolId ? '--Select Income Head--' : 'Select School First'}</option>
                {incomeHeads.map((head) => (
                  <option key={String(head.id)} value={String(head.id)}>
                    {head.incomeHead}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Invoice Number" >
              <input
                type="text"
                className="avm-input"
                placeholder="Optional"
                value={saleInfo.invoiceNumber}
                onChange={(e) => setSaleInfo((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
              />
            </FormField>

            <FormField label="Sale Date" required>
              <input
                type="date"
                className="avm-input"
                value={saleInfo.saleDate}
                onChange={(e) => setSaleInfo((prev) => ({ ...prev, saleDate: e.target.value }))}
              />
            </FormField>

            <FormField label="Discount" >
              <input
                type="number"
                min="0"
                step="any"
                className="avm-input"
                value={saleInfo.discountAmount}
                onChange={(e) => setSaleInfo((prev) => ({ ...prev, discountAmount: e.target.value }))}
              />
            </FormField>

            <FormField label="Status" required>
              <select
                className="avm-select"
                value={saleInfo.status}
                onChange={(e) => setSaleInfo((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="PAID">PAID</option>
                <option value="UNPAID">UNPAID</option>
                <option value="PARTIAL">PARTIAL</option>
              </select>
            </FormField>

            <FormField label="Note" full>
              <textarea
                className="avm-input avm-textarea"
                rows="3"
                placeholder="Note"
                value={saleInfo.note}
                onChange={(e) => setSaleInfo((prev) => ({ ...prev, note: e.target.value }))}
              ></textarea>
            </FormField>
          </div>
        </div>
      </div>

      <div className="card mb-24">
        <div className="card-header border-bottom border-neutral-200 d-flex justify-content-between align-items-center">
          <h6 className="text-md fw-semibold mb-0">Item Information</h6>
          <button type="button" className="btn btn-sm btn-primary-600 radius-8" onClick={addItem}>
            <i className="ri-add-line"></i> Add Row
          </button>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-bordered mb-0">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="text-center" style={{ width: '60px' }}>S.L</th>
                  <th>Category</th>
                  <th>Product</th>
                  <th style={{ width: '120px' }}>Quantity</th>
                  <th style={{ width: '150px' }}>Unit Price</th>
                  <th style={{ width: '150px' }}>Subtotal</th>
                  <th className="text-center" style={{ width: '80px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const subtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
                  const productOptions = productOptionsByRow(item)
                  return (
                    <tr key={item.id}>
                      <td className="text-center align-middle">{index + 1}</td>
                      <td>
                        <select className="form-select border-0 bg-transparent" value={item.categoryId} onChange={(e) => updateItem(item.id, 'categoryId', e.target.value)}>
                          <option value="">--Select--</option>
                          {categoryOptions.map((category) => (
                            <option key={String(category.id)} value={String(category.id)}>
                              {category.categoryName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select className="form-select border-0 bg-transparent" value={item.productId} onChange={(e) => updateItem(item.id, 'productId', e.target.value)} disabled={!item.categoryId}>
                          <option value="">{item.categoryId ? '--Select--' : 'Select Category First'}</option>
                          {productOptions.map((product) => (
                            <option key={String(product.id)} value={String(product.id)}>
                              {product.productName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input type="number" min="0" step="any" className="form-control border-0 bg-transparent" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} />
                      </td>
                      <td>
                        <input type="number" min="0" step="any" className="form-control border-0 bg-transparent" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)} />
                      </td>
                      <td className="align-middle fw-medium text-primary-light">{subtotal.toFixed(2)}</td>
                      <td className="text-center align-middle">
                        <button type="button" className="text-danger-600 bg-danger-focus rounded-circle w-32-px h-32-px border-0" onClick={() => removeItem(item.id)}>
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-6 offset-xl-6">
          <div className="card">
            <div className="card-body">
              <div className="d-grid gap-16">
                <div className="d-flex align-items-center justify-content-between">
                  <span className="text-secondary-light">Gross Total</span>
                  <span className="fw-semibold text-primary-light">{totalGross.toFixed(2)}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between gap-24">
                  <span className="text-secondary-light">Discount</span>
                  <input
                    type="number"
                    className="form-control text-end w-150-px"
                    min="0"
                    step="any"
                    value={saleInfo.discountAmount}
                    onChange={(e) => setSaleInfo((prev) => ({ ...prev, discountAmount: e.target.value }))}
                  />
                </div>
                <hr className="border-neutral-200" />
                <div className="d-flex align-items-center justify-content-between">
                  <span className="text-lg fw-bold text-primary-light">Grand Total</span>
                  <span className="text-lg fw-bold text-primary-600">{totalNet.toFixed(2)}</span>
                </div>
                <button type="button" className="btn btn-primary-600 w-100 py-12 mt-16 radius-8" onClick={handleSave} disabled={busy}>
                  {busy ? 'Saving...' : editingId ? 'Update Sale' : 'Complete Sale'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SaleCreate
