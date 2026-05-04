# Google OAuth Setup for reBorn_i

## Problem
The Google Sign-In button appears but throws a 403 error:
```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
```

## Solution: Get a Valid Google OAuth Client ID

### Step 1: Create a Google Cloud Project
1. Go to **Google Cloud Console**: https://console.cloud.google.com/
2. Click the project selector (top left) → **New Project**
3. Enter `reBorn_i` as project name
4. Click **Create**

### Step 2: Enable Google Identity Services API
1. In the console, search for **"Identity"** or navigate to APIs
2. Enable **Google Identity Services API**

### Step 3: Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth Client ID**
3. Select **Web application**
4. In **Authorized JavaScript origins**, add:
   ```
   http://localhost:5174
   http://localhost:3000
   (add your production domain later)
   ```
5. In **Authorized redirect URIs**, add:
   ```
   http://localhost:5174/login
   http://localhost:8000/auth/callback
   ```
6. Click **Create**
7. Copy your **Client ID** (looks like: `123456-abc123.apps.googleusercontent.com`)

### Step 4: Configure Backend
1. Open `.env` in the project root
2. Set:
   ```
   GOOGLE_CLIENT_ID=your-client-id-here
   ```

### Step 5: Configure Frontend
1. Open `frontend/.env`
2. Set:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here
   ```

### Step 6: Restart Servers
```bash
# Restart backend (press Ctrl+C, then restart)
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Restart frontend (press Ctrl+C, then restart)
npm run dev
```

## Testing
The Google button should now work without 403 errors.

## Troubleshooting

### Still seeing 403 error?
- Verify the Client ID is copied correctly
- Check that `localhost:5174` is in **Authorized JavaScript origins**
- Wait 5-10 minutes for Google to propagate the changes

### GSI_LOGGER still shows error?
- Check browser console - should not have the "given origin is not allowed" message
- Clear browser cache (Ctrl+Shift+Delete)
- Try incognito mode

### Button doesn't appear at all?
- Check if `VITE_GOOGLE_CLIENT_ID` is empty (it is by design - button is hidden)
- Add the Client ID to `frontend/.env` and restart frontend

