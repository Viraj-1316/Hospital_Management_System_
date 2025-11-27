import React from "react";                // ⬅️ ADD THIS LINE
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";

import "./toasterjsfiles/alertToToast.js";
import { ConfirmProvider } from "./global_components/ConfirmDialog.jsx";
import "./toasterjsfiles/overrideConfirm.js"; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
    <ConfirmProvider>
      <App />
    </ConfirmProvider>
    </BrowserRouter>
  </React.StrictMode>
);
