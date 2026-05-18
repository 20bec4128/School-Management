import apiClient from './apiClient'

export const fetchCallLogs = async (schoolId) => {
  const response = await apiClient.get(`/api/call-logs/school/${schoolId}`)
  return response.data
}

export const fetchCallLogsPage = async ({ schoolId, search = '', callType = '', page = 0, size = 10 } = {}) => {
  const qs = new URLSearchParams({
    schoolId: String(schoolId),
    page: String(Math.max(0, page)),
    size: String(Math.max(1, size)),
  })
  const q = String(search || '').trim()
  if (q) qs.set('search', q)
  const type = String(callType || '').trim()
  if (type) qs.set('callType', type)
  const response = await apiClient.get(`/api/call-logs/page?${qs.toString()}`)
  return response.data
}

export const createCallLog = async (data) => {
  const response = await apiClient.post('/api/call-logs', data)
  return response.data
}

export const updateCallLog = async (id, data) => {
  const response = await apiClient.put(`/api/call-logs/${id}`, data)
  return response.data
}

export const deleteCallLog = async (id) => {
  const response = await apiClient.delete(`/api/call-logs/${id}`)
  return response.data
}
