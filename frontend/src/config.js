// Support both VITE_API_URL and VITE_API_BASE_URL for compatibility
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// Frontend URL for links and references
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

// Website domain for display (without protocol)
export const WEBSITE_DOMAIN = FRONTEND_URL.replace('https://', '').replace('http://', '');

export default API_BASE;
