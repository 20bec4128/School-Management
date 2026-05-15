import apiClient from './apiClient'

export const fetchExpenditureHeads = async ({ schoolId } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  const query = qs.toString()
  const response = await apiClient.get(query ? `/api/expenditure-heads?${query}` : '/api/expenditure-heads')
  return response.data
}

export const fetchExpenditureHeadsPage = async ({ schoolId, page = 0, size = 10, search = '' } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  if (search) qs.set('search', search)
  qs.set('page', String(page))
  qs.set('size', String(size))
  const response = await apiClient.get(`/api/expenditure-heads/page?${qs.toString()}`)
  return response.data
}

export const createExpenditureHead = async (payload) => {
  const response = await apiClient.post('/api/expenditure-heads', payload)
  return response.data
}

export const updateExpenditureHead = async (id, payload) => {
  const response = await apiClient.put(`/api/expenditure-heads/${id}`, payload)
  return response.data
}

export const deleteExpenditureHead = async (id) => {
  const response = await apiClient.delete(`/api/expenditure-heads/${id}`)
  return response.data
}
