import apiClient from './apiClient'

const appendParam = (params, key, value) => {
  if (value == null) return
  const text = String(value).trim()
  if (!text || text === 'Select') return
  params.set(key, text)
}

export const fetchMarkSendSmsList = async ({
  headOfficeId,
  schoolId,
  examTerm,
  receiverType,
  receiver,
  template,
  gateway,
  search = '',
} = {}) => {
  const params = new URLSearchParams()
  appendParam(params, 'headOfficeId', headOfficeId)
  appendParam(params, 'schoolId', schoolId)
  appendParam(params, 'examTerm', examTerm)
  appendParam(params, 'receiverType', receiverType)
  appendParam(params, 'receiver', receiver)
  appendParam(params, 'template', template)
  appendParam(params, 'gateway', gateway)
  appendParam(params, 'search', search)

  const query = params.toString()
  const url = query ? `/api/mark-send-sms?${query}` : '/api/mark-send-sms'
  const { data } = await apiClient.get(url)
  return data
}

export const fetchMarkSendSmsPage = async ({
  headOfficeId,
  schoolId,
  examTerm,
  receiverType,
  receiver,
  template,
  gateway,
  search = '',
  page = 0,
  size = 10,
} = {}) => {
  const params = {
    page: String(page),
    size: String(size),
  }
  if (search != null && String(search).trim() !== '') params.search = String(search).trim()
  if (headOfficeId != null && String(headOfficeId).trim() !== '' && String(headOfficeId) !== 'Select') params.headOfficeId = String(headOfficeId)
  if (schoolId != null && String(schoolId).trim() !== '' && String(schoolId) !== 'Select') params.schoolId = String(schoolId)
  if (examTerm != null && String(examTerm).trim() !== '' && String(examTerm) !== 'Select') params.examTerm = String(examTerm)
  if (receiverType != null && String(receiverType).trim() !== '' && String(receiverType) !== 'Select') params.receiverType = String(receiverType)
  if (receiver != null && String(receiver).trim() !== '' && String(receiver) !== 'Select') params.receiver = String(receiver)
  if (template != null && String(template).trim() !== '' && String(template) !== 'Select') params.template = String(template)
  if (gateway != null && String(gateway).trim() !== '' && String(gateway) !== 'Select') params.gateway = String(gateway)

  const { data } = await apiClient.get('/api/mark-send-sms/page', { params })
  return data
}

export const fetchMarkSendSmsById = async (id) => {
  const { data } = await apiClient.get(`/api/mark-send-sms/${id}`)
  return data
}

export const createMarkSendSms = async (payload) => {
  const { data } = await apiClient.post('/api/mark-send-sms', payload)
  return data
}

export const updateMarkSendSms = async (id, payload) => {
  const { data } = await apiClient.put(`/api/mark-send-sms/${id}`, payload)
  return data
}

export const deleteMarkSendSms = async (id) => {
  const { data } = await apiClient.delete(`/api/mark-send-sms/${id}`)
  return data
}
