# reBorn_i — Deployment & Testing Guide

## ✅ Verified Configuration

| Component | Port | Status | URL |
|-----------|------|--------|-----|
| Backend API | 9000 | ✅ Working | http://localhost:9000 |
| Frontend (React+Vite) | 5173 | ✅ Working | http://localhost:5173 |
| Database | SQLite | ✅ Working | `./reborn_dev.db` |
| Google OAuth | - | 🔄 Configured | Awaiting origin whitelist |

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Install Dependencies

**Backend:**
```bash
cd project-root
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### Start Services

**Terminal 1 - Backend:**
```bash
$env:DEBUG = 'false'
python -m uvicorn main:app --host 0.0.0.0 --port 9000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Configuration Files

### Backend `.env`
Location: `/.env`
```env
ENVIRONMENT=development
DEBUG=false
DATABASE_URL=sqlite+aiosqlite:///./reborn_dev.db
GOOGLE_CLIENT_ID=253052508803-hh2u37u4udhvjkge92ibh2nbrr75i3ou
OPENAI_API_KEY=  (optional for local testing)
```

### Frontend `.env`
Location: `/frontend/.env`
```env
VITE_GOOGLE_CLIENT_ID=253052508803-hh2u37u4udhvjkge92ibh2nbrr75i3ou
VITE_API_URL=http://localhost:9000
```

## Testing Endpoints

### Backend API

**Health Check:**
```bash
curl http://localhost:9000/health
# Response: {"status":"ok"}
```

**API Documentation:**
- Swagger UI: http://localhost:9000/docs
- ReDoc: http://localhost:9000/redoc

**Sample Login Request:**
```bash
curl -X POST http://localhost:9000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Frontend UI

**Login Page:**
- URL: http://localhost:5173/login
- Test email/password login
- Test Google Sign-In (after authorization)

**Dashboard (After Login):**
- URL: http://localhost:5173/dashboard (redirects if not authenticated)

## Console Verification

### What Should Be Fixed ✅
- [x] No 500 errors on `/auth/google`
- [x] API calls routing to port 9000 (not 5173 or 5174)
- [x] No GSI multiple initialization warnings
- [x] No "origin not allowed" errors for Google (until authorized)
- [x] No CORS errors between frontend and backend
- [x] All environment variables properly loaded

### Remaining Google OAuth Setup 🔄
1. Go to https://console.cloud.google.com/apis/credentials
2. Find OAuth Client ID: `253052508803-hh2u37u4udhvjkge92ibh2nbrr75i3ou`
3. Add authorized origins:
   - JavaScript Origins: `http://localhost:5173`
   - Redirect URIs: `http://localhost:9000/auth/callback`
4. Wait 5-10 minutes for propagation
5. Test Google Sign-In button

## Architecture

### Frontend → Backend Communication
```
Frontend (Port 5173)
    ↓
VITE_API_URL = http://localhost:9000
    ↓
Backend API (Port 9000)
    ↓
SQLite Database
```

### Google OAuth Flow
```
Frontend: Click "Continue with Google"
    ↓
Google Identity Services (Browser API)
    ↓
User approves
    ↓
Frontend receives ID token
    ↓
POST /api/v1/auth/google (with ID token)
    ↓
Backend: Verify token with Google
    ↓
Backend: Create or link user
    ↓
Backend: Return JWT token
    ↓
Frontend: Store token, redirect to dashboard
```

## Database Schema

### SQLite Location
- Development: `./reborn_dev.db`
- Auto-initialized on backend startup

### Core Tables
- `users` - User accounts, authentication
- `resumes` - Uploaded resume PDFs
- `analyses` - Rejection risk analyses
- `simulations` - Career simulations
- `blueprints` - Growth blueprints
- `payments` - Payment transactions

Database is automatically created/migrated on backend startup.

## Troubleshooting

### Frontend Not Loading
- Check port 5173: `Invoke-WebRequest http://localhost:5173`
- Restart frontend: Stop and run `npm run dev` again
- Clear cache: Ctrl+Shift+Delete in browser

### Backend Not Responding
- Check port 9000: `Invoke-WebRequest http://localhost:9000/health`
- Check .env file in project root
- Set DEBUG=false before running
- Restart backend

### API Calls Failing
- Check `VITE_API_URL` in `frontend/.env`
- Must be: `http://localhost:9000`
- Browser console will show actual API URLs being called

### Google OAuth Issues
- 403 Forbidden: Origins not authorized in Google Cloud Console
- "Invalid Client ID": Check `GOOGLE_CLIENT_ID` in both .env files
- Token errors: Verify backend can reach Google servers

### Database Issues
- Delete `reborn_dev.db` to reset database
- Backend will auto-create on next start
- All data will be lost

## Performance Tips

### Backend
- Use SQLite for development (fast, no setup)
- Switch to PostgreSQL for production
- Database pooling configured automatically

### Frontend
- Vite provides fast HMR (Hot Module Replacement)
- Build for production: `npm run build`
- Preview build: `npm run preview`

## Production Deployment

### Environment Variables
Update before deploying:
- `ENVIRONMENT=production`
- `DEBUG=false`
- `DATABASE_URL=postgresql://...` (production database)
- `GOOGLE_CLIENT_ID=...` (authorized for production domain)
- `OPENAI_API_KEY=sk-...` (if using AI features)
- `JWT_SECRET_KEY=...` (strong random key, min 16 chars)

### Backend Deployment
```bash
# Build
python -m pip install -r requirements.txt

# Run with production settings
gunicorn main:app --workers 4 --bind 0.0.0.0:8000
# or
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend Deployment
```bash
# Build
npm run build

# Output in ./dist
# Deploy dist folder to CDN or web server
```

## Support

For issues or questions:
1. Check console (Ctrl+F12)
2. Review API docs: http://localhost:9000/docs
3. Check database: `sqlite3 reborn_dev.db`
4. Review logs in console output

