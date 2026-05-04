# reBorn_i — Quick Start & Configuration

## ✅ Status
- **Backend:** Running on http://localhost:9000
- **Frontend:** Running on http://localhost:5174
- **Google Sign-In:** Configured (may need origin whitelist)

## What Was Fixed

### 1. **Backend Environment (.env)**
- Created `.env` file with all required settings
- Configured SQLite database for local development
- Added Google Client ID from production config
- Set DEBUG=false to fix Pydantic validation error

### 2. **Frontend Environment (.env)**
- Created `frontend/.env` with Google Client ID
- Frontend now loads Google Identity Services correctly
- Prevents duplicate GSI initialization

### 3. **Google Sign-In Issues**
- **Root cause:** Google Client ID not authorized for localhost:5174
- **Current status:** Button may still show 403 error until authorized

## How to Fix Google OAuth 403 Error

### Option A: Register localhost:5174 with Existing Client ID
1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Go to **APIs & Services** → **Credentials**
3. Click the OAuth Client ID `253052508803-hh2u37u4udhvjkge92ibh2nbrr75i3ou`
4. In **Authorized JavaScript origins**, add:
   ```
   http://localhost:5174
   http://localhost:9000
   ```
5. Click **Save**
6. Wait 5-10 minutes for propagation
7. Refresh browser (Ctrl+F5)

### Option B: Create a New Local-Only OAuth Client
Follow instructions in `GOOGLE_OAUTH_SETUP.md`

## Testing the Application

### Start Services (Already Running)
```bash
# Backend (port 9000)
cd d:\path\to\project
$env:DEBUG = 'false'
python -m uvicorn main:app --host 0.0.0.0 --port 9000

# Frontend (port 5174)
cd frontend
npm run dev
```

### Test Endpoints
- **Frontend:** http://localhost:5174/login
- **Backend Health:** http://localhost:9000/health
- **API Docs:** http://localhost:9000/docs

### Test Email/Password Login
1. Go to http://localhost:5174/login
2. Use email: `mentor@tasavur.com` (if user exists)
3. Sign In button works
4. Google button works (after authorization)

## Console Errors That Are Fixed ✅
- [x] GSI_LOGGER multiple initialization warning
- [x] DEBUG environment variable validation error
- [x] Duplicate Google script loads
- [x] Missing frontend .env file

## Console Errors That Need Authorization 🔄
- [ ] 403 Forbidden on `accounts.google.com` - needs localhost:5174 in authorized origins

## Environment Variables Reference

### Backend `.env`
```
ENVIRONMENT=development
DEBUG=false
DATABASE_URL=sqlite+aiosqlite:///./reborn_dev.db
GOOGLE_CLIENT_ID=253052508803-hh2u37u4udhvjkge92ibh2nbrr75i3ou
OPENAI_API_KEY=  (leave empty for dev)
```

### Frontend `.env`
```
VITE_GOOGLE_CLIENT_ID=253052508803-hh2u37u4udhvjkge92ibh2nbrr75i3ou
VITE_API_URL=  (leave empty for local dev)
```

## Next Steps
1. **Test basic login** (email/password) - should work immediately
2. **Authorize localhost:5174** in Google OAuth client
3. **Test Google Sign-In** - should work after authorization
4. Deploy to production with proper domain

