import apiClient from './apiClient'

export const fetchVisitorPurposes = async (schoolId) => {
  const response = await apiClient.get(`/api/visitor-purposes/school/${schoolId}`)
  return response.data
}

export const fetchVisitorPurposesPage = async ({ schoolId, page = 0, size = 10, search = '' } = {}) => {
  const response = await apiClient.get('/api/visitor-purposes', {
    params: {
      schoolId,
      page: Math.max(0, page),
      size: Math.max(1, size),
      search: search ? String(search).trim() : undefined,
    },
  })
  return response.data
}

export const createVisitorPurpose = async (data) => {
  const response = await apiClient.post('/api/visitor-purposes', data)
  return response.data
}

export const updateVisitorPurpose = async (id, data) => {
  const response = await apiClient.put(`/api/visitor-purposes/${id}`, data)
  return response.data
}

export const deleteVisitorPurpose = async (id) => {
  const response = await apiClient.delete(`/api/visitor-purposes/${id}`)
  return response.data
}
