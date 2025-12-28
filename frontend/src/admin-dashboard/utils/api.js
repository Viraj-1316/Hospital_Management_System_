// src/utils/api.js
import axios from "axios";
import API_BASE from "../../config";

// Create axios instance with base URL
const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

// Request interceptor to add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - could redirect to login
      console.warn("Authentication failed - token may be expired");
    }
    return Promise.reject(error);
  }
);

export default api;

// Also export a function to create authenticated axios config for direct axios calls
export const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};
