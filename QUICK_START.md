# 🚀 Quick Start Guide - reBorn_i

## Status: ✅ Ready (Except Google OAuth)

---

## Start Development Servers

### Terminal 1 - Backend
```bash
cd d:\files\OneDrive\Desktop\reBorn_i
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
✓ Ready at: `http://localhost:8000`

### Terminal 2 - Frontend
```bash
cd d:\files\OneDrive\Desktop\reBorn_i\frontend
npm run dev
```
✓ Ready at: `http://localhost:5173`

---

## Test Login (Right Now!)

### Method 1: Email/Password (Works Now)
1. Go to `http://localhost:5173`
2. Click "Don't have an account? Create one"
3. Register with any email and password
4. Sign in

### Method 2: Google OAuth (Needs Setup)
1. Follow: `GOOGLE_OAUTH_FIX.md`
2. Then click "Continue with Google"

---

## Test Premium Unlock (Dev Bypass)

After logging in with email/password:

**Option A: Via UI**
- Look for "Unlock Premium" or try premium feature
- Click unlock button (uses dev-bypass endpoint)

**Option B: Via API (for debugging)**
```bash
# First, get auth token
$token = (curl -s -X POST http://localhost:8000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"password"}' | ConvertFrom-Json).access_token

# Then unlock premium
curl -X POST http://localhost:8000/api/v1/payment/dev-bypass `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{}'
```

---

## Key URLs

| Component | URL |
|-----------|-----|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:8000` |
| API Docs | `http://localhost:8000/docs` |
| Health Check | `http://localhost:8000/health` |

---

## Environment Files

Already configured ✓

**Backend:** `d:\files\OneDrive\Desktop\reBorn_i\.env`
**Frontend:** `d:\files\OneDrive\Desktop\reBorn_i\frontend\.env`

---

## Features Working ✓

- [x] User registration & login (email/password)
- [x] Resume upload & analysis
- [x] Rejection risk scoring
- [x] Career simulation
- [x] Market intelligence
- [x] Premium unlock (dev bypass)
- [x] CORS enabled for frontend
- [x] Database (SQLite) initialized
- [x] JWT authentication
- [x] Payment endpoints ready

---

## Next Step

👉 **Configure Google OAuth** (5 minutes)

See: `GOOGLE_OAUTH_FIX.md`

Once done:
- Google Sign-In will work
- All 100% of features ready for production testing

---

## Troubleshooting

### Backend not starting?
```powershell
Remove-Item env:DEBUG -ErrorAction SilentlyContinue
Remove-Item env:ENVIRONMENT -ErrorAction SilentlyContinue
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend won't load?
```bash
cd frontend
npm install  # If needed
npm run dev
```

### API returning errors?
Check: `http://localhost:8000/docs` for live API testing

---

**Everything is working. Just configure Google OAuth and you're golden! 🎯**
