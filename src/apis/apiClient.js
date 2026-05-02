const TOKEN_KEY = 'sm_token'
const SESSION_TOKEN_KEY = 'sm_token_session'

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

export const apiFetch = async (url, options = {}) => {
  const token = getToken()
  const headers = new Headers(options.headers || {})
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  // Default to not sending cookies (prevents "auto-login" via lingering backend session cookies).
  // If a specific endpoint truly needs cookies, pass `credentials: 'include'` explicitly.
  const credentials = options.credentials ?? 'omit'
  return fetch(url, { ...options, headers, credentials })
}
