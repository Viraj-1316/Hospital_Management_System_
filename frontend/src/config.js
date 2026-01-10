// Support both VITE_API_URL and VITE_API_BASE_URL for compatibility
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export default API_BASE;
