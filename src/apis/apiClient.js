const TOKEN_KEY = 'sm_token'
const SESSION_TOKEN_KEY = 'sm_token_session'
const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').trim()

export const setToken = (token, remember = true) => {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(SESSION_TOKEN_KEY)
    return
  }
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token)
    sessionStorage.removeItem(SESSION_TOKEN_KEY)
  } else {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token)
    localStorage.removeItem(TOKEN_KEY)
  }
}

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(SESSION_TOKEN_KEY) || null
}

export const apiUrl = (path) => {
  if (!path) return path
  if (/^(?:https?:)?\/\//i.test(path)) return path
  if (!API_BASE_URL) return path
  try {
    return new URL(path, API_BASE_URL).toString()
  } catch {
    return path
  }
}

export const apiFetch = async (url, options = {}) => {
  const token = getToken()
  const resolvedUrl = apiUrl(url)
  const headers = new Headers(options.headers || {})
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  // Default to not sending cookies (prevents "auto-login" via lingering backend session cookies).
  // If a specific endpoint truly needs cookies, pass `credentials: 'include'` explicitly.
  const credentials = options.credentials ?? 'omit'
  return fetch(resolvedUrl, { ...options, headers, credentials })
}
