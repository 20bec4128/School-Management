import apiClient from './apiClient'

export const fetchComplains = async (schoolId) => {
  const response = await apiClient.get(`/api/complains/school/${schoolId}`)
  return response.data
}

export const createComplain = async (data) => {
  const response = await apiClient.post('/api/complains', data)
  return response.data
}

export const updateComplain = async (id, data) => {
  const response = await apiClient.put(`/api/complains/${id}`, data)
  return response.data
}

export const deleteComplain = async (id) => {
  const response = await apiClient.delete(`/api/complains/${id}`)
  return response.data
}
