import { useEffect, useMemo, useState } from 'react'
import { fetchAcademicYears } from '../apis/academicYearsApi'

const toUniqueAcademicYears = (rows) => {
  const seen = new Set()
  return rows
    .map((row) => String(row?.academicYear || '').trim())
    .filter(Boolean)
    .filter((value) => {
      if (seen.has(value)) return false
      seen.add(value)
      return true
    })
}

export const useAcademicYearOptions = ({ headOfficeId, schoolId, enabled = true } = {}) => {
  const [academicYearRows, setAcademicYearRows] = useState([])

  useEffect(() => {
    if (!enabled) {
      setAcademicYearRows([])
      return undefined
    }

    let cancelled = false
    const load = async () => {
      try {
        const data = await fetchAcademicYears({ headOfficeId, schoolId })
        if (cancelled) return
        setAcademicYearRows(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setAcademicYearRows([])
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [enabled, headOfficeId, schoolId])

  return useMemo(() => toUniqueAcademicYears(academicYearRows), [academicYearRows])
}

export default useAcademicYearOptions
