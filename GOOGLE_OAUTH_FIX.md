# 🔧 Google OAuth Fix Guide

## Problem
Console error: **"[GSI] LOGGER: The given origin is not allowed for the given client ID"**

This means your Google OAuth credentials don't authorize `http://localhost:5173`.

---

## Solution: Update Google Cloud Console

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/apis/credentials
2. Sign in with your Google account
3. Select your project (or create one if needed)

### Step 2: Find Your OAuth 2.0 Client ID
- Look for "OAuth 2.0 Client IDs" section
- You should see: `253052508803-hh2u37u4udhvjkge92ibh2nbrr75i3ou.apps.googleusercontent.com`
- Click on it to open

### Step 3: Add Authorized Origins
In the OAuth Client settings, find **"Authorized JavaScript origins"** section and add:

```
http://localhost:5173
http://localhost:5174
http://127.0.0.1:5173
http://127.0.0.1:5174
```

Also add to **"Authorized redirect URIs"** if the section exists:
```
http://localhost:5173
http://localhost:8000
```

### Step 4: Save Changes
- Click "Save" button
- Wait a few seconds for changes to propagate

### Step 5: Test
1. Refresh the browser (hard refresh: Ctrl+Shift+R)
2. Clear browser cache if needed
3. Try clicking "Continue with Google"

---

## Alternative: Test Without Google OAuth

If you want to skip Google auth setup, just use email/password:

1. Click "Don't have an account? Create one"
2. Register with email and password
3. Sign in normally

Or use the dev bypass endpoint:
- After signing in, you can unlock premium without payment: `/dev-bypass`

---

## Environment Variables Check

Backend (.env):
- ✓ `GOOGLE_CLIENT_ID=253052508803-hh2u37u4udhvjkge92ibh2nbrr75i3ou.apps.googleusercontent.com`

Frontend (frontend/.env):
- ✓ `VITE_GOOGLE_CLIENT_ID=253052508803-hh2u37u4udhvjkge92ibh2nbrr75i3ou.apps.googleusercontent.com`
- ✓ `VITE_API_URL=http://localhost:8000`

Both are correctly configured. You just need to update the Google credentials.

---

## What Happens After Fix

Once you add the authorized origins, the Google Sign-In button will:
1. Load successfully
2. Accept clicks from your frontend
3. Open the Google login popup
4. Create/log in users automatically

---

## Still Having Issues?

### Issue: Button still says "Not rendering button"
→ Hard refresh browser (Ctrl+Shift+R)  
→ Clear browser cache  
→ Wait 5-10 minutes for Google's cache to update

### Issue: "ERR_CONNECTION_REFUSED"
→ Make sure backend is running: `python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`  
→ Test: `curl http://localhost:8000/health`

### Issue: Still getting 403 on Google button load
→ Double-check you saved the authorized origins  
→ Make sure exact URL is `http://localhost:5173` (not `http://127.0.0.1:5173`)  
→ Wait 10 minutes and try again

---

**Questions?** Check the backend logs or browser DevTools console for detailed error messages.
