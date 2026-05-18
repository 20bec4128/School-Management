import apiClient from './apiClient'

export const fetchComplainTypes = async (schoolId) => {
  const response = await apiClient.get(`/api/complain-types/school/${schoolId}`)
  return response.data
}

export const fetchComplainTypesPage = async ({ schoolId, page = 0, size = 10, search = '' } = {}) => {
  const response = await apiClient.get('/api/complain-types', {
    params: {
      schoolId,
      page: Math.max(0, page),
      size: Math.max(1, size),
      search: search ? String(search).trim() : undefined,
    },
  })
  return response.data
}

export const createComplainType = async (data) => {
  const response = await apiClient.post('/api/complain-types', data)
  return response.data
}

export const updateComplainType = async (id, data) => {
  const response = await apiClient.put(`/api/complain-types/${id}`, data)
  return response.data
}

export const deleteComplainType = async (id) => {
  const response = await apiClient.delete(`/api/complain-types/${id}`)
  return response.data
}
