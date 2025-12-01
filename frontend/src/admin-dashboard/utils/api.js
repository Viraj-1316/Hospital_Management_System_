// src/utils/api.js
import axios from "axios";
import API_BASE from "../../config";

// direct URL to your backend (you run backend on port 3001)
const api = axios.create({
  baseURL: `${API_BASE}/api`,
  // you can add headers here later if you need auth
});

export default api;
