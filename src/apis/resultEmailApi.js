import apiClient from './apiClient'

export const fetchResultEmails = async ({ headOfficeId, schoolId } = {}) => {
  const params = new URLSearchParams()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') params.set('headOfficeId', String(headOfficeId))
  if (schoolId != null && String(schoolId).trim() !== '') params.set('schoolId', String(schoolId))

  const query = params.toString()
  const url = query ? `/api/result-emails?${query}` : '/api/result-emails'
  const { data } = await apiClient.get(url)
  return data
}

export const fetchResultEmailsPage = async ({ headOfficeId, schoolId, page = 0, size = 10, search = '' } = {}) => {
  const params = {
    page: String(page),
    size: String(size),
  }
  if (search != null && String(search).trim() !== '') params.search = String(search).trim()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') params.headOfficeId = String(headOfficeId)
  if (schoolId != null && String(schoolId).trim() !== '') params.schoolId = String(schoolId)

  const { data } = await apiClient.get('/api/result-emails/page', { params })
  return data
}

export const fetchResultEmailById = async (id) => {
  const { data } = await apiClient.get(`/api/result-emails/${id}`)
  return data
}

export const createResultEmail = async (payload) => {
  const { data } = await apiClient.post('/api/result-emails', payload)
  return data
}

export const updateResultEmail = async (id, payload) => {
  const { data } = await apiClient.put(`/api/result-emails/${id}`, payload)
  return data
}

export const deleteResultEmail = async (id) => {
  const { data } = await apiClient.delete(`/api/result-emails/${id}`)
  return data
}
