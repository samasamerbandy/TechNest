import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { SERVER_URL } from '../config';

const api = axios.create({
  baseURL: SERVER_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;