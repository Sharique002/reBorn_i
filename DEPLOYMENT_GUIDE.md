# reBorn_i Deployment Guide

## Overview
- **Frontend**: Deployed to Vercel
- **Backend**: Deployed to Railway/Render/PythonAnywhere (separate)

---

## Part 1: Frontend Deployment to Vercel

### Step 1: Prepare GitHub Repository
```bash
git add .
git commit -m "chore: prepare for Vercel deployment"
git push origin main
```

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up or log in with GitHub
3. Click "Add New" → "Project"
4. Select your GitHub repository (`reBorn_i`)
5. Vercel auto-detects the `vercel.json` config

### Step 3: Set Environment Variables in Vercel
In Vercel project settings → Environment Variables, add:

```
VITE_GOOGLE_CLIENT_ID = 253052508803-hh2u37u4udhvjkge92ibh2nbrr75i3ou.apps.googleusercontent.com

VITE_API_URL = https://your-backend-url.railway.app
                (set this AFTER backend deployment)
```

### Step 4: Deploy
- Vercel auto-deploys on push to `main`
- Or manually click "Deploy" in Vercel dashboard
- Frontend will be live at: `https://your-app.vercel.app`

---

## Part 2: Backend Deployment to Railway/Render

Choose ONE platform below:

### Option A: Railway (Recommended - simple)

1. **Create Railway Account**: [railway.app](https://railway.app)

2. **Create New Project**:
   - Click "New Project"
   - Select "GitHub Repo" 
   - Connect your repo

3. **Configure Build**:
   - Railway auto-detects `requirements.txt`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. **Set Environment Variables**:
   - Go to Variables tab
   - Add ALL from your `.env`:
     ```
     DATABASE_URL=postgresql://... (use Railway Postgres)
     API_HOST=0.0.0.0
     API_PORT=8000
     CORS_ORIGINS=https://your-app.vercel.app
     JWT_SECRET_KEY=... (copy from local .env)
     GOOGLE_CLIENT_ID=...
     OPENAI_API_KEY=... (if using)
     ```

5. **Connect PostgreSQL Database**:
   - Click "Add Service" → "Postgres"
   - Railway auto-generates `DATABASE_URL`

6. **Deploy**:
   - Push to GitHub (or click Deploy in Railway)
   - Copy the public URL: `https://something.railway.app`

### Option B: Render (Alternative)

1. **Create Render Account**: [render.com](https://render.com)

2. **Create New Service**:
   - Select "Web Service"
   - Connect GitHub repo
   - Branch: `main`

3. **Configure**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Instance Type: Free or Starter

4. **Environment Variables**:
   - Add same as Railway (see above)
   - Render auto-generates `DATABASE_URL` if you add PostgreSQL

5. **Deploy**:
   - Copy the public URL

---

## Part 3: Update Frontend with Backend URL

1. **After backend is live**:
   - Copy the backend URL (e.g., `https://your-api.railway.app`)

2. **In Vercel Project Settings**:
   - Go to Environment Variables
   - Update `VITE_API_URL` to your backend URL
   - Trigger redeploy (push to main or click "Redeploy")

3. **Test**:
   - Visit your Vercel frontend
   - Try logging in or uploading a resume
   - Check browser console for API errors

---

## Part 4: Update Backend CORS for Production

The `.env` already has `CORS_ORIGINS` configured. When deploying:

```env
# In backend .env on Railway/Render
CORS_ORIGINS=https://your-app.vercel.app,https://your-domain.com
```

This allows your frontend to call the backend API.

---

## Part 5: Database Setup

### Local Development
- SQLite: `sqlite+aiosqlite:///./reborn_dev.db` (default)

### Production
- **Railway**: Use Railway Postgres (auto-created)
- **Render**: Use Render Postgres or MongoDB
- Update `DATABASE_URL` in backend env variables

---

## Database Migrations

On first backend deploy, run:
```bash
# (This happens auto on startup if using SQLAlchemy)
# Check logs in Railway/Render dashboard
```

---

## Testing the Deployment

### Frontend (Vercel)
```bash
# Visit your Vercel URL
https://your-app.vercel.app

# Open browser console (F12 → Console)
# Try logging in or uploading a resume
# Check for API errors
```

### Backend (Railway/Render)
```bash
# Visit health check
https://your-backend.railway.app/api/v1/health

# Should return: {"status": "ok", "timestamp": "..."}
```

---

## Troubleshooting

### "CORS error" or "Failed to fetch"
- Backend `CORS_ORIGINS` doesn't include frontend URL
- Fix: Update backend env var, redeploy

### "Cannot find module" on Railway/Render
- `requirements.txt` missing dependencies
- Fix: Run `pip freeze > requirements.txt` locally, push

### "Database connection error"
- `DATABASE_URL` env var not set or wrong
- Fix: Copy the Postgres URL from Railway/Render dashboard

### Frontend shows "API not available"
- `VITE_API_URL` not set or wrong
- Fix: Check Vercel Environment Variables

---

## Quick Commands Reference

```bash
# Build frontend locally
cd frontend && npm run build

# Build backend locally
pip install -r requirements.txt

# Run backend locally
uvicorn app.main:app --reload

# Update requirements for production
pip freeze > requirements.txt
```

---

## Next Steps

1. ✅ Push code to GitHub
2. ⏳ Deploy frontend to Vercel (3-5 min)
3. ⏳ Deploy backend to Railway (5-10 min)
4. ✅ Update `VITE_API_URL` in Vercel with backend URL
5. ✅ Test the full app end-to-end
6. 🎉 Share your live URL!

**Your live app will be at**: `https://your-app.vercel.app`
