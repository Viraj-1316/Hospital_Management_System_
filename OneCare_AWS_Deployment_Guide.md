
# 📘 OneCare – Full Deployment Guide (AWS EC2 + S3 + MongoDB Atlas)

This document explains how to deploy the **OneCare Hospital Management System** with:

- 🟦 **Backend (Node.js / Express) → AWS EC2 (Ubuntu)**
- 🟩 **Database → MongoDB Atlas Cloud**
- 🟨 **Frontend (React + Vite) → AWS S3 Static Hosting**

This README lets you redeploy your full stack ANYTIME from scratch.

---

# 🚀 PART 1 — MongoDB Atlas Setup

### 1️⃣ Create Atlas Account
https://www.mongodb.com/atlas

### 2️⃣ Create a Free Cluster
- Tier: **M0**
- Region: **Mumbai (recommended)**

### 3️⃣ Create Database User
**Security → Database Access → Add New User**

```
Username: onecare_users
Password: your_password
Role: Atlas Admin
```

### 4️⃣ Allow Network Access
**Security → Network Access**

Add:

- Your Laptop IP (for development)
- Your EC2 IP (example: 13.204.xx.xx/32)
- Or `0.0.0.0/0` for testing

### 5️⃣ Copy Your MongoDB Connection URI

```
mongodb+srv://onecare_users:<PASSWORD>@<CLUSTER>.mongodb.net/?appName=OneCare
```

---

# 🚀 PART 2 — Backend Deployment on AWS EC2

## 1️⃣ Launch EC2 Instance

AWS → EC2 → Launch Instance

- Ubuntu 22.04 LTS
- t2.micro
- New Key Pair
- Security Group:
  - SSH (22) → My IP
  - Custom TCP (3001) → 0.0.0.0/0
  - HTTP (80) → 0.0.0.0/0 (optional)

---

## 2️⃣ Connect via SSH

```
chmod 400 your-key.pem
ssh -i "your-key.pem" ubuntu@<EC2_PUBLIC_IP>
```

---

## 3️⃣ Install Node.js + Git

```
sudo apt update
sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs git
```

Check:

```
node -v
npm -v
```

---

## 4️⃣ Clone the Backend (Correct Branch)

```
git clone -b working_model_part2 https://github.com/BhargavK001/Hospital_Management_System_.git
cd Hospital_Management_System_/backend
```

---

## 5️⃣ Install Dependencies

```
npm install
```

---

## 6️⃣ Create `.env` File

```
nano .env
```

Paste:

```
# Email (Brevo)
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your_user
EMAIL_PASS=your_pass
EMAIL_FROM=OneCare Notifications <your-email@gmail.com>

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_NUMBER=+14155238886

# MongoDB
MONGO_URI=mongodb+srv://onecare_users:your_password@cluster.mongodb.net/?appName=OneCare

# Server
PORT=3001
NODE_ENV=production
JWT_SECRET=your_secret
```

Save:
CTRL + O → Enter  
CTRL + X

---

## 7️⃣ Test the Backend

```
node index.js
```

Expected:

```
Backend server running on http://localhost:3001
MongoDB connected...
```

Stop: CTRL + C

---

## 8️⃣ Run with PM2 (Auto-Restart)

```
sudo npm install -g pm2
pm2 start index.js --name onecare-backend
pm2 save
pm2 startup
```

Run the extra command PM2 prints, then:

```
pm2 save
pm2 list
```

Backend is live:

```
http://<EC2_PUBLIC_IP>:3001
```

---

# 🚀 PART 3 — Frontend Deployment on S3

## 1️⃣ Create `.env.production`

Inside `frontend/`:

```
VITE_API_URL=http://<EC2_PUBLIC_IP>:3001
```

---

## 2️⃣ Build the Frontend

```
npm install
npm run build
```

This generates `dist/`.

---

## 3️⃣ Create S3 Bucket

- Name: unique name, e.g., onecare-frontend-app
- Region: ap-south-1
- **Turn off "Block Public Access"**

---

## 4️⃣ Enable Static Website Hosting

Bucket → Properties → Static website hosting:

- Enable
- Index: `index.html`
- Error: `index.html`

Copy the **Website Endpoint**.

---

## 5️⃣ Apply Public Bucket Policy

Replace bucket name:

```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadForStaticSite",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::onecare-frontend-app/*"
    }
  ]
}
```

---

## 6️⃣ Upload Build Files

Upload **contents of `dist/`**:

- `index.html`
- `assets/` folder

---

# 🎉 FINAL TEST

Frontend URL:

```
http://<bucket-name>.s3-website-ap-south-1.amazonaws.com
```

Backend URL:

```
http://<EC2_PUBLIC_IP>:3001
```

Full stack:

Frontend → EC2 Backend → MongoDB Atlas ✔️

---

# 🛠️ Troubleshooting

### ❌ S3 Shows 403
- Public access blocked
- Wrong bucket policy
- Using wrong URL (must use website endpoint)

### ❌ MongoDB Connection Error
- EC2 IP not added in Atlas Network Access
- Wrong password
- Typo in connection string

### ❌ Frontend Cannot Hit Backend
- Wrong `VITE_API_URL`
- Forgot to run `npm run build`
- Browser CORS (fix by enabling CORS in backend)

---

# ✅ Deployment Complete 🚀
