import apiClient from './apiClient'

export const fetchIncomes = async ({ schoolId } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  const query = qs.toString()
  const response = await apiClient.get(query ? `/api/incomes?${query}` : '/api/incomes')
  return response.data
}

export const fetchIncomesPage = async ({
  schoolId,
  incomeHeadId,
  incomeMethod,
  startDate,
  endDate,
  page = 0,
  size = 10,
  search = '',
} = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  if (incomeHeadId != null && String(incomeHeadId).trim() !== '') qs.set('incomeHeadId', String(incomeHeadId))
  if (incomeMethod != null && String(incomeMethod).trim() !== '' && String(incomeMethod) !== 'Select') qs.set('incomeMethod', String(incomeMethod))
  if (startDate) qs.set('startDate', String(startDate))
  if (endDate) qs.set('endDate', String(endDate))
  if (search) qs.set('search', search)
  qs.set('page', String(page))
  qs.set('size', String(size))
  const response = await apiClient.get(`/api/incomes/page?${qs.toString()}`)
  return response.data
}

export const createIncome = async (payload) => {
  const response = await apiClient.post('/api/incomes', payload)
  return response.data
}

export const updateIncome = async (id, payload) => {
  const response = await apiClient.put(`/api/incomes/${id}`, payload)
  return response.data
}

export const deleteIncome = async (id) => {
  const response = await apiClient.delete(`/api/incomes/${id}`)
  return response.data
}
