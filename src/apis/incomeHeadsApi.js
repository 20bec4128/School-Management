import apiClient from './apiClient'

export const fetchIncomeHeads = async ({ schoolId } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  const query = qs.toString()
  const response = await apiClient.get(query ? `/api/income-heads?${query}` : '/api/income-heads')
  return response.data
}

export const fetchIncomeHeadsPage = async ({ schoolId, page = 0, size = 10, search = '' } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  if (search) qs.set('search', search)
  qs.set('page', String(page))
  qs.set('size', String(size))
  const response = await apiClient.get(`/api/income-heads/page?${qs.toString()}`)
  return response.data
}

export const createIncomeHead = async (payload) => {
  const response = await apiClient.post('/api/income-heads', payload)
  return response.data
}

export const updateIncomeHead = async (id, payload) => {
  const response = await apiClient.put(`/api/income-heads/${id}`, payload)
  return response.data
}

export const deleteIncomeHead = async (id) => {
  const response = await apiClient.delete(`/api/income-heads/${id}`)
  return response.data
}
