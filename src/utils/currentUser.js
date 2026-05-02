const USER_KEY = 'sm_user'

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
    return JSON.parse(raw || 'null')
  } catch {
    return null
  }
}

export const getCurrentRole = () => {
  const user = getCurrentUser()
  return String(user?.role || user?.userRole || user?.authority || '').toUpperCase()
}
