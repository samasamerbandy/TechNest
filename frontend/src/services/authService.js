import api from '../api/axiosInstance';

export const loginUser = (email, password) => api.post('/auth/login', { email, password });
export const logoutUser = () => api.post('/auth/logout');
export const registerUser = (data) => api.post('/auth/register', data);
