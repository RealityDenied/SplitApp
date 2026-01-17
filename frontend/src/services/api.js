import axios from 'axios';

// API URL configuration
// In production on Render, set VITE_BACKPATH=https://splitapp-e25v.onrender.com/api
const API_URL = import.meta.env.VITE_BACKPATH || '/api';

// Debug: Log API URL in development (remove in production if needed)
if (import.meta.env.DEV) {
  console.log('API URL:', API_URL);
  console.log('VITE_BACKPATH env:', import.meta.env.VITE_BACKPATH);
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
