  import React, { createContext, useState, useContext, useEffect } from 'react';
  import * as SecureStore from 'expo-secure-store'; // Use this
  import api from '../api/axiosInstance';
  import AsyncStorage from '@react-native-async-storage/async-storage';

  const ROLE_MAP = {
  community_member: 'member',
  facility_manager: 'manager',
  worker:           'worker',
  admin:            'admin',
};

  const AuthContext = createContext();

  export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const restoreSession = async () => {
        try {
          // SecureStore stores everything as strings, so no need for JSON.stringify/parse for tokens
          const token = await SecureStore.getItemAsync('token');
          const userJson = await SecureStore.getItemAsync('user');
          
          if (token && userJson) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const parsed = JSON.parse(userJson);
const normalized = { ...parsed, role: ROLE_MAP[parsed.role] ?? parsed.role };
setUser(normalized);
          }
        } catch (e) {
          console.log('Session restore failed', e);
        } finally {
          await AsyncStorage.removeItem('token');
          setLoading(false);
        }
      };
      restoreSession();
    }, []);

    const login = async (email, password) => {
  const res = await api.post('/api/auth/login', { email, password });

  const { token, user } = res.data;
  if (!token || !user) throw new Error('Invalid response from server');

  const normalized = { ...user, role: ROLE_MAP[user.role] ?? user.role };

  // ✅ Set immediately — no waiting for SecureStore
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  await SecureStore.setItemAsync('token', token);
  await SecureStore.setItemAsync('user', JSON.stringify(normalized));

  setUser(normalized);
};

    const logout = async () => {
      try {
        await api.post('/api/auth/logout');
      } catch (e) {
        console.log('Logout API error:', e.message);
      } finally {
        delete api.defaults.headers.common['Authorization'];
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        setUser(null);
      }
    };

    return (
      <AuthContext.Provider value={{ user, login, logout, loading }}>
        {children}
      </AuthContext.Provider>
    );
  }

  export const useAuth = () => useContext(AuthContext);