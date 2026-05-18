import apiClient from './apiClient'

export const fetchResultSmsList = async ({ headOfficeId, schoolId } = {}) => {
  const params = new URLSearchParams()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') params.set('headOfficeId', String(headOfficeId))
  if (schoolId != null && String(schoolId).trim() !== '') params.set('schoolId', String(schoolId))

  const query = params.toString()
  const url = query ? `/api/result-sms?${query}` : '/api/result-sms'
  const { data } = await apiClient.get(url)
  return data
}

export const fetchResultSmsPage = async ({ headOfficeId, schoolId, page = 0, size = 10, search = '' } = {}) => {
  const params = {
    page: String(page),
    size: String(size),
  }
  if (search != null && String(search).trim() !== '') params.search = String(search).trim()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') params.headOfficeId = String(headOfficeId)
  if (schoolId != null && String(schoolId).trim() !== '') params.schoolId = String(schoolId)

  const { data } = await apiClient.get('/api/result-sms/page', { params })
  return data
}

export const fetchResultSmsById = async (id) => {
  const { data } = await apiClient.get(`/api/result-sms/${id}`)
  return data
}

export const createResultSms = async (payload) => {
  const { data } = await apiClient.post('/api/result-sms', payload)
  return data
}

export const updateResultSms = async (id, payload) => {
  const { data } = await apiClient.put(`/api/result-sms/${id}`, payload)
  return data
}

export const deleteResultSms = async (id) => {
  const { data } = await apiClient.delete(`/api/result-sms/${id}`)
  return data
}
