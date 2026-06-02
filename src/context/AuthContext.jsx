import { useCallback, useEffect, useMemo, useState } from 'react'
import { login as loginApi, logout as logoutApi, me as meApi } from '../apis/authApi'
import { getToken, setToken } from '../apis/apiClient'
import { normalizeRole } from '../utils/roles'
import { AuthContext } from './authContext'
import { fetchGeneralSettings } from '../apis/generalSettingApi'
import { fetchMyPagePermissions } from '../apis/pagePermissionApi'
import { normalizePagePermissionSlug } from '../utils/pagePermissionAliases'
import { getParentChildId, getParentChildScope } from '../utils/parentChildScope'

const USER_KEY = 'sm_user'
const CHILD_KEY = 'sm_selected_child_id'

const readJson = (key) => {
  try {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const writeJson = (key, value) => {
  try {
    const hasRememberedToken = !!localStorage.getItem('sm_token')
    const store = hasRememberedToken ? localStorage : sessionStorage
    const other = hasRememberedToken ? sessionStorage : localStorage
    if (value == null) {
      store.removeItem(key)
      other.removeItem(key)
    } else {
      store.setItem(key, JSON.stringify(value))
      other.removeItem(key)
    }
  } catch {
    // ignore
  }
}

const pickPermissions = (user) => {
  const perms = user?.permissions ?? user?.perms ?? user?.authorities ?? []
  if (perms === '*') return ['*']
  if (Array.isArray(perms)) return perms
  if (typeof perms === 'string') return perms.split(',').map((p) => p.trim()).filter(Boolean)
  return []
}

const pickChildren = (user) => {
  const list =
    user?.children ||
    user?.childList ||
    user?.students ||
    user?.linkedStudents ||
    user?.studentList ||
    []
  return Array.isArray(list) ? list : []
}

const pickSchoolId = (user) =>
  user?.schoolId ??
  user?.school?.id ??
  user?.teacherContext?.schoolId ??
  user?.teacherContext?.school?.id ??
  user?.teacher?.schoolId ??
  user?.teacher?.school?.id ??
  null

const pickSchoolName = (user) =>
  user?.schoolName ??
  user?.school?.schoolName ??
  user?.school?.name ??
  user?.teacherContext?.schoolName ??
  user?.teacherContext?.school?.schoolName ??
  user?.teacherContext?.school?.name ??
  user?.teacher?.schoolName ??
  user?.teacher?.school?.schoolName ??
  user?.teacher?.school?.name ??
  null

const pickFirstGeneralSetting = (data) => {
  if (!data) return null
  if (Array.isArray(data)) return data[0] ?? null
  return data
}

const normalizePagePermissionsMap = (permissions) => {
  if (!permissions || typeof permissions !== 'object') return {}
  if (permissions.superAdmin) return { superAdmin: true }

  return Object.entries(permissions).reduce((acc, [slug, value]) => {
    if (slug === 'superAdmin') return acc
    const key = normalizePagePermissionSlug(slug)
    if (!key) return acc
    acc[key] = value
    return acc
  }, {})
}

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => getToken())
  const [user, setUser] = useState(() => readJson(USER_KEY))
  const [status, setStatus] = useState('idle') // idle | loading | ready

  const [pagePermissions, setPagePermissions] = useState(() => {
    const saved = readJson('sm_page_perms')
    return normalizePagePermissionsMap(saved)
  })
  const [isSuperAdminRole, setIsSuperAdminRole] = useState(() => {
    const saved = readJson('sm_page_perms')
    return saved?.superAdmin === true
  })

  const permissions = useMemo(() => pickPermissions(user), [user])
  const role = useMemo(() => normalizeRole(user?.role || user?.userRole || user?.authority), [user])
  const headOfficeId = user?.headOfficeId ?? user?.headOffice?.id ?? null
  const headOfficeName = user?.headOfficeName ?? user?.headOffice?.name ?? null
  const schoolId = pickSchoolId(user)
  const schoolName = pickSchoolName(user)
  const userId = user?.userId ?? user?.id ?? null
  const teacherContext = user?.teacherContext ?? user?.teacher ?? null
  const studentId = user?.studentId ?? user?.student?.id ?? null
  const studentClassId = user?.classId ?? user?.student?.classId ?? user?.student?.schoolClassId ?? user?.student?.schoolClass?.id ?? null
  const studentSectionId = user?.sectionId ?? user?.student?.sectionId ?? user?.student?.schoolSectionId ?? user?.student?.schoolSection?.id ?? null
  const parentChildren = useMemo(() => pickChildren(user), [user])

  const [selectedChildId, setSelectedChildIdState] = useState(() => {
    try {
      const stored = localStorage.getItem(CHILD_KEY)
      return stored && String(stored).trim() ? String(stored) : null
    } catch {
      return null
    }
  })

  const setSelectedChildId = useCallback((childId) => {
    const v = childId == null ? null : String(childId)
    setSelectedChildIdState(v)
    try {
      if (v == null) localStorage.removeItem(CHILD_KEY)
      else localStorage.setItem(CHILD_KEY, v)
    } catch {
      // ignore
    }
  }, [])

  const [generalSettings, setGeneralSettings] = useState(null)

  const refreshGeneralSettings = useCallback(async () => {
    if (!schoolId) {
      setGeneralSettings(null)
      return
    }
    if (role === 'SCHOOL_ADMIN' || role === 'TEACHER' || role === 'STUDENT' || role === 'PARENT') {
      setGeneralSettings(null)
      return
    }
    try {
      const data = await fetchGeneralSettings({
        headOfficeId: role === 'HEAD_OFFICE_ADMIN' ? headOfficeId : null,
        schoolId,
      })
      const nextGeneralSettings = pickFirstGeneralSetting(data)
      if (nextGeneralSettings) setGeneralSettings(nextGeneralSettings)
      else setGeneralSettings(null)
    } catch (error) {
      if (error?.status === 403) return
      // ignore
    }
  }, [schoolId, headOfficeId, role])

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshGeneralSettings()
    }, 0)
    return () => clearTimeout(timer)
  }, [refreshGeneralSettings])

  useEffect(() => {
    const handler = () => {
      void refreshGeneralSettings()
    }
    window.addEventListener('sm:general-settings-refresh', handler)
    return () => window.removeEventListener('sm:general-settings-refresh', handler)
  }, [refreshGeneralSettings])

  useEffect(() => {
    const faviconUrl = generalSettings?.faviconIcon
    if (faviconUrl) {
      let link = document.querySelector("link[rel~='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.getElementsByTagName('head')[0].appendChild(link)
      }
      link.href = faviconUrl
    }
  }, [generalSettings])

  useEffect(() => {
    const title = generalSettings?.brandTitle || generalSettings?.brandName
    if (title) {
      document.title = title
    }
  }, [generalSettings])

  const refreshMe = useCallback(async () => {
    const t = getToken()
    if (!t) {
      setTokenState(null)
      setUser(null)
      writeJson(USER_KEY, null)
      setPagePermissions({})
      setIsSuperAdminRole(false)
      writeJson('sm_page_perms', null)
      setStatus('ready')
      return null
    }
    setStatus('loading')
    try {
      const meResult = await meApi()
      const nextUser = meResult || null
      setTokenState(t)
      setUser(nextUser)
      writeJson(USER_KEY, nextUser)

      if (nextUser) {
        try {
          const pp = await fetchMyPagePermissions()
          if (pp?.superAdmin) {
            setIsSuperAdminRole(true)
            setPagePermissions({})
            writeJson('sm_page_perms', { superAdmin: true })
          } else {
            setIsSuperAdminRole(false)
            const normalizedPermissions = normalizePagePermissionsMap(pp)
            setPagePermissions(normalizedPermissions)
            writeJson('sm_page_perms', normalizedPermissions)
          }
        } catch (e) {
          console.error('Failed to fetch page permissions', e)
        }
      } else {
        setPagePermissions({})
        setIsSuperAdminRole(false)
        writeJson('sm_page_perms', null)
      }

      setStatus('ready')
      return nextUser
    } catch {
      setToken(null)
      setTokenState(null)
      setUser(null)
      writeJson(USER_KEY, null)
      setPagePermissions({})
      setIsSuperAdminRole(false)
      writeJson('sm_page_perms', null)
      setStatus('ready')
      return null
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshMe()
    }, 0)
    return () => clearTimeout(timer)
  }, [refreshMe])

  useEffect(() => {
    const handler = () => {
      void refreshMe()
    }
    window.addEventListener('sm:auth-refresh', handler)
    return () => window.removeEventListener('sm:auth-refresh', handler)
  }, [refreshMe])

  useEffect(() => {
    if (role !== 'PARENT') return

    const children = Array.isArray(parentChildren) ? parentChildren : []
    if (children.length === 0) {
      if (selectedChildId != null) {
        const timer = setTimeout(() => {
          setSelectedChildId(null)
        }, 0)
        return () => clearTimeout(timer)
      }
      return
    }

    const selectedExists = selectedChildId != null && children.some((child) => String(getParentChildId(child) || '') === String(selectedChildId))

    if (selectedExists) return

    if (children.length === 1) {
      const firstChildId = getParentChildId(children[0])
      if (firstChildId != null) {
        const timer = setTimeout(() => {
          setSelectedChildId(firstChildId)
        }, 0)
        return () => clearTimeout(timer)
      }
    }

    if (selectedChildId != null) {
      const timer = setTimeout(() => {
        setSelectedChildId(null)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [parentChildren, role, selectedChildId, setSelectedChildId])

  const parentChildScope = useMemo(
    () => getParentChildScope(parentChildren, selectedChildId),
    [parentChildren, selectedChildId],
  )

  const login = useCallback(async ({ username, password, remember = true }) => {
    const result = await loginApi(username, password)
    const jwt = result?.token || result?.accessToken || result?.jwt || null
    if (!jwt) throw new Error('Login succeeded but no token returned')
    setToken(jwt, remember)
    setTokenState(jwt)
    const nextUser = await refreshMe()
    return { token: jwt, user: nextUser }
  }, [refreshMe])

  const logout = useCallback(async () => {
    try {
      await logoutApi()
    } catch {
      // ignore
    }
    setToken(null)
    setTokenState(null)
    setUser(null)
    writeJson(USER_KEY, null)
    setPagePermissions({})
    setIsSuperAdminRole(false)
    writeJson('sm_page_perms', null)
    setSelectedChildId(null)
  }, [setSelectedChildId])

  const canView = useCallback((slug) => {
    const key = normalizePagePermissionSlug(slug)
    if (isSuperAdminRole) return true
    if (!pagePermissions || Object.keys(pagePermissions).length === 0) return true
    const perms = pagePermissions[key]
    if (!perms) return true
    return perms.view === true
  }, [isSuperAdminRole, pagePermissions])

  const canAdd = useCallback((slug) => {
    const key = normalizePagePermissionSlug(slug)
    if (isSuperAdminRole) return true
    if (!pagePermissions || Object.keys(pagePermissions).length === 0) return true
    const perms = pagePermissions[key]
    if (!perms) return true
    return perms.add === true
  }, [isSuperAdminRole, pagePermissions])

  const canEdit = useCallback((slug) => {
    const key = normalizePagePermissionSlug(slug)
    if (isSuperAdminRole) return true
    if (!pagePermissions || Object.keys(pagePermissions).length === 0) return true
    const perms = pagePermissions[key]
    if (!perms) return true
    return perms.edit === true
  }, [isSuperAdminRole, pagePermissions])

  const canDelete = useCallback((slug) => {
    const key = normalizePagePermissionSlug(slug)
    if (isSuperAdminRole) return true
    if (!pagePermissions || Object.keys(pagePermissions).length === 0) return true
    const perms = pagePermissions[key]
    if (!perms) return true
    return perms.delete === true
  }, [isSuperAdminRole, pagePermissions])

  const value = useMemo(
    () => ({
      status,
      token,
      user,
      role,
      permissions,
      headOfficeId,
      headOfficeName,
      schoolId,
      schoolName,
      userId,
      teacherContext,
      studentId,
      studentClassId,
      studentSectionId,
      parentChildren,
      selectedChildId,
      ...parentChildScope,
      setSelectedChildId,
      refreshMe,
      login,
      logout,
      generalSettings,
      refreshGeneralSettings,
      pagePermissions,
      isSuperAdminRole,
      canView,
      canAdd,
      canEdit,
      canDelete,
    }),
    [
      status,
      token,
      user,
      role,
      permissions,
      headOfficeId,
      headOfficeName,
      schoolId,
      schoolName,
      userId,
      teacherContext,
      studentId,
      studentClassId,
      studentSectionId,
      parentChildren,
      selectedChildId,
      parentChildScope,
      setSelectedChildId,
      refreshMe,
      login,
      logout,
      generalSettings,
      refreshGeneralSettings,
      pagePermissions,
      isSuperAdminRole,
      canView,
      canAdd,
      canEdit,
      canDelete,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// useAuth moved to `src/context/useAuth.js` (Fast Refresh rule compliance).
