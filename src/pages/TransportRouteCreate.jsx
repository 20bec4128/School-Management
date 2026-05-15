import { useEffect, useMemo, useState } from 'react'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchVehicles } from '../apis/vehiclesApi'
import { createTransportRoute } from '../apis/transportRoutesApi'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import TransportRouteFormFields from '../components/TransportRouteFormFields'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  routeName: '',
  routeStart: '',
  routeEnd: '',
  vehicleId: '',
  note: '',
  stops: [{ stopName: '', stopKm: '', stopFare: '' }],
}

const TransportRouteCreate = ({ onNavigate }) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId } = useSchool()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [headOffices, setHeadOffices] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [vehicleOptions, setVehicleOptions] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loadingLookups, setLoadingLookups] = useState(false)
  const [loadingVehicles, setLoadingVehicles] = useState(false)
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
        console.error('Failed to load transport route lookups:', err)
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

  useEffect(() => {
    if (!form.schoolId) {
      setVehicleOptions([])
      return
    }

    let cancelled = false
    const loadVehicles = async () => {
      setLoadingVehicles(true)
      try {
        const rows = await fetchVehicles({ schoolId: form.schoolId })
        if (cancelled) return
        setVehicleOptions(Array.isArray(rows) ? rows : [])
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load route vehicles:', err)
        setVehicleOptions([])
      } finally {
        if (!cancelled) setLoadingVehicles(false)
      }
    }

    void loadVehicles()
    return () => {
      cancelled = true
    }
  }, [form.schoolId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.schoolId || !form.routeName || !form.routeStart || !form.routeEnd || !form.vehicleId) {
      setError('School, route name, route start, route end, and vehicle are required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await createTransportRoute({
        headOfficeId: form.headOfficeId ? Number(form.headOfficeId) : null,
        schoolId: Number(form.schoolId),
        routeName: String(form.routeName || '').trim(),
        routeStart: String(form.routeStart || '').trim(),
        routeEnd: String(form.routeEnd || '').trim(),
        vehicleId: Number(form.vehicleId),
        note: form.note,
        stops: Array.isArray(form.stops)
          ? form.stops.map((stop) => ({
              stopName: String(stop.stopName || '').trim(),
              stopKm: stop.stopKm === '' || stop.stopKm == null ? null : Number(stop.stopKm),
              stopFare: stop.stopFare === '' || stop.stopFare == null ? null : Number(stop.stopFare),
            }))
          : [],
      })
      onNavigate?.('transport-route')
    } catch (err) {
      console.error('Failed to create transport route:', err)
      setError(err?.message || 'Failed to create transport route')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Add Transport Route</h1>
          <div className="text-secondary-light">
            <button
              type="button"
              className="text-secondary-light border-0 bg-transparent p-0"
              onClick={() => onNavigate?.('dashboard')}
            >
              Dashboard
            </button>{' '}
            /{' '}
            <button
              type="button"
              className="text-secondary-light border-0 bg-transparent p-0"
              onClick={() => onNavigate?.('transport-route')}
            >
              Transport Route
            </button>{' '}
            / Add
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-2"
          onClick={() => onNavigate?.('transport-route')}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-body p-24">
          {error ? <div className="alert alert-danger mb-24">{error}</div> : null}

          <form onSubmit={handleSubmit}>
            <TransportRouteFormFields
              form={form}
              setForm={setForm}
              isSuperAdmin={isSuperAdmin}
              isHeadOfficeAdmin={isHeadOfficeAdmin}
              isSchoolAdmin={isSchoolAdmin}
              headOffices={headOffices}
              schoolOptions={schoolOptions}
              vehicleOptions={vehicleOptions}
              selectedHeadOfficeId={form.headOfficeId}
              selectedSchoolId={form.schoolId}
              onHeadOfficeChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  headOfficeId: value,
                  schoolId: '',
                  vehicleId: '',
                }))
                if (isSuperAdmin) {
                  manualScope.setSelectedScope(value, '')
                }
              }}
              onSchoolChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  schoolId: value,
                  vehicleId: '',
                }))
                if (isSuperAdmin) {
                  manualScope.setSelectedScope(form.headOfficeId, value)
                }
              }}
              headOfficeName={authHeadOfficeName || ''}
              schoolName={selectedSchoolName}
              vehicleLoading={loadingVehicles}
            />

            <div className="d-flex justify-content-end gap-12 mt-24">
              <button
                type="button"
                className="btn btn-light border px-32"
                onClick={() => onNavigate?.('transport-route')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-600 px-32"
                disabled={saving || loadingLookups}
              >
                {saving ? 'Saving...' : 'Save Route'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TransportRouteCreate
