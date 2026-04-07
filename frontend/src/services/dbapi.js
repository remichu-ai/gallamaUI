import axios from 'axios';
import { buildBackendApiUrl } from './backendApi.js';

export const fetchConversations = async () => {
  const response = await axios.get(buildBackendApiUrl('/api/conversations'));
  return response.data;
};

export const fetchConversation = async (id) => {
  const response = await axios.get(buildBackendApiUrl(`/api/conversations/${id}`));
  return response.data;
};

export const saveConversation = async (conversation) => {
  const response = await axios.post(buildBackendApiUrl('/api/conversations/save'), conversation);
  return response.data;
};

export const updateConversation = async ({ id, ...data }) => {
  const response = await axios.put(buildBackendApiUrl(`/api/conversations/${id}`), data);
  return response.data;
};

export const deleteConversation = async (id) => {
  const response = await axios.delete(buildBackendApiUrl(`/api/conversations/${id}`));
  return response.data;
};
