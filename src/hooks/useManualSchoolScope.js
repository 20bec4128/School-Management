import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'

export const useManualSchoolScope = (enabled) => {
  const [headOffices, setHeadOffices] = useState([])
  const [schools, setSchools] = useState([])
  const [selectedHeadOfficeId, setSelectedHeadOfficeId] = useState('')
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const [loading, setLoading] = useState(false)
  const syncingScopeRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      setHeadOffices([])
      setSchools([])
      setSelectedHeadOfficeId('')
      setSelectedSchoolId('')
      setLoading(false)
      return undefined
    }

    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [headOfficePage, schoolList] = await Promise.all([
          fetchHeadOfficesPage(0, 500),
          fetchSchoolsLookup(),
        ])
        if (cancelled) return
        const nextHeadOffices = Array.isArray(headOfficePage?.content) ? headOfficePage.content : []
        setHeadOffices(
          nextHeadOffices
            .map((ho) => ({
              id: ho?.id,
              name: ho?.name || ho?.headOfficeName || '',
            }))
            .filter((ho) => ho.id != null && ho.name)
            .sort((a, b) => String(a.name).localeCompare(String(b.name))),
        )
        setSchools(Array.isArray(schoolList) ? schoolList : [])
      } catch {
        if (cancelled) return
        setHeadOffices([])
        setSchools([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [enabled])

  useEffect(() => {
    if (syncingScopeRef.current) {
      syncingScopeRef.current = false
      return
    }
    setSelectedSchoolId('')
  }, [selectedHeadOfficeId])

  const schoolOptions = useMemo(() => {
    const rows = Array.isArray(schools) ? schools : []
    if (!selectedHeadOfficeId) return rows
    return rows.filter((school) => String(school?.headOfficeId ?? '') === String(selectedHeadOfficeId))
  }, [schools, selectedHeadOfficeId])

  return {
    enabled,
    loading,
    headOffices,
    schoolOptions,
    selectedHeadOfficeId,
    setSelectedHeadOfficeId,
    selectedSchoolId,
    setSelectedSchoolId,
    setSelectedScope: (headOfficeId, schoolId) => {
      syncingScopeRef.current = true
      setSelectedHeadOfficeId(headOfficeId)
      setSelectedSchoolId(schoolId)
    },
  }
}
