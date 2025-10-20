import axios from './index';

export const getRoles = async () => {
  const response = await axios.get('/api/roles');
  return response.data;
};

export const getRoleById = async (id) => {
  const response = await axios.get(`/api/roles/${id}`);
  return response.data;
};

export const createRole = async (roleData) => {
  const response = await axios.post('/api/roles', roleData);
  return response.data;
};

export const updateRole = async (id, roleData) => {
  const response = await axios.put(`/api/roles/${id}`, roleData);
  return response.data;
};

export const deleteRole = async (id) => {
  const response = await axios.delete(`/api/roles/${id}`);
  return response.data;
};
