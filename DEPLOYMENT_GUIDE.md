# Hostinger VPS Deployment Guide (KVM1)

This guide covers deploying OneCare Hospital Management System on **Hostinger VPS KVM1** with unified frontend + backend hosting, Nginx reverse proxy, and wildcard subdomain support for clinic websites.

---

## 📋 Prerequisites

- Hostinger VPS KVM1 (1 vCPU, 4GB RAM)
- Domain configured in Hostinger DNS panel
- MongoDB Atlas account (free tier works)
- SSH access to your VPS

---

## 🖥️ VPS Initial Setup

### Step 1: Connect to Your VPS

```bash
# SSH into your VPS (use credentials from Hostinger panel)
ssh root@<YOUR-VPS-IP>
```

### Step 2: Update System & Create Deploy User

```bash
# Update system packages
apt update && apt upgrade -y

# Create a non-root user for deployments
adduser onecare
usermod -aG sudo onecare

# Switch to the new user
su - onecare
```

### Step 3: Install Node.js 20.x

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### Step 4: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Enable PM2 to start on boot
pm2 startup systemd
# Run the command it outputs (will ask for sudo password)
```

### Step 5: Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Step 6: Install Git

```bash
sudo apt install -y git
```

---

## 📦 Backend Deployment

### Step 1: Clone Repository

```bash
# Create app directory
sudo mkdir -p /var/www/onecare
sudo chown -R onecare:onecare /var/www/onecare
cd /var/www/onecare

# Clone your repository
git clone https://github.com/BhargavK001/Hospital_Management_System_.git .
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install --production
```

### Step 3: Configure Environment Variables

```bash
# Create production .env file
nano .env
```

Add the following configuration (replace placeholders):

```env
# Server
PORT=3001
NODE_ENV=production

# Database (MongoDB Atlas)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hospital_db?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-min-32-characters

# URLs (Replace with your actual domain)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Email (SMTP - Brevo/Sendinblue)
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-smtp-user
EMAIL_PASS=your-smtp-password
EMAIL_FROM=noreply@yourdomain.com

# Razorpay (Payment Gateway)
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/api/auth/google/doctor/callback

# WhatsApp Business API (optional)
WHATSAPP_ACCESS_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
```

Save: `Ctrl+O`, Exit: `Ctrl+X`

### Step 4: Start Backend with PM2

```bash
# Start the application
pm2 start index.js --name "onecare-backend"

# Save PM2 process list
pm2 save

# View logs
pm2 logs onecare-backend
```

---

## 🌐 Frontend Deployment

### Step 1: Build Frontend (On Your Local Machine)

```bash
cd frontend

# Create production environment file
echo "VITE_API_BASE_URL=https://api.yourdomain.com" > .env.production
echo "VITE_GOOGLE_CLIENT_ID=your-google-client-id" >> .env.production

# Build for production
npm run build
```

### Step 2: Upload Build to VPS

Option A - Using SCP:

```bash
# From your local machine
scp -r dist/* onecare@<VPS-IP>:/var/www/onecare/frontend/dist/
```

Option B - Using Git (recommended for updates):

```bash
# On VPS, pull latest changes
cd /var/www/onecare
git pull origin main

# Build on server
cd frontend
npm install
npm run build
```

---

## ⚙️ Nginx Configuration

### Step 1: Create Nginx Site Configuration

```bash
sudo nano /etc/nginx/sites-available/onecare
```

Add the following configuration:

```nginx
# Main Application Server
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend - Static files
    root /var/www/onecare/frontend/dist;
    index index.html;

    # SPA routing - all routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# API Server (Backend)
server {
    listen 80;
    server_name api.yourdomain.com;

    # Reverse proxy to Node.js backend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeout for long-running requests
        proxy_read_timeout 120s;
    }

    # Serve uploaded files
    location /uploads {
        alias /var/www/onecare/backend/uploads;
        expires 30d;
        add_header Cache-Control "public";
    }
}

# Wildcard Subdomain for Clinic Websites
server {
    listen 80;
    server_name ~^(?<subdomain>.+)\.onecare\.yourdomain\.com$;

    # Serve the same frontend SPA
    root /var/www/onecare/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static asset caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 2: Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/onecare /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL Certificate (Let's Encrypt - FREE)

### Step 1: Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Get SSL Certificates

```bash
# For main domain and API subdomain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# For wildcard subdomain (clinic websites) - requires DNS challenge
sudo certbot certonly --manual --preferred-challenges dns \
    -d "*.onecare.yourdomain.com"
```

> **Note**: For wildcard certificates, Certbot will ask you to add a TXT record to your DNS.
> Go to Hostinger DNS panel → Add TXT record for `_acme-challenge.onecare` with the value provided.

### Step 3: Auto-Renewal Test

```bash
sudo certbot renew --dry-run
```

---

## 🌍 DNS Configuration (Hostinger Panel)

Go to Hostinger → Domains → Manage → DNS Zone and add:

| Type | Name       | Value      | TTL   |
| ---- | ---------- | ---------- | ----- |
| A    | @          | `<VPS-IP>` | 14400 |
| A    | www        | `<VPS-IP>` | 14400 |
| A    | api        | `<VPS-IP>` | 14400 |
| A    | \*.onecare | `<VPS-IP>` | 14400 |

> DNS propagation can take up to 48 hours, but usually completes within 1-2 hours.

---

## ✅ Deployment Checklist

### Backend

- [ ] VPS accessible via SSH
- [ ] Node.js 20.x installed
- [ ] PM2 installed and running
- [ ] Backend dependencies installed
- [ ] `.env` file configured
- [ ] Backend process running (`pm2 status`)

### Frontend

- [ ] Build completed (`npm run build`)
- [ ] Files uploaded to `/var/www/onecare/frontend/dist`

### Nginx

- [ ] Configuration created in `/etc/nginx/sites-available/onecare`
- [ ] Site enabled (symlinked to sites-enabled)
- [ ] Nginx test passes (`sudo nginx -t`)

### SSL

- [ ] Certbot installed
- [ ] Certificates obtained for all domains
- [ ] Auto-renewal configured

### DNS

- [ ] A records pointing to VPS IP
- [ ] Wildcard record for clinic subdomains

---

## 🔧 Useful Commands

```bash
# PM2 Commands
pm2 status              # Check app status
pm2 logs onecare-backend # View logs
pm2 restart onecare-backend # Restart app
pm2 reload onecare-backend  # Zero-downtime reload

# Nginx Commands
sudo systemctl status nginx    # Check status
sudo systemctl restart nginx   # Restart
sudo nginx -t                  # Test config

# Update Application
cd /var/www/onecare
git pull origin main
cd backend && npm install
pm2 restart onecare-backend
cd ../frontend && npm install && npm run build
```

---

## 🐛 Troubleshooting

| Issue                 | Solution                                   |
| --------------------- | ------------------------------------------ |
| 502 Bad Gateway       | Check PM2 is running: `pm2 status`         |
| Connection refused    | Verify backend port 3001 is correct        |
| CORS errors           | Check `CORS_ORIGIN` in backend `.env`      |
| MongoDB timeout       | Whitelist VPS IP in Atlas Network Access   |
| SSL not working       | Run `sudo certbot renew`                   |
| Subdomain not working | Check DNS wildcard record and Nginx config |
