import apiClient from './apiClient'

export const fetchMarkSendEmails = async ({ headOfficeId, schoolId } = {}) => {
  const params = new URLSearchParams()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') params.set('headOfficeId', String(headOfficeId))
  if (schoolId != null && String(schoolId).trim() !== '') params.set('schoolId', String(schoolId))

  const query = params.toString()
  const url = query ? `/api/mark-send-emails?${query}` : '/api/mark-send-emails'
  const { data } = await apiClient.get(url)
  return data
}

export const fetchMarkSendEmailsPage = async ({ headOfficeId, schoolId, page = 0, size = 10, search = '' } = {}) => {
  const params = {
    page: String(page),
    size: String(size),
  }
  if (search != null && String(search).trim() !== '') params.search = String(search).trim()
  if (headOfficeId != null && String(headOfficeId).trim() !== '') params.headOfficeId = String(headOfficeId)
  if (schoolId != null && String(schoolId).trim() !== '') params.schoolId = String(schoolId)

  const { data } = await apiClient.get('/api/mark-send-emails/page', { params })
  return data
}

export const fetchMarkSendEmailById = async (id) => {
  const { data } = await apiClient.get(`/api/mark-send-emails/${id}`)
  return data
}

export const createMarkSendEmail = async (payload) => {
  const { data } = await apiClient.post('/api/mark-send-emails', payload)
  return data
}

export const updateMarkSendEmail = async (id, payload) => {
  const { data } = await apiClient.put(`/api/mark-send-emails/${id}`, payload)
  return data
}

export const deleteMarkSendEmail = async (id) => {
  const { data } = await apiClient.delete(`/api/mark-send-emails/${id}`)
  return data
}
