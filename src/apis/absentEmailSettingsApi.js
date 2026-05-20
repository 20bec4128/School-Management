import apiClient from './apiClient'

export const fetchAbsentEmailSettings = async ({ headOfficeId, schoolId } = {}) => {
  const params = {}
  if (headOfficeId != null && String(headOfficeId).trim() !== '') params.headOfficeId = String(headOfficeId)
  if (schoolId != null && String(schoolId).trim() !== '') params.schoolId = String(schoolId)
  const { data } = await apiClient.get('/api/absent-email-settings', { params })
  return Array.isArray(data) ? data : []
}

export const createAbsentEmailSetting = async (payload) => {
  const { data } = await apiClient.post('/api/absent-email-settings', payload)
  return data
}

export const updateAbsentEmailSetting = async (id, payload) => {
  const { data } = await apiClient.put(`/api/absent-email-settings/${id}`, payload)
  return data
}

export const deleteAbsentEmailSetting = async (id) => {
  const { data } = await apiClient.delete(`/api/absent-email-settings/${id}`)
  return data
}

