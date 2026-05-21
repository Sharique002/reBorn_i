# 🔧 Payment Modal Not Appearing - Diagnostic Guide

## Problem
After clicking "Unlock Now" button, the payment modal doesn't show up.

---

## 🔍 Quick Diagnostics (Check These First)

### 1. **Open Browser Console**
Press: `F12` → Click "Console" tab

Look for error messages like:
- ❌ `Cannot read property 'status' of undefined`
- ❌ `PaymentModal component error`
- ❌ `Network error`
- ❌ `404 on /api/v1/payment/create-order`

### 2. **Check Network Tab**
Press: `F12` → Click "Network" tab → Click "Unlock Now"

**Look for these API calls:**
- `POST /api/v1/payment/create-order` → Should return **200** or **201**
- `GET /api/v1/users/subscription-status` → Should return **200**

**If you see 404 or 401:**
- 404 = Endpoint doesn't exist → Backend issue
- 401 = Not authenticated → Login issue

### 3. **Check if Frontend is in DEV mode**
In browser console, type:
```javascript
import.meta.env.DEV
```
Should return: `true` (development mode)

If `false`, dev bypass won't work.

---

## ✅ Step-by-Step Fix

### Fix 1: Verify Backend is Running
```bash
# Check health endpoint
curl http://localhost:8000/health

# Should return:
{"status":"ok"}
```

### Fix 2: Verify Frontend Token
In browser console:
```javascript
localStorage.getItem('token')
```
Should return a long JWT token, NOT `null`.

**If null → You're not logged in!**
- Go to: http://localhost:5173/login
- Login with: test01@example.com / Password@123
- Then try unlock again

### Fix 3: Check Backend Logs
Look at the backend terminal output when you click "Unlock Now".

**You should see:**
```
POST /api/v1/payment/create-order - user_id: xxx
```

**If you don't see this:**
- Backend not receiving requests
- Frontend might be pointing to wrong backend URL
- Check: `frontend/.env` → `VITE_API_URL=http://localhost:8000`

### Fix 4: Verify Payment Modal Component
In browser console:
```javascript
// Check subscription store status
import { useSubscriptionStore } from '@/modules/subscription/store';
const state = useSubscriptionStore.getState();
console.log('Status:', state.status);
console.log('Plan:', state.plan);
console.log('Error:', state.error);
```

**Expected when you click "Unlock Now":**
- First: `status: 'loading'`
- Then: `status: 'redirecting'`
- Then: `status: 'confirming'` (after payment)
- Finally: `status: 'success'` or `status: 'error'`

---

## 🐛 Common Issues & Solutions

### Issue 1: Status stays 'idle'
**Problem:** `startUpgrade()` not being called

**Check:**
1. Is button being clicked? (Should see button change to "Opening Razorpay...")
2. Is there an error? (Check console)
3. Are you logged in? (Check localStorage token)

**Solution:**
```bash
# Hard refresh browser
Ctrl + Shift + R

# Or clear cache and refresh
Ctrl + Shift + Delete  # Open cache clear
# Select "All time" → Clear now
# Go back to http://localhost:5173/dashboard
```

---

### Issue 2: Status is 'loading' but modal doesn't appear
**Problem:** Modal component not rendering

**Check:**
1. Is `PaymentModal.tsx` component rendering?
2. Is `status` correctly set to 'loading'?

**In browser console:**
```javascript
// Check if modal should be visible
const { status, isPro } = useSubscriptionStore.getState();
console.log('Should show modal:', ['loading', 'redirecting', 'confirming'].includes(status) && !isPro);
```

**Solution:**
Make sure in `SubscriptionProvider.tsx` line 32:
```tsx
<PaymentModal />
```
is present (it should be).

---

### Issue 3: Network error 404
**Problem:** Backend endpoint missing

**Check:**
- Backend running on `http://localhost:8000`?
- Endpoint exists in `app/api/routes.py`?

**Verify endpoint:**
```bash
curl -X POST http://localhost:8000/api/v1/payment/create-order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Should return:
```json
{
  "order_id": "order_xxx",
  "currency": "INR"
}
```

---

### Issue 4: 401 Unauthorized
**Problem:** Not authenticated

**Solution:**
1. Go to: http://localhost:5173/login
2. Enter credentials: `test01@example.com` / `Password@123`
3. Click "Sign In"
4. Wait for redirect to dashboard
5. Then try "Unlock Now" again

---

### Issue 5: Razorpay Script Not Loading
**Problem:** `Cannot read property 'Razorpay' of undefined`

**Check:**
1. Network tab → Look for `https://checkout.razorpay.com/v1/checkout.js`
2. Is it loaded? (should see 200 status)

**Solution:**
```bash
# Check if script loads
curl -I https://checkout.razorpay.com/v1/checkout.js
# Should return 200 OK

# In browser console:
window.Razorpay
# Should NOT be undefined
```

---

## 📋 Complete Verification Flow

Follow this step-by-step to debug:

```
1. ✓ Backend running?
   → curl http://localhost:8000/health

2. ✓ Frontend running?
   → Visit http://localhost:5173

3. ✓ Logged in?
   → Check localStorage: localStorage.getItem('token')

4. ✓ Open browser console?
   → F12 → Console tab

5. ✓ Try clicking "Unlock Now"
   → Check console for errors

6. ✓ Check Network tab
   → Look for API requests and responses

7. ✓ Check store status
   → import.meta.env.DEV should be true
   → status should change to 'loading'

8. ✓ Check PaymentModal component
   → Should render when status is 'loading/redirecting/confirming'

9. ✓ Razorpay script loaded?
   → window.Razorpay should exist
```

---

## 🔧 Force Reset

If nothing works, try a complete reset:

```bash
# 1. Hard refresh browser
Ctrl + Shift + R

# 2. Clear localStorage
localStorage.clear()

# 3. Logout and login again
# Go to: http://localhost:5173/login
# Login with: test01@example.com / Password@123

# 4. If still issues, restart backend:
# Kill backend process
# Delete: reborn_dev.db
# Restart: python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📞 When to Share Logs

If the issue persists, please provide:

1. **Browser Console Error:**
   ```
   F12 → Console → Copy any errors
   ```

2. **Network Request Failure:**
   ```
   F12 → Network → Right-click failed request → Copy as cURL
   ```

3. **Backend Log Entry:**
   ```
   When you click "Unlock Now", what does backend terminal show?
   ```

4. **Store State:**
   ```javascript
   // In browser console:
   import.meta.env.DEV
   ```

---

## ✅ Expected Behavior (When Working)

**When you click "Unlock Now":**

1. Button changes to: "Opening Razorpay..." (with spinner)
2. Modal overlay appears with backdrop blur
3. Razorpay checkout loads inside modal
4. You enter payment details
5. After payment: Modal closes → Dashboard shows "Premium" badge
6. Button disappears, reports unlocked

---

**Status:** Use this guide to identify which step is failing.  
**Next:** Share your findings with detailed console error messages.
