import apiClient from './apiClient'

export const fetchGeneralSettings = async ({ headOfficeId, schoolId } = {}) => {
  const params = new URLSearchParams()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') params.set('headOfficeId', String(headOfficeId))
  if (schoolId != null && String(schoolId).trim() !== '') params.set('schoolId', String(schoolId))

  const query = params.toString()
  const url = query ? `/api/general-settings?${query}` : '/api/general-settings'
  const { data } = await apiClient.get(url)
  return data
}

export const fetchGeneralSettingById = async (id) => {
  const { data } = await apiClient.get(`/api/general-settings/${id}`)
  return data
}

export const fetchGeneralSettingBySchoolId = async (schoolId) => {
  const { data } = await apiClient.get(`/api/general-settings/school/${schoolId}`)
  return data
}

export const saveGeneralSetting = async (payload) => {
  const { data } = await apiClient.post('/api/general-settings/save', payload)
  return data
}

export const deleteGeneralSetting = async (id) => {
  const { data } = await apiClient.delete(`/api/general-settings/${id}`)
  return data
}
