import { createContext, useContext, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);
//provider pour partager lesd données
export function AuthProvider({ children }) {
    //useState gérer une donnée qui peut changer dans un composant React
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.user.role !== 'ADMIN') {
      throw new Error('Ce dashboard est réservé aux Admin des restaurants');
    }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);