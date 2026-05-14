import apiClient from './apiClient'

export const fetchVisitorPurposes = async (schoolId) => {
  const response = await apiClient.get(`/api/visitor-purposes/school/${schoolId}`)
  return response.data
}

export const createVisitorPurpose = async (data) => {
  const response = await apiClient.post('/api/visitor-purposes', data)
  return response.data
}

export const updateVisitorPurpose = async (id, data) => {
  const response = await apiClient.put(`/api/visitor-purposes/${id}`, data)
  return response.data
}

export const deleteVisitorPurpose = async (id) => {
  const response = await apiClient.delete(`/api/visitor-purposes/${id}`)
  return response.data
}
