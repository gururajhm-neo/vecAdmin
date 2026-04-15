import axios from 'axios';
import { API_URL, AUTH_TOKEN_KEY } from '../utils/constants';
import { createMockAdapter } from './mock/adapter';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // When REACT_APP_MOCK_MODE=true all requests are intercepted locally — no network calls
  ...(process.env.REACT_APP_MOCK_MODE === 'true' && { adapter: createMockAdapter() }),
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem(AUTH_TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

