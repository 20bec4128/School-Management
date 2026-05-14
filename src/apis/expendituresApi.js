import apiClient from './apiClient'

export const fetchExpenditures = async ({ schoolId } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  const query = qs.toString()
  const response = await apiClient.get(query ? `/api/expenditures?${query}` : '/api/expenditures')
  return response.data
}

export const fetchExpendituresPage = async ({ schoolId, expenditureHeadId, expenditureMethod, page = 0, size = 10, search = '' } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  if (expenditureHeadId != null && String(expenditureHeadId).trim() !== '') qs.set('expenditureHeadId', String(expenditureHeadId))
  if (expenditureMethod != null && String(expenditureMethod).trim() !== '' && String(expenditureMethod) !== 'Select') qs.set('expenditureMethod', String(expenditureMethod))
  if (search) qs.set('search', search)
  qs.set('page', String(page))
  qs.set('size', String(size))
  const response = await apiClient.get(`/api/expenditures/page?${qs.toString()}`)
  return response.data
}

export const createExpenditure = async (payload) => {
  const response = await apiClient.post('/api/expenditures', payload)
  return response.data
}

export const updateExpenditure = async (id, payload) => {
  const response = await apiClient.put(`/api/expenditures/${id}`, payload)
  return response.data
}

export const deleteExpenditure = async (id) => {
  const response = await apiClient.delete(`/api/expenditures/${id}`)
  return response.data
}
