# Deployment Checklist

## Pre-Deployment (Do these now)

- [ ] Update `frontend/.env.example` with `VITE_API_URL` (✅ Done)
- [ ] Update `frontend/src/api/client.ts` to use `VITE_API_URL` (✅ Done)
- [ ] Create `vercel.json` config (✅ Done)
- [ ] Create `.env.production.example` template (✅ Done)

## Frontend to Vercel

- [ ] Commit changes to git: `git add . && git commit -m "chore: prepare for Vercel deployment" && git push`
- [ ] Go to [vercel.com](https://vercel.com) and sign in with GitHub
- [ ] Click "Add New" → "Project" and select this repo
- [ ] In Environment Variables, add:
  - [ ] `VITE_GOOGLE_CLIENT_ID` = `253052508803-hh2u37u4udhvjkge92ibh2nbrr75i3ou.apps.googleusercontent.com`
  - [ ] `VITE_API_URL` = (leave blank for now, set after backend deployment)
- [ ] Click "Deploy" and wait for completion
- [ ] Note the Vercel URL: `https://_____.vercel.app`

## Backend to Railway

- [ ] Go to [railway.app](https://railway.app) and sign up with GitHub
- [ ] Create new project and select this GitHub repo
- [ ] Railway auto-detects build/start commands
- [ ] Go to Variables tab and add environment variables from `.env.production.example`:
  - [ ] `API_HOST=0.0.0.0`
  - [ ] `API_PORT=8000`
  - [ ] `CORS_ORIGINS=https://your-vercel-app.vercel.app`
  - [ ] `JWT_SECRET_KEY` (from your local `.env`)
  - [ ] `GOOGLE_CLIENT_ID=253052508803-hh2u37u4udhvjkge92ibh2nbrr75i3ou.apps.googleusercontent.com`
  - [ ] All other secrets from `.env`
- [ ] Click "Add Service" → "PostgreSQL" to add database
- [ ] Go to Variables tab and find the auto-generated `DATABASE_URL`
- [ ] Deploy and wait for completion
- [ ] Note the Railway URL: `https://_____.railway.app`
- [ ] Test health check: `https://_____.railway.app/api/v1/health`

## Post-Deployment

- [ ] Update Vercel `VITE_API_URL` environment variable with Railway backend URL
- [ ] Trigger redeploy in Vercel (push to main or click "Redeploy")
- [ ] Wait 2-3 minutes for new deployment
- [ ] Test in browser:
  - [ ] Visit your Vercel app
  - [ ] Open Developer Tools (F12)
  - [ ] Try signing up with email
  - [ ] Try uploading a resume
  - [ ] Check Console for any API errors

## Troubleshooting

If frontend can't reach backend:
- [ ] Check Vercel `VITE_API_URL` is correct
- [ ] Check Railway `CORS_ORIGINS` includes your Vercel URL
- [ ] Check Railway logs for errors (Variables tab in Railway)
- [ ] Open browser console and check exact error message

## Done! 🎉

Your live app is at: `https://your-app.vercel.app`

Backend API is at: `https://your-backend.railway.app/api/v1`
