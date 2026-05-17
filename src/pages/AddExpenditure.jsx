import { useEffect, useMemo, useState } from 'react'
import '../assets/css/addModalShared.css'

import { useAuth } from '../context/useAuth'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchExpenditureHeads } from '../apis/expenditureHeadsApi'
import { createExpenditure, updateExpenditure } from '../apis/expendituresApi'
import { normalizeRole } from '../utils/roles'
import SingleStepFormShell from '../components/SingleStepFormShell'
import ManualScopeSelectors from '../components/ManualScopeSelectors'

const EDIT_STORAGE_KEY = 'edit-expenditure-row'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  expenditureHeadId: '',
  expenditureMethod: '',
  reference: '',
  amount: '',
  expenditureDate: '',
  note: '',
}

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Expenditure Head': 'ri-money-dollar-box-line',
  'Expenditure Method': 'ri-bank-card-line',
  Reference: 'ri-hashtag',
  Amount: 'ri-money-dollar-circle-line',
  Date: 'ri-calendar-line',
  Note: 'ri-sticky-note-line',
}

const EXPENDITURE_METHOD_OPTIONS = ['Cash', 'Bank', 'Online', 'Cheque', 'Mobile Banking', 'Other']

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

const AddExpenditure = ({ onNavigate }) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'

  const [initialEditRow] = useState(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })

  const isEditMode = Boolean(initialEditRow?.id)
  const [headOffices, setHeadOffices] = useState([])
  const [schools, setSchools] = useState([])
  const [expenditureHeads, setExpenditureHeads] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState(() => {
    if (initialEditRow) {
      return {
        ...emptyForm,
        ...initialEditRow,
        headOfficeId: initialEditRow.headOfficeId != null ? String(initialEditRow.headOfficeId) : '',
        schoolId: initialEditRow.schoolId != null ? String(initialEditRow.schoolId) : '',
        expenditureHeadId: initialEditRow.expenditureHeadId != null ? String(initialEditRow.expenditureHeadId) : '',
        amount: initialEditRow.amount != null ? String(initialEditRow.amount) : '',
      }
    }
    return {
      ...emptyForm,
      headOfficeId: isSchoolAdmin ? (authHeadOfficeId != null ? String(authHeadOfficeId) : '') : (isHeadOfficeAdmin ? (authHeadOfficeId != null ? String(authHeadOfficeId) : '') : ''),
      schoolId: isSchoolAdmin ? (authSchoolId != null ? String(authSchoolId) : '') : '',
    }
  })

  useEffect(() => {
    return () => {
      sessionStorage.removeItem(EDIT_STORAGE_KEY)
    }
  }, [])

  const loadLookups = async () => {
    const tasks = []
    if (isSuperAdmin || isHeadOfficeAdmin) {
      tasks.push(
        fetchHeadOfficesPage(0, 500).then((page) => {
          const content = Array.isArray(page?.content) ? page.content : []
          setHeadOffices(content)
        }).catch(() => {}),
      )
    }
    tasks.push(fetchSchoolsLookup().then((list) => setSchools(Array.isArray(list) ? list : [])))
    await Promise.all(tasks)
  }

  const loadExpenditureHeads = async (schoolId) => {
    if (!schoolId) {
      if (isSuperAdmin) {
        const list = await fetchExpenditureHeads()
        setExpenditureHeads(Array.isArray(list) ? list : [])
      } else {
        setExpenditureHeads([])
      }
      return
    }
    const list = await fetchExpenditureHeads({ schoolId })
    setExpenditureHeads(Array.isArray(list) ? list : [])
  }

  useEffect(() => {
    if (status === 'ready' && token) {
      loadLookups()
    }
  }, [status, token])

  useEffect(() => {
    const sId = isSchoolAdmin ? authSchoolId : (form.schoolId || null)
    loadExpenditureHeads(sId).catch(() => {})
  }, [form.schoolId, isSchoolAdmin, authSchoolId])

  // Rule #8: Recover missing scope
  useEffect(() => {
    if (isSuperAdmin && form.schoolId && !form.headOfficeId && schools.length > 0) {
      const s = schools.find(item => String(item.id) === String(form.schoolId))
      if (s?.headOfficeId) {
        setForm(prev => ({ ...prev, headOfficeId: String(s.headOfficeId) }))
      }
    }
  }, [schools, form.schoolId, form.headOfficeId, isSuperAdmin])

  const schoolOptions = useMemo(() => {
    if (isSchoolAdmin) return []
    const hId = isSuperAdmin ? form.headOfficeId : (authHeadOfficeId != null ? String(authHeadOfficeId) : '')
    if (!hId) return []
    return schools.filter((s) => String(s?.headOfficeId ?? '') === String(hId))
  }, [schools, form.headOfficeId, isSuperAdmin, authHeadOfficeId, isSchoolAdmin])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => ({
      ...prev,
      [id]: value,
      ...(id === 'headOfficeId' ? { schoolId: '', expenditureHeadId: '' } : {}),
      ...(id === 'schoolId' ? { expenditureHeadId: '' } : {}),
    }))
  }

  const handleSave = async () => {
    const schoolId = isSchoolAdmin ? authSchoolId : (form.schoolId ? Number(form.schoolId) : null)
    if (!schoolId) { setError('School is required'); return }
    if (!form.expenditureHeadId) { setError('Expenditure head is required'); return }
    if (!form.expenditureMethod) { setError('Expenditure method is required'); return }
    if (!form.amount) { setError('Amount is required'); return }
    if (!form.expenditureDate) { setError('Date is required'); return }

    setBusy(true)
    setError('')
    try {
      const payload = { 
        ...form, 
        schoolId, 
        expenditureHeadId: Number(form.expenditureHeadId),
        amount: Number(form.amount)
      }
      if (isEditMode) {
        await updateExpenditure(form.id, payload)
      } else {
        await createExpenditure(payload)
      }
      setSuccess(true)
      setTimeout(() => onNavigate?.('expenditure'), 1000)
    } catch (e) {
      setError(e.message || 'Failed to save expenditure')
    } finally {
      setBusy(false)
    }
  }

  const footer = (
    <div className="d-flex align-items-center justify-content-end gap-12 w-100">
      <button type="button" className="btn btn-light border px-24" onClick={() => onNavigate?.('expenditure')}>
        Cancel
      </button>
      <button type="button" className="btn btn-primary-600 px-24" onClick={handleSave} disabled={busy}>
        {busy ? 'Saving...' : (isEditMode ? 'Update' : 'Save')}
      </button>
    </div>
  )

  return (
    <SingleStepFormShell
      title={`${isEditMode ? 'Edit' : 'Add'} Expenditure`}
      breadcrumbTrail={` / Expenditure / ${isEditMode ? 'Edit' : 'Add'}`}
      onDashboard={() => onNavigate?.('dashboard')}
      onBack={() => onNavigate?.('expenditure')}
      footer={footer}
      error={error}
      success={success}
      successMessage={`Expenditure ${isEditMode ? 'updated' : 'created'} successfully! Redirecting...`}
    >
      <div className="avm-grid">
        {isSuperAdmin ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <ManualScopeSelectors
              enabled
              compact
              headOffices={headOffices}
              schoolOptions={schoolOptions}
              selectedHeadOfficeId={form.headOfficeId}
              onHeadOfficeChange={(val) => setForm(prev => ({ ...prev, headOfficeId: val, schoolId: '', expenditureHeadId: '' }))}
              selectedSchoolId={form.schoolId}
              onSchoolChange={(val) => setForm(prev => ({ ...prev, schoolId: val, expenditureHeadId: '' }))}
              schoolLabel="School"
            />
          </div>
        ) : isHeadOfficeAdmin ? (
          <FormField label="School Name" required>
            <select className="avm-select" id="schoolId" value={form.schoolId} onChange={handleChange}>
              <option value="">--Select School--</option>
              {schoolOptions.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.schoolName}</option>
              ))}
            </select>
          </FormField>
        ) : (
          <FormField label="School Name" required>
            <input className="avm-input" value={authSchoolName || ''} readOnly />
          </FormField>
        )}

        <FormField label="Expenditure Head" required>
          <select className="avm-select" id="expenditureHeadId" value={form.expenditureHeadId} onChange={handleChange} disabled={!form.schoolId && !isSchoolAdmin}>
            <option value="">{form.schoolId || isSchoolAdmin ? '--Select Expenditure Head--' : 'Select School First'}</option>
            {expenditureHeads.map((head) => (
              <option key={head.id} value={String(head.id)}>{head.expenditureHead}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Expenditure Method" required>
          <select className="avm-select" id="expenditureMethod" value={form.expenditureMethod} onChange={handleChange}>
            <option value="">--Select--</option>
            {EXPENDITURE_METHOD_OPTIONS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Reference">
          <input type="text" className="avm-input" id="reference" placeholder="Enter Reference" value={form.reference} onChange={handleChange} />
        </FormField>

        <FormField label="Amount" required>
          <input type="number" className="avm-input" id="amount" placeholder="Enter Amount" value={form.amount} onChange={handleChange} />
        </FormField>

        <FormField label="Date" required>
          <input type="date" className="avm-input" id="expenditureDate" value={form.expenditureDate} onChange={handleChange} />
        </FormField>

        <FormField label="Note" noIcon>
          <textarea className="avm-input avm-textarea" id="note" rows="3" placeholder="Enter Note" value={form.note} onChange={handleChange} />
        </FormField>
      </div>
    </SingleStepFormShell>
  )
}

export default AddExpenditure
