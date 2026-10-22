# 🩸 Blood Donation Platform (Sylhet) - MySQL & REST API Architecture

A modern, high-performance blood donation management platform built for Sylhet, Bangladesh. Migrated from Supabase BaaS to an enterprise-grade **3-Tier Architecture** with a dedicated **Node.js + Express REST API** and a **MySQL** relational database.

---

## 📁 Repository Structure

```
Blood-donation/
├── frontend/                        # React 19 + Vite + Tailwind CSS Single Page Application
│   ├── public/                      # Static assets & manifest
│   ├── src/
│   │   ├── components/              # UI components (Layout, DonorCard, EmergencyForm, etc.)
│   │   ├── context/AppContext.tsx   # Global state & multi-language i18n
│   │   ├── pages/                   # Home, Register, Emergency, Admin (/adil), Support
│   │   ├── services/
│   │   │   ├── apiConfig.ts         # Base URL & API routing configuration
│   │   │   └── db.ts                # REST API client & local fallback
│   │   └── types/index.ts           # Shared TypeScript interfaces
│   ├── .env.example                 # Frontend environment variables template
│   ├── package.json                 # Frontend scripts & dependencies
│   └── vite.config.js               # Dev server with proxy to backend (/api -> :5000)
│
├── backend/                         # Node.js + Express + TypeScript REST API Server
│   ├── database/
│   │   ├── schema.sql               # MySQL 8.0+ DDL table creation scripts
│   │   └── seed.sql                 # Sample Sylhet donors, emergency requests & default admin
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts                # mysql2 connection pool
│   │   │   └── initDb.ts            # Automated DB & table initializer
│   │   ├── controllers/             # Business logic for Donors, Emergencies, Admin, Support
│   │   ├── middleware/              # Bot honeypots, IP rate limiter, JWT admin auth
│   │   ├── cron/                    # Hourly maintenance (90-day cooldown & 24h emergency pruning)
│   │   ├── routes/                  # Express REST router (/api/*)
│   │   └── server.ts                # Express application entrypoint
│   ├── .env.example                 # Backend environment variables template
│   ├── package.json                 # Backend scripts & dependencies
│   └── tsconfig.json                # TypeScript compiler configuration
│
├── package.json                     # Monorepo runner (concurrent dev scripts)
└── README.md                        # Documentation & setup guide
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **MySQL**: v8.0+ or MariaDB 10.5+ (e.g. via XAMPP, Docker, or native MySQL installation)

---

### 2. Configure MySQL Database

#### Option A: Automatic Initialization (Recommended)
1. Ensure your local MySQL server is running (e.g., start MySQL in XAMPP Control Panel).
2. Configure your database credentials in [backend/.env](file:///f:/GITHUB/Blood-donation/backend/.env):
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=blood_donation_db
   ```
3. Run the automated initializer from the project root:
   ```bash
   npm run db:init
   ```
   *This automatically creates the database `blood_donation_db`, creates all 7 tables, seeds the default admin (`adilhussa1n`), and populates sample donors from Sylhet.*

#### Option B: Manual Import (phpMyAdmin / MySQL Workbench)
If you prefer phpMyAdmin:
1. Open `http://localhost/phpmyadmin`.
2. Import [backend/database/schema.sql](file:///f:/GITHUB/Blood-donation/backend/database/schema.sql).
3. Import [backend/database/seed.sql](file:///f:/GITHUB/Blood-donation/backend/database/seed.sql).

---

### 3. Run the Application

From the root directory, start both the Backend API and Frontend Vite server with a single command:

```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **API Health Check**: `http://localhost:5000/api/health`
- **Admin Dashboard**: `http://localhost:5173/adil` (Requires authorized Google Authentication)

---

## 🛠️ Individual Workspace Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs both backend and frontend concurrently |
| `npm run dev:backend` | Runs backend only with live hot-reloading (`tsx watch`) |
| `npm run dev:frontend` | Runs frontend Vite dev server |
| `npm run db:init` | Automatically verifies/creates tables and seeds data in MySQL |
| `npm run build` | Builds production bundles for both frontend and backend |
| `npm run install:all` | Installs root, frontend, and backend packages |

---

## 📡 REST API Reference

All routes are prefixed with `/api`.

### Donors
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/donors` | Get all donors (public fields only) |
| `GET` | `/api/donors/:phone` | Get a specific donor profile |
| `POST` | `/api/donors/register` | Register a new donor (with bot honeypot & rate limit) |
| `POST` | `/api/donors/login` | Donor login / credentials verification |
| `POST` | `/api/auth/google` | Direct Google OAuth 2.0 login & registration |
| `PATCH` | `/api/donors/:id/availability` | Toggle donor availability status |
| `PUT` | `/api/donors/:id` | Update donor profile details |
| `POST` | `/api/donors/reset-password` | Reset password using DOB & identity verification |
| `POST` | `/api/donors/:id/donations` | Log donation event (updates cooldown & counts) |
| `GET` | `/api/donors/:id/history` | Get donor donation history |
| `DELETE` | `/api/donors/:id` | Delete donor (Admin only) |

---

## 🔑 Google Authentication Setup

The platform includes **direct Google Authentication** for both donor registration and sign-in.

### Zero-Friction Local Testing (Default)
Out of the box without any setup, clicking **"Continue with Google"** or **"Register with Google"** opens an interactive Google Authentication dialog. You can enter or test with any Google display name and email address, verifying database persistence and session recovery instantly without Google Cloud credentials.

### Production Google OAuth 2.0 Setup
To enable native Google popups with your real domain:
1. Go to [Google Cloud Console](https://console.cloud.google.com/) -> **APIs & Services** -> **Credentials**.
2. Create an **OAuth 2.0 Client ID** (Application type: *Web application*).
3. Add Authorized JavaScript origins:
   - `http://localhost:5173` (for local dev)
   - `https://yourproductiondomain.com`
4. Add the Client ID to [frontend/.env](file:///f:/GITHUB/Blood-donation/frontend/.env):
   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```
5. *(Optional)* Add to [backend/.env](file:///f:/GITHUB/Blood-donation/backend/.env):
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

### Emergency Requests
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/emergencies` | Get active emergency blood requests |
| `POST` | `/api/emergencies` | Submit emergency blood request |
| `PATCH` | `/api/emergencies/:id/status` | Update emergency status (`needed`/`responded`/`fulfilled`) |
| `DELETE` | `/api/emergencies/:id` | Delete emergency request (requires passcode or admin) |

### Admin & Security
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/admin/login` | Admin login |
| `POST` | `/api/admin/block` | Blacklist/block a phone number |
| `DELETE` | `/api/admin/block/:phone` | Unblock a phone number |
| `GET` | `/api/admin/blocked` | Get list of all blocked numbers |
| `GET` | `/api/admin/check-blocked/:phone` | Check if a specific number is blocked |

### Support & Feedback
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/support` | Submit a support request or bug report |
| `GET` | `/api/support` | Get all support requests (Admin only) |

---

## 🔒 Security Enhancements over Supabase
1. **Password Hashing**: Passwords are securely hashed on the backend using `bcryptjs` with salt rounds.
2. **IP Rate Limiting & Bot Honeypot**: Prevents automated spam and scraping on registration and emergency endpoints.
3. **No Direct DB Access**: Database credentials remain securely on the server; the browser never interacts directly with MySQL.
4. **Automated Maintenance**: Background cron job resets donor 90-day cooldowns and prunes expired 24-hour emergencies automatically without client triggers.
