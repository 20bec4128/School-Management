import apiClient from './apiClient'

export const fetchPaymentSettings = async ({ headOfficeId, schoolId } = {}) => {
  const params = new URLSearchParams()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') params.set('headOfficeId', String(headOfficeId))
  if (schoolId != null && String(schoolId).trim() !== '') params.set('schoolId', String(schoolId))

  const query = params.toString()
  const url = query ? `/api/payment-settings?${query}` : '/api/payment-settings'
  const { data } = await apiClient.get(url)
  return data
}

export const fetchPaymentSettingsPage = async ({ headOfficeId, schoolId, page = 0, size = 10, search = '' } = {}) => {
  const params = {
    page: String(page),
    size: String(size),
  }
  if (search != null && String(search).trim() !== '') params.search = String(search).trim()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') params.headOfficeId = String(headOfficeId)
  if (schoolId != null && String(schoolId).trim() !== '') params.schoolId = String(schoolId)

  const { data } = await apiClient.get('/api/payment-settings/page', { params })
  return data
}

export const fetchPaymentSettingById = async (id) => {
  const { data } = await apiClient.get(`/api/payment-settings/${id}`)
  return data
}

export const createPaymentSetting = async (payload) => {
  const { data } = await apiClient.post('/api/payment-settings', payload)
  return data
}

export const updatePaymentSetting = async (id, payload) => {
  const { data } = await apiClient.put(`/api/payment-settings/${id}`, payload)
  return data
}

export const deletePaymentSetting = async (id) => {
  const { data } = await apiClient.delete(`/api/payment-settings/${id}`)
  return data
}
