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

const parseJsonSafe = async (response) => {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('application/json')) return null
  try {
    return await response.json()
  } catch {
    return null
  }
}

const request = async (method, url, data, config = {}) => {
  const headers = new Headers(config.headers || {})

  const options = {
    ...config,
    method,
    headers,
  }

  if (data !== undefined) {
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    options.body = typeof data === 'string' ? data : JSON.stringify(data)
  }

  const response = await apiFetch(url, options)
  const body = await parseJsonSafe(response)

  if (!response.ok) {
    const error = new Error(body?.message || `Request failed (${response.status})`)
    error.status = response.status
    error.data = body
    throw error
  }

  return { data: body }
}

const apiClient = {
  get: (url, config) => request('GET', url, undefined, config),
  post: (url, data, config) => request('POST', url, data, config),
  put: (url, data, config) => request('PUT', url, data, config),
  delete: (url, config) => request('DELETE', url, undefined, config),
}

export default apiClient
