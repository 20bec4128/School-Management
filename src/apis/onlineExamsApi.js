import apiClient from './apiClient'

export const fetchOnlineExams = async ({ schoolId } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  const query = qs.toString()
  const response = await apiClient.get(query ? `/api/online-exams?${query}` : '/api/online-exams')
  return response.data
}

export const fetchOnlineExamsPage = async ({ schoolId, classId, subjectId, isPublish, page = 0, size = 10, search = '' } = {}) => {
  const qs = new URLSearchParams()
  if (schoolId != null && String(schoolId).trim() !== '') qs.set('schoolId', String(schoolId))
  if (classId != null && String(classId).trim() !== '' && String(classId) !== 'Select') qs.set('classId', String(classId))
  if (subjectId != null && String(subjectId).trim() !== '' && String(subjectId) !== 'Select') qs.set('subjectId', String(subjectId))
  if (isPublish != null && String(isPublish).trim() !== '' && String(isPublish) !== 'Select') qs.set('isPublish', String(isPublish))
  if (search) qs.set('search', search)
  qs.set('page', String(page))
  qs.set('size', String(size))
  const response = await apiClient.get(`/api/online-exams/page?${qs.toString()}`)
  return response.data
}

export const createOnlineExam = async (payload) => {
  const response = await apiClient.post('/api/online-exams', payload)
  return response.data
}

export const updateOnlineExam = async (id, payload) => {
  const response = await apiClient.put(`/api/online-exams/${id}`, payload)
  return response.data
}

export const deleteOnlineExam = async (id) => {
  const response = await apiClient.delete(`/api/online-exams/${id}`)
  return response.data
}
