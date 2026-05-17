import apiClient from './apiClient'

export const fetchComplains = async (schoolId) => {
  const response = await apiClient.get(`/api/complains/school/${schoolId}`)
  return response.data
}

export const fetchComplainsPage = async ({ schoolId, page = 0, size = 10, search = '', academicYear, complainTypeId, userType } = {}) => {
  const response = await apiClient.get('/api/complains', {
    params: {
      schoolId,
      page: Math.max(0, page),
      size: Math.max(1, size),
      search: search ? String(search).trim() : undefined,
      academicYear: academicYear ? String(academicYear).trim() : undefined,
      complainTypeId: complainTypeId != null && String(complainTypeId).trim() !== '' ? Number(complainTypeId) : undefined,
      userType: userType ? String(userType).trim() : undefined,
    },
  })
  return response.data
}

export const createComplain = async (data) => {
  const response = await apiClient.post('/api/complains', data)
  return response.data
}

export const updateComplain = async (id, data) => {
  const response = await apiClient.put(`/api/complains/${id}`, data)
  return response.data
}

export const deleteComplain = async (id) => {
  const response = await apiClient.delete(`/api/complains/${id}`)
  return response.data
}
