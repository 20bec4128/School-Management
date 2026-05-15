import apiClient from './apiClient'

export const fetchFeeCollections = async () => {
  const response = await apiClient.get('/api/fee-collections')
  return response.data
}

export const fetchFeeCollectionsBySchool = async (schoolId) => {
  const response = await apiClient.get(`/api/fee-collections/school/${schoolId}`)
  return response.data
}

export const fetchFeeCollectionsPage = async ({ schoolId, classId, feeTypeId, status, month, search = '', page = 0, size = 10 } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  if (classId != null && String(classId).trim() !== '') qs.set('classId', String(classId))
  if (feeTypeId != null && String(feeTypeId).trim() !== '') qs.set('feeTypeId', String(feeTypeId))
  if (status != null && String(status).trim() !== '' && String(status) !== 'Select') qs.set('status', String(status))
  if (month != null && String(month).trim() !== '' && String(month) !== 'Select') qs.set('month', String(month))
  if (search) qs.set('search', search)
  qs.set('page', String(page))
  qs.set('size', String(size))
  const response = await apiClient.get(`/api/fee-collections/page?${qs.toString()}`)
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
