import apiClient from './apiClient'

export const fetchCallLogs = async (schoolId) => {
  const response = await apiClient.get(`/api/call-logs/school/${schoolId}`)
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
