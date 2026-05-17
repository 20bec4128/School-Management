import apiClient from './apiClient'

export const fetchExamInstructions = async ({ schoolId } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  const query = qs.toString()
  const response = await apiClient.get(query ? `/api/exam-instructions?${query}` : '/api/exam-instructions')
  return response.data
}

export const fetchExamInstructionsPage = async ({ schoolId, status, page = 0, size = 10, search = '' } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  if (status != null && String(status).trim() !== '' && String(status) !== 'Select') qs.set('status', String(status))
  if (search) qs.set('search', search)
  qs.set('page', String(page))
  qs.set('size', String(size))
  const response = await apiClient.get(`/api/exam-instructions/page?${qs.toString()}`)
  return response.data
}

export const createExamInstruction = async (payload) => {
  const response = await apiClient.post('/api/exam-instructions', payload)
  return response.data
}

export const updateExamInstruction = async (id, payload) => {
  const response = await apiClient.put(`/api/exam-instructions/${id}`, payload)
  return response.data
}

export const deleteExamInstruction = async (id) => {
  const response = await apiClient.delete(`/api/exam-instructions/${id}`)
  return response.data
}
