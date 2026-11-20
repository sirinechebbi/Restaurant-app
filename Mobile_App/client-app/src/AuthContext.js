import { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { setToken, setUnauthorizedHandler } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function logout() {
    setToken(null);
    await SecureStore.deleteItemAsync('token');
    setUser(null);
  }
    async function updateProfile(changes) {
    const { data } = await api.put('/auth/profile', changes);
    setUser(data); // l'écran de profil et la commande affichent aussitôt les nouvelles valeurs
    return data;
  }

  // Au démarrage : on retrouve la session enregistrée sur le téléphone
  useEffect(() => {
    setUnauthorizedHandler(logout);
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync('token');
        if (saved) {
          setToken(saved);
          const { data } = await api.get('/auth/me');
          if (data.role === 'CLIENT') setUser(data);
          else await logout();
        }
      } catch (err) {
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email: email.trim(), password });
    if (data.user.role !== 'CLIENT') {
      throw new Error('Cette application est réservée aux clients');
    }
    setToken(data.token);
    await SecureStore.setItemAsync('token', data.token);
    setUser(data.user);
  }

  async function register(fullName, email, phone, password) {
    await api.post('/auth/register', {
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
    });
    await login(email, password);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout,updateProfile  }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);