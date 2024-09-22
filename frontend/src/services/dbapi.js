import axios from 'axios';

const API_URL = 'http://localhost:3000/api/conversations';

export const fetchConversations = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const fetchConversation = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const saveConversation = async (conversation) => {
  const response = await axios.post(`${API_URL}/save`, conversation);
  return response.data;
};

export const updateConversation = async ({ id, ...data }) => {
  const response = await axios.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteConversation = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};