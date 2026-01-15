# Production Readiness Checklist

## 1. Environment Configuration

- [ ] **Environment Variables**: Ensure all variables in `.env` are set for production.
  - `NODE_ENV=production`
  - `MONGO_URI` (Use production database)
  - `JWT_SECRET` (Use a strong, long secret)
  - `CORS_ORIGIN` (Set to specific frontend domain, e.g., `https://yourdomain.in`, NOT `*`)
  - `FRONTEND_URL` & `BACKEND_URL` (Correct public URLs)
  - `PORT` (e.g., 3001)
- [ ] **Secrets Management**: Ensure `.env` is NOT committed to git.

## 2. Security

- [ ] **HTTPS**: Ensure the application runs over HTTPS (use Let's Encrypt/Certbot).
- [ ] **Secure Headers**: `helmet` middleware is enabled in `backend/index.js`.
- [ ] **CORS**: Verify strictly allowed origins only.
- [ ] **MongoDB**: Whitelist VPS IP addresses for MongoDB Access (e.g., MongoDB Atlas Network Access).

## 3. Performance & Reliability

- [ ] **Logging**: `winston` is used for logging. `console.log` should be minimal or removed.
- [ ] **Compression**: `compression` middleware is enabled.
- [ ] **Database Indexes**: Ensure frequently queried fields (e.g., `email`, `date`, `patientId`) are indexed in MongoDB.
- [ ] **PM2**: Use PM2 for process management with auto-restart on failure.

## 4. Frontend Optimization

- [ ] **Build**: Run `npm run build` locally to verify no errors.
- [ ] **Compression**: Verify `vite-plugin-compression` is active (check for `.gz` files in `dist/`).
- [ ] **Console Logs**: Remove `console.log` from frontend code (use a linter or search).

## 5. Third-Party Integrations

- [ ] **Razorpay**: Switch keys to Production mode.
- [ ] **Google OAuth**: Add production domain to "Authorized JavaScript origins" and "Authorized redirect URIs" in Google Cloud Console.
- [ ] **Zoom/WhatsApp**: Update webhooks/callbacks if environment URLs change.

## 6. Deployment (VPS)

- [ ] **Nginx**: Configure as reverse proxy with SSL.
- [ ] **SSL Certificate**: Obtain via Certbot (Let's Encrypt).
- [ ] **PM2**: Start with `pm2 start ecosystem.config.js`.
- [ ] **Firewall**: Configure UFW to allow only ports 80, 443, 22.
