import { useEffect, useMemo, useState } from 'react'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createHostel } from '../apis/hostelsApi'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import HostelFormFields from '../components/HostelFormFields'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  name: '',
  hostelType: '',
  address: '',
  note: '',
}

const HostelCreate = ({ onNavigate }) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId } = useSchool()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [headOffices, setHeadOffices] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loadingLookups, setLoadingLookups] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const currentSchoolId = isSuperAdmin
    ? (manualScope.selectedSchoolId ? String(manualScope.selectedSchoolId) : activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : '')
    : activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : ''

  const currentHeadOfficeId = isSuperAdmin
    ? (manualScope.selectedHeadOfficeId ? String(manualScope.selectedHeadOfficeId) : '')
    : authHeadOfficeId != null
      ? String(authHeadOfficeId)
      : ''

  const schoolOptions = useMemo(() => {
    const rows = Array.isArray(allSchools) ? allSchools : []
    if (isSuperAdmin) {
      if (!currentHeadOfficeId) return []
      return rows.filter((school) => String(school.headOfficeId ?? '') === String(currentHeadOfficeId))
    }
    if (isHeadOfficeAdmin) {
      return rows.filter((school) => String(school.headOfficeId ?? '') === String(authHeadOfficeId))
    }
    if (isSchoolAdmin) {
      return rows.filter((school) => String(school.id ?? '') === String(authSchoolId))
    }
    return rows
  }, [allSchools, isSuperAdmin, isHeadOfficeAdmin, isSchoolAdmin, currentHeadOfficeId, authHeadOfficeId, authSchoolId])

  const selectedSchoolName = useMemo(() => {
    const match = Array.isArray(allSchools)
      ? allSchools.find((school) => String(school.id ?? '') === String(form.schoolId))
      : null
    return match?.schoolName || authSchoolName || ''
  }, [allSchools, form.schoolId, authSchoolName])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    let cancelled = false

    const loadLookups = async () => {
      setLoadingLookups(true)
      try {
        const [headOfficePage, schoolsData] = await Promise.all([
          isSuperAdmin || isHeadOfficeAdmin ? fetchHeadOfficesPage(0, 500) : Promise.resolve({ content: [] }),
          fetchSchoolsLookup(),
        ])
        if (cancelled) return
        setHeadOffices(Array.isArray(headOfficePage?.content) ? headOfficePage.content : [])
        setAllSchools(Array.isArray(schoolsData) ? schoolsData : [])
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load hostel lookups:', err)
        setHeadOffices([])
        setAllSchools([])
      } finally {
        if (!cancelled) setLoadingLookups(false)
      }
    }

    void loadLookups()
    return () => {
      cancelled = true
    }
  }, [status, token, isSuperAdmin, isHeadOfficeAdmin])

  useEffect(() => {
    if (!isSchoolAdmin) return
    if (authSchoolId == null) return
    setForm((prev) => ({
      ...prev,
      headOfficeId: authHeadOfficeId != null ? String(authHeadOfficeId) : prev.headOfficeId,
      schoolId: String(authSchoolId),
    }))
  }, [authHeadOfficeId, authSchoolId, isSchoolAdmin])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.schoolId || !form.name || !form.hostelType || !form.address) {
      setError('School, hostel name, type, and address are required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await createHostel({
        headOfficeId: form.headOfficeId ? Number(form.headOfficeId) : null,
        schoolId: Number(form.schoolId),
        name: String(form.name || '').trim(),
        hostelType: String(form.hostelType || '').trim(),
        address: String(form.address || '').trim(),
        note: form.note,
      })
      onNavigate?.('manage-hostel')
    } catch (err) {
      console.error('Failed to create hostel:', err)
      setError(err?.message || 'Failed to create hostel')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Add Hostel</h1>
          <span className="text-secondary-light">Hostel / Manage Hostel / Add</span>
        </div>
        <button
          type="button"
          className="btn btn-outline-neutral border border-neutral-300 radius-8 text-sm"
          onClick={() => onNavigate?.('manage-hostel')}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-body p-24">
          {error ? <div className="alert alert-danger mb-24">{error}</div> : null}

          <form onSubmit={handleSubmit}>
            <HostelFormFields
              form={form}
              setForm={setForm}
              isSuperAdmin={isSuperAdmin}
              isHeadOfficeAdmin={isHeadOfficeAdmin}
              isSchoolAdmin={isSchoolAdmin}
              headOffices={headOffices}
              schoolOptions={schoolOptions}
              selectedHeadOfficeId={form.headOfficeId}
              selectedSchoolId={form.schoolId}
              onHeadOfficeChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  headOfficeId: value,
                  schoolId: '',
                }))
                if (isSuperAdmin) {
                  manualScope.setSelectedScope(value, '')
                }
              }}
              onSchoolChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  schoolId: value,
                }))
                if (isSuperAdmin) {
                  manualScope.setSelectedScope(form.headOfficeId, value)
                }
              }}
              headOfficeName={authHeadOfficeName || ''}
              schoolName={selectedSchoolName}
            />

            <div className="d-flex justify-content-end gap-12 mt-24">
              <button
                type="button"
                className="btn btn-light border px-32"
                onClick={() => onNavigate?.('manage-hostel')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-600 px-32"
                disabled={saving || loadingLookups}
              >
                {saving ? 'Saving...' : 'Save Hostel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default HostelCreate
