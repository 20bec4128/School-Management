import apiClient from './apiClient'

export const fetchQuestionBanksPage = async (params) => {
  const response = await apiClient.get('/api/question-bank/page', { params })
  return response.data
}

export const createQuestionBank = async (data) => {
  const response = await apiClient.post('/api/question-bank/create', data)
  return response.data
}

export const updateQuestionBank = async (id, data) => {
  const response = await apiClient.put(`/api/question-bank/update/${id}`, data)
  return response.data
}

export const deleteQuestionBank = async (id) => {
  const response = await apiClient.delete(`/api/question-bank/delete/${id}`)
  return response.data
}
