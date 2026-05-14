import apiClient from './apiClient'

export const fetchFeeCollections = async () => {
  const response = await apiClient.get('/api/fee-collections')
  return response.data
}

export const fetchFeeCollectionsBySchool = async (schoolId) => {
  const response = await apiClient.get(`/api/fee-collections/school/${schoolId}`)
  return response.data
}

export const createFeeCollection = async (payload) => {
  const response = await apiClient.post('/api/fee-collections', payload)
  return response.data
}

export const updateFeeCollection = async (id, payload) => {
  const response = await apiClient.put(`/api/fee-collections/${id}`, payload)
  return response.data
}

export const deleteFeeCollection = async (id) => {
  const response = await apiClient.delete(`/api/fee-collections/${id}`)
  return response.data
}
