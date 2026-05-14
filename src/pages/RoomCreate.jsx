import { useEffect, useMemo, useState } from 'react'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchHostels } from '../apis/hostelsApi'
import { createRoom } from '../apis/roomsApi'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import RoomFormFields from '../components/RoomFormFields'

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  hostelId: '',
  roomNo: '',
  roomType: '',
  seatTotal: '',
  costPerSeat: '',
  note: '',
}

const RoomCreate = ({ onNavigate }) => {
  const { status, token, user, role: authRole, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const { activeSchoolId } = useSchool()
  const role = useMemo(() => normalizeRole(authRole || user?.role || user?.userRole || user?.authority), [authRole, user])
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [headOffices, setHeadOffices] = useState([])
  const [allSchools, setAllSchools] = useState([])
  const [hostelOptions, setHostelOptions] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loadingLookups, setLoadingLookups] = useState(false)
  const [loadingHostels, setLoadingHostels] = useState(false)
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
        console.error('Failed to load room lookups:', err)
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
    const schoolId = form.schoolId ? String(form.schoolId) : ''
    if (!schoolId) {
      setHostelOptions([])
      return
    }
    let cancelled = false
    const loadHostels = async () => {
      setLoadingHostels(true)
      try {
        const data = await fetchHostels({
          headOfficeId: form.headOfficeId || currentHeadOfficeId || undefined,
          schoolId,
        })
        if (cancelled) return
        setHostelOptions(Array.isArray(data) ? data : [])
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load hostel options:', err)
        setHostelOptions([])
      } finally {
        if (!cancelled) setLoadingHostels(false)
      }
    }
    void loadHostels()
    return () => {
      cancelled = true
    }
  }, [currentHeadOfficeId, form.headOfficeId, form.schoolId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.schoolId || !form.hostelId || !form.roomNo || !form.roomType || !form.seatTotal) {
      setError('School, hostel, room no, room type, and seat total are required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await createRoom({
        headOfficeId: form.headOfficeId ? Number(form.headOfficeId) : null,
        schoolId: Number(form.schoolId),
        hostelId: Number(form.hostelId),
        roomNo: String(form.roomNo || '').trim(),
        roomType: String(form.roomType || '').trim(),
        seatTotal: Number(form.seatTotal),
        costPerSeat: form.costPerSeat === '' ? null : Number(form.costPerSeat),
        note: form.note,
      })
      onNavigate?.('manage-room')
    } catch (err) {
      console.error('Failed to create room:', err)
      setError(err?.message || 'Failed to create room')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Add Room</h1>
          <span className="text-secondary-light">Hostel / Manage Room / Add</span>
        </div>
        <button
          type="button"
          className="btn btn-outline-neutral border border-neutral-300 radius-8 text-sm"
          onClick={() => onNavigate?.('manage-room')}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-body p-24">
          {error ? <div className="alert alert-danger mb-24">{error}</div> : null}

          <form onSubmit={handleSubmit}>
            <RoomFormFields
              form={form}
              setForm={setForm}
              isSuperAdmin={isSuperAdmin}
              isHeadOfficeAdmin={isHeadOfficeAdmin}
              isSchoolAdmin={isSchoolAdmin}
              headOffices={headOffices}
              schoolOptions={schoolOptions}
              hostelOptions={hostelOptions}
              selectedHeadOfficeId={form.headOfficeId}
              selectedSchoolId={form.schoolId}
              onHeadOfficeChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  headOfficeId: value,
                  schoolId: '',
                  hostelId: '',
                }))
                if (isSuperAdmin) {
                  manualScope.setSelectedScope(value, '')
                }
              }}
              onSchoolChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  schoolId: value,
                  hostelId: '',
                }))
                if (isSuperAdmin) {
                  manualScope.setSelectedScope(form.headOfficeId, value)
                }
              }}
              headOfficeName={authHeadOfficeName || ''}
              schoolName={selectedSchoolName}
              hostelLoading={loadingHostels || loadingLookups}
            />

            <div className="d-flex justify-content-end gap-12 mt-24">
              <button
                type="button"
                className="btn btn-light border px-32"
                onClick={() => onNavigate?.('manage-room')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-600 px-32"
                disabled={saving || loadingLookups || loadingHostels}
              >
                {saving ? 'Saving...' : 'Save Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RoomCreate
