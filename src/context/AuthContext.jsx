import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { login as loginApi, logout as logoutApi, me as meApi } from '../apis/authApi'
import { getToken, setToken } from '../apis/apiClient'
import { normalizeRole } from '../utils/roles'

const USER_KEY = 'sm_user'
const CHILD_KEY = 'sm_selected_child_id'

const AuthContext = createContext(null)

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

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => getToken())
  const [user, setUser] = useState(() => readJson(USER_KEY))
  const [status, setStatus] = useState('idle') // idle | loading | ready

  const permissions = useMemo(() => pickPermissions(user), [user])
  const role = useMemo(() => normalizeRole(user?.role || user?.userRole || user?.authority), [user])
  const schoolId = user?.schoolId ?? user?.school?.id ?? null
  const userId = user?.userId ?? user?.id ?? null
  const teacherContext = user?.teacherContext ?? user?.teacher ?? null
  const studentId = user?.studentId ?? user?.student?.id ?? null
  const parentChildren = useMemo(() => pickChildren(user), [user])

  const [selectedChildId, setSelectedChildIdState] = useState(() => {
    try {
      return localStorage.getItem(CHILD_KEY) || null
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

  const refreshMe = useCallback(async () => {
    const t = getToken()
    if (!t) {
      setTokenState(null)
      setUser(null)
      writeJson(USER_KEY, null)
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
      setStatus('ready')
      return nextUser
    } catch {
      setToken(null)
      setTokenState(null)
      setUser(null)
      writeJson(USER_KEY, null)
      setStatus('ready')
      return null
    }
  }, [])

  useEffect(() => {
    void refreshMe()
  }, [refreshMe])

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
    setSelectedChildId(null)
  }, [setSelectedChildId])

  const value = useMemo(
    () => ({
      status,
      token,
      user,
      role,
      permissions,
      schoolId,
      userId,
      teacherContext,
      studentId,
      parentChildren,
      selectedChildId,
      setSelectedChildId,
      refreshMe,
      login,
      logout,
    }),
    [
      status,
      token,
      user,
      role,
      permissions,
      schoolId,
      userId,
      teacherContext,
      studentId,
      parentChildren,
      selectedChildId,
      setSelectedChildId,
      refreshMe,
      login,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
