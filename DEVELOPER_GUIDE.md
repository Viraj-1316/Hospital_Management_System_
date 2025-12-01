# Frontend Developer Guide

## Overview

This document outlines the architecture changes made to support environment-specific configurations, specifically for handling API URLs across Development and Production environments.

## Key Changes: Centralized API Configuration

We have moved away from hardcoded API URLs (e.g., `http://localhost:3001`) to a centralized configuration pattern.

### 1. The `config.js` File

Located at `src/config.js`, this file is the **single source of truth** for the backend API URL.

```javascript
// src/config.js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
export default API_BASE;
```

### 2. Environment Variables

We use Vite's environment variable system to inject the correct URL based on the environment.

- **Local Development**: Uses `.env`
  ```properties
  VITE_API_URL=http://localhost:3001
  ```
- **Production**: Uses `.env.production`
  ```properties
  VITE_API_URL=http://your-ec2-instance-url.com
  ```

## Developer Guidelines

### ⛔ DO NOT

- **Do not hardcode URLs** like `axios.get("http://localhost:3001/api/...")`.
- **Do not import `API_BASE` locally** inside components if it's already available globally or via a shared config (though importing from `config.js` is the correct way).

### ✅ DO

- **Always import `API_BASE`** from the config file.

  ```javascript
  import API_BASE from "../../config"; // Adjust path as needed

  // Usage
  axios.get(`${API_BASE}/doctors`);
  ```

- **Ensure imports are at the top level** of the file.

## Deployment Workflow

### 1. Local Development

Run the app locally connecting to the local backend:

```bash
npm run dev
```

_Reads `VITE_API_URL` from `.env`._

### 2. Production Build

To build the application for deployment (e.g., to AWS S3):

1. **Update Production Config**: Ensure `frontend/.env.production` contains the live backend URL.
   ```properties
   VITE_API_URL=http://ec2-xx-xx-xx-xx.compute-1.amazonaws.com:3001
   ```
2. **Build**:
   ```bash
   npm run build
   ```
   This generates a `dist/` folder containing the static assets.
3. **Deploy**: Upload the contents of `dist/` to your S3 bucket or hosting provider.

## Troubleshooting

- **"Declaration or statement expected"**: This usually happens if `import` statements are inside a function or conditional block. Ensure all imports are at the very top of the file.
- **API Calls Failing in Production**: Check the Network tab in Chrome DevTools. If requests are going to `localhost` instead of the EC2 IP, verify that `.env.production` was correctly set **before** running `npm run build`.
