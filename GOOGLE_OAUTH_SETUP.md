# Google OAuth Setup Guide for reBorn_i

## Current Configuration

Your application is already configured with:
- **Backend**: `GOOGLE_CLIENT_ID=253052508803-hh2u37u4udhvjkge92ibh2nbrr75i3ou.apps.googleusercontent.com`
- **Frontend**: `VITE_GOOGLE_CLIENT_ID=253052508803-hh2u37u4udhvjkge92ibh2nbrr75i3ou.apps.googleusercontent.com`

## Required Google Cloud Console Configuration

To make Google Sign-In work, you **must** configure the following in your [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

### 1. Navigate to Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID (`253052508803-hh2u37u4udhvjkge92ibh2nbrr75i3ou`)

### 2. Configure Authorized JavaScript Origins

Add the following origins where your app runs:

#### Development:
```
http://localhost:5173
http://localhost:8000
http://127.0.0.1:5173
http://127.0.0.1:8000
```

#### Production (when deployed):
```
https://yourdomain.com
https://api.yourdomain.com
```

### 3. Configure Authorized Redirect URIs

Add these redirect URIs:

#### Development:
```
http://localhost:5173
http://localhost:5173/
http://localhost:8000/api/v1/auth/google
```

#### Production:
```
https://yourdomain.com
https://yourdomain.com/
https://api.yourdomain.com/api/v1/auth/google
```

### 4. Enable Required APIs

Ensure these APIs are enabled in your project:
- **Google+ API** (or Google Sign-In API)
- **Google Identity Services**

## Common Issues & Solutions

### Issue 1: "redirect_uri_mismatch" Error
**Solution**: Make sure `http://localhost:5173` is in **Authorized JavaScript origins** (not redirect URIs). The Google Sign-In button uses origins, not redirect URIs.

### Issue 2: "idpiframe_initialization_failed" Error
**Solution**: 
- Clear browser cookies/cache
- Check that JavaScript origin matches exactly (no trailing slash for origins)
- Disable third-party cookie blocking for localhost

### Issue 3: Popup Blocked
**Solution**: The app uses `ux_mode: 'popup'`. If popup blockers interfere, users need to allow popups or the app will fallback gracefully.

### Issue 4: "Invalid client_id"
**Solution**: 
- Verify the client ID in `.env` matches the one in Google Cloud Console
- Ensure the client ID is for a **Web application** OAuth client (not Android/iOS)

### Issue 5: CORS Errors
**Solution**:
- Ensure your backend CORS settings allow the frontend origin
- Check that `CORS_ORIGINS` in backend `.env` includes `http://localhost:5173` or `*`

## Testing the Setup

1. **Start Backend**:
   ```powershell
   .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
   ```

2. **Start Frontend** (in `frontend/` directory):
   ```powershell
   npm run dev
   ```

3. **Navigate to**: `http://localhost:5173/login`

4. **Click "Continue with Google"**:
   - A Google popup should open
   - Select your Google account
   - Should redirect to dashboard after authentication

## Verification Checklist

- [ ] OAuth 2.0 Client ID created in Google Cloud Console
- [ ] Client ID matches in both `.env` files
- [ ] Authorized JavaScript origins include `http://localhost:5173`
- [ ] Authorized JavaScript origins include `http://localhost:8000` (optional)
- [ ] Google+ API or Identity Services enabled
- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Browser allows popups from localhost
- [ ] Third-party cookies not blocked

## Creating a New OAuth Client (if needed)

If you need to create a **new** OAuth client:

1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Choose **Web application**
4. Add **Authorized JavaScript origins**: `http://localhost:5173`
5. (Optional) Add redirect URIs if needed later
6. Copy the **Client ID**
7. Update both `.env` files with the new Client ID

## Environment File Templates

### Backend `.env`
```dotenv
GOOGLE_CLIENT_ID=YOUR-CLIENT-ID.apps.googleusercontent.com
```

### Frontend `.env`
```dotenv
VITE_GOOGLE_CLIENT_ID=YOUR-CLIENT-ID.apps.googleusercontent.com
```

## Security Notes

- **Never commit** your `.env` files to version control
- In production, use environment variables instead of `.env` files
- Restrict OAuth client to specific domains in production
- Enable only necessary Google APIs

## Troubleshooting Commands

### Check if Google Script Loaded (Browser Console):
```javascript
console.log(window.google?.accounts?.id);
```

### Check Environment Variable (Frontend):
```javascript
console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID);
```

### Backend Health Check:
```bash
curl http://localhost:8000/api/v1/health
```

## Support

If issues persist:
1. Check browser console for specific error messages
2. Check backend logs for authentication errors
3. Verify Google Cloud Console audit logs
4. Test with a different browser (to rule out cookie/extension issues)
