# 🛠️ Troubleshooting Guide

Common issues and their solutions.

---

## 🔴 Backend Issues

### 1. MongoDB Connection Failed

**Error:**

```
MongoServerError: bad auth : Authentication failed
```

**Solution:**

1. Check `MONGO_URI` in `.env`
2. Verify username/password are correct
3. Ensure IP is whitelisted in MongoDB Atlas Network Access
4. Try connection string with `authSource=admin`

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true&w=majority&authSource=admin
```

---

### 2. CORS Errors

**Error:**

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**

1. Add frontend URL to `CORS_ORIGIN` in backend `.env`:

```env
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com
```

2. Restart backend server

---

### 3. JWT Token Expired

**Error:**

```
{ "message": "Invalid or expired token" }
```

**Solution:**

1. Log out and log in again
2. Clear localStorage:

```javascript
localStorage.removeItem("token");
localStorage.removeItem("user");
```

3. Increase token expiry in backend:

```javascript
jwt.sign(payload, secret, { expiresIn: "30d" });
```

---

### 4. File Upload Failed

**Error:**

```
MulterError: File too large
```

**Solution:**

1. Increase limit in `backend/index.js`:

```javascript
app.use(express.json({ limit: "50mb" }));
```

2. Check Multer config in `middleware/upload.js`:

```javascript
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});
```

---

### 5. Email Not Sending

**Symptoms:** No confirmation emails received.

**Debug Steps:**

1. Check SMTP credentials in `.env`
2. Test with console log:

```javascript
console.log("Attempting to send email to:", recipient);
```

3. Check spam folder
4. Verify sender domain is authenticated (SPF/DKIM)

---

### 6. Razorpay Payment Failing

**Error:**

```
{ "error": { "code": "BAD_REQUEST_ERROR", "description": "Order amount is less than minimum" }}
```

**Solution:**

- Minimum order is ₹1 (100 paise)
- Amount must be in smallest currency unit:

```javascript
amount: Math.round(bill.totalAmount * 100); // Convert to paise
```

---

## 🔵 Frontend Issues

### 1. Blank Page After Build

**Symptoms:** `npm run build` works but page is blank.

**Solutions:**

1. Check `vite.config.js` base path:

```javascript
export default defineConfig({
  base: "/", // or '/subpath/' if hosted in subfolder
});
```

2. Check for console errors in browser DevTools

---

### 2. API Calls Going to Wrong URL

**Symptoms:** Requests going to `localhost` in production.

**Solution:**

1. Ensure `.env.production` exists with correct URL:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

2. Rebuild: `npm run build`

3. Verify import in components:

```javascript
import API_BASE from "../config";
// NOT hardcoded 'http://localhost:3001'
```

---

### 3. "Cannot read properties of undefined"

**Common Causes:**

1. API response structure changed
2. Data not loaded before render

**Solution:**

```javascript
// Use optional chaining
const name = user?.profile?.name || "Unknown";

// Check loading state
if (loading) return <Spinner />;
if (!data) return <Empty />;
```

---

### 4. Sidebar/Navigation Not Showing

**Symptoms:** Logged in but sidebar missing.

**Debug:**

1. Check localStorage:

```javascript
console.log(localStorage.getItem("user"));
```

2. Verify role in user object:

```javascript
const user = JSON.parse(localStorage.getItem("user"));
console.log("Role:", user?.role);
```

---

### 5. Date/Time Display Issues

**Symptoms:** Dates showing wrong timezone.

**Solution:**

```javascript
// Use toLocaleDateString with explicit locale
const displayDate = new Date(dateString).toLocaleDateString("en-IN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Kolkata",
});
```

---

## 🟡 Database Issues

### 1. Duplicate Key Error

**Error:**

```
MongoServerError: E11000 duplicate key error collection
```

**Solution:**

1. Check unique indexes on collection
2. Remove duplicate document or update instead of insert
3. Drop and recreate index if corrupted:

```javascript
db.collection.dropIndex("email_1");
```

---

### 2. ObjectId Cast Error

**Error:**

```
CastError: Cast to ObjectId failed for value "undefined"
```

**Solution:**

1. Validate ID before using:

```javascript
if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({ message: "Invalid ID format" });
}
```

---

## 🟢 Deployment Issues

### 1. PM2 Process Crashing

**Symptoms:** Backend keeps restarting.

**Debug:**

```bash
pm2 logs hospital-backend --lines 100
```

**Common fixes:**

1. Check `.env` file exists
2. Verify all npm dependencies installed
3. Check port availability:

```bash
lsof -i :3001
```

---

### 2. SSL Certificate Error

**Error:**

```
ERR_SSL_PROTOCOL_ERROR
```

**Solution (Nginx + Certbot):**

```bash
sudo certbot renew
sudo systemctl restart nginx
```

---

### 3. High Memory Usage

**Symptoms:** Server becoming slow, OOM errors.

**Solutions:**

1. Increase Node.js memory:

```bash
node --max-old-space-size=2048 index.js
```

2. Check for memory leaks in code
3. Use PM2 cluster mode:

```bash
pm2 start index.js -i max
```

---

## 📋 Debug Checklist

When facing issues, check:

- [ ] Environment variables loaded correctly
- [ ] Database connection working
- [ ] CORS configured properly
- [ ] Token is valid and not expired
- [ ] API URL is correct
- [ ] Required dependencies installed
- [ ] Logs for error messages
- [ ] Browser console for frontend errors
- [ ] Network tab for API request/response

---

## 📞 Getting Help

1. Check existing documentation in `docs/` folder
2. Review console logs (backend and browser)
3. Search error message in project codebase
4. Check MongoDB Atlas logs if database-related
