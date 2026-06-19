# KIRATECH — Render Deployment Guide

## Prerequisites
- GitHub account with this project pushed
- Render.com account (free)
- MySQL database (PlanetScale free tier OR Aiven free tier OR Render paid MySQL)

---

## Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — KIRATECH IT Support System"
git remote add origin https://github.com/YOUR_USERNAME/kiratech.git
git push -u origin main
```

---

## Step 2 — Set up MySQL Database

### Option A — PlanetScale (Recommended, free tier available)
1. Go to https://planetscale.com → Create account
2. Create database: `kiratech_db`
3. Get connection string → copy host, username, password
4. Enable `safe migrations` → OFF (for Sequelize)

### Option B — Aiven (free tier)
1. Go to https://aiven.io → Create MySQL service
2. Copy host, port, user, password, database name

### Option C — FreeSQLDatabase (100% free)
1. Go to https://freesqldatabase.com
2. Register and create a database
3. Copy connection details

---

## Step 3 — Deploy Backend on Render

1. Go to https://render.com → **New** → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Name:** `kiratech-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. Add Environment Variables (click "Add Environment Variable"):

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `DB_HOST` | your MySQL host |
| `DB_PORT` | `3306` |
| `DB_NAME` | `kiratech_db` |
| `DB_USER` | your MySQL user |
| `DB_PASSWORD` | your MySQL password |
| `JWT_SECRET` | click "Generate" |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | `https://kiratech-frontend.onrender.com` (fill after frontend deploys) |
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USER` | `robertcharles088@gmail.com` |
| `EMAIL_PASS` | `vmxwjcbxdgzfxljl` |
| `EMAIL_FROM` | `KIRATECH IT Support <robertcharles088@gmail.com>` |
| `ADMIN_EMAIL` | `robertcharles088@gmail.com` |
| `ADMIN_PASSWORD` | `Admin@123456` |
| `ADMIN_NAME` | `Robert Charles (KIRATECH Admin)` |
| `MPESA_TZ_BUSINESS_NUMBER` | `+255714759884` |
| `MPESA_TZ_ACCOUNT_REF` | `KIRATECH` |
| `AIRTEL_MERCHANT_NUMBER` | `+255784759884` |
| `TIGO_BILLER_MSISDN` | `+255652759884` |
| `MTN_MERCHANT_NUMBER` | `+255714759884` |
| `USDT_BEP20_ADDRESS` | your BEP20 wallet |
| `USDT_TRC20_ADDRESS` | your TRC20 wallet |
| `USDT_ERC20_ADDRESS` | your ERC20 wallet |
| `STRIPE_SECRET_KEY` | `sk_live_xxx` (optional) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxx` (optional) |
| `STRIPE_CURRENCY` | `usd` |

5. Click **Create Web Service**
6. Wait for deploy → note the URL: `https://kiratech-backend.onrender.com`

7. **Seed the database** — open Render Shell or run locally:
   ```bash
   cd backend
   NODE_ENV=production node scripts/seed.js
   ```

---

## Step 4 — Deploy Frontend on Render

1. Go to Render → **New** → **Static Site**
2. Connect same GitHub repo
3. Settings:
   - **Name:** `kiratech-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. Add Environment Variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://kiratech-backend.onrender.com` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_xxx` (optional) |

5. Click **Create Static Site**
6. Note the frontend URL: `https://kiratech-frontend.onrender.com`

---

## Step 5 — Update CLIENT_URL in Backend

1. Go to Render → kiratech-backend → Environment
2. Update `CLIENT_URL` to `https://kiratech-frontend.onrender.com`
3. Click **Save Changes** → backend redeploys automatically

---

## Step 6 — Verify Deployment

Open these URLs:
- Frontend: `https://kiratech-frontend.onrender.com`
- Backend health: `https://kiratech-backend.onrender.com/api/health`
- Admin login: `https://kiratech-frontend.onrender.com/admin/login`
  - Email: `robertcharles088@gmail.com`
  - Password: `Admin@123456`

---

## Important Notes

### Free Tier Limitations
- Render free web services **spin down** after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- To avoid this: upgrade to Starter ($7/month) or use a cron job to ping `/api/health` every 14 minutes

### Database
- Free MySQL services have storage limits (usually 500MB–1GB)
- PlanetScale free tier: 5GB storage, 1 billion row reads/month

### SSL / HTTPS
- Render provides free SSL automatically on all services ✅

### Custom Domain
1. Go to Render → your service → Settings → Custom Domains
2. Add your domain: `kiratech.co.tz`
3. Add CNAME record in your DNS: `kiratech.co.tz → kiratech-frontend.onrender.com`

---

## Troubleshooting

**Backend won't start:**
- Check Render logs → likely a missing env variable
- Ensure DB credentials are correct
- Check `npm start` works locally with production env

**Frontend shows blank page:**
- Check browser console for errors
- Ensure `VITE_API_URL` points to the correct backend URL
- Make sure CORS is allowing the frontend domain

**Database connection failed:**
- Most MySQL free tiers require SSL — add `?ssl={"rejectUnauthorized":true}` to DB_HOST or configure in Sequelize
- PlanetScale requires SSL by default

**Email not sending:**
- Verify Gmail App Password is correct
- Check Render logs for email errors
