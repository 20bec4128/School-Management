import { useCallback, useEffect, useMemo, useState } from 'react'
import '../assets/css/addModalShared.css'

import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchCategoriesPage } from '../apis/categoriesApi'
import { fetchProductsPage } from '../apis/productsApi'
import { createIssue, fetchIssueRecipients, fetchIssueRoles, updateIssue } from '../apis/issuesApi'
import { normalizeRole } from '../utils/roles'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import SingleStepFormShell from '../components/SingleStepFormShell'

const EDIT_STORAGE_KEY = 'edit-issue-row'
const STEPS = ['Issue Details']

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

const AddIssue = ({ onNavigate } = {}) => {
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

  const [allSchools, setAllSchools] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [roleOptions, setRoleOptions] = useState([])
  const [recipientOptions, setRecipientOptions] = useState([])
  const [lookupLoading, setLookupLoading] = useState(false)
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
        userType: initialEditRow?.userType || '',
        issueToId: initialEditRow?.issueToId != null ? String(initialEditRow.issueToId) : '',
        categoryId: initialEditRow?.categoryId != null ? String(initialEditRow.categoryId) : '',
        productId: initialEditRow?.productId != null ? String(initialEditRow.productId) : '',
        quantity: initialEditRow?.quantity != null ? String(initialEditRow.quantity) : '',
        issueDate: initialEditRow?.issueDate ? String(initialEditRow.issueDate).slice(0, 10) : DEFAULT_ISSUE_DATE,
        dueDate: initialEditRow?.dueDate ? String(initialEditRow.dueDate).slice(0, 10) : DEFAULT_DUE_DATE,
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

  useEffect(() => {
    return () => {
      try {
        sessionStorage.removeItem(EDIT_STORAGE_KEY)
      } catch {}
    }
  }, [])

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
      return rows.filter((school) => String(school?.headOfficeId ?? '') === String(manualScope.selectedHeadOfficeId))
    }

    if (isHeadOfficeAdmin) {
      return rows.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    }

    if (isSchoolAdmin) {
      return rows.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    }

    return rows
  }, [allSchools, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.selectedHeadOfficeId])

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

  const loadLookups = useCallback(async () => {
    setLookupLoading(true)
    try {
      const [schoolRows, categoryRows, productRows] = await Promise.all([
        fetchSchoolsLookup(),
        fetchAllPages((page, size) => fetchCategoriesPage({ page, size })),
        fetchAllPages((page, size) => fetchProductsPage({ page, size })),
      ])

      setAllSchools(Array.isArray(schoolRows) ? schoolRows : [])
      setAllCategories(Array.isArray(categoryRows) ? categoryRows : [])
      setAllProducts(Array.isArray(productRows) ? productRows : [])
    } catch (err) {
      console.error('Failed to load issue lookups:', err)
      setAllSchools([])
      setAllCategories([])
      setAllProducts([])
    } finally {
      setLookupLoading(false)
    }
  }, [])

  const loadRoles = useCallback(async (schoolId) => {
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
  }, [])

  const loadRecipients = useCallback(async (schoolId, roleValue) => {
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
  }, [])

  useEffect(() => {
    if (status === 'ready' && token) {
      void loadLookups()
    }
  }, [loadLookups, status, token])

  useEffect(() => {
    if (!initialEditRow) return

    const schoolId = initialEditRow.schoolId != null ? String(initialEditRow.schoolId) : ''
    const school = schoolId ? schoolsById.get(schoolId) : null
    const resolvedHeadOfficeId =
      initialEditRow.headOfficeId != null
        ? String(initialEditRow.headOfficeId)
        : school?.headOfficeId != null
          ? String(school.headOfficeId)
          : authHeadOfficeId != null
            ? String(authHeadOfficeId)
            : ''

    if (isSuperAdmin) {
      manualScope.setSelectedScope(resolvedHeadOfficeId, schoolId)
    }

    setForm((prev) => ({
      ...prev,
      headOfficeId: resolvedHeadOfficeId,
      schoolId,
      userType: initialEditRow.userType || '',
      issueToId: initialEditRow.issueToId != null ? String(initialEditRow.issueToId) : '',
      categoryId: initialEditRow.categoryId != null ? String(initialEditRow.categoryId) : '',
      productId: initialEditRow.productId != null ? String(initialEditRow.productId) : '',
      quantity: initialEditRow.quantity != null ? String(initialEditRow.quantity) : '',
      issueDate: initialEditRow.issueDate ? String(initialEditRow.issueDate).slice(0, 10) : DEFAULT_ISSUE_DATE,
      dueDate: initialEditRow.dueDate ? String(initialEditRow.dueDate).slice(0, 10) : DEFAULT_DUE_DATE,
      note: initialEditRow.note || '',
    }))
  }, [authHeadOfficeId, initialEditRow, isSuperAdmin, manualScope, schoolsById])

  useEffect(() => {
    if (isSchoolAdmin && authSchoolId != null) {
      const school = schoolsById.get(String(authSchoolId))
      const schoolId = String(authSchoolId)

      setForm((prev) => ({
        ...prev,
        headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
        schoolId,
      }))
    }
  }, [authSchoolId, isSchoolAdmin, schoolsById])

  useEffect(() => {
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      setForm((prev) => ({
        ...prev,
        headOfficeId: String(authHeadOfficeId),
      }))
    }
  }, [authHeadOfficeId, isHeadOfficeAdmin])

  useEffect(() => {
    if (form.schoolId) {
      void loadRoles(form.schoolId)
    } else {
      setRoleOptions([])
    }
  }, [form.schoolId, loadRoles])

  useEffect(() => {
    if (form.schoolId && form.userType) {
      void loadRecipients(form.schoolId, form.userType)
    } else {
      setRecipientOptions([])
    }
  }, [form.schoolId, form.userType, loadRecipients])

  const handleHeadOfficeChange = useCallback(
    (value) => {
      setForm((prev) => ({
        ...prev,
        headOfficeId: value,
        schoolId: '',
        userType: '',
        issueToId: '',
        categoryId: '',
        productId: '',
      }))

      manualScope.setSelectedScope(value, '')
      setRecipientOptions([])
      setRoleOptions([])
    },
    [manualScope],
  )

  const handleSchoolChange = useCallback(
    (value) => {
      const school = (Array.isArray(allSchools) ? allSchools : []).find((row) => String(row?.id ?? '') === String(value))
      const headOfficeId = school?.headOfficeId != null ? String(school.headOfficeId) : form.headOfficeId

      setForm((prev) => ({
        ...prev,
        headOfficeId,
        schoolId: value,
        userType: '',
        issueToId: '',
        categoryId: '',
        productId: '',
      }))

      manualScope.setSelectedScope(headOfficeId, value)
      setRecipientOptions([])
      setRoleOptions([])
    },
    [allSchools, form.headOfficeId, manualScope],
  )

  const handleUserTypeChange = useCallback((value) => {
    setForm((prev) => ({
      ...prev,
      userType: value,
      issueToId: '',
    }))
    setRecipientOptions([])
  }, [])

  const handleSave = useCallback(async () => {
    const schoolId = isSchoolAdmin ? authSchoolId : form.schoolId ? Number(form.schoolId) : null
    const headOfficeId = form.headOfficeId ? Number(form.headOfficeId) : null
    const userType = String(form.userType || '').trim()
    const issueToId = form.issueToId ? Number(form.issueToId) : null
    const categoryId = form.categoryId ? Number(form.categoryId) : null
    const productId = form.productId ? Number(form.productId) : null
    const quantity = form.quantity === '' ? null : Number(form.quantity)

    if (isSuperAdmin && !headOfficeId) return setError('Head office is required.')
    if (!schoolId) return setError('School is required.')
    if (!userType) return setError('User type is required.')
    if (!issueToId) return setError('Issue to is required.')
    if (!categoryId) return setError('Category is required.')
    if (!productId) return setError('Product is required.')
    if (quantity == null || Number.isNaN(quantity) || quantity <= 0) return setError('Quantity is required.')
    if (!form.issueDate) return setError('Issue date is required.')
    if (!form.dueDate) return setError('Due date is required.')

    const selectedSchool = (Array.isArray(allSchools) ? allSchools : []).find((row) => String(row?.id ?? '') === String(schoolId))
    const resolvedHeadOfficeId =
      headOfficeId != null && !Number.isNaN(headOfficeId)
        ? headOfficeId
        : selectedSchool?.headOfficeId != null
          ? Number(selectedSchool.headOfficeId)
          : null

    const payload = {
      headOfficeId: resolvedHeadOfficeId,
      schoolId,
      userType,
      issueToId,
      categoryId,
      productId,
      quantity,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      note: String(form.note || '').trim(),
    }

    setSaving(true)
    setError('')

    try {
      if (isEditMode) {
        await updateIssue(form.id, payload)
      } else {
        await createIssue(payload)
      }

      setSuccess(true)
      try {
        sessionStorage.removeItem(EDIT_STORAGE_KEY)
      } catch {}
      setTimeout(() => {
        navigateTo?.('issue')
      }, 900)
    } catch (err) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} issue:`, err)
      setError(err?.message || `Failed to ${isEditMode ? 'update' : 'create'} issue`)
    } finally {
      setSaving(false)
    }
  }, [allSchools, authSchoolId, form, isEditMode, isSchoolAdmin, navigateTo])

  const footer = (
    <div className="d-flex align-items-center justify-content-end gap-12 w-100">
      <button type="button" className="btn btn-light border px-24" onClick={() => navigateTo?.('issue')}>
        Cancel
      </button>
      <button type="button" className="btn btn-primary-600 px-24" onClick={handleSave} disabled={saving || lookupLoading || manualScope.loading}>
        {saving ? 'Saving...' : isEditMode ? 'Update Issue' : 'Save Issue'}
      </button>
    </div>
  )

  return (
    <SingleStepFormShell
      title={`${isEditMode ? 'Edit' : 'Add'} Issue`}
      breadcrumbTrail={` / Inventory / Issue / ${isEditMode ? 'Edit' : 'Add'}`}
      onDashboard={() => navigateTo?.('dashboard')}
      onBack={() => navigateTo?.('issue')}
      footer={footer}
      error={error}
      success={success}
      successMessage={`Issue ${isEditMode ? 'updated' : 'created'} successfully! Redirecting...`}
    >
      {lookupLoading || manualScope.loading ? (
        <div className="mb-16 text-secondary-light">Loading lookups...</div>
      ) : null}

      <div className="avm-grid">
        {isSuperAdmin ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <ManualScopeSelectors
              enabled
              compact
              headOffices={manualScope.headOffices}
              schoolOptions={schoolOptions}
              selectedHeadOfficeId={form.headOfficeId}
              onHeadOfficeChange={handleHeadOfficeChange}
              selectedSchoolId={form.schoolId}
              onSchoolChange={handleSchoolChange}
              schoolLabel="School"
            />
          </div>
        ) : isHeadOfficeAdmin ? (
          <>
            <FormField label="Head Office" full>
              <input className="avm-input" value={String(authHeadOfficeId || '')} disabled />
            </FormField>

            <FormField label="School Name" required>
              <select
                className="avm-select"
                id="schoolId"
                value={form.schoolId}
                onChange={(e) => handleSchoolChange(e.target.value)}
              >
                <option value="">--Select School--</option>
                {schoolOptions.map((school) => (
                  <option key={school.id} value={String(school.id)}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </FormField>
          </>
        ) : (
          <FormField label="School Name" required full>
            <input className="avm-input" value={schoolsById.get(String(authSchoolId))?.schoolName || ''} readOnly />
          </FormField>
        )}

        <FormField label="User Type" required>
          <select
            className="avm-select"
            id="userType"
            value={form.userType}
            onChange={(e) => handleUserTypeChange(e.target.value)}
            disabled={!form.schoolId}
          >
            <option value="">{form.schoolId ? '--Select Role--' : 'Select School First'}</option>
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
            value={form.issueToId}
            onChange={(e) => setForm((prev) => ({ ...prev, issueToId: e.target.value }))}
            disabled={!form.userType}
          >
            <option value="">{form.userType ? '--Select--' : 'Select Role First'}</option>
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
            value={form.categoryId}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                categoryId: e.target.value,
                productId: '',
              }))
            }
            disabled={!currentSchoolId}
          >
            <option value="">{currentSchoolId ? '--Select--' : 'Select School First'}</option>
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
            value={form.productId}
            onChange={(e) => setForm((prev) => ({ ...prev, productId: e.target.value }))}
            disabled={!currentSchoolId}
          >
            <option value="">{currentSchoolId ? '--Select--' : 'Select School First'}</option>
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
            value={form.quantity}
            onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
            min="1"
            step="1"
          />
        </FormField>

        <FormField label="Issue Date" required>
          <input
            type="date"
            className="avm-input"
            id="issueDate"
            value={form.issueDate}
            onChange={(e) => setForm((prev) => ({ ...prev, issueDate: e.target.value }))}
          />
        </FormField>

        <FormField label="Due Date" required>
          <input
            type="date"
            className="avm-input"
            id="dueDate"
            value={form.dueDate}
            onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
          />
        </FormField>

        <FormField label="Note" full>
          <textarea
            className="avm-input avm-textarea"
            id="note"
            rows="3"
            placeholder="Note"
            value={form.note}
            onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
          />
        </FormField>
      </div>
    </SingleStepFormShell>
  )
}

export default AddIssue
