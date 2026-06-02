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

const pickSchoolOption = (user) => {
  const schoolId =
    user?.schoolId ??
    user?.school?.id ??
    user?.teacherContext?.schoolId ??
    user?.teacherContext?.school?.id ??
    user?.teacher?.schoolId ??
    user?.teacher?.school?.id ??
    null

  if (schoolId == null) return null

  const schoolName =
    user?.schoolName ??
    user?.school?.schoolName ??
    user?.school?.name ??
    user?.teacherContext?.schoolName ??
    user?.teacherContext?.school?.schoolName ??
    user?.teacherContext?.school?.name ??
    user?.teacher?.schoolName ??
    user?.teacher?.school?.schoolName ??
    user?.teacher?.school?.name ??
    `School ${schoolId}`

  const headOfficeId =
    user?.headOfficeId ??
    user?.headOffice?.id ??
    user?.teacherContext?.headOfficeId ??
    user?.teacherContext?.headOffice?.id ??
    user?.teacher?.headOfficeId ??
    user?.teacher?.headOffice?.id ??
    null

  return {
    id: String(schoolId),
    schoolName,
    headOfficeId: headOfficeId == null ? '' : String(headOfficeId),
  }
}

export const SchoolProvider = ({ user, children }) => {
  const role = normalizeRole(user?.role || user?.userRole || user?.authority)
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isSchoolAdmin = role === 'SCHOOL_ADMIN'
  const fixedSchoolOption = useMemo(() => (isSchoolAdmin ? pickSchoolOption(user) : null), [isSchoolAdmin, user])

  const isSchoolSelectionEnabled = isHeadOfficeAdmin || isSuperAdmin

  const [activeSchoolId, setActiveSchoolIdState] = useState(() => readStored(STORAGE_KEY_SCHOOL) ?? fixedSchoolOption?.id ?? null)
  const [allSchools, setAllSchools] = useState([])

  const refreshSchools = useCallback(async () => {
    if (isSchoolAdmin) {
      setAllSchools(fixedSchoolOption ? [fixedSchoolOption] : [])
      return
    }
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
  }, [fixedSchoolOption, isSchoolAdmin, isSchoolSelectionEnabled])

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
    if (isSchoolAdmin) {
      const nextSchoolId = fixedSchoolOption?.id ?? null
      setActiveSchoolIdState(nextSchoolId)
      writeStored(STORAGE_KEY_SCHOOL, nextSchoolId)
      setAllSchools(fixedSchoolOption ? [fixedSchoolOption] : [])
      return
    }
    if (!isSchoolSelectionEnabled) {
      setActiveSchoolIdState(null)
      writeStored(STORAGE_KEY_SCHOOL, null)
      setAllSchools([])
    } else {
      void refreshSchools()
    }
  }, [fixedSchoolOption, isSchoolAdmin, isSchoolSelectionEnabled, refreshSchools])

  const schoolOptions = useMemo(() => {
    if (isSchoolAdmin) return fixedSchoolOption ? [fixedSchoolOption] : []
    return allSchools
  }, [allSchools, fixedSchoolOption, isSchoolAdmin])

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
