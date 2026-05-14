import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { normalizeRole } from '../utils/roles'

const STORAGE_KEY_SCHOOL = 'sm_active_school_id'

export const SchoolContext = createContext({
  activeSchoolId: null, // string | null (null means "ALL" for head-office/global roles)
  setActiveSchoolId: () => {},
  schoolOptions: [],
  refreshSchools: async () => {},
  isSchoolSelectionEnabled: false,
})

const readStored = (key) => {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return null
    const v = String(raw).trim()
    if (!v || v.toUpperCase() === 'ALL') return null
    return v
  } catch {
    return null
  }
}

const writeStored = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, String(value))
  } catch {
    // ignore
  }
}

export const SchoolProvider = ({ user, children }) => {
  const role = normalizeRole(user?.role || user?.userRole || user?.authority)
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSuperAdmin = role === 'SUPER_ADMIN'

  const isSchoolSelectionEnabled = isHeadOfficeAdmin || isSuperAdmin

  const [activeSchoolId, setActiveSchoolIdState] = useState(() => readStored(STORAGE_KEY_SCHOOL))
  const [allSchools, setAllSchools] = useState([])

  const refreshSchools = useCallback(async () => {
    if (!isSchoolSelectionEnabled) {
      setAllSchools([])
      return
    }
    try {
      const list = await fetchSchoolsLookup()
      setAllSchools(Array.isArray(list) ? list : [])
    } catch {
      setAllSchools([])
    }
  }, [isSchoolSelectionEnabled])

  const setActiveSchoolId = useCallback(
    (value) => {
      const normalized = value == null || String(value).trim() === '' ? null : String(value)
      setActiveSchoolIdState(normalized)
      writeStored(STORAGE_KEY_SCHOOL, normalized)
      window.dispatchEvent(new Event('sm:school-changed'))
    },
    [],
  )

  useEffect(() => {
    if (!isSchoolSelectionEnabled) {
      setActiveSchoolIdState(null)
      writeStored(STORAGE_KEY_SCHOOL, null)
      setAllSchools([])
    } else {
      void refreshSchools()
    }
  }, [isSchoolSelectionEnabled, refreshSchools])

  const schoolOptions = useMemo(() => allSchools, [allSchools])

  const value = useMemo(
    () => ({
      activeSchoolId,
      setActiveSchoolId,
      schoolOptions,
      refreshSchools,
      isSchoolSelectionEnabled,
    }),
    [
      activeSchoolId,
      setActiveSchoolId,
      schoolOptions,
      refreshSchools,
      isSchoolSelectionEnabled,
    ],
  )

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>
}
