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
        const sortedHOs = nextHeadOffices
          .map((ho) => ({
            id: ho?.id,
            name: ho?.name || ho?.headOfficeName || '',
          }))
          .filter((ho) => ho.id != null && ho.name)
          .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        
        setHeadOffices(sortedHOs)
        const rawSchools = Array.isArray(schoolList) ? schoolList : []
        setSchools(rawSchools)

        // Default to first head office if none currently selected
        if (sortedHOs.length > 0) {
          setSelectedHeadOfficeId((currHO) => {
            if (currHO) return currHO
            return String(sortedHOs[0].id)
          })
        }
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
    if (!selectedHeadOfficeId) {
      setSelectedSchoolId('')
      return
    }
    const matchingSchools = schools.filter(
      (school) => String(school?.headOfficeId ?? '') === String(selectedHeadOfficeId)
    )
    if (matchingSchools.length > 0) {
      setSelectedSchoolId(String(matchingSchools[0].id))
    } else {
      setSelectedSchoolId('')
    }
  }, [selectedHeadOfficeId, schools])

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
      if (schoolId) {
        setSelectedSchoolId(schoolId)
      } else {
        if (!headOfficeId) {
          setSelectedSchoolId('')
        } else {
          const matching = schools.filter(
            (school) => String(school?.headOfficeId ?? '') === String(headOfficeId)
          )
          if (matching.length > 0) {
            setSelectedSchoolId(String(matching[0].id))
          } else {
            setSelectedSchoolId('')
          }
        }
      }
    },
  }
}
