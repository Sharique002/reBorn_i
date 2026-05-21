# 🧪 reBorn_i - Test Credentials & Quick Reference

> Complete guide for testing reBorn_i application with ready-to-use credentials and Razorpay test cards.

---

## 📧 Test Email Accounts

| Email | Name | Password | Use Case |
|-------|------|----------|----------|
| `test01@example.com` | Test User 01 | `Password@123` | Basic Testing |
| `test02@example.com` | Payment Tester | `PayTest@456` | Payment Flow |
| `test03@example.com` | Premium User | `Premium@789` | Premium Features |
| `test04@gmail.com` | Google Tester | `Google@101112` | Google OAuth |
| `qa@test.com` | QA Tester | `QATest@2025` | Quick Testing |

---

## 💳 Razorpay Test Cards

### ✅ Success Payment
```
Card Number:  4111 1111 1111 1111
Expiry:       12/25
CVV:          123
Status:       ✅ Payment succeeds
```

### ❌ Declined Payment
```
Card Number:  4222 2222 2222 2222
Expiry:       12/25
CVV:          123
Status:       ❌ Payment fails (for error testing)
```

---

## 🚀 Quick Start Guide

### Step 1: Register New Account
```
URL:      http://localhost:5173/register
Email:    test01@example.com
Name:     Test User 01
Password: Password@123
Confirm:  Password@123

Click: "Create Account"
```

### Step 2: Login
```
URL:      http://localhost:5173/login
Email:    test01@example.com
Password: Password@123

Click: "Sign In"
```

### Step 3: Navigate to Dashboard
```
Expected URL: http://localhost:5173/dashboard
You should see:
  ✓ User profile card
  ✓ "Unlock Full Report for ₹9" button
  ✓ Report preview (limited for free users)
```

### Step 4: Test Premium Unlock
```
1. Click "Unlock Full Report for ₹9" button
2. Payment modal appears
3. Razorpay checkout opens
4. Enter test card: 4111 1111 1111 1111
5. Complete payment
6. ✅ Premium features unlock!
```

---

## 🔧 Development Mode Features

### Dev Bypass Endpoint
If Razorpay payment fails during testing:
- The app auto-calls: `/api/v1/payment/dev-bypass`
- Instantly upgrades to Pro without payment
- Only available in development mode

### Test Flow
```
1. Click "Unlock Full Report"
2. If Razorpay errors → Dev bypass activates
3. ✅ Automatically upgrades user to Premium
4. No payment needed in dev!
```

---

## 📱 Testing Checklist

- [ ] **Registration**
  - [ ] Register new user with test email
  - [ ] All fields validated
  - [ ] Success message shown
  
- [ ] **Login**
  - [ ] Login with correct credentials
  - [ ] Redirected to dashboard
  - [ ] User profile visible
  
- [ ] **Premium Unlock**
  - [ ] Click "Unlock Full Report" button
  - [ ] Payment modal appears
  - [ ] Razorpay checkout opens
  
- [ ] **Payment**
  - [ ] Enter test card: 4111 1111 1111 1111
  - [ ] Complete payment
  - [ ] Premium features unlock
  
- [ ] **Premium Features**
  - [ ] Full report accessible
  - [ ] All premium content visible
  - [ ] Logout and login → Premium persists
  
- [ ] **Error Handling**
  - [ ] Try declined card: 4222 2222 2222 2222
  - [ ] Error message displayed
  - [ ] Can retry payment

---

## 🔗 Important URLs

| Feature | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Registration** | http://localhost:5173/register |
| **Login** | http://localhost:5173/login |
| **Dashboard** | http://localhost:5173/dashboard |
| **Backend API** | http://localhost:8000 |
| **API Health** | http://localhost:8000/health |
| **API Docs** | http://localhost:8000/docs |

---

## 🛠️ Backend Endpoints (For Manual Testing)

### Authentication
```bash
# Register
POST /api/v1/auth/register
Body: {
  "email": "test01@example.com",
  "password": "Password@123",
  "full_name": "Test User 01"
}

# Login
POST /api/v1/auth/login
Body: {
  "email": "test01@example.com",
  "password": "Password@123"
}
```

### Payment
```bash
# Dev Bypass (Instant Premium)
POST /api/v1/payment/dev-bypass
Headers: Authorization: Bearer <token>

# Verify Payment
POST /api/v1/payment/verify
Body: {
  "razorpay_payment_id": "pay_xxx",
  "razorpay_order_id": "order_xxx",
  "razorpay_signature": "signature_xxx"
}
```

### User Profile
```bash
# Get User Profile
GET /api/v1/users/profile
Headers: Authorization: Bearer <token>

# Get User Subscription Status
GET /api/v1/users/subscription-status
Headers: Authorization: Bearer <token>
```

---

## ⚡ Troubleshooting

### Registration Gets 409 Error
**Problem:** Email already registered
**Solution:** Use a different email from the list above

### Payment Modal Doesn't Appear
**Solution 1:** Clear browser cache (Ctrl+Shift+Delete)
**Solution 2:** Hard refresh (Ctrl+Shift+R)
**Solution 3:** Open in private/incognito mode

### Razorpay Checkout Doesn't Open
**Check:** Backend is running on port 8000
**Check:** Frontend is running on port 5173
**Check:** Both services are connected

### Dev Bypass Not Working
**Check:** You're in development mode
**Check:** User is authenticated (has token)
**Check:** No network errors in console

---

## 📊 Environment Info

```
Frontend:  http://localhost:5173 (Vite dev server)
Backend:   http://localhost:8000 (Uvicorn)
Database:  SQLite (reborn_dev.db)
Payment:   Razorpay (Test mode)
Auth:      JWT tokens + Cookies
```

---

## 💡 Tips & Tricks

1. **Clear Database:** Delete `reborn_dev.db` to start fresh
2. **View API Docs:** Visit http://localhost:8000/docs for Swagger UI
3. **Check Logs:** Backend logs show all API calls and errors
4. **Dev Mode:** Use dev bypass for instant premium without payment
5. **Test Different Scenarios:** Use multiple emails to test concurrent users

---

## ✅ Success Indicators

| Feature | Success Sign |
|---------|--------------|
| **Registration** | No 409 error, redirect to login |
| **Login** | Token received, redirect to dashboard |
| **Dashboard** | User profile card visible |
| **Unlock Click** | Payment modal appears smoothly |
| **Payment** | Razorpay checkout opens inside modal |
| **Success** | Modal closes, premium features enabled |

---

## 📝 Notes

- All test cards are provided by Razorpay for testing
- No real money charged on test cards
- Use a new email for each test account
- If you get 409 error, use the next email in the list
- Premium status persists after logout/login
- Dev bypass only works in development mode

---

**Last Updated:** May 9, 2025  
**Status:** Ready for Testing ✅
