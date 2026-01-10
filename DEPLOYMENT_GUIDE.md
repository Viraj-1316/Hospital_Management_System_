# Deployment Guide

This guide provides comprehensive instructions for deploying OneCare to production on **AWS EC2** (Backend) and **AWS S3 + CloudFront** (Frontend).

---

## 📋 Prerequisites

- AWS Account with appropriate permissions
- Domain name (optional, but recommended)
- MongoDB Atlas account (free tier works)
- Git installed on local machine

---

## 🖥️ Backend Deployment (AWS EC2)

### Step 1: Launch EC2 Instance

1. **Go to EC2 Dashboard** → Launch Instance
2. **Choose AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
3. **Instance Type**:
   - Development/Testing: `t2.micro` (Free tier)
   - Production: `t3.small` or higher
4. **Key Pair**: Create or select existing `.pem` file
5. **Security Group** - Add rules:
   | Type | Port | Source | Purpose |
   |------|------|--------|---------|
   | SSH | 22 | Your IP | Server access |
   | HTTP | 80 | 0.0.0.0/0 | Web traffic |
   | HTTPS | 443 | 0.0.0.0/0 | Secure traffic |
   | Custom TCP | 3001 | 0.0.0.0/0 | API (remove after Nginx setup) |

6. **Launch** the instance

### Step 2: Connect to Server

```bash
# Connect via SSH
ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

### Step 3: Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx (Reverse Proxy)
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

### Step 4: Clone and Setup Application

```bash
# Clone repository
git clone https://github.com/yourusername/Hospital_Management_System_.git
cd Hospital_Management_System_/backend

# Install dependencies
npm install
```

### Step 5: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add production configuration:

```env
# Server
PORT=3001
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/hospital_db?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secret-key-min-32-characters-long

# CORS & Frontend
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Email (SMTP)
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-smtp-user
EMAIL_PASS=your-smtp-password
EMAIL_FROM=noreply@yourdomain.com

# Razorpay (if using payments)
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

Save: `Ctrl+O`, Exit: `Ctrl+X`

### Step 6: Start Application with PM2

```bash
# Start the application
pm2 start index.js --name "onecare-api"

# Save PM2 process list
pm2 save

# Enable PM2 startup on reboot
pm2 startup
# Run the command it outputs

# View logs
pm2 logs onecare-api
```

### Step 7: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/onecare
```

Add configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Or use EC2 public IP

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
    }
}
```

Enable the site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/onecare /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 8: SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal
sudo certbot renew --dry-run
```

---

## 🌐 Frontend Deployment (AWS S3 + CloudFront)

### Step 1: Build Frontend

On your local machine:

```bash
cd frontend

# Create production environment file
nano .env.production
```

Add:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

```bash
# Build for production
npm run build
```

This creates a `dist/` folder with optimized static files.

### Step 2: Create S3 Bucket

1. **Go to S3** → Create bucket
2. **Bucket name**: `onecare-frontend` (must be globally unique)
3. **Region**: Same as your EC2 instance
4. **Uncheck** "Block all public access" (we'll use CloudFront)
5. **Create bucket**

### Step 3: Configure S3 for Static Hosting

1. Go to bucket → **Properties**
2. Scroll to **Static website hosting** → Enable
3. **Index document**: `index.html`
4. **Error document**: `index.html` (for SPA routing)
5. Save changes

### Step 4: Upload Build Files

```bash
# Using AWS CLI
aws s3 sync dist/ s3://onecare-frontend --delete

# Or upload manually via AWS Console
```

### Step 5: Create CloudFront Distribution

1. **Go to CloudFront** → Create distribution
2. **Origin domain**: Select your S3 bucket
3. **Origin access**: Origin access control (OAC) - recommended
4. **Viewer protocol policy**: Redirect HTTP to HTTPS
5. **Default root object**: `index.html`
6. **Error pages**:
   - 404 → `/index.html` (Response code: 200)
   - 403 → `/index.html` (Response code: 200)
7. **Create distribution**

### Step 6: Update S3 Bucket Policy

Add policy to allow CloudFront access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::onecare-frontend/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

### Step 7: Custom Domain (Optional)

1. **Request SSL Certificate** in AWS Certificate Manager (ACM)

   - Region: `us-east-1` (required for CloudFront)
   - Domain: `yourdomain.com` and `*.yourdomain.com`
   - Validate via DNS

2. **Update CloudFront**:

   - Alternate domain names: `yourdomain.com`, `www.yourdomain.com`
   - Custom SSL certificate: Select your ACM certificate

3. **Update DNS** (Route 53 or your DNS provider):
   - A record → Alias to CloudFront distribution
   - CNAME for `www` → CloudFront domain

---

## ✅ Deployment Checklist

### Backend

- [ ] EC2 instance running
- [ ] Node.js and PM2 installed
- [ ] Application code deployed
- [ ] `.env` file configured
- [ ] PM2 process running
- [ ] Nginx configured
- [ ] SSL certificate active
- [ ] Security groups configured

### Frontend

- [ ] Build completed successfully
- [ ] S3 bucket created
- [ ] Files uploaded to S3
- [ ] CloudFront distribution created
- [ ] Custom domain configured (optional)
- [ ] SSL via ACM

### Database

- [ ] MongoDB Atlas cluster running
- [ ] IP whitelist includes EC2 IP
- [ ] Connection string in backend `.env`

---

## 🔧 Common Commands

```bash
# PM2 Commands
pm2 status              # Check app status
pm2 logs onecare-api    # View logs
pm2 restart onecare-api # Restart app
pm2 stop onecare-api    # Stop app

# Nginx Commands
sudo systemctl status nginx   # Check status
sudo systemctl restart nginx  # Restart
sudo nginx -t                 # Test config

# Update Application
cd Hospital_Management_System_/backend
git pull origin main
npm install
pm2 restart onecare-api
```

---

## 🐛 Troubleshooting

| Issue              | Solution                                 |
| ------------------ | ---------------------------------------- |
| 502 Bad Gateway    | Check PM2 is running: `pm2 status`       |
| Connection refused | Verify port 3001 in security group       |
| CORS errors        | Check `CORS_ORIGIN` in `.env`            |
| MongoDB timeout    | Whitelist EC2 IP in Atlas Network Access |
| SSL not working    | Run `sudo certbot renew`                 |
