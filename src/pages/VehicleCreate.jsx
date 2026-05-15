import { useEffect, useMemo, useState } from 'react'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchEmployees } from '../apis/employeesApi'
import { createVehicle } from '../apis/vehiclesApi'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import VehicleFormFields from '../components/VehicleFormFields'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  vehicleNumber: '',
  vehicleModel: '',
  driverEmployeeId: '',
  vehicleLicense: '',
  vehicleContactCountryCode: '+91',
  vehicleContactNumber: '',
  note: '',
}

const VehicleCreate = ({ onNavigate }) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId } = useSchool()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [headOffices, setHeadOffices] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [driverEmployees, setDriverEmployees] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loadingLookups, setLoadingLookups] = useState(false)
  const [loadingDrivers, setLoadingDrivers] = useState(false)
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
        console.error('Failed to load vehicle lookups:', err)
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
      setDriverEmployees([])
      return
    }

    let cancelled = false
    const loadDrivers = async () => {
      setLoadingDrivers(true)
      try {
        const rows = await fetchEmployees({ schoolId: form.schoolId })
        if (cancelled) return
        setDriverEmployees(
          (Array.isArray(rows) ? rows : [])
            .filter((employee) => String(employee?.role || '').trim().toUpperCase() === 'DRIVER')
            .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''))),
        )
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load drivers:', err)
        setDriverEmployees([])
      } finally {
        if (!cancelled) setLoadingDrivers(false)
      }
    }

    void loadDrivers()
    return () => {
      cancelled = true
    }
  }, [form.schoolId])

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!form.schoolId || !form.vehicleNumber || !form.driverEmployeeId || !form.vehicleContactCountryCode || !form.vehicleContactNumber) {
      setError('School, vehicle number, driver, and vehicle contact are required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await createVehicle({
        schoolId: Number(form.schoolId),
        driverEmployeeId: Number(form.driverEmployeeId),
        vehicleNumber: String(form.vehicleNumber || '').trim(),
        vehicleModel: form.vehicleModel,
        vehicleLicense: form.vehicleLicense,
        vehicleContactCountryCode: form.vehicleContactCountryCode,
        vehicleContactNumber: form.vehicleContactNumber,
        note: form.note,
      })
      onNavigate?.('vehicle')
    } catch (err) {
      console.error('Failed to create vehicle:', err)
      setError(err?.message || 'Failed to create vehicle')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Add Vehicle</h1>
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
              onClick={() => onNavigate?.('vehicle')}
            >
              Vehicle
            </button>{' '}
            / Add
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-2"
          onClick={() => onNavigate?.('vehicle')}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-body p-24">
          {error ? <div className="alert alert-danger mb-24">{error}</div> : null}

          <form onSubmit={handleCreate}>
            <VehicleFormFields
              form={form}
              setForm={setForm}
              isSuperAdmin={isSuperAdmin}
              isHeadOfficeAdmin={isHeadOfficeAdmin}
              isSchoolAdmin={isSchoolAdmin}
              headOffices={headOffices}
              schoolOptions={schoolOptions}
              driverEmployees={driverEmployees}
              selectedHeadOfficeId={form.headOfficeId}
              selectedSchoolId={form.schoolId}
              onHeadOfficeChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  headOfficeId: value,
                  schoolId: '',
                  driverEmployeeId: '',
                }))
                if (isSuperAdmin) {
                  manualScope.setSelectedScope(value, '')
                }
              }}
              onSchoolChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  schoolId: value,
                  driverEmployeeId: '',
                }))
                if (isSuperAdmin) {
                  manualScope.setSelectedScope(form.headOfficeId, value)
                }
              }}
              headOfficeName={authHeadOfficeName || ''}
              schoolName={selectedSchoolName}
              driverLoading={loadingDrivers}
            />

            <div className="d-flex justify-content-end gap-12 mt-24">
              <button
                type="button"
                className="btn btn-light border px-32"
                onClick={() => onNavigate?.('vehicle')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-600 px-32"
                disabled={saving || loadingLookups}
              >
                {saving ? 'Saving...' : 'Save Vehicle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default VehicleCreate
