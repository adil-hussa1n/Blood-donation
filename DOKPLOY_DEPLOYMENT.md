# 🚀 Dokploy VPS Deployment Guide for Blood Donation Platform

This guide walks you through deploying the complete full-stack Blood Donation platform (MySQL + Node.js Express Backend + React Vite Frontend + Nginx) onto your **Dokploy** instance on a VPS.

---

## 🏗️ Architecture Overview

The production containerized stack consists of 3 services:
1. **`mysql`**: MySQL 8.0 server with persistent Docker volume (`mysql_data`) so data is never lost across deploys or server reboots.
2. **`backend`**: Node.js Express TypeScript API running on internal port `5000`. On startup, it connects to MySQL, automatically verifies/creates database tables, seeds initial data, and schedules the hourly donor availability cron job.
3. **`frontend`**: React Vite production build served through an optimized **Nginx** reverse proxy on port `80`. Nginx serves static assets with gzip compression, handles React SPA routing (`/index.html` fallback), and internally proxies all `/api/*` requests directly to the backend container.

---

## ⚡ Method 1: Deploy with Dokploy "Compose" (Recommended)

This is the easiest and most robust method. Dokploy builds and manages all 3 services from `docker-compose.yml`.

### Step 1: Push Code to GitHub
Ensure all latest files (including `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, and `frontend/nginx.conf`) are committed and pushed to your repository:
```bash
git add .
git commit -m "Add Dokploy deployment configuration"
git push origin main
```

### Step 2: Create a Compose Application in Dokploy
1. Log in to your **Dokploy Dashboard** on your VPS (`https://your-dokploy-domain.com`).
2. Navigate to your Project (or create a new project called `Bloodify247`).
3. Click **Create Service** and select **Compose**.
4. Give it a name (e.g. `blood-donation-app`).

### Step 3: Connect Git Repository
1. In the Compose application settings, select **Provider**: `GitHub` (or Git).
2. Choose your repository: `adil-hussa1n/Blood-donation`.
3. Set the Branch: `main` (or your active branch).
4. Compose Path: `docker-compose.yml`.

### Step 4: Configure Environment Variables
In the **Environment** tab of your Compose application in Dokploy, copy and paste the following variables (adjust passwords and domain as needed):

```env
# Network & Port
HOST_PORT=80
FRONTEND_URL=https://your-domain.com

# Database Credentials
DB_NAME=blood_donation_db
DB_PASSWORD=YourSecureMySQLPasswordHere2026!

# JWT Secret (Generate a strong random string)
JWT_SECRET=super_secret_blood_donation_jwt_key_2026_production

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com

# Single Authorized Admin Google Account
ADMIN_GOOGLE_EMAIL=adilh5353@gmail.com
```

### Step 5: Configure Domain & SSL
1. Go to the **Domains** tab in Dokploy for the `frontend` service.
2. Enter your domain name (e.g., `bloodify.yourdomain.com`).
3. Set the target container port to `80`.
4. Enable **HTTPS (Let's Encrypt)**. Dokploy automatically provisions and renews SSL certificates via Traefik.
5. In your DNS provider (Cloudflare, Namecheap, etc.), create an **A Record** pointing `bloodify.yourdomain.com` to your VPS IP address.

### Step 6: Deploy!
Click **Deploy** in Dokploy.
- Dokploy will pull the code, build both backend and frontend images, start MySQL, wait for MySQL to pass its health check, and launch the application.
- You can monitor the live build logs in the **Deployments** tab.

---

## ⚡ Method 2: Deploy Using Dokploy Managed Database + Separate Services

If you prefer using Dokploy's built-in managed database dashboard:

1. **Create Database in Dokploy**:
   - Go to **Create Service** -> **Database** -> **MySQL**.
   - Note the internal host name (e.g. `mysql-service`), user, password, and port `3306`.

2. **Deploy Backend**:
   - Create Service -> **Application**.
   - Build Type: **Dockerfile** (Path: `backend/Dockerfile`).
   - Add environment variables pointing `DB_HOST` to the Dokploy MySQL service name.
   - Port: `5000`.

3. **Deploy Frontend**:
   - Create Service -> **Application**.
   - Build Type: **Dockerfile** (Path: `frontend/Dockerfile`).
   - Set build args: `VITE_GOOGLE_CLIENT_ID` and `VITE_API_BASE_URL` (pointing to your backend domain).
   - Port: `80`.

---

## 🔍 Verification & Healthchecks

Once deployed:
1. **Frontend App**: Visit `https://your-domain.com`. Verify the homepage loads and theme toggles smoothly.
2. **API Health Check**: Visit `https://your-domain.com/api/health`.
   It should return:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-10-14T...",
     "database": "connected"
   }
   ```
3. **Admin Login**:
   - Go to `https://your-domain.com/adil`.
   - Sign in with your authorized Google account (`adilh5353@gmail.com`).
   - Verify administrative controls, emergency approvals, and donor management.

---

## 💾 Database Backups in Dokploy
To ensure your blood donors' data is always safe:
1. In Dokploy, go to your Database or Compose service.
2. Open the **Backups** tab.
3. Configure automated daily or hourly S3/local backups of the MySQL database.
