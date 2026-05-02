const USER_KEY = 'sm_user'

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export const getCurrentRole = () => {
  const user = getCurrentUser()
  return String(user?.role || user?.userRole || user?.authority || '').toUpperCase()
}

