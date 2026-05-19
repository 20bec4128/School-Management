import apiClient from './apiClient'

export const fetchSalaryPayments = async ({ headOfficeId, schoolId } = {}) => {
  const qs = new URLSearchParams()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') qs.set('headOfficeId', String(headOfficeId))
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  const query = qs.toString()
  const response = await apiClient.get(query ? `/api/salary-payments?${query}` : '/api/salary-payments')
  return response.data
}

export const fetchSalaryPaymentsPage = async ({
  headOfficeId,
  schoolId,
  month,
  gradeName,
  salaryType,
  status,
  page = 0,
  size = 10,
  search = '',
} = {}) => {
  const qs = new URLSearchParams()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') qs.set('headOfficeId', String(headOfficeId))
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  if (month != null && String(month).trim() !== '' && String(month) !== 'Select') qs.set('month', String(month))
  if (gradeName != null && String(gradeName).trim() !== '' && String(gradeName) !== 'Select') qs.set('gradeName', String(gradeName))
  if (salaryType != null && String(salaryType).trim() !== '' && String(salaryType) !== 'Select') qs.set('salaryType', String(salaryType))
  if (status != null && String(status).trim() !== '' && String(status) !== 'Select') qs.set('status', String(status))
  if (search) qs.set('search', search)
  qs.set('page', String(page))
  qs.set('size', String(size))
  const response = await apiClient.get(`/api/salary-payments/page?${qs.toString()}`)
  return response.data
}

export const createSalaryPayment = async (payload) => {
  const response = await apiClient.post('/api/salary-payments', payload)
  return response.data
}

export const updateSalaryPayment = async (id, payload) => {
  const response = await apiClient.put(`/api/salary-payments/${id}`, payload)
  return response.data
}

export const deleteSalaryPayment = async (id) => {
  const response = await apiClient.delete(`/api/salary-payments/${id}`)
  return response.data
}
