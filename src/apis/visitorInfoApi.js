import apiClient from './apiClient'

export const fetchVisitorInfos = async (schoolId) => {
  const response = await apiClient.get(`/api/visitor-infos/school/${schoolId}`)
  return response.data
}

export const fetchVisitorInfosPage = async ({ schoolId, search = '', page = 0, size = 10 } = {}) => {
  const qs = new URLSearchParams({
    schoolId: String(schoolId),
    page: String(Math.max(0, page)),
    size: String(Math.max(1, size)),
  })
  const q = String(search || '').trim()
  if (q) qs.set('search', q)
  const response = await apiClient.get(`/api/visitor-infos?${qs.toString()}`)
  return response.data
}

export const createVisitorInfo = async (data) => {
  const response = await apiClient.post('/api/visitor-infos', data)
  return response.data
}

export const updateVisitorInfo = async (id, data) => {
  const response = await apiClient.put(`/api/visitor-infos/${id}`, data)
  return response.data
}

export const deleteVisitorInfo = async (id) => {
  const response = await apiClient.delete(`/api/visitor-infos/${id}`)
  return response.data
}
