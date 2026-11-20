import axios from 'axios';
import { API_URL } from './config';

let token = null;
let onUnauthorized = null;

export const setToken = (t) => { token = t; };
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

const api = axios.create({ baseURL: API_URL, timeout: 10000 });

api.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token expiré ou compte supprimé : retour à la connexion
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.includes('/auth/login') && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(err);
  }
);

export function errorMessage(err) {
  if (err.response) return err.response.data?.message || `Erreur ${err.response.status}`;
  if (err.request) return "Serveur injoignable. Vérifie le Wi-Fi et l'adresse dans config.js";
  return err.message;
}

export default api;