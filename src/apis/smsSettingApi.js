import apiClient from './apiClient'

export const fetchSmsSettings = async ({ headOfficeId, schoolId } = {}) => {
  const params = new URLSearchParams()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') params.set('headOfficeId', String(headOfficeId))
  if (schoolId != null && String(schoolId).trim() !== '') params.set('schoolId', String(schoolId))

  const query = params.toString()
  const url = query ? `/api/sms-settings?${query}` : '/api/sms-settings'
  const { data } = await apiClient.get(url)
  return data
}

export const fetchSmsSettingsPage = async ({ headOfficeId, schoolId, page = 0, size = 10, search = '' } = {}) => {
  const params = {
    page: String(page),
    size: String(size),
  }
  if (search != null && String(search).trim() !== '') params.search = String(search).trim()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') params.headOfficeId = String(headOfficeId)
  if (schoolId != null && String(schoolId).trim() !== '') params.schoolId = String(schoolId)

  const { data } = await apiClient.get('/api/sms-settings/page', { params })
  return data
}

export const fetchSmsSettingById = async (id) => {
  const { data } = await apiClient.get(`/api/sms-settings/${id}`)
  return data
}

export const createSmsSetting = async (payload) => {
  const { data } = await apiClient.post('/api/sms-settings', payload)
  return data
}

export const updateSmsSetting = async (id, payload) => {
  const { data } = await apiClient.put(`/api/sms-settings/${id}`, payload)
  return data
}

export const deleteSmsSetting = async (id) => {
  const { data } = await apiClient.delete(`/api/sms-settings/${id}`)
  return data
}
