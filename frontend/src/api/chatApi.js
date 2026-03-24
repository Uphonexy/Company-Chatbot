import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
});

export const sendMessage = async (question, sessionId) => {
  const response = await api.post('/api/chat/', { question, session_id: sessionId });
  return response.data;
};

export const getHistory = async (sessionId) => {
  const response = await api.get(`/api/history/?session_id=${sessionId}`);
  return response.data;
};

export const adminLogin = async (username, password) => {
  const response = await api.post('/api-token-auth/', { username, password });
  return response.data;
};

export const uploadPolicy = async (file, token) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/admin/upload/', formData, {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getPolicies = async (token) => {
  const response = await api.get('/api/admin/policies/', {
    headers: { 'Authorization': `Token ${token}` },
  });
  return response.data;
};

export const deletePolicy = async (id, token) => {
  const response = await api.delete(`/api/admin/policies/${id}/`, {
    headers: { 'Authorization': `Token ${token}` },
  });
  return response.data;
};
