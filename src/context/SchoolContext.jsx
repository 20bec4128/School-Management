import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { normalizeRole } from '../utils/roles'

const STORAGE_KEY = 'sm_active_school_id'

export const SchoolContext = createContext({
  activeSchoolId: null, // string | null (null means "ALL" for head-office/global roles)
  setActiveSchoolId: () => {},
  schoolOptions: [],
  refreshSchools: async () => {},
  isSchoolSelectionEnabled: false,
})

const readStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw == null) return null
    const v = String(raw).trim()
    if (!v || v.toUpperCase() === 'ALL') return null
    return v
  } catch {
    return null
  }
}

const writeStored = (value) => {
  try {
    if (value == null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    // ignore
  }
}

export const SchoolProvider = ({ user, children }) => {
  const role = normalizeRole(user?.role || user?.userRole || user?.authority)
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSuperAdmin = role === 'SUPER_ADMIN'

  const isSchoolSelectionEnabled = isHeadOfficeAdmin || isSuperAdmin

  const [activeSchoolId, setActiveSchoolIdState] = useState(() => readStored())
  const [schoolOptions, setSchoolOptions] = useState([])

  const refreshSchools = useCallback(async () => {
    if (!isSchoolSelectionEnabled) {
      setSchoolOptions([])
      return
    }
    try {
      const list = await fetchSchoolsLookup()
      const rows = Array.isArray(list) ? list : []
      setSchoolOptions(rows)
    } catch {
      setSchoolOptions([])
    }
  }, [isSchoolSelectionEnabled])

  const setActiveSchoolId = useCallback(
    (value) => {
      const normalized = value == null || String(value).trim() === '' ? null : String(value)
      setActiveSchoolIdState(normalized)
      writeStored(normalized)
      window.dispatchEvent(new Event('sm:school-changed'))
    },
    [],
  )

  useEffect(() => {
    if (!isSchoolSelectionEnabled) {
      // For school-scoped roles, always clear any stored global selection.
      setActiveSchoolIdState(null)
      writeStored(null)
      setSchoolOptions([])
      return
    }
    void refreshSchools()
  }, [isSchoolSelectionEnabled, refreshSchools])

  const value = useMemo(
    () => ({
      activeSchoolId,
      setActiveSchoolId,
      schoolOptions,
      refreshSchools,
      isSchoolSelectionEnabled,
    }),
    [activeSchoolId, isSchoolSelectionEnabled, refreshSchools, schoolOptions, setActiveSchoolId],
  )

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>
}

