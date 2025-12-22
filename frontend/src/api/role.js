import axios from './index';

export const getRoles = async () => {
  const response = await axios.get('/roles');
  return response.data;
};

export const getRoleById = async (id) => {
  const response = await axios.get(`/roles/${id}`);
  return response.data;
};

export const createRole = async (roleData) => {
  const response = await axios.post('/roles', roleData);
  return response.data;
};

export const updateRole = async (id, roleData) => {
  const response = await axios.put(`/roles/${id}`, roleData);
  return response.data;
};

export const deleteRole = async (id) => {
  const response = await axios.delete(`/roles/${id}`);
  return response.data;
};
