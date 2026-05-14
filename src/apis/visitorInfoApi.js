import apiClient from './apiClient'

export const fetchVisitorInfos = async (schoolId) => {
  const response = await apiClient.get(`/api/visitor-infos/school/${schoolId}`)
  return response.data
}

export const createVisitorInfo = async (data) => {
  const response = await apiClient.post('/api/visitor-infos', data)
  return response.data
}

export const updateVisitorInfo = async (id, data) => {
  const response = await apiClient.put(`/api/visitor-infos/${id}`, data)
  return response.data
}

export const deleteVisitorInfo = async (id) => {
  const response = await apiClient.delete(`/api/visitor-infos/${id}`)
  return response.data
}
