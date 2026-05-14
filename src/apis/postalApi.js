import apiClient from './apiClient'

// Postal Dispatch
export const fetchPostalDispatches = async (schoolId) => {
  const response = await apiClient.get(`/api/postal-dispatches/school/${schoolId}`)
  return response.data
}

export const createPostalDispatch = async (data) => {
  const response = await apiClient.post('/api/postal-dispatches', data)
  return response.data
}

export const updatePostalDispatch = async (id, data) => {
  const response = await apiClient.put(`/api/postal-dispatches/${id}`, data)
  return response.data
}

export const deletePostalDispatch = async (id) => {
  const response = await apiClient.delete(`/api/postal-dispatches/${id}`)
  return response.data
}

// Postal Receive
export const fetchPostalReceives = async (schoolId) => {
  const response = await apiClient.get(`/api/postal-receives/school/${schoolId}`)
  return response.data
}

export const createPostalReceive = async (data) => {
  const response = await apiClient.post('/api/postal-receives', data)
  return response.data
}

export const updatePostalReceive = async (id, data) => {
  const response = await apiClient.put(`/api/postal-receives/${id}`, data)
  return response.data
}

export const deletePostalReceive = async (id) => {
  const response = await apiClient.delete(`/api/postal-receives/${id}`)
  return response.data
}
