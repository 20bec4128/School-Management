import apiClient from './apiClient'

export const fetchEmails = async ({ headOfficeId, schoolId } = {}) => {
  const params = new URLSearchParams()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') params.set('headOfficeId', String(headOfficeId))
  if (schoolId != null && String(schoolId).trim() !== '') params.set('schoolId', String(schoolId))

  const query = params.toString()
  const url = query ? `/api/emails?${query}` : '/api/emails'
  const { data } = await apiClient.get(url)
  return data
}

export const fetchEmailsPage = async ({ headOfficeId, schoolId, page = 0, size = 10, search = '' } = {}) => {
  const params = {
    page: String(page),
    size: String(size),
  }
  if (search != null && String(search).trim() !== '') params.search = String(search).trim()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') params.headOfficeId = String(headOfficeId)
  if (schoolId != null && String(schoolId).trim() !== '') params.schoolId = String(schoolId)

  const { data } = await apiClient.get('/api/emails/page', { params })
  return data
}

export const fetchEmailById = async (id) => {
  const { data } = await apiClient.get(`/api/emails/${id}`)
  return data
}

export const createEmail = async (payload) => {
  const { data } = await apiClient.post('/api/emails', payload)
  return data
}

export const updateEmail = async (id, payload) => {
  const { data } = await apiClient.put(`/api/emails/${id}`, payload)
  return data
}

export const deleteEmail = async (id) => {
  const { data } = await apiClient.delete(`/api/emails/${id}`)
  return data
}
