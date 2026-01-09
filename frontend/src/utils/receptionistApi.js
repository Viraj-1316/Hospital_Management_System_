import axios from "axios";
import API_BASE from "../config";

const API = axios.create({
  baseURL: `${API_BASE}/api/receptionists`,
});

// Add auth token to all requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Get all receptionists
export const getReceptionists = () => API.get("/");

// Add receptionist
export const addReceptionist = (data) => API.post("/", data);

// Get receptionist by ID
export const getReceptionistById = (id) => API.get(`/${id}`);

// Update receptionist
export const updateReceptionist = (id, data) => API.put(`/${id}`, data);

// Delete receptionist
export const deleteReceptionist = (id) => API.delete(`/${id}`);

// Toggle Status
export const toggleReceptionistStatus = (id) => API.patch(`/${id}/status`);

// Resend Credentials
export const resendCredentials = (id) =>
  API.post(`/${id}/resend-credentials`);

// Import CSV
export const importReceptionists = (formData) =>
  API.post(`/import`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
