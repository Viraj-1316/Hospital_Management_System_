import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import axios from "axios";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

import "./toasterjsfiles/alertToToast.js";
import { ConfirmProvider } from "./global_components/ConfirmDialog.jsx";
import "./toasterjsfiles/overrideConfirm.js";
import { SocketProvider } from "./context/SocketContext";

// Global axios interceptor to add auth token to all requests
axios.interceptors.request.use(
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

// Response interceptor to handle 401 errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Authentication failed - token may be expired");
      // Could redirect to login if needed:
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
      <BrowserRouter>
        <SocketProvider>
          <ConfirmProvider>
            <App />
          </ConfirmProvider>
        </SocketProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </ErrorBoundary >
);

